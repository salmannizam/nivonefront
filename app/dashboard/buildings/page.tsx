'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import FilterPanel from '@/components/FilterPanel';
import FeatureGuard from '@/components/FeatureGuard';
import { showSuccess, showError, confirmAction, logError } from '@/lib/utils';

interface Building {
  _id: string;
  name: string;
  address: string;
  floors: number;
  totalRooms: number;
  createdAt: string;
}

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Building | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    floors: 1,
  });

  useEffect(() => {
    loadBuildings();
  }, [filters]);

  const loadBuildings = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);

      const response = await api.get(`/buildings?${queryParams.toString()}`);
      setBuildings(response.data);
    } catch (error) {
      logError(error, 'Failed to load buildings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.name || formData.name.trim() === '') {
      showError(null, 'Building name is required');
      return;
    }
    if (!formData.address || formData.address.trim() === '') {
      showError(null, 'Building address is required');
      return;
    }
    if (formData.floors < 1) {
      showError(null, 'Number of floors must be at least 1');
      return;
    }

    try {
      if (editing) {
        await api.patch(`/buildings/${editing._id}`, formData);
        showSuccess('Building updated successfully');
      } else {
        await api.post('/buildings', formData);
        showSuccess('Building created successfully');
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ name: '', address: '', floors: 1 });
      loadBuildings();
    } catch (error: any) {
      showError(error, 'Unable to save building. Please check all fields and try again.');
    }
  };

  const handleEdit = (building: Building) => {
    setEditing(building);
    setFormData({
      name: building.name,
      address: building.address,
      floors: building.floors,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const building = buildings.find((b) => b._id === id);
    const confirmed = await confirmAction(
      'Delete this building?',
      building
        ? `This will permanently delete "${building.name}" and all associated rooms and beds. This action cannot be undone.`
        : 'This action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      await api.delete(`/buildings/${id}`);
      showSuccess('Building deleted successfully');
      loadBuildings();
    } catch (error: any) {
      showError(error, 'Unable to delete building. It may have associated rooms or beds.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400 text-lg">Loading buildings...</div>
        </div>
      </div>
    );
  }

  const filterConfig = {
    search: {
      type: 'text' as const,
      label: 'Search',
      placeholder: 'Search by name or address',
      advanced: false,
    },
  };

  return (
    <FeatureGuard feature="buildings">
      <div className="animate-fadeIn">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-slideInLeft">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Buildings
          </h1>
          <button
            onClick={() => {
              setShowForm(true);
              setEditing(null);
              setFormData({ name: '', address: '', floors: 1 });
            }}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-500 dark:via-indigo-500 dark:to-purple-500 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:via-indigo-600 dark:hover:to-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold"
          >
            + Add Building
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
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-800 dark:via-blue-900/20 dark:to-indigo-900/20 p-4 sm:p-6 rounded-2xl shadow-xl border-2 border-blue-100 dark:border-blue-900/30 mb-6 animate-slideInUp">
          <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
            <span className="text-xl">🏢</span>
            {editing ? 'Edit Building' : 'Add New Building'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="transform transition-all hover:scale-105">
              <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                Building Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.trim() })}
                placeholder="e.g., Main Building, Block A"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-md hover:shadow-lg"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter a unique name to identify this building
              </p>
            </div>
            <div className="transform transition-all hover:scale-105">
              <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter the complete address of the building"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-md hover:shadow-lg"
                rows={3}
              />
            </div>
            <div className="transform transition-all hover:scale-105">
              <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                Number of Floors <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.floors || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, floors: value === '' ? 1 : parseInt(value) || 1 });
                }}
                placeholder="Enter number of floors"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-md hover:shadow-lg"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Total number of floors in this building
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-500 dark:via-indigo-500 dark:to-purple-500 text-white rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:via-indigo-600 dark:hover:to-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold"
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

      <div className="bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-gray-800 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl shadow-xl border-2 border-indigo-100 dark:border-indigo-900/30 overflow-hidden animate-slideInUp">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Name
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Address
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Floors
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Total Rooms
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {buildings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-lg font-bold">
                  No buildings found
                </td>
              </tr>
            ) : (
              buildings.map((building, index) => (
                <tr 
                  key={building._id} 
                  className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-900/10 dark:hover:to-indigo-900/10 transition-all animate-slideInUp"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">{building.name}</td>
                  <td className="px-3 sm:px-6 py-4 text-gray-700 dark:text-gray-300">{building.address}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                      {building.floors}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-lg text-gray-900 dark:text-white">
                      {building.totalRooms || 0}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleEdit(building)}
                        className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 transition-all shadow-md hover:shadow-lg font-bold transform hover:scale-105"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(building._id)}
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
