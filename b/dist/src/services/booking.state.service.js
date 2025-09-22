"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transitionBookingState = transitionBookingState;
// src/services/booking.state.service.ts
const prisma_1 = require("../config/prisma");
const client_1 = require("@prisma/client");
const socket_1 = require("../lib/socket");
function getActorKind(opts) {
    if (opts.booking.clientId === opts.actorUserId)
        return 'CLIENT';
    if (opts.booking.photographer?.userId === opts.actorUserId)
        return 'PHOTOGRAPHER';
    if (opts.actorRole === client_1.Role.ADMIN)
        return 'ADMIN';
    return null;
}
// خريطة الانتقالات المسموحة
const ALLOWED_TRANSITIONS = {
    draft: { CLIENT: [client_1.BookingState.requested], ADMIN: [client_1.BookingState.requested] },
    requested: {
        PHOTOGRAPHER: [client_1.BookingState.confirmed, client_1.BookingState.cancelled_by_photographer],
        CLIENT: [client_1.BookingState.cancelled_by_client],
        ADMIN: [
            client_1.BookingState.confirmed,
            client_1.BookingState.cancelled_by_client,
            client_1.BookingState.cancelled_by_photographer,
        ],
    },
    pending_payment: {
        PHOTOGRAPHER: [client_1.BookingState.confirmed, client_1.BookingState.cancelled_by_photographer],
        ADMIN: [
            client_1.BookingState.confirmed,
            client_1.BookingState.cancelled_by_photographer,
            client_1.BookingState.cancelled_by_client,
        ],
    },
    confirmed: {
        PHOTOGRAPHER: [client_1.BookingState.in_progress, client_1.BookingState.cancelled_by_photographer],
        CLIENT: [client_1.BookingState.cancelled_by_client],
        ADMIN: [
            client_1.BookingState.in_progress,
            client_1.BookingState.cancelled_by_photographer,
            client_1.BookingState.cancelled_by_client,
        ],
    },
    in_progress: {
        PHOTOGRAPHER: [client_1.BookingState.completed, client_1.BookingState.cancelled_by_photographer],
        ADMIN: [
            client_1.BookingState.completed,
            client_1.BookingState.cancelled_by_photographer,
            client_1.BookingState.cancelled_by_client,
        ],
    },
    completed: {},
    cancelled_by_client: {},
    cancelled_by_photographer: {},
    disputed: { ADMIN: [client_1.BookingState.refunded] },
    refunded: {},
};
function canTransition(from, to, actor) {
    const allowed = ALLOWED_TRANSITIONS[from]?.[actor] ?? [];
    return allowed.includes(to);
}
function notificationTypeFor(to) {
    if (to === client_1.BookingState.confirmed)
        return client_1.NotificationType.BOOKING_CONFIRMED;
    return client_1.NotificationType.SYSTEM;
}
async function transitionBookingState(args) {
    const { bookingId, actorUserId, actorRole, toState, reason } = args;
    const booking = await prisma_1.prisma.booking.findUnique({
        where: { id: bookingId },
        include: { photographer: { select: { userId: true } } },
    });
    if (!booking)
        throw new Error('Booking not found');
    const actorKind = getActorKind({ booking, actorUserId, actorRole });
    if (!actorKind)
        throw new Error('Forbidden: not a participant');
    if (!canTransition(booking.state, toState, actorKind)) {
        throw new Error(`Transition not allowed: ${booking.state} → ${toState} by ${actorKind}`);
    }
    // نخزن الإشعارات المؤقتة هنا
    const createdNotifications = [];
    const updated = await prisma_1.prisma.$transaction(async (tx) => {
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
        const notifyUserIds = [updatedBooking.client.id, updatedBooking.photographer?.userId].filter(Boolean);
        for (const uid of notifyUserIds) {
            const notif = await tx.notification.create({
                data: {
                    userId: uid,
                    type,
                    payload: { event: 'BOOKING_STATE_CHANGED', ...payloadBase },
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
        (0, socket_1.emitToUser)(n.userId, 'notification', {
            type: n.type,
            payload: n.payload,
        });
    }
    return updated;
}
