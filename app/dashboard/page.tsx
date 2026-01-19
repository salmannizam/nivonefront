'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { logError } from '@/lib/utils';
import { useFeatures } from '@/lib/feature-context';
import { useI18n } from '@/lib/i18n-context';

interface DashboardStats {
  residents: { total: number; active: number; vacatedThisMonth?: number; vacatingSoon?: number };
  rooms: { total: number; occupied: number; available: number; occupancyRate: number };
  beds?: { total: number; available: number; occupied: number; maintenance: number; occupancyRate: string; becomingAvailableSoon?: number };
  payments: { total: number; paid: number; pending: number; overdue: number; revenue: number; totalPending: number; dueToday?: number; dueNext7Days?: number };
  securityDeposits?: { totalHeld: number; count: number };
  complaints: { total: number; open: number; pending3Days?: number };
  visitors: { today: number };
  staff?: { total: number; active: number; inactive: number; byRole: Record<string, number> };
  assets?: { total: number; working: number; repair: number; maintenanceDue: number };
  gatePasses?: { active: number; overdue: number };
  attentionNeeded?: {
    overdueRent: number;
    complaintsPending: number;
    complaintsPending3Days: number;
    bedsUnderMaintenance: number;
    residentsVacatingSoon: number;
  };
}

export default function DashboardPage() {
  const { t } = useI18n();
  const { isFeatureEnabled } = useFeatures();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Dashboard: Starting to fetch stats...');
    api
      .get('/reports/dashboard')
      .then((response) => {
        console.log('Dashboard stats loaded successfully:', response.data);
        setStats(response.data);
        setError(null);
        setLoading(false);
      })
      .catch((error: any) => {
        logError(error, 'Failed to load dashboard stats');
        
        // Set user-friendly error message
        const errorMessage = error?.response?.data?.message 
          || error?.response?.statusText 
          || error?.message 
          || 'Failed to load dashboard data';
        setError(`${errorMessage} (Status: ${error?.response?.status || 'Unknown'})`);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400 text-lg">{t('dashboard.loading')}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] animate-fadeIn">
        <div className="bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 dark:from-red-900/20 dark:via-rose-900/20 dark:to-pink-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 sm:p-8 shadow-xl max-w-md w-full">
          <div className="text-red-600 dark:text-red-400 text-xl font-bold mb-2 flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            {t('dashboard.failedToLoad')}
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            {error}
          </div>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              window.location.reload();
            }}
            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-500 dark:via-purple-500 dark:to-pink-500 text-white rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 dark:hover:from-indigo-600 dark:hover:via-purple-600 dark:hover:to-pink-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold"
          >
            🔄 {t('dashboard.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-600 dark:text-red-400 text-lg font-bold">{t('dashboard.failedToLoad')}</div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent animate-slideInLeft">
        {t('dashboard.title')}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-800 dark:via-blue-900/20 dark:to-indigo-900/20 p-3 sm:p-4 rounded-xl shadow-lg border-2 border-blue-100 dark:border-blue-900/30 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-slideInUp">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide">{t('dashboard.totalResidents')}</h3>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md">
              <span className="text-lg sm:text-xl">👥</span>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            {stats.residents.total}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">
            {stats.residents.active} {t('dashboard.active')}
          </p>
        </div>

        {stats.beds && isFeatureEnabled('beds') && (
          <div className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-pink-900/20 p-3 sm:p-4 rounded-xl shadow-lg border-2 border-purple-100 dark:border-purple-900/30 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-slideInUp" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide">{t('dashboard.beds')}</h3>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-md">
                <span className="text-lg sm:text-xl">🛏️</span>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              {stats.beds.total}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">
              {stats.beds.available} {t('dashboard.available')}, {stats.beds.occupied} {t('dashboard.occupied')}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 font-medium">
              {t('dashboard.occupancy')}: {stats.beds.occupancyRate}%
            </p>
          </div>
        )}

        <div className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 dark:from-gray-800 dark:via-green-900/20 dark:to-emerald-900/20 p-3 sm:p-4 rounded-xl shadow-lg border-2 border-green-100 dark:border-green-900/30 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-slideInUp" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide">{t('dashboard.rooms')}</h3>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md">
              <span className="text-lg sm:text-xl">🏠</span>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
            {stats.rooms.total}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">
            {stats.rooms.occupied} {t('dashboard.occupied')}, {stats.rooms.available} {t('dashboard.available')}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 font-medium">
            {t('dashboard.occupancy')}: {stats.rooms.occupancyRate.toFixed(1)}%
          </p>
        </div>

        <div className="bg-gradient-to-br from-white via-yellow-50/30 to-amber-50/30 dark:from-gray-800 dark:via-yellow-900/20 dark:to-amber-900/20 p-3 sm:p-4 rounded-xl shadow-lg border-2 border-yellow-100 dark:border-yellow-900/30 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-slideInUp" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide">{t('dashboard.revenue')}</h3>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md">
              <span className="text-lg sm:text-xl">💰</span>
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400 bg-clip-text text-transparent">
            ₹{stats.payments.revenue.toLocaleString()}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">
            {stats.payments.paid} {t('dashboard.paid')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-900/20 dark:via-amber-900/20 dark:to-yellow-900/20 p-3 sm:p-4 rounded-xl shadow-lg border-2 border-orange-200 dark:border-orange-800 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-slideInUp" onClick={() => window.location.href = '/dashboard/payments?status=DUE&dueToday=true'}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-orange-700 dark:text-orange-300 text-xs font-semibold uppercase tracking-wide">{t('dashboard.rentDueToday')}</h3>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md">
              <span className="text-lg sm:text-xl">⏰</span>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">
            {stats.payments.dueToday || 0}
          </p>
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">
            {t('dashboard.clickToViewDetails')}
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 dark:from-red-900/20 dark:via-rose-900/20 dark:to-pink-900/20 p-3 sm:p-4 rounded-xl shadow-lg border-2 border-red-200 dark:border-red-800 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-slideInUp" style={{ animationDelay: '50ms' }} onClick={() => window.location.href = '/dashboard/payments?status=OVERDUE'}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-red-700 dark:text-red-300 text-xs font-semibold uppercase tracking-wide">{t('dashboard.overduePayments')}</h3>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-md">
              <span className="text-lg sm:text-xl">🚨</span>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">
            {stats.payments.overdue || 0}
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
            {t('dashboard.clickToViewDetails')}
          </p>
        </div>

        {stats.securityDeposits && isFeatureEnabled('securityDeposits') && (
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 p-3 sm:p-4 rounded-xl shadow-lg border-2 border-blue-200 dark:border-blue-800 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-slideInUp" style={{ animationDelay: '100ms' }} onClick={() => window.location.href = '/dashboard/payments?section=deposits'}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wide">{t('dashboard.securityDeposits')}</h3>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md">
                <span className="text-lg sm:text-xl">🔒</span>
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
              ₹{stats.securityDeposits.totalHeld?.toLocaleString() || '0'}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
              {stats.securityDeposits.count} {t('dashboard.activeDeposits')}
            </p>
          </div>
        )}

        {stats.beds && stats.beds.maintenance > 0 && isFeatureEnabled('beds') && (
          <div className="bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-900/20 dark:via-amber-900/20 dark:to-orange-900/20 p-3 sm:p-4 rounded-xl shadow-lg border-2 border-yellow-200 dark:border-yellow-800 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-slideInUp" style={{ animationDelay: '150ms' }} onClick={() => window.location.href = '/dashboard/beds?status=MAINTENANCE'}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-yellow-700 dark:text-yellow-300 text-xs font-semibold uppercase tracking-wide">{t('dashboard.bedsUnderMaintenance')}</h3>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md">
                <span className="text-lg sm:text-xl">🔧</span>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.beds.maintenance}
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-medium">
              {t('dashboard.clickToViewDetails')}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-900/20 dark:via-amber-900/20 dark:to-orange-900/20 p-3 sm:p-4 rounded-xl shadow-lg border-2 border-yellow-200 dark:border-yellow-800 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-slideInUp">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-yellow-700 dark:text-yellow-300 text-xs font-semibold uppercase tracking-wide">{t('dashboard.pendingPayments')}</h3>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md">
              <span className="text-lg sm:text-xl">⏳</span>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            {stats.payments.pending || 0}
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-medium">
            ₹{stats.payments.totalPending?.toLocaleString() || '0'}
          </p>
        </div>

        {stats.residents.vacatedThisMonth !== undefined && (
          <div className="bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50 dark:from-gray-800 dark:via-slate-800 dark:to-zinc-800 p-3 sm:p-4 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-slideInUp" style={{ animationDelay: '50ms' }} onClick={() => window.location.href = '/dashboard/residents?status=VACATED'}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-700 dark:text-gray-300 text-xs font-semibold uppercase tracking-wide">{t('dashboard.vacatedThisMonth')}</h3>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-gray-400 to-slate-500 flex items-center justify-center shadow-md">
                <span className="text-lg sm:text-xl">🚪</span>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {stats.residents.vacatedThisMonth}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">
              {t('dashboard.clickToViewDetails')}
            </p>
          </div>
        )}

        {stats.staff && isFeatureEnabled('staff') && (
          <div className="bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 dark:from-teal-900/20 dark:via-cyan-900/20 dark:to-blue-900/20 p-3 sm:p-4 rounded-xl shadow-lg border-2 border-teal-200 dark:border-teal-800 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-slideInUp" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-teal-700 dark:text-teal-300 text-xs font-semibold uppercase tracking-wide">{t('dashboard.staff')}</h3>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-md">
                <span className="text-lg sm:text-xl">👔</span>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
              {stats.staff.total}
            </p>
            <p className="text-xs text-teal-600 dark:text-teal-400 mt-1 font-medium">
              {stats.staff.active} {t('dashboard.active')}
            </p>
          </div>
        )}

        {stats.assets && isFeatureEnabled('assets') && (
          <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-900/20 dark:via-purple-900/20 dark:to-fuchsia-900/20 p-3 sm:p-4 rounded-xl shadow-lg border-2 border-violet-200 dark:border-violet-800 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-slideInUp" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-violet-700 dark:text-violet-300 text-xs font-semibold uppercase tracking-wide">{t('dashboard.assets')}</h3>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-md">
                <span className="text-lg sm:text-xl">📦</span>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
              {stats.assets.total}
            </p>
            <p className="text-xs text-violet-600 dark:text-violet-400 mt-1 font-medium">
              {stats.assets.maintenanceDue} {t('dashboard.maintenanceDue')}
            </p>
          </div>
        )}
      </div>

      {/* Attention Needed Panel */}
      {stats.attentionNeeded && (
        ((isFeatureEnabled('rentPayments') && stats.attentionNeeded.overdueRent > 0) ||
          (isFeatureEnabled('complaints') && stats.attentionNeeded.complaintsPending > 0) ||
          (isFeatureEnabled('beds') && stats.attentionNeeded.bedsUnderMaintenance > 0) ||
          stats.attentionNeeded.residentsVacatingSoon > 0) && (
          <div className="mb-6 sm:mb-8 animate-slideInUp">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 dark:from-red-400 dark:via-orange-400 dark:to-yellow-400 bg-clip-text text-transparent flex items-center gap-2">
              <span className="text-2xl sm:text-3xl animate-pulse">⚠️</span>
              {t('dashboard.attentionNeeded')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {stats.attentionNeeded.overdueRent > 0 && (
                <div
                  className="bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 dark:from-red-900/20 dark:via-rose-900/20 dark:to-pink-900/20 border-2 border-red-200 dark:border-red-800 p-3 sm:p-4 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-slideInUp"
                  onClick={() => window.location.href = '/dashboard/payments?status=OVERDUE'}
                >
                  <h3 className="text-xs font-bold text-red-800 dark:text-red-300 mb-1.5">{t('dashboard.overdueRent')}</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">
                    {stats.attentionNeeded.overdueRent}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">{t('dashboard.clickToView')}</p>
                </div>
              )}
              {stats.attentionNeeded.complaintsPending > 0 && isFeatureEnabled('complaints') && (
                <div
                  className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-900/20 dark:via-amber-900/20 dark:to-yellow-900/20 border-2 border-orange-200 dark:border-orange-800 p-3 sm:p-4 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-slideInUp"
                  style={{ animationDelay: '50ms' }}
                  onClick={() => window.location.href = '/dashboard/complaints?status=open'}
                >
                  <h3 className="text-xs font-bold text-orange-800 dark:text-orange-300 mb-1.5">{t('dashboard.pendingComplaints')}</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {stats.attentionNeeded.complaintsPending}
                  </p>
                  {stats.attentionNeeded.complaintsPending3Days > 0 && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">
                      {stats.attentionNeeded.complaintsPending3Days} {t('dashboard.pendingMoreThan3Days')}
                    </p>
                  )}
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5 font-medium">{t('dashboard.clickToView')}</p>
                </div>
              )}
              {stats.attentionNeeded.bedsUnderMaintenance > 0 && isFeatureEnabled('beds') && (
                <div
                  className="bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-900/20 dark:via-amber-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-800 p-3 sm:p-4 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-slideInUp"
                  style={{ animationDelay: '100ms' }}
                  onClick={() => window.location.href = '/dashboard/beds?status=MAINTENANCE'}
                >
                  <h3 className="text-xs font-bold text-yellow-800 dark:text-yellow-300 mb-1.5">{t('dashboard.bedsUnderMaintenance')}</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stats.attentionNeeded.bedsUnderMaintenance}
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-medium">{t('dashboard.clickToView')}</p>
                </div>
              )}
              {stats.attentionNeeded.residentsVacatingSoon > 0 && (
                <div
                  className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 p-3 sm:p-4 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-slideInUp"
                  style={{ animationDelay: '150ms' }}
                  onClick={() => window.location.href = '/dashboard/residents?status=NOTICE_GIVEN'}
                >
                  <h3 className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-1.5">{t('dashboard.residentsVacatingSoon')}</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.attentionNeeded.residentsVacatingSoon}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">{t('dashboard.next30Days')}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 font-medium">{t('dashboard.clickToView')}</p>
                </div>
              )}
            </div>
          </div>
        )
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {isFeatureEnabled('visitors') && (
          <div className="bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 dark:from-cyan-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 p-3 sm:p-4 rounded-xl shadow-lg border-2 border-cyan-200 dark:border-cyan-800 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-slideInUp">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-cyan-800 dark:text-cyan-300">
                {t('dashboard.todaysVisitors')}
              </h3>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-md">
                <span className="text-lg sm:text-xl">👋</span>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
              {stats.visitors.today}
            </p>
          </div>
        )}

        {isFeatureEnabled('complaints') && (
          <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-900/20 dark:via-amber-900/20 dark:to-yellow-900/20 p-3 sm:p-4 rounded-xl shadow-lg border-2 border-orange-200 dark:border-orange-800 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-slideInUp" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-orange-800 dark:text-orange-300">
                {t('dashboard.complaints')}
              </h3>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md">
                <span className="text-lg sm:text-xl">📝</span>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 bg-clip-text text-transparent">
              {stats.complaints.total}
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">
              {stats.complaints.open} {t('dashboard.open')}
            </p>
          </div>
        )}

        {stats.gatePasses && isFeatureEnabled('gatePasses') && (
          <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 p-3 sm:p-4 rounded-xl shadow-lg border-2 border-green-200 dark:border-green-800 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-slideInUp" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-green-800 dark:text-green-300">
                {t('dashboard.activeGatePasses')}
              </h3>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md">
                <span className="text-lg sm:text-xl">🚪</span>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
              {stats.gatePasses.active}
            </p>
            {stats.gatePasses.overdue > 0 && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-bold animate-pulse">
                ⚠️ {stats.gatePasses.overdue} {t('dashboard.overdue')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
