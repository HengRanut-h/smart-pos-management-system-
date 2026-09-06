import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { Product } from '../../foundation/types';
import { BrowserMultiFormatReader, BrowserCodeReader, IScannerControls } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';
import QRCode from 'qrcode';
import {
  Barcode,
  Camera,
  CameraOff,
  Zap,
  X,
  Search,
  CheckCircle2,
  Volume2,
  VolumeX,
  RefreshCw,
  Plus,
  Play,
  ShoppingCart,
  Printer,
  Scale,
  Sparkles,
  FileText,
  Flashlight,
  Video,
  Layers,
  Smartphone,
  QrCode,
  Wifi,
  ExternalLink,
  Copy,
  Check,
  SwitchCamera,
  Info,
  ShieldCheck,
  AlertCircle,
  Lock,
  ShieldAlert,
  HelpCircle,
  Tag,
  AlertTriangle,
  Link2,
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onScanProduct: (product: Product, quantity?: number) => void;
  playScanBeep: (tone?: 'standard' | 'double' | 'soft') => void;
}

interface CheatsheetItem {
  id: string;
  name: string;
  nameKh: string;
  barcode: string;
  price: number;
  category: string;
}

const COMMON_CHEATSHEET_ITEMS: CheatsheetItem[] = [
  { id: 'FEE-BAG-01', name: 'Plastic Carrier Bag', nameKh: 'ថង់ប្លាស្ទិកធម្មតា', barcode: '2900001000105', price: 0.10, category: 'Packaging' },
  { id: 'FEE-BAG-02', name: 'Premium Eco Shopping Bag', nameKh: 'ថង់បរិស្ថានក្រណាត់', barcode: '2900001000204', price: 1.00, category: 'Packaging' },
  { id: 'FEE-DEL-01', name: 'City Express Delivery Fee', nameKh: 'ថ្លៃសេវាដឹកជញ្ជូនរហ័ស', barcode: '2900001000303', price: 2.00, category: 'Services' },
  { id: 'FEE-ICE-01', name: 'Party Ice Bag 5kg', nameKh: 'ទឹកកកអនាម័យ ៥គីឡូ', barcode: '2900001000402', price: 0.75, category: 'Consumables' },
  { id: 'FEE-GIFT-01', name: 'Luxury Gift Box & Wrap', nameKh: 'សេវារៀបចំប្រអប់កាដូ', barcode: '2900001000501', price: 1.50, category: 'Services' },
  { id: 'FEE-DISC-05', name: '$0.50 Instant Cash Voucher', nameKh: 'ប័ណ្ណបញ្ចុះតម្លៃ $0.50', barcode: '2900001000600', price: -0.50, category: 'Promotions' },
];

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onScanProduct,
  playScanBeep,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'smartphone' | 'shelf' | 'cheatsheet' | 'manual'>('camera');
  const [scanMultiplier, setScanMultiplier] = useState<number>(1);
  const [beepTone, setBeepTone] = useState<'standard' | 'double' | 'soft' | 'muted'>('standard');
  const [manualInput, setManualInput] = useState('');
  
  // Continuous Camera State
  const [isContinuousMode, setIsContinuousMode] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorchSupport, setHasTorchSupport] = useState(false);
  const [lastDetectedFlash, setLastDetectedFlash] = useState<string | null>(null);
  const [activeEngine, setActiveEngine] = useState<'native' | 'zxing'>('zxing');

  // Unregistered Barcode Handling (Immediate cashier feedback when camera sees new item)
  const [unmatchedBarcode, setUnmatchedBarcode] = useState<{ barcode: string; time: string } | null>(null);
  const [quickItemPrice, setQuickItemPrice] = useState<string>('1.00');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignProductId, setAssignProductId] = useState<number | ''>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Smartphone Wireless Scanner State
  const [mobileHost, setMobileHost] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return '192.168.1.84';
      }
      return hostname;
    }
    return '192.168.1.84';
  });
  const [mobilePort, setMobilePort] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.port || '3000';
    }
    return '3000';
  });
  const [mobileProtocol, setMobileProtocol] = useState<'https:' | 'http:'>(() => {
    if (typeof window !== 'undefined' && window.location.protocol === 'http:') {
      return 'https:';
    }
    return (typeof window !== 'undefined' ? window.location.protocol : 'https:') as 'https:' | 'http:';
  });
  const [mobileQrDataUrl, setMobileQrDataUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Scan History
  const [lastScanned, setLastScanned] = useState<{ product: Product; quantity: number; time: string } | null>(null);
  const [scanHistory, setScanHistory] = useState<Array<{ name: string; barcode: string; quantity: number; price: number; time: string }>>([]);

  // Refs for continuous decoding
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const nativeDetectionAnimRef = useRef<number | null>(null);
  const lastScanTimestampRef = useRef<number>(0);
  const lastBarcodeRef = useRef<string>('');
  const scanMultiplierRef = useRef<number>(scanMultiplier);
  scanMultiplierRef.current = scanMultiplier;

  // Generate Smartphone Connection QR Code
  useEffect(() => {
    const fullUrl = `${mobileProtocol}//${mobileHost.trim()}:${mobilePort.trim()}/`;
    QRCode.toDataURL(fullUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setMobileQrDataUrl(url))
      .catch((err) => console.error('Failed to generate Smartphone QR Code', err));
  }, [mobileHost, mobilePort, mobileProtocol]);

  // Haptic feedback for smartphones (physical vibration buzz)
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([80, 40, 80]);
      } catch {}
    }
  };

  // Synthesize sound based on chosen tone
  const triggerAudioBeep = () => {
    if (beepTone === 'muted') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (beepTone === 'double') {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.frequency.setValueAtTime(1200, now);
        gain1.gain.setValueAtTime(0.15, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.06);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.frequency.setValueAtTime(1600, now + 0.08);
        gain2.gain.setValueAtTime(0.18, now + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.16);
      } else if (beepTone === 'soft') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(587.33, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.14);
      } else {
        playScanBeep();
      }
    } catch {
      playScanBeep();
    }
  };

  // Generate realistic barcode SVG stripes
  const renderBarcodeSvg = (code: string) => {
    const bars: boolean[] = [];
    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i);
      bars.push(true, (charCode % 2 === 0), (charCode % 3 === 0), false, (charCode % 5 === 0));
    }
    bars.push(true, false, true);

    return (
      <svg className="w-full h-9" viewBox={`0 0 ${bars.length * 3} 30`} preserveAspectRatio="none">
        {bars.map((isDark, idx) =>
          isDark ? (
            <rect key={idx} x={idx * 3} y="0" width="2.2" height="30" fill="#0f172a" />
          ) : null
        )}
      </svg>
    );
  };

  // List camera devices & detect rear camera
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return;
    }
    BrowserCodeReader.listVideoInputDevices()
      .then((devices) => {
        setAvailableDevices(devices);
        if (devices.length > 0 && !selectedDeviceId) {
          // Prefer back/environment camera if available (best for phone barcode scanning)
          const backCam = devices.find((d) => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') || 
            d.label.toLowerCase().includes('environment')
          );
          setSelectedDeviceId(backCam ? backCam.deviceId : devices[0].deviceId);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // CONTINUOUS CAMERA SCANNER ENGINE (Dual Engine: Native Chromium BarcodeDetector + ZXing with TRY_HARDER)
  const startContinuousScanner = async () => {
    setCameraError(null);
    if (!videoRef.current) return;

    // Check for Secure Context / getUserMedia availability
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('SECURE_CONTEXT_REQUIRED');
      setIsCameraActive(false);
      return;
    }

    try {
      // 1. Prepare ZXing MultiFormatReader with TRY_HARDER & Broad 1D/2D Formats
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
          BarcodeFormat.CODABAR,
          BarcodeFormat.DATA_MATRIX,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);
        codeReaderRef.current = new BrowserMultiFormatReader(hints);
      }

      // Stop previous instance if running
      if (scannerControlsRef.current) {
        scannerControlsRef.current.stop();
        scannerControlsRef.current = null;
      }
      if (nativeDetectionAnimRef.current) {
        cancelAnimationFrame(nativeDetectionAnimRef.current);
        nativeDetectionAnimRef.current = null;
      }

      const reader = codeReaderRef.current;
      let controls: IScannerControls;

      if (selectedDeviceId) {
        controls = await reader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result, error) => {
            if (result) {
              handleContinuousDetectedBarcode(result.getText());
            }
          }
        );
      } else {
        // High-definition autofocus constraints for mobile rear camera
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: cameraFacing },
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
          },
        };
        controls = await reader.decodeFromConstraints(
          constraints,
          videoRef.current,
          (result, error) => {
            if (result) {
              handleContinuousDetectedBarcode(result.getText());
            }
          }
        );
      }

      scannerControlsRef.current = controls;
      setIsCameraActive(true);

      // Force video play for mobile Safari/Chrome
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }

      // Check for torch & continuous autofocus capability on mobile
      try {
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
          const track = stream.getVideoTracks()[0];
          const capabilities = (track as any).getCapabilities ? (track as any).getCapabilities() : {};
          setHasTorchSupport(!!capabilities.torch);

          // Apply continuous focus if available on smartphone camera hardware
          if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
            await (track as any).applyConstraints({
              advanced: [{ focusMode: 'continuous' }],
            });
          }
        }
      } catch {}

      // 2. ACTIVATE SECONDARY ACCELERATOR: Native Browser BarcodeDetector (Supported on Android Chrome)
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          const nativeDetector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code', 'itf'],
          });
          setActiveEngine('native');

          const loopNativeDetection = async () => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
              try {
                const barcodes = await nativeDetector.detect(videoRef.current);
                if (barcodes && barcodes.length > 0) {
                  const raw = barcodes[0].rawValue;
                  if (raw) {
                    handleContinuousDetectedBarcode(raw);
                  }
                }
              } catch {}
            }
            nativeDetectionAnimRef.current = requestAnimationFrame(loopNativeDetection);
          };

          nativeDetectionAnimRef.current = requestAnimationFrame(loopNativeDetection);
        } catch {
          setActiveEngine('zxing');
        }
      } else {
        setActiveEngine('zxing');
      }
    } catch (err: any) {
      console.error('Continuous scanner error', err);
      setCameraError(err.message || 'Unable to start camera scanner. Please grant camera permissions.');
      setIsCameraActive(false);
    }
  };

  const stopContinuousScanner = () => {
    if (nativeDetectionAnimRef.current) {
      cancelAnimationFrame(nativeDetectionAnimRef.current);
      nativeDetectionAnimRef.current = null;
    }
    if (scannerControlsRef.current) {
      scannerControlsRef.current.stop();
      scannerControlsRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Flip Camera (Front vs Back or Cycle Devices)
  const handleFlipCamera = () => {
    if (availableDevices.length > 1) {
      const currentIdx = availableDevices.findIndex((d) => d.deviceId === selectedDeviceId);
      const nextIdx = (currentIdx + 1) % availableDevices.length;
      setSelectedDeviceId(availableDevices[nextIdx].deviceId);
    } else {
      setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
      setSelectedDeviceId('');
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

  // Lifecycle control for camera
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startContinuousScanner();
    } else {
      stopContinuousScanner();
    }
    return () => {
      stopContinuousScanner();
    };
  }, [isOpen, activeTab, selectedDeviceId, cameraFacing]);

  // Handle continuous barcode detection with duplicate suppression & immediate feedback
  const handleContinuousDetectedBarcode = (barcodeStr: string) => {
    const raw = barcodeStr.trim();
    if (!raw) return;

    const now = Date.now();
    const isSameBarcode = raw === lastBarcodeRef.current;
    const timeSinceLast = now - lastScanTimestampRef.current;

    // Smart Debounce: If same barcode, require 1500ms cooldown. If different barcode, scan immediately!
    if (isSameBarcode && timeSinceLast < 1500) {
      return;
    }

    lastBarcodeRef.current = raw;
    lastScanTimestampRef.current = now;

    // Trigger visual reticle flash & tactile haptic vibration immediately!
    setLastDetectedFlash(raw);
    triggerAudioBeep();
    triggerHaptic();
    setTimeout(() => setLastDetectedFlash(null), 1200);

    const success = handleMatchBarcode(raw);

    if (success && !isContinuousMode) {
      onClose();
    }
  };

  // Resolve barcode string to catalog product or cheatsheet
  const handleMatchBarcode = (barcodeStr: string) => {
    const raw = barcodeStr.trim();
    if (!raw) return false;

    // Check for quantity multiplier prefix (e.g. "5*8850123456781" or "12*BEV-001")
    let targetBarcode = raw;
    let qty = scanMultiplierRef.current;
    if (raw.includes('*')) {
      const parts = raw.split('*');
      const parsedQty = parseInt(parts[0], 10);
      if (!isNaN(parsedQty) && parsedQty > 0) {
        qty = parsedQty;
        targetBarcode = parts.slice(1).join('*').trim();
      }
    }

    const clean = targetBarcode.toLowerCase();

    // 1. Check in regular catalog products
    const matched = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === clean) ||
        p.sku.toLowerCase() === clean ||
        p.name.toLowerCase() === clean ||
        p.name.toLowerCase().includes(clean)
    );

    if (matched) {
      onScanProduct(matched, qty);
      setUnmatchedBarcode(null);
      const entry = {
        product: matched,
        quantity: qty,
        time: new Date().toLocaleTimeString(),
      };
      setLastScanned(entry);
      setScanHistory((prev) => [
        {
          name: matched.name,
          barcode: matched.barcode || matched.sku,
          quantity: qty,
          price: Number(matched.selling_price) * qty,
          time: entry.time,
        },
        ...prev.slice(0, 14),
      ]);
      setManualInput('');
      return true;
    }

    // 2. Check in Cheatsheet items
    const cheatsheetMatch = COMMON_CHEATSHEET_ITEMS.find(
      (c) => c.barcode.toLowerCase() === clean || c.id.toLowerCase() === clean || c.name.toLowerCase().includes(clean)
    );

    if (cheatsheetMatch) {
      const pseudoProduct: Product = {
        id: 9000 + Math.abs(cheatsheetMatch.id.length * 17),
        sku: cheatsheetMatch.id,
        barcode: cheatsheetMatch.barcode,
        name: cheatsheetMatch.name,
        selling_price: cheatsheetMatch.price,
        cost_price: cheatsheetMatch.price * 0.5,
        category: { id: 99, name: cheatsheetMatch.category },
        unit: { id: 1, name: 'unit', symbol: 'unit' },
        available_quantity: 999,
        status_id: 1,
      };

      onScanProduct(pseudoProduct, qty);
      setUnmatchedBarcode(null);
      const entry = {
        product: pseudoProduct,
        quantity: qty,
        time: new Date().toLocaleTimeString(),
      };
      setLastScanned(entry);
      setScanHistory((prev) => [
        {
          name: cheatsheetMatch.name,
          barcode: cheatsheetMatch.barcode,
          quantity: qty,
          price: cheatsheetMatch.price * qty,
          time: entry.time,
        },
        ...prev.slice(0, 14),
      ]);
      setManualInput('');
      return true;
    }

    // 3. UNREGISTERED BARCODE DETECTED! (Camera successfully read barcode, but product not in DB yet)
    setUnmatchedBarcode({
      barcode: raw,
      time: new Date().toLocaleTimeString(),
    });

    return false;
  };

  // Cashier quick action: Assign barcode to an existing product in database
  const handleAssignBarcodeToProduct = async () => {
    if (!unmatchedBarcode || !assignProductId) return;
    setIsAssigning(true);
    try {
      const res = await axios.post('/api/v1/barcode/assign', {
        product_id: assignProductId,
        barcode: unmatchedBarcode.barcode,
      });

      if (res.data.success) {
        const prod = products.find((p) => p.id === assignProductId);
        if (prod) {
          prod.barcode = unmatchedBarcode.barcode;
          onScanProduct(prod, scanMultiplier);
          setLastScanned({
            product: prod,
            quantity: scanMultiplier,
            time: new Date().toLocaleTimeString(),
          });
        }
        setIsAssignModalOpen(false);
        setUnmatchedBarcode(null);
        setAssignProductId('');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign barcode to product.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Cashier quick action: Add unrecognized barcode directly to cart as a temporary custom item
  const handleQuickAddUnregistered = () => {
    if (!unmatchedBarcode) return;
    const priceNum = parseFloat(quickItemPrice) || 1.00;
    const customProduct: Product = {
      id: 88000 + Math.floor(Math.random() * 9000),
      sku: `BC-${unmatchedBarcode.barcode.slice(-6)}`,
      barcode: unmatchedBarcode.barcode,
      name: `Custom Item (${unmatchedBarcode.barcode})`,
      selling_price: priceNum,
      cost_price: priceNum * 0.7,
      category: { id: 98, name: 'General Merchandise' },
      unit: { id: 1, name: 'unit', symbol: 'unit' },
      available_quantity: 999,
      status_id: 1,
    };

    onScanProduct(customProduct, scanMultiplier);
    const entry = {
      product: customProduct,
      quantity: scanMultiplier,
      time: unmatchedBarcode.time,
    };
    setLastScanned(entry);
    setScanHistory((prev) => [
      {
        name: customProduct.name,
        barcode: customProduct.barcode || customProduct.sku,
        quantity: scanMultiplier,
        price: priceNum * scanMultiplier,
        time: entry.time,
      },
      ...prev.slice(0, 14),
    ]);
    setUnmatchedBarcode(null);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const found = handleMatchBarcode(manualInput);
    if (!found) {
      setUnmatchedBarcode({
        barcode: manualInput.trim(),
        time: new Date().toLocaleTimeString(),
      });
    }
  };

  const handleSimulateScan = (product: Product) => {
    onScanProduct(product, scanMultiplier);
    triggerAudioBeep();
    triggerHaptic();
    const entry = {
      product,
      quantity: scanMultiplier,
      time: new Date().toLocaleTimeString(),
    };
    setLastScanned(entry);
    setScanHistory((prev) => [
      {
        name: product.name,
        barcode: product.barcode || product.sku,
        quantity: scanMultiplier,
        price: Number(product.selling_price) * scanMultiplier,
        time: entry.time,
      },
      ...prev.slice(0, 14),
    ]);
  };

  const handleSimulateCheatsheetScan = (item: CheatsheetItem) => {
    handleMatchBarcode(item.barcode);
  };

  const handleCopyMobileUrl = () => {
    const fullUrl = `${mobileProtocol}//${mobileHost.trim()}:${mobilePort.trim()}/`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const totalSessionScansCount = useMemo(() => {
    return scanHistory.reduce((sum, it) => sum + it.quantity, 0);
  }, [scanHistory]);

  const totalSessionScansAmount = useMemo(() => {
    return scanHistory.reduce((sum, it) => sum + it.price, 0);
  }, [scanHistory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-gray-900">Live Camera Barcode Scanner</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  {activeEngine === 'native' ? 'HARDWARE AI SCANNER' : 'ZXing ENGINE ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Continuous real-time barcode decoding (EAN-13, EAN-8, Code 128, UPC, QR).
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

        {/* Controls Toolbar: Multiplier, Sound, Continuous Toggle */}
        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80 my-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Continuous Mode Switch */}
          <div className="flex items-center space-x-2 pl-1">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isContinuousMode}
                onChange={(e) => setIsContinuousMode(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <RefreshCw className={`w-3.5 h-3.5 ${isContinuousMode ? 'text-emerald-600 animate-spin' : 'text-slate-400'}`} style={{ animationDuration: '4s' }} />
                Continuous Scan Mode
              </span>
            </label>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-semibold">
              Rapid
            </span>
          </div>

          {/* Quantity Multiplier */}
          <div className="flex items-center space-x-1">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider pl-1">
              Quantity:
            </span>
            {[1, 2, 5, 10, 24].map((mult) => (
              <button
                key={mult}
                type="button"
                onClick={() => setScanMultiplier(mult)}
                className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition ${
                  scanMultiplier === mult
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                x{mult}
              </button>
            ))}
          </div>

          {/* Audio Beep Selector */}
          <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 pl-1 pr-1 flex items-center gap-1">
              {beepTone === 'muted' ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-600" />}
              Beep:
            </span>
            {(['standard', 'double', 'soft', 'muted'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setBeepTone(t)}
                className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold capitalize transition ${
                  beepTone === t ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="flex space-x-1.5 sm:space-x-2 pb-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('camera')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shrink-0 ${
              activeTab === 'camera'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live Camera</span>
          </button>

          <button
            onClick={() => setActiveTab('smartphone')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shrink-0 ${
              activeTab === 'smartphone'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
            <span>Connect Smartphone</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          <button
            onClick={() => setActiveTab('shelf')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shrink-0 ${
              activeTab === 'shelf'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Product Shelf</span>
          </button>

          <button
            onClick={() => setActiveTab('cheatsheet')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shrink-0 ${
              activeTab === 'cheatsheet'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Cheatsheet</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shrink-0 ${
              activeTab === 'manual'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-purple-400" />
            <span>Direct Entry</span>
          </button>
        </div>

        {/* Real-time Last Scanned Feedback Toast */}
        {lastScanned && (
          <div className="my-1.5 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shrink-0 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                ✓
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-emerald-950 block truncate">
                  Scanned: {lastScanned.quantity > 1 ? `${lastScanned.quantity}x ` : ''}{lastScanned.product.name}
                </span>
                <span className="text-[11px] font-mono text-emerald-700">
                  Code: {lastScanned.product.barcode || lastScanned.product.sku} | Subtotal: ${(Number(lastScanned.product.selling_price) * lastScanned.quantity).toFixed(2)} USD
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold shadow-xs shrink-0">
              +{lastScanned.quantity} in Cart
            </span>
          </div>
        )}

        {/* Unmatched Barcode Alert Banner (Camera read the barcode, but item is new) */}
        {unmatchedBarcode && (
          <div className="my-1.5 p-3 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shrink-0 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-950 block">
                  Barcode Detected: <span className="font-mono text-amber-900 bg-amber-200/70 px-1.5 py-0.5 rounded font-bold">{unmatchedBarcode.barcode}</span>
                </span>
                <span className="text-[11px] text-amber-800">
                  Camera successfully recognized this barcode, but it is not registered in the catalog yet.
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
              <div className="flex items-center bg-white rounded-xl border border-amber-300 px-2 py-1">
                <span className="text-xs font-bold text-slate-500 mr-1">$</span>
                <input
                  type="number"
                  step="0.25"
                  value={quickItemPrice}
                  onChange={(e) => setQuickItemPrice(e.target.value)}
                  className="w-14 text-xs font-bold text-slate-900 focus:outline-none"
                  placeholder="1.00"
                />
              </div>
              <button
                type="button"
                onClick={handleQuickAddUnregistered}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAssignModalOpen(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Link to Product</span>
              </button>
              <button
                type="button"
                onClick={() => setUnmatchedBarcode(null)}
                className="p-1 text-amber-600 hover:text-amber-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Tab Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 py-1">
          {/* TAB 1: LIVE CAMERA SCANNER (Continuous Detection Engine) */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              {/* Camera Selection & Action Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 p-2 rounded-2xl text-xs">
                <div className="flex items-center space-x-2">
                  <Video className="w-4 h-4 text-slate-500" />
                  {availableDevices.length > 1 ? (
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => setSelectedDeviceId(e.target.value)}
                      className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-[200px] truncate"
                    >
                      {availableDevices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || `Camera ${d.deviceId.slice(0, 5)}...`}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-semibold text-slate-700">
                      Camera: {cameraFacing === 'environment' ? 'Rear (Back Camera)' : 'Front (Selfie)'}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1.5">
                  {/* Flip / Switch Camera Button (Front vs Back) */}
                  <button
                    type="button"
                    onClick={handleFlipCamera}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold text-xs shadow-2xs transition"
                    title="Switch between front and back cameras"
                  >
                    <SwitchCamera className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Flip Camera</span>
                  </button>

                  {/* Hardware Torch / Flashlight Toggle (for Phones) */}
                  {hasTorchSupport && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-bold transition shadow-2xs ${
                        isTorchOn
                          ? 'bg-amber-500 text-white shadow-amber-200'
                          : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
                      }`}
                      title="Turn smartphone flashlight on/off"
                    >
                      <Flashlight className={`w-3.5 h-3.5 ${isTorchOn ? 'text-white' : 'text-amber-500'}`} />
                      <span>{isTorchOn ? 'Torch On' : 'Torch'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Viewfinder Viewport with Animated Scanner Line */}
              <div className="relative max-w-md mx-auto aspect-4/3 bg-black rounded-3xl overflow-hidden shadow-xl border-2 border-slate-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />

                {/* Reticle / Viewfinder Frame */}
                <div
                  className={`absolute inset-8 sm:inset-10 border-2 rounded-2xl pointer-events-none transition-all duration-300 flex items-center justify-center ${
                    lastDetectedFlash
                      ? 'border-emerald-400 bg-emerald-500/25 shadow-[0_0_30px_rgba(16,185,129,0.8)]'
                      : 'border-dashed border-emerald-400/80'
                  }`}
                >
                  {/* Corner Guides */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white"></div>
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white"></div>
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white"></div>

                  {/* Laser Scan Line (Sweeps continuously) */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_10px_rgba(239,68,68,0.9)] animate-pulse"></div>
                </div>

                {/* Realtime Detection Overlay Banner */}
                {lastDetectedFlash && (
                  <div className="absolute bottom-4 inset-x-4 bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold text-center shadow-lg animate-in slide-in-from-bottom-2 z-10 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Recognized Barcode: {lastDetectedFlash}</span>
                  </div>
                )}

                {/* Session Scans Live Pill */}
                {totalSessionScansCount > 0 && (
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-full text-[11px] font-bold font-mono flex items-center space-x-1.5 border border-white/20 z-10">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{totalSessionScansCount} items (${totalSessionScansAmount.toFixed(2)})</span>
                  </div>
                )}

                {/* Live Scanning Status Badge */}
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono flex items-center space-x-1.5 border border-white/15 z-10">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>SCANNING LIVE</span>
                </div>

                {/* Camera Error / Secure Context HTTPS Prompt */}
                {cameraError && (
                  <div className="absolute inset-0 bg-slate-950/95 p-5 flex flex-col items-center justify-center text-center text-white z-20 animate-in fade-in duration-200">
                    {cameraError === 'SECURE_CONTEXT_REQUIRED' ? (
                      <div className="flex flex-col items-center max-w-sm">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2.5 border border-amber-500/30 shadow-lg">
                          <Lock className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-sm text-white mb-1">HTTPS Required for Phone Camera</h3>
                        <p className="text-[11px] text-slate-300 mb-3.5 leading-relaxed">
                          Mobile browsers (Android Chrome & iPhone Safari) block camera access over plain HTTP (<span className="font-mono text-amber-300">http://192.168.1.84:3000</span>).
                          Tap below to open securely via HTTPS:
                        </p>

                        <div className="flex flex-col gap-2 w-full mb-3">
                          <a
                            href={`https://${mobileHost}:${mobilePort}/`}
                            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Switch to HTTPS (https://{mobileHost}:{mobilePort})</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => setActiveTab('smartphone')}
                            className="w-full py-2 px-3 bg-white/10 hover:bg-white/20 text-indigo-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>Scan QR Code Setup Hub</span>
                          </button>
                        </div>

                        <div className="text-[10px] text-slate-400 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-left space-y-1">
                          <div className="flex items-center gap-1 text-amber-400 font-bold">
                            <Info className="w-3 h-3 shrink-0" />
                            <span>How to bypass the SSL warning on Android:</span>
                          </div>
                          <p>
                            When opening HTTPS, Chrome shows <em>"Your connection is not private"</em>. Simply tap <strong>Advanced</strong> &rarr; tap <strong>Proceed to 192.168.1.84 (unsafe)</strong>.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <CameraOff className="w-10 h-10 text-rose-500 mb-2" />
                        <p className="font-bold text-sm text-rose-400 mb-1">Camera Permission or Device Error</p>
                        <p className="text-xs text-slate-300 max-w-xs mb-3">{cameraError}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={startContinuousScanner}
                            className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
                          >
                            Try Again
                          </button>
                          <button
                            onClick={() => setActiveTab('smartphone')}
                            className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
                          >
                            Connect Smartphone
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Aiming Guidance Pill */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-slate-700">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hold barcode 15-20 cm away. Keep barcode horizontal inside the green box.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('shelf')}
                  className="text-emerald-700 font-bold hover:underline shrink-0 text-[11px] ml-2 flex items-center gap-1"
                >
                  <Barcode className="w-3.5 h-3.5" />
                  Test Samples
                </button>
              </div>

              {/* Quick On-Screen Barcode Target Strip (For rapid phone camera testing) */}
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                    Point Phone Camera at these Sample Barcodes to Test:
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">Tap to simulate</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {products.slice(0, 3).map((p) => {
                    const bc = p.barcode || p.sku;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleMatchBarcode(bc)}
                        className="bg-white p-2 rounded-xl border border-emerald-200 shadow-2xs hover:border-emerald-400 cursor-pointer text-center group"
                      >
                        <span className="block text-[11px] font-bold text-slate-800 truncate mb-1">
                          {p.name}
                        </span>
                        <div className="bg-slate-50 p-1 rounded border border-slate-100 mb-1">
                          {renderBarcodeSvg(bc)}
                        </div>
                        <span className="text-[10px] font-mono text-emerald-700 font-bold block">
                          {bc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONNECT SMARTPHONE SCANNER (QR Pairing Hub) */}
          {activeTab === 'smartphone' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-5 text-white shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Use Your Smartphone as a Wireless Barcode Scanner</h3>
                      <p className="text-xs text-indigo-200">No hardware scanner needed. Scan items anywhere on the sales floor.</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> Store Wi-Fi Sync
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Card: Dynamic QR Code */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 flex flex-col items-center text-center shadow-xs">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-indigo-600" />
                    Scan with iPhone / Android Camera
                  </span>

                  {/* QR Code Canvas Frame */}
                  <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-200 mb-3">
                    {mobileQrDataUrl ? (
                      <img
                        src={mobileQrDataUrl}
                        alt="Mobile POS Scanner QR"
                        className="w-48 h-48 sm:w-52 sm:h-52 rounded-lg"
                      />
                    ) : (
                      <div className="w-48 h-48 sm:w-52 sm:h-52 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                        Generating QR...
                      </div>
                    )}
                  </div>

                  {/* Protocol Selector & Network Address Details */}
                  <div className="w-full flex items-center justify-center gap-1.5 mb-2.5">
                    <span className="text-[11px] font-bold text-slate-500">Protocol:</span>
                    <button
                      type="button"
                      onClick={() => setMobileProtocol('https:')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                        mobileProtocol === 'https:'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>HTTPS (Camera Enabled)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileProtocol('http:')}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${
                        mobileProtocol === 'http:'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>HTTP</span>
                    </button>
                  </div>

                  <div className="w-full bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs mb-3 shadow-2xs">
                    <span className="font-mono text-slate-800 font-bold truncate flex items-center gap-1.5">
                      {mobileProtocol === 'https:' ? <Lock className="w-3.5 h-3.5 text-emerald-600" /> : null}
                      {mobileProtocol}//{mobileHost}:{mobilePort}/
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyMobileUrl}
                      className="ml-2 px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-lg font-bold flex items-center gap-1 transition shrink-0"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Network IP Config Collapsible / Inputs */}
                  <div className="w-full text-left pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-700">Network Server Settings:</span>
                      <span className="text-[10px] text-indigo-600 font-semibold">Wi-Fi Host IP</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={mobileHost}
                          onChange={(e) => setMobileHost(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                          placeholder="192.168.1.84"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={mobilePort}
                          onChange={(e) => setMobilePort(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                          placeholder="3000"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Card: Step-by-Step Instructions & Permissions Guide */}
                <div className="space-y-3 flex flex-col justify-between">
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xs space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      3-Step Smartphone Quick Setup
                    </h4>

                    <div className="space-y-2.5 text-xs text-slate-600">
                      <div className="flex items-start space-x-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                          1
                        </span>
                        <div>
                          <strong className="text-slate-800">Connect to Store Wi-Fi:</strong>
                          <p className="text-[11px] text-slate-500">Ensure your phone and this computer are connected to the same Wi-Fi router.</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                          2
                        </span>
                        <div>
                          <strong className="text-slate-800">Scan the QR Code:</strong>
                          <p className="text-[11px] text-slate-500">Open Camera on iPhone or Chrome on Android and tap the popup link.</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                          3
                        </span>
                        <div>
                          <strong className="text-slate-800">Tap "Live Camera Barcode Scanner":</strong>
                          <p className="text-[11px] text-slate-500">Tap Allow when asked for Camera access. The phone camera will instantly scan items with vibration feedback!</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Browser Permissions & Security Info */}
                  <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-4 text-xs space-y-2">
                    <div className="flex items-center space-x-1.5 text-amber-900 font-bold">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Mobile Camera Permissions:</span>
                    </div>
                    <ul className="text-[11px] text-amber-800 space-y-1 pl-4 list-disc">
                      <li>
                        <strong>iPhone (Safari):</strong> Prompts <em>"Allow smartpos to use camera"</em> &rarr; tap <strong>Allow</strong>.
                      </li>
                      <li>
                        <strong>Android (Chrome):</strong> When opening HTTPS, tap <strong>Advanced</strong> &rarr; <strong>Proceed to 192.168.1.84 (unsafe)</strong>, then tap <strong>Allow</strong> for camera.
                      </li>
                      <li>
                        <strong>Haptic Feedback:</strong> Phone gives a physical vibration buzz every time a barcode is detected.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCT CATALOG SHELF (Interactive Barcode Cards) */}
          {activeTab === 'shelf' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Click any product barcode to test scanning immediately, or simulate what the camera sees.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {products.map((p) => {
                  const bc = p.barcode || p.sku;
                  return (
                    <div
                      key={p.id}
                      className="p-3 bg-white hover:bg-emerald-50/40 border border-gray-200 hover:border-emerald-300 rounded-2xl transition flex flex-col justify-between shadow-2xs group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                            {p.category?.name || 'General'}
                          </span>
                          <span className="text-xs font-bold text-emerald-700">
                            ${Number(p.selling_price).toFixed(2)}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{p.name}</h4>
                        <span className="text-[10px] text-gray-400 block mb-2">{p.sku}</span>
                      </div>

                      <div className="mt-1 pt-2 border-t border-gray-100">
                        <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200/60 mb-2">
                          {renderBarcodeSvg(bc)}
                          <span className="block text-center font-mono text-[10px] font-bold tracking-widest text-slate-700 mt-1">
                            {bc}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSimulateScan(p)}
                          className="w-full py-1.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 shadow-2xs"
                        >
                          <Play className="w-3 h-3 text-emerald-400" />
                          <span>Simulate Scan ({scanMultiplier}x)</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: COUNTER CHEATSHEET (Printable Laminated Barcodes) */}
          {activeTab === 'cheatsheet' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-blue-50 p-3 rounded-2xl border border-blue-200 text-xs">
                <div className="flex items-center space-x-2 text-blue-900">
                  <Printer className="w-4 h-4 text-blue-600" />
                  <span>Print this cheatsheet and place it next to the cash register for quick scanning.</span>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-blue-600 text-white rounded-xl font-bold shadow-xs hover:bg-blue-700 transition"
                >
                  Print Sheet
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COMMON_CHEATSHEET_ITEMS.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs hover:border-blue-400 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                          {item.category}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-800">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-gray-900">{item.name}</h4>
                      <p className="text-[11px] text-gray-500 font-khmer">{item.nameKh}</p>
                      <span className="text-[10px] font-mono text-gray-400">{item.barcode}</span>
                    </div>

                    <div className="text-right flex flex-col items-end space-y-2">
                      <div className="w-28">
                        {renderBarcodeSvg(item.barcode)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSimulateCheatsheetScan(item)}
                        className="px-3 py-1 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: DIRECT MANUAL ENTRY */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Enter or Paste Barcode / SKU / Multiplier (e.g. 5*8850123456781)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type barcode or e.g. 10*BEV-001..."
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
                  Quick Catalog Barcodes (Click to Fill & Scan):
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
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Recent Scans in this Session ({scanHistory.length}):
                </span>
                <button
                  type="button"
                  onClick={() => setScanHistory([])}
                  className="text-[10px] text-gray-400 hover:text-rose-500 font-semibold"
                >
                  Clear History
                </button>
              </div>
              <div className="space-y-1.5 max-h-28 overflow-y-auto">
                {scanHistory.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-gray-50 text-gray-700"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{entry.name}</span>
                      {entry.quantity > 1 && (
                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                          x{entry.quantity}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 font-mono text-gray-500 text-[11px]">
                      <span className="font-bold text-slate-900">${entry.price.toFixed(2)}</span>
                      <span>{entry.barcode}</span>
                      <span className="text-gray-400">{entry.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      {/* Link Barcode to Catalog Product Dialog */}
      {isAssignModalOpen && unmatchedBarcode && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Link2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-gray-900">Link Barcode to Product</h3>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
              <span className="text-slate-500 block mb-1">Scanned Barcode:</span>
              <span className="font-mono text-slate-900 font-bold text-sm bg-white px-2 py-1 rounded-lg border border-slate-200 inline-block">
                {unmatchedBarcode.barcode}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Choose Product from Catalog:
              </label>
              <select
                value={assignProductId}
                onChange={(e) => setAssignProductId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500"
              >
                <option value="">-- Select a Product to Assign --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) {p.barcode ? `[current: ${p.barcode}]` : '[No Barcode]'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!assignProductId || isAssigning}
                onClick={handleAssignBarcodeToProduct}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                {isAssigning ? 'Saving...' : 'Save & Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Footer */}
        <div className="pt-3.5 border-t border-gray-100 flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-400 flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-emerald-600" />
            <span>Audio tone: <strong className="text-slate-700 capitalize">{beepTone}</strong></span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            Done & Return to POS
          </button>
        </div>
      </div>
    </div>
  );
};
