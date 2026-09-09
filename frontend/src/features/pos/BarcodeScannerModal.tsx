import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product } from '../../foundation/types';
import { BrowserMultiFormatReader, BrowserCodeReader, IScannerControls } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';
import {
  ScanBarcode,
  Camera,
  X,
  CheckCircle2,
  AlertTriangle,
  SwitchCamera,
  Flashlight,
  ShoppingCart,
  RefreshCw,
  Layers,
} from 'lucide-react';

export interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products?: Product[];
  onScanProduct?: (product: Product, quantity?: number) => void;
  playScanBeep?: (tone?: 'standard' | 'double' | 'soft') => void;
  onDetectedBarcode?: (code: string) => void | Promise<void>;
  onAddProductToCart?: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products = [],
  onScanProduct = () => {},
  playScanBeep = () => {},
  onDetectedBarcode,
  onAddProductToCart,
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorchSupport, setHasTorchSupport] = useState(false);
  const [lastDetectedFlash, setLastDetectedFlash] = useState<string | null>(null);
  const [scanMultiplier, setScanMultiplier] = useState<number>(1);

  // Scan History in this session
  const [lastScanned, setLastScanned] = useState<{ product: Product; quantity: number; time: string } | null>(null);
  const [unmatchedBarcode, setUnmatchedBarcode] = useState<{ barcode: string; time: string } | null>(null);
  const [sessionScans, setSessionScans] = useState<Array<{ name: string; barcode: string; image_url?: string; quantity: number; price: number; time: string }>>([]);

  // Multi-barcode simultaneous tracking refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const nativeDetectionAnimRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recentScansMapRef = useRef<Map<string, number>>(new Map());
  const scanMultiplierRef = useRef<number>(1);
  scanMultiplierRef.current = scanMultiplier;

  // Refresh and list available camera devices
  const refreshDevices = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return;
    }
    try {
      const devices = await BrowserCodeReader.listVideoInputDevices();
      setAvailableDevices(devices);
      if (devices.length > 0 && !selectedDeviceId) {
        const backCam = devices.find((d) =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );
        setSelectedDeviceId(backCam ? backCam.deviceId : devices[0].deviceId);
      }
    } catch (err) {
      console.warn('Failed to enumerate video devices', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshDevices();
    }
  }, [isOpen]);

  // Haptic feedback (vibration on mobile)
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([80, 40, 80]);
      } catch {}
    }
  };

  // Ultra-Fast High-Quality Scanner Engine (Hardware-Accelerated GPU BarcodeDetector + Continuous Autofocus)
  const startScanner = async (overrideDeviceId?: string) => {
    setCameraError(null);
    if (!videoRef.current) return;

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access requires HTTPS or localhost permissions.');
      setIsCameraActive(false);
      return;
    }

    const deviceToUse = overrideDeviceId !== undefined ? overrideDeviceId : selectedDeviceId;

    try {
      stopScanner();

      // High definition video constraints with fallback
      const videoConstraints: MediaTrackConstraints = {
        deviceId: deviceToUse ? { exact: deviceToUse } : undefined,
        facingMode: !deviceToUse ? { ideal: cameraFacing } : undefined,
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
        frameRate: { ideal: 60, min: 30 },
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });
      } catch (err) {
        // Fallback to basic constraint if 1080p or exact constraint fails
        stream = await navigator.mediaDevices.getUserMedia({
          video: deviceToUse ? { deviceId: { ideal: deviceToUse } } : true,
          audio: false,
        });
      }

      mediaStreamRef.current = stream;

      // Re-enumerate devices so friendly labels (e.g. "Logitech Webcam") populate after permission is granted
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
        navigator.mediaDevices.enumerateDevices().then((devs) => {
          const videoDevs = devs.filter((d) => d.kind === 'videoinput');
          if (videoDevs.length > 0) {
            setAvailableDevices(videoDevs);
          }
        }).catch(() => {});
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play().catch(() => {});
      }

      setIsCameraActive(true);

      // Apply Advanced Hardware Constraints (Continuous Autofocus & Exposure for razor-sharp barcodes)
      const track = stream.getVideoTracks()[0];
      if (track && (track as any).getCapabilities) {
        try {
          const capabilities = (track as any).getCapabilities();
          const advancedConstraints: any = {};

          if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
            advancedConstraints.focusMode = 'continuous';
          }
          if (capabilities.exposureMode && capabilities.exposureMode.includes('continuous')) {
            advancedConstraints.exposureMode = 'continuous';
          }
          if (capabilities.whiteBalanceMode && capabilities.whiteBalanceMode.includes('continuous')) {
            advancedConstraints.whiteBalanceMode = 'continuous';
          }

          setHasTorchSupport(!!capabilities.torch);

          if (Object.keys(advancedConstraints).length > 0) {
            await (track as any).applyConstraints({
              advanced: [advancedConstraints],
            }).catch(() => {});
          }
        } catch (e) {
          console.debug('Advanced constraints not fully supported', e);
        }
      }

      const hasNativeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;

      if (hasNativeDetector) {
        // Dedicated Hardware GPU Acceleration Engine (Sub-10ms response time)
        let supportedFormats = ['ean_13', 'ean_8', 'code_128', 'code_39', 'code_93', 'upc_a', 'upc_e', 'qr_code', 'data_matrix', 'itf'];
        try {
          if ((window as any).BarcodeDetector.getSupportedFormats) {
            const systemFormats = await (window as any).BarcodeDetector.getSupportedFormats();
            if (systemFormats && systemFormats.length > 0) {
              supportedFormats = supportedFormats.filter((fmt) => systemFormats.includes(fmt));
            }
          }
        } catch {}

        const nativeDetector = new (window as any).BarcodeDetector({ formats: supportedFormats });
        let isDetecting = false;

        const loopNativeDetection = async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) {
            nativeDetectionAnimRef.current = requestAnimationFrame(loopNativeDetection);
            return;
          }

          if (!isDetecting) {
            isDetecting = true;
            try {
              const barcodes = await nativeDetector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0) {
                for (const item of barcodes) {
                  if (item.rawValue) {
                    handleBarcodeDetected(item.rawValue);
                  }
                }
              }
            } catch (err) {
              // Frame dropped, proceed to next frame
            } finally {
              isDetecting = false;
            }
          }

          nativeDetectionAnimRef.current = requestAnimationFrame(loopNativeDetection);
        };

        nativeDetectionAnimRef.current = requestAnimationFrame(loopNativeDetection);
      } else {
        // High-Precision ZXing Fallback (Only active if Native BarcodeDetector is unavailable)
        if (!codeReaderRef.current) {
          const hints = new Map();
          hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.EAN_13,
            BarcodeFormat.EAN_8,
            BarcodeFormat.CODE_128,
            BarcodeFormat.CODE_39,
            BarcodeFormat.CODE_93,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
            BarcodeFormat.QR_CODE,
            BarcodeFormat.ITF,
            BarcodeFormat.DATA_MATRIX,
          ]);
          hints.set(DecodeHintType.TRY_HARDER, true);
          codeReaderRef.current = new BrowserMultiFormatReader(hints);
        }

        const reader = codeReaderRef.current;
        if (videoRef.current) {
          const controls = await reader.decodeFromVideoElement(
            videoRef.current,
            (result) => {
              if (result) {
                handleBarcodeDetected(result.getText());
              }
            }
          );
          scannerControlsRef.current = controls;
        }
      }
    } catch (err: any) {
      console.error('Scanner error', err);
      setCameraError(err.message || 'Unable to access camera. Please allow camera permissions.');
      setIsCameraActive(false);
    }
  };

  const stopScanner = () => {
    // 1. Stop native detection animation frame loop
    if (nativeDetectionAnimRef.current) {
      cancelAnimationFrame(nativeDetectionAnimRef.current);
      nativeDetectionAnimRef.current = null;
    }

    // 2. Stop ZXing controls
    if (scannerControlsRef.current) {
      try {
        scannerControlsRef.current.stop();
      } catch (e) {}
      scannerControlsRef.current = null;
    }

    // 3. Explicitly shut down all mediaStream hardware tracks
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {}
        });
      } catch {}
      mediaStreamRef.current = null;
    }

    // 4. Detach and pause video element
    if (videoRef.current) {
      if (videoRef.current.srcObject) {
        try {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch {}
          });
        } catch {}
        videoRef.current.srcObject = null;
      }
      try {
        videoRef.current.pause();
      } catch {}
    }

    setIsCameraActive(false);
    setIsTorchOn(false);
  };

  // Safe close handler that shuts down camera before triggering onClose
  const handleClose = () => {
    stopScanner();
    onClose();
  };

  // Explicit device selection from dropdown
  const handleSelectDevice = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    await startScanner(deviceId);
  };

  // Flip front/back camera or cycle through connected devices
  const handleFlipCamera = async () => {
    if (availableDevices.length > 1) {
      const currentIdx = availableDevices.findIndex((d) => d.deviceId === selectedDeviceId);
      const nextIdx = (currentIdx + 1) % availableDevices.length;
      const nextDevId = availableDevices[nextIdx].deviceId;
      setSelectedDeviceId(nextDevId);
      await startScanner(nextDevId);
    } else {
      const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
      setCameraFacing(nextFacing);
      setSelectedDeviceId('');
      await startScanner('');
    }
  };

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        const nextState = !isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setIsTorchOn(nextState);
      }
    } catch (err) {
      console.error('Failed to toggle torch', err);
    }
  };

  // Lifecycle & hardware shutdown
  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
      setLastScanned(null);
      setUnmatchedBarcode(null);
      recentScansMapRef.current.clear();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen, selectedDeviceId, cameraFacing]);

  // Unconditional unmount hardware cleanup
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // Escape key listener to close camera immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Handle multi-barcode detection with individual code debounce
  const handleBarcodeDetected = (rawCode: string) => {
    const raw = rawCode.trim();
    if (!raw) return;

    const now = Date.now();
    const lastScannedTime = recentScansMapRef.current.get(raw) || 0;

    // Independent 1200ms cooldown per barcode (enables scanning multiple distinct items simultaneously!)
    if (now - lastScannedTime < 450) return;
    recentScansMapRef.current.set(raw, now);

    // Visual flash and tactile haptic
    setLastDetectedFlash(raw);
    triggerHaptic();
    setTimeout(() => setLastDetectedFlash(null), 900);

    // If delegate handler provided (e.g. Attendance Kiosk)
    if (onDetectedBarcode) {
      onDetectedBarcode(raw);
      playScanBeep();
      return;
    }

    let qty = scanMultiplierRef.current || 1;
    let clean = raw.toLowerCase();

    // Auto-detect quantity prefix: e.g. "3*8850024" or "3x8850024"
    if (raw.includes('*') || /^[0-9]+[xX]/.test(raw)) {
      const match = raw.match(/^([0-9]+)[\*xX](.+)$/);
      if (match) {
        const parsedQty = parseInt(match[1], 10);
        if (!isNaN(parsedQty) && parsedQty > 0) {
          qty = parsedQty;
          clean = match[2].trim().toLowerCase();
        }
      }
    }

    // Check if it is a JSON QR code (e.g. { id: 1, qty: 2, sku: '...' })
    let parsedSkuOrBarcode = clean;
    try {
      if (raw.startsWith('{') && raw.endsWith('}')) {
        const parsed = JSON.parse(raw);
        if (parsed.quantity && Number(parsed.quantity) > 0) {
          qty = Number(parsed.quantity);
        } else if (parsed.qty && Number(parsed.qty) > 0) {
          qty = Number(parsed.qty);
        }
        if (parsed.barcode) parsedSkuOrBarcode = String(parsed.barcode).toLowerCase();
        else if (parsed.sku) parsedSkuOrBarcode = String(parsed.sku).toLowerCase();
        else if (parsed.id) {
          const matchedById = products.find((p) => p.id === Number(parsed.id));
          if (matchedById) {
            playScanBeep();
            onScanProduct(matchedById, qty);
            setUnmatchedBarcode(null);
            const entry = { product: matchedById, quantity: qty, time: new Date().toLocaleTimeString() };
            setLastScanned(entry);
            setSessionScans((prev) => {
              const existingIdx = prev.findIndex((it) => it.barcode === (matchedById.barcode || matchedById.sku));
              if (existingIdx >= 0) {
                const copy = [...prev];
                copy[existingIdx] = {
                  ...copy[existingIdx],
                  quantity: copy[existingIdx].quantity + qty,
                  time: entry.time,
                };
                return copy;
              }
              return [
                {
                  name: matchedById.name,
                  barcode: matchedById.barcode || matchedById.sku,
                  image_url: matchedById.image_url,
                  quantity: qty,
                  price: Number(matchedById.selling_price) || 0,
                  time: entry.time,
                },
                ...prev,
              ];
            });
            return;
          }
        }
      }
    } catch {}

    const matched = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === parsedSkuOrBarcode) ||
        p.sku.toLowerCase() === parsedSkuOrBarcode ||
        p.name.toLowerCase() === parsedSkuOrBarcode
    );

    if (matched) {
      playScanBeep();
      // Drop immediately into Current Order with auto-quantity
      onScanProduct(matched, qty);
      setUnmatchedBarcode(null);
      const entry = { product: matched, quantity: qty, time: new Date().toLocaleTimeString() };
      setLastScanned(entry);
      setSessionScans((prev) => {
        const existingIdx = prev.findIndex((it) => it.barcode === (matched.barcode || matched.sku));
        if (existingIdx >= 0) {
          const copy = [...prev];
          copy[existingIdx] = {
            ...copy[existingIdx],
            quantity: copy[existingIdx].quantity + qty,
            time: entry.time,
          };
          return copy;
        }
        return [
          {
            name: matched.name,
            barcode: matched.barcode || matched.sku,
            image_url: matched.image_url,
            quantity: qty,
            price: Number(matched.selling_price) || 0,
            time: entry.time,
          },
          ...prev,
        ];
      });
    } else {
      // Unrecognized barcode
      setUnmatchedBarcode({ barcode: raw, time: new Date().toLocaleTimeString() });
      setTimeout(() => setUnmatchedBarcode(null), 3000);
    }
  };

  const totalSessionCount = useMemo(
    () => sessionScans.reduce((sum, it) => sum + it.quantity, 0),
    [sessionScans]
  );
  const totalSessionAmount = useMemo(
    () => sessionScans.reduce((sum, it) => sum + it.price * it.quantity, 0),
    [sessionScans]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200 select-none">
      <div className="bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-700 flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-xs">
              <ScanBarcode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white leading-tight">Scan QR / Barcode</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1"></span>
                  MULTI-SCAN ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Continuous camera scan — detects and drops products to Current Order auto
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Flip / Switch Camera Button */}
            <button
              type="button"
              onClick={handleFlipCamera}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition border border-slate-700 shadow-xs"
              title="Switch Camera (Front / Rear)"
              aria-label="Switch Camera"
            >
              <SwitchCamera className="w-4 h-4 text-emerald-400" />
            </button>

            {/* Hardware Torch / Flashlight Toggle */}
            {hasTorchSupport && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-2 rounded-xl transition border shadow-xs ${
                  isTorchOn
                    ? 'bg-amber-500 text-white border-amber-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title="Toggle Torch / Flashlight"
                aria-label="Toggle Torch"
              >
                <Flashlight className={`w-4 h-4 ${isTorchOn ? 'text-white' : 'text-amber-400'}`} />
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition border border-transparent hover:border-slate-700 ml-1"
              title="Close Scanner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Active Camera Device Selector Bar */}
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 hidden sm:inline">
              Camera:
            </span>
            <div className="relative flex-1 min-w-0">
              <select
                value={selectedDeviceId}
                onChange={(e) => handleSelectDevice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-xl px-2.5 py-1.5 text-xs text-white font-medium focus:outline-hidden focus:border-emerald-500 transition truncate cursor-pointer shadow-inner"
              >
                {availableDevices.length === 0 ? (
                  <option value="">Default System Camera</option>
                ) : (
                  availableDevices.map((dev, idx) => {
                    let label = dev.label;
                    if (!label) {
                      label = `Camera #${idx + 1} (${dev.deviceId.slice(0, 8)}...)`;
                    }
                    return (
                      <option key={dev.deviceId || idx} value={dev.deviceId}>
                        {label}
                      </option>
                    );
                  })
                )}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg hidden xs:inline-block">
              {availableDevices.length} {availableDevices.length === 1 ? 'camera' : 'cameras'}
            </span>
            <button
              type="button"
              onClick={refreshDevices}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition border border-slate-700 shadow-xs cursor-pointer"
              title="Refresh / Detect Connected Cameras"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Multiplier / Auto-Quantity Quick Bar */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-1.5 text-xs text-slate-300">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-[11px]">Scan Quantity:</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
              {scanMultiplier === 1 ? 'Auto (+1 / scan)' : `${scanMultiplier}x / scan`}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setScanMultiplier(1)}
              className={`px-2.5 py-1 rounded-lg text-xs transition ${
                scanMultiplier === 1
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium'
              }`}
            >
              Auto (+1)
            </button>
            {[2, 3, 5, 10].map((qty) => (
              <button
                key={qty}
                type="button"
                onClick={() => setScanMultiplier(qty)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                  scanMultiplier === qty
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {qty}x
              </button>
            ))}
          </div>
        </div>

        {/* Camera Viewport Area */}
        <div className="relative p-3 flex-1 flex flex-col items-center justify-center bg-black min-h-[300px]">
          {cameraError ? (
            <div className="p-6 text-center text-slate-300 max-w-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-rose-300">{cameraError}</p>
              <button
                type="button"
                onClick={startScanner}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 mx-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Camera</span>
              </button>
            </div>
          ) : (
            <div className="relative w-full aspect-4/3 max-w-sm rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center">
              {/* HTML Video Stream */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />

              {/* Viewfinder Reticle Overlay */}
              <div
                className={`absolute inset-6 border-2 rounded-2xl pointer-events-none transition-all duration-200 flex items-center justify-center ${
                  lastDetectedFlash
                    ? 'border-emerald-400 bg-emerald-500/25 shadow-[0_0_35px_rgba(16,185,129,0.9)]'
                    : 'border-dashed border-emerald-400/70'
                }`}
              >
                {/* 4 Corner Viewfinder Brackets */}
                <div className="absolute top-1.5 left-1.5 w-5 h-5 border-t-3 border-l-3 border-emerald-400 rounded-tl-sm"></div>
                <div className="absolute top-1.5 right-1.5 w-5 h-5 border-t-3 border-r-3 border-emerald-400 rounded-tr-sm"></div>
                <div className="absolute bottom-1.5 left-1.5 w-5 h-5 border-b-3 border-l-3 border-emerald-400 rounded-bl-sm"></div>
                <div className="absolute bottom-1.5 right-1.5 w-5 h-5 border-b-3 border-r-3 border-emerald-400 rounded-br-sm"></div>

                {/* Sweeping Laser Line Animation */}
                <div
                  className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.95)] animate-pulse"
                  style={{ animationDuration: '1.4s' }}
                ></div>
              </div>

              {/* Floating Success Banner (Appears right on camera when product is dropped to order) */}
              {lastScanned && (
                <div className="absolute top-3 inset-x-3 bg-emerald-600/95 backdrop-blur-md text-white p-2.5 rounded-xl shadow-xl animate-in slide-in-from-top-2 duration-150 flex items-center justify-between z-20 border border-emerald-400/40">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xs shrink-0">
                      ✓
                    </div>
                    <div className="min-w-0 leading-tight">
                      <span className="block text-xs font-bold truncate">
                        {lastScanned.product.name}
                      </span>
                      <span className="block text-[10px] text-emerald-100 font-mono">
                        ${Number(lastScanned.product.selling_price || 0).toFixed(2)} USD • Dropped to Order
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-white text-emerald-800 rounded-md text-[10px] font-extrabold shrink-0 shadow-xs">
                    +{lastScanned.quantity} In Order
                  </span>
                </div>
              )}

              {/* Floating Warning Banner (Unmatched barcode detected) */}
              {unmatchedBarcode && !lastScanned && (
                <div className="absolute top-3 inset-x-3 bg-amber-600/95 backdrop-blur-md text-white p-2.5 rounded-xl shadow-xl animate-in slide-in-from-top-2 duration-150 flex items-center space-x-2 z-20 border border-amber-400/40">
                  <AlertTriangle className="w-5 h-5 text-amber-200 shrink-0" />
                  <div className="leading-tight text-xs">
                    <span className="font-bold block">Unregistered Barcode</span>
                    <span className="font-mono text-[10px] text-amber-100 truncate block">
                      Code: {unmatchedBarcode.barcode}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Scanned Products List in Current Session */}
        {sessionScans.length > 0 && (
          <div className="max-h-24 overflow-y-auto px-4 py-2 space-y-1 bg-slate-950/80 border-t border-slate-800 shrink-0">
            {sessionScans.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs text-slate-300 py-0.5">
                <div className="flex items-center space-x-2 truncate max-w-[240px]">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-slate-700 flex items-center justify-center relative shadow-xs">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-400 uppercase">
                        {item.name.slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div className="truncate min-w-0">
                    <span className="truncate font-medium text-slate-200 block text-xs">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {item.barcode}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-mono text-[10px] font-bold">
                    +{item.quantity}
                  </span>
                  <span className="text-emerald-400 font-mono font-bold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Order Summary & Return Button */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <span className="text-xs font-bold text-white block">
                {totalSessionCount > 0 ? `${totalSessionCount} item${totalSessionCount > 1 ? 's' : ''} added to Order` : 'Continuous Multi-Scan Ready'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Order subtotal: $${totalSessionAmount.toFixed(2)} USD
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-xl text-xs font-semibold transition border border-slate-700"
            >
              Close Camera
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-900/40 flex items-center space-x-1.5"
            >
              <span>Done & View Order</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
