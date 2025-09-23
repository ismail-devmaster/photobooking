"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMessage = createMessage;
// src/services/message.service.ts
const prisma_1 = require("../config/prisma");
const client_1 = require("@prisma/client");
const notificationService = __importStar(require("./notification.service"));
async function createMessage(conversationId, senderId, content, attachments) {
    // load conversation & ensure sender is participant
    const conversation = await prisma_1.prisma.conversation.findUnique({
        where: { id: conversationId },
    });
    if (!conversation)
        throw new Error('Conversation not found');
    if (conversation.participantAId !== senderId && conversation.participantBId !== senderId) {
        throw new Error('Sender not a participant');
    }
    // create message
    const msg = await prisma_1.prisma.message.create({
        data: {
            conversationId,
            senderId,
            content: content ?? null,
            attachments: attachments && attachments.length ? attachments : null,
        },
    });
    // update conversation lastActiveAt
    await prisma_1.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastActiveAt: new Date() },
    });
    // create notification for the other participant
    const otherUserId = conversation.participantAId === senderId ? conversation.participantBId : conversation.participantAId;
    if (otherUserId) {
        await notificationService.createNotification(otherUserId, client_1.NotificationType.MESSAGE_RECEIVED, {
            conversationId, messageId: msg.id, senderId,
        });
    }
    return msg;
}
