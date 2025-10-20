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
exports.createBlock = createBlock;
exports.updateBlock = updateBlock;
exports.deleteBlock = deleteBlock;
exports.getPhotographerCalendar = getPhotographerCalendar;
exports.checkAvailability = checkAvailability;
const calendarService = __importStar(require("../services/calendar.service"));
async function createBlock(req, res) {
    try {
        const userId = req.userId;
        // assume photographer profile exists - you can fetch photographer by userId
        const photographer = await require('../config/prisma').prisma.photographer.findUnique({
            where: { userId },
        });
        if (!photographer)
            return res.status(400).json({ error: 'Photographer profile not found' });
        const { startAt, endAt, title, type } = req.body;
        if (!startAt || !endAt)
            return res.status(400).json({ error: 'startAt and endAt required' });
        const rec = await calendarService.createCalendarEvent(photographer.id, {
            startAt,
            endAt,
            title,
            type,
            createdById: userId,
        });
        return res.status(201).json(rec);
    }
    catch (err) {
        console.error('createBlock error', err);
        return res.status(400).json({ error: err.message || 'Could not create calendar event' });
    }
}
async function updateBlock(req, res) {
    try {
        const userId = req.userId;
        const photographer = await require('../config/prisma').prisma.photographer.findUnique({
            where: { userId },
        });
        if (!photographer)
            return res.status(400).json({ error: 'Photographer profile not found' });
        const { id } = req.params;
        const { startAt, endAt, title, type } = req.body;
        const rec = await calendarService.updateCalendarEvent(id, photographer.id, {
            startAt,
            endAt,
            title,
            type,
        });
        return res.json(rec);
    }
    catch (err) {
        console.error('updateBlock error', err);
        return res.status(400).json({ error: err.message || 'Could not update calendar event' });
    }
}
async function deleteBlock(req, res) {
    try {
        const userId = req.userId;
        const photographer = await require('../config/prisma').prisma.photographer.findUnique({
            where: { userId },
        });
        if (!photographer)
            return res.status(400).json({ error: 'Photographer profile not found' });
        const { id } = req.params;
        await calendarService.deleteCalendarEvent(id, photographer.id);
        return res.json({ ok: true });
    }
    catch (err) {
        console.error('deleteBlock error', err);
        return res.status(400).json({ error: err.message || 'Could not delete calendar event' });
    }
}
async function getPhotographerCalendar(req, res) {
    try {
        const photographerId = req.params.id;
        const fromQ = req.query.from ? new Date(String(req.query.from)) : new Date();
        const toQ = req.query.to
            ? new Date(String(req.query.to))
            : new Date(fromQ.getTime() + 30 * 24 * 60 * 60 * 1000); // default 30 days
        const items = await calendarService.listCalendarForPhotographer(photographerId, fromQ, toQ, true);
        return res.json({ items });
    }
    catch (err) {
        console.error('getPhotographerCalendar error', err);
        return res.status(500).json({ error: err.message || 'Could not fetch calendar' });
    }
}
/**
 * Availability quick-check
 * Query params: start, end (ISO)
 */
async function checkAvailability(req, res) {
    try {
        const photographerId = req.params.id;
        const start = req.query.start ? new Date(String(req.query.start)) : null;
        const end = req.query.end ? new Date(String(req.query.end)) : null;
        if (!start || !end)
            return res.status(400).json({ error: 'start and end query params required (ISO)' });
        const available = await calendarService.isPhotographerAvailable(photographerId, start, end, {
            includePending: false,
        });
        return res.json({ available });
    }
    catch (err) {
        console.error('checkAvailability error', err);
        return res.status(500).json({ error: err.message || 'Could not check availability' });
    }
}
