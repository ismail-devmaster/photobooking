// src/validators/message.schemas.ts
import { z } from 'zod';

export const sendMessageSchema = z.object({
  // either conversationId OR recipientId (the other user's id) must be present
  conversationId: z.string().cuid().optional(),
  recipientId: z.string().cuid().optional(),
  content: z.string().max(5000).optional(), // optional if attachments present
});

// simple query for messages listing
export const listMessagesQuery = z.object({
  page: z.preprocess((v) => (v === undefined ? 1 : Number(v)), z.number().int().positive().default(1)),
  perPage: z.preprocess((v) => (v === undefined ? 50 : Number(v)), z.number().int().positive().default(50)),
});
