import React, { useState, useEffect } from 'react';
import { InvoiceLayoutConfig, InvoiceStylesConfig, PaperSize } from './types';
import { SAMPLE_INVOICE_DATA } from './sampleInvoiceData';
import QRCode from 'qrcode';
import { SmartPosLogo } from '../../../presentation/components/SmartPosLogo';
import { OfficialTaxStamp } from '../../../presentation/components/OfficialTaxStamp';

interface DocumentPaperPreviewProps {
  layout: InvoiceLayoutConfig;
  styles: InvoiceStylesConfig;
  paperSize: PaperSize;
  zoom?: number;
  previewLang?: 'kh' | 'en';
  customData?: typeof SAMPLE_INVOICE_DATA;
}

export const DocumentPaperPreview: React.FC<DocumentPaperPreviewProps> = ({
  layout,
  styles,
  paperSize,
  zoom = 1,
  previewLang = 'kh',
  customData = SAMPLE_INVOICE_DATA,
}) => {
  const d = customData;
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (d?.khqr_payload) {
      QRCode.toDataURL(d.khqr_payload, {
        margin: 1,
        width: 240,
        color: { dark: '#111827', light: '#ffffff' },
      }).then(setQrDataUrl).catch(() => {});
    }
  }, [d?.khqr_payload]);
  const isThermal = paperSize === 'THERMAL_80MM' || paperSize === 'THERMAL_58MM';
  const is58mm = paperSize === 'THERMAL_58MM';
  const exchangeRate = layout.exchange_rate || 4100;

  const totalKhr = Math.round(d.total_amount * exchangeRate);
  const subtotalKhr = Math.round(d.subtotal * exchangeRate);
  const taxKhr = Math.round(d.tax_amount * exchangeRate);

  // Dynamic variable replacement helper
  const replacePlaceholders = (text?: string): string => {
    if (!text) return '';
    return text
      .replace(/{{invoice\.number}}/g, d.invoice_number)
      .replace(/{{invoice\.date}}/g, d.invoice_date)
      .replace(/{{customer\.name}}/g, d.customer.name)
      .replace(/{{company\.name}}/g, layout.company_name_en || 'SmartPOS')
      .replace(/{{branch\.name}}/g, d.branch.name)
      .replace(/{{cashier\.name}}/g, d.cashier_name)
      .replace(/{{invoice\.grand_total}}/g, `$${d.total_amount.toFixed(2)}`);
  };

  // Font size mapping
  const getFontSizeClass = () => {
    switch (styles.font_size_scale) {
      case 'xs': return 'text-[10px] leading-snug';
      case 'sm': return 'text-xs leading-normal';
      case 'base': return 'text-sm leading-relaxed';
      case 'lg': return 'text-base leading-relaxed';
      default: return 'text-xs';
    }
  };

  // Outer paper dimensions & styling
  const getPaperDimensions = () => {
    if (is58mm) return { width: '380px', minHeight: '520px' };
    if (isThermal) return { width: '480px', minHeight: '680px' };
    if (paperSize === 'A5') return { width: '600px', minHeight: '840px' };
    return { width: '794px', minHeight: '1123px' }; // Standard A4 at 96 DPI
  };

  const dims = getPaperDimensions();

  // =========================================================================
  // RENDER: THERMAL RECEIPT VIEW (80mm / 58mm)
  // =========================================================================
  if (isThermal) {
    return (
      <div 
        className="flex justify-center p-4 transition-transform duration-200"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
      >
        <div
          id="printable-invoice-paper"
          className="bg-white text-gray-900 border border-gray-300 shadow-2xl relative select-text"
          style={{
            width: dims.width,
            fontFamily: styles.font_family || 'monospace, "Courier New"',
            padding: `${styles.margin_mm * 1.8}px`,
            color: styles.primary_color || '#111827',
          }}
        >
          {/* Paper Top Roll Cut Simulation */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-b from-gray-200 to-transparent border-t border-dashed border-gray-400 opacity-60" />

          {/* Header & Logo */}
          <div className="text-center space-y-1.5 pb-3">
            {layout.show_logo && (
              <div className="flex justify-center pb-1">
                <SmartPosLogo variant="icon" size={is58mm ? 'sm' : 'md'} />
              </div>
            )}
            <h1 className="font-extrabold text-sm uppercase tracking-wider">
              {layout.company_name_kh || 'ស្មាតភីអូអេស ម៉ាត'}
            </h1>
            <p className="font-bold text-xs">
              {layout.company_name_en || 'SmartPOS Express'}
            </p>
            {layout.company_address_en && (
              <p className="text-[11px] text-gray-600 px-2 leading-tight">
                {layout.company_address_en}
              </p>
            )}
            {layout.company_phone && (
              <p className="text-[11px] text-gray-600">Tel: {layout.company_phone}</p>
            )}
            {layout.vattin && (
              <p className="text-[10px] font-mono text-gray-700">VATTIN: {layout.vattin}</p>
            )}
          </div>

          <div className="border-t border-dashed border-gray-400 my-2" />

          {/* Document Title & Meta */}
          <div className="text-center py-1">
            <h2 className="font-black text-xs uppercase tracking-widest">
              {previewLang === 'kh' ? (layout.doc_title_kh || 'បង្កាន់ដៃទូទាត់ប្រាក់') : (layout.doc_title_en || 'SALES RECEIPT')}
            </h2>
          </div>

          <div className="text-[11px] space-y-0.5 py-1 text-gray-700">
            <div className="flex justify-between">
              <span>Receipt #:</span>
              <span className="font-mono font-bold text-gray-900">{d.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{d.invoice_date}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{d.cashier_name}</span>
            </div>
            {layout.show_customer_info && (
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-medium truncate max-w-[200px]">{d.customer.name}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-gray-400 my-2" />

          {/* Items Table */}
          <div className="text-[11px] space-y-1">
            <div className="flex justify-between font-bold border-b border-gray-300 pb-1 text-gray-900">
              <span className="w-1/2">Item Description</span>
              <span className="w-1/4 text-center">Qty</span>
              <span className="w-1/4 text-right">Price</span>
            </div>
            {d.items.map((it, idx) => (
              <div key={idx} className="space-y-0.5 py-0.5 border-b border-gray-100 last:border-0">
                <div className="font-medium text-gray-900 leading-snug">{it.name}</div>
                <div className="flex justify-between text-gray-600 text-[10px]">
                  <span className="w-1/2 text-gray-500">{it.sku}</span>
                  <span className="w-1/4 text-center">{it.quantity} x ${it.unit_price.toFixed(2)}</span>
                  <span className="w-1/4 text-right font-mono font-bold text-gray-900">${it.total_amount.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-400 my-2" />

          {/* Financial Totals */}
          <div className="text-[11px] space-y-1 text-gray-800">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono">${d.subtotal.toFixed(2)}</span>
            </div>
            {d.discount_amount > 0 && (
              <div className="flex justify-between text-rose-600 font-semibold">
                <span>Discount:</span>
                <span className="font-mono">-${d.discount_amount.toFixed(2)}</span>
              </div>
            )}
            {layout.show_vat_breakdown && (
              <div className="flex justify-between text-gray-600">
                <span>VAT ({layout.vat_rate_percent || 10}%):</span>
                <span className="font-mono">${d.tax_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-sm border-t border-gray-900 pt-1 text-gray-900">
              <span>TOTAL (USD):</span>
              <span className="font-mono">${d.total_amount.toFixed(2)}</span>
            </div>
            {layout.show_dual_currency && (
              <div className="flex justify-between font-bold text-xs text-gray-700">
                <span>សរុបជាប្រាក់រៀល (KHR):</span>
                <span className="font-mono">៛{totalKhr.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-gray-400 my-2" />

          {/* Settlement info */}
          <div className="text-[10px] space-y-0.5 text-gray-600">
            <div className="flex justify-between">
              <span>Payment:</span>
              <span className="font-bold text-gray-800">{d.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span>Paid Amount:</span>
              <span className="font-mono">${d.paid_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Change:</span>
              <span className="font-mono">${d.balance_amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Bakong KHQR Simulation */}
          {layout.show_payment_qr && (
            <div className="flex flex-col items-center justify-center pt-3 pb-2 space-y-1">
              <div className="p-2 bg-white border border-gray-200 rounded-lg shadow-2xs">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Bakong KHQR" className={is58mm ? "w-[90px] h-[90px]" : "w-[110px] h-[110px]"} />
                ) : (
                  <div className={`bg-gray-100 flex items-center justify-center ${is58mm ? 'w-[90px] h-[90px]' : 'w-[110px] h-[110px]'}`}>
                    <span className="text-[10px] text-gray-400">KHQR</span>
                  </div>
                )}
              </div>
              <span className="text-[9px] font-bold tracking-wider text-gray-500 uppercase">
                Scan with Bakong or Any Banking App
              </span>
            </div>
          )}

          {/* Barcode Simulation */}
          {layout.show_barcode && (
            <div className="text-center pt-2 pb-1">
              <div className="font-mono tracking-widest font-black text-base scale-y-125 select-none opacity-80">
                ||| | |||| | || ||| || ||| | |||
              </div>
              <span className="font-mono text-[9px] text-gray-500">{d.invoice_number}</span>
            </div>
          )}

          {/* Notes & Return Policy */}
          {layout.notes && (
            <div className="text-center pt-2 border-t border-dashed border-gray-300 mt-2">
              <p className="text-[10px] text-gray-600 leading-snug italic">
                {replacePlaceholders(layout.notes)}
              </p>
            </div>
          )}

          {/* Paper Bottom Jagged Tear */}
          <div className="mt-4 pt-2 border-b border-dashed border-gray-400 opacity-60" />
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: SHEET INVOICE VIEW (A4 / A5 / Letter)
  // =========================================================================
  return (
    <div 
      className="flex justify-center p-4 transition-transform duration-200"
      style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
    >
      <div
        id="printable-invoice-paper"
        className="text-gray-900 border border-gray-300 shadow-2xl relative select-text flex flex-col justify-between transition-colors"
        style={{
          width: dims.width,
          minHeight: dims.minHeight,
          fontFamily: styles.font_family || 'Battambang, sans-serif',
          backgroundColor: styles.background_color || '#ffffff',
          padding: `${styles.margin_mm * 2.8}px`,
        }}
      >
        {/* Dynamic Watermark Overlay */}
        {styles.watermark_text && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 overflow-hidden">
            <div
              className="font-black text-6xl md:text-8xl tracking-widest text-center whitespace-nowrap"
              style={{
                transform: 'rotate(-30deg)',
                color: styles.watermark_color || '#64748b',
                opacity: styles.watermark_opacity || 0.08,
              }}
            >
              {styles.watermark_text}
            </div>
          </div>
        )}

        <div className="space-y-6 relative z-20">
          {/* National Kingdom Header (GDT Cambodia Requirement) */}
          {layout.show_national_header && (
            <div className="text-center space-y-1 pb-3 border-b border-gray-200">
              <h2 className="text-base font-bold text-gray-900">
                {layout.national_header_text_kh || 'ព្រះរាជាណាចក្រកម្ពុជា'}
              </h2>
              <h3 className="text-xs font-semibold text-gray-700">
                {layout.national_header_sub_kh || 'ជាតិ សាសនា ព្រះមហាក្សត្រ'}
              </h3>
              <div 
                className="w-20 h-0.5 mx-auto mt-1" 
                style={{ backgroundColor: styles.primary_color || '#059669' }} 
              />
            </div>
          )}

          {/* Company & Document Header Grid */}
          <div className="grid grid-cols-2 gap-6 items-start">
            {/* Left: Company details */}
            <div className="space-y-1.5">
              {layout.show_logo && (
                <div className="pb-1">
                  <SmartPosLogo variant="full" size="sm" />
                </div>
              )}
              <h1 className="font-extrabold text-sm text-gray-900">
                {layout.company_name_kh || 'ក្រុមហ៊ុន ស្មាតភីអូអេស សឹលូសិន ខូអិលធីឌី'}
              </h1>
              <p className="text-xs font-bold text-gray-700">
                {layout.company_name_en || 'SmartPOS Solutions (Cambodia) Co., Ltd.'}
              </p>
              <div className="text-[11px] text-gray-600 space-y-0.5 pt-1">
                {layout.vattin && (
                  <p>
                    <span className="font-bold text-gray-800">លេខអត្តសញ្ញាណកម្ម អតប (VATTIN):</span>{' '}
                    <span className="font-mono font-bold text-emerald-800">{layout.vattin}</span>
                  </p>
                )}
                {layout.company_address_kh && (
                  <p><span className="font-bold text-gray-800">អាសយដ្ឋាន:</span> {layout.company_address_kh}</p>
                )}
                {layout.company_phone && (
                  <p><span className="font-bold text-gray-800">ទូរស័ព្ទ / Phone:</span> {layout.company_phone}</p>
                )}
                {layout.company_email && (
                  <p><span className="font-bold text-gray-800">អ៊ីមែល / Email:</span> {layout.company_email}</p>
                )}
              </div>
            </div>

            {/* Right: Invoice Document Meta Box */}
            <div 
              className="p-4 rounded-2xl border space-y-2 text-right"
              style={{
                borderColor: `${styles.primary_color}33`,
                backgroundColor: styles.header_bg || '#f0fdf4',
              }}
            >
              <div>
                <h2 
                  className="font-black text-lg uppercase tracking-tight"
                  style={{ color: styles.primary_color || '#059669' }}
                >
                  {layout.doc_title_kh || 'វិក្កយបត្រពន្ធ'}
                </h2>
                <h3 className="font-bold text-xs uppercase text-gray-600">
                  {layout.doc_title_en || 'TAX INVOICE'}
                </h3>
              </div>

              <div className="text-[11px] space-y-1 text-gray-700 pt-1">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-500">លេខវិក្កយបត្រ (Invoice #):</span>
                  <span className="font-mono font-bold text-gray-900">{d.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-500">កាលបរិច្ឆេទ (Issue Date):</span>
                  <span>{d.invoice_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-500">ថ្ងៃផុតកំណត់ (Due Date):</span>
                  <span>{d.due_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-500">សាខា (Branch):</span>
                  <span className="font-medium">{d.branch.name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Billing Lockup */}
          {layout.show_customer_info && (
            <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200 text-[11px] space-y-1">
              <span className="font-bold text-xs text-gray-900 uppercase tracking-wide">
                ព័ត៌មានអតិថិជន / Customer Information
              </span>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <p className="font-bold text-gray-800">{d.customer.name}</p>
                  <p className="text-gray-600">{d.customer.name_kh}</p>
                  <p className="text-gray-500 text-[10px]">{d.customer.address}</p>
                </div>
                <div className="text-right space-y-0.5">
                  <p><span className="text-gray-500">Phone:</span> {d.customer.phone}</p>
                  {layout.show_customer_vattin && (
                    <p>
                      <span className="font-bold text-gray-700">Customer VATTIN:</span>{' '}
                      <span className="font-mono font-bold text-gray-900">{d.customer.vattin}</span>
                    </p>
                  )}
                  <p><span className="text-gray-500">Account Group:</span> {d.customer.customer_group}</p>
                </div>
              </div>
            </div>
          )}

          {/* Line Items Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-[11px] text-left border-collapse">
              <thead>
                <tr 
                  className="font-bold text-white uppercase text-[10px]"
                  style={{ backgroundColor: styles.primary_color || '#059669' }}
                >
                  {layout.table_columns.filter(c => c.visible).map(col => (
                    <th key={col.id} className="py-2 px-3" style={{ width: col.width }}>
                      <div>{col.label_kh}</div>
                      <div className="text-[9px] font-normal opacity-90">{col.label_en}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {d.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    {layout.table_columns.filter(c => c.visible).map(col => {
                      if (col.id === 'num') return <td key={col.id} className="py-2.5 px-3 text-gray-500">{it.num}</td>;
                      if (col.id === 'sku') return <td key={col.id} className="py-2.5 px-3 font-mono text-gray-600">{it.sku}</td>;
                      if (col.id === 'barcode') return <td key={col.id} className="py-2.5 px-3 font-mono text-gray-500 text-[10px]">{it.barcode}</td>;
                      if (col.id === 'name') return (
                        <td key={col.id} className="py-2.5 px-3 font-medium text-gray-900">
                          {it.name}
                        </td>
                      );
                      if (col.id === 'qty') return <td key={col.id} className="py-2.5 px-3 text-center">{it.quantity} {it.unit}</td>;
                      if (col.id === 'price') return <td key={col.id} className="py-2.5 px-3 font-mono text-right">${it.unit_price.toFixed(2)}</td>;
                      if (col.id === 'discount') return <td key={col.id} className="py-2.5 px-3 font-mono text-right text-rose-600">${it.discount_amount.toFixed(2)}</td>;
                      if (col.id === 'tax') return <td key={col.id} className="py-2.5 px-3 font-mono text-right">${it.tax_amount.toFixed(2)}</td>;
                      if (col.id === 'total') return <td key={col.id} className="py-2.5 px-3 font-mono font-bold text-right text-gray-900">${it.total_amount.toFixed(2)}</td>;
                      if (col.id === 'check') return <td key={col.id} className="py-2.5 px-3 text-center font-mono">{it.check}</td>;
                      return <td key={col.id} className="py-2.5 px-3">-</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculations & Settlement Summary Grid */}
          <div className="grid grid-cols-2 gap-6 pt-2">
            {/* Left: Payment Info & Bakong KHQR */}
            <div className="space-y-3">
              {layout.show_payment_qr && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="bg-white p-1.5 rounded-lg border border-gray-200 shadow-2xs">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="Bakong KHQR" className="w-[80px] h-[80px]" />
                    ) : (
                      <div className="w-[80px] h-[80px] bg-gray-100 flex items-center justify-center">
                        <span className="text-[10px] text-gray-400">KHQR</span>
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] space-y-0.5">
                    <span className="font-bold text-xs text-rose-600 block">Bakong KHQR</span>
                    <p className="text-gray-600">Scan to pay directly via KHQR</p>
                    <p className="font-mono text-[9px] text-gray-500">Account: 001-902-888-USD</p>
                  </div>
                </div>
              )}

              {layout.notes && (
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70 text-[10px] text-amber-900 space-y-0.5">
                  <span className="font-bold block uppercase tracking-wider">ល័ក្ខខ័ណ្ឌ / Terms & Notes:</span>
                  <p className="whitespace-pre-line leading-relaxed">{replacePlaceholders(layout.notes)}</p>
                </div>
              )}
            </div>

            {/* Right: Calculations Table */}
            <div className="space-y-1.5 text-[11px] text-right">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-600">សរុបមិនគិតពន្ធ / Subtotal:</span>
                <span className="font-mono font-bold">${d.subtotal.toFixed(2)}</span>
              </div>
              {d.discount_amount > 0 && (
                <div className="flex justify-between py-1 border-b border-gray-100 text-rose-600">
                  <span>បញ្ចុះតម្លៃ / Total Discount:</span>
                  <span className="font-mono font-bold">-${d.discount_amount.toFixed(2)}</span>
                </div>
              )}
              {layout.show_vat_breakdown && (
                <div className="flex justify-between py-1 border-b border-gray-100 text-gray-600">
                  <span>អាករលើតម្លៃបន្ថែម (VAT {layout.vat_rate_percent || 10}%):</span>
                  <span className="font-mono font-bold">${d.tax_amount.toFixed(2)}</span>
                </div>
              )}
              <div 
                className="flex justify-between py-2 px-3 rounded-lg text-white font-black text-sm items-center mt-2"
                style={{ backgroundColor: styles.primary_color || '#059669' }}
              >
                <span>សរុបរួម (Grand Total USD):</span>
                <span className="font-mono text-base">${d.total_amount.toFixed(2)}</span>
              </div>
              {layout.show_dual_currency && (
                <div className="flex justify-between pt-1 px-1 text-xs font-bold text-emerald-800">
                  <span>សរុបជាប្រាក់រៀល (Total KHR - Rate {exchangeRate.toLocaleString()}):</span>
                  <span className="font-mono">៛{totalKhr.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Signatures Block */}
          {layout.show_signatures && layout.signatures && (
            <div className="grid grid-cols-2 gap-8 pt-8 pb-4 text-center text-xs relative">
              {layout.signatures.map((sig, idx) => (
                <div key={idx} className="space-y-12">
                  <div>
                    <p className="font-bold text-gray-800">{sig.label_kh}</p>
                    <p className="text-[10px] text-gray-500">{sig.label_en}</p>
                  </div>
                  <div className="border-t border-gray-400 w-48 mx-auto pt-1">
                    <span className="text-[10px] text-gray-400">ហត្ថលេខា និងត្រា (Signature & Stamp)</span>
                  </div>
                </div>
              ))}

              {styles.show_official_stamp && (
                <div className="absolute right-0 bottom-0 pointer-events-none">
                  <OfficialTaxStamp
                    type={styles.stamp_type || 'PAID'}
                    size="md"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Document Footer */}
        <div className="border-t border-gray-200 pt-3 mt-6 text-center text-[10px] text-gray-400">
          <p>Generated by SmartPOS Cambodia Enterprise Document Engine • Official Tax Copy</p>
        </div>
      </div>
    </div>
  );
};
