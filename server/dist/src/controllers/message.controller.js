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
exports.sendMessage = sendMessage;
const message_schemas_1 = require("../validators/message.schemas");
const convService = __importStar(require("../services/conversation.service"));
const msgService = __importStar(require("../services/message.service"));
const APP_BASE_URL = process.env.APP_BASE_URL?.replace(/\/$/, '') || 'http://localhost:4000';
// helper to build attachments meta from multer files
function attachmentsFromFiles(files) {
    if (!files || !Array.isArray(files) || files.length === 0)
        return [];
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
async function sendMessage(req, res) {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const parsed = message_schemas_1.sendMessageSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'Invalid payload', issues: parsed.error.issues });
        const { conversationId, recipientId, content } = parsed.data;
        const files = req.files ?? [];
        const attachments = attachmentsFromFiles(files);
        if (!content && attachments.length === 0) {
            return res.status(400).json({ error: 'Message must have content or attachments' });
        }
        // decide conversation
        let convId = conversationId;
        if (!convId) {
            if (!recipientId)
                return res.status(400).json({ error: 'recipientId required when conversationId not provided' });
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
    }
    catch (err) {
        console.error('sendMessage error:', err);
        const msg = err.message || 'Could not send message';
        if (/Conversation not found/i.test(msg))
            return res.status(404).json({ error: msg });
        if (/Sender not a participant/i.test(msg))
            return res.status(403).json({ error: msg });
        if (/Cannot create conversation with self/i.test(msg))
            return res.status(400).json({ error: msg });
        return res.status(500).json({ error: msg });
    }
}
