"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiService, ClientAuth, User } from '@/services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = ClientAuth.getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      
      // Verify user is still valid by fetching profile
      apiService.getProfile().then(response => {
        if (response.success && response.data) {
          setUser(response.data.user);
          ClientAuth.setStoredUser(response.data.user);
        } else {
          // Token is invalid, clear auth
          ClientAuth.clearAuth();
          setUser(null);
        }
        setLoading(false);
      }).catch(() => {
        ClientAuth.clearAuth();
        setUser(null);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.login({ email, password });
      
      if (response.success && response.data) {
        setUser(response.data.user);
        ClientAuth.setStoredUser(response.data.user);
        ClientAuth.setStoredToken(response.data.token);
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.register({ name, email, password });
      
      if (response.success && response.data) {
        setUser(response.data.user);
        ClientAuth.setStoredUser(response.data.user);
        ClientAuth.setStoredToken(response.data.token);
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiService.logout();
    } finally {
      setUser(null);
      ClientAuth.clearAuth();
    }
  };

  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
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

// Protected Route component
interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || <div>Please log in to access this page</div>;
  }

  return <>{children}</>;
}
