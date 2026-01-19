'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import FilterPanel from '@/components/FilterPanel';
import FeatureGuard from '@/components/FeatureGuard';
import { useI18n } from '@/lib/i18n-context';
import { logError, formatDate, showSuccess, showError } from '@/lib/utils';

interface Asset {
  _id: string;
  name: string;
  category?: string;
  roomId?: string;
  roomNumber?: string;
  location?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  status: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  notes?: string;
}

interface Room {
  _id: string;
  roomNumber: string;
}

export default function AssetsPage() {
  const { t } = useI18n();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    roomId: '',
    location: '',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    warrantyExpiry: '',
    status: 'WORKING',
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.roomId) queryParams.append('roomId', filters.roomId);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.location) queryParams.append('location', filters.location);
      if (filters.search) queryParams.append('search', filters.search);

      const [assetsRes, roomsRes] = await Promise.all([
        api.get(`/assets?${queryParams.toString()}`),
        api.get('/rooms'),
      ]);
      setAssets(assetsRes.data);
      setRooms(roomsRes.data);
    } catch (error) {
      logError(error, 'Failed to load assets data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate).toISOString() : undefined,
        warrantyExpiry: formData.warrantyExpiry ? new Date(formData.warrantyExpiry).toISOString() : undefined,
        lastMaintenanceDate: formData.lastMaintenanceDate
          ? new Date(formData.lastMaintenanceDate).toISOString()
          : undefined,
        nextMaintenanceDate: formData.nextMaintenanceDate
          ? new Date(formData.nextMaintenanceDate).toISOString()
          : undefined,
        roomId: formData.roomId || undefined,
      };
      if (editing) {
        await api.patch(`/assets/${editing._id}`, dataToSend);
      } else {
        await api.post('/assets', dataToSend);
      }
      setShowForm(false);
      setEditing(null);
      setFormData({
        name: '',
        category: '',
        roomId: '',
        location: '',
        brand: '',
        model: '',
        serialNumber: '',
        purchaseDate: '',
        warrantyExpiry: '',
        status: 'WORKING',
        lastMaintenanceDate: '',
        nextMaintenanceDate: '',
        notes: '',
      });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save asset');
    }
  };

  const handleEdit = (asset: Asset) => {
    setEditing(asset);
    setFormData({
      name: asset.name,
      category: asset.category || '',
      roomId: asset.roomId || '',
      location: asset.location || '',
      brand: asset.brand || '',
      model: asset.model || '',
      serialNumber: asset.serialNumber || '',
      purchaseDate: asset.purchaseDate
        ? new Date(asset.purchaseDate).toISOString().split('T')[0]
        : '',
      warrantyExpiry: asset.warrantyExpiry
        ? new Date(asset.warrantyExpiry).toISOString().split('T')[0]
        : '',
      status: asset.status,
      lastMaintenanceDate: asset.lastMaintenanceDate
        ? new Date(asset.lastMaintenanceDate).toISOString().split('T')[0]
        : '',
      nextMaintenanceDate: asset.nextMaintenanceDate
        ? new Date(asset.nextMaintenanceDate).toISOString().split('T')[0]
        : '',
      notes: asset.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
      await api.delete(`/assets/${id}`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete asset');
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-violet-600 border-t-transparent mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400 text-lg">{t('common.labels.loading')}</div>
        </div>
      </div>
    );
  }

  const filterConfig = {
    search: {
      type: 'text' as const,
      label: t('common.buttons.search'),
      placeholder: t('pages.assets.searchByAsset'),
      advanced: false,
    },
    status: {
      type: 'select' as const,
      label: t('common.labels.status'),
      options: [
        { label: t('common.labels.all'), value: '' },
        { label: t('pages.assets.working'), value: 'WORKING' },
        { label: t('pages.assets.maintenance'), value: 'MAINTENANCE' },
        { label: t('pages.assets.broken'), value: 'BROKEN' },
        { label: t('pages.assets.retired'), value: 'RETIRED' },
      ],
      advanced: false,
    },
    category: {
      type: 'select' as const,
      label: t('pages.assets.category'),
      options: [
        { label: t('pages.assets.allCategories'), value: '' },
        { label: t('pages.assets.ac'), value: 'AC' },
        { label: t('pages.assets.geyser'), value: 'GEYSER' },
        { label: t('pages.assets.ro'), value: 'RO' },
        { label: t('pages.assets.fan'), value: 'FAN' },
        { label: t('pages.assets.light'), value: 'LIGHT' },
        { label: t('pages.assets.other'), value: 'OTHER' },
      ],
      advanced: false,
    },
    roomId: {
      type: 'select' as const,
      label: t('common.labels.room'),
      options: [
        { label: t('pages.assets.allRooms'), value: '' },
        ...rooms.map((r) => ({ label: r.roomNumber, value: r._id })),
      ],
      advanced: true,
    },
    location: {
      type: 'text' as const,
      label: t('pages.assets.location'),
      placeholder: t('pages.assets.filterByLocation'),
      advanced: true,
    },
  };

  return (
    <FeatureGuard feature="assets">
      <div className="animate-fadeIn">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-slideInLeft">
          <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 dark:from-violet-400 dark:via-purple-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
            {t('pages.assets.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 font-medium">
            {t('pages.assets.total')}: <span className="font-bold text-gray-900 dark:text-white">{assets.length}</span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/export/assets`}
            download
            className="w-full sm:w-auto bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-500 dark:via-emerald-500 dark:to-teal-500 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 dark:hover:from-green-600 dark:hover:via-emerald-600 dark:hover:to-teal-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold text-center"
          >
            📥 {t('pages.assets.exportCSV')}
          </a>
          <button
            onClick={() => {
              setShowForm(true);
              setEditing(null);
              setFormData({
                name: '',
                category: '',
                roomId: '',
                location: '',
                brand: '',
                model: '',
                serialNumber: '',
                purchaseDate: '',
                warrantyExpiry: '',
                status: 'WORKING',
                lastMaintenanceDate: '',
                nextMaintenanceDate: '',
                notes: '',
              });
            }}
            className="w-full sm:w-auto bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 dark:from-violet-500 dark:via-purple-500 dark:to-fuchsia-500 text-white px-6 py-3 rounded-xl hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 dark:hover:from-violet-600 dark:hover:via-purple-600 dark:hover:to-fuchsia-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold"
          >
            + {t('pages.assets.addAsset')}
          </button>
        </div>
      </div>

      <FilterPanel
        filters={filterConfig}
        filterValues={filters}
        onFilterChange={setFilters}
        onReset={() => setFilters({})}
        showAdvanced={true}
      />

      {showForm && (
        <div className="bg-gradient-to-br from-white via-violet-50/30 to-purple-50/30 dark:from-gray-800 dark:via-violet-900/20 dark:to-purple-900/20 p-4 sm:p-6 rounded-2xl shadow-xl border-2 border-violet-100 dark:border-violet-900/30 mb-6 animate-slideInUp">
          <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
            <span className="text-xl">📦</span>
            {editing ? t('pages.assets.editAsset') : t('pages.assets.addAsset')}
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
                  placeholder={t('pages.assets.namePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('pages.assets.category')}</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder={t('pages.assets.categoryPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('common.labels.room')} (Optional)</label>
                <select
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('forms.placeholders.select')}</option>
                  {rooms.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.roomNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('pages.assets.location')} (Optional)</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Common area, Lobby, etc."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('pages.assets.brand')}</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('pages.assets.model')}</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('pages.assets.serialNumber')}</label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('pages.assets.purchaseDate')}</label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('pages.assets.warrantyExpiry')}</label>
                <input
                  type="date"
                  value={formData.warrantyExpiry}
                  onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('common.labels.status')}</label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="WORKING">{t('pages.assets.working')}</option>
                  <option value="REPAIR">{t('pages.assets.repair')}</option>
                  <option value="REPLACED">{t('pages.assets.replaced')}</option>
                  <option value="DISPOSED">{t('pages.assets.disposed')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('pages.assets.nextMaintenanceDate')}</label>
                <input
                  type="date"
                  value={formData.nextMaintenanceDate}
                  onChange={(e) => setFormData({ ...formData, nextMaintenanceDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('common.labels.notes')}</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
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

      <div className="bg-gradient-to-br from-white via-violet-50/30 to-purple-50/30 dark:from-gray-800 dark:via-violet-900/20 dark:to-purple-900/20 rounded-2xl shadow-xl border-2 border-violet-100 dark:border-violet-900/30 overflow-hidden animate-slideInUp">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-900/30 dark:via-purple-900/30 dark:to-fuchsia-900/30">
              <tr>
                <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                  Brand/Model
                </th>
                <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                  Next Maintenance
                </th>
                <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gradient-to-b from-white via-violet-50/10 to-purple-50/10 dark:from-gray-800 dark:via-violet-900/5 dark:to-purple-900/5 divide-y divide-violet-100 dark:divide-violet-800/30">
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 sm:px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No assets found
                  </td>
                </tr>
              ) : (
                assets.map((asset, index) => (
                  <tr 
                    key={asset._id} 
                    className="hover:bg-gradient-to-r hover:from-violet-50 hover:via-purple-50 hover:to-fuchsia-50 dark:hover:from-violet-900/20 dark:hover:via-purple-900/20 dark:hover:to-fuchsia-900/20 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-md animate-fadeIn"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {asset.name}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                      {asset.roomNumber || asset.location || '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                      {asset.brand || '-'} {asset.model ? `/${asset.model}` : ''}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          asset.status === 'WORKING'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : asset.status === 'REPAIR'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}
                      >
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                      {asset.nextMaintenanceDate
                        ? formatDate(asset.nextMaintenanceDate)
                        : '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(asset)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(asset._id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
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
