"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBooking = createBooking;
exports.getBookingsForClient = getBookingsForClient;
exports.getBookingsForPhotographerUser = getBookingsForPhotographerUser;
exports.getBookingByIdForUser = getBookingByIdForUser;
// src/services/booking.service.ts
const prisma_1 = require("../config/prisma");
const client_1 = require("@prisma/client");
const calendarService = __importStar(require("./calendar.service"));
/**
 * Create booking:
 * - validates package belongs to photographer
 * - uses package.priceCents unless priceCents override provided
 * - creates booking + bookingStateHistory + notification in a transaction
 */
async function createBooking(clientId, payload) {
    // fetch package & photographer
    const [photog, pkg] = await Promise.all([
        prisma_1.prisma.photographer.findUnique({ where: { id: payload.photographerId } }),
        payload.packageId
            ? prisma_1.prisma.package.findUnique({ where: { id: payload.packageId } })
            : Promise.resolve(null),
    ]);
    if (!photog)
        throw new Error('Photographer not found');
    if (pkg && pkg.photographerId !== photog.id)
        throw new Error('Package does not belong to photographer');
    // Check photographer availability before creating booking
    const isAvailable = await calendarService.isPhotographerAvailable(payload.photographerId, payload.startAt, payload.endAt, { includePending: true });
    if (!isAvailable) {
        throw new Error('Photographer is not available for the requested time slot');
    }
    const price = typeof payload.priceCents === 'number' ? payload.priceCents : pkg ? pkg.priceCents : 0;
    const bookingData = {
        clientId,
        photographerId: photog.id,
        startAt: payload.startAt,
        endAt: payload.endAt,
        location: payload.location ?? null, // ⬅️ نظيف وواضح
        priceCents: price,
        state: client_1.BookingState.requested,
    };
    // transaction: create booking, stateHistory, notification
    const result = await prisma_1.prisma.$transaction(async (tx) => {
        const booking = await tx.booking.create({
            data: {
                clientId: bookingData.clientId,
                photographerId: bookingData.photographerId,
                startAt: bookingData.startAt,
                endAt: bookingData.endAt,
                location: bookingData.location,
                priceCents: bookingData.priceCents,
                state: bookingData.state,
                stateHistory: {
                    create: {
                        fromState: client_1.BookingState.draft,
                        toState: client_1.BookingState.requested,
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
async function getBookingsForClient(clientId, opts) {
    const page = Math.max(1, Number(opts?.page || 1));
    const perPage = Math.min(100, Number(opts?.perPage || 20));
    const skip = (page - 1) * perPage;
    const [items, total] = await Promise.all([
        prisma_1.prisma.booking.findMany({
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
        prisma_1.prisma.booking.count({ where: { clientId } }),
    ]);
    return { items, meta: { total, page, perPage } };
}
async function getBookingsForPhotographerUser(userId, opts) {
    // find photographer by userId
    const photographer = await prisma_1.prisma.photographer.findUnique({ where: { userId } });
    if (!photographer)
        throw new Error('Photographer profile not found');
    const page = Math.max(1, Number(opts?.page || 1));
    const perPage = Math.min(100, Number(opts?.perPage || 20));
    const skip = (page - 1) * perPage;
    const [items, total] = await Promise.all([
        prisma_1.prisma.booking.findMany({
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
        prisma_1.prisma.booking.count({ where: { photographerId: photographer.id } }),
    ]);
    return { items, meta: { total, page, perPage } };
}
async function getBookingByIdForUser(bookingId, userId) {
    const booking = await prisma_1.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            client: true,
            photographer: { include: { user: true } },
            stateHistory: { orderBy: { createdAt: 'asc' } },
        },
    });
    if (!booking)
        return null;
    // allow if user is client or is photographer's user
    if (booking.clientId === userId)
        return booking;
    // find photographer record userId in booking
    if (booking.photographer?.userId === userId)
        return booking;
    // otherwise not allowed
    return null;
}
