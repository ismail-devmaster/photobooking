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
exports.listStates = listStates;
exports.listAllStates = listAllStates;
const stateService = __importStar(require("../services/state.service"));
async function listStates(req, res) {
    try {
        const search = req.query.search || null;
        const page = req.query.page ? Number(req.query.page) : undefined;
        const perPage = req.query.perPage ? Number(req.query.perPage) : undefined;
        const data = await stateService.listStates({ search, page, perPage });
        return res.json(data);
    }
    catch (err) {
        return res.status(500).json({ error: 'Could not list states' });
    }
}
async function listAllStates(req, res) {
    try {
        const items = await stateService.listAllStates();
        return res.json({ items });
    }
    catch (err) {
        return res.status(500).json({ error: 'Could not fetch states' });
    }
}
