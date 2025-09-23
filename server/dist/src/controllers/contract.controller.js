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
exports.generateContract = generateContract;
exports.downloadContract = downloadContract;
exports.getContractStatus = getContractStatus;
exports.signContract = signContract;
const contractService = __importStar(require("../services/contract.service"));
const contract_schemas_1 = require("../validators/contract.schemas");
async function generateContract(req, res) {
    try {
        const parsed = contract_schemas_1.generateContractSchema.parse(req.body);
        const bookingId = parsed.bookingId;
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const result = await contractService.generateContractForBooking(bookingId, userId);
        return res.status(201).json({ contract: result.contract, pdfPath: result.pdfPath });
    }
    catch (err) {
        console.error('generateContract error:', err);
        return res.status(400).json({ error: err.message || 'Could not generate contract' });
    }
}
async function downloadContract(req, res) {
    try {
        const params = contract_schemas_1.contractIdParam.parse(req.params);
        const contract = await contractService.getContract(params.id);
        if (!contract)
            return res.status(404).json({ error: 'Contract not found' });
        const pdfUrl = contract.pdfUrl;
        if (!pdfUrl)
            return res.status(404).json({ error: 'PDF not available' });
        // pdfUrl is something like http://host/uploads/contracts/...
        // we will redirect to that URL (served by static /uploads) or stream file if you prefer
        return res.redirect(pdfUrl);
    }
    catch (err) {
        console.error('downloadContract error:', err);
        return res.status(400).json({ error: err.message || 'Could not download contract' });
    }
}
async function getContractStatus(req, res) {
    try {
        const params = contract_schemas_1.contractIdParam.parse(req.params);
        const contract = await contractService.getContract(params.id);
        if (!contract)
            return res.status(404).json({ error: 'Contract not found' });
        return res.json({ id: contract.id, status: contract.status, pdfUrl: contract.pdfUrl, signedAt: contract.signedAt });
    }
    catch (err) {
        console.error('getContractStatus error:', err);
        return res.status(400).json({ error: err.message || 'Could not fetch contract' });
    }
}
async function signContract(req, res) {
    try {
        const params = contract_schemas_1.contractIdParam.parse(req.params);
        const parsed = contract_schemas_1.signContractSchema.parse(req.body);
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const updated = await contractService.signContract(params.id, userId, parsed.signatureDataUrl, parsed.signerName);
        return res.json(updated);
    }
    catch (err) {
        console.error('signContract error:', err);
        return res.status(400).json({ error: err.message || 'Could not sign contract' });
    }
}
