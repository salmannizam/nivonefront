import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId?: string; // Optional for Super Admin
}

export interface AuthResponse {
  user: User;
}

export const authService = {
  /**
   * Tenant user login - requires tenant context from subdomain
   * Cookies are set automatically by backend (HTTP-only)
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    // Tokens are in HTTP-only cookies, only return user data
    return response.data;
  },

  /**
   * Super Admin login - separate endpoint, no tenant context
   * Cookies are set automatically by backend (HTTP-only)
   */
  async superAdminLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/admin/auth/login', credentials);
    // Tokens are in HTTP-only cookies, only return user data
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    // Tokens are in HTTP-only cookies, only return user data
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      // Try tenant logout first
      await api.post('/auth/logout');
    } catch (error: any) {
      // If tenant logout fails, try Super Admin logout
      try {
        await api.post('/admin/auth/logout');
      } catch (adminError) {
        // Ignore errors - cookies are cleared by backend
      }
    }
  },

  /**
   * Get current user - detects token type based on current route
   * Cookies are sent automatically with withCredentials: true
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      // Determine endpoint based on current pathname
      // Don't try both endpoints - that causes issues with wrong token types
      const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
      
      if (isAdminRoute) {
        // On admin routes, only try Super Admin endpoint
        try {
          const response = await api.post<User>('/admin/auth/me');
          return response.data;
        } catch (error: any) {
          // If Super Admin endpoint fails, user is not authenticated
          return null;
        }
      } else {
        // On tenant routes, only try tenant endpoint
        try {
          const response = await api.post<User>('/auth/me');
          return response.data;
        } catch (error: any) {
          // If tenant endpoint fails, user is not authenticated
          return null;
        }
      }
    } catch (error) {
      return null;
    }
  },

  isAuthenticated(): boolean {
    // We can't check HTTP-only cookies from JavaScript
    // Try to get user - if it fails, user is not authenticated
    // This is handled by the auth context
    return true; // Will be determined by getCurrentUser() call
  },
};

export async function getServerSession() {
  // This would be implemented with server-side cookie reading
  // For now, return null - implement based on your needs
  return null;
}
