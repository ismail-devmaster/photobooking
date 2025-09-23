"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createService = createService;
exports.listServices = listServices;
exports.updateService = updateService;
exports.deleteService = deleteService;
// src/services/service.service.ts
const prisma_1 = require("../config/prisma");
const slug_1 = require("../utils/slug");
async function createService(payload) {
    const { name, slug, description, categoryId } = payload;
    const theSlug = (slug && slug.trim()) || (0, slug_1.slugify)(name);
    // unique slug check
    const existing = await prisma_1.prisma.service.findUnique({ where: { slug: theSlug } });
    if (existing)
        throw new Error('Service slug already exists');
    // if categoryId passed, ensure exists
    if (categoryId) {
        const cat = await prisma_1.prisma.category.findUnique({ where: { id: categoryId } });
        if (!cat)
            throw new Error('Category not found');
    }
    return prisma_1.prisma.service.create({
        data: { name, slug: theSlug, description: description ?? null, categoryId: categoryId ?? null },
    });
}
async function listServices(opts) {
    const page = Math.max(1, Number(opts?.page || 1));
    const perPage = Math.min(200, Number(opts?.perPage || 50));
    const skip = (page - 1) * perPage;
    const where = {};
    if (opts?.categoryId)
        where.categoryId = opts.categoryId;
    if (opts?.search) {
        where.OR = [
            { name: { contains: opts.search, mode: 'insensitive' } },
            { description: { contains: opts.search, mode: 'insensitive' } },
        ];
    }
    const [items, total] = await Promise.all([
        prisma_1.prisma.service.findMany({
            where,
            include: { category: { select: { id: true, name: true, slug: true } } },
            orderBy: { name: 'asc' },
            skip,
            take: perPage,
        }),
        prisma_1.prisma.service.count({ where }),
    ]);
    return { items, meta: { total, page, perPage, pages: Math.ceil(total / perPage) } };
}
async function updateService(id, payload) {
    const data = {};
    if (payload.name)
        data.name = payload.name;
    if (payload.description !== undefined)
        data.description = payload.description ?? null;
    if (payload.slug)
        data.slug = payload.slug.trim();
    if (payload.categoryId !== undefined)
        data.categoryId = payload.categoryId ?? null;
    // slug uniqueness check
    if (data.slug) {
        const existing = await prisma_1.prisma.service.findFirst({ where: { slug: data.slug, NOT: { id } } });
        if (existing)
            throw new Error('Service slug already exists');
    }
    // if categoryId provided and non-null, validate it exists
    if (data.categoryId) {
        const cat = await prisma_1.prisma.category.findUnique({ where: { id: data.categoryId } });
        if (!cat)
            throw new Error('Category not found');
    }
    return prisma_1.prisma.service.update({ where: { id }, data });
}
async function deleteService(id) {
    return prisma_1.prisma.service.delete({ where: { id } });
}
