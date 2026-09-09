import React, { useEffect, useState } from 'react';
import { barcodeScannerService } from '../../../services/barcode';
import { ScannerStatusState, BarcodeLookupResult } from '../../../services/barcode/types';
import { ScannerDebugInfo } from '../../../services/barcode/HardwareScanner';
import {
  ScanBarcode,
  Camera,
  Volume2,
  VolumeX,
  Radio,
  CheckCircle2,
  AlertCircle,
  Activity,
  X,
  Play,
  HelpCircle,
  Zap,
} from 'lucide-react';

interface ScannerStatusProps {
  onOpenCameraModal?: () => void;
  compact?: boolean;
}

export const ScannerStatus: React.FC<ScannerStatusProps> = ({
  onOpenCameraModal,
  compact = false,
}) => {
  const [status, setStatus] = useState<ScannerStatusState>(barcodeScannerService.getStatus());
  const [recentFlash, setRecentFlash] = useState<string | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [debugLog, setDebugLog] = useState<ScannerDebugInfo[]>([]);
  const [lastLookup, setLastLookup] = useState<BarcodeLookupResult | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  useEffect(() => {
    const unsub = barcodeScannerService.onStatusChange((newStatus) => {
      setStatus(newStatus);
      if (newStatus.lastScan) {
        setRecentFlash(newStatus.lastScan.value);
        const timer = setTimeout(() => setRecentFlash(null), 2500);

        const debug = barcodeScannerService.getHardwareDebugInfo();
        if (debug) {
          setDebugLog((prev) => [debug, ...prev.slice(0, 9)]);
        }

        return () => clearTimeout(timer);
      }
    });

    return () => unsub();
  }, []);

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    barcodeScannerService.toggleSound();
  };

  const handleRunTestScan = async (sampleBarcode: string) => {
    setIsLookingUp(true);
    barcodeScannerService.triggerManualScan(sampleBarcode);
    try {
      const res = await barcodeScannerService.lookupBarcode(sampleBarcode);
      setLastLookup(res);
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <>
      {compact ? (
        <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700/70 rounded-lg px-2.5 py-1 text-xs backdrop-blur-md">
          <button
            type="button"
            onClick={() => setIsTestModalOpen(true)}
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            title="Click to test & calibrate USB/Bluetooth barcode scanner"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>USB Scanner</span>
          </button>

          {onOpenCameraModal && (
            <button
              type="button"
              onClick={onOpenCameraModal}
              className="flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors ml-1.5 pl-1.5 border-l border-slate-700"
              title="Open Camera Scanner"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Camera</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleSound}
            className="text-slate-400 hover:text-slate-200 transition-colors ml-1"
            title={status.soundEnabled ? 'Mute Beep' : 'Unmute Beep'}
          >
            {status.soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>

          {recentFlash && (
            <span className="text-[10px] text-emerald-300 font-mono bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-600/50 animate-pulse ml-1">
              ✓ {recentFlash}
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300 shadow-sm backdrop-blur-md">
          {/* Hardware Scanner Status */}
          <button
            type="button"
            onClick={() => setIsTestModalOpen(true)}
            className="flex items-center gap-1.5 pr-2.5 border-r border-slate-700/80 hover:text-emerald-300 transition-colors"
            title="Click to test & calibrate USB/Bluetooth barcode scanner"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <ScanBarcode className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-200">Hardware Scanner:</span>
            <span className="text-emerald-400 font-medium">Ready</span>
          </button>

          {/* Camera Trigger */}
          {onOpenCameraModal && (
            <button
              type="button"
              onClick={onOpenCameraModal}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg transition-all active:scale-95 font-medium"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Scanner</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            className="flex items-center gap-1 px-2 py-1 hover:bg-slate-800 rounded-lg transition-colors text-slate-300"
            title={status.soundEnabled ? 'Mute Beep' : 'Unmute Beep'}
          >
            {status.soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-emerald-400 font-medium">Beep ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] text-slate-500">Muted</span>
              </>
            )}
          </button>

          {/* Recent Scan Flash */}
          {recentFlash && (
            <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40 text-[11px] animate-pulse">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Scanned: {recentFlash}</span>
            </div>
          )}
        </div>
      )}

      {/* Live Scanner Calibrator & Diagnostic Modal */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    Scanner Live Diagnostic & Tester
                  </h3>
                  <p className="text-xs text-slate-400">
                    Point your physical USB or Bluetooth scanner anywhere and scan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTestModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Scan Status Card */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Listener Engine Status:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Active & Capturing (under 90ms inter-key burst)
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Audio POS Feedback:</span>
                <span className="text-slate-200 font-medium">
                  {status.soundEnabled ? '🔊 1200Hz WebAudio Beep Enabled' : '🔇 Muted'}
                </span>
              </div>

              {debugLog.length > 0 ? (
                <div className="bg-slate-900/90 border border-emerald-500/40 rounded-lg p-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-emerald-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" />
                      Latest Hardware Scan Detected:
                    </span>
                    <span className="font-mono text-white text-sm bg-slate-800 px-2 py-0.5 rounded">
                      {debugLog[0].barcode}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-slate-300">
                    <div>
                      <span className="text-slate-500">Characters:</span> {debugLog[0].charCount}
                    </div>
                    <div>
                      <span className="text-slate-500">Avg Speed:</span> {debugLog[0].avgIntervalMs}ms / key
                    </div>
                    <div>
                      <span className="text-slate-500">Terminator:</span> {debugLog[0].suffix}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-slate-500 italic bg-slate-900/40 rounded-lg border border-dashed border-slate-800">
                  Ready. Pull your scanner trigger or click a test button below...
                </div>
              )}
            </div>

            {/* Quick Test Barcodes */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">Test Sample Barcodes:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleRunTestScan('8850123456781')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs flex flex-col items-start border border-slate-700/80 transition active:scale-95"
                >
                  <span className="font-semibold text-white">Coca Cola (Can)</span>
                  <span className="text-[10px] text-slate-400 font-mono">8850123456781 (x1)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRunTestScan('8850123456789')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs flex flex-col items-start border border-slate-700/80 transition active:scale-95"
                >
                  <span className="font-semibold text-emerald-400">Coke 6-Pack</span>
                  <span className="text-[10px] text-slate-400 font-mono">8850123456789 (x6)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRunTestScan('8850123456790')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs flex flex-col items-start border border-slate-700/80 transition active:scale-95"
                >
                  <span className="font-semibold text-indigo-400">Coke 24-Carton</span>
                  <span className="text-[10px] text-slate-400 font-mono">8850123456790 (x24)</span>
                </button>
              </div>
            </div>

            {/* Why Scanner Might Not Work Guide */}
            <div className="bg-sky-950/40 border border-sky-800/40 rounded-xl p-3 text-xs space-y-1.5 text-sky-200">
              <div className="font-semibold flex items-center gap-1.5 text-sky-300">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Troubleshooting Fast Physical Scanners:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-sky-300/80 space-y-0.5">
                <li>
                  <strong>Scanner Suffix:</strong> Most scanners send <code className="bg-sky-900/60 px-1 rounded">Enter</code>. Our system now supports both <code className="bg-sky-900/60 px-1 rounded">Enter</code> and scanners with <em>No Suffix</em> (auto-flushed after 80ms).
                </li>
                <li>
                  <strong>Input Focus:</strong> You do NOT need to click into the search input. Scans are captured anywhere on screen!
                </li>
                <li>
                  <strong>Speed Threshold:</strong> High-speed USB laser scanners (under 90ms per key) are automatically classified as hardware scans and won't conflict with manual typing.
                </li>
              </ul>
            </div>

            {/* Close Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsTestModalOpen(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Done / Return to POS
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
