// src/validators/booking.state.schemas.ts
import { z } from 'zod';
import { BookingState } from '@prisma/client';

export const bookingIdParam = z.object({
  id: z.string().cuid(),
});

// الحالات المسموح طلبها عبر هذا الـ endpoint لليوم 3
export const AllowedTargets = [
  BookingState.confirmed,                 // قبول من المصوّر
  BookingState.cancelled_by_photographer, // رفض/إلغاء من المصوّر
  BookingState.cancelled_by_client,       // إلغاء من الزبون
  BookingState.in_progress,               // بدء التنفيذ
  BookingState.completed,                 // اكتمال
] as const;

export const updateBookingStateBody = z.object({
  toState: z.nativeEnum(BookingState).refine(
    (v) => (AllowedTargets as readonly BookingState[]).includes(v),
    'Unsupported target state for this endpoint'
  ),
  reason: z.string().max(500).optional(),
});
