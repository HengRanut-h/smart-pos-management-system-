import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../application/context/AppContext';
import {
  AttendanceRecord,
  AttendanceMetrics,
  Employee,
  ScanAttendanceResponse,
} from '../../foundation/types';
import {
  getAttendances,
  scanAttendance,
  createManualAttendance,
  getEmployees,
  scanStoreAttendance,
} from '../../data-access/posApi';
import { StoreAttendanceQrModal } from './StoreAttendanceQrModal';
import { AttendanceReportView } from './AttendanceReportView';
import { BarcodeScannerModal } from '../pos/BarcodeScannerModal';
import { StaffBadgePrintModal } from './StaffBadgePrintModal';
import {
  Clock,
  Barcode,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Users,
  UserCheck,
  Sparkles,
  RefreshCw,
  Search,
  Plus,
  Printer,
  X,
  Download,
  Calendar,
  QrCode,
  Building2,
  BarChart2,
} from 'lucide-react';

export const AttendanceKioskView: React.FC = () => {
  const { lang } = useApp();

  const [showReportPortal, setShowReportPortal] = useState<boolean>(false);


  // State
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [metrics, setMetrics] = useState<AttendanceMetrics>({
    date: selectedDate,
    total_staff: 0,
    present_count: 0,
    on_duty_count: 0,
    completed_count: 0,
    late_count: 0,
    attendance_rate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Live Current Time
  const [currentTime, setCurrentTime] = useState(new Date());

  // Scanner Barcode Input
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Modals & Banners
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [isStoreQrModalOpen, setIsStoreQrModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [lastPunchResponse, setLastPunchResponse] = useState<ScanAttendanceResponse | null>(null);
  const [scanErrorMessage, setScanErrorMessage] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Manual Punch Form
  const [manualEmpId, setManualEmpId] = useState<number>(0);
  const [manualDate, setManualDate] = useState(selectedDate);
  const [manualClockIn, setManualClockIn] = useState('08:30');
  const [manualClockOut, setManualClockOut] = useState('17:30');
  const [manualStatus, setManualStatus] = useState('COMPLETED');
  const [manualNotes, setManualNotes] = useState('');
  const [isSavingManual, setIsSavingManual] = useState(false);

  // Keep clock running every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Safe time formatting helper
  const formatTimeStr = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      const cleanIso = isoString.replace(' ', 'T');
      const dateObj = new Date(cleanIso);
      if (isNaN(dateObj.getTime())) return '—';
      return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  };

  // Audio Chime Synthesizer
  const playAudioCue = (cue: 'IN' | 'OUT' | 'ERROR') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (cue === 'IN') {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now);
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain1.gain.setValueAtTime(0.2, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);
      } else if (cue === 'OUT') {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now);
        osc1.frequency.exponentialRampToValueAtTime(440, now + 0.2);
        gain1.gain.setValueAtTime(0.2, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      }

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(cue === 'ERROR' ? [200, 100, 200] : [80]);
      }
    } catch (err) {
      console.error('Audio cue error', err);
    }
  };

  // Load Data
  const loadAttendanceData = async (targetDate?: string) => {
    const dateToFetch = targetDate || selectedDate;
    setIsLoading(true);
    try {
      const [attRes, empList] = await Promise.all([
        getAttendances({ date: dateToFetch }),
        getEmployees(),
      ]);
      setAttendances(attRes.data);
      setMetrics(attRes.metrics);
      setEmployees(empList);
      if (empList.length > 0 && manualEmpId === 0) {
        setManualEmpId(empList[0].id);
      }
    } catch (err) {
      console.error('Failed to load attendance data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceData(selectedDate);
  }, [selectedDate]);

  // Handle Scan Action
  const handleProcessScan = async (codeToScan: string, method: 'BARCODE_SCANNER' | 'CAMERA' = 'BARCODE_SCANNER') => {
    const raw = codeToScan.trim();
    if (!raw) return;

    setIsProcessingScan(true);
    setScanErrorMessage(null);

    try {
      const res = await scanAttendance(raw, method);
      setLastPunchResponse(res);
      playAudioCue(res.action === 'CLOCKED_IN' ? 'IN' : 'OUT');
      setBarcodeInput('');

      // Refresh roster
      loadAttendanceData(selectedDate);

      // Auto dismiss punch response after 8 seconds
      setTimeout(() => {
        setLastPunchResponse((curr) => (curr?.attendance.id === res.attendance.id ? null : curr));
      }, 8000);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        `Barcode "${raw}" not recognized as valid employee badge.`;
      setScanErrorMessage(msg);
      playAudioCue('ERROR');
    } finally {
      setIsProcessingScan(false);
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 200);
    }
  };

  // Keyboard Scanner Keydown (Hardware Scanners send Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleProcessScan(barcodeInput, 'BARCODE_SCANNER');
    }
  };

  // Handle Camera Barcode Scanned
  const handleCameraBarcodeDetected = async (code: string) => {
    setIsCameraScannerOpen(false);
    const raw = code.trim();
    if (!raw) return;

    setIsProcessingScan(true);
    setScanErrorMessage(null);

    try {
      let res: ScanAttendanceResponse;
      if (raw.includes('SMARTPOS:ATTENDANCE')) {
        // Employee scanning Storefront QR Poster with phone/camera
        res = await scanStoreAttendance(raw, undefined, 'MOBILE_CAMERA');
      } else {
        // Station camera scanning Staff Badge ID
        res = await scanAttendance(raw, 'CAMERA');
      }

      setLastPunchResponse(res);
      playAudioCue(res.action === 'CLOCKED_IN' ? 'IN' : 'OUT');
      setBarcodeInput('');
      loadAttendanceData(selectedDate);

      setTimeout(() => {
        setLastPunchResponse((curr) => (curr?.attendance.id === res.attendance.id ? null : curr));
      }, 8000);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        `Scanned code "${raw}" not recognized. Please scan a valid staff badge or store QR poster.`;
      setScanErrorMessage(msg);
      playAudioCue('ERROR');
    } finally {
      setIsProcessingScan(false);
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 200);
    }
  };

  // Handle Manual Punch Submission
  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmpId) return;

    setIsSavingManual(true);
    try {
      await createManualAttendance({
        employee_id: manualEmpId,
        date: manualDate,
        clock_in: manualClockIn,
        clock_out: manualClockOut || undefined,
        status: manualStatus,
        notes: manualNotes || undefined,
      });
      setIsManualModalOpen(false);
      setManualNotes('');
      loadAttendanceData(selectedDate);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save manual attendance entry.');
    } finally {
      setIsSavingManual(false);
    }
  };

  // Export Attendance CSV
  const handleExportCsv = () => {
    if (attendances.length === 0) {
      alert('No attendance data available to export.');
      return;
    }

    const headers = ['Date', 'Employee Code', 'Staff Name', 'Role', 'Clock In', 'Clock Out', 'Duration', 'Method', 'Status'];
    const rows = attendances.map((rec) => {
      const emp = rec.employee;
      const name = `${emp?.first_name || ''} ${emp?.last_name || ''}`;
      const role = emp?.user?.roles?.[0]?.name || 'POS Cashier';
      return [
        rec.date,
        emp?.employee_code || '',
        `"${name}"`,
        `"${role}"`,
        formatTimeStr(rec.clock_in),
        rec.clock_out ? formatTimeStr(rec.clock_out) : 'ON DUTY',
        rec.formatted_duration || `${rec.total_minutes}m`,
        rec.scan_method,
        rec.status,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartPOS_Attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Roster
  const filteredRecords = useMemo(() => {
    return attendances.filter((rec) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = `${rec.employee?.first_name || ''} ${rec.employee?.last_name || ''}`.toLowerCase();
        const code = (rec.employee?.employee_code || '').toLowerCase();
        if (!name.includes(q) && !code.includes(q)) return false;
      }

      if (statusFilter === 'ON_DUTY') {
        if (!rec.clock_in || rec.clock_out) return false;
      } else if (statusFilter === 'COMPLETED') {
        if (!rec.clock_out) return false;
      } else if (statusFilter === 'LATE') {
        if (rec.status !== 'LATE') return false;
      }

      return true;
    });
  }, [attendances, searchQuery, statusFilter]);

  if (showReportPortal) {
    return <AttendanceReportView onBack={() => setShowReportPortal(false)} />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* 1. Header & Live Time Clock Bar */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-200">
            <Clock className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {lang === 'kh' ? 'ម៉ោងស្កេនវត្តមានបុគ្គលិក' : 'Staff Attendance & Time Clock'}
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                LIVE KIOSK
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Instant employee barcode / QR badge punch with automated shift duration tracking
            </p>
          </div>
        </div>

        {/* Live Clock Display & Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="bg-gray-900 text-white px-4 py-2 rounded-2xl flex items-center space-x-3 shadow-inner">
            <div className="flex flex-col text-right">
              <span className="font-mono text-base font-black tracking-wider text-emerald-400">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-[10px] text-gray-400 font-semibold uppercase">
                {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowReportPortal(true)}
            className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition shadow-sm"
            title="Super Admin Attendance & Punctuality Audit Report"
          >
            <BarChart2 className="w-4 h-4 text-indigo-200" />
            <span>Audit Report</span>
          </button>

          <button
            onClick={() => setIsStoreQrModalOpen(true)}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition border border-emerald-200"
            title="Display / Print Storefront Attendance QR Standee"
          >
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Store QR Standee</span>
          </button>

          <button
            onClick={() => setIsBadgeModalOpen(true)}
            className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition"
            title="Print Employee Badges"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Print Staff Badges</span>
          </button>

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition"
            title="Manual Entry Override"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Manual Punch</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition"
            title="Export Attendance CSV"
          >
            <Download className="w-4 h-4 text-purple-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => loadAttendanceData(selectedDate)}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
            title="Refresh Attendance Roster"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Primary Scan Station Hero */}
      <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-800 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold flex items-center space-x-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>BADGE SCANNER CHECK-IN / CHECK-OUT</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Scan Staff Barcode to Clock In or Out
            </h2>
            <p className="text-xs text-gray-400 mt-1 max-w-xl">
              Tap your physical barcode scanner or click the Camera button to scan directly from your device screen, badge card, or phone.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsCameraScannerOpen(true)}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black rounded-2xl text-xs sm:text-sm shadow-lg shadow-emerald-900/50 flex items-center space-x-2.5 transition"
            >
              <Camera className="w-4 h-4 stroke-[2.5]" />
              <span>Camera Scanner</span>
            </button>
          </div>
        </div>

        {/* Barcode Input Box */}
        <div className="relative">
          <div className="relative flex items-center">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-emerald-400 z-10">
              <Barcode className="w-6 h-6 shrink-0" />
            </div>
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan barcode badge or type EMP-004 / ID..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isProcessingScan}
              autoFocus
              className="w-full pl-16 pr-32 py-4 bg-slate-800/80 hover:bg-slate-800 focus:bg-slate-900 text-white placeholder:text-slate-400 rounded-2xl text-sm sm:text-base font-bold font-mono tracking-wider border-2 border-slate-700/80 focus:border-emerald-400 focus:outline-hidden transition shadow-inner"
            />
            <button
              onClick={() => handleProcessScan(barcodeInput, 'BARCODE_SCANNER')}
              disabled={!barcodeInput.trim() || isProcessingScan}
              className="absolute right-2.5 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-40 font-black rounded-xl text-xs tracking-wider uppercase transition active:scale-95 shadow-md flex items-center space-x-1.5"
            >
              {isProcessingScan ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <span>PUNCH</span>
              )}
            </button>
          </div>
        </div>


        {/* Error Alert Box */}
        {scanErrorMessage && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-4 flex items-center justify-between text-red-200 text-xs animate-shake">
            <div className="flex items-center space-x-2.5">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span className="font-semibold">{scanErrorMessage}</span>
            </div>
            <button
              onClick={() => setScanErrorMessage(null)}
              className="p-1 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Live Punch Confirmation Hero Card */}
        {lastPunchResponse && (
          <div
            className={`p-5 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-scale-up ${
              lastPunchResponse.action === 'CLOCKED_IN'
                ? 'bg-emerald-950/80 border-emerald-400 text-emerald-100 shadow-xl shadow-emerald-950'
                : 'bg-blue-950/80 border-blue-400 text-blue-100 shadow-xl shadow-blue-950'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-md border-2 border-white/30 text-white ${
                  lastPunchResponse.action === 'CLOCKED_IN'
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                    : 'bg-gradient-to-tr from-blue-600 to-indigo-500'
                }`}
              >
                {lastPunchResponse.employee.first_name?.charAt(0)}
                {lastPunchResponse.employee.last_name?.charAt(0)}
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-gray-300">
                    {lastPunchResponse.employee.employee_code}
                  </span>
                  <span
                    className={`px-2 py-0.2 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      lastPunchResponse.action === 'CLOCKED_IN'
                        ? 'bg-emerald-400 text-gray-950'
                        : 'bg-blue-400 text-gray-950'
                    }`}
                  >
                    {lastPunchResponse.action === 'CLOCKED_IN' ? '✓ CLOCKED IN' : '✓ CLOCKED OUT'}
                  </span>
                </div>

                <h3 className="text-lg font-black text-white mt-0.5">
                  {lastPunchResponse.employee.first_name} {lastPunchResponse.employee.last_name}
                </h3>
                <p className="text-xs opacity-90">{lastPunchResponse.message}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 sm:border-l sm:border-white/20 sm:pl-5">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                  {lastPunchResponse.action === 'CLOCKED_IN' ? 'Arrival Time' : 'Total Duration'}
                </span>
                <div className="text-lg font-mono font-black text-white">
                  {lastPunchResponse.action === 'CLOCKED_IN'
                    ? formatTimeStr(lastPunchResponse.attendance.clock_in)
                    : lastPunchResponse.attendance.formatted_duration || `${lastPunchResponse.attendance.total_minutes}m`}
                </div>
              </div>
              <button
                onClick={() => setLastPunchResponse(null)}
                className="p-1.5 hover:bg-white/10 rounded-xl text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        {/* On Duty Now */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-2">
            <span>On Duty Active</span>
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">{metrics.on_duty_count}</div>
          <div className="text-[11px] text-gray-400 mt-1">Currently on workstation</div>
        </div>

        {/* Present Today */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-2">
            <span>Present Today</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">{metrics.present_count}</div>
          <div className="text-[11px] text-gray-400 mt-1">Clocked in staff count</div>
        </div>

        {/* Completed Shifts */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-2">
            <span>Completed Shifts</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600">{metrics.completed_count}</div>
          <div className="text-[11px] text-gray-400 mt-1">Clocked out today</div>
        </div>

        {/* Late Arrivals */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-2">
            <span>Late Arrivals</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{metrics.late_count}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">After 08:30 AM threshold</div>
        </div>

        {/* Attendance Rate */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-2">
            <span>Attendance Rate</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-600">{metrics.attendance_rate}%</div>
          <div className="text-[11px] text-gray-400 mt-1">Of {metrics.total_staff} total staff</div>
        </div>
      </div>

      {/* 4. Roster Table & Search Controls */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <h3 className="font-bold text-base text-gray-900">Attendance Roster</h3>
            <span className="text-xs bg-gray-100 text-gray-700 font-bold px-2.5 py-0.5 rounded-full">
              {filteredRecords.length} records
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Selector */}
            <div className="flex items-center space-x-1.5 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              <span>Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-2 py-0.5 font-mono text-gray-800 focus:outline-hidden"
              />
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:border-emerald-500 focus:bg-white"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-lg transition ${
                  statusFilter === 'ALL' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('ON_DUTY')}
                className={`px-3 py-1 rounded-lg transition ${
                  statusFilter === 'ON_DUTY' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                On Duty ({metrics.on_duty_count})
              </button>
              <button
                onClick={() => setStatusFilter('LATE')}
                className={`px-3 py-1 rounded-lg transition ${
                  statusFilter === 'LATE' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Late ({metrics.late_count})
              </button>
              <button
                onClick={() => setStatusFilter('COMPLETED')}
                className={`px-3 py-1 rounded-lg transition ${
                  statusFilter === 'COMPLETED' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Completed ({metrics.completed_count})
              </button>
            </div>
          </div>
        </div>

        {/* Table Body */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-7 h-7 text-emerald-600 animate-spin" />
            <span className="text-xs text-gray-500 font-semibold">Loading attendance logs...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Clock className="w-10 h-10 text-gray-300 mx-auto" />
            <h4 className="font-bold text-sm text-gray-700">No attendance records for {selectedDate}</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Scan employee barcode badges or click "Manual Punch" to register employee check-in.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Clock In</th>
                  <th className="py-3.5 px-4">Clock Out</th>
                  <th className="py-3.5 px-4">Shift Duration</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.map((rec) => {
                  const emp = rec.employee;
                  const roleName = emp?.user?.roles?.[0]?.name || 'POS Cashier';
                  const initials = `${emp?.first_name?.charAt(0) || ''}${emp?.last_name?.charAt(0) || ''}`.toUpperCase();
                  const isOnDuty = !rec.clock_out;

                  return (
                    <tr key={rec.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block">
                              {emp?.first_name} {emp?.last_name}
                            </span>
                            <span className="text-[10px] text-gray-400">{emp?.phone || 'No phone'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-gray-700">
                        {emp?.employee_code}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-gray-100 text-gray-700 border border-gray-200">
                          {roleName}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-gray-800">
                        {formatTimeStr(rec.clock_in)}
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold">
                        {rec.clock_out ? (
                          <span className="text-gray-800">
                            {formatTimeStr(rec.clock_out)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-emerald-600 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Active Now</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        {rec.formatted_duration || `${rec.total_minutes}m`}
                      </td>

                      <td className="py-3 px-4 text-gray-500">
                        <span className="inline-flex items-center space-x-1 font-semibold">
                          {rec.scan_method === 'CAMERA' ? (
                            <>
                              <Camera className="w-3.5 h-3.5 text-blue-500" />
                              <span>Camera</span>
                            </>
                          ) : rec.scan_method === 'MANUAL' ? (
                            <>
                              <Plus className="w-3.5 h-3.5 text-gray-400" />
                              <span>Manual</span>
                            </>
                          ) : (
                            <>
                              <Barcode className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Scanner</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {isOnDuty ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ON DUTY
                          </span>
                        ) : rec.status === 'LATE' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                            LATE
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">
                            COMPLETED
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Camera Scanner Modal */}
      {isCameraScannerOpen && (
        <BarcodeScannerModal
          isOpen={isCameraScannerOpen}
          onClose={() => setIsCameraScannerOpen(false)}
          onDetectedBarcode={handleCameraBarcodeDetected}
          onAddProductToCart={() => {}}
        />
      )}

      {/* 6. Staff Badges Print Modal */}
      {isBadgeModalOpen && (
        <StaffBadgePrintModal
          isOpen={isBadgeModalOpen}
          onClose={() => setIsBadgeModalOpen(false)}
          employees={employees}
        />
      )}

      {/* 7. Manual Punch Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-gray-200 shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center space-x-2.5">
                <Clock className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-gray-900">Manual Attendance Entry</h3>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Select Staff Member</label>
                <select
                  value={manualEmpId}
                  onChange={(e) => setManualEmpId(Number(e.target.value))}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-semibold"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.employee_code} - {e.first_name} {e.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Clock In (24h)</label>
                  <input
                    type="time"
                    value={manualClockIn}
                    onChange={(e) => setManualClockIn(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Clock Out (Optional)</label>
                  <input
                    type="time"
                    value={manualClockOut}
                    onChange={(e) => setManualClockOut(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Status</label>
                <select
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-semibold"
                >
                  <option value="PRESENT">PRESENT (On Time)</option>
                  <option value="LATE">LATE Arrival</option>
                  <option value="COMPLETED">COMPLETED Shift</option>
                  <option value="OVERTIME">OVERTIME</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Supervisor Note</label>
                <input
                  type="text"
                  placeholder="e.g. Forgot badge / Shift swap"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingManual}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center space-x-1.5"
                >
                  {isSavingManual && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Record Attendance</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
