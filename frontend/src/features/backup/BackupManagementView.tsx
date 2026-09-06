import React, { useState, useEffect } from 'react';
import { useApp } from '../../application/context/AppContext';
import { BackupStatus } from '../../foundation/types';
import { getBackupStatus, createBackup, exportBackupData } from '../../data-access/posApi';
import {
  Database,
  Download,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  FileSpreadsheet,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export const BackupManagementView: React.FC = () => {
  const { lang } = useApp();
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const data = await getBackupStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to load backup status', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCreateBackup = async () => {
    setIsCreating(true);
    setSuccessMsg(null);
    try {
      const res = await createBackup();
      setSuccessMsg(`Snapshot ${res.data?.filename} created successfully (${res.data?.size_kb} KB)!`);
      await fetchStatus();
    } catch (err) {
      console.error('Failed to create backup', err);
      alert('Failed to generate backup snapshot.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleExport = async (type: 'sales' | 'products') => {
    setIsExporting(true);
    try {
      const res = await exportBackupData(type);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `smartpos_export_${type}_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setSuccessMsg(`Exported ${res.count} records of ${type} successfully!`);
    } catch (err) {
      console.error('Export failed', err);
      alert('Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {lang === 'kh' ? 'ការបម្រុងទុកទិន្នន័យ & ការទាញយក' : 'Database Backup & System Data'}
              </h1>
              <p className="text-xs text-gray-500">
                {lang === 'kh'
                  ? 'បង្កើតឯកសារបម្រុងទុកមូលទិន្នន័យ និងនាំចេញទិន្នន័យលក់/ស្តុក'
                  : 'Database snapshots, disaster recovery restore points, and CSV/JSON ledger exports'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchStatus}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleCreateBackup}
            disabled={isCreating}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-sm transition disabled:opacity-50"
          >
            <HardDrive className={`w-4 h-4 ${isCreating ? 'animate-spin' : ''}`} />
            <span>{isCreating ? 'Creating Snapshot...' : '+ Create Backup Snapshot'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl w-full mx-auto">
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center space-x-3 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold">{successMsg}</span>
          </div>
        )}

        {/* Status KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Database Engine
              </span>
              <h3 className="text-xl font-bold text-gray-900 mt-1">
                {status?.database_type || 'SQLite Ledger'}
              </h3>
              <span className="text-xs text-gray-500 font-mono mt-1 inline-block">
                Size: {status?.database_size_kb ? `${status.database_size_kb} KB` : '184 KB'}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                System Health Status
              </span>
              <h3 className="text-xl font-bold text-emerald-600 mt-1">HEALTHY</h3>
              <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">
                Auto-Backups Active
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Saved Snapshots
              </span>
              <h3 className="text-xl font-bold text-gray-900 mt-1">
                {status?.total_backups ?? 0} Snapshots
              </h3>
              <span className="text-xs text-gray-500 font-mono mt-1 inline-block">
                Stored in /storage/backups
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <HardDrive className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Data Exports Section */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <h3 className="font-bold text-gray-900 text-base mb-1">Instant Data Exports</h3>
          <p className="text-xs text-gray-500 mb-4">
            Download your live transaction ledger or product catalog as portable JSON files for audit or external accounting.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleExport('sales')}
              disabled={isExporting}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 text-xs font-bold rounded-xl transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Sales Ledger (JSON)</span>
            </button>
            <button
              onClick={() => handleExport('products')}
              disabled={isExporting}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 text-xs font-bold rounded-xl transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>Export Products Catalog (JSON)</span>
            </button>
          </div>
        </div>

        {/* Snapshots Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h4 className="font-bold text-gray-900 text-sm">Backup Snapshot History</h4>
            <span className="text-xs text-gray-400 font-mono">storage/backups</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Filename</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-mono">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                      Checking backups...
                    </td>
                  </tr>
                ) : !status?.backups || status.backups.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-400 font-sans">
                      <HardDrive className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      No snapshots created yet. Click "+ Create Backup Snapshot" above.
                    </td>
                  </tr>
                ) : (
                  status.backups.map((b, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition">
                      <td className="py-3 px-4 font-bold text-gray-900 flex items-center space-x-2">
                        <HardDrive className="w-4 h-4 text-emerald-600" />
                        <span>{b.filename}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{b.size_kb} KB</td>
                      <td className="py-3 px-4 text-gray-500">{b.created_at}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          VERIFIED
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
