'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth-context';
import api from './api';

interface FeatureContextType {
  features: Record<string, boolean>;
  loading: boolean;
  isFeatureEnabled: (featureKey: string) => boolean;
  refreshFeatures: () => Promise<void>;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export function FeatureProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const fetchFeatures = async () => {
    if (!user) {
      setFeatures({});
      setLoading(false);
      localStorage.removeItem('userFeatures');
      return;
    }

    // Super Admin users don't have tenant context, so skip feature flag checks
    // Super Admin should have access to all features
    if (user.role === 'SUPER_ADMIN') {
      // Set all features to enabled for Super Admin
      const allFeaturesEnabled: Record<string, boolean> = {};
      // You can import FeatureKey enum if needed, or just use empty object
      // Empty object means all features default to enabled (see isFeatureEnabled logic)
      setFeatures(allFeaturesEnabled);
      localStorage.setItem('userFeatures', JSON.stringify(allFeaturesEnabled));
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/feature-flags/user');
      const features = response.data.features || {};
      setFeatures(features);
      // Cache features in localStorage for API interceptor
      localStorage.setItem('userFeatures', JSON.stringify(features));
    } catch (error) {
      console.error('Failed to fetch features:', error);
      // Default to all features enabled if fetch fails (graceful degradation)
      setFeatures({});
      localStorage.removeItem('userFeatures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFeatures();
    } else {
      setFeatures({});
      setLoading(false);
    }
  }, [user]);

  const isFeatureEnabled = (featureKey: string): boolean => {
    // If features not loaded yet, default to false for safety
    if (loading) return false;
    // If feature not in the list, default to true for backward compatibility
    return features[featureKey] !== false;
  };

  return (
    <FeatureContext.Provider
      value={{
        features,
        loading,
        isFeatureEnabled,
        refreshFeatures: fetchFeatures,
      }}
    >
      {children}
    </FeatureContext.Provider>
  );
}

export function useFeatures() {
  const context = useContext(FeatureContext);
  if (context === undefined) {
    throw new Error('useFeatures must be used within a FeatureProvider');
  }
  return context;
}
