"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listConversationsQuery = exports.conversationIdParam = exports.createConversationSchema = void 0;
// src/validators/conversation.schemas.ts
const zod_1 = require("zod");
exports.createConversationSchema = zod_1.z.object({
    participantId: zod_1.z.string().cuid(), // the other user's id
});
exports.conversationIdParam = zod_1.z.object({
    id: zod_1.z.string().cuid(),
});
exports.listConversationsQuery = zod_1.z.object({
    page: zod_1.z.preprocess((v) => (v === undefined ? 1 : Number(v)), zod_1.z.number().int().positive().default(1)),
    perPage: zod_1.z.preprocess((v) => (v === undefined ? 20 : Number(v)), zod_1.z.number().int().positive().default(20)),
});
