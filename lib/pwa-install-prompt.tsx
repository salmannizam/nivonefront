'use client';

import { useEffect, useState } from 'react';
import { showSuccess } from './utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if app was installed before
    const installed = localStorage.getItem('pwa-installed');
    if (installed === 'true') {
      setIsInstalled(true);
      return;
    }

    // Check visit count
    const visitCount = parseInt(localStorage.getItem('pwa-visit-count') || '0', 10);
    const shouldShowPrompt = visitCount >= 2 || localStorage.getItem('pwa-prompt-shown') === 'true';

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      if (shouldShowPrompt) {
        setShowPrompt(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowPrompt(false);
      localStorage.setItem('pwa-installed', 'true');
      showSuccess('App installed successfully!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        localStorage.setItem('pwa-installed', 'true');
        showSuccess('App installation started!');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
      localStorage.setItem('pwa-prompt-shown', 'true');
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  };

  const incrementVisitCount = () => {
    const count = parseInt(localStorage.getItem('pwa-visit-count') || '0', 10);
    localStorage.setItem('pwa-visit-count', (count + 1).toString());
    
    // Show prompt after 2 visits
    if (count + 1 >= 2 && deferredPrompt) {
      setShowPrompt(true);
    }
  };

  return {
    deferredPrompt,
    showPrompt,
    isInstalled,
    install,
    incrementVisitCount,
    dismissPrompt: () => {
      setShowPrompt(false);
      localStorage.setItem('pwa-prompt-shown', 'true');
    },
  };
}
