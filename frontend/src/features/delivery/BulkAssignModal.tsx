import React, { useState } from 'react';
import { Users, X, Send, AlertCircle, Truck } from 'lucide-react';
import { Delivery, DeliveryDriver, DeliveryVehicle } from '../../foundation/types/delivery';

interface BulkAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDeliveries: Delivery[];
  drivers: DeliveryDriver[];
  vehicles: DeliveryVehicle[];
  onAssign: (payload: { delivery_ids: number[]; driver_id: number; vehicle_id?: number }) => Promise<void>;
}

export const BulkAssignModal: React.FC<BulkAssignModalProps> = ({
  isOpen,
  onClose,
  selectedDeliveries,
  drivers,
  vehicles,
  onAssign,
}) => {
  const [driverId, setDriverId] = useState<string>('');
  const [vehicleId, setVehicleId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || selectedDeliveries.length === 0) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverId) {
      setError('Please select a driver to dispatch');
      return;
    }
    setIsSubmitting(true);
    try {
      await onAssign({
        delivery_ids: selectedDeliveries.map((d) => d.id),
        driver_id: Number(driverId),
        vehicle_id: vehicleId ? Number(vehicleId) : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to dispatch orders');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Bulk Dispatch Orders</h3>
              <p className="text-xs text-white/80">{selectedDeliveries.length} orders selected</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Delivery Rider *</label>
            <select
              required
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
            >
              <option value="">-- Choose Rider --</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.vehicle_type}) &bull; {d.current_status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assign Fleet Vehicle (Optional)</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">-- Auto Match / Rider's Own Vehicle --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate_number} ({v.brand} {v.model}) - {v.vehicle_type}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-indigo-50/60 p-3 rounded-2xl border border-indigo-100 max-h-36 overflow-y-auto space-y-1.5">
            <div className="text-[11px] font-bold text-indigo-900 uppercase">Selected Deliveries:</div>
            {selectedDeliveries.map((d) => (
              <div key={d.id} className="text-xs text-gray-700 flex justify-between items-center bg-white px-2.5 py-1 rounded-lg border border-gray-100">
                <span className="font-mono font-bold text-indigo-600">{d.delivery_number}</span>
                <span className="truncate max-w-[160px] text-gray-600">{d.recipient_name}</span>
                <span className="text-[11px] font-bold text-emerald-600">${Number(d.total_amount).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Dispatching...' : 'Dispatch All'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
