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
// src/routes/conversation.routes.ts
const express_1 = require("express");
const convCtrl = __importStar(require("../controllers/conversation.controller"));
const msgCtrl = __importStar(require("../controllers/message.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const multer_1 = require("../config/multer"); // multer config
const router = (0, express_1.Router)();
// create conversation (or find existing)
router.post('/', auth_middleware_1.authenticateAccessToken, convCtrl.createConversation);
// list my conversations
router.get('/', auth_middleware_1.authenticateAccessToken, convCtrl.listConversations);
// get messages in a conversation
router.get('/:id/messages', auth_middleware_1.authenticateAccessToken, convCtrl.getMessages);
// send message in conversation (with optional attachments)
router.post('/:id/messages', auth_middleware_1.authenticateAccessToken, multer_1.upload.array('attachments', 5), async (req, res, next) => {
    // inject conversationId into body and forward to sendMessage handler
    req.body.conversationId = req.params.id;
    return msgCtrl.sendMessage(req, res);
});
// mark conversation read
router.patch('/:id/read', auth_middleware_1.authenticateAccessToken, convCtrl.markRead);
exports.default = router;
