// src/services/booking.state.service.ts
import { prisma } from '../config/prisma';
import { BookingState, NotificationType, Role } from '@prisma/client';
import { emitToUser } from '../lib/socket';

type ActorKind = 'CLIENT' | 'PHOTOGRAPHER' | 'ADMIN';

function getActorKind(opts: {
  booking: {
    clientId: string;
    photographer: { userId: string } | null;
  };
  actorUserId: string;
  actorRole?: Role;
}): ActorKind | null {
  if (opts.booking.clientId === opts.actorUserId) return 'CLIENT';
  if (opts.booking.photographer?.userId === opts.actorUserId) return 'PHOTOGRAPHER';
  if (opts.actorRole === Role.ADMIN) return 'ADMIN';
  return null;
}

// خريطة الانتقالات المسموحة
const ALLOWED_TRANSITIONS: Record<BookingState, Partial<Record<ActorKind, BookingState[]>>> = {
  draft: { CLIENT: [BookingState.requested], ADMIN: [BookingState.requested] },
  requested: {
    PHOTOGRAPHER: [BookingState.confirmed, BookingState.cancelled_by_photographer],
    CLIENT: [BookingState.cancelled_by_client],
    ADMIN: [
      BookingState.confirmed,
      BookingState.cancelled_by_client,
      BookingState.cancelled_by_photographer,
    ],
  },
  pending_payment: {
    PHOTOGRAPHER: [BookingState.confirmed, BookingState.cancelled_by_photographer],
    ADMIN: [
      BookingState.confirmed,
      BookingState.cancelled_by_photographer,
      BookingState.cancelled_by_client,
    ],
  },
  confirmed: {
    PHOTOGRAPHER: [BookingState.in_progress, BookingState.cancelled_by_photographer],
    CLIENT: [BookingState.cancelled_by_client],
    ADMIN: [
      BookingState.in_progress,
      BookingState.cancelled_by_photographer,
      BookingState.cancelled_by_client,
    ],
  },
  in_progress: {
    PHOTOGRAPHER: [BookingState.completed, BookingState.cancelled_by_photographer],
    ADMIN: [
      BookingState.completed,
      BookingState.cancelled_by_photographer,
      BookingState.cancelled_by_client,
    ],
  },
  completed: {},
  cancelled_by_client: {},
  cancelled_by_photographer: {},
  disputed: { ADMIN: [BookingState.refunded] },
  refunded: {},
};

function canTransition(from: BookingState, to: BookingState, actor: ActorKind): boolean {
  const allowed = ALLOWED_TRANSITIONS[from]?.[actor] ?? [];
  return allowed.includes(to);
}

function notificationTypeFor(to: BookingState): NotificationType {
  if (to === BookingState.confirmed) return NotificationType.BOOKING_CONFIRMED;
  return NotificationType.SYSTEM;
}

export async function transitionBookingState(args: {
  bookingId: string;
  actorUserId: string;
  actorRole?: Role;
  toState: BookingState;
  reason?: string;
}) {
  const { bookingId, actorUserId, actorRole, toState, reason } = args;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { photographer: { select: { userId: true } } },
  });
  if (!booking) throw new Error('Booking not found');

  const actorKind = getActorKind({ booking, actorUserId, actorRole });
  if (!actorKind) throw new Error('Forbidden: not a participant');

  if (!canTransition(booking.state, toState, actorKind)) {
    throw new Error(`Transition not allowed: ${booking.state} → ${toState} by ${actorKind}`);
  }

  // نخزن الإشعارات المؤقتة هنا
  const createdNotifications: { userId: string; type: NotificationType; payload: any }[] = [];

  const updated = await prisma.$transaction(async (tx) => {
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        state: toState,
        stateHistory: {
          create: {
            fromState: booking.state,
            toState: toState,
            reason: reason ?? null,
            byUserId: actorUserId,
          },
        },
      },
      include: {
        client: { select: { id: true, name: true } },
        photographer: { select: { userId: true } },
      },
    });

    const type = notificationTypeFor(toState);
    const payloadBase = {
      bookingId,
      fromState: booking.state,
      toState,
      by: actorKind,
      reason: reason ?? null,
    };

    const notifyUserIds = [updatedBooking.client.id, updatedBooking.photographer?.userId].filter(
      Boolean,
    ) as string[];

    for (const uid of notifyUserIds) {
      const notif = await tx.notification.create({
        data: {
          userId: uid,
          type,
          payload: { event: 'BOOKING_STATE_CHANGED', ...payloadBase } as any,
        },
      });

      createdNotifications.push({
        userId: uid,
        type: notif.type,
        payload: notif.payload,
      });
    }

    return updatedBooking;
  });

  // البث بعد نجاح المعاملة
  for (const n of createdNotifications) {
    emitToUser(n.userId, 'notification', {
      type: n.type,
      payload: n.payload,
    });
  }

  return updated;
}
