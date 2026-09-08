import React, { useState, useEffect } from 'react';
import { useApp } from '../../application/context/AppContext';
import { AuditLogItem } from '../../foundation/types';
import { getAuditLogs } from '../../data-access/posApi';
import { RolePermissionManagementView } from '../employees/RolePermissionManagementView';
import { AdminUserRoleAssignmentView } from './AdminUserRoleAssignmentView';
import { UserLoginAuditView } from './UserLoginAuditView';
import {
  Search,
  RefreshCw,
  Terminal,
  Server,
  KeyRound,
  FileCheck,
} from 'lucide-react';

export const SecurityAuditView: React.FC = () => {
  const { lang, securitySubTab } = useApp();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState('');

  const activeTab = (securitySubTab as 'AUDIT_LOGS' | 'LOGIN_AUDIT' | 'USER_ROLES' | 'ROLES' | 'POLICIES') || 'AUDIT_LOGS';

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

  return (
    <div className="flex-1 bg-gray-50 flex flex-col h-full overflow-hidden">

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === 'AUDIT_LOGS' && (
          <>
            {/* Filter Bar */}
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center space-x-3 flex-1">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={
                    lang === 'kh'
                      ? 'ស្វែងរកតាមសកម្មភាព (ឧ. SALE_COMPLETED, SHIFT_OPENED)...'
                      : 'Filter by action (e.g. SALE_COMPLETED, SHIFT_OPENED)...'
                  }
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-full text-sm border-none bg-transparent focus:outline-hidden text-gray-800 placeholder-gray-400"
                />
              </div>
              <div className="flex items-center space-x-3 shrink-0">
                <span className="text-xs text-gray-400 font-mono">
                  {logs.length} {lang === 'kh' ? 'ព្រឹត្តិការណ៍សរុប' : 'Total Audited Events'}
                </span>
                <button
                  onClick={fetchLogs}
                  disabled={isLoading}
                  className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                  title={lang === 'kh' ? 'ផ្ទុកទិន្នន័យឡើងវិញ' : 'Refresh'}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
                </button>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/75 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-3 px-4">{lang === 'kh' ? 'កាលបរិច្ឆេទ & ម៉ោង' : 'Timestamp'}</th>
                      <th className="py-3 px-4">{lang === 'kh' ? 'សកម្មភាព' : 'Action'}</th>
                      <th className="py-3 px-4">{lang === 'kh' ? 'ទិន្នន័យពាក់ព័ន្ធ' : 'Entity'}</th>
                      <th className="py-3 px-4">{lang === 'kh' ? 'អាសយដ្ឋាន IP' : 'IP Address'}</th>
                      <th className="py-3 px-4">{lang === 'kh' ? 'ឧបករណ៍ / កម្មវិធី' : 'User Agent / Client'}</th>
                      <th className="py-3 px-4">{lang === 'kh' ? 'ការកែប្រែទិន្នន័យ (JSON)' : 'Changes (JSON Diff)'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                          {lang === 'kh' ? 'កំពុងផ្ទុកកំណត់ត្រាអធិការកិច្ច...' : 'Loading audit records...'}
                        </td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400">
                          <Terminal className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                          {lang === 'kh' ? 'មិនមានកំណត់ត្រាអធិការកិច្ចទេ' : 'No audit logs found.'}
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

        {activeTab === 'LOGIN_AUDIT' && (
          <UserLoginAuditView />
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
              <h3 className="font-bold text-gray-900">
                {lang === 'kh' ? 'សុចរិតភាពនៃសៀវភៅកត់ត្រាមូលទិន្នន័យ' : 'Database Ledger Integrity'}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {lang === 'kh'
                  ? 'ប្រព័ន្ធកត់ត្រាអធិការកិច្ចមិនអាចលុបបានសកម្ម។ ការលុបចោលការលក់ និងការកែសម្រួលស្តុក ត្រូវបានកត់ត្រាបន្ថែមដោយមិនលុបទិន្នន័យដើម។'
                  : 'Non-destructive audit logging active. Sales voids and stock changes write compensating ledger entries without deleting original rows.'}
              </p>
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{lang === 'kh' ? 'សកម្ម & ស្របតាមស្តង់ដារ' : 'Active & Compliant'}</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900">
                {lang === 'kh' ? 'ការផ្ទៀងផ្ទាត់ភាពត្រឹមត្រូវ & វគ្គការងារ' : 'Authentication & Session'}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {lang === 'kh'
                  ? 'វគ្គការងាររបស់អ្នកគិតលុយនឹងផុតកំណត់បន្ទាប់ពីទំនេរ ១៥ នាទី។ ការចាក់សោវេនជួយការពារថតប្រាក់ពេលអ្នកគិតលុយចេញក្រៅ។'
                  : 'Cashier sessions timeout after 15 minutes of idle time. Shift locks protect cash drawer access when cashier steps away.'}
              </p>
              <div className="flex items-center space-x-2 text-xs font-bold text-blue-600">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>{lang === 'kh' ? 'អនុវត្តលើម៉ាស៊ីន POS' : 'Enforced on Terminals'}</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900">
                {lang === 'kh' ? 'អនុលោមភាពពន្ធដារ' : 'Fiscal Tax Compliance'}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {lang === 'kh'
                  ? 'លេខវិក្កយបត្រពន្ធបន្តបន្ទាប់ស្របតាមតម្រូវការរបស់អគ្គនាយកដ្ឋានពន្ធដារ (GDT)។ វិក្កយបត្រត្រូវបានចាក់សោរភ្លាមៗបន្ទាប់ពីបង្កើត។'
                  : 'Sequential tax invoice numbering conforming to Cambodia GDT requirements. Invoices are locked upon generation.'}
              </p>
              <div className="flex items-center space-x-2 text-xs font-bold text-purple-600">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>{lang === 'kh' ? 'ស្តង់ដារអាករលើតម្លៃបន្ថែម ១០%' : 'GDT 10% VAT Standard'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
