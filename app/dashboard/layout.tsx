'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';
import { ToastContainer } from '@/components/Toast';
import { saveTenantSlug, getLastTenantSlug } from '@/lib/tenant-slug-persistence';
import { getTenantSlug } from '@/lib/auth';
import { UndoProvider } from '@/lib/undo-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'SUPER_ADMIN') {
        // Redirect Super Admin away from tenant dashboard
        router.push('/admin');
      } else {
        // Save tenant slug for PWA auto-redirect
        const tenantSlug = getTenantSlug();
        if (tenantSlug) {
          saveTenantSlug(tenantSlug);
        }
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <UndoProvider>
      <div className="min-h-screen h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
        <Header />
        <div className="flex flex-1 pt-16 lg:pt-0 overflow-hidden">
          <Sidebar />
          <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 lg:ml-0 overflow-y-auto overflow-x-hidden min-w-0 pb-16 lg:pb-0">
            {children}
          </main>
        </div>
        <MobileBottomNav />
        <ToastContainer />
      </div>
    </UndoProvider>
  );
}
