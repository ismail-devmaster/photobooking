// src/routes/admin.users.routes.ts
import { Router } from 'express';
import * as adminCtrl from '../controllers/adminUser.controller';
import { authenticateAccessToken } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/isAdmin.middleware';

const router = Router();

// GET /admin/users
router.get('/users', authenticateAccessToken, isAdmin, adminCtrl.listUsers);

// PATCH /admin/users/:id/status
// body: { disabled: boolean }
router.patch('/users/:id/status', authenticateAccessToken, isAdmin, adminCtrl.updateUserStatus);

// DELETE /admin/users/:id
router.delete('/users/:id', authenticateAccessToken, isAdmin, adminCtrl.deleteUser);

export default router;
