# i18n Update Guide for Remaining Pages

## Quick Update Pattern

For each page, follow this pattern:

1. **Import useI18n hook:**
```tsx
import { useI18n } from '@/lib/i18n-context';
```

2. **Add t function:**
```tsx
const { t } = useI18n();
```

3. **Replace hardcoded strings:**
   - Page titles: `t('pages.{pageName}.title')`
   - Buttons: `t('common.buttons.{buttonName}')`
   - Labels: `t('common.labels.{labelName}')` or `t('pages.{pageName}.{labelName}')`
   - Messages: `t('common.messages.{messageName}')` or `t('pages.{pageName}.{messageName}')`
   - Form labels: `t('pages.{pageName}.{fieldName}')`
   - Placeholders: `t('forms.placeholders.{placeholderName}')`

## Pages to Update

### ✅ Completed:
- Buildings (`/dashboard/buildings`)
- Residents (`/dashboard/residents`) - Partially done
- Rooms (`/dashboard/rooms`) - Partially done

### 🔄 Remaining Pages:

1. **Complaints** (`/dashboard/complaints`)
   - Title, form labels, status options, priority options
   - Use: `t('pages.complaints.*')`

2. **Visitors** (`/dashboard/visitors`)
   - Title, form labels
   - Use: `t('pages.visitors.*')`

3. **Notices** (`/dashboard/notices`)
   - Title, form labels, status options
   - Use: `t('pages.notices.*')`

4. **Staff** (`/dashboard/staff`)
   - Title, form labels
   - Use: `t('pages.staff.*')`

5. **Users** (`/dashboard/users`)
   - Title, form labels, role options
   - Use: `t('pages.users.*')`

6. **Payments** (`/dashboard/payments`)
   - Title, section titles, status labels
   - Use: `t('pages.payments.*')`

7. **Assets** (`/dashboard/assets`)
   - Title, form labels, status options
   - Use: `t('pages.assets.*')`

8. **Tags** (`/dashboard/tags`)
   - Title, form labels
   - Use: `t('pages.tags.*')`

9. **Gate Passes** (`/dashboard/gate-passes`)
   - Title, form labels, status options
   - Use: `t('pages.gatePasses.*')`

10. **Personal Notes** (`/dashboard/personal-notes`)
    - Title, form labels
    - Use: `t('pages.personalNotes.*')`

11. **Beds** (`/dashboard/beds`)
    - Add to pages.json if needed
    - Use: `t('pages.beds.*')`

12. **Dashboard Main** (`/dashboard/page.tsx`)
    - Statistics labels, empty states
    - Use: `t('dashboard.*')` and `t('common.labels.*')`

13. **Settings Pages** (`/dashboard/settings/*`)
    - Profile, Organization, Features, Notifications
    - Use: `t('pages.settings.*')`

## Example Update

**Before:**
```tsx
<h1>Complaints</h1>
<button>+ Add Complaint</button>
<label>Status</label>
```

**After:**
```tsx
const { t } = useI18n();
<h1>{t('pages.complaints.title')}</h1>
<button>+ {t('pages.complaints.addComplaint')}</button>
<label>{t('labels.status')}</label>
```

## Translation Keys Available

All keys are in:
- `common.json` - Common buttons, labels, messages
- `pages.json` - Page-specific translations
- `forms.json` - Form validation and placeholders
- `sidebar.json` - Sidebar navigation
- `dashboard.json` - Dashboard-specific
