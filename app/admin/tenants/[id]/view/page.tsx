'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { showError, showSuccess } from '@/lib/utils';

interface Tenant {
  _id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  createdAt: string;
  stats?: {
    totalUsers: number;
    activeUsers: number;
  };
}

interface Subscription {
  _id: string;
  planId: {
    _id: string;
    name: string;
    price: number;
    billingCycle: string;
  };
  status: string;
  startDate: string;
  nextBillingDate: string;
  amount: number;
  isPaid: boolean;
  lastPaymentDate?: string;
}

export default function TenantViewPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenantId) {
      loadTenant();
    }
  }, [tenantId]);

  const loadTenant = async () => {
    try {
      setLoading(true);
      const [tenantRes, subscriptionRes] = await Promise.all([
        api.get(`/admin/tenants/${tenantId}`),
        api.get(`/admin/plans/tenants/${tenantId}/subscription`).catch(() => null),
      ]);
      setTenant(tenantRes.data);
      if (subscriptionRes?.data) {
        setSubscription(subscriptionRes.data);
      } else {
        setSubscription(null);
      }
    } catch (error: any) {
      showError(error, 'Failed to load tenant data');
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async () => {
    try {
      const response = await api.post(`/admin/tenants/${tenantId}/impersonate`);
      const { token } = response.data;
      alert(`Impersonation token generated. In production, this would automatically log you in as the tenant owner.`);
    } catch (error: any) {
      showError(error, 'Failed to generate impersonation token');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400 text-lg">Loading tenant data...</div>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-600 dark:text-red-400 text-lg font-semibold">Tenant not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      <div className="animate-slideInDown">
        <button
          onClick={() => router.back()}
          className="mb-3 sm:mb-4 text-sm sm:text-base text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-medium transition-colors flex items-center gap-1 transform hover:scale-105"
        >
          <span>←</span> Back to Tenants
        </button>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
              {tenant.name}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
              Tenant Details & Data Overview
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => router.push(`/admin/tenants/${tenantId}/features`)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-500 dark:to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 dark:hover:from-blue-600 dark:hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold text-sm sm:text-base"
            >
              ⚙️ Manage Features
            </button>
            <button
              onClick={() => router.push(`/admin/tenants/${tenantId}/assign-plan`)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 dark:hover:from-purple-600 dark:hover:to-pink-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold text-sm sm:text-base"
            >
              💳 {subscription ? 'Change Plan' : 'Assign Plan'}
            </button>
            <button
              onClick={() => router.push(`/admin/tenants/${tenantId}/notifications`)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-500 dark:to-amber-500 text-white rounded-xl hover:from-orange-700 hover:to-amber-700 dark:hover:from-orange-600 dark:hover:to-amber-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold text-sm sm:text-base"
            >
              🔔 Notifications
            </button>
            <button
              onClick={handleImpersonate}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold text-sm sm:text-base"
            >
              👤 Impersonate
            </button>
          </div>
        </div>
      </div>

      {/* Tenant Info & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-800 dark:via-blue-900/20 dark:to-indigo-900/20 p-4 sm:p-6 rounded-2xl shadow-xl border-2 border-blue-100 dark:border-blue-900/30 animate-slideInLeft">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Tenant Information
            </span>
          </h2>
          <dl className="space-y-4">
            <div className="bg-white/50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-200 dark:border-gray-600 transform hover:scale-105 transition-all">
              <dt className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Name</dt>
              <dd className="text-sm sm:text-base text-gray-900 dark:text-white font-bold">{tenant.name}</dd>
            </div>
            <div className="bg-white/50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-200 dark:border-gray-600 transform hover:scale-105 transition-all">
              <dt className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Slug (Subdomain)</dt>
              <dd className="text-sm sm:text-base">
                <code className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 px-3 py-1.5 rounded-lg text-gray-900 dark:text-white font-bold border border-purple-200 dark:border-purple-700">
                  {tenant.slug}
                </code>
              </dd>
            </div>
            <div className="bg-white/50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-200 dark:border-gray-600 transform hover:scale-105 transition-all">
              <dt className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Plan</dt>
              <dd className="text-sm sm:text-base text-gray-900 dark:text-white font-bold capitalize">{tenant.plan}</dd>
            </div>
            <div className="bg-white/50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-200 dark:border-gray-600 transform hover:scale-105 transition-all">
              <dt className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Status</dt>
              <dd className="mt-1">
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${
                    tenant.status === 'active'
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white animate-pulse'
                      : 'bg-gradient-to-r from-red-400 to-rose-500 text-white'
                  }`}
                >
                  {tenant.status}
                </span>
              </dd>
            </div>
            <div className="bg-white/50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-200 dark:border-gray-600 transform hover:scale-105 transition-all">
              <dt className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Created</dt>
              <dd className="text-sm sm:text-base text-gray-900 dark:text-white font-bold">
                {new Date(tenant.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 dark:from-gray-800 dark:via-green-900/20 dark:to-emerald-900/20 p-4 sm:p-6 rounded-2xl shadow-xl border-2 border-green-100 dark:border-green-900/30 animate-slideInRight">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
              Statistics
            </span>
          </h2>
          <dl className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 rounded-xl border-2 border-blue-200 dark:border-blue-900/30 transform hover:scale-105 transition-all shadow-md">
              <dt className="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Total Users</dt>
              <dd className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                {tenant.stats?.totalUsers || 0}
              </dd>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/30 dark:via-emerald-900/30 dark:to-teal-900/30 rounded-xl border-2 border-green-200 dark:border-green-900/30 transform hover:scale-105 transition-all shadow-md">
              <dt className="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Active Users</dt>
              <dd className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                {tenant.stats?.activeUsers || 0}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Subscription Info */}
      {subscription && (
        <div className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-pink-900/20 p-4 sm:p-6 rounded-2xl shadow-xl border-2 border-purple-100 dark:border-purple-900/30 animate-slideInUp">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
            <span className="text-2xl">💳</span>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Subscription Details
            </span>
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Plan', value: subscription.planId.name, icon: '📦' },
              { label: 'Billing Cycle', value: subscription.planId.billingCycle, icon: '🔄' },
              { label: 'Amount', value: `₹${subscription.amount.toLocaleString()}`, icon: '💰' },
              { label: 'Status', value: subscription.status, icon: '📊', badge: true },
              { label: 'Start Date', value: new Date(subscription.startDate).toLocaleDateString(), icon: '📅' },
              { label: 'Next Billing', value: new Date(subscription.nextBillingDate).toLocaleDateString(), icon: '⏰' },
              { label: 'Payment Status', value: subscription.isPaid ? 'Paid' : 'Unpaid', icon: '💵', badge: true, paid: subscription.isPaid },
              ...(subscription.lastPaymentDate ? [{ label: 'Last Payment', value: new Date(subscription.lastPaymentDate).toLocaleDateString(), icon: '✅' }] : []),
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white/50 dark:bg-gray-700/50 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 transform hover:scale-105 transition-all shadow-md animate-slideInUp"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <dt className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <span>{item.icon}</span>
                  {item.label}
                </dt>
                <dd className="mt-1">
                  {item.badge ? (
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${
                        item.paid
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                          : item.value === 'active'
                          ? 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white'
                          : 'bg-gradient-to-r from-red-400 to-rose-500 text-white'
                      }`}
                    >
                      {item.value}
                    </span>
                  ) : (
                    <span className="text-sm sm:text-base text-gray-900 dark:text-white font-bold">{item.value}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Note */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 p-4 sm:p-5 rounded-2xl animate-fadeIn">
        <p className="text-sm sm:text-base text-blue-800 dark:text-blue-200 flex items-start gap-2">
          <span className="text-xl">💡</span>
          <span>
            <strong className="font-bold">Note:</strong> To view detailed tenant data (residents, payments, etc.), use the "Impersonate Tenant" button to log in as the tenant owner. 
            This will give you full access to view all tenant data through their dashboard.
          </span>
        </p>
      </div>
    </div>
  );
}
