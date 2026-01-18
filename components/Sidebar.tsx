'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useFeatures } from '@/lib/feature-context';
import { useState, useEffect, useMemo } from 'react';

type SidebarItem = {
  name: string;
  href?: string;
  icon: string;
  feature?: string | null;
  roles?: string[];
  children?: SidebarItem[];
};

const sidebarConfig: SidebarItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: '📊',
    feature: null,
  },
  {
    name: 'Property',
    icon: '🏢',
    children: [
      { name: 'Buildings', href: '/dashboard/buildings', icon: '🏢', feature: 'buildings' },
      { name: 'Rooms', href: '/dashboard/rooms', icon: '🏠', feature: 'rooms' },
      { name: 'Beds', href: '/dashboard/beds', icon: '🛏️', feature: 'beds' },
    ],
  },
  {
    name: 'Residents',
    icon: '👥',
    children: [
      { name: 'Residents', href: '/dashboard/residents', icon: '👥', feature: 'residents' },
      { name: 'Rent Payments', href: '/dashboard/payments?section=rent', icon: '💰', feature: 'rentPayments' },
      { name: 'Extra Payments', href: '/dashboard/payments?section=extra', icon: '💳', feature: 'extraPayments' },
      { name: 'Security Deposits', href: '/dashboard/payments?section=deposits', icon: '🔒', feature: 'securityDeposits' },
    ],
  },
  {
    name: 'Operations',
    icon: '⚙️',
    children: [
      { name: 'Complaints', href: '/dashboard/complaints', icon: '📝', feature: 'complaints' },
      { name: 'Visitors', href: '/dashboard/visitors', icon: '🚶', feature: 'visitors' },
      { name: 'Gate Passes', href: '/dashboard/gate-passes', icon: '🚪', feature: 'gatePasses' },
      { name: 'Notices', href: '/dashboard/notices', icon: '📢', feature: 'notices' },
    ],
  },
  {
    name: 'Management',
    icon: '👨‍💼',
    children: [
      { name: 'Staff', href: '/dashboard/staff', icon: '👨‍💼', feature: 'staff' },
      { name: 'Assets', href: '/dashboard/assets', icon: '🔧', feature: 'assets' },
    ],
  },
  {
    name: 'Analytics',
    icon: '📊',
    children: [
      { name: 'Reports', href: '/dashboard/reports', icon: '📈', feature: 'reports' },
      { name: 'Insights', href: '/dashboard/insights', icon: '📊', feature: 'insights' },
      { name: 'Activity', href: '/dashboard/activity', icon: '📜', feature: 'activityLog' },
    ],
  },
  {
    name: 'Administration',
    icon: '⚙️',
    children: [
      { name: 'Users', href: '/dashboard/users', icon: '👤', roles: ['OWNER', 'MANAGER'], feature: 'userManagement' },
      { name: 'Tags', href: '/dashboard/tags', icon: '🏷️', roles: ['OWNER', 'MANAGER'], feature: 'customTags' },
      { name: 'Personal Notes', href: '/dashboard/personal-notes', icon: '📝', feature: 'personalNotes' },
      { name: 'Audit Logs', href: '/dashboard/audit-logs', icon: '📋', roles: ['OWNER'], feature: 'auditLog' },
      { name: 'Settings', href: '/dashboard/settings', icon: '⚙️', feature: 'settings' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { isFeatureEnabled } = useFeatures();
  const [isOpen, setIsOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  // Check if item should be visible (feature + role check)
  const isItemVisible = (item: SidebarItem): boolean => {
    // Check role permission
    if (item.roles && user && !item.roles.includes(user.role as any)) {
      return false;
    }
    // Check feature permission
    if (item.feature && !isFeatureEnabled(item.feature)) {
      return false;
    }
    return true;
  };

  // Check if a route is active (handles query params for payments)
  const isRouteActive = (href?: string): boolean => {
    if (!href) return false;
    
    // Handle payments routes with query params
    if (href.includes('/payments')) {
      const section = searchParams.get('section');
      if (href.includes('section=rent') && section === 'rent') return true;
      if (href.includes('section=extra') && section === 'extra') return true;
      if (href.includes('section=deposits') && section === 'deposits') return true;
      return false;
    }
    
    return pathname === href;
  };

  // Check if any child in a section is active
  const hasActiveChild = (item: SidebarItem): boolean => {
    if (!item.children) return false;
    return item.children.some((child) => {
      if (!isItemVisible(child)) return false;
      return isRouteActive(child.href);
    });
  };

  // Filter visible items recursively
  const filterVisibleItems = (items: SidebarItem[]): SidebarItem[] => {
    return items
      .map((item) => {
        if (item.children) {
          // For parent items, filter children first
          const visibleChildren = item.children.filter(isItemVisible);
          if (visibleChildren.length === 0) return null;
          return { ...item, children: visibleChildren };
        } else {
          // For standalone items, check visibility
          return isItemVisible(item) ? item : null;
        }
      })
      .filter((item): item is SidebarItem => item !== null);
  };

  // Get visible items
  const visibleItems = useMemo(() => filterVisibleItems(sidebarConfig), [user, isFeatureEnabled]);

  // Auto-expand sections with active children on mount and route change
  useEffect(() => {
    const newOpenSections = new Set<string>();
    visibleItems.forEach((item) => {
      if (item.children && hasActiveChild(item)) {
        newOpenSections.add(item.name);
      }
    });
    // Update open sections if there are active children
    // This ensures sections with active routes are always expanded
    if (newOpenSections.size > 0) {
      setOpenSections((prev) => {
        // Merge with existing open sections, but prioritize active ones
        const merged = new Set(prev);
        newOpenSections.forEach((section) => merged.add(section));
        return merged;
      });
    }
  }, [pathname, searchParams.toString(), visibleItems.length]);

  // Toggle section
  const toggleSection = (sectionName: string) => {
    setOpenSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        // Don't close if it has an active child
        const sectionItem = visibleItems.find((item) => item.name === sectionName);
        if (sectionItem && !hasActiveChild(sectionItem)) {
          newSet.delete(sectionName);
        }
      } else {
        // Accordion behavior: close other sections (except those with active children)
        const sectionsToKeep = new Set<string>();
        visibleItems.forEach((item) => {
          if (item.children && hasActiveChild(item) && item.name !== sectionName) {
            sectionsToKeep.add(item.name);
          }
        });
        newSet.clear();
        sectionsToKeep.forEach((name) => newSet.add(name));
        newSet.add(sectionName);
      }
      return newSet;
    });
  };

  const isSectionOpen = (sectionName: string) => openSections.has(sectionName);
  const isSectionActive = (item: SidebarItem) => hasActiveChild(item);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-lg"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } transition-transform duration-300 ease-in-out flex flex-col overflow-hidden`}
      >
        {/* Header - Fixed at top */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
            Hostel Management
          </h1>
          {user && (
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              {user.name} ({user.role})
            </p>
          )}
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto py-4">
          {visibleItems.map((item) => {
            // Standalone item (no children)
            if (!item.children) {
              const isActive = isRouteActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href!}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center px-4 sm:px-6 py-3 mx-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  <span className={`text-sm sm:text-base font-medium ${isActive ? 'font-semibold' : ''}`}>
                    {item.name}
                  </span>
                </Link>
              );
            }

            // Parent item with children
            const sectionOpen = isSectionOpen(item.name);
            const sectionActive = isSectionActive(item);

            return (
              <div key={item.name} className="mb-1">
                {/* Parent Header - Clickable to toggle */}
                <button
                  onClick={() => toggleSection(item.name)}
                  className={`w-full flex items-center justify-between px-4 sm:px-6 py-3 mx-2 rounded-lg transition-all duration-200 ${
                    sectionActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-3 text-lg">{item.icon}</span>
                    <span className={`text-sm sm:text-base font-semibold ${sectionActive ? 'text-blue-700 dark:text-blue-300' : ''}`}>
                      {item.name}
                    </span>
                  </div>
                  {/* Chevron Icon */}
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      sectionOpen ? 'rotate-180' : ''
                    } ${sectionActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Children - Collapsible */}
                {sectionOpen && (
                  <div className="mt-1 space-y-1 animate-slideDown">
                    {item.children.map((child) => {
                      const isChildActive = isRouteActive(child.href);
                      return (
                        <Link
                          key={child.name}
                          href={child.href!}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center px-4 sm:px-6 py-2.5 mx-2 ml-8 rounded-lg transition-all duration-200 ${
                            isChildActive
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <span className="mr-3 text-base">{child.icon}</span>
                          <span className={`text-sm ${isChildActive ? 'font-semibold' : ''}`}>
                            {child.name}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </>
  );
}
