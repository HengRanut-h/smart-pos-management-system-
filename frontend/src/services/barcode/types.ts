export type ScanSource = 'hardware' | 'camera' | 'manual' | 'qr';

export interface ScanResult {
  value: string;
  format?: string;
  source: ScanSource;
  timestamp: number;
  multiplier?: number;
}

export type ScanListener = (result: ScanResult) => void;

export interface BarcodeLookupResult {
  success: boolean;
  match_type?: 'package_barcode' | 'primary_barcode' | 'sku';
  barcode?: string;
  package_type?: 'PIECE' | 'PACK' | 'CARTON' | 'BOX' | 'PALLET' | string;
  multiplier: number;
  custom_price?: number | null;
  effective_price: number;
  notes?: string | null;
  data?: any;
  message?: string;
}

export interface ScannerCameraDevice {
  deviceId: string;
  label: string;
  isBackCamera: boolean;
}

export interface ScannerStatusState {
  hardwareListening: boolean;
  cameraActive: boolean;
  soundEnabled: boolean;
  lastScan: ScanResult | null;
}
