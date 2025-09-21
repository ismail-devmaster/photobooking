import { z } from 'zod';

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['CLIENT', 'PHOTOGRAPHER']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Booking Schemas
export const createBookingSchema = z.object({
  photographerId: z.string().min(1, 'Photographer ID is required'),
  packageId: z.string().optional(),
  startAt: z.string().datetime('Invalid start date'),
  endAt: z.string().datetime('Invalid end date'),
  location: z.object({
    address: z.string().min(1, 'Address is required'),
    lat: z.number(),
    lon: z.number(),
  }).optional(),
  notes: z.string().optional(),
  priceCents: z.number().positive('Price must be positive').optional(),
});

// Review Schemas
export const createReviewSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  text: z.string().optional(),
});

// Profile Schemas
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  location: z.object({
    address: z.string(),
    lat: z.number(),
    lon: z.number(),
  }).optional(),
});

// Photographer Schemas
export const updatePhotographerProfileSchema = z.object({
  bio: z.string().optional(),
  location: z.object({
    address: z.string(),
    lat: z.number(),
    lon: z.number(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  priceBaseline: z.number().positive('Price must be positive').optional(),
});

// Package Schemas
export const createPackageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priceCents: z.number().positive('Price must be positive'),
});

export const updatePackageSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  priceCents: z.number().positive('Price must be positive').optional(),
});

// Message Schemas
export const sendMessageSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  content: z.string().min(1, 'Message content is required'),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePhotographerProfileInput = z.infer<typeof updatePhotographerProfileSchema>;
export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
