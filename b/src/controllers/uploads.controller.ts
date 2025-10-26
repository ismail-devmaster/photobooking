import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';

const APP_BASE_URL = process.env.APP_BASE_URL?.replace(/\/$/, '') || 'http://localhost:4000';

export async function uploadFile(req: Request, res: Response) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filename = req.file.filename;
    const url = `${APP_BASE_URL}/uploads/${filename}`;

    return res.status(201).json({ filename, url });
  } catch (err: any) {
    console.error('uploadFile error:', err);
    return res.status(500).json({ error: err.message || 'Could not upload file' });
  }
}

// New: find a file by name recursively under uploads folder
function findFileByName(dir: string, name: string): string | null {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isFile() && entry.name === name) return full;
    if (entry.isDirectory()) {
      const found = findFileByName(full, name);
      if (found) return found;
    }
  }
  return null;
}

export const getById = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Missing file id' });

  const uploadsRoot = path.join(process.cwd(), 'uploads');

  // Try direct path first (in case client uses folder/name)
  const directPath = path.join(uploadsRoot, id);
  if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
    return res.sendFile(directPath);
  }

  // Otherwise search recursively for a file with the given filename
  const found = findFileByName(uploadsRoot, id);
  if (found) {
    return res.sendFile(found);
  }

  return res.status(404).json({ error: 'File not found' });
};
