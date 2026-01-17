'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import FilterPanel from '@/components/FilterPanel';
import FeatureGuard from '@/components/FeatureGuard';
import { logError } from '@/lib/utils';

interface AuditLog {
  _id: string;
  action: string;
  performedBy: {
    _id: string;
    name: string;
    email: string;
  };
  entityType?: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  description?: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, any>>({});

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.action) queryParams.append('action', filters.action);
      if (filters.entityType) queryParams.append('entityType', filters.entityType);
      if (filters.performedBy) queryParams.append('performedBy', filters.performedBy);
      if (filters.dateRange?.from) queryParams.append('dateFrom', filters.dateRange.from);
      if (filters.dateRange?.to) queryParams.append('dateTo', filters.dateRange.to);
      if (filters.limit) queryParams.append('limit', filters.limit);
      else queryParams.append('limit', '100');

      const response = await api.get(`/audit-logs?${queryParams.toString()}`);
      setAuditLogs(response.data);
    } catch (error: any) {
      if (error.response?.status === 403) {
        alert('Access denied. Only OWNER role can view audit logs.');
      } else {
        logError(error, 'Failed to load audit logs');
        alert('Failed to load audit logs');
      }
    } finally {
      setLoading(false);
    }
  };

  const filterConfig = {
    action: {
      type: 'text' as const,
      label: 'Action',
      placeholder: 'Filter by action type',
      advanced: false,
    },
    entityType: {
      type: 'select' as const,
      label: 'Entity Type',
      options: [
        { label: 'All', value: '' },
        { label: 'Resident', value: 'Resident' },
        { label: 'Payment', value: 'Payment' },
        { label: 'SecurityDeposit', value: 'SecurityDeposit' },
        { label: 'User', value: 'User' },
        { label: 'RentPayment', value: 'RentPayment' },
      ],
      advanced: false,
    },
    dateRange: {
      type: 'dateRange' as const,
      label: 'Date Range',
      advanced: true,
    },
  };

  const getActionColor = (action: string) => {
    if (action.includes('PAID') || action.includes('REFUNDED')) {
      return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
    }
    if (action.includes('VACATED') || action.includes('DELETED')) {
      return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
    }
    if (action.includes('UPDATED') || action.includes('CHANGED')) {
      return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
    }
    return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600 dark:text-gray-400">Loading audit logs...</div>
      </div>
    );
  }

  return (
    <FeatureGuard feature="auditLog">
      <div>
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Track all critical actions performed in the system. Only visible to OWNER role.
        </p>
      </div>

      <FilterPanel
        filters={filterConfig}
        filterValues={filters}
        onFilterChange={setFilters}
        onReset={() => setFilters({})}
        showAdvanced={true}
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Performed By
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {log.performedBy?.name || 'Unknown'}
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {log.performedBy?.email}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {log.entityType || '-'}
                      {log.entityId && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {log.entityId.substring(0, 8)}...
                        </div>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {log.description || '-'}
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
