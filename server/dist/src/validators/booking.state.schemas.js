"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBookingStateBody = exports.AllowedTargets = exports.bookingIdParam = void 0;
// src/validators/booking.state.schemas.ts
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.bookingIdParam = zod_1.z.object({
    id: zod_1.z.string().cuid(),
});
// الحالات المسموح طلبها عبر هذا الـ endpoint لليوم 3
exports.AllowedTargets = [
    client_1.BookingState.confirmed, // قبول من المصوّر
    client_1.BookingState.cancelled_by_photographer, // رفض/إلغاء من المصوّر
    client_1.BookingState.cancelled_by_client, // إلغاء من الزبون
    client_1.BookingState.in_progress, // بدء التنفيذ
    client_1.BookingState.completed, // اكتمال
];
exports.updateBookingStateBody = zod_1.z.object({
    toState: zod_1.z.nativeEnum(client_1.BookingState).refine((v) => exports.AllowedTargets.includes(v), 'Unsupported target state for this endpoint'),
    reason: zod_1.z.string().max(500).optional(),
});
