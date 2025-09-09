// src/controllers/calendar.controller.ts
import { Request, Response } from 'express';
import * as calendarService from '../services/calendar.service';
import { Role } from '@prisma/client';

export async function createBlock(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    // assume photographer profile exists - you can fetch photographer by userId
    const photographer = await require('../config/prisma').prisma.photographer.findUnique({
      where: { userId },
    });
    if (!photographer) return res.status(400).json({ error: 'Photographer profile not found' });

    const { startAt, endAt, title, type } = req.body;
    if (!startAt || !endAt) return res.status(400).json({ error: 'startAt and endAt required' });

    const rec = await calendarService.createCalendarEvent(photographer.id, {
      startAt,
      endAt,
      title,
      type,
      createdById: userId,
    });

    return res.status(201).json(rec);
  } catch (err: any) {
    console.error('createBlock error', err);
    return res.status(400).json({ error: err.message || 'Could not create calendar event' });
  }
}

export async function deleteBlock(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const photographer = await require('../config/prisma').prisma.photographer.findUnique({
      where: { userId },
    });
    if (!photographer) return res.status(400).json({ error: 'Photographer profile not found' });

    const { id } = req.params;
    await calendarService.deleteCalendarEvent(id, photographer.id);
    return res.json({ ok: true });
  } catch (err: any) {
    console.error('deleteBlock error', err);
    return res.status(400).json({ error: err.message || 'Could not delete calendar event' });
  }
}

export async function getPhotographerCalendar(req: Request, res: Response) {
  try {
    const photographerId = req.params.id as string;
    const fromQ = req.query.from ? new Date(String(req.query.from)) : new Date();
    const toQ = req.query.to
      ? new Date(String(req.query.to))
      : new Date(fromQ.getTime() + 30 * 24 * 60 * 60 * 1000); // default 30 days
    const items = await calendarService.listCalendarForPhotographer(
      photographerId,
      fromQ,
      toQ,
      true,
    );
    return res.json({ items });
  } catch (err: any) {
    console.error('getPhotographerCalendar error', err);
    return res.status(500).json({ error: err.message || 'Could not fetch calendar' });
  }
}

/**
 * Availability quick-check
 * Query params: start, end (ISO)
 */
export async function checkAvailability(req: Request, res: Response) {
  try {
    const photographerId = req.params.id as string;
    const start = req.query.start ? new Date(String(req.query.start)) : null;
    const end = req.query.end ? new Date(String(req.query.end)) : null;
    if (!start || !end)
      return res.status(400).json({ error: 'start and end query params required (ISO)' });

    const available = await calendarService.isPhotographerAvailable(photographerId, start, end, {
      includePending: false,
    });
    return res.json({ available });
  } catch (err: any) {
    console.error('checkAvailability error', err);
    return res.status(500).json({ error: err.message || 'Could not check availability' });
  }
}
