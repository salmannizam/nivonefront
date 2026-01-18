# i18n Implementation Guide

## Overview

Multi-language support has been implemented for the NivaasOne tenant application with **English (default)** and **Hindi** support. This is a UI/UX-level enhancement that does not affect any business logic, APIs, guards, or feature flags.

## Architecture

### Translation Files Structure

```
/locales
  /en
    common.json      # Common buttons, labels, messages
    sidebar.json     # Sidebar navigation items
    forms.json       # Form labels, validation messages
    dashboard.json   # Dashboard-specific translations
  /hi
    common.json      # Hindi translations
    sidebar.json
    forms.json
    dashboard.json
```

### Key Components

1. **`lib/i18n.ts`**: Core translation logic with key-based system
2. **`lib/i18n-context.tsx`**: React context for language management
3. **`components/LanguageSelector.tsx`**: Language switcher component

## Usage

### Basic Translation

```tsx
import { useI18n } from '@/lib/i18n-context';

function MyComponent() {
  const { t } = useI18n();
  
  return (
    <button>{t('common.buttons.save')}</button>
  );
}
```

### Translation with Parameters

```tsx
const message = t('forms.validation.minLength', { min: 8 });
// Output (en): "Minimum 8 characters required"
// Output (hi): "न्यूनतम 8 वर्ण आवश्यक"
```

### Changing Language

```tsx
import { useI18n } from '@/lib/i18n-context';

function MyComponent() {
  const { language, setLanguage } = useI18n();
  
  return (
    <button onClick={() => setLanguage('hi')}>
      Switch to Hindi
    </button>
  );
}
```

## Translation Keys

### Common (`common.json`)
- `common.buttons.*` - All button labels (save, cancel, add, edit, delete, etc.)
- `common.labels.*` - Common labels (name, email, status, etc.)
- `common.messages.*` - Common messages (success, error, confirmations)

### Sidebar (`sidebar.json`)
- `sidebar.dashboard` - Dashboard
- `sidebar.property` - Property
- `sidebar.buildings` - Buildings
- `sidebar.residents` - Residents
- ... (all sidebar items)

### Forms (`forms.json`)
- `forms.validation.*` - Validation messages
- `forms.placeholders.*` - Input placeholders

### Dashboard (`dashboard.json`)
- `dashboard.title` - Dashboard title
- `dashboard.emptyState.*` - Empty state messages

## Language Persistence

- Language preference is stored in:
  1. **User profile** (`user.preferredLanguage`) - Persists across devices
  2. **localStorage** (`preferredLanguage`) - Fallback for non-authenticated users
- Language is automatically synced when user logs in
- Changes are saved to backend via `/users/me` endpoint

## Adding New Languages

To add a new language (e.g., Tamil):

1. Create new locale folder: `/locales/ta/`
2. Copy English JSON files and translate
3. Update `lib/i18n.ts`:
   ```ts
   import taCommon from '@/locales/ta/common.json';
   // ... add to translations object
   ```
4. Update `supportedLanguages` array
5. Add language name to `LanguageSelector.tsx`

**No component changes needed!**

## Components Updated

✅ **Sidebar** - All navigation items use translations
✅ **Header** - Logout button uses translation
✅ **LanguageSelector** - Available in Header and Profile Settings
✅ **Profile Settings** - Language preference section added

## Backend Changes

- ✅ User schema includes `preferredLanguage` field (enum: 'en' | 'hi', default: 'en')
- ✅ `UpdateUserDto` accepts `preferredLanguage`
- ✅ Auth service returns `preferredLanguage` in user object
- ✅ No breaking changes to existing APIs

## Future Enhancements

- Add more languages (Tamil, Marathi, Telugu, etc.)
- Translate page titles and meta descriptions
- Add RTL support for languages that need it
- Translate error messages from backend (optional)
