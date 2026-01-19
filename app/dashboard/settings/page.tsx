'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import FeatureGuard from '@/components/FeatureGuard';
import { useI18n } from '@/lib/i18n-context';

export default function SettingsPage() {
  const { t } = useI18n();
  const pathname = usePathname();
  
  const settingsMenu = [
    { name: t('pages.settings.features'), href: '/dashboard/settings/features', icon: '⚙️', description: t('pages.settings.features') },
    { name: t('pages.settings.notifications'), href: '/dashboard/settings/notifications', icon: '🔔', description: t('pages.settings.notifications') },
    { name: t('pages.settings.profile'), href: '/dashboard/settings/profile', icon: '👤', description: t('pages.settings.profile') },
    { name: t('pages.settings.organization'), href: '/dashboard/settings/organization', icon: '🏢', description: t('pages.settings.organization') },
  ];

  return (
    <FeatureGuard feature="settings">
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('pages.settings.title')}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {t('pages.settings.title')}
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
