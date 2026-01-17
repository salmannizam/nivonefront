'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { showSuccess, showError } from '@/lib/utils';
import Link from 'next/link';

interface Subscription {
  _id: string;
  tenantId: {
    _id: string;
    name: string;
    slug: string;
  };
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
  billingCycle: string;
  isPaid: boolean;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'due' | 'paid' | 'trial'>('all');

  useEffect(() => {
    loadSubscriptions();
  }, [filter]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      let response;
      if (filter === 'due') {
        response = await api.get('/admin/plans/due?days=365');
      } else {
        // For now, get all due subscriptions and filter client-side
        // In production, you'd want a proper endpoint for all subscriptions
        response = await api.get('/admin/plans/due?days=365');
      }
      let data = response.data || [];
      
      // Client-side filtering
      if (filter === 'paid') {
        data = data.filter((sub: Subscription) => sub.isPaid);
      } else if (filter === 'trial') {
        data = data.filter((sub: Subscription) => sub.status === 'trial');
      } else if (filter === 'due') {
        data = data.filter((sub: Subscription) => !sub.isPaid);
      }
      
      setSubscriptions(data);
    } catch (error: any) {
      showError(error, 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (tenantId: string, amount: number) => {
    try {
      await api.post(`/admin/plans/tenants/${tenantId}/mark-paid`, { amount });
      showSuccess('Payment marked as paid!');
      loadSubscriptions();
    } catch (error: any) {
      showError(error, 'Failed to mark payment as paid');
    }
  };

  const getDaysUntilDue = (date: string): number => {
    const dueDate = new Date(date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600 dark:text-gray-400">Loading subscriptions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      <div className="animate-slideInLeft">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
          Subscriptions
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
          Manage tenant subscription plans and payments
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 sm:gap-3 flex-wrap animate-slideInDown">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 sm:px-5 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all transform hover:scale-105 ${
            filter === 'all'
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-500 dark:via-indigo-500 dark:to-purple-500 text-white shadow-lg'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 shadow-md hover:shadow-lg'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('trial')}
          className={`px-4 sm:px-5 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all transform hover:scale-105 ${
            filter === 'trial'
              ? 'bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 dark:from-yellow-500 dark:via-amber-500 dark:to-orange-500 text-white shadow-lg'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 shadow-md hover:shadow-lg'
          }`}
        >
          Trial
        </button>
        <button
          onClick={() => setFilter('paid')}
          className={`px-4 sm:px-5 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all transform hover:scale-105 ${
            filter === 'paid'
              ? 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-500 dark:via-emerald-500 dark:to-teal-500 text-white shadow-lg'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 shadow-md hover:shadow-lg'
          }`}
        >
          Paid
        </button>
        <button
          onClick={() => setFilter('due')}
          className={`px-4 sm:px-5 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all transform hover:scale-105 ${
            filter === 'due'
              ? 'bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 dark:from-red-500 dark:via-rose-500 dark:to-pink-500 text-white shadow-lg'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 shadow-md hover:shadow-lg'
          }`}
        >
          Payment Due
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-gray-800 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl shadow-xl border-2 border-indigo-100 dark:border-indigo-900/30 overflow-hidden animate-slideInUp">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Next Billing
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => {
                  const daysUntilDue = getDaysUntilDue(sub.nextBillingDate);
                  const isOverdue = daysUntilDue < 0 && !sub.isPaid;
                  return (
                    <tr key={sub._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/admin/tenants/${sub.tenantId._id}/view`}
                          className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors"
                        >
                          {sub.tenantId.name}
                        </Link>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{sub.tenantId.slug}</code>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900 dark:text-white font-medium">{sub.planId.name}</div>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {sub.billingCycle}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            sub.status === 'active'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : sub.status === 'trial'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300 font-medium">
                        ₹{sub.amount.toLocaleString()}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900 dark:text-white font-medium">
                          {new Date(sub.nextBillingDate).toLocaleDateString()}
                        </div>
                        <div
                          className={`text-xs mt-1 ${
                            isOverdue
                              ? 'text-red-600 dark:text-red-400 font-semibold'
                              : daysUntilDue <= 7
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {isOverdue
                            ? `${Math.abs(daysUntilDue)} days overdue`
                            : `${daysUntilDue} days remaining`}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            sub.isPaid
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}
                        >
                          {sub.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                        {!sub.isPaid && (
                          <button
                            onClick={() => handleMarkPaid(sub.tenantId._id, sub.amount)}
                            className="px-3 py-1.5 text-xs bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-600 transition-all shadow-md hover:shadow-lg font-medium"
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3 sm:space-y-4">
        {subscriptions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
            No subscriptions found
          </div>
        ) : (
          subscriptions.map((sub) => {
            const daysUntilDue = getDaysUntilDue(sub.nextBillingDate);
            const isOverdue = daysUntilDue < 0 && !sub.isPaid;
            return (
              <div
                key={sub._id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4 sm:p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/admin/tenants/${sub.tenantId._id}/view`}
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline text-base sm:text-lg"
                    >
                      {sub.tenantId.name}
                    </Link>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{sub.tenantId.slug}</code>
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${
                      sub.status === 'active'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : sub.status === 'trial'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Plan:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{sub.planId.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Amount:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">₹{sub.amount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Next Billing:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {new Date(sub.nextBillingDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Payment:</span>
                    <span
                      className={`ml-2 font-medium ${
                        sub.isPaid
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {sub.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
                {isOverdue && (
                  <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-semibold">
                      ⚠️ {Math.abs(daysUntilDue)} days overdue
                    </p>
                  </div>
                )}
                {!sub.isPaid && (
                  <button
                    onClick={() => handleMarkPaid(sub.tenantId._id, sub.amount)}
                    className="w-full px-4 py-2 text-sm bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-600 transition-all shadow-md hover:shadow-lg font-medium"
                  >
                    Mark Paid
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
