'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from '@/components/Toast';

type SearchGroupKey = 'residents' | 'rooms' | 'payments';

interface SearchResultItem {
  id: string;
  label: string;
  meta?: string;
}

type SearchResults = Record<SearchGroupKey, SearchResultItem[]>;

const GROUPS: { key: SearchGroupKey; title: string; path: string }[] = [
  { key: 'residents', title: 'Residents', path: '/dashboard/residents' },
  { key: 'rooms', title: 'Rooms', path: '/dashboard/rooms' },
  { key: 'payments', title: 'Payments', path: '/dashboard/payments' },
];

function formatResults(data?: SearchResults): SearchResults {
  return {
    residents: data?.residents ?? [],
    rooms: data?.rooms ?? [],
    payments: data?.payments ?? [],
  };
}

export default function SearchDropdown() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    api
      .get<SearchResults>('/search', {
        params: { q: debouncedQuery },
      })
      .then((response) => {
        if (!cancelled) {
          setResults(formatResults(response.data));
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Unable to fetch search results. Please try again.');
          setResults({ residents: [], rooms: [], payments: [] });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    if (debouncedQuery) {
      setIsOpen(true);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, []);

  useEffect(() => {
  const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const hasResults = useMemo(() => {
    if (!results) return false;
    return GROUPS.some((group) => (results[group.key] ?? []).length > 0);
  }, [results]);

  const firstResult = useMemo(() => {
    if (!results) return null;
    for (const group of GROUPS) {
      const items = results[group.key];
      if (items && items.length > 0) {
        return { groupKey: group.key, item: items[0] };
      }
    }
    return null;
  }, [results]);

  const navigateToGroup = (groupKey: SearchGroupKey, item?: SearchResultItem) => {
    const group = GROUPS.find((entry) => entry.key === groupKey);
    if (!group) return;
    const params = new URLSearchParams();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      params.set('q', trimmedQuery);
    }
    if (item?.id) {
      params.set('highlight', item.id);
    }
    const formattedParams = params.toString();
    const destination = `${group.path}${formattedParams ? `?${formattedParams}` : ''}`;
    router.push(destination);
    setIsOpen(false);
  };

  const handleResultClick = (groupKey: SearchGroupKey, item: SearchResultItem) => {
    navigateToGroup(groupKey, item);
  };

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && firstResult) {
      event.preventDefault();
      navigateToGroup(firstResult.groupKey, firstResult.item);
    }
  };

  const shouldShowDropdown = isOpen && (isLoading || results !== null);

  return (
    <div ref={containerRef} className="relative w-full">
      <label htmlFor="global-search" className="sr-only">
        Search residents, rooms, and payments
      </label>
      <input
        id="global-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleInputKeyDown}
        placeholder="Search residents, rooms, or payments"
        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
        aria-label="Search residents, rooms, and payments"
        autoComplete="off"
      />
      {shouldShowDropdown && (
        <div className="absolute left-0 right-0 mt-2 z-30 max-h-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/10 ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-900">
          <div className="py-2">
            {isLoading && (
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                <svg
                  className="h-4 w-4 animate-spin text-gray-600 dark:text-gray-300"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Searching...
              </div>
            )}
            {!isLoading && results && hasResults && (
              <div className="space-y-3">
                {GROUPS.map((group) => {
                  const items = results[group.key] ?? [];
                  return (
                    <div key={group.key} className="border-t border-transparent px-4 first:border-t-0">
                      <div className="mb-1 flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        <span>{group.title}</span>
                        {items.length > 0 && <span>{items.length} result{items.length > 1 ? 's' : ''}</span>}
                      </div>
                      <div className="flex flex-col rounded-2xl border border-transparent bg-white dark:bg-gray-900">
                        {items.length === 0 ? (
                          <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                            No {group.title.toLowerCase()} matched
                          </div>
                        ) : (
                          items.map((item) => (
                            <button
                              key={`${group.key}-${item.id}`}
                              type="button"
                              onClick={() => handleResultClick(group.key, item)}
                              className="flex w-full items-start rounded-xl px-4 py-3 text-left text-sm transition hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              <div className="flex w-full flex-col gap-1">
                                <span className="font-medium text-gray-800 dark:text-gray-50">{item.label}</span>
                                {item.meta && (
                                  <span className="text-[11px] text-gray-500 dark:text-gray-400">{item.meta}</span>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {!isLoading && results && !hasResults && (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400" role="status">
                No results found for{' '}
                <span className="font-semibold text-gray-900 dark:text-gray-100">{`"${debouncedQuery}"`}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
