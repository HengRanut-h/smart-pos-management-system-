import React, { useEffect, useState } from 'react';
import { barcodeScannerService } from '../../../services/barcode';
import { ScannerStatusState } from '../../../services/barcode/types';
import {
  ScanBarcode,
  Camera,
  Volume2,
  VolumeX,
  Radio,
  CheckCircle2,
  Sparkles,
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

  useEffect(() => {
    const unsub = barcodeScannerService.onStatusChange((newStatus) => {
      setStatus(newStatus);
      if (newStatus.lastScan) {
        setRecentFlash(newStatus.lastScan.value);
        const timer = setTimeout(() => setRecentFlash(null), 2500);
        return () => clearTimeout(timer);
      }
    });

    return () => unsub();
  }, []);

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    barcodeScannerService.toggleSound();
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700/70 rounded-lg px-2.5 py-1 text-xs backdrop-blur-md">
        <div className="flex items-center gap-1 text-emerald-400 font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>USB Scanner</span>
        </div>

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
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300 shadow-sm backdrop-blur-md">
      {/* Hardware Scanner Status */}
      <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-700/80">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <ScanBarcode className="w-4 h-4 text-emerald-400" />
        <span className="font-semibold text-slate-200">Hardware Scanner:</span>
        <span className="text-emerald-400 font-medium">Ready</span>
      </div>

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
  );
};
