import { Request, Response } from 'express';
import * as favService from '../services/favorite.service';
import { photographerIdParam, listFavoritesQuery } from '../validators/favorite.schemas';

export async function createFavorite(req: Request, res: Response) {
  try {
    const parsed = photographerIdParam.safeParse(req.params);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid photographer id' });

    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const photographerId = parsed.data.photographerId;
    const created = await favService.addFavorite(userId, photographerId);
    return res.status(201).json(created);
  } catch (err: any) {
    console.error('createFavorite error:', err);
    return res.status(500).json({ error: err.message || 'Could not add favorite' });
  }
}

export async function deleteFavorite(req: Request, res: Response) {
  try {
    const parsed = photographerIdParam.safeParse(req.params);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid photographer id' });

    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const rec = await favService.removeFavorite(userId, parsed.data.photographerId);
    if (!rec) return res.status(404).json({ error: 'Favorite not found' });
    return res.json({ ok: true });
  } catch (err: any) {
    console.error('deleteFavorite error:', err);
    return res.status(500).json({ error: err.message || 'Could not remove favorite' });
  }
}

export async function listMyFavorites(req: Request, res: Response) {
  try {
    const qp = listFavoritesQuery.parse(req.query);
    const page = qp.page ?? 1;
    const perPage = qp.perPage ?? 12;
    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await favService.listFavorites(userId, page, perPage);
    return res.json(result);
  } catch (err: any) {
    console.error('listMyFavorites error:', err);
    return res.status(500).json({ error: err.message || 'Could not list favorites' });
  }
}
