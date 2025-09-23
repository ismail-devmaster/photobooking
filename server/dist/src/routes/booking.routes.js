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
// src/routes/booking.routes.ts
const express_1 = require("express");
const bookingCtrl = __importStar(require("../controllers/booking.controller"));
const booking_state_controller_1 = require("../controllers/booking-state.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// create booking (client only)
router.post('/', auth_middleware_1.authenticateAccessToken, (0, role_middleware_1.requireRole)(client_1.Role.CLIENT), bookingCtrl.createBooking);
// client bookings
router.get('/me', auth_middleware_1.authenticateAccessToken, bookingCtrl.listMyBookings);
// photographer received bookings
router.get('/received', auth_middleware_1.authenticateAccessToken, (0, role_middleware_1.requireRole)(client_1.Role.PHOTOGRAPHER), bookingCtrl.listReceivedBookings);
// booking detail (client or photographer)
router.get('/:id', auth_middleware_1.authenticateAccessToken, bookingCtrl.getBookingById);
router.patch('/:id/state', auth_middleware_1.authenticateAccessToken, (0, role_middleware_1.requireRole)(client_1.Role.CLIENT, client_1.Role.PHOTOGRAPHER, client_1.Role.ADMIN), booking_state_controller_1.updateBookingState);
exports.default = router;
