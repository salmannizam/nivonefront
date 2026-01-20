'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n-context';

const mobileNavItems = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/dashboard/residents', icon: '👥', label: 'Residents' },
  { href: '/dashboard/payments', icon: '💰', label: 'Payments' },
  { href: '/dashboard/complaints', icon: '📝', label: 'Complaints' },
  { href: '/dashboard/settings', icon: '⚙️', label: 'Settings' },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  // Only show on mobile and dashboard pages
  if (typeof window === 'undefined' || !pathname?.startsWith('/dashboard')) {
    return null;
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40 safe-area-inset-bottom">
      <div className="flex justify-around items-center h-16">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{t(`sidebar.${item.label.toLowerCase()}`) || item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
