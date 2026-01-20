'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { registerServiceWorker } from '@/lib/pwa-service-worker';
import { usePWAInstallPrompt } from '@/lib/pwa-install-prompt';
import { useAuth } from '@/lib/auth-context';
import PWAInstallPrompt from './PWAInstallPrompt';
import PWASplashScreen from './PWASplashScreen';

export default function PWASetup() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { incrementVisitCount } = usePWAInstallPrompt();

  useEffect(() => {
    // Register service worker
    registerServiceWorker();

    // Increment visit count on dashboard pages or after login
    if (user && (pathname?.startsWith('/dashboard') || pathname === '/')) {
      incrementVisitCount();
    }
  }, [user, pathname, incrementVisitCount]);

  return (
    <>
      <PWASplashScreen />
      <PWAInstallPrompt />
    </>
  );
}
