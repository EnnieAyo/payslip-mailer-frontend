'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { User, ApiResponse, AuthResponse } from '@/types';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import toast from 'react-hot-toast';
import {
  setAuthToken,
  getAuthToken,
  setUserData,
  getUserData,
  clearAuthCookies,
  set2FAUserId,
} from '@/lib/cookies';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<ApiResponse<AuthResponse>>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<ApiResponse<AuthResponse>>;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Idle timeout - 15 minutes
  useIdleTimeout({
    timeout: 15 * 60 * 1000,
    onIdle: () => {
      if (user) {
        toast.error('Session expired due to inactivity. Please login again.');
        logout();
      }
    },
    enabled: !!user,
  });

  useEffect(() => {
    // Check for stored auth on mount using cookies
    const token = getAuthToken();
    const storedUser = getUserData();

    if (token && storedUser) {
      setUser(storedUser);
    } else {
      // Clear any stale data
      clearAuthCookies();
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.login(email, password);

    // If 2FA is required, store userId temporarily in cookie
    if ('requiresTwoFactor' in response.data && response.data.requiresTwoFactor) {
      const userId = (response.data as any).userId;
      set2FAUserId(userId);
      return response;
    }

    // Normal login flow - store in cookies
    if ('access_token' in response.data) {
      setAuthToken(response.data.access_token as string);
      setUserData((response.data as any).user);
      setUser((response.data as any).user);
    }

    return response;
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.register(data);
    
    // Registration successful - store in cookies if token provided
    if (response.data && 'access_token' in response.data) {
      setAuthToken(response.data.access_token as string);
      setUserData((response.data as any).user);
      setUser((response.data as any).user);
    }
    
    return response;
  };

  const logout = () => {
    // Clear all auth-related cookies
    clearAuthCookies();
    setUser(null);
    router.push('/login');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    setUserData(updatedUser);
  };

  const isAuthenticated = !!user && !!getAuthToken();

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
