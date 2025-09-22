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
exports.createFavorite = createFavorite;
exports.deleteFavorite = deleteFavorite;
exports.listMyFavorites = listMyFavorites;
const favService = __importStar(require("../services/favorite.service"));
const favorite_schemas_1 = require("../validators/favorite.schemas");
async function createFavorite(req, res) {
    try {
        const parsed = favorite_schemas_1.photographerIdParam.safeParse(req.params);
        if (!parsed.success)
            return res.status(400).json({ error: 'Invalid photographer id' });
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const photographerId = parsed.data.photographerId;
        const created = await favService.addFavorite(userId, photographerId);
        return res.status(201).json(created);
    }
    catch (err) {
        console.error('createFavorite error:', err);
        return res.status(500).json({ error: err.message || 'Could not add favorite' });
    }
}
async function deleteFavorite(req, res) {
    try {
        const parsed = favorite_schemas_1.photographerIdParam.safeParse(req.params);
        if (!parsed.success)
            return res.status(400).json({ error: 'Invalid photographer id' });
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const rec = await favService.removeFavorite(userId, parsed.data.photographerId);
        if (!rec)
            return res.status(404).json({ error: 'Favorite not found' });
        return res.json({ ok: true });
    }
    catch (err) {
        console.error('deleteFavorite error:', err);
        return res.status(500).json({ error: err.message || 'Could not remove favorite' });
    }
}
async function listMyFavorites(req, res) {
    try {
        const qp = favorite_schemas_1.listFavoritesQuery.parse(req.query);
        const page = qp.page ?? 1;
        const perPage = qp.perPage ?? 12;
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const result = await favService.listFavorites(userId, page, perPage);
        return res.json(result);
    }
    catch (err) {
        console.error('listMyFavorites error:', err);
        return res.status(500).json({ error: err.message || 'Could not list favorites' });
    }
}
