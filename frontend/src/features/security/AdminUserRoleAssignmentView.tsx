import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../application/context/AppContext';
import {
  Users,
  Shield,
  Search,
  RefreshCw,
  Edit2,
  Building2,
  CheckCircle2,
  X,
  Globe,
  Server,
  UserCheck,
  ShieldCheck,
  Briefcase,
  AlertCircle,
  Lock
} from 'lucide-react';
import {
  AdminUserItem,
  getAdminUsers,
  getAdminBranches,
  assignUserRole,
  getRoles
} from '../../data-access/posApi';
import { RoleItem } from '../../foundation/types';

export const AdminUserRoleAssignmentView: React.FC = () => {
  const { lang, currentUser, notify } = useApp();

  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [branches, setBranches] = useState<Array<{ id: number; name: string; code: string; is_active: boolean }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');

  // Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [targetRole, setTargetRole] = useState<string>('CASHIER');
  const [targetBranchId, setTargetBranchId] = useState<number | undefined>(undefined);
  const [changeReason, setChangeReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');

  const isAdmin = useMemo(() => {
    if (!currentUser) return false;
    const roleCodes = currentUser.roles?.map((r: any) => r.code?.toUpperCase()) || [];
    return roleCodes.some((code: string) => ['ADMIN', 'SUPER_ADMIN'].includes(code)) ||
      ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.primary_role?.toUpperCase() || '');
  }, [currentUser]);

  const isSuperAdmin = useMemo(() => {
    if (!currentUser) return false;
    const roleCodes = currentUser.roles?.map((r: any) => r.code?.toUpperCase()) || [];
    return roleCodes.includes('SUPER_ADMIN') || currentUser.primary_role?.toUpperCase() === 'SUPER_ADMIN';
  }, [currentUser]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, branchesData, rolesData] = await Promise.all([
        getAdminUsers(),
        getAdminBranches().catch(() => []),
        getRoles().catch(() => []),
      ]);
      setUsers(usersData);
      setBranches(branchesData);
      setRoles(rolesData);
      if (branchesData.length > 0 && !targetBranchId) {
        setTargetBranchId(branchesData[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load user management data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    notify.success(msg, lang === 'kh' ? 'សន្តិសុខ និងតួនាទី' : 'Role Assignment');
  };

  // KPIs
  const stats = useMemo(() => {
    const total = users.length;
    let publicCustomers = 0;
    let staffCount = 0;
    let adminCount = 0;

    users.forEach((u) => {
      const rCodes = u.roles?.map((r) => r.code?.toUpperCase()) || [];
      const isStaff = rCodes.some((code) =>
        ['CASHIER', 'MANAGER', 'STOCK_MANAGER', 'ACCOUNTANT', 'HR', 'EMPLOYEE'].includes(code)
      );
      const isAdmin = rCodes.some((code) => ['ADMIN', 'SUPER_ADMIN'].includes(code));

      if (u.registration_source === 'public' || rCodes.includes('CUSTOMER')) {
        publicCustomers++;
      }
      if (isStaff) staffCount++;
      if (isAdmin) adminCount++;
    });

    return { total, publicCustomers, staffCount, adminCount };
  }, [users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesUsername = u.username.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        const matchesPhone = u.phone?.toLowerCase().includes(q) || false;
        const matchesCust = u.customer?.name?.toLowerCase().includes(q) || false;
        if (!matchesUsername && !matchesEmail && !matchesPhone && !matchesCust) return false;
      }

      if (roleFilter !== 'ALL') {
        const rCodes = u.roles?.map((r) => r.code?.toUpperCase()) || [];
        if (!rCodes.includes(roleFilter)) return false;
      }

      if (sourceFilter !== 'ALL') {
        if (u.registration_source !== sourceFilter) return false;
      }

      return true;
    });
  }, [users, searchQuery, roleFilter, sourceFilter]);

  const handleOpenAssignModal = (user: AdminUserItem) => {
    setSelectedUser(user);
    const currentCode = user.roles?.[0]?.code?.toUpperCase() || 'CUSTOMER';
    setTargetRole(currentCode === 'CUSTOMER' ? 'CASHIER' : currentCode);
    setTargetBranchId(user.employee?.branch_id || branches[0]?.id || 1);
    setChangeReason('');
    setModalError('');
    setIsAssignModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (['ADMIN', 'SUPER_ADMIN'].includes(targetRole) && !isSuperAdmin) {
      setModalError('Only Super Administrators have permission to assign Admin or Super Admin roles.');
      return;
    }

    setIsSubmitting(true);
    setModalError('');

    try {
      const res = await assignUserRole(selectedUser.id, {
        role: targetRole,
        branch_id: targetBranchId,
        reason: changeReason || `Promoted/Changed role to ${targetRole}`,
      });

      if (res.success) {
        showToast(res.message || 'User role updated successfully.');
        setIsAssignModalOpen(false);
        loadData();
      } else {
        const errorMsg = res.message || 'Failed to update role.';
        setModalError(errorMsg);
        notify.error(errorMsg, lang === 'kh' ? 'កំហុសតួនាទី' : 'Role Error');
      }
    } catch (err: any) {
      console.error('Failed to assign role', err);
      const errorMsg = err.response?.data?.message || 'Server error while assigning role.';
      setModalError(errorMsg);
      notify.error(errorMsg, lang === 'kh' ? 'កំហុសតួនាទី' : 'Role Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Users</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Public Customers</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats.publicCustomers}</p>
            <span className="text-[10px] text-gray-400">Self-registered via Portal</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Globe className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Staff Members</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{stats.staffCount}</p>
            <span className="text-[10px] text-gray-400">Cashiers, Managers, HR</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Administrators</p>
            <p className="text-2xl font-black text-purple-600 mt-1">{stats.adminCount}</p>
            <span className="text-[10px] text-gray-400">Admin & Super Admin</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start space-x-3">
        <Shield className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
        <div className="text-xs text-indigo-900 leading-relaxed">
          <span className="font-bold">Admin-Only Role Assignment Rule:</span> All customers who register by themselves automatically receive the{' '}
          <code className="bg-indigo-100 text-indigo-800 px-1 py-0.5 rounded font-bold">customer</code> role.
          <strong> Only an Administrator</strong> has permission to assign customers who registered themselves to other roles (e.g. Cashier, Manager, Stock Manager).
          Promoting any user to <span className="font-bold text-indigo-950">ADMIN</span> or{' '}
          <span className="font-bold text-indigo-950">SUPER_ADMIN</span> strictly requires Super Administrator credentials.
          All role modifications are immutably logged in the Security Audit Log.
        </div>
      </div>

      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center space-x-3 text-amber-900 text-xs font-medium">
          <Lock className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            <strong>Restricted Access:</strong> You are currently viewing user records with non-administrator privileges. Only system Administrators can assign or promote customers who registered themselves to other internal roles.
          </span>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center space-x-3 flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by username, email, phone, or customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm border-none bg-transparent focus:outline-hidden"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-xs text-gray-400 hover:text-gray-600">
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-hidden"
          >
            <option value="ALL">All Roles</option>
            <option value="CUSTOMER">Customers Only</option>
            <option value="CASHIER">Cashiers Only</option>
            <option value="MANAGER">Managers Only</option>
            <option value="ADMIN">Admins Only</option>
            <option value="SUPER_ADMIN">Super Admins Only</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-hidden"
          >
            <option value="ALL">All Sources</option>
            <option value="public">Public Self-Registration</option>
            <option value="system">System Created</option>
          </select>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
            title="Reload Users"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wider font-semibold border-b border-gray-200">
                <th className="py-3.5 px-4">User Account</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Current Role</th>
                <th className="py-3.5 px-4">Linked Profile</th>
                <th className="py-3.5 px-4">Branch</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No users matching criteria
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleObj = u.roles?.[0];
                  const roleCode = roleObj?.code?.toUpperCase() || 'CUSTOMER';
                  const isStaffRole = ['CASHIER', 'MANAGER', 'STOCK_MANAGER', 'ACCOUNTANT', 'HR', 'EMPLOYEE'].includes(roleCode);
                  const isAdminRole = ['ADMIN', 'SUPER_ADMIN'].includes(roleCode);

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center uppercase">
                            {u.username.substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 flex items-center space-x-1.5">
                              <span>{u.username}</span>
                              {u.status_id === 1 && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active" />
                              )}
                            </div>
                            <div className="text-gray-500 text-[11px]">{u.email}</div>
                            {u.phone && <div className="text-gray-400 text-[10px]">{u.phone}</div>}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {u.registration_source === 'public' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            <Globe className="w-3 h-3" />
                            <span>Public Portal</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                            <Server className="w-3 h-3" />
                            <span>System Admin</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isAdminRole ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{roleObj?.name || roleCode}</span>
                          </span>
                        ) : isStaffRole ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Briefcase className="w-3.5 h-3.5" />
                            <span>{roleObj?.name || roleCode}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>{roleObj?.name || 'Customer'}</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {u.customer && (
                          <div>
                            <span className="font-mono font-bold text-gray-800">{u.customer.customer_code}</span>
                            <div className="text-gray-500 text-[11px]">{u.customer.name}</div>
                          </div>
                        )}
                        {u.employee && (
                          <div className="mt-0.5">
                            <span className="font-mono text-gray-600 text-[11px]">{u.employee.employee_code}</span>
                            <div className="text-gray-500 text-[10px]">{u.employee.first_name} {u.employee.last_name}</div>
                          </div>
                        )}
                        {!u.customer && !u.employee && (
                          <span className="text-gray-400 italic text-[11px]">No linked entity</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {u.employee?.branch ? (
                          <span className="inline-flex items-center space-x-1 text-gray-700 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-gray-400" />
                            <span>{u.employee.branch.name}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px]">Primary Store</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isAdmin ? (
                          <button
                            onClick={() => handleOpenAssignModal(u)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold transition text-xs"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Assign Role</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-gray-100 text-gray-500 font-medium text-xs">
                            <Lock className="w-3 h-3 text-gray-400" />
                            <span>Admin Only</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAssignModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Assign User Role & Branch</h3>
                  <p className="text-xs text-gray-500">
                    Modify permissions and privileges for <span className="font-semibold text-gray-800">{selectedUser.username}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveRole} className="space-y-4">
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">User Email</span>
                  <span className="font-medium text-gray-800">{selectedUser.email}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Current Role</span>
                  <span className="font-bold text-indigo-700">
                    {selectedUser.roles?.[0]?.name || selectedUser.roles?.[0]?.code || 'CUSTOMER'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Registration Source</span>
                  <span className="capitalize font-medium text-gray-700">{selectedUser.registration_source || 'system'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Linked Entity</span>
                  <span className="font-medium text-gray-700">
                    {selectedUser.customer ? `Customer (${selectedUser.customer.customer_code})` : selectedUser.employee ? `Employee (${selectedUser.employee.employee_code})` : 'None'}
                  </span>
                </div>
              </div>

              {(selectedUser.registration_source === 'public' || selectedUser.customer) && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">Self-Registered Customer:</span> This user registered themselves. Only Administrators have permission to assign them to other internal or system roles. Assigning an internal staff role will automatically create an Employee profile and link them to the selected branch.
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Select New Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <optgroup label="Customer Portal">
                    <option value="CUSTOMER">Customer (Default for Public Users)</option>
                  </optgroup>
                  <optgroup label="Internal Staff Roles">
                    <option value="CASHIER">Cashier (POS Checkout & Receipts)</option>
                    <option value="MANAGER">Branch Manager (Approvals & Shifts)</option>
                    <option value="STOCK_MANAGER">Stock Manager (Ledger & Warehouses)</option>
                    <option value="ACCOUNTANT">Accountant (Invoices & Financials)</option>
                    <option value="HR">HR Specialist (Staff & Attendance)</option>
                    <option value="EMPLOYEE">General Employee</option>
                  </optgroup>
                  <optgroup label="System Administrators">
                    <option value="ADMIN" disabled={!isSuperAdmin}>
                      Store Admin {!isSuperAdmin ? '(Super Admin Required)' : ''}
                    </option>
                    <option value="SUPER_ADMIN" disabled={!isSuperAdmin}>
                      Super Administrator {!isSuperAdmin ? '(Super Admin Required)' : ''}
                    </option>
                  </optgroup>
                </select>
                {!isSuperAdmin && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    * Admin and Super Admin roles can only be granted by a logged-in Super Administrator.
                  </p>
                )}
              </div>

              {targetRole !== 'CUSTOMER' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Assign Store Branch <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={targetBranchId}
                    onChange={(e) => setTargetBranchId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Reason for Role Change (Audit Record)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Promoted customer to full-time cashier, Approved by HR"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition text-xs flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Role Change</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
