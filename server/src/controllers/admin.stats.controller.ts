// src/controllers/admin.stats.controller.ts
import { Request, Response } from 'express';
import * as statsService from '../services/adminStats.service';
import { subDays } from 'date-fns';

export async function overview(req: Request, res: Response) {
  try {
    const cacheSeconds = Number(process.env.ADMIN_STATS_CACHE_SECONDS || 30); // default 30s
    const data = await statsService.getOverviewStats({ cacheSeconds });
    return res.json(data);
  } catch (err: any) {
    console.error('admin.stats.overview error', err);
    return res.status(500).json({ error: err.message || 'Could not fetch overview' });
  }
}

export async function bookingsTimeSeries(req: Request, res: Response) {
  try {
    const days = Math.min(180, Math.max(7, Number(req.query.days || 30)));
    const cacheSeconds = Number(process.env.ADMIN_STATS_CACHE_SECONDS || 30);
    const data = await statsService.getBookingsTimeSeries(days, { cacheSeconds });
    return res.json(data);
  } catch (err: any) {
    console.error('admin.stats.bookingsTimeSeries error', err);
    return res.status(500).json({ error: 'Could not fetch bookings time series' });
  }
}

export async function bookingsByState(req: Request, res: Response) {
  try {
    const sinceDays = req.query.sinceDays ? Number(req.query.sinceDays) : undefined;
    const since = sinceDays ? subDays(new Date(), sinceDays) : undefined;
    const data = await statsService.getBookingsByState({ since });
    return res.json({ data });
  } catch (err: any) {
    console.error('admin.stats.bookingsByState error', err);
    return res.status(500).json({ error: 'Could not fetch bookings by state' });
  }
}

export async function revenueByMonth(req: Request, res: Response) {
  try {
    const months = Math.min(24, Math.max(1, Number(req.query.months || 6)));
    const cacheSeconds = Number(process.env.ADMIN_STATS_CACHE_SECONDS || 30);
    const data = await statsService.getRevenueByMonth(months, { cacheSeconds });
    return res.json(data);
  } catch (err: any) {
    console.error('admin.stats.revenueByMonth error', err);
    return res.status(500).json({ error: 'Could not fetch revenue' });
  }
}

export async function topPhotographers(req: Request, res: Response) {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 10)));
    const data = await statsService.getTopPhotographers(limit);
    return res.json({ items: data });
  } catch (err: any) {
    console.error('admin.stats.topPhotographers error', err);
    return res.status(500).json({ error: 'Could not fetch top photographers' });
  }
}

export async function recentUsers(req: Request, res: Response) {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
    const items = await statsService.getRecentUsers(limit);
    return res.json({ items });
  } catch (err: any) {
    console.error('admin.stats.recentUsers error', err);
    return res.status(500).json({ error: 'Could not fetch recent users' });
  }
}
