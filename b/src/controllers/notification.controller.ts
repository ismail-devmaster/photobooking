// src/controllers/notification.controller.ts
import { Request, Response } from 'express';
import * as notificationService from '../services/notification.service';

export async function listMyNotifications(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const page = Number(req.query.page || 1);
    const perPage = Number(req.query.perPage || 20);
    const result = await notificationService.listNotificationsForUser(userId, page, perPage);
    return res.json(result);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Could not fetch notifications' });
  }
}

export async function markRead(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const id = req.params.id;
    const updated = await notificationService.markNotificationRead(userId, id);
    return res.json(updated);
  } catch (err: any) {
    console.error(err);
    return res.status(400).json({ error: err.message || 'Could not mark read' });
  }
}

export async function markReadBulk(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const ids = (req.body.ids as string[]) || [];
    const result = await notificationService.markNotificationsReadBulk(userId, ids);
    return res.json(result);
  } catch (err: any) {
    console.error(err);
    return res.status(400).json({ error: err.message || 'Could not mark read' });
  }
}
