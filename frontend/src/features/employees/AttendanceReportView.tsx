import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  ArrowLeft,
  Filter,
  Download,
  Search,
  Users,
  Award,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Globe,
  Smartphone,
  ShieldCheck,
  UserCheck,
  FileText,
  Building2,
  DollarSign,
  Edit3,
  Check,
  X,
  Eye,
  Info
} from 'lucide-react';
import { getAttendanceReport, getEmployees, updateAttendanceNotes } from '../../data-access/posApi';
import { AttendanceReportResponse, Employee, EmployeeAttendanceSummary, AttendanceRecord } from '../../foundation/types';
import { useApp } from '../../application/context/AppContext';

interface AttendanceReportViewProps {
  onBack?: () => void;
}

export const AttendanceReportView: React.FC<AttendanceReportViewProps> = ({ onBack }) => {
  const { lang, setActiveTab: setGlobalActiveTab } = useApp();

  const [loading, setLoading] = useState<boolean>(true);
  const [reportData, setReportData] = useState<AttendanceReportResponse | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Filter state
  const [preset, setPreset] = useState<string>('this_month');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [punctualityStatus, setPunctualityStatus] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'EMPLOYEE_SUMMARY' | 'INDIVIDUAL_AUDIT' | 'DETAILED_LOGS'>('EMPLOYEE_SUMMARY');

  // Active Employee for One-by-One Audit
  const [activeAuditEmpIndex, setActiveAuditEmpIndex] = useState<number>(0);

  // Full Details Employee Modal State
  const [detailedModalEmployee, setDetailedModalEmployee] = useState<EmployeeAttendanceSummary | null>(null);

  // Note editing state for a record
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState<string>('');
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [preset, year, month, selectedEmployeeId, punctualityStatus, startDate, endDate]);

  const fetchEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params: any = {
        preset,
        punctuality_status: punctualityStatus,
        branch_id: 'ALL',
      };

      if (preset === 'custom') {
        if (startDate && endDate) {
          params.start_date = startDate;
          params.end_date = endDate;
        }
      } else {
        if (year) params.year = year;
        if (month && month !== 'ALL') params.month = Number(month);
      }

      if (selectedEmployeeId) {
        params.employee_id = Number(selectedEmployeeId);
      }

      const res = await getAttendanceReport(params);
      setReportData(res);

      if (res.employee_summaries.length > 0) {
        setActiveAuditEmpIndex(0);
      }
    } catch (err) {
      console.error('Failed to load attendance report', err);
    } finally {
      setLoading(false);
    }
  };

  // Selected Employee for One-by-One Daily Audit
  const activeAuditSummary: EmployeeAttendanceSummary | null = useMemo(() => {
    if (!reportData || reportData.employee_summaries.length === 0) return null;
    const index = Math.max(0, Math.min(activeAuditEmpIndex, reportData.employee_summaries.length - 1));
    return reportData.employee_summaries[index];
  }, [reportData, activeAuditEmpIndex]);

  // Selected Employee's daily records
  const activeEmployeeDailyRecords = useMemo(() => {
    if (!reportData || !activeAuditSummary) return [];
    return reportData.records.filter((rec) => rec.employee_id === activeAuditSummary.employee_id);
  }, [reportData, activeAuditSummary]);

  // Employee for Detailed Modal records
  const detailedModalRecords = useMemo(() => {
    if (!reportData || !detailedModalEmployee) return [];
    return reportData.records.filter((rec) => rec.employee_id === detailedModalEmployee.employee_id);
  }, [reportData, detailedModalEmployee]);

  const handlePrevEmployee = () => {
    if (!reportData) return;
    setActiveAuditEmpIndex((prev) => (prev > 0 ? prev - 1 : reportData.employee_summaries.length - 1));
  };

  const handleNextEmployee = () => {
    if (!reportData) return;
    setActiveAuditEmpIndex((prev) => (prev < reportData.employee_summaries.length - 1 ? prev + 1 : 0));
  };

  const handleSelectEmployeeForAudit = (empId: number) => {
    if (!reportData) return;
    const idx = reportData.employee_summaries.findIndex((e) => e.employee_id === empId);
    if (idx !== -1) {
      setActiveAuditEmpIndex(idx);
      setActiveTab('INDIVIDUAL_AUDIT');
    }
  };

  const handleSaveNote = async (recordId: number) => {
    if (!editingNoteText.trim()) return;
    setIsSavingNote(true);
    try {
      const res = await updateAttendanceNotes(recordId, editingNoteText.trim());
      if (res.success) {
        setEditingRecordId(null);
        setEditingNoteText('');
        fetchReport();
      }
    } catch (err) {
      console.error('Failed to update attendance reason note', err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `SmartPOS Attendance & Punctuality Audit Report (${reportData.period.start_date} to ${reportData.period.end_date})\n\n`;

    if (activeTab === 'INDIVIDUAL_AUDIT' && activeAuditSummary) {
      csvContent += `Individual Daily Audit for: ${activeAuditSummary.employee_code} - ${activeAuditSummary.name} (${activeAuditSummary.role})\n`;
      csvContent += 'Date,Scheduled Start,Clock In Time,Clock Out Time,Late Offset (mins),Status,Duration,Scan Method,IP Address,GPS Latitude,GPS Longitude,Reason/Notes\n';
      activeEmployeeDailyRecords.forEach((rec) => {
        csvContent += `"${rec.date}","${rec.scheduled_start}","${rec.clock_in}","${rec.clock_out || 'Active'}",${rec.late_minutes},"${rec.status}","${rec.formatted_duration || rec.total_minutes + 'm'}","${rec.scan_method}","${rec.ip_address || ''}",${rec.latitude || ''},${rec.longitude || ''},"${rec.notes || ''}"\n`;
      });
    } else if (activeTab === 'EMPLOYEE_SUMMARY') {
      csvContent += 'Employee Code,Staff Name,Role,Total Shifts,On Time Shifts,Late Shifts,Punctuality Rate (%),Total Hours Worked,Formatted Duration,Total Late Minutes\n';
      reportData.employee_summaries.forEach((emp) => {
        csvContent += `"${emp.employee_code}","${emp.name}","${emp.role}",${emp.total_shifts},${emp.on_time_shifts},${emp.late_shifts},${emp.punctuality_rate}%,${emp.total_hours},"${emp.formatted_duration}",${emp.total_late_minutes}\n`;
      });
    } else {
      csvContent += 'Date,Employee Code,Staff Name,Scheduled Start,Clock In Time,Clock Out Time,Late Offset (mins),Status,Work Duration (mins),Reason/Notes\n';
      reportData.records.forEach((rec) => {
        const empName = rec.employee ? `${rec.employee.first_name} ${rec.employee.last_name}` : 'N/A';
        const empCode = rec.employee ? rec.employee.employee_code : 'N/A';
        csvContent += `"${rec.date}","${empCode}","${empName}","${rec.scheduled_start}","${rec.clock_in}","${rec.clock_out || 'Active'}",${rec.late_minutes},"${rec.status}",${rec.total_minutes},"${rec.notes || ''}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Audit_${reportData.period.start_date}_to_${reportData.period.end_date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Convert metrics duration into years, months, days, hours, mins string format
  const formatDetailedDuration = (days: number, hours: number, mins: number) => {
    const years = Math.floor(days / 365);
    const remDaysAfterYears = days % 365;
    const months = Math.floor(remDaysAfterYears / 30);
    const finalDays = remDaysAfterYears % 30;

    const parts: string[] = [];
    if (years > 0) parts.push(`${years} ${lang === 'kh' ? 'ឆ្នាំ' : years === 1 ? 'Year' : 'Years'}`);
    if (months > 0) parts.push(`${months} ${lang === 'kh' ? 'ខែ' : months === 1 ? 'Month' : 'Months'}`);
    if (finalDays > 0 || (years === 0 && months === 0)) parts.push(`${finalDays} ${lang === 'kh' ? 'ថ្ងៃ' : finalDays === 1 ? 'Day' : 'Days'}`);
    parts.push(`${hours} ${lang === 'kh' ? 'ម៉ោង' : hours === 1 ? 'Hour' : 'Hours'}`);
    parts.push(`${mins} ${lang === 'kh' ? 'នាទី' : mins === 1 ? 'Min' : 'Mins'}`);

    return parts.join(', ');
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

      {/* Top Header Bar - Clean Light Theme */}
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-md shadow-indigo-200">
            <Calendar className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {lang === 'kh' ? 'របាយការណ៍វត្តមាន និងការស៊ើបអង្កេតបុគ្គលិកម្នាក់ៗ' : 'Attendance & Employee One-by-One Audit Portal'}
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200">
                SUPER ADMIN AUDIT
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {lang === 'kh' ? 'ពិនិត្យមើលវត្តមានបុគ្គលិកម្នាក់ៗជារៀងរាល់ថ្ងៃ ម៉ោងមកដល់ មូលហេតុយឺត និង ទីតាំង GPS / IP' : 'Audit individual staff members one-by-one daily, punctuality offsets, reasons, GPS location & device verification'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setGlobalActiveTab('payroll')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl transition shadow-md shadow-emerald-200 flex items-center space-x-2"
            title="Open Dedicated Staff Payroll & Salary Calculator Page"
          >
            <DollarSign className="w-4 h-4" />
            <span>{lang === 'kh' ? 'ទំព័រគណនាប្រាក់ខែ' : 'Payroll Calculator Page'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={loading || !reportData}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 disabled:opacity-50 text-xs font-bold rounded-2xl transition flex items-center space-x-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'kh' ? 'ទាញយក CSV' : 'Export CSV'}</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={loading || !reportData}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 text-xs font-bold rounded-2xl transition shadow-md shadow-indigo-200 flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'kh' ? 'បោះពុម្ព' : 'Print Report'}</span>
          </button>
        </div>
      </div>

      {/* Filter Control Panel - Clean White Card */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-4 no-print">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>{lang === 'kh' ? 'តម្រងស្វែងរក' : 'Report Parameters & Filters'}</span>
          </div>
          {reportData && (
            <div className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              {lang === 'kh' ? 'កាលបរិច្ឆេទ:' : 'Range:'} {reportData.period.start_date} ~ {reportData.period.end_date}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Preset Picker */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              {lang === 'kh' ? 'កំឡុងពេល' : 'Date Range Preset'}
            </label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="this_month">{lang === 'kh' ? 'ខែនេះ (This Month)' : 'This Month'}</option>
              <option value="last_month">{lang === 'kh' ? 'ខែមុន (Last Month)' : 'Last Month'}</option>
              <option value="this_year">{lang === 'kh' ? 'ឆ្នាំនេះ (This Year)' : 'This Year'}</option>
              <option value="this_week">{lang === 'kh' ? 'សប្តាហ៍នេះ (This Week)' : 'This Week'}</option>
              <option value="today">{lang === 'kh' ? 'ថ្ងៃនេះ (Today)' : 'Today'}</option>
              <option value="custom">{lang === 'kh' ? 'កំណត់ផ្ទាល់ខ្លួន (Custom Range)' : 'Custom Range'}</option>
            </select>
          </div>

          {/* Year Picker */}
          {preset !== 'custom' && preset !== 'today' && preset !== 'this_week' && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                {lang === 'kh' ? 'ជ្រើសរើសឆ្នាំ' : 'Select Year'}
              </label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:border-indigo-500"
              >
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {/* Month Picker */}
          {preset !== 'custom' && preset !== 'today' && preset !== 'this_week' && preset !== 'this_year' && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                {lang === 'kh' ? 'ជ្រើសរើសខែ' : 'Select Month'}
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">{lang === 'kh' ? 'គ្រប់ខែទាំងអស់' : 'All Months'}</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2026, m - 1, 1).toLocaleString('en-US', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Employee Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              {lang === 'kh' ? 'ជ្រើសរើសបុគ្គលិក' : 'Staff Member'}
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => {
                setSelectedEmployeeId(e.target.value);
                if (e.target.value) {
                  handleSelectEmployeeForAudit(Number(e.target.value));
                }
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="">{lang === 'kh' ? 'បុគ្គលិកទាំងអស់' : 'All Employees'}</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employee_code} - {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Punctuality Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              {lang === 'kh' ? 'ស្ថានភាពភាពទៀងទាត់' : 'Punctuality Filter'}
            </label>
            <select
              value={punctualityStatus}
              onChange={(e) => setPunctualityStatus(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">{lang === 'kh' ? 'ទាំងអស់ (All Statuses)' : 'All Statuses'}</option>
              <option value="ON_TIME">{lang === 'kh' ? 'មកទាន់ម៉ោង (On Time Only)' : 'On Time Only'}</option>
              <option value="LATE">{lang === 'kh' ? 'មកយឺត (Late Arrivals Only)' : 'Late Arrivals Only'}</option>
            </select>
          </div>
        </div>

        {/* Custom Date Inputs if preset === 'custom' */}
        {preset === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-800"
              />
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards Grid - High Contrast Light Theme */}
      {reportData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
          {/* Punctuality Rate Card */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
              <span>{lang === 'kh' ? 'អត្រាភាពទៀងទាត់' : 'Overall Punctuality'}</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-emerald-600">
                {reportData.metrics.on_time_percentage}%
              </span>
              <span className="text-xs text-gray-400 font-medium">on time rate</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${reportData.metrics.on_time_percentage}%` }}
              />
            </div>
          </div>

          {/* Shifts & Late Count */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
              <span>{lang === 'kh' ? 'វេនសរុប / យឺត' : 'Total Shifts / Late'}</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline space-x-2.5">
              <span className="text-2xl font-extrabold text-gray-900">{reportData.metrics.total_shifts} <span className="text-xs text-gray-400 font-normal">shifts</span></span>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                {reportData.metrics.late_shifts} Late
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {reportData.metrics.on_time_shifts} On Time shifts ({reportData.metrics.on_time_percentage}%)
            </div>
          </div>

          {/* Cumulative Late Offset Minutes */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
              <span>{lang === 'kh' ? 'នាទីយឺតសរុប' : 'Total Late Offset'}</span>
              <TrendingDown className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-600">
              +{reportData.metrics.total_late_minutes} <span className="text-xs font-normal text-gray-500">mins late</span>
            </div>
            <div className="text-xs text-gray-500">
              Scheduled start at 08:30 AM daily
            </div>
          </div>

          {/* Total Work Duration (Years, Months, Days, Hours, Mins) */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
              <span>{lang === 'kh' ? 'រយៈពេលធ្វើការសរុប' : 'Total Work Duration'}</span>
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-sm font-bold text-purple-700 leading-tight">
              {formatDetailedDuration(
                reportData.metrics.duration_breakdown.days,
                reportData.metrics.duration_breakdown.hours,
                reportData.metrics.duration_breakdown.minutes
              )}
            </div>
            <div className="text-xs text-gray-500">
              Total {reportData.metrics.total_work_hours} Hours ({reportData.metrics.total_work_minutes} mins)
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area: Tabs + Tables */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex items-center border-b border-gray-200 bg-gray-50 px-4 pt-3 no-print overflow-x-auto">
          <button
            onClick={() => setActiveTab('EMPLOYEE_SUMMARY')}
            className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center space-x-2 shrink-0 ${
              activeTab === 'EMPLOYEE_SUMMARY'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{lang === 'kh' ? 'សេចក្តីសង្ខេបតាមបុគ្គលិក' : 'Employee Summary'}</span>
          </button>

          <button
            onClick={() => setActiveTab('INDIVIDUAL_AUDIT')}
            className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center space-x-2 shrink-0 ${
              activeTab === 'INDIVIDUAL_AUDIT'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'kh' ? 'ពិនិត្យវត្តមានបុគ្គលិកម្នាក់ៗ' : 'One-by-One Daily Audit'}</span>
          </button>

          <button
            onClick={() => setActiveTab('DETAILED_LOGS')}
            className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center space-x-2 shrink-0 ${
              activeTab === 'DETAILED_LOGS'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{lang === 'kh' ? 'កំណត់ត្រាស្កេនលម្អិត' : 'Detailed Shift Punch Ledger'}</span>
          </button>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold">{lang === 'kh' ? 'កំពុងទាញយកទិន្នន័យរបាយការណ៍...' : 'Loading audit report data...'}</p>
          </div>
        ) : !reportData ? (
          <div className="p-12 text-center text-gray-500">
            <p>{lang === 'kh' ? 'មិនមានទិន្នន័យសម្រាប់បង្ហាញទេ' : 'No report data available'}</p>
          </div>
        ) : activeTab === 'INDIVIDUAL_AUDIT' ? (
          /* One-by-One Employee Daily Audit Portal */
          <div className="p-4 sm:p-6 space-y-6">
            {/* Employee Switcher Header Bar */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Employee Info Header */}
              {activeAuditSummary ? (
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-200">
                    {activeAuditSummary.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                        {activeAuditSummary.employee_code}
                      </span>
                      <h2 className="text-lg font-extrabold text-gray-900">{activeAuditSummary.name}</h2>
                    </div>
                    <p className="text-xs text-gray-500">
                      {activeAuditSummary.role} {activeAuditSummary.phone && `• ${activeAuditSummary.phone}`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-xs">Select an employee to audit</div>
              )}

              {/* Prev / Next Employee Navigation */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrevEmployee}
                  className="px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition flex items-center space-x-1 shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{lang === 'kh' ? 'បុគ្គលិកមុន' : 'Prev Staff'}</span>
                </button>

                <span className="text-xs text-gray-600 font-mono font-bold px-2">
                  {reportData.employee_summaries.length > 0 ? `${activeAuditEmpIndex + 1} / ${reportData.employee_summaries.length}` : '0 / 0'}
                </span>

                <button
                  onClick={handleNextEmployee}
                  className="px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition flex items-center space-x-1 shadow-2xs"
                >
                  <span>{lang === 'kh' ? 'បុគ្គលិកបន្ទាប់' : 'Next Staff'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Individual Employee Metrics Bar */}
            {activeAuditSummary && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-1 shadow-2xs">
                  <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Punctuality Score</div>
                  <div className="text-2xl font-black text-emerald-600">{activeAuditSummary.punctuality_rate}%</div>
                  <div className="text-xs text-gray-500">{activeAuditSummary.on_time_shifts} of {activeAuditSummary.total_shifts} shifts on time</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-1 shadow-2xs">
                  <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Late Arrivals</div>
                  <div className="text-2xl font-black text-rose-600">{activeAuditSummary.late_shifts} <span className="text-xs font-normal text-gray-400">late shifts</span></div>
                  <div className="text-xs font-bold text-amber-600">+{activeAuditSummary.total_late_minutes} mins cumulative offset</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-1 shadow-2xs">
                  <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Work Duration</div>
                  <div className="text-sm font-bold text-purple-700">{activeAuditSummary.formatted_duration}</div>
                  <div className="text-xs text-gray-500">Total {activeAuditSummary.total_hours} Hours</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-1 shadow-2xs">
                  <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Scheduled Shift</div>
                  <div className="text-sm font-bold text-indigo-700">08:30 AM Daily</div>
                  <div className="text-xs text-gray-500">SmartPOS HQ Standard</div>
                </div>
              </div>
            )}

            {/* Individual Employee Daily Timeline Table */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden print-full-width shadow-2xs">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="flex items-center space-x-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>{lang === 'kh' ? 'កំណត់ត្រាវត្តមានប្រចាំថ្ងៃ' : 'Daily Punch & Reason Audit Log'}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Total {activeEmployeeDailyRecords.length} records in range
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100/80 text-gray-600 text-[11px] uppercase tracking-wider border-b border-gray-200">
                      <th className="p-3.5">{lang === 'kh' ? 'ថ្ងៃខែឆ្នាំ' : 'Date'}</th>
                      <th className="p-3.5 text-center">{lang === 'kh' ? 'ម៉ោងកំណត់' : 'Scheduled'}</th>
                      <th className="p-3.5 text-center">{lang === 'kh' ? 'ម៉ោងចូល' : 'Clock In'}</th>
                      <th className="p-3.5 text-center">{lang === 'kh' ? 'ម៉ោងចេញ' : 'Clock Out'}</th>
                      <th className="p-3.5 text-center">{lang === 'kh' ? 'ភាពយឺតយ៉ាវ' : 'Late Offset'}</th>
                      <th className="p-3.5">{lang === 'kh' ? 'មូលហេតុយឺត / កំណត់ចំណាំ' : 'Reason / Supervisor Note'}</th>
                      <th className="p-3.5">{lang === 'kh' ? 'សន្តិសុខ GPS/IP' : 'Security (GPS/IP)'}</th>
                      <th className="p-3.5 text-right">{lang === 'kh' ? 'រយៈពេល' : 'Duration'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-xs">
                    {activeEmployeeDailyRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-gray-400">
                          {lang === 'kh' ? 'មិនមានកំណត់ត្រាសម្រាប់បុគ្គលិកនេះទេ' : 'No daily punch logs recorded for this employee in the selected timeframe'}
                        </td>
                      </tr>
                    ) : (
                      activeEmployeeDailyRecords.map((rec) => {
                        const hasGps = rec.latitude && rec.longitude;
                        return (
                          <tr key={rec.id} className="hover:bg-gray-50 transition">
                            <td className="p-3.5 font-mono font-bold text-gray-800">
                              <div>{rec.date}</div>
                              <div className="text-[10px] text-gray-400 font-sans">
                                {new Date(rec.date).toLocaleDateString('en-US', { weekday: 'short' })}
                              </div>
                            </td>
                            <td className="p-3.5 text-center font-mono text-xs text-gray-500">
                              {rec.scheduled_start}
                            </td>
                            <td className="p-3.5 text-center font-mono font-bold text-emerald-600">
                              {rec.clock_in ? new Date(rec.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}
                            </td>
                            <td className="p-3.5 text-center font-mono text-gray-700">
                              {rec.clock_out ? (
                                new Date(rec.clock_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                              ) : (
                                <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[10px] font-bold">Active</span>
                              )}
                            </td>
                            <td className="p-3.5 text-center">
                              {rec.late_minutes > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-700 bg-rose-100 border border-rose-200 px-2.5 py-0.5 rounded-md">
                                  <AlertTriangle className="w-3 h-3" />
                                  +{rec.late_minutes} mins late
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                                  <CheckCircle2 className="w-3 h-3" />
                                  On Time
                                </span>
                              )}
                            </td>
                            {/* Reason / Supervisor Note column */}
                            <td className="p-3.5 max-w-xs">
                              {editingRecordId === rec.id ? (
                                <div className="flex items-center space-x-1.5">
                                  <input
                                    type="text"
                                    value={editingNoteText}
                                    onChange={(e) => setEditingNoteText(e.target.value)}
                                    placeholder="Enter late reason or supervisor note..."
                                    className="bg-white border border-indigo-400 rounded-lg px-2 py-1 text-xs text-gray-900 w-full focus:outline-none"
                                  />
                                  <button
                                    onClick={() => handleSaveNote(rec.id)}
                                    disabled={isSavingNote}
                                    className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingRecordId(null)}
                                    className="p-1 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-start justify-between space-x-2 group">
                                  <span className="text-xs text-gray-700 italic">
                                    {rec.notes ? `"${rec.notes}"` : <span className="text-gray-400 not-italic text-[11px]">No reason noted</span>}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingRecordId(rec.id);
                                      setEditingNoteText(rec.notes || '');
                                    }}
                                    className="text-indigo-600 hover:text-indigo-800 opacity-80 hover:opacity-100 p-0.5 rounded"
                                    title="Edit Reason / Note"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                            {/* Security & GPS column */}
                            <td className="p-3.5 text-xs text-gray-600 space-y-1">
                              <div className="flex items-center space-x-1 font-semibold text-gray-800">
                                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                                <span>{rec.employee?.branch?.name || 'Storefront HQ'}</span>
                              </div>
                              {rec.ip_address && (
                                <div className="flex items-center space-x-1 text-gray-500 font-mono text-[10px]">
                                  <Globe className="w-3 h-3 text-gray-400" />
                                  <span>IP: {rec.ip_address}</span>
                                </div>
                              )}
                              {hasGps ? (
                                <a
                                  href={`https://www.google.com/maps?q=${rec.latitude},${rec.longitude}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center space-x-1 text-emerald-700 hover:underline font-mono text-[10px] font-bold"
                                >
                                  <MapPin className="w-3 h-3 text-emerald-600" />
                                  <span>GPS: {Number(rec.latitude).toFixed(4)}, {Number(rec.longitude).toFixed(4)} (Maps)</span>
                                </a>
                              ) : (
                                <div className="text-gray-400 text-[10px]">No GPS captured</div>
                              )}
                            </td>
                            <td className="p-3.5 text-right font-mono font-bold text-gray-800">
                              {rec.formatted_duration || `${rec.total_minutes}m`}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'EMPLOYEE_SUMMARY' ? (
          /* Employee Summary Table - Clean Light Theme */
          <div className="overflow-x-auto print-full-width">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/80 text-gray-600 text-[11px] uppercase tracking-wider border-b border-gray-200">
                  <th className="p-3.5">{lang === 'kh' ? 'កូដបុគ្គលិក' : 'Emp Code'}</th>
                  <th className="p-3.5">{lang === 'kh' ? 'ឈ្មោះបុគ្គលិក' : 'Employee Name'}</th>
                  <th className="p-3.5">{lang === 'kh' ? 'តួនាទី' : 'Role'}</th>
                  <th className="p-3.5 text-center">{lang === 'kh' ? 'វេនសរុប' : 'Shifts'}</th>
                  <th className="p-3.5 text-center">{lang === 'kh' ? 'ទាន់ម៉ោង' : 'On Time'}</th>
                  <th className="p-3.5 text-center">{lang === 'kh' ? 'មកយឺត' : 'Late'}</th>
                  <th className="p-3.5 text-center">{lang === 'kh' ? 'អត្រា %' : 'Punctuality %'}</th>
                  <th className="p-3.5 text-center">{lang === 'kh' ? 'នាទីយឺតសរុប' : 'Total Late Mins'}</th>
                  <th className="p-3.5 text-right">{lang === 'kh' ? 'ម៉ោងធ្វើការសរុប' : 'Total Duration'}</th>
                  <th className="p-3.5 text-center no-print">{lang === 'kh' ? 'សកម្មភាព' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs">
                {reportData.employee_summaries.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-gray-400">
                      {lang === 'kh' ? 'មិនមានទិន្នន័យបុគ្គលិកក្នុងកំឡុងពេលនេះទេ' : 'No employee records found for this timeframe'}
                    </td>
                  </tr>
                ) : (
                  reportData.employee_summaries.map((emp) => (
                    <tr key={emp.employee_id} className="hover:bg-gray-50 transition">
                      <td className="p-3.5 font-mono font-bold text-gray-800">{emp.employee_code}</td>
                      <td className="p-3.5 font-semibold text-gray-900">
                        <div>{emp.name}</div>
                        {emp.phone && <div className="text-[10px] text-gray-400 font-sans">{emp.phone}</div>}
                      </td>
                      <td className="p-3.5 text-gray-600">
                        <span className="bg-gray-100 text-gray-700 text-[11px] px-2.5 py-1 rounded-md border border-gray-200 font-medium">
                          {emp.role}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-gray-800">{emp.total_shifts}</td>
                      <td className="p-3.5 text-center text-emerald-700 font-bold">{emp.on_time_shifts}</td>
                      <td className="p-3.5 text-center font-bold text-rose-600">
                        {emp.late_shifts > 0 ? (
                          <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md border border-rose-200">
                            {emp.late_shifts}
                          </span>
                        ) : (
                          '0'
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`font-black text-[11px] px-2 py-0.5 rounded-md ${
                            emp.punctuality_rate >= 90
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : emp.punctuality_rate >= 75
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {emp.punctuality_rate}%
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-mono">
                        {emp.total_late_minutes > 0 ? (
                          <span className="text-amber-700 font-extrabold">+{emp.total_late_minutes}m</span>
                        ) : (
                          <span className="text-gray-400">0m</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-bold text-indigo-700">
                        <div>{emp.formatted_duration}</div>
                        <div className="text-[10px] text-gray-400 font-normal">({emp.total_hours} hrs)</div>
                      </td>
                      <td className="p-3.5 text-center no-print">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => setDetailedModalEmployee(emp)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition border border-indigo-200 flex items-center space-x-1"
                            title="View Full Profile Details & Reasons"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Full Details</span>
                          </button>

                          <button
                            onClick={() => handleSelectEmployeeForAudit(emp.employee_id)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition border border-emerald-200 flex items-center space-x-1"
                            title="Daily Audit Timeline"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Audit Daily</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Detailed Ledger Table - Clean Light Theme */
          <div className="overflow-x-auto print-full-width">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/80 text-gray-600 text-[11px] uppercase tracking-wider border-b border-gray-200">
                  <th className="p-3.5">{lang === 'kh' ? 'កាលបរិច្ឆេទ' : 'Date'}</th>
                  <th className="p-3.5">{lang === 'kh' ? 'បុគ្គលិក' : 'Employee'}</th>
                  <th className="p-3.5 text-center">{lang === 'kh' ? 'ម៉ោងកំណត់' : 'Scheduled'}</th>
                  <th className="p-3.5 text-center">{lang === 'kh' ? 'ម៉ោងចូល' : 'Clock In'}</th>
                  <th className="p-3.5 text-center">{lang === 'kh' ? 'ម៉ោងចេញ' : 'Clock Out'}</th>
                  <th className="p-3.5 text-center">{lang === 'kh' ? 'ភាពយឺតយ៉ាវ' : 'Late Offset'}</th>
                  <th className="p-3.5">{lang === 'kh' ? 'មូលហេតុ' : 'Reason / Note'}</th>
                  <th className="p-3.5 text-center">{lang === 'kh' ? 'ស្ថានភាព' : 'Status'}</th>
                  <th className="p-3.5 text-right">{lang === 'kh' ? 'រយៈពេល' : 'Duration'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs">
                {reportData.records.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-400">
                      {lang === 'kh' ? 'មិនមានកំណត់ត្រាស្កេនទេ' : 'No attendance scan logs found for selected filters'}
                    </td>
                  </tr>
                ) : (
                  reportData.records.map((rec) => {
                    const empName = rec.employee ? `${rec.employee.first_name} ${rec.employee.last_name}` : 'Unknown';
                    const empCode = rec.employee ? rec.employee.employee_code : 'N/A';
                    return (
                      <tr key={rec.id} className="hover:bg-gray-50 transition">
                        <td className="p-3.5 font-mono font-bold text-gray-800">{rec.date}</td>
                        <td className="p-3.5 font-semibold text-gray-900">
                          <div>{empName}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{empCode}</div>
                        </td>
                        <td className="p-3.5 text-center font-mono text-gray-500 text-[11px]">
                          {rec.scheduled_start}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-emerald-600">
                          {rec.clock_in ? new Date(rec.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}
                        </td>
                        <td className="p-3.5 text-center font-mono text-gray-700">
                          {rec.clock_out ? (
                            new Date(rec.clock_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                          ) : (
                            <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[10px] font-bold">Active</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          {rec.late_minutes > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md">
                              <AlertTriangle className="w-3 h-3" />
                              +{rec.late_minutes} mins late
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3 h-3" />
                              On Time
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-gray-600 max-w-xs truncate">
                          {rec.notes ? `"${rec.notes}"` : '-'}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                              rec.status === 'LATE'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : rec.status === 'PRESENT' || rec.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-gray-800">
                          {rec.formatted_duration || `${rec.total_minutes}m`}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Clickable Employee Full Details & Reasons Audit Modal */}
      {detailedModalEmployee && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            <button
              onClick={() => setDetailedModalEmployee(null)}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition no-print"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header Dossier */}
            <div className="border-b border-gray-200 pb-5 flex items-start space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-200 shrink-0">
                {detailedModalEmployee.name.charAt(0)}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                      {detailedModalEmployee.employee_code}
                    </span>
                    <h2 className="text-xl font-black text-gray-900">{detailedModalEmployee.name}</h2>
                  </div>

                  <span
                    className={`font-black text-xs px-3 py-1 rounded-full ${
                      detailedModalEmployee.punctuality_rate >= 90
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {detailedModalEmployee.punctuality_rate}% On Time Rate
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Role: <span className="font-bold text-gray-800">{detailedModalEmployee.role}</span> • Phone: <span className="font-bold text-gray-800">{detailedModalEmployee.phone || 'N/A'}</span>
                </p>
                <div className="flex items-center space-x-4 text-[11px] text-gray-500 pt-1">
                  <span>Shifts: <strong className="text-gray-900">{detailedModalEmployee.total_shifts}</strong></span>
                  <span>Late Arrivals: <strong className="text-rose-600">{detailedModalEmployee.late_shifts}</strong></span>
                  <span>Late Offset: <strong className="text-amber-600">+{detailedModalEmployee.total_late_minutes} mins</strong></span>
                  <span>Total Duration: <strong className="text-purple-700">{detailedModalEmployee.formatted_duration}</strong></span>
                </div>
              </div>
            </div>

            {/* Daily Audit Ledger with Reasons */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center space-x-2">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <span>Full Shift Punch & Supervisor Reason Log</span>
                </h3>
                <span className="text-xs text-gray-500">{detailedModalRecords.length} records</span>
              </div>

              <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-2xl divide-y divide-gray-100 text-xs">
                {detailedModalRecords.length === 0 ? (
                  <div className="p-6 text-center text-gray-400">No shift records for this staff member</div>
                ) : (
                  detailedModalRecords.map((rec) => {
                    const hasGps = rec.latitude && rec.longitude;
                    return (
                      <div key={rec.id} className="p-4 space-y-2 hover:bg-gray-50 transition">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 font-mono">
                            <span className="font-bold text-gray-900">{rec.date}</span>
                            <span className="text-gray-400 text-[10px]">
                              ({new Date(rec.date).toLocaleDateString('en-US', { weekday: 'short' })})
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {rec.late_minutes > 0 ? (
                              <span className="text-[10px] font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                                +{rec.late_minutes}m Late
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                                On Time
                              </span>
                            )}
                            <span className="font-mono text-xs font-bold text-indigo-700">
                              {rec.formatted_duration || `${rec.total_minutes}m`}
                            </span>
                          </div>
                        </div>

                        {/* Punch Clock details */}
                        <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded-xl font-mono text-[11px] text-gray-700">
                          <div>
                            <span className="text-gray-400 text-[10px] block uppercase">Scheduled</span>
                            {rec.scheduled_start}
                          </div>
                          <div>
                            <span className="text-gray-400 text-[10px] block uppercase">Clock In</span>
                            <span className="text-emerald-700 font-bold">
                              {rec.clock_in ? new Date(rec.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-[10px] block uppercase">Clock Out</span>
                            <span>
                              {rec.clock_out ? new Date(rec.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                            </span>
                          </div>
                        </div>

                        {/* Supervisor Note / Late Reason */}
                        <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/80 flex items-start justify-between space-x-2">
                          <div className="text-xs text-amber-900">
                            <span className="font-bold text-amber-800">Reason / Note: </span>
                            <span className="italic">{rec.notes ? `"${rec.notes}"` : 'No supervisor note recorded.'}</span>
                          </div>

                          {editingRecordId === rec.id ? (
                            <div className="flex items-center space-x-1 shrink-0">
                              <input
                                type="text"
                                value={editingNoteText}
                                onChange={(e) => setEditingNoteText(e.target.value)}
                                className="bg-white border border-indigo-400 rounded px-2 py-0.5 text-xs text-gray-900 w-44 focus:outline-none"
                              />
                              <button
                                onClick={() => handleSaveNote(rec.id)}
                                disabled={isSavingNote}
                                className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingRecordId(rec.id);
                                setEditingNoteText(rec.notes || '');
                              }}
                              className="text-xs text-indigo-700 font-bold hover:underline shrink-0"
                            >
                              Edit Reason
                            </button>
                          )}
                        </div>

                        {/* Security Verification & GPS */}
                        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                          <div className="flex items-center space-x-3">
                            <span>Method: <strong className="text-gray-700 font-mono">{rec.scan_method}</strong></span>
                            {rec.ip_address && <span>IP: <strong className="text-gray-700 font-mono">{rec.ip_address}</strong></span>}
                          </div>
                          {hasGps && (
                            <a
                              href={`https://www.google.com/maps?q=${rec.latitude},${rec.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-700 font-bold hover:underline flex items-center space-x-1"
                            >
                              <MapPin className="w-3 h-3 text-emerald-600" />
                              <span>View GPS Location on Map</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 no-print">
              <button
                onClick={() => {
                  setDetailedModalEmployee(null);
                  handleSelectEmployeeForAudit(detailedModalEmployee.employee_id);
                }}
                className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition border border-emerald-200"
              >
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Open One-by-One Timeline</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setDetailedModalEmployee(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
                >
                  Close
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Staff Dossier</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
