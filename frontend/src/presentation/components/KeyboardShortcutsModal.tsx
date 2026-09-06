import React from 'react';
import { Keyboard, X, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'F1', label: 'POS Terminal', desc: 'Active Cashier checkout, cart, barcode scanner & KHQR' },
    { key: 'F2', label: 'Shifts & Drawer', desc: 'Cash drawer float, safe drops, reconciliation & Z-Reports' },
    { key: 'F3', label: 'Sales History', desc: 'Transaction records, refund voids, and thermal receipt reprinting' },
    { key: 'F4', label: 'Fiscal Invoices', desc: 'Cambodia GDT official tax invoices registry' },
    { key: 'F5', label: 'Stock & Inventory', desc: 'Stock ledger, multi-warehouse transfers and adjustments' },
    { key: 'F6', label: 'Purchases & Suppliers', desc: 'Supplier purchase orders and warehouse stock receiving' },
    { key: 'F7', label: 'Dashboard & KPI', desc: 'Executive revenue curves, category donut & peak hours' },
    { key: 'F8', label: 'Customers & Loyalty', desc: 'Customer directory, membership tiers & loyalty points' },
    { key: 'F9', label: 'Notification Center', desc: 'Stock alerts, warnings, and system logs' },
    { key: 'F10', label: 'Security & Audit', desc: 'Immutable audit trail, roles and system permissions' },
    { key: 'F11', label: 'Backup & Snapshots', desc: 'Database backups, snapshots and JSON data exports' },
    { key: 'F12', label: 'Settings & Station', desc: 'Store details, VAT rates, Bakong KHQR & printer setup' },
    { key: 'Enter', label: 'Scan to Cart', desc: 'Instantly add scanned barcode item to POS cart' },
    { key: '?', label: 'Shortcuts Help', desc: 'Toggle this keyboard shortcuts cheatsheet' },
    { key: 'Esc', label: 'Close Dialogs', desc: 'Dismiss any open modal or active popup' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] overflow-y-auto border border-gray-200 shadow-2xl p-6 space-y-5 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-200">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base flex items-center space-x-1.5">
                <span>SmartPOS Keyboard Hotkeys</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-xs text-gray-500">Fast keyboard navigation designed for retail cashiers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="p-2.5 bg-gray-50 rounded-2xl border border-gray-200/70 flex items-center justify-between hover:bg-emerald-50/50 hover:border-emerald-200 transition"
            >
              <div className="min-w-0 pr-2">
                <span className="font-bold text-xs text-gray-900 block truncate">{s.label}</span>
                <span className="text-[10px] text-gray-400 block truncate">{s.desc}</span>
              </div>
              <kbd className="px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-xs font-mono font-black text-gray-800 shadow-xs shrink-0">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Tip footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Tip: Press <kbd className="font-mono font-bold bg-gray-100 px-1.5 py-0.5 rounded border">?</kbd> at any time to open this guide.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
