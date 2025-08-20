"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  preferences: {
    darkMode: boolean;
    notifications: boolean;
    reminderTime: string;
  };
}

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
  const [loading] = useState(false); // Set to false since we use Clerk

  const login = async (): Promise<boolean> => {
    // Stub implementation - using Clerk for auth
    return false;
  };

  const register = async (): Promise<boolean> => {
    // Stub implementation - using Clerk for auth
    return false;
  };

  const logout = async (): Promise<void> => {
    // Stub implementation - using Clerk for auth
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
