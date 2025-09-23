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
exports.listAllReviews = listAllReviews;
exports.moderateReview = moderateReview;
const review_schemas_1 = require("../validators/review.schemas");
const reviewService = __importStar(require("../services/review.service"));
async function listAllReviews(req, res) {
    try {
        const status = req.query.status;
        const page = Number(req.query.page || '1');
        const perPage = Number(req.query.perPage || '50');
        const result = await reviewService.adminListReviews({ status: status, page, perPage });
        return res.json(result);
    }
    catch (err) {
        console.error('admin listAllReviews error:', err);
        return res.status(500).json({ error: 'Could not fetch reviews' });
    }
}
async function moderateReview(req, res) {
    try {
        const idParsed = review_schemas_1.reviewIdParam.safeParse(req.params);
        if (!idParsed.success)
            return res.status(400).json({ error: 'Invalid review id' });
        const bodyParsed = review_schemas_1.adminReviewActionSchema.safeParse(req.body);
        if (!bodyParsed.success)
            return res.status(400).json({ error: 'Validation failed', issues: bodyParsed.error.issues });
        const adminUserId = req.userId;
        if (!adminUserId)
            return res.status(401).json({ error: 'Unauthorized' });
        const { action, reason } = bodyParsed.data;
        const updated = await reviewService.adminModerateReview(adminUserId, idParsed.data.id, action, reason);
        return res.json(updated);
    }
    catch (err) {
        console.error('moderateReview error:', err);
        const msg = err.message || 'Could not moderate review';
        if (/not found/i.test(msg))
            return res.status(404).json({ error: msg });
        return res.status(400).json({ error: msg });
    }
}
