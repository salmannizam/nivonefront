'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { authService } from '@/lib/auth';
import { ToastContainer } from '@/components/Toast';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Skip auth check for login page
  const isLoginPage = pathname === '/admin/login';
  
  // Check if pathname matches admin routes (excluding login)
  const isAdminRoute = pathname?.startsWith('/admin') && !isLoginPage;

  useEffect(() => {
    // Don't redirect if we're on the login page
    if (isLoginPage) {
      // If user is already logged in as Super Admin, redirect away from login
      if (!loading && user && user.role === 'SUPER_ADMIN') {
        router.push('/admin');
      }
      return;
    }

    // Only apply auth checks to admin routes (not login)
    if (isAdminRoute && !loading) {
      if (!user) {
        router.push('/admin/login');
      } else if (user.role !== 'SUPER_ADMIN') {
        // Redirect tenant users away from admin routes
        router.push('/dashboard');
      }
    }
  }, [user, loading, router, isLoginPage, isAdminRoute]);

  // If on login page, render children directly without layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // For admin routes, check auth
  if (isAdminRoute) {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      );
    }

    if (!user || user.role !== 'SUPER_ADMIN') {
      return null;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-30 border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-sm">
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-2.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="lg:hidden">
                {/* Mobile menu will be handled by sidebar */}
              </div>
              <div>
                <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                  Super Admin Panel
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
                  Platform Management
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              {user && (
                <>
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-none">
                      {user.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px] sm:max-w-none">
                      {user.email}
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      await authService.logout();
                      window.location.href = '/admin/login';
                    }}
                    className="px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                  >
                    <span className="hidden sm:inline">Logout</span>
                    <span className="sm:hidden">Out</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Layout with Sidebar */}
      <div className="flex pt-12 sm:pt-14">
        <AdminSidebar />
        <main className="flex-1 w-full min-w-0 p-3 sm:p-4 md:p-6 lg:p-8 lg:ml-0 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
