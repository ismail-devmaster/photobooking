"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCategory = createCategory;
exports.listCategories = listCategories;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
// src/services/category.service.ts
const prisma_1 = require("../config/prisma");
const slug_1 = require("../utils/slug");
async function createCategory({ name, slug, description }) {
    const theSlug = slug?.trim() || (0, slug_1.slugify)(name);
    // check unique
    const existing = await prisma_1.prisma.category.findUnique({ where: { slug: theSlug } });
    if (existing)
        throw new Error('Category slug already exists');
    return prisma_1.prisma.category.create({
        data: { name, slug: theSlug, description: description ?? null },
    });
}
async function listCategories(opts) {
    const page = Math.max(1, Number(opts?.page || 1));
    const perPage = Math.min(200, Number(opts?.perPage || 50));
    const skip = (page - 1) * perPage;
    const [items, total] = await Promise.all([
        prisma_1.prisma.category.findMany({ orderBy: { createdAt: 'desc' }, skip, take: perPage }),
        prisma_1.prisma.category.count(),
    ]);
    return { items, meta: { total, page, perPage, pages: Math.ceil(total / perPage) } };
}
async function updateCategory(id, payload) {
    const data = {};
    if (payload.name)
        data.name = payload.name;
    if (payload.slug)
        data.slug = payload.slug;
    if (payload.description !== undefined)
        data.description = payload.description ?? null;
    // If slug provided, ensure uniqueness
    if (data.slug) {
        const existing = await prisma_1.prisma.category.findFirst({ where: { slug: data.slug, NOT: { id } } });
        if (existing)
            throw new Error('Category slug already exists');
    }
    return prisma_1.prisma.category.update({ where: { id }, data });
}
async function deleteCategory(id) {
    // prevent deletion if services still linked (or optionally set null)
    const linked = await prisma_1.prisma.service.findFirst({ where: { categoryId: id } });
    if (linked)
        throw new Error('Category cannot be deleted: services are linked to it');
    return prisma_1.prisma.category.delete({ where: { id } });
}
