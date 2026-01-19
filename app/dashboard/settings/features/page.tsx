'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { showError } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

interface Feature {
  key: string;
  label: string;
  description: string;
  category: 'core' | 'payments' | 'operations' | 'management' | 'analytics' | 'advanced';
}

const FEATURE_DISPLAY_NAMES: Record<string, { name: string; description: string; category: string }> = {
  buildings: { name: 'Buildings', description: 'Manage buildings and properties', category: 'core' },
  rooms: { name: 'Rooms', description: 'Manage rooms and room types', category: 'core' },
  beds: { name: 'Beds', description: 'Manage bed assignments and availability', category: 'core' },
  residents: { name: 'Residents', description: 'Manage resident information and check-ins', category: 'core' },
  rentPayments: { name: 'Rent Payments', description: 'Track monthly rent payments', category: 'payments' },
  extraPayments: { name: 'Extra Payments', description: 'Track additional payments and charges', category: 'payments' },
  securityDeposits: { name: 'Security Deposits', description: 'Manage security deposit collection and refunds', category: 'payments' },
  onlinePayments: { name: 'Online Payments', description: 'Enable online payment gateway integration', category: 'payments' },
  complaints: { name: 'Complaints', description: 'Track and manage resident complaints', category: 'operations' },
  visitors: { name: 'Visitors', description: 'Manage visitor logs and check-ins', category: 'operations' },
  gatePasses: { name: 'Gate Passes', description: 'Issue and track gate passes', category: 'operations' },
  notices: { name: 'Notices', description: 'Create and manage announcements', category: 'operations' },
  staff: { name: 'Staff Management', description: 'Manage staff members and roles', category: 'management' },
  assets: { name: 'Asset Tracking', description: 'Track and manage assets', category: 'management' },
  userManagement: { name: 'User Management', description: 'Create and manage users within the tenant', category: 'management' },
  settings: { name: 'Settings', description: 'Access tenant settings and configuration', category: 'management' },
  reports: { name: 'Reports', description: 'Generate and view reports', category: 'analytics' },
  insights: { name: 'Insights', description: 'View analytics and business insights', category: 'analytics' },
  exportData: { name: 'Export Data', description: 'Export data to CSV/Excel', category: 'analytics' },
  activityLog: { name: 'Activity Log', description: 'View system activity timeline', category: 'advanced' },
  auditLog: { name: 'Audit Log', description: 'View detailed audit trail', category: 'advanced' },
  savedFilters: { name: 'Saved Filters', description: 'Save and reuse filter configurations', category: 'advanced' },
  customTags: { name: 'Custom Tags', description: 'Add custom tags to residents and payments', category: 'advanced' },
  bulkActions: { name: 'Bulk Actions', description: 'Perform bulk operations on multiple records', category: 'advanced' },
  proration: { name: 'Proration', description: 'Calculate prorated rent for partial months', category: 'advanced' },
  residentPortal: { name: 'Resident Portal', description: 'Allow residents to access their own data via mobile OTP login', category: 'operations' },
};

const CATEGORY_LABELS: Record<string, string> = {
  core: 'Core Features',
  payments: 'Payment Features',
  operations: 'Operations',
  management: 'Management',
  analytics: 'Analytics & Reports',
  advanced: 'Advanced Features',
};

export default function FeaturesSettingsPage() {
  const { user } = useAuth();
  const [tenantFeatures, setTenantFeatures] = useState<Record<string, boolean>>({});
  const [userFeatures, setUserFeatures] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      // Load tenant features (what's assigned by Super Admin)
      const tenantResponse = await api.get('/feature-flags/tenant');
      setTenantFeatures(tenantResponse.data.features || {});

      // Load user features (what's enabled for current user)
      const userResponse = await api.get('/feature-flags/user');
      setUserFeatures(userResponse.data.features || {});
    } catch (error: any) {
      showError(error, 'Failed to load features');
    } finally {
      setLoading(false);
    }
  };

  // Get only features that are enabled for the tenant
  const getEnabledTenantFeatures = () => {
    return Object.keys(tenantFeatures).filter((key) => tenantFeatures[key] === true);
  };

  // Get features grouped by category
  const getFeaturesByCategory = () => {
    const enabledFeatures = getEnabledTenantFeatures();
    const grouped: Record<string, string[]> = {};

    enabledFeatures.forEach((key) => {
      const displayInfo = FEATURE_DISPLAY_NAMES[key];
      if (displayInfo) {
        const category = displayInfo.category;
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(key);
      }
    });

    return grouped;
  };

  const featuresByCategory = getFeaturesByCategory();
  const availableCategories = Object.keys(featuresByCategory);

  // Filter by selected category
  const filteredFeatures = selectedCategory === 'all'
    ? getEnabledTenantFeatures()
    : (featuresByCategory[selectedCategory] || []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600 dark:text-gray-400">Loading features...</div>
      </div>
    );
  }

  const enabledCount = getEnabledTenantFeatures().length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Available Features</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Features assigned to your organization by the platform administrator
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {enabledCount} feature{enabledCount !== 1 ? 's' : ''} enabled
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> Feature assignments are managed by the platform administrator. 
          You can assign these features to your users from the{' '}
          <a href="/dashboard/users" className="underline font-medium">Users</a> page.
        </p>
      </div>

      {/* Category Filter */}
      {availableCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All Features
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>
      )}

      {/* Features Grid */}
      {filteredFeatures.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            {selectedCategory === 'all'
              ? 'No features are currently assigned to your organization. Please contact your administrator.'
              : 'No features found in this category'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFeatures.map((featureKey) => {
            const displayInfo = FEATURE_DISPLAY_NAMES[featureKey] || {
              name: featureKey,
              description: '',
              category: 'other',
            };
            const isEnabledForUser = userFeatures[featureKey] !== false; // Default to true if not set
            
            return (
              <div
                key={featureKey}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isEnabledForUser
                    ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {displayInfo.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {displayInfo.description}
                    </p>
                  </div>
                  <div className="ml-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isEnabledForUser
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {isEnabledForUser ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                    {CATEGORY_LABELS[displayInfo.category] || 'Other'}
                  </span>
                </div>
                {!isEnabledForUser && user && (user.role === 'OWNER' || user.role === 'MANAGER') && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <a
                      href="/dashboard/users"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Assign to users →
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
