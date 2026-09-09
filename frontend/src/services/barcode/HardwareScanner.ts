import { ScanListener, ScanResult } from './types';

/**
 * HardwareScanner listens globally for keystrokes emitted by USB, Bluetooth,
 * or HID laser/CCD barcode scanners. Hardware scanners input characters in
 * rapid bursts (< 45ms per character) terminating with Enter or Tab.
 */
export class HardwareScanner {
  private listeners: Set<ScanListener> = new Set();
  private buffer: string[] = [];
  private lastKeyTime: number = 0;
  private isListening: boolean = false;
  private readonly maxIntervalMs: number = 60; // Max time between keystrokes in a scan burst
  private readonly minBarcodeLength: number = 3;

  private handleKeyDown = (e: KeyboardEvent) => {
    // Ignore pure modifier keys
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) {
      return;
    }

    const now = performance.now();
    const elapsed = now - this.lastKeyTime;
    this.lastKeyTime = now;

    // Handle end-of-barcode character (Enter or Tab)
    if (e.key === 'Enter' || e.key === 'Tab') {
      if (this.buffer.length >= this.minBarcodeLength) {
        const barcode = this.buffer.join('').trim();
        this.buffer = [];

        if (barcode.length >= this.minBarcodeLength) {
          // Prevent form submit or accidental submission on enter
          e.preventDefault();
          e.stopPropagation();

          const result: ScanResult = {
            value: barcode,
            source: 'hardware',
            timestamp: Date.now(),
          };

          this.dispatchScan(result);
        }
      } else {
        this.buffer = [];
      }
      return;
    }

    // Only process printable ASCII characters
    if (e.key.length === 1) {
      if (elapsed > this.maxIntervalMs && this.buffer.length > 0) {
        // Human typing or delay broke the burst - reset buffer to this new character
        this.buffer = [e.key];
      } else {
        this.buffer.push(e.key);
      }
    }
  };

  public start(): void {
    if (this.isListening) return;
    window.addEventListener('keydown', this.handleKeyDown, true);
    this.isListening = true;
  }

  public stop(): void {
    if (!this.isListening) return;
    window.removeEventListener('keydown', this.handleKeyDown, true);
    this.isListening = false;
    this.buffer = [];
  }

  public get isActive(): boolean {
    return this.isListening;
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

  /**
   * Helper to manually simulate a hardware scan (useful for dev testing or debug)
   */
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
