'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import FilterPanel from '@/components/FilterPanel';
import FeatureGuard from '@/components/FeatureGuard';
import { logError } from '@/lib/utils';

interface Staff {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  shift?: string;
  isActive: boolean;
  address?: string;
  salary?: number;
  joiningDate?: string;
  notes?: string;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'WARDEN',
    shift: '',
    address: '',
    salary: 0,
    joiningDate: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());
      if (filters.shift) queryParams.append('shift', filters.shift);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await api.get(`/staff?${queryParams.toString()}`);
      setStaff(response.data);
    } catch (error) {
      logError(error, 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        joiningDate: formData.joiningDate ? new Date(formData.joiningDate).toISOString() : undefined,
        salary: formData.salary || undefined,
      };
      if (editing) {
        await api.patch(`/staff/${editing._id}`, dataToSend);
      } else {
        await api.post('/staff', dataToSend);
      }
      setShowForm(false);
      setEditing(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        role: 'WARDEN',
        shift: '',
        address: '',
        salary: 0,
        joiningDate: '',
        notes: '',
      });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save staff');
    }
  };

  const handleEdit = (staffMember: Staff) => {
    setEditing(staffMember);
    setFormData({
      name: staffMember.name,
      phone: staffMember.phone,
      email: staffMember.email || '',
      role: staffMember.role,
      shift: staffMember.shift || '',
      address: staffMember.address || '',
      salary: staffMember.salary || 0,
      joiningDate: staffMember.joiningDate
        ? new Date(staffMember.joiningDate).toISOString().split('T')[0]
        : '',
      notes: staffMember.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await api.delete(`/staff/${id}`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete staff');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/staff/${id}`, { isActive: !isActive });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update staff');
    }
  };

  const filterConfig = {
    search: {
      type: 'text' as const,
      label: 'Search',
      placeholder: 'Search by name, phone, or email',
      advanced: false,
    },
    role: {
      type: 'select' as const,
      label: 'Role',
      options: [
        { label: 'All Roles', value: '' },
        { label: 'Warden', value: 'WARDEN' },
        { label: 'Cleaner', value: 'CLEANER' },
        { label: 'Security', value: 'SECURITY' },
        { label: 'Other', value: 'OTHER' },
      ],
      advanced: false,
    },
    shift: {
      type: 'select' as const,
      label: 'Shift',
      options: [
        { label: 'All Shifts', value: '' },
        { label: 'Morning', value: 'MORNING' },
        { label: 'Afternoon', value: 'AFTERNOON' },
        { label: 'Night', value: 'NIGHT' },
      ],
      advanced: true,
    },
    isActive: {
      type: 'select' as const,
      label: 'Status',
      options: [
        { label: 'All', value: '' },
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' },
      ],
      advanced: false,
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400 text-lg">Loading staff...</div>
        </div>
      </div>
    );
  }

  return (
    <FeatureGuard feature="staff">
      <div className="animate-fadeIn">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-slideInLeft">
          <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
            Staff
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 font-medium">
            Total: <span className="font-bold text-gray-900 dark:text-white">{staff.length}</span>
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
            setFormData({
              name: '',
              phone: '',
              email: '',
              role: 'WARDEN',
              shift: '',
              address: '',
              salary: 0,
              joiningDate: '',
              notes: '',
            });
          }}
          className="w-full sm:w-auto bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-500 dark:via-cyan-500 dark:to-blue-500 text-white px-6 py-3 rounded-xl hover:from-teal-700 hover:via-cyan-700 hover:to-blue-700 dark:hover:from-teal-600 dark:hover:via-cyan-600 dark:hover:to-blue-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold"
        >
          + Add Staff
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
        <div className="bg-gradient-to-br from-white via-teal-50/30 to-cyan-50/30 dark:from-gray-800 dark:via-teal-900/20 dark:to-cyan-900/20 p-4 sm:p-6 rounded-2xl shadow-xl border-2 border-teal-100 dark:border-teal-900/30 mb-6 animate-slideInUp">
          <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
            <span className="text-xl">👔</span>
            {editing ? 'Edit Staff' : 'Add New Staff'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Name</label>
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
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email (Optional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Role</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="WARDEN">Warden</option>
                  <option value="CLEANER">Cleaner</option>
                  <option value="SECURITY">Security</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Shift (Optional)</label>
                <input
                  type="text"
                  value={formData.shift}
                  onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                  placeholder="Morning, Evening, Night, etc."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Salary (Optional)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.salary || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salary: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Address (Optional)</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Joining Date (Optional)</label>
              <input
                type="date"
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Notes (Optional)</label>
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

      <div className="bg-gradient-to-br from-white via-teal-50/30 to-cyan-50/30 dark:from-gray-800 dark:via-teal-900/20 dark:to-cyan-900/20 rounded-2xl shadow-xl border-2 border-teal-100 dark:border-teal-900/30 overflow-hidden animate-slideInUp">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 dark:from-teal-900/30 dark:via-cyan-900/30 dark:to-blue-900/30">
              <tr>
                <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                  Shift
                </th>
                <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gradient-to-b from-white via-teal-50/10 to-cyan-50/10 dark:from-gray-800 dark:via-teal-900/5 dark:to-cyan-900/5 divide-y divide-teal-100 dark:divide-teal-800/30">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 sm:px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No staff found
                  </td>
                </tr>
              ) : (
                staff.map((staffMember, index) => (
                  <tr 
                    key={staffMember._id} 
                    className="hover:bg-gradient-to-r hover:from-teal-50 hover:via-cyan-50 hover:to-blue-50 dark:hover:from-teal-900/20 dark:hover:via-cyan-900/20 dark:hover:to-blue-900/20 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-md animate-fadeIn"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {staffMember.name}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                      {staffMember.phone}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap capitalize text-gray-900 dark:text-white">
                      {staffMember.role}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                      {staffMember.shift || '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          staffMember.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {staffMember.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(staffMember)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(staffMember._id, staffMember.isActive)}
                        className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300 mr-4"
                      >
                        {staffMember.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(staffMember._id)}
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
