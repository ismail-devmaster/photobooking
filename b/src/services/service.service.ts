// src/services/service.service.ts
import { prisma } from '../config/prisma';
import { slugify } from '../utils/slug';

export async function createService(payload: { name: string; slug?: string; description?: string | null; categoryId?: string | null }) {
  const { name, slug, description, categoryId } = payload;
  const theSlug = (slug && slug.trim()) || slugify(name);

  // unique slug check
  const existing = await prisma.service.findUnique({ where: { slug: theSlug } });
  if (existing) throw new Error('Service slug already exists');

  // if categoryId passed, ensure exists
  if (categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!cat) throw new Error('Category not found');
  }

  return prisma.service.create({
    data: { name, slug: theSlug, description: description ?? null, categoryId: categoryId ?? null },
  });
}

export async function listServices(opts?: { page?: number; perPage?: number; categoryId?: string | null; search?: string | null }) {
  const page = Math.max(1, Number(opts?.page || 1));
  const perPage = Math.min(200, Number(opts?.perPage || 50));
  const skip = (page - 1) * perPage;
  const where: any = {};

  if (opts?.categoryId) where.categoryId = opts.categoryId;
  if (opts?.search) {
    where.OR = [
      { name: { contains: opts.search, mode: 'insensitive' } },
      { description: { contains: opts.search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.service.findMany({
      where,
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: { name: 'asc' },
      skip,
      take: perPage,
    }),
    prisma.service.count({ where }),
  ]);

  return { items, meta: { total, page, perPage, pages: Math.ceil(total / perPage) } };
}

export async function updateService(id: string, payload: { name?: string; slug?: string; description?: string | null; categoryId?: string | null }) {
  const data: any = {};
  if (payload.name) data.name = payload.name;
  if (payload.description !== undefined) data.description = payload.description ?? null;
  if (payload.slug) data.slug = payload.slug.trim();
  if (payload.categoryId !== undefined) data.categoryId = payload.categoryId ?? null;

  // slug uniqueness check
  if (data.slug) {
    const existing = await prisma.service.findFirst({ where: { slug: data.slug, NOT: { id } } });
    if (existing) throw new Error('Service slug already exists');
  }

  // if categoryId provided and non-null, validate it exists
  if (data.categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!cat) throw new Error('Category not found');
  }

  return prisma.service.update({ where: { id }, data });
}

export async function deleteService(id: string) {
  return prisma.service.delete({ where: { id } });
}
