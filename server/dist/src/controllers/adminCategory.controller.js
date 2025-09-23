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
exports.createCategory = createCategory;
exports.listCategories = listCategories;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
const categoryService = __importStar(require("../services/category.service"));
async function createCategory(req, res) {
    try {
        const { name, slug, description } = req.body;
        if (!name)
            return res.status(400).json({ error: 'name required' });
        const rec = await categoryService.createCategory({ name, slug, description });
        return res.status(201).json(rec);
    }
    catch (err) {
        console.error('createCategory error', err);
        return res.status(400).json({ error: err.message || 'Could not create category' });
    }
}
async function listCategories(req, res) {
    try {
        const page = Number(req.query.page || 1);
        const perPage = Number(req.query.perPage || 50);
        const result = await categoryService.listCategories({ page, perPage });
        return res.json(result);
    }
    catch (err) {
        console.error('listCategories error', err);
        return res.status(500).json({ error: 'Could not list categories' });
    }
}
async function updateCategory(req, res) {
    try {
        const id = req.params.id;
        const { name, slug, description } = req.body;
        const updated = await categoryService.updateCategory(id, { name, slug, description });
        return res.json(updated);
    }
    catch (err) {
        console.error('updateCategory error', err);
        return res.status(400).json({ error: err.message || 'Could not update category' });
    }
}
async function deleteCategory(req, res) {
    try {
        const id = req.params.id;
        await categoryService.deleteCategory(id);
        return res.json({ ok: true });
    }
    catch (err) {
        console.error('deleteCategory error', err);
        return res.status(400).json({ error: err.message || 'Could not delete category' });
    }
}
