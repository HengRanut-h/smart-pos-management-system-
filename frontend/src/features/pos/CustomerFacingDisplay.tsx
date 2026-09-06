import React, { useState, useEffect } from 'react';
import { SmartPosLogo } from '../../presentation/components/SmartPosLogo';
import {
  ShoppingCart,
  CheckCircle2,
  QrCode,
  Sparkles,
  Percent,
  Receipt,
  Heart,
  Clock,
  Tag,
  ShieldCheck,
} from 'lucide-react';

interface DisplayCartItem {
  product: {
    id: number;
    name: string;
    sku: string;
    barcode?: string;
    selling_price: number | string;
    image_url?: string;
    unit?: { name: string };
  };
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface CustomerDisplayState {
  items: DisplayCartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  totalKhr: number;
  isCheckoutOpen: boolean;
  khqrData: { qr_string: string; md5: string } | null;
  completedSuccess: any | null;
  customer: { name: string; loyalty_points?: number } | null;
}

export const CustomerFacingDisplay: React.FC = () => {
  const [displayState, setDisplayState] = useState<CustomerDisplayState>(() => {
    try {
      const saved = localStorage.getItem('smartpos_customer_display_state');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      items: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      totalKhr: 0,
      isCheckoutOpen: false,
      khqrData: null,
      completedSuccess: null,
      customer: null,
    };
  });

  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // BroadcastChannel & localStorage synchronizer
  useEffect(() => {
    const handleUpdate = (data: CustomerDisplayState) => {
      if (data) {
        setDisplayState(data);
      }
    };

    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('smartpos_customer_display');
        channel.onmessage = (event) => {
          if (event.data && event.data.type === 'UPDATE_CART') {
            handleUpdate(event.data.payload);
          }
        };
      }
    } catch {}

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'smartpos_customer_display_state' && e.newValue) {
        try {
          handleUpdate(JSON.parse(e.newValue));
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const { items, subtotal, tax, discount, total, totalKhr, isCheckoutOpen, khqrData, completedSuccess, customer } = displayState;
  const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);

  // Auto-dismiss completed screen after 7 seconds
  useEffect(() => {
    if (completedSuccess) {
      const timer = setTimeout(() => {
        setDisplayState((prev) => ({
          ...prev,
          items: [],
          total: 0,
          totalKhr: 0,
          subtotal: 0,
          tax: 0,
          discount: 0,
          completedSuccess: null,
        }));
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [completedSuccess]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans select-none overflow-hidden">
      {/* 1. Header Bar */}
      <header className="bg-slate-950/80 backdrop-blur-md px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <SmartPosLogo className="w-9 h-9" />
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>SmartPOS Retail</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                CUSTOMER DISPLAY
              </span>
            </h1>
            <p className="text-xs text-slate-400">Phnom Penh Headquarters • Register #01</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs font-medium text-slate-400">
          {customer && (
            <div className="flex items-center space-x-2 bg-purple-950/50 border border-purple-800/60 px-3 py-1.5 rounded-xl text-purple-300">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Welcome, <strong className="text-white">{customer.name}</strong></span>
              {customer.loyalty_points !== undefined && (
                <span className="font-mono text-[11px] text-purple-400">({customer.loyalty_points} pts)</span>
              )}
            </div>
          )}
          <div className="flex items-center space-x-1.5 font-mono text-slate-300 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{currentTime}</span>
          </div>
        </div>
      </header>

      {/* 2. Main Content Body */}
      {completedSuccess ? (
        // SALE COMPLETED / THANK YOU SCREEN
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="w-24 h-24 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 border-2 border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-14 h-14" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Payment Completed Successfully!</h2>
          <p className="text-lg text-emerald-400 font-semibold mb-6">Thank you for shopping with us.</p>

          <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-3">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Receipt Ref:</span>
              <span className="font-mono text-white font-bold">{completedSuccess.sale_number || 'REC-POS'}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-400">
              <span>Total Paid:</span>
              <span className="font-mono text-emerald-400 font-black text-xl">
                ${Number(completedSuccess.total_amount || total).toFixed(2)} USD
              </span>
            </div>
            <div className="flex justify-between text-sm text-slate-400">
              <span>In Khmer Riel:</span>
              <span className="font-mono text-slate-200 font-bold">
                ៛{((completedSuccess.total_amount || total) * 4100).toLocaleString()} KHR
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-6 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>Please take your printed receipt and items from the counter.</span>
          </p>
        </div>
      ) : items.length === 0 ? (
        // WELCOME / IDLE SCREEN
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 rounded-3xl bg-slate-800 text-slate-600 flex items-center justify-center mb-4 border border-slate-700">
            <ShoppingCart className="w-10 h-10 text-emerald-400/60" />
          </div>
          <h2 className="text-2xl font-black text-white mb-1">Welcome to SmartPOS</h2>
          <p className="text-sm text-slate-400 max-w-sm mb-6">
            Please place your items on the counter. Your scanned items will appear here in real time.
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/60 px-4 py-2 rounded-2xl border border-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Accepting Cash (USD & KHR) and NBC Bakong KHQR Payments</span>
          </div>
        </div>
      ) : (
        // ACTIVE CART & CHECKOUT SCREEN
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: Scanned Items List */}
          <div className="flex-1 flex flex-col border-r border-slate-800 bg-slate-900/50 overflow-hidden">
            <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                <span>Items in Cart ({itemCount})</span>
              </span>
              <span className="text-xs font-mono text-slate-400">Real-Time Register Feed</span>
            </div>

            {/* Scrollable Items Table */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-3.5 flex items-center justify-between hover:bg-slate-800 transition"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-500/30">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-white truncate">{item.product.name}</h4>
                      <span className="text-xs font-mono text-slate-400">
                        ${Number(item.unit_price).toFixed(2)} × {item.quantity} {item.product.unit?.name || 'unit'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-base font-black text-emerald-400 block">
                      ${Number(item.subtotal || item.unit_price * item.quantity).toFixed(2)}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      ៛{Math.round(Number(item.subtotal || item.unit_price * item.quantity) * 4100).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Subtotal, Taxes & Payment / KHQR */}
          <div className="w-full lg:w-[420px] bg-slate-950 flex flex-col justify-between p-6 shrink-0 border-t lg:border-t-0 border-slate-800">
            {/* Price Breakdown */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Order Summary
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-white font-semibold">${subtotal.toFixed(2)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Discount Applied:</span>
                    <span className="font-mono">-${discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-400">
                  <span>10% Value Added Tax (VAT):</span>
                  <span className="font-mono text-white font-semibold">${tax.toFixed(2)}</span>
                </div>
              </div>

              {/* Grand Total Hero Box */}
              <div className="bg-gradient-to-br from-emerald-950/70 to-slate-900 p-5 rounded-3xl border-2 border-emerald-500/40 shadow-xl space-y-1 text-center">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  Grand Total Payable
                </span>
                <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                  ${total.toFixed(2)} <span className="text-lg text-emerald-400 font-bold">USD</span>
                </div>
                <div className="text-lg font-bold text-emerald-400 font-mono">
                  ៛ {totalKhr.toLocaleString()} KHR
                </div>
              </div>

              {/* Dynamic KHQR QR Code for Customer Scan */}
              {isCheckoutOpen && khqrData?.qr_string && (
                <div className="bg-white p-4 rounded-3xl text-center space-y-2 shadow-2xl animate-in fade-in duration-200">
                  <div className="flex items-center justify-center space-x-1.5 text-slate-900 font-bold text-xs uppercase tracking-wider">
                    <QrCode className="w-4 h-4 text-red-600" />
                    <span>Scan with Any Banking App (Bakong KHQR)</span>
                  </div>
                  <div className="w-44 h-44 mx-auto bg-slate-50 p-2 rounded-2xl border border-slate-200 flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                        khqrData.qr_string
                      )}`}
                      alt="Bakong KHQR Payment"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold block">
                    ABA • Acleda • Canadia • Wing • Chip Mong
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Footer Note */}
            <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
              <span>Exchange Rate: 1 USD = 4,100 KHR • Thank you for choosing SmartPOS</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
