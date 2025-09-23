"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findConversationBetween = findConversationBetween;
exports.findOrCreateConversation = findOrCreateConversation;
exports.listConversationsForUser = listConversationsForUser;
exports.getMessages = getMessages;
exports.markConversationRead = markConversationRead;
// src/services/conversation.service.ts
const prisma_1 = require("../config/prisma");
/**
 * Find conversation between two users (order-insensitive).
 */
async function findConversationBetween(userAId, userBId) {
    return prisma_1.prisma.conversation.findFirst({
        where: {
            OR: [
                { participantAId: userAId, participantBId: userBId },
                { participantAId: userBId, participantBId: userAId },
            ],
        },
    });
}
/**
 * Find or create conversation (participantAId will be userAId when created).
 */
async function findOrCreateConversation(userAId, userBId) {
    // تحقق إذا موجودة محادثة بين A و B
    const existing = await prisma_1.prisma.conversation.findFirst({
        where: {
            OR: [
                { participantAId: userAId, participantBId: userBId },
                { participantAId: userBId, participantBId: userAId },
            ],
        },
    });
    if (existing)
        return existing;
    // ✅ تحقق إذا المستخدمين موجودين
    const [userA, userB] = await Promise.all([
        prisma_1.prisma.user.findUnique({ where: { id: userAId } }),
        prisma_1.prisma.user.findUnique({ where: { id: userBId } }),
    ]);
    if (!userA || !userB) {
        throw new Error('One or both participants do not exist');
    }
    // إذا موجودين → أنشئ محادثة
    const conv = await prisma_1.prisma.conversation.create({
        data: {
            participantAId: userAId,
            participantBId: userBId,
            lastActiveAt: new Date(),
        },
    });
    return conv;
}
/**
 * List conversations for a user with last message preview and unread count.
 */
async function listConversationsForUser(userId, page = 1, perPage = 20) {
    const skip = (Math.max(1, page) - 1) * perPage;
    // get conversations where user is a participant
    const [items, total] = await Promise.all([
        prisma_1.prisma.conversation.findMany({
            where: {
                OR: [{ participantAId: userId }, { participantBId: userId }],
            },
            include: {
                // include last message
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    include: { sender: { select: { id: true, name: true } } },
                },
                participantA: { select: { id: true, name: true } },
                participantB: { select: { id: true, name: true } },
            },
            orderBy: { lastActiveAt: 'desc' },
            skip,
            take: perPage,
        }),
        prisma_1.prisma.conversation.count({
            where: { OR: [{ participantAId: userId }, { participantBId: userId }] },
        }),
    ]);
    // compute unread counts per conversation
    const convIds = items.map((c) => c.id);
    const unreadAgg = await prisma_1.prisma.message.groupBy({
        by: ['conversationId'],
        where: {
            conversationId: { in: convIds },
            readAt: null,
            // sender != userId
            NOT: { senderId: userId },
        },
        _count: { _all: true },
    });
    const unreadMap = Object.fromEntries(unreadAgg.map((r) => [r.conversationId, r._count._all]));
    const mapped = items.map((c) => {
        const other = c.participantAId === userId ? c.participantB : c.participantA;
        const lastMessage = c.messages && c.messages.length ? c.messages[0] : null;
        return {
            id: c.id,
            otherUser: other ? { id: other.id, name: other.name } : null,
            lastActiveAt: c.lastActiveAt,
            lastMessage,
            unreadCount: unreadMap[c.id] ?? 0,
        };
    });
    return { items: mapped, meta: { total, page, perPage, pages: Math.ceil(total / perPage) } };
}
/**
 * Get messages in a conversation with pagination.
 */
async function getMessages(conversationId, page = 1, perPage = 50) {
    const skip = (Math.max(1, page) - 1) * perPage;
    const [items, total] = await Promise.all([
        prisma_1.prisma.message.findMany({
            where: { conversationId },
            include: { sender: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
            skip,
            take: perPage,
        }),
        prisma_1.prisma.message.count({ where: { conversationId } }),
    ]);
    // return in ascending order (oldest first) for UI convenience
    const messagesAsc = items.reverse();
    return { items: messagesAsc, meta: { total, page, perPage, pages: Math.ceil(total / perPage) } };
}
/**
 * Mark messages as read in a conversation for a given user (mark messages sent by others).
 */
async function markConversationRead(conversationId, userId) {
    const now = new Date();
    const res = await prisma_1.prisma.message.updateMany({
        where: {
            conversationId,
            senderId: { not: userId },
            readAt: null,
        },
        data: { readAt: now },
    });
    return { marked: res.count };
}
