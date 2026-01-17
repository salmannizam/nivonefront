'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { showSuccess, showError } from '@/lib/utils';

interface Feature {
  _id: string;
  name: string;
  key: string;
  category: string;
  description: string;
  isActive: boolean;
}

interface Tenant {
  _id: string;
  name: string;
  slug: string;
}

const categoryLabels: Record<string, string> = {
  core: 'Core',
  payments: 'Payments',
  operations: 'Operations',
  management: 'Management',
  analytics: 'Analytics',
  advanced: 'Advanced',
};

const categoryColors: Record<string, string> = {
  core: 'from-blue-500 to-cyan-500',
  payments: 'from-green-500 to-emerald-500',
  operations: 'from-purple-500 to-pink-500',
  management: 'from-indigo-500 to-blue-500',
  analytics: 'from-orange-500 to-red-500',
  advanced: 'from-gray-500 to-slate-500',
};

export default function TenantFeaturesPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [availableFeatures, setAvailableFeatures] = useState<Feature[]>([]);
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tenantId) {
      loadData();
    }
  }, [tenantId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tenantRes, featuresRes, allFeaturesRes] = await Promise.all([
        api.get(`/admin/tenants/${tenantId}`),
        api.get(`/admin/tenants/${tenantId}/features`),
        api.get('/admin/features'),
      ]);
      setTenant(tenantRes.data);
      setFeatures(featuresRes.data.features || {});
      setAvailableFeatures(allFeaturesRes.data.filter((f: Feature) => f.isActive));
    } catch (error: any) {
      showError(error, 'Failed to load tenant data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = (featureKey: string) => {
    setFeatures((prev) => ({
      ...prev,
      [featureKey]: !prev[featureKey],
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.patch(`/admin/tenants/${tenantId}/features`, { features });
      showSuccess('Features updated successfully!');
    } catch (error: any) {
      showError(error, 'Failed to update features');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400 text-lg">Loading features...</div>
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

  const groupedFeatures = availableFeatures.reduce((acc, feature) => {
    const category = categoryLabels[feature.category] || feature.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(feature);
    return acc;
  }, {} as Record<string, Feature[]>);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0 animate-slideInLeft">
          <button
            onClick={() => router.back()}
            className="mb-3 sm:mb-4 text-sm sm:text-base text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-medium transition-colors flex items-center gap-1 transform hover:scale-105"
          >
            <span>←</span> Back to Tenants
          </button>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Manage Features: {tenant.name}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
            Enable or disable features for this tenant
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-500 dark:via-purple-500 dark:to-indigo-500 text-white rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:via-purple-600 dark:hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base animate-slideInRight"
        >
          {saving ? '💾 Saving...' : '✨ Save Changes'}
        </button>
      </div>

      <div className="bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/20 dark:from-gray-800 dark:via-blue-900/10 dark:to-indigo-900/10 rounded-2xl shadow-xl border-2 border-blue-100 dark:border-blue-900/30 p-4 sm:p-6 animate-fadeIn">
        {Object.entries(groupedFeatures).map(([category, categoryFeatures], categoryIndex) => {
          const colorClass = categoryColors[category.toLowerCase()] || 'from-gray-500 to-slate-500';
          return (
            <div key={category} className="mb-6 sm:mb-8 last:mb-0 animate-slideInUp" style={{ animationDelay: `${categoryIndex * 100}ms` }}>
              <h2 className={`text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 pb-3 px-4 py-2 rounded-xl bg-gradient-to-r ${colorClass} shadow-lg`}>
                {category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {categoryFeatures.map((feature, featureIndex) => {
                  const isEnabled = features[feature.key] !== false;
                  return (
                    <label
                      key={feature._id}
                      className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg animate-slideInUp ${
                        isEnabled
                          ? `border-blue-400 dark:border-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40 shadow-md`
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/50 shadow-sm'
                      }`}
                      style={{ animationDelay: `${(categoryIndex * 100) + (featureIndex * 50)}ms` }}
                    >
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => handleToggleFeature(feature.key)}
                        className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 rounded-lg focus:ring-4 focus:ring-blue-500/50 mt-0.5 transform transition-transform hover:scale-110"
                      />
                      <div className="ml-3 flex-1">
                        <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white block">
                          {feature.name}
                        </span>
                        {feature.description && (
                          <span className="text-xs text-gray-600 dark:text-gray-400 block mt-1.5 leading-relaxed">
                            {feature.description}
                          </span>
                        )}
                      </div>
                      {isEnabled && (
                        <span className="ml-2 text-green-500 text-xl animate-pulse">✓</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
