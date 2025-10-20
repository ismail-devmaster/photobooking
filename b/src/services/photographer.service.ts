// src/services/photographer.service.ts
import { prisma } from '../config/prisma';

export type PhotographerListOpts = {
  stateId?: string | undefined;
  serviceId?: string | undefined;
  minPrice?: number | undefined; // cents
  maxPrice?: number | undefined; // cents
  q?: string | undefined;
  tags?: string[] | undefined;
  sort?: 'rating_desc' | 'price_asc' | 'price_desc' | 'newest' | undefined;
  page?: number;
  perPage?: number;
};

/**
 * List photographers with advanced filtering and pagination.
 * If currentUserId provided, we add isFavorited flag to each item.
 */
export async function listPhotographers(opts: PhotographerListOpts & { currentUserId?: string } = {}) {
  const {
    stateId,
    serviceId,
    minPrice,
    maxPrice,
    q,
    tags,
    sort = 'rating_desc',
    page = 1,
    perPage = 12,
    currentUserId,
  } = opts;

  const where: { verified: boolean; [key: string]: any } = { verified: true };

  if (stateId) where.stateId = stateId;
  if (serviceId) where.services = { some: { id: serviceId } };
  if (typeof minPrice === 'number') where.priceBaseline = { ...(where.priceBaseline || {}), gte: minPrice };
  if (typeof maxPrice === 'number') where.priceBaseline = { ...(where.priceBaseline || {}), lte: maxPrice };

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
  const orderBy: { [key: string]: 'asc' | 'desc' }[] = [];
  if (sort === 'rating_desc') orderBy.push({ ratingAvg: 'desc' });
  else if (sort === 'price_asc') orderBy.push({ priceBaseline: 'asc' });
  else if (sort === 'price_desc') orderBy.push({ priceBaseline: 'desc' });
  else if (sort === 'newest') orderBy.push({ createdAt: 'desc' });

  const [items, total] = await Promise.all([
    prisma.photographer.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, phone: true } },
        services: { select: { id: true, name: true, slug: true } },
        state: { select: { id: true, name: true, code: true } },
        portfolios: { take: 1, select: { id: true, title: true, images: { take: 4 } } },
      },
      orderBy: orderBy.length ? orderBy : [{ ratingAvg: 'desc' }],
      skip,
      take,
    }),
    prisma.photographer.count({ where }),
  ]);

  // annotate isFavorited if currentUserId provided
  let favMap: Record<string, boolean> = {};
  if (currentUserId && items.length > 0) {
    const ids = items.map((p) => p.id);
    const favs = await prisma.favorite.findMany({
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

/**
 * Get a single photographer by ID with full details
 */
export async function getPhotographerById(photographerId: string) {
  return prisma.photographer.findUnique({
    where: { id: photographerId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      services: { select: { id: true, name: true, slug: true } },
      state: { select: { id: true, name: true, code: true } },
      portfolios: { 
        select: { 
          id: true, 
          title: true, 
          description: true,
          images: { 
            select: { 
              id: true, 
              url: true, 
              meta: true 
            } 
          } 
        } 
      },
      packages: {
        select: {
          id: true,
          title: true,
          description: true,
          priceCents: true
        }
      },
      galleryImages: {
        select: {
          id: true,
          url: true,
          meta: true
        }
      },
      reviews: {
        select: {
          id: true,
          rating: true,
          text: true,
          createdAt: true,
          reviewer: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    },
  });
}

/**
 * Get photographer statistics (for photographer dashboard)
 */
export async function getPhotographerStats(photographerId: string) {
  const [
    totalBookings,
    completedBookings,
    totalRevenue,
    averageRating,
    totalReviews,
    upcomingBookings
  ] = await Promise.all([
    prisma.booking.count({
      where: { photographerId }
    }),
    prisma.booking.count({
      where: { 
        photographerId,
        state: 'completed'
      }
    }),
    prisma.booking.aggregate({
      where: { 
        photographerId,
        state: 'completed'
      },
      _sum: { priceCents: true }
    }),
    prisma.photographer.findUnique({
      where: { id: photographerId },
      select: { ratingAvg: true, ratingCount: true }
    }),
    prisma.review.count({
      where: { photographerId }
    }),
    prisma.booking.count({
      where: { 
        photographerId,
        state: { in: ['confirmed', 'in_progress'] }
      }
    })
  ]);

  return {
    totalBookings,
    completedBookings,
    totalRevenue: totalRevenue._sum.priceCents || 0,
    averageRating: averageRating?.ratingAvg || 0,
    totalReviews,
    upcomingBookings
  };
}
