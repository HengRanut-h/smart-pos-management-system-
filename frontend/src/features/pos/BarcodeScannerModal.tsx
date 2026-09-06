import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../../foundation/types';
import {
  Barcode,
  Camera,
  CameraOff,
  Zap,
  X,
  Search,
  CheckCircle2,
  Volume2,
  RefreshCw,
  Plus,
  Play,
  ShoppingCart,
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onScanProduct: (product: Product) => void;
  playScanBeep: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onScanProduct,
  playScanBeep,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'shelf' | 'manual'>('shelf');
  const [manualInput, setManualInput] = useState('');
  const [lastScanned, setLastScanned] = useState<{ product: Product; time: string } | null>(null);
  const [scanHistory, setScanHistory] = useState<Array<{ product: Product; time: string }>>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Generate simple SVG stripes for realistic barcode display
  const renderBarcodeSvg = (code: string) => {
    // Generate deterministic pattern based on characters
    const bars: boolean[] = [];
    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i);
      bars.push(true, (charCode % 2 === 0), (charCode % 3 === 0), false, (charCode % 5 === 0));
    }
    bars.push(true, false, true);

    return (
      <svg className="w-full h-8" viewBox={`0 0 ${bars.length * 3} 30`} preserveAspectRatio="none">
        {bars.map((isDark, idx) =>
          isDark ? (
            <rect key={idx} x={idx * 3} y="0" width="2.2" height="30" fill="#1e293b" />
          ) : null
        )}
      </svg>
    );
  };

  // Camera handling
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported on this device/browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);

      // Check for native BarcodeDetector
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
        });

        const detectInterval = setInterval(async () => {
          if (!videoRef.current || !isCameraActive) {
            clearInterval(detectInterval);
            return;
          }
          try {
            const detected = await barcodeDetector.detect(videoRef.current);
            if (detected.length > 0) {
              const rawValue = detected[0].rawValue;
              handleMatchBarcode(rawValue);
            }
          } catch {}
        }, 500);
      }
    } catch (err: any) {
      setCameraError(err.message || 'Unable to access camera. Please check device permissions.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const handleMatchBarcode = (barcodeStr: string) => {
    const clean = barcodeStr.trim().toLowerCase();
    if (!clean) return;

    const matched = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === clean) ||
        p.sku.toLowerCase() === clean ||
        p.name.toLowerCase().includes(clean)
    );

    if (matched) {
      onScanProduct(matched);
      playScanBeep();
      const entry = { product: matched, time: new Date().toLocaleTimeString() };
      setLastScanned(entry);
      setScanHistory((prev) => [entry, ...prev.slice(0, 9)]);
      setManualInput('');
      return true;
    }
    return false;
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const found = handleMatchBarcode(manualInput);
    if (!found) {
      alert(`No product found matching barcode or SKU: "${manualInput}"`);
    }
  };

  const handleSimulateScan = (product: Product) => {
    onScanProduct(product);
    playScanBeep();
    const entry = { product, time: new Date().toLocaleTimeString() };
    setLastScanned(entry);
    setScanHistory((prev) => [entry, ...prev.slice(0, 9)]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
              <Barcode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-gray-900">Barcode Scanner & Hardware Hub</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  READY
                </span>
              </div>
              <p className="text-xs text-gray-500">
                USB/Bluetooth wedge listener active. Point handheld scanner or select below.
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

        {/* Mode Switcher Tabs */}
        <div className="flex space-x-2 pt-4 pb-2 shrink-0">
          <button
            onClick={() => setActiveTab('shelf')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'shelf'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Product Barcodes Shelf</span>
          </button>

          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'camera'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live Camera Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'manual'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-blue-400" />
            <span>Direct Barcode Entry</span>
          </button>
        </div>

        {/* Last Scanned Toast Indicator */}
        {lastScanned && (
          <div className="my-2 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shrink-0 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                ✓
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-emerald-950 block truncate">
                  Scanned: {lastScanned.product.name}
                </span>
                <span className="text-[11px] font-mono text-emerald-700">
                  Barcode: {lastScanned.product.barcode || lastScanned.product.sku} | ${Number(lastScanned.product.selling_price).toFixed(2)} USD
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold shadow-xs shrink-0">
              Added to Cart
            </span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 py-2">
          {/* TAB 1: PRODUCT BARCODES SHELF */}
          {activeTab === 'shelf' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Click <strong className="text-emerald-700">⚡ Tap to Scan</strong> on any item below to simulate an authentic physical barcode scan into the cash register:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {products.map((p) => {
                  const barcodeValue = p.barcode || `885${p.sku.replace(/\D/g, '').padEnd(10, '0')}`;
                  return (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-2xl border border-gray-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/20 transition shadow-xs flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-gray-900 block truncate group-hover:text-emerald-700 transition">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              SKU: {p.sku} | {p.category?.name || 'Retail'}
                            </span>
                          </div>
                          <span className="font-mono font-extrabold text-xs text-emerald-600 shrink-0">
                            ${Number(p.selling_price).toFixed(2)}
                          </span>
                        </div>

                        {/* Barcode Graphic */}
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col items-center">
                          {renderBarcodeSvg(barcodeValue)}
                          <span className="font-mono text-[11px] font-bold text-slate-700 tracking-widest mt-1">
                            {barcodeValue}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSimulateScan(p)}
                        className="w-full mt-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs transition group-hover:shadow-md"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>Tap to Scan</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: LIVE CAMERA SCANNER */}
          {activeTab === 'camera' && (
            <div className="space-y-4 text-center">
              <div className="relative max-w-sm mx-auto aspect-4/3 bg-black rounded-3xl overflow-hidden shadow-lg border-2 border-slate-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />

                {/* Reticle / Viewfinder */}
                <div className="absolute inset-8 border-2 border-dashed border-emerald-400/80 rounded-2xl pointer-events-none flex items-center justify-center">
                  <div className="w-full h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></div>
                </div>

                {!isCameraActive && (
                  <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-white p-4">
                    <CameraOff className="w-10 h-10 text-slate-400 mb-2" />
                    <p className="text-xs text-slate-300">Camera preview inactive</p>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs border border-rose-200">
                  {cameraError}
                </div>
              )}

              <p className="text-xs text-gray-500">
                Align barcode within the aiming frame. Scanners with hardware lasers can also be scanned anytime.
              </p>

              <div className="flex justify-center gap-2">
                {!isCameraActive ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Start Camera</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2 bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs"
                  >
                    <CameraOff className="w-4 h-4" />
                    <span>Stop Camera</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DIRECT MANUAL ENTRY */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Enter or Paste Barcode / SKU
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 8850123456781 or BEV-001..."
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      autoFocus
                      className="flex-1 px-3.5 py-2.5 text-xs font-mono font-bold border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                    >
                      Scan Item
                    </button>
                  </div>
                </div>
              </form>

              {/* Quick Barcode Numbers list */}
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Known Catalog Barcodes (Click to Fill):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {products.map((p) => {
                    const bc = p.barcode || p.sku;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setManualInput(bc);
                          handleMatchBarcode(bc);
                        }}
                        className="px-2.5 py-1 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-lg text-xs font-mono text-slate-700 hover:text-emerald-700 transition"
                      >
                        {bc} ({p.name.split(' ')[0]})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Recent Scans Strip */}
          {scanHistory.length > 0 && (
            <div className="mt-5 pt-3 border-t border-gray-100">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Recent Scans in this Session:
              </span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {scanHistory.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-gray-50 text-gray-700"
                  >
                    <span className="font-semibold">{entry.product.name}</span>
                    <div className="flex items-center space-x-2 font-mono text-gray-400 text-[11px]">
                      <span>{entry.product.barcode || entry.product.sku}</span>
                      <span>{entry.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-400 flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-emerald-600" />
            Scanner Audio Feedback Enabled (880Hz)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            Done & Return to POS
          </button>
        </div>
      </div>
    </div>
  );
};
