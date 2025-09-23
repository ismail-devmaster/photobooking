// src/validators/review.schemas.ts
import { z } from 'zod';

export const createReviewSchema = z.object({
  bookingId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  text: z.string().max(2000).optional(),
});

export const adminReviewActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().max(1000).optional(),
});

export const reviewIdParam = z.object({
  id: z.string().cuid(),
});
