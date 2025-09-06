// src/services/notification.service.ts
import { prisma } from '../config/prisma';
import { NotificationType } from '@prisma/client';
import { emitToUser } from '../lib/socket';

type CreatePayload = any;

/**
 * Create notification in DB and try to emit in realtime (best-effort).
 * Returns created notification record.
 */
export async function createNotification(userId: string, type: NotificationType, payload: CreatePayload) {
  const rec = await prisma.notification.create({
    data: {
      userId,
      type,
      payload,
    },
  });

  // best-effort emit to connected sockets
  try {
    emitToUser(userId, 'notification:created', {
      id: rec.id,
      type: rec.type,
      payload: rec.payload,
      createdAt: rec.createdAt,
    });
  } catch (err: any) {
    console.warn('notification emit failed', err?.message || err);
  }

  return rec;
}

/**
 * List notifications for a user with unreadCount in meta
 */
export async function listNotificationsForUser(userId: string, page = 1, perPage = 20) {
  const p = Math.max(1, Number(page || 1));
  const pp = Math.min(200, Number(perPage || 20));
  const skip = (p - 1) * pp;

  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pp,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  return {
    items,
    meta: {
      total,
      page: p,
      perPage: pp,
      pages: Math.ceil(total / pp),
      unreadCount,
    },
  };
}

/**
 * Mark single notification read
 */
export async function markNotificationRead(userId: string, notificationId: string) {
  const rec = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!rec) throw new Error('Notification not found');
  if (rec.userId !== userId) throw new Error('Forbidden');
  if (rec.readAt) return rec;

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });

  // emit unread count update
  const unread = await prisma.notification.count({ where: { userId, readAt: null } });
  try {
    emitToUser(userId, 'notification:read', { id: updated.id, unreadCount: unread });
  } catch (err) {}

  return updated;
}

/**
 * Bulk mark notifications read
 */
export async function markNotificationsReadBulk(userId: string, ids: string[]) {
  if (!Array.isArray(ids) || ids.length === 0) return { count: 0, unreadCount: 0 };

  const result = await prisma.notification.updateMany({
    where: { id: { in: ids }, userId, readAt: null },
    data: { readAt: new Date() },
  });

  const unread = await prisma.notification.count({ where: { userId, readAt: null } });
  try {
    emitToUser(userId, 'notification:bulkRead', { unreadCount: unread });
  } catch (err) {}

  return { count: result.count, unreadCount: unread };
}
