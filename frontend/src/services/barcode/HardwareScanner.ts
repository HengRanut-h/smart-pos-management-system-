import { ScanListener, ScanResult } from './types';

export interface ScannerDebugInfo {
  barcode: string;
  charCount: number;
  durationMs: number;
  avgIntervalMs: number;
  suffix: 'Enter' | 'Tab' | 'IdleTimeout';
  timestamp: number;
}

/**
 * HardwareScanner listens globally for keystrokes emitted by USB, Bluetooth,
 * or HID laser/CCD barcode scanners.
 * 
 * Supports:
 * - Ultra-fast USB scanners (<10ms per key)
 * - Standard scanners (10-40ms per key)
 * - Scanners with Enter suffix (CR / CRLF)
 * - Scanners with Tab suffix
 * - Scanners with NO suffix (automatic 75ms idle flush)
 * - Input-field deconfliction
 */
export class HardwareScanner {
  private listeners: Set<ScanListener> = new Set();
  private buffer: string[] = [];
  private keyTimestamps: number[] = [];
  private lastKeyTime: number = 0;
  private isListening: boolean = false;
  private flushTimeout: any = null;
  private lastDebugInfo: ScannerDebugInfo | null = null;
  private lastCommittedCode: string = '';
  private lastCommittedTime: number = 0;

  // Configuration
  private readonly maxInterKeyMs: number = 90; // Max gap between keys in a scanner burst
  private readonly minBarcodeLength: number = 3;
  private readonly idleFlushDelayMs: number = 80; // Flush scanner buffer if no Enter key received

  private handleKeyDown = (e: KeyboardEvent) => {
    // Ignore pure modifier keys
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'NumLock', 'ScrollLock'].includes(e.key)) {
      return;
    }

    const now = performance.now();
    const elapsed = this.lastKeyTime > 0 ? now - this.lastKeyTime : 0;
    this.lastKeyTime = now;

    // 1. Check for Suffix: Enter or Tab
    if (e.key === 'Enter' || e.key === 'Tab') {
      if (this.flushTimeout) {
        clearTimeout(this.flushTimeout);
        this.flushTimeout = null;
      }

      if (this.buffer.length >= this.minBarcodeLength) {
        // Suppress form submit / enter key behavior
        e.preventDefault();
        e.stopPropagation();

        this.commitBuffer(e.key === 'Enter' ? 'Enter' : 'Tab');
      } else {
        this.resetBuffer();
      }
      return;
    }

    // 2. Process printable ASCII characters
    if (e.key.length === 1) {
      // If the gap since previous key is larger than burst threshold, this is a new sequence
      if (elapsed > this.maxInterKeyMs && this.buffer.length > 0) {
        this.resetBuffer();
      }

      this.buffer.push(e.key);
      this.keyTimestamps.push(now);

      // If we already have buffered characters, setup an idle flush timer
      // in case this scanner is NOT programmed to send an Enter suffix
      if (this.flushTimeout) {
        clearTimeout(this.flushTimeout);
      }

      if (this.buffer.length >= this.minBarcodeLength) {
        this.flushTimeout = setTimeout(() => {
          this.commitBuffer('IdleTimeout');
        }, this.idleFlushDelayMs);
      }
    }
  };

  private commitBuffer(suffix: 'Enter' | 'Tab' | 'IdleTimeout'): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    const barcode = this.buffer.join('').trim();
    const count = this.buffer.length;
    const timestamps = [...this.keyTimestamps];
    this.resetBuffer();

    if (barcode.length < this.minBarcodeLength) {
      return;
    }

    // Calculate timing metrics
    const durationMs = timestamps.length > 1 ? Math.round(timestamps[timestamps.length - 1] - timestamps[0]) : 0;
    const avgIntervalMs = count > 1 ? Math.round(durationMs / (count - 1)) : 0;

    // Prevent duplicate firing within 450ms
    const now = Date.now();
    if (barcode === this.lastCommittedCode && now - this.lastCommittedTime < 450) {
      return;
    }
    this.lastCommittedCode = barcode;
    this.lastCommittedTime = now;

    this.lastDebugInfo = {
      barcode,
      charCount: count,
      durationMs,
      avgIntervalMs,
      suffix,
      timestamp: now,
    };

    const result: ScanResult = {
      value: barcode,
      source: 'hardware',
      timestamp: now,
    };

    this.dispatchScan(result);
  }

  private resetBuffer(): void {
    this.buffer = [];
    this.keyTimestamps = [];
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
  }

  public start(): void {
    if (this.isListening) return;
    window.addEventListener('keydown', this.handleKeyDown, true);
    this.isListening = true;
  }

  public stop(): void {
    if (!this.isListening) return;
    window.removeEventListener('keydown', this.handleKeyDown, true);
    this.isListening = false;
    this.resetBuffer();
  }

  public get isActive(): boolean {
    return this.isListening;
  }

  public getDebugInfo(): ScannerDebugInfo | null {
    return this.lastDebugInfo;
  }

  public addListener(listener: ScanListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public removeListener(listener: ScanListener): void {
    this.listeners.delete(listener);
  }

  private dispatchScan(result: ScanResult): void {
    for (const listener of this.listeners) {
      try {
        listener(result);
      } catch (err) {
        console.error('[HardwareScanner] Listener error:', err);
      }
    }
  }

  public simulateScan(code: string): void {
    const result: ScanResult = {
      value: code,
      source: 'hardware',
      timestamp: Date.now(),
    };
    this.dispatchScan(result);
  }
}

export const hardwareScanner = new HardwareScanner();
