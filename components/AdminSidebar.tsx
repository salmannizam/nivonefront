'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const adminNavigationItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: '📊',
    description: 'Platform overview',
  },
  {
    name: 'Tenants',
    href: '/admin/tenants',
    icon: '🏢',
    description: 'Manage all tenants',
  },
  {
    name: 'Plans',
    href: '/admin/plans',
    icon: '💳',
    description: 'Manage subscription plans',
  },
  {
    name: 'Features',
    href: '/admin/features',
    icon: '⚙️',
    description: 'Manage feature catalog',
  },
  {
    name: 'Subscriptions',
    href: '/admin/subscriptions',
    icon: '📋',
    description: 'View tenant subscriptions',
  },
  {
    name: 'SMS Templates',
    href: '/admin/notifications/sms-templates',
    icon: '📱',
    description: 'Manage SMS templates',
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-2.5 sm:top-3 left-3 sm:left-4 z-50 p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 shadow-md transition-all"
        aria-label="Toggle menu"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 sm:w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          transform ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-300 ease-in-out
          shadow-xl lg:shadow-none
          pt-12 sm:pt-14
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <span className="text-white text-lg font-bold">SA</span>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Super Admin
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Platform Management
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-2 sm:px-3">
            {adminNavigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    group flex items-center px-3 sm:px-4 py-3 rounded-xl mb-2
                    transition-all duration-200
                    ${isActive
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:scale-[1.01]'
                    }
                  `}
                >
                  <span className={`mr-3 text-xl sm:text-2xl transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm sm:text-base font-medium ${isActive ? 'text-white' : ''}`}>
                      {item.name}
                    </div>
                    <div className={`text-xs mt-0.5 ${isActive ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                      {item.description}
                    </div>
                  </div>
                  {isActive && (
                    <div className="ml-2 w-2 h-2 rounded-full bg-white animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              © {new Date().getFullYear()} Platform
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
