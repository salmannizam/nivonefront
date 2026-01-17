'use client';

import { useState, useEffect, KeyboardEvent, useRef } from 'react';
import api from '@/lib/api';
import { useFeatures } from '@/lib/feature-context';

interface Tag {
  _id: string;
  name: string;
  color?: string;
  category?: string;
  isActive: boolean;
}

interface TagSelectorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export default function TagSelector({ tags, onChange, placeholder = 'Add tags...', maxTags }: TagSelectorProps) {
  const { isFeatureEnabled } = useFeatures();
  const [inputValue, setInputValue] = useState('');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const safeTags = tags || [];

  const hasCustomTagsFeature = isFeatureEnabled('customTags');

  useEffect(() => {
    if (hasCustomTagsFeature) {
      loadTags();
    }
  }, [hasCustomTagsFeature]);

  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = availableTags.filter(
        tag => tag.isActive && 
        tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
        !safeTags.includes(tag.name)
      );
      setFilteredTags(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setFilteredTags([]);
      setShowDropdown(false);
    }
  }, [inputValue, availableTags, safeTags]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tags');
      setAvailableTags(response.data || []);
    } catch (error) {
      // Silently fail - tags feature might not be enabled
      setAvailableTags([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      // If there's a matching tag in dropdown, select it
      if (filteredTags.length > 0) {
        selectTag(filteredTags[0].name);
      } else {
        // Otherwise, add as custom tag
        addTag(inputValue.trim());
      }
    } else if (e.key === 'Backspace' && !inputValue && safeTags.length > 0) {
      removeTag(safeTags.length - 1);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const addTag = (tag: string) => {
    if (maxTags && safeTags.length >= maxTags) return;
    if (tag && !safeTags.includes(tag)) {
      onChange([...safeTags, tag]);
      setInputValue('');
      setShowDropdown(false);
    }
  };

  const selectTag = (tagName: string) => {
    addTag(tagName);
  };

  const removeTag = (index: number) => {
    onChange(safeTags.filter((_, i) => i !== index));
  };

  const getTagColor = (tagName: string): string => {
    const tag = availableTags.find(t => t.name === tagName);
    return tag?.color || '#3B82F6';
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-blue-500 dark:focus-within:ring-blue-400">
        {safeTags.map((tag, index) => {
          const tagColor = getTagColor(tag);
          return (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium text-white shadow-sm"
              style={{ backgroundColor: tagColor }}
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="text-white hover:text-gray-200 font-bold"
              >
                ×
              </button>
            </span>
          );
        })}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.trim() && filteredTags.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder={safeTags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      {showDropdown && filteredTags.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {filteredTags.map((tag) => (
            <button
              key={tag._id}
              type="button"
              onClick={() => selectTag(tag.name)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: tag.color || '#3B82F6' }}
              />
              <span className="text-gray-900 dark:text-white">{tag.name}</span>
              {tag.category && (
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                  {tag.category}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {hasCustomTagsFeature && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Type to search tags or press Enter to create a new one. Visit{' '}
          <a href="/dashboard/tags" className="text-blue-600 dark:text-blue-400 hover:underline">
            Tags
          </a>{' '}
          to manage your tag library.
        </p>
      )}
    </div>
  );
}
