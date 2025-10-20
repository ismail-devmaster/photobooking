// src/types/profile.ts

export interface UpdateUserProfilePayload {
  name?: string;
  phone?: string;
  locale?: string;
  stateId?: string;
  photographer?: {
    bio?: string;
    priceBaseline?: number;
    tags?: string[];
    stateId?: string;
    serviceIds?: string[];
  };
}

export interface UserProfileResponse {
  id: string;
  email: string;
  name: string | null;
  role: string;
  locale: string | null;
  phone: string | null;
  emailVerified: boolean;
  state: {
    id: string;
    code: string;
    name: string;
  } | null;
  photographer: {
    id: string;
    bio: string | null;
    priceBaseline: number | null;
    verified: boolean;
    tags: string[];
    state: {
      id: string;
      code: string;
      name: string;
    } | null;
    services: {
      id: string;
      slug: string;
      name: string;
    }[];
    portfolios: {
      id: string;
      title: string;
    }[];
  } | null;
  photographerId: string | null;
}
