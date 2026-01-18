'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, User, getTenantSlug } from './auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void | { redirect: boolean; tenantSlug: string }>;
  register: (data: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Always try to get current user (cookies are HTTP-only, can't check from JS)
    // getCurrentUser() automatically detects admin vs tenant routes
    authService.getCurrentUser()
      .then((userData) => {
        setUser(userData);
        setLoading(false);
      })
      .catch((error) => {
        // If getCurrentUser fails, user is not authenticated
        setUser(null);
        setLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    // Get tenant slug from subdomain or query parameter (optional)
    const tenantSlug = getTenantSlug();
    
    const response = await authService.login({ email, password, tenantSlug: tenantSlug || undefined });
    
    // If API returns redirect info (correct credentials but wrong/missing tenant slug)
    // This should be handled by the caller, not here, to avoid page refresh
    // The caller can handle the redirect after checking for errors
    if (response.redirect && response.tenantSlug) {
      // Return redirect info so caller can handle it
      return { redirect: true, tenantSlug: response.tenantSlug };
    }
    
    // Normal login success - user should be present if not redirected
    if (!response.user) {
      throw new Error('Login failed. Please try again.');
    }
    setUser(response.user);
  };

  const register = async (data: { email: string; password: string; name: string }) => {
    // Get tenant slug from subdomain or query parameter
    const tenantSlug = getTenantSlug();
    if (!tenantSlug) {
      throw new Error('Tenant slug is required. Please access via your tenant subdomain or use ?tenant=slug query parameter.');
    }
    
    const response = await authService.register({ ...data, tenantSlug });
    if (response.user) {
      setUser(response.user);
    } else {
      throw new Error('Registration failed. Please try again.');
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      // If refresh fails, user might be logged out
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
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
