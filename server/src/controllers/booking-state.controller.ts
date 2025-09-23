// src/controllers/booking-state.controller.ts
import { Request, Response } from 'express';
import { updateBookingStateBody, bookingIdParam } from '../validators/booking.state.schemas';
import { Role } from '@prisma/client';
import { transitionBookingState } from '../services/booking.state.service';

export async function updateBookingState(req: Request, res: Response) {
  try {
    const idParsed = bookingIdParam.safeParse(req.params);
    if (!idParsed.success) return res.status(400).json({ error: 'Invalid booking id' });

    const bodyParsed = updateBookingStateBody.safeParse(req.body);
    if (!bodyParsed.success) {
      return res.status(400).json({ error: 'Validation failed', issues: bodyParsed.error.issues });
    }

    const userId = (req as any).userId as string | undefined;
    const userRole = (req as any).userRole as Role | undefined;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await transitionBookingState({
      bookingId: idParsed.data.id,
      actorUserId: userId,
      actorRole: userRole,
      toState: bodyParsed.data.toState,
      reason: bodyParsed.data.reason,
    });

    return res.json(result);
  } catch (err: any) {
    const msg = err?.message || 'Could not update booking state';
    if (/not found/i.test(msg)) return res.status(404).json({ error: msg });
    if (/Forbidden|not a participant|Transition not allowed/i.test(msg)) {
      return res.status(403).json({ error: msg });
    }
    return res.status(400).json({ error: msg });
  }
}
