import { z } from 'zod';

export const photographerListQuery = z.object({
  stateId: z.string().cuid().optional(),
  serviceId: z.string().cuid().optional(),
  minPrice: z.preprocess((v) => v === undefined || v === '' ? undefined : Number(v), z.number().int().min(0).optional()),
  maxPrice: z.preprocess((v) => v === undefined || v === '' ? undefined : Number(v), z.number().int().min(0).optional()),
  q: z.string().max(200).optional(),
  tags: z.string().optional(), // comma separated
  sort: z.enum(['rating_desc','price_asc','price_desc','newest']).optional(),
  page: z.preprocess((v) => Number(v), z.number().int().positive().default(1)),
  perPage: z.preprocess((v) => Number(v), z.number().int().positive().default(12)),
});
