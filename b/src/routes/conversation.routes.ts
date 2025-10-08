// src/routes/conversation.routes.ts
import { Router } from 'express';
import * as convCtrl from '../controllers/conversation.controller';
import * as msgCtrl from '../controllers/message.controller';
import { authenticateAccessToken } from '../middlewares/auth.middleware';
import { upload } from '../config/multer'; // multer config

const router = Router();

// create conversation (or find existing)
router.post('/', authenticateAccessToken, convCtrl.createConversation);

// list my conversations
router.get('/', authenticateAccessToken, convCtrl.listConversations);

// get messages in a conversation (where :id is conversationId)
router.get('/:id/messages', authenticateAccessToken, convCtrl.getMessages);

// send message in conversation (where :id is conversationId, with optional attachments)
router.post('/:id/messages', authenticateAccessToken, upload.array('attachments', 5), async (req, res, next) => {
  // inject conversationId into body and forward to sendMessage handler
  req.body.conversationId = req.params.id;
  return msgCtrl.sendMessage(req, res);
});

// mark conversation read (where :id is conversationId)
router.patch('/:id/read', authenticateAccessToken, convCtrl.markRead);

export default router;
