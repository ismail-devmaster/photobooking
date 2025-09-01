// src/controllers/profile.controller.ts
import { Request, Response } from 'express';
import * as profileService from '../services/profile.service';
import { photographerListQuery } from '../validators/profile-filter.schemas';
import { verifyAccessToken } from '../utils/jwt';

export async function getMyProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const profile = await profileService.getUserProfile(userId);
    return res.json(profile);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Could not fetch profile' });
  }
}

export async function updateMyProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const payload = req.body;
    const updated = await profileService.updateUserProfile(userId, payload);
    return res.json(updated);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Could not update profile' });
  }
}

export async function listPhotographers(req: Request, res: Response) {
  try {
    const parsed = photographerListQuery.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid query', issues: parsed.error.issues });
    }

    const q = parsed.data;
    // if request provides Authorization: Bearer <token>, try to extract current user id for isFavorited
    const authHeader = String(req.headers.authorization || '');
    let currentUserId: string | undefined = undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const payload = verifyAccessToken(token);
      if (payload && payload.sub) currentUserId = payload.sub;
    }

    // handle tags param (comma separated)
    let tagsArr: string[] | undefined = undefined;
    if (q.tags) tagsArr = q.tags.split(',').map((s) => s.trim()).filter(Boolean);

    const result = await profileService.listPhotographers({
      stateId: q.stateId,
      serviceId: q.serviceId,
      minPrice: q.minPrice,
      maxPrice: q.maxPrice,
      q: q.q,
      tags: tagsArr,
      sort: q.sort,
      page: q.page,
      perPage: q.perPage,
      currentUserId,
    });

    return res.json(result);
  } catch (err: any) {
    console.error('listPhotographers error:', err);
    return res.status(500).json({ error: 'Could not list photographers' });
  }
}

export async function getPhotographer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const photog = await profileService.getPhotographerById(id);
    if (!photog) return res.status(404).json({ error: 'Photographer not found' });
    return res.json(photog);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Could not fetch photographer' });
  }
}
