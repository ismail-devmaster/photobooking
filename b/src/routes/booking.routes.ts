// src/routes/booking.routes.ts
import { Router } from 'express';
import * as bookingCtrl from '../controllers/booking.controller';
import { updateBookingState } from '../controllers/booking-state.controller';
import { authenticateAccessToken } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

// create booking (client only)
router.post('/', authenticateAccessToken, requireRole(Role.CLIENT), bookingCtrl.createBooking);

// client bookings
router.get('/me', authenticateAccessToken, bookingCtrl.listMyBookings);

// photographer received bookings
router.get('/received', authenticateAccessToken, requireRole(Role.PHOTOGRAPHER), bookingCtrl.listReceivedBookings);

// booking detail (client or photographer)
router.get('/:id', authenticateAccessToken, bookingCtrl.getBookingById);

router.patch('/:id/state',
    authenticateAccessToken,
    requireRole(Role.CLIENT, Role.PHOTOGRAPHER, Role.ADMIN),
    updateBookingState
  );

export default router;
