'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import FeatureGuard from '@/components/FeatureGuard';
import { showSuccess, showError, logError } from '@/lib/utils';

interface Tenant {
  _id: string;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  email?: string;
}

export default function OrganizationSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    loadTenant();
  }, []);

  const loadTenant = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tenants/current');
      setTenant(response.data);
      setFormData({
        name: response.data.name || '',
        address: response.data.address || '',
        phone: response.data.phone || '',
        email: response.data.email || '',
      });
    } catch (error: any) {
      logError(error, 'Failed to load organization data');
      showError(error, 'Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only OWNER can update organization settings
    if (user?.role !== 'OWNER') {
      showError(null, 'Only organization owners can update organization settings');
      return;
    }

    try {
      setSaving(true);
      await api.patch('/tenants/current', formData);
      showSuccess('Organization settings updated successfully!');
      await loadTenant();
    } catch (error: any) {
      logError(error, 'Failed to update organization settings');
      showError(error, 'Failed to update organization settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <FeatureGuard feature="settings">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
            <div className="text-gray-600 dark:text-gray-400 text-lg">Loading organization data...</div>
          </div>
        </div>
      </FeatureGuard>
    );
  }

  const isOwner = user?.role === 'OWNER';

  return (
    <FeatureGuard feature="settings">
      <div className="space-y-6 animate-fadeIn">
        <div className="animate-slideInLeft">
          <button
            onClick={() => router.push('/dashboard/settings')}
            className="mb-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-medium transition-colors flex items-center gap-1 transform hover:scale-105"
          >
            <span>←</span> Back to Settings
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Organization Settings
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your organization information
          </p>
        </div>

        {!isOwner && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-800 p-4 rounded-xl animate-slideInDown">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span>
                <strong className="font-bold">Note:</strong> Only organization owners can update organization settings.
                Contact your organization owner to make changes.
              </span>
            </p>
          </div>
        )}

        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-800 dark:via-blue-900/20 dark:to-indigo-900/20 p-4 sm:p-6 rounded-2xl shadow-xl border-2 border-blue-100 dark:border-blue-900/30 animate-slideInUp">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-xl">🏢</span>
              Organization Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="transform transition-all hover:scale-105">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isOwner}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-md hover:shadow-lg disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed"
                />
              </div>
              <div className="transform transition-all hover:scale-105">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Slug (Subdomain)
                </label>
                <input
                  type="text"
                  value={tenant?.slug || ''}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Subdomain cannot be changed
                </p>
              </div>
              <div className="transform transition-all hover:scale-105">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!isOwner}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-md hover:shadow-lg disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed"
                  placeholder="Organization address"
                />
              </div>
              <div className="transform transition-all hover:scale-105">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isOwner}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-md hover:shadow-lg disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed"
                  placeholder="+1234567890"
                />
              </div>
              <div className="transform transition-all hover:scale-105">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isOwner}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-green-500/50 focus:border-green-500 transition-all shadow-md hover:shadow-lg disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed"
                  placeholder="organization@example.com"
                />
              </div>
            </div>

            {isOwner && (
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-500 dark:via-purple-500 dark:to-indigo-500 text-white rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:via-purple-600 dark:hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? '💾 Saving...' : '✨ Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/settings')}
                  className="flex-1 sm:flex-none px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-bold transform hover:scale-105"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </FeatureGuard>
  );
}
