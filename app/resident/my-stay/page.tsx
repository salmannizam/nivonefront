'use client';

import { useEffect, useState } from 'react';
import { useResidentAuth } from '@/lib/resident-auth-context';
import { useI18n } from '@/lib/i18n-context';
import api from '@/lib/api';
import { formatDate, showError } from '@/lib/utils';
import Link from 'next/link';

export default function MyStayPage() {
  const { t } = useI18n();
  const { resident } = useResidentAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/resident-portal/my-stay');
      setData(response.data);
    } catch (error: any) {
      showError(error, error.response?.data?.message || t('pages.residentPortal.myStay.loadError'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/resident/dashboard" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
                ← {t('pages.residentPortal.myStay.backToDashboard')}
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{t('pages.residentPortal.myStay.title')}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {data && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">{t('pages.residentPortal.myStay.name')}</p>
                <p className="text-lg font-semibold">{data.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('pages.residentPortal.myStay.phone')}</p>
                <p className="text-lg font-semibold">{data.phone}</p>
              </div>
              {data.email && (
                <div>
                  <p className="text-sm text-gray-600">{t('pages.residentPortal.myStay.email')}</p>
                  <p className="text-lg font-semibold">{data.email}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">{t('pages.residentPortal.myStay.roomNumber')}</p>
                <p className="text-lg font-semibold">{data.roomNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('pages.residentPortal.myStay.bedNumber')}</p>
                <p className="text-lg font-semibold">{data.bedNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('pages.residentPortal.myStay.checkInDate')}</p>
                <p className="text-lg font-semibold">{formatDate(data.checkInDate)}</p>
              </div>
              {data.checkOutDate && (
                <div>
                  <p className="text-sm text-gray-600">{t('pages.residentPortal.myStay.checkOutDate')}</p>
                  <p className="text-lg font-semibold">{formatDate(data.checkOutDate)}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">{t('pages.residentPortal.myStay.status')}</p>
                <p className="text-lg font-semibold">
                  <span className={`px-2 py-1 rounded text-sm ${
                    data.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    data.status === 'VACATED' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {data.status}
                  </span>
                </p>
              </div>
            </div>

            {data.emergencyContact && (
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">{t('pages.residentPortal.myStay.emergencyContact')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">{t('pages.residentPortal.myStay.contactName')}</p>
                    <p className="font-semibold">{data.emergencyContact.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('pages.residentPortal.myStay.contactPhone')}</p>
                    <p className="font-semibold">{data.emergencyContact.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('pages.residentPortal.myStay.relation')}</p>
                    <p className="font-semibold">{data.emergencyContact.relation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
