import { Router } from 'express';
import * as favCtrl from '../controllers/favorite.controller';
import { authenticateAccessToken } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

// client-only add/remove/list
router.post('/:photographerId', authenticateAccessToken, requireRole(Role.CLIENT), favCtrl.createFavorite);
router.delete('/:photographerId', authenticateAccessToken, requireRole(Role.CLIENT), favCtrl.deleteFavorite);
router.get('/', authenticateAccessToken, requireRole(Role.CLIENT), favCtrl.listMyFavorites);

export default router;
