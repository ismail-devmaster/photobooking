// src/services/notification.service.ts
import { prisma } from '../config/prisma';
import { NotificationType } from '@prisma/client';
import { emitToUser, getIo } from '../lib/socket';

export async function createNotification(userId: string, type: NotificationType, payload: any) {
  // create in DB
  const rec = await prisma.notification.create({
    data: {
      userId,
      type,
      payload,
    },
  });

  // try to emit in realtime (non-blocking)
  try {
    // use room: 'user:<id>' or direct emit function
    emitToUser(userId, 'notification', {
      id: rec.id,
      type: rec.type,
      payload: rec.payload,
      createdAt: rec.createdAt,
    });
  } catch (err) {
    console.warn('Realtime emit failed:', (err as Error).message);
  }

  return rec;
}

export async function listNotificationsForUser(userId: string, page = 1, perPage = 20) {
  const skip = (Math.max(1, page) - 1) * perPage;
  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);
  return { items, meta: { total, page, perPage, pages: Math.ceil(total / perPage) } };
}

export async function markNotificationRead(userId: string, notificationId: string) {
  // ensure ownership
  const rec = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!rec) throw new Error('Notification not found');
  if (rec.userId !== userId) throw new Error('Forbidden');
  if (rec.readAt) return rec;

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });

  // optionally emit realtime update to user to update UI unread counts
  try {
    emitToUser(userId, 'notification.read', { id: notificationId, readAt: updated.readAt });
  } catch (err) {}

  return updated;
}

