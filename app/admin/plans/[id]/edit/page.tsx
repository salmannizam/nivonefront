'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { showSuccess, showError } from '@/lib/utils';

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
  };
  isActive: boolean;
}

interface Feature {
  _id: string;
  name: string;
  key: string;
  category: string;
  description: string;
  isActive: boolean;
}

const categoryLabels: Record<string, string> = {
  core: 'Core',
  payments: 'Payments',
  operations: 'Operations',
  management: 'Management',
  analytics: 'Analytics',
  advanced: 'Advanced',
};

export default function EditPlanPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;
  
  const [plan, setPlan] = useState<Plan | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    billingCycle: 'monthly' as 'monthly' | 'yearly',
    features: [] as string[],
    isActive: true,
  });

  useEffect(() => {
    if (planId) {
      loadData();
    }
  }, [planId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [planRes, featuresRes] = await Promise.all([
        api.get(`/admin/plans/${planId}`),
        api.get('/admin/features?activeOnly=true'),
      ]);
      setPlan(planRes.data);
      setFeatures(featuresRes.data);
      setFormData({
        name: planRes.data.name,
        slug: planRes.data.slug,
        description: planRes.data.description,
        price: planRes.data.price,
        billingCycle: planRes.data.billingCycle,
        features: planRes.data.features || [],
        isActive: planRes.data.isActive,
      });
    } catch (error: any) {
      showError(error, 'Failed to load plan data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = (featureKey: string) => {
    setFormData((prev) => {
      const currentFeatures = prev.features || [];
      if (currentFeatures.includes(featureKey)) {
        return {
          ...prev,
          features: currentFeatures.filter((f) => f !== featureKey),
        };
      } else {
        return {
          ...prev,
          features: [...currentFeatures, featureKey],
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.patch(`/admin/plans/${planId}`, formData);
      showSuccess('Plan updated successfully!');
      router.push('/admin/plans');
    } catch (error: any) {
      showError(error, 'Failed to update plan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600 dark:text-gray-400">Loading plan...</div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-600 dark:text-red-400">Plan not found</div>
      </div>
    );
  }

  const groupedFeatures = features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, Feature[]>);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      <div className="animate-slideInLeft">
        <button
          onClick={() => router.back()}
          className="mb-3 sm:mb-4 text-sm sm:text-base text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-bold transition-colors flex items-center gap-1 transform hover:scale-105"
        >
          <span>←</span> Back to Plans
        </button>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
          Edit Plan: {plan.name}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
          Update plan details and feature assignments
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Plan Info */}
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-800 dark:via-blue-900/20 dark:to-indigo-900/20 p-4 sm:p-6 rounded-2xl shadow-xl border-2 border-blue-100 dark:border-blue-900/30 animate-slideInUp">
          <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
            <span className="text-xl">📝</span>
            Plan Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="transform transition-all hover:scale-105">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Plan Name *
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
                Slug *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-md hover:shadow-lg"
              />
            </div>
            <div className="md:col-span-2 transform transition-all hover:scale-105">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Description *
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
                Price (₹) *
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
                Billing Cycle *
              </label>
              <select
                required
                value={formData.billingCycle}
                onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as any })}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-pink-500/50 focus:border-pink-500 transition-all shadow-md hover:shadow-lg"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="transform transition-all hover:scale-105">
              <label className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-all">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2 transition-transform"
                />
                <span className="ml-3 text-sm font-bold text-gray-700 dark:text-gray-300">Active</span>
              </label>
            </div>
          </div>
        </div>

        {/* Feature Selection */}
        <div className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-pink-900/20 p-4 sm:p-6 rounded-2xl shadow-xl border-2 border-purple-100 dark:border-purple-900/30 animate-slideInUp">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            Feature Assignment
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
            Select features to include in this plan. Only active features from the catalog are shown.
          </p>
          
          {Object.entries(groupedFeatures).map(([category, categoryFeatures], catIndex) => {
            const categoryColors: Record<string, string> = {
              core: 'from-blue-500 to-indigo-600',
              payments: 'from-green-500 to-emerald-600',
              operations: 'from-purple-500 to-pink-600',
              management: 'from-orange-500 to-amber-600',
              analytics: 'from-teal-500 to-cyan-600',
              advanced: 'from-red-500 to-rose-600',
            };
            const gradient = categoryColors[category] || 'from-gray-500 to-gray-600';
            return (
              <div key={category} className="mb-6 sm:mb-8 last:mb-0 animate-slideInUp" style={{ animationDelay: `${catIndex * 100}ms` }}>
                <h3 className={`text-base sm:text-lg font-bold mb-3 sm:mb-4 pb-3 border-b-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r ${gradient} dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent`}>
                  {categoryLabels[category] || category}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {categoryFeatures.map((feature, index) => {
                    const isSelected = formData.features.includes(feature.key);
                    return (
                      <label
                        key={feature._id}
                        className={`flex items-start p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                          isSelected
                            ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-lg'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleFeature(feature.key)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2 mt-0.5 transition-transform duration-200"
                        />
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                            {feature.name}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {feature.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-500 dark:via-indigo-500 dark:to-purple-500 text-white rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:via-indigo-600 dark:hover:to-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '💾 Saving...' : '✨ Save Changes'}
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
  );
}
