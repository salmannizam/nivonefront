'use client';

import { useEffect, useState } from 'react';
import { useResidentAuth } from '@/lib/resident-auth-context';
import { useI18n } from '@/lib/i18n-context';
import api from '@/lib/api';
import { formatDate, showError } from '@/lib/utils';
import Link from 'next/link';

export default function VisitorsPage() {
  const { t } = useI18n();
  const { resident } = useResidentAuth();
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/resident-portal/visitors');
      setVisitors(response.data);
    } catch (error: any) {
      showError(error, error.response?.data?.message || t('pages.residentPortal.visitors.loadError'));
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
                ← {t('pages.residentPortal.visitors.backToDashboard')}
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{t('pages.residentPortal.visitors.title')}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {visitors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('pages.residentPortal.visitors.visitorName')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('pages.residentPortal.visitors.phone')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('pages.residentPortal.visitors.visitDate')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('pages.residentPortal.visitors.checkIn')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('pages.residentPortal.visitors.checkOut')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('pages.residentPortal.visitors.purpose')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visitors.map((visitor) => (
                    <tr key={visitor._id}>
                      <td className="px-6 py-4 whitespace-nowrap">{visitor.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{visitor.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatDate(visitor.visitDate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{visitor.checkInTime ? formatDate(visitor.checkInTime) : 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{visitor.checkOutTime ? formatDate(visitor.checkOutTime) : 'N/A'}</td>
                      <td className="px-6 py-4">{visitor.purpose || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <p className="text-lg">{t('pages.residentPortal.visitors.noVisitors')}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
