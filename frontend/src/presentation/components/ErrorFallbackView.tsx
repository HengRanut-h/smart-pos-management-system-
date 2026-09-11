import React, { useState } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
  Terminal,
  ShieldAlert,
  HelpCircle,
  Clock,
  Globe,
  Layers,
  Bug,
} from 'lucide-react';

export interface ErrorFallbackViewProps {
  error: Error | null;
  errorInfo?: React.ErrorInfo | null;
  onReset?: () => void;
}

export const ErrorFallbackView: React.FC<ErrorFallbackViewProps> = ({
  error,
  errorInfo,
  onReset,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  const errorTimestamp = new Date().toISOString();
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';

  const diagnosticReport = JSON.stringify(
    {
      appName: 'SmartPOS Enterprise Management System',
      timestamp: errorTimestamp,
      url: currentUrl,
      errorName: error?.name || 'Error',
      errorMessage: error?.message || 'Unknown render error occurred',
      stack: error?.stack || 'No stack trace available',
      componentStack: errorInfo?.componentStack || 'No component stack available',
      userAgent: userAgent,
    },
    null,
    2
  );

  const handleCopyDiagnostics = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(diagnosticReport);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = diagnosticReport;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy diagnostics:', e);
    }
  };

  const handleReload = () => {
    setIsReloading(true);
    if (onReset) {
      try {
        onReset();
      } catch {
        // Fallback to full reload
      }
    }
    setTimeout(() => {
      window.location.reload();
    }, 250);
  };

  const handleClearCacheAndReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Storage clear exception:', e);
    }
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans antialiased relative overflow-hidden select-none">
      {/* Ambient background glow & grid lines */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(225,29,72,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Error Container */}
      <div className="relative max-w-2xl w-full bg-slate-900/90 backdrop-blur-2xl border border-slate-800/80 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] p-6 sm:p-8 space-y-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-950/40 text-white font-black text-lg tracking-tight">
              SP
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">SmartPOS</h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full">
                  System Exception
                </span>
              </div>
              <p className="text-xs text-slate-400">Enterprise POS & Management Hub</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
              <Clock className="w-3 h-3 mr-1 text-slate-400" />
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Hero Alert Box */}
        <div className="flex flex-col sm:flex-row items-start gap-4 p-5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-rose-900/20 to-slate-900/50 border border-rose-500/30">
          <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 shrink-0 border border-rose-500/30 shadow-inner">
            <ShieldAlert className="w-8 h-8 animate-pulse text-rose-400" />
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-extrabold text-white">Something went wrong</h1>
              <span className="text-xs text-slate-400 font-medium">(មានបញ្ហាក្នុងដំណើរការ)</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              SmartPOS caught an unexpected user interface error. Your stored transactions, product catalog, and backend databases remain safe.
            </p>
          </div>
        </div>

        {/* Highlighted Error Message Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Bug className="w-3.5 h-3.5 text-rose-400" />
              Caught Exception
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              {error?.name || 'Runtime Exception'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/90 border border-rose-900/40 text-rose-300 font-mono text-xs leading-relaxed overflow-x-auto shadow-inner">
            <div className="flex items-start gap-2">
              <span className="text-rose-500 shrink-0 select-none">✕</span>
              <span className="break-all whitespace-pre-wrap font-semibold">
                {error?.message || 'An unexpected rendering error occurred inside the view tree.'}
              </span>
            </div>
          </div>
        </div>

        {/* Primary & Secondary Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            onClick={handleReload}
            disabled={isReloading}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-600 hover:from-emerald-500 to-teal-600 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/60 transition-all transform active:scale-98 cursor-pointer disabled:opacity-75"
          >
            <RefreshCw className={`w-4 h-4 ${isReloading ? 'animate-spin' : ''}`} />
            {isReloading ? 'Reloading...' : 'Reload Application'}
          </button>

          <button
            onClick={() => {
              window.location.href = '/';
            }}
            className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-sm border border-slate-700/80 transition-all transform active:scale-98 cursor-pointer"
          >
            <Home className="w-4 h-4 text-slate-400" />
            Dashboard
          </button>

          <button
            onClick={handleCopyDiagnostics}
            className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white font-medium text-sm border border-slate-700/60 transition-all cursor-pointer"
            title="Copy error diagnostics to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copy Logs</span>
              </>
            )}
          </button>
        </div>

        {/* Collapsible Diagnostic & Stack Trace Accordion */}
        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between p-3.5 px-4 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              Technical Diagnostics & Stack Trace
            </span>
            {showDetails ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showDetails && (
            <div className="p-4 pt-1 space-y-3 border-t border-slate-800/80 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-slate-500 font-sans text-[11px] font-semibold uppercase tracking-wider">
                  Stack Trace:
                </span>
                <pre className="p-3 bg-slate-950 text-slate-300 rounded-xl overflow-x-auto text-[11px] leading-relaxed max-h-56 border border-slate-800/80">
                  {error?.stack || 'No JavaScript call stack available.'}
                </pre>
              </div>

              {errorInfo?.componentStack && (
                <div className="space-y-1">
                  <span className="text-slate-500 font-sans text-[11px] font-semibold uppercase tracking-wider">
                    Component Tree Hierarchy:
                  </span>
                  <pre className="p-3 bg-slate-950 text-slate-400 rounded-xl overflow-x-auto text-[11px] leading-relaxed max-h-40 border border-slate-800/80">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 font-sans">
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{currentUrl}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Mode: {import.meta.env.MODE || 'production'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reset Session & Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-slate-400">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Need assistance? Contact support at support@smartpos.com</span>
          </div>

          <div>
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="text-slate-400 hover:text-rose-400 transition underline underline-offset-4 cursor-pointer"
              >
                Clear Local Storage Cache & Reset
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-rose-400 font-semibold">Confirm Reset?</span>
                <button
                  onClick={handleClearCacheAndReset}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg text-xs transition cursor-pointer"
                >
                  Yes, Clear Cache
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
