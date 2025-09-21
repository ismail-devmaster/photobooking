// User Types
export interface User {
  id: string;
  email: string;
  name?: string;
  emailVerified: boolean;
  role: 'CLIENT' | 'PHOTOGRAPHER' | 'ADMIN';
  locale: string;
  phone?: string;
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Photographer Types
export interface Photographer {
  id: string;
  userId: string;
  user: User;
  bio?: string;
  location?: {
    lat: number;
    lon: number;
    address: string;
  };
  tags: string[];
  priceBaseline: number;
  verified: boolean;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  portfolios?: Portfolio[];
  packages?: Package[];
  galleryImages?: GalleryImage[];
}

// Portfolio Types
export interface Portfolio {
  id: string;
  photographerId: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  images: Image[];
}

export interface Image {
  id: string;
  portfolioId: string;
  url: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

// Package Types
export interface Package {
  id: string;
  photographerId: string;
  title: string;
  description?: string;
  priceCents: number;
  createdAt: string;
  updatedAt: string;
}

// Gallery Types
export interface GalleryImage {
  id: string;
  photographerId: string;
  url: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

// Booking Types
export interface Booking {
  id: string;
  clientId: string;
  photographerId: string;
  startAt: string;
  endAt: string;
  location?: {
    address: string;
    lat: number;
    lon: number;
  };
  priceCents: number;
  state: BookingState;
  createdAt: string;
  updatedAt: string;
  client: User;
  photographer: Photographer;
  contract?: Contract;
  payment?: Payment;
  review?: Review;
}

export type BookingState = 
  | 'draft'
  | 'requested'
  | 'pending_payment'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled_by_client'
  | 'cancelled_by_photographer'
  | 'disputed'
  | 'refunded';

// Contract Types
export interface Contract {
  id: string;
  bookingId: string;
  status: ContractStatus;
  pdfUrl: string;
  providerRef?: string;
  signedAt?: string;
  createdAt: string;
}

export type ContractStatus = 
  | 'GENERATED'
  | 'SENT'
  | 'PARTIALLY_SIGNED'
  | 'SIGNED'
  | 'DECLINED'
  | 'VOID';

// Payment Types
export interface Payment {
  id: string;
  bookingId: string;
  status: PaymentStatus;
  amountCents: number;
  currency: string;
  provider: string;
  providerPaymentIntentId?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 
  | 'PENDING'
  | 'REQUIRES_ACTION'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'REFUNDED'
  | 'CANCELED';

// Review Types
export interface Review {
  id: string;
  bookingId: string;
  photographerId: string;
  reviewerId: string;
  rating: number;
  text?: string;
  status: ReviewStatus;
  createdAt: string;
  booking: Booking;
  photographer: Photographer;
  reviewer: User;
}

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// Message Types
export interface Conversation {
  id: string;
  participantAId: string;
  participantBId: string;
  lastActiveAt: string;
  participantA: User;
  participantB: User;
  messages: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string;
  attachments?: Record<string, unknown>;
  readAt?: string;
  createdAt: string;
  sender: User;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  readAt?: string;
  createdAt: string;
}

export type NotificationType = 
  | 'SYSTEM'
  | 'BOOKING_REQUESTED'
  | 'BOOKING_CONFIRMED'
  | 'MESSAGE_RECEIVED'
  | 'CONTRACT_READY'
  | 'CONTRACT_SIGNED'
  | 'PAYMENT_SUCCEEDED'
  | 'PAYMENT_FAILED'
  | 'REVIEW_RECEIVED';

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'CLIENT' | 'PHOTOGRAPHER';
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Form Types
export interface CreateBookingRequest {
  photographerId: string;
  packageId?: string;
  startAt: string;
  endAt: string;
  location?: {
    address: string;
    lat: number;
    lon: number;
  };
  notes?: string;
  priceCents?: number;
}

export interface CreateReviewRequest {
  bookingId: string;
  rating: number;
  text?: string;
}
