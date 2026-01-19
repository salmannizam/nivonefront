import api from './api';

export interface Resident {
  id: string;
  name: string;
  phone: string;
  email?: string;
  roomNumber?: string;
  bedNumber?: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
}

export interface Residency {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
}

class ResidentAuthService {
  /**
   * Request OTP for resident login
   */
  async requestOtp(mobile: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/resident-auth/request-otp', { mobile });
    return response.data;
  }

  /**
   * Verify OTP and login
   */
  async verifyOtp(
    mobile: string,
    otp: string,
    tenantId?: string,
  ): Promise<{ resident?: Resident; residencies?: Residency[]; multipleResidencies?: boolean }> {
    const response = await api.post('/resident-auth/verify-otp', {
      mobile,
      otp,
      tenantId,
    });
    return response.data;
  }

  /**
   * Login with selected tenant (for multi-PG scenario)
   */
  async loginWithTenant(mobile: string, tenantId: string): Promise<{ resident: Resident }> {
    const response = await api.post('/resident-auth/login-tenant', {
      mobile,
      tenantId,
    });
    return response.data;
  }

  /**
   * Get current resident
   */
  async getCurrentResident(): Promise<{ resident: Resident }> {
    const response = await api.post('/resident-auth/me');
    return response.data;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const response = await api.post('/resident-auth/refresh', { refreshToken });
    return response.data;
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    await api.post('/resident-auth/logout');
  }
}

export const residentAuthService = new ResidentAuthService();
