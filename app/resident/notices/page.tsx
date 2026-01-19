'use client';

import { useEffect, useState } from 'react';
import { useResidentAuth } from '@/lib/resident-auth-context';
import { useI18n } from '@/lib/i18n-context';
import api from '@/lib/api';
import { formatDate, showError } from '@/lib/utils';
import Link from 'next/link';

export default function NoticesPage() {
  const { t } = useI18n();
  const { resident } = useResidentAuth();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/resident-portal/notices');
      setNotices(response.data);
    } catch (error: any) {
      showError(error, error.response?.data?.message || t('pages.residentPortal.notices.loadError'));
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
                ← {t('pages.residentPortal.notices.backToDashboard')}
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{t('pages.residentPortal.notices.title')}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {notices.length > 0 ? (
          <div className="space-y-4">
            {notices.map((notice) => (
              <div key={notice._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{notice.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    notice.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                    notice.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {notice.priority}
                  </span>
                </div>
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: notice.content }} />
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                  <span>{t('common.labels.category')}: {notice.category}</span>
                  {notice.publishDate && <span>{t('pages.residentPortal.notices.published')}: {formatDate(notice.publishDate)}</span>}
                  {notice.expiryDate && <span>{t('pages.residentPortal.notices.expires')}: {formatDate(notice.expiryDate)}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            <p className="text-lg">{t('pages.residentPortal.notices.noNotices')}</p>
          </div>
        )}
      </main>
    </div>
  );
}
