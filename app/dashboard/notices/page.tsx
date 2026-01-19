'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import FilterPanel from '@/components/FilterPanel';
import FeatureGuard from '@/components/FeatureGuard';
import { useI18n } from '@/lib/i18n-context';
import { logError, formatDate, showSuccess, showError, confirmAction } from '@/lib/utils';

interface Notice {
  _id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  status: string;
  publishDate?: string;
  scheduleStartDate?: string;
  expiryDate?: string;
  createdAt: string;
}

export default function NoticesPage() {
  const { t } = useI18n();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'normal',
    status: 'DRAFT',
    scheduleStartDate: '',
    expiryDate: '',
  });

  useEffect(() => {
    loadNotices();
  }, [filters]);

  const loadNotices = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.dateRange?.from) queryParams.append('dateFrom', filters.dateRange.from);
      if (filters.dateRange?.to) queryParams.append('dateTo', filters.dateRange.to);

      const response = await api.get(`/notices?${queryParams.toString()}`);
      setNotices(response.data);
    } catch (error) {
      logError(error, 'Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        scheduleStartDate: formData.scheduleStartDate ? new Date(formData.scheduleStartDate).toISOString() : undefined,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined,
      };
      
      if (editing) {
        await api.patch(`/notices/${editing._id}`, payload);
      } else {
        await api.post('/notices', payload);
      }
      setShowForm(false);
      setEditing(null);
      setFormData({
        title: '',
        content: '',
        category: 'general',
        priority: 'normal',
        status: 'DRAFT',
        scheduleStartDate: '',
        expiryDate: '',
      });
      loadNotices();
    } catch (error: any) {
      showError(error, error.response?.data?.message || t('pages.notices.saveError'));
    }
  };

  const handleEdit = (notice: Notice) => {
    setEditing(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      category: notice.category,
      priority: notice.priority,
      status: notice.status || 'DRAFT',
      scheduleStartDate: notice.scheduleStartDate 
        ? new Date(notice.scheduleStartDate).toISOString().split('T')[0] 
        : '',
      expiryDate: notice.expiryDate 
        ? new Date(notice.expiryDate).toISOString().split('T')[0] 
        : '',
    });
    setShowForm(true);
  };


  const handleDelete = async (id: string) => {
    const confirmed = await confirmAction(
      t('pages.notices.deleteConfirm'),
      t('common.messages.actionCannotUndo')
    );
    if (!confirmed) return;
    try {
      await api.delete(`/notices/${id}`);
      showSuccess(t('pages.notices.deletedSuccess'));
      loadNotices();
    } catch (error: any) {
      showError(error, error.response?.data?.message || t('pages.notices.deleteError'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600 dark:text-gray-400">{t('common.labels.loading')}</div>
      </div>
    );
  }

  const filterConfig = {
    search: {
      type: 'text' as const,
      label: t('common.buttons.search'),
      placeholder: t('pages.notices.searchPlaceholder'),
      advanced: false,
    },
    status: {
      type: 'select' as const,
      label: t('common.labels.status'),
      options: [
        { label: t('common.labels.all'), value: '' },
        { label: t('pages.notices.draft'), value: 'DRAFT' },
        { label: t('pages.notices.published'), value: 'PUBLISHED' },
        { label: t('pages.notices.expired'), value: 'EXPIRED' },
        { label: t('pages.notices.inactive'), value: 'INACTIVE' },
        { label: t('pages.notices.archived'), value: 'ARCHIVED' },
      ],
      advanced: false,
    },
    category: {
      type: 'select' as const,
      label: t('pages.notices.category'),
      options: [
        { label: t('pages.notices.allCategories'), value: '' },
        { label: t('pages.notices.general'), value: 'general' },
        { label: t('pages.notices.maintenance'), value: 'maintenance' },
        { label: t('pages.notices.event'), value: 'event' },
        { label: t('pages.notices.important'), value: 'important' },
      ],
      advanced: true,
    },
    priority: {
      type: 'select' as const,
      label: t('pages.notices.priority'),
      options: [
        { label: t('common.labels.all'), value: '' },
        { label: t('pages.notices.normal'), value: 'normal' },
        { label: t('pages.notices.high'), value: 'high' },
        { label: t('pages.notices.urgent'), value: 'urgent' },
      ],
      advanced: true,
    },
    dateRange: {
      type: 'dateRange' as const,
      label: t('pages.notices.publishDateRange'),
      advanced: true,
    },
  };

  return (
    <FeatureGuard feature="notices">
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 dark:from-gray-900 dark:via-rose-950 dark:to-pink-950">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-slideInDown">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 dark:from-rose-400 dark:via-pink-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
              📢 {t('pages.notices.title')}
            </h1>
            <p className="text-rose-600 dark:text-rose-400 mt-1 font-medium">{t('pages.notices.description')}</p>
          </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
            setFormData({
              title: '',
              content: '',
              category: 'general',
              priority: 'normal',
              status: 'DRAFT',
              scheduleStartDate: '',
              expiryDate: '',
            });
          }}
          className="w-full sm:w-auto bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-700 hover:via-pink-700 hover:to-fuchsia-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
        >
          <span className="text-xl">+</span> {t('pages.notices.addNotice')}
        </button>
      </div>

      <FilterPanel
        filters={filterConfig}
        filterValues={filters}
        onFilterChange={setFilters}
        onReset={() => setFilters({})}
        showAdvanced={true}
      />

      {showForm && (
        <div className="bg-gradient-to-br from-white via-rose-50/50 to-pink-50/50 dark:from-gray-800 dark:via-rose-900/20 dark:to-pink-900/20 p-4 sm:p-6 rounded-2xl shadow-xl border-2 border-rose-200 dark:border-rose-800 mb-6 animate-slideInUp">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {editing ? 'Edit Notice' : 'Add New Notice'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('pages.notices.title')}</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('pages.notices.content')}</label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                rows={6}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('pages.notices.category')}</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">{t('pages.notices.general')}</option>
                  <option value="maintenance">{t('pages.notices.maintenance')}</option>
                  <option value="payment">{t('pages.notices.payment')}</option>
                  <option value="event">{t('pages.notices.event')}</option>
                  <option value="rule">{t('pages.notices.rule')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('pages.notices.priority')}</label>
                <select
                  required
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">{t('pages.notices.normal')}</option>
                  <option value="important">{t('pages.notices.important')}</option>
                  <option value="urgent">{t('pages.notices.urgent')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('common.labels.status')}</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DRAFT">{t('pages.notices.draft')}</option>
                  <option value="PUBLISHED">{t('pages.notices.published')}</option>
                  <option value="INACTIVE">{t('pages.notices.inactive')}</option>
                  <option value="ARCHIVED">{t('pages.notices.archived')}</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('pages.notices.scheduleStart')} ({t('pages.notices.autoPublish')})</label>
                <input
                  type="date"
                  value={formData.scheduleStartDate}
                  onChange={(e) => setFormData({ ...formData, scheduleStartDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Leave empty to publish immediately"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Notice will auto-publish on this date. Leave empty to publish immediately.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('pages.notices.expiryDate')} ({t('pages.notices.autoExpire')})</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Notice will auto-expire on this date. Leave empty for no expiry.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-700 hover:via-pink-700 hover:to-fuchsia-700 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                {editing ? 'Update' : 'Create'}
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

      <div className="bg-gradient-to-br from-white via-rose-50/30 to-pink-50/30 dark:from-gray-800 dark:via-rose-900/20 dark:to-pink-900/20 rounded-2xl shadow-xl border-2 border-rose-100 dark:border-rose-900/30 overflow-hidden animate-slideInUp">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gradient-to-r from-rose-50 via-pink-50 to-fuchsia-50 dark:from-rose-900/30 dark:via-pink-900/30 dark:to-fuchsia-900/30">
            <tr>
              <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                {t('pages.notices.titleLabel')}
              </th>
              <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                {t('pages.notices.category')}
              </th>
              <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                {t('pages.notices.priority')}
              </th>
              <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                {t('pages.notices.scheduleStart')}
              </th>
              <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                {t('pages.notices.expiryDate')}
              </th>
              <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                {t('common.labels.status')}
              </th>
              <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                {t('common.labels.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-gradient-to-b from-white via-rose-50/10 to-pink-50/10 dark:from-gray-800 dark:via-rose-900/5 dark:to-pink-900/5 divide-y divide-rose-100 dark:divide-rose-800/30">
            {notices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    {t('pages.notices.noNotices')}
                </td>
              </tr>
            ) : (
              notices.map((notice, index) => (
                <tr 
                  key={notice._id} 
                  className="hover:bg-gradient-to-r hover:from-rose-50 hover:via-pink-50 hover:to-fuchsia-50 dark:hover:from-rose-900/20 dark:hover:via-pink-900/20 dark:hover:to-fuchsia-900/20 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-md animate-fadeIn"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-3 sm:px-6 py-4 font-medium text-gray-900 dark:text-white">{notice.title}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap capitalize text-gray-900 dark:text-white">{notice.category}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        notice.priority === 'urgent'
                          ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          : notice.priority === 'important'
                            ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                            : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      }`}
                    >
                      {notice.priority}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                    {notice.scheduleStartDate 
                      ? formatDate(notice.scheduleStartDate) 
                      : notice.publishDate
                      ? formatDate(notice.publishDate)
                      : '-'}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                    {notice.expiryDate 
                      ? formatDate(notice.expiryDate) 
                      : '-'}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        notice.status === 'PUBLISHED'
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : notice.status === 'DRAFT'
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                          : notice.status === 'EXPIRED'
                          ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {notice.status || 'DRAFT'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleEdit(notice)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(notice._id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>
      </div>
    </FeatureGuard>
  );
}
