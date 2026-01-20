'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import FilterPanel from '@/components/FilterPanel';
import FeatureGuard from '@/components/FeatureGuard';
import TagSelector from '@/components/TagSelector';
import { SkeletonCard, SkeletonTableRow } from '@/components/skeletons';
import { useI18n } from '@/lib/i18n-context';
import toast from '@/components/Toast';
import { useUndo } from '@/lib/undo-context';
import { logError, showSuccess, showError, confirmAction } from '@/lib/utils';

interface Room {
  _id: string;
  buildingId: string;
  buildingName?: string;
  floor: number;
  roomNumber: string;
  capacity: number;
  occupied: number;
  isAvailable: boolean;
  defaultBedRent?: number; // Template only, not used for billing
  amenities: string[];
  tags?: string[];
}

interface Building {
  _id: string;
  name: string;
}

export default function RoomsPage() {
  const { t } = useI18n();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [formData, setFormData] = useState({
    buildingId: '',
    floor: 1,
    roomNumber: '',
    capacity: 1,
    defaultBedRent: undefined as number | undefined,
    amenities: [] as string[],
    tags: [] as string[],
  });
  const { scheduleUndoableAction, undo } = useUndo();

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.buildingId) queryParams.append('buildingId', filters.buildingId);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.capacityRange?.min) queryParams.append('capacityMin', filters.capacityRange.min.toString());
      if (filters.capacityRange?.max) queryParams.append('capacityMax', filters.capacityRange.max.toString());
      if (filters.occupiedRange?.min) queryParams.append('occupiedMin', filters.occupiedRange.min.toString());
      if (filters.occupiedRange?.max) queryParams.append('occupiedMax', filters.occupiedRange.max.toString());

      const [roomsRes, buildingsRes] = await Promise.all([
        api.get(`/rooms?${queryParams.toString()}`),
        api.get('/buildings'),
      ]);
      setRooms(roomsRes.data);
      setBuildings(buildingsRes.data);
    } catch (error) {
      logError(error, 'Failed to load rooms data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.patch(`/rooms/${editing._id}`, formData);
        showSuccess(t('pages.rooms.updatedSuccess'));
      } else {
        await api.post('/rooms', formData);
        showSuccess(t('pages.rooms.createdSuccess'));
      }
      setShowForm(false);
      setEditing(null);
      setFormData({
        buildingId: '',
        floor: 1,
        roomNumber: '',
        capacity: 1,
        defaultBedRent: undefined,
        amenities: [],
        tags: [],
      });
      loadData();
    } catch (error: any) {
      showError(error, error.response?.data?.message || t('common.messages.saveError'));
    }
  };

  const handleEdit = (room: Room) => {
    setEditing(room);
    setFormData({
      buildingId: room.buildingId,
      floor: room.floor,
      roomNumber: room.roomNumber,
      tags: room.tags || [],
      capacity: room.capacity,
      defaultBedRent: room.defaultBedRent,
      amenities: room.amenities || [],
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmAction(
      t('pages.rooms.deleteConfirm'),
      t('common.messages.actionCannotUndo'),
    );
    if (!confirmed) return;

    setRooms((prev) => prev.filter((room) => room._id !== id));

    scheduleUndoableAction(`room-${id}`, async () => {
      try {
        await api.delete(`/rooms/${id}`);
      } catch (error: any) {
        showError(error, error.response?.data?.message || t('common.messages.deleteError'));
      } finally {
        loadData();
      }
    });

    toast.success(t('pages.rooms.deletedSuccess'), {
      actionLabel: t('common.buttons.undo'),
      onAction: () => {
        undo();
        loadData();
      },
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard lines={2} className="h-24" />
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/50 shadow-inner">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonTableRow key={index} columns={8} className="px-4" />
          ))}
        </div>
      </div>
    );
  }

  const filterConfig = {
    search: {
      type: 'text' as const,
      label: t('common.buttons.search'),
      placeholder: t('forms.placeholders.search'),
      advanced: false,
    },
    buildingId: {
      type: 'select' as const,
      label: t('pages.rooms.building'),
      options: [
        { label: t('common.labels.all'), value: '' },
        ...buildings.map((b) => ({ label: b.name, value: b._id })),
      ],
      advanced: false,
    },
    capacityRange: {
      type: 'numberRange' as const,
      label: t('pages.rooms.capacity'),
      advanced: true,
    },
    occupiedRange: {
      type: 'numberRange' as const,
      label: t('pages.rooms.occupied'),
      advanced: true,
    },
  };

  return (
    <FeatureGuard feature="rooms">
      <div className="animate-fadeIn">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-slideInLeft">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-400 dark:via-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
            {t('pages.rooms.title')}
          </h1>
          <button
            onClick={() => {
              setShowForm(true);
              setEditing(null);
              setFormData({
                buildingId: buildings[0]?._id || '',
                floor: 1,
                roomNumber: '',
                capacity: 1,
                defaultBedRent: 0,
                amenities: [],
                tags: [],
              });
            }}
            className="w-full sm:w-auto bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-500 dark:via-emerald-500 dark:to-teal-500 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 dark:hover:from-green-600 dark:hover:via-emerald-600 dark:hover:to-teal-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold"
          >
            + {t('pages.rooms.addRoom')}
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
        <div className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 dark:from-gray-800 dark:via-green-900/20 dark:to-emerald-900/20 p-4 sm:p-6 rounded-2xl shadow-xl border-2 border-green-100 dark:border-green-900/30 mb-6 animate-slideInUp">
          <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent flex items-center gap-2">
            <span className="text-xl">🏠</span>
            {editing ? t('pages.rooms.editRoom') : t('pages.rooms.addRoom')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="transform transition-all hover:scale-105">
              <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Building</label>
              <select
                required
                value={formData.buildingId}
                onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-green-500/50 focus:border-green-500 transition-all shadow-md hover:shadow-lg"
              >
                <option value="">{t('pages.rooms.selectBuilding')}</option>
                {buildings.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="transform transition-all hover:scale-105">
                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Floor</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.floor || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, floor: value === '' ? 1 : parseInt(value) || 1 });
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-md hover:shadow-lg"
                />
              </div>
              <div className="transform transition-all hover:scale-105">
                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">{t('pages.rooms.roomNumber')}</label>
                <input
                  type="text"
                  required
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-md hover:shadow-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="transform transition-all hover:scale-105">
                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">{t('pages.rooms.capacity')}</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.capacity || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, capacity: value === '' ? 1 : parseInt(value) || 1 });
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-md hover:shadow-lg"
                />
              </div>
              <div className="transform transition-all hover:scale-105">
                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                  {t('pages.rooms.defaultBedRent')} <span className="text-gray-500 text-xs font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.defaultBedRent || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, defaultBedRent: value === '' ? undefined : parseFloat(value) || undefined });
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-pink-500/50 focus:border-pink-500 transition-all shadow-md hover:shadow-lg"
                  placeholder="Used only when creating beds"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <strong>Template only, not used for billing.</strong> This value is used as a default suggestion when creating new beds. Billing is always based on the individual bed's rent amount.
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">{t('pages.rooms.tags')}</label>
              <TagSelector
                tags={formData.tags}
                onChange={(tags) => setFormData({ ...formData, tags })}
                placeholder={t('forms.placeholders.search')}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-500 dark:via-emerald-500 dark:to-teal-500 text-white rounded-xl hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 dark:hover:from-green-600 dark:hover:via-emerald-600 dark:hover:to-teal-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold"
              >
                {editing ? `✨ ${t('common.buttons.update')}` : `✨ ${t('common.buttons.create')}`}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-bold transform hover:scale-105"
              >
                {t('common.buttons.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 dark:from-gray-800 dark:via-green-900/20 dark:to-emerald-900/20 rounded-2xl shadow-xl border-2 border-green-100 dark:border-green-900/30 overflow-hidden animate-slideInUp">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/30 dark:via-emerald-900/30 dark:to-teal-900/30">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('pages.rooms.building')}
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('pages.rooms.roomNumber')}
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('pages.rooms.floor')}
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('pages.rooms.capacity')}
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('pages.rooms.occupied')}
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('pages.rooms.defaultBedRent')}
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('common.labels.status')}
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('common.labels.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-lg font-bold">
                    {t('pages.rooms.noRooms')}
                </td>
              </tr>
            ) : (
              rooms.map((room, index) => (
                <tr 
                  key={room._id} 
                  className="hover:bg-gradient-to-r hover:from-green-50/50 hover:to-emerald-50/50 dark:hover:from-green-900/10 dark:hover:to-emerald-900/10 transition-all animate-slideInUp"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">{room.buildingName || 'N/A'}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">
                    {room.roomNumber}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                      {room.floor}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">{room.capacity}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">{room.occupied || 0}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    {room.defaultBedRent ? (
                      <span className="font-bold text-green-600 dark:text-green-400">₹{room.defaultBedRent}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                        room.isAvailable
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md animate-pulse-slow'
                          : 'bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-md'
                      }`}
                    >
                      {room.isAvailable ? `✓ ${t('pages.rooms.available')}` : t('pages.rooms.full')}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleEdit(room)}
                        className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 transition-all shadow-md hover:shadow-lg font-bold transform hover:scale-105"
                      >
                          {t('common.buttons.edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(room._id)}
                          className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-500 dark:to-rose-500 text-white rounded-lg hover:from-red-700 hover:to-rose-700 dark:hover:from-red-600 dark:hover:to-rose-600 transition-all shadow-md hover:shadow-lg font-bold transform hover:scale-105"
                        >
                          {t('common.buttons.delete')}
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
