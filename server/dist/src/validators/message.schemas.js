"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMessagesQuery = exports.sendMessageSchema = void 0;
// src/validators/message.schemas.ts
const zod_1 = require("zod");
exports.sendMessageSchema = zod_1.z.object({
    // either conversationId OR recipientId (the other user's id) must be present
    conversationId: zod_1.z.string().cuid().optional(),
    recipientId: zod_1.z.string().cuid().optional(),
    content: zod_1.z.string().max(5000).optional(), // optional if attachments present
});
// simple query for messages listing
exports.listMessagesQuery = zod_1.z.object({
    page: zod_1.z.preprocess((v) => (v === undefined ? 1 : Number(v)), zod_1.z.number().int().positive().default(1)),
    perPage: zod_1.z.preprocess((v) => (v === undefined ? 50 : Number(v)), zod_1.z.number().int().positive().default(50)),
});
