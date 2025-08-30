import { z } from 'zod';

export const uploadImageSchema = z.object({
  // file validated by multer; optional meta as JSON string in body
  meta: z.string().optional(),
});
