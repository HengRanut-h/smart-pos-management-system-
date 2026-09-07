import React, { useState } from 'react';
import { X, UserCheck, Bike, AlertCircle } from 'lucide-react';
import { Delivery, DeliveryDriver } from '../../foundation/types/delivery';
import { assignDriverToDelivery } from '../../data-access/deliveryApi';

interface AssignDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  delivery: Delivery | null;
  drivers: DeliveryDriver[];
}

export const AssignDriverModal: React.FC<AssignDriverModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  delivery,
  drivers,
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !delivery) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) {
      setError('Please select a driver.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await assignDriverToDelivery(delivery.id, Number(selectedDriverId), notes);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign driver.');
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
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Assign Delivery Rider</h2>
              <p className="text-[11px] text-slate-400">{delivery.delivery_number}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Destination:</span>
              <span className="font-semibold text-gray-800 truncate max-w-[200px]">{delivery.delivery_address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Recipient:</span>
              <span className="font-semibold text-gray-800">{delivery.recipient_name} ({delivery.recipient_phone})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Due:</span>
              <span className="font-mono font-bold text-emerald-600">${Number(delivery.total_amount).toFixed(2)} ({delivery.payment_type})</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">Choose Active Rider / Driver</label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {drivers.map((d) => (
                <label
                  key={d.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    selectedDriverId === d.id
                      ? 'border-emerald-500 bg-emerald-50/50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <input
                      type="radio"
                      name="driver"
                      checked={selectedDriverId === d.id}
                      onChange={() => setSelectedDriverId(d.id)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-gray-800 block truncate">{d.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono block">
                        {d.vehicle_type} • {d.vehicle_plate_number || 'No plate'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        d.current_status === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {d.current_status}
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">★ {d.rating}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Dispatch Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instructions for rider..."
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
              disabled={isSubmitting || !selectedDriverId}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
            >
              {isSubmitting ? 'Dispatching...' : 'Dispatch Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
