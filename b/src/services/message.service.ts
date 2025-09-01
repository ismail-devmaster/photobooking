// src/services/message.service.ts
import { prisma } from '../config/prisma';
import { NotificationType } from '@prisma/client';

type AttachmentMeta = {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
};

export async function createMessage(conversationId: string, senderId: string, content: string | null, attachments?: AttachmentMeta[]) {
  // load conversation & ensure sender is participant
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });
  if (!conversation) throw new Error('Conversation not found');

  if (conversation.participantAId !== senderId && conversation.participantBId !== senderId) {
    throw new Error('Sender not a participant');
  }

  // create message
  const msg = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      content: content ?? null,
      attachments: attachments && attachments.length ? attachments as any : null,
    },
  });

  // update conversation lastActiveAt
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastActiveAt: new Date() },
  });

  // create notification for the other participant
  const otherUserId = conversation.participantAId === senderId ? conversation.participantBId : conversation.participantAId;
  if (otherUserId) {
    await prisma.notification.create({
      data: {
        userId: otherUserId,
        type: NotificationType.MESSAGE_RECEIVED,
        payload: { conversationId, messageId: msg.id, senderId } as any,
      },
    });
  }

  return msg;
}
