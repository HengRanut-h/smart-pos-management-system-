import React, { useEffect, useState, useRef } from 'react';
import { useNotification } from '../../application/context/NotificationContext';
import { NotificationItem } from '../../foundation/types/notification';
import {
  CheckCircle2,
  Info,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  X,
} from 'lucide-react';

interface ToastCardProps {
  item: NotificationItem;
  onDismiss: (id: string) => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ item, onDismiss }) => {
  const { id, type, title, message, auto_close, duration, progress_bar, action } = item;
  const initialDuration = duration && duration > 0 ? duration : 4000;

  const [remainingTime, setRemainingTime] = useState<number>(initialDuration);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const lastTickRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!auto_close) return;

    lastTickRef.current = Date.now();
    const interval = setInterval(() => {
      if (!isPaused) {
        const now = Date.now();
        const delta = now - lastTickRef.current;
        lastTickRef.current = now;

        setRemainingTime((prev) => {
          const next = prev - delta;
          if (next <= 0) {
            clearInterval(interval);
            onDismiss(id);
            return 0;
          }
          return next;
        });
      } else {
        lastTickRef.current = Date.now();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [auto_close, isPaused, id, onDismiss]);

  const progressPercent = auto_close ? Math.max(0, Math.min(100, (remainingTime / initialDuration) * 100)) : 0;

  // Visual Theme Config
  const theme = (() => {
    switch (type) {
      case 'success':
        return {
          border: 'border-emerald-200 shadow-emerald-500/5',
          bg: 'bg-white',
          accent: 'bg-emerald-50 text-emerald-600',
          bar: 'bg-emerald-500',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          titleColor: 'text-emerald-900',
          defaultTitle: 'Success',
        };
      case 'information':
        return {
          border: 'border-sky-200 shadow-sky-500/5',
          bg: 'bg-white',
          accent: 'bg-sky-50 text-sky-600',
          bar: 'bg-sky-500',
          icon: <Info className="w-5 h-5 text-sky-600 shrink-0" />,
          titleColor: 'text-sky-900',
          defaultTitle: 'Information',
        };
      case 'warning':
        return {
          border: 'border-amber-300 shadow-amber-500/10',
          bg: 'bg-white',
          accent: 'bg-amber-50 text-amber-600',
          bar: 'bg-amber-500',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
          titleColor: 'text-amber-900',
          defaultTitle: 'Warning',
        };
      case 'error':
        return {
          border: 'border-rose-300 shadow-rose-500/10',
          bg: 'bg-white',
          accent: 'bg-rose-50 text-rose-600',
          bar: 'bg-rose-500',
          icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
          titleColor: 'text-rose-900',
          defaultTitle: 'Error Encountered',
        };
      case 'critical':
        return {
          border: 'border-red-600 ring-2 ring-red-500/30 shadow-red-600/20',
          bg: 'bg-white',
          accent: 'bg-red-100 text-red-700',
          bar: 'bg-red-600',
          icon: <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 animate-bounce" />,
          titleColor: 'text-red-950 font-black',
          defaultTitle: 'CRITICAL ACTION REQUIRED',
        };
    }
  })();

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        lastTickRef.current = Date.now();
        setIsPaused(false);
      }}
      role="alert"
      aria-live={type === 'critical' ? 'assertive' : 'polite'}
      className={`pointer-events-auto w-full max-w-sm rounded-2xl border ${theme.border} ${theme.bg} shadow-xl overflow-hidden transition-all duration-200 transform animate-in slide-in-from-top-4 fade-in`}
    >
      <div className="p-3.5 flex items-start space-x-3">
        <div className={`p-2 rounded-xl shrink-0 ${theme.accent}`}>
          {theme.icon}
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center justify-between">
            <h4 className={`text-xs font-bold truncate ${theme.titleColor}`}>
              {title || theme.defaultTitle}
            </h4>
            {type === 'critical' && (
              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded-md bg-red-600 text-white tracking-wider animate-pulse">
                Action Req.
              </span>
            )}
          </div>
          <p className="text-xs text-gray-700 mt-0.5 leading-relaxed break-words font-medium">
            {message}
          </p>

          {action && (
            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  action.onClick();
                  onDismiss(id);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  action.primary
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDismiss(id)}
          className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition shrink-0 cursor-pointer"
          title="Dismiss notification"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Countdown Progress Bar (for auto-closing toasts) */}
      {auto_close && progress_bar && (
        <div className="w-full bg-gray-100 h-1 overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ease-linear ${theme.bar}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
};

export const GlobalToastContainer: React.FC = () => {
  const { notifications, notify } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      aria-label="Notifications"
      className="fixed top-5 right-5 z-[99999] flex flex-col items-end space-y-2.5 w-full max-w-sm pointer-events-none"
    >
      {notifications.length > 2 && (
        <button
          type="button"
          onClick={() => notify.dismissAll()}
          className="pointer-events-auto text-[11px] font-bold text-gray-500 hover:text-gray-800 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full shadow-md border border-gray-200 transition cursor-pointer hover:bg-gray-50 mb-1"
        >
          Clear All ({notifications.length})
        </button>
      )}

      {notifications.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={notify.dismiss} />
      ))}
    </div>
  );
};
