import React, { useState, useEffect } from 'react';
import { useApp } from '../../application/context/AppContext';
import { Customer } from '../../foundation/types';
import { getCustomers, createCustomer } from '../../data-access/posApi';
import {
  Users,
  Search,
  Plus,
  Award,
  CreditCard,
  Phone,
  Mail,
  RefreshCw,
  Star,
  X,
} from 'lucide-react';

export const CustomerManagementView: React.FC = () => {
  const { lang } = useApp();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  const fetchCustomerList = async () => {
    setIsLoading(true);
    try {
      const data = await getCustomers(searchQuery);
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerList();
  }, [searchQuery]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSaving(true);
    try {
      await createCustomer(formData);
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', email: '', address: '' });
      await fetchCustomerList();
    } catch (err) {
      console.error('Failed to create customer', err);
      alert('Failed to register customer. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getTier = (points: number | string) => {
    const pts = Number(points) || 0;
    if (pts >= 2000) return { name: 'Platinum', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '👑' };
    if (pts >= 1000) return { name: 'Gold', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: '⭐' };
    if (pts >= 500) return { name: 'Silver', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: '✨' };
    return { name: 'Bronze', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '🥉' };
  };

  const filteredCustomers = customers.filter((c) => {
    const pts = Number(c.loyalty_points) || 0;
    if (tierFilter === 'PLATINUM') return pts >= 2000;
    if (tierFilter === 'GOLD') return pts >= 1000 && pts < 2000;
    if (tierFilter === 'SILVER') return pts >= 500 && pts < 1000;
    if (tierFilter === 'BRONZE') return pts < 500;
    return true;
  });

  const totalPoints = customers.reduce((sum, c) => sum + (Number(c.loyalty_points) || 0), 0);
  const vipCount = customers.filter((c) => (Number(c.loyalty_points) || 0) >= 1000).length;

  return (
    <div className="flex-1 bg-gray-50 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {lang === 'kh' ? 'ការគ្រប់គ្រងអតិថិជន & កម្មវិធីសន្សំពិន្ទុ' : 'Customers & Loyalty Program'}
              </h1>
              <p className="text-xs text-gray-500">
                {lang === 'kh'
                  ? 'បញ្ជីឈ្មោះអតិថិជន សមាជិកភាព និងតុល្យភាពពិន្ទុរង្វាន់'
                  : 'Customer accounts, membership tiers, and reward points balance'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchCustomerList}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'kh' ? '+ បង្កើតអតិថិជនថ្មី' : '+ New Customer'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {lang === 'kh' ? 'អតិថិជនសរុប' : 'Total Customers'}
              </span>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{customers.length}</h3>
              <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">Registered in Store</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {lang === 'kh' ? 'ពិន្ទុសរុបកំពុងចរាចរ' : 'Active Points Balance'}
              </span>
              <h3 className="text-2xl font-black text-purple-600 mt-1">{totalPoints.toLocaleString()} pts</h3>
              <span className="text-xs text-gray-500 font-medium mt-1 inline-block">
                ≈ ${(totalPoints / 100).toFixed(2)} Redemption Value
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {lang === 'kh' ? 'សមាជិក VIP (Gold & Platinum)' : 'VIP Tier Members'}
              </span>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{vipCount}</h3>
              <span className="text-xs text-amber-600 font-medium mt-1 inline-block">Priority Benefits</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {lang === 'kh' ? 'អត្រាប្តូរប្រាក់រង្វាន់' : 'Redemption Rule'}
              </span>
              <h3 className="text-xl font-bold text-gray-900 mt-1">100 pts = $1.00</h3>
              <span className="text-xs text-gray-500 font-medium mt-1 inline-block">Instant POS discount</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={lang === 'kh' ? 'ស្វែងរកឈ្មោះ លេខទូរស័ព្ទ ឬកូដអតិថិជន...' : 'Search by name, phone, or code...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition"
            />
          </div>

          {/* Tier Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  tierFilter === tier
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Directory Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Customer Code</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Phone & Email</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4 text-right">Loyalty Points</th>
                  <th className="py-3 px-4 text-center">Tier</th>
                  <th className="py-3 px-4 text-right">Credit Limit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                      Loading customers...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      No customers found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => {
                    const tier = getTier(customer.loyalty_points);
                    return (
                      <tr key={customer.id} className="hover:bg-gray-50/50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-xs text-gray-600">
                          {customer.customer_code}
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900">
                          {customer.name}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col text-xs text-gray-600">
                            {customer.phone && (
                              <span className="flex items-center space-x-1">
                                <Phone className="w-3 h-3 text-gray-400" />
                                <span>{customer.phone}</span>
                              </span>
                            )}
                            {customer.email && (
                              <span className="flex items-center space-x-1 text-gray-400">
                                <Mail className="w-3 h-3" />
                                <span>{customer.email}</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-500 max-w-xs truncate">
                          {customer.address || '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-purple-600">
                          {Number(customer.loyalty_points).toLocaleString()} pts
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold border ${tier.color}`}
                          >
                            <span>{tier.icon}</span>
                            <span>{tier.name}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-gray-700">
                          ${Number(customer.credit_limit || 0).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">
                {lang === 'kh' ? 'ចុះឈ្មោះអតិថិជនថ្មី' : 'Register New Customer'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sokha Mean"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 012 888 777"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. customer@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Address / City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Phnom Penh, Cambodia"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {isSaving ? 'Registering...' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
