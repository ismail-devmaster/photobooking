// src/controllers/gallery.controller.ts
import { Request, Response } from 'express';
import * as galleryService from '../services/gallery.service';
import path from 'path';
import { prisma } from '../config/prisma';
import * as notificationService from '../services/notification.service';
import { NotificationType } from '@prisma/client';

const APP_BASE_URL = process.env.APP_BASE_URL?.replace(/\/$/, '') || 'http://localhost:4000';

export async function uploadImage(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const photographer = await prisma.photographer.findUnique({
      where: { userId },
    });
    if (!photographer) return res.status(400).json({ error: 'Photographer profile not found' });

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filePath = req.file.filename; // saved filename in /uploads
    const url = `${APP_BASE_URL}/uploads/${filePath}`;

    let meta = undefined;
    if (req.body.meta) {
      try {
        meta = JSON.parse(req.body.meta);
      } catch (e) {
        meta = { raw: String(req.body.meta) };
      }
    }

    const created = await galleryService.createGalleryImage(photographer.id, url, meta);

    // --- Notifications: notify admins (and photographer themselves if desired) ---
    // Build payload with link to photographer gallery
    const payload = {
      event: 'GALLERY_IMAGE_UPLOADED',
      photographerId: photographer.id,
      imageId: created.id,
      url,
      link: `/gallery/photographer/${photographer.id}`, // frontend route hint
      uploadedByUserId: userId,
      createdAt: created.createdAt,
    };

    // notify all admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    await Promise.all(admins.map((a) => notificationService.createNotification(a.id, NotificationType.SYSTEM, { ...payload, message: `Photographer ${photographer.id} uploaded an image` })));

    // optionally notify the photographer (useful for audit)
    await notificationService.createNotification(userId, NotificationType.SYSTEM, { ...payload, message: 'Image uploaded successfully' });

    return res.status(201).json(created);
  } catch (err: any) {
    console.error('uploadImage error:', err);
    return res.status(500).json({ error: err.message || 'Could not upload image' });
  }
}

export async function deleteImage(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const photographer = await prisma.photographer.findUnique({
      where: { userId },
    });
    if (!photographer) return res.status(400).json({ error: 'Photographer profile not found' });

    const { id } = req.params;
    const rec = await prisma.galleryImage.findUnique({ where: { id } });
    if (!rec) return res.status(404).json({ error: 'Image not found' });
    if (rec.photographerId !== photographer.id) return res.status(403).json({ error: 'Forbidden' });

    // delete local file (best-effort)
    try {
      const fs = require('fs');
      const pathLib = require('path');
      const filepath = pathLib.join(process.cwd(), 'uploads', rec.url.split('/').pop());
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    } catch (e: any) {
      console.warn('Could not remove file from disk', e?.message || e);
    }

    await galleryService.deleteGalleryImage(id, photographer.id);

    // Notify admins + photographer
    const payload = {
      event: 'GALLERY_IMAGE_DELETED',
      photographerId: photographer.id,
      imageId: id,
      link: `/gallery/photographer/${photographer.id}`,
      deletedByUserId: userId,
      createdAt: new Date().toISOString(),
    };

    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    await Promise.all(admins.map((a) => notificationService.createNotification(a.id, NotificationType.SYSTEM, { ...payload, message: `Photographer ${photographer.id} deleted an image` })));

    await notificationService.createNotification(userId, NotificationType.SYSTEM, { ...payload, message: 'Image deleted successfully' });

    return res.json({ ok: true });
  } catch (err: any) {
    console.error('deleteImage error:', err);
    return res.status(500).json({ error: err.message || 'Could not delete image' });
  }
}

export async function listGallery(req: Request, res: Response) {
  try {
    const { id } = req.params; // photographer id
    const list = await galleryService.listGalleryForPhotographer(id);
    return res.json(list);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Could not list gallery' });
  }
}
