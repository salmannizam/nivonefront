'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import FeatureGuard from '@/components/FeatureGuard';
import { logError, showError, showSuccess } from '@/lib/utils';

interface Tag {
  _id: string;
  name: string;
  color?: string;
  category?: string;
  isActive: boolean;
  createdAt?: string;
}

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
];

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: DEFAULT_COLORS[0],
    category: 'General',
  });

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tags');
      setTags(response.data);
    } catch (error) {
      logError(error, 'Failed to load tags');
      showError(error, 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.patch(`/tags/${editing._id}`, formData);
        showSuccess('Tag updated successfully');
      } else {
        await api.post('/tags', formData);
        showSuccess('Tag created successfully');
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ name: '', color: DEFAULT_COLORS[0], category: 'General' });
      loadTags();
    } catch (error: any) {
      logError(error, 'Failed to save tag');
      showError(error, 'Failed to save tag');
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditing(tag);
    setFormData({
      name: tag.name,
      color: tag.color || DEFAULT_COLORS[0],
      category: tag.category || 'General',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag? This will remove it from all items using it.')) return;
    try {
      await api.delete(`/tags/${id}`);
      showSuccess('Tag deleted successfully');
      loadTags();
    } catch (error: any) {
      logError(error, 'Failed to delete tag');
      showError(error, 'Failed to delete tag');
    }
  };

  const handleToggleActive = async (tag: Tag) => {
    try {
      await api.patch(`/tags/${tag._id}`, { isActive: !tag.isActive });
      showSuccess(`Tag ${!tag.isActive ? 'activated' : 'deactivated'} successfully`);
      loadTags();
    } catch (error: any) {
      logError(error, 'Failed to update tag');
      showError(error, 'Failed to update tag');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400 text-lg">Loading tags...</div>
        </div>
      </div>
    );
  }

  const categories = Array.from(new Set(tags.map(t => t.category || 'General')));

  return (
    <FeatureGuard feature="customTags">
      <div className="animate-fadeIn">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-slideInLeft">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              🏷️ Custom Tags
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Create and manage custom tags for residents, rooms, and payments
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditing(null);
              setFormData({ name: '', color: DEFAULT_COLORS[0], category: 'General' });
            }}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-500 dark:via-purple-500 dark:to-pink-500 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 dark:hover:from-indigo-600 dark:hover:via-purple-600 dark:hover:to-pink-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold"
          >
            + Create Tag
          </button>
        </div>

        {showForm && (
          <div className="bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-gray-800 dark:via-indigo-900/20 dark:to-purple-900/20 p-4 sm:p-6 rounded-2xl shadow-xl border-2 border-indigo-100 dark:border-indigo-900/30 mb-6 animate-slideInUp">
            <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              {editing ? 'Edit Tag' : 'Create New Tag'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Tag Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., VIP, Late payer, Staff friend"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Resident, Payment, Room"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Color</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        formData.color === color
                          ? 'border-gray-900 dark:border-white scale-110 shadow-lg'
                          : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="#3B82F6"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Select a color or enter a hex code
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 dark:from-indigo-500 dark:to-purple-500 dark:hover:from-indigo-600 dark:hover:to-purple-600 transition-colors font-bold"
                >
                  {editing ? 'Update Tag' : 'Create Tag'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                  }}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-gray-800 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl shadow-xl border-2 border-indigo-100 dark:border-indigo-900/30 overflow-hidden animate-slideInUp">
          {tags.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🏷️</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No tags yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first tag to start organizing residents, rooms, and payments
              </p>
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditing(null);
                  setFormData({ name: '', color: DEFAULT_COLORS[0], category: 'General' });
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors font-bold"
              >
                Create Your First Tag
              </button>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              {categories.map((category, catIndex) => {
                const categoryTags = tags.filter(t => (t.category || 'General') === category);
                return (
                  <div key={category} className="mb-6 last:mb-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <span className="text-indigo-600 dark:text-indigo-400">{category}</span>
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        ({categoryTags.length})
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {categoryTags.map((tag, index) => (
                        <div
                          key={tag._id}
                          className={`bg-white dark:bg-gray-800 p-4 rounded-xl border-2 transition-all hover:shadow-lg ${
                            tag.isActive
                              ? 'border-indigo-200 dark:border-indigo-800'
                              : 'border-gray-200 dark:border-gray-700 opacity-60'
                          } animate-fadeIn`}
                          style={{ animationDelay: `${(catIndex * 10 + index) * 50}ms` }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1">
                              <div
                                className="w-4 h-4 rounded-full flex-shrink-0"
                                style={{ backgroundColor: tag.color || DEFAULT_COLORS[0] }}
                              />
                              <span className="font-bold text-gray-900 dark:text-white truncate">
                                {tag.name}
                              </span>
                            </div>
                            <button
                              onClick={() => handleToggleActive(tag)}
                              className={`text-xs px-2 py-1 rounded ${
                                tag.isActive
                                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {tag.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleEdit(tag)}
                              className="flex-1 text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(tag._id)}
                              className="flex-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </FeatureGuard>
  );
}
