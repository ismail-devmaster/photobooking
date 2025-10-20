// src/controllers/contract.controller.ts
import { Request, Response } from 'express';
import * as contractService from '../services/contract.service';
import { generateContractSchema, signContractSchema, contractIdParam } from '../validators/contract.schemas';

export async function generateContract(req: Request, res: Response) {
  try {
    const parsed = generateContractSchema.parse(req.body);
    const bookingId = parsed.bookingId;
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await contractService.generateContractForBooking(bookingId, userId);
    return res.status(201).json({ contract: result.contract, pdfPath: result.pdfPath });
  } catch (err: any) {
    console.error('generateContract error:', err);
    return res.status(400).json({ error: err.message || 'Could not generate contract' });
  }
}

export async function downloadContract(req: Request, res: Response) {
  try {
    const params = contractIdParam.parse(req.params);
    const contract = await contractService.getContract(params.id);
    if (!contract) return res.status(404).json({ error: 'Contract not found' });

    const pdfUrl = contract.pdfUrl;
    if (!pdfUrl) return res.status(404).json({ error: 'PDF not available' });

    // pdfUrl is something like http://host/uploads/contracts/...
    // we will redirect to that URL (served by static /uploads) or stream file if you prefer
    return res.redirect(pdfUrl);
  } catch (err: any) {
    console.error('downloadContract error:', err);
    return res.status(400).json({ error: err.message || 'Could not download contract' });
  }
}

export async function getContractStatus(req: Request, res: Response) {
  try {
    const params = contractIdParam.parse(req.params);
    const contract = await contractService.getContract(params.id);
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    return res.json({ id: contract.id, status: contract.status, pdfUrl: contract.pdfUrl, signedAt: contract.signedAt });
  } catch (err: any) {
    console.error('getContractStatus error:', err);
    return res.status(400).json({ error: err.message || 'Could not fetch contract' });
  }
}

export async function signContract(req: Request, res: Response) {
  try {
    const params = contractIdParam.parse(req.params);
    const parsed = signContractSchema.parse(req.body);
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const updated = await contractService.signContract(params.id, userId, parsed.signatureDataUrl, parsed.signerName);
    return res.json(updated);
  } catch (err: any) {
    console.error('signContract error:', err);
    return res.status(400).json({ error: err.message || 'Could not sign contract' });
  }
}
