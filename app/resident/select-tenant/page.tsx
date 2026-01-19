'use client';

import { useState, useEffect } from 'react';
import { useResidentAuth } from '@/lib/resident-auth-context';
import { useI18n } from '@/lib/i18n-context';
import { showError } from '@/lib/utils';

interface Residency {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
}

export default function SelectTenantPage() {
  const { t } = useI18n();
  const [residencies, setResidencies] = useState<Residency[]>([]);
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithTenant } = useResidentAuth();

  useEffect(() => {
    const storedMobile = sessionStorage.getItem('residentMobile');
    const storedResidencies = sessionStorage.getItem('residentResidencies');
    
    if (storedMobile && storedResidencies) {
      setMobile(storedMobile);
      setResidencies(JSON.parse(storedResidencies));
    } else {
      // Redirect to login if no residencies found
      window.location.href = '/resident/login';
    }
  }, []);

  const handleSelectTenant = async (tenantId: string) => {
    setLoading(true);
    try {
      await loginWithTenant(mobile, tenantId);
      // Navigation handled by auth context
    } catch (error: any) {
      showError(error, error.response?.data?.message || t('pages.residentPortal.selectTenant.loginError'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('pages.residentPortal.selectTenant.title')}</h1>
          <p className="text-gray-600">
            {t('pages.residentPortal.selectTenant.subtitle')}
          </p>
        </div>

        <div className="space-y-4">
          {residencies.map((residency) => (
            <button
              key={residency.tenantId}
              onClick={() => handleSelectTenant(residency.tenantId)}
              disabled={loading}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="font-semibold text-gray-900">{residency.tenantName}</div>
              <div className="text-sm text-gray-500 mt-1">{t('pages.residentPortal.selectTenant.clickToAccess')}</div>
            </button>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              sessionStorage.removeItem('residentMobile');
              sessionStorage.removeItem('residentResidencies');
              window.location.href = '/resident/login';
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
            disabled={loading}
          >
            {t('pages.residentPortal.selectTenant.backToLogin')}
          </button>
        </div>
      </div>
    </div>
  );
}
