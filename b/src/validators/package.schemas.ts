import { z } from 'zod';

export const createPackageSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  priceCents: z.number().int().nonnegative(),
});

export const updatePackageSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
  priceCents: z.number().int().nonnegative().optional(),
});
