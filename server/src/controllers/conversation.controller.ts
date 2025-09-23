// src/controllers/conversation.controller.ts
import { Request, Response } from 'express';
import * as convService from '../services/conversation.service';
import { createConversationSchema, conversationIdParam, listConversationsQuery } from '../validators/conversation.schemas';
import { listMessagesQuery } from '../validators/message.schemas';
import * as conversationService from '../services/conversation.service';

export async function createConversation(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const parsed = createConversationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input', issues: parsed.error.issues });

    const otherId = parsed.data.participantId;
    if (otherId === userId) return res.status(400).json({ error: 'Cannot create conversation with self' });

    const conv = await convService.findOrCreateConversation(userId, otherId);
    return res.status(201).json(conv);
  } catch (err: any) {
    console.error('createConversation error:', err);
    return res.status(500).json({ error: err.message || 'Could not create conversation' });
  }
}

export async function listConversations(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const q = listConversationsQuery.parse(req.query);
    const result = await convService.listConversationsForUser(userId, q.page, q.perPage);
    return res.json(result);
  } catch (err: any) {
    console.error('listConversations error:', err);
    return res.status(500).json({ error: 'Could not list conversations' });
  }
}

export async function getMessages(req: Request, res: Response) {
  try {
    const userId = (req as any).userId; // من الـ auth middleware
    const otherUserId = req.params.id;  // من /conversations/:id/messages

    const conversation = await conversationService.findOrCreateConversation(userId, otherUserId);

    // جيب الرسائل
    const { page = 1, perPage = 50 } = req.query;
    const messages = await conversationService.getMessages(
      conversation.id,
      Number(page),
      Number(perPage)
    );

    return res.json({ conversation, messages });
  } catch (err: any) {
    if (err.message.includes('participants do not exist')) {
      return res.status(400).json({ error: 'Invalid conversation participants' });
    }

    console.error('getMessages error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

export async function markRead(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const pid = conversationIdParam.safeParse(req.params);
    if (!pid.success) return res.status(400).json({ error: 'Invalid conversation id' });

    // check membership
    const conversation = await (require('../config/prisma').prisma).conversation.findUnique({ where: { id: pid.data.id } });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    if (conversation.participantAId !== userId && conversation.participantBId !== userId) return res.status(403).json({ error: 'Access denied' });

    const result = await convService.markConversationRead(pid.data.id, userId);
    return res.json(result);
  } catch (err: any) {
    console.error('markRead error:', err);
    return res.status(500).json({ error: err.message || 'Could not mark read' });
  }
}
