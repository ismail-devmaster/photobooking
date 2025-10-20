// src/controllers/admin.review.controller.ts
import { Request, Response } from 'express';
import { adminReviewActionSchema, reviewIdParam } from '../validators/review.schemas';
import * as reviewService from '../services/review.service';
import { ReviewStatus } from '@prisma/client';

export async function listAllReviews(req: Request, res: Response) {
  try {
    const status = (req.query.status as string | undefined) as ReviewStatus | undefined;
    const page = Number(req.query.page || '1');
    const perPage = Number(req.query.perPage || '50');

    const result = await reviewService.adminListReviews({ status, page, perPage });
    return res.json(result);
  } catch (err: any) {
    console.error('admin listAllReviews error:', err);
    return res.status(500).json({ error: 'Could not fetch reviews' });
  }
}

export async function moderateReview(req: Request, res: Response) {
  try {
    const idParsed = reviewIdParam.safeParse(req.params);
    if (!idParsed.success) return res.status(400).json({ error: 'Invalid review id' });

    const bodyParsed = adminReviewActionSchema.safeParse(req.body);
    if (!bodyParsed.success) return res.status(400).json({ error: 'Validation failed', issues: bodyParsed.error.issues });

    const adminUserId = req.userId;
    if (!adminUserId) return res.status(401).json({ error: 'Unauthorized' });

    const { action, reason } = bodyParsed.data;
    const updated = await reviewService.adminModerateReview(adminUserId, idParsed.data.id, action, reason);
    return res.json(updated);
  } catch (err: any) {
    console.error('moderateReview error:', err);
    const msg = err.message || 'Could not moderate review';
    if (/not found/i.test(msg)) return res.status(404).json({ error: msg });
    return res.status(400).json({ error: msg });
  }
}
