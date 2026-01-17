'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { logError, showError, showSuccess } from '@/lib/utils';

interface TenantNotificationConfig {
  emailEnabled: boolean | null; // null = not set, true = enabled, false = disabled
  smsEnabled: boolean | null;
  monthlySmsLimit?: number | null;
}

interface Tenant {
  _id: string;
  name: string;
  slug: string;
}

export default function TenantNotificationsPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [config, setConfig] = useState<TenantNotificationConfig>({
    emailEnabled: null as any, // null means not set by admin yet
    smsEnabled: null as any,
    monthlySmsLimit: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tenantRes, configRes] = await Promise.all([
        api.get(`/admin/tenants/${tenantId}`),
        api.get(`/admin/tenants/${tenantId}/notifications/config`),
      ]);
      setTenant(tenantRes.data);
      setConfig(configRes.data || {
        emailEnabled: null,
        smsEnabled: null,
        monthlySmsLimit: null,
      });
    } catch (error) {
      logError(error, 'Failed to load tenant notification config');
      showError(error, 'Failed to load notification configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.patch(`/admin/tenants/${tenantId}/notifications/config`, config);
      showSuccess('Notification configuration updated successfully');
    } catch (error) {
      logError(error, 'Failed to update notification config');
      showError(error, 'Failed to update notification configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400 text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="mb-6 animate-slideInDown">
        <button
          onClick={() => router.back()}
          className="mb-4 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center gap-2"
        >
          ← Back to Tenant
        </button>
        <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
          Notification Configuration
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configure notification channels for {tenant?.name}
        </p>
      </div>

      <div className="bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-gray-800 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl shadow-xl border-2 border-indigo-100 dark:border-indigo-900/30 p-6 sm:p-8 animate-slideInUp">
        <div className="space-y-6">
          {/* Email Channel */}
          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                  <span className="text-2xl">📧</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Email Notifications</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Allow tenant to send email notifications</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.emailEnabled === true}
                  onChange={(e) => setConfig({ ...config, emailEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            {config.emailEnabled && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  ✅ Email notifications are enabled. Tenant can configure which events trigger email notifications.
                </p>
              </div>
            )}
          </div>

          {/* SMS Channel */}
          <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                  <span className="text-2xl">💬</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">SMS Notifications</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Allow tenant to send SMS notifications</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.smsEnabled === true}
                  onChange={(e) => setConfig({ ...config, smsEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            {config.smsEnabled && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-300 mb-3">
                    ✅ SMS notifications are enabled. Tenant can configure which events trigger SMS notifications.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monthly SMS Limit (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={config.monthlySmsLimit || ''}
                    onChange={(e) => setConfig({ ...config, monthlySmsLimit: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="No limit"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Set a monthly limit for SMS notifications (leave empty for no limit)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-1">Important Notes</h4>
                <ul className="text-sm text-yellow-800 dark:text-yellow-400 space-y-1 list-disc list-inside">
                  <li>Tenants can only enable notifications if their plan includes the feature</li>
                  <li>If a channel is disabled here, tenant cannot use it even if their plan allows it</li>
                  <li>Tenants can only choose which events trigger notifications, not the message content</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
