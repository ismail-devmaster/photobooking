"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingIdParam = exports.createBookingSchema = exports.locationSchema = void 0;
// src/validators/booking.schemas.ts
const zod_1 = require("zod");
exports.locationSchema = zod_1.z.object({
    address: zod_1.z.string().min(1),
    lat: zod_1.z.number().min(-90).max(90),
    lon: zod_1.z.number().min(-180).max(180),
});
exports.createBookingSchema = zod_1.z.object({
    photographerId: zod_1.z.string().cuid(), // photographer record id (not user id)
    packageId: zod_1.z.string().cuid().optional().nullable(), // optional if booking custom price
    startAt: zod_1.z.string().refine((s) => !Number.isNaN(Date.parse(s)), { message: 'startAt must be an ISO date' }),
    endAt: zod_1.z.string().refine((s) => !Number.isNaN(Date.parse(s)), { message: 'endAt must be an ISO date' }),
    location: exports.locationSchema.optional(),
    notes: zod_1.z.string().max(2000).optional(),
    priceCents: zod_1.z.number().int().nonnegative().optional(), // optional override
});
exports.bookingIdParam = zod_1.z.object({
    id: zod_1.z.string().cuid(),
});
