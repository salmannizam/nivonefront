'use client';

import { ResidentAuthProvider } from '@/lib/resident-auth-context';
import { useResidentAuth } from '@/lib/resident-auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

function ResidentLayoutContent({ children }: { children: React.ReactNode }) {
  const { resident, loading } = useResidentAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      // Public routes that don't require authentication
      const publicRoutes = ['/resident/login', '/resident/select-tenant'];
      const isPublicRoute = publicRoutes.includes(pathname);

      if (!isPublicRoute && !resident) {
        router.push('/resident/login');
      } else if (isPublicRoute && resident && pathname === '/resident/login') {
        router.push('/resident/dashboard');
      }
    }
  }, [resident, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function ResidentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ResidentAuthProvider>
      <ResidentLayoutContent>{children}</ResidentLayoutContent>
    </ResidentAuthProvider>
  );
}
