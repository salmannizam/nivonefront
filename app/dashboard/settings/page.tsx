'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import FeatureGuard from '@/components/FeatureGuard';

const settingsMenu = [
  { name: 'Features', href: '/dashboard/settings/features', icon: '⚙️', description: 'Manage feature flags' },
  { name: 'Notifications', href: '/dashboard/settings/notifications', icon: '🔔', description: 'Configure notifications' },
  { name: 'Profile', href: '/dashboard/settings/profile', icon: '👤', description: 'Your profile settings' },
  { name: 'Organization', href: '/dashboard/settings/organization', icon: '🏢', description: 'Organization settings' },
];

export default function SettingsPage() {
  const pathname = usePathname();

  return (
    <FeatureGuard feature="settings">
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage your account and organization settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsMenu.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`p-6 rounded-lg border-2 transition-all ${
                isActive
                  ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{item.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
    </FeatureGuard>
  );
}
