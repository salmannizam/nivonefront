'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n-context';

interface FilterOption {
  label: string;
  value: string;
}

interface DateRangeFilter {
  from?: string;
  to?: string;
}

interface FilterPanelProps {
  filters: {
    [key: string]: {
      type: 'select' | 'text' | 'date' | 'dateRange' | 'number' | 'numberRange';
      label: string;
      options?: FilterOption[];
      placeholder?: string;
      advanced?: boolean; // Mark filter as advanced
    };
  };
  filterValues?: Record<string, any>;
  onFilterChange: (filters: Record<string, any>) => void;
  onReset: () => void;
  showAdvanced?: boolean;
}

export default function FilterPanel({
  filters,
  filterValues: externalFilterValues,
  onFilterChange,
  onReset,
  showAdvanced = false,
}: FilterPanelProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [internalFilterValues, setInternalFilterValues] = useState<Record<string, any>>({});
  
  // Use external filter values if provided, otherwise use internal state
  const filterValues = externalFilterValues !== undefined ? externalFilterValues : internalFilterValues;

  // Sync internal state when external values change
  useEffect(() => {
    if (externalFilterValues !== undefined) {
      setInternalFilterValues(externalFilterValues);
    }
  }, [externalFilterValues]);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filterValues, [key]: value };
    if (externalFilterValues === undefined) {
      setInternalFilterValues(newFilters);
    }
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const emptyFilters: Record<string, any> = {};
    if (externalFilterValues === undefined) {
      setInternalFilterValues(emptyFilters);
    }
    onReset();
  };

  const activeFilterCount = Object.values(filterValues).filter((v) => {
    if (v === '' || v === undefined || v === null) return false;
    if (typeof v === 'object' && !Array.isArray(v)) {
      // For dateRange and numberRange, check if any property has a value
      return Object.values(v).some((val) => val !== '' && val !== undefined && val !== null);
    }
    return true;
  }).length;

  return (
    <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>{t('common.buttons.filter')}</span>
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={handleReset}
              className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
            >
              {t('common.buttons.clear')}
            </button>
          )}
        </div>
        {showAdvanced && (
          <button
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors font-medium"
          >
            {isAdvancedOpen ? t('common.buttons.hide') : t('common.buttons.show')} {t('common.labels.advancedFilters')}
          </button>
        )}
      </div>

      {isOpen && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(filters).map(([key, filter]) => {
            // Hide advanced filters if advanced panel is not open
            if (filter.advanced && !isAdvancedOpen) {
              return null;
            }
            if (filter.type === 'select') {
              return (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                    {filter.label}
                  </label>
                  <select
                    value={filterValues[key] || ''}
                    onChange={(e) => handleFilterChange(key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">{t('common.labels.all')}</option>
                    {filter.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            if (filter.type === 'text') {
              return (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    {filter.label}
                  </label>
                  <input
                    type="text"
                    value={filterValues[key] || ''}
                    onChange={(e) => handleFilterChange(key, e.target.value)}
                    placeholder={filter.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              );
            }

            if (filter.type === 'date') {
              return (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    {filter.label}
                  </label>
                  <input
                    type="date"
                    value={filterValues[key] || ''}
                    onChange={(e) => handleFilterChange(key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              );
            }

            if (filter.type === 'dateRange') {
              const dateRange = filterValues[key] as DateRangeFilter || {};
              return (
                <div key={key} className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    {filter.label}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={dateRange.from || ''}
                      onChange={(e) =>
                        handleFilterChange(key, { ...dateRange, from: e.target.value })
                      }
                      placeholder={t('common.labels.from')}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="date"
                      value={dateRange.to || ''}
                      onChange={(e) =>
                        handleFilterChange(key, { ...dateRange, to: e.target.value })
                      }
                      placeholder={t('common.labels.to')}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              );
            }

            if (filter.type === 'number') {
              return (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    {filter.label}
                  </label>
                  <input
                    type="number"
                    value={filterValues[key] || ''}
                    onChange={(e) => handleFilterChange(key, e.target.value ? Number(e.target.value) : '')}
                    placeholder={filter.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              );
            }

            if (filter.type === 'numberRange') {
              const numberRange = filterValues[key] as { min?: number; max?: number } || {};
              return (
                <div key={key} className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    {filter.label}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={numberRange.min || ''}
                      onChange={(e) =>
                        handleFilterChange(key, {
                          ...numberRange,
                          min: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder={t('common.labels.min')}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      value={numberRange.max || ''}
                      onChange={(e) =>
                        handleFilterChange(key, {
                          ...numberRange,
                          max: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder={t('common.labels.max')}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
}
