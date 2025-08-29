// src/routes/profile.routes.ts
import { Router } from 'express';
import * as profileCtrl from '../controllers/profile.controller';
import { authenticateAccessToken } from '../middlewares/auth.middleware';

const router = Router();

// protected profile endpoints
router.get('/me', authenticateAccessToken, profileCtrl.getMyProfile);
router.put('/me', authenticateAccessToken, profileCtrl.updateMyProfile);

// public photographers listing and detail
router.get('/photographers', profileCtrl.listPhotographers);
router.get('/photographers/:id', profileCtrl.getPhotographer);

export default router;
