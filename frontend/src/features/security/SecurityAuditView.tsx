import React, { useState, useEffect } from 'react';
import { useApp } from '../../application/context/AppContext';
import { AuditLogItem } from '../../foundation/types';
import { getAuditLogs } from '../../data-access/posApi';
import { RolePermissionManagementView } from '../employees/RolePermissionManagementView';
import { AdminUserRoleAssignmentView } from './AdminUserRoleAssignmentView';
import {
  Shield,
  Search,
  Lock,
  UserCheck,
  RefreshCw,
  Terminal,
  Clock,
  Server,
  KeyRound,
  FileCheck,
  Users,
} from 'lucide-react';

export const SecurityAuditView: React.FC = () => {
  const { lang, securitySubTab, setSecuritySubTab } = useApp();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState('');
  
  const activeTab = (securitySubTab as 'AUDIT_LOGS' | 'USER_ROLES' | 'ROLES' | 'POLICIES') || 'AUDIT_LOGS';
  const setActiveTab = (tab: 'AUDIT_LOGS' | 'USER_ROLES' | 'ROLES' | 'POLICIES') => {
    setSecuritySubTab(tab);
  };

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await getAuditLogs(actionFilter ? { action: actionFilter } : undefined);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'AUDIT_LOGS') {
      fetchLogs();
    }
  }, [actionFilter, activeTab]);

  const roles = [
    {
      name: 'Super Admin',
      code: 'SUPER_ADMIN',
      description: 'Unrestricted system access, multi-branch control, ledger audits, and system configuration.',
      usersCount: 1,
      permissions: ['ALL_PERMISSIONS', 'MANAGE_USERS', 'OVERRIDE_PRICES', 'EXPORT_LEDGER', 'CONFIG_SETTINGS'],
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    },
    {
      name: 'Branch Manager',
      code: 'BRANCH_MANAGER',
      description: 'Daily store operations, shift opening/closing approval, purchasing, and stock adjustments.',
      usersCount: 2,
      permissions: ['OPEN_SHIFT', 'CLOSE_SHIFT', 'VOID_SALE', 'APPROVE_PURCHASE', 'STOCK_ADJUST'],
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    {
      name: 'POS Cashier',
      code: 'CASHIER',
      description: 'Cash register operations, checkout, KHQR scan generation, and customer registration.',
      usersCount: 4,
      permissions: ['CREATE_SALE', 'PRINT_RECEIPT', 'SCAN_BARCODE', 'APPLY_DISCOUNT_LIMITED', 'VIEW_STOCK'],
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      name: 'Inventory Officer',
      code: 'INVENTORY_OFFICER',
      description: 'Warehouse receipts, transfers between central warehouse and store floor, counts.',
      usersCount: 1,
      permissions: ['RECEIVE_PURCHASE', 'TRANSFER_STOCK', 'VIEW_STOCK_LEDGER'],
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    },
  ];

  return (
    <div className="flex-1 bg-gray-50 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {lang === 'kh' ? 'សន្តិសុខប្រព័ន្ធ & កំណត់ត្រាអធិការកិច្ច' : 'Security & Audit Trail'}
              </h1>
              <p className="text-xs text-gray-500">
                {lang === 'kh'
                  ? 'កំណត់ត្រាសកម្មភាពប្រតិបត្តិការ តួនាទីអ្នកប្រើប្រាស់ និងសិទ្ធិអនុញ្ញាត'
                  : 'Immutable audit logs, user roles & permissions matrix, and compliance status'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
            title={lang === 'kh' ? 'ផ្ទុកទិន្នន័យឡើងវិញ' : 'Refresh'}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-2.5 flex items-center space-x-4">
        {[
          { id: 'AUDIT_LOGS', label: 'Audit Trail Logs', labelKh: 'កំណត់ត្រាអធិការកិច្ច', icon: <Terminal className="w-4 h-4" /> },
          { id: 'USER_ROLES', label: 'User Roles & Access', labelKh: 'តួនាទីអ្នកប្រើ & សិទ្ធិ', icon: <Users className="w-4 h-4" /> },
          { id: 'ROLES', label: 'Roles & Permission Matrix', labelKh: 'ម៉ាទ្រីសសិទ្ធិអនុញ្ញាត', icon: <UserCheck className="w-4 h-4" /> },
          { id: 'POLICIES', label: 'Security Status & Policy', labelKh: 'គោលការណ៍សន្តិសុខ & ស្ថានភាព', icon: <Lock className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === tab.id
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            <span>{lang === 'kh' ? tab.labelKh : tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === 'AUDIT_LOGS' && (
          <>
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3 flex-1">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter by action (e.g. SALE_COMPLETED, SHIFT_OPENED)..."
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-full text-sm border-none bg-transparent focus:outline-hidden"
                />
              </div>
              <span className="text-xs text-gray-400 font-mono">
                {logs.length} Total Audited Events
              </span>
            </div>

            {/* Audit Log Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/75 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Entity</th>
                      <th className="py-3 px-4">IP Address</th>
                      <th className="py-3 px-4">User Agent / Client</th>
                      <th className="py-3 px-4">Changes (JSON Diff)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                          Loading audit records...
                        </td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400">
                          <Terminal className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                          No audit logs found.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/50 transition font-mono text-xs">
                          <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-800">
                            {log.entity_type} #{log.entity_id || '—'}
                          </td>
                          <td className="py-3 px-4 text-gray-500">{log.ip_address || '127.0.0.1'}</td>
                          <td className="py-3 px-4 text-gray-400 max-w-xs truncate">{log.user_agent || 'SmartPOS Client'}</td>
                          <td className="py-3 px-4 max-w-md">
                            <div className="bg-gray-50 p-2 rounded-lg text-[11px] text-gray-700 font-mono truncate">
                              {log.new_values ? (typeof log.new_values === 'string' ? log.new_values : JSON.stringify(log.new_values)) : '—'}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'USER_ROLES' && (
          <AdminUserRoleAssignmentView />
        )}

        {activeTab === 'ROLES' && (
          <RolePermissionManagementView />
        )}

        {activeTab === 'POLICIES' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900">Database Ledger Integrity</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Non-destructive audit logging active. Sales voids and stock changes write compensating ledger entries without deleting original rows.
              </p>
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active & Compliant</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900">Authentication & Session</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Cashier sessions timeout after 15 minutes of idle time. Shift locks protect cash drawer access when cashier steps away.
              </p>
              <div className="flex items-center space-x-2 text-xs font-bold text-blue-600">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Enforced on Terminals</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900">Fiscal Tax Compliance</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Sequential tax invoice numbering conforming to Cambodia GDT requirements. Invoices are locked upon generation.
              </p>
              <div className="flex items-center space-x-2 text-xs font-bold text-purple-600">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>GDT 10% VAT Standard</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
