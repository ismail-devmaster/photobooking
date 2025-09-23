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
exports.createPackage = createPackage;
exports.updatePackage = updatePackage;
exports.deletePackage = deletePackage;
exports.getPackagesForPhotographer = getPackagesForPhotographer;
const pkgService = __importStar(require("../services/package.service"));
const package_schemas_1 = require("../validators/package.schemas");
async function createPackage(req, res) {
    try {
        const userId = req.userId;
        // photographerId must be retrieved from Photographer table by userId
        const photographer = await (require('../config/prisma').prisma).photographer.findUnique({ where: { userId } });
        if (!photographer)
            return res.status(400).json({ error: 'Photographer profile not found' });
        const parsed = package_schemas_1.createPackageSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });
        const created = await pkgService.createPackage(photographer.id, parsed.data);
        return res.status(201).json(created);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message || 'Could not create package' });
    }
}
async function updatePackage(req, res) {
    try {
        const userId = req.userId;
        const photographer = await (require('../config/prisma').prisma).photographer.findUnique({ where: { userId } });
        if (!photographer)
            return res.status(400).json({ error: 'Photographer profile not found' });
        const { id } = req.params;
        const parsed = package_schemas_1.updatePackageSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'Validation failed', issues: parsed.error.issues });
        const updated = await pkgService.updatePackage(id, photographer.id, parsed.data);
        return res.json(updated);
    }
    catch (err) {
        console.error(err);
        const msg = err.message || 'Could not update package';
        if (msg.includes('Not authorized'))
            return res.status(403).json({ error: msg });
        return res.status(500).json({ error: msg });
    }
}
async function deletePackage(req, res) {
    try {
        const userId = req.userId;
        const photographer = await (require('../config/prisma').prisma).photographer.findUnique({ where: { userId } });
        if (!photographer)
            return res.status(400).json({ error: 'Photographer profile not found' });
        const { id } = req.params;
        await pkgService.deletePackage(id, photographer.id);
        return res.json({ ok: true });
    }
    catch (err) {
        console.error(err);
        const msg = err.message || 'Could not delete package';
        if (msg.includes('Not authorized'))
            return res.status(403).json({ error: msg });
        return res.status(500).json({ error: msg });
    }
}
async function getPackagesForPhotographer(req, res) {
    try {
        const { id } = req.params; // photographer id
        const list = await pkgService.listPackagesForPhotographer(id);
        return res.json(list);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Could not list packages' });
    }
}
