import React, { useState } from 'react';
import { X, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import { settleDriverCod } from '../../data-access/deliveryApi';

interface SettleCodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  driver: {
    id: number;
    name: string;
    phone: string;
    vehicle_type: string;
    active_cash_in_hand: number;
  } | null;
}

export const SettleCodModal: React.FC<SettleCodModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  driver,
}) => {
  const [amount, setAmount] = useState<number>(driver?.active_cash_in_hand || 0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !driver) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await settleDriverCod({
        driver_id: driver.id,
        amount_to_settle: amount,
        notes: notes || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to settle COD cash.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Driver COD Cash Settlement</h2>
              <p className="text-[11px] text-slate-400">{driver.name}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-emerald-800 font-semibold block">Active Cash in Hand</span>
              <span className="text-xl font-extrabold text-emerald-900 font-mono">
                ${Number(driver.active_cash_in_hand).toFixed(2)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAmount(Number(driver.active_cash_in_hand))}
              className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition"
            >
              Settle Full
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Cash Handover Amount ($) *</label>
            <input
              type="number"
              step="0.01"
              max={driver.active_cash_in_hand}
              required
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm font-mono font-bold text-gray-900 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Settlement Notes / Register #</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Handed cash to Cashier Drawer #1"
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || amount <= 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Cash Handover'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
