'use client';

import { useEffect, useState } from 'react';
import { useResidentAuth } from '@/lib/resident-auth-context';
import { useI18n } from '@/lib/i18n-context';
import api from '@/lib/api';
import { formatDate, showError } from '@/lib/utils';
import Link from 'next/link';

interface DashboardData {
  resident: {
    name: string;
    phone: string;
    email?: string;
    roomNumber?: string;
    bedNumber?: string;
    checkInDate: string;
  };
  summary: {
    totalDue: number;
    totalPaid: number;
    securityDeposit: number;
    pendingComplaints: number;
    activeGatePasses: number;
  };
}

export default function ResidentDashboard() {
  const { t } = useI18n();
  const { resident, logout } = useResidentAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await api.get('/resident-portal/dashboard');
      setData(response.data);
    } catch (error: any) {
      showError(error, error.response?.data?.message || t('pages.residentPortal.dashboard.loadError'));
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

  if (!data) {
    return <div className="p-6">{t('pages.residentPortal.dashboard.noData')}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('pages.residentPortal.dashboard.title')}</h1>
              <p className="text-sm text-gray-600">{t('pages.residentPortal.dashboard.welcome')}, {data.resident.name}</p>
            </div>
            <button
              onClick={async () => {
                await logout();
              }}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              {t('pages.residentPortal.dashboard.logout')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('pages.residentPortal.dashboard.totalDue')}</p>
                <p className="text-2xl font-bold text-red-600">₹{data.summary.totalDue.toLocaleString()}</p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('pages.residentPortal.dashboard.totalPaid')}</p>
                <p className="text-2xl font-bold text-green-600">₹{data.summary.totalPaid.toLocaleString()}</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('pages.residentPortal.dashboard.securityDeposit')}</p>
                <p className="text-2xl font-bold text-blue-600">₹{data.summary.securityDeposit.toLocaleString()}</p>
              </div>
              <div className="text-3xl">🔒</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('pages.residentPortal.dashboard.pendingComplaints')}</p>
                <p className="text-2xl font-bold text-orange-600">{data.summary.pendingComplaints}</p>
              </div>
              <div className="text-3xl">📝</div>
            </div>
          </div>
        </div>

        {/* My Stay Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('pages.residentPortal.dashboard.myStay')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">{t('pages.residentPortal.dashboard.roomNumber')}</p>
              <p className="text-lg font-semibold">{data.resident.roomNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('pages.residentPortal.dashboard.bedNumber')}</p>
              <p className="text-lg font-semibold">{data.resident.bedNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('pages.residentPortal.dashboard.checkInDate')}</p>
              <p className="text-lg font-semibold">{formatDate(data.resident.checkInDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('pages.residentPortal.dashboard.contact')}</p>
              <p className="text-lg font-semibold">{data.resident.phone}</p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/resident/my-stay"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-2">🏠</div>
            <h3 className="font-semibold text-gray-900">{t('pages.residentPortal.dashboard.myStay')}</h3>
            <p className="text-sm text-gray-600 mt-1">{t('pages.residentPortal.dashboard.viewStayDetails')}</p>
          </Link>

          <Link
            href="/resident/payments"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-2">💳</div>
            <h3 className="font-semibold text-gray-900">{t('pages.residentPortal.payments.title')}</h3>
            <p className="text-sm text-gray-600 mt-1">{t('pages.residentPortal.dashboard.viewPaymentHistory')}</p>
          </Link>

          <Link
            href="/resident/complaints"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-2">📝</div>
            <h3 className="font-semibold text-gray-900">{t('pages.residentPortal.complaints.title')}</h3>
            <p className="text-sm text-gray-600 mt-1">{t('pages.residentPortal.dashboard.viewYourComplaints')}</p>
          </Link>

          <Link
            href="/resident/notices"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-2">📢</div>
            <h3 className="font-semibold text-gray-900">{t('pages.residentPortal.notices.title')}</h3>
            <p className="text-sm text-gray-600 mt-1">{t('pages.residentPortal.dashboard.viewAnnouncements')}</p>
          </Link>

          <Link
            href="/resident/gate-passes"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-2">🚪</div>
            <h3 className="font-semibold text-gray-900">{t('pages.residentPortal.gatePasses.title')}</h3>
            <p className="text-sm text-gray-600 mt-1">{t('pages.residentPortal.dashboard.viewGatePasses')}</p>
          </Link>

          <Link
            href="/resident/visitors"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-2">👋</div>
            <h3 className="font-semibold text-gray-900">{t('pages.residentPortal.visitors.title')}</h3>
            <p className="text-sm text-gray-600 mt-1">{t('pages.residentPortal.dashboard.viewVisitors')}</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
