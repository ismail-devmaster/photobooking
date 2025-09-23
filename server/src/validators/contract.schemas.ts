// src/validators/contract.schemas.ts
import { z } from 'zod';

export const generateContractSchema = z.object({
  bookingId: z.string().cuid(),
});

export const signContractSchema = z.object({
  signatureDataUrl: z.string().min(20), // data:image/png;base64,.... or raw base64
  // optional typed name:
  signerName: z.string().max(200).optional(),
});

export const contractIdParam = z.object({
  id: z.string().cuid(),
});
