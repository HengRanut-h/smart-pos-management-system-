import React, { useState, useEffect, useMemo } from 'react';
import { StaffBadgeCard, StaffBadgeTemplate, BadgeMetrics } from './types';
import { StaffBadgeCardPreview } from './StaffBadgeCardPreview';
import { StaffBadgeDesignerStudio } from './StaffBadgeDesignerStudio';
import { StaffBadgeScannerModal } from './StaffBadgeScannerModal';
import {
  getStaffBadgeCards,
  getStaffBadgeTemplates,
  getStaffBadgeMetrics,
  updateStaffBadgeStatus,
  replaceStaffBadge,
  bindStaffBadgeNfc,
  issueStaffBadge,
  deleteStaffBadgeTemplate,
} from '../../data-access/posApi';
import { getEmployees } from '../../data-access/posApi';
import { useApp } from '../../application/context/AppContext';
import {
  CreditCard,
  Plus,
  Printer,
  Search,
  RefreshCw,
  SlidersHorizontal,
  Wifi,
  QrCode,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  X,
  Lock,
  Layers,
  Sparkles,
  Users,
  Eye,
  ScanLine,
  FileSpreadsheet,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';

export const StaffBadgeManagementHub: React.FC = () => {
  const { lang, notify } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'REGISTRY' | 'TEMPLATES' | 'BATCH_PRINT'>('REGISTRY');
  const [badges, setBadges] = useState<StaffBadgeCard[]>([]);
  const [templates, setTemplates] = useState<StaffBadgeTemplate[]>([]);
  const [metrics, setMetrics] = useState<BadgeMetrics | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [cardViewMode, setCardViewMode] = useState<'auto' | 'table' | 'grid'>('auto');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isSinglePrintModalOpen, setIsSinglePrintModalOpen] = useState(false);
  const [selectedBadgeForPrint, setSelectedBadgeForPrint] = useState<StaffBadgeCard | null>(null);
  const [activePrintSide, setActivePrintSide] = useState<'FRONT' | 'BACK'>('FRONT');

  // Studio Mode State
  const [editingTemplate, setEditingTemplate] = useState<StaffBadgeTemplate | null>(null);

  // Action Modals (Status, Replace, NFC)
  const [activeActionModal, setActiveActionModal] = useState<{
    type: 'STATUS' | 'REPLACE' | 'NFC';
    badge: StaffBadgeCard;
  } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionNfcUid, setActionNfcUid] = useState('');
  const [targetStatus, setTargetStatus] = useState('BLOCKED');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // New Issue Form State
  const [newEmployeeId, setNewEmployeeId] = useState<number | ''>('');
  const [newTemplateId, setNewTemplateId] = useState<number | ''>('');
  const [newNfcUid, setNewNfcUid] = useState('');
  const [isIssuing, setIsIssuing] = useState(false);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [cardsData, tmplData, metricsData, empData] = await Promise.all([
        getStaffBadgeCards(),
        getStaffBadgeTemplates(),
        getStaffBadgeMetrics(),
        getEmployees(),
      ]);

      setBadges(cardsData);
      setTemplates(tmplData);
      setMetrics(metricsData);
      setEmployees(empData || []);
    } catch (err) {
      console.error('Failed to load badges data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Cards
  const filteredBadges = useMemo(() => {
    return badges.filter((b) => {
      const matchesSearch =
        b.badge_number.toLowerCase().includes(search.toLowerCase()) ||
        b.card_number.toLowerCase().includes(search.toLowerCase()) ||
        (b.nfc_uid && b.nfc_uid.toLowerCase().includes(search.toLowerCase())) ||
        (b.employee?.first_name && b.employee.first_name.toLowerCase().includes(search.toLowerCase())) ||
        (b.employee?.last_name && b.employee.last_name.toLowerCase().includes(search.toLowerCase())) ||
        (b.employee?.employee_code && b.employee.employee_code.toLowerCase().includes(search.toLowerCase()));

      if (statusFilter === 'ALL') return matchesSearch;
      return matchesSearch && b.status === statusFilter;
    });
  }, [badges, search, statusFilter]);

  // Handle Status Update
  const handleUpdateStatus = async () => {
    if (!activeActionModal) return;
    setIsSubmittingAction(true);
    try {
      await updateStaffBadgeStatus(activeActionModal.badge.id, targetStatus, actionReason);
      notify.success(
        lang === 'kh' ? 'ស្ថានភាពប័ណ្ណត្រូវបានកែប្រែ' : `Card status updated to ${targetStatus}`,
        'Status Updated'
      );
      await loadData();
      setActiveActionModal(null);
      setActionReason('');
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to update card status');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle Card Replacement
  const handleReplaceCard = async () => {
    if (!activeActionModal || !actionReason.trim()) {
      notify.warning(lang === 'kh' ? 'សូមបញ្ជាក់មូលហេតុ' : 'Please provide a reason for card replacement');
      return;
    }
    setIsSubmittingAction(true);
    try {
      await replaceStaffBadge(activeActionModal.badge.id, actionReason, actionNfcUid.trim() || undefined);
      notify.success(
        lang === 'kh' ? 'ប័ណ្ណចាស់ត្រូវបានលុប និងប័ណ្ណថ្មីត្រូវបានចេញជូន' : 'Old card revoked and new replacement issued!',
        'Card Replaced'
      );
      await loadData();
      setActiveActionModal(null);
      setActionReason('');
      setActionNfcUid('');
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to replace badge');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle Bind NFC
  const handleBindNfc = async () => {
    if (!activeActionModal || !actionNfcUid.trim()) {
      notify.warning(lang === 'kh' ? 'សូមបញ្ចូលកូដ NFC UID' : 'Please enter physical NFC Card UID');
      return;
    }
    setIsSubmittingAction(true);
    try {
      await bindStaffBadgeNfc(activeActionModal.badge.id, actionNfcUid.trim());
      notify.success(lang === 'kh' ? 'បានភ្ជាប់កាត NFC ជោគជ័យ' : 'Physical NFC Card UID bound successfully!');
      await loadData();
      setActiveActionModal(null);
      setActionNfcUid('');
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to bind NFC UID');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle Issue Badge
  const handleIssueBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployeeId) {
      notify.warning(lang === 'kh' ? 'សូមជ្រើសរើសបុគ្គលិក' : 'Please select an employee');
      return;
    }
    setIsIssuing(true);
    try {
      await issueStaffBadge({
        employee_id: newEmployeeId,
        template_id: newTemplateId || undefined,
        nfc_uid: newNfcUid.trim() || undefined,
      });
      notify.success(
        lang === 'kh' ? 'បានចេញប័ណ្ណបុគ្គលិកថ្មីជោគជ័យ!' : 'New staff badge issued and activated!',
        'Badge Issued'
      );
      await loadData();
      setIsIssueModalOpen(false);
      setNewEmployeeId('');
      setNewTemplateId('');
      setNewNfcUid('');
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to issue staff badge');
    } finally {
      setIsIssuing(false);
    }
  };

  // If in Visual Studio Mode:
  if (editingTemplate) {
    return (
      <StaffBadgeDesignerStudio
        template={editingTemplate}
        onSave={() => {
          loadData();
          setEditingTemplate(null);
        }}
        onBackToList={() => setEditingTemplate(null)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {lang === 'kh' ? 'ប័ណ្ណសម្គាល់ខ្លួនបុគ្គលិក & កាតស្កេន' : 'Staff ID Badges & Scannable Cards'}
            </h1>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
              Enterprise Identity v3.0
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Visual WYSIWYG badge designer, CR80 PVC duplex printing, secure opaque QR tokens, NFC card mapping & POS manager overrides.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={loadData}
            className="p-2.5 bg-white border border-gray-200 text-gray-600 hover:text-gray-900 rounded-xl text-xs font-bold transition shadow-xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Scanner Simulator Trigger */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs transition"
            title="Open Scannable Simulator to test QR or Barcode verification"
          >
            <ScanLine className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Live Scanner Simulator</span>
          </button>

          {/* Issue New Badge */}
          <button
            onClick={() => setIsIssueModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Staff Card</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Staff Cards</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-gray-900 font-mono block">
            {metrics?.total_cards ?? badges.length}
          </span>
          <span className="text-[11px] text-gray-500">Registered card identities</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Credentials</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-emerald-600 font-mono block">
            {metrics?.active_cards ?? badges.filter((b) => b.status === 'ACTIVE').length}
          </span>
          <span className="text-[11px] text-gray-500">Authorized for attendance & POS</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Blocked / Lost Cards</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-2xl font-black text-rose-600 font-mono block">
            {(metrics?.blocked_cards ?? 0) + (metrics?.lost_cards ?? 0)}
          </span>
          <span className="text-[11px] text-gray-500">Revoked & quarantined tokens</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Scans</span>
            <ScanLine className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-gray-900 font-mono block">
            {metrics?.today_scans ?? 0}
          </span>
          <span className="text-[11px] text-gray-500 font-mono">
            {metrics?.failed_scans ?? 0} failed scan attempts
          </span>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-gray-200 bg-white px-4 rounded-2xl shadow-xs gap-4">
        {[
          { id: 'REGISTRY', label: 'Staff Card Registry', labelKh: 'បញ្ជីប័ណ្ណបុគ្គលិក' },
          { id: 'TEMPLATES', label: 'Badge Templates & Visual Designer', labelKh: 'គំរូប័ណ្ណ & រចនា' },
          { id: 'BATCH_PRINT', label: 'Batch Print Production (A4 / PVC)', labelKh: 'បោះពុម្ពជាក្រុម' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`py-4 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
              activeSubTab === tab.id
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>{lang === 'kh' ? tab.labelKh : tab.label}</span>
          </button>
        ))}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: CARDS REGISTRY                                     */}
      {/* ========================================================= */}
      {activeSubTab === 'REGISTRY' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by employee name, code, badge number, or NFC UID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between sm:justify-end space-x-2 w-full sm:w-auto self-end">
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
                {['ALL', 'ACTIVE', 'BLOCKED', 'LOST', 'EXPIRED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    statusFilter === st
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {st}
                </button>
              ))}
              </div>

              {/* Table / Card View Mode Toggle */}
              <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setCardViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs transition ${
                    cardViewMode === 'table' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                  title="Table View"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCardViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs transition ${
                    cardViewMode === 'grid' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                  title="Card View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Cards Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-12 text-center text-xs text-gray-400">Loading staff credentials...</div>
            ) : filteredBadges.length === 0 ? (
              <div className="p-12 text-center text-gray-400 space-y-2">
                <CreditCard className="w-10 h-10 mx-auto text-gray-300 stroke-1" />
                <p className="text-xs">No staff cards found matching your filter criteria.</p>
              </div>
            ) : (
              <>
                <div className={cardViewMode === "grid" ? "hidden" : cardViewMode === "table" ? "overflow-x-auto" : "hidden md:block overflow-x-auto"}>
                  <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="p-4">Employee</th>
                      <th className="p-4">Badge #</th>
                      <th className="p-4">Card ID</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">NFC Hardware UID</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredBadges.map((badge) => {
                      const emp = badge.employee;
                      return (
                        <tr key={badge.id} className="hover:bg-gray-50/80 transition">
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-full bg-slate-100 border border-gray-200 flex items-center justify-center font-bold text-slate-700 overflow-hidden shrink-0">
                                {emp?.first_name?.charAt(0) || 'E'}
                              </div>
                              <div>
                                <span className="font-bold text-gray-900 block">
                                  {emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown Employee'}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono">
                                  {emp?.employee_code} • {emp?.branch?.name || 'Headquarters'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 font-mono font-bold text-emerald-700">
                            {badge.badge_number}
                          </td>

                          <td className="p-4 font-mono text-gray-600">
                            {badge.card_number}
                          </td>

                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-bold rounded-lg text-[10px] uppercase">
                              {badge.badge_type}
                            </span>
                          </td>

                          <td className="p-4">
                            {badge.nfc_uid ? (
                              <div className="flex items-center space-x-1.5 text-slate-800 font-mono text-[11px]">
                                <Wifi className="w-3.5 h-3.5 text-amber-500 rotate-90" />
                                <span>{badge.nfc_uid}</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => setActiveActionModal({ type: 'NFC', badge })}
                                className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold hover:underline"
                              >
                                + Bind NFC UID
                              </button>
                            )}
                          </td>

                          <td className="p-4 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                badge.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : badge.status === 'BLOCKED'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : badge.status === 'LOST'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {badge.status}
                            </span>
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* Print / View Modal */}
                              <button
                                onClick={() => {
                                  setSelectedBadgeForPrint(badge);
                                  setIsSinglePrintModalOpen(true);
                                }}
                                className="p-2 bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 rounded-xl border border-gray-200 transition"
                                title="View & Print Card"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Status Modal Trigger */}
                              <button
                                onClick={() => setActiveActionModal({ type: 'STATUS', badge })}
                                className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200 transition"
                                title="Change Status (Block / Activate)"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </button>

                              {/* Replace Card */}
                              <button
                                onClick={() => setActiveActionModal({ type: 'REPLACE', badge })}
                                className="p-2 bg-gray-50 hover:bg-amber-50 text-gray-700 hover:text-amber-800 rounded-xl border border-gray-200 transition"
                                title="Re-issue Replacement Badge"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile / Responsive Card View */}
              <div className={cardViewMode === "table" ? "hidden" : cardViewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 sm:p-4 bg-gray-50/50" : "grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 sm:p-4 bg-gray-50/50 md:hidden"}>
                {filteredBadges.map((badge) => {
                  const emp = badge.employee;
                  return (
                    <div
                      key={badge.id}
                      className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3"
                    >
                      {/* Top Header: Avatar, Name, Code & Status */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-gray-200 flex items-center justify-center font-bold text-slate-700 overflow-hidden shrink-0">
                            {emp?.first_name?.charAt(0) || 'E'}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-sm text-gray-900 block truncate">
                              {emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown Employee'}
                            </span>
                            <span className="text-[11px] text-gray-500 font-mono block">
                              {emp?.employee_code} • {emp?.branch?.name || 'HQ-01'}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            badge.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : badge.status === 'BLOCKED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : badge.status === 'LOST'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {badge.status}
                        </span>
                      </div>

                      {/* Card Details Pill Grid */}
                      <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-xl text-[11px]">
                        <div>
                          <span className="text-gray-400 block text-[9px] uppercase font-bold">Badge #</span>
                          <span className="font-mono font-bold text-emerald-700">{badge.badge_number}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[9px] uppercase font-bold">Card ID</span>
                          <span className="font-mono text-gray-700">{badge.card_number}</span>
                        </div>
                        <div className="col-span-2 flex items-center justify-between pt-1 border-t border-gray-200/50">
                          <span className="text-gray-400 text-[10px] uppercase font-bold">NFC UID:</span>
                          {badge.nfc_uid ? (
                            <span className="font-mono text-slate-800 text-[11px] font-semibold flex items-center space-x-1">
                              <Wifi className="w-3 h-3 text-amber-500 rotate-90" />
                              <span>{badge.nfc_uid}</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => setActiveActionModal({ type: 'NFC', badge })}
                              className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold"
                            >
                              + Bind NFC
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons Footer */}
                      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => setPreviewingBadge(badge)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View / Print</span>
                        </button>
                        <button
                          onClick={() => setActiveActionModal({ type: 'STATUS', badge })}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
                        >
                          Status
                        </button>
                        <button
                          onClick={() => setActiveActionModal({ type: 'REPLACE', badge })}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold transition"
                        >
                          Replace
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: TEMPLATES & VISUAL DESIGNER                        */}
      {/* ========================================================= */}
      {activeSubTab === 'TEMPLATES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Unlimited badge templates for staff, cashiers, warehouse workers, and contractors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-400 transition group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-black text-[10px] rounded-full uppercase">
                      {tmpl.badge_type}
                    </span>
                    {tmpl.is_default && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                        Default
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-black text-sm text-gray-900 group-hover:text-emerald-700 transition">
                      {tmpl.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                      {tmpl.orientation} • {tmpl.card_size}
                    </p>
                  </div>

                  {/* Thumbnail Miniature */}
                  <div className="py-2 flex justify-center bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                    <StaffBadgeCardPreview
                      template={tmpl}
                      side="FRONT"
                      scale={0.48}
                      showLanyardHole={false}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-mono">
                    {tmpl.badges_count || 0} Badges
                  </span>
                  <button
                    onClick={() => setEditingTemplate(tmpl)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Customize</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: BATCH PRINT PRODUCTION                             */}
      {/* ========================================================= */}
      {activeSubTab === 'BATCH_PRINT' && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-base text-gray-900 flex items-center space-x-2">
                <Printer className="w-5 h-5 text-emerald-600" />
                <span>Bulk Production & PVC Card Print Queue</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Generate high-density batch print sheets (8 cards per A4 page) or single PVC card feeds.
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print All Active ({badges.filter((b) => b.status === 'ACTIVE').length} Badges)</span>
            </button>
          </div>

          {/* Batch Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-2 print:gap-4">
            {badges
              .filter((b) => b.status === 'ACTIVE')
              .map((b) => (
                <div key={b.id} className="flex justify-center">
                  <StaffBadgeCardPreview
                    template={b.template || templates[0]}
                    employee={b.employee}
                    badge={b}
                    side="FRONT"
                    scale={0.78}
                  />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: SINGLE CARD PRINT & VIEW                           */}
      {/* ========================================================= */}
      {isSinglePrintModalOpen && selectedBadgeForPrint && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <span>Print Staff ID Card ({selectedBadgeForPrint.badge_number})</span>
              </h3>
              <button
                onClick={() => setIsSinglePrintModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Front / Back Toggle */}
            <div className="flex justify-center">
              <div className="inline-flex p-1 bg-gray-100 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setActivePrintSide('FRONT')}
                  className={`px-4 py-1.5 rounded-lg transition ${
                    activePrintSide === 'FRONT' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600'
                  }`}
                >
                  Front Side
                </button>
                <button
                  onClick={() => setActivePrintSide('BACK')}
                  className={`px-4 py-1.5 rounded-lg transition ${
                    activePrintSide === 'BACK' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600'
                  }`}
                >
                  Back Side
                </button>
              </div>
            </div>

            {/* Live Card Preview */}
            <div className="py-4 flex justify-center overflow-hidden">
              <StaffBadgeCardPreview
                template={selectedBadgeForPrint.template || templates[0]}
                employee={selectedBadgeForPrint.employee}
                badge={selectedBadgeForPrint}
                side={activePrintSide}
                scale={0.9}
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <span className="text-[11px] text-gray-400 font-mono">CR80 PVC Duplex Standard</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsSinglePrintModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Card</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ISSUE NEW BADGE FORM                               */}
      {/* ========================================================= */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center space-x-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>Issue New Staff Card</span>
              </h3>
              <button
                onClick={() => setIsIssueModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueBadge} className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Select Staff Member *
                </label>
                <select
                  required
                  value={newEmployeeId}
                  onChange={(e) => setNewEmployeeId(Number(e.target.value))}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.first_name} {e.last_name} ({e.employee_code || `EMP-${e.id}`})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Badge Design Template
                </label>
                <select
                  value={newTemplateId}
                  onChange={(e) => setNewTemplateId(Number(e.target.value))}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                >
                  <option value="">Default Active Template</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.orientation} {t.card_size})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Physical NFC / RFID Card UID (Optional)
                </label>
                <input
                  type="text"
                  value={newNfcUid}
                  onChange={(e) => setNewNfcUid(e.target.value)}
                  placeholder="e.g. 04:A2:3B:5C:7D:8E"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isIssuing}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs transition"
                >
                  {isIssuing ? 'Generating...' : 'Issue & Activate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ACTION DIALOGS (STATUS / REPLACE / NFC)            */}
      {/* ========================================================= */}
      {activeActionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center space-x-2">
                {activeActionModal.type === 'STATUS' && <Lock className="w-5 h-5 text-rose-600" />}
                {activeActionModal.type === 'REPLACE' && <RotateCcw className="w-5 h-5 text-amber-600" />}
                {activeActionModal.type === 'NFC' && <Wifi className="w-5 h-5 text-emerald-600" />}
                <span>
                  {activeActionModal.type === 'STATUS' && 'Update Card Status'}
                  {activeActionModal.type === 'REPLACE' && 'Re-issue Replacement Badge'}
                  {activeActionModal.type === 'NFC' && 'Map Physical NFC UID'}
                </span>
              </h3>
              <button
                onClick={() => setActiveActionModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-600">
              Target Card: <strong>{activeActionModal.badge.badge_number}</strong> ({activeActionModal.badge.employee?.first_name} {activeActionModal.badge.employee?.last_name})
            </p>

            {activeActionModal.type === 'STATUS' && (
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Select New Status</label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                  >
                    <option value="ACTIVE">ACTIVE (Authorize card)</option>
                    <option value="BLOCKED">BLOCKED (Immediately revoke access)</option>
                    <option value="LOST">LOST (Report lost card)</option>
                    <option value="EXPIRED">EXPIRED (Deactivate token)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Reason / Notes</label>
                  <input
                    type="text"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="e.g. Employee reported misplaced badge"
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>
            )}

            {activeActionModal.type === 'REPLACE' && (
              <div className="space-y-3">
                <p className="text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-[11px]">
                  Old card will be permanently marked as <strong>REPLACED</strong> and a brand new cryptographic QR token will be generated.
                </p>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Replacement Reason *</label>
                  <input
                    type="text"
                    required
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="e.g. Broken chip or physical wear"
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">New NFC UID (Optional)</label>
                  <input
                    type="text"
                    value={actionNfcUid}
                    onChange={(e) => setActionNfcUid(e.target.value)}
                    placeholder="e.g. 04:B1:4C:6D:8E:9F"
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-mono"
                  />
                </div>
              </div>
            )}

            {activeActionModal.type === 'NFC' && (
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Physical NFC Card UID *</label>
                  <input
                    type="text"
                    required
                    value={actionNfcUid}
                    onChange={(e) => setActionNfcUid(e.target.value)}
                    placeholder="e.g. 04:A2:3B:5C:7D:8E"
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-mono"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActiveActionModal(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={() => {
                  if (activeActionModal.type === 'STATUS') handleUpdateStatus();
                  else if (activeActionModal.type === 'REPLACE') handleReplaceCard();
                  else if (activeActionModal.type === 'NFC') handleBindNfc();
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs transition"
              >
                {isSubmittingAction ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SCANNER SIMULATOR MODAL                                   */}
      {/* ========================================================= */}
      <StaffBadgeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
};
