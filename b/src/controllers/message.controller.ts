// src/controllers/message.controller.ts
import { Request, Response } from 'express';
import { sendMessageSchema } from '../validators/message.schemas';
import * as convService from '../services/conversation.service';
import * as msgService from '../services/message.service';

const APP_BASE_URL = process.env.APP_BASE_URL?.replace(/\/$/, '') || 'http://localhost:4000';

// helper to build attachments meta from multer files
function attachmentsFromFiles(files?: Express.Multer.File[]) {
  if (!files || !Array.isArray(files) || files.length === 0) return [];
  return files.map((f) => ({
    filename: f.filename,
    originalName: f.originalname,
    mimetype: f.mimetype,
    size: f.size,
    url: `${APP_BASE_URL}/uploads/${f.filename}`,
  }));
}

/**
 * Send a message:
 * - body: { conversationId? , recipientId? , content? }
 * - files: attachments in field name "attachments" (multipart/form-data)
 *
 * If conversationId not provided, recipientId must be provided and conversation created/found.
 */
export async function sendMessage(req: Request, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload', issues: parsed.error.issues });

    const { conversationId, recipientId, content } = parsed.data;

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const attachments = attachmentsFromFiles(files);

    if (!content && attachments.length === 0) {
      return res.status(400).json({ error: 'Message must have content or attachments' });
    }

    // decide conversation
    let convId = conversationId;
    if (!convId) {
      if (!recipientId) return res.status(400).json({ error: 'recipientId required when conversationId not provided' });
      // create or find conversation between user & recipient
      const conv = await convService.findOrCreateConversation(userId, recipientId);
      convId = conv.id;
    }

    // ensure conversation exists and user is participant is checked inside createMessage
    const message = await msgService.createMessage(convId, userId, content ?? null, attachments.length ? attachments : undefined);

    // Return message (with sender info)
    const messageWithSender = await (require('../config/prisma').prisma).message.findUnique({
      where: { id: message.id },
      include: { sender: { select: { id: true, name: true } } },
    });

    return res.status(201).json(messageWithSender);
  } catch (err: any) {
    console.error('sendMessage error:', err);
    const msg = err.message || 'Could not send message';
    if (/Conversation not found/i.test(msg)) return res.status(404).json({ error: msg });
    if (/Sender not a participant/i.test(msg)) return res.status(403).json({ error: msg });
    if (/Cannot create conversation with self/i.test(msg)) return res.status(400).json({ error: msg });
    return res.status(500).json({ error: msg });
  }
}
