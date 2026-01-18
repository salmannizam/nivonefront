'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { showSuccess, showError, formatDate } from '@/lib/utils';

interface Plan {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  limits: {
    rooms: number;
    residents: number;
    staff: number;
    buildings?: number;
  };
  isActive: boolean;
  isDefault?: boolean;
  tenantCount?: number;
  createdAt: string;
}

interface SubscriptionDue {
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
  nextBillingDate: string;
  amount: number;
  isPaid: boolean;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [dueSubscriptions, setDueSubscriptions] = useState<SubscriptionDue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    billingCycle: 'monthly' as 'monthly' | 'yearly',
    features: [] as string[],
    limits: {
      rooms: -1,
      residents: -1,
      staff: -1,
      buildings: -1,
    },
    isActive: true,
    isDefault: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansRes, featuresRes, dueRes] = await Promise.all([
        api.get('/admin/plans'),
        api.get('/admin/features?activeOnly=true').catch(() => ({ data: [] })),
        api.get('/admin/plans/due?days=30'),
      ]);
      setPlans(plansRes.data);
      setFeatures(featuresRes.data || []);
      setDueSubscriptions(dueRes.data || []);
    } catch (error: any) {
      showError(error, 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/plans', formData);
      showSuccess('Plan created successfully!');
      setShowForm(false);
      setFormData({
        name: '',
        slug: '',
        description: '',
        price: 0,
        billingCycle: 'monthly',
        features: [],
        limits: {
          rooms: -1,
          residents: -1,
          staff: -1,
          buildings: -1,
        },
        isActive: true,
        isDefault: false,
      });
      loadData();
    } catch (error: any) {
      showError(error, 'Failed to create plan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan? If it is assigned to tenants, it will be deactivated instead.')) return;
    try {
      await api.delete(`/admin/plans/${id}`);
      showSuccess('Plan deleted/deactivated successfully!');
      loadData();
    } catch (error: any) {
      showError(error, 'Failed to delete plan');
    }
  };

  const handleMarkPaid = async (tenantId: string, amount: number) => {
    try {
      await api.post(`/admin/plans/tenants/${tenantId}/mark-paid`, { amount });
      showSuccess('Payment marked as paid!');
      loadData();
    } catch (error: any) {
      showError(error, 'Failed to mark payment as paid');
    }
  };

  const handleSetDefault = async (planId: string) => {
    try {
      await api.post(`/admin/plans/${planId}/set-default`);
      showSuccess('Plan set as default successfully!');
      loadData();
    } catch (error: any) {
      showError(error, 'Failed to set default plan');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600 dark:text-gray-400">Loading plans...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 animate-slideInLeft">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Plan Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
            Create and manage subscription plans for tenants
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-500 dark:via-indigo-500 dark:to-purple-500 text-white rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:via-indigo-600 dark:hover:to-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold text-sm sm:text-base"
        >
          {showForm ? '✕ Cancel' : '+ Create Plan'}
        </button>
      </div>

      {/* Payment Due Alerts */}
      {dueSubscriptions.length > 0 && (
        <div className="bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-900/20 dark:via-amber-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-2xl p-4 sm:p-6 shadow-xl animate-slideInUp">
          <h2 className="text-lg sm:text-xl font-bold text-yellow-900 dark:text-yellow-200 mb-4 flex items-center gap-2">
            <span className="text-2xl animate-pulse">💰</span>
            Payments Due (Next 30 Days)
          </h2>
          <div className="space-y-2 sm:space-y-3">
            {dueSubscriptions.map((sub, index) => (
              <div
                key={sub._id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-yellow-100 dark:border-yellow-900/30 hover:shadow-lg transition-all transform hover:scale-[1.02] animate-slideInUp"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">
                    {sub.tenantId.name} ({sub.tenantId.slug})
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Plan: {sub.planId.name} • Due: {formatDate(sub.nextBillingDate)} • ₹{sub.amount.toLocaleString()}
                  </div>
                </div>
                {!sub.isPaid && (
                  <button
                    onClick={() => handleMarkPaid(sub.tenantId._id, sub.amount)}
                    className="mt-2 sm:mt-0 px-4 py-2 text-sm bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-600 transition-all shadow-md hover:shadow-lg font-bold transform hover:scale-105"
                  >
                    Mark Paid
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Plan Form */}
      {showForm && (
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-800 dark:via-blue-900/20 dark:to-indigo-900/20 p-4 sm:p-6 rounded-2xl shadow-xl border-2 border-blue-100 dark:border-blue-900/30 animate-slideInUp">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
            <span className="text-2xl">💳</span>
            Create New Plan
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="transform transition-all hover:scale-105">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Plan Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-md hover:shadow-lg"
                />
              </div>
              <div className="transform transition-all hover:scale-105">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Slug
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-md hover:shadow-lg"
                  placeholder="pro-plan"
                />
              </div>
              <div className="md:col-span-2 transform transition-all hover:scale-105">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-md hover:shadow-lg"
                  rows={3}
                />
              </div>
              <div className="transform transition-all hover:scale-105">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Price (₹)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-green-500/50 focus:border-green-500 transition-all shadow-md hover:shadow-lg"
                />
              </div>
              <div className="transform transition-all hover:scale-105">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Billing Cycle
                </label>
                <select
                  value={formData.billingCycle}
                  onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as any })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-pink-500/50 focus:border-pink-500 transition-all shadow-md hover:shadow-lg"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            {/* Limits Section */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-xl">📊</span>
                Resource Limits (-1 means unlimited)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="transform transition-all hover:scale-105">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Rooms Limit
                  </label>
                  <input
                    type="number"
                    min="-1"
                    value={formData.limits.rooms}
                    onChange={(e) => setFormData({
                      ...formData,
                      limits: { ...formData.limits, rooms: parseInt(e.target.value) || -1 }
                    })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-md hover:shadow-lg"
                    placeholder="-1 for unlimited"
                  />
                </div>
                <div className="transform transition-all hover:scale-105">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Residents Limit
                  </label>
                  <input
                    type="number"
                    min="-1"
                    value={formData.limits.residents}
                    onChange={(e) => setFormData({
                      ...formData,
                      limits: { ...formData.limits, residents: parseInt(e.target.value) || -1 }
                    })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-green-500/50 focus:border-green-500 transition-all shadow-md hover:shadow-lg"
                    placeholder="-1 for unlimited"
                  />
                </div>
                <div className="transform transition-all hover:scale-105">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Staff Limit
                  </label>
                  <input
                    type="number"
                    min="-1"
                    value={formData.limits.staff}
                    onChange={(e) => setFormData({
                      ...formData,
                      limits: { ...formData.limits, staff: parseInt(e.target.value) || -1 }
                    })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-md hover:shadow-lg"
                    placeholder="-1 for unlimited"
                  />
                </div>
                <div className="transform transition-all hover:scale-105">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Buildings Limit
                  </label>
                  <input
                    type="number"
                    min="-1"
                    value={formData.limits.buildings || -1}
                    onChange={(e) => setFormData({
                      ...formData,
                      limits: { ...formData.limits, buildings: parseInt(e.target.value) || -1 }
                    })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-md hover:shadow-lg"
                    placeholder="-1 for unlimited"
                  />
                </div>
              </div>
            </div>

            {/* Default Plan Checkbox */}
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl border-2 border-yellow-200 dark:border-yellow-800">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500 focus:ring-2"
              />
              <label htmlFor="isDefault" className="text-sm font-bold text-gray-900 dark:text-white cursor-pointer">
                Set as Default Plan (This plan will be assigned to new tenants during signup)
              </label>
            </div>
            
            {/* Active Status Checkbox */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="isActive" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                Active
              </label>
            </div>
            
            {/* Feature Selection */}
            {features.length > 0 && (
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  Features (Select features to include in this plan)
                </label>
                <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 sm:p-5 max-h-64 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 shadow-inner">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {features.map((feature, index) => {
                      const isSelected = formData.features.includes(feature.key);
                      return (
                        <label
                          key={feature._id}
                          className={`flex items-center p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                            isSelected
                              ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-md'
                              : 'border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  features: [...formData.features, feature.key],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  features: formData.features.filter((f) => f !== feature.key),
                                });
                              }
                            }}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2 transition-transform duration-200"
                          />
                          <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                            {feature.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-500 dark:via-indigo-500 dark:to-purple-500 text-white rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:via-indigo-600 dark:hover:to-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold"
              >
                ✨ Create Plan
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 sm:flex-none px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-bold transform hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plans List */}
      <div className="bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-gray-800 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl shadow-xl border-2 border-indigo-100 dark:border-indigo-900/30 overflow-hidden animate-slideInUp">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Billing Cycle
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Limits
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Tenants
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-lg">
                    No plans found
                  </td>
                </tr>
              ) : (
                plans.map((plan, index) => (
                  <tr 
                    key={plan._id} 
                    className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-900/10 dark:hover:to-indigo-900/10 transition-all animate-slideInUp"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900 dark:text-white">{plan.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{plan.description}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                        ₹{plan.price.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="text-xs space-y-1">
                        <div className="text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">Rooms:</span> {plan.limits.rooms === -1 ? '∞' : plan.limits.rooms}
                        </div>
                        <div className="text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">Residents:</span> {plan.limits.residents === -1 ? '∞' : plan.limits.residents}
                        </div>
                        <div className="text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">Staff:</span> {plan.limits.staff === -1 ? '∞' : plan.limits.staff}
                        </div>
                        {plan.limits.buildings !== undefined && (
                          <div className="text-gray-700 dark:text-gray-300">
                            <span className="font-semibold">Buildings:</span> {plan.limits.buildings === -1 ? '∞' : plan.limits.buildings}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-bold block ${
                            plan.isActive
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md animate-pulse-slow'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {plan.isActive ? '✓ Active' : 'Inactive'}
                        </span>
                        {plan.isDefault && (
                          <span className="px-3 py-1.5 rounded-full text-xs font-bold block bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-md">
                            ⭐ Default
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-lg text-gray-900 dark:text-white">
                        {plan.tenantCount || 0}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.location.href = `/admin/plans/${plan._id}/edit`}
                            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 transition-all shadow-md hover:shadow-lg font-bold transform hover:scale-105 text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(plan._id)}
                            className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-500 dark:to-rose-500 text-white rounded-lg hover:from-red-700 hover:to-rose-700 dark:hover:from-red-600 dark:hover:to-rose-600 transition-all shadow-md hover:shadow-lg font-bold transform hover:scale-105 text-xs"
                          >
                            Delete
                          </button>
                        </div>
                        {!plan.isDefault && (
                          <button
                            onClick={() => handleSetDefault(plan._id)}
                            className="px-3 py-1.5 bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-500 dark:to-amber-500 text-white rounded-lg hover:from-yellow-700 hover:to-amber-700 dark:hover:from-yellow-600 dark:hover:to-amber-600 transition-all shadow-md hover:shadow-lg font-bold transform hover:scale-105 text-xs"
                          >
                            ⭐ Set Default
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
