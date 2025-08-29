// src/controllers/profile.controller.ts
import { Request, Response } from 'express';
import * as profileService from '../services/profile.service';

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
    const { stateId, serviceId, page = 1, perPage = 12 } = req.query;
    const result = await profileService.listPhotographers({ stateId, serviceId, page, perPage });
    return res.json(result);
  } catch (err: any) {
    console.error(err);
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
