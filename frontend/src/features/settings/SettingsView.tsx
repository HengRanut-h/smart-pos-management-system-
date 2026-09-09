import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../application/context/AppContext';
import { TelegramBotConfigSection } from '../backup/TelegramBotConfigSection';
import {
  CompanyInfo,
  BranchItem,
  BranchPosTerminalItem,
  BranchPrinterItem,
  BranchNumberSequenceItem,
  BranchBusinessHourItem,
  BranchHolidayItem,
  BranchUserItem,
  SystemAuditLogItem,
  NotificationSettingRow,
  SettingsSubSection,
} from '../../foundation/types/settings';
import {
  getSystemSettingsDetailed,
  updateSystemSettingsDetailed,
  getCompanyProfile,
  updateCompanyProfile,
  getBranchesList,
  getBranchDetails,
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchOverrides,
  saveBranchOverrides,
  getBranchMergedSettings,
  getBranchTerminals,
  saveBranchTerminal,
  deleteBranchTerminal,
  getBranchPrinters,
  saveBranchPrinter,
  deleteBranchPrinter,
  getBranchSequences,
  saveBranchSequence,
  getBranchHours,
  saveBranchHours,
  getHolidays,
  saveHoliday,
  deleteHoliday,
  getBranchStaffUsers,
  assignBranchStaffUser,
  removeBranchStaffUser,
  getSettingsNotificationMatrix,
  saveSettingsNotificationMatrix,
  getSettingAuditLogs,
  uploadStoreLogo,
  getAdminUsers,
} from '../../data-access/posApi';
import {
  Settings,
  Building2,
  MapPin,
  SlidersHorizontal,
  Users,
  Calendar,
  FileText,
  Coins,
  Boxes,
  DollarSign,
  Printer,
  Globe,
  Bell,
  Bot,
  Lock,
  Database,
  Terminal,
  Save,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Eye,
  AlertCircle,
  Clock,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Search,
  ExternalLink,
  QrCode,
  Upload,
  Check,
  X,
  Layers,
  Store,
  Info,
  RotateCcw,
  Zap,
  Play,
  AlertTriangle,
} from 'lucide-react';
import { useNotification } from '../../application/context/NotificationContext';
import { DEFAULT_NOTIFICATION_POLICY, NotificationPolicyConfig } from '../../foundation/types/notification';

export const SettingsView: React.FC = () => {
  const { lang, setLang, settingsSubTab, setSettingsSubTab, updateStoreSettingsState, setActiveTab, confirmDelete, confirmAction } = useApp();

  // Selected branch: null = Global System Defaults, number = specific branch ID
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

  // Core Data States
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Global Notification Policy Architecture State
  const { policyConfig, updatePolicyConfig, resetPolicyConfig, notify } = useNotification();
  const [tempPolicyConfig, setTempPolicyConfig] = useState<NotificationPolicyConfig>(policyConfig);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  useEffect(() => {
    setTempPolicyConfig(policyConfig);
  }, [policyConfig]);

  // Global & Company
  const [globalSettings, setGlobalSettings] = useState<Record<string, any>>({});
  const [company, setCompany] = useState<CompanyInfo | null>(null);

  // Branches
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [currentBranch, setCurrentBranch] = useState<BranchItem | null>(null);
  const [branchOverrides, setBranchOverrides] = useState<Record<string, string>>({});

  // Sub-resources for selected branch
  const [terminals, setTerminals] = useState<BranchPosTerminalItem[]>([]);
  const [printers, setPrinters] = useState<BranchPrinterItem[]>([]);
  const [sequences, setSequences] = useState<BranchNumberSequenceItem[]>([]);
  const [businessHours, setBusinessHours] = useState<BranchBusinessHourItem[]>([]);
  const [holidays, setHolidays] = useState<BranchHolidayItem[]>([]);
  const [branchUsers, setBranchUsers] = useState<BranchUserItem[]>([]);
  const [availableStaffUsers, setAvailableStaffUsers] = useState<any[]>([]);

  // Notifications & Audits
  const [notificationMatrix, setNotificationMatrix] = useState<NotificationSettingRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<SystemAuditLogItem[]>([]);

  // Modals
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchForm, setBranchForm] = useState<Partial<BranchItem>>({
    code: '',
    name: '',
    branch_type: 'RETAIL_STORE',
    address: '',
    city: 'Phnom Penh',
    phone: '',
    email: '',
    manager_name: '',
    opening_date: new Date().toISOString().split('T')[0],
    tax_rate: 10,
    currency_code: 'USD',
    timezone: 'Asia/Phnom_Penh',
  });

  const [isTerminalModalOpen, setIsTerminalModalOpen] = useState(false);
  const [terminalForm, setTerminalForm] = useState<Partial<BranchPosTerminalItem>>({
    terminal_code: '',
    terminal_name: '',
    status: 'ONLINE',
    cash_drawer_enabled: true,
    auto_print: true,
    receipt_copies: 1,
  });

  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [printerForm, setPrinterForm] = useState<Partial<BranchPrinterItem>>({
    printer_name: '',
    printer_type: 'RECEIPT_80MM',
    connection_type: 'NETWORK_LAN',
    ip_address: '192.168.1.200',
    port: 9100,
    paper_width_mm: 80,
    is_default: true,
    auto_cut: true,
    cash_drawer_kick: true,
    status: 'ONLINE',
  });

  const [isAssignUserModalOpen, setIsAssignUserModalOpen] = useState(false);
  const [assignUserForm, setAssignUserForm] = useState<{
    user_id: number;
    assigned_role: string;
    permissions: string[];
  }>({
    user_id: 1,
    assigned_role: 'CASHIER',
    permissions: ['branch.view', 'branch.manage_pos'],
  });

  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidayForm, setHolidayForm] = useState<Partial<BranchHolidayItem>>({
    name: '',
    holiday_date: new Date().toISOString().split('T')[0],
    is_closed: false,
    note: '',
  });

  // Logo upload
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Show Toast
  const triggerSuccess = (msg: string) => {
    notify.success(msg);
  };

  // Initial Load
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [sysRes, compRes, branchListRes, auditRes] = await Promise.all([
        getSystemSettingsDetailed(),
        getCompanyProfile(),
        getBranchesList(),
        getSettingAuditLogs(50),
      ]);
      setGlobalSettings(sysRes);
      setCompany(compRes);
      setBranches(branchListRes);
      setAuditLogs(auditRes);

      // Load users for branch assignment dropdown
      getAdminUsers().then(setAvailableStaffUsers).catch(() => {});
    } catch (err) {
      console.error('Failed to load settings data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // When selected branch changes, load branch-specific data
  useEffect(() => {
    if (selectedBranchId) {
      setIsLoading(true);
      Promise.all([
        getBranchDetails(selectedBranchId),
        getBranchOverrides(selectedBranchId),
        getBranchTerminals(selectedBranchId),
        getBranchPrinters(selectedBranchId),
        getBranchSequences(selectedBranchId),
        getBranchHours(selectedBranchId),
        getBranchStaffUsers(selectedBranchId),
        getHolidays(selectedBranchId),
      ])
        .then(([bDetails, overrides, terms, prints, seqs, hrs, users, hols]) => {
          setCurrentBranch(bDetails);
          setBranchOverrides(overrides);
          setTerminals(terms);
          setPrinters(prints);
          setSequences(seqs);
          setBusinessHours(hrs);
          setBranchUsers(users);
          setHolidays(hols);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      setCurrentBranch(null);
      setBranchOverrides({});
      // Load global holidays & notifications
      getHolidays().then(setHolidays).catch(() => {});
      getSettingsNotificationMatrix().then(setNotificationMatrix).catch(() => {});
    }
  }, [selectedBranchId]);

  // Handle Logo Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      notify.warning('Logo image must be less than 5 MB.', 'Image Size Warning');
      return;
    }
    setIsUploadingLogo(true);
    try {
      const res = await uploadStoreLogo(file);
      if (res.success && res.image_url) {
        setGlobalSettings((prev) => ({ ...prev, store_logo_url: res.image_url, company_logo_url: res.image_url }));
        if (company) {
          setCompany({ ...company, logo_url: res.image_url });
        }
        triggerSuccess(lang === 'kh' ? 'ឡូហ្គោត្រូវបានបង្ហោះជោគជ័យ!' : 'Store logo uploaded successfully!');
      }
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to upload logo.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Save Global Settings
  const handleSaveGlobalSettings = async (fieldsToSave: Record<string, any>) => {
    setIsSaving(true);
    try {
      await updateSystemSettingsDetailed(fieldsToSave);
      setGlobalSettings((prev) => ({ ...prev, ...fieldsToSave }));
      updateStoreSettingsState(fieldsToSave as any);
      triggerSuccess(lang === 'kh' ? 'ការកំណត់ត្រូវបានរក្សាទុកដោយជោគជ័យ!' : 'System settings saved successfully!');
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Company Profile
  const handleSaveCompany = async () => {
    if (!company) return;
    setIsSaving(true);
    try {
      const updated = await updateCompanyProfile(company);
      setCompany(updated);
      triggerSuccess(lang === 'kh' ? 'ព័ត៌មានក្រុមហ៊ុនត្រូវបានធ្វើបច្ចុប្បន្នភាព!' : 'Company profile updated successfully!');
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to update company.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Branch Overrides
  const handleSaveBranchOverrides = async (newOverrides: Record<string, any>) => {
    if (!selectedBranchId) return;
    setIsSaving(true);
    try {
      await saveBranchOverrides(selectedBranchId, newOverrides);
      setBranchOverrides((prev) => ({ ...prev, ...newOverrides }));
      triggerSuccess(lang === 'kh' ? 'ការកំណត់ដោយឡែកសាខាត្រូវបានរក្សាទុក!' : 'Branch-specific overrides saved!');
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to save branch overrides.');
    } finally {
      setIsSaving(false);
    }
  };

  // Branch CRUD
  const handleSaveBranchModal = async () => {
    if (!branchForm.code || !branchForm.name) {
      notify.warning('Branch Code and Name are required.', 'Required Fields');
      return;
    }
    setIsSaving(true);
    try {
      if (branchForm.id) {
        const updated = await updateBranch(branchForm.id, branchForm);
        setBranches((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        if (selectedBranchId === updated.id) setCurrentBranch(updated);
        triggerSuccess(lang === 'kh' ? 'សាខាត្រូវបានកែប្រែជោគជ័យ!' : 'Branch updated successfully!');
      } else {
        const created = await createBranch(branchForm);
        setBranches((prev) => [...prev, created]);
        triggerSuccess(lang === 'kh' ? 'បានបង្កើតសាខាថ្មីដោយជោគជ័យ!' : 'New branch created successfully!');
      }
      setIsBranchModalOpen(false);
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to save branch.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBranch = async (id: number) => {
    const ok = await confirmDelete({
      title: lang === 'kh' ? 'ផ្អាកដំណើរការសាខា?' : 'Deactivate Branch?',
      message: lang === 'kh' ? 'តើអ្នកពិតជាចង់ផ្អាកដំណើរការសាខានេះមែនទេ?' : 'Are you sure you want to deactivate this branch?',
      confirmText: lang === 'kh' ? 'ផ្អាកដំណើរការ' : 'Deactivate',
    });
    if (!ok) return;
    try {
      await deleteBranch(id);
      setBranches((prev) => prev.filter((b) => b.id !== id));
      if (selectedBranchId === id) setSelectedBranchId(null);
      triggerSuccess(lang === 'kh' ? 'បានលុបសាខារួចរាល់!' : 'Branch deleted successfully!');
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to delete branch.');
    }
  };

  // Terminal Actions
  const handleSaveTerminal = async () => {
    const branchId = selectedBranchId || 1;
    if (!terminalForm.terminal_code || !terminalForm.terminal_name) {
      notify.warning('Terminal Code and Name are required.', 'Required Fields');
      return;
    }
    setIsSaving(true);
    try {
      const saved = await saveBranchTerminal({ ...terminalForm, branch_id: branchId });
      setTerminals((prev) => {
        const idx = prev.findIndex((t) => t.id === saved.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [...prev, saved];
      });
      setIsTerminalModalOpen(false);
      triggerSuccess(lang === 'kh' ? 'បានរក្សាទុកឧបករណ៍ POS!' : 'POS Terminal saved!');
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to save POS Terminal.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTerminal = async (id: number) => {
    const ok = await confirmDelete({
      title: lang === 'kh' ? 'លុបស្ថានីយ POS?' : 'Delete POS Terminal?',
      message: lang === 'kh' ? 'តើអ្នកពិតជាចង់លុបស្ថានីយ POS នេះមែនទេ?' : 'Are you sure you want to delete this POS terminal?',
    });
    if (!ok) return;
    try {
      await deleteBranchTerminal(id);
      setTerminals((prev) => prev.filter((t) => t.id !== id));
      triggerSuccess('Terminal removed.');
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to remove terminal.');
    }
  };

  // Printer Actions
  const handleSavePrinter = async () => {
    const branchId = selectedBranchId || 1;
    if (!printerForm.printer_name) {
      notify.warning('Printer name is required.', 'Required Fields');
      return;
    }
    setIsSaving(true);
    try {
      const saved = await saveBranchPrinter({ ...printerForm, branch_id: branchId });
      setPrinters((prev) => {
        const idx = prev.findIndex((p) => p.id === saved.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [...prev, saved];
      });
      setIsPrinterModalOpen(false);
      triggerSuccess(lang === 'kh' ? 'ម៉ាស៊ីនបោះពុម្ពត្រូវបានរក្សាទុក!' : 'Printer hardware saved!');
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to save printer.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePrinter = async (id: number) => {
    const ok = await confirmDelete({
      title: lang === 'kh' ? 'លុបម៉ាស៊ីនបោះពុម្ព?' : 'Delete Printer?',
      message: lang === 'kh' ? 'តើអ្នកពិតជាចង់លុបម៉ាស៊ីនបោះពុម្ពនេះមែនទេ?' : 'Are you sure you want to delete this printer?',
    });
    if (!ok) return;
    try {
      await deleteBranchPrinter(id);
      setPrinters((prev) => prev.filter((p) => p.id !== id));
      triggerSuccess('Printer removed.');
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to delete printer.');
    }
  };

  // Sequence Save
  const handleSaveSequence = async (seq: BranchNumberSequenceItem) => {
    try {
      const updated = await saveBranchSequence(seq);
      setSequences((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      triggerSuccess(lang === 'kh' ? 'ទម្រង់លេខកូដត្រូវបានធ្វើបច្ចុប្បន្នភាព!' : 'Numbering sequence updated!');
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to save sequence.');
    }
  };

  // User Assignment
  const handleAssignUser = async () => {
    const branchId = selectedBranchId || 1;
    try {
      await assignBranchStaffUser({
        branch_id: branchId,
        user_id: assignUserForm.user_id,
        assigned_role: assignUserForm.assigned_role,
        permissions: assignUserForm.permissions,
        is_active: true,
      });
      getBranchStaffUsers(branchId).then(setBranchUsers);
      setIsAssignUserModalOpen(false);
      triggerSuccess(lang === 'kh' ? 'បានចាត់តាំងបុគ្គលិកទៅសាខា!' : 'Staff assigned to branch!');
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to assign staff.');
    }
  };

  const handleRemoveBranchUser = async (id: number) => {
    const ok = await confirmDelete({
      title: lang === 'kh' ? 'ដកសិទ្ធិបុគ្គលិក?' : 'Remove Staff Access?',
      message: lang === 'kh' ? 'តើអ្នកពិតជាចង់ដកសិទ្ធិបុគ្គលិកនេះពីសាខាមែនទេ?' : 'Are you sure you want to remove staff access from this branch?',
    });
    if (!ok) return;
    try {
      await removeBranchStaffUser(id);
      setBranchUsers((prev) => prev.filter((u) => u.id !== id));
      triggerSuccess('Staff assignment removed.');
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to remove staff.');
    }
  };

  // Holiday Actions
  const handleSaveHoliday = async () => {
    if (!holidayForm.name || !holidayForm.holiday_date) {
      notify.warning('Holiday name and date are required.', 'Required Fields');
      return;
    }
    try {
      const saved = await saveHoliday({
        ...holidayForm,
        branch_id: selectedBranchId,
      });
      setHolidays((prev) => [...prev, saved]);
      setIsHolidayModalOpen(false);
      triggerSuccess(lang === 'kh' ? 'បានបន្ថែមថ្ងៃឈប់សម្រាក!' : 'Holiday added!');
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to save holiday.');
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    const ok = await confirmDelete({
      title: lang === 'kh' ? 'លុបថ្ងៃឈប់សម្រាក?' : 'Delete Holiday?',
      message: lang === 'kh' ? 'តើអ្នកពិតជាចង់លុបកំណត់ត្រាថ្ងៃឈប់សម្រាកនេះមែនទេ?' : 'Are you sure you want to delete this holiday record?',
    });
    if (!ok) return;
    try {
      await deleteHoliday(id);
      setHolidays((prev) => prev.filter((h) => h.id !== id));
      triggerSuccess('Holiday removed.');
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to remove holiday.');
    }
  };

  const currentTab = (settingsSubTab || 'SYSTEM') as SettingsSubSection;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Top Banner & Branch Context Switcher */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  {lang === 'kh' ? 'ការកំណត់ប្រព័ន្ធ និងសាខា' : 'System & Branch Settings'}
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    SmartPOS Enterprise
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'kh'
                    ? 'គ្រប់គ្រងការកំណត់ទូទៅរបស់ប្រព័ន្ធ និងការកំណត់ដោយឡែកតាមសាខាហាងនីមួយៗ'
                    : 'Configure global system defaults with independent multi-store/branch overrides'}
                </p>
              </div>
            </div>
          </div>

          {/* Branch Context Selector */}
          <div className="flex items-center space-x-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 pl-2">
              {lang === 'kh' ? 'បរិបទគ្រប់គ្រង:' : 'Config Scope:'}
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setSelectedBranchId(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  selectedBranchId === null
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                {lang === 'kh' ? '🌐 ប្រព័ន្ធទូទៅ (Global)' : '🌐 Global System'}
              </button>

              <select
                value={selectedBranchId || ''}
                onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition focus:outline-hidden ${
                  selectedBranchId !== null
                    ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                    : 'bg-white border-slate-300 text-slate-700'
                }`}
              >
                <option value="">
                  {lang === 'kh' ? '-- ជ្រើសរើសសាខាដើម្បីកែប្រែដោយឡែក --' : '-- Select Branch for Override --'}
                </option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    🏬 {b.code} — {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Override indicator alert if branch selected */}
        {selectedBranchId && currentBranch && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {lang === 'kh'
                  ? `អ្នកកំពុងកែប្រែការកំណត់ដោយឡែកសម្រាប់៖ [${currentBranch.code}] ${currentBranch.name}។ ការកំណត់ទាំងនេះនឹងបដិសេធតម្លៃដើមរបស់ប្រព័ន្ធទូទៅ។`
                  : `Currently editing Branch Overrides for: [${currentBranch.code}] ${currentBranch.name}. Settings here override global system defaults.`}
              </span>
            </div>
            <button
              onClick={() => setSelectedBranchId(null)}
              className="text-amber-800 hover:underline font-bold shrink-0 ml-4"
            >
              {lang === 'kh' ? 'ត្រឡប់ទៅ Global វិញ' : 'Switch back to Global'}
            </button>
          </div>
        )}
      </div>

      {/* Main Content Panel */}
      <div className="flex-1 overflow-y-auto p-6">

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-sm font-medium">
                {lang === 'kh' ? 'កំពុងផ្ទុកទិន្នន័យការកំណត់...' : 'Loading settings configuration...'}
              </p>
            </div>
          ) : (
            <>
              {/* 1. SYSTEM SETTINGS */}
              {currentTab === 'SYSTEM' && (
                <div className="space-y-6 max-w-5xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {lang === 'kh' ? 'ការកំណត់ប្រព័ន្ធទូទៅ (Global System Settings)' : 'Global System Settings'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {lang === 'kh'
                          ? 'គ្រប់គ្រងឈ្មោះប្រព័ន្ធ កូដ ឡូហ្គោ និងតម្លៃលំនាំដើមទូទាំងស្ថាប័ន'
                          : 'Core global settings applied across all branches and modules'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSaveGlobalSettings(globalSettings)}
                      disabled={isSaving}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition"
                    >
                      <Save className="w-4 h-4" />
                      {lang === 'kh' ? 'រក្សាទុកការកំណត់' : 'Save System Settings'}
                    </button>
                  </div>

                  {/* General Identifiers */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                      {lang === 'kh' ? 'អត្តសញ្ញាណប្រព័ន្ធ' : 'System Identity & Defaults'}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {lang === 'kh' ? 'ឈ្មោះប្រព័ន្ធ (System Name)' : 'System Name'}
                        </label>
                        <input
                          type="text"
                          value={globalSettings.system_name || ''}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, system_name: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {lang === 'kh' ? 'កូដសម្គាល់ប្រព័ន្ធ (System Code)' : 'System Code'}
                        </label>
                        <input
                          type="text"
                          value={globalSettings.system_code || ''}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, system_code: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {lang === 'kh' ? 'សាខាលំនាំដើម (Default Branch)' : 'Default Branch'}
                        </label>
                        <select
                          value={globalSettings.default_branch_id || 1}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, default_branch_id: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden"
                        >
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.code} — {b.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {lang === 'kh' ? 'ឃ្លាំងលំនាំដើម (Default Warehouse)' : 'Default Warehouse'}
                        </label>
                        <select
                          value={globalSettings.default_warehouse_id || 1}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, default_warehouse_id: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden"
                        >
                          <option value="1">Central Warehouse (HQ)</option>
                          <option value="2">Phnom Penh Flagship Storehouse</option>
                          <option value="3">Siem Reap Store Warehouse</option>
                          <option value="4">Battambang Depot</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Logo & Branding */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      {lang === 'kh' ? 'ឡូហ្គោ និងស្លាកសញ្ញាហាង' : 'Store Logo & Branding'}
                    </h3>

                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 p-1 flex items-center justify-center bg-slate-50 overflow-hidden shrink-0">
                        {globalSettings.store_logo_url || company?.logo_url ? (
                          <img
                            src={globalSettings.store_logo_url || company?.logo_url}
                            alt="Logo"
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <Building2 className="w-8 h-8 text-slate-400" />
                        )}
                      </div>

                      <div className="flex-1 space-y-2 text-left">
                        <label className="block text-xs font-semibold text-slate-700">
                          {lang === 'kh' ? 'ផ្លាស់ប្តូររូបភាពឡូហ្គោ' : 'Upload Store / Company Logo'}
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={isUploadingLogo}
                          className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                        />
                        <p className="text-[11px] text-slate-400">
                          {lang === 'kh'
                            ? 'ទម្រង់អនុញ្ញាត: PNG, JPG, WEBP, SVG (ទំហំអតិបរមា 5 MB)'
                            : 'Allowed formats: PNG, JPG, WEBP, SVG (Max 5 MB)'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. COMPANY PROFILE */}
              {currentTab === 'COMPANY' && company && (
                <div className="space-y-6 max-w-5xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {lang === 'kh' ? 'ព័ត៌មានក្រុមហ៊ុន (Company Profile)' : 'Company Profile & Registration'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {lang === 'kh'
                          ? 'ព័ត៌មានផ្លូវការ សំបុត្របញ្ជាក់ពន្ធ (TIN) និងទំនាក់ទំនងការិយាល័យកណ្តាល'
                          : 'Official legal entity details, tax identification, and corporate headquarters'}
                      </p>
                    </div>
                    <button
                      onClick={handleSaveCompany}
                      disabled={isSaving}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition"
                    >
                      <Save className="w-4 h-4" />
                      {lang === 'kh' ? 'រក្សាទុកព័ត៌មានក្រុមហ៊ុន' : 'Save Company Profile'}
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {lang === 'kh' ? 'ឈ្មោះក្រុមហ៊ុន (Trading Name)' : 'Company Trade Name'}
                        </label>
                        <input
                          type="text"
                          value={company.name || ''}
                          onChange={(e) => setCompany({ ...company, name: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {lang === 'kh' ? 'ឈ្មោះនីតិបុគ្គលផ្លូវការ (Legal Name)' : 'Legal Registered Name'}
                        </label>
                        <input
                          type="text"
                          value={company.legal_name || ''}
                          onChange={(e) => setCompany({ ...company, legal_name: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {lang === 'kh' ? 'លេខសម្គាល់សារពើពន្ធ (TIN / Tax ID)' : 'Tax Identification Number (TIN)'}
                        </label>
                        <input
                          type="text"
                          value={company.tax_id || ''}
                          onChange={(e) => setCompany({ ...company, tax_id: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {lang === 'kh' ? 'អ៊ីមែលផ្លូវការ (Email)' : 'Corporate Email'}
                        </label>
                        <input
                          type="email"
                          value={company.email || ''}
                          onChange={(e) => setCompany({ ...company, email: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {lang === 'kh' ? 'លេខទូរស័ព្ទ (Phone)' : 'HQ Phone Number'}
                        </label>
                        <input
                          type="text"
                          value={company.phone || ''}
                          onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {lang === 'kh' ? 'គេហទំព័រ (Website)' : 'Corporate Website'}
                        </label>
                        <input
                          type="text"
                          value={company.website || ''}
                          onChange={(e) => setCompany({ ...company, website: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {lang === 'kh' ? 'អាសយដ្ឋានការិយាល័យកណ្តាល (HQ Address)' : 'Headquarters Physical Address'}
                        </label>
                        <textarea
                          rows={2}
                          value={company.address || ''}
                          onChange={(e) => setCompany({ ...company, address: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. BRANCH MANAGEMENT */}
              {currentTab === 'BRANCHES' && (
                <div className="space-y-6 max-w-6xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {lang === 'kh' ? 'គ្រប់គ្រងសាខាហាង (Branch Management)' : 'Multi-Store Branch Management'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {lang === 'kh'
                          ? 'គ្រប់គ្រងរចនាសម្ព័ន្ធសាខា Head Office, Phnom Penh, Siem Reap, Battambang'
                          : 'Configure independent store locations, warehouses, terminals and working hours'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setBranchForm({
                          code: `B-0${branches.length + 1}`,
                          name: '',
                          branch_type: 'RETAIL_STORE',
                          address: '',
                          city: 'Phnom Penh',
                          phone: '',
                          email: '',
                          tax_rate: 10,
                          currency_code: 'USD',
                          timezone: 'Asia/Phnom_Penh',
                          working_hours_summary: 'Mon-Sun: 07:30 - 21:30',
                        });
                        setIsBranchModalOpen(true);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition"
                    >
                      <Plus className="w-4 h-4" />
                      {lang === 'kh' ? 'បន្ថែមសាខាថ្មី' : 'Add New Branch'}
                    </button>
                  </div>

                  {/* Branch Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {branches.map((b) => (
                      <div
                        key={b.id}
                        className={`bg-white rounded-2xl border p-5 shadow-xs transition hover:shadow-md ${
                          selectedBranchId === b.id ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-base border border-emerald-200 shrink-0">
                              {b.code.substring(0, 4)}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900">{b.name}</h3>
                              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                                  {b.branch_type}
                                </span>
                                <span>•</span>
                                <span>{b.city || 'Cambodia'}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => {
                                setBranchForm(b);
                                setIsBranchModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition"
                              title="Edit Branch"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {b.branch_type !== 'HEAD_OFFICE' && (
                              <button
                                onClick={() => handleDeleteBranch(b.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition"
                                title="Delete Branch"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Branch Metrics */}
                        <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                          <div className="p-2 bg-slate-50 rounded-xl">
                            <div className="text-xs font-bold text-slate-800">{b.pos_terminals_count || 1}</div>
                            <div className="text-[10px] text-slate-400">Terminals</div>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-xl">
                            <div className="text-xs font-bold text-slate-800">{b.warehouses_count || 1}</div>
                            <div className="text-[10px] text-slate-400">Warehouses</div>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-xl">
                            <div className="text-xs font-bold text-slate-800">{b.printers_count || 2}</div>
                            <div className="text-[10px] text-slate-400">Printers</div>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-xl">
                            <div className="text-xs font-bold text-slate-800">{b.tax_rate}%</div>
                            <div className="text-[10px] text-slate-400">Tax Rate</div>
                          </div>
                        </div>

                        {/* Quick Selection Button */}
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 truncate max-w-[200px]">
                            {b.address || 'No address specified'}
                          </span>
                          <button
                            onClick={() => setSelectedBranchId(b.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                              selectedBranchId === b.id
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700'
                            }`}
                          >
                            {selectedBranchId === b.id ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                {lang === 'kh' ? 'កំពុងជ្រើស' : 'Selected'}
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                {lang === 'kh' ? 'កែប្រែសាខានេះ' : 'Manage Overrides'}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. BRANCH SPECIFIC OVERRIDES */}
              {currentTab === 'BRANCH_SETTINGS' && (
                <div className="space-y-6 max-w-5xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {lang === 'kh' ? 'ការកំណត់ដោយឡែកតាមសាខា (Branch Overrides)' : 'Branch Specific Overrides'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {selectedBranchId && currentBranch
                          ? `Custom settings for [${currentBranch.code}] ${currentBranch.name}`
                          : 'Select a branch above to configure independent rules'}
                      </p>
                    </div>
                    {selectedBranchId && (
                      <button
                        onClick={() => handleSaveBranchOverrides(branchOverrides)}
                        disabled={isSaving}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition"
                      >
                        <Save className="w-4 h-4" />
                        {lang === 'kh' ? 'រក្សាទុកការកំណត់សាខា' : 'Save Branch Overrides'}
                      </button>
                    )}
                  </div>

                  {!selectedBranchId ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                      <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <h3 className="text-sm font-bold text-slate-700">
                        {lang === 'kh' ? 'សូមជ្រើសរើសសាខាមួយ' : 'Please select a Branch location'}
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                        {lang === 'kh'
                          ? 'ជ្រើសរើសសាខានៅផ្នែកខាងលើដើម្បីកែប្រែការកំណត់ដោយឡែកដូចជា ស្លាកវិក្កយបត្រ អត្រាពន្ធ ឬថតប្រាក់'
                          : 'Use the branch selector toolbar above to manage store-specific overrides'}
                      </p>
                      <div className="flex justify-center gap-2">
                        {branches.map((b) => (
                          <button
                            key={b.id}
                            onClick={() => setSelectedBranchId(b.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition"
                          >
                            {b.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            {lang === 'kh' ? 'អត្រាពន្ធសាខា (Branch Tax Rate %)' : 'Branch Specific VAT Rate (%)'}
                          </label>
                          <input
                            type="number"
                            value={branchOverrides.tax_rate || currentBranch?.tax_rate || '10'}
                            onChange={(e) => setBranchOverrides({ ...branchOverrides, tax_rate: e.target.value })}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            {lang === 'kh' ? 'កម្រិតព្រមានស្តុកទាប (Low Stock Threshold)' : 'Store Low Stock Threshold'}
                          </label>
                          <input
                            type="number"
                            value={branchOverrides.low_stock_threshold || '10'}
                            onChange={(e) => setBranchOverrides({ ...branchOverrides, low_stock_threshold: e.target.value })}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            {lang === 'kh' ? 'សារកន្ទុយវិក្កយបត្រសាខា (Receipt Footer Note)' : 'Store Receipt Footer Note'}
                          </label>
                          <input
                            type="text"
                            value={
                              branchOverrides.receipt_footer_note ||
                              `Thank you for shopping at ${currentBranch?.name}! សូមអរគុណ!`
                            }
                            onChange={(e) => setBranchOverrides({ ...branchOverrides, receipt_footer_note: e.target.value })}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 5. INVOICE & RECEIPT */}
              {currentTab === 'INVOICE_RECEIPT' && (
                <div className="space-y-6 max-w-5xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {lang === 'kh' ? 'ទម្រង់វិក្កយបត្រ និងប័ណ្ណទូទាត់ (Invoice & Receipt)' : 'Invoice & Receipt Configuration'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {lang === 'kh'
                          ? 'កំណត់បុព្វបទលេខកូដវិក្កយបត្រ INV-2026-000001 ឬ POS-PP-000001'
                          : 'Manage numbering sequences, prefixes, starting numbers, headers and footers'}
                      </p>
                    </div>
                  </div>

                  {/* Number Sequences Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        {lang === 'kh' ? 'កូដតម្រៀបស្វ័យប្រវត្តិ (Number Sequences)' : 'Document Numbering Sequences'}
                      </h3>
                    </div>

                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Document Type</th>
                          <th className="px-4 py-3">Prefix</th>
                          <th className="px-4 py-3">Format Token</th>
                          <th className="px-4 py-3">Padding</th>
                          <th className="px-4 py-3">Current No.</th>
                          <th className="px-4 py-3">Live Sample Preview</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {sequences.map((seq) => (
                          <tr key={seq.id} className="hover:bg-slate-50/60 transition">
                            <td className="px-4 py-3 font-bold text-slate-900">{seq.document_type}</td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={seq.prefix}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSequences((prev) =>
                                    prev.map((s) => (s.id === seq.id ? { ...s, prefix: val } : s))
                                  );
                                }}
                                className="w-24 px-2 py-1 border border-slate-300 rounded-lg text-xs"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={seq.date_format_token}
                                onChange={(e) => {
                                  const val = e.target.value as any;
                                  setSequences((prev) =>
                                    prev.map((s) => (s.id === seq.id ? { ...s, date_format_token: val } : s))
                                  );
                                }}
                                className="px-2 py-1 border border-slate-300 rounded-lg text-xs"
                              >
                                <option value="NONE">None</option>
                                <option value="YYYY">YYYY (2026)</option>
                                <option value="YYYYMM">YYYYMM (202609)</option>
                                <option value="YYYYMMDD">YYYYMMDD (20260908)</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">{seq.zero_padding} digits</td>
                            <td className="px-4 py-3 font-mono">{seq.current_number}</td>
                            <td className="px-4 py-3">
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-mono text-[11px] font-bold border border-emerald-200">
                                {seq.preview_sample || `${seq.prefix}2026-000001`}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleSaveSequence(seq)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                              >
                                Save
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Header & Footer Customization */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
                      {lang === 'kh' ? 'ការបង្ហាញលើប័ណ្ណទូទាត់' : 'Receipt Display Switches'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <label className="flex items-center space-x-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                        <input
                          type="checkbox"
                          checked={globalSettings.show_tax_on_receipt !== 'false'}
                          onChange={(e) =>
                            setGlobalSettings({
                              ...globalSettings,
                              show_tax_on_receipt: e.target.checked ? 'true' : 'false',
                            })
                          }
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <span className="text-xs font-semibold text-slate-800">Show VAT / Tax Breakdown</span>
                      </label>

                      <label className="flex items-center space-x-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                        <input
                          type="checkbox"
                          checked={globalSettings.show_discount_on_receipt !== 'false'}
                          onChange={(e) =>
                            setGlobalSettings({
                              ...globalSettings,
                              show_discount_on_receipt: e.target.checked ? 'true' : 'false',
                            })
                          }
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <span className="text-xs font-semibold text-slate-800">Show Discount Savings</span>
                      </label>

                      <label className="flex items-center space-x-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                        <input
                          type="checkbox"
                          checked={globalSettings.show_qr_on_receipt !== 'false'}
                          onChange={(e) =>
                            setGlobalSettings({
                              ...globalSettings,
                              show_qr_on_receipt: e.target.checked ? 'true' : 'false',
                            })
                          }
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <span className="text-xs font-semibold text-slate-800">Show Bakong KHQR</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. TAX & MULTI-CURRENCY */}
              {currentTab === 'TAX_CURRENCY' && (
                <div className="space-y-6 max-w-5xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {lang === 'kh' ? 'ពន្ធ និងរូបិយប័ណ្ណ (Tax & Multi-Currency)' : 'Tax Rates & Multi-Currency Hub'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {lang === 'kh'
                          ? 'អត្រាប្តូរប្រាក់ USD / KHR ការទូទាត់បាគង (Bakong KHQR) និងអត្រាពន្ធ VAT'
                          : 'Exchange rate policies, National Bank of Cambodia Bakong KHQR, and standard VAT'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSaveGlobalSettings(globalSettings)}
                      disabled={isSaving}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition"
                    >
                      <Save className="w-4 h-4" />
                      {lang === 'kh' ? 'រក្សាទុក' : 'Save Changes'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Currency & Exchange */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <Coins className="w-4 h-4 text-emerald-600" />
                        {lang === 'kh' ? 'រូបិយប័ណ្ណ និងអត្រាប្តូរប្រាក់' : 'Currency & Exchange Rates'}
                      </h3>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Base Currency</label>
                        <input
                          type="text"
                          disabled
                          value="USD ($)"
                          className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50 rounded-xl text-slate-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Secondary Currency</label>
                        <input
                          type="text"
                          disabled
                          value="KHR (៛)"
                          className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50 rounded-xl text-slate-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {lang === 'kh' ? 'អត្រាប្តូរប្រាក់ (1 USD = ? KHR)' : 'Exchange Rate (1 USD in KHR)'}
                        </label>
                        <input
                          type="number"
                          value={globalSettings.exchange_rate || '4150'}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, exchange_rate: e.target.value })}
                          className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Tax & Bakong */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <QrCode className="w-4 h-4 text-emerald-600" />
                        {lang === 'kh' ? 'ការទូទាត់បាគង & ពន្ធ VAT' : 'Bakong KHQR & Standard VAT'}
                      </h3>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Default VAT Rate (%)</label>
                        <input
                          type="number"
                          value={globalSettings.default_vat_rate || '10'}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, default_vat_rate: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Bakong Merchant ID (Account)
                        </label>
                        <input
                          type="text"
                          value={globalSettings.bakong_merchant_id || 'bakong_pos_hq01@nbc'}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, bakong_merchant_id: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Bakong Merchant Legal Name
                        </label>
                        <input
                          type="text"
                          value={globalSettings.bakong_account_name || 'SMARTPOS HQ STORE CO., LTD'}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, bakong_account_name: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. POS & HARDWARE */}
              {currentTab === 'PRINTER_HARDWARE' && (
                <div className="space-y-6 max-w-5xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {lang === 'kh' ? 'ឧបករណ៍ POS និងម៉ាស៊ីនបោះពុម្ព' : 'POS Terminals & Hardware Printers'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {selectedBranchId && currentBranch
                          ? `Hardware devices for [${currentBranch.code}] ${currentBranch.name}`
                          : 'Manage hardware across stores and cash registers'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setTerminalForm({
                            terminal_code: `POS-${selectedBranchId ? 'B' + selectedBranchId : '01'}-0${terminals.length + 1}`,
                            terminal_name: `Register 0${terminals.length + 1}`,
                            status: 'ONLINE',
                            cash_drawer_enabled: true,
                            auto_print: true,
                            receipt_copies: 1,
                          });
                          setIsTerminalModalOpen(true);
                        }}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition"
                      >
                        <Plus className="w-4 h-4" />
                        {lang === 'kh' ? 'បន្ថែមម៉ាស៊ីន POS' : 'Add Terminal'}
                      </button>

                      <button
                        onClick={() => {
                          setPrinterForm({
                            printer_name: 'Thermal Receipt 80mm',
                            printer_type: 'RECEIPT_80MM',
                            connection_type: 'NETWORK_LAN',
                            ip_address: '192.168.1.200',
                            port: 9100,
                            paper_width_mm: 80,
                            is_default: true,
                            auto_cut: true,
                            cash_drawer_kick: true,
                            status: 'ONLINE',
                          });
                          setIsPrinterModalOpen(true);
                        }}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition"
                      >
                        <Plus className="w-4 h-4" />
                        {lang === 'kh' ? 'បន្ថែមម៉ាស៊ីនព្រីន' : 'Add Printer'}
                      </button>
                    </div>
                  </div>

                  {/* Terminals Section */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="px-6 py-4 border-b border-slate-100 font-bold text-sm text-slate-800 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-600" />
                      Active POS Terminals ({terminals.length})
                    </div>
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Terminal Code</th>
                          <th className="px-4 py-3">Terminal Name</th>
                          <th className="px-4 py-3">IP Address</th>
                          <th className="px-4 py-3">Cash Drawer</th>
                          <th className="px-4 py-3">Auto Print</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {terminals.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/60 transition">
                            <td className="px-4 py-3 font-mono font-bold text-slate-900">{t.terminal_code}</td>
                            <td className="px-4 py-3 font-semibold">{t.terminal_name}</td>
                            <td className="px-4 py-3 font-mono text-slate-500">{t.ip_address || 'DHCP'}</td>
                            <td className="px-4 py-3">{t.cash_drawer_enabled ? 'Enabled' : 'Disabled'}</td>
                            <td className="px-4 py-3">{t.auto_print ? 'Auto (1 copy)' : 'Manual'}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {t.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => t.id && handleDeleteTerminal(t.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Printers Section */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="px-6 py-4 border-b border-slate-100 font-bold text-sm text-slate-800 flex items-center gap-2">
                      <Printer className="w-4 h-4 text-emerald-600" />
                      Configured Printers ({printers.length})
                    </div>
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Printer Name</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Connection</th>
                          <th className="px-4 py-3">IP / Port</th>
                          <th className="px-4 py-3">Paper Width</th>
                          <th className="px-4 py-3">Auto Cut</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {printers.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/60 transition">
                            <td className="px-4 py-3 font-bold text-slate-900">{p.printer_name}</td>
                            <td className="px-4 py-3">{p.printer_type}</td>
                            <td className="px-4 py-3 font-mono">{p.connection_type}</td>
                            <td className="px-4 py-3 font-mono text-slate-500">
                              {p.ip_address}:{p.port}
                            </td>
                            <td className="px-4 py-3">{p.paper_width_mm} mm</td>
                            <td className="px-4 py-3">{p.auto_cut ? 'Yes' : 'No'}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => p.id && handleDeletePrinter(p.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 8. BUSINESS HOURS & HOLIDAYS */}
              {currentTab === 'BUSINESS_HOURS' && (
                <div className="space-y-6 max-w-5xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {lang === 'kh' ? 'ម៉ោងបើកលក់ និងថ្ងៃឈប់សម្រាក' : 'Business Hours & Holiday Schedule'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {selectedBranchId && currentBranch
                          ? `Schedule for [${currentBranch.code}] ${currentBranch.name}`
                          : 'Operating schedule and national holiday calendar'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsHolidayModalOpen(true)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition"
                      >
                        <Plus className="w-4 h-4" />
                        {lang === 'kh' ? 'បន្ថែមថ្ងៃឈប់' : 'Add Holiday'}
                      </button>
                      {selectedBranchId && (
                        <button
                          onClick={() => saveBranchHours(selectedBranchId, businessHours).then(() => triggerSuccess('Business hours saved!'))}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition"
                        >
                          <Save className="w-4 h-4" />
                          Save Hours
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Business Hours List */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      Weekly Store Operating Hours
                    </h3>

                    <div className="divide-y divide-slate-100">
                      {businessHours.map((h, idx) => (
                        <div key={h.day_of_week} className="py-2.5 flex items-center justify-between text-xs">
                          <span className="w-28 font-bold text-slate-800">{h.day_name}</span>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={h.is_open}
                              onChange={(e) => {
                                const next = [...businessHours];
                                next[idx].is_open = e.target.checked;
                                setBusinessHours(next);
                              }}
                              className="w-4 h-4 text-emerald-600 rounded"
                            />
                            <span>{h.is_open ? 'Open' : 'Closed'}</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={h.open_time}
                              disabled={!h.is_open}
                              onChange={(e) => {
                                const next = [...businessHours];
                                next[idx].open_time = e.target.value;
                                setBusinessHours(next);
                              }}
                              className="px-2 py-1 border border-slate-300 rounded-lg text-xs"
                            />
                            <span>to</span>
                            <input
                              type="time"
                              value={h.close_time}
                              disabled={!h.is_open}
                              onChange={(e) => {
                                const next = [...businessHours];
                                next[idx].close_time = e.target.value;
                                setBusinessHours(next);
                              }}
                              className="px-2 py-1 border border-slate-300 rounded-lg text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Holidays List */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      Holidays Calendar ({holidays.length})
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {holidays.map((hol) => (
                        <div
                          key={hol.id}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900">{hol.name}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <span>{hol.holiday_date}</span>
                              {hol.note && <span>• {hol.note}</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => hol.id && handleDeleteHoliday(hol.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 9. INVENTORY RULES */}
              {currentTab === 'INVENTORY' && (
                <div className="space-y-6 max-w-5xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {lang === 'kh' ? 'វិធានស្តុក និងគណនាថ្លៃដើម' : 'Inventory Rules & Stock Valuation'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Valuation methods (FIFO / AVCO), batch & serial tracking, low stock warnings
                      </p>
                    </div>
                    <button
                      onClick={() => handleSaveGlobalSettings(globalSettings)}
                      disabled={isSaving}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition"
                    >
                      <Save className="w-4 h-4" />
                      Save Inventory Rules
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Stock Valuation Method
                        </label>
                        <select
                          value={globalSettings.stock_valuation_method || 'FIFO'}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, stock_valuation_method: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                        >
                          <option value="FIFO">FIFO (First In, First Out) - Recommended</option>
                          <option value="AVCO">AVCO (Weighted Average Cost)</option>
                          <option value="LIFO">LIFO (Last In, First Out)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Barcode Format Standard
                        </label>
                        <select
                          value={globalSettings.barcode_format || 'EAN13'}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, barcode_format: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                        >
                          <option value="EAN13">EAN-13 (Standard Retail)</option>
                          <option value="CODE128">Code 128 (Alphanumeric)</option>
                          <option value="UPCA">UPC-A</option>
                          <option value="QR">QR Code</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Global Low-Stock Warning Threshold
                        </label>
                        <input
                          type="number"
                          value={globalSettings.default_low_stock_threshold || '10'}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, default_low_stock_threshold: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Default Stock Unit
                        </label>
                        <input
                          type="text"
                          value={globalSettings.default_unit || 'Pcs'}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, default_unit: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                        />
                      </div>

                      <div className="md:col-span-2 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="flex items-center space-x-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={globalSettings.allow_negative_stock === 'true'}
                            onChange={(e) => setGlobalSettings({ ...globalSettings, allow_negative_stock: e.target.checked ? 'true' : 'false' })}
                            className="w-4 h-4 text-emerald-600 rounded"
                          />
                          <span className="text-xs font-semibold text-slate-800">Allow Negative Stock at POS Checkout</span>
                        </label>

                        <label className="flex items-center space-x-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={globalSettings.enable_batch_tracking !== 'false'}
                            onChange={(e) => setGlobalSettings({ ...globalSettings, enable_batch_tracking: e.target.checked ? 'true' : 'false' })}
                            className="w-4 h-4 text-emerald-600 rounded"
                          />
                          <span className="text-xs font-semibold text-slate-800">Enable Batch / Lot Number Tracking</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 10. LOCALIZATION */}
              {currentTab === 'LOCALIZATION' && (
                <div className="space-y-6 max-w-5xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {lang === 'kh' ? 'ភាសា និងការធ្វើមូលដ្ឋានីយកម្ម' : 'Localization & Region Settings'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Language support (Khmer 🇰🇭 / English 🇺🇸), timezone, and date format
                      </p>
                    </div>
                    <button
                      onClick={() => handleSaveGlobalSettings(globalSettings)}
                      disabled={isSaving}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition"
                    >
                      <Save className="w-4 h-4" />
                      Save Localization
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Default System Language
                        </label>
                        <select
                          value={globalSettings.default_language || 'en'}
                          onChange={(e) => {
                            const l = e.target.value as any;
                            setGlobalSettings({ ...globalSettings, default_language: l });
                            setLang(l);
                          }}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                        >
                          <option value="en">English (United States) 🇺🇸</option>
                          <option value="kh">ភាសាខ្មែរ (Khmer) 🇰🇭</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Timezone</label>
                        <select
                          value={globalSettings.timezone || 'Asia/Phnom_Penh'}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, timezone: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                        >
                          <option value="Asia/Phnom_Penh">Asia/Phnom_Penh (UTC+7)</option>
                          <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
                          <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Date Format</label>
                        <select
                          value={globalSettings.date_format || 'YYYY-MM-DD'}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, date_format: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                        >
                          <option value="YYYY-MM-DD">YYYY-MM-DD (2026-09-08)</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY (08/09/2026)</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY (09/08/2026)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Time Format</label>
                        <select
                          value={globalSettings.time_format || '24H'}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, time_format: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                        >
                          <option value="24H">24 Hours (21:45)</option>
                          <option value="12H">12 Hours (09:45 PM)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 11. SECURITY SETTINGS */}
              {currentTab === 'SECURITY' && (
                <div className="space-y-6 max-w-5xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {lang === 'kh' ? 'សន្តិសុខ និងគោលការណ៍ចូលប្រើ' : 'Security & Session Policies'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Session timeout, max failed attempts, lockout duration, master PIN
                      </p>
                    </div>
                    <button
                      onClick={() => handleSaveGlobalSettings(globalSettings)}
                      disabled={isSaving}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition"
                    >
                      <Save className="w-4 h-4" />
                      Save Security Policies
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Session Timeout (Minutes)
                        </label>
                        <input
                          type="number"
                          value={globalSettings.session_timeout_minutes || '60'}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, session_timeout_minutes: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Max Failed Login Attempts before Lockout
                        </label>
                        <input
                          type="number"
                          value={globalSettings.max_login_attempts || '5'}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, max_login_attempts: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Account Lock Duration (Minutes)
                        </label>
                        <input
                          type="number"
                          value={globalSettings.account_lock_duration_minutes || '15'}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, account_lock_duration_minutes: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Manager Master Security PIN
                        </label>
                        <input
                          type="password"
                          name="security_master_pin_secret"
                          id="security_master_pin_secret"
                          autoComplete="new-password"
                          data-lpignore="true"
                          data-1p-ignore="true"
                          data-form-type="other"
                          value={globalSettings.master_security_pin || '1234'}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, master_security_pin: e.target.value })}
                          className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 12. TELEGRAM & NOTIFICATIONS */}
              {currentTab === 'TELEGRAM' && (
                <div className="space-y-6 max-w-5xl">
                  <TelegramBotConfigSection />
                </div>
              )}

              {/* 13. NOTIFICATIONS & GLOBAL POLICY */}
              {currentTab === 'NOTIFICATIONS' && (
                <div className="space-y-8 max-w-5xl">
                  {/* Part 1: Global Notification Auto-Close & Behavior Policy (All Modules) */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">🔔</span>
                          <h2 className="text-base font-bold text-slate-900">
                            {lang === 'kh'
                              ? 'ឥរិយាបថជូនដំណឹងទូទៅ — គ្រប់ម៉ូឌុល (Global Notification Behavior)'
                              : 'Global Notification Behavior — All Modules'}
                          </h2>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                            Unified Policy
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {lang === 'kh'
                            ? 'កំណត់រយៈពេល auto-close របារ progress bar និងការបិទដោយដៃដែលត្រូវបានអនុវត្តលើគ្រប់ ៤២ ម៉ូឌុលនៃប្រព័ន្ធ SmartPOS'
                            : 'Centralized rules controlling auto-close timing, animated progress bars, and manual dismissal inherited across all 42 SmartPOS modules.'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await confirmAction({
                              title: lang === 'kh' ? 'កំណត់គោលការណ៍ជូនដំណឹងឡើងវិញ?' : 'Reset Notification Policy?',
                              message: lang === 'kh' ? 'តើអ្នកចង់កំណត់គោលការណ៍ជូនដំណឹងទៅជាទម្រង់លំនាំដើមវិញ?' : 'Reset notification policy to enterprise defaults?',
                              variant: 'warning',
                              confirmText: lang === 'kh' ? 'កំណត់ឡើងវិញ' : 'Reset Defaults',
                            });
                            if (ok) {
                              await resetPolicyConfig();
                              setTempPolicyConfig(DEFAULT_NOTIFICATION_POLICY);
                              notify.info(lang === 'kh' ? 'គោលការណ៍ជូនដំណឹងត្រូវបានកំណត់ឡើងវិញ' : 'Notification policy reset to enterprise defaults.', 'Reset Complete');
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                          <span>{lang === 'kh' ? 'កំណត់ឡើងវិញ' : 'Reset Defaults'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            setIsSavingPolicy(true);
                            try {
                              await updatePolicyConfig(tempPolicyConfig);
                              notify.success(
                                lang === 'kh' ? 'គោលការណ៍ជូនដំណឹងត្រូវបានរក្សាទុកជោគជ័យ!' : 'Notification policy saved and applied across all modules!',
                                'Policy Updated'
                              );
                            } catch {
                              notify.error('Failed to save notification policy.');
                            } finally {
                              setIsSavingPolicy(false);
                            }
                          }}
                          disabled={isSavingPolicy}
                          className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isSavingPolicy ? (lang === 'kh' ? 'កំពុងរក្សាទុក...' : 'Saving...') : (lang === 'kh' ? 'រក្សាទុកគោលការណ៍' : 'Save Policy')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Policy Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3">Notification Type</th>
                            <th className="px-4 py-3 text-center">Auto-Close</th>
                            <th className="px-4 py-3 text-center">Duration</th>
                            <th className="px-4 py-3 text-center">Progress Bar</th>
                            <th className="px-4 py-3 text-center">Manual Close</th>
                            <th className="px-4 py-3 text-center">Live Preview & Test</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                          {/* 1. SUCCESS */}
                          <tr className="hover:bg-slate-50/70 transition">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center space-x-2.5">
                                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                                  <CheckCircle2 className="w-4 h-4" />
                                </span>
                                <div>
                                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                                    <span>Success</span>
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      ✅ Standard
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-400">Creation, updates, completions</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <label className="inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={tempPolicyConfig.success.auto_close}
                                  onChange={(e) =>
                                    setTempPolicyConfig({
                                      ...tempPolicyConfig,
                                      success: { ...tempPolicyConfig.success, auto_close: e.target.checked },
                                    })
                                  }
                                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                                />
                              </label>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <div className="inline-flex items-center space-x-1.5">
                                <input
                                  type="number"
                                  min={1}
                                  max={60}
                                  disabled={!tempPolicyConfig.success.auto_close}
                                  value={(tempPolicyConfig.success.duration || 4000) / 1000}
                                  onChange={(e) =>
                                    setTempPolicyConfig({
                                      ...tempPolicyConfig,
                                      success: {
                                        ...tempPolicyConfig.success,
                                        duration: Math.max(1, Number(e.target.value)) * 1000,
                                      },
                                    })
                                  }
                                  className="w-16 px-2 py-1 text-center bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold disabled:opacity-40"
                                />
                                <span className="text-slate-400 font-semibold">sec</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <label className="inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  disabled={!tempPolicyConfig.success.auto_close}
                                  checked={tempPolicyConfig.success.progress_bar}
                                  onChange={(e) =>
                                    setTempPolicyConfig({
                                      ...tempPolicyConfig,
                                      success: { ...tempPolicyConfig.success, progress_bar: e.target.checked },
                                    })
                                  }
                                  className="w-4 h-4 text-emerald-600 rounded disabled:opacity-40 cursor-pointer"
                                />
                              </label>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                                Yes (Always)
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  notify.success(
                                    lang === 'kh' ? 'ផលិតផល "Coca Cola 330ml" ត្រូវបានបង្កើតជោគជ័យ!' : 'Product "Coca Cola 330ml" created successfully.',
                                    { title: lang === 'kh' ? 'បានបង្កើតផលិតផល' : 'Product Created', ...tempPolicyConfig.success }
                                  )
                                }
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold text-xs transition border border-emerald-200 cursor-pointer flex items-center space-x-1 mx-auto shadow-2xs"
                              >
                                <Play className="w-3 h-3" />
                                <span>{lang === 'kh' ? 'តេស្ត' : 'Test'}</span>
                              </button>
                            </td>
                          </tr>

                          {/* 2. INFORMATION */}
                          <tr className="hover:bg-slate-50/70 transition">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center space-x-2.5">
                                <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
                                  <Info className="w-4 h-4" />
                                </span>
                                <div>
                                  <div className="font-bold text-sky-900 flex items-center gap-1.5">
                                    <span>Information</span>
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                                      ℹ️ Info
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-400">Shift drawer opening, status cues</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <label className="inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={tempPolicyConfig.information.auto_close}
                                  onChange={(e) =>
                                    setTempPolicyConfig({
                                      ...tempPolicyConfig,
                                      information: { ...tempPolicyConfig.information, auto_close: e.target.checked },
                                    })
                                  }
                                  className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                                />
                              </label>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <div className="inline-flex items-center space-x-1.5">
                                <input
                                  type="number"
                                  min={1}
                                  max={60}
                                  disabled={!tempPolicyConfig.information.auto_close}
                                  value={(tempPolicyConfig.information.duration || 5000) / 1000}
                                  onChange={(e) =>
                                    setTempPolicyConfig({
                                      ...tempPolicyConfig,
                                      information: {
                                        ...tempPolicyConfig.information,
                                        duration: Math.max(1, Number(e.target.value)) * 1000,
                                      },
                                    })
                                  }
                                  className="w-16 px-2 py-1 text-center bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold disabled:opacity-40"
                                />
                                <span className="text-slate-400 font-semibold">sec</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <label className="inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  disabled={!tempPolicyConfig.information.auto_close}
                                  checked={tempPolicyConfig.information.progress_bar}
                                  onChange={(e) =>
                                    setTempPolicyConfig({
                                      ...tempPolicyConfig,
                                      information: { ...tempPolicyConfig.information, progress_bar: e.target.checked },
                                    })
                                  }
                                  className="w-4 h-4 text-sky-600 rounded disabled:opacity-40 cursor-pointer"
                                />
                              </label>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                                Yes (Always)
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  notify.info(
                                    lang === 'kh' ? 'ថតប្រាក់ត្រូវបានបើកដោយប្រធានសាខាសម្រាប់វេនលក់ថ្មី។' : 'Cash drawer opened by Branch Manager for new shift.',
                                    { title: lang === 'kh' ? 'ព័ត៌មានប្រតិបត្តិការ' : 'Shift Information', ...tempPolicyConfig.information }
                                  )
                                }
                                className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg font-bold text-xs transition border border-sky-200 cursor-pointer flex items-center space-x-1 mx-auto shadow-2xs"
                              >
                                <Play className="w-3 h-3" />
                                <span>{lang === 'kh' ? 'តេស្ត' : 'Test'}</span>
                              </button>
                            </td>
                          </tr>

                          {/* 3. WARNING */}
                          <tr className="hover:bg-slate-50/70 transition">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center space-x-2.5">
                                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                                  <AlertTriangle className="w-4 h-4" />
                                </span>
                                <div>
                                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                                    <span>Warning</span>
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                      ⚠️ Alert
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-400">Low stock, threshold warnings, expiring items</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <label className="inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={tempPolicyConfig.warning.auto_close}
                                  onChange={(e) =>
                                    setTempPolicyConfig({
                                      ...tempPolicyConfig,
                                      warning: { ...tempPolicyConfig.warning, auto_close: e.target.checked },
                                    })
                                  }
                                  className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                                />
                              </label>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <div className="inline-flex items-center space-x-1.5">
                                <input
                                  type="number"
                                  min={1}
                                  max={60}
                                  disabled={!tempPolicyConfig.warning.auto_close}
                                  value={(tempPolicyConfig.warning.duration || 7000) / 1000}
                                  onChange={(e) =>
                                    setTempPolicyConfig({
                                      ...tempPolicyConfig,
                                      warning: {
                                        ...tempPolicyConfig.warning,
                                        duration: Math.max(1, Number(e.target.value)) * 1000,
                                      },
                                    })
                                  }
                                  className="w-16 px-2 py-1 text-center bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold disabled:opacity-40"
                                />
                                <span className="text-slate-400 font-semibold">sec</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <label className="inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  disabled={!tempPolicyConfig.warning.auto_close}
                                  checked={tempPolicyConfig.warning.progress_bar}
                                  onChange={(e) =>
                                    setTempPolicyConfig({
                                      ...tempPolicyConfig,
                                      warning: { ...tempPolicyConfig.warning, progress_bar: e.target.checked },
                                    })
                                  }
                                  className="w-4 h-4 text-amber-500 rounded disabled:opacity-40 cursor-pointer"
                                />
                              </label>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                                Yes (Always)
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  notify.warning(
                                    lang === 'kh' ? 'ផលិតផល "Coca Cola 330ml" នៅសល់ក្រោមចំនួនកំណត់អប្បបរមា (នៅសល់តែ ៣ កំប៉ុង)។' : 'Product "Coca Cola 330ml" is below minimum stock (only 3 units left).',
                                    { title: lang === 'kh' ? 'ការព្រមានស្តុកទាប' : 'Low Stock Warning', ...tempPolicyConfig.warning }
                                  )
                                }
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-bold text-xs transition border border-amber-200 cursor-pointer flex items-center space-x-1 mx-auto shadow-2xs"
                              >
                                <Play className="w-3 h-3" />
                                <span>{lang === 'kh' ? 'តេស្ត' : 'Test'}</span>
                              </button>
                            </td>
                          </tr>

                          {/* 4. ERROR */}
                          <tr className="hover:bg-slate-50/70 transition">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center space-x-2.5">
                                <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                                  <AlertCircle className="w-4 h-4" />
                                </span>
                                <div>
                                  <div className="font-bold text-rose-900 flex items-center gap-1.5">
                                    <span>Error</span>
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                      ❌ Failure
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-400">Failed operations, API exceptions, validation errors</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <label className="inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={tempPolicyConfig.error.auto_close}
                                  onChange={(e) =>
                                    setTempPolicyConfig({
                                      ...tempPolicyConfig,
                                      error: { ...tempPolicyConfig.error, auto_close: e.target.checked },
                                    })
                                  }
                                  className="w-4 h-4 text-rose-600 rounded cursor-pointer"
                                />
                              </label>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <div className="inline-flex items-center space-x-1.5">
                                <input
                                  type="number"
                                  min={1}
                                  max={60}
                                  disabled={!tempPolicyConfig.error.auto_close}
                                  value={(tempPolicyConfig.error.duration || 8000) / 1000}
                                  onChange={(e) =>
                                    setTempPolicyConfig({
                                      ...tempPolicyConfig,
                                      error: {
                                        ...tempPolicyConfig.error,
                                        duration: Math.max(1, Number(e.target.value)) * 1000,
                                      },
                                    })
                                  }
                                  className="w-16 px-2 py-1 text-center bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold disabled:opacity-40"
                                />
                                <span className="text-slate-400 font-semibold">sec</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <label className="inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  disabled={!tempPolicyConfig.error.auto_close}
                                  checked={tempPolicyConfig.error.progress_bar}
                                  onChange={(e) =>
                                    setTempPolicyConfig({
                                      ...tempPolicyConfig,
                                      error: { ...tempPolicyConfig.error, progress_bar: e.target.checked },
                                    })
                                  }
                                  className="w-4 h-4 text-rose-600 rounded disabled:opacity-40 cursor-pointer"
                                />
                              </label>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                                Yes (Always)
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  notify.error(
                                    lang === 'kh' ? 'ការបម្រុងទុកទិន្នន័យបានបរាជ័យ: កំហុសសរសេរលើថាសរឹង។' : 'Database backup failed: Disk write permission error.',
                                    { title: lang === 'kh' ? 'ការបម្រុងទុកបរាជ័យ' : 'Backup Failed', ...tempPolicyConfig.error }
                                  )
                                }
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-xs transition border border-rose-200 cursor-pointer flex items-center space-x-1 mx-auto shadow-2xs"
                              >
                                <Play className="w-3 h-3" />
                                <span>{lang === 'kh' ? 'តេស្ត' : 'Test'}</span>
                              </button>
                            </td>
                          </tr>

                          {/* 5. CRITICAL */}
                          <tr className="hover:bg-red-50/40 transition bg-red-50/10">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center space-x-2.5">
                                <span className="p-1.5 rounded-lg bg-red-100 text-red-700 animate-pulse">
                                  <ShieldCheck className="w-4 h-4" />
                                </span>
                                <div>
                                  <div className="font-bold text-red-950 flex items-center gap-1.5">
                                    <span>Critical</span>
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-red-600 text-white">
                                      🚨 Urgent
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-400">Security breaches, integrity failure, license/cash lock</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <div className="flex flex-col items-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                                  No (Manual)
                                </span>
                                <span className="text-[9px] text-slate-400 mt-0.5">Remains until handled</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className="text-slate-400 font-mono text-xs">—</span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className="text-slate-400 font-mono text-xs">—</span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                                Yes (Manual Dismiss)
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  notify.critical(
                                    lang === 'kh'
                                      ? '🚨 ការជូនដំណឹងសន្តិសុខធ្ងន់ធ្ងរ: បានរកឃើញការប៉ុនប៉ងបញ្ចូលកូដ PIN ខុសចំនួន ៥ ដងជាប់គ្នានៅលើម៉ាស៊ីន POS 02!'
                                      : '🚨 Critical security event detected: 5 consecutive failed supervisor PIN attempts on POS Terminal 02.',
                                    { title: lang === 'kh' ? 'ព្រឹត្តិការណ៍សន្តិសុខធ្ងន់ធ្ងរ' : 'Critical Security Alert', ...tempPolicyConfig.critical }
                                  )
                                }
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs transition cursor-pointer flex items-center space-x-1 mx-auto shadow-xs"
                              >
                                <Play className="w-3 h-3" />
                                <span>{lang === 'kh' ? 'តេស្ត Critical' : 'Test Critical'}</span>
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Part 2: System Event Channel Matrix */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          {lang === 'kh' ? 'ម៉ាទ្រីសបញ្ជូនសារតាមបណ្តាញ (Dispatch Channel Matrix)' : 'System Event Dispatch Channel Matrix'}
                        </h2>
                        <p className="text-xs text-slate-500">
                          Configure dispatch channels (Email, Telegram, SMS, In-App) per system event
                        </p>
                      </div>
                      <button
                        onClick={() => saveSettingsNotificationMatrix(notificationMatrix, selectedBranchId ? selectedBranchId : undefined).then(() => notify.success('Notification channels saved!', 'Matrix Updated'))}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition"
                      >
                        <Save className="w-4 h-4" />
                        Save Matrix
                      </button>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Event Name</th>
                          <th className="px-4 py-3 text-center">Email</th>
                          <th className="px-4 py-3 text-center">Telegram</th>
                          <th className="px-4 py-3 text-center">SMS</th>
                          <th className="px-4 py-3 text-center">Push</th>
                          <th className="px-4 py-3 text-center">In-App</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {notificationMatrix.map((row, idx) => (
                          <tr key={row.event_code} className="hover:bg-slate-50/60 transition">
                            <td className="px-4 py-3 font-semibold text-slate-900">{row.event_name}</td>
                            {(['EMAIL', 'TELEGRAM', 'SMS', 'PUSH', 'IN_APP'] as const).map((ch) => (
                              <td key={ch} className="px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={!!row.channels[ch]}
                                  onChange={(e) => {
                                    const next = [...notificationMatrix];
                                    next[idx].channels[ch] = e.target.checked;
                                    setNotificationMatrix(next);
                                  }}
                                  className="w-4 h-4 text-emerald-600 rounded"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

              {/* 14. AUDIT TRAIL */}
              {currentTab === 'AUDIT' && (
                <div className="space-y-6 max-w-5xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {lang === 'kh' ? 'សវនកម្មការកែប្រែការកំណត់' : 'Configuration Change Audit Trail'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Comprehensive log of who changed which setting, old vs new values, IP and timestamps
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Timestamp</th>
                          <th className="px-4 py-3">User</th>
                          <th className="px-4 py-3">Module</th>
                          <th className="px-4 py-3">Setting Key</th>
                          <th className="px-4 py-3">Old Value</th>
                          <th className="px-4 py-3">New Value</th>
                          <th className="px-4 py-3">IP Address</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/60 transition">
                            <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-900">{log.username || 'System'}</td>
                            <td className="px-4 py-3">
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                {log.module}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-800">{log.setting_key}</td>
                            <td className="px-4 py-3 text-red-600 font-mono text-[11px] truncate max-w-[120px]">
                              {log.old_value || '—'}
                            </td>
                            <td className="px-4 py-3 text-emerald-700 font-mono font-bold text-[11px] truncate max-w-[120px]">
                              {log.new_value || '—'}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-500">{log.ip_address || '127.0.0.1'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 15. BACKUP SHORTCUT */}
              {currentTab === 'BACKUP' && (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs max-w-xl mx-auto my-12">
                  <Database className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-900">Enterprise Database Backup & Recovery</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4">
                    Full snapshots, automated cron schedules, Telegram bot dispatch alerts, SHA-256 integrity checks, and 3-2-1 strategy.
                  </p>
                  <button
                    onClick={() => setActiveTab('backup')}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    Open Database Backup Module →
                  </button>
                </div>
              )}

              {/* 16. BRANCH USERS */}
              {currentTab === 'BRANCH_USERS' && (
                <div className="space-y-6 max-w-5xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {lang === 'kh' ? 'បុគ្គលិកសាខា និងសិទ្ធិអនុញ្ញាត' : 'Branch Staff & Access Controls'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {selectedBranchId && currentBranch
                          ? `Staff assigned to [${currentBranch.code}] ${currentBranch.name}`
                          : 'Assign users to stores and control terminal access permissions'}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAssignUserModalOpen(true)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-4 h-4" />
                      Assign User to Branch
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Username</th>
                          <th className="px-4 py-3">Assigned Role</th>
                          <th className="px-4 py-3">Permissions</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {branchUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/60 transition">
                            <td className="px-4 py-3 font-bold text-slate-900">
                              {u.user ? u.user.username : `User #${u.user_id}`}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                                {u.assigned_role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500 truncate max-w-[250px]">
                              {u.permissions ? u.permissions.join(', ') : 'All Granted'}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Active
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleRemoveBranchUser(u.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      {/* MODAL: ADD / EDIT BRANCH */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-600" />
                {branchForm.id ? 'Edit Store Branch' : 'Add New Store Branch'}
              </h3>
              <button
                onClick={() => setIsBranchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch Code *</label>
                  <input
                    type="text"
                    value={branchForm.code || ''}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch Type</label>
                  <select
                    value={branchForm.branch_type || 'RETAIL_STORE'}
                    onChange={(e) => setBranchForm({ ...branchForm, branch_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="RETAIL_STORE">Retail Store</option>
                    <option value="HEAD_OFFICE">Head Office</option>
                    <option value="WAREHOUSE_HUB">Warehouse Hub</option>
                    <option value="FRANCHISE">Franchise</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Branch Name *</label>
                <input
                  type="text"
                  value={branchForm.name || ''}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City / Province</label>
                  <input
                    type="text"
                    value={branchForm.city || ''}
                    onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={branchForm.phone || ''}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physical Address</label>
                <textarea
                  rows={2}
                  value={branchForm.address || ''}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsBranchModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBranchModal}
                disabled={isSaving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                Save Branch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD POS TERMINAL */}
      {isTerminalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Add POS Terminal</h3>
              <button onClick={() => setIsTerminalModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Terminal Code *</label>
                <input
                  type="text"
                  value={terminalForm.terminal_code || ''}
                  onChange={(e) => setTerminalForm({ ...terminalForm, terminal_code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Terminal Name *</label>
                <input
                  type="text"
                  value={terminalForm.terminal_name || ''}
                  onChange={(e) => setTerminalForm({ ...terminalForm, terminal_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">IP Address</label>
                <input
                  type="text"
                  value={terminalForm.ip_address || ''}
                  onChange={(e) => setTerminalForm({ ...terminalForm, ip_address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsTerminalModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTerminal}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Save Terminal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD PRINTER */}
      {isPrinterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Add Hardware Printer</h3>
              <button onClick={() => setIsPrinterModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Printer Name *</label>
                <input
                  type="text"
                  value={printerForm.printer_name || ''}
                  onChange={(e) => setPrinterForm({ ...printerForm, printer_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Printer Type</label>
                  <select
                    value={printerForm.printer_type || 'RECEIPT_80MM'}
                    onChange={(e) => setPrinterForm({ ...printerForm, printer_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="RECEIPT_80MM">Receipt 80mm</option>
                    <option value="RECEIPT_58MM">Receipt 58mm</option>
                    <option value="LABEL_BARCODE">Barcode Label</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Connection</label>
                  <select
                    value={printerForm.connection_type || 'NETWORK_LAN'}
                    onChange={(e) => setPrinterForm({ ...printerForm, connection_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="NETWORK_LAN">Network LAN</option>
                    <option value="USB">USB</option>
                    <option value="BLUETOOTH">Bluetooth</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">IP Address</label>
                  <input
                    type="text"
                    value={printerForm.ip_address || ''}
                    onChange={(e) => setPrinterForm({ ...printerForm, ip_address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Port</label>
                  <input
                    type="number"
                    value={printerForm.port || 9100}
                    onChange={(e) => setPrinterForm({ ...printerForm, port: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsPrinterModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrinter}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Save Printer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN USER */}
      {isAssignUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Assign Staff to Branch</h3>
              <button onClick={() => setIsAssignUserModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select User Account</label>
                <select
                  value={assignUserForm.user_id}
                  onChange={(e) => setAssignUserForm({ ...assignUserForm, user_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                >
                  {availableStaffUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Assigned Role</label>
                <select
                  value={assignUserForm.assigned_role}
                  onChange={(e) => setAssignUserForm({ ...assignUserForm, assigned_role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                >
                  <option value="BRANCH_MANAGER">Branch Manager</option>
                  <option value="CASHIER">Cashier</option>
                  <option value="WAREHOUSE_STAFF">Warehouse Staff</option>
                  <option value="ADMIN">Branch Administrator</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsAssignUserModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignUser}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Assign Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD HOLIDAY */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Add Holiday Calendar Record</h3>
              <button onClick={() => setIsHolidayModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Holiday Name *</label>
                <input
                  type="text"
                  value={holidayForm.name || ''}
                  onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Holiday Date *</label>
                <input
                  type="date"
                  value={holidayForm.holiday_date || ''}
                  onChange={(e) => setHolidayForm({ ...holidayForm, holiday_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Notes</label>
                <input
                  type="text"
                  value={holidayForm.note || ''}
                  onChange={(e) => setHolidayForm({ ...holidayForm, note: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsHolidayModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveHoliday}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Save Holiday
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
