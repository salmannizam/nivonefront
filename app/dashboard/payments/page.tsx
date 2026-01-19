'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import FilterPanel from '@/components/FilterPanel';
import TagSelector from '@/components/TagSelector';
import { useFeatures } from '@/lib/feature-context';
import { useI18n } from '@/lib/i18n-context';
import { logError, formatDate, showSuccess, showError } from '@/lib/utils';

interface RentPayment {
  _id: string;
  residentId: string;
  residentName?: string;
  roomNumber?: string;
  bedNumber?: string;
  month: string;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  paidDate?: string;
  paymentMode?: string;
  status: 'UPCOMING' | 'DUE' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  notes?: string;
}

interface ExtraPayment {
  _id: string;
  residentId: string;
  residentName?: string;
  roomNumber?: string;
  bedNumber?: string;
  description: string;
  amount: number;
  date: string;
  paymentMode: string;
  notes?: string;
  tags?: string[];
}

interface SecurityDeposit {
  _id: string;
  residentId: string;
  residentName?: string;
  roomNumber?: string;
  bedNumber?: string;
  amount: number;
  received: boolean;
  receivedDate?: string;
  paymentMode?: string;
  refunded: boolean;
  refundDate?: string;
  refundAmount?: number;
  deductionAmount?: number;
  deductionReason?: string;
  notes?: string;
  tags?: string[];
}

interface Resident {
  _id: string;
  name: string;
}

interface PaymentSummary {
  dueToday: number;
  dueNext7Days: number;
  overdue: number;
  totalPending: number;
}

export default function PaymentsPage() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const { isFeatureEnabled } = useFeatures();
  const [activeSection, setActiveSection] = useState<'rent' | 'extra' | 'deposits'>('rent');
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);
  const [extraPayments, setExtraPayments] = useState<ExtraPayment[]>([]);
  const [securityDeposits, setSecurityDeposits] = useState<SecurityDeposit[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  
  // Rent payment update form
  const [showRentUpdateForm, setShowRentUpdateForm] = useState(false);
  const [editingRentPayment, setEditingRentPayment] = useState<RentPayment | null>(null);
  const [rentUpdateData, setRentUpdateData] = useState({
    amountPaid: 0,
    paymentMode: 'cash',
    notes: '',
  });

  // Extra payment form
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [editingExtra, setEditingExtra] = useState<ExtraPayment | null>(null);
  const [extraFormData, setExtraFormData] = useState({
    residentId: '',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'cash',
    notes: '',
    tags: [] as string[],
  });

  // Security deposit form
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<SecurityDeposit | null>(null);
  const [depositFormData, setDepositFormData] = useState({
    residentId: '',
    amount: 0,
    received: false,
    receivedDate: new Date().toISOString().split('T')[0],
    paymentMode: 'cash',
    notes: '',
    tags: [] as string[],
  });

  // Set initial section based on URL or available features
  useEffect(() => {
    const section = searchParams.get('section');
    if (section === 'extra' || section === 'deposits' || section === 'rent') {
      setActiveSection(section as 'rent' | 'extra' | 'deposits');
    } else if (!searchParams.get('section')) {
      // Only set default if no section in URL
      if (isFeatureEnabled('rentPayments')) {
        setActiveSection('rent');
      } else if (isFeatureEnabled('extraPayments')) {
        setActiveSection('extra');
      } else if (isFeatureEnabled('securityDeposits')) {
        setActiveSection('deposits');
      }
    }
  }, [searchParams, isFeatureEnabled]);

  // Load data when section or filters change
  useEffect(() => {
    loadData();
  }, [activeSection, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load residents (needed for all sections)
      try {
        const residentsRes = await api.get('/residents');
        setResidents(residentsRes.data);
      } catch (error: any) {
        // Don't log feature-blocked errors as failures - they're expected
        if (!error.isFeatureBlocked) {
          logError(error, 'Failed to load residents');
        }
        // Continue even if residents fail
      }

      // Load data based on active section and feature availability
      if (activeSection === 'rent' && isFeatureEnabled('rentPayments')) {
        try {
          const [rentRes, dueTodayRes, dueNext7Res, overdueRes, summaryRes] = await Promise.all([
            api.get('/payments/rent'),
            api.get('/payments/rent/due-today'),
            api.get('/payments/rent/due-next-7-days'),
            api.get('/payments/rent/overdue'),
            api.get('/payments/rent/pending-summary'),
          ]);
          setRentPayments(rentRes.data);
          setSummary({
            dueToday: dueTodayRes.data.length,
            dueNext7Days: dueNext7Res.data.length,
            overdue: overdueRes.data.length,
            totalPending: summaryRes.data.totalAmount || 0,
          });
        } catch (error: any) {
          // Don't log feature-blocked errors as failures - they're expected
          if (!error.isFeatureBlocked) {
            logError(error, 'Failed to load rent payments');
          }
          setRentPayments([]);
        }
      } else if (activeSection === 'extra' && isFeatureEnabled('extraPayments')) {
        try {
          const extraRes = await api.get('/payments/extra');
          setExtraPayments(extraRes.data);
        } catch (error: any) {
          // Don't log feature-blocked errors as failures - they're expected
          if (!error.isFeatureBlocked) {
            logError(error, 'Failed to load extra payments');
          }
          setExtraPayments([]);
        }
      } else if (activeSection === 'deposits' && isFeatureEnabled('securityDeposits')) {
        try {
          const depositsRes = await api.get('/payments/security-deposits');
          setSecurityDeposits(depositsRes.data);
        } catch (error: any) {
          // Don't log feature-blocked errors as failures - they're expected
          if (!error.isFeatureBlocked) {
            logError(error, 'Failed to load security deposits');
          }
          setSecurityDeposits([]);
        }
      }
    } catch (error: any) {
      // Don't log feature-blocked errors as failures - they're expected
      if (!error.isFeatureBlocked) {
        logError(error, 'Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRentPaymentUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRentPayment) return;

    try {
      await api.patch(`/payments/rent/${editingRentPayment._id}`, rentUpdateData);
      setShowRentUpdateForm(false);
      setEditingRentPayment(null);
      setRentUpdateData({ amountPaid: 0, paymentMode: 'cash', notes: '' });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update payment');
    }
  };

  const handleExtraPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...extraFormData,
        date: new Date(extraFormData.date).toISOString(),
      };

      if (editingExtra) {
        await api.patch(`/payments/extra/${editingExtra._id}`, payload);
      } else {
        await api.post('/payments/extra', payload);
      }
      setShowExtraForm(false);
      setEditingExtra(null);
      setExtraFormData({
        residentId: '',
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        paymentMode: 'cash',
        notes: '',
        tags: [],
      });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save payment');
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...depositFormData,
        receivedDate: depositFormData.received 
          ? new Date(depositFormData.receivedDate).toISOString() 
          : undefined,
      };

      if (editingDeposit) {
        await api.patch(`/payments/security-deposits/${editingDeposit._id}`, payload);
      } else {
        await api.post('/payments/security-deposits', payload);
      }
      setShowDepositForm(false);
      setEditingDeposit(null);
      setDepositFormData({
        residentId: '',
        amount: 0,
        received: false,
        receivedDate: new Date().toISOString().split('T')[0],
        paymentMode: 'cash',
        notes: '',
        tags: [],
      });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save deposit');
    }
  };

  const handleMarkDepositReceived = async (id: string) => {
    try {
      await api.patch(`/payments/security-deposits/${id}/mark-received`, {
        receivedDate: new Date().toISOString(),
        paymentMode: 'cash',
      });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to mark deposit as received');
    }
  };

  const handleProcessRefund = async (id: string, deductionAmount?: number, reason?: string) => {
    try {
      const refundAmount = deductionAmount 
        ? securityDeposits.find(d => d._id === id)!.amount - deductionAmount
        : undefined;
      
      await api.patch(`/payments/security-deposits/${id}/refund`, {
        refundDate: new Date().toISOString(),
        refundAmount,
        deductionAmount,
        deductionReason: reason,
      });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to process refund');
    }
  };

  const handleDeleteExtra = async (id: string) => {
    if (!confirm('Are you sure you want to delete this extra payment?')) return;
    try {
      await api.delete(`/payments/extra/${id}`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete payment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600 dark:text-gray-400">Loading payments...</div>
      </div>
    );
  }

  const getFilterConfig = (): {
    [key: string]: {
      type: 'select' | 'text' | 'date' | 'dateRange' | 'number' | 'numberRange';
      label: string;
      options?: { label: string; value: string }[];
      placeholder?: string;
      advanced?: boolean;
    };
  } => {
    if (activeSection === 'rent') {
      return {
        search: {
          type: 'text' as const,
          label: 'Search',
          placeholder: 'Search by resident name or month',
          advanced: false,
        },
        status: {
          type: 'select' as const,
          label: 'Status',
          options: [
            { label: 'All', value: '' },
            { label: 'Upcoming', value: 'UPCOMING' },
            { label: 'Due', value: 'DUE' },
            { label: 'Partial', value: 'PARTIAL' },
            { label: 'Paid', value: 'PAID' },
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
        month: {
          type: 'text' as const,
          label: 'Month (YYYY-MM)',
          placeholder: 'e.g., 2024-01',
          advanced: true,
        },
        dateRange: {
          type: 'dateRange' as const,
          label: 'Due Date Range',
          advanced: true,
        },
      };
    } else if (activeSection === 'extra') {
      return {
        search: {
          type: 'text' as const,
          label: 'Search',
          placeholder: 'Search by description or resident name',
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
        amountRange: {
          type: 'numberRange' as const,
          label: 'Amount Range (₹)',
          advanced: true,
        },
      };
    } else {
      return {
        search: {
          type: 'text' as const,
          label: 'Search',
          placeholder: 'Search by resident name',
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
        received: {
          type: 'select' as const,
          label: 'Received',
          options: [
            { label: 'All', value: '' },
            { label: 'Yes', value: 'true' },
            { label: 'No', value: 'false' },
          ],
          advanced: false,
        },
        refunded: {
          type: 'select' as const,
          label: 'Refunded',
          options: [
            { label: 'All', value: '' },
            { label: 'Yes', value: 'true' },
            { label: 'No', value: 'false' },
          ],
          advanced: false,
        },
        amountRange: {
          type: 'numberRange' as const,
          label: 'Amount Range (₹)',
          advanced: true,
        },
      };
    }
  };

  // Check if user has access to any payment feature
  const hasPaymentAccess = isFeatureEnabled('rentPayments') || 
                          isFeatureEnabled('extraPayments') || 
                          isFeatureEnabled('securityDeposits');

  if (!hasPaymentAccess) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Feature Not Available
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Payment features are not enabled for your account.
          </p>
        </div>
      </div>
    );
  }

  return (
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">Payments</h1>

      <FilterPanel
        filters={getFilterConfig()}
        filterValues={filters}
        onFilterChange={setFilters}
        onReset={() => setFilters({})}
        showAdvanced={true}
      />

      {/* Section Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
        {isFeatureEnabled('rentPayments') && (
          <button
            onClick={() => setActiveSection('rent')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeSection === 'rent'
                ? 'border-b-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {t('pages.payments.rentPayments')}
          </button>
        )}
        {isFeatureEnabled('extraPayments') && (
          <button
            onClick={() => setActiveSection('extra')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeSection === 'extra'
                ? 'border-b-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {t('pages.payments.extraPayments')}
          </button>
        )}
        {isFeatureEnabled('securityDeposits') && (
          <button
            onClick={() => setActiveSection('deposits')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeSection === 'deposits'
                ? 'border-b-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {t('pages.payments.securityDeposits')}
          </button>
        )}
      </div>

      {/* Summary Cards for Rent Payments */}
      {activeSection === 'rent' && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500 dark:text-gray-400">{t('pages.payments.dueToday')}</h3>
            <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{summary.dueToday}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500 dark:text-gray-400">{t('pages.payments.dueIn7Days')}</h3>
            <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{summary.dueNext7Days}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500 dark:text-gray-400">{t('pages.payments.overdue')}</h3>
            <p className="text-2xl font-bold mt-2 text-red-600 dark:text-red-400">{summary.overdue}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500 dark:text-gray-400">{t('pages.payments.totalPending')}</h3>
            <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
              ₹{summary.totalPending.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Rent Payments Section */}
      {activeSection === 'rent' && (
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      {t('pages.payments.month')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      {t('pages.payments.resident')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      {t('pages.payments.room')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      {t('pages.payments.bed')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      {t('pages.payments.amountDue')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      {t('pages.payments.amountPaid')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      {t('pages.payments.dueDate')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      {t('common.labels.status')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      {t('common.labels.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {rentPayments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        {t('pages.payments.noRentPayments')}
                      </td>
                    </tr>
                  ) : (
                    rentPayments.map((payment) => {
                      // Check if due today
                      const dueDate = new Date(payment.dueDate);
                      const today = new Date();
                      const isDueToday = dueDate.toDateString() === today.toDateString() && payment.status === 'DUE';
                      
                      // Determine row background color based on status
                      const rowBgClass = payment.status === 'OVERDUE'
                        ? 'bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20'
                        : isDueToday
                          ? 'bg-orange-50 dark:bg-orange-900/10 hover:bg-orange-100 dark:hover:bg-orange-900/20'
                          : payment.status === 'PAID'
                            ? 'bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700';
                      
                      return (
                        <tr key={payment._id} className={rowBgClass}>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                            {payment.month}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                            {payment.residentName || 'N/A'}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                            {payment.roomNumber || '-'}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                            {payment.bedNumber ? `Bed ${payment.bedNumber}` : '-'}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                            ₹{payment.amountDue.toLocaleString()}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                            ₹{payment.amountPaid.toLocaleString()}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                            {formatDate(payment.dueDate)}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                payment.status === 'PAID'
                                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                  : payment.status === 'OVERDUE'
                                    ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                    : isDueToday
                                      ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                                      : payment.status === 'PARTIAL'
                                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                        : payment.status === 'UPCOMING'
                                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                              }`}
                            >
                              {payment.status}
                              {isDueToday && ` (${t('pages.payments.dueToday')})`}
                            </span>
                          </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setEditingRentPayment(payment);
                              setRentUpdateData({
                                amountPaid: payment.amountPaid,
                                paymentMode: payment.paymentMode || 'cash',
                                notes: payment.notes || '',
                              });
                              setShowRentUpdateForm(true);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          >
                            {t('common.buttons.update')}
                          </button>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rent Payment Update Form */}
          {showRentUpdateForm && editingRentPayment && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                  Update Rent Payment - {editingRentPayment.month}
                </h2>
                <form onSubmit={handleRentPaymentUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Amount Paid (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max={editingRentPayment.amountDue}
                      step="0.01"
                      value={rentUpdateData.amountPaid || ''}
                      onChange={(e) =>
                        setRentUpdateData({
                          ...rentUpdateData,
                          amountPaid: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Amount Due: ₹{editingRentPayment.amountDue.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Payment Mode
                    </label>
                    <select
                      value={rentUpdateData.paymentMode}
                      onChange={(e) =>
                        setRentUpdateData({ ...rentUpdateData, paymentMode: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Notes
                    </label>
                    <textarea
                      value={rentUpdateData.notes}
                      onChange={(e) =>
                        setRentUpdateData({ ...rentUpdateData, notes: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                    >
                      Update Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRentUpdateForm(false);
                        setEditingRentPayment(null);
                      }}
                      className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Extra Payments Section */}
      {activeSection === 'extra' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                setShowExtraForm(true);
                setEditingExtra(null);
                setExtraFormData({
                  residentId: '',
                  description: '',
                  amount: 0,
                  date: new Date().toISOString().split('T')[0],
                  paymentMode: 'cash',
                  notes: '',
        tags: [],
                });
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
            >
              + {t('pages.payments.addExtraPayment')}
            </button>
          </div>

          {showExtraForm && (
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow mb-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                {editingExtra ? t('pages.payments.addExtraPayment') : t('pages.payments.addExtraPayment')}
              </h2>
              <form onSubmit={handleExtraPaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    {t('pages.payments.resident')}
                  </label>
                  <select
                    required
                    value={extraFormData.residentId}
                    onChange={(e) =>
                      setExtraFormData({ ...extraFormData, residentId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('forms.placeholders.select')}</option>
                    {residents.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <input
                    type="text"
                    required
                    value={extraFormData.description}
                    onChange={(e) =>
                      setExtraFormData({ ...extraFormData, description: e.target.value })
                    }
                    placeholder="e.g., Electricity charges, Damage fine"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={extraFormData.amount || ''}
                      onChange={(e) =>
                        setExtraFormData({
                          ...extraFormData,
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={extraFormData.date}
                      onChange={(e) =>
                        setExtraFormData({ ...extraFormData, date: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Payment Mode
                  </label>
                  <select
                    value={extraFormData.paymentMode}
                    onChange={(e) =>
                      setExtraFormData({ ...extraFormData, paymentMode: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Notes
                  </label>
                  <textarea
                    value={extraFormData.notes}
                    onChange={(e) =>
                      setExtraFormData({ ...extraFormData, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tags</label>
                  <TagSelector
                    tags={extraFormData.tags}
                    onChange={(tags) => setExtraFormData({ ...extraFormData, tags })}
                    placeholder="Add tags (e.g., Electricity, Fine, Guest charge)"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                  >
                    {editingExtra ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExtraForm(false);
                      setEditingExtra(null);
                    }}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      {t('pages.payments.resident')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      {t('pages.payments.room')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      {t('pages.payments.bed')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      {t('pages.payments.description')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      {t('pages.payments.amount')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      {t('pages.payments.date')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      {t('pages.payments.paymentMode')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      {t('common.labels.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {extraPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        {t('pages.payments.noExtraPayments')}
                      </td>
                    </tr>
                  ) : (
                    extraPayments.map((payment) => (
                      <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                          {payment.residentName || 'N/A'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                          {payment.roomNumber || '-'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                          {payment.bedNumber ? `Bed ${payment.bedNumber}` : '-'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-gray-900 dark:text-white">
                          {payment.description}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                          ₹{payment.amount.toLocaleString()}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                          {formatDate(payment.date)}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap capitalize text-gray-900 dark:text-white">
                          {payment.paymentMode}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                setEditingExtra(payment);
                                setExtraFormData({
                                  residentId: payment.residentId,
                                  description: payment.description,
                                  amount: payment.amount,
                                  date: payment.date.split('T')[0],
                                  paymentMode: payment.paymentMode,
                                  notes: payment.notes || '',
                                  tags: payment.tags || [],
                                });
                                setShowExtraForm(true);
                              }}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteExtra(payment._id)}
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
      )}

      {/* Security Deposits Section */}
      {activeSection === 'deposits' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                setShowDepositForm(true);
                setEditingDeposit(null);
                setDepositFormData({
                  residentId: '',
                  amount: 0,
                  received: false,
                  receivedDate: new Date().toISOString().split('T')[0],
                  paymentMode: 'cash',
                  notes: '',
        tags: [],
                });
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
            >
              + {t('pages.payments.addSecurityDeposit')}
            </button>
          </div>

          {showDepositForm && (
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow mb-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                {editingDeposit ? t('pages.payments.addSecurityDeposit') : t('pages.payments.addSecurityDeposit')}
              </h2>
              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Resident
                  </label>
                  <select
                    required
                    value={depositFormData.residentId}
                    onChange={(e) =>
                      setDepositFormData({ ...depositFormData, residentId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('forms.placeholders.select')}</option>
                    {residents.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Security Deposit (refundable) (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={depositFormData.amount || ''}
                    onChange={(e) =>
                      setDepositFormData({
                        ...depositFormData,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={depositFormData.received}
                    onChange={(e) =>
                      setDepositFormData({ ...depositFormData, received: e.target.checked })
                    }
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('pages.payments.received')}
                  </label>
                </div>
                {depositFormData.received && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        {t('pages.payments.receivedDate')}
                      </label>
                      <input
                        type="date"
                        value={depositFormData.receivedDate}
                        onChange={(e) =>
                          setDepositFormData({ ...depositFormData, receivedDate: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        {t('pages.payments.paymentMode')}
                      </label>
                      <select
                        value={depositFormData.paymentMode}
                        onChange={(e) =>
                          setDepositFormData({ ...depositFormData, paymentMode: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Notes</label>
                  <textarea
                    value={depositFormData.notes}
                    onChange={(e) => setDepositFormData({ ...depositFormData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Add any additional notes about this security deposit..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Internal notes visible only to staff members
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tags</label>
                  <TagSelector
                    tags={depositFormData.tags || []}
                    onChange={(tags) => setDepositFormData({ ...depositFormData, tags })}
                    placeholder="Add tags (e.g., Deposit, Refund, Deduction)"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                  >
                    {editingDeposit ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDepositForm(false);
                      setEditingDeposit(null);
                    }}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      {t('pages.payments.resident')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      {t('pages.payments.room')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      {t('pages.payments.bed')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      {t('pages.payments.amount')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      {t('pages.payments.received')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      {t('pages.payments.receivedDate')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      {t('pages.payments.refunded')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      {t('pages.payments.refundAmount')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      {t('common.labels.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {securityDeposits.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        {t('pages.payments.noSecurityDeposits')}
                      </td>
                    </tr>
                  ) : (
                    securityDeposits.map((deposit) => (
                      <tr key={deposit._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                          {deposit.residentName || 'N/A'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                          {deposit.roomNumber || '-'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                          {deposit.bedNumber ? `Bed ${deposit.bedNumber}` : '-'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                          ₹{deposit.amount.toLocaleString()}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              deposit.received
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            }`}
                          >
                            {deposit.received ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                          {deposit.receivedDate
                            ? formatDate(deposit.receivedDate)
                            : '-'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              deposit.refunded
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            }`}
                          >
                            {deposit.refunded ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                          {deposit.refundAmount
                            ? `₹${deposit.refundAmount.toLocaleString()}`
                            : '-'}
                          {deposit.deductionAmount && deposit.deductionAmount > 0 && (
                            <span className="text-xs text-red-600 dark:text-red-400 block">
                              (Deduction: ₹{deposit.deductionAmount.toLocaleString()})
                            </span>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-wrap gap-2">
                            {!deposit.received && (
                              <button
                                onClick={() => handleMarkDepositReceived(deposit._id)}
                                className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                              >
                                Mark Received
                              </button>
                            )}
                            {deposit.received && !deposit.refunded && (
                              <button
                                onClick={() => {
                                  const deduction = prompt('Enter deduction amount (if any):');
                                  const reason = deduction
                                    ? prompt('Reason for deduction:')
                                    : undefined;
                                  if (deduction !== null) {
                                    handleProcessRefund(
                                      deposit._id,
                                      deduction ? parseFloat(deduction) : undefined,
                                      reason || undefined,
                                    );
                                  }
                                }}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                              >
                                Process Refund
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingDeposit(deposit);
                                setDepositFormData({
                                  residentId: deposit.residentId,
                                  amount: deposit.amount,
                                  received: deposit.received,
                                  receivedDate: deposit.receivedDate
                                    ? deposit.receivedDate.split('T')[0]
                                    : new Date().toISOString().split('T')[0],
                                  paymentMode: deposit.paymentMode || 'cash',
                                  notes: deposit.notes || '',
                                  tags: deposit.tags || [],
                                });
                                setShowDepositForm(true);
                              }}
                              className="text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300"
                            >
                              Edit
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
      )}
      </div>
  );
}
