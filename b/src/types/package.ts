// src/types/package.ts

export interface CreatePackageData {
  title: string;
  description?: string;
  priceCents: number;
}

export interface UpdatePackageData {
  title?: string;
  description?: string;
  priceCents?: number;
}
