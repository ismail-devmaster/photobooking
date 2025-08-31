// src/controllers/booking.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import * as bookingService from '../services/booking.service';
import { createBookingSchema, bookingIdParam } from '../validators/booking.schemas';
import { BookingState } from '@prisma/client';

export async function createBooking(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const parsed = createBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });
    }

    const data = parsed.data;
    const startAt = new Date(data.startAt);
    const endAt = new Date(data.endAt);
    if (startAt >= endAt) return res.status(400).json({ error: 'endAt must be after startAt' });

    // create booking
    const booking = await bookingService.createBooking(userId, {
      photographerId: data.photographerId,
      packageId: data.packageId ?? null,
      startAt,
      endAt,
      location: data.location ?? undefined,
      notes: data.notes ?? undefined,
      priceCents: data.priceCents ?? null,
    });

    return res.status(201).json(booking);
  } catch (err: any) {
    console.error('createBooking error:', err);
    // map a few known errors to HTTP codes
    const msg = err.message || 'Could not create booking';
    if (msg.includes('Photographer not found') || msg.includes('Package')) {
      return res.status(400).json({ error: msg });
    }
    return res.status(500).json({ error: msg });
  }
}

export async function listMyBookings(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const page = Number(req.query.page || '1');
    const perPage = Number(req.query.perPage || '20');

    const result = await bookingService.getBookingsForClient(userId, { page, perPage });
    return res.json(result);
  } catch (err: any) {
    console.error('listMyBookings error:', err);
    return res.status(500).json({ error: 'Could not list bookings' });
  }
}

export async function listReceivedBookings(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const page = Number(req.query.page || '1');
    const perPage = Number(req.query.perPage || '20');

    const result = await bookingService.getBookingsForPhotographerUser(userId, { page, perPage });
    return res.json(result);
  } catch (err: any) {
    console.error('listReceivedBookings error:', err);
    const msg = err.message || 'Could not list received bookings';
    if (msg.includes('Photographer profile not found')) return res.status(400).json({ error: msg });
    return res.status(500).json({ error: msg });
  }
}

export async function getBookingById(req: Request, res: Response) {
  try {
    const parsed = bookingIdParam.safeParse(req.params);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid booking id' });

    const userId = (req as any).userId as string;
    const booking = await bookingService.getBookingByIdForUser(parsed.data.id, userId);
    if (!booking) return res.status(404).json({ error: 'Booking not found or access denied' });
    return res.json(booking);
  } catch (err: any) {
    console.error('getBookingById error:', err);
    return res.status(500).json({ error: 'Could not fetch booking' });
  }
}
