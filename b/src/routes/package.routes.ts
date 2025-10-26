import { Router } from 'express';
import * as pkgCtrl from '../controllers/package.controller';
import { authenticateAccessToken } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

// photographer-only create/update/delete
// router.post('/', authenticateAccessToken, requireRole(Role.PHOTOGRAPHER), pkgCtrl.createPackage);
router.post('/', authenticateAccessToken, pkgCtrl.createPackage);
router.put('/:id', authenticateAccessToken, requireRole(Role.PHOTOGRAPHER), pkgCtrl.updatePackage);
router.delete('/:id', authenticateAccessToken, requireRole(Role.PHOTOGRAPHER), pkgCtrl.deletePackage);

// public listing all packages
router.get('/', pkgCtrl.getAllPackages);

// public listing by photographer
router.get('/photographer/:id', pkgCtrl.getPackagesForPhotographer);

export default router;
