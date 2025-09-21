'use client';

import React, { createContext, useContext } from 'react';
import { User } from '@/types';

// Auth Context Types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role?: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  loginWithGoogle: () => void;
  loginWithFacebook: () => void;
}

// Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider - Mock implementation
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const value: AuthContextType = {
    user: null,
    loading: false,
    login: async () => {
      throw new Error('Not implemented');
    },
    register: async () => {
      throw new Error('Not implemented');
    },
    logout: () => {
      throw new Error('Not implemented');
    },
    refreshToken: async () => {
      throw new Error('Not implemented');
    },
    loginWithGoogle: () => {
      throw new Error('Not implemented');
    },
    loginWithFacebook: () => {
      throw new Error('Not implemented');
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Auth Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}