// src/routes/photographer.routes.ts
import { Router } from 'express';
import * as photographerCtrl from '../controllers/photographer.controller';
import { authenticateAccessToken } from '../middlewares/auth.middleware';

const router = Router();

// Public routes - no authentication required
router.get('/', photographerCtrl.listPhotographers);
router.get('/state/:stateId', photographerCtrl.listPhotographersByState);
router.get('/:id', photographerCtrl.getPhotographer);

// Protected routes - require authentication
router.get('/:id/stats', authenticateAccessToken, photographerCtrl.getPhotographerStats);

export default router;
