'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import FilterPanel from '@/components/FilterPanel';
import FeatureGuard from '@/components/FeatureGuard';
import { logError } from '@/lib/utils';

interface Complaint {
  _id: string;
  residentId: string;
  residentName?: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  notes?: string;
  createdAt: string;
  resolvedAt?: string;
}

interface Resident {
  _id: string;
  name: string;
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Complaint | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [formData, setFormData] = useState({
    residentId: '',
    title: '',
    description: '',
    category: 'maintenance',
    priority: 'medium',
    status: 'open',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.residentId) queryParams.append('residentId', filters.residentId);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.dateRange?.from) queryParams.append('dateFrom', filters.dateRange.from);
      if (filters.dateRange?.to) queryParams.append('dateTo', filters.dateRange.to);

      const [complaintsRes, residentsRes] = await Promise.all([
        api.get(`/complaints?${queryParams.toString()}`),
        api.get('/residents'),
      ]);
      setComplaints(complaintsRes.data);
      setResidents(residentsRes.data);
    } catch (error) {
      logError(error, 'Failed to load complaints data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.patch(`/complaints/${editing._id}`, formData);
      } else {
        await api.post('/complaints', formData);
      }
      setShowForm(false);
      setEditing(null);
      setFormData({
        residentId: '',
        title: '',
        description: '',
        category: 'maintenance',
        priority: 'medium',
        status: 'open',
        notes: '',
      });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save complaint');
    }
  };

  const handleEdit = (complaint: Complaint) => {
    setEditing(complaint);
    setFormData({
      residentId: complaint.residentId,
      title: complaint.title,
      description: complaint.description,
      notes: complaint.notes || '',
      category: complaint.category,
      priority: complaint.priority,
      status: complaint.status,
    });
    setShowForm(true);
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/complaints/${id}`, {
        status,
        ...(status === 'resolved' && { resolvedAt: new Date().toISOString() }),
      });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this complaint?')) return;
    try {
      await api.delete(`/complaints/${id}`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete complaint');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-600 border-t-transparent mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400 text-lg">Loading complaints...</div>
        </div>
      </div>
    );
  }

  const filterConfig = {
    search: {
      type: 'text' as const,
      label: 'Search',
      placeholder: 'Search by title or description',
      advanced: false,
    },
    status: {
      type: 'select' as const,
      label: 'Status',
      options: [
        { label: 'All', value: '' },
        { label: 'Open', value: 'open' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Closed', value: 'closed' },
      ],
      advanced: false,
    },
    priority: {
      type: 'select' as const,
      label: 'Priority',
      options: [
        { label: 'All', value: '' },
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Urgent', value: 'urgent' },
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
      label: 'Date Range',
      advanced: true,
    },
  };

  return (
    <FeatureGuard feature="complaints">
      <div className="animate-fadeIn">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-slideInLeft">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 dark:from-orange-400 dark:via-amber-400 dark:to-yellow-400 bg-clip-text text-transparent">
            Complaints
          </h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
            setFormData({
              residentId: '',
              title: '',
              description: '',
              category: 'maintenance',
              priority: 'medium',
              status: 'open',
            });
          }}
          className="w-full sm:w-auto bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 dark:from-orange-500 dark:via-amber-500 dark:to-yellow-500 text-white px-6 py-3 rounded-xl hover:from-orange-700 hover:via-amber-700 hover:to-yellow-700 dark:hover:from-orange-600 dark:hover:via-amber-600 dark:hover:to-yellow-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold"
        >
          + Add Complaint
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
        <div className="bg-gradient-to-br from-white via-orange-50/30 to-amber-50/30 dark:from-gray-800 dark:via-orange-900/20 dark:to-amber-900/20 p-4 sm:p-6 rounded-2xl shadow-xl border-2 border-orange-100 dark:border-orange-900/30 mb-6 animate-slideInUp">
          <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 bg-clip-text text-transparent flex items-center gap-2">
            <span className="text-xl">📝</span>
            {editing ? 'Edit Complaint' : 'Add New Complaint'}
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
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Description</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Category</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="maintenance">Maintenance</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="electrical">Electrical</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Priority</label>
                <select
                  required
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Status</label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Add any additional notes about this complaint..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Internal notes visible only to staff members
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
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

      <div className="bg-gradient-to-br from-white via-orange-50/30 to-amber-50/30 dark:from-gray-800 dark:via-orange-900/20 dark:to-amber-900/20 rounded-2xl shadow-xl border-2 border-orange-100 dark:border-orange-900/30 overflow-hidden animate-slideInUp">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-900/30 dark:via-amber-900/30 dark:to-yellow-900/30">
            <tr>
              <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                Resident
              </th>
              <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                Title
              </th>
              <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                Category
              </th>
              <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                Created
              </th>
              <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gradient-to-b from-white via-orange-50/10 to-amber-50/10 dark:from-gray-800 dark:via-orange-900/5 dark:to-amber-900/5 divide-y divide-orange-100 dark:divide-orange-800/30">
            {complaints.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  No complaints found
                </td>
              </tr>
            ) : (
              complaints.map((complaint, index) => (
                <tr 
                  key={complaint._id} 
                  className="hover:bg-gradient-to-r hover:from-orange-50 hover:via-amber-50 hover:to-yellow-50 dark:hover:from-orange-900/20 dark:hover:via-amber-900/20 dark:hover:to-yellow-900/20 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-md animate-fadeIn"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    {complaint.residentName || 'N/A'}
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-gray-900 dark:text-white">{complaint.title}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap capitalize text-gray-900 dark:text-white">{complaint.category}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        complaint.priority === 'urgent'
                          ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          : complaint.priority === 'high'
                            ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                            : complaint.priority === 'medium'
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                              : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      }`}
                    >
                      {complaint.priority}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <select
                      value={complaint.status}
                      onChange={(e) => handleStatusChange(complaint._id, e.target.value)}
                      className={`px-2 py-1 rounded text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                        complaint.status === 'resolved'
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : complaint.status === 'closed'
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                      }`}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(complaint.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleEdit(complaint)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(complaint._id)}
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
