"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.setUserDisabled = setUserDisabled;
// src/services/adminUser.service.ts
const prisma_1 = require("../config/prisma");
/**
 * List users with pagination and optional filter
 */
async function listUsers(opts) {
    const page = Math.max(1, Number(opts?.page || 1));
    const perPage = Math.min(200, Number(opts?.perPage || 50));
    const skip = (page - 1) * perPage;
    const where = {};
    if (opts?.role)
        where.role = opts.role;
    if (opts?.search) {
        where.OR = [
            { email: { contains: opts.search, mode: 'insensitive' } },
            { name: { contains: opts.search, mode: 'insensitive' } },
        ];
    }
    const [items, total] = await Promise.all([
        prisma_1.prisma.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: perPage,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                emailVerified: true,
                emailVerifiedAt: true,
                disabled: true,
                locale: true,
                createdAt: true,
                updatedAt: true,
            },
        }),
        prisma_1.prisma.user.count({ where }),
    ]);
    return {
        items,
        meta: { total, page, perPage, pages: Math.ceil(total / perPage) },
    };
}
/**
 * Set disabled status for a user
 */
async function setUserDisabled(adminId, userId, disabled) {
    // optional: prevent admin from disabling themselves
    if (adminId === userId) {
        throw new Error('Admins cannot disable their own account');
    }
    // update
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new Error('User not found');
    const updated = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { disabled },
        select: {
            id: true,
            email: true,
            disabled: true,
            role: true,
            updatedAt: true,
        },
    });
    return updated;
}
