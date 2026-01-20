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
  // Safely get auth - handle SSR case where provider might not be ready
  // This is necessary because PWASetup is in root layout and may be rendered during prerendering
  let user;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch (e) {
    // AuthProvider not ready during SSR, treat as no user
    user = null;
  }
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
