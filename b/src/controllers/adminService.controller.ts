// src/controllers/adminService.controller.ts
import { Request, Response } from 'express';
import * as serviceService from '../services/service.service';

export async function createServiceHandler(req: Request, res: Response) {
  try {
    const { name, slug, description, categoryId } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const rec = await serviceService.createService({ name, slug, description, categoryId });
    return res.status(201).json(rec);
  } catch (err: any) {
    console.error('createService error', err);
    return res.status(400).json({ error: err.message || 'Could not create service' });
  }
}

export async function listServicesHandler(req: Request, res: Response) {
  try {
    const page = Number(req.query.page || 1);
    const perPage = Number(req.query.perPage || 50);
    const categoryId = req.query.categoryId ? String(req.query.categoryId) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;
    const result = await serviceService.listServices({ page, perPage, categoryId, search });
    return res.json(result);
  } catch (err: any) {
    console.error('listServices error', err);
    return res.status(500).json({ error: 'Could not list services' });
  }
}

export async function updateServiceHandler(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const { name, slug, description, categoryId } = req.body;
    const updated = await serviceService.updateService(id, { name, slug, description, categoryId });
    return res.json(updated);
  } catch (err: any) {
    console.error('updateService error', err);
    return res.status(400).json({ error: err.message || 'Could not update service' });
  }
}

export async function deleteServiceHandler(req: Request, res: Response) {
  try {
    const id = req.params.id;
    await serviceService.deleteService(id);
    return res.json({ ok: true });
  } catch (err: any) {
    console.error('deleteService error', err);
    return res.status(400).json({ error: err.message || 'Could not delete service' });
  }
}
