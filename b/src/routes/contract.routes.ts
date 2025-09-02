// src/routes/contract.routes.ts
import { Router } from 'express';
import * as contractCtrl from '../controllers/contract.controller';
import { authenticateAccessToken } from '../middlewares/auth.middleware';

const router = Router();

// generate for a booking
router.post('/generate', authenticateAccessToken, contractCtrl.generateContract);

// download/view pdf
router.get('/:id/download', authenticateAccessToken, contractCtrl.downloadContract);

// get contract status
router.get('/:id/status', authenticateAccessToken, contractCtrl.getContractStatus);

// sign contract
router.post('/:id/sign', authenticateAccessToken, contractCtrl.signContract);

export default router;
