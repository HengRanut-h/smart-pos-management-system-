import React, { useState } from 'react';
import { verifyStaffBadgeScan } from '../../data-access/posApi';
import { BarcodeScannerModal } from '../pos/BarcodeScannerModal';
import { useApp } from '../../application/context/AppContext';
import {
  QrCode,
  X,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Search,
  ScanLine,
  UserCheck,
  Building2,
  CreditCard,
  Wifi,
  Sparkles,
  Lock,
  Camera,
} from 'lucide-react';

interface StaffBadgeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (employee: any, scanType: string) => void;
  defaultScanType?: 'ATTENDANCE' | 'POS_AUTH' | 'VERIFICATION' | 'STORE_ACCESS';
  requiredRole?: string;
}

export const StaffBadgeScannerModal: React.FC<StaffBadgeScannerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultScanType = 'VERIFICATION',
  requiredRole,
}) => {
  const { lang, notify } = useApp();
  const [tokenInput, setTokenInput] = useState('');
  const [scanType, setScanType] = useState<string>(defaultScanType);
  const [loading, setLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleScanSubmit = async (tokenToUse?: string) => {
    const raw = tokenToUse || tokenInput.trim();
    if (!raw) {
      notify.warning(lang === 'kh' ? 'សូមបញ្ចូលកូដប័ណ្ណ ឬស្កេន QR' : 'Please input a badge token or scan QR');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await verifyStaffBadgeScan({
        token: raw,
        scan_type: scanType,
        required_role: requiredRole,
        device_name: 'SmartPOS Web Simulator Terminal',
      });

      setResult(res);

      if (res.authorized) {
        notify.success(
          lang === 'kh'
            ? `ផ្ទៀងផ្ទាត់ជោគជ័យ: ${res.employee?.first_name} ${res.employee?.last_name}`
            : `Authorization verified: ${res.employee?.first_name} ${res.employee?.last_name}`,
          'Access Granted'
        );
        if (onSuccess) {
          onSuccess(res.employee, scanType);
        }
      } else {
        notify.error(res.message || 'Access rejected');
      }
    } catch (err: any) {
      const errRes = err.response?.data;
      setResult(errRes || { authorized: false, status: 'ERROR', message: err.message });
      notify.error(errRes?.message || 'Failed to verify staff badge token');
    } finally {
      setLoading(false);
    }
  };

  // Quick Preset Simulator Buttons
  const presetTokens = [
    { label: 'Executive Manager', token: 'STF-TK-DEMO-EMP001', type: 'MANAGER', role: 'MANAGER' },
    { label: 'Store Cashier #01', token: 'EMP-00128', type: 'CASHIER', role: 'CASHIER' },
    { label: 'NFC Card (Hardware UID)', token: '04:A2:3B:5C:7D:8E', type: 'NFC', role: 'STAFF' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 flex flex-col overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ScanLine className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-sm flex items-center space-x-2">
                <span>{lang === 'kh' ? 'ឧបករណ៍ស្កេនប័ណ្ណបុគ្គលិក & កូដ QR' : 'Staff Badge & QR Scanner Engine'}</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full">
                  Live Verify
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {lang === 'kh'
                  ? 'ស្កេនកូដ QR ថូខឹន ឬបាកូដ ដើម្បីកត់ត្រាវត្តមាន ឬផ្តល់សិទ្ធិ POS'
                  : 'Scan card QR token, barcode, or NFC UID for attendance or POS approval'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl transition hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs text-gray-700">
          {/* Action Context Switcher */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              {lang === 'kh' ? 'គោលបំណងស្កេន (Scan Operation Context)' : 'Scan Operation Context'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'VERIFICATION', label: 'Identity Verification', labelKh: 'ផ្ទៀងផ្ទាត់អត្តសញ្ញាណ' },
                { id: 'ATTENDANCE', label: 'Attendance Clock-in', labelKh: 'កត់ត្រាវត្តមាន' },
                { id: 'POS_AUTH', label: 'POS Manager Override', labelKh: 'អនុម័តបេឡា (POS Override)' },
              ].map((op) => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setScanType(op.id)}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    scanType === op.id
                      ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-xs'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 font-medium'
                  }`}
                >
                  <p className="truncate">{op.label}</p>
                  <p className="text-[10px] opacity-70 truncate">{op.labelKh}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Scanner Simulation Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                {lang === 'kh' ? 'ស្កេន ឬបញ្ចូលថូខឹនប័ណ្ណ (Scanner Stream)' : 'Scan Stream / Manual Token Input'}
              </label>
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition border border-emerald-200 shadow-xs cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{lang === 'kh' ? 'ស្កេនដោយកាមេរ៉ា' : 'Scan with Camera'}</span>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleScanSubmit();
                }}
                placeholder="Paste STF-TK-..., scan barcode, or tap NFC UID..."
                className="w-full pl-10 pr-24 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-xs font-mono font-bold focus:border-emerald-600 focus:bg-white focus:outline-hidden transition"
              />
              <QrCode className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => handleScanSubmit()}
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs transition"
              >
                {loading ? 'Verifying...' : 'Verify Card'}
              </button>
            </div>
          </div>

          {/* Quick Simulation Clickers */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Quick Test Simulators:
            </span>
            <div className="flex flex-wrap gap-2">
              {presetTokens.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setTokenInput(p.token);
                    handleScanSubmit(p.token);
                  }}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 text-gray-700 rounded-lg text-[11px] font-medium transition border border-gray-200"
                >
                  ⚡ {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Result Banner */}
          {result && (
            <div
              className={`p-4 rounded-2xl border space-y-2 animate-in fade-in-50 duration-200 ${
                result.authorized
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50/80 border-rose-300 text-rose-950'
              }`}
            >
              <div className="flex items-center space-x-2">
                {result.authorized ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs uppercase tracking-wider">
                    {result.status} • {result.authorized ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                  </h4>
                  <p className="text-[11px] mt-0.5">{result.message}</p>
                </div>
              </div>

              {result.employee && (
                <div className="pt-2 border-t border-emerald-200/70 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-gray-500 block text-[10px]">Staff Member:</span>
                    <strong className="text-gray-900">{result.employee.first_name} {result.employee.last_name}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Role / Position:</span>
                    <strong className="text-gray-900">{result.employee.position?.name || 'Staff Specialist'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Employee Code:</span>
                    <span className="font-mono text-gray-700">{result.employee.employee_code}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Assigned Station:</span>
                    <span className="text-gray-700">{result.employee.branch?.name || 'Headquarters'}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <span className="font-mono">SmartPOS ID Security Standard v3.0</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Live Camera Scanner Modal with Camera Device Selector */}
      {isCameraOpen && (
        <BarcodeScannerModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onDetectedBarcode={(code) => {
            setTokenInput(code);
            handleScanSubmit(code);
            setIsCameraOpen(false);
          }}
        />
      )}
    </div>
  );
};
