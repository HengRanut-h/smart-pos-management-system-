import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Key,
  Lock,
  Check,
  Plus,
  Edit3,
  Trash2,
  Save,
  Search,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  ShieldAlert
} from 'lucide-react';
import {
  getRoles,
  getSystemPermissions,
  createRole,
  updateRole,
  syncRolePermissions,
  deleteRole
} from '../../data-access/posApi';
import { RoleItem, PermissionItem } from '../../foundation/types';
import { useApp } from '../../application/context/AppContext';

interface RolePermissionManagementViewProps {
  onBack?: () => void;
}

export const RolePermissionManagementView: React.FC<RolePermissionManagementViewProps> = ({ onBack }) => {
  const { lang, notify, confirmDelete } = useApp();

  const [loading, setLoading] = useState<boolean>(true);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, PermissionItem[]>>({});
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
  const [activePermissionIds, setActivePermissionIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState<boolean>(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState<boolean>(false);
  const [newRoleName, setNewRoleName] = useState<string>('');
  const [newRoleCode, setNewRoleCode] = useState<string>('');
  const [newRoleDesc, setNewRoleDesc] = useState<string>('');
  const [isSubmittingRole, setIsSubmittingRole] = useState<boolean>(false);

  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  const fetchRolesAndPermissions = async () => {
    setLoading(true);
    try {
      const [rolesData, permRes] = await Promise.all([
        getRoles(),
        getSystemPermissions(),
      ]);

      setRoles(rolesData);
      setPermissions(permRes.data || []);
      setGroupedPermissions(permRes.grouped || {});

      if (rolesData.length > 0) {
        const first = rolesData[0];
        setSelectedRole(first);
        const assignedIds = first.permissions ? first.permissions.map((p) => p.id) : [];
        setActivePermissionIds(assignedIds);
      }
    } catch (err) {
      console.error('Failed to load roles and permissions', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = (role: RoleItem) => {
    setSelectedRole(role);
    const assignedIds = role.permissions ? role.permissions.map((p) => p.id) : [];
    setActivePermissionIds(assignedIds);
  };

  const handleTogglePermission = (permId: number) => {
    if (activePermissionIds.includes(permId)) {
      setActivePermissionIds(activePermissionIds.filter((id) => id !== permId));
    } else {
      setActivePermissionIds([...activePermissionIds, permId]);
    }
  };

  const handleToggleModulePermissions = (modulePerms: PermissionItem[]) => {
    const modulePermIds = modulePerms.map((p) => p.id);
    const allAssigned = modulePermIds.every((id) => activePermissionIds.includes(id));

    if (allAssigned) {
      // Uncheck all in this module
      setActivePermissionIds(activePermissionIds.filter((id) => !modulePermIds.includes(id)));
    } else {
      // Check all in this module
      const combined = Array.from(new Set([...activePermissionIds, ...modulePermIds]));
      setActivePermissionIds(combined);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    try {
      const updated = await syncRolePermissions(selectedRole.id, activePermissionIds);
      setRoles(roles.map((r) => (r.id === updated.id ? updated : r)));
      setSelectedRole(updated);
      notify.success(
        lang === 'kh'
          ? `សិទ្ធិតួនាទី "${updated.name}" ត្រូវបានកែប្រែជោគជ័យ!`
          : `Permissions for role "${updated.name}" updated successfully!`,
        'Permissions Saved'
      );
    } catch (err: any) {
      console.error('Failed to save role permissions', err);
      notify.error(err.response?.data?.message || 'Failed to update role permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    setIsSubmittingRole(true);
    try {
      const created = await createRole({
        name: newRoleName.trim(),
        code: newRoleCode.trim() || undefined,
        description: newRoleDesc.trim() || undefined,
        permission_ids: activePermissionIds,
      });

      setRoles([...roles, created]);
      setSelectedRole(created);
      setIsCreateRoleModalOpen(false);
      setNewRoleName('');
      setNewRoleCode('');
      setNewRoleDesc('');

      notify.success(
        lang === 'kh'
          ? `តួនាទី "${created.name}" ត្រូវបានបង្កើតជោគជ័យ!`
          : `Role "${created.name}" created successfully!`,
        'Role Created'
      );
    } catch (err: any) {
      console.error('Failed to create role', err);
      notify.error(err.response?.data?.message || 'Failed to create role');
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const handleEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !newRoleName.trim()) return;

    setIsSubmittingRole(true);
    try {
      const updated = await updateRole(selectedRole.id, {
        name: newRoleName.trim(),
        description: newRoleDesc.trim() || undefined,
      });

      setRoles(roles.map((r) => (r.id === updated.id ? updated : r)));
      setSelectedRole(updated);
      setIsEditRoleModalOpen(false);

      notify.success(
        lang === 'kh' ? 'ព័ត៌មានតួនាទីត្រូវបានកែប្រែជោគជ័យ!' : 'Role details updated successfully!',
        'Role Updated'
      );
    } catch (err: any) {
      console.error('Failed to update role', err);
      notify.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const handleDeleteRole = async (role: RoleItem) => {
    if (['SUPER_ADMIN', 'ADMIN', 'CASHIER'].includes(role.code.toUpperCase())) {
      notify.warning(
        lang === 'kh' ? 'តួនាទីការពាររបស់ប្រព័ន្ធមិនអាចលុបបានទេ!' : 'System protected roles cannot be deleted.',
        'Protected Role'
      );
      return;
    }

    const ok = await confirmDelete({
      title: lang === 'kh' ? 'លុបតួនាទី?' : 'Delete Role?',
      message: lang === 'kh' ? `តើអ្នកពិតជាចង់លុបតួនាទី "${role.name}" មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។` : `Are you sure you want to delete role "${role.name}"? This action cannot be undone.`,
      confirmText: lang === 'kh' ? 'យល់ព្រមលុប' : 'Delete Role',
    });
    if (!ok) return;

    try {
      await deleteRole(role.id);
      const remaining = roles.filter((r) => r.id !== role.id);
      setRoles(remaining);
      if (selectedRole?.id === role.id && remaining.length > 0) {
        handleSelectRole(remaining[0]);
      }
      notify.success(
        lang === 'kh'
          ? `តួនាទី "${role.name}" ត្រូវបានលុបជោគជ័យ!`
          : `Role "${role.name}" deleted successfully.`,
        'Role Deleted'
      );
    } catch (err: any) {
      console.error('Failed to delete role', err);
      notify.error(err.response?.data?.message || 'Failed to delete role');
    }
  };

  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return roles;
    const q = searchQuery.toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q))
    );
  }, [roles, searchQuery]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* 1. Page Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-200">
            <Shield className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {lang === 'kh' ? 'គ្រប់គ្រងតួនាទី និង សិទ្ធិប្រើប្រាស់' : 'Roles & Permissions Security Access'}
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                SECURITY ACL
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {lang === 'kh' ? 'កំណត់សិទ្ធិចូលប្រើប្រាស់ប្រព័ន្ធ (Access Control Matrix) តាមតួនាទីបុគ្គលិកនីមួយៗ' : 'Configure role-based access control matrix (RBAC) and assign module security permissions'}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            setNewRoleName('');
            setNewRoleCode('');
            setNewRoleDesc('');
            setIsCreateRoleModalOpen(true);
          }}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-emerald-200 flex items-center space-x-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'kh' ? 'បង្កើតតួនាទីថ្មី' : 'Create New Role'}</span>
        </button>
      </div>

      {/* 2. Main Workspace Layout: Roles Selector Sidebar + Permission Matrix */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 border border-gray-200 text-center text-gray-500 space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold">Loading roles and permissions matrix...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Roles Selector Sidebar (4 Cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-gray-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-gray-900 uppercase tracking-wider">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>System Roles ({roles.length})</span>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-800"
              />
            </div>

            {/* Roles List */}
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {filteredRoles.map((role) => {
                const isSelected = selectedRole?.id === role.id;
                const isSystemProtected = ['SUPER_ADMIN', 'ADMIN', 'CASHIER'].includes(role.code.toUpperCase());
                const permCount = role.permissions ? role.permissions.length : 0;

                return (
                  <div
                    key={role.id}
                    onClick={() => handleSelectRole(role)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-300 shadow-2xs'
                        : 'bg-gray-50/50 border-gray-200/80 hover:bg-gray-100/60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-xs text-gray-900">{role.name}</span>
                        {isSystemProtected && (
                          <span className="text-[9px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 uppercase">
                            Protected
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[10px] text-emerald-700 font-semibold">{role.code}</div>
                      {role.description && (
                        <p className="text-[11px] text-gray-500 line-clamp-1">{role.description}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black font-mono text-emerald-800 bg-emerald-100 px-2 py-1 rounded-xl border border-emerald-200 inline-block">
                        {permCount} perms
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Interactive Permission Checkbox Matrix (8 Cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-6">
            {selectedRole ? (
              <>
                {/* Selected Role Banner Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg border border-emerald-200">
                      <Lock className="w-6 h-6 text-emerald-700" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-xl font-extrabold text-gray-900">{selectedRole.name}</h2>
                        <span className="font-mono text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                          {selectedRole.code}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {selectedRole.description || 'Configuring security permissions access control'}
                      </p>
                    </div>
                  </div>

                  {/* Actions Header */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setNewRoleName(selectedRole.name);
                        setNewRoleDesc(selectedRole.description || '');
                        setIsEditRoleModalOpen(true);
                      }}
                      className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition text-xs font-bold flex items-center space-x-1"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span className="hidden sm:inline">Edit Details</span>
                    </button>

                    {!['SUPER_ADMIN', 'ADMIN', 'CASHIER'].includes(selectedRole.code.toUpperCase()) && (
                      <button
                        onClick={() => handleDeleteRole(selectedRole)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition text-xs font-bold flex items-center space-x-1 border border-rose-200"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete Role</span>
                      </button>
                    )}

                    <button
                      onClick={handleSavePermissions}
                      disabled={isSaving}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-200 transition"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>{isSaving ? 'Saving...' : 'Save Permissions'}</span>
                    </button>
                  </div>
                </div>

                {/* Module-by-Module Permission Matrix */}
                <div className="space-y-6">
                  {Object.keys(groupedPermissions).length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      No system permissions registered
                    </div>
                  ) : (
                    Object.entries(groupedPermissions).map(([moduleName, modulePerms]) => {
                      const allModuleSelected = modulePerms.every((p) => activePermissionIds.includes(p.id));

                      return (
                        <div key={moduleName} className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 space-y-3">
                          {/* Module Group Header */}
                          <div className="flex items-center justify-between border-b border-gray-200/80 pb-2.5">
                            <div className="flex items-center space-x-2">
                              <ShieldAlert className="w-4 h-4 text-emerald-600" />
                              <h3 className="text-xs font-black uppercase text-gray-900 tracking-wider">
                                {moduleName} Module
                              </h3>
                              <span className="text-[10px] text-gray-500 font-semibold bg-gray-200/80 px-2 py-0.5 rounded-full">
                                {modulePerms.filter((p) => activePermissionIds.includes(p.id)).length}/{modulePerms.length} Active
                              </span>
                            </div>

                            <button
                              onClick={() => handleToggleModulePermissions(modulePerms)}
                              className="text-[11px] font-bold text-emerald-700 hover:underline"
                            >
                              {allModuleSelected ? 'Unselect All' : 'Select All'}
                            </button>
                          </div>

                          {/* Permission Grid Items */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {modulePerms.map((perm) => {
                              const isChecked = activePermissionIds.includes(perm.id);

                              return (
                                <label
                                  key={perm.id}
                                  onClick={() => handleTogglePermission(perm.id)}
                                  className={`p-3 rounded-xl border transition cursor-pointer flex items-start space-x-3 ${
                                    isChecked
                                      ? 'bg-white border-emerald-300 shadow-2xs'
                                      : 'bg-white/60 border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}}
                                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 border-gray-300"
                                  />
                                  <div className="space-y-0.5">
                                    <span className="font-bold text-xs text-gray-900 block">{perm.name}</span>
                                    <span className="font-mono text-[10px] text-emerald-700 block">{perm.code}</span>
                                    {perm.description && (
                                      <p className="text-[10px] text-gray-500">{perm.description}</p>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-gray-400">
                Select a role from the left menu to view and configure its permission matrix.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Create Role Modal */}
      {isCreateRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2 text-emerald-600">
                <Shield className="w-5 h-5" />
                <h3 className="text-base font-black text-gray-900">Create New System Role</h3>
              </div>
              <button
                onClick={() => setIsCreateRoleModalOpen(false)}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Role Title Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Shift Supervisor"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Role Security Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. SHIFT_SUPERVISOR (auto-generated if empty)"
                  value={newRoleCode}
                  onChange={(e) => setNewRoleCode(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of duties and authorization scope"
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateRoleModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRole}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-200 transition"
                >
                  {isSubmittingRole ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>{isSubmittingRole ? 'Creating...' : 'Create Role'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Edit Role Metadata Modal */}
      {isEditRoleModalOpen && selectedRole && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2 text-emerald-600">
                <Edit3 className="w-5 h-5" />
                <h3 className="text-base font-black text-gray-900">Edit Role Details</h3>
              </div>
              <button
                onClick={() => setIsEditRoleModalOpen(false)}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditRole} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Role Title Name *</label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-800"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditRoleModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRole}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-200 transition"
                >
                  {isSubmittingRole ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSubmittingRole ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
