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
exports.listMyNotifications = listMyNotifications;
exports.markRead = markRead;
exports.markReadBulk = markReadBulk;
exports.markAllRead = markAllRead;
exports.deleteAllRead = deleteAllRead;
const notificationService = __importStar(require("../services/notification.service"));
async function listMyNotifications(req, res) {
    try {
        const userId = req.userId;
        const page = Number(req.query.page || 1);
        const perPage = Number(req.query.perPage || 20);
        const result = await notificationService.listNotificationsForUser(userId, page, perPage);
        return res.json(result);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Could not fetch notifications' });
    }
}
async function markRead(req, res) {
    try {
        const userId = req.userId;
        const id = req.params.id;
        const updated = await notificationService.markNotificationRead(userId, id);
        return res.json(updated);
    }
    catch (err) {
        console.error(err);
        return res.status(400).json({ error: err.message || 'Could not mark read' });
    }
}
async function markReadBulk(req, res) {
    try {
        const userId = req.userId;
        const ids = req.body.ids || [];
        const result = await notificationService.markNotificationsReadBulk(userId, ids);
        return res.json(result);
    }
    catch (err) {
        console.error(err);
        return res.status(400).json({ error: err.message || 'Could not mark read' });
    }
}
async function markAllRead(req, res) {
    try {
        const userId = req.userId;
        const result = await notificationService.markAllNotificationsRead(userId);
        return res.json(result);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Could not mark all notifications as read' });
    }
}
async function deleteAllRead(req, res) {
    try {
        const userId = req.userId;
        const result = await notificationService.deleteAllReadNotifications(userId);
        return res.json(result);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Could not delete read notifications' });
    }
}
