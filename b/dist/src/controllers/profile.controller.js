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
exports.getMyProfile = getMyProfile;
exports.updateMyProfile = updateMyProfile;
exports.listPhotographers = listPhotographers;
exports.getPhotographer = getPhotographer;
const profileService = __importStar(require("../services/profile.service"));
const profile_filter_schemas_1 = require("../validators/profile-filter.schemas");
const jwt_1 = require("../utils/jwt");
async function getMyProfile(req, res) {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const profile = await profileService.getUserProfile(userId);
        return res.json(profile);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Could not fetch profile' });
    }
}
async function updateMyProfile(req, res) {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const payload = req.body;
        const updated = await profileService.updateUserProfile(userId, payload);
        return res.json(updated);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Could not update profile' });
    }
}
async function listPhotographers(req, res) {
    try {
        const parsed = profile_filter_schemas_1.photographerListQuery.safeParse(req.query);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Invalid query', issues: parsed.error.issues });
        }
        const q = parsed.data;
        // if request provides Authorization: Bearer <token>, try to extract current user id for isFavorited
        const authHeader = String(req.headers.authorization || '');
        let currentUserId = undefined;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.slice(7);
            const payload = (0, jwt_1.verifyAccessToken)(token);
            if (payload && payload.sub)
                currentUserId = payload.sub;
        }
        // handle tags param (comma separated)
        let tagsArr = undefined;
        if (q.tags)
            tagsArr = q.tags.split(',').map((s) => s.trim()).filter(Boolean);
        const result = await profileService.listPhotographers({
            stateId: q.stateId,
            serviceId: q.serviceId,
            minPrice: q.minPrice,
            maxPrice: q.maxPrice,
            q: q.q,
            tags: tagsArr,
            sort: q.sort,
            page: q.page,
            perPage: q.perPage,
            currentUserId,
        });
        return res.json(result);
    }
    catch (err) {
        console.error('listPhotographers error:', err);
        return res.status(500).json({ error: 'Could not list photographers' });
    }
}
async function getPhotographer(req, res) {
    try {
        const { id } = req.params;
        const photog = await profileService.getPhotographerById(id);
        if (!photog)
            return res.status(404).json({ error: 'Photographer not found' });
        return res.json(photog);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Could not fetch photographer' });
    }
}
