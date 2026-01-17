'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { showSuccess, showError } from '@/lib/utils';

interface Feature {
  _id: string;
  name: string;
  key: string;
  category: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  core: 'Core',
  payments: 'Payments',
  operations: 'Operations',
  management: 'Management',
  analytics: 'Analytics',
  advanced: 'Advanced',
};

export default function FeaturesPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    category: 'core',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    loadFeatures();
  }, [selectedCategory]);

  const loadFeatures = async () => {
    try {
      setLoading(true);
      const url = selectedCategory !== 'all' 
        ? `/admin/features?category=${selectedCategory}`
        : '/admin/features';
      const response = await api.get(url);
      setFeatures(response.data);
    } catch (error: any) {
      showError(error, 'Failed to load features');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/features', formData);
      showSuccess('Feature created successfully!');
      setShowForm(false);
      setFormData({
        name: '',
        key: '',
        category: 'core',
        description: '',
        isActive: true,
      });
      loadFeatures();
    } catch (error: any) {
      showError(error, 'Failed to create feature');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/admin/features/${id}`, { isActive: !currentStatus });
      showSuccess('Feature updated successfully!');
      loadFeatures();
    } catch (error: any) {
      showError(error, 'Failed to update feature');
    }
  };

  const handleSeed = async () => {
    try {
      await api.post('/admin/features/seed');
      showSuccess('Default features seeded successfully!');
      loadFeatures();
    } catch (error: any) {
      showError(error, 'Failed to seed features');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600 dark:text-gray-400">Loading features...</div>
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 animate-slideInLeft">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Feature Catalog
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
            Manage master feature catalog for plans
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={handleSeed}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-500 dark:via-emerald-500 dark:to-teal-500 text-white rounded-xl hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 dark:hover:from-green-600 dark:hover:via-emerald-600 dark:hover:to-teal-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold text-sm sm:text-base"
          >
            🌱 Seed Default Features
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-500 dark:via-indigo-500 dark:to-purple-500 text-white rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:via-indigo-600 dark:hover:to-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold text-sm sm:text-base"
          >
            {showForm ? '✕ Cancel' : '+ Create Feature'}
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 sm:gap-3 flex-wrap animate-slideInDown">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 sm:px-5 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all transform hover:scale-105 ${
            selectedCategory === 'all'
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-500 dark:via-indigo-500 dark:to-purple-500 text-white shadow-lg'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 shadow-md hover:shadow-lg'
          }`}
        >
          All
        </button>
        {Object.keys(categoryLabels).map((cat, index) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all transform hover:scale-105 ${
              selectedCategory === cat
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-500 dark:via-indigo-500 dark:to-purple-500 text-white shadow-lg'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 shadow-md hover:shadow-lg'
            }`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Create Feature Form */}
      {showForm && (
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-800 dark:via-blue-900/20 dark:to-indigo-900/20 p-4 sm:p-6 rounded-2xl shadow-xl border-2 border-blue-100 dark:border-blue-900/30 animate-slideInUp">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            Create New Feature
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="transform transition-all hover:scale-105">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Feature Name *
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
                  Feature Key (unique) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-md hover:shadow-lg"
                  placeholder="e.g., buildings"
                />
              </div>
              <div className="transform transition-all hover:scale-105">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-md hover:shadow-lg"
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 transform transition-all hover:scale-105">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-pink-500/50 focus:border-pink-500 transition-all shadow-md hover:shadow-lg"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-500 dark:via-indigo-500 dark:to-purple-500 text-white rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:via-indigo-600 dark:hover:to-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold"
              >
                ✨ Create Feature
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

      {/* Features List by Category */}
      {selectedCategory === 'all' ? (
        Object.entries(groupedFeatures).map(([category, categoryFeatures], catIndex) => {
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
            <div key={category} className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-800 dark:via-blue-900/20 dark:to-indigo-900/20 rounded-2xl shadow-xl border-2 border-blue-100 dark:border-blue-900/30 p-4 sm:p-6 animate-slideInUp" style={{ animationDelay: `${catIndex * 100}ms` }}>
              <h2 className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 pb-3 border-b-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r ${gradient} dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent`}>
                {categoryLabels[category] || category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {categoryFeatures.map((feature, index) => (
                  <div
                    key={feature._id}
                    className="p-4 sm:p-5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 animate-slideInUp"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                          {feature.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg font-mono">{feature.key}</code>
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleActive(feature._id, feature.isActive)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap ml-2 transition-all transform hover:scale-110 ${
                          feature.isActive
                            ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md animate-pulse-slow'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {feature.isActive ? '✓ Active' : 'Inactive'}
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-800 dark:via-blue-900/20 dark:to-indigo-900/20 rounded-2xl shadow-xl border-2 border-blue-100 dark:border-blue-900/30 p-4 sm:p-6 animate-slideInUp">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 pb-3 border-b-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            {categoryLabels[selectedCategory] || selectedCategory}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {features.map((feature, index) => (
              <div
                key={feature._id}
                className="p-4 sm:p-5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 animate-slideInUp"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                      {feature.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg font-mono">{feature.key}</code>
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleActive(feature._id, feature.isActive)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap ml-2 transition-all transform hover:scale-110 ${
                      feature.isActive
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md animate-pulse-slow'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {feature.isActive ? '✓ Active' : 'Inactive'}
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
