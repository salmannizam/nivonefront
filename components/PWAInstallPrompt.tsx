'use client';

import { usePWAInstallPrompt } from '@/lib/pwa-install-prompt';

export default function PWAInstallPrompt() {
  const { showPrompt, install, dismissPrompt, isInstalled } = usePWAInstallPrompt();

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slideInUp">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-blue-500 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📱</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">
              Install NivaasOne
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Add to your home screen for quick access and offline support.
            </p>
            <div className="flex gap-2">
              <button
                onClick={install}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Install
              </button>
              <button
                onClick={dismissPrompt}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
