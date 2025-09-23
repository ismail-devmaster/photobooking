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
exports.createReview = createReview;
exports.listPhotographerReviews = listPhotographerReviews;
exports.listMyReviews = listMyReviews;
const review_schemas_1 = require("../validators/review.schemas");
const reviewService = __importStar(require("../services/review.service"));
async function createReview(req, res) {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const parsed = review_schemas_1.createReviewSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });
        const { bookingId, rating, text } = parsed.data;
        const created = await reviewService.createReview(userId, { bookingId, rating, text });
        return res.status(201).json(created);
    }
    catch (err) {
        const msg = err.message || 'Could not create review';
        if (/Booking not found/i.test(msg))
            return res.status(404).json({ error: msg });
        if (/Not allowed to review/i.test(msg))
            return res.status(403).json({ error: msg });
        if (/unique constraint|already exists/i.test(msg))
            return res.status(409).json({ error: 'Review already exists for this booking' });
        return res.status(400).json({ error: msg });
    }
}
async function listPhotographerReviews(req, res) {
    try {
        const photographerId = req.params.id;
        const page = Number(req.query.page || '1');
        const perPage = Number(req.query.perPage || '12');
        const results = await reviewService.listApprovedReviewsForPhotographer(photographerId, { page, perPage });
        return res.json(results);
    }
    catch (err) {
        console.error('listPhotographerReviews error:', err);
        return res.status(500).json({ error: 'Could not fetch reviews' });
    }
}
async function listMyReviews(req, res) {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const page = Number(req.query.page || '1');
        const perPage = Number(req.query.perPage || '50');
        const result = await reviewService.listReviewsByUser(userId, { page, perPage });
        return res.json(result);
    }
    catch (err) {
        console.error('listMyReviews error:', err);
        return res.status(500).json({ error: 'Could not list reviews' });
    }
}
