// src/controllers/review.controller.ts
import { Request, Response } from 'express';
import { createReviewSchema } from '../validators/review.schemas';
import * as reviewService from '../services/review.service';

export async function createReview(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const parsed = createReviewSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });

    const { bookingId, rating, text } = parsed.data;

    const created = await reviewService.createReview(userId, { bookingId, rating, text });
    return res.status(201).json(created);
  } catch (err: any) {
    const msg = err.message || 'Could not create review';
    if (/Booking not found/i.test(msg)) return res.status(404).json({ error: msg });
    if (/Not allowed to review/i.test(msg)) return res.status(403).json({ error: msg });
    if (/unique constraint|already exists/i.test(msg)) return res.status(409).json({ error: 'Review already exists for this booking' });
    return res.status(400).json({ error: msg });
  }
}

export async function listPhotographerReviews(req: Request, res: Response) {
  try {
    const photographerId = req.params.id;
    const page = Number(req.query.page || '1');
    const perPage = Number(req.query.perPage || '12');

    const results = await reviewService.listApprovedReviewsForPhotographer(photographerId, { page, perPage });
    return res.json(results);
  } catch (err: any) {
    console.error('listPhotographerReviews error:', err);
    return res.status(500).json({ error: 'Could not fetch reviews' });
  }
}

export async function listMyReviews(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const page = Number(req.query.page || '1');
    const perPage = Number(req.query.perPage || '50');

    const result = await reviewService.listReviewsByUser(userId, { page, perPage });
    return res.json(result);
  } catch (err: any) {
    console.error('listMyReviews error:', err);
    return res.status(500).json({ error: 'Could not list reviews' });
  }
}
