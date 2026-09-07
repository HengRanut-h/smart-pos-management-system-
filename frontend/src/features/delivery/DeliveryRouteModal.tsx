import React, { useState } from 'react';
import { Route, X, Save, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Delivery, DeliveryDriver, DeliveryVehicle } from '../../foundation/types/delivery';

interface DeliveryRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableDeliveries: Delivery[];
  drivers: DeliveryDriver[];
  vehicles: DeliveryVehicle[];
  onCreateRoute: (payload: {
    driver_id?: number;
    vehicle_id?: number;
    route_date: string;
    delivery_ids: number[];
    notes?: string;
  }) => Promise<void>;
}

export const DeliveryRouteModal: React.FC<DeliveryRouteModalProps> = ({
  isOpen,
  onClose,
  availableDeliveries,
  drivers,
  vehicles,
  onCreateRoute,
}) => {
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [routeDate, setRouteDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleToggleDelivery = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      setError('Please select at least one delivery stop for this route');
      return;
    }
    setIsSubmitting(true);
    try {
      await onCreateRoute({
        driver_id: driverId ? Number(driverId) : undefined,
        vehicle_id: vehicleId ? Number(vehicleId) : undefined,
        route_date: routeDate,
        delivery_ids: selectedIds,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create route');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Plan Multi-Stop Delivery Route</h3>
              <p className="text-xs text-white/80">Batch deliveries into an optimized sequence</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Route Date *</label>
              <input
                type="date"
                required
                value={routeDate}
                onChange={(e) => setRouteDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Driver</label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="">-- Choose Driver --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.vehicle_type})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Fleet Vehicle</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">-- Choose Vehicle --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.plate_number} ({v.brand} {v.model})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Select Stops ({selectedIds.length} stops included)
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-2xl p-2 space-y-1.5 bg-gray-50/50">
              {availableDeliveries.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No unassigned deliveries available</p>
              ) : (
                availableDeliveries.map((del) => {
                  const isChecked = selectedIds.includes(del.id);
                  return (
                    <div
                      key={del.id}
                      onClick={() => handleToggleDelivery(del.id)}
                      className={'p-2 rounded-xl border flex items-center justify-between cursor-pointer transition text-xs ' + (
                        isChecked
                          ? 'bg-teal-50 border-teal-300 text-teal-900 font-semibold'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      )}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded-md text-teal-600 focus:ring-teal-500"
                        />
                        <span className="font-mono text-[11px]">{del.delivery_number}</span>
                        <span className="truncate max-w-[140px] text-gray-700">{del.recipient_name}</span>
                      </div>
                      <span className="text-gray-500 text-[11px]">{del.zone?.name || 'Standard Zone'}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Dispatch Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Avoid Russian Blvd between 11-12 due to rush hour"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
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
              className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating...' : 'Create Optimized Route'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
