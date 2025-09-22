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
exports.listMyBookings = listMyBookings;
exports.listReceivedBookings = listReceivedBookings;
exports.getBookingById = getBookingById;
const bookingService = __importStar(require("../services/booking.service"));
const booking_schemas_1 = require("../validators/booking.schemas");
async function createBooking(req, res) {
    try {
        const userId = req.userId;
        const parsed = booking_schemas_1.createBookingSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });
        }
        const data = parsed.data;
        const startAt = new Date(data.startAt);
        const endAt = new Date(data.endAt);
        if (startAt >= endAt)
            return res.status(400).json({ error: 'endAt must be after startAt' });
        // create booking
        const booking = await bookingService.createBooking(userId, {
            photographerId: data.photographerId,
            packageId: data.packageId ?? null,
            startAt,
            endAt,
            location: data.location ?? undefined,
            notes: data.notes ?? undefined,
            priceCents: data.priceCents ?? null,
        });
        return res.status(201).json(booking);
    }
    catch (err) {
        console.error('createBooking error:', err);
        // map a few known errors to HTTP codes
        const msg = err.message || 'Could not create booking';
        if (msg.includes('Photographer not found') || msg.includes('Package')) {
            return res.status(400).json({ error: msg });
        }
        return res.status(500).json({ error: msg });
    }
}
async function listMyBookings(req, res) {
    try {
        const userId = req.userId;
        const page = Number(req.query.page || '1');
        const perPage = Number(req.query.perPage || '20');
        const result = await bookingService.getBookingsForClient(userId, { page, perPage });
        return res.json(result);
    }
    catch (err) {
        console.error('listMyBookings error:', err);
        return res.status(500).json({ error: 'Could not list bookings' });
    }
}
async function listReceivedBookings(req, res) {
    try {
        const userId = req.userId;
        const page = Number(req.query.page || '1');
        const perPage = Number(req.query.perPage || '20');
        const result = await bookingService.getBookingsForPhotographerUser(userId, { page, perPage });
        return res.json(result);
    }
    catch (err) {
        console.error('listReceivedBookings error:', err);
        const msg = err.message || 'Could not list received bookings';
        if (msg.includes('Photographer profile not found'))
            return res.status(400).json({ error: msg });
        return res.status(500).json({ error: msg });
    }
}
async function getBookingById(req, res) {
    try {
        const parsed = booking_schemas_1.bookingIdParam.safeParse(req.params);
        if (!parsed.success)
            return res.status(400).json({ error: 'Invalid booking id' });
        const userId = req.userId;
        const booking = await bookingService.getBookingByIdForUser(parsed.data.id, userId);
        if (!booking)
            return res.status(404).json({ error: 'Booking not found or access denied' });
        return res.json(booking);
    }
    catch (err) {
        console.error('getBookingById error:', err);
        return res.status(500).json({ error: 'Could not fetch booking' });
    }
}
