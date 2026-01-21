'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { showSuccess, showError } from '@/lib/utils';

interface Plan {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  isActive: boolean;
  isDefault?: boolean;
}

interface DefaultPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DefaultPlanModal({ isOpen, onClose }: DefaultPlanModalProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [features, setFeatures] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    billingCycle: 'monthly' as 'monthly' | 'yearly',
    features: [] as string[],
    isActive: true,
    isDefault: true,
  });
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      loadPlans();
    }
  }, [isOpen]);

  const loadPlans = async () => {
    try {
      const [plansRes, featuresRes] = await Promise.all([
        api.get('/admin/plans?activeOnly=true'),
        api.get('/admin/features?activeOnly=true').catch(() => ({ data: [] })),
      ]);
      setPlans(plansRes.data || []);
      setFeatures(featuresRes.data || []);
    } catch (error: any) {
      showError(error, 'Failed to load plans');
    }
  };

  const handleSetDefault = async () => {
    if (!selectedPlanId) {
      showError(null, 'Please select a plan');
      return;
    }

    try {
      setLoading(true);
      await api.post(`/admin/plans/${selectedPlanId}/set-default`);
      showSuccess('Default plan set successfully!');
      onClose();
      // Refresh the page to update the state
      window.location.reload();
    } catch (error: any) {
      showError(error, 'Failed to set default plan');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.name || formData.name.trim().length < 2) {
      showError(null, 'Plan name must be at least 2 characters long');
      return;
    }
    
    if (!formData.slug || formData.slug.trim().length < 2) {
      showError(null, 'Slug must be at least 2 characters long');
      return;
    }
    
    // Validate slug format
    const slugRegex = /^[a-z0-9]([a-z0-9\-]*[a-z0-9])?$/;
    if (!slugRegex.test(formData.slug)) {
      showError(null, 'Slug must be lowercase alphanumeric with hyphens only. Must start and end with a letter or number.');
      return;
    }
    
    if (!formData.description || formData.description.trim().length < 10) {
      showError(null, 'Description must be at least 10 characters long');
      return;
    }
    
    if (formData.price < 0) {
      showError(null, 'Price must be 0 or greater');
      return;
    }
    
    // Validate at least one feature is selected
    if (!formData.features || formData.features.length === 0) {
      showError(null, 'Please select at least one feature for this plan');
      return;
    }
    
    try {
      setLoading(true);
      await api.post('/admin/plans', formData);
      showSuccess('Plan created and set as default successfully!');
      onClose();
      // Refresh the page to update the state
      window.location.reload();
    } catch (error: any) {
      showError(error, 'Failed to create plan');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Default Plan Required
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Important:</strong> You need to set a default plan before tenants can sign up. 
              The default plan will be automatically assigned to new tenants during registration.
            </p>
          </div>

          {!showCreateForm ? (
            <>
              {plans.length > 0 ? (
                <>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Select an existing plan to set as default, or create a new plan.
                  </p>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Select Plan
                    </label>
                    <select
                      value={selectedPlanId}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">-- Select a plan --</option>
                      {plans.map((plan) => (
                        <option key={plan._id} value={plan._id}>
                          {plan.name} - ₹{plan.price}/{plan.billingCycle}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSetDefault}
                      disabled={!selectedPlanId || loading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Setting...' : 'Set as Default'}
                    </button>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Create New Plan
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    No plans exist yet. Please create a plan and set it as default.
                  </p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Plan
                  </button>
                </>
              )}
            </>
          ) : (
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Plan Name *
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Free Plan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Slug *
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={63}
                  pattern="[a-z0-9]([a-z0-9\-]*[a-z0-9])?"
                  value={formData.slug}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                    setFormData({ ...formData, slug: value });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., free"
                  title="Lowercase letters, numbers, and hyphens only. Must start and end with a letter or number."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Description *
                </label>
                <textarea
                  required
                  minLength={10}
                  maxLength={500}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Enter plan description (minimum 10 characters)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, price: value >= 0 ? value : 0 });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Billing Cycle *
                </label>
                <select
                  required
                  value={formData.billingCycle}
                  onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as 'monthly' | 'yearly' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              {features.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Features (Select at least one) *
                    {formData.features.length === 0 && (
                      <span className="ml-2 text-red-500 text-xs">(Required)</span>
                    )}
                  </label>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                    <div className="space-y-2">
                      {features.map((feature) => {
                        const isSelected = formData.features.includes(feature.key);
                        return (
                          <label
                            key={feature._id}
                            className={`flex items-center p-2 border rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                : 'border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    features: [...formData.features, feature.key],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    features: formData.features.filter((f) => f !== feature.key),
                                  });
                                }
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-900 dark:text-white">
                              {feature.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create & Set as Default'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
