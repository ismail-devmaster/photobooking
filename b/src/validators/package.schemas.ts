import { z } from 'zod';

export const createPackageSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  priceCents: z.number().int().nonnegative(),
  imageUrls: z.array(z.string().url()).optional(), // Add this
});

export const updatePackageSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
  priceCents: z.number().int().nonnegative().optional(),
  imageUrls: z.array(z.string().url()).optional(), // Add this
});
