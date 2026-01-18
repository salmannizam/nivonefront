'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import FilterPanel from '@/components/FilterPanel';
import FeatureGuard from '@/components/FeatureGuard';
import { logError, formatDateTime } from '@/lib/utils';

interface GatePass {
  _id: string;
  residentId: string;
  residentName?: string;
  exitTime: string;
  expectedReturnTime?: string;
  actualReturnTime?: string;
  purpose?: string;
  destination?: string;
  contactPerson?: string;
  contactPhone?: string;
  status: string;
  notes?: string;
}

interface Resident {
  _id: string;
  name: string;
  status?: string;
}

export default function GatePassesPage() {
  const [gatePasses, setGatePasses] = useState<GatePass[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GatePass | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [formData, setFormData] = useState({
    residentId: '',
    exitTime: new Date().toISOString().slice(0, 16),
    expectedReturnTime: '',
    purpose: '',
    destination: '',
    contactPerson: '',
    contactPhone: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.residentId) queryParams.append('residentId', filters.residentId);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.dateRange?.from) queryParams.append('dateFrom', filters.dateRange.from);
      if (filters.dateRange?.to) queryParams.append('dateTo', filters.dateRange.to);

      const [gatePassesRes, residentsRes] = await Promise.all([
        api.get(`/gate-passes?${queryParams.toString()}`),
        api.get('/residents'),
      ]);
      setGatePasses(gatePassesRes.data);
      setResidents(residentsRes.data.filter((r: Resident) => !r.status || r.status === 'active'));
    } catch (error) {
      logError(error, 'Failed to load gate passes data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        exitTime: new Date(formData.exitTime).toISOString(),
        expectedReturnTime: formData.expectedReturnTime
          ? new Date(formData.expectedReturnTime).toISOString()
          : undefined,
      };
      if (editing) {
        await api.patch(`/gate-passes/${editing._id}`, dataToSend);
      } else {
        await api.post('/gate-passes', dataToSend);
      }
      setShowForm(false);
      setEditing(null);
      setFormData({
        residentId: '',
        exitTime: new Date().toISOString().slice(0, 16),
        expectedReturnTime: '',
        purpose: '',
        destination: '',
        contactPerson: '',
        contactPhone: '',
        notes: '',
      });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save gate pass');
    }
  };

  const handleEdit = (gatePass: GatePass) => {
    setEditing(gatePass);
    setFormData({
      residentId: gatePass.residentId,
      exitTime: gatePass.exitTime ? new Date(gatePass.exitTime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      expectedReturnTime: gatePass.expectedReturnTime
        ? new Date(gatePass.expectedReturnTime).toISOString().slice(0, 16)
        : '',
      purpose: gatePass.purpose || '',
      destination: gatePass.destination || '',
      contactPerson: gatePass.contactPerson || '',
      contactPhone: gatePass.contactPhone || '',
      notes: gatePass.notes || '',
    });
    setShowForm(true);
  };

  const handleMarkReturn = async (id: string) => {
    try {
      await api.post(`/gate-passes/${id}/return`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to mark return');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this gate pass?')) return;
    try {
      await api.delete(`/gate-passes/${id}`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete gate pass');
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600 dark:text-gray-400">Loading gate passes...</div>
      </div>
    );
  }

  const filterConfig = {
    search: {
      type: 'text' as const,
      label: 'Search',
      placeholder: 'Search by purpose',
      advanced: false,
    },
    status: {
      type: 'select' as const,
      label: 'Status',
      options: [
        { label: 'All', value: '' },
        { label: 'Out', value: 'OUT' },
        { label: 'Returned', value: 'RETURNED' },
        { label: 'Overdue', value: 'OVERDUE' },
      ],
      advanced: false,
    },
    residentId: {
      type: 'select' as const,
      label: 'Resident',
      options: [
        { label: 'All Residents', value: '' },
        ...residents.map((r) => ({ label: r.name, value: r._id })),
      ],
      advanced: true,
    },
    dateRange: {
      type: 'dateRange' as const,
      label: 'Exit Date Range',
      advanced: true,
    },
  };

  return (
    <FeatureGuard feature="gatePasses">
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-emerald-950 dark:to-teal-950">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-slideInDown">
          <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
            🚪 Gate Passes
          </h1>
          <p className="text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Total: {gatePasses.length} passes</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
            setFormData({
              residentId: '',
              exitTime: new Date().toISOString().slice(0, 16),
              expectedReturnTime: '',
              purpose: '',
              destination: '',
              contactPerson: '',
              contactPhone: '',
              notes: '',
            });
          }}
          className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
        >
          <span className="text-xl">+</span> Add Gate Pass
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
        <div className="bg-gradient-to-br from-white via-emerald-50/50 to-teal-50/50 dark:from-gray-800 dark:via-emerald-900/20 dark:to-teal-900/20 p-4 sm:p-6 rounded-2xl shadow-xl border-2 border-emerald-200 dark:border-emerald-800 mb-6 animate-slideInUp">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {editing ? 'Edit Gate Pass' : 'Add New Gate Pass'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Resident</label>
              <select
                required
                value={formData.residentId}
                onChange={(e) => setFormData({ ...formData, residentId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Resident</option>
                {residents.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Exit Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.exitTime}
                  onChange={(e) => setFormData({ ...formData, exitTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Expected Return Time</label>
                <input
                  type="datetime-local"
                  value={formData.expectedReturnTime}
                  onChange={(e) => setFormData({ ...formData, expectedReturnTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Purpose</label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="Going home, Medical, Shopping, etc."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Destination</label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Contact Person</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Notes</label>
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
                className="flex-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
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

      <div className="bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30 dark:from-gray-800 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-2xl shadow-xl border-2 border-emerald-100 dark:border-emerald-900/30 overflow-hidden animate-slideInUp">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/30 dark:via-teal-900/30 dark:to-cyan-900/30">
              <tr>
                <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  Resident
                </th>
                <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  Exit Time
                </th>
                <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  Expected Return
                </th>
                <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  Actual Return
                </th>
                <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  Purpose
                </th>
                <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gradient-to-b from-white via-emerald-50/10 to-teal-50/10 dark:from-gray-800 dark:via-emerald-900/5 dark:to-teal-900/5 divide-y divide-emerald-100 dark:divide-emerald-800/30">
              {gatePasses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 sm:px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No gate passes found
                  </td>
                </tr>
              ) : (
                gatePasses.map((gatePass, index) => (
                  <tr 
                    key={gatePass._id} 
                    className="hover:bg-gradient-to-r hover:from-emerald-50 hover:via-teal-50 hover:to-cyan-50 dark:hover:from-emerald-900/20 dark:hover:via-teal-900/20 dark:hover:to-cyan-900/20 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-md animate-fadeIn"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {gatePass.residentName || 'N/A'}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                      {formatDateTime(gatePass.exitTime)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                      {gatePass.expectedReturnTime
                        ? formatDateTime(gatePass.expectedReturnTime)
                        : '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                      {gatePass.actualReturnTime ? formatDateTime(gatePass.actualReturnTime) : '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                      {gatePass.purpose || '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          gatePass.status === 'RETURNED'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : gatePass.status === 'OVERDUE'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        {gatePass.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {gatePass.status === 'OUT' && (
                        <button
                          onClick={() => handleMarkReturn(gatePass._id)}
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 mr-4"
                        >
                          Mark Return
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(gatePass)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(gatePass._id)}
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
