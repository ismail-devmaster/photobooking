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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderContractPdfToFile = renderContractPdfToFile;
exports.generateContractForBooking = generateContractForBooking;
exports.signContract = signContract;
exports.getContract = getContract;
// src/services/contract.service.ts
const prisma_1 = require("../config/prisma");
const pdfkit_1 = __importDefault(require("pdfkit"));
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const fs_2 = require("fs");
const client_1 = require("@prisma/client");
const notificationService = __importStar(require("./notification.service"));
const APP_BASE_URL = process.env.APP_BASE_URL?.replace(/\/$/, '') || 'http://localhost:4000';
const CONTRACTS_ROOT = path_1.default.join(process.cwd(), 'uploads', 'contracts');
async function ensureDir(dir) {
    await fs_1.promises.mkdir(dir, { recursive: true });
}
/**
 * Helper: write a PDF file for a contract given content and optional signature images.
 * Returns absolute file path.
 */
async function renderContractPdfToFile(opts) {
    const { contractId, bookingId, clientName, photographerName, termsHtmlOrText, signatureClientPath, signaturePhotographerPath, } = opts;
    const contractDir = path_1.default.join(CONTRACTS_ROOT, bookingId);
    await ensureDir(contractDir);
    const outPath = path_1.default.join(contractDir, `${contractId}.pdf`);
    return new Promise((resolve, reject) => {
        try {
            const doc = new pdfkit_1.default({ size: 'A4', margin: 50 });
            doc.pipe((0, fs_2.createWriteStream)(outPath));
            // Header
            doc.fontSize(18).text('Photography Service Contract', { align: 'center' });
            doc.moveDown();
            // Parties
            doc.fontSize(12);
            doc.text(`Booking ID: ${bookingId}`);
            doc.moveDown(0.5);
            doc.text(`Client: ${clientName ?? '—'}`);
            doc.text(`Photographer: ${photographerName ?? '—'}`);
            doc.moveDown();
            // Terms / body
            doc.fontSize(11);
            const bodyText = termsHtmlOrText ??
                `This contract is made between ${clientName ?? 'Client'} and ${photographerName ?? 'Photographer'} for the photography services described in the booking. The parties agree to the terms and conditions stated herein.`;
            doc.text(bodyText, { align: 'left' });
            doc.moveDown(2);
            // Signatures section
            doc.fontSize(12).text('Signatures', { underline: true });
            doc.moveDown(0.5);
            const sigYStart = doc.y;
            // Left: Client
            doc.fontSize(10).text('Client signature:', { continued: true });
            if (signatureClientPath) {
                try {
                    doc.image(signatureClientPath, { fit: [150, 60] });
                }
                catch (e) {
                    // ignore image errors
                    doc.text(' [signature image could not be embedded] ');
                }
            }
            else {
                doc.text(' ____________________________');
            }
            doc.moveDown();
            // Name & date
            doc.text(`Name: ${clientName ?? '—'}`);
            doc.moveDown(1);
            // Photographer
            doc.text('Photographer signature:');
            if (signaturePhotographerPath) {
                try {
                    doc.image(signaturePhotographerPath, { fit: [150, 60] });
                }
                catch (e) {
                    doc.text(' [signature image could not be embedded] ');
                }
            }
            else {
                doc.text(' ____________________________');
            }
            doc.moveDown();
            doc.text(`Name: ${photographerName ?? '—'}`);
            doc.moveDown(2);
            // Footer
            doc
                .fontSize(9)
                .text(`Generated by ${APP_BASE_URL} — Contract ID: ${contractId}`, { align: 'center' });
            doc.end();
            // Wait until file exists (since stream created from node fs)
            // Use interval check for file existence as a small robust solution
            const checkInterval = setInterval(async () => {
                try {
                    await fs_1.promises.access(outPath);
                    clearInterval(checkInterval);
                    resolve(outPath);
                }
                catch (e) {
                    // still writing
                }
            }, 100);
        }
        catch (err) {
            reject(err);
        }
    });
}
/**
 * Generate a contract for a booking.
 * - validates booking exists
 * - ensures user is participant (client/photographer) or admin (we assume caller has been validated by controller)
 * - creates Contract record (if not exists) and generates PDF file, updates pdfUrl
 */
async function generateContractForBooking(bookingId, actorUserId) {
    // load booking with participants
    const booking = await prisma_1.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            client: { select: { id: true, name: true, email: true } },
            photographer: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
    });
    if (!booking)
        throw new Error('Booking not found');
    // permission: caller must be client or photographer or admin - controller should ensure, but we still keep check minimal:
    const photographerUserId = booking.photographer?.user?.id ?? null;
    const isParticipant = booking.clientId === actorUserId || photographerUserId === actorUserId;
    if (!isParticipant) {
        // allow generating from server/admin flows, throw if not participant
        // you can change this to allow admin role in controller
        // For now we allow only participants
        throw new Error('Forbidden: only booking participants can generate contract');
    }
    // if contract exists -> regenerate pdf (overwrite)
    let contract = await prisma_1.prisma.contract.findUnique({ where: { bookingId } });
    // create contract if missing
    if (!contract) {
        contract = await prisma_1.prisma.contract.create({
            data: {
                bookingId,
                status: client_1.ContractStatus.GENERATED,
                pdfUrl: '', // placeholder
            },
        });
    }
    else {
        // update status back to GENERATED if previously void etc.
        await prisma_1.prisma.contract.update({
            where: { id: contract.id },
            data: { status: client_1.ContractStatus.GENERATED },
        });
    }
    // ensure directories
    const contractDir = path_1.default.join(CONTRACTS_ROOT, bookingId);
    await ensureDir(contractDir);
    // render PDF
    const pdfPath = await renderContractPdfToFile({
        contractId: contract.id,
        bookingId,
        clientName: booking.client?.name ?? null,
        photographerName: booking.photographer?.user?.name ?? null,
        termsHtmlOrText: undefined, // optionally fetch template
    });
    // compute public url
    const relative = path_1.default
        .relative(path_1.default.join(process.cwd(), 'uploads'), pdfPath)
        .split(path_1.default.sep)
        .join('/');
    const pdfUrl = `${APP_BASE_URL}/uploads/${relative}`;
    // update contract pdfUrl
    const updated = await prisma_1.prisma.contract.update({
        where: { id: contract.id },
        data: {
            pdfUrl,
            status: client_1.ContractStatus.GENERATED,
        },
    });
    return { contract: updated, pdfPath };
}
/**
 * Sign a contract:
 * - accepts base64 dataURL signature
 * - validates signer is client or photographer for the booking
 * - stores signature file
 * - regenerates PDF embedding signatures
 * - updates contract status: PARTIALLY_SIGNED or SIGNED and sets signedAt when both signed
 * - creates notification to the other party
 */
async function signContract(contractId, signerUserId, signatureDataUrl, signerName) {
    const contract = await prisma_1.prisma.contract.findUnique({
        where: { id: contractId },
        include: { booking: { include: { client: true, photographer: { include: { user: true } } } } },
    });
    if (!contract)
        throw new Error('Contract not found');
    const booking = contract.booking;
    if (!booking)
        throw new Error('Contract has no booking attached');
    const clientId = booking.clientId;
    const photographerUserId = booking.photographer?.user?.id ?? null;
    let role = null;
    if (signerUserId === clientId)
        role = 'client';
    else if (signerUserId === photographerUserId)
        role = 'photographer';
    else
        role = null;
    if (!role)
        throw new Error('Only booking client or photographer can sign this contract');
    // parse base64 dataUrl
    const match = signatureDataUrl.match(/^data:(image\/png|image\/jpeg);base64,(.+)$/);
    let base64Payload = signatureDataUrl;
    let ext = 'png';
    if (match) {
        const mime = match[1];
        base64Payload = match[2];
        ext = mime === 'image/jpeg' ? 'jpg' : 'png';
    }
    else {
        // maybe raw base64, keep as png
        ext = 'png';
    }
    // ensure contract dir
    const contractDir = path_1.default.join(CONTRACTS_ROOT, booking.id);
    await ensureDir(contractDir);
    const signatureFileName = role === 'client' ? `signature-client.${ext}` : `signature-photographer.${ext}`;
    const signaturePath = path_1.default.join(contractDir, signatureFileName);
    // write file
    const buffer = Buffer.from(base64Payload, 'base64');
    // safety: limit size (e.g., 200 KB)
    const MAX_SIG_SIZE = 200 * 1024;
    if (buffer.length > MAX_SIG_SIZE)
        throw new Error('Signature image too large');
    await fs_1.promises.writeFile(signaturePath, buffer);
    // determine if both signatures exist
    const clientSigPath = path_1.default.join(contractDir, `signature-client.png`);
    const photogSigPath = path_1.default.join(contractDir, `signature-photographer.png`);
    // But extension may be jpg for one; check both png/jpg variations
    const possibleClient = await findExistingSignatureFile(contractDir, 'client');
    const possiblePhotog = await findExistingSignatureFile(contractDir, 'photographer');
    // regenerate pdf with the available signatures (use actual found files)
    const signatureClientPath = possibleClient ?? null;
    const signaturePhotographerPath = possiblePhotog ?? null;
    const newPdfPath = await renderContractPdfToFile({
        contractId: contract.id,
        bookingId: booking.id,
        clientName: booking.client?.name ?? null,
        photographerName: booking.photographer?.user?.name ?? null,
        signatureClientPath,
        signaturePhotographerPath,
    });
    const relative = path_1.default
        .relative(path_1.default.join(process.cwd(), 'uploads'), newPdfPath)
        .split(path_1.default.sep)
        .join('/');
    const pdfUrl = `${APP_BASE_URL}/uploads/${relative}`;
    // update contract status in DB
    // if both present => SIGNED and signedAt set, else PARTIALLY_SIGNED
    const bothSigned = !!signatureClientPath && !!signaturePhotographerPath;
    const newStatus = bothSigned ? client_1.ContractStatus.SIGNED : client_1.ContractStatus.PARTIALLY_SIGNED;
    const updated = await prisma_1.prisma.contract.update({
        where: { id: contract.id },
        data: {
            pdfUrl,
            status: newStatus,
            signedAt: bothSigned ? new Date() : undefined,
        },
    });
    // notify the other party via notificationService (this also emits real-time)
    const otherUserId = signerUserId === clientId ? photographerUserId : clientId;
    if (otherUserId) {
        await notificationService.createNotification(otherUserId, client_1.NotificationType.CONTRACT_SIGNED, {
            contractId: contract.id,
            bookingId: booking.id,
            signedBy: role,
            signerName: signerName ?? null,
        });
    }
    return updated;
}
/**
 * Utility: search for signature files with png/jpg extension for role
 */
async function findExistingSignatureFile(contractDir, role) {
    const pngPath = path_1.default.join(contractDir, `signature-${role}.png`);
    const jpgPath = path_1.default.join(contractDir, `signature-${role}.jpg`);
    try {
        await fs_1.promises.access(pngPath);
        return pngPath;
    }
    catch { }
    try {
        await fs_1.promises.access(jpgPath);
        return jpgPath;
    }
    catch { }
    return null;
}
/**
 * Get contract by id
 */
async function getContract(contractId) {
    return prisma_1.prisma.contract.findUnique({
        where: { id: contractId },
        include: { booking: { include: { client: true, photographer: { include: { user: true } } } } },
    });
}
