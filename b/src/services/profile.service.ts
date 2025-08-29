// src/services/profile.service.ts
import { prisma } from '../config/prisma';

export async function getUserProfile(userId: string) {
  return prisma.user.findUnique({
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

export async function updateUserProfile(userId: string, payload: any) {
  // payload may contain: name, phone, locale, stateId, photographer data if role=PHOTOGRAPHER
  const { name, phone, locale, stateId, photographer } = payload;

  // update user base fields
  const user = await prisma.user.update({
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
    const existing = await prisma.photographer.findUnique({ where: { userId } });
    if (existing) {
      await prisma.photographer.update({
        where: { userId },
        data: {
          bio: photographer.bio ?? undefined,
          priceBaseline: photographer.priceBaseline ?? undefined,
          tags: photographer.tags ?? undefined,
          stateId: photographer.stateId ?? undefined,
          // services: array of service ids to set
          ...(photographer.serviceIds ? { services: { set: photographer.serviceIds.map((id: string) => ({ id })) } } : {}),
        },
      });
    } else {
      // create new photographer profile
      await prisma.photographer.create({
        data: {
          userId,
          bio: photographer.bio ?? undefined,
          priceBaseline: photographer.priceBaseline ?? 0,
          tags: photographer.tags ?? [],
          stateId: photographer.stateId ?? undefined,
          services: photographer.serviceIds ? { connect: photographer.serviceIds.map((id: string) => ({ id })) } : {},
        },
      });
    }
  }

  return getUserProfile(userId);
}

/**
 * Public listing of photographers (basic) - used later for filtering
 */
export async function listPhotographers({ stateId, serviceId, page = 1, perPage = 12 }: any) {
  const where: any = {};

  if (stateId) {
    where.stateId = stateId;
  }

  if (serviceId) {
    where.services = { some: { id: serviceId } };
  }

  // only show verified photographers by default
  where.verified = true;

  const skip = (Number(page) - 1) * Number(perPage);
  const take = Number(perPage);

  const [items, total] = await Promise.all([
    prisma.photographer.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        services: { select: { id: true, name: true, slug: true } },
        state: { select: { id: true, name: true, code: true } },
      },
      skip,
      take,
      orderBy: { ratingAvg: 'desc' },
    }),
    prisma.photographer.count({ where }),
  ]);

  return {
    items,
    meta: {
      total,
      page: Number(page),
      perPage: Number(perPage),
      pages: Math.ceil(total / take),
    },
  };
}

export async function getPhotographerById(photographerId: string) {
  return prisma.photographer.findUnique({
    where: { id: photographerId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      services: { select: { id: true, name: true, slug: true } },
      state: { select: { id: true, name: true, code: true } },
      portfolios: { select: { id: true, title: true } },
    },
  });
}
