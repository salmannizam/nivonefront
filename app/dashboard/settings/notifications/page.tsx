'use client';

import { useEffect, useState } from 'react';
import { useFeatures } from '@/lib/feature-context';
import api from '@/lib/api';
import { logError, showError, showSuccess } from '@/lib/utils';
import FeatureGuard from '@/components/FeatureGuard';

type NotificationEvent = 
  | 'resident.created'
  | 'resident.assigned_room'
  | 'payment.due'
  | 'payment.paid'
  | 'security_deposit.received'
  | 'resident.vacated';

type NotificationChannel = 'EMAIL' | 'SMS';

interface NotificationSetting {
  event: NotificationEvent;
  channel: NotificationChannel;
  enabled: boolean;
}

interface TenantConfig {
  emailEnabled: boolean;
  smsEnabled: boolean;
  monthlySmsLimit?: number;
}

const EVENT_DISPLAY_NAMES: Record<NotificationEvent, string> = {
  'resident.created': 'Resident Registered',
  'resident.assigned_room': 'Resident Assigned Room',
  'payment.due': 'Payment Due',
  'payment.paid': 'Payment Received',
  'security_deposit.received': 'Security Deposit Received',
  'resident.vacated': 'Resident Vacated',
};

const ALL_EVENTS: NotificationEvent[] = [
  'resident.created',
  'resident.assigned_room',
  'payment.due',
  'payment.paid',
  'security_deposit.received',
  'resident.vacated',
];

export default function NotificationsSettingsPage() {
  const { isFeatureEnabled } = useFeatures();
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const hasEmailFeature = isFeatureEnabled('notifications.email');
  const hasSmsFeature = isFeatureEnabled('notifications.sms');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsRes, configRes] = await Promise.all([
        api.get('/notifications/settings').catch(() => ({ data: [] })),
        api.get('/notifications/config').catch(() => ({ data: null })),
      ]);
      
      const configData = configRes.data || {
        emailEnabled: null, // null means admin hasn't set restrictions
        smsEnabled: null,
        monthlySmsLimit: null,
      };
      
      const loadedSettings = settingsRes.data || [];
      
      // Initialize all event-channel combinations if not present
      const allSettings: NotificationSetting[] = [];
      ALL_EVENTS.forEach((event) => {
        ['EMAIL', 'SMS'].forEach((channel) => {
          const existing = loadedSettings.find(
            (s: NotificationSetting) => s.event === event && s.channel === channel,
          );
          allSettings.push(
            existing || { event, channel: channel as NotificationChannel, enabled: false },
          );
        });
      });
      
      setSettings(allSettings);
      setTenantConfig(configData);
    } catch (error) {
      logError(error, 'Failed to load notification settings');
      showError('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (event: NotificationEvent, channel: NotificationChannel) => {
    setSettings((prev) =>
      prev.map((s) =>
        s.event === event && s.channel === channel ? { ...s, enabled: !s.enabled } : s,
      ),
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.patch('/notifications/settings', settings);
      showSuccess('Notification settings saved successfully');
    } catch (error) {
      logError(error, 'Failed to save notification settings');
      showError('Failed to save notification settings');
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

  // Check if user has any notification features
  if (!hasEmailFeature && !hasSmsFeature) {
    return (
      <div className="animate-fadeIn">
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🔔</div>
          <h2 className="text-2xl font-bold text-yellow-900 dark:text-yellow-300 mb-2">
            Notifications Not Available
          </h2>
          <p className="text-yellow-800 dark:text-yellow-400 mb-4">
            Notification features are not included in your current plan.
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-500">
            Please upgrade to a plan that includes email or SMS notifications to use this feature.
          </p>
        </div>
      </div>
    );
  }

  // Channel is allowed if: (plan has feature) AND (admin hasn't explicitly disabled it)
  // null/undefined means admin hasn't configured it yet → allow if plan has feature
  // true means admin explicitly enabled it → allow
  // false means admin explicitly disabled it → disallow
  const emailAllowed = hasEmailFeature && tenantConfig?.emailEnabled !== false;
  const smsAllowed = hasSmsFeature && tenantConfig?.smsEnabled !== false;

  return (
    <FeatureGuard feature="settings">
      <div className="animate-fadeIn">
        <div className="mb-6 animate-slideInDown">
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            🔔 Notification Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configure which events trigger email and SMS notifications
          </p>
        </div>

        {/* Info Banner */}
        {(hasEmailFeature || hasSmsFeature) && (
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-semibold mb-1">Channel Status:</p>
                <ul className="list-disc list-inside space-y-1">
                  {hasEmailFeature && (
                    <li>
                      Email: {emailAllowed 
                        ? (tenantConfig?.emailEnabled === true ? '✅ Enabled by admin' : '✅ Available (not restricted)')
                        : '❌ Disabled by admin'}
                    </li>
                  )}
                  {hasSmsFeature && (
                    <li>
                      SMS: {smsAllowed 
                        ? (tenantConfig?.smsEnabled === true ? '✅ Enabled by admin' : '✅ Available (not restricted)')
                        : '❌ Disabled by admin'}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Settings Table */}
        <div className="bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-gray-800 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl shadow-xl border-2 border-indigo-100 dark:border-indigo-900/30 overflow-hidden animate-slideInUp">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                    Event
                  </th>
                  {hasEmailFeature && (
                    <th className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                      Email
                    </th>
                  )}
                  {hasSmsFeature && (
                    <th className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                      SMS
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-gradient-to-b from-white via-indigo-50/10 to-purple-50/10 dark:from-gray-800 dark:via-indigo-900/5 dark:to-purple-900/5 divide-y divide-indigo-100 dark:divide-indigo-800/30">
                {ALL_EVENTS.map((event, index) => {
                  const emailSetting = settings.find((s) => s.event === event && s.channel === 'EMAIL');
                  const smsSetting = settings.find((s) => s.event === event && s.channel === 'SMS');
                  
                  return (
                    <tr
                      key={event}
                      className="hover:bg-gradient-to-r hover:from-indigo-50 hover:via-purple-50 hover:to-pink-50 dark:hover:from-indigo-900/20 dark:hover:via-purple-900/20 dark:hover:to-pink-900/20 transition-all duration-300 animate-fadeIn"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {EVENT_DISPLAY_NAMES[event]}
                      </td>
                      {hasEmailFeature && (
                        <td className="px-4 sm:px-6 py-4 text-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={emailSetting?.enabled ?? false}
                              onChange={() => handleToggle(event, 'EMAIL')}
                              disabled={!emailAllowed}
                              className="sr-only peer"
                            />
                            <div className={`w-11 h-6 rounded-full peer transition-colors ${
                              !emailAllowed
                                ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                                : emailSetting?.enabled
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                                : 'bg-gray-200 dark:bg-gray-700'
                            } peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                          </label>
                          {!emailAllowed && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Disabled by admin</p>
                          )}
                        </td>
                      )}
                      {hasSmsFeature && (
                        <td className="px-4 sm:px-6 py-4 text-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={smsSetting?.enabled ?? false}
                              onChange={() => handleToggle(event, 'SMS')}
                              disabled={!smsAllowed}
                              className="sr-only peer"
                            />
                            <div className={`w-11 h-6 rounded-full peer transition-colors ${
                              !smsAllowed
                                ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                                : smsSetting?.enabled
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                : 'bg-gray-200 dark:bg-gray-700'
                            } peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                          </label>
                          {!smsAllowed && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Disabled by admin</p>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </FeatureGuard>
  );
}
