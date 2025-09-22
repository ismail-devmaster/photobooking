"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = uploadImage;
exports.deleteImage = deleteImage;
exports.listGallery = listGallery;
const galleryService = __importStar(require("../services/gallery.service"));
const prisma_1 = require("../config/prisma");
const notificationService = __importStar(require("../services/notification.service"));
const client_1 = require("@prisma/client");
const APP_BASE_URL = process.env.APP_BASE_URL?.replace(/\/$/, '') || 'http://localhost:4000';
async function uploadImage(req, res) {
    try {
        const userId = req.userId;
        const photographer = await prisma_1.prisma.photographer.findUnique({
            where: { userId },
        });
        if (!photographer)
            return res.status(400).json({ error: 'Photographer profile not found' });
        if (!req.file)
            return res.status(400).json({ error: 'No file uploaded' });
        const filePath = req.file.filename; // saved filename in /uploads
        const url = `${APP_BASE_URL}/uploads/${filePath}`;
        let meta = undefined;
        if (req.body.meta) {
            try {
                meta = JSON.parse(req.body.meta);
            }
            catch (e) {
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
        const admins = await prisma_1.prisma.user.findMany({ where: { role: 'ADMIN' } });
        await Promise.all(admins.map((a) => notificationService.createNotification(a.id, client_1.NotificationType.SYSTEM, { ...payload, message: `Photographer ${photographer.id} uploaded an image` })));
        // optionally notify the photographer (useful for audit)
        await notificationService.createNotification(userId, client_1.NotificationType.SYSTEM, { ...payload, message: 'Image uploaded successfully' });
        return res.status(201).json(created);
    }
    catch (err) {
        console.error('uploadImage error:', err);
        return res.status(500).json({ error: err.message || 'Could not upload image' });
    }
}
async function deleteImage(req, res) {
    try {
        const userId = req.userId;
        const photographer = await prisma_1.prisma.photographer.findUnique({
            where: { userId },
        });
        if (!photographer)
            return res.status(400).json({ error: 'Photographer profile not found' });
        const { id } = req.params;
        const rec = await prisma_1.prisma.galleryImage.findUnique({ where: { id } });
        if (!rec)
            return res.status(404).json({ error: 'Image not found' });
        if (rec.photographerId !== photographer.id)
            return res.status(403).json({ error: 'Forbidden' });
        // delete local file (best-effort)
        try {
            const fs = require('fs');
            const pathLib = require('path');
            const filepath = pathLib.join(process.cwd(), 'uploads', rec.url.split('/').pop());
            if (fs.existsSync(filepath))
                fs.unlinkSync(filepath);
        }
        catch (e) {
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
        const admins = await prisma_1.prisma.user.findMany({ where: { role: 'ADMIN' } });
        await Promise.all(admins.map((a) => notificationService.createNotification(a.id, client_1.NotificationType.SYSTEM, { ...payload, message: `Photographer ${photographer.id} deleted an image` })));
        await notificationService.createNotification(userId, client_1.NotificationType.SYSTEM, { ...payload, message: 'Image deleted successfully' });
        return res.json({ ok: true });
    }
    catch (err) {
        console.error('deleteImage error:', err);
        return res.status(500).json({ error: err.message || 'Could not delete image' });
    }
}
async function listGallery(req, res) {
    try {
        const { id } = req.params; // photographer id
        const list = await galleryService.listGalleryForPhotographer(id);
        return res.json(list);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Could not list gallery' });
    }
}
