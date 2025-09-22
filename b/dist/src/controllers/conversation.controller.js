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
exports.createConversation = createConversation;
exports.listConversations = listConversations;
exports.getMessages = getMessages;
exports.markRead = markRead;
const convService = __importStar(require("../services/conversation.service"));
const conversation_schemas_1 = require("../validators/conversation.schemas");
const conversationService = __importStar(require("../services/conversation.service"));
async function createConversation(req, res) {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const parsed = conversation_schemas_1.createConversationSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'Invalid input', issues: parsed.error.issues });
        const otherId = parsed.data.participantId;
        if (otherId === userId)
            return res.status(400).json({ error: 'Cannot create conversation with self' });
        const conv = await convService.findOrCreateConversation(userId, otherId);
        return res.status(201).json(conv);
    }
    catch (err) {
        console.error('createConversation error:', err);
        return res.status(500).json({ error: err.message || 'Could not create conversation' });
    }
}
async function listConversations(req, res) {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const q = conversation_schemas_1.listConversationsQuery.parse(req.query);
        const result = await convService.listConversationsForUser(userId, q.page, q.perPage);
        return res.json(result);
    }
    catch (err) {
        console.error('listConversations error:', err);
        return res.status(500).json({ error: 'Could not list conversations' });
    }
}
async function getMessages(req, res) {
    try {
        const userId = req.userId; // من الـ auth middleware
        const otherUserId = req.params.id; // من /conversations/:id/messages
        const conversation = await conversationService.findOrCreateConversation(userId, otherUserId);
        // جيب الرسائل
        const { page = 1, perPage = 50 } = req.query;
        const messages = await conversationService.getMessages(conversation.id, Number(page), Number(perPage));
        return res.json({ conversation, messages });
    }
    catch (err) {
        if (err.message.includes('participants do not exist')) {
            return res.status(400).json({ error: 'Invalid conversation participants' });
        }
        console.error('getMessages error:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
}
async function markRead(req, res) {
    try {
        const userId = req.userId;
        const pid = conversation_schemas_1.conversationIdParam.safeParse(req.params);
        if (!pid.success)
            return res.status(400).json({ error: 'Invalid conversation id' });
        // check membership
        const conversation = await (require('../config/prisma').prisma).conversation.findUnique({ where: { id: pid.data.id } });
        if (!conversation)
            return res.status(404).json({ error: 'Conversation not found' });
        if (conversation.participantAId !== userId && conversation.participantBId !== userId)
            return res.status(403).json({ error: 'Access denied' });
        const result = await convService.markConversationRead(pid.data.id, userId);
        return res.json(result);
    }
    catch (err) {
        console.error('markRead error:', err);
        return res.status(500).json({ error: err.message || 'Could not mark read' });
    }
}
