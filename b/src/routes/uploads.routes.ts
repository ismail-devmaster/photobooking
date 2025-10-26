import { Router } from 'express';
import * as uploadsCtrl from '../controllers/uploads.controller';
import { authenticateAccessToken } from '../middlewares/auth.middleware';
import { upload } from '../config/multer';

const router = Router();

// POST /api/v1/uploads - Keep auth for uploads
router.post('/', authenticateAccessToken, upload.single('file'), uploadsCtrl.uploadFile);

// GET /api/v1/uploads/:id - REMOVE auth middleware for public access
router.get('/:id', uploadsCtrl.getById);  // ✅ Remove authenticateAccessToken here

export default router;