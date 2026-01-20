'use client';

// Force dynamic rendering to prevent prerendering errors
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import FeatureGuard from '@/components/FeatureGuard';
import { useI18n } from '@/lib/i18n-context';
import { logError } from '@/lib/utils';

interface DashboardStats {
  residents: { 
    total: number; 
    active: number; 
    vacated?: number;
    noticeGiven?: number;
    vacatedThisMonth?: number;
    pendingSettlements?: number;
  };
  rooms: { total: number; occupied: number; available: number; occupancyRate: number };
  beds?: {
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
    occupancyRate: string;
    becomingAvailableSoon?: number;
  };
  payments: { 
    total: number; 
    paid: number; 
    pending: number; 
    overdue: number; 
    revenue: number; 
    totalPending: number;
    dueToday?: number;
    dueNext7Days?: number;
  };
  complaints: { total: number; open: number; pending3Days?: number };
  visitors: { today: number };
}

export default function ReportsPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<string>('dashboard');

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const response = await api.get('/reports/dashboard');
      setStats(response.data);
    } catch (error) {
      logError(error, 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600 dark:text-gray-400">{t('pages.reports.loading')}</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-600 dark:text-red-400">{t('pages.reports.failedToLoad')}</div>
      </div>
    );
  }

  return (
    <FeatureGuard feature="reports">
      <div>
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900 dark:text-white">{t('pages.reports.title')}</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setReportType('dashboard')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
              reportType === 'dashboard'
                ? 'bg-blue-600 dark:bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            {t('pages.reports.dashboard')}
          </button>
          <button
            onClick={() => setReportType('financial')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
              reportType === 'financial'
                ? 'bg-blue-600 dark:bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            {t('pages.reports.financial')}
          </button>
          <button
            onClick={() => setReportType('occupancy')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
              reportType === 'occupancy'
                ? 'bg-blue-600 dark:bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            {t('pages.reports.occupancy')}
          </button>
        </div>
      </div>

      {reportType === 'dashboard' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('pages.reports.totalResidents')}</h3>
              <p className="text-2xl sm:text-3xl font-bold mt-2 text-gray-900 dark:text-white">{stats.residents.total}</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                {stats.residents.active || 0} {t('pages.reports.active')}
                {stats.residents.vacatedThisMonth !== undefined && stats.residents.vacatedThisMonth > 0 && (
                  <span className="ml-2 text-orange-600 dark:text-orange-400">
                    • {stats.residents.vacatedThisMonth} {t('pages.reports.vacatedThisMonth')}
                  </span>
                )}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('pages.reports.rooms')}</h3>
              <p className="text-2xl sm:text-3xl font-bold mt-2 text-gray-900 dark:text-white">{stats.rooms.total}</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                {stats.rooms.occupied} {t('pages.reports.occupied')}, {stats.rooms.available} {t('pages.reports.available')}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('pages.reports.occupancyRate')}: {stats.rooms.occupancyRate.toFixed(1)}%
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('pages.reports.revenue')}</h3>
              <p className="text-2xl sm:text-3xl font-bold mt-2 text-gray-900 dark:text-white">
                ₹{stats.payments.revenue.toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                {stats.payments.paid || 0} {t('pages.reports.completedPayments')}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('pages.reports.complaints')}</h3>
              <p className="text-2xl sm:text-3xl font-bold mt-2 text-gray-900 dark:text-white">{stats.complaints.total}</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                {stats.complaints.open} {t('pages.reports.open')}
                {stats.complaints.pending3Days !== undefined && stats.complaints.pending3Days > 0 && (
                  <span className="ml-2 text-red-600 dark:text-red-400">
                    • {stats.complaints.pending3Days} pending &gt; 3 days
                  </span>
                )}
              </p>
            </div>
          </div>

          {(stats.residents.pendingSettlements !== undefined && stats.residents.pendingSettlements > 0) ||
           (stats.beds?.becomingAvailableSoon !== undefined && stats.beds.becomingAvailableSoon > 0) ||
           (stats.payments.dueToday !== undefined && stats.payments.dueToday > 0) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 mt-6">
              {stats.residents.pendingSettlements !== undefined && stats.residents.pendingSettlements > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 sm:p-6 rounded-lg shadow border border-orange-200 dark:border-orange-800">
                  <h3 className="text-orange-700 dark:text-orange-300 text-sm font-medium">Pending Settlements</h3>
                  <p className="text-2xl sm:text-3xl font-bold mt-2 text-orange-900 dark:text-orange-100">
                    {stats.residents.pendingSettlements}
                  </p>
                  <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-400 mt-1">
                    Vacated residents awaiting settlement
                  </p>
                </div>
              )}
              {stats.beds?.becomingAvailableSoon !== undefined && stats.beds.becomingAvailableSoon > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 sm:p-6 rounded-lg shadow border border-yellow-200 dark:border-yellow-800">
                  <h3 className="text-yellow-700 dark:text-yellow-300 text-sm font-medium">Beds Available Soon</h3>
                  <p className="text-2xl sm:text-3xl font-bold mt-2 text-yellow-900 dark:text-yellow-100">
                    {stats.beds.becomingAvailableSoon}
                  </p>
                  <p className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                    Residents with notice given
                  </p>
                </div>
              )}
              {stats.payments.dueToday !== undefined && stats.payments.dueToday > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 sm:p-6 rounded-lg shadow border border-red-200 dark:border-red-800">
                  <h3 className="text-red-700 dark:text-red-300 text-sm font-medium">Payments Due Today</h3>
                  <p className="text-2xl sm:text-3xl font-bold mt-2 text-red-900 dark:text-red-100">
                    {stats.payments.dueToday}
                  </p>
                  <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-1">
                    Require immediate attention
                  </p>
                </div>
              )}
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
              <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('pages.reports.todaysVisitors')}</h3>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.visitors.today}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
              <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('pages.reports.occupancyRate')}</h3>
              <div className="mt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('pages.reports.current')}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {stats.rooms.occupancyRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-4 rounded-full"
                    style={{ width: `${stats.rooms.occupancyRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'financial' && (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-white">Financial Report</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="font-medium text-gray-900 dark:text-white">Total Revenue</span>
              <span className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                ₹{(stats.payments.revenue || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="font-medium text-gray-900 dark:text-white">Total Payments</span>
              <span className="text-lg sm:text-xl text-gray-900 dark:text-white">{stats.payments.total || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="font-medium text-gray-900 dark:text-white">Completed Payments</span>
              <span className="text-lg sm:text-xl text-green-600 dark:text-green-400">{stats.payments.paid || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="font-medium text-gray-900 dark:text-white">Pending Payments</span>
              <span className="text-lg sm:text-xl text-yellow-600 dark:text-yellow-400">
                {stats.payments.pending || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="font-medium text-gray-900 dark:text-white">Overdue Payments</span>
              <span className="text-lg sm:text-xl text-red-600 dark:text-red-400">
                {stats.payments.overdue || 0}
              </span>
            </div>
          </div>
        </div>
      )}

      {reportType === 'occupancy' && (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-white">Occupancy Report</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="font-medium text-gray-900 dark:text-white">Total Rooms</span>
              <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.rooms.total}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="font-medium text-gray-900 dark:text-white">Occupied Rooms</span>
              <span className="text-lg sm:text-xl text-blue-600 dark:text-blue-400">{stats.rooms.occupied}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="font-medium text-gray-900 dark:text-white">Available Rooms</span>
              <span className="text-lg sm:text-xl text-green-600 dark:text-green-400">{stats.rooms.available}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="font-medium text-gray-900 dark:text-white">Occupancy Rate</span>
              <span className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.rooms.occupancyRate.toFixed(1)}%
              </span>
            </div>
            <div className="mt-6">
              <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Occupancy Visualization</h3>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-8 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ width: `${stats.rooms.occupancyRate}%` }}
                >
                  {stats.rooms.occupancyRate.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </FeatureGuard>
  );
}
