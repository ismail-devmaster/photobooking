// src/routes/admin.stats.routes.ts
import { Router } from 'express';
import * as statsCtrl from '../controllers/admin.stats.controller';
import { authenticateAccessToken } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/isAdmin.middleware';

const router = Router();

// Admin stats endpoints
router.get('/stats/overview', authenticateAccessToken, isAdmin, statsCtrl.overview);
router.get('/stats/bookings-timeseries', authenticateAccessToken, isAdmin, statsCtrl.bookingsTimeSeries);
router.get('/stats/bookings-by-state', authenticateAccessToken, isAdmin, statsCtrl.bookingsByState);
router.get('/stats/revenue-by-month', authenticateAccessToken, isAdmin, statsCtrl.revenueByMonth);
router.get('/stats/top-photographers', authenticateAccessToken, isAdmin, statsCtrl.topPhotographers);
router.get('/stats/recent-users', authenticateAccessToken, isAdmin, statsCtrl.recentUsers);

export default router;
