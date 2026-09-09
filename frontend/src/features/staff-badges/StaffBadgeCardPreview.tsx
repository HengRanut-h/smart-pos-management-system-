import React, { useState, useEffect, useMemo } from 'react';
import { StaffBadgeTemplate, StaffBadgeCard, BadgeFrontDesign, BadgeBackDesign } from './types';
import { Employee } from '../../foundation/types';
import QRCode from 'qrcode';
import { SmartPosLogo } from '../../presentation/components/SmartPosLogo';
import { 
  CreditCard, 
  Wifi, 
  ShieldCheck, 
  Building2, 
  Phone, 
  Mail, 
  Calendar, 
  QrCode as QrIcon,
  Sparkles,
  Lock,
  UserCheck
} from 'lucide-react';

interface StaffBadgeCardPreviewProps {
  template: StaffBadgeTemplate;
  employee?: any;
  badge?: StaffBadgeCard | null;
  side?: 'FRONT' | 'BACK';
  scale?: number;
  showLanyardHole?: boolean;
  className?: string;
  isPrintMode?: boolean;
}

export const StaffBadgeCardPreview: React.FC<StaffBadgeCardPreviewProps> = ({
  template,
  employee,
  badge,
  side = 'FRONT',
  scale = 1,
  showLanyardHole = true,
  className = '',
  isPrintMode = false,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Fallback mock employee if not provided (e.g. in designer preview)
  const emp = employee || {
    id: 1,
    employee_code: 'EMP-00128',
    first_name: 'Dara',
    last_name: 'Sokha',
    gender: 'Male',
    phone: '+855 (0) 12 888 999',
    email: 'dara.sokha@smartpos.com.kh',
    hire_date: '2024-01-15',
    department: { name: 'Store Operations' },
    position: { name: 'Senior Cashier & Supervisor' },
    branch: { name: 'Phnom Penh Flagship', code: 'PP-01' },
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  };

  const front: BadgeFrontDesign = template.front_design || {
    theme_color: '#1e3a8a',
    accent_color: '#f59e0b',
    background_gradient: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
    header_text: 'SMARTPOS ENTERPRISE',
    header_text_kh: 'សហគ្រាស ស្មាតភីអូអេស',
    photo_shape: 'circle',
    photo_border_color: '#f59e0b',
    photo_border_width: 3,
    show_logo: true,
    show_qr_code: true,
    qr_size_px: 85,
    show_barcode: false,
    show_nfc_badge: true,
    font_family: 'Battambang, sans-serif',
    security_watermark: 'OFFICIAL IDENTITY • SECURITY VERIFIED',
    show_security_watermark: true,
  };

  const back: BadgeBackDesign = template.back_design || {
    background_color: '#ffffff',
    text_color: '#1e293b',
    instructions: "This card is the property of SmartPOS Solutions Co., Ltd.\nIf found, please return to any SmartPOS branch or call +855 23 999 888.\nUnauthorized use or duplication is strictly prohibited.",
    instructions_kh: "ប័ណ្ណសម្គាល់ខ្លួននេះជាកម្មសិទ្ធិរបស់ក្រុមហ៊ុន ស្មាតភីអូអេស។ បើបានរើសបាន សូមប្រគល់ជូនសាខាជិតបំផុត ឬទាក់ទងទូរស័ព្ទ +855 23 999 888។",
    show_emergency_contact: true,
    emergency_phone: '+855 12 999 111',
    show_barcode: true,
    barcode_type: 'CODE_128',
    show_signature_strip: true,
  };

  const isVertical = template.orientation === 'VERTICAL';
  const qrToken = badge?.qr_token || `STF-TK-DEMO-${emp.employee_code || 'EMP001'}`;
  const barcodeValue = badge?.barcode_value || emp.employee_code || 'EMP-00128';
  const cardNumber = badge?.card_number || 'CRD-889021';
  const badgeNumber = badge?.badge_number || 'BDG-2026-0042';

  // Generate QR Code data URL
  useEffect(() => {
    QRCode.toDataURL(qrToken, {
      margin: 1,
      width: front.qr_size_px * 2,
      color: { dark: '#09090b', light: '#ffffff' },
    }).then(setQrDataUrl).catch(() => {});
  }, [qrToken, front.qr_size_px]);

  // Dimensions in pixels (standard CR80 PVC card aspect ratio 85.6mm x 53.98mm)
  const cardDims = useMemo(() => {
    if (template.card_size === 'LANYARD_CARD') {
      return isVertical
        ? { width: 330, height: 480 }
        : { width: 480, height: 330 };
    }
    // Default CR80 PVC Card Standard
    return isVertical
      ? { width: 310, height: 490 } // Vertical 54mm x 85.6mm
      : { width: 490, height: 310 }; // Horizontal 85.6mm x 54mm
  }, [template.card_size, isVertical]);

  // Code 128 Barcode simulation
  const renderBarcodeSvg = (code: string) => {
    const cleanCode = code || 'EMP-001';
    const bars: boolean[] = [true, false, true, true, false];
    for (let i = 0; i < cleanCode.length; i++) {
      const c = cleanCode.charCodeAt(i);
      bars.push(true, c % 2 === 0, c % 3 === 0, false, c % 5 === 0, true, c % 4 === 0, false);
    }
    bars.push(true, false, true, false, true, true);

    return (
      <svg className="w-full h-8" viewBox={`0 0 ${bars.length * 3} 24`} preserveAspectRatio="none">
        {bars.map((isDark, idx) =>
          isDark ? <rect key={idx} x={idx * 3} y="0" width="2.2" height="24" fill="#09090b" /> : null
        )}
      </svg>
    );
  };

  // Photo shape styling
  const getPhotoRadius = () => {
    if (front.photo_shape === 'circle') return 'rounded-full';
    if (front.photo_shape === 'square') return 'rounded-none';
    return 'rounded-2xl';
  };

  return (
    <div
      className={`relative inline-block select-none transition-transform duration-200 ${className}`}
      style={{
        transform: isPrintMode ? 'none' : `scale(${scale})`,
        transformOrigin: 'top center',
      }}
    >
      <div
        className="rounded-[22px] overflow-hidden shadow-2xl relative border border-slate-700/30 flex flex-col justify-between text-slate-800"
        style={{
          width: `${cardDims.width}px`,
          height: `${cardDims.height}px`,
          fontFamily: front.font_family || 'Battambang, sans-serif',
          background: side === 'FRONT'
            ? (front.background_gradient || front.theme_color || '#1e3a8a')
            : (back.background_color || '#ffffff'),
        }}
      >
        {/* ========================================================= */}
        {/* LANYARD CLIP PUNCH HOLE (Optional slot at top)           */}
        {/* ========================================================= */}
        {showLanyardHole && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-2 bg-slate-900/60 rounded-full border border-white/20 z-30 pointer-events-none shadow-inner" />
        )}

        {/* ========================================================= */}
        {/* FRONT SIDE RENDERING                                      */}
        {/* ========================================================= */}
        {side === 'FRONT' && (
          <>
            {/* Holographic Security Overlay Pattern */}
            <div
              className="absolute inset-0 pointer-events-none opacity-10 bg-repeat z-10"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 1px, transparent 1px)`,
                backgroundSize: '12px 12px',
              }}
            />

            {/* Subtle Security Guilloche Watermark */}
            {front.show_security_watermark && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 overflow-hidden opacity-10">
                <div className="font-mono text-xs uppercase tracking-widest text-white rotate-45 whitespace-nowrap">
                  {front.security_watermark || 'SMARTPOS VERIFIED SECURE BADGE'}
                </div>
              </div>
            )}

            {/* Top Header Strip */}
            <div className="pt-5 px-4 pb-2 z-20 flex items-center justify-between">
              {front.show_logo ? (
                <div className="bg-white/90 px-2 py-1 rounded-xl shadow-xs">
                  <SmartPosLogo variant="icon" size="sm" />
                </div>
              ) : <div />}

              <div className="text-right">
                <p className="text-[10px] font-bold text-white/90 uppercase tracking-widest leading-none">
                  {front.header_text_kh || 'សហគ្រាស ស្មាតភីអូអេស'}
                </p>
                <p className="text-[8px] font-semibold text-white/70 tracking-wider mt-0.5 uppercase">
                  {front.header_text || 'SMARTPOS ENTERPRISE'}
                </p>
              </div>
            </div>

            {/* Vertical vs Horizontal Layout */}
            {isVertical ? (
              /* VERTICAL CARD BODY */
              <div className="px-4 py-2 flex-1 flex flex-col items-center text-center z-20 justify-between">
                {/* Staff Photo */}
                <div className="relative my-1">
                  <img
                    src={emp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                    alt={emp.first_name}
                    className={`w-24 h-24 object-cover shadow-lg ${getPhotoRadius()}`}
                    style={{
                      borderColor: front.photo_border_color || '#f59e0b',
                      borderWidth: `${front.photo_border_width || 3}px`,
                    }}
                  />
                  {/* Badge Type Tag */}
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-amber-400 text-slate-900 font-black text-[9px] rounded-full uppercase tracking-wider shadow-md whitespace-nowrap">
                    {template.badge_type}
                  </span>
                </div>

                {/* Staff Name & Titles */}
                <div className="mt-2 space-y-0.5">
                  <h3 className="text-base font-black text-white tracking-tight leading-tight">
                    {emp.first_name} {emp.last_name}
                  </h3>
                  <p className="text-[11px] font-bold text-amber-300">
                    {emp.position?.name || 'Staff Specialist'}
                  </p>
                  <p className="text-[10px] text-white/80 font-mono">
                    {emp.employee_code} • {emp.branch?.code || 'HQ'}
                  </p>
                </div>

                {/* Scannable Elements (QR & Barcode) */}
                <div className="my-2 p-2 bg-white rounded-2xl shadow-xl flex flex-col items-center">
                  {front.show_qr_code && (
                    <div className="flex flex-col items-center">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="QR Token"
                          style={{ width: `${front.qr_size_px}px`, height: `${front.qr_size_px}px` }}
                        />
                      ) : (
                        <div
                          className="bg-slate-100 flex items-center justify-center"
                          style={{ width: `${front.qr_size_px}px`, height: `${front.qr_size_px}px` }}
                        >
                          <QrIcon className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                      <span className="text-[8px] font-mono font-bold text-slate-700 tracking-wider">
                        {cardNumber}
                      </span>
                    </div>
                  )}

                  {front.show_barcode && (
                    <div className="w-48 pt-1">
                      {renderBarcodeSvg(barcodeValue)}
                      <p className="text-[8px] font-mono text-slate-500 text-center">{barcodeValue}</p>
                    </div>
                  )}
                </div>

                {/* Footer Strip with NFC Chip Indicator */}
                <div className="w-full flex items-center justify-between text-white/80 text-[9px] border-t border-white/20 pt-1.5 pb-1">
                  <span className="font-mono text-[8px]">{badgeNumber}</span>
                  {front.show_nfc_badge && (
                    <div className="flex items-center space-x-1 text-amber-300">
                      <Wifi className="w-3 h-3 rotate-90" />
                      <span className="text-[8px] font-bold">NFC CHIP</span>
                    </div>
                  )}
                  <span className="font-bold text-emerald-300">AUTHORIZED</span>
                </div>
              </div>
            ) : (
              /* HORIZONTAL CARD BODY */
              <div className="px-5 py-2 flex-1 flex items-center justify-between z-20 gap-4">
                {/* Left: Photo & Badge Type */}
                <div className="flex flex-col items-center">
                  <img
                    src={emp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                    alt={emp.first_name}
                    className={`w-24 h-24 object-cover shadow-lg ${getPhotoRadius()}`}
                    style={{
                      borderColor: front.photo_border_color || '#ffffff',
                      borderWidth: `${front.photo_border_width || 2}px`,
                    }}
                  />
                  <span className="mt-1 px-2.5 py-0.5 bg-white text-slate-900 font-black text-[9px] rounded-full uppercase tracking-wider shadow-sm">
                    {template.badge_type}
                  </span>
                </div>

                {/* Center: Details */}
                <div className="flex-1 space-y-1 text-left min-w-0">
                  <h3 className="text-base font-black text-white tracking-tight truncate">
                    {emp.first_name} {emp.last_name}
                  </h3>
                  <p className="text-[11px] font-bold text-amber-300 truncate">
                    {emp.position?.name || 'Cashier & Staff'}
                  </p>
                  <p className="text-[10px] text-white/90">
                    Dept: {emp.department?.name || 'Operations'}
                  </p>
                  <div className="flex items-center space-x-2 text-[9px] font-mono text-white/80">
                    <span>ID: <strong>{emp.employee_code}</strong></span>
                    <span>•</span>
                    <span>Loc: {emp.branch?.code || 'HQ'}</span>
                  </div>

                  {front.show_barcode && (
                    <div className="w-40 pt-1">
                      {renderBarcodeSvg(barcodeValue)}
                    </div>
                  )}
                </div>

                {/* Right: Scannable QR & NFC */}
                {front.show_qr_code && (
                  <div className="p-2 bg-white rounded-2xl shadow-xl flex flex-col items-center shrink-0">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="QR Code"
                        style={{ width: `${front.qr_size_px}px`, height: `${front.qr_size_px}px` }}
                      />
                    ) : (
                      <div
                        className="bg-slate-100 flex items-center justify-center"
                        style={{ width: `${front.qr_size_px}px`, height: `${front.qr_size_px}px` }}
                      >
                        <QrIcon className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                    <span className="text-[8px] font-mono font-bold text-slate-700 mt-0.5">
                      {cardNumber}
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ========================================================= */}
        {/* BACK SIDE RENDERING                                       */}
        {/* ========================================================= */}
        {side === 'BACK' && (
          <div className="p-5 flex-1 flex flex-col justify-between text-slate-800 text-xs z-20">
            {/* Magnetic Stripe simulation at top */}
            <div className="-mx-5 -mt-5 h-9 bg-slate-900 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950" />
            </div>

            {/* Property and instructions */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center space-x-1.5 text-slate-900 font-black text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>OFFICIAL SMARTPOS PROPERTY</span>
              </div>
              <p className="text-[10px] text-slate-700 leading-snug whitespace-pre-line">
                {back.instructions_kh || "ប័ណ្ណសម្គាល់ខ្លួននេះជាកម្មសិទ្ធិរបស់ក្រុមហ៊ុន ស្មាតភីអូអេស។ បើបានរើសបាន សូមប្រគល់ជូនសាខាជិតបំផុត។"}
              </p>
              <p className="text-[9px] text-slate-500 leading-snug whitespace-pre-line italic">
                {back.instructions || "This card is non-transferable and must be returned upon cessation of employment."}
              </p>
            </div>

            {/* Signature Strip */}
            {back.show_signature_strip && (
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                  <span>Authorized Signature</span>
                  <span>Not Valid Without Signature</span>
                </div>
                <div className="h-7 bg-slate-100 border border-slate-300 rounded-sm flex items-center justify-between px-3">
                  <span className="font-serif italic text-slate-400 text-xs">{emp.first_name} {emp.last_name}</span>
                  <span className="text-[9px] font-mono text-slate-400">SEC-STRIP</span>
                </div>
              </div>
            )}

            {/* Emergency Contacts */}
            {back.show_emergency_contact && (
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[10px] space-y-0.5">
                <span className="font-bold text-slate-900 block">Emergency & Hotlines:</span>
                <p className="text-slate-600">Company Hotline: +855 23 999 888</p>
                <p className="text-slate-600">Emergency Contact: {back.emergency_phone || '+855 12 999 111'}</p>
              </div>
            )}

            {/* Back Barcode & Identifier */}
            <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[9px] text-slate-500 font-mono">
              <span>Card ID: {cardNumber}</span>
              <span>TIN: K001-902100888</span>
              <span>Ver: 2.4</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
