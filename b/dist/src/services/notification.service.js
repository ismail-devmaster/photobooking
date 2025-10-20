"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
exports.listNotificationsForUser = listNotificationsForUser;
exports.markNotificationRead = markNotificationRead;
exports.markNotificationsReadBulk = markNotificationsReadBulk;
exports.markAllNotificationsRead = markAllNotificationsRead;
exports.deleteAllReadNotifications = deleteAllReadNotifications;
// src/services/notification.service.ts
const prisma_1 = require("../config/prisma");
const socket_1 = require("../lib/socket");
/**
 * Create notification in DB and try to emit in realtime (best-effort).
 * Returns created notification record.
 */
async function createNotification(userId, type, payload) {
    const rec = await prisma_1.prisma.notification.create({
        data: {
            userId,
            type,
            payload,
        },
    });
    // best-effort emit to connected sockets
    try {
        (0, socket_1.emitToUser)(userId, 'notification:created', {
            id: rec.id,
            type: rec.type,
            payload: rec.payload,
            createdAt: rec.createdAt,
        });
    }
    catch (err) {
        console.warn('notification emit failed', err?.message || err);
    }
    return rec;
}
/**
 * List notifications for a user with unreadCount in meta
 */
async function listNotificationsForUser(userId, page = 1, perPage = 20) {
    const p = Math.max(1, Number(page || 1));
    const pp = Math.min(200, Number(perPage || 20));
    const skip = (p - 1) * pp;
    const [items, total, unreadCount] = await Promise.all([
        prisma_1.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            skip,
            take: pp,
        }),
        prisma_1.prisma.notification.count({ where: { userId } }),
        prisma_1.prisma.notification.count({ where: { userId, readAt: null } }),
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
async function markNotificationRead(userId, notificationId) {
    const rec = await prisma_1.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!rec)
        throw new Error('Notification not found');
    if (rec.userId !== userId)
        throw new Error('Forbidden');
    if (rec.readAt)
        return rec;
    const updated = await prisma_1.prisma.notification.update({
        where: { id: notificationId },
        data: { readAt: new Date() },
    });
    // emit unread count update
    const unread = await prisma_1.prisma.notification.count({ where: { userId, readAt: null } });
    try {
        (0, socket_1.emitToUser)(userId, 'notification:read', { id: updated.id, unreadCount: unread });
    }
    catch (err) { }
    return updated;
}
/**
 * Bulk mark notifications read
 */
async function markNotificationsReadBulk(userId, ids) {
    if (!Array.isArray(ids) || ids.length === 0)
        return { count: 0, unreadCount: 0 };
    const result = await prisma_1.prisma.notification.updateMany({
        where: { id: { in: ids }, userId, readAt: null },
        data: { readAt: new Date() },
    });
    const unread = await prisma_1.prisma.notification.count({ where: { userId, readAt: null } });
    try {
        (0, socket_1.emitToUser)(userId, 'notification:bulkRead', { unreadCount: unread });
    }
    catch (err) { }
    return { count: result.count, unreadCount: unread };
}
/**
 * Mark all notifications as read for a user
 */
async function markAllNotificationsRead(userId) {
    const result = await prisma_1.prisma.notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() },
    });
    try {
        (0, socket_1.emitToUser)(userId, 'notification:allRead', { unreadCount: 0 });
    }
    catch (err) { }
    return { count: result.count, unreadCount: 0 };
}
/**
 * Delete all read notifications for a user
 */
async function deleteAllReadNotifications(userId) {
    const result = await prisma_1.prisma.notification.deleteMany({
        where: { userId, readAt: { not: null } },
    });
    const unread = await prisma_1.prisma.notification.count({ where: { userId, readAt: null } });
    try {
        (0, socket_1.emitToUser)(userId, 'notification:deletedRead', { unreadCount: unread });
    }
    catch (err) { }
    return { count: result.count, unreadCount: unread };
}
