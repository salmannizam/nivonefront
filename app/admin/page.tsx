'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalUsers: number;
  plans: {
    free: number;
    pro: number;
    enterprise: number;
  };
}

interface SubscriptionDue {
  tenantId: {
    name: string;
    slug: string;
  };
  planId: {
    name: string;
    price: number;
  };
  nextBillingDate: string;
  amount: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [dueSubscriptions, setDueSubscriptions] = useState<SubscriptionDue[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [statsRes, dueRes] = await Promise.all([
        api.get('/admin/tenants/stats'),
        api.get('/admin/plans/due?days=30').catch(() => ({ data: [] })),
      ]);
      setStats(statsRes.data);
      setDueSubscriptions(dueRes.data || []);
    } catch (error: any) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400 text-lg">Loading platform stats...</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-600 dark:text-red-400 text-lg font-semibold">Failed to load platform stats</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      <div className="animate-slideInLeft">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
          Platform Dashboard
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
          Overview of all tenants and platform statistics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-800 dark:via-blue-900/20 dark:to-indigo-900/20 p-4 sm:p-5 md:p-6 rounded-2xl shadow-xl border-2 border-blue-100 dark:border-blue-900/30 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 animate-slideInUp">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-bold uppercase tracking-wide mb-2">
                Total Tenants
              </h3>
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                {stats.totalTenants}
              </p>
            </div>
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform">
              <span className="text-3xl sm:text-4xl">🏢</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 dark:from-gray-800 dark:via-green-900/20 dark:to-emerald-900/20 p-4 sm:p-5 md:p-6 rounded-2xl shadow-xl border-2 border-green-100 dark:border-green-900/30 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 animate-slideInUp" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-bold uppercase tracking-wide mb-2">
                Active Tenants
              </h3>
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                {stats.activeTenants}
              </p>
            </div>
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform">
              <span className="text-3xl sm:text-4xl">✓</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-pink-900/20 p-4 sm:p-5 md:p-6 rounded-2xl shadow-xl border-2 border-purple-100 dark:border-purple-900/30 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 animate-slideInUp" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-bold uppercase tracking-wide mb-2">
                Total Users
              </h3>
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                {stats.totalUsers}
              </p>
            </div>
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform">
              <span className="text-3xl sm:text-4xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white via-red-50/30 to-rose-50/30 dark:from-gray-800 dark:via-red-900/20 dark:to-rose-900/20 p-4 sm:p-5 md:p-6 rounded-2xl shadow-xl border-2 border-red-100 dark:border-red-900/30 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 animate-slideInUp" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-bold uppercase tracking-wide mb-2">
                Suspended
              </h3>
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400 bg-clip-text text-transparent">
                {stats.suspendedTenants}
              </p>
            </div>
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform">
              <span className="text-3xl sm:text-4xl">⚠️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Breakdown */}
      <div className="bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-gray-800 dark:via-indigo-900/20 dark:to-purple-900/20 p-4 sm:p-6 rounded-2xl shadow-xl border-2 border-indigo-100 dark:border-indigo-900/30 animate-slideInUp">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Plans Distribution
          </span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="text-center p-5 sm:p-6 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-500 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:shadow-xl transition-all transform hover:scale-105 animate-slideInLeft">
            <div className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-2">
              {stats.plans.free}
            </div>
            <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-bold">Free Plan</div>
          </div>
          <div className="text-center p-5 sm:p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 rounded-xl border-2 border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all transform hover:scale-105 animate-slideInUp" style={{ animationDelay: '50ms' }}>
            <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-2">
              {stats.plans.pro}
            </div>
            <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-bold">Pro Plan</div>
          </div>
          <div className="text-center p-5 sm:p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-rose-900/30 rounded-xl border-2 border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all transform hover:scale-105 animate-slideInRight">
            <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
              {stats.plans.enterprise}
            </div>
            <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-bold">Enterprise Plan</div>
          </div>
        </div>
      </div>

      {/* Payments Due */}
      {dueSubscriptions.length > 0 && (
        <div className="bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-900/20 dark:via-amber-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-2xl p-4 sm:p-6 shadow-xl animate-slideInUp">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-yellow-900 dark:text-yellow-200 flex items-center gap-2">
              <span className="text-2xl animate-pulse">💰</span>
              Payments Due (Next 30 Days)
            </h2>
            <Link
              href="/admin/plans/subscriptions"
              className="text-sm font-bold text-yellow-800 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-200 transition-colors flex items-center gap-1 transform hover:scale-105"
            >
              View All <span className="text-lg">→</span>
            </Link>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {dueSubscriptions.slice(0, 5).map((sub, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-yellow-100 dark:border-yellow-900/30 hover:shadow-lg transition-all transform hover:scale-[1.02] animate-slideInUp"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 dark:text-white truncate text-base sm:text-lg">
                    {sub.tenantId.name} ({sub.tenantId.slug})
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {sub.planId.name} • Due: {formatDate(sub.nextBillingDate)} • ₹{sub.amount.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            {dueSubscriptions.length > 5 && (
              <div className="text-center pt-2">
                <Link
                  href="/admin/plans/subscriptions"
                  className="text-sm font-bold text-yellow-800 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-200 transition-colors transform hover:scale-105 inline-block"
                >
                  + {dueSubscriptions.length - 5} more
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-800 dark:via-blue-900/20 dark:to-indigo-900/20 p-4 sm:p-6 rounded-2xl shadow-xl border-2 border-blue-100 dark:border-blue-900/30 animate-slideInUp">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Quick Actions
          </span>
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/tenants"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-500 dark:via-indigo-500 dark:to-purple-500 text-white rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:via-indigo-600 dark:hover:to-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold text-sm sm:text-base"
          >
            🏢 Manage Tenants
          </Link>
          <Link
            href="/admin/plans"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 dark:from-purple-500 dark:via-pink-500 dark:to-rose-500 text-white rounded-xl hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 dark:hover:from-purple-600 dark:hover:via-pink-600 dark:hover:to-rose-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold text-sm sm:text-base"
          >
            💳 Manage Plans
          </Link>
          <Link
            href="/admin/features"
            className="px-6 py-3 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-500 dark:via-emerald-500 dark:to-teal-500 text-white rounded-xl hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 dark:hover:from-green-600 dark:hover:via-emerald-600 dark:hover:to-teal-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold text-sm sm:text-base"
          >
            ⚙️ Manage Features
          </Link>
          <Link
            href="/admin/subscriptions"
            className="px-6 py-3 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 dark:from-orange-500 dark:via-amber-500 dark:to-yellow-500 text-white rounded-xl hover:from-orange-700 hover:via-amber-700 hover:to-yellow-700 dark:hover:from-orange-600 dark:hover:via-amber-600 dark:hover:to-yellow-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold text-sm sm:text-base"
          >
            📋 Subscriptions
          </Link>
        </div>
      </div>
    </div>
  );
}
