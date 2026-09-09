import React, { useState, useMemo } from 'react';
import { Employee } from '../../foundation/types';
import { BarcodeView } from '../../presentation/components/barcode/BarcodeView';
import {
  Printer,
  X,
  CreditCard,
  Barcode,
  Sparkles,
  Building2,
  Check,
  QrCode,
  Shield,
  Layers,
} from 'lucide-react';

interface StaffBadgePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  initialSelectedEmployee?: Employee | null;
}

type BadgeFormat = 'standard_pvc' | 'thermal_80' | 'thermal_58';

export const StaffBadgePrintModal: React.FC<StaffBadgePrintModalProps> = ({
  isOpen,
  onClose,
  employees,
  initialSelectedEmployee,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<BadgeFormat>('standard_pvc');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | 'ALL'>(() => {
    return initialSelectedEmployee ? initialSelectedEmployee.id : 'ALL';
  });
  const [showQrCode, setShowQrCode] = useState<boolean>(true);
  const [showRole, setShowRole] = useState<boolean>(true);
  const [showBranch, setShowBranch] = useState<boolean>(true);

  const targetEmployees = useMemo(() => {
    if (selectedEmployeeId === 'ALL') {
      return employees;
    }
    const found = employees.find((e) => e.id === selectedEmployeeId);
    return found ? [found] : employees;
  }, [selectedEmployeeId, employees]);

  // Generate standards-compliant, scannable barcode
  const renderBarcodeSvg = (code: string) => {
    return <BarcodeView value={code || 'EMP-001'} height={32} width={1.8} className="w-full h-10" />;
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-gray-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-200">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg sm:text-xl text-gray-900 flex items-center space-x-2">
                <span>Staff ID Badges & Scannable Cards</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-xs text-gray-500">
                Generate high-density barcode badges for attendance clock-in & cashier workstation login
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Controls */}
        <div className="p-4 sm:p-5 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          {/* Staff Selector */}
          <div className="flex items-center space-x-2">
            <span className="font-bold text-gray-700">Staff:</span>
            <select
              value={selectedEmployeeId}
              onChange={(e) =>
                setSelectedEmployeeId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
              }
              className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 font-semibold text-gray-800 focus:outline-hidden focus:border-emerald-500"
            >
              <option value="ALL">All Active Staff ({employees.length})</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employee_code} - {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Badge Format Selector */}
          <div className="flex items-center space-x-1.5 bg-gray-200/80 p-1 rounded-xl">
            <button
              onClick={() => setSelectedFormat('standard_pvc')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                selectedFormat === 'standard_pvc'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              PVC ID Card
            </button>
            <button
              onClick={() => setSelectedFormat('thermal_80')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                selectedFormat === 'thermal_80'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              80mm Thermal
            </button>
            <button
              onClick={() => setSelectedFormat('thermal_58')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                selectedFormat === 'thermal_58'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              58mm Thermal
            </button>
          </div>

          {/* Print Action */}
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl shadow-md shadow-emerald-200 flex items-center space-x-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Badges ({targetEmployees.length})</span>
          </button>
        </div>

        {/* Badges Preview Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-100/70 print:p-0 print:bg-white">
          <div
            className={`mx-auto ${
              selectedFormat === 'standard_pvc'
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 print:grid-cols-2 print:gap-4'
                : selectedFormat === 'thermal_80'
                ? 'max-w-xs space-y-4 print:space-y-6'
                : 'max-w-[220px] space-y-4 print:space-y-6'
            }`}
          >
            {targetEmployees.map((emp) => {
              const roleName = emp.user?.roles?.[0]?.name || 'POS Cashier';
              const branchName = emp.branch?.name || 'Phnom Penh Headquarters';
              const initials = `${emp.first_name?.charAt(0) || ''}${emp.last_name?.charAt(0) || ''}`.toUpperCase();

              if (selectedFormat === 'standard_pvc') {
                return (
                  <div
                    key={emp.id}
                    className="bg-white rounded-2xl border-2 border-gray-300 shadow-md overflow-hidden flex flex-col justify-between aspect-[1/1.55] relative print:border print:shadow-none break-inside-avoid"
                  >
                    {/* Top Branding Stripe */}
                    <div className="bg-gradient-to-r from-emerald-700 to-teal-600 text-white p-3 text-center">
                      <div className="flex items-center justify-center space-x-1 font-black text-xs tracking-wider uppercase">
                        <span>SmartPOS Cambodia</span>
                      </div>
                      <p className="text-[10px] text-emerald-100 font-medium truncate">{branchName}</p>
                    </div>

                    {/* Middle: Photo / Initials Avatar */}
                    <div className="flex flex-col items-center justify-center py-3 px-4 text-center space-y-2">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-emerald-200 border-2 border-white">
                        {initials}
                      </div>

                      <div>
                        <h4 className="font-black text-base text-gray-900 leading-tight">
                          {emp.first_name} {emp.last_name}
                        </h4>
                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {roleName}
                        </span>
                      </div>
                    </div>

                    {/* Bottom: Barcode & Employee Code */}
                    <div className="bg-gray-50 border-t border-gray-200 p-3 text-center space-y-1">
                      <div className="px-2">{renderBarcodeSvg(emp.employee_code)}</div>
                      <div className="font-mono font-black text-xs tracking-widest text-gray-800">
                        {emp.employee_code}
                      </div>
                      <div className="text-[9px] text-gray-400 font-medium">Scan to Clock In / Out</div>
                    </div>
                  </div>
                );
              }

              // Thermal Formats (58mm / 80mm)
              return (
                <div
                  key={emp.id}
                  className={`bg-white border border-dashed border-gray-400 p-3 text-center rounded-xl space-y-2 break-inside-avoid ${
                    selectedFormat === 'thermal_58' ? 'max-w-[200px]' : 'max-w-[280px]'
                  }`}
                >
                  <div className="text-xs font-black uppercase text-gray-800">SmartPOS Staff Badge</div>
                  <div className="text-[10px] text-gray-500 truncate">{branchName}</div>

                  <div className="py-1">
                    <div className="font-bold text-sm text-gray-900 leading-tight">
                      {emp.first_name} {emp.last_name}
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-700">{roleName}</div>
                  </div>

                  <div className="py-1 px-1">{renderBarcodeSvg(emp.employee_code)}</div>
                  <div className="font-mono font-bold text-xs tracking-wider text-gray-900">
                    {emp.employee_code}
                  </div>
                  <div className="text-[8px] text-gray-400">Attendance & Cashier Access</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Print Stylesheet Hook */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print\\:block, .print\\:grid, .print\\:flex {
              display: revert !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            div[class*="Badges Preview Area"] {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white !important;
              padding: 0 !important;
            }
            div[class*="Badges Preview Area"] * {
              visibility: visible;
            }
          }
        `}</style>
      </div>
    </div>
  );
};
