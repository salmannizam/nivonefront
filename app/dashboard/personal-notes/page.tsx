'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import FeatureGuard from '@/components/FeatureGuard';
import { logError, showError, showSuccess } from '@/lib/utils';

interface PersonalNote {
  _id: string;
  content: string;
  isPinned: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface PinnedStats {
  count: number;
  max: number;
}

export default function PersonalNotesPage() {
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PersonalNote | null>(null);
  const [formData, setFormData] = useState({
    content: '',
    isPinned: false,
  });
  const [pinnedStats, setPinnedStats] = useState<PinnedStats>({ count: 0, max: 5 });

  useEffect(() => {
    loadNotes();
    loadPinnedStats();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/personal-notes');
      setNotes(response.data);
    } catch (error) {
      logError(error, 'Failed to load notes');
      showError('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const loadPinnedStats = async () => {
    try {
      const response = await api.get('/personal-notes/stats/pinned-count');
      setPinnedStats(response.data);
    } catch (error) {
      // Silently fail - not critical
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.patch(`/personal-notes/${editing._id}`, formData);
        showSuccess('Note updated successfully');
      } else {
        await api.post('/personal-notes', formData);
        showSuccess('Note created successfully');
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ content: '', isPinned: false });
      loadNotes();
      loadPinnedStats();
    } catch (error: any) {
      logError(error, 'Failed to save note');
      showError(error.response?.data?.message || 'Failed to save note');
    }
  };

  const handleEdit = (note: PersonalNote) => {
    setEditing(note);
    setFormData({
      content: note.content,
      isPinned: note.isPinned,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await api.delete(`/personal-notes/${id}`);
      showSuccess('Note deleted successfully');
      loadNotes();
      loadPinnedStats();
    } catch (error: any) {
      logError(error, 'Failed to delete note');
      showError(error.response?.data?.message || 'Failed to delete note');
    }
  };

  const handleTogglePin = async (note: PersonalNote) => {
    try {
      await api.patch(`/personal-notes/${note._id}`, {
        isPinned: !note.isPinned,
      });
      showSuccess(note.isPinned ? 'Note unpinned' : 'Note pinned');
      loadNotes();
      loadPinnedStats();
    } catch (error: any) {
      logError(error, 'Failed to update note');
      showError(error.response?.data?.message || 'Failed to update note');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <FeatureGuard feature="personalNotes">
      <div className="animate-fadeIn">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Personal Notes
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Your private notepad and reminders
            </p>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setFormData({ content: '', isPinned: false });
              setShowForm(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
          >
            + New Note
          </button>
        </div>

        {/* Pinned Stats */}
        {pinnedStats.count > 0 && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              📌 {pinnedStats.count} of {pinnedStats.max} notes pinned
            </p>
          </div>
        )}

        {/* Create/Edit Form */}
        {showForm && (
          <div className="mb-6 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 animate-slideInUp">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editing ? 'Edit Note' : 'New Note'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  rows={6}
                  placeholder="Write your note here..."
                  required
                  maxLength={10000}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.content.length}/10000 characters
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={formData.isPinned}
                  onChange={(e) => {
                    if (e.target.checked && pinnedStats.count >= pinnedStats.max && !editing?.isPinned) {
                      showError(`Maximum ${pinnedStats.max} pinned notes allowed`);
                      return;
                    }
                    setFormData({ ...formData, isPinned: e.target.checked });
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={!formData.isPinned && pinnedStats.count >= pinnedStats.max && !editing?.isPinned}
                />
                <label htmlFor="isPinned" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pin this note
                  {!formData.isPinned && pinnedStats.count >= pinnedStats.max && !editing?.isPinned && (
                    <span className="text-red-500 ml-1">(Max {pinnedStats.max} pinned)</span>
                  )}
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium"
                >
                  {editing ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                    setFormData({ content: '', isPinned: false });
                  }}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notes List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
              <div className="text-gray-600 dark:text-gray-400 text-lg">Loading notes...</div>
            </div>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No notes yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first note to get started</p>
            <button
              onClick={() => {
                setEditing(null);
                setFormData({ content: '', isPinned: false });
                setShowForm(true);
              }}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium"
            >
              Create Note
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <div
                key={note._id}
                className={`p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 transition-all hover:shadow-xl transform hover:scale-[1.02] ${
                  note.isPinned
                    ? 'border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {note.isPinned && (
                  <div className="flex items-center mb-2 text-yellow-600 dark:text-yellow-400">
                    <span className="text-sm font-bold">📌 Pinned</span>
                  </div>
                )}
                <div className="mb-3">
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                    {note.content}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(note.updatedAt || note.createdAt)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTogglePin(note)}
                      className={`p-2 rounded-lg transition-all ${
                        note.isPinned
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      title={note.isPinned ? 'Unpin note' : 'Pin note'}
                    >
                      📌
                    </button>
                    <button
                      onClick={() => handleEdit(note)}
                      className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all"
                      title="Edit note"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(note._id)}
                      className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                      title="Delete note"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </FeatureGuard>
  );
}
