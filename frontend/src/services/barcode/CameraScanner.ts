import { BrowserMultiFormatReader } from '@zxing/browser';
import { ScannerCameraDevice, ScanListener, ScanResult } from './types';

/**
 * CameraScanner manages webcam / mobile camera video feeds,
 * device selection, flashlight/torch, and barcode decoding.
 */
export class CameraScanner {
  private codeReader: BrowserMultiFormatReader | null = null;
  private currentStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private selectedDeviceId: string | null = null;
  private isScanning: boolean = false;
  private listeners: Set<ScanListener> = new Set();
  private lastScannedCode: string = '';
  private lastScanTime: number = 0;
  private readonly scanCooldownMs: number = 1500;
  private hasTorch: boolean = false;
  private isTorchOn: boolean = false;

  constructor() {
    try {
      this.codeReader = new BrowserMultiFormatReader();
    } catch (e) {
      console.warn('[CameraScanner] BrowserMultiFormatReader initialization error:', e);
    }
  }

  public async getDevices(): Promise<ScannerCameraDevice[]> {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        return [];
      }

      // Request initial brief stream to unlock device labels if permission not yet granted
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');

      return videoDevices.map((device, index) => {
        const label = device.label || `Camera ${index + 1}`;
        const isBackCamera = /back|rear|environment|wide|main/i.test(label);
        return {
          deviceId: device.deviceId,
          label,
          isBackCamera,
        };
      });
    } catch (err) {
      console.error('[CameraScanner] Error enumerating devices:', err);
      return [];
    }
  }

  public async start(
    videoEl: HTMLVideoElement,
    deviceId?: string
  ): Promise<{ success: boolean; error?: string }> {
    this.stop();
    this.videoElement = videoEl;
    this.selectedDeviceId = deviceId || null;

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: { ideal: 'environment' } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.currentStream = stream;
      videoEl.srcObject = stream;
      await videoEl.play();

      // Check flashlight/torch capability
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as any;
        this.hasTorch = Boolean(capabilities.torch);
      }

      this.isScanning = true;

      // Start continuous decoding
      this.startDecodingLoop(videoEl);

      return { success: true };
    } catch (err: any) {
      console.error('[CameraScanner] Failed to start camera:', err);
      return { success: false, error: err.message || 'Camera access denied' };
    }
  }

  private startDecodingLoop(videoEl: HTMLVideoElement): void {
    if (!this.codeReader) return;

    this.codeReader.decodeFromVideoElement(videoEl, (result, error) => {
      if (!this.isScanning) return;

      if (result) {
        const text = result.getText();
        const now = Date.now();

        // Prevent rapid repeated scans of the exact same code
        if (text === this.lastScannedCode && now - this.lastScanTime < this.scanCooldownMs) {
          return;
        }

        this.lastScannedCode = text;
        this.lastScanTime = now;

        const scanResult: ScanResult = {
          value: text,
          format: result.getBarcodeFormat()?.toString(),
          source: 'camera',
          timestamp: now,
        };

        this.dispatchScan(scanResult);
      }
    });
  }

  public stop(): void {
    this.isScanning = false;
    this.isTorchOn = false;

    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => track.stop());
      this.currentStream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }

  public async toggleTorch(): Promise<boolean> {
    if (!this.hasTorch || !this.currentStream) return false;

    const track = this.currentStream.getVideoTracks()[0];
    if (!track) return false;

    try {
      const target = !this.isTorchOn;
      await track.applyConstraints({
        advanced: [{ torch: target } as any],
      });
      this.isTorchOn = target;
      return this.isTorchOn;
    } catch (err) {
      console.warn('[CameraScanner] Torch toggle failed:', err);
      return false;
    }
  }

  public get torchAvailable(): boolean {
    return this.hasTorch;
  }

  public get torchOn(): boolean {
    return this.isTorchOn;
  }

  public get active(): boolean {
    return this.isScanning;
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
        console.error('[CameraScanner] Listener error:', err);
      }
    }
  }
}

export const cameraScanner = new CameraScanner();
