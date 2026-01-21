'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { logError, showError, showSuccess } from '@/lib/utils';
import { ADMIN_NAVIGATION_ICONS } from '@/lib/admin-navigation';

type NotificationEvent = 
  | 'resident.created'
  | 'resident.assigned_room'
  | 'payment.due'
  | 'payment.paid'
  | 'security_deposit.received'
  | 'resident.vacated';

interface SmsTemplate {
  _id?: string;
  name: string;
  event: NotificationEvent;
  message: string;
  variables: string[];
  dltTemplateId: string;
  dltHeaderId?: string;
  isActive: boolean;
}

const EVENT_DISPLAY_NAMES: Record<NotificationEvent, string> = {
  'resident.created': 'Resident Registered',
  'resident.assigned_room': 'Resident Assigned Room',
  'payment.due': 'Payment Due',
  'payment.paid': 'Payment Received',
  'security_deposit.received': 'Security Deposit Received',
  'resident.vacated': 'Resident Vacated',
};

const ALL_EVENTS: NotificationEvent[] = [
  'resident.created',
  'resident.assigned_room',
  'payment.due',
  'payment.paid',
  'security_deposit.received',
  'resident.vacated',
];

export default function SmsTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null);
  const [formData, setFormData] = useState<SmsTemplate>({
    name: '',
    event: 'resident.created',
    message: '',
    variables: [],
    dltTemplateId: '',
    dltHeaderId: '',
    isActive: true,
  });
  const [variableInput, setVariableInput] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/notifications/sms-templates');
      setTemplates(response.data);
    } catch (error) {
      logError(error, 'Failed to load SMS templates');
      showError(error, 'Failed to load SMS templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Client-side validation (length/format)
    const name = (formData.name || '').trim();
    if (name.length < 2) {
      showError(null, 'Template name must be at least 2 characters long');
      return;
    }
    if (name.length > 100) {
      showError(null, 'Template name must not exceed 100 characters');
      return;
    }

    const message = (formData.message || '').trim();
    if (message.length < 10) {
      showError(null, 'Message template must be at least 10 characters long');
      return;
    }
    if (message.length > 1000) {
      showError(null, 'Message template must not exceed 1000 characters');
      return;
    }

    const dltTemplateId = (formData.dltTemplateId || '').trim();
    if (!/^\d+$/.test(dltTemplateId)) {
      showError(null, 'DLT Template ID must contain digits only');
      return;
    }
    if (dltTemplateId.length < 5 || dltTemplateId.length > 50) {
      showError(null, 'DLT Template ID must be between 5 and 50 digits');
      return;
    }

    const dltHeaderId = (formData.dltHeaderId || '').trim();
    if (dltHeaderId) {
      if (!/^\d+$/.test(dltHeaderId)) {
        showError(null, 'DLT Header ID must contain digits only');
        return;
      }
      if (dltHeaderId.length < 5 || dltHeaderId.length > 50) {
        showError(null, 'DLT Header ID must be between 5 and 50 digits');
        return;
      }
    }

    const varRegex = /^[a-zA-Z0-9_]+$/;
    for (const v of formData.variables || []) {
      const vv = (v || '').trim();
      if (!vv) {
        showError(null, 'Variable names cannot be empty');
        return;
      }
      if (vv.length > 30) {
        showError(null, 'Each variable must not exceed 30 characters');
        return;
      }
      if (!varRegex.test(vv)) {
        showError(null, 'Variables can only contain letters, numbers, and underscores');
        return;
      }
    }

    try {
      if (editingTemplate?._id) {
        await api.patch(`/admin/notifications/sms-templates/${editingTemplate._id}`, {
          ...formData,
          name,
          message,
          dltTemplateId,
          dltHeaderId,
          variables: (formData.variables || []).map((v) => v.trim()).filter(Boolean),
        });
        showSuccess('SMS template updated successfully');
      } else {
        await api.post('/admin/notifications/sms-templates', {
          ...formData,
          name,
          message,
          dltTemplateId,
          dltHeaderId,
          variables: (formData.variables || []).map((v) => v.trim()).filter(Boolean),
        });
        showSuccess('SMS template created successfully');
      }
      setShowForm(false);
      setEditingTemplate(null);
      setFormData({
        name: '',
        event: 'resident.created',
        message: '',
        variables: [],
        dltTemplateId: '',
        dltHeaderId: '',
        isActive: true,
      });
      loadTemplates();
    } catch (error) {
      logError(error, 'Failed to save SMS template');
      showError(error, 'Failed to save SMS template');
    }
  };

  const handleEdit = (template: SmsTemplate) => {
    setEditingTemplate(template);
    setFormData({ ...template });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await api.delete(`/admin/notifications/sms-templates/${id}`);
      showSuccess('SMS template deleted successfully');
      loadTemplates();
    } catch (error) {
      logError(error, 'Failed to delete SMS template');
      showError(error, 'Failed to delete SMS template');
    }
  };

  const addVariable = () => {
    const next = variableInput.trim();
    if (!next) return;
    if (!/^[a-zA-Z0-9_]+$/.test(next)) {
      showError(null, 'Variable must be letters/numbers/underscore only (e.g., name, amount_due)');
      return;
    }
    if (next.length > 30) {
      showError(null, 'Variable must not exceed 30 characters');
      return;
    }
    if (!formData.variables.includes(next)) {
      setFormData({
        ...formData,
        variables: [...formData.variables, next],
      });
      setVariableInput('');
    }
  };

  const removeVariable = (variable: string) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter((v) => v !== variable),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400 text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="mb-6 flex items-center justify-between animate-slideInDown">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            {ADMIN_NAVIGATION_ICONS.SMS_TEMPLATES} SMS Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage SMS templates for DLT-compliant notifications
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingTemplate(null);
            setFormData({
              name: '',
              event: 'resident.created',
              message: '',
              variables: [],
              dltTemplateId: '',
              dltHeaderId: '',
              isActive: true,
            });
          }}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
        >
          + Add Template
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-gray-800 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl shadow-xl border-2 border-indigo-100 dark:border-indigo-900/30 p-6 animate-slideInUp">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {editingTemplate ? 'Edit Template' : 'Create New Template'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Event *
                </label>
                <select
                  required
                  value={formData.event}
                  onChange={(e) => setFormData({ ...formData, event: e.target.value as NotificationEvent })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  {ALL_EVENTS.map((event) => (
                    <option key={event} value={event}>
                      {EVENT_DISPLAY_NAMES[event]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message Template * (Use {'{variable}'} for placeholders)
              </label>
                <textarea
                  required
                  rows={4}
                  minLength={10}
                  maxLength={1000}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Example: Hello {name}, your payment of ₹{amount} is due on {dueDate}."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Variables (used in message template)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={variableInput}
                  onChange={(e) => setVariableInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariable())}
                  placeholder="Enter variable name (e.g., name, amount)"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={addVariable}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.variables.map((variable) => (
                  <span
                    key={variable}
                    className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full text-sm flex items-center gap-2"
                  >
                    {variable}
                    <button
                      type="button"
                      onClick={() => removeVariable(variable)}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  DLT Template ID *
                </label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  pattern="^[0-9]+$"
                  minLength={5}
                  maxLength={50}
                  value={formData.dltTemplateId}
                  onChange={(e) => setFormData({ ...formData, dltTemplateId: e.target.value })}
                  placeholder="1307170722071080625"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  DLT Header ID (Optional)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="^[0-9]*$"
                  minLength={5}
                  maxLength={50}
                  value={formData.dltHeaderId || ''}
                  onChange={(e) => setFormData({ ...formData, dltHeaderId: e.target.value })}
                  placeholder="1305162746865494108"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Active
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold"
              >
                {editingTemplate ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingTemplate(null);
                }}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600"
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
                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase">Event</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase">Message</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase">DLT Template ID</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {templates.map((template) => (
                <tr key={template._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {template.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {EVENT_DISPLAY_NAMES[template.event]}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                    {template.message}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {template.dltTemplateId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        template.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(template)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => template._id && handleDelete(template._id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {templates.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No SMS templates found. Create one to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
