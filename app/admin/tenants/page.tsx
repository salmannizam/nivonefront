'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { showSuccess, showError, formatDate } from '@/lib/utils';

interface Tenant {
  _id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  createdAt: string;
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    ownerEmail: '',
    ownerPassword: '',
    ownerName: '',
    plan: 'free',
    status: 'active',
  });

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/tenants');
      setTenants(response.data);
    } catch (error: any) {
      showError(error, 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/tenants', formData);
      showSuccess('Tenant created successfully!');
      setShowForm(false);
      setFormData({
        name: '',
        slug: '',
        ownerEmail: '',
        ownerPassword: '',
        ownerName: '',
        plan: 'free',
        status: 'active',
      });
      loadTenants();
    } catch (error: any) {
      showError(error, 'Failed to create tenant');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400 text-lg">Loading tenants...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="animate-slideInLeft">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Tenant Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage all tenants on the platform
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-500 dark:via-purple-500 dark:to-indigo-500 text-white rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:via-purple-600 dark:hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-medium text-sm sm:text-base animate-slideInRight"
        >
          {showForm ? '✕ Cancel' : '+ Create Tenant'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-800 dark:via-blue-900/20 dark:to-indigo-900/20 p-4 sm:p-6 rounded-2xl shadow-2xl border-2 border-blue-200 dark:border-blue-800 animate-slideInDown">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-2xl animate-bounce">➕</span>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Create New Tenant
            </span>
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" autoComplete="off">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="transform transition-all hover:scale-105">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Tenant Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm hover:shadow-md"
                />
              </div>
              <div className="transform transition-all hover:scale-105">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Slug (subdomain) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-sm hover:shadow-md"
                  placeholder="acme"
                />
              </div>
              <div className="transform transition-all hover:scale-105">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Owner Email *
                </label>
                <input
                  type="email"
                  required
                  autoComplete="off"
                  value={formData.ownerEmail}
                  onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm hover:shadow-md"
                />
              </div>
              <div className="transform transition-all hover:scale-105">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Owner Password *
                </label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={formData.ownerPassword}
                  onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm hover:shadow-md"
                />
              </div>
              <div className="transform transition-all hover:scale-105">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Owner Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-sm hover:shadow-md"
                />
              </div>
              <div className="transform transition-all hover:scale-105">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Plan
                </label>
                <select
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm hover:shadow-md"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-500 dark:via-purple-500 dark:to-indigo-500 text-white rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:via-purple-600 dark:hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
              >
                ✨ Create Tenant
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 sm:flex-none px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-semibold transform hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/20 dark:from-gray-800 dark:via-blue-900/10 dark:to-indigo-900/10 rounded-2xl shadow-xl border-2 border-blue-100 dark:border-blue-900/30 overflow-hidden animate-fadeIn">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-700 dark:via-purple-700 dark:to-indigo-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-6xl mb-4">📭</div>
                    <div className="text-gray-500 dark:text-gray-400 text-lg font-medium">No tenants found</div>
                  </td>
                </tr>
              ) : (
                tenants.map((tenant, index) => (
                  <tr 
                    key={tenant._id} 
                    className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-300 animate-slideInUp"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900 dark:text-white text-lg">
                        {tenant.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 px-3 py-1.5 rounded-lg font-semibold text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                        {tenant.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 text-indigo-800 dark:text-indigo-300 capitalize border border-indigo-200 dark:border-indigo-700">
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${
                          tenant.status === 'active'
                            ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white animate-pulse'
                            : tenant.status === 'suspended'
                            ? 'bg-gradient-to-r from-red-400 to-rose-500 text-white'
                            : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                        }`}
                      >
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {formatDate(tenant.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.location.href = `/admin/tenants/${tenant._id}/features`}
                          className="px-4 py-2 text-xs bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg transform hover:scale-110 font-bold"
                          title="Manage Features"
                        >
                          ⚙️ Features
                        </button>
                        <button
                          onClick={() => window.location.href = `/admin/tenants/${tenant._id}/assign-plan`}
                          className="px-4 py-2 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg transform hover:scale-110 font-bold"
                          title="Assign Plan"
                        >
                          💳 Plan
                        </button>
                        <button
                          onClick={() => window.location.href = `/admin/tenants/${tenant._id}/view`}
                          className="px-4 py-2 text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg transform hover:scale-110 font-bold"
                          title="View Tenant Data"
                        >
                          👁️ View
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

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {tenants.length === 0 ? (
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-xl border-2 border-gray-200 dark:border-gray-700 p-8 text-center animate-fadeIn">
            <div className="text-6xl mb-4 animate-bounce">📭</div>
            <div className="text-gray-500 dark:text-gray-400 text-lg font-medium">No tenants found</div>
          </div>
        ) : (
          tenants.map((tenant, index) => (
            <div
              key={tenant._id}
              className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-800 dark:via-blue-900/20 dark:to-indigo-900/20 rounded-2xl shadow-xl border-2 border-blue-100 dark:border-blue-900/30 p-5 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] animate-slideInUp"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 truncate">
                    {tenant.name}
                  </h3>
                  <code className="text-sm bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 px-3 py-1.5 rounded-lg font-semibold text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                    {tenant.slug}
                  </code>
                </div>
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-md ml-2 ${
                    tenant.status === 'active'
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white animate-pulse'
                      : tenant.status === 'suspended'
                      ? 'bg-gradient-to-r from-red-400 to-rose-500 text-white'
                      : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                  }`}
                >
                  {tenant.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="bg-white/50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-200 dark:border-gray-600">
                  <span className="text-gray-500 dark:text-gray-400 block text-xs mb-1">Plan:</span>
                  <span className="font-bold text-gray-900 dark:text-white capitalize">{tenant.plan}</span>
                </div>
                <div className="bg-white/50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-200 dark:border-gray-600">
                  <span className="text-gray-500 dark:text-gray-400 block text-xs mb-1">Created:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {formatDate(tenant.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => window.location.href = `/admin/tenants/${tenant._id}/features`}
                  className="flex-1 px-4 py-2.5 text-xs bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105 font-bold"
                >
                  ⚙️ Features
                </button>
                <button
                  onClick={() => window.location.href = `/admin/tenants/${tenant._id}/assign-plan`}
                  className="flex-1 px-4 py-2.5 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105 font-bold"
                >
                  💳 Plan
                </button>
                <button
                  onClick={() => window.location.href = `/admin/tenants/${tenant._id}/view`}
                  className="flex-1 px-4 py-2.5 text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105 font-bold"
                >
                  👁️ View
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
