// src/routes/auth.routes.ts
import { Router } from 'express';
import * as authCtrl from '../controllers/auth.controller';
import { authenticateAccessToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', authCtrl.register);
router.get('/verify-email', authCtrl.verifyEmail); // GET with token & uid query
router.post('/resend-verification', authCtrl.resendVerification);
router.post('/login', authCtrl.login);
router.post('/refresh', authCtrl.refresh); // cookie-based refresh
router.post('/logout', authCtrl.logout);

// Protected example
router.get('/me', authenticateAccessToken, authCtrl.me);

export default router;
