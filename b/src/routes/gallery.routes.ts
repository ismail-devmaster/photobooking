import { Router } from 'express';
import * as galleryCtrl from '../controllers/gallery.controller';
import { authenticateAccessToken } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { Role } from '@prisma/client';
import { upload } from '../config/multer';

const router = Router();

router.post('/', authenticateAccessToken, requireRole(Role.PHOTOGRAPHER), upload.single('image'), galleryCtrl.uploadImage);
router.delete('/:id', authenticateAccessToken, requireRole(Role.PHOTOGRAPHER), galleryCtrl.deleteImage);

// public listing
router.get('/photographer/:id', galleryCtrl.listGallery);

export default router;
