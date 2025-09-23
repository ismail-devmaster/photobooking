// src/services/category.service.ts
import { prisma } from '../config/prisma';
import { slugify } from '../utils/slug';

export async function createCategory({ name, slug, description }: { name: string; slug?: string; description?: string | null }) {
  const theSlug = slug?.trim() || slugify(name);
  // check unique
  const existing = await prisma.category.findUnique({ where: { slug: theSlug } });
  if (existing) throw new Error('Category slug already exists');

  return prisma.category.create({
    data: { name, slug: theSlug, description: description ?? null },
  });
}

export async function listCategories(opts?: { page?: number; perPage?: number }) {
  const page = Math.max(1, Number(opts?.page || 1));
  const perPage = Math.min(200, Number(opts?.perPage || 50));
  const skip = (page - 1) * perPage;

  const [items, total] = await Promise.all([
    prisma.category.findMany({ orderBy: { createdAt: 'desc' }, skip, take: perPage }),
    prisma.category.count(),
  ]);

  return { items, meta: { total, page, perPage, pages: Math.ceil(total / perPage) } };
}

export async function updateCategory(id: string, payload: { name?: string; slug?: string; description?: string | null }) {
  const data: any = {};
  if (payload.name) data.name = payload.name;
  if (payload.slug) data.slug = payload.slug;
  if (payload.description !== undefined) data.description = payload.description ?? null;

  // If slug provided, ensure uniqueness
  if (data.slug) {
    const existing = await prisma.category.findFirst({ where: { slug: data.slug, NOT: { id } } });
    if (existing) throw new Error('Category slug already exists');
  }

  return prisma.category.update({ where: { id }, data });
}

export async function deleteCategory(id: string) {
  // prevent deletion if services still linked (or optionally set null)
  const linked = await prisma.service.findFirst({ where: { categoryId: id } });
  if (linked) throw new Error('Category cannot be deleted: services are linked to it');
  return prisma.category.delete({ where: { id } });
}
