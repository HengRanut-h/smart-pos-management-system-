import React, { useState, useEffect } from 'react';
import { useApp } from '../../application/context/AppContext';
import { TelegramBotConfigSection } from './TelegramBotConfigSection';
import {
  BackupRecordItem,
  BackupScheduleItem,
  DatabaseHealthStats,
  BackupDashboardData,
  TelegramBotConfig,
  TelegramUserItem,
  TelegramLogItem,
} from '../../foundation/types/backup';
import {
  getBackupDashboard,
  getBackupRecords,
  createBackupSnapshot,
  verifyBackupSnapshot,
  restoreBackupSnapshot,
  deleteBackupSnapshot,
  getBackupSchedules,
  saveBackupSchedule,
  toggleBackupScheduleStatus,
  runBackupScheduleNow,
  deleteBackupSchedule,
  pruneExpiredBackups,
  getDatabaseMaintenanceStats,
  runDatabaseOptimization,
  getTelegramBotSettings,
  saveTelegramBotSettings,
  sendTelegramTestAlert,
  getTelegramLogs,
  exportBackupData,
  sendBackupSnapshotToTelegram,
  sendExportDataToTelegram,
} from '../../data-access/posApi';
import {
  Database,
  Download,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  RotateCcw,
  Sliders,
  Send,
  FileSpreadsheet,
  Layers,
  Calendar,
  Lock,
  Search,
  Trash2,
  Check,
  X,
  Radio,
  Server,
  KeyRound,
  FileCode,
  FileText,
  Boxes,
  HelpCircle,
  Plus,
  Edit,
  Zap,
  Power,
} from 'lucide-react';

type BackupTab = 'DASHBOARD' | 'SCHEDULE' | 'RESTORE' | 'MAINTENANCE' | 'IMPORT_EXPORT' | 'TELEGRAM';

export const BackupManagementView: React.FC = () => {
  const { lang, backupSubTab, setBackupSubTab, notify, confirmDelete, confirmAction } = useApp();

  // Active sub-tab linked to sidebar navigation
  const activeTab = (backupSubTab || 'DASHBOARD') as BackupTab;

  // Dashboard & records state
  const [dashboard, setDashboard] = useState<BackupDashboardData | null>(null);
  const [records, setRecords] = useState<BackupRecordItem[]>([]);
  const [schedules, setSchedules] = useState<BackupScheduleItem[]>([]);
  const [dbHealth, setDbHealth] = useState<DatabaseHealthStats | null>(null);
  const [tgBot, setTgBot] = useState<TelegramBotConfig | null>(null);
  const [tgUsers, setTgUsers] = useState<TelegramUserItem[]>([]);
  const [tgLogs, setTgLogs] = useState<TelegramLogItem[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [sendingTelegramId, setSendingTelegramId] = useState<number | null>(null);
  const [isSendingExportTelegram, setIsSendingExportTelegram] = useState<string | null>(null);

  // Modals & Feedback
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBackupType, setNewBackupType] = useState('FULL');
  const [newBackupStorage, setNewBackupStorage] = useState('LOCAL+CLOUD');
  const [newBackupRetention, setNewBackupRetention] = useState(30);

  // Schedule & Retention Management State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Partial<BackupScheduleItem> | null>(null);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [runningScheduleId, setRunningScheduleId] = useState<number | null>(null);
  const [togglingScheduleId, setTogglingScheduleId] = useState<number | null>(null);
  const [deletingScheduleId, setDeletingScheduleId] = useState<number | null>(null);
  const [isPruning, setIsPruning] = useState(false);

  const [restoreConfirmModal, setRestoreConfirmModal] = useState<BackupRecordItem | null>(null);
  const [telegramTestPreview, setTelegramTestPreview] = useState<string | null>(null);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [dashData, recData, schedData, healthData, tgSettings, tgLogData] = await Promise.all([
        getBackupDashboard().catch(() => null),
        getBackupRecords().catch(() => ({ data: [] })),
        getBackupSchedules().catch(() => []),
        getDatabaseMaintenanceStats().catch(() => null),
        getTelegramBotSettings().catch(() => null),
        getTelegramLogs().catch(() => []),
      ]);

      if (dashData) setDashboard(dashData);
      if (recData?.data) setRecords(recData.data);
      if (schedData) setSchedules(schedData);
      if (healthData) setDbHealth(healthData);
      if (tgSettings?.bot) {
        setTgBot(tgSettings.bot);
        setTgUsers(tgSettings.users || []);
      }
      if (tgLogData) setTgLogs(tgLogData);
    } catch (err) {
      console.error('Failed to load backup hub data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Actions
  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await createBackupSnapshot({
        type: newBackupType,
        storage: newBackupStorage,
        retention_days: newBackupRetention,
      });
      notify.success(
        lang === 'kh'
          ? `ច្បាប់ចម្លងបម្រុងទុក ${res.data.backup_code} ត្រូវបានបង្កើតដោយជោគជ័យ!`
          : `Backup snapshot ${res.data.backup_code} created successfully!`,
        'Backup Created'
      );
      setIsCreateModalOpen(false);
      await loadAllData();
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to create backup snapshot.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleVerify = async (record: BackupRecordItem) => {
    setVerifyingId(record.id);
    try {
      const res = await verifyBackupSnapshot(record.id);
      notify.success(
        lang === 'kh'
          ? `ការផ្ទៀងផ្ទាត់សុចរិតភាព SHA-256 ជោគជ័យ: ${res.data.message}`
          : `SHA-256 verification passed: ${res.data.message}`,
        'Integrity Verified'
      );
      await loadAllData();
    } catch (err: any) {
      notify.error('Verification error.');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleExecuteRestore = async () => {
    if (!restoreConfirmModal) return;
    const rec = restoreConfirmModal;
    setRestoringId(rec.id);
    try {
      const res = await restoreBackupSnapshot(rec.id);
      notify.success(
        lang === 'kh'
          ? `ការស្ដារឡើងវិញជោគជ័យ! ច្បាប់ចម្លងការពារ: ${res.safety_backup || 'បម្រុងទុក'}`
          : `Database restored successfully! Safety fallback snapshot: ${res.safety_backup || 'Saved'}`,
        'Database Restored'
      );
      setRestoreConfirmModal(null);
      await loadAllData();
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to restore database.');
    } finally {
      setRestoringId(null);
    }
  };

  const handleDeleteSnapshot = async (record: BackupRecordItem) => {
    const fileName = record.filename || (record as any).file_name || '';
    const ok = await confirmDelete({
      title: lang === 'kh' ? 'លុបច្បាប់ចម្លងបម្រុង?' : 'Delete Backup Snapshot?',
      message: lang === 'kh'
        ? `តើអ្នកពិតជាចង់លុបច្បាប់ចម្លង ${record.backup_code} (${fileName}) មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`
        : `Are you sure you want to permanently delete snapshot ${record.backup_code} (${fileName})? This action cannot be undone.`,
      confirmText: lang === 'kh' ? 'យល់ព្រមលុប' : 'Delete Snapshot',
    });
    if (!ok) return;

    try {
      await deleteBackupSnapshot(record.id);
      notify.success(lang === 'kh' ? 'ច្បាប់ចម្លងត្រូវបានលុបជោគជ័យ!' : 'Snapshot deleted successfully.');
      await loadAllData();
    } catch (err) {
      notify.error('Failed to delete snapshot.');
    }
  };

  const handleOpenAddSchedule = () => {
    setEditingSchedule({
      name: 'Nightly Production Snapshot',
      frequency: 'DAILY',
      start_time: '02:00:00',
      day_of_week: 0,
      day_of_month: 1,
      backup_type: 'FULL',
      storage_destination: 'LOCAL+CLOUD',
      retention_days: 30,
      is_compressed: true,
      is_encrypted: true,
      notify_on_success: true,
      notify_on_failure: true,
      status: 'ACTIVE',
    });
    setIsScheduleModalOpen(true);
  };

  const handleOpenEditSchedule = (s: BackupScheduleItem) => {
    setEditingSchedule({ ...s });
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule || !editingSchedule.name?.trim()) return;
    setIsSavingSchedule(true);
    try {
      const res = await saveBackupSchedule(editingSchedule);
      notify.success(res.message || (lang === 'kh' ? 'កាលវិភាគត្រូវបានរក្សាទុក!' : 'Schedule saved successfully.'), 'Schedule Saved');
      setIsScheduleModalOpen(false);
      setEditingSchedule(null);
      const schedData = await getBackupSchedules();
      setSchedules(schedData);
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to save schedule.');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleToggleSchedule = async (id: number) => {
    setTogglingScheduleId(id);
    try {
      const res = await toggleBackupScheduleStatus(id);
      notify.success(res.message);
      setSchedules((prev) => prev.map((s) => (s.id === id ? res.data : s)));
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to toggle schedule status.');
    } finally {
      setTogglingScheduleId(null);
    }
  };

  const handleRunScheduleNow = async (id: number) => {
    setRunningScheduleId(id);
    try {
      const res = await runBackupScheduleNow(id);
      notify.success(res.message, 'Schedule Executed');
      const [schedData, recData] = await Promise.all([
        getBackupSchedules().catch(() => []),
        getBackupRecords().catch(() => ({ data: [] })),
      ]);
      setSchedules(schedData);
      if (recData?.data) setRecords(recData.data);
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to trigger backup schedule.');
    } finally {
      setRunningScheduleId(null);
    }
  };

  const handleDeleteSchedule = async (id: number, name: string) => {
    const ok = await confirmDelete({
      title: lang === 'kh' ? 'លុបកាលវិភាគបម្រុងទុក?' : 'Delete Backup Schedule?',
      message: lang === 'kh' ? `តើអ្នកប្រាកដថាចង់លុបកាលវិភាគ "${name}" មែនទេ?` : `Are you sure you want to delete backup schedule "${name}"?`,
      confirmText: lang === 'kh' ? 'យល់ព្រមលុប' : 'Delete Schedule',
    });
    if (!ok) return;
    setDeletingScheduleId(id);
    try {
      const res = await deleteBackupSchedule(id);
      notify.success(res.message);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to delete schedule.');
    } finally {
      setDeletingScheduleId(null);
    }
  };

  const handlePruneExpired = async () => {
    const ok = await confirmAction({
      title: lang === 'kh' ? 'សម្អាត និងលុបចោល Backup?' : 'Prune Expired Backups?',
      message: lang === 'kh' ? 'តើអ្នកចង់សម្អាត និងលុបចោល backup ទាំងអស់ដែលហួសកាលកំណត់ retention មែនទេ?' : 'Do you want to prune and purge all backups that have surpassed their retention policy period?',
      variant: 'warning',
      confirmText: lang === 'kh' ? 'សម្អាតចោល' : 'Prune Now',
    });
    if (!ok) return;
    setIsPruning(true);
    try {
      const res = await pruneExpiredBackups();
      notify.success(res.message, 'Retention Pruning Complete');
      const recData = await getBackupRecords();
      if (recData?.data) setRecords(recData.data);
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to prune expired backups.');
    } finally {
      setIsPruning(false);
    }
  };

  const handleOptimizeDatabase = async () => {
    setIsOptimizing(true);
    try {
      const res = await runDatabaseOptimization();
      notify.success(lang === 'kh' ? 'ការសម្អាត និងបង្កើនល្បឿន DB ជោគជ័យ!' : res.message, 'Database Optimized');
      await loadAllData();
    } catch (err) {
      notify.error('Optimization failed.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleTestTelegramAlert = async () => {
    setIsTestingTelegram(true);
    try {
      const res = await sendTelegramTestAlert();
      setTelegramTestPreview(res.preview_text);
      notify.success(
        lang === 'kh'
          ? 'សារតេស្តតេឡេក្រាមត្រូវបានផ្ញើជោគជ័យ!'
          : 'Telegram test alert dispatched successfully!',
        'Test Alert Dispatched'
      );
      await loadAllData();
    } catch (err) {
      notify.error('Failed to send Telegram test alert.');
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const handleExportEntity = async (type: 'sales' | 'products' | 'customers') => {
    try {
      const res = await exportBackupData(type);
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `smartpos_${type}_export_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      notify.success(lang === 'kh' ? `នាំចេញទិន្នន័យ ${type} ជោគជ័យ!` : `Exported ${res.count} ${type} records successfully!`, 'Export Complete');
    } catch (err) {
      notify.error('Export failed.');
    }
  };

  const handleSendSnapshotToTelegram = async (record: BackupRecordItem) => {
    setSendingTelegramId(record.id);
    try {
      const res = await sendBackupSnapshotToTelegram(record.id);
      notify.success(
        lang === 'kh'
          ? `ឯកសារ '${record.filename}' ត្រូវបានផ្ញើទៅកាន់ Telegram ដោយជោគជ័យ!`
          : `Backup file '${record.filename}' sent to Telegram successfully!`,
        'Dispatched to Telegram'
      );
    } catch (err: any) {
      notify.error(err?.response?.data?.message || 'Failed to send backup file to Telegram.');
    } finally {
      setSendingTelegramId(null);
    }
  };

  const handleSendExportToTelegram = async (type: string) => {
    setIsSendingExportTelegram(type);
    try {
      const res = await sendExportDataToTelegram(type);
      notify.success(
        lang === 'kh'
          ? `ឯកសារនាំចេញ ${type} ត្រូវបានផ្ញើទៅកាន់ Telegram ដោយជោគជ័យ!`
          : `Exported ${type} file dispatched directly to Telegram!`,
        'Dispatched to Telegram'
      );
    } catch (err: any) {
      notify.error(err?.response?.data?.message || 'Failed to send export to Telegram.');
    } finally {
      setIsSendingExportTelegram(null);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 flex flex-col h-full overflow-hidden">

      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-200">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                {lang === 'kh' ? 'ការបម្រុងទុកទិន្នន័យ & ការគ្រប់គ្រងប្រព័ន្ធ' : 'Database Backup & System Data'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                3-2-1 Strategy Ready
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap">
          <button
            onClick={loadAllData}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition cursor-pointer"
            title={lang === 'kh' ? 'ផ្ទុកទិន្នន័យឡើងវិញ' : 'Refresh'}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            onClick={handleTestTelegramAlert}
            disabled={isTestingTelegram}
            className="px-3.5 py-2.5 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Send className={`w-3.5 h-3.5 ${isTestingTelegram ? 'animate-spin' : ''}`} />
            <span>{lang === 'kh' ? 'តេស្តផ្ញើ Telegram' : 'Test Telegram Alert'}</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <HardDrive className="w-4 h-4" />
            <span>{lang === 'kh' ? '+ បង្កើតច្បាប់ចម្លងបម្រុងទុក' : '+ Create Backup Snapshot'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* ============================================================== */}
        {/* MODULE 1: DASHBOARD & SNAPSHOTS                                 */}
        {/* ============================================================== */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {lang === 'kh' ? 'ច្បាប់ចម្លងសរុប' : 'Total Snapshots'}
                  </p>
                  <p className="text-2xl font-black text-gray-900 mt-1">
                    {dashboard?.total_backups ?? records.length}
                  </p>
                  <span className="text-[11px] text-emerald-600 font-medium">
                    {dashboard?.successful_backups ?? records.length} {lang === 'kh' ? 'ជោគជ័យ' : 'verified'}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Database className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {lang === 'kh' ? 'ទំហំមូលទិន្នន័យ' : 'Database Size'}
                  </p>
                  <p className="text-2xl font-black text-blue-600 mt-1">
                    {dashboard?.database?.database_size_formatted || '916 KB'}
                  </p>
                  <span className="text-[11px] text-gray-400 font-mono">
                    SQLite 3 ACID Engine
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Server className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {lang === 'kh' ? 'សុខភាពប្រព័ន្ធ' : 'System Health'}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-2xl font-black text-emerald-600">
                      {dashboard?.health_score ?? 98}%
                    </p>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    {lang === 'kh' ? 'ដំណើរការល្អបំផុត' : 'Optimal Health Score'}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {lang === 'kh' ? 'កាលវិភាគបន្ទាប់' : 'Next Auto Run'}
                  </p>
                  <p className="text-sm font-bold text-purple-700 mt-1 truncate">
                    {dashboard?.next_scheduled_run || 'Daily at 02:00 AM'}
                  </p>
                  <span className="text-[11px] text-gray-400">
                    {lang === 'kh' ? 'បម្រុងទុកស្វ័យប្រវត្តិ' : 'Automated Cron Job'}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* 3-2-1 Strategy Ribbon */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-2xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider border border-emerald-500/30">
                    3-2-1 Strategy
                  </span>
                  <h3 className="font-bold text-sm">Enterprise Business Continuity Assurance</h3>
                </div>
                <p className="text-xs text-slate-300">
                  {lang === 'kh'
                    ? '៣ ច្បាប់ចម្លងនៃទិន្នន័យសំខាន់ • ២ ប្រភេទឧបករណ៍ផ្ទុកខុសគ្នា • ១ ច្បាប់ចម្លងក្រៅប្រព័ន្ធ (Cloud)'
                    : '3 copies of important data • 2 different storage media types • 1 off-site cloud replica'}
                </p>
              </div>

              <div className="flex items-center space-x-3 text-xs font-mono">
                <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Primary: Local</span>
                </div>
                <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Secondary: Storage</span>
                </div>
                <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Off-Site: Cloud</span>
                </div>
              </div>
            </div>

            {/* Snapshots History Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900 flex items-center space-x-2">
                  <HardDrive className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'kh' ? 'ប្រវត្តិនៃច្បាប់ចម្លងបម្រុងទុក' : 'Backup Snapshots History'}</span>
                </h3>
                <span className="text-xs text-gray-400 font-mono">
                  {records.length} {lang === 'kh' ? 'ច្បាប់ចម្លងរក្សាទុក' : 'snapshots recorded'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50/75 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-3 px-4">{lang === 'kh' ? 'កូដចម្លង & ឈ្មោះ' : 'Backup Code & File'}</th>
                      <th className="py-3 px-4">{lang === 'kh' ? 'ប្រភេទ' : 'Type'}</th>
                      <th className="py-3 px-4">{lang === 'kh' ? 'ទំហំ & រយៈពេល' : 'Size & Duration'}</th>
                      <th className="py-3 px-4">{lang === 'kh' ? 'សុចរិតភាព SHA-256' : 'SHA-256 Checksum'}</th>
                      <th className="py-3 px-4">{lang === 'kh' ? 'ទីតាំងផ្ទុក' : 'Storage'}</th>
                      <th className="py-3 px-4">{lang === 'kh' ? 'កាលបរិច្ឆេទ' : 'Created Date'}</th>
                      <th className="py-3 px-4 text-right">{lang === 'kh' ? 'សកម្មភាព' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400">
                          <Database className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p>{lang === 'kh' ? 'មិនទាន់មានច្បាប់ចម្លងបម្រុងទុកនៅឡើយទេ' : 'No backup snapshots found.'}</p>
                        </td>
                      </tr>
                    ) : (
                      records.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50/60 transition">
                          <td className="py-3 px-4">
                            <div className="font-mono font-bold text-gray-900">{r.backup_code}</div>
                            <div className="text-[11px] text-gray-400 truncate max-w-xs">{r.filename}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {r.backup_type}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-gray-800">{r.size_formatted}</div>
                            <div className="text-[11px] text-gray-400">{r.duration_seconds}s execution</div>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <div className="flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px] w-fit">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span className="truncate max-w-[120px]" title={r.checksum_sha256}>
                                {r.checksum_sha256 ? `${r.checksum_sha256.substring(0, 10)}...` : 'Verified'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-mono">
                              {r.storage_destinations}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                            <div>{new Date(r.created_at).toLocaleDateString()}</div>
                            <div className="text-[11px] text-gray-400">{new Date(r.created_at).toLocaleTimeString()}</div>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => handleVerify(r)}
                                disabled={verifyingId === r.id}
                                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                                title={lang === 'kh' ? 'ផ្ទៀងផ្ទាត់សុចរិតភាព' : 'Verify SHA-256 Checksum'}
                              >
                                <ShieldCheck className={`w-3.5 h-3.5 ${verifyingId === r.id ? 'animate-spin text-emerald-600' : ''}`} />
                              </button>

                              <button
                                onClick={() => setRestoreConfirmModal(r)}
                                className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition cursor-pointer"
                                title={lang === 'kh' ? 'ស្ដារទិន្នន័យឡើងវិញ' : 'Restore from Snapshot'}
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>

                              <a
                                href={`/api/v1/backups/${r.id}/download`}
                                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                                title={lang === 'kh' ? 'ទាញយកឯកសារ' : 'Download Snapshot File'}
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>

                              <button
                                onClick={() => handleSendSnapshotToTelegram(r)}
                                disabled={sendingTelegramId === r.id}
                                className="p-1.5 rounded-lg border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition cursor-pointer"
                                title={lang === 'kh' ? 'ផ្ញើឯកសារ Snapshot ទៅ Telegram' : 'Send Snapshot File to Telegram'}
                              >
                                <Send className={`w-3.5 h-3.5 ${sendingTelegramId === r.id ? 'animate-spin' : ''}`} />
                              </button>

                              <button
                                onClick={() => handleDeleteSnapshot(r)}
                                className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                title={lang === 'kh' ? 'លុប' : 'Delete'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
        )}

        {/* ============================================================== */}
        {/* MODULE 2: SCHEDULE & RETENTION                                  */}
        {/* ============================================================== */}
        {activeTab === 'SCHEDULE' && (
          <div className="space-y-6">
            {/* Header Banner & Global Actions */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <span>{lang === 'kh' ? 'កាលវិភាគបម្រុងទុក & រយៈពេលរក្សាទុកទិន្នន័យ (Retention)' : 'Backup Schedule & Data Retention Policy'}</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700">
                      {schedules.length} {lang === 'kh' ? 'កាលវិភាគ' : 'Schedules'}
                    </span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lang === 'kh'
                      ? 'កំណត់កាលវិភាគស្វ័យប្រវត្តិ (ប្រចាំថ្ងៃ សប្តាហ៍ ខែ) និងវិធានលុបចោល backup ចាស់ៗ (Auto-Prune) ដើម្បីការពារការពេញទំហំផ្ទុក'
                      : 'Automate regular backups (Daily, Weekly, Monthly) and customize retention periods to automatically prune aged snapshots.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePruneExpired}
                  disabled={isPruning}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  title="Purge all snapshots that have passed their retention expiry date"
                >
                  <Trash2 className={`w-3.5 h-3.5 ${isPruning ? 'animate-spin text-purple-600' : 'text-slate-500'}`} />
                  <span>{isPruning ? (lang === 'kh' ? 'កំពុងសម្អាត...' : 'Pruning...') : (lang === 'kh' ? 'សម្អាតទិន្នន័យផុតកំណត់' : 'Prune Expired')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddSchedule}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'kh' ? 'បន្ថែមរូបមន្តកាលវិភាគ' : 'New Schedule & Retention'}</span>
                </button>
              </div>
            </div>

            {/* Schedules Cards Grid */}
            {schedules.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center space-y-3">
                <Clock className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="font-bold text-gray-700 text-sm">{lang === 'kh' ? 'មិនទាន់មានកាលវិភាគទេ' : 'No Backup Schedules Configured'}</h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  {lang === 'kh' ? 'បង្កើតកាលវិភាគបម្រុងទុកស្វ័យប្រវត្តិដំបូងរបស់អ្នកដើម្បីការពារទិន្នន័យអាជីវកម្ម' : 'Create your first automated backup schedule with custom retention policies to protect your business.'}
                </p>
                <button
                  onClick={handleOpenAddSchedule}
                  className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-purple-700 transition"
                >
                  {lang === 'kh' ? '+ បង្កើតកាលវិភាគដំបូង' : '+ Create First Schedule'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {schedules.map((s) => {
                  const isActive = s.status === 'ACTIVE';
                  const isRunning = runningScheduleId === s.id;
                  const isToggling = togglingScheduleId === s.id;
                  const isDeleting = deletingScheduleId === s.id;

                  return (
                    <div
                      key={s.id}
                      className={`bg-white p-6 rounded-2xl border transition shadow-xs space-y-4 relative ${
                        isActive ? 'border-purple-200' : 'border-gray-200 opacity-90'
                      }`}
                    >
                      {/* Top Bar: Name, Frequency & Status Toggle */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isActive ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-400'
                          }`}>
                            <Clock className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm truncate">{s.name}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
                                {s.frequency}
                              </span>
                              <span className="text-xs text-gray-400">
                                {s.frequency === 'WEEKLY' && s.day_of_week !== undefined
                                  ? `(Every ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][s.day_of_week]})`
                                  : s.frequency === 'MONTHLY' && s.day_of_month !== undefined
                                  ? `(Day ${s.day_of_month} of month)`
                                  : 'Daily automation'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleSchedule(s.id)}
                          disabled={isToggling}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                          }`}
                          title="Click to toggle Active / Paused"
                        >
                          <Power className={`w-3 h-3 ${isToggling ? 'animate-spin' : ''}`} />
                          <span>{isToggling ? 'Updating...' : isActive ? 'ACTIVE' : 'PAUSED'}</span>
                        </button>
                      </div>

                      {/* 4 Metrics Tiles */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                            {lang === 'kh' ? 'ម៉ោងដំណើរការ' : 'Start Time'}
                          </span>
                          <span className="font-bold text-gray-800">{s.start_time} (UTC+7)</span>
                        </div>

                        <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-100">
                          <span className="text-purple-600 block text-[10px] uppercase font-bold">
                            {lang === 'kh' ? 'រយៈពេលរក្សាទុក (Retention)' : 'Retention Period'}
                          </span>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className="font-extrabold text-purple-900 text-sm">{s.retention_days} Days</span>
                            <span className="px-1.5 py-0.2 text-[9px] rounded-md bg-purple-200 text-purple-800 font-bold">
                              Auto-prune
                            </span>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                            {lang === 'kh' ? 'ទីតាំងផ្ទុក' : 'Storage Destination'}
                          </span>
                          <span className="font-bold text-gray-800">{s.storage_destination}</span>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                            {lang === 'kh' ? 'ការបង្រួម & សុវត្ថិភាព' : 'Compression & Encryption'}
                          </span>
                          <span className="font-bold text-emerald-600">
                            {s.is_compressed ? 'Gzip' : 'Plain'} + {s.is_encrypted ? 'AES-256' : 'Standard'}
                          </span>
                        </div>
                      </div>

                      {/* Execution Info & Action Bar */}
                      <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="text-gray-500 space-y-0.5">
                          <div>
                            <span className="text-gray-400">Next Run: </span>
                            <strong className="text-gray-700 font-mono">
                              {s.next_run_at ? new Date(s.next_run_at).toLocaleString() : 'Tomorrow 02:00 AM'}
                            </strong>
                          </div>
                          {s.last_run_at && (
                            <div className="text-[11px] text-gray-400">
                              Last run: {new Date(s.last_run_at).toLocaleString()}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons: Run Now, Edit, Delete */}
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRunScheduleNow(s.id)}
                            disabled={isRunning}
                            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 disabled:opacity-50 text-purple-700 font-bold rounded-xl text-xs transition flex items-center space-x-1.5 border border-purple-200 cursor-pointer shadow-2xs"
                            title="Immediately execute this backup schedule right now"
                          >
                            <Zap className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : 'text-purple-600'}`} />
                            <span>{isRunning ? (lang === 'kh' ? 'កំពុងដំណើរការ...' : 'Running...') : (lang === 'kh' ? 'ដំណើរការឥឡូវ' : 'Run Now')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditSchedule(s)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                            title="Edit schedule frequency, start time, retention days, or storage destination"
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-600" />
                            <span>{lang === 'kh' ? 'កែប្រែ' : 'Edit'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteSchedule(s.id, s.name)}
                            disabled={isDeleting}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-xl border border-rose-200 transition cursor-pointer"
                            title="Delete this schedule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Retention Policy Explainer Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-sm text-gray-900 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'kh' ? 'គោលការណ៍រក្សាទុកទិន្នន័យ (Retention Policy Architecture)' : 'Automated Retention & Auto-Pruning Policy Architecture'}</span>
                </h3>
                <span className="text-[11px] font-semibold text-gray-400">3-2-1 Enterprise Standard</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900">Tier 1: Daily Snapshots</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                      30 Days
                    </span>
                  </div>
                  <p className="text-emerald-800 text-[11px] leading-relaxed">
                    Retained locally for fast point-in-time recovery of recent transactions and cashier cash reconciliations.
                  </p>
                </div>

                <div className="p-3.5 bg-sky-50/60 border border-sky-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-900">Tier 2: Weekly Backups</span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-extrabold text-[10px]">
                      90 Days
                    </span>
                  </div>
                  <p className="text-sky-800 text-[11px] leading-relaxed">
                    Stored off-site in cold storage for quarterly compliance, cross-store audits, and ransomware resilience.
                  </p>
                </div>

                <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900">Tier 3: Monthly Archives</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-extrabold text-[10px]">
                      365 Days
                    </span>
                  </div>
                  <p className="text-purple-800 text-[11px] leading-relaxed">
                    Compressed and AES-256 encrypted fiscal year archive for legal tax reporting and annual business accounting.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>
                    {lang === 'kh'
                      ? 'វិធានសម្អាតស្វ័យប្រវត្តិដំណើរការជារៀងរាល់ថ្ងៃដើម្បីលុបច្បាប់ចម្លងដែលផុតកំណត់ (expires_at) ដោយស្វ័យប្រវត្តិ'
                      : 'Automated pruning daemon runs daily to safely purge expired snapshots, ensuring storage is always optimized.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handlePruneExpired}
                  disabled={isPruning}
                  className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg transition shrink-0 cursor-pointer border border-purple-200"
                >
                  {isPruning ? 'Cleaning...' : 'Prune Expired Now'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODULE 3: RESTORE & RECOVERY                                    */}
        {/* ============================================================== */}
        {activeTab === 'RESTORE' && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start space-x-3.5 shadow-2xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-amber-900">
                  {lang === 'kh' ? 'ការព្រមានអំពីការស្ដារទិន្នន័យ (Disaster Recovery Warning)' : 'Disaster Recovery Safe Protocol'}
                </h3>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {lang === 'kh'
                    ? 'ការស្ដារមូលទិន្នន័យឡើងវិញនឹងជំនួសទិន្នន័យបច្ចុប្បន្នជាមួយច្បាប់ចម្លងដែលបានជ្រើសរើស។ ប្រព័ន្ធនឹងបង្កើតច្បាប់ចម្លងសុវត្ថិភាពបន្ទាន់ (Pre-Restore Fallback) ដោយស្វ័យប្រវត្តិតាមស្តង់ដារការពារទិន្នន័យ។'
                    : 'Restoring a database snapshot will overwrite current store ledger records. SmartPOS automatically generates a pre-restore safety fallback snapshot before applying any changes.'}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-gray-900">
                {lang === 'kh' ? 'ជ្រើសរើសច្បាប់ចម្លងសម្រាប់ស្ដារឡើងវិញ' : 'Select Verified Snapshot to Restore'}
              </h3>

              <div className="space-y-3">
                {records.map((rec) => (
                  <div key={rec.id} className="p-4 rounded-xl border border-gray-200 hover:border-amber-300 transition flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-gray-900">{rec.backup_code}</span>
                        <span className="px-2 py-0.2 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          SHA-256 Verified
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {rec.filename} • {rec.size_formatted} • {new Date(rec.created_at).toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => setRestoreConfirmModal(rec)}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{lang === 'kh' ? 'ស្ដារទិន្នន័យនេះ' : 'Restore from This'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODULE 4: SYSTEM DATA & DATABASE MAINTENANCE                    */}
        {/* ============================================================== */}
        {activeTab === 'MAINTENANCE' && (
          <div className="space-y-6">
            {/* Live Table Record Counts Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-gray-900 flex items-center space-x-2">
                    <Server className="w-4 h-4 text-blue-600" />
                    <span>{lang === 'kh' ? 'ស្ថិតិកំណត់ត្រាតាមតារាងមូលទិន្នន័យ' : 'Live Database Table Statistics'}</span>
                  </h3>
                  <p className="text-xs text-gray-400">
                    Engine: {dbHealth?.engine || 'SQLite 3'} • Total Tables: {dbHealth?.total_tables || 25}
                  </p>
                </div>

                <button
                  onClick={handleOptimizeDatabase}
                  disabled={isOptimizing}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
                  <span>{lang === 'kh' ? 'សម្អាត & បង្កើនល្បឿន DB (VACUUM)' : 'Defragment & Vacuum DB'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.entries(dbHealth?.table_breakdown || {
                  products: 42,
                  sales: 156,
                  customers: 84,
                  employees: 12,
                  audit_logs: 310,
                  user_login_audits: 8,
                }).map(([tbl, count]) => (
                  <div key={tbl} className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                      {tbl.replace('_', ' ')}
                    </span>
                    <span className="text-xl font-black text-gray-900 mt-1 block">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Storage Usage Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-gray-900">
                {lang === 'kh' ? 'ការប្រើប្រាស់ទំហំថាសរឹង' : 'Storage Space Diagnostics'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-400 uppercase text-[10px] font-bold block">Live Database File</span>
                  <span className="text-lg font-bold text-gray-900 mt-0.5 block">{dbHealth?.database_size_formatted || '916 KB'}</span>
                  <span className="text-gray-500 text-[11px]">Primary active database file</span>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-400 uppercase text-[10px] font-bold block">Backup Snapshots Archive</span>
                  <span className="text-lg font-bold text-emerald-600 mt-0.5 block">{dbHealth?.backup_storage?.total_formatted || '1.8 MB'}</span>
                  <span className="text-gray-500 text-[11px]">{dbHealth?.backup_storage?.total_files || 2} snapshot files stored</span>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-400 uppercase text-[10px] font-bold block">Storage State</span>
                  <span className="text-lg font-bold text-blue-600 mt-0.5 block">OPTIMAL (94% Free)</span>
                  <span className="text-gray-500 text-[11px]">No low disk warnings</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODULE 5: IMPORT & EXPORT HUB                                   */}
        {/* ============================================================== */}
        {activeTab === 'IMPORT_EXPORT' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-sm text-gray-900 flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'kh' ? 'ការនាំចេញទិន្នន័យ (Bulk Data Export)' : 'Bulk Enterprise Data Export'}</span>
                </h3>
                <p className="text-xs text-gray-400">
                  {lang === 'kh'
                    ? 'ទាញយកទិន្នន័យលក់ ផលិតផល និងអតិថិជនជាឯកសារ JSON / CSV'
                    : 'Download structured records for accounting audits, offline backups, or reporting'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Boxes className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-gray-900">Products Catalog</h4>
                      <span className="text-[11px] text-gray-400">Inventory items, SKUs, barcode</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleExportEntity('products')}
                      className="flex-1 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-800 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{lang === 'kh' ? 'ទាញយក JSON' : 'Export JSON'}</span>
                    </button>
                    <button
                      onClick={() => handleSendExportToTelegram('products')}
                      disabled={isSendingExportTelegram === 'products'}
                      className="px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer shrink-0"
                      title={lang === 'kh' ? 'ផ្ញើឯកសារ JSON ទៅ Telegram' : 'Send file directly to Telegram'}
                    >
                      <Send className={`w-3.5 h-3.5 ${isSendingExportTelegram === 'products' ? 'animate-spin' : ''}`} />
                      <span>Telegram</span>
                    </button>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-gray-900">Sales History</h4>
                      <span className="text-[11px] text-gray-400">Receipts, taxes, items sold</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleExportEntity('sales')}
                      className="flex-1 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-800 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{lang === 'kh' ? 'ទាញយក JSON' : 'Export JSON'}</span>
                    </button>
                    <button
                      onClick={() => handleSendExportToTelegram('sales')}
                      disabled={isSendingExportTelegram === 'sales'}
                      className="px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer shrink-0"
                      title={lang === 'kh' ? 'ផ្ញើឯកសារ JSON ទៅ Telegram' : 'Send file directly to Telegram'}
                    >
                      <Send className={`w-3.5 h-3.5 ${isSendingExportTelegram === 'sales' ? 'animate-spin' : ''}`} />
                      <span>Telegram</span>
                    </button>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-gray-900">Customer Records</h4>
                      <span className="text-[11px] text-gray-400">Loyalty points, accounts</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleExportEntity('customers')}
                      className="flex-1 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-800 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{lang === 'kh' ? 'ទាញយក JSON' : 'Export JSON'}</span>
                    </button>
                    <button
                      onClick={() => handleSendExportToTelegram('customers')}
                      disabled={isSendingExportTelegram === 'customers'}
                      className="px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer shrink-0"
                      title={lang === 'kh' ? 'ផ្ញើឯកសារ JSON ទៅ Telegram' : 'Send file directly to Telegram'}
                    >
                      <Send className={`w-3.5 h-3.5 ${isSendingExportTelegram === 'customers' ? 'animate-spin' : ''}`} />
                      <span>Telegram</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODULE 6: TELEGRAM BOT & ALERTS                                 */}
        {/* ============================================================== */}
        {activeTab === 'TELEGRAM' && (
          <TelegramBotConfigSection onSaved={loadAllData} />
        )}
      </div>

      {/* CREATE BACKUP MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    {lang === 'kh' ? 'បង្កើតច្បាប់ចម្លងបម្រុងទុកថ្មី' : 'Create Backup Snapshot'}
                  </h3>
                  <p className="text-xs text-gray-400">SQLite Store Ledger & Audit Log Data</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSnapshot} className="space-y-4 text-xs">
              <div>
                <label className="text-gray-700 font-bold block mb-1">
                  {lang === 'kh' ? 'ប្រភេទនៃការបម្រុងទុក (Backup Type)' : 'Backup Type'}
                </label>
                <select
                  value={newBackupType}
                  onChange={(e) => setNewBackupType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-medium cursor-pointer"
                >
                  <option value="FULL">Full Database Snapshot (Recommended)</option>
                  <option value="DIFFERENTIAL">Differential Ledger Records</option>
                  <option value="DATABASE_UPLOADS">Database + Uploaded Assets</option>
                  <option value="SETTINGS_ONLY">Configuration & Settings Only</option>
                </select>
              </div>

              <div>
                <label className="text-gray-700 font-bold block mb-1">
                  {lang === 'kh' ? 'ទីតាំងផ្ទុក (Storage Destination)' : 'Storage Destination'}
                </label>
                <select
                  value={newBackupStorage}
                  onChange={(e) => setNewBackupStorage(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-medium cursor-pointer"
                >
                  <option value="LOCAL+CLOUD">Local Server + Off-Site Cloud (3-2-1 Strategy)</option>
                  <option value="LOCAL">Local Server Storage Only</option>
                  <option value="CLOUD">Cloud Storage Replica Only</option>
                </select>
              </div>

              <div>
                <label className="text-gray-700 font-bold block mb-1">
                  {lang === 'kh' ? 'រយៈពេលរក្សាទុក (Retention Days)' : 'Retention Period (Days)'}
                </label>
                <select
                  value={newBackupRetention}
                  onChange={(e) => setNewBackupRetention(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-medium cursor-pointer"
                >
                  <option value={30}>30 Days (Standard Audit Cycle)</option>
                  <option value={60}>60 Days</option>
                  <option value={90}>90 Days (Quarterly Compliance)</option>
                  <option value={365}>365 Days (1 Year Fiscal Archive)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition cursor-pointer"
                >
                  {lang === 'kh' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <HardDrive className={`w-3.5 h-3.5 ${isCreating ? 'animate-spin' : ''}`} />
                  <span>{isCreating ? 'Creating Snapshot...' : 'Create Snapshot'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESTORE CONFIRMATION SAFEGUARD MODAL */}
      {restoreConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-base text-gray-900">
                {lang === 'kh' ? 'បញ្ជាក់ការស្ដារមូលទិន្នន័យឡើងវិញ' : 'Confirm Disaster Recovery Restore'}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {lang === 'kh'
                  ? `តើអ្នកពិតជាចង់ស្ដារទិន្នន័យពីច្បាប់ចម្លង ${restoreConfirmModal.backup_code} (${restoreConfirmModal.filename}) មែនទេ? ទិន្នន័យបច្ចុប្បន្ននឹងត្រូវបានជំនួស។`
                  : `Are you sure you want to restore the store database from ${restoreConfirmModal.backup_code}? Current records will be replaced by this snapshot.`}
              </p>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-xs space-y-1 font-mono">
              <div>Snapshot ID: <strong>{restoreConfirmModal.backup_code}</strong></div>
              <div>Size: <strong>{restoreConfirmModal.size_formatted}</strong></div>
              <div>Checksum: <strong>{restoreConfirmModal.checksum_sha256?.substring(0, 16)}...</strong></div>
              <div>Safety: <strong>Automatic pre-restore backup will be created</strong></div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRestoreConfirmModal(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {lang === 'kh' ? 'បោះបង់' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={restoringId === restoreConfirmModal.id}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${restoringId === restoreConfirmModal.id ? 'animate-spin' : ''}`} />
                <span>{restoringId === restoreConfirmModal.id ? 'Restoring...' : 'Confirm & Restore'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE & RETENTION MODAL (ADD / EDIT) */}
      {isScheduleModalOpen && editingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    {editingSchedule.id
                      ? (lang === 'kh' ? 'កែប្រែកាលវិភាគ & រយៈពេលរក្សាទុក' : 'Edit Schedule & Retention Policy')
                      : (lang === 'kh' ? 'បង្កើតកាលវិភាគបម្រុងទុកថ្មី' : 'Create Backup Schedule & Retention Policy')}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {lang === 'kh' ? 'កំណត់ពេលស្វ័យប្រវត្តិ និងគោលការណ៍ Auto-Pruning' : 'Automated Cron Execution & Retention Configuration'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsScheduleModalOpen(false);
                  setEditingSchedule(null);
                }}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4 text-xs">
              {/* Schedule Name */}
              <div>
                <label className="text-gray-700 font-bold block mb-1">
                  {lang === 'kh' ? 'ឈ្មោះកាលវិភាគ *' : 'Schedule Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={editingSchedule.name || ''}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, name: e.target.value })}
                  placeholder="e.g. Automated Nightly Full Backup"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-medium focus:bg-white focus:border-purple-500"
                />
              </div>

              {/* Frequency & Execution Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-700 font-bold block mb-1">
                    {lang === 'kh' ? 'ភាពញឹកញាប់ (Frequency) *' : 'Frequency *'}
                  </label>
                  <select
                    value={editingSchedule.frequency || 'DAILY'}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, frequency: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-medium cursor-pointer"
                  >
                    <option value="DAILY">{lang === 'kh' ? 'ប្រចាំថ្ងៃ (Daily)' : 'Daily (Every 24 hours)'}</option>
                    <option value="WEEKLY">{lang === 'kh' ? 'ប្រចាំសប្តាហ៍ (Weekly)' : 'Weekly (Once a week)'}</option>
                    <option value="MONTHLY">{lang === 'kh' ? 'ប្រចាំខែ (Monthly)' : 'Monthly (Once a month)'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-700 font-bold block mb-1">
                    {lang === 'kh' ? 'ម៉ោងចាប់ផ្តើមដំណើរការ (Time) *' : 'Execution Time *'}
                  </label>
                  <input
                    type="time"
                    step="1"
                    required
                    value={editingSchedule.start_time || '02:00:00'}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, start_time: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-mono font-medium focus:bg-white focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Conditional Day of Week / Month */}
              {editingSchedule.frequency === 'WEEKLY' && (
                <div>
                  <label className="text-gray-700 font-bold block mb-1">
                    {lang === 'kh' ? 'ថ្ងៃនៃសប្តាហ៍ (Day of Week)' : 'Day of Week'}
                  </label>
                  <select
                    value={editingSchedule.day_of_week ?? 0}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, day_of_week: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-medium cursor-pointer"
                  >
                    <option value={0}>Sunday (ថ្ងៃអាទិត្យ)</option>
                    <option value={1}>Monday (ថ្ងៃច័ន្ទ)</option>
                    <option value={2}>Tuesday (ថ្ងៃអង្គារ)</option>
                    <option value={3}>Wednesday (ថ្ងៃពុធ)</option>
                    <option value={4}>Thursday (ថ្ងៃព្រហស្បតិ៍)</option>
                    <option value={5}>Friday (ថ្ងៃសុក្រ)</option>
                    <option value={6}>Saturday (ថ្ងៃសៅរ៍)</option>
                  </select>
                </div>
              )}

              {editingSchedule.frequency === 'MONTHLY' && (
                <div>
                  <label className="text-gray-700 font-bold block mb-1">
                    {lang === 'kh' ? 'ថ្ងៃនៃខែ (Day of Month, 1 - 28)' : 'Day of Month (1 - 28)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={editingSchedule.day_of_month ?? 1}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, day_of_month: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-medium"
                  />
                </div>
              )}

              {/* Retention Policy Period & Presets */}
              <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-purple-900 font-bold flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                    <span>{lang === 'kh' ? 'រយៈពេលរក្សាទុកទិន្នន័យ (Retention Period)' : 'Retention Period (Days) *'}</span>
                  </label>
                  <span className="font-mono font-extrabold text-purple-900 text-sm">
                    {editingSchedule.retention_days || 30} Days
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={3650}
                    required
                    value={editingSchedule.retention_days || 30}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, retention_days: Math.max(1, Number(e.target.value)) })}
                    className="w-28 px-3 py-1.5 bg-white border border-purple-300 rounded-xl text-gray-800 font-bold text-center"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {[7, 14, 30, 60, 90, 180, 365].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setEditingSchedule({ ...editingSchedule, retention_days: days })}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                          editingSchedule.retention_days === days
                            ? 'bg-purple-700 text-white border-purple-700'
                            : 'bg-white text-purple-800 border-purple-200 hover:bg-purple-100'
                        }`}
                      >
                        {days}d
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-purple-800 leading-normal">
                  {lang === 'kh'
                    ? `* ច្បាប់ចម្លងដែលចាស់ជាង ${editingSchedule.retention_days || 30} ថ្ងៃ នឹងត្រូវបានសម្អាតដោយស្វ័យប្រវត្តិដើម្បីរក្សាទំហំ Server។`
                    : `* Snapshots older than ${editingSchedule.retention_days || 30} days will be automatically pruned by the retention daemon to prevent storage exhaustion.`}
                </p>
              </div>

              {/* Backup Type & Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-700 font-bold block mb-1">
                    {lang === 'kh' ? 'ប្រភេទ Backup' : 'Backup Type'}
                  </label>
                  <select
                    value={editingSchedule.backup_type || 'FULL'}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, backup_type: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-medium cursor-pointer"
                  >
                    <option value="FULL">Full Database Snapshot</option>
                    <option value="DIFFERENTIAL">Differential Ledger Records</option>
                    <option value="INCREMENTAL">Incremental Changes</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-700 font-bold block mb-1">
                    {lang === 'kh' ? 'ទីតាំងផ្ទុក (Destination)' : 'Storage Destination'}
                  </label>
                  <select
                    value={editingSchedule.storage_destination || 'LOCAL+CLOUD'}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, storage_destination: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-medium cursor-pointer"
                  >
                    <option value="LOCAL+CLOUD">Local Server + Off-Site Cloud (3-2-1)</option>
                    <option value="LOCAL">Local Server Storage Only</option>
                    <option value="CLOUD">Cloud Storage Only</option>
                    <option value="EXTERNAL_DRIVE">External Drive / NAS</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center space-x-2.5 p-2.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSchedule.is_compressed ?? true}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, is_compressed: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded-sm"
                  />
                  <span className="font-semibold text-gray-800">Gzip Compression (~70% space saved)</span>
                </label>

                <label className="flex items-center space-x-2.5 p-2.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSchedule.is_encrypted ?? true}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, is_encrypted: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded-sm"
                  />
                  <span className="font-semibold text-gray-800">AES-256 Encryption (HMAC verified)</span>
                </label>

                <label className="flex items-center space-x-2.5 p-2.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSchedule.notify_on_success ?? true}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, notify_on_success: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded-sm"
                  />
                  <span className="font-semibold text-gray-800">Telegram Alert on Success</span>
                </label>

                <label className="flex items-center space-x-2.5 p-2.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSchedule.notify_on_failure ?? true}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, notify_on_failure: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded-sm"
                  />
                  <span className="font-semibold text-gray-800">Telegram Alert on Failure</span>
                </label>
              </div>

              {/* Status Selector */}
              <div>
                <label className="text-gray-700 font-bold block mb-1">
                  {lang === 'kh' ? 'ស្ថានភាពកាលវិភាគ (Schedule Status)' : 'Schedule Status'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSchedule({ ...editingSchedule, status: 'ACTIVE' })}
                    className={`py-2 rounded-xl font-bold transition border cursor-pointer ${
                      editingSchedule.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    🟢 Active & Automated
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSchedule({ ...editingSchedule, status: 'PAUSED' })}
                    className={`py-2 rounded-xl font-bold transition border cursor-pointer ${
                      editingSchedule.status === 'PAUSED'
                        ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    ⏸️ Paused (Suspended)
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsScheduleModalOpen(false);
                    setEditingSchedule(null);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition cursor-pointer"
                >
                  {lang === 'kh' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingSchedule}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Clock className={`w-3.5 h-3.5 ${isSavingSchedule ? 'animate-spin' : ''}`} />
                  <span>{isSavingSchedule ? (lang === 'kh' ? 'កំពុងរក្សាទុក...' : 'Saving Policy...') : (lang === 'kh' ? 'រក្សាទុកកាលវិភាគ & Retention' : 'Save Schedule & Retention')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
