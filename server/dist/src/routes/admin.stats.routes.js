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
// src/routes/admin.stats.routes.ts
const express_1 = require("express");
const statsCtrl = __importStar(require("../controllers/admin.stats.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const isAdmin_middleware_1 = require("../middlewares/isAdmin.middleware");
const router = (0, express_1.Router)();
// Admin stats endpoints
router.get('/stats/overview', auth_middleware_1.authenticateAccessToken, isAdmin_middleware_1.isAdmin, statsCtrl.overview);
router.get('/stats/bookings-timeseries', auth_middleware_1.authenticateAccessToken, isAdmin_middleware_1.isAdmin, statsCtrl.bookingsTimeSeries);
router.get('/stats/bookings-by-state', auth_middleware_1.authenticateAccessToken, isAdmin_middleware_1.isAdmin, statsCtrl.bookingsByState);
router.get('/stats/revenue-by-month', auth_middleware_1.authenticateAccessToken, isAdmin_middleware_1.isAdmin, statsCtrl.revenueByMonth);
router.get('/stats/top-photographers', auth_middleware_1.authenticateAccessToken, isAdmin_middleware_1.isAdmin, statsCtrl.topPhotographers);
router.get('/stats/recent-users', auth_middleware_1.authenticateAccessToken, isAdmin_middleware_1.isAdmin, statsCtrl.recentUsers);
exports.default = router;
