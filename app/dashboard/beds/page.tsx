'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import FilterPanel from '@/components/FilterPanel';
import FeatureGuard from '@/components/FeatureGuard';
import { logError } from '@/lib/utils';
import { showSuccess, showError, confirmAction } from '@/lib/utils';

interface Bed {
  _id: string;
  roomId: string;
  roomNumber?: string;
  bedNumber: string;
  rent: number;
  status: string;
  notes?: string;
}

interface Room {
  _id: string;
  roomNumber: string;
}

export default function BedsPage() {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Bed | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [formData, setFormData] = useState({
    roomId: '',
    bedNumber: '',
    rent: 0,
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
      if (filters.buildingId) queryParams.append('buildingId', filters.buildingId);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.rentRange?.min) queryParams.append('rentMin', filters.rentRange.min.toString());
      if (filters.rentRange?.max) queryParams.append('rentMax', filters.rentRange.max.toString());

      const [bedsRes, roomsRes, buildingsRes] = await Promise.all([
        api.get(`/beds?${queryParams.toString()}`),
        api.get('/rooms'),
        api.get('/buildings'),
      ]);
      setBeds(bedsRes.data);
      setRooms(roomsRes.data);
      setBuildings(buildingsRes.data);
    } catch (error) {
      logError(error, 'Failed to load beds data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.roomId) {
      showError(null, 'Please select a room');
      return;
    }
    if (!formData.bedNumber || formData.bedNumber.trim() === '') {
      showError(null, 'Bed number is required');
      return;
    }
    if (formData.rent < 0) {
      showError(null, 'Monthly rent cannot be negative');
      return;
    }

    try {
      if (editing) {
        await api.patch(`/beds/${editing._id}`, formData);
        showSuccess('Bed updated successfully');
      } else {
        await api.post('/beds', formData);
        showSuccess('Bed created successfully');
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ roomId: '', bedNumber: '', rent: 0, notes: '' });
      loadData();
    } catch (error: any) {
      showError(error, 'Unable to save bed. Please check all fields and try again.');
    }
  };

  const handleEdit = (bed: Bed) => {
    setEditing(bed);
    setFormData({
      roomId: bed.roomId,
      bedNumber: bed.bedNumber,
      rent: bed.rent,
      notes: bed.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const bed = beds.find((b) => b._id === id);
    const confirmed = await confirmAction(
      'Delete this bed?',
      bed
        ? `This will permanently delete bed ${bed.bedNumber} in room ${bed.roomNumber}. This action cannot be undone.`
        : 'This action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      await api.delete(`/beds/${id}`);
      showSuccess('Bed deleted successfully');
      loadData();
    } catch (error: any) {
      showError(error, 'Unable to delete bed. It may be assigned to a resident.');
    }
  };

  const filterConfig = {
    search: {
      type: 'text' as const,
      label: 'Search',
      placeholder: 'Search by bed number',
      advanced: false,
    },
    status: {
      type: 'select' as const,
      label: 'Status',
      options: [
        { label: 'All', value: '' },
        { label: 'Available', value: 'AVAILABLE' },
        { label: 'Occupied', value: 'OCCUPIED' },
        { label: 'Maintenance', value: 'MAINTENANCE' },
      ],
      advanced: false,
    },
    roomId: {
      type: 'select' as const,
      label: 'Room',
      options: [
        { label: 'All Rooms', value: '' },
        ...rooms.map((r) => ({ label: r.roomNumber, value: r._id })),
      ],
      advanced: false,
    },
    buildingId: {
      type: 'select' as const,
      label: 'Building',
      options: [
        { label: 'All Buildings', value: '' },
        ...buildings.map((b) => ({ label: b.name, value: b._id })),
      ],
      advanced: true,
    },
    rentRange: {
      type: 'numberRange' as const,
      label: 'Monthly Rent Range (₹)',
      advanced: true,
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400 text-lg">Loading beds...</div>
        </div>
      </div>
    );
  }

  return (
    <FeatureGuard feature="beds">
      <div className="animate-fadeIn">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-slideInLeft">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 dark:from-purple-400 dark:via-pink-400 dark:to-rose-400 bg-clip-text text-transparent">
            Beds
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 font-medium">
            Total: <span className="font-bold text-gray-900 dark:text-white">{beds.length}</span> | Available: <span className="font-bold text-green-600 dark:text-green-400">{beds.filter((b) => b.status === 'AVAILABLE').length}</span> | Occupied:{' '}
            <span className="font-bold text-blue-600 dark:text-blue-400">{beds.filter((b) => b.status === 'OCCUPIED').length}</span>
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
            setFormData({ roomId: '', bedNumber: '', rent: 0, notes: '' });
          }}
          className="w-full sm:w-auto bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 dark:from-purple-500 dark:via-pink-500 dark:to-rose-500 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 dark:hover:from-purple-600 dark:hover:via-pink-600 dark:hover:to-rose-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold"
        >
          + Add Bed
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
        <div className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-pink-900/20 p-4 sm:p-6 rounded-2xl shadow-xl border-2 border-purple-100 dark:border-purple-900/30 mb-6 animate-slideInUp">
          <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
            <span className="text-xl">🛏️</span>
            {editing ? 'Edit Bed' : 'Add New Bed'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="transform transition-all hover:scale-105">
              <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                Room <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.roomId}
                onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-md hover:shadow-lg"
              >
                <option value="">Select a room</option>
                {rooms.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.roomNumber}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Select the room where this bed is located
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="transform transition-all hover:scale-105">
                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                  Bed Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.bedNumber}
                  onChange={(e) => setFormData({ ...formData, bedNumber: e.target.value.trim() })}
                  placeholder="e.g., 1, 2, A, B"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-md hover:shadow-lg"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Unique identifier for this bed within the room
                </p>
              </div>
              <div className="transform transition-all hover:scale-105">
                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                  Monthly Rent (per bed) (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.rent || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                    setFormData({
                      ...formData,
                      rent: value,
                    });
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-green-500/50 focus:border-green-500 transition-all shadow-md hover:shadow-lg"
                  placeholder="Enter monthly rent amount"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <strong>Source of truth for billing.</strong> This amount is used to generate monthly rent payments. If not provided, will use the room's default bed rent as a fallback.
                </p>
              </div>
            </div>
            <div className="transform transition-all hover:scale-105">
              <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                Notes <span className="text-gray-500 text-xs font-normal">(Optional)</span>
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any additional notes about this bed..."
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-md hover:shadow-lg"
                rows={3}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 dark:from-purple-500 dark:via-pink-500 dark:to-rose-500 text-white rounded-xl hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 dark:hover:from-purple-600 dark:hover:via-pink-600 dark:hover:to-rose-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold"
              >
                {editing ? '✨ Update' : '✨ Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-bold transform hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 dark:from-gray-800 dark:via-purple-900/20 dark:to-pink-900/20 rounded-2xl shadow-xl border-2 border-purple-100 dark:border-purple-900/30 overflow-hidden animate-slideInUp">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-rose-900/30">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Bed Number
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Rent
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {beds.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 sm:px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center animate-fadeIn">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center mb-3">
                        <span className="text-3xl">🛏️</span>
                      </div>
                      <p className="text-lg font-bold">No beds found</p>
                      <p className="text-sm mt-1">Create your first bed to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                beds.map((bed, index) => (
                  <tr 
                    key={bed._id} 
                    className="hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 dark:hover:from-purple-900/10 dark:hover:to-pink-900/10 transition-all animate-slideInUp"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">
                      {bed.roomNumber || 'N/A'}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">
                      {bed.bedNumber}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                        ₹{bed.rent.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                          bed.status === 'AVAILABLE'
                            ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md animate-pulse-slow'
                            : bed.status === 'OCCUPIED'
                              ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-md'
                              : 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-md'
                        }`}
                      >
                        {bed.status === 'AVAILABLE' ? '✓ Available' : bed.status === 'OCCUPIED' ? '👤 Occupied' : '🔧 Maintenance'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleEdit(bed)}
                          className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 transition-all shadow-md hover:shadow-lg font-bold transform hover:scale-105"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(bed._id)}
                          className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-500 dark:to-rose-500 text-white rounded-lg hover:from-red-700 hover:to-rose-700 dark:hover:from-red-600 dark:hover:to-rose-600 transition-all shadow-md hover:shadow-lg font-bold transform hover:scale-105"
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
