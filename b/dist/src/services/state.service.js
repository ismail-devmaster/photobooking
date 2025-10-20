"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listStates = listStates;
exports.listAllStates = listAllStates;
// src/services/state.service.ts
const prisma_1 = require("../config/prisma");
async function listStates(opts) {
    const page = Math.max(1, Number(opts?.page || 1));
    const perPage = Math.min(200, Number(opts?.perPage || 100));
    const skip = (page - 1) * perPage;
    const where = {};
    if (opts?.search) {
        where.OR = [
            { name: { contains: opts.search, mode: 'insensitive' } },
            { code: { contains: opts.search, mode: 'insensitive' } },
        ];
    }
    const [items, total] = await Promise.all([
        prisma_1.prisma.state.findMany({
            where,
            orderBy: { name: 'asc' },
            skip,
            take: perPage,
            select: { id: true, name: true, code: true },
        }),
        prisma_1.prisma.state.count({ where }),
    ]);
    return { items, meta: { total, page, perPage, pages: Math.ceil(total / perPage) } };
}
async function listAllStates() {
    return prisma_1.prisma.state.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, code: true } });
}
