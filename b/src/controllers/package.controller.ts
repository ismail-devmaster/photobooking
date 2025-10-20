import { Request, Response } from 'express';
import * as pkgService from '../services/package.service';
import { listAllPackages } from '../services/package.service';
import { createPackageSchema, updatePackageSchema } from '../validators/package.schemas';

export async function createPackage(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    // photographerId must be retrieved from Photographer table by userId
    const photographer = await (require('../config/prisma').prisma).photographer.findUnique({ where: { userId } });
    if (!photographer) return res.status(400).json({ error: 'Photographer profile not found' });

    const parsed = createPackageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });

    const created = await pkgService.createPackage(photographer.id, parsed.data);
    return res.status(201).json(created);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Could not create package' });
  }
}

export async function updatePackage(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const photographer = await (require('../config/prisma').prisma).photographer.findUnique({ where: { userId } });
    if (!photographer) return res.status(400).json({ error: 'Photographer profile not found' });

    const { id } = req.params;
    const parsed = updatePackageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });

    const updated = await pkgService.updatePackage(id, photographer.id, parsed.data);
    return res.json(updated);
  } catch (err: any) {
    console.error(err);
    const msg = err.message || 'Could not update package';
    if (msg.includes('Not authorized')) return res.status(403).json({ error: msg });
    return res.status(500).json({ error: msg });
  }
}

export async function deletePackage(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const photographer = await (require('../config/prisma').prisma).photographer.findUnique({ where: { userId } });
    if (!photographer) return res.status(400).json({ error: 'Photographer profile not found' });

    const { id } = req.params;
    await pkgService.deletePackage(id, photographer.id);
    return res.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    const msg = err.message || 'Could not delete package';
    if (msg.includes('Not authorized')) return res.status(403).json({ error: msg });
    return res.status(500).json({ error: msg });
  }
}

export async function getPackagesForPhotographer(req: Request, res: Response) {
  try {
    const { id } = req.params; // photographer id
    const list = await pkgService.listPackagesForPhotographer(id);
    return res.json(list);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Could not list packages' });
  }
}

export async function getAllPackages(req: Request, res: Response) {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const perPage = req.query.perPage ? Number(req.query.perPage) : undefined;

    const result = await listAllPackages({ page, perPage });
    return res.json(result);
  } catch (err: any) {
    console.error('getAllPackages error', err);
    return res.status(500).json({ error: 'Could not list packages' });
  }
}