// src/routes/calendar.routes.ts
import { Router } from 'express';
import * as calendarCtrl from '../controllers/calendar.controller';
import { authenticateAccessToken } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Photographer manages own calendar blocks
router.post('/', authenticateAccessToken, requireRole(Role.PHOTOGRAPHER), calendarCtrl.createBlock);
router.put(
  '/:id',
  authenticateAccessToken,
  requireRole(Role.PHOTOGRAPHER),
  calendarCtrl.updateBlock,
);
router.delete(
  '/:id',
  authenticateAccessToken,
  requireRole(Role.PHOTOGRAPHER),
  calendarCtrl.deleteBlock,
);

// Public: view calendar for photographer (merged bookings + blocks)
router.get('/photographer/:id', calendarCtrl.getPhotographerCalendar);

// Public: quick availability check
router.get('/photographer/:id/availability', calendarCtrl.checkAvailability);

export default router;
