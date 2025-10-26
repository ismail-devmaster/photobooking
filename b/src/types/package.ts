// src/types/package.ts

export interface CreatePackageData {
  title: string;
  description?: string;
  priceCents: number;
  imageUrls?: string[]; // Add this

}

export interface UpdatePackageData {
  title?: string;
  description?: string;
  priceCents?: number;
  imageUrls?: string[]; // Add this

}
