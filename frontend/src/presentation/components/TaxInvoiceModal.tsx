import React, { useRef, useState, useEffect } from 'react';
import { SmartPosLogo } from './SmartPosLogo';
import { Printer, X, Palette, Sparkles, Stamp, SlidersHorizontal, Check, RefreshCw } from 'lucide-react';
import {
  InvoiceCustomizationState,
  loadInvoiceCustomization,
  saveInvoiceCustomization,
  BACKGROUND_TONE_PRESETS,
  WATERMARK_PRESETS,
  THEME_COLOR_PRESETS,
} from '../../features/invoices/invoiceCustomization';
import { InvoiceBackgroundCustomizerModal } from '../../features/invoices/InvoiceBackgroundCustomizerModal';
import { OfficialTaxStamp } from './OfficialTaxStamp';
import QRCode from 'qrcode';

interface TaxInvoiceModalProps {
  invoice: any;
  onClose: () => void;
  exchangeRate?: number;
}

export const TaxInvoiceModal: React.FC<TaxInvoiceModalProps> = ({
  invoice,
  onClose,
  exchangeRate = 4100,
}) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<InvoiceCustomizationState>(() => loadInvoiceCustomization());
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [showQuickBar, setShowQuickBar] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Generate QR code for invoice
  useEffect(() => {
    const payload = `KHQR-INV:${invoice.invoice_number}|AMT:${Number(invoice.total_amount || 0).toFixed(2)}USD|DATE:${invoice.invoice_date || ''}`;
    QRCode.toDataURL(payload, {
      margin: 1,
      width: 200,
      color: { dark: '#111827', light: '#ffffff' },
    }).then(setQrDataUrl).catch(() => {});
  }, [invoice.invoice_number, invoice.total_amount, invoice.invoice_date]);

  const handlePrint = () => {
    window.print();
  };

  const handleUpdateSettings = (updated: InvoiceCustomizationState) => {
    setSettings(updated);
    saveInvoiceCustomization(updated);
  };

  const totalUsd = Number(invoice.total_amount || 0);
  const totalKhr = Math.round(totalUsd * exchangeRate);
  const subtotalUsd = Number(invoice.subtotal || 0);
  const taxUsd = Number(invoice.tax_amount || 0);
  const discountUsd = Number(invoice.discount_amount || 0);
  const paidUsd = Number(invoice.paid_amount || 0);
  const balanceUsd = Number(invoice.balance_amount || 0);

  const items = invoice.items || invoice.invoice_items || [];
  const customer = invoice.customer;
  const branch = invoice.branch;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      {/* Container Dialog */}
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-gray-100 flex flex-col my-8 max-h-[92vh]">
        {/* Modal Controls Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/70 rounded-t-3xl print:hidden shrink-0">
          <div className="flex items-center space-x-2">
            <span
              className="w-3 h-3 rounded-full shadow-2xs"
              style={{ backgroundColor: settings.primaryColor }}
            />
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Cambodia GDT Tax Invoice (វិក្កយបត្រពន្ធ)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick Styling Toggle */}
            <button
              onClick={() => setShowQuickBar((prev) => !prev)}
              className={`px-3 py-2 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition border ${
                showQuickBar
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
              title="Toggle Quick Customizer Bar"
            >
              <Palette className="w-3.5 h-3.5 text-emerald-600" />
              <span>Customize Look</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition"
              style={{ backgroundColor: settings.primaryColor }}
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Invoice</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Customization Bar (Slide-down toggle) */}
        {showQuickBar && (
          <div className="bg-slate-900 text-white px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs print:hidden animate-in slide-in-from-top-2 duration-200">
            {/* Background Color presets */}
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-semibold text-[11px]">Paper Background:</span>
              <div className="flex items-center space-x-1.5">
                {BACKGROUND_TONE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleUpdateSettings({ ...settings, backgroundColor: p.bg, backgroundTone: p.id as any })}
                    className={`w-6 h-6 rounded-lg border transition transform hover:scale-110 flex items-center justify-center ${
                      settings.backgroundColor === p.bg ? 'ring-2 ring-emerald-400 scale-105' : 'border-slate-600'
                    }`}
                    style={{ backgroundColor: p.bg }}
                    title={`Background: ${p.label}`}
                  >
                    {settings.backgroundColor === p.bg && <Check className="w-3 h-3 text-emerald-700" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Watermark Quick Picker */}
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-semibold text-[11px]">Watermark:</span>
              <select
                value={settings.showWatermark ? settings.watermarkText : 'NONE'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'NONE') {
                    handleUpdateSettings({ ...settings, showWatermark: false });
                  } else {
                    handleUpdateSettings({ ...settings, showWatermark: true, watermarkText: val });
                  }
                }}
                className="bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-lg border border-slate-700 font-medium focus:outline-hidden"
              >
                <option value="NONE">None</option>
                {WATERMARK_PRESETS.filter((p) => p.id !== 'NONE').map((p) => (
                  <option key={p.id} value={p.text}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Official Stamp Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-semibold text-[11px]">Red Seal / Stamp:</span>
              <button
                onClick={() => handleUpdateSettings({ ...settings, showOfficialStamp: !settings.showOfficialStamp })}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  settings.showOfficialStamp
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {settings.showOfficialStamp ? '✓ Active' : 'Off'}
              </button>
            </div>

            {/* Full Customizer Modal Trigger */}
            <button
              onClick={() => setIsCustomizerOpen(true)}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center space-x-1 transition ml-auto"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Full Customizer...</span>
            </button>
          </div>
        )}

        {/* Printable Official Invoice Body */}
        <div
          ref={invoiceRef}
          className="p-8 overflow-y-auto space-y-6 text-gray-900 print:p-0 print:m-0 print:overflow-visible print:max-w-none text-xs relative select-text transition-colors duration-200"
          style={{
            backgroundColor: settings.backgroundColor,
            fontFamily: settings.fontFamily,
          }}
        >
          {/* Print CSS color retention */}
          <style>{`
            @media print {
              body, #printable-invoice-paper {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                background-color: ${settings.backgroundColor} !important;
              }
            }
          `}</style>

          {/* Dynamic Watermark Overlay */}
          {settings.showWatermark && settings.watermarkText && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 overflow-hidden">
              <div
                className="font-black text-6xl md:text-8xl tracking-widest text-center whitespace-nowrap"
                style={{
                  transform: `rotate(${settings.watermarkRotation || -30}deg)`,
                  color: settings.watermarkColor || '#64748b',
                  opacity: settings.watermarkOpacity || 0.08,
                }}
              >
                {settings.watermarkText}
              </div>
            </div>
          )}

          {/* Kingdom of Cambodia Header */}
          {settings.showNationalHeader && (
            <div className="text-center space-y-1 pb-4 border-b border-gray-200 relative z-20">
              <h2 className="text-sm font-bold text-gray-800">ព្រះរាជាណាចក្រកម្ពុជា</h2>
              <h3 className="text-xs font-semibold text-gray-700">ជាតិ សាសនា ព្រះមហាក្សត្រ</h3>
              <div
                className="w-16 h-0.5 mx-auto mt-1"
                style={{ backgroundColor: settings.primaryColor }}
              />
            </div>
          )}

          {/* Business & Invoice Info Lockup */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 relative z-20">
            {/* Seller Company Info */}
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <SmartPosLogo variant="full" size="sm" showSubtitle={false} />
              </div>
              <h4 className="font-black text-sm text-gray-900">
                ក្រុមហ៊ុន ស្មាតភីអូអេស សឹលូសិន ខូអិលធីឌី
              </h4>
              <p className="text-xs font-bold text-gray-700">
                SmartPOS Solutions (Cambodia) Co., Ltd.
              </p>
              <div className="text-[11px] text-gray-600 space-y-0.5 pt-1">
                <p>
                  <span className="font-bold text-gray-800">លេខអត្តសញ្ញាណកម្ម អតប (VATTIN):</span>{' '}
                  <span className="font-mono font-bold" style={{ color: settings.primaryColor }}>
                    K001-902100888
                  </span>
                </p>
                <p>
                  <span className="font-bold text-gray-800">អាសយដ្ឋាន:</span>{' '}
                  {branch?.address || 'អគារ ៨៨ មហាវិថីព្រះមុនីវង្ស សង្កាត់បឹងរាំង ខណ្ឌដូនពេញ រាជធានីភ្នំពេញ'}
                </p>
                <p>
                  <span className="font-bold text-gray-800">ទូរស័ព្ទ:</span> +855 (0) 23 999 888 / +855 (0) 12 345 678
                </p>
              </div>
            </div>

            {/* Official Invoice Metadata Box */}
            <div
              className="p-4 rounded-2xl border space-y-2 text-right md:text-right"
              style={{
                backgroundColor: settings.headerBg,
                borderColor: `${settings.primaryColor}40`,
              }}
            >
              <div className="text-center md:text-right">
                <span
                  className="text-base font-black block tracking-tight uppercase"
                  style={{ color: settings.primaryColor }}
                >
                  វិក្កយបត្រពន្ធ / TAX INVOICE
                </span>
                <span className="text-xs font-mono font-black text-gray-800 block">
                  {invoice.invoice_number}
                </span>
              </div>

              <div className="text-[11px] text-gray-600 space-y-1 pt-2 border-t border-gray-200/80">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-500">កាលបរិច្ឆេទ / Date:</span>
                  <span className="font-mono font-bold text-gray-900">
                    {new Date(invoice.invoice_date || Date.now()).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-500">ថ្ងៃផុតកំណត់ / Due Date:</span>
                  <span className="font-mono font-bold text-gray-900">
                    {invoice.due_date
                      ? new Date(invoice.due_date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Immediate Cash'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-500">សាខា / Station:</span>
                  <span className="font-bold text-gray-900">{branch?.code || 'HQ-01'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer / Buyer Information Block */}
          <div className="p-4 bg-white/80 rounded-2xl border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs relative z-20 shadow-2xs">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                អតិថិជន / Buyer Info
              </span>
              <span className="font-black text-sm text-gray-900 block mt-0.5">
                {customer?.name || 'អតិថិជនទូទៅ / Walk-in Customer'}
              </span>
              {customer?.phone && (
                <span className="text-gray-600 block mt-0.5">
                  <span className="font-semibold">Tel:</span> {customer.phone}
                </span>
              )}
              {customer?.address && (
                <span className="text-gray-600 block mt-0.5">
                  <span className="font-semibold">Addr:</span> {customer.address}
                </span>
              )}
            </div>

            <div className="md:text-right text-[11px] space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                ស្ថានភាពវិក្កយបត្រ / Status
              </span>
              <div className="inline-block mt-0.5">
                {balanceUsd <= 0 ? (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs">
                    ✓ បានទូទាត់រួច / FULLY PAID
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg text-xs">
                    ⏳ នៅជំពាក់ / PAYMENT DUE
                  </span>
                )}
              </div>
              {settings.showDualCurrency && (
                <p className="text-gray-500 text-[10px] mt-1">
                  អត្រាប្តូរប្រាក់ផ្លូវការ: <span className="font-mono font-bold">1 USD = {exchangeRate.toLocaleString()} KHR</span>
                </p>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 relative z-20 shadow-2xs bg-white/90">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className="text-[11px] font-bold text-white uppercase"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  <th className="py-2.5 px-3 w-10 text-center">ល.រ<br/><span className="text-[9px] font-normal opacity-90">No</span></th>
                  <th className="py-2.5 px-3">បរិយាយទំនិញ ឬសេវា<br/><span className="text-[9px] font-normal opacity-90">Item Description</span></th>
                  <th className="py-2.5 px-3 text-center w-16">បរិមាណ<br/><span className="text-[9px] font-normal opacity-90">Qty</span></th>
                  <th className="py-2.5 px-3 text-right w-24">ថ្លៃឯកតា ($)<br/><span className="text-[9px] font-normal opacity-90">Unit Price</span></th>
                  <th className="py-2.5 px-3 text-right w-20">អតប (10%)<br/><span className="text-[9px] font-normal opacity-90">VAT</span></th>
                  <th className="py-2.5 px-3 text-right w-28">ថ្លៃទំនិញ ($)<br/><span className="text-[9px] font-normal opacity-90">Amount</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-400">
                      No line items recorded for this invoice.
                    </td>
                  </tr>
                ) : (
                  items.map((it: any, idx: number) => {
                    const name = it.product?.name || it.description || `Item #${idx + 1}`;
                    const qty = Number(it.quantity || 1);
                    const price = Number(it.unit_price || 0);
                    const tax = Number(it.tax_amount || qty * price * 0.1);
                    const total = Number(it.total_amount || qty * price + tax);

                    return (
                      <tr key={idx} className="hover:bg-black/5 transition">
                        <td className="py-2.5 px-3 text-center font-mono text-gray-500">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-gray-900 block">{name}</span>
                          {it.product?.sku && (
                            <span className="font-mono text-[10px] text-gray-400">{it.product.sku}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-semibold">{qty}</td>
                        <td className="py-2.5 px-3 text-right font-mono">${price.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-600">${tax.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                          ${total.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Totals Calculation Box (Dual Currency) */}
          <div className="flex flex-col md:flex-row justify-between gap-6 pt-4 border-t border-gray-300 relative z-20">
            {/* Payment & GDT Verification Stamp */}
            <div className="flex-1 space-y-3">
              <div className="p-3 bg-white/70 rounded-xl border border-gray-200 text-[11px] space-y-1">
                <span className="font-bold text-gray-800 block">សម្គាល់ / Payment Terms:</span>
                <p className="text-gray-600">
                  ទំនិញទិញរួចមិនអាចប្តូរប្រាក់វិញបានទេ។ សូមរក្សាទុកវិក្កយបត្រនេះសម្រាប់កិច្ចការគណនេយ្យ និងពន្ធដារ។
                </p>
                <p className="text-gray-500 text-[10px]">
                  Goods sold are verified under General Department of Taxation Cambodia retail fiscal compliance.
                </p>
              </div>

              {/* QR verification */}
              {settings.showPaymentQr && (
                <div className="flex items-center space-x-3 pt-1">
                  <div className="w-16 h-16 p-1 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-2xs">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="GDT E-Verification" className="w-14 h-14" />
                    ) : (
                      <span className="text-[9px] font-mono text-gray-400">KHQR</span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    <span className="font-bold text-gray-700 block">GDT E-Verification & KHQR</span>
                    <span>ស្កេនដើម្បីផ្ទៀងផ្ទាត់សុពលភាពវិក្កយបត្រ</span>
                    <span className="block font-mono text-gray-400">{invoice.invoice_number}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="w-full md:w-80 space-y-2">
              <div className="flex justify-between text-xs text-gray-600">
                <span>សរុបរង / Subtotal:</span>
                <span className="font-mono font-bold text-gray-900">${subtotalUsd.toFixed(2)}</span>
              </div>

              {discountUsd > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                  <span>បញ្ចុះតម្លៃ / Discount:</span>
                  <span className="font-mono">-${discountUsd.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-gray-600">
                <span>អាករលើតម្លៃបន្ថែម (10%) / VAT:</span>
                <span className="font-mono font-bold text-gray-900">${taxUsd.toFixed(2)}</span>
              </div>

              <div
                className="pt-2 border-t-2 space-y-1"
                style={{ borderColor: settings.primaryColor }}
              >
                <div className="flex justify-between text-sm font-black text-gray-900">
                  <span>សរុបរួម ($) / Grand Total:</span>
                  <span className="font-mono text-base font-black" style={{ color: settings.primaryColor }}>
                    ${totalUsd.toFixed(2)} USD
                  </span>
                </div>
                {settings.showDualCurrency && (
                  <div className="flex justify-between text-xs font-bold text-gray-600">
                    <span>សរុបរួមជាប្រាក់រៀល (៛):</span>
                    <span className="font-mono text-gray-800">៛{totalKhr.toLocaleString()} KHR</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-gray-200 space-y-1 text-[11px]">
                <div className="flex justify-between text-gray-600">
                  <span>បានបង់ / Paid:</span>
                  <span className="font-mono font-bold">${paidUsd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900">
                  <span>នៅសល់ / Balance Due:</span>
                  <span className="font-mono text-rose-600">${balanceUsd.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Signatures & Official Rubber Stamp Block */}
          {settings.showSignatures && (
            <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs relative z-20">
              <div className="space-y-14">
                <div>
                  <span className="font-bold text-gray-800 block">ហត្ថលេខា និងឈ្មោះអ្នកទិញ</span>
                  <span className="text-[10px] text-gray-400">Buyer's Signature & Name</span>
                </div>
                <div className="w-40 border-b border-gray-300 mx-auto" />
              </div>

              <div className="space-y-14 relative">
                <div>
                  <span className="font-bold text-gray-800 block">ហត្ថលេខា និងឈ្មោះអ្នកលក់</span>
                  <span className="text-[10px] text-gray-400">Seller's Authorized Signature</span>
                </div>
                <div className="w-40 border-b border-gray-300 mx-auto" />

                {/* Render Authentic Official Rubber Stamp if enabled */}
                {settings.showOfficialStamp && (
                  <div className="absolute right-0 sm:right-6 -bottom-5 pointer-events-none">
                    <OfficialTaxStamp
                      type={settings.stampType}
                      color={settings.stampColor}
                      size="md"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/70 rounded-b-3xl print:hidden shrink-0">
          <div className="flex items-center space-x-2 text-[11px] text-gray-500">
            <span className="font-mono">SmartPOS GDT Fiscal Engine v2.4</span>
            <span>•</span>
            <span className="font-medium">
              Background: <strong className="text-gray-700 capitalize">{settings.backgroundTone}</strong>
            </span>
            {settings.showWatermark && (
              <>
                <span>•</span>
                <span className="text-emerald-700 font-medium">Watermark Active</span>
              </>
            )}
            {settings.showOfficialStamp && (
              <>
                <span>•</span>
                <span className="text-rose-600 font-medium">Official Seal Active</span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition"
          >
            Close Window
          </button>
        </div>
      </div>

      {/* Full Background & Visual Customizer Modal */}
      <InvoiceBackgroundCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        settings={settings}
        onChange={handleUpdateSettings}
      />
    </div>
  );
};
