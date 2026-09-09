import { apiClient } from '../../data-access/apiClient';
import { hardwareScanner, HardwareScanner, ScannerDebugInfo } from './HardwareScanner';
import { cameraScanner, CameraScanner } from './CameraScanner';
import {
  BarcodeLookupResult,
  ScanListener,
  ScanResult,
  ScannerStatusState,
} from './types';

class BarcodeScannerService {
  private scanListeners: Set<ScanListener> = new Set();
  private statusListeners: Set<(status: ScannerStatusState) => void> = new Set();
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private lastScan: ScanResult | null = null;
  private lastHandledCode: string = '';
  private lastHandledTime: number = 0;
  private initialized: boolean = false;

  public init(): void {
    if (this.initialized) return;

    // Connect hardware scanner
    hardwareScanner.start();
    hardwareScanner.addListener(this.handleScanEvent);

    // Connect camera scanner
    cameraScanner.addListener(this.handleScanEvent);

    this.initialized = true;
    this.notifyStatusChange();
  }

  public destroy(): void {
    hardwareScanner.removeListener(this.handleScanEvent);
    hardwareScanner.stop();
    cameraScanner.removeListener(this.handleScanEvent);
    cameraScanner.stop();
    this.initialized = false;
    this.notifyStatusChange();
  }

  private handleScanEvent = (result: ScanResult) => {
    const now = Date.now();
    // Debounce duplicate events fired across listeners within 400ms
    if (result.value === this.lastHandledCode && now - this.lastHandledTime < 400) {
      return;
    }
    this.lastHandledCode = result.value;
    this.lastHandledTime = now;

    this.lastScan = result;
    this.playBeep();
    this.triggerHaptic();

    // Dispatch to registered subscribers
    for (const listener of this.scanListeners) {
      try {
        listener(result);
      } catch (err) {
        console.error('[BarcodeScannerService] Scan listener error:', err);
      }
    }

    this.notifyStatusChange();
  };

  /**
   * Manually trigger a scan event (e.g. from search bar or manual code input)
   */
  public triggerManualScan(code: string, multiplier: number = 1): void {
    const result: ScanResult = {
      value: code.trim(),
      source: 'manual',
      timestamp: Date.now(),
      multiplier,
    };
    this.handleScanEvent(result);
  }

  /**
   * Sound feedback: Crystal-clear POS scanner chime using Web Audio API
   */
  public playBeep(frequency: number = 1200, durationMs: number = 80): void {
    if (!this.soundEnabled || typeof window === 'undefined') return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + durationMs / 1000);
    } catch (e) {
      // Audio might be blocked before first user gesture
    }
  }

  /**
   * Mobile haptic vibration feedback
   */
  public triggerHaptic(durationMs: number = 40): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([durationMs]);
      } catch {}
    }
  }

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    this.notifyStatusChange();
    return this.soundEnabled;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    this.notifyStatusChange();
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Look up product via backend Laravel API
   * Supports: primary barcode, SKU, packaging barcodes (packs, cartons, boxes)
   */
  public async lookupBarcode(code: string): Promise<BarcodeLookupResult> {
    const trimmed = code.trim();
    if (!trimmed) {
      return { success: false, multiplier: 1, effective_price: 0, message: 'Empty barcode' };
    }

    try {
      const res = await apiClient.get(`/products/barcode/${encodeURIComponent(trimmed)}`);
      const data = res.data;
      return {
        success: true,
        match_type: data.match_type,
        barcode: data.barcode,
        package_type: data.package_type || 'PIECE',
        multiplier: data.multiplier || 1,
        custom_price: data.custom_price,
        effective_price: data.effective_price,
        notes: data.notes,
        data: data.data,
      };
    } catch (err: any) {
      return {
        success: false,
        multiplier: 1,
        effective_price: 0,
        message: err.response?.data?.message || err.message || `Product not found for barcode: ${trimmed}`,
      };
    }
  }

  /**
   * Look up product by SKU via backend Laravel API
   */
  public async lookupSku(sku: string): Promise<BarcodeLookupResult> {
    const trimmed = sku.trim();
    if (!trimmed) {
      return { success: false, multiplier: 1, effective_price: 0, message: 'Empty SKU' };
    }

    try {
      const res = await apiClient.get(`/products/sku/${encodeURIComponent(trimmed)}`);
      const data = res.data;
      return {
        success: true,
        match_type: 'sku',
        package_type: data.package_type || 'PIECE',
        multiplier: data.multiplier || 1,
        effective_price: data.effective_price,
        data: data.data,
      };
    } catch (err: any) {
      return {
        success: false,
        multiplier: 1,
        effective_price: 0,
        message: err.response?.data?.message || err.message || `Product not found for SKU: ${trimmed}`,
      };
    }
  }

  /**
   * Subscribe to incoming scan events (from USB laser, camera, or manual)
   */
  public onScan(listener: ScanListener): () => void {
    this.scanListeners.add(listener);
    return () => this.scanListeners.delete(listener);
  }

  /**
   * Subscribe to scanner status changes
   */
  public onStatusChange(listener: (status: ScannerStatusState) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.getStatus());
    return () => this.statusListeners.delete(listener);
  }

  public getStatus(): ScannerStatusState {
    return {
      hardwareListening: hardwareScanner.isActive,
      cameraActive: cameraScanner.active,
      soundEnabled: this.soundEnabled,
      lastScan: this.lastScan,
    };
  }

  public getHardwareDebugInfo(): ScannerDebugInfo | null {
    return hardwareScanner.getDebugInfo();
  }

  private notifyStatusChange(): void {
    const state = this.getStatus();
    for (const listener of this.statusListeners) {
      try {
        listener(state);
      } catch (err) {
        console.error('[BarcodeScannerService] Status listener error:', err);
      }
    }
  }

  public get hardware(): HardwareScanner {
    return hardwareScanner;
  }

  public get camera(): CameraScanner {
    return cameraScanner;
  }
}

export const barcodeScannerService = new BarcodeScannerService();
