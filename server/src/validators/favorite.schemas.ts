import { z } from 'zod';

export const photographerIdParam = z.object({
  photographerId: z.string().cuid(),
});

export const listFavoritesQuery = z.object({
  page: z.preprocess((v) => Number(v), z.number().int().positive().optional()),
  perPage: z.preprocess((v) => Number(v), z.number().int().positive().optional()),
});
