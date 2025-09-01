// src/controllers/notification.controller.ts
import { Request, Response } from 'express';
import * as notificationService from '../services/notification.service';
import { listNotificationsQuery, notificationIdParam } from '../validators/notification.schemas';

export async function listMyNotifications(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const q = listNotificationsQuery.parse(req.query);
    const result = await notificationService.listNotificationsForUser(userId, q.page, q.perPage);
    return res.json(result);
  } catch (err: any) {
    console.error('listMyNotifications error:', err);
    return res.status(500).json({ error: 'Could not fetch notifications' });
  }
}

export async function markRead(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const pid = notificationIdParam.parse(req.params);
    const updated = await notificationService.markNotificationRead(userId, pid.id);
    return res.json(updated);
  } catch (err: any) {
    console.error('markRead error:', err);
    if (err.message.includes('not found')) return res.status(404).json({ error: err.message });
    if (err.message.includes('Forbidden')) return res.status(403).json({ error: err.message });
    return res.status(400).json({ error: err.message });
  }
}
