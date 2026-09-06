import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { StoreAttendanceQrResponse } from '../../foundation/types';
import { getStoreAttendanceQr } from '../../data-access/posApi';
import {
  Printer,
  X,
  QrCode,
  Sparkles,
  Building2,
  MapPin,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';

interface StoreAttendanceQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoreAttendanceQrModal: React.FC<StoreAttendanceQrModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [storeQrData, setStoreQrData] = useState<StoreAttendanceQrResponse | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [printFormat, setPrintFormat] = useState<'standee' | 'poster'>('standee');

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getStoreAttendanceQr()
        .then(async (data) => {
          setStoreQrData(data);
          try {
            const url = await QRCode.toDataURL(data.qr_token, {
              margin: 2,
              width: 320,
              color: {
                dark: '#0f172a',
                light: '#ffffff',
              },
            });
            setQrDataUrl(url);
          } catch (err) {
            console.error('Failed to generate store QR URL', err);
          }
        })
        .catch((err) => console.error('Failed to fetch store QR data', err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyToken = () => {
    if (storeQrData) {
      navigator.clipboard.writeText(storeQrData.qr_token);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-gray-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-200">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg sm:text-xl text-gray-900 flex items-center space-x-2">
                <span>Storefront Attendance QR Standee</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-xs text-gray-500">
                Display at the store entrance or checkout register for staff mobile self-scan clock-in/out
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

        {/* Toolbar & Print Controls */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-gray-700">Format:</span>
            <div className="flex items-center bg-gray-200/80 p-1 rounded-xl">
              <button
                onClick={() => setPrintFormat('standee')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  printFormat === 'standee'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Acrylic Desk Standee
              </button>
              <button
                onClick={() => setPrintFormat('poster')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  printFormat === 'poster'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Entrance Poster (A4)
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyToken}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl flex items-center space-x-1.5 transition"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? 'Copied Token' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-200 flex items-center space-x-2 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Poster</span>
            </button>
          </div>
        </div>

        {/* Printable Poster / Standee Preview Container */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-gray-100/70 flex items-center justify-center print:p-0 print:bg-white">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-xs font-semibold text-gray-500">Generating Store Attendance QR...</p>
            </div>
          ) : storeQrData ? (
            <div
              className={`bg-white border-4 border-gray-900 shadow-2xl rounded-3xl overflow-hidden flex flex-col justify-between text-center relative print:shadow-none print:border-2 ${
                printFormat === 'standee'
                  ? 'max-w-sm w-full p-6 sm:p-8 space-y-6'
                  : 'max-w-md w-full p-8 sm:p-10 space-y-8'
              }`}
            >
              {/* Store Header Branding */}
              <div className="space-y-2">
                <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border border-emerald-300">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>OFFICIAL STORE ATTENDANCE</span>
                </div>

                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                  {storeQrData.branch_name}
                </h2>

                <div className="flex items-center justify-center space-x-1 text-xs font-semibold text-gray-500">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>Station Code: {storeQrData.branch_code}</span>
                </div>
              </div>

              {/* Central Vector QR Code Box */}
              <div className="bg-gray-50 p-5 rounded-3xl border-2 border-gray-200 shadow-inner flex flex-col items-center justify-center space-y-3 relative group">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Store Attendance QR Code"
                    className="w-56 h-56 object-contain rounded-xl shadow-xs"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-gray-400">
                    <QrCode className="w-20 h-20 animate-pulse" />
                  </div>
                )}
                <span className="font-mono text-[11px] font-bold text-gray-600 tracking-widest uppercase bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-2xs">
                  {storeQrData.qr_token}
                </span>
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2 text-emerald-700 font-black text-sm">
                  <Smartphone className="w-4 h-4 stroke-[2.5]" />
                  <span>Scan to Clock In / Clock Out</span>
                </div>
                <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                  Open your SmartPOS staff app on your phone & scan this Store QR code to record your arrival or departure.
                </p>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                <span>SmartPOS System</span>
                <span>Powered by HQ-01</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
