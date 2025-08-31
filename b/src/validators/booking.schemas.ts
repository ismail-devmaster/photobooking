// src/validators/booking.schemas.ts
import { z } from 'zod';

export const locationSchema = z.object({
  address: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

export const createBookingSchema = z.object({
  photographerId: z.string().cuid(), // photographer record id (not user id)
  packageId: z.string().cuid().optional().nullable(), // optional if booking custom price
  startAt: z.string().refine((s) => !Number.isNaN(Date.parse(s)), { message: 'startAt must be an ISO date' }),
  endAt: z.string().refine((s) => !Number.isNaN(Date.parse(s)), { message: 'endAt must be an ISO date' }),
  location: locationSchema.optional(),
  notes: z.string().max(2000).optional(),
  priceCents: z.number().int().nonnegative().optional(), // optional override
});

export const bookingIdParam = z.object({
  id: z.string().cuid(),
});
