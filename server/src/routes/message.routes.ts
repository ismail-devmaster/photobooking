// src/routes/message.routes.ts
import { Router } from 'express';
import * as msgCtrl from '../controllers/message.controller';
import { authenticateAccessToken } from '../middlewares/auth.middleware';
import { upload } from '../config/multer';

const router = Router();

// direct send (creates conversation if needed). Accepts multipart/form-data for attachments.
router.post('/', authenticateAccessToken, upload.array('attachments', 5), msgCtrl.sendMessage);

export default router;
