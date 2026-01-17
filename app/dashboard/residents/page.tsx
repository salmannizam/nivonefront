'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import FilterPanel from '@/components/FilterPanel';
import FeatureGuard from '@/components/FeatureGuard';
import TagSelector from '@/components/TagSelector';
import { logError } from '@/lib/utils';

interface Resident {
  _id: string;
  name: string;
  email: string;
  phone: string;
  roomId: string;
  roomNumber?: string;
  bedId?: string;
  bedNumber?: string;
  checkInDate: string;
  checkOutDate?: string;
  moveOutDate?: string;
  moveOutReason?: string;
  expectedVacateDate?: string;
  settlementCompleted?: boolean;
  status: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  tags?: string[];
  settlement?: {
    pendingRent: number;
    securityDeposit: number;
    depositDeduction: number;
    pendingRentPayments: number;
    overdueRentPayments: number;
    partialRentPayments: number;
  };
}

interface Room {
  _id: string;
  roomNumber: string;
  buildingName?: string;
}

interface Bed {
  _id: string;
  bedNumber: string;
  roomId: string;
  roomNumber?: string;
  rent?: number;
  status: string;
}

export default function ResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showVacateForm, setShowVacateForm] = useState(false);
  const [vacatingResident, setVacatingResident] = useState<Resident | null>(null);
  const [editing, setEditing] = useState<Resident | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [vacateFormData, setVacateFormData] = useState({
    moveOutDate: new Date().toISOString().split('T')[0],
    moveOutReason: '',
    depositDeductionAmount: '',
    depositDeductionReason: '',
    settlementNotes: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    roomId: '',
    bedId: '',
    checkInDate: new Date().toISOString().split('T')[0],
    expectedVacateDate: '',
    tags: [] as string[],
    notes: '',
    emergencyContact: {
      name: '',
      phone: '',
      relation: '',
    },
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.roomId) queryParams.append('roomId', filters.roomId);
      if (filters.bedId) queryParams.append('bedId', filters.bedId);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.buildingId) queryParams.append('buildingId', filters.buildingId);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.checkInDateRange?.from) queryParams.append('checkInDateFrom', filters.checkInDateRange.from);
      if (filters.checkInDateRange?.to) queryParams.append('checkInDateTo', filters.checkInDateRange.to);

      const [residentsRes, roomsRes, bedsRes, buildingsRes] = await Promise.all([
        api.get(`/residents?${queryParams.toString()}`),
        api.get('/rooms'),
        api.get('/beds'),
        api.get('/buildings'),
      ]);
      setResidents(residentsRes.data);
      setRooms(roomsRes.data);
      setBeds(bedsRes.data);
      setBuildings(buildingsRes.data);
    } catch (error) {
      logError(error, 'Failed to load residents data');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableBeds = async (roomId: string) => {
    try {
      const response = await api.get(`/beds/available?roomId=${roomId}`);
      setAvailableBeds(response.data);
    } catch (error) {
      logError(error, 'Failed to load available beds');
      setAvailableBeds([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.patch(`/residents/${editing._id}`, formData);
      } else {
        await api.post('/residents', formData);
      }
      setShowForm(false);
      setEditing(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        roomId: '',
        bedId: '',
        checkInDate: new Date().toISOString().split('T')[0],
        expectedVacateDate: '',
        tags: [],
        notes: '',
        emergencyContact: { name: '', phone: '', relation: '' },
      });
      setAvailableBeds([]);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save resident');
    }
  };

  const handleCheckOut = async (id: string) => {
    if (!confirm('Are you sure you want to check out this resident?')) return;
    try {
      await api.post(`/residents/${id}/checkout`, {
        checkOutDate: new Date().toISOString(),
      });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to check out resident');
    }
  };

  const handleVacate = async (resident: Resident) => {
    setVacatingResident(resident);
    setVacateFormData({
      moveOutDate: new Date().toISOString().split('T')[0],
      moveOutReason: '',
      depositDeductionAmount: '',
      depositDeductionReason: '',
      settlementNotes: '',
    });
    setShowVacateForm(true);
  };

  const handleVacateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacatingResident) return;
    try {
      const response = await api.post(`/residents/${vacatingResident._id}/vacate`, {
        moveOutDate: vacateFormData.moveOutDate,
        moveOutReason: vacateFormData.moveOutReason,
        depositDeductionAmount: vacateFormData.depositDeductionAmount ? parseFloat(vacateFormData.depositDeductionAmount) : undefined,
        depositDeductionReason: vacateFormData.depositDeductionReason || undefined,
        settlementNotes: vacateFormData.settlementNotes || undefined,
      });
      alert(`Resident vacated successfully. Settlement: Pending Rent: ₹${response.data.settlement?.pendingRent || 0}, Security Deposit: ₹${response.data.settlement?.securityDeposit || 0}`);
      setShowVacateForm(false);
      setVacatingResident(null);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to vacate resident');
    }
  };

  const handleCompleteSettlement = async (id: string) => {
    if (!confirm('Mark settlement as completed? This action cannot be undone.')) return;
    try {
      await api.post(`/residents/${id}/complete-settlement`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to complete settlement');
    }
  };

  const handleEdit = (resident: Resident) => {
    setEditing(resident);
    setFormData({
      name: resident.name,
      email: resident.email,
      phone: resident.phone,
      roomId: resident.roomId,
      bedId: resident.bedId || '',
      checkInDate: resident.checkInDate.split('T')[0],
      expectedVacateDate: resident.expectedVacateDate ? resident.expectedVacateDate.split('T')[0] : '',
      tags: resident.tags || [],
      notes: (resident as any).notes || '',
      emergencyContact: resident.emergencyContact || { name: '', phone: '', relation: '' },
    });
    if (resident.roomId) {
      loadAvailableBeds(resident.roomId);
    }
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resident?')) return;
    try {
      await api.delete(`/residents/${id}`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete resident');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400 text-lg">Loading residents...</div>
        </div>
      </div>
    );
  }

  const filterConfig = {
    search: {
      type: 'text' as const,
      label: 'Search',
      placeholder: 'Search by name, phone, or email',
      advanced: false,
    },
    status: {
      type: 'select' as const,
      label: 'Status',
      options: [
        { label: 'All', value: '' },
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Notice Given', value: 'NOTICE_GIVEN' },
        { label: 'Vacated', value: 'VACATED' },
        { label: 'Suspended', value: 'SUSPENDED' },
      ],
      advanced: false,
    },
    roomId: {
      type: 'select' as const,
      label: 'Room',
      options: [
        { label: 'All Rooms', value: '' },
        ...rooms.map((r) => ({ label: r.roomNumber, value: r._id })),
      ],
      advanced: false,
    },
    bedId: {
      type: 'select' as const,
      label: 'Bed',
      options: [
        { label: 'All Beds', value: '' },
        ...beds.map((b) => ({ label: `Bed ${b.bedNumber} (${b.roomNumber})`, value: b._id })),
      ],
      advanced: true,
    },
    buildingId: {
      type: 'select' as const,
      label: 'Building',
      options: [
        { label: 'All Buildings', value: '' },
        ...buildings.map((b) => ({ label: b.name, value: b._id })),
      ],
      advanced: true,
    },
    checkInDateRange: {
      type: 'dateRange' as const,
      label: 'Check-in Date Range',
      advanced: true,
    },
  };

  return (
    <FeatureGuard feature="residents">
      <div className="animate-fadeIn">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-slideInLeft">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Residents
          </h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        roomId: '',
        bedId: '',
        checkInDate: new Date().toISOString().split('T')[0],
        expectedVacateDate: '',
        tags: [],
        notes: '',
        emergencyContact: { name: '', phone: '', relation: '' },
      });
        setAvailableBeds([]);
          }}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-500 dark:via-indigo-500 dark:to-purple-500 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:via-indigo-600 dark:hover:to-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-bold"
        >
          + Add Resident
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
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-800 dark:via-blue-900/20 dark:to-indigo-900/20 p-4 sm:p-6 rounded-2xl shadow-xl border-2 border-blue-100 dark:border-blue-900/30 mb-6 animate-slideInUp">
          <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
            <span className="text-xl">👤</span>
            {editing ? 'Edit Resident' : 'Add New Resident'}
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
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Room</label>
                <select
                  required
                  value={formData.roomId}
                  onChange={(e) => {
                    setFormData({ ...formData, roomId: e.target.value, bedId: '' });
                    if (e.target.value) {
                      loadAvailableBeds(e.target.value);
                    } else {
                      setAvailableBeds([]);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Room</option>
                  {rooms.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.roomNumber} {r.buildingName && `(${r.buildingName})`}
                    </option>
                  ))}
                </select>
              </div>
              {formData.roomId && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Bed <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.bedId}
                    onChange={(e) => setFormData({ ...formData, bedId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Bed (Required)</option>
                    {availableBeds.map((b) => (
                      <option key={b._id} value={b._id}>
                        Bed {b.bedNumber} (₹{beds.find((bed) => bed._id === b._id)?.rent || 0}/month)
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Bed assignment is required. Rent is calculated from bed rent only.
                  </p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Check-in Date</label>
                <input
                  type="date"
                  required
                  value={formData.checkInDate}
                  onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Expected Vacate Date</label>
                <input
                  type="date"
                  value={formData.expectedVacateDate}
                  onChange={(e) => setFormData({ ...formData, expectedVacateDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Optional: Expected date when resident will vacate
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tags</label>
              <TagSelector
                tags={formData.tags}
                onChange={(tags) => setFormData({ ...formData, tags })}
                placeholder="Add tags (e.g., VIP, Late payer, Issue-prone)"
              />
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Emergency Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Name</label>
                  <input
                    type="text"
                    value={formData.emergencyContact.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: {
                          ...formData.emergencyContact,
                          name: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Phone</label>
                  <input
                    type="tel"
                    value={formData.emergencyContact.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: {
                          ...formData.emergencyContact,
                          phone: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Relation</label>
                  <input
                    type="text"
                    value={formData.emergencyContact.relation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: {
                          ...formData.emergencyContact,
                          relation: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Add any additional notes about this resident..."
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

      {showVacateForm && vacatingResident && (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Vacate Resident: {vacatingResident.name}
          </h2>
          <form onSubmit={handleVacateSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Move-out Date *</label>
              <input
                type="date"
                required
                value={vacateFormData.moveOutDate}
                onChange={(e) => setVacateFormData({ ...vacateFormData, moveOutDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Reason for Leaving</label>
              <textarea
                value={vacateFormData.moveOutReason}
                onChange={(e) => setVacateFormData({ ...vacateFormData, moveOutReason: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Optional reason for leaving"
              />
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Security Deposit Settlement</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Deduction Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={vacateFormData.depositDeductionAmount}
                    onChange={(e) => setVacateFormData({ ...vacateFormData, depositDeductionAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Deduction Reason</label>
                  <input
                    type="text"
                    value={vacateFormData.depositDeductionReason}
                    onChange={(e) => setVacateFormData({ ...vacateFormData, depositDeductionReason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Damage charges"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Settlement Notes</label>
              <textarea
                value={vacateFormData.settlementNotes}
                onChange={(e) => setVacateFormData({ ...vacateFormData, settlementNotes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes about the settlement"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 transition-colors"
              >
                Vacate Resident
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowVacateForm(false);
                  setVacatingResident(null);
                }}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-800 dark:via-blue-900/20 dark:to-indigo-900/20 rounded-2xl shadow-xl border-2 border-blue-100 dark:border-blue-900/30 overflow-hidden animate-slideInUp">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Check-in
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {residents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-lg font-bold">
                    No residents found
                  </td>
                </tr>
              ) : (
                residents.map((resident, index) => (
                  <tr 
                    key={resident._id} 
                    className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-900/10 dark:hover:to-indigo-900/10 transition-all animate-slideInUp"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">
                            {resident.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{resident.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{resident.email}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{resident.phone}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{resident.roomNumber || 'N/A'}</span>
                      {resident.bedNumber && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">Bed: {resident.bedNumber}</div>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(resident.checkInDate).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                          resident.status === 'ACTIVE'
                            ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md animate-pulse-slow'
                            : resident.status === 'NOTICE_GIVEN'
                            ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-md'
                            : resident.status === 'VACATED'
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            : resident.status === 'SUSPENDED'
                            ? 'bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-md'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {resident.status === 'ACTIVE' ? '✓ Active' :
                         resident.status === 'NOTICE_GIVEN' ? '⚠️ Notice Given' :
                         resident.status === 'VACATED' ? '🚪 Vacated' :
                         resident.status === 'SUSPENDED' ? '🚫 Suspended' :
                         resident.status}
                      </span>
                      {resident.status === 'VACATED' && resident.moveOutDate && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Moved out: {new Date(resident.moveOutDate).toLocaleDateString()}
                        </div>
                      )}
                      {resident.status === 'VACATED' && resident.settlement && !resident.settlementCompleted && (
                        <div className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-bold animate-pulse">
                          ⚠️ Settlement Pending
                        </div>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-2">
                        {resident.status !== 'VACATED' && (
                          <button
                            onClick={() => handleEdit(resident)}
                            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 transition-all shadow-md hover:shadow-lg font-bold transform hover:scale-105"
                          >
                            Edit
                          </button>
                        )}
                        {(resident.status === 'ACTIVE' || resident.status === 'NOTICE_GIVEN') && (
                          <button
                            onClick={() => handleVacate(resident)}
                            className="px-3 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-500 dark:to-amber-500 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 dark:hover:from-orange-600 dark:hover:to-amber-600 transition-all shadow-md hover:shadow-lg font-bold transform hover:scale-105"
                          >
                            Vacate
                          </button>
                        )}
                        {resident.status === 'VACATED' && !resident.settlementCompleted && (
                          <button
                            onClick={() => handleCompleteSettlement(resident._id)}
                            className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-600 transition-all shadow-md hover:shadow-lg font-bold transform hover:scale-105"
                          >
                            Complete Settlement
                          </button>
                        )}
                        {resident.status !== 'VACATED' && (
                          <button
                            onClick={() => handleDelete(resident._id)}
                            className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-500 dark:to-rose-500 text-white rounded-lg hover:from-red-700 hover:to-rose-700 dark:hover:from-red-600 dark:hover:to-rose-600 transition-all shadow-md hover:shadow-lg font-bold transform hover:scale-105"
                          >
                            Delete
                          </button>
                        )}
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
