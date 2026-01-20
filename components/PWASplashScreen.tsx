'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function PWASplashScreen() {
  const [showSplash, setShowSplash] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Only show splash on initial load in standalone mode
    if (typeof window === 'undefined') return;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const hasSeenSplash = sessionStorage.getItem('pwa-splash-shown');

    if (isStandalone && !hasSeenSplash && pathname === '/') {
      setShowSplash(true);
      sessionStorage.setItem('pwa-splash-shown', 'true');

      // Hide splash after animation
      setTimeout(() => {
        setShowSplash(false);
      }, 2000);
    }
  }, [pathname]);

  if (!showSplash) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center animate-fadeOut">
      <div className="text-center">
        <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-2xl animate-scaleIn">
          <span className="text-5xl">🏠</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2 animate-slideInUp">NivaasOne</h1>
        <p className="text-blue-100 animate-slideInUp" style={{ animationDelay: '0.1s' }}>
          Hostel/PG Management
        </p>
      </div>
    </div>
  );
}
