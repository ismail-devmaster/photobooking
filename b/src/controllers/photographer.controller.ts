// src/controllers/photographer.controller.ts
import { Request, Response } from 'express';
import * as photographerService from '../services/photographer.service';
import { photographerListQuery } from '../validators/profile-filter.schemas';
import { verifyAccessToken } from '../utils/jwt';

/**
 * Get all photographers with filtering and pagination
 */
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

    const result = await photographerService.listPhotographers({
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

/**
 * Get photographers filtered by stateId (path param) with optional query filters
 */
export async function listPhotographersByState(req: Request, res: Response) {
  try {
    // Merge path param into query for validation
    const input = { ...req.query, stateId: req.params.stateId } as Record<string, any>;
    const parsed = photographerListQuery.safeParse(input);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid query', issues: parsed.error.issues });
    }

    const q = parsed.data;

    const authHeader = String(req.headers.authorization || '');
    let currentUserId: string | undefined = undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const payload = verifyAccessToken(token);
      if (payload && payload.sub) currentUserId = payload.sub;
    }

    let tagsArr: string[] | undefined = undefined;
    if (q.tags) tagsArr = q.tags.split(',').map((s) => s.trim()).filter(Boolean);

    const result = await photographerService.listPhotographers({
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
    console.error('listPhotographersByState error:', err);
    return res.status(500).json({ error: 'Could not list photographers by state' });
  }
}

/**
 * Get a single photographer by ID
 */
export async function getPhotographer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Photographer ID is required' });
    }

    const photographer = await photographerService.getPhotographerById(id);
    
    if (!photographer) {
      return res.status(404).json({ error: 'Photographer not found' });
    }

    return res.json(photographer);
  } catch (err: any) {
    console.error('getPhotographer error:', err);
    return res.status(500).json({ error: 'Could not fetch photographer' });
  }
}

/**
 * Get photographer statistics (for photographer dashboard)
 */
export async function getPhotographerStats(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    if (!id) {
      return res.status(400).json({ error: 'Photographer ID is required' });
    }

    // Check if user is authorized to view these stats
    // Either the photographer themselves or an admin
    const photographer = await photographerService.getPhotographerById(id);
    if (!photographer) {
      return res.status(404).json({ error: 'Photographer not found' });
    }

    // Check if user is the photographer or admin
    const userRole = (req as any).userRole;
    if (photographer.user.id !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to view photographer stats' });
    }

    const stats = await photographerService.getPhotographerStats(id);
    return res.json(stats);
  } catch (err: any) {
    console.error('getPhotographerStats error:', err);
    return res.status(500).json({ error: 'Could not fetch photographer statistics' });
  }
}
