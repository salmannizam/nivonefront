'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { logError } from '@/lib/utils';

// Feature display names and categories
const FEATURE_DISPLAY_NAMES: Record<string, { name: string; category: string }> = {
  buildings: { name: 'Buildings', category: 'Core Features' },
  rooms: { name: 'Rooms', category: 'Core Features' },
  beds: { name: 'Beds', category: 'Core Features' },
  residents: { name: 'Residents', category: 'Core Features' },
  rentPayments: { name: 'Rent Payments', category: 'Payment Features' },
  extraPayments: { name: 'Extra Payments', category: 'Payment Features' },
  securityDeposits: { name: 'Security Deposits', category: 'Payment Features' },
  onlinePayments: { name: 'Online Payments', category: 'Payment Features' },
  complaints: { name: 'Complaints', category: 'Operations' },
  visitors: { name: 'Visitors', category: 'Operations' },
  gatePasses: { name: 'Gate Passes', category: 'Operations' },
  notices: { name: 'Notices', category: 'Operations' },
  staff: { name: 'Staff', category: 'Management' },
  assets: { name: 'Assets', category: 'Management' },
  reports: { name: 'Reports', category: 'Analytics & Reports' },
  insights: { name: 'Insights', category: 'Analytics & Reports' },
  exportData: { name: 'Export Data', category: 'Analytics & Reports' },
  activityLog: { name: 'Activity Log', category: 'Advanced Features' },
  auditLog: { name: 'Audit Log', category: 'Advanced Features' },
  savedFilters: { name: 'Saved Filters', category: 'Advanced Features' },
  customTags: { name: 'Custom Tags', category: 'Advanced Features' },
  bulkActions: { name: 'Bulk Actions', category: 'Advanced Features' },
  proration: { name: 'Proration', category: 'Advanced Features' },
};

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function UserPermissionsPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [tenantFeatures, setTenantFeatures] = useState<Record<string, boolean>>({});
  const [userFeatures, setUserFeatures] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Only OWNER and MANAGER can access this page
    if (currentUser && currentUser.role !== 'OWNER' && currentUser.role !== 'MANAGER') {
      router.push('/dashboard');
      return;
    }
    
    // Prevent users from editing their own permissions
    if (currentUser && currentUser.id === userId) {
      alert('You cannot modify your own permissions. Please ask another administrator to update your permissions.');
      router.push('/dashboard/users');
      return;
    }
    
    loadData();
  }, [userId, currentUser, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user details
      const userResponse = await api.get(`/users/${userId}`);
      setUser(userResponse.data);

      // Load tenant features and user permissions
      const featuresResponse = await api.get(`/feature-flags/user/${userId}`);
      setTenantFeatures(featuresResponse.data.tenantFeatures || {});
      setUserFeatures(featuresResponse.data.userFeatures || {});
    } catch (error: any) {
      logError(error, 'Failed to load user permissions data');
      alert(error.response?.data?.message || 'Failed to load user permissions');
      router.push('/dashboard/users');
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureToggle = (featureKey: string, enabled: boolean) => {
    setUserFeatures((prev) => ({
      ...prev,
      [featureKey]: enabled,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Build permissions object - only include features that are enabled for tenant
      const permissions: Record<string, { enabled: boolean }> = {};
      Object.keys(tenantFeatures).forEach((key) => {
        if (tenantFeatures[key]) {
          // Only include if tenant has this feature enabled
          permissions[key] = {
            enabled: userFeatures[key] !== false, // Default to true if not explicitly set
          };
        }
      });

      await api.patch(`/feature-flags/user/${userId}`, { permissions });
      alert('User permissions updated successfully');
      router.push('/dashboard/users');
    } catch (error: any) {
      console.error('Failed to save permissions:', error);
      alert(error.response?.data?.message || 'Failed to update user permissions');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600 dark:text-gray-400">Loading user permissions...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check if user is trying to edit their own permissions
  const isEditingSelf = currentUser && currentUser.id === userId;

  // Group features by category
  const featuresByCategory: Record<string, string[]> = {};
  Object.keys(tenantFeatures).forEach((key) => {
    if (tenantFeatures[key]) {
      // Only show features that are enabled for the tenant
      const displayInfo = FEATURE_DISPLAY_NAMES[key] || { name: key, category: 'Other' };
      if (!featuresByCategory[displayInfo.category]) {
        featuresByCategory[displayInfo.category] = [];
      }
      featuresByCategory[displayInfo.category].push(key);
    }
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            User Feature Permissions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage feature access for <strong>{user.name}</strong> ({user.email})
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Role: <span className="font-medium">{user.role}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/dashboard/users')}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || isEditingSelf}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      </div>

      {isEditingSelf ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>Access Denied:</strong> You cannot modify your own permissions. This prevents you from accidentally locking yourself out of the system. Please ask another administrator to update your permissions.
          </p>
        </div>
      ) : (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> You can only assign features that are enabled for your tenant. 
            Features disabled at the tenant level cannot be assigned to users.
          </p>
        </div>
      )}

      {Object.keys(featuresByCategory).length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No features are enabled for your tenant. Please contact your administrator to enable features.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(featuresByCategory).map(([category, features]) => (
            <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                {category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((featureKey) => {
                  const displayInfo = FEATURE_DISPLAY_NAMES[featureKey] || { name: featureKey };
                  const isEnabled = userFeatures[featureKey] !== false; // Default to true
                  
                  return (
                    <div
                      key={featureKey}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex-1">
                        <label
                          htmlFor={`feature-${featureKey}`}
                          className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                        >
                          {displayInfo.name}
                        </label>
                      </div>
                      <div className="flex items-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            id={`feature-${featureKey}`}
                            checked={isEnabled}
                            onChange={(e) => handleFeatureToggle(featureKey, e.target.checked)}
                            disabled={isEditingSelf}
                            className="sr-only peer"
                          />
                          <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 ${isEditingSelf ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
