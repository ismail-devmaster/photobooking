// src/routes/admin.review.routes.ts
import { Router } from 'express';
import * as adminCtrl from '../controllers/admin.review.controller';
import { authenticateAccessToken } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', authenticateAccessToken, requireRole(Role.ADMIN), adminCtrl.listAllReviews);
router.patch('/:id', authenticateAccessToken, requireRole(Role.ADMIN), adminCtrl.moderateReview);

export default router;
