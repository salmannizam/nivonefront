'use client';

import { useEffect, useState } from 'react';
import { useResidentAuth } from '@/lib/resident-auth-context';
import { useI18n } from '@/lib/i18n-context';
import api from '@/lib/api';
import { formatDate, showError } from '@/lib/utils';
import Link from 'next/link';

export default function ComplaintsPage() {
  const { t } = useI18n();
  const { resident } = useResidentAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/resident-portal/complaints');
      setComplaints(response.data);
    } catch (error: any) {
      showError(error, error.response?.data?.message || t('pages.residentPortal.complaints.loadError'));
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
                ← {t('pages.residentPortal.complaints.backToDashboard')}
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{t('pages.residentPortal.complaints.title')}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {complaints.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {complaints.map((complaint) => (
                <div key={complaint._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{complaint.title}</h3>
                      <p className="text-gray-600 mt-2">{complaint.description}</p>
                      <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                        <span>{t('pages.residentPortal.complaints.category')}: {complaint.category}</span>
                        <span>{t('pages.residentPortal.complaints.priority')}: {complaint.priority}</span>
                        <span>{t('pages.residentPortal.complaints.created')}: {formatDate(complaint.createdAt)}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      complaint.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                      complaint.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {complaint.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <p className="text-lg">{t('pages.residentPortal.complaints.noComplaints')}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
