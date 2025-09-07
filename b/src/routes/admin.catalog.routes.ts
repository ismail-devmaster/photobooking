// src/routes/admin.catalog.routes.ts
import { Router } from 'express';
import * as adminServiceCtrl from '../controllers/adminService.controller';
import * as adminCatCtrl from '../controllers/adminCategory.controller';
import { authenticateAccessToken } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/isAdmin.middleware';

const router = Router();

// --- Categories ---
router.post('/categories', authenticateAccessToken, isAdmin, adminCatCtrl.createCategory);
router.get('/categories', authenticateAccessToken, isAdmin, adminCatCtrl.listCategories);
router.put('/categories/:id', authenticateAccessToken, isAdmin, adminCatCtrl.updateCategory);
router.delete('/categories/:id', authenticateAccessToken, isAdmin, adminCatCtrl.deleteCategory);

// --- Services ---
router.post('/services', authenticateAccessToken, isAdmin, adminServiceCtrl.createServiceHandler);
router.get('/services', authenticateAccessToken, isAdmin, adminServiceCtrl.listServicesHandler);
router.put('/services/:id', authenticateAccessToken, isAdmin, adminServiceCtrl.updateServiceHandler);
router.delete('/services/:id', authenticateAccessToken, isAdmin, adminServiceCtrl.deleteServiceHandler);

export default router;
