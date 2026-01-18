import enCommon from '@/locales/en/common.json';
import enSidebar from '@/locales/en/sidebar.json';
import enForms from '@/locales/en/forms.json';
import enDashboard from '@/locales/en/dashboard.json';
import enPages from '@/locales/en/pages.json';
import hiCommon from '@/locales/hi/common.json';
import hiSidebar from '@/locales/hi/sidebar.json';
import hiForms from '@/locales/hi/forms.json';
import hiDashboard from '@/locales/hi/dashboard.json';
import hiPages from '@/locales/hi/pages.json';

export type Language = 'en' | 'hi';

export const supportedLanguages: Language[] = ['en', 'hi'];
export const defaultLanguage: Language = 'en';

export interface Translations {
  common: typeof enCommon;
  sidebar: typeof enSidebar;
  forms: typeof enForms;
  dashboard: typeof enDashboard;
  pages: typeof enPages;
}

const translations: Record<Language, Translations> = {
  en: {
    common: enCommon,
    sidebar: enSidebar,
    forms: enForms,
    dashboard: enDashboard,
    pages: enPages,
  },
  hi: {
    common: hiCommon,
    sidebar: hiSidebar,
    forms: hiForms,
    dashboard: hiDashboard,
    pages: hiPages,
  },
};

/**
 * Get translation value by key path (e.g., 'common.buttons.save')
 * Supports nested keys and parameter replacement
 */
export function getTranslation(
  key: string,
  language: Language = defaultLanguage,
  params?: Record<string, string | number>,
): string {
  const keys = key.split('.');
  let value: any = translations[language] || translations[defaultLanguage];

  // Navigate through nested keys
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to English if key not found
      value = translations[defaultLanguage];
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey];
        } else {
          return key; // Return key if translation not found
        }
      }
      break;
    }
  }

  // If value is a string, replace parameters
  if (typeof value === 'string' && params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }

  return typeof value === 'string' ? value : key;
}

/**
 * Get all translations for a specific namespace
 */
export function getTranslations(
  namespace: keyof Translations,
  language: Language = defaultLanguage,
): any {
  return translations[language]?.[namespace] || translations[defaultLanguage][namespace];
}
