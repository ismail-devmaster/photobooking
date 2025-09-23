"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = getUserProfile;
exports.updateUserProfile = updateUserProfile;
exports.listPhotographers = listPhotographers;
exports.getPhotographerById = getPhotographerById;
// src/services/profile.service.ts
const prisma_1 = require("../config/prisma");
async function getUserProfile(userId) {
    return prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            locale: true,
            phone: true,
            emailVerified: true,
            state: { select: { id: true, code: true, name: true } },
            photographer: {
                select: {
                    id: true,
                    bio: true,
                    priceBaseline: true,
                    verified: true,
                    tags: true,
                    state: { select: { id: true, code: true, name: true } },
                    services: { select: { id: true, slug: true, name: true } },
                    portfolios: { select: { id: true, title: true } },
                },
            },
        },
    });
}
async function updateUserProfile(userId, payload) {
    // payload may contain: name, phone, locale, stateId, photographer data if role=PHOTOGRAPHER
    const { name, phone, locale, stateId, photographer } = payload;
    // update user base fields
    const user = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: {
            name: name ?? undefined,
            phone: phone ?? undefined,
            locale: locale ?? undefined,
            stateId: stateId ?? undefined,
        },
    });
    // if photographer payload present, update or create photographer profile
    if (photographer) {
        const existing = await prisma_1.prisma.photographer.findUnique({ where: { userId } });
        if (existing) {
            await prisma_1.prisma.photographer.update({
                where: { userId },
                data: {
                    bio: photographer.bio ?? undefined,
                    priceBaseline: photographer.priceBaseline ?? undefined,
                    tags: photographer.tags ?? undefined,
                    stateId: photographer.stateId ?? undefined,
                    // services: array of service ids to set
                    ...(photographer.serviceIds ? { services: { set: photographer.serviceIds.map((id) => ({ id })) } } : {}),
                },
            });
        }
        else {
            // create new photographer profile
            await prisma_1.prisma.photographer.create({
                data: {
                    userId,
                    bio: photographer.bio ?? undefined,
                    priceBaseline: photographer.priceBaseline ?? 0,
                    tags: photographer.tags ?? [],
                    stateId: photographer.stateId ?? undefined,
                    services: photographer.serviceIds ? { connect: photographer.serviceIds.map((id) => ({ id })) } : {},
                },
            });
        }
    }
    return getUserProfile(userId);
}
/**
 * listPhotographers supports advanced filters.
 * If currentUserId provided, we add isFavorited flag to each item.
 */
async function listPhotographers(opts = {}) {
    const { stateId, serviceId, minPrice, maxPrice, q, tags, sort = 'rating_desc', page = 1, perPage = 12, currentUserId, } = opts;
    const where = { verified: true };
    if (stateId)
        where.stateId = stateId;
    if (serviceId)
        where.services = { some: { id: serviceId } };
    if (typeof minPrice === 'number')
        where.priceBaseline = { ...(where.priceBaseline || {}), gte: minPrice };
    if (typeof maxPrice === 'number')
        where.priceBaseline = { ...(where.priceBaseline || {}), lte: maxPrice };
    if (q) {
        const qLower = q;
        where.AND = [
            ...(where.AND || []),
            {
                OR: [
                    { user: { name: { contains: qLower, mode: 'insensitive' } } },
                    { tags: { has: qLower } },
                    { services: { some: { name: { contains: qLower, mode: 'insensitive' } } } },
                ],
            },
        ];
    }
    if (Array.isArray(tags) && tags.length > 0) {
        where.tags = { hasSome: tags };
    }
    const skip = (Math.max(1, Number(page)) - 1) * Number(perPage);
    const take = Math.min(100, Number(perPage) || 12);
    // sort mapping
    const orderBy = [];
    if (sort === 'rating_desc')
        orderBy.push({ ratingAvg: 'desc' });
    else if (sort === 'price_asc')
        orderBy.push({ priceBaseline: 'asc' });
    else if (sort === 'price_desc')
        orderBy.push({ priceBaseline: 'desc' });
    else if (sort === 'newest')
        orderBy.push({ createdAt: 'desc' });
    const [items, total] = await Promise.all([
        prisma_1.prisma.photographer.findMany({
            where,
            include: {
                user: { select: { id: true, name: true } },
                services: { select: { id: true, name: true, slug: true } },
                state: { select: { id: true, name: true, code: true } },
                portfolios: { take: 1, select: { id: true, title: true, images: { take: 4 } } },
            },
            orderBy: orderBy.length ? orderBy : [{ ratingAvg: 'desc' }],
            skip,
            take,
        }),
        prisma_1.prisma.photographer.count({ where }),
    ]);
    // annotate isFavorited if currentUserId provided
    let favMap = {};
    if (currentUserId && items.length > 0) {
        const ids = items.map((p) => p.id);
        const favs = await prisma_1.prisma.favorite.findMany({
            where: { userId: currentUserId, photographerId: { in: ids } },
            select: { photographerId: true },
        });
        favMap = Object.fromEntries(favs.map((f) => [f.photographerId, true]));
    }
    const mapped = items.map((p) => ({
        id: p.id,
        user: p.user,
        bio: p.bio,
        priceBaseline: p.priceBaseline,
        ratingAvg: p.ratingAvg,
        ratingCount: p.ratingCount,
        services: p.services,
        state: p.state,
        portfolios: p.portfolios,
        tags: p.tags,
        verified: p.verified,
        isFavorited: !!favMap[p.id],
    }));
    return {
        items: mapped,
        meta: { total, page: Number(page), perPage: take, pages: Math.ceil(total / take) },
    };
}
async function getPhotographerById(photographerId) {
    return prisma_1.prisma.photographer.findUnique({
        where: { id: photographerId },
        include: {
            user: { select: { id: true, name: true, email: true } },
            services: { select: { id: true, name: true, slug: true } },
            state: { select: { id: true, name: true, code: true } },
            portfolios: { select: { id: true, title: true } },
        },
    });
}
