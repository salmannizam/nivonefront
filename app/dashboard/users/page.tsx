'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useFeatures } from '@/lib/feature-context';
import FilterPanel from '@/components/FilterPanel';
import FeatureGuard from '@/components/FeatureGuard';
import { useI18n } from '@/lib/i18n-context';
import { logError, showSuccess, showError, confirmAction } from '@/lib/utils';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { isFeatureEnabled, loading: featuresLoading } = useFeatures();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'STAFF',
  });

  useEffect(() => {
    // Only OWNER and MANAGER can access this page
    if (user && user.role !== 'OWNER' && user.role !== 'MANAGER') {
      router.push('/dashboard');
      return;
    }
    
    // Only load users if feature is enabled and features have finished loading
    if (!featuresLoading && isFeatureEnabled('userManagement')) {
      loadUsers();
    } else if (!featuresLoading && !isFeatureEnabled('userManagement')) {
      // Feature not enabled, stop loading state
      setLoading(false);
    }
  }, [user, router, filters, featuresLoading, isFeatureEnabled]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await api.get(`/users?${queryParams.toString()}`);
      setUsers(response.data);
    } catch (error: any) {
      // Don't log feature-blocked errors as failures - they're expected
      if (!error?.isFeatureBlocked) {
        logError(error, 'Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        const updateData: any = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await api.patch(`/users/${editing._id}`, updateData);
      } else {
        await api.post('/users', formData);
      }
      setShowForm(false);
      setEditing(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'STAFF',
      });
      loadUsers();
      showSuccess(editing ? t('pages.users.updatedSuccess') : t('pages.users.createdSuccess'));
    } catch (error: any) {
      showError(error, error.response?.data?.message || t('common.messages.saveError'));
    }
  };

  const handleEdit = (userItem: User) => {
    setEditing(userItem);
    setFormData({
      name: userItem.name,
      email: userItem.email,
      phone: userItem.phone || '',
      password: '',
      role: userItem.role,
    });
    setShowForm(true);
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    // Prevent users from deactivating themselves
    if (user && user.id === id) {
      showError(null, t('pages.users.cannotDeactivateSelf'));
      return;
    }
    
    try {
      await api.patch(`/users/${id}`, { isActive: !isActive });
      showSuccess(isActive ? t('pages.users.deactivatedSuccess') : t('pages.users.activatedSuccess'));
      loadUsers();
    } catch (error: any) {
      showError(error, error.response?.data?.message || t('common.messages.saveError'));
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmAction(
      t('pages.users.deleteConfirm'),
      t('common.messages.actionCannotUndo')
    );
    if (!confirmed) return;
    try {
      await api.delete(`/users/${id}`);
      showSuccess(t('pages.users.deletedSuccess'));
      loadUsers();
    } catch (error: any) {
      showError(error, error.response?.data?.message || t('common.messages.deleteError'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600 dark:text-gray-400">{t('common.labels.loading')}</div>
      </div>
    );
  }

  // Check if user has permission
  if (user && user.role !== 'OWNER' && user.role !== 'MANAGER') {
    return null;
  }

  const filterConfig = {
    search: {
      type: 'text' as const,
      label: t('common.buttons.search'),
      placeholder: t('pages.users.searchByUser'),
      advanced: false,
    },
    role: {
      type: 'select' as const,
      label: t('pages.users.role'),
      options: [
        { label: t('pages.users.allRoles'), value: '' },
        { label: t('pages.users.owner'), value: 'OWNER' },
        { label: t('pages.users.manager'), value: 'MANAGER' },
        { label: t('pages.users.staff'), value: 'STAFF' },
      ],
      advanced: false,
    },
  };

  return (
    <FeatureGuard feature="userManagement">
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('pages.users.title')}</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
            setFormData({
              name: '',
              email: '',
              phone: '',
              password: '',
              role: 'STAFF',
            });
          }}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
        >
          + {t('pages.users.addUser')}
        </button>
      </div>

      <FilterPanel
        filters={filterConfig}
        filterValues={filters}
        onFilterChange={setFilters}
        onReset={() => setFilters({})}
        showAdvanced={false}
      />

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {editing ? t('pages.users.editUser') : t('pages.users.addUser')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('common.labels.name')}</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('common.labels.email')}</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!!editing}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('common.labels.phone')}</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('pages.users.role')}</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  disabled={!!(editing && (user?.role !== 'OWNER' || editing._id === user?.id))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="STAFF">{t('pages.users.staff')}</option>
                  <option value="MANAGER">{t('pages.users.manager')}</option>
                  {user?.role === 'OWNER' && <option value="OWNER">{t('pages.users.owner')}</option>}
                </select>
                {editing && user?.role !== 'OWNER' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('pages.users.onlyOwnerCanChangeRoles')}
                  </p>
                )}
                {editing && editing._id === user?.id && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {t('pages.users.cannotChangeOwnRole')}
                  </p>
                )}
              </div>
            </div>
            {!editing && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('common.labels.password')}</label>
                <input
                  type="password"
                  required={!editing}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            {editing && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('pages.users.newPassword')} (Optional)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder={t('pages.users.passwordPlaceholder')}
                />
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
              >
                {editing ? t('common.buttons.update') : t('common.buttons.create')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {t('common.buttons.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {t('common.labels.name')}
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {t('common.labels.email')}
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {t('common.labels.phone')}
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {t('pages.users.role')}
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {t('common.labels.status')}
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {t('common.labels.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  {t('pages.users.noUsers')}
                </td>
              </tr>
            ) : (
              users.map((userItem) => (
                <tr key={userItem._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{userItem.name}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{userItem.email}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{userItem.phone || '-'}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {userItem.role}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    {userItem.role === 'OWNER' && user?.role !== 'OWNER' ? (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        userItem.isActive
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {userItem.isActive ? t('common.labels.active') : t('common.labels.inactive')}
                      </span>
                    ) : userItem._id === user?.id ? (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        userItem.isActive
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {userItem.isActive ? t('common.labels.active') : t('common.labels.inactive')}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleToggleActive(userItem._id, userItem.isActive)}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          userItem.isActive
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {userItem.isActive ? t('common.labels.active') : t('common.labels.inactive')}
                      </button>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-2">
                      {userItem.role === 'OWNER' && user?.role !== 'OWNER' ? (
                        <span className="text-gray-400 dark:text-gray-500 text-xs">{t('pages.users.onlyOwnerCanEdit')}</span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(userItem)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          >
                            {t('common.buttons.edit')}
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/users/${userItem._id}/permissions`)}
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300"
                          >
                            {t('pages.users.permissions')}
                          </button>
                          {userItem._id !== user?.id && user?.role === 'OWNER' && (
                            <button
                              onClick={() => handleDelete(userItem._id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                            >
                              {t('common.buttons.delete')}
                            </button>
                          )}
                        </>
                      )}
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
