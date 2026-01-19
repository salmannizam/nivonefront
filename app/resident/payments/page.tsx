'use client';

import { useEffect, useState } from 'react';
import { useResidentAuth } from '@/lib/resident-auth-context';
import { useI18n } from '@/lib/i18n-context';
import api from '@/lib/api';
import { formatDate, showError } from '@/lib/utils';
import Link from 'next/link';

export default function PaymentsPage() {
  const { t } = useI18n();
  const { resident } = useResidentAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rent' | 'extra' | 'deposits'>('rent');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/resident-portal/payments');
      setData(response.data);
    } catch (error: any) {
      showError(error, error.response?.data?.message || t('pages.residentPortal.payments.loadError'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/resident/dashboard" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
                ← {t('pages.residentPortal.payments.backToDashboard')}
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{t('pages.residentPortal.payments.title')}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('rent')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'rent'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('pages.residentPortal.payments.rentPayments')}
              </button>
              <button
                onClick={() => setActiveTab('extra')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'extra'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('pages.residentPortal.payments.extraPayments')}
              </button>
              <button
                onClick={() => setActiveTab('deposits')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'deposits'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('pages.residentPortal.payments.securityDeposits')}
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'rent' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('pages.residentPortal.payments.month')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('pages.residentPortal.payments.dueAmount')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('pages.residentPortal.payments.paidAmount')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('pages.residentPortal.payments.dueDate')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('pages.residentPortal.payments.status')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.rentPayments?.length > 0 ? (
                    data.rentPayments.map((payment: any) => (
                      <tr key={payment._id}>
                        <td className="px-6 py-4 whitespace-nowrap">{payment.month}</td>
                        <td className="px-6 py-4 whitespace-nowrap">₹{payment.amountDue?.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">₹{payment.amountPaid?.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{formatDate(payment.dueDate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs ${
                            payment.status === 'PAID' ? 'bg-green-100 text-green-800' :
                            payment.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                            payment.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        {t('pages.residentPortal.payments.noRentPayments')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'extra' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('pages.residentPortal.payments.description')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('pages.residentPortal.payments.amount')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('pages.residentPortal.payments.date')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('pages.residentPortal.payments.paymentMode')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.extraPayments?.length > 0 ? (
                    data.extraPayments.map((payment: any) => (
                      <tr key={payment._id}>
                        <td className="px-6 py-4">{payment.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap">₹{payment.amount?.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{formatDate(payment.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{payment.paymentMode}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        {t('pages.residentPortal.payments.noExtraPayments')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'deposits' && data?.securityDeposit && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">{t('pages.residentPortal.payments.depositAmount')}</p>
                <p className="text-2xl font-bold">₹{data.securityDeposit.amount?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('pages.residentPortal.payments.status')}</p>
                <p className="text-lg font-semibold">
                  {data.securityDeposit.received ? t('pages.residentPortal.payments.received') : t('pages.residentPortal.payments.pending')}
                </p>
              </div>
              {data.securityDeposit.receivedDate && (
                <div>
                  <p className="text-sm text-gray-600">{t('pages.residentPortal.payments.receivedDate')}</p>
                  <p className="text-lg font-semibold">{formatDate(data.securityDeposit.receivedDate)}</p>
                </div>
              )}
              {data.securityDeposit.refunded && (
                <div>
                  <p className="text-sm text-gray-600">{t('pages.residentPortal.payments.refunded')}</p>
                  <p className="text-lg font-semibold text-green-600">{t('pages.residentPortal.payments.yes')}</p>
                  {data.securityDeposit.refundDate && (
                    <p className="text-sm text-gray-500">{formatDate(data.securityDeposit.refundDate)}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
