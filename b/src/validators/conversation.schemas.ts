// src/validators/conversation.schemas.ts
import { z } from 'zod';

export const createConversationSchema = z.object({
  participantId: z.string().cuid(), // the other user's id
});

export const conversationIdParam = z.object({
  id: z.string().cuid(),
});

export const listConversationsQuery = z.object({
  page: z.preprocess((v) => (v === undefined ? 1 : Number(v)), z.number().int().positive().default(1)),
  perPage: z.preprocess((v) => (v === undefined ? 20 : Number(v)), z.number().int().positive().default(20)),
});
