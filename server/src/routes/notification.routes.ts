// src/routes/notification.routes.ts
import { Router } from 'express';
import * as notifCtrl from '../controllers/notification.controller';
import { authenticateAccessToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/me', authenticateAccessToken, notifCtrl.listMyNotifications);
router.patch('/:id/read', authenticateAccessToken, notifCtrl.markRead);
router.post('/read-bulk', authenticateAccessToken, notifCtrl.markReadBulk);

export default router;
