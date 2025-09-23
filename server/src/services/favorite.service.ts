import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';

/**
 * Add favorite (client favorites photographer)
 * photographerId here is Photographer.id (not user.id)
 */
export async function addFavorite(userId: string, photographerId: string) {
  try {
    const rec = await prisma.favorite.create({
      data: {
        userId,
        photographerId,
      },
    });
    return rec;
  } catch (err: any) {
    // handle unique constraint (already favorited)
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      // already exists — return existing record
      const existing = await prisma.favorite.findUnique({
        where: {
          userId_photographerId: {
            userId,
            photographerId,
          } as any,
        } as any,
      });
      return existing;
    }
    throw err;
  }
}

export async function removeFavorite(userId: string, photographerId: string) {
  // attempt delete by composite unique (userId + photographerId)
  const rec = await prisma.favorite.findFirst({
    where: { userId, photographerId },
  });
  if (!rec) return null;
  await prisma.favorite.delete({ where: { id: rec.id } });
  return rec;
}

export async function listFavorites(userId: string, page = 1, perPage = 12) {
  const skip = (page - 1) * perPage;
  const [items, total] = await Promise.all([
    prisma.favorite.findMany({
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
    prisma.favorite.count({ where: { userId } }),
  ]);

  // map to return photographer objects along with favoritedAt
  const mapped = items.map((f) => ({
    id: f.id,
    favoritedAt: f.createdAt,
    photographer: f.photographer,
  }));

  return { items: mapped, meta: { total, page, perPage, pages: Math.ceil(total / perPage) } };
}

export async function isFavorited(userId: string, photographerIds: string[]) {
  if (!userId) return {};
  const recs = await prisma.favorite.findMany({
    where: {
      userId,
      photographerId: { in: photographerIds },
    },
    select: { photographerId: true },
  });
  const set = new Set(recs.map((r) => r.photographerId));
  const out: Record<string, boolean> = {};
  for (const id of photographerIds) out[id] = set.has(id);
  return out;
}
