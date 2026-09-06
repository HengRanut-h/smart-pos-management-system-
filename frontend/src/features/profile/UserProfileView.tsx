import React, { useState } from 'react';
import { useApp } from '../../application/context/AppContext';
import {
  User,
  Shield,
  KeyRound,
  Building,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Save,
  Volume2,
  Printer,
  DollarSign,
  Globe,
  Sparkles,
  ShoppingBag,
  BadgeCheck,
  Laptop,
} from 'lucide-react';
import { updateUserProfile } from '../../data-access/posApi';

export const UserProfileView: React.FC = () => {
  const {
    currentUser,
    refreshUserProfile,
    isShiftOpen,
    activeShift,
    lang,
    setLang,
    setActiveTab,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'security' | 'preferences'>('profile');

  // Edit Profile Form State
  const [formData, setFormData] = useState({
    first_name: currentUser?.first_name || 'Lead',
    last_name: currentUser?.last_name || 'Admin',
    email: currentUser?.email || 'admin@smartpos.com',
    phone: currentUser?.phone || '012 345 678',
  });

  // Password Change Form State
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // POS Cashier Preferences State
  const [preferences, setPreferences] = useState({
    scanBeep: true,
    autoPrintReceipt: true,
    paperSize: '80mm',
    dualCurrency: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await updateUserProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
      });
      refreshUserProfile();
      setSuccessMessage('Profile details updated successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to update profile', err);
      setErrorMessage(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }
    if (passwordData.new_password.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await updateUserProfile({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      setSuccessMessage('Password changed successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to change password', err);
      setErrorMessage(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsSaving(false);
    }
  };

  const user = currentUser;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center space-x-3 text-xs font-bold animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center space-x-3 text-xs font-bold animate-fadeIn shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Hero Profile Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-gray-200/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-50 via-teal-50/30 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar with Gradient Ring & Online Dot */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white p-1 shadow-lg shadow-emerald-200">
              <div className="w-full h-full bg-emerald-950/20 rounded-2xl flex items-center justify-center font-black text-2xl tracking-wider">
                {user?.first_name?.charAt(0) || 'L'}{user?.last_name?.charAt(0) || 'A'}
              </div>
            </div>
            <span
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center shadow-xs"
              title="Cashier is Online"
            >
              <span className="w-2 h-2 rounded-full bg-white" />
            </span>
          </div>

          {/* User Details */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                {user?.full_name || 'Lead Admin'}
              </h1>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-extrabold rounded-full border border-emerald-200/80 flex items-center space-x-1 shadow-xs">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{user?.primary_role || 'Super Administrator'}</span>
              </span>
              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-mono font-bold rounded-full">
                @{user?.username || 'admin'}
              </span>
            </div>

            <p className="text-xs text-gray-500 flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1">
              <span className="flex items-center space-x-1">
                <Building className="w-3.5 h-3.5 text-gray-400" />
                <span>{user?.branch?.name || 'Phnom Penh Headquarters'}</span>
                <span className="font-mono text-emerald-700 font-bold">({user?.branch?.code || 'HQ-01'})</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <span className="font-semibold text-gray-700">Code:</span>
                <span className="font-mono font-bold text-gray-900">{user?.employee_code || 'EMP-001'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <span>{user?.email || 'admin@smartpos.com'}</span>
              </span>
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
              <button
                onClick={() => setActiveTab('shifts')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center space-x-1.5 ${
                  isShiftOpen
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isShiftOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span>{isShiftOpen ? 'Active Shift: Open (Station 01)' : 'Shift: Closed (Open Drawer)'}</span>
              </button>

              <button
                onClick={() => setActiveTab('pos')}
                className="px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Open POS Terminal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8 pt-6 border-t border-gray-100">
          <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 space-y-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Today's Orders</span>
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xl font-black text-gray-900 font-mono block">
              {user?.stats?.today_sales_count || 0} Sales
            </span>
            <span className="text-[10px] text-gray-500">Processed by this cashier</span>
          </div>

          <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 space-y-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Today's Volume</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xl font-black text-emerald-600 font-mono block">
              ${(Number(user?.stats?.today_sales_total) || 0).toFixed(2)}
            </span>
            <span className="text-[10px] text-gray-500 font-mono">
              ≈ ៛{(Math.round((Number(user?.stats?.today_sales_total) || 0) * 4100)).toLocaleString()} KHR
            </span>
          </div>

          <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 space-y-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Shift Status</span>
              <Laptop className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xl font-black text-gray-900 font-mono block">
              {isShiftOpen ? 'ACTIVE' : 'IDLE'}
            </span>
            <span className="text-[10px] text-gray-500">
              {activeShift ? `Float: $${Number(activeShift.opening_cash).toFixed(2)}` : 'No open drawer'}
            </span>
          </div>

          <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 space-y-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Security Clearance</span>
              <Shield className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xl font-black text-gray-900 block truncate">
              {user?.primary_role || 'Super Admin'}
            </span>
            <span className="text-[10px] text-gray-500">
              Full Module Access Matrix
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeSubTab === 'profile'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Account & Personal Info</span>
        </button>

        <button
          onClick={() => setActiveSubTab('security')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeSubTab === 'security'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Security & Password</span>
        </button>

        <button
          onClick={() => setActiveSubTab('preferences')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeSubTab === 'preferences'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>POS Terminal Preferences</span>
        </button>
      </div>

      {/* Sub-Tab 1: Account & Personal Info */}
      {activeSubTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-gray-200/80 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-base font-bold text-gray-900">Personal & Employee Profile</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Update your contact details, personal name, and view your store branch assignments.
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500 font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500 font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Read-Only Organizational Data */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Employee Code</span>
                <span className="font-mono font-bold text-gray-900">{user?.employee_code || 'EMP-001'}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Assigned Station</span>
                <span className="font-semibold text-gray-900">Station HQ-01 (Phnom Penh)</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Account Created</span>
                <span className="font-semibold text-gray-900">May 2024 (Active)</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs transition"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sub-Tab 2: Security & Password */}
      {activeSubTab === 'security' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-gray-200/80 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-base font-bold text-gray-900">Security & Credentials</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Change your account password and review recent security and login sessions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Password Change Form */}
            <form onSubmit={handleUpdatePassword} className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">New Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat new password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving || !passwordData.current_password || !passwordData.new_password}
                  className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs transition"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isSaving ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>

            {/* Session & Security Info Card */}
            <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-gray-900">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Session Security</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Last Login IP</span>
                  <span className="font-mono text-gray-800">{user?.last_login_ip || '127.0.0.1'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Last Activity</span>
                  <span className="text-gray-800">{user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Active Session'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">2-Factor Authentication</span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-bold">
                    Optional (Station Restricted)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: POS Terminal Preferences */}
      {activeSubTab === 'preferences' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-gray-200/80 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-base font-bold text-gray-900">Cashier Station & POS Hardware Preferences</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Customize your checkout workflow, barcode scanner feedback, and receipt printer sizing.
            </p>
          </div>

          <div className="max-w-2xl space-y-5">
            {/* Audio Confirmation Beep */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs text-gray-900 block">Barcode Scanner Beep</span>
                  <span className="text-[11px] text-gray-500">Play synthetic 880Hz audio tone when scanning barcodes</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.scanBeep}
                onChange={(e) => setPreferences({ ...preferences, scanBeep: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </div>

            {/* Receipt Auto-Print */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs text-gray-900 block">Auto-Show Thermal Slip</span>
                  <span className="text-[11px] text-gray-500">Automatically open 80mm printable slip after sale completion</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.autoPrintReceipt}
                onChange={(e) => setPreferences({ ...preferences, autoPrintReceipt: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
            </div>

            {/* Receipt Paper Sizing */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs text-gray-900 block">Thermal Printer Paper Width</span>
                  <span className="text-[11px] text-gray-500">Select receipt roll standard width</span>
                </div>
              </div>
              <select
                value={preferences.paperSize}
                onChange={(e) => setPreferences({ ...preferences, paperSize: e.target.value })}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold font-mono text-gray-800"
              >
                <option value="80mm">80mm (Standard Enterprise)</option>
                <option value="58mm">58mm (Compact Mobile)</option>
              </select>
            </div>

            {/* Dual-Currency Display */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs text-gray-900 block">Dual-Currency (USD + KHR @ 4,100)</span>
                  <span className="text-[11px] text-gray-500">Calculate and show prices in both USD and Khmer Riel</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.dualCurrency}
                onChange={(e) => setPreferences({ ...preferences, dualCurrency: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>

            {/* UI Language Switcher */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs text-gray-900 block">Interface Language</span>
                  <span className="text-[11px] text-gray-500">Current language: {lang === 'en' ? 'English' : 'ខ្មែរ (Khmer)'}</span>
                </div>
              </div>
              <div className="flex space-x-1.5 bg-white p-1 rounded-xl border border-gray-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-3 py-1 rounded-lg transition ${
                    lang === 'en' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLang('kh')}
                  className={`px-3 py-1 rounded-lg transition ${
                    lang === 'kh' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  ខ្មែរ
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setSuccessMessage('Station preferences saved to local terminal cache!');
                setTimeout(() => setSuccessMessage(null), 3000);
              }}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Station Preferences</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
