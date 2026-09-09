import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, Info, X } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger',
  isLoading = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' && !isLoading) {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'BUTTON' || target.tagName === 'A')) {
          return;
        }
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose, onConfirm]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          iconBg: 'bg-amber-100 text-amber-600 ring-8 ring-amber-50',
          icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
          btn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20',
        };
      case 'info':
        return {
          iconBg: 'bg-blue-100 text-blue-600 ring-8 ring-blue-50',
          icon: <Info className="w-6 h-6 text-blue-600" />,
          btn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20',
        };
      case 'danger':
      default:
        return {
          iconBg: 'bg-rose-100 text-rose-600 ring-8 ring-rose-50',
          icon: <Trash2 className="w-6 h-6 text-rose-600" />,
          btn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-sm w-full border border-gray-100 shadow-2xl p-6 space-y-4 animate-scale-up relative overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto transition-transform ${styles.iconBg}`}>
          {styles.icon}
        </div>

        <div className="text-center space-y-1.5 px-2">
          <h3 className="font-bold text-gray-900 text-lg tracking-tight">
            {title || 'Are you sure?'}
          </h3>
          <div className="text-xs text-gray-500 leading-relaxed">
            {message || 'This action cannot be undone. Are you sure you want to proceed?'}
          </div>
        </div>

        <div className="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            {cancelText || 'Cancel'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 px-4 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${styles.btn}`}
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            <span>{confirmText || 'Confirm'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
