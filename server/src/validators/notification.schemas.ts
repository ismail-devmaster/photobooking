// src/validators/notification.schemas.ts
import { z } from 'zod';

export const listNotificationsQuery = z.object({
  page: z.preprocess((v) => (v === undefined ? 1 : Number(v)), z.number().int().positive().default(1)),
  perPage: z.preprocess((v) => (v === undefined ? 20 : Number(v)), z.number().int().positive().default(20)),
});

export const notificationIdParam = z.object({
  id: z.string().cuid(),
});
