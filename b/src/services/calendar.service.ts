// src/services/calendar.service.ts
import { prisma } from '../config/prisma';
import { subMilliseconds } from 'date-fns';

/**
 * Create a calendar block/event for a photographer (e.g., vacation, blocked time).
 * - startAt, endAt are Date or ISO strings.
 */
export async function createCalendarEvent(photographerId: string, payload: {
  startAt: string | Date;
  endAt: string | Date;
  title?: string | null;
  type?: 'blocked' | 'available' | 'note';
  createdById?: string | null;
}) {
  const start = new Date(payload.startAt);
  const end = new Date(payload.endAt);
  if (end <= start) throw new Error('endAt must be after startAt');

  // optional: prevent overlapping event creation? we allow overlapping blocks (photographer can create multiple),
  // but it's reasonable to disallow perfect overlaps - keep simple: allow but warn upstream.
  const rec = await prisma.calendarEvent.create({
    data: {
      photographerId,
      startAt: start,
      endAt: end,
      title: payload.title ?? null,
      type: payload.type ?? 'blocked',
      createdById: payload.createdById ?? null,
    },
  });

  return rec;
}

/**
 * Delete a calendar event (photographer only).
 */
export async function deleteCalendarEvent(eventId: string, photographerId: string) {
  // verify owner
  const rec = await prisma.calendarEvent.findUnique({ where: { id: eventId } });
  if (!rec) throw new Error('Event not found');
  if (rec.photographerId !== photographerId) throw new Error('Not authorized');

  return prisma.calendarEvent.delete({ where: { id: eventId } });
}

/**
 * List calendar items (merged) for a photographer between from..to.
 * Returns both CalendarEvent and Booking busy entries.
 *
 * - includeBookings: true includes booking events (recommended)
 */
export async function listCalendarForPhotographer(photographerId: string, from: Date, to: Date, includeBookings = true) {
  // fetch calendar events (blocks)
  const eventsPromise = prisma.calendarEvent.findMany({
    where: {
      photographerId,
      OR: [
        { startAt: { lte: to }, endAt: { gte: from } },
      ],
    },
    orderBy: { startAt: 'asc' },
  });

  // fetch bookings that intersect range
  const bookingsPromise = includeBookings ? prisma.booking.findMany({
    where: {
      photographerId,
      AND: [
        { startAt: { lte: to } },
        { endAt: { gte: from } },
      ],
    },
    include: {
      client: { select: { id: true, name: true } },
    },
    orderBy: { startAt: 'asc' },
  }) : Promise.resolve([]);

  const [events, bookings] = await Promise.all([eventsPromise, bookingsPromise]);

  // normalize into common shape
  const normalizedEvents: Array<any> = [];

  for (const ev of events) {
    normalizedEvents.push({
      id: `ce_${ev.id}`,
      type: ev.type,
      title: ev.title || 'Blocked',
      startAt: ev.startAt,
      endAt: ev.endAt,
      source: 'calendar_event',
    });
  }

  for (const b of bookings) {
    normalizedEvents.push({
      id: `bk_${b.id}`,
      type: 'booking',
      title: `Booking (${b.client?.name ?? 'client'})`,
      startAt: b.startAt,
      endAt: b.endAt,
      bookingId: b.id,
      source: 'booking',
      state: b.state,
    });
  }

  // sort by startAt
  normalizedEvents.sort((a, b) => (a.startAt as Date).getTime() - (b.startAt as Date).getTime());

  return normalizedEvents;
}

/**
 * Check if a photographer is available for an interval [startAt, endAt)
 * - returns true if no conflict with accepted/confirmed bookings and calendar blocks
 * - allowOverlapWithPending: whether pending bookings should block (false by default)
 *
 * Logic:
 *  - conflict if any booking with state !== cancelled & that intersects interval (we consider requested/pending/confirmed/in_progress/completed? you want to prevent double-booking for requested/pending/confirmed/in_progress)
 *  - and conflict if any calendarEvent intersects interval.
 */
export async function isPhotographerAvailable(photographerId: string, startAt: Date, endAt: Date, opts?: { includePending?: boolean }) {
  if (endAt <= startAt) throw new Error('endAt must be after startAt');

  // bookings conflict condition: bookings whose start < end && end > start (overlap)
  // choose states considered busy:
  const busyStates = opts?.includePending ? [
    'requested', 'pending_payment', 'confirmed', 'in_progress'
  ] : ['confirmed', 'in_progress'];

  const bookingConflict = await prisma.booking.findFirst({
    where: {
      photographerId,
      state: { in: busyStates as any },
      AND: [
        { startAt: { lt: endAt } },
        { endAt: { gt: startAt } },
      ],
    },
  });

  if (bookingConflict) return false;

  // calendar events conflict
  const evConflict = await prisma.calendarEvent.findFirst({
    where: {
      photographerId,
      AND: [
        { startAt: { lt: endAt } },
        { endAt: { gt: startAt } },
      ],
    },
  });

  if (evConflict) return false;

  return true;
}

/**
 * Utility: get next available slot after a given date range (naive)
 * - scans calendar & bookings until finds gap >= desiredDurationMs
 * - limitSearchDays: how far to search (days)
 */
export async function findNextAvailableSlot(photographerId: string, desiredDurationMs: number, fromDate: Date = new Date(), opts?: { limitSearchDays?: number }) {
  // naive approach: load all events for window and scan gaps
  const limitDays = opts?.limitSearchDays ?? 30;
  const endWindow = new Date(fromDate.getTime() + limitDays * 24 * 60 * 60 * 1000);

  const items = await listCalendarForPhotographer(photographerId, fromDate, endWindow, true);
  // items sorted
  // ensure we consider period before first item
  let cursor = fromDate;

  for (const it of items) {
    const itStart = new Date(it.startAt);
    const itEnd = new Date(it.endAt);

    // if there's a gap between cursor and itStart big enough -> return slot
    if (itStart.getTime() - cursor.getTime() >= desiredDurationMs) {
      return { startAt: cursor, endAt: new Date(cursor.getTime() + desiredDurationMs) };
    }

    // move cursor to max(cursor, itEnd)
    if (itEnd.getTime() > cursor.getTime()) cursor = new Date(itEnd.getTime() + 1); // small offset to avoid touches
  }

  // after all items, return slot at cursor
  return { startAt: cursor, endAt: new Date(cursor.getTime() + desiredDurationMs) };
}
