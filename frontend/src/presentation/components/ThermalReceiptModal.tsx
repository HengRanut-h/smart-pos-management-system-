import React, { useRef } from 'react';
import { SmartPosLogo } from './SmartPosLogo';
import { Printer, X, CheckCircle2, QrCode, Award } from 'lucide-react';
import { Sale } from '../../foundation/types';

interface ThermalReceiptModalProps {
  sale: any;
  onClose: () => void;
  exchangeRate?: number;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  sale,
  onClose,
  exchangeRate = 4100,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const totalUsd = Number(sale.total_amount || 0);
  const totalKhr = Math.round(totalUsd * exchangeRate);
  const paidUsd = Number(sale.paid_amount || totalUsd);
  const changeUsd = Number(sale.change_amount || 0);
  const changeKhr = Math.round(changeUsd * exchangeRate);
  const subtotalUsd = Number(sale.subtotal || totalUsd);
  const taxUsd = Number(sale.tax_amount || 0);
  const discountUsd = Number(sale.discount_amount || 0);

  const handlePrint = () => {
    window.print();
  };

  const customer = sale.customer;
  const items = sale.items || [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col my-auto print:shadow-none print:border-none print:w-full print:max-w-none">
        {/* Modal Controls Bar (Hidden during printing) */}
        <div className="p-4 bg-gray-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Thermal Receipt Preview</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print (80mm)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Printable 80mm Thermal Receipt Content                                    */}
        {/* ========================================================================= */}
        <div
          ref={receiptRef}
          className="p-6 text-gray-900 font-mono text-xs leading-tight select-text max-h-[75vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-2"
        >
          {/* Header */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-300">
            <div className="flex justify-center mb-1.5">
              <SmartPosLogo variant="full" size="sm" showSubtitle={false} />
            </div>
            <h2 className="font-bold text-sm tracking-tight">SMARTPOS FLAGSHIP STORE</h2>
            <p className="text-[10px] text-gray-600">Branch HQ-01 Phnom Penh</p>
            <p className="text-[10px] text-gray-600">VATTIN: K002-902100481</p>
            <p className="text-[10px] text-gray-600">Monivong Blvd, Sangkat BKK1, Phnom Penh</p>
            <p className="text-[10px] text-gray-600">Tel: +855 23 888 999</p>
          </div>

          {/* Transaction Metadata */}
          <div className="py-2.5 space-y-1 text-[11px] border-b border-dashed border-gray-300">
            <div className="flex justify-between">
              <span className="text-gray-500">Date:</span>
              <span>{sale.sale_date ? new Date(sale.sale_date).toLocaleString() : new Date().toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Receipt No:</span>
              <span className="font-bold">{sale.sale_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Cashier:</span>
              <span>{sale.cashier?.username || 'Cashier 1 (Terminal #01)'}</span>
            </div>
            {customer && (
              <div className="flex justify-between text-purple-800 font-semibold pt-0.5">
                <span>Member:</span>
                <span>{customer.name} ({customer.customer_code})</span>
              </div>
            )}
          </div>

          {/* Itemized Table */}
          <div className="py-2.5 border-b border-dashed border-gray-300 space-y-2">
            <div className="flex justify-between font-bold text-[10px] text-gray-400 uppercase tracking-wider pb-1">
              <span>Item / Description</span>
              <span>Total</span>
            </div>

            {items.length === 0 ? (
              <div className="flex justify-between text-[11px]">
                <div>
                  <span className="font-bold block">General Retail Order</span>
                  <span className="text-[10px] text-gray-500">1 x ${totalUsd.toFixed(2)}</span>
                </div>
                <span className="font-bold">${totalUsd.toFixed(2)}</span>
              </div>
            ) : (
              items.map((it: any, idx: number) => {
                const name = it.product?.name || it.name || `Item #${it.product_id || idx + 1}`;
                const qty = Number(it.quantity || 1);
                const price = Number(it.unit_price || 0);
                const lineTotal = Number(it.total_amount || qty * price);

                return (
                  <div key={idx} className="flex justify-between text-[11px] leading-snug">
                    <div className="pr-2 min-w-0">
                      <span className="font-bold block truncate">{name}</span>
                      <span className="text-[10px] text-gray-500">
                        {qty} x ${price.toFixed(2)}
                      </span>
                    </div>
                    <span className="font-bold shrink-0">${lineTotal.toFixed(2)}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Financial Totals */}
          <div className="py-2.5 space-y-1.5 border-b border-dashed border-gray-300 text-[11px]">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>${subtotalUsd.toFixed(2)}</span>
            </div>
            {discountUsd > 0 && (
              <div className="flex justify-between text-rose-600 font-semibold">
                <span>Discount / Loyalty:</span>
                <span>-${discountUsd.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>VAT (10%):</span>
              <span>${taxUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-gray-900 pt-1 border-t border-gray-200">
              <span>TOTAL (USD):</span>
              <span>${totalUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-emerald-700">
              <span>TOTAL (KHR):</span>
              <span>៛{totalKhr.toLocaleString()} KHR</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="py-2.5 space-y-1 border-b border-dashed border-gray-300 text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-500">Payment:</span>
              <span className="font-bold uppercase">{sale.payments?.[0]?.payment_method?.name || 'CASH USD'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Paid Amount:</span>
              <span>${paidUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-gray-500">Change Due:</span>
              <span>${changeUsd.toFixed(2)} (៛{changeKhr.toLocaleString()})</span>
            </div>
          </div>

          {/* Loyalty Program Summary (if member) */}
          {customer && (
            <div className="py-2.5 border-b border-dashed border-gray-300 text-[10px] space-y-1 text-purple-900">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center space-x-1">
                  <Award className="w-3 h-3 text-purple-600" />
                  <span>SmartPOS Rewards</span>
                </span>
                <span>+{Math.floor(totalUsd)} pts earned</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Updated Point Balance:</span>
                <span className="font-bold text-purple-700">
                  {Number(customer.loyalty_points || 0).toLocaleString()} pts
                </span>
              </div>
            </div>
          )}

          {/* Verification Barcode / Footer */}
          <div className="pt-3 text-center space-y-2">
            <div className="flex justify-center">
              <div className="p-2 border border-gray-200 rounded-xl bg-gray-50 inline-block">
                <QrCode className="w-16 h-16 text-gray-800" />
              </div>
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
              Verify receipt & warranty at smartpos.com.kh
            </p>
            <div className="text-[10px] text-gray-600 font-bold leading-tight">
              <p>Thank you for shopping with us!</p>
              <p className="font-khmer">សូមអរគុណ និងសូមអញ្ជើញមកវិញ!</p>
            </div>
          </div>
        </div>

        {/* Bottom Actions (Hidden during print) */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print Thermal Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
};
