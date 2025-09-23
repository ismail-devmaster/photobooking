"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOverviewStats = getOverviewStats;
exports.getBookingsTimeSeries = getBookingsTimeSeries;
exports.getBookingsByState = getBookingsByState;
exports.getRevenueByMonth = getRevenueByMonth;
exports.getTopPhotographers = getTopPhotographers;
exports.getRecentUsers = getRecentUsers;
// src/services/adminStats.service.ts
const prisma_1 = require("../config/prisma");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const cache = new Map();
function getCached(key, ttlSeconds, loader) {
    const now = Date.now();
    const existing = cache.get(key);
    if (existing && existing.expiresAt > now) {
        return Promise.resolve(existing.value);
    }
    return loader().then((val) => {
        cache.set(key, { value: val, expiresAt: now + ttlSeconds * 1000 });
        // auto-clean (best-effort)
        setTimeout(() => {
            const e = cache.get(key);
            if (e && e.expiresAt <= Date.now())
                cache.delete(key);
        }, ttlSeconds * 1000 + 1000);
        return val;
    });
}
/**
 * Overview stats: counts and sums
 */
async function getOverviewStats(opts) {
    const loader = async () => {
        const now = new Date();
        const last7 = (0, date_fns_1.subDays)(now, 7);
        // basic counts
        const [totalUsers, totalPhotographers, totalBookings, bookingsLast7, totalReviews] = await Promise.all([
            prisma_1.prisma.user.count(),
            prisma_1.prisma.photographer.count(),
            prisma_1.prisma.booking.count(),
            prisma_1.prisma.booking.count({ where: { createdAt: { gte: last7 } } }),
            prisma_1.prisma.review.count(),
        ]);
        // pending reviews
        const pendingReviews = await prisma_1.prisma.review.count({ where: { status: 'PENDING' } });
        // payments: total received (sum of amountCents) for CAPTURED/SUCCEEDED
        const paidAgg = await prisma_1.prisma.payment.aggregate({
            _sum: { amountCents: true },
            where: { status: { in: [client_1.PaymentStatus.CAPTURED, client_1.PaymentStatus.SUCCEEDED] } },
        });
        const totalRevenueCents = paidAgg._sum.amountCents ?? 0;
        // bookings by state (group)
        const byStateRaw = await prisma_1.prisma.booking.groupBy({
            by: ['state'],
            _count: { _all: true },
        });
        const bookingsByState = {};
        for (const r of byStateRaw) {
            bookingsByState[r.state] = r._count._all;
        }
        // recent 5 users
        const recentUsers = await prisma_1.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { id: true, email: true, name: true, createdAt: true },
        });
        // top photographers by rating (limit 5)
        const topPhotographers = await prisma_1.prisma.photographer.findMany({
            orderBy: { ratingAvg: 'desc' },
            take: 5,
            include: { user: { select: { id: true, name: true, email: true } } },
        });
        return {
            totals: {
                users: totalUsers,
                photographers: totalPhotographers,
                bookings: totalBookings,
                bookingsLast7,
                reviews: totalReviews,
                pendingReviews,
                revenueCents: totalRevenueCents,
            },
            bookingsByState,
            recentUsers,
            topPhotographers,
            generatedAt: new Date().toISOString(),
        };
    };
    if (opts?.cacheSeconds && opts.cacheSeconds > 0) {
        return getCached('admin:overview', opts.cacheSeconds, loader);
    }
    return loader();
}
/**
 * Bookings time-series for last N days (default 30).
 * Returns array of { date: 'YYYY-MM-DD', count }
 */
async function getBookingsTimeSeries(days = 30, opts) {
    const loader = async () => {
        const today = (0, date_fns_1.startOfDay)(new Date());
        const start = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(today, days - 1));
        // fetch bookings in range (only createdAt needed)
        const rows = await prisma_1.prisma.booking.findMany({
            where: { createdAt: { gte: start } },
            select: { createdAt: true },
            orderBy: { createdAt: 'asc' },
        });
        // initialize buckets
        const buckets = {};
        for (let i = 0; i < days; i++) {
            const d = (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(today, days - 1 - i));
            const key = (0, date_fns_1.format)(d, 'yyyy-MM-dd');
            buckets[key] = 0;
        }
        for (const r of rows) {
            const key = (0, date_fns_1.format)((0, date_fns_1.startOfDay)(r.createdAt), 'yyyy-MM-dd');
            if (buckets[key] !== undefined)
                buckets[key] += 1;
        }
        const series = Object.keys(buckets).map((date) => ({ date, count: buckets[date] }));
        return { series, generatedAt: new Date().toISOString() };
    };
    if (opts?.cacheSeconds && opts.cacheSeconds > 0)
        return getCached(`admin:bookings:ts:${days}`, opts.cacheSeconds, loader);
    return loader();
}
/**
 * Bookings counts grouped by state (all time or optionally since date)
 */
async function getBookingsByState(opts) {
    const where = {};
    if (opts?.since)
        where.createdAt = { gte: opts.since };
    const raw = await prisma_1.prisma.booking.groupBy({
        by: ['state'],
        where,
        _count: { _all: true },
    });
    const result = {};
    for (const r of raw)
        result[r.state] = r._count._all;
    return result;
}
/**
 * Revenue by month for last N months (default 6)
 */
async function getRevenueByMonth(months = 6, opts) {
    const loader = async () => {
        const now = new Date();
        const result = [];
        for (let i = months - 1; i >= 0; i--) {
            const s = (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(now, i));
            const e = (0, date_fns_1.endOfMonth)(s);
            const agg = await prisma_1.prisma.payment.aggregate({
                _sum: { amountCents: true },
                where: {
                    createdAt: { gte: s, lte: e },
                    status: { in: [client_1.PaymentStatus.CAPTURED, client_1.PaymentStatus.SUCCEEDED] },
                },
            });
            result.push({ month: (0, date_fns_1.format)(s, 'yyyy-MM'), revenueCents: agg._sum.amountCents ?? 0 });
        }
        return { result, generatedAt: new Date().toISOString() };
    };
    if (opts?.cacheSeconds && opts.cacheSeconds > 0)
        return getCached(`admin:revenue:months:${months}`, opts.cacheSeconds, loader);
    return loader();
}
/**
 * Top photographers by rating or booking count
 */
async function getTopPhotographers(limit = 10) {
    const list = await prisma_1.prisma.photographer.findMany({
        orderBy: [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }],
        take: limit,
        include: {
            user: { select: { id: true, name: true, email: true } },
        },
    });
    return list.map((p) => ({
        id: p.id,
        userId: p.userId,
        name: p.user?.name ?? null,
        email: p.user?.email ?? null,
        ratingAvg: p.ratingAvg,
        ratingCount: p.ratingCount,
        priceBaseline: p.priceBaseline,
    }));
}
/**
 * Recent users
 */
async function getRecentUsers(limit = 10) {
    return prisma_1.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
}
