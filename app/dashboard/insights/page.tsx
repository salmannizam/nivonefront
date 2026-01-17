'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import FeatureGuard from '@/components/FeatureGuard';
import { logError } from '@/lib/utils';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface RevenueTrend {
  month: string;
  collected: number;
  expected: number;
}

interface OccupancyTrend {
  month: string;
  total: number;
  occupied: number;
  occupancyRate: number;
}

interface PaymentSummary {
  collected: number;
  due: number;
  overdue: number;
  total: number;
}

interface ComplaintsBreakdown {
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

interface VacatingTrend {
  month: string;
  count: number;
}

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
};

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#6b7280'];

export default function InsightsPage() {
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(true);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrend[]>([]);
  const [occupancyTrend, setOccupancyTrend] = useState<OccupancyTrend[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [complaintsBreakdown, setComplaintsBreakdown] = useState<ComplaintsBreakdown | null>(null);
  const [vacatingTrend, setVacatingTrend] = useState<VacatingTrend[]>([]);

  useEffect(() => {
    loadData();
  }, [months]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [revenueRes, occupancyRes, paymentRes, complaintsRes, vacatingRes] = await Promise.all([
        api.get(`/insights/revenue-trend?months=${months}`),
        api.get(`/insights/occupancy-trend?months=${months}`),
        api.get('/insights/payment-summary'),
        api.get('/insights/complaints-breakdown'),
        api.get(`/insights/vacating-trend?months=${months}`),
      ]);

      setRevenueTrend(revenueRes.data);
      setOccupancyTrend(occupancyRes.data);
      setPaymentSummary(paymentRes.data);
      setComplaintsBreakdown(complaintsRes.data);
      setVacatingTrend(vacatingRes.data);
    } catch (error) {
      logError(error, 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600 dark:text-gray-400">Loading insights...</div>
      </div>
    );
  }

  // Prepare complaints data for pie chart
  const complaintsData = complaintsBreakdown
    ? [
        { name: 'Open', value: complaintsBreakdown.open },
        { name: 'In Progress', value: complaintsBreakdown.in_progress },
        { name: 'Resolved', value: complaintsBreakdown.resolved },
        { name: 'Closed', value: complaintsBreakdown.closed },
      ].filter((item) => item.value > 0)
    : [];

  // Prepare payment summary data
  const paymentData = paymentSummary
    ? [
        { name: 'Collected', value: paymentSummary.collected },
        { name: 'Due', value: paymentSummary.due },
        { name: 'Overdue', value: paymentSummary.overdue },
      ].filter((item) => item.value > 0)
    : [];

  return (
    <FeatureGuard feature="insights">
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Insights & Graphs</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setMonths(6)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              months === 6
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Last 6 Months
          </button>
          <button
            onClick={() => setMonths(12)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              months === 12
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Last 12 Months
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Monthly Revenue Trend */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Monthly Revenue Trend</h2>
          {revenueTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonth}
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  tickFormatter={formatCurrency}
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => formatMonth(label)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="collected"
                  stroke={COLORS.success}
                  strokeWidth={2}
                  name="Collected Rent"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="expected"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Expected Rent"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">No revenue data available</div>
          )}
        </div>

        {/* Occupancy Trend */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Bed Occupancy Trend</h2>
          {occupancyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={occupancyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonth}
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  labelFormatter={(label) => formatMonth(label)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke={COLORS.info}
                  strokeWidth={2}
                  name="Total Beds"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="occupied"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  name="Occupied Beds"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">No occupancy data available</div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Month Payment Summary */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Current Month: Due vs Collected</h2>
            {paymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={paymentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis
                    tickFormatter={formatCurrency}
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                  />
                  <Bar
                    dataKey="value"
                    fill={COLORS.primary}
                    radius={[8, 8, 0, 0]}
                  >
                    {paymentData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.name === 'Collected'
                            ? COLORS.success
                            : entry.name === 'Due'
                              ? COLORS.warning
                              : COLORS.danger
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">No payment data available</div>
            )}
          </div>

          {/* Complaints Breakdown */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Complaints Status Breakdown</h2>
            {complaintsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={complaintsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {complaintsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">No complaints data available</div>
            )}
          </div>
        </div>

        {/* Vacating Trend */}
        {vacatingTrend.some((v) => v.count > 0) && (
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Residents Vacating Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vacatingTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonth}
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  labelFormatter={(label) => formatMonth(label)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="count" fill={COLORS.warning} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      </div>
    </FeatureGuard>
  );
}
