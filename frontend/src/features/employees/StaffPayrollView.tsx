import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  Clock,
  UserCheck,
  TrendingUp,
  TrendingDown,
  Filter,
  FileSpreadsheet,
  Printer,
  Search,
  Building2,
  Calendar,
  Sparkles,
  Sliders,
  X,
  FileText,
  ArrowLeft,
  Users,
  Edit3,
  Save,
  Check,
  Settings,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { getAttendanceReport, getEmployees, updateEmployee, getRoles } from '../../data-access/posApi';
import { AttendanceReportResponse, Employee, EmployeeAttendanceSummary, RoleItem } from '../../foundation/types';
import { useApp } from '../../application/context/AppContext';

interface StaffPayrollViewProps {
  onBack?: () => void;
}

export const StaffPayrollView: React.FC<StaffPayrollViewProps> = ({ onBack }) => {
  const { lang } = useApp();

  const [loading, setLoading] = useState<boolean>(true);
  const [reportData, setReportData] = useState<AttendanceReportResponse | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Configurable Role Base Rates
  const [roleBaseRates, setRoleBaseRates] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('smartpos_role_base_rates');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      'Super Admin': 10.00,
      'Admin': 8.00,
      'Store Manager': 6.00,
      'Manager': 6.00,
      'Supervisor': 4.50,
      'POS Cashier': 3.00,
      'Cashier': 3.00,
      'Inventory Clerk': 3.50,
      'Inventory Staff': 3.50,
      'Delivery Driver': 3.25,
    };
  });

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isEditingRoleRatesModal, setIsEditingRoleRatesModal] = useState<boolean>(false);

  // Employee Salary Editing Modal State
  const [editingEmpSalaryModal, setEditingEmpSalaryModal] = useState<EmployeeAttendanceSummary | null>(null);
  const [editRoleId, setEditRoleId] = useState<number>(4);
  const [editEmploymentType, setEditEmploymentType] = useState<string>('FULL_TIME');
  const [editHourlyRate, setEditHourlyRate] = useState<number | ''>('');
  const [editOtMultiplier, setEditOtMultiplier] = useState<number | ''>(1.50);
  const [editLatePenalty, setEditLatePenalty] = useState<number | ''>(0.05);
  const [isSavingSalary, setIsSavingSalary] = useState<boolean>(false);
  const [salarySaveSuccess, setSalarySaveSuccess] = useState<string | null>(null);

  // Filter state
  const [preset, setPreset] = useState<string>('this_month');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Live Rates Customizer State
  const [customHourlyRate, setCustomHourlyRate] = useState<number | ''>('');
  const [customOtMultiplier, setCustomOtMultiplier] = useState<number | ''>('');
  const [customLatePenalty, setCustomLatePenalty] = useState<number | ''>('');

  // Selected Payslip Modal state
  const [selectedPayslipEmp, setSelectedPayslipEmp] = useState<EmployeeAttendanceSummary | null>(null);

  useEffect(() => {
    fetchEmployees();
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [preset, year, month]);

  const fetchEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await getRoles();
      setRoles(data);
    } catch (err) {
      console.error('Failed to fetch roles', err);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params: any = {
        preset,
        branch_id: 'ALL',
      };
      if (year) params.year = year;
      if (month && month !== 'ALL') params.month = Number(month);

      const res = await getAttendanceReport(params);
      setReportData(res);
    } catch (err) {
      console.error('Failed to load payroll report', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditEmpSalary = (emp: EmployeeAttendanceSummary) => {
    setEditingEmpSalaryModal(emp);
    const foundRole = roles.find(
      (r) => r.name.toLowerCase() === emp.role.toLowerCase() || (r as any).display_name?.toLowerCase() === emp.role.toLowerCase()
    );
    setEditRoleId(foundRole ? foundRole.id : 4);
    setEditEmploymentType(emp.employment_type || 'FULL_TIME');
    setEditHourlyRate(emp.hourly_rate ?? '');
    setEditOtMultiplier(emp.ot_multiplier ?? 1.50);
    setEditLatePenalty(emp.late_penalty_rate ?? 0.05);
  };

  const handleSaveEmployeeSalary = async () => {
    if (!editingEmpSalaryModal) return;
    setIsSavingSalary(true);
    try {
      const payload: any = {
        role_id: editRoleId,
        employment_type: editEmploymentType,
        hourly_rate: editHourlyRate === '' ? null : Number(editHourlyRate),
        ot_multiplier: editOtMultiplier === '' ? 1.50 : Number(editOtMultiplier),
        late_deduction_per_min: editLatePenalty === '' ? 0.05 : Number(editLatePenalty),
      };

      await updateEmployee(editingEmpSalaryModal.employee_id, payload);
      setSalarySaveSuccess('Employee pay rates & role updated successfully!');
      setTimeout(() => setSalarySaveSuccess(null), 3000);
      await fetchReport();
      setEditingEmpSalaryModal(null);
    } catch (err: any) {
      console.error('Failed to update employee salary', err);
      alert(err.response?.data?.message || 'Failed to update employee pay rate settings.');
    } finally {
      setIsSavingSalary(false);
    }
  };

  // Calculated employee summaries considering role rates and custom override rates
  const calculatedSummaries = useMemo(() => {
    if (!reportData) return [];

    return reportData.employee_summaries.map((emp) => {
      const defaultRate = roleBaseRates[emp.role] ?? 3.00;
      const baseRate = emp.hourly_rate || defaultRate;
      const hourlyRate = customHourlyRate !== '' ? Number(customHourlyRate) : baseRate;
      const otMultiplier = customOtMultiplier !== '' ? Number(customOtMultiplier) : (emp.ot_multiplier ?? 1.50);
      const otRate = Number((hourlyRate * otMultiplier).toFixed(2));
      const latePenaltyRate = customLatePenalty !== '' ? Number(customLatePenalty) : (emp.late_penalty_rate ?? 0.05);

      const regHours = emp.regular_hours ?? roundHours(emp.total_minutes);
      const otHours = emp.ot_hours ?? 0;

      const regularPay = Number((regHours * hourlyRate).toFixed(2));
      const otPay = Number((otHours * otRate).toFixed(2));
      const lateDeduction = Number(((emp.total_late_minutes ?? 0) * latePenaltyRate).toFixed(2));
      const netSalary = Number(((regularPay + otPay) - lateDeduction).toFixed(2));

      return {
        ...emp,
        role_default_rate: defaultRate,
        effective_hourly_rate: hourlyRate,
        effective_ot_multiplier: otMultiplier,
        effective_ot_rate: otRate,
        effective_late_penalty_rate: latePenaltyRate,
        effective_regular_pay: regularPay,
        effective_ot_pay: otPay,
        effective_late_deduction: lateDeduction,
        effective_net_salary: netSalary,
      };
    });
  }, [reportData, customHourlyRate, customOtMultiplier, customLatePenalty]);

  // Filtered summaries
  const filteredSummaries = useMemo(() => {
    return calculatedSummaries.filter((emp) => {
      if (selectedType !== 'ALL' && (emp.employment_type || 'FULL_TIME') !== selectedType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = emp.name.toLowerCase();
        const code = emp.employee_code.toLowerCase();
        const role = emp.role.toLowerCase();
        if (!name.includes(q) && !code.includes(q) && !role.includes(q)) return false;
      }
      return true;
    });
  }, [calculatedSummaries, selectedType, searchQuery]);

  // Overall Global Payroll Summary
  const globalPayroll = useMemo(() => {
    let regPay = 0;
    let otPay = 0;
    let lateDed = 0;
    let net = 0;
    let regHrs = 0;
    let otHrs = 0;

    filteredSummaries.forEach((emp) => {
      regPay += emp.effective_regular_pay;
      otPay += emp.effective_ot_pay;
      lateDed += emp.effective_late_deduction;
      net += emp.effective_net_salary;
      regHrs += emp.regular_hours ?? 0;
      otHrs += emp.ot_hours ?? 0;
    });

    return {
      regularPay: Number(regPay.toFixed(2)),
      otPay: Number(otPay.toFixed(2)),
      lateDeduction: Number(lateDed.toFixed(2)),
      netSalary: Number(net.toFixed(2)),
      regularHours: Number(regHrs.toFixed(1)),
      otHours: Number(otHrs.toFixed(1)),
    };
  }, [filteredSummaries]);

  function roundHours(mins: number) {
    return Number((mins / 60).toFixed(2));
  }

  const handleExportCSV = () => {
    if (!reportData || filteredSummaries.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `SmartPOS Employee Salary & Payroll Audit Report (${reportData.period.start_date} to ${reportData.period.end_date})\n\n`;
    csvContent += 'Employee Code,Staff Name,Role,Type,Base Hourly Rate ($),OT Multiplier,OT Rate ($),Regular Hours,Regular Pay ($),OT Hours,OT Pay ($),Total Late Minutes,Late Penalty (-$),Net Salary ($)\n';

    filteredSummaries.forEach((emp) => {
      csvContent += `"${emp.employee_code}","${emp.name}","${emp.role}","${emp.employment_type || 'FULL_TIME'}",$${emp.effective_hourly_rate},${emp.effective_ot_multiplier}x,$${emp.effective_ot_rate},${emp.regular_hours || 0},$${emp.effective_regular_pay},${emp.ot_hours || 0},$${emp.effective_ot_pay},${emp.total_late_minutes},-$${emp.effective_late_deduction},$${emp.effective_net_salary}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartPOS_Staff_Payroll_${reportData.period.start_date}_to_${reportData.period.end_date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Print-only CSS styling */}
      <style>{`
        @media print {
          body { background: #fff !important; color: #000 !important; }
          .no-print { display: none !important; }
          .print-full-width { width: 100% !important; margin: 0 !important; padding: 0 !important; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; color: #000 !important; }
        }
      `}</style>

      {/* 1. Page Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
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
            <DollarSign className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {lang === 'kh' ? 'គណនាម៉ោងធ្វើការ និង ប្រាក់បៀវត្សរ៍បុគ្គលិក' : 'Staff Work Hours & Salary Calculator'}
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                PAYROLL AUDIT
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {lang === 'kh' ? 'គណនាប្រាក់ខែតាមម៉ោង ម៉ោងបន្ថែម (OT 1.5x) ភាគរយយឺត និង បោះពុម្ពវិក្កយបត្រប្រាក់ខែ' : 'Calculate base salaries, overtime hours (1.5x), part-time shifts, late deductions, and print staff payslips'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportCSV}
            disabled={loading || filteredSummaries.length === 0}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs shadow-md shadow-emerald-200 flex items-center space-x-2 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{lang === 'kh' ? 'ទាញយក Payroll CSV' : 'Export Payroll CSV'}</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={loading || filteredSummaries.length === 0}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs shadow-md shadow-indigo-200 flex items-center space-x-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'kh' ? 'បោះពុម្ព' : 'Print Payroll Sheet'}</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Payroll KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        {/* Net Payroll */}
        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-3xl p-5 border border-emerald-800/60 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-emerald-300 text-xs font-semibold">
            <span>{lang === 'kh' ? 'ប្រាក់បៀវត្សរ៍សរុប Net' : 'Net Payroll Expense'}</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">
            ${globalPayroll.netSalary.toFixed(2)}
          </div>
          <div className="text-xs text-slate-300">
            Total for {filteredSummaries.length} staff members
          </div>
        </div>

        {/* Regular Pay */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>{lang === 'kh' ? 'ម៉ោងធម្មតា Regular Pay' : 'Regular Hours Pay'}</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-gray-900">
            ${globalPayroll.regularPay.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">
            Total {globalPayroll.regularHours} Regular Hours
          </div>
        </div>

        {/* Overtime Pay (1.5x) */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>{lang === 'kh' ? 'ម៉ោងបន្ថែម (OT 1.5x)' : 'Overtime Pay (1.5x)'}</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-purple-700">
            ${globalPayroll.otPay.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">
            Total {globalPayroll.otHours} OT Hours (&gt;8h/day)
          </div>
        </div>

        {/* Late Penalty Deductions */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>{lang === 'kh' ? 'ការកាត់ប្រាក់មកយឺត' : 'Late Penalty Deductions'}</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600">
            -${globalPayroll.lateDeduction.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">
            Based on cumulative late minutes
          </div>
        </div>
      </div>

      {/* 3. Filter & Live Rate Adjuster Bar */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-4 no-print">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'kh' ? 'តម្រងកាលបរិច្ឆេទ & អត្រាកំណត់' : 'Payroll Parameters & Filters'}</span>
          </div>
          {reportData && (
            <div className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Range: {reportData.period.start_date} ~ {reportData.period.end_date}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Preset Picker */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Date Preset</label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-800"
            >
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
              <option value="this_week">This Week</option>
            </select>
          </div>

          {/* Year Picker */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Select Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-800"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Month Picker */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Select Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-800"
            >
              <option value="ALL">All Months</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2026, m - 1, 1).toLocaleString('en-US', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          {/* Employment Type */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Employment Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-800"
            >
              <option value="ALL">All Types</option>
              <option value="FULL_TIME">Full-Time Only</option>
              <option value="PART_TIME">Part-Time Only</option>
              <option value="CONTRACT">Contract Only</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Search Staff</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff code, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-800"
              />
            </div>
          </div>
        </div>

        {/* Live Override Controls Bar */}
        <div className="pt-3 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-900">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'kh' ? 'កែប្រែអត្រាកម្រៃផ្ទាល់ (Live Rate Customizer):' : 'Live Global Rate Customizer:'}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="text-gray-600 font-semibold">Base Rate $/hr:</span>
              <input
                type="number"
                step="0.25"
                placeholder="3.00"
                value={customHourlyRate}
                onChange={(e) => setCustomHourlyRate(e.target.value ? Number(e.target.value) : '')}
                className="w-20 bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold text-gray-900"
              />
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-gray-600 font-semibold">OT Multiplier:</span>
              <input
                type="number"
                step="0.1"
                placeholder="1.50"
                value={customOtMultiplier}
                onChange={(e) => setCustomOtMultiplier(e.target.value ? Number(e.target.value) : '')}
                className="w-20 bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold text-purple-700"
              />
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-gray-600 font-semibold">Late Penalty $/min:</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.05"
                value={customLatePenalty}
                onChange={(e) => setCustomLatePenalty(e.target.value ? Number(e.target.value) : '')}
                className="w-20 bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold text-rose-600"
              />
            </div>

            {(customHourlyRate !== '' || customOtMultiplier !== '' || customLatePenalty !== '') && (
              <button
                onClick={() => {
                  setCustomHourlyRate('');
                  setCustomOtMultiplier('');
                  setCustomLatePenalty('');
                }}
                className="text-xs text-rose-600 hover:underline font-bold"
              >
                Reset Rates
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3.5 Role Standard Pay Rates Reference Card */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-3 no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{lang === 'kh' ? 'អត្រាប្រាក់ខែតាមតួនាទី (Role Base Hourly Rates Standard)' : 'Role Base Hourly Rates Standard'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditingRoleRatesModal(true)}
              className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-[11px] font-extrabold flex items-center space-x-1 transition"
            >
              <Settings className="w-3.5 h-3.5 text-amber-600" />
              <span>{lang === 'kh' ? 'កំណត់អត្រាតួនាទី' : 'Configure Base Rates'}</span>
            </button>
            <span className="text-[10px] text-gray-400 font-semibold uppercase hidden sm:inline">Auto-resolved from assigned role</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-purple-900">Super Admin</span>
            <div className="text-lg font-black font-mono text-purple-700 mt-1">${(roleBaseRates['Super Admin'] ?? 10.00).toFixed(2)}<span className="text-[10px] text-purple-600 font-normal">/hr</span></div>
          </div>

          <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-blue-900">Store Manager</span>
            <div className="text-lg font-black font-mono text-blue-700 mt-1">${(roleBaseRates['Store Manager'] ?? 6.00).toFixed(2)}<span className="text-[10px] text-blue-600 font-normal">/hr</span></div>
          </div>

          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-amber-900">Supervisor</span>
            <div className="text-lg font-black font-mono text-amber-700 mt-1">${(roleBaseRates['Supervisor'] ?? 4.50).toFixed(2)}<span className="text-[10px] text-amber-600 font-normal">/hr</span></div>
          </div>

          <div className="p-3 bg-teal-50 rounded-2xl border border-teal-100 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-teal-900">Inventory Staff</span>
            <div className="text-lg font-black font-mono text-teal-700 mt-1">${(roleBaseRates['Inventory Staff'] ?? 3.50).toFixed(2)}<span className="text-[10px] text-teal-600 font-normal">/hr</span></div>
          </div>

          <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-sky-900">Delivery Driver</span>
            <div className="text-lg font-black font-mono text-sky-700 mt-1">${(roleBaseRates['Delivery Driver'] ?? 3.25).toFixed(2)}<span className="text-[10px] text-sky-600 font-normal">/hr</span></div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-emerald-900">POS Cashier</span>
            <div className="text-lg font-black font-mono text-emerald-700 mt-1">${(roleBaseRates['POS Cashier'] ?? 3.00).toFixed(2)}<span className="text-[10px] text-emerald-600 font-normal">/hr</span></div>
          </div>
        </div>
      </div>

      {/* 4. Staff Payroll Ledger Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden print-full-width">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center space-x-2 text-sm font-bold text-gray-900">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'kh' ? 'តារាងគណនាប្រាក់បៀវត្សរ៍បុគ្គលិក' : 'Employee Salary Calculation Ledger'}</span>
          </div>
          <div className="text-xs text-gray-500">
            Total {filteredSummaries.length} records
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100/80 text-gray-600 text-[11px] uppercase tracking-wider border-b border-gray-200">
                <th className="p-3.5">Emp Code</th>
                <th className="p-3.5">Staff Name</th>
                <th className="p-3.5">Role / Type</th>
                <th className="p-3.5 text-center">Base Rate</th>
                <th className="p-3.5 text-center">OT Rate (1.5x)</th>
                <th className="p-3.5 text-center">Regular Hours</th>
                <th className="p-3.5 text-center">Regular Pay</th>
                <th className="p-3.5 text-center">OT Hours</th>
                <th className="p-3.5 text-center">OT Pay</th>
                <th className="p-3.5 text-center">Late Penalty</th>
                <th className="p-3.5 text-right font-black text-gray-900">Net Salary</th>
                <th className="p-3.5 text-center no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-gray-500">
                    <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Calculating staff payroll hours...
                  </td>
                </tr>
              ) : filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-gray-400">
                    No payroll data found for selected timeframe
                  </td>
                </tr>
              ) : (
                filteredSummaries.map((emp) => {
                  const getRoleBadgeColor = (role: string) => {
                    const r = role.toLowerCase();
                    if (r.includes('super') || r.includes('admin')) return 'bg-purple-100 text-purple-800 border-purple-200';
                    if (r.includes('manager')) return 'bg-blue-100 text-blue-800 border-blue-200';
                    if (r.includes('supervisor')) return 'bg-amber-100 text-amber-800 border-amber-200';
                    if (r.includes('inventory')) return 'bg-teal-100 text-teal-800 border-teal-200';
                    if (r.includes('driver') || r.includes('delivery')) return 'bg-sky-100 text-sky-800 border-sky-200';
                    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
                  };

                  return (
                    <tr key={emp.employee_id} className="hover:bg-gray-50 transition">
                      <td className="p-3.5 font-mono font-bold text-gray-700">{emp.employee_code}</td>
                      <td className="p-3.5 font-medium text-gray-900">
                        <div>{emp.name}</div>
                        <div className="text-[10px] text-gray-400">{emp.phone || 'No phone'}</div>
                      </td>
                      <td className="p-3.5 text-gray-600">
                        <span className={`inline-block text-[11px] px-2 py-0.5 rounded-md font-extrabold border ${getRoleBadgeColor(emp.role)} mb-1`}>
                          {emp.role}
                        </span>
                        <div className="text-[10px] font-semibold text-gray-500 uppercase">
                          {emp.employment_type || 'FULL_TIME'}
                        </div>
                      </td>
                    <td className="p-3.5 text-center font-mono font-semibold text-gray-700">
                      ${emp.effective_hourly_rate.toFixed(2)}/h
                    </td>
                    <td className="p-3.5 text-center font-mono text-purple-700 font-semibold">
                      ${emp.effective_ot_rate.toFixed(2)}/h <span className="text-[10px] text-gray-400">({emp.effective_ot_multiplier}x)</span>
                    </td>
                    <td className="p-3.5 text-center font-mono text-gray-800">
                      {emp.regular_hours || 0} hrs
                    </td>
                    <td className="p-3.5 text-center font-mono font-semibold text-gray-900">
                      ${emp.effective_regular_pay.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-center font-mono text-purple-700 font-semibold">
                      {emp.ot_hours > 0 ? `${emp.ot_hours} hrs` : '-'}
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold text-purple-700">
                      {emp.effective_ot_pay > 0 ? `$${emp.effective_ot_pay.toFixed(2)}` : '$0.00'}
                    </td>
                    <td className="p-3.5 text-center font-mono">
                      {emp.effective_late_deduction > 0 ? (
                        <span className="text-rose-600 font-bold">-${emp.effective_late_deduction.toFixed(2)}</span>
                      ) : (
                        <span className="text-gray-400">$0.00</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right font-mono text-sm font-black text-emerald-700">
                      ${emp.effective_net_salary.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-center no-print">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenEditEmpSalary(emp)}
                          title="Edit Employee Pay Rate & Role"
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-[11px] flex items-center space-x-1 transition border border-indigo-200"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setSelectedPayslipEmp(emp)}
                          title="Print Payslip"
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-[11px] flex items-center space-x-1 transition border border-emerald-200"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Payslip</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Success Toast Notification */}
      {salarySaveSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 border border-emerald-700 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{salarySaveSuccess}</span>
        </div>
      )}

      {/* 5. Printable A4 Employee Payslip Modal */}
      {selectedPayslipEmp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            <button
              onClick={() => setSelectedPayslipEmp(null)}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition no-print"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Payslip Body */}
            <div id="printable-payslip" className="p-6 border-2 border-gray-800 rounded-2xl bg-white space-y-6 text-gray-900">
              {/* Payslip Header */}
              <div className="border-b-2 border-gray-800 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-gray-900">SmartPOS Official Store</h2>
                  <p className="text-xs text-gray-500">Phnom Penh Headquarters • Staff Salary Disbursement</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-gray-900 text-white font-mono text-xs font-bold rounded-lg uppercase">
                    SALARY PAYSLIP
                  </span>
                  <p className="text-[10px] text-gray-400 mt-1 font-mono">
                    Period: {reportData?.period.start_date} ~ {reportData?.period.end_date}
                  </p>
                </div>
              </div>

              {/* Employee Details Grid */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-gray-400 uppercase font-semibold text-[10px]">Staff Name:</span>
                  <p className="font-bold text-gray-900">{selectedPayslipEmp.name}</p>
                  <p className="text-gray-500">{selectedPayslipEmp.role}</p>
                </div>
                <div>
                  <span className="text-gray-400 uppercase font-semibold text-[10px]">Employee Code:</span>
                  <p className="font-mono font-bold text-indigo-700">{selectedPayslipEmp.employee_code}</p>
                  <p className="text-gray-500">Type: {selectedPayslipEmp.employment_type || 'FULL_TIME'}</p>
                </div>
              </div>

              {/* Earnings & Hours Itemized Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-gray-700 border-b border-gray-200 pb-1">
                  Itemized Earnings & Hours Breakdown
                </h4>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span>Regular Salary ({selectedPayslipEmp.regular_hours || 0} hrs @ ${(selectedPayslipEmp.effective_hourly_rate || 3.00).toFixed(2)}/hr)</span>
                    <span className="font-bold">${(selectedPayslipEmp.effective_regular_pay || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-purple-700">
                    <span>Overtime Pay ({selectedPayslipEmp.ot_hours || 0} hrs @ ${(selectedPayslipEmp.effective_ot_rate || 4.50).toFixed(2)}/hr [1.5x])</span>
                    <span className="font-bold">${(selectedPayslipEmp.effective_ot_pay || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>Late Penalty Deduction ({selectedPayslipEmp.total_late_minutes || 0} late mins)</span>
                    <span className="font-bold">-${(selectedPayslipEmp.effective_late_deduction || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Net Salary Total */}
              <div className="bg-emerald-50 border-2 border-emerald-600 p-4 rounded-xl flex items-center justify-between text-emerald-950">
                <div>
                  <span className="text-xs uppercase font-extrabold text-emerald-800">Net Payable Salary:</span>
                  <p className="text-[10px] text-emerald-700">Calculated after regular, OT and late penalty adjustments</p>
                </div>
                <div className="text-2xl font-black font-mono text-emerald-700">
                  ${(selectedPayslipEmp.effective_net_salary || 0).toFixed(2)}
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 border-t border-gray-200 grid grid-cols-2 gap-8 text-center text-xs font-semibold text-gray-500">
                <div>
                  <div className="border-b border-gray-400 h-10 mb-1" />
                  <p>Employee Signature</p>
                </div>
                <div>
                  <div className="border-b border-gray-400 h-10 mb-1" />
                  <p>HR / Manager Approval</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2 no-print">
              <button
                onClick={() => setSelectedPayslipEmp(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Payslip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Admin Edit Employee Pay Rate & Role Modal */}
      {editingEmpSalaryModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative my-8 animate-fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    {lang === 'kh' ? 'កែប្រែប្រាក់ខែ និង តួនាទីបុគ្គលិក' : 'Update Employee Salary & Role'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {editingEmpSalaryModal.name} ({editingEmpSalaryModal.employee_code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingEmpSalaryModal(null)}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Assigned Role */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Assigned System Role</label>
                <select
                  value={editRoleId}
                  onChange={(e) => setEditRoleId(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900"
                >
                  {roles.length > 0 ? (
                    roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.display_name || r.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value={1}>Super Admin ($10.00/hr default)</option>
                      <option value={2}>Store Manager ($6.00/hr default)</option>
                      <option value={3}>Supervisor ($4.50/hr default)</option>
                      <option value={4}>POS Cashier ($3.00/hr default)</option>
                      <option value={5}>Inventory Staff ($3.50/hr default)</option>
                      <option value={6}>Delivery Driver ($3.25/hr default)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Employment Type */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Employment Shift Type</label>
                <select
                  value={editEmploymentType}
                  onChange={(e) => setEditEmploymentType(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900"
                >
                  <option value="FULL_TIME">FULL_TIME (Full-Time Shift)</option>
                  <option value="PART_TIME">PART_TIME (Hourly / Shift Basis)</option>
                  <option value="CONTRACT">CONTRACT (Contractor Basis)</option>
                </select>
              </div>

              {/* Custom Hourly Rate ($/hr) */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Custom Base Hourly Rate ($/hr)
                </label>
                <input
                  type="number"
                  step="0.10"
                  placeholder="Leave empty for Role default rate"
                  value={editHourlyRate}
                  onChange={(e) => setEditHourlyRate(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-indigo-700"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  If left empty, system uses default rate for assigned Role.
                </p>
              </div>

              {/* OT Multiplier & Late Penalty Rate */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">OT Multiplier (1.5x)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="1.50"
                    value={editOtMultiplier}
                    onChange={(e) => setEditOtMultiplier(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-purple-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Late Penalty ($/min)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.05"
                    value={editLatePenalty}
                    onChange={(e) => setEditLatePenalty(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-rose-600"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-100">
              <button
                onClick={() => setEditingEmpSalaryModal(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEmployeeSalary}
                disabled={isSavingSalary}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-indigo-200 transition"
              >
                {isSavingSalary ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isSavingSalary ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Configure Role Base Hourly Rates Modal */}
      {isEditingRoleRatesModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative my-8 animate-fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2 text-amber-600">
                <Settings className="w-5 h-5" />
                <h3 className="text-base font-black text-gray-900">Configure Standard Role Rates</h3>
              </div>
              <button
                onClick={() => setIsEditingRoleRatesModal(false)}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Set standard default base hourly rates ($/hr) for each role in your business.
            </p>

            <div className="space-y-3 text-xs">
              {Object.entries(roleBaseRates).map(([roleName, rateVal]) => (
                <div key={roleName} className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                  <span className="font-bold text-gray-800">{roleName}</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-500 font-semibold">$</span>
                    <input
                      type="number"
                      step="0.25"
                      value={rateVal}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setRoleBaseRates((prev) => ({ ...prev, [roleName]: val }));
                      }}
                      className="w-20 bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-mono font-bold text-gray-900"
                    />
                    <span className="text-gray-400 font-normal">/hr</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setIsEditingRoleRatesModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveRoleBaseRates(roleBaseRates)}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-amber-200 transition"
              >
                <Check className="w-4 h-4" />
                <span>Apply Base Rates</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
