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
exports.overview = overview;
exports.bookingsTimeSeries = bookingsTimeSeries;
exports.bookingsByState = bookingsByState;
exports.revenueByMonth = revenueByMonth;
exports.topPhotographers = topPhotographers;
exports.recentUsers = recentUsers;
const statsService = __importStar(require("../services/adminStats.service"));
const date_fns_1 = require("date-fns");
async function overview(req, res) {
    try {
        const cacheSeconds = Number(process.env.ADMIN_STATS_CACHE_SECONDS || 30); // default 30s
        const data = await statsService.getOverviewStats({ cacheSeconds });
        return res.json(data);
    }
    catch (err) {
        console.error('admin.stats.overview error', err);
        return res.status(500).json({ error: err.message || 'Could not fetch overview' });
    }
}
async function bookingsTimeSeries(req, res) {
    try {
        const days = Math.min(180, Math.max(7, Number(req.query.days || 30)));
        const cacheSeconds = Number(process.env.ADMIN_STATS_CACHE_SECONDS || 30);
        const data = await statsService.getBookingsTimeSeries(days, { cacheSeconds });
        return res.json(data);
    }
    catch (err) {
        console.error('admin.stats.bookingsTimeSeries error', err);
        return res.status(500).json({ error: 'Could not fetch bookings time series' });
    }
}
async function bookingsByState(req, res) {
    try {
        const sinceDays = req.query.sinceDays ? Number(req.query.sinceDays) : undefined;
        const since = sinceDays ? (0, date_fns_1.subDays)(new Date(), sinceDays) : undefined;
        const data = await statsService.getBookingsByState({ since });
        return res.json({ data });
    }
    catch (err) {
        console.error('admin.stats.bookingsByState error', err);
        return res.status(500).json({ error: 'Could not fetch bookings by state' });
    }
}
async function revenueByMonth(req, res) {
    try {
        const months = Math.min(24, Math.max(1, Number(req.query.months || 6)));
        const cacheSeconds = Number(process.env.ADMIN_STATS_CACHE_SECONDS || 30);
        const data = await statsService.getRevenueByMonth(months, { cacheSeconds });
        return res.json(data);
    }
    catch (err) {
        console.error('admin.stats.revenueByMonth error', err);
        return res.status(500).json({ error: 'Could not fetch revenue' });
    }
}
async function topPhotographers(req, res) {
    try {
        const limit = Math.min(50, Math.max(1, Number(req.query.limit || 10)));
        const data = await statsService.getTopPhotographers(limit);
        return res.json({ items: data });
    }
    catch (err) {
        console.error('admin.stats.topPhotographers error', err);
        return res.status(500).json({ error: 'Could not fetch top photographers' });
    }
}
async function recentUsers(req, res) {
    try {
        const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
        const items = await statsService.getRecentUsers(limit);
        return res.json({ items });
    }
    catch (err) {
        console.error('admin.stats.recentUsers error', err);
        return res.status(500).json({ error: 'Could not fetch recent users' });
    }
}
