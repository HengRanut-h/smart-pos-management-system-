import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../application/context/AppContext';
import { Employee, RoleItem } from '../../foundation/types';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getRoles,
} from '../../data-access/posApi';
import {
  Users,
  UserCheck,
  UserPlus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Key,
  Shield,
  Phone,
  Mail,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  X,
  LayoutGrid,
  List,
  Check,
  Lock,
  BadgeCheck,
} from 'lucide-react';

export const EmployeeManagementView: React.FC = () => {
  const { lang, t } = useApp();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formGender, setFormGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formHireDate, setFormHireDate] = useState('');
  const [formCreateUser, setFormCreateUser] = useState(true);
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRoleId, setFormRoleId] = useState<number>(4); // default Cashier
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [empData, roleData] = await Promise.all([getEmployees(), getRoles()]);
      setEmployees(empData);
      setRoles(roleData);
    } catch (err) {
      console.error('Failed to load employee data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // KPI Calculations
  const metrics = useMemo(() => {
    const totalStaff = employees.length;
    let cashiers = 0;
    let supervisors = 0;
    let activeUsers = 0;

    employees.forEach((emp) => {
      const userRoles = emp.user?.roles || [];
      const hasCashier = userRoles.some((r) => r.code === 'CASHIER');
      const hasSupervisor = userRoles.some((r) => r.code === 'MANAGER' || r.code === 'SUPER_ADMIN' || r.code === 'ADMIN');
      if (hasCashier) cashiers++;
      if (hasSupervisor) supervisors++;
      if (emp.user) activeUsers++;
    });

    return {
      totalStaff,
      cashiers,
      supervisors,
      activeUsers,
    };
  }, [employees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(q);
        const matchesCode = emp.employee_code.toLowerCase().includes(q);
        const matchesPhone = emp.phone?.toLowerCase().includes(q) || false;
        const matchesEmail = emp.email?.toLowerCase().includes(q) || false;
        const matchesUser = emp.user?.username.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesCode && !matchesPhone && !matchesEmail && !matchesUser) return false;
      }

      // Role filter
      if (selectedRoleFilter !== 'ALL') {
        const empRoles = emp.user?.roles || [];
        const matchesRole = empRoles.some((r) => String(r.id) === selectedRoleFilter || r.code === selectedRoleFilter);
        if (!matchesRole) return false;
      }

      return true;
    });
  }, [employees, searchQuery, selectedRoleFilter]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingEmployee(null);
    const randomNum = Math.floor(100 + Math.random() * 900);
    setFormCode(`EMP-${randomNum}`);
    setFormFirstName('');
    setFormLastName('');
    setFormGender('Male');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormHireDate(new Date().toISOString().split('T')[0]);
    setFormCreateUser(true);
    setFormUsername('');
    setFormPassword('password123');
    setFormRoleId(roles.find((r) => r.code === 'CASHIER')?.id || 4);
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormCode(emp.employee_code);
    setFormFirstName(emp.first_name);
    setFormLastName(emp.last_name);
    setFormGender((emp.gender as any) || 'Male');
    setFormPhone(emp.phone || '');
    setFormEmail(emp.email || '');
    setFormAddress(emp.address || '');
    setFormHireDate(emp.hire_date || '');
    setFormCreateUser(!!emp.user);
    setFormUsername(emp.user?.username || '');
    setFormPassword('');
    const userRoleId = emp.user?.roles?.[0]?.id || roles.find((r) => r.code === 'CASHIER')?.id || 4;
    setFormRoleId(userRoleId);
    setFormError('');
    setIsModalOpen(true);
  };

  // Save Employee (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFirstName.trim() || !formLastName.trim()) {
      setFormError('First and last names are required.');
      return;
    }
    if (!formCode.trim()) {
      setFormError('Employee code is required.');
      return;
    }
    if (formCreateUser && !editingEmployee && !formUsername.trim()) {
      setFormError('Username is required for POS login access.');
      return;
    }

    setIsSaving(true);
    setFormError('');

    try {
      if (editingEmployee) {
        // Update
        const updated = await updateEmployee(editingEmployee.id, {
          first_name: formFirstName,
          last_name: formLastName,
          gender: formGender,
          phone: formPhone || null,
          email: formEmail || null,
          address: formAddress || null,
          hire_date: formHireDate || null,
          role_id: formRoleId,
          password: formPassword ? formPassword : null,
        });

        setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        showToast(`Staff member "${updated.first_name} ${updated.last_name}" updated.`);
      } else {
        // Create
        const created = await createEmployee({
          employee_code: formCode,
          first_name: formFirstName,
          last_name: formLastName,
          gender: formGender,
          phone: formPhone || null,
          email: formEmail || null,
          address: formAddress || null,
          hire_date: formHireDate || null,
          create_user: formCreateUser,
          username: formCreateUser ? formUsername : null,
          password: formCreateUser ? formPassword : null,
          role_id: formRoleId,
        });

        setEmployees((prev) => [created, ...prev]);
        showToast(`Staff member "${created.first_name} ${created.last_name}" created.`);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save employee', err);
      setFormError(err.response?.data?.message || err.message || 'Failed to save staff record.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Employee
  const handleDelete = async () => {
    if (!employeeToDelete) return;
    try {
      await deleteEmployee(employeeToDelete.id);
      setEmployees((prev) => prev.filter((e) => e.id !== employeeToDelete.id));
      showToast(`Employee "${employeeToDelete.first_name} ${employeeToDelete.last_name}" deleted.`);
      setIsDeleteModalOpen(false);
      setEmployeeToDelete(null);
    } catch (err) {
      console.error('Failed to delete employee', err);
      alert('Failed to delete employee record.');
    }
  };

  const getRoleBadge = (roleCode?: string) => {
    switch (roleCode) {
      case 'SUPER_ADMIN':
        return { label: 'Super Admin', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'ADMIN':
        return { label: 'Admin', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'MANAGER':
        return { label: 'Branch Manager', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'STOCK_MANAGER':
        return { label: 'Stock Manager', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'CASHIER':
      default:
        return { label: 'POS Cashier', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 animate-fade-in border border-emerald-500">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header & Main Actions */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-200">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {lang === 'kh' ? 'បុគ្គលិក និងអ្នកគិតប្រាក់' : 'Staff & Cashier Directory'}
            </h1>
            <p className="text-xs text-gray-500">
              {lang === 'kh'
                ? 'គ្រប់គ្រងគណនីបុគ្គលិក, សិទ្ធិអ្នកគិតប្រាក់, ស្ថានីយ និងវេនការងារ'
                : 'Manage staff accounts, cashier credentials, roles, shifts & station assignments.'}
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={loadData}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition flex items-center justify-center"
            title="Refresh Staff List"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-200 flex items-center space-x-2 transition"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>{lang === 'kh' ? '+ បន្ថែមបុគ្គលិកថ្មី' : '+ Add New Staff'}</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-2">
            <span>{lang === 'kh' ? 'បុគ្គលិកសរុប' : 'Total Employees'}</span>
            <Users className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-black text-gray-900">{metrics.totalStaff}</div>
          <div className="text-[11px] text-gray-400 mt-1">
            <span>HQ-01 Phnom Penh Station</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-2">
            <span>{lang === 'kh' ? 'អ្នកគិតប្រាក់' : 'POS Cashiers'}</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{metrics.cashiers}</div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            <span>Drawer & Shift Qualified</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-2">
            <span>{lang === 'kh' ? 'ប្រធានសាខា & អ្នកគ្រប់គ្រង' : 'Supervisors & Mgrs'}</span>
            <Shield className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600">{metrics.supervisors}</div>
          <div className="text-[11px] text-gray-400 mt-1">
            <span>Z-Report & Refund Authority</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-2">
            <span>{lang === 'kh' ? 'គណនីមានសិទ្ធិចូល' : 'Active System Logins'}</span>
            <Key className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-600">{metrics.activeUsers}</div>
          <div className="text-[11px] text-gray-400 mt-1">
            <span>Authenticated Credentials</span>
          </div>
        </div>
      </div>

      {/* 3. Search, Role Filter & Controls */}
      <div className="bg-white rounded-3xl p-4 border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={lang === 'kh' ? 'ស្វែងរកតាមឈ្មោះ, កូដ, ឬលេខទូរស័ព្ទ...' : 'Search by name, employee code, phone, or username...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-hidden focus:border-emerald-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Table Ledger View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Role Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              selectedRoleFilter === 'ALL'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {lang === 'kh' ? 'ទាំងអស់' : 'All Roles'} ({employees.length})
          </button>
          {roles.map((r) => {
            const count = employees.filter((e) => e.user?.roles?.some((ur) => ur.id === r.id)).length;
            const isSelected = selectedRoleFilter === String(r.id) || selectedRoleFilter === r.code;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRoleFilter(String(r.id))}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{r.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-emerald-800 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Staff Records Display Area */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-white rounded-3xl border border-gray-200">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-xs font-semibold text-gray-500">Loading staff records...</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-gray-200 p-8 space-y-3">
          <Users className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">No staff members found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Try adjusting your search criteria or register a new staff member.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-emerald-700"
          >
            + Add New Staff
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredEmployees.map((emp) => {
            const roleInfo = emp.user?.roles?.[0];
            const badge = getRoleBadge(roleInfo?.code);
            const initials = `${emp.first_name?.charAt(0) || ''}${emp.last_name?.charAt(0) || ''}`.toUpperCase();

            return (
              <div
                key={emp.id}
                className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-300 transition group flex flex-col justify-between p-5 space-y-4"
              >
                <div className="space-y-3">
                  {/* Top card bar: Avatar & Employee Code */}
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-200">
                      {initials}
                    </div>
                    <span className="font-mono text-xs font-bold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">
                      {emp.employee_code}
                    </span>
                  </div>

                  {/* Name & Role */}
                  <div>
                    <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-emerald-700 transition">
                      {emp.first_name} {emp.last_name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      {emp.user && (
                        <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                          @{emp.user.username}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs text-gray-600">
                    <div className="flex items-center space-x-2 truncate">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{emp.phone || 'No phone'}</span>
                    </div>
                    <div className="flex items-center space-x-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{emp.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] text-gray-400">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{emp.branch?.name || 'HQ Station'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenEditModal(emp)}
                    className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 border border-emerald-200 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => {
                      setEmployeeToDelete(emp);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition"
                    title="Delete Staff Member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold text-[10px] border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3.5">Staff Member</th>
                  <th className="px-4 py-3.5">Code</th>
                  <th className="px-4 py-3.5">Assigned Role</th>
                  <th className="px-4 py-3.5">POS User</th>
                  <th className="px-4 py-3.5">Phone</th>
                  <th className="px-4 py-3.5">Hire Date</th>
                  <th className="px-4 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEmployees.map((emp) => {
                  const roleInfo = emp.user?.roles?.[0];
                  const badge = getRoleBadge(roleInfo?.code);

                  return (
                    <tr key={emp.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-4 py-3 flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {emp.first_name.charAt(0)}{emp.last_name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 block">{emp.first_name} {emp.last_name}</span>
                          <span className="text-[10px] text-gray-400">{emp.email || 'No email'}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono font-bold text-gray-800">{emp.employee_code}</td>

                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono">
                        {emp.user ? (
                          <span className="text-emerald-700 font-semibold">@{emp.user.username}</span>
                        ) : (
                          <span className="text-gray-400 text-[10px]">No login</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-gray-600 font-mono">{emp.phone || '—'}</td>

                      <td className="px-4 py-3 text-gray-400">{emp.hire_date || '—'}</td>

                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleOpenEditModal(emp)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEmployeeToDelete(emp);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CREATE / EDIT EMPLOYEE MODAL                                           */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-gray-200 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    {editingEmployee ? `Edit Staff: ${editingEmployee.first_name} ${editingEmployee.last_name}` : 'Register New Staff Member'}
                  </h2>
                  <p className="text-xs text-gray-500">Configure personal info, role and POS login credentials</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Personal Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Personal Information</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sokha"
                      value={formFirstName}
                      onChange={(e) => setFormFirstName(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chan"
                      value={formLastName}
                      onChange={(e) => setFormLastName(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Employee Code <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex space-x-1.5">
                      <input
                        type="text"
                        required
                        disabled={!!editingEmployee}
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:outline-hidden focus:border-emerald-500 disabled:opacity-60"
                      />
                      {!editingEmployee && (
                        <button
                          type="button"
                          onClick={() => setFormCode(`EMP-${Math.floor(100 + Math.random() * 900)}`)}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-xl font-bold"
                        >
                          Auto
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Gender</label>
                    <select
                      value={formGender}
                      onChange={(e) => setFormGender(e.target.value as any)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-hidden focus:border-emerald-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+855 12 345 678"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="staff@smartpos.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* POS Role & Credentials */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">System Role & Access</h4>
                  {!editingEmployee && (
                    <label className="flex items-center space-x-2 text-xs font-semibold text-emerald-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formCreateUser}
                        onChange={(e) => setFormCreateUser(e.target.checked)}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Create POS Terminal Login</span>
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Assigned Role</label>
                  <select
                    value={formRoleId}
                    onChange={(e) => setFormRoleId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-hidden focus:border-emerald-500"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.code})
                      </option>
                    ))}
                  </select>
                </div>

                {formCreateUser && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Username <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required={formCreateUser && !editingEmployee}
                        disabled={!!editingEmployee}
                        placeholder="e.g. sokha_cashier"
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono focus:outline-hidden focus:border-emerald-500 disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {editingEmployee ? 'Reset Password (optional)' : 'Terminal Password *'}
                      </label>
                      <input
                        type="password"
                        required={formCreateUser && !editingEmployee}
                        placeholder={editingEmployee ? 'Leave blank to keep current' : 'Min 6 characters'}
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-200 transition flex items-center space-x-1.5"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingEmployee ? 'Save Changes' : 'Register Staff'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. DELETE EMPLOYEE CONFIRMATION MODAL                                     */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && employeeToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-gray-200 shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-gray-900 text-base">Deactivate Staff Member?</h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to delete <strong>"{employeeToDelete.first_name} {employeeToDelete.last_name}"</strong> ({employeeToDelete.employee_code})?
                Their POS terminal login access will be revoked.
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setEmployeeToDelete(null);
                }}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-200"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
