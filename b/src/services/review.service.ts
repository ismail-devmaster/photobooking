// src/services/review.service.ts
import { prisma } from '../config/prisma';
import { ReviewStatus, NotificationType } from '@prisma/client';
import { emitToUser } from '../lib/socket';

type CreatedNotification = { userId: string; type: NotificationType; payload: any };

/**
 * Create a review for a completed booking.
 * - ensures booking exists and belongs to the client
 * - ensures booking.state === completed
 * - creates Review (status: PENDING)
 * - creates Notification for photographer (REVIEW_RECEIVED)
 */
export async function createReview(
  reviewerId: string,
  payload: { bookingId: string; rating: number; text?: string | null }
) {
  const { bookingId, rating, text } = payload;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { photographer: { select: { id: true, userId: true } } },
  });
  if (!booking) throw new Error('Booking not found');
  if (booking.clientId !== reviewerId) throw new Error('Not allowed to review this booking');
  if (booking.state !== 'completed') throw new Error('Review allowed only after booking completed');

  let createdNotification: CreatedNotification | null = null;

  const review = await prisma.$transaction(async (tx) => {
    const r = await tx.review.create({
      data: {
        bookingId,
        photographerId: booking.photographerId,
        reviewerId,
        rating,
        text: text ?? null,
        status: ReviewStatus.PENDING,
      },
    });

    if (booking.photographer?.userId) {
      const notif = await tx.notification.create({
        data: {
          userId: booking.photographer.userId,
          type: NotificationType.REVIEW_RECEIVED,
          payload: {
            reviewId: r.id,
            bookingId,
            rating,
            reviewerId,
          } as any,
        },
      });

      createdNotification = {
        userId: booking.photographer.userId,
        type: notif.type,
        payload: notif.payload,
      };
    }

    return r;
  });

  // بعد نجاح الـ transaction: بث الإشعار إن وُجد (آمن للـ typescript)
  if (createdNotification) {
    const { userId, type, payload } = createdNotification;
    // userId و type و payload كلها الآن مضمونة الوجود وtyped
    emitToUser(userId, 'notification', { type, payload });
  }

  return review;
}

/**
 * List approved reviews for a photographer (public)
 */
export async function listApprovedReviewsForPhotographer(
  photographerId: string,
  opts?: { page?: number; perPage?: number }
) {
  const page = Math.max(1, Number(opts?.page || 1));
  const perPage = Math.min(100, Number(opts?.perPage || 12));
  const skip = (page - 1) * perPage;

  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where: { photographerId, status: ReviewStatus.APPROVED },
      include: { reviewer: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
    }),
    prisma.review.count({ where: { photographerId, status: ReviewStatus.APPROVED } }),
  ]);

  return { items, meta: { total, page, perPage, pages: Math.ceil(total / perPage) } };
}

/**
 * List reviews by reviewer (user)
 */
export async function listReviewsByUser(userId: string, opts?: { page?: number; perPage?: number }) {
  const page = Math.max(1, Number(opts?.page || 1));
  const perPage = Math.min(100, Number(opts?.perPage || 50));
  const skip = (page - 1) * perPage;

  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where: { reviewerId: userId },
      include: { photographer: { select: { id: true, userId: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
    }),
    prisma.review.count({ where: { reviewerId: userId } }),
  ]);

  return { items, meta: { total, page, perPage, pages: Math.ceil(total / perPage) } };
}

/**
 * Admin: list all reviews (with filter by status optional)
 */
export async function adminListReviews(opts?: { status?: ReviewStatus; page?: number; perPage?: number }) {
  const page = Math.max(1, Number(opts?.page || 1));
  const perPage = Math.min(200, Number(opts?.perPage || 50));
  const skip = (page - 1) * perPage;

  const where: any = {};
  if (opts?.status) where.status = opts.status;

  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: { reviewer: { select: { id: true, name: true } }, booking: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
    }),
    prisma.review.count({ where }),
  ]);

  return { items, meta: { total, page, perPage, pages: Math.ceil(total / perPage) } };
}

/**
 * Admin action: approve or reject review.
 */
export async function adminModerateReview(
  adminUserId: string,
  reviewId: string,
  action: 'approve' | 'reject',
  reason?: string
) {
  let createdNotification: CreatedNotification | null = null;

  const updated = await prisma.$transaction(async (tx) => {
    const review = await tx.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new Error('Review not found');

    const targetStatus = action === 'approve' ? ReviewStatus.APPROVED : ReviewStatus.REJECTED;
    if (review.status === targetStatus) return review;

    const u = await tx.review.update({
      where: { id: reviewId },
      data: { status: targetStatus },
      include: { reviewer: { select: { id: true, name: true } } },
    });

    const booking = await tx.booking.findUnique({
      where: { id: u.bookingId },
      include: { photographer: { select: { userId: true } } },
    });

    if (booking?.photographer?.userId) {
      const notif = await tx.notification.create({
        data: {
          userId: booking.photographer.userId,
          type: NotificationType.REVIEW_RECEIVED,
          payload: {
            reviewId: u.id,
            action,
            reason: reason ?? null,
          } as any,
        },
      });

      createdNotification = {
        userId: booking.photographer.userId,
        type: notif.type,
        payload: notif.payload,
      };
    }

    if (action === 'approve') {
      const agg = await tx.review.aggregate({
        _avg: { rating: true },
        _count: { rating: true },
        where: { photographerId: review.photographerId, status: ReviewStatus.APPROVED },
      });
      const ratingAvg = agg._avg.rating ?? 0;
      const ratingCount = agg._count.rating ?? 0;

      await tx.photographer.update({
        where: { id: review.photographerId },
        data: {
          ratingAvg: ratingCount > 0 ? Math.round((ratingAvg + Number.EPSILON) * 100) / 100 : 0,
          ratingCount,
        },
      });
    }

    return u;
  });

  if (createdNotification) {
    const { userId, type, payload } = createdNotification;
    emitToUser(userId, 'notification', { type, payload });
  }

  return updated;
}

/**
 * Helper: recalc rating
 */
export async function recalcPhotographerRating(photographerId: string) {
  const agg = await prisma.review.aggregate({
    _avg: { rating: true },
    _count: { rating: true },
    where: { photographerId, status: ReviewStatus.APPROVED },
  });
  const ratingAvg = agg._avg.rating ?? 0;
  const ratingCount = agg._count.rating ?? 0;

  return prisma.photographer.update({
    where: { id: photographerId },
    data: {
      ratingAvg: ratingCount > 0 ? Math.round((ratingAvg + Number.EPSILON) * 100) / 100 : 0,
      ratingCount,
    },
  });
}
