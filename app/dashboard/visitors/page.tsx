'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import FilterPanel from '@/components/FilterPanel';
import FeatureGuard from '@/components/FeatureGuard';
import { logError } from '@/lib/utils';

interface Visitor {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  residentId: string;
  residentName?: string;
  purpose: string;
  visitDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: string;
}

interface Resident {
  _id: string;
  name: string;
}

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Visitor | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    residentId: '',
    purpose: '',
    visitDate: new Date().toISOString().split('T')[0],
    checkInTime: new Date().toTimeString().slice(0, 5),
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

      const [visitorsRes, residentsRes] = await Promise.all([
        api.get(`/visitors?${queryParams.toString()}`),
        api.get('/residents'),
      ]);
      setVisitors(visitorsRes.data);
      setResidents(residentsRes.data);
    } catch (error) {
      logError(error, 'Failed to load visitors data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Combine visitDate and checkInTime into a proper datetime
      const [hours, minutes] = formData.checkInTime.split(':');
      const visitDateTime = new Date(formData.visitDate);
      visitDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

      const payload = {
        ...formData,
        visitDate: visitDateTime.toISOString(),
        checkInTime: visitDateTime.toISOString(),
      };

      if (editing) {
        await api.patch(`/visitors/${editing._id}`, payload);
      } else {
        await api.post('/visitors', payload);
      }
      setShowForm(false);
      setEditing(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        residentId: '',
        purpose: '',
        visitDate: new Date().toISOString().split('T')[0],
        checkInTime: new Date().toTimeString().slice(0, 5),
      });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save visitor');
    }
  };

  const handleCheckOut = async (id: string) => {
    try {
      await api.post(`/visitors/${id}/checkout`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to check out visitor');
    }
  };

  const handleEdit = (visitor: Visitor) => {
    setEditing(visitor);
    setFormData({
      name: visitor.name,
      phone: visitor.phone,
      email: visitor.email || '',
      residentId: visitor.residentId,
      purpose: visitor.purpose,
      visitDate: visitor.visitDate.split('T')[0],
      checkInTime: visitor.checkInTime
        ? new Date(visitor.checkInTime).toTimeString().slice(0, 5)
        : new Date().toTimeString().slice(0, 5),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this visitor record?')) return;
    try {
      await api.delete(`/visitors/${id}`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete visitor');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600 dark:text-gray-400">Loading visitors...</div>
      </div>
    );
  }

  const filterConfig = {
    search: {
      type: 'text' as const,
      label: 'Search',
      placeholder: 'Search by name, phone, or purpose',
      advanced: false,
    },
    status: {
      type: 'select' as const,
      label: 'Status',
      options: [
        { label: 'All', value: '' },
        { label: 'Checked In', value: 'checked_in' },
        { label: 'Checked Out', value: 'checked_out' },
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
      label: 'Visit Date Range',
      advanced: true,
    },
  };

  return (
    <FeatureGuard feature="visitors">
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-slideInDown">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              👥 Visitors
            </h1>
            <p className="text-indigo-600 dark:text-indigo-400 mt-1 font-medium">Manage visitor entries and check-ins</p>
          </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
            setFormData({
              name: '',
              phone: '',
              email: '',
              residentId: '',
              purpose: '',
              visitDate: new Date().toISOString().split('T')[0],
              checkInTime: new Date().toTimeString().slice(0, 5),
            });
          }}
          className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
        >
          <span className="text-xl">+</span> Add Visitor
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
        <div className="bg-gradient-to-br from-white via-indigo-50/50 to-purple-50/50 dark:from-gray-800 dark:via-indigo-900/20 dark:to-purple-900/20 p-4 sm:p-6 rounded-2xl shadow-xl border-2 border-indigo-200 dark:border-indigo-800 mb-6 animate-slideInUp">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {editing ? 'Edit Visitor' : 'Add New Visitor'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Visitor Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Phone</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Purpose</label>
              <input
                type="text"
                required
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Visit Date</label>
                <input
                  type="date"
                  required
                  value={formData.visitDate}
                  onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Check-in Time</label>
                <input
                  type="time"
                  required
                  value={formData.checkInTime}
                  onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
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

      <div className="bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-gray-800 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl shadow-xl border-2 border-indigo-100 dark:border-indigo-900/30 overflow-hidden animate-slideInUp">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30">
            <tr>
              <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                Visitor
              </th>
              <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                Resident
              </th>
              <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                Purpose
              </th>
              <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                Visit Date
              </th>
              <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                Check-in
              </th>
              <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                Check-out
              </th>
              <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gradient-to-b from-white via-indigo-50/10 to-purple-50/10 dark:from-gray-800 dark:via-indigo-900/5 dark:to-purple-900/5 divide-y divide-indigo-100 dark:divide-indigo-800/30">
            {visitors.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  No visitors found
                </td>
              </tr>
            ) : (
              visitors.map((visitor, index) => (
                <tr 
                  key={visitor._id} 
                  className="hover:bg-gradient-to-r hover:from-indigo-50 hover:via-purple-50 hover:to-pink-50 dark:hover:from-indigo-900/20 dark:hover:via-purple-900/20 dark:hover:to-pink-900/20 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-md animate-fadeIn"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{visitor.name}</td>
                  <td className="px-3 sm:px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">{visitor.phone}</div>
                    {visitor.email && <div className="text-sm text-gray-500 dark:text-gray-400">{visitor.email}</div>}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                    {visitor.residentName || 'N/A'}
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-gray-900 dark:text-white">{visitor.purpose}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                    {new Date(visitor.visitDate).toLocaleDateString()}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                    {visitor.checkInTime
                      ? new Date(visitor.checkInTime).toLocaleTimeString()
                      : '-'}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                    {visitor.checkOutTime
                      ? new Date(visitor.checkOutTime).toLocaleTimeString()
                      : '-'}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        visitor.status === 'checked_out'
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      }`}
                    >
                      {visitor.status}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-2">
                      {visitor.status !== 'checked_out' && (
                        <button
                          onClick={() => handleCheckOut(visitor._id)}
                          className="text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300"
                        >
                          Check Out
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(visitor)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(visitor._id)}
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
