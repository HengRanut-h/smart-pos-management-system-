import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../application/context/AppContext';
import {
  UserLoginAuditItem,
  LoginAuditStats,
  LoginAuditFilterParams,
} from '../../foundation/types/loginAudit';
import {
  getLoginAudits,
  getLoginAuditStats,
  getActiveLoginSessions,
  forceLogoutLoginSession,
  getLoginAuditExportUrl,
} from '../../data-access/posApi';
import {
  Shield,
  Search,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  Lock,
  KeyRound,
  Filter,
  Eye,
  LogOut,
  UserX,
  Radio,
  SlidersHorizontal,
  X,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export const UserLoginAuditView: React.FC = () => {
  const { lang, currentUser, notify } = useApp();

  // Data states
  const [audits, setAudits] = useState<UserLoginAuditItem[]>([]);
  const [stats, setStats] = useState<LoginAuditStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Sub-view: ALL vs ACTIVE
  const [viewMode, setViewMode] = useState<'ALL' | 'ACTIVE_SESSIONS'>('ALL');

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deviceFilter, setDeviceFilter] = useState<string>('ALL');
  const [authMethodFilter, setAuthMethodFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [suspiciousOnly, setSuspiciousOnly] = useState<boolean>(false);

  // Modal / Detail state
  const [selectedAudit, setSelectedAudit] = useState<UserLoginAuditItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [terminatingId, setTerminatingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    notify.success(msg, lang === 'kh' ? 'សន្តិសុខ' : 'Login Audit');
  };

  const fetchStats = async () => {
    try {
      const data = await getLoginAuditStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load login audit stats', err);
    }
  };

  const fetchAudits = async () => {
    setIsLoading(true);
    try {
      const params: LoginAuditFilterParams = {
        page,
        per_page: 20,
        search: searchQuery.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        device_type: deviceFilter !== 'ALL' ? deviceFilter : undefined,
        auth_method: authMethodFilter !== 'ALL' ? authMethodFilter : undefined,
        suspicious_only: suspiciousOnly || undefined,
        active_sessions_only: viewMode === 'ACTIVE_SESSIONS' ? true : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      };

      const res = await getLoginAudits(params);
      setAudits(res.data);
      setTotalPages(res.pagination.last_page);
      setTotalCount(res.pagination.total);
    } catch (err) {
      console.error('Failed to load login audits', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchAudits();
  }, [page, viewMode, statusFilter, deviceFilter, authMethodFilter, suspiciousOnly, dateFrom, dateTo]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAudits();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setDeviceFilter('ALL');
    setAuthMethodFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setSuspiciousOnly(false);
    setPage(1);
  };

  const handleForceLogout = async (audit: UserLoginAuditItem) => {
    if (!window.confirm(
      lang === 'kh'
        ? `តើអ្នកពិតជាចង់បញ្ចប់វគ្គការងាររបស់អ្នកប្រើប្រាស់ "${audit.username}" មែនទេ?`
        : `Are you sure you want to forcefully terminate the active session for user "${audit.username}"?`
    )) {
      return;
    }

    setTerminatingId(audit.id);
    try {
      const res = await forceLogoutLoginSession(audit.id);
      showToast(
        lang === 'kh'
          ? `បានបញ្ចប់វគ្គការងាររបស់ "${audit.username}" ដោយជោគជ័យ!`
          : `Session for "${audit.username}" has been terminated successfully!`
      );
      await fetchAudits();
      await fetchStats();
      if (selectedAudit?.id === audit.id) {
        setIsDetailModalOpen(false);
      }
    } catch (err: any) {
      notify.error(
        err.response?.data?.message || (lang === 'kh' ? 'បរាជ័យក្នុងការបញ្ចប់វគ្គការងារ' : 'Failed to terminate session.'),
        lang === 'kh' ? 'កំហុស' : 'Security'
      );
    } finally {
      setTerminatingId(null);
    }
  };

  const handleExportCsv = () => {
    const url = getLoginAuditExportUrl({
      status: statusFilter,
      date_from: dateFrom,
      date_to: dateTo,
    });
    window.open(url, '_blank');
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType?.toUpperCase()) {
      case 'MOBILE':
        return <Smartphone className="w-3.5 h-3.5 text-blue-500" />;
      case 'TABLET':
        return <Tablet className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <Laptop className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const getStatusBadge = (status: string, isSuspicious: boolean) => {
    if (isSuspicious || status === 'SUSPICIOUS') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          <span>{lang === 'kh' ? 'សង្ស័យ' : 'Suspicious'}</span>
        </span>
      );
    }

    switch (status?.toUpperCase()) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{lang === 'kh' ? 'ជោគជ័យ' : 'Success'}</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>{lang === 'kh' ? 'បរាជ័យ' : 'Failed'}</span>
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-900 text-white border border-red-950">
            <ShieldAlert className="w-3 h-3 text-red-300" />
            <span>{lang === 'kh' ? 'បានទប់ស្កាត់' : 'Blocked'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">

      {/* 1. Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Logins */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {lang === 'kh' ? 'ការចូលប្រើប្រាស់សរុប' : 'Total Logins'}
            </p>
            <p className="text-2xl font-black text-gray-900 mt-1">
              {stats?.total_logins ?? '—'}
            </p>
            <span className="text-[11px] text-gray-400">
              {lang === 'kh' ? `ថ្ងៃនេះ: ${stats?.today_total ?? 0}` : `Today: ${stats?.today_total ?? 0}`}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <KeyRound className="w-6 h-6" />
          </div>
        </div>

        {/* Successful Logins */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {lang === 'kh' ? 'អត្រាជោគជ័យ' : 'Success Rate'}
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {stats ? `${stats.success_rate}%` : '—'}
            </p>
            <span className="text-[11px] text-emerald-700 font-medium">
              {lang === 'kh' ? `${stats?.successful_logins ?? 0} ចូលជោគជ័យ` : `${stats?.successful_logins ?? 0} successful`}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Failed Attempts */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {lang === 'kh' ? 'ការចូលបរាជ័យ' : 'Failed Attempts'}
            </p>
            <p className="text-2xl font-black text-rose-600 mt-1">
              {stats?.failed_attempts ?? '—'}
            </p>
            <span className="text-[11px] text-rose-600 font-medium">
              {lang === 'kh' ? `ថ្ងៃនេះ: ${stats?.today_failed ?? 0}` : `Today: ${stats?.today_failed ?? 0}`}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {lang === 'kh' ? 'វគ្គការងារកំពុងដំណើរការ' : 'Active Sessions'}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-2xl font-black text-blue-600">
                {stats?.active_sessions ?? '—'}
              </p>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <span className="text-[11px] text-gray-400">
              {lang === 'kh' ? 'ម៉ាស៊ីនកំពុងភ្ជាប់' : 'Connected terminals'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Radio className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Controls & Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        {/* Top Control Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-gray-100">
          {/* View Mode Toggle Tabs */}
          <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => { setViewMode('ALL'); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'ALL'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {lang === 'kh' ? 'ប្រវត្តិនៃការចូលទាំងអស់' : 'All Login History'}
            </button>
            <button
              onClick={() => { setViewMode('ACTIVE_SESSIONS'); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-2 ${
                viewMode === 'ACTIVE_SESSIONS'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{lang === 'kh' ? 'វគ្គការងារសកម្ម' : 'Active Sessions'}</span>
              {stats?.active_sessions ? (
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-blue-100 text-blue-800 font-mono">
                  {stats.active_sessions}
                </span>
              ) : null}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2.5 flex-wrap">
            <button
              onClick={() => { fetchAudits(); fetchStats(); }}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              title={lang === 'kh' ? 'ផ្ទុកទិន្នន័យឡើងវិញ' : 'Refresh'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
              <span>{lang === 'kh' ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{lang === 'kh' ? 'នាំចេញ CSV' : 'Export CSV'}</span>
            </button>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-1">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={lang === 'kh' ? 'ស្វែងរកតាមឈ្មោះ, IP, ឬកម្មវិធី...' : 'Search username, IP, browser...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">{lang === 'kh' ? 'ស្ថានភាព: ទាំងអស់' : 'Status: All'}</option>
              <option value="SUCCESS">{lang === 'kh' ? '✅ ជោគជ័យ' : '✅ Success'}</option>
              <option value="FAILED">{lang === 'kh' ? '❌ បរាជ័យ' : '❌ Failed'}</option>
              <option value="SUSPICIOUS">{lang === 'kh' ? '⚠️ សង្ស័យ' : '⚠️ Suspicious'}</option>
              <option value="BLOCKED">{lang === 'kh' ? '🚫 បានទប់ស្កាត់' : '🚫 Blocked'}</option>
            </select>
          </div>

          {/* Device Filter */}
          <div>
            <select
              value={deviceFilter}
              onChange={(e) => { setDeviceFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">{lang === 'kh' ? 'ឧបករណ៍: ទាំងអស់' : 'Device: All'}</option>
              <option value="DESKTOP">💻 Desktop / Laptop</option>
              <option value="MOBILE">📱 Mobile Phone</option>
              <option value="TABLET">📟 Tablet POS</option>
            </select>
          </div>

          {/* Auth Method */}
          <div>
            <select
              value={authMethodFilter}
              onChange={(e) => { setAuthMethodFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">{lang === 'kh' ? 'វិធីផ្ទៀងផ្ទាត់: ទាំងអស់' : 'Method: All'}</option>
              <option value="PASSWORD">Password</option>
              <option value="PIN">POS Quick PIN</option>
              <option value="OTP">SMS / Email OTP</option>
              <option value="GOOGLE">Google OAuth</option>
            </select>
          </div>

          {/* Reset button */}
          <div className="flex items-center space-x-2">
            <button
              type="submit"
              className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              {lang === 'kh' ? 'ស្វែងរក' : 'Search'}
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-100 transition cursor-pointer"
              title={lang === 'kh' ? 'សម្អាតតម្រង' : 'Clear Filters'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* 3. Main Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">{lang === 'kh' ? 'កាលបរិច្ឆេទ & ម៉ោង' : 'Date & Time'}</th>
                <th className="py-3.5 px-4">{lang === 'kh' ? 'អ្នកប្រើប្រាស់' : 'User'}</th>
                <th className="py-3.5 px-4">{lang === 'kh' ? 'អាសយដ្ឋាន IP & ទីតាំង' : 'IP & Location'}</th>
                <th className="py-3.5 px-4">{lang === 'kh' ? 'ឧបករណ៍ & កម្មវិធីរុករក' : 'Device & Browser'}</th>
                <th className="py-3.5 px-4">{lang === 'kh' ? 'ព្រឹត្តិការណ៍ & វិធីសាស្ត្រ' : 'Event & Method'}</th>
                <th className="py-3.5 px-4">{lang === 'kh' ? 'ស្ថានភាព' : 'Status'}</th>
                <th className="py-3.5 px-4 text-right">{lang === 'kh' ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2.5 text-indigo-600" />
                    <p className="font-medium">{lang === 'kh' ? 'កំពុងទាញយកកំណត់ត្រាចូល...' : 'Loading authentication records...'}</p>
                  </td>
                </tr>
              ) : audits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <Shield className="w-10 h-10 mx-auto mb-2.5 text-gray-300" />
                    <p className="text-sm font-semibold text-gray-700">
                      {lang === 'kh' ? 'រកមិនឃើញកំណត់ត្រាសវនកម្មការចូលទេ' : 'No login audit records found.'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {lang === 'kh' ? 'សូមសាកល្បងកែប្រែពាក្យស្វែងរក ឬសម្អាតតម្រង' : 'Try adjusting your search criteria or clear active filters.'}
                    </p>
                  </td>
                </tr>
              ) : (
                audits.map((a) => {
                  const isActive = a.status === 'SUCCESS' && !a.logout_at;
                  return (
                    <tr key={a.id} className="hover:bg-gray-50/60 transition">
                      {/* 1. Date & Time */}
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {new Date(a.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {new Date(a.created_at).toLocaleTimeString()}
                        </div>
                      </td>

                      {/* 2. User */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {a.username?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 flex items-center space-x-1.5">
                              <span>{a.username}</span>
                              {a.user?.roles?.[0] && (
                                <span className="px-1.5 py-0.2 rounded-md bg-gray-100 text-gray-600 text-[10px] font-mono">
                                  {a.user.roles[0].name}
                                </span>
                              )}
                            </div>
                            {a.user?.employee?.branch && (
                              <div className="text-[11px] text-gray-400 truncate max-w-xs">
                                {a.user.employee.branch.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. IP & Location */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-gray-800 font-medium">
                          {a.ip_address || '127.0.0.1'}
                        </div>
                        <div className="text-[11px] text-gray-400 flex items-center space-x-1">
                          <Globe className="w-3 h-3" />
                          <span>{a.city ? `${a.city}, ${a.country || 'KH'}` : (a.country || 'Cambodia')}</span>
                        </div>
                      </td>

                      {/* 4. Device & Browser */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          {getDeviceIcon(a.device_type)}
                          <span className="font-medium text-gray-800">{a.browser || 'Browser'}</span>
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {a.operating_system || 'OS'} • {a.device_type}
                        </div>
                      </td>

                      {/* 5. Event & Method */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-gray-800">
                          {a.event_type}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {a.authentication_method}
                          {a.two_factor_verified && ' (2FA)'}
                        </div>
                      </td>

                      {/* 6. Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div>{getStatusBadge(a.status, a.is_suspicious)}</div>
                        {a.failure_reason && (
                          <div className="text-[10px] text-rose-500 max-w-xs truncate mt-0.5" title={a.failure_reason}>
                            {a.failure_reason}
                          </div>
                        )}
                        {isActive && (
                          <div className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>{lang === 'kh' ? 'វគ្គការងារសកម្ម' : 'Active'}</span>
                          </div>
                        )}
                      </td>

                      {/* 7. Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => { setSelectedAudit(a); setIsDetailModalOpen(true); }}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                            title={lang === 'kh' ? 'មើលព័ត៌មានលម្អិត' : 'Inspect Audit Details'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {isActive && (
                            <button
                              onClick={() => handleForceLogout(a)}
                              disabled={terminatingId === a.id}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition flex items-center space-x-1 border border-rose-200 cursor-pointer"
                              title={lang === 'kh' ? 'បង្ខំបញ្ចប់វគ្គការងារ' : 'Force Logout'}
                            >
                              <LogOut className={`w-3 h-3 ${terminatingId === a.id ? 'animate-spin' : ''}`} />
                              <span>{lang === 'kh' ? 'ផ្តាច់' : 'Kill'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {lang === 'kh'
                ? `ទំព័រ ${page} នៃ ${totalPages} (សរុប ${totalCount} កំណត់ត្រា)`
                : `Page ${page} of ${totalPages} (${totalCount} total entries)`}
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-white transition disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-white transition disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Inspection Detail Modal */}
      {isDetailModalOpen && selectedAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    {lang === 'kh' ? 'ព័ត៌មានលម្អិតសវនកម្មចូល' : 'Authentication Audit Record'} #{selectedAudit.id}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {new Date(selectedAudit.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid Attributes */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 font-medium block uppercase tracking-wider text-[10px]">
                  {lang === 'kh' ? 'គណនី / អ្នកប្រើប្រាស់' : 'Account / User'}
                </span>
                <span className="font-bold text-gray-900 text-sm mt-0.5 block">{selectedAudit.username}</span>
                <span className="text-gray-500">{selectedAudit.user?.email || 'No email attached'}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 font-medium block uppercase tracking-wider text-[10px]">
                  {lang === 'kh' ? 'ស្ថានភាព & ការវាយតម្លៃសុវត្ថិភាព' : 'Status & Posture'}
                </span>
                <div className="mt-1">{getStatusBadge(selectedAudit.status, selectedAudit.is_suspicious)}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 font-medium block uppercase tracking-wider text-[10px]">
                  {lang === 'kh' ? 'អាសយដ្ឋាន IP & ទីតាំង' : 'IP & Geolocation'}
                </span>
                <span className="font-mono font-bold text-gray-900 mt-0.5 block">{selectedAudit.ip_address}</span>
                <span className="text-gray-500">{selectedAudit.city}, {selectedAudit.country}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 font-medium block uppercase tracking-wider text-[10px]">
                  {lang === 'kh' ? 'ឧបករណ៍ & ប្រព័ន្ធប្រតិបត្តិការ' : 'Device & OS'}
                </span>
                <span className="font-bold text-gray-900 mt-0.5 block">
                  {selectedAudit.browser} on {selectedAudit.operating_system}
                </span>
                <span className="text-gray-500 uppercase text-[10px] font-mono">{selectedAudit.device_type}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 font-medium block uppercase tracking-wider text-[10px]">
                  {lang === 'kh' ? 'វិធីសាស្ត្រផ្ទៀងផ្ទាត់' : 'Authentication Method'}
                </span>
                <span className="font-bold text-gray-900 mt-0.5 block">{selectedAudit.authentication_method}</span>
                <span className="text-gray-500">
                  2FA: {selectedAudit.two_factor_verified ? 'Verified' : 'None'} • Remember: {selectedAudit.remember_me ? 'Yes' : 'No'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 font-medium block uppercase tracking-wider text-[10px]">
                  {lang === 'kh' ? 'វគ្គការងារ (Session ID)' : 'Session ID'}
                </span>
                <span className="font-mono text-[11px] text-gray-700 truncate block mt-0.5">
                  {selectedAudit.session_id || '—'}
                </span>
                <span className="text-gray-500">
                  {selectedAudit.logout_at ? `Ended at: ${new Date(selectedAudit.logout_at).toLocaleTimeString()}` : 'Live Active Session'}
                </span>
              </div>
            </div>

            {/* User Agent String */}
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs">
              <span className="text-gray-400 font-medium block uppercase tracking-wider text-[10px] mb-1">
                Raw User-Agent Header
              </span>
              <p className="font-mono text-[11px] text-gray-600 break-all bg-white p-2.5 rounded-lg border border-gray-200">
                {selectedAudit.user_agent || 'Not captured'}
              </p>
            </div>

            {/* Failure Reason if present */}
            {selectedAudit.failure_reason && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                <span className="text-rose-700 font-bold block mb-0.5">
                  {lang === 'kh' ? 'មូលហេតុនៃការបរាជ័យ' : 'Authentication Failure Reason'}
                </span>
                <p className="text-rose-600">{selectedAudit.failure_reason}</p>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              {selectedAudit.status === 'SUCCESS' && !selectedAudit.logout_at ? (
                <button
                  onClick={() => handleForceLogout(selectedAudit)}
                  disabled={terminatingId === selectedAudit.id}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{lang === 'kh' ? 'បង្ខំបញ្ចប់វគ្គការងារ' : 'Force Terminate Session'}</span>
                </button>
              ) : <div />}

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {lang === 'kh' ? 'បិទ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
