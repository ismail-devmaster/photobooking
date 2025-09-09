// src/services/adminStats.service.ts
import { prisma } from '../config/prisma';
import { BookingState, PaymentStatus } from '@prisma/client';
import { subDays, startOfDay, endOfDay, subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

/**
 * Simple in-memory cache helper (very small TTL cache).
 * Replace with Redis for production if needed.
 */
type CacheEntry = { expiresAt: number; value: any };
const cache = new Map<string, CacheEntry>();
function getCached<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const existing = cache.get(key);
  if (existing && existing.expiresAt > now) {
    return Promise.resolve(existing.value as T);
  }
  return loader().then((val) => {
    cache.set(key, { value: val, expiresAt: now + ttlSeconds * 1000 });
    // auto-clean (best-effort)
    setTimeout(() => {
      const e = cache.get(key);
      if (e && e.expiresAt <= Date.now()) cache.delete(key);
    }, ttlSeconds * 1000 + 1000);
    return val;
  });
}

/**
 * Overview stats: counts and sums
 */
export async function getOverviewStats(opts?: { cacheSeconds?: number }) {
  const loader = async () => {
    const now = new Date();
    const last7 = subDays(now, 7);

    // basic counts
    const [totalUsers, totalPhotographers, totalBookings, bookingsLast7, totalReviews] = await Promise.all([
      prisma.user.count(),
      prisma.photographer.count(),
      prisma.booking.count(),
      prisma.booking.count({ where: { createdAt: { gte: last7 } } }),
      prisma.review.count(),
    ]);

    // pending reviews
    const pendingReviews = await prisma.review.count({ where: { status: 'PENDING' } });

    // payments: total received (sum of amountCents) for CAPTURED/SUCCEEDED
    const paidAgg = await prisma.payment.aggregate({
      _sum: { amountCents: true },
      where: { status: { in: [PaymentStatus.CAPTURED, PaymentStatus.SUCCEEDED] } },
    });

    const totalRevenueCents = paidAgg._sum.amountCents ?? 0;

    // bookings by state (group)
    const byStateRaw = await prisma.booking.groupBy({
      by: ['state'],
      _count: { _all: true },
    });
    const bookingsByState: Record<string, number> = {};
    for (const r of byStateRaw) {
      bookingsByState[r.state] = r._count._all;
    }

    // recent 5 users
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, email: true, name: true, createdAt: true },
    });

    // top photographers by rating (limit 5)
    const topPhotographers = await prisma.photographer.findMany({
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
export async function getBookingsTimeSeries(days = 30, opts?: { cacheSeconds?: number }) {
  const loader = async () => {
    const today = startOfDay(new Date());
    const start = startOfDay(subDays(today, days - 1));

    // fetch bookings in range (only createdAt needed)
    const rows = await prisma.booking.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // initialize buckets
    const buckets: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = startOfDay(subDays(today, days - 1 - i));
      const key = format(d, 'yyyy-MM-dd');
      buckets[key] = 0;
    }

    for (const r of rows) {
      const key = format(startOfDay(r.createdAt), 'yyyy-MM-dd');
      if (buckets[key] !== undefined) buckets[key] += 1;
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
export async function getBookingsByState(opts?: { since?: Date }) {
  const where: any = {};
  if (opts?.since) where.createdAt = { gte: opts.since };

  const raw = await prisma.booking.groupBy({
    by: ['state'],
    where,
    _count: { _all: true },
  });

  const result: Record<string, number> = {};
  for (const r of raw) result[r.state] = r._count._all;
  return result;
}

/**
 * Revenue by month for last N months (default 6)
 */
export async function getRevenueByMonth(months = 6, opts?: { cacheSeconds?: number }) {
  const loader = async () => {
    const now = new Date();
    const result: Array<{ month: string; revenueCents: number }> = [];

    for (let i = months - 1; i >= 0; i--) {
      const s = startOfMonth(subMonths(now, i));
      const e = endOfMonth(s);
      const agg = await prisma.payment.aggregate({
        _sum: { amountCents: true },
        where: {
          createdAt: { gte: s, lte: e },
          status: { in: [PaymentStatus.CAPTURED, PaymentStatus.SUCCEEDED] },
        },
      });
      result.push({ month: format(s, 'yyyy-MM'), revenueCents: agg._sum.amountCents ?? 0 });
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
export async function getTopPhotographers(limit = 10) {
  const list = await prisma.photographer.findMany({
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
export async function getRecentUsers(limit = 10) {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
}
