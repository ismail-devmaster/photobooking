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
exports.createServiceHandler = createServiceHandler;
exports.listServicesHandler = listServicesHandler;
exports.updateServiceHandler = updateServiceHandler;
exports.deleteServiceHandler = deleteServiceHandler;
const serviceService = __importStar(require("../services/service.service"));
async function createServiceHandler(req, res) {
    try {
        const { name, slug, description, categoryId } = req.body;
        if (!name)
            return res.status(400).json({ error: 'name required' });
        const rec = await serviceService.createService({ name, slug, description, categoryId });
        return res.status(201).json(rec);
    }
    catch (err) {
        console.error('createService error', err);
        return res.status(400).json({ error: err.message || 'Could not create service' });
    }
}
async function listServicesHandler(req, res) {
    try {
        const page = Number(req.query.page || 1);
        const perPage = Number(req.query.perPage || 50);
        const categoryId = req.query.categoryId ? String(req.query.categoryId) : undefined;
        const search = req.query.search ? String(req.query.search) : undefined;
        const result = await serviceService.listServices({ page, perPage, categoryId, search });
        return res.json(result);
    }
    catch (err) {
        console.error('listServices error', err);
        return res.status(500).json({ error: 'Could not list services' });
    }
}
async function updateServiceHandler(req, res) {
    try {
        const id = req.params.id;
        const { name, slug, description, categoryId } = req.body;
        const updated = await serviceService.updateService(id, { name, slug, description, categoryId });
        return res.json(updated);
    }
    catch (err) {
        console.error('updateService error', err);
        return res.status(400).json({ error: err.message || 'Could not update service' });
    }
}
async function deleteServiceHandler(req, res) {
    try {
        const id = req.params.id;
        await serviceService.deleteService(id);
        return res.json({ ok: true });
    }
    catch (err) {
        console.error('deleteService error', err);
        return res.status(400).json({ error: err.message || 'Could not delete service' });
    }
}
