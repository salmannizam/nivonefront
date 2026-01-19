'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import FeatureGuard from '@/components/FeatureGuard';
import { useI18n } from '@/lib/i18n-context';
import { logError, formatDate } from '@/lib/utils';

interface ActivityLog {
  _id: string;
  eventType: string;
  entityType?: string;
  entityId?: string;
  message: string;
  performedBy: {
    _id: string;
    name: string;
    email: string;
    role?: string;
  };
  performedByRole?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export default function ActivityPage() {
  const { t } = useI18n();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [eventType, setEventType] = useState('');

  useEffect(() => {
    loadActivities();
  }, [days, eventType]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('days', days.toString());
      if (eventType) {
        params.append('eventType', eventType);
      }
      const response = await api.get(`/activity-logs?${params.toString()}`);
      setActivities(response.data);
    } catch (error) {
      logError(error, 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('ADDED') || eventType.includes('CREATED')) return '➕';
    if (eventType.includes('UPDATED') || eventType.includes('MODIFIED')) return '✏️';
    if (eventType.includes('DELETED') || eventType.includes('VACATED') || eventType.includes('ARCHIVED')) return '🗑️';
    if (eventType.includes('PAID') || eventType.includes('RECEIVED')) return '💰';
    if (eventType.includes('ASSIGNED')) return '📋';
    if (eventType.includes('REFUNDED')) return '↩️';
    if (eventType.includes('OVERDUE')) return '⚠️';
    return '📝';
  };

  const getEventColor = (eventType: string) => {
    if (eventType.includes('PAID') || eventType.includes('RECEIVED')) return 'text-green-600 dark:text-green-400';
    if (eventType.includes('OVERDUE') || eventType.includes('DELETED')) return 'text-red-600 dark:text-red-400';
    if (eventType.includes('UPDATED') || eventType.includes('MODIFIED')) return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('pages.activity.justNow');
    if (diffMins < 60) {
      const key = diffMins === 1 ? 'pages.activity.minutesAgo' : 'pages.activity.minutesAgo_plural';
      return t(key).replace('{{count}}', diffMins.toString());
    }
    if (diffHours < 24) {
      const key = diffHours === 1 ? 'pages.activity.hoursAgo' : 'pages.activity.hoursAgo_plural';
      return t(key).replace('{{count}}', diffHours.toString());
    }
    if (diffDays < 7) {
      const key = diffDays === 1 ? 'pages.activity.daysAgo' : 'pages.activity.daysAgo_plural';
      return t(key).replace('{{count}}', diffDays.toString());
    }
    // For dates older than 7 days, use dd-mm-yyyy format
    return formatDate(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600 dark:text-gray-400">{t('common.labels.loading')}</div>
      </div>
    );
  }

  return (
    <FeatureGuard feature="activityLog">
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('pages.activity.title')}</h1>
        <div className="flex flex-wrap gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value={7}>{t('pages.activity.last7Days')}</option>
            <option value={30}>{t('pages.activity.last30Days')}</option>
            <option value={60}>{t('pages.activity.last60Days')}</option>
          </select>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">{t('pages.activity.allEvents')}</option>
            <option value="RESIDENT">{t('pages.activity.residents')}</option>
            <option value="PAYMENT">{t('pages.activity.payments')}</option>
            <option value="BED">{t('pages.activity.beds')}</option>
            <option value="DEPOSIT">{t('pages.activity.deposits')}</option>
            <option value="COMPLAINT">{t('pages.activity.complaints')}</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {activities.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {t('pages.activity.noActivities')}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {activities.map((activity) => (
              <div key={activity._id} className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`text-2xl ${getEventColor(activity.eventType)}`}>
                    {getEventIcon(activity.eventType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <p className="text-gray-900 dark:text-white font-medium">
                        {activity.message}
                      </p>
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatRelativeDate(activity.createdAt)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                        {activity.performedBy.name}
                      </span>
                      {activity.performedByRole && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                          {activity.performedByRole}
                        </span>
                      )}
                      {activity.entityType && (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                          {activity.entityType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </FeatureGuard>
  );
}
