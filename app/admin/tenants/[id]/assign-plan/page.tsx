'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { showSuccess, showError, formatDate } from '@/lib/utils';

interface Tenant {
  _id: string;
  name: string;
  slug: string;
  plan: string;
}

interface Plan {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  isActive: boolean;
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
}

export default function AssignPlanPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [formData, setFormData] = useState({
    planId: '',
    startDate: new Date().toISOString().split('T')[0],
    trialEndDate: '',
  });

  useEffect(() => {
    if (tenantId) {
      loadData();
    }
  }, [tenantId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tenantRes, plansRes, subscriptionRes] = await Promise.all([
        api.get(`/admin/tenants/${tenantId}`),
        api.get('/admin/plans?activeOnly=true'),
        api.get(`/admin/plans/tenants/${tenantId}/subscription`).catch(() => null),
      ]);
      setTenant(tenantRes.data);
      setPlans(plansRes.data);
      if (subscriptionRes?.data) {
        setSubscription(subscriptionRes.data);
        setFormData({
          planId: subscriptionRes.data.planId._id,
          startDate: new Date(subscriptionRes.data.startDate).toISOString().split('T')[0],
          trialEndDate: subscriptionRes.data.endDate ? new Date(subscriptionRes.data.endDate).toISOString().split('T')[0] : '',
        });
      }
    } catch (error: any) {
      showError(error, 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.planId) {
      showError(null, 'Please select a plan');
      return;
    }

    try {
      setAssigning(true);
      const payload: any = {
        planId: formData.planId,
      };
      if (formData.startDate) {
        payload.startDate = formData.startDate;
      }
      if (formData.trialEndDate) {
        payload.trialEndDate = formData.trialEndDate;
      }

      await api.post(`/admin/plans/tenants/${tenantId}/assign`, payload);
      showSuccess('Plan assigned successfully!');
      router.push(`/admin/tenants/${tenantId}/view`);
    } catch (error: any) {
      showError(error, 'Failed to assign plan');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400 text-lg">Loading...</div>
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

  const selectedPlan = plans.find((p) => p._id === formData.planId);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      <div className="animate-slideInDown">
        <button
          onClick={() => router.back()}
          className="mb-3 sm:mb-4 text-sm sm:text-base text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-medium transition-colors flex items-center gap-1 transform hover:scale-105"
        >
          <span>←</span> Back to Tenants
        </button>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
          Assign Plan: {tenant.name}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
          Select a subscription plan for this tenant
        </p>
      </div>

      {/* Current Subscription */}
      {subscription && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 p-4 sm:p-5 rounded-2xl animate-slideInLeft shadow-lg">
          <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-3 sm:mb-4 flex items-center gap-2 text-lg">
            <span className="text-2xl animate-pulse">📋</span>
            Current Subscription
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            {[
              { label: 'Plan', value: subscription.planId.name },
              { label: 'Status', value: subscription.status, badge: true },
              { label: 'Start Date', value: formatDate(subscription.startDate) },
              { label: 'Next Billing', value: formatDate(subscription.nextBillingDate) },
              { label: 'Amount', value: `₹${subscription.amount.toLocaleString()}` },
              { label: 'Paid', value: subscription.isPaid ? 'Yes' : 'No', badge: true, paid: subscription.isPaid },
            ].map((item, index) => (
              <div key={index} className="bg-white/50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-200 dark:border-gray-600">
                <strong className="text-blue-800 dark:text-blue-200">{item.label}:</strong>{' '}
                {item.badge ? (
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      item.paid
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                        : item.value === 'active'
                        ? 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white'
                        : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                    }`}
                  >
                    {item.value}
                  </span>
                ) : (
                  <span className="text-blue-800 dark:text-blue-200 font-semibold">{item.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign Plan Form */}
      <div className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-pink-900/20 p-4 sm:p-6 rounded-2xl shadow-2xl border-2 border-purple-100 dark:border-purple-900/30 animate-slideInUp">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white flex items-center gap-2">
          <span className="text-2xl animate-bounce">💳</span>
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            {subscription ? 'Change Plan' : 'Assign Plan'}
          </span>
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="transform transition-all hover:scale-105">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Select Plan *
            </label>
            <select
              required
              value={formData.planId}
              onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-md hover:shadow-lg"
            >
              <option value="">Select a plan</option>
              {plans.map((plan) => (
                <option key={plan._id} value={plan._id}>
                  {plan.name} - ₹{plan.price}/{plan.billingCycle}
                </option>
              ))}
            </select>
          </div>

          {selectedPlan && (
            <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-indigo-900/30 p-5 rounded-xl border-2 border-purple-200 dark:border-purple-700 shadow-lg transform hover:scale-105 transition-all animate-slideInUp">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-xl">
                  {selectedPlan.name}
                </h3>
                <span className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-bold shadow-md">
                  {selectedPlan.billingCycle}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {selectedPlan.description}
              </p>
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                ₹{selectedPlan.price.toLocaleString()}/{selectedPlan.billingCycle}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="transform transition-all hover:scale-105">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-md hover:shadow-lg"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                When the subscription should start
              </p>
            </div>

            <div className="transform transition-all hover:scale-105">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Trial End Date (Optional)
              </label>
              <input
                type="date"
                value={formData.trialEndDate}
                onChange={(e) => setFormData({ ...formData, trialEndDate: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-md hover:shadow-lg"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                Leave empty for immediate paid subscription
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={assigning || !formData.planId}
              className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 dark:from-purple-500 dark:via-pink-500 dark:to-indigo-500 text-white rounded-xl hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700 dark:hover:from-purple-600 dark:hover:via-pink-600 dark:hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {assigning ? '💾 Assigning...' : '✨ ' + (subscription ? 'Update Plan' : 'Assign Plan')}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 sm:flex-none px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-bold transform hover:scale-105"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
