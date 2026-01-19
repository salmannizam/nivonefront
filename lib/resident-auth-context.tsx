'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { residentAuthService, Resident } from './resident-auth';
import { useRouter } from 'next/navigation';

interface ResidentAuthContextType {
  resident: Resident | null;
  loading: boolean;
  login: (mobile: string, otp: string, tenantId?: string) => Promise<void>;
  loginWithTenant: (mobile: string, tenantId: string) => Promise<void>;
  logout: () => Promise<void>;
  requestOtp: (mobile: string) => Promise<{ success: boolean; message: string }>;
}

const ResidentAuthContext = createContext<ResidentAuthContextType | undefined>(undefined);

export function ResidentAuthProvider({ children }: { children: ReactNode }) {
  const [resident, setResident] = useState<Resident | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if resident is logged in
    residentAuthService
      .getCurrentResident()
      .then((data) => {
        setResident(data.resident);
        setLoading(false);
      })
      .catch(() => {
        setResident(null);
        setLoading(false);
      });
  }, []);

  const requestOtp = async (mobile: string) => {
    return await residentAuthService.requestOtp(mobile);
  };

  const login = async (mobile: string, otp: string, tenantId?: string) => {
    const result = await residentAuthService.verifyOtp(mobile, otp, tenantId);
    
    if (result.multipleResidencies && result.residencies) {
      // Store mobile and residencies for tenant selection
      sessionStorage.setItem('residentMobile', mobile);
      sessionStorage.setItem('residentResidencies', JSON.stringify(result.residencies));
      router.push('/resident/select-tenant');
      return;
    }
    
    if (result.resident) {
      setResident(result.resident);
      router.push('/resident/dashboard');
    } else {
      throw new Error('Login failed');
    }
  };

  const loginWithTenant = async (mobile: string, tenantId: string) => {
    const result = await residentAuthService.loginWithTenant(mobile, tenantId);
    setResident(result.resident);
    router.push('/resident/dashboard');
  };

  const logout = async () => {
    await residentAuthService.logout();
    setResident(null);
    sessionStorage.removeItem('residentMobile');
    sessionStorage.removeItem('residentResidencies');
    router.push('/resident/login');
  };

  return (
    <ResidentAuthContext.Provider
      value={{
        resident,
        loading,
        login,
        loginWithTenant,
        logout,
        requestOtp,
      }}
    >
      {children}
    </ResidentAuthContext.Provider>
  );
}

export function useResidentAuth() {
  const context = useContext(ResidentAuthContext);
  if (context === undefined) {
    throw new Error('useResidentAuth must be used within a ResidentAuthProvider');
  }
  return context;
}
