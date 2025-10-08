// src/controllers/state.controller.ts
import { Request, Response } from 'express';
import * as stateService from '../services/state.service';

export async function listStates(req: Request, res: Response) {
  try {
    const search = (req.query.search as string) || null;
    const page = req.query.page ? Number(req.query.page) : undefined;
    const perPage = req.query.perPage ? Number(req.query.perPage) : undefined;

    const data = await stateService.listStates({ search, page, perPage });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: 'Could not list states' });
  }
}

export async function listAllStates(req: Request, res: Response) {
  try {
    const items = await stateService.listAllStates();
    return res.json({ items });
  } catch (err: any) {
    return res.status(500).json({ error: 'Could not fetch states' });
  }
}


