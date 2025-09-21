const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// API Client Interface - No implementation, just types
export interface ApiClient {
  // Auth endpoints
  login(credentials: { email: string; password: string }): Promise<unknown>;
  register(userData: { email: string; password: string; name: string; role?: string }): Promise<unknown>;
  refreshToken(): Promise<unknown>;
  logout(): Promise<unknown>;
  me(): Promise<unknown>;

  // OAuth endpoints
  getGoogleAuthUrl(): string;
  getFacebookAuthUrl(): string;

  // Photographer endpoints
  getPhotographers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    state?: string;
    verified?: boolean;
  }): Promise<unknown>;
  getPhotographer(id: string): Promise<unknown>;
  getPhotographerPortfolio(photographerId: string): Promise<unknown>;

  // Booking endpoints
  getBookings(params?: {
    page?: number;
    limit?: number;
    state?: string;
  }): Promise<unknown>;
  getMyBookings(): Promise<unknown>;
  createBooking(bookingData: unknown): Promise<unknown>;
  updateBooking(id: string, bookingData: unknown): Promise<unknown>;
  cancelBooking(id: string): Promise<unknown>;

  // Package endpoints
  getPackages(photographerId: string): Promise<unknown>;

  // Review endpoints
  getReviews(params?: {
    page?: number;
    limit?: number;
    photographerId?: string;
  }): Promise<unknown>;
  createReview(reviewData: unknown): Promise<unknown>;

  // Profile endpoints
  getProfile(): Promise<unknown>;
  updateProfile(profileData: unknown): Promise<unknown>;

  // Favorites endpoints
  getFavorites(): Promise<unknown>;
  addFavorite(photographerId: string): Promise<unknown>;
  removeFavorite(photographerId: string): Promise<unknown>;

  // Gallery endpoints
  getGallery(photographerId: string): Promise<unknown>;

  // Calendar endpoints
  getCalendar(photographerId: string, startDate?: string, endDate?: string): Promise<unknown>;

  // Notification endpoints
  getNotifications(): Promise<unknown>;
  markNotificationAsRead(id: string): Promise<unknown>;

  // Conversation endpoints
  getConversations(): Promise<unknown>;
  createConversation(participantBId: string): Promise<unknown>;

  // Message endpoints
  sendMessage(conversationId: string, content: string, attachments?: File[]): Promise<unknown>;
}

// Mock implementation - replace with actual implementation
class MockApiClient implements ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Auth endpoints
  async login(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  async register(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  async refreshToken(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  async logout(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  async me(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  // OAuth endpoints
  getGoogleAuthUrl(): string {
    return `${this.baseURL}/auth/oauth/google`;
  }

  getFacebookAuthUrl(): string {
    return `${this.baseURL}/auth/oauth/facebook`;
  }

  // Photographer endpoints
  async getPhotographers(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  async getPhotographer(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  async getPhotographerPortfolio(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  // Booking endpoints
  async getBookings(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  async getMyBookings(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  async createBooking(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  async updateBooking(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  async cancelBooking(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  // Package endpoints
  async getPackages(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  // Review endpoints
  async getReviews(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  async createReview(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  // Profile endpoints
  async getProfile(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  async updateProfile(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  // Favorites endpoints
  async getFavorites(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  async addFavorite(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  async removeFavorite(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  // Gallery endpoints
  async getGallery(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  // Calendar endpoints
  async getCalendar(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  // Notification endpoints
  async getNotifications(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  async markNotificationAsRead(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  // Conversation endpoints
  async getConversations(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  async createConversation(): Promise<unknown> {
    throw new Error('Not implemented');
  }

  // Message endpoints
  async sendMessage(): Promise<unknown> {
    throw new Error('Not implemented');
  }
}

export const apiClient: ApiClient = new MockApiClient(API_BASE_URL);
export default apiClient;