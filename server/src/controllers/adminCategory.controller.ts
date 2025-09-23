// src/controllers/adminCategory.controller.ts
import { Request, Response } from 'express';
import * as categoryService from '../services/category.service';

export async function createCategory(req: Request, res: Response) {
  try {
    const { name, slug, description } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });

    const rec = await categoryService.createCategory({ name, slug, description });
    return res.status(201).json(rec);
  } catch (err: any) {
    console.error('createCategory error', err);
    return res.status(400).json({ error: err.message || 'Could not create category' });
  }
}

export async function listCategories(req: Request, res: Response) {
  try {
    const page = Number(req.query.page || 1);
    const perPage = Number(req.query.perPage || 50);
    const result = await categoryService.listCategories({ page, perPage });
    return res.json(result);
  } catch (err: any) {
    console.error('listCategories error', err);
    return res.status(500).json({ error: 'Could not list categories' });
  }
}

export async function updateCategory(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const { name, slug, description } = req.body;
    const updated = await categoryService.updateCategory(id, { name, slug, description });
    return res.json(updated);
  } catch (err: any) {
    console.error('updateCategory error', err);
    return res.status(400).json({ error: err.message || 'Could not update category' });
  }
}

export async function deleteCategory(req: Request, res: Response) {
  try {
    const id = req.params.id;
    await categoryService.deleteCategory(id);
    return res.json({ ok: true });
  } catch (err: any) {
    console.error('deleteCategory error', err);
    return res.status(400).json({ error: err.message || 'Could not delete category' });
  }
}
