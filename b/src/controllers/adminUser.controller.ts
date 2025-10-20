// src/controllers/adminUser.controller.ts
import { Request, Response } from 'express';
import * as adminUserService from '../services/adminUser.service';

export async function listUsers(req: Request, res: Response) {
  try {
    const page = Number(req.query.page || 1);
    const perPage = Number(req.query.perPage || 50);
    const role = req.query.role ? String(req.query.role) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;

    const result = await adminUserService.listUsers({ page, perPage, role, search });
    return res.json(result);
  } catch (err: any) {
    console.error('listUsers error', err);
    return res.status(500).json({ error: err.message || 'Could not list users' });
  }
}

export async function updateUserStatus(req: Request, res: Response) {
  try {
    const adminId = req.userId;
    const userId = req.params.id;
    const { disabled } = req.body;
    if (typeof disabled !== 'boolean') return res.status(400).json({ error: 'disabled boolean required' });

    const updated = await adminUserService.setUserDisabled(adminId, userId, disabled);
    return res.json(updated);
  } catch (err: any) {
    console.error('updateUserStatus error', err);
    return res.status(400).json({ error: err.message || 'Could not update user status' });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const adminId = req.userId;
    const userId = req.params.id;

    await adminUserService.deleteUser(adminId, userId);
    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (err: any) {
    console.error('deleteUser error', err);
    return res.status(400).json({ error: err.message || 'Could not delete user' });
  }
}