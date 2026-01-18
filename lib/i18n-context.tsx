'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, defaultLanguage, supportedLanguages, getTranslation } from './i18n';
import { useAuth } from './auth-context';
import api from './api';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize language from user preference or localStorage
  useEffect(() => {
    if (isInitialized) return;

    // Try to get from user profile first
    if (user && (user as any).preferredLanguage) {
      const userLang = (user as any).preferredLanguage as Language;
      if (supportedLanguages.includes(userLang)) {
        setLanguageState(userLang);
        // Sync to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('preferredLanguage', userLang);
        }
        setIsInitialized(true);
        return;
      }
    }

    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('preferredLanguage') as Language;
      if (storedLang && supportedLanguages.includes(storedLang)) {
        setLanguageState(storedLang);
      }
    }

    setIsInitialized(true);
  }, [user, isInitialized]);

  // Update language when user changes
  useEffect(() => {
    if (user && (user as any).preferredLanguage) {
      const userLang = (user as any).preferredLanguage as Language;
      if (supportedLanguages.includes(userLang) && userLang !== language) {
        setLanguageState(userLang);
        if (typeof window !== 'undefined') {
          localStorage.setItem('preferredLanguage', userLang);
        }
      }
    }
  }, [user, language]);

  // Update user's preferred language in backend
  const setLanguage = useCallback(async (lang: Language) => {
    if (!supportedLanguages.includes(lang)) {
      return;
    }

    setLanguageState(lang);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLanguage', lang);
    }

    // Update user profile if authenticated (use /users/me endpoint)
    if (user && user.id) {
      try {
        await api.patch('/users/me', {
          preferredLanguage: lang,
        });
        // Refresh user data to get updated preferredLanguage
        // The auth context will pick it up automatically
      } catch (error) {
        console.error('Failed to update user language preference:', error);
        // Don't throw - language is still set locally
      }
    }
  }, [user]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return getTranslation(key, language, params);
    },
    [language],
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
