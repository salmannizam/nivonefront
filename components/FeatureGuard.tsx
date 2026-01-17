'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFeatures } from '@/lib/feature-context';
import { showError } from '@/lib/utils';

interface FeatureGuardProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function FeatureGuard({ feature, children, fallback }: FeatureGuardProps) {
  const { isFeatureEnabled, loading } = useFeatures();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isFeatureEnabled(feature)) {
      showError(null, 'This feature is not available for your account');
      router.push('/dashboard');
    }
  }, [feature, isFeatureEnabled, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!isFeatureEnabled(feature)) {
    return (
      fallback || (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Feature Not Available
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              This feature is not enabled for your account.
            </p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
