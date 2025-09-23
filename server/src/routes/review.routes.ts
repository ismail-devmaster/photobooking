// src/routes/review.routes.ts
import { Router } from 'express';
import * as reviewCtrl from '../controllers/review.controller';
import { authenticateAccessToken } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

// create review (client only)
router.post('/', authenticateAccessToken, requireRole(Role.CLIENT), reviewCtrl.createReview);

// list photographer's public reviews
router.get('/photographer/:id', reviewCtrl.listPhotographerReviews);

// list my reviews (authenticated)
router.get('/me', authenticateAccessToken, reviewCtrl.listMyReviews);

export default router;
