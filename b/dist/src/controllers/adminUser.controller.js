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
exports.listUsers = listUsers;
exports.updateUserStatus = updateUserStatus;
exports.deleteUser = deleteUser;
const adminUserService = __importStar(require("../services/adminUser.service"));
async function listUsers(req, res) {
    try {
        const page = Number(req.query.page || 1);
        const perPage = Number(req.query.perPage || 50);
        const role = req.query.role ? String(req.query.role) : undefined;
        const search = req.query.search ? String(req.query.search) : undefined;
        const result = await adminUserService.listUsers({ page, perPage, role, search });
        return res.json(result);
    }
    catch (err) {
        console.error('listUsers error', err);
        return res.status(500).json({ error: err.message || 'Could not list users' });
    }
}
async function updateUserStatus(req, res) {
    try {
        const adminId = req.userId;
        const userId = req.params.id;
        const { disabled } = req.body;
        if (typeof disabled !== 'boolean')
            return res.status(400).json({ error: 'disabled boolean required' });
        const updated = await adminUserService.setUserDisabled(adminId, userId, disabled);
        return res.json(updated);
    }
    catch (err) {
        console.error('updateUserStatus error', err);
        return res.status(400).json({ error: err.message || 'Could not update user status' });
    }
}
async function deleteUser(req, res) {
    try {
        const adminId = req.userId;
        const userId = req.params.id;
        await adminUserService.deleteUser(adminId, userId);
        return res.json({ success: true, message: 'User deleted successfully' });
    }
    catch (err) {
        console.error('deleteUser error', err);
        return res.status(400).json({ error: err.message || 'Could not delete user' });
    }
}
