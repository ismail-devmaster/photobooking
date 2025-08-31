// src/services/booking.service.ts
import { prisma } from '../config/prisma';
import { BookingState } from '@prisma/client';

/**
 * Create booking:
 * - validates package belongs to photographer
 * - uses package.priceCents unless priceCents override provided
 * - creates booking + bookingStateHistory + notification in a transaction
 */
export async function createBooking(clientId: string, payload: {
  photographerId: string;
  packageId?: string | null;
  startAt: Date;
  endAt: Date;
  location?: { address: string; lat: number; lon: number } | null;
  notes?: string | null;
  priceCents?: number | null;
}) {
  // fetch package & photographer
  const [photog, pkg] = await Promise.all([
    prisma.photographer.findUnique({ where: { id: payload.photographerId } }),
    payload.packageId ? prisma.package.findUnique({ where: { id: payload.packageId } }) : Promise.resolve(null),
  ]);

  if (!photog) throw new Error('Photographer not found');
  if (pkg && pkg.photographerId !== photog.id) throw new Error('Package does not belong to photographer');

  const price = typeof payload.priceCents === 'number' ? payload.priceCents : (pkg ? pkg.priceCents : 0);

  const bookingData = {
    clientId,
    photographerId: photog.id,
    startAt: payload.startAt,
    endAt: payload.endAt,
    location: payload.location ? payload.location as any : { address: photog.userId ? '' : '' }, // location required by schema — we pass provided or empty
    priceCents: price,
    state: BookingState.requested,
  };

  // transaction: create booking, stateHistory, notification
  const result = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.create({
      data: {
        clientId: bookingData.clientId,
        photographerId: bookingData.photographerId,
        startAt: bookingData.startAt,
        endAt: bookingData.endAt,
        location: bookingData.location as any,
        priceCents: bookingData.priceCents,
        state: bookingData.state,
        stateHistory: {
          create: {
            fromState: BookingState.draft,
            toState: BookingState.requested,
            reason: 'Client created request',
            byUserId: clientId,
          },
        },
      },
    });

    // create notification for photographer (in-app)
    // find client's name
    const client = await tx.user.findUnique({ where: { id: clientId }, select: { name: true } });

    await tx.notification.create({
      data: {
        userId: photog.userId, // notify the user account of the photographer
        type: 'BOOKING_REQUESTED',
        payload: { bookingId: booking.id, clientName: client?.name ?? null },
      },
    });

    return booking;
  });

  return result;
}

export async function getBookingsForClient(clientId: string, opts?: { page?: number; perPage?: number }) {
  const page = Math.max(1, Number(opts?.page || 1));
  const perPage = Math.min(100, Number(opts?.perPage || 20));
  const skip = (page - 1) * perPage;

  const [items, total] = await Promise.all([
    prisma.booking.findMany({
      where: { clientId },
      include: {
        photographer: { include: { user: true } },
        contract: true,
        payment: true,
        review: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
    }),
    prisma.booking.count({ where: { clientId } }),
  ]);

  return { items, meta: { total, page, perPage } };
}

export async function getBookingsForPhotographerUser(userId: string, opts?: { page?: number; perPage?: number }) {
  // find photographer by userId
  const photographer = await prisma.photographer.findUnique({ where: { userId } });
  if (!photographer) throw new Error('Photographer profile not found');

  const page = Math.max(1, Number(opts?.page || 1));
  const perPage = Math.min(100, Number(opts?.perPage || 20));
  const skip = (page - 1) * perPage;

  const [items, total] = await Promise.all([
    prisma.booking.findMany({
      where: { photographerId: photographer.id },
      include: {
        client: { select: { id: true, name: true, email: true } },
        contract: true,
        payment: true,
        review: true,
      },
      orderBy: { startAt: 'desc' },
      skip,
      take: perPage,
    }),
    prisma.booking.count({ where: { photographerId: photographer.id } }),
  ]);

  return { items, meta: { total, page, perPage } };
}

export async function getBookingByIdForUser(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      client: true,
      photographer: { include: { user: true } },
      stateHistory: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!booking) return null;

  // allow if user is client or is photographer's user
  if (booking.clientId === userId) return booking;
  // find photographer record userId in booking
  if (booking.photographer?.userId === userId) return booking;

  // otherwise not allowed
  return null;
}
