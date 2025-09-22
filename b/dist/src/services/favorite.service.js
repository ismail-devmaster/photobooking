"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFavorite = addFavorite;
exports.removeFavorite = removeFavorite;
exports.listFavorites = listFavorites;
exports.isFavorited = isFavorited;
const prisma_1 = require("../config/prisma");
const client_1 = require("@prisma/client");
/**
 * Add favorite (client favorites photographer)
 * photographerId here is Photographer.id (not user.id)
 */
async function addFavorite(userId, photographerId) {
    try {
        const rec = await prisma_1.prisma.favorite.create({
            data: {
                userId,
                photographerId,
            },
        });
        return rec;
    }
    catch (err) {
        // handle unique constraint (already favorited)
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            // already exists — return existing record
            const existing = await prisma_1.prisma.favorite.findUnique({
                where: {
                    userId_photographerId: {
                        userId,
                        photographerId,
                    },
                },
            });
            return existing;
        }
        throw err;
    }
}
async function removeFavorite(userId, photographerId) {
    // attempt delete by composite unique (userId + photographerId)
    const rec = await prisma_1.prisma.favorite.findFirst({
        where: { userId, photographerId },
    });
    if (!rec)
        return null;
    await prisma_1.prisma.favorite.delete({ where: { id: rec.id } });
    return rec;
}
async function listFavorites(userId, page = 1, perPage = 12) {
    const skip = (page - 1) * perPage;
    const [items, total] = await Promise.all([
        prisma_1.prisma.favorite.findMany({
            where: { userId },
            include: {
                photographer: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                        services: true,
                        state: true,
                        portfolios: { take: 4, include: { images: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: perPage,
        }),
        prisma_1.prisma.favorite.count({ where: { userId } }),
    ]);
    // map to return photographer objects along with favoritedAt
    const mapped = items.map((f) => ({
        id: f.id,
        favoritedAt: f.createdAt,
        photographer: f.photographer,
    }));
    return { items: mapped, meta: { total, page, perPage, pages: Math.ceil(total / perPage) } };
}
async function isFavorited(userId, photographerIds) {
    if (!userId)
        return {};
    const recs = await prisma_1.prisma.favorite.findMany({
        where: {
            userId,
            photographerId: { in: photographerIds },
        },
        select: { photographerId: true },
    });
    const set = new Set(recs.map((r) => r.photographerId));
    const out = {};
    for (const id of photographerIds)
        out[id] = set.has(id);
    return out;
}
