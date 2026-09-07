import React from 'react';
import { X, Truck, User, MapPin, Phone, Calendar, Clock, DollarSign, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Delivery, DeliveryStatus } from '../../foundation/types/delivery';

interface DeliveryDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery | null;
  onAdvanceStatus: (id: number, nextStatus: DeliveryStatus) => void;
  onOpenProofModal: (delivery: Delivery) => void;
}

export const DeliveryDetailsDrawer: React.FC<DeliveryDetailsDrawerProps> = ({
  isOpen,
  onClose,
  delivery,
  onAdvanceStatus,
  onOpenProofModal,
}) => {
  if (!isOpen || !delivery) return null;

  const getNextStatus = (curr: DeliveryStatus): DeliveryStatus | null => {
    switch (curr) {
      case 'PENDING':
        return 'ASSIGNED';
      case 'ASSIGNED':
        return 'PICKED_UP';
      case 'PICKED_UP':
        return 'IN_TRANSIT';
      case 'IN_TRANSIT':
        return 'DELIVERED';
      default:
        return null;
    }
  };

  const next = getNextStatus(delivery.status);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex justify-end z-50 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col border-l border-gray-100 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
              {delivery.delivery_number}
            </span>
            <h2 className="text-base font-bold mt-1 text-white">Delivery Order Details</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Status Pipeline Step Indicator */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-800">Current Status</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                {delivery.status.replace(/_/g, ' ')}
              </span>
            </div>

            {next && (
              <button
                type="button"
                onClick={() => {
                  if (next === 'DELIVERED') {
                    onOpenProofModal(delivery);
                  } else {
                    onAdvanceStatus(delivery.id, next);
                  }
                }}
                className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 shadow-md shadow-emerald-900/20"
              >
                <span>Advance to: {next.replace(/_/g, ' ')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Recipient & Location */}
          <div className="space-y-2.5 p-4 rounded-2xl border border-gray-100 bg-white shadow-xs">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              Recipient & Destination
            </h3>
            <div className="text-xs space-y-1">
              <div className="font-bold text-gray-800">{delivery.recipient_name}</div>
              <div className="flex items-center gap-1.5 text-gray-600 font-mono">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{delivery.recipient_phone}</span>
              </div>
              <div className="flex items-start gap-1.5 text-gray-600 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{delivery.delivery_address}</span>
              </div>
              {delivery.delivery_notes && (
                <div className="mt-2 p-2 bg-amber-50 rounded-lg text-amber-800 text-[11px]">
                  <strong>Notes: </strong>{delivery.delivery_notes}
                </div>
              )}
            </div>
          </div>

          {/* Assigned Driver */}
          <div className="space-y-2 p-4 rounded-2xl border border-gray-100 bg-white shadow-xs">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              Assigned Driver
            </h3>
            {delivery.driver ? (
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-gray-800 block">{delivery.driver.name}</span>
                  <span className="text-[11px] text-gray-500 font-mono">{delivery.driver.phone}</span>
                  <span className="text-[10px] text-slate-400 block">{delivery.driver.vehicle_type} ({delivery.driver.vehicle_plate_number})</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                  {delivery.driver.current_status}
                </span>
              </div>
            ) : (
              <span className="text-xs text-amber-600 font-semibold">No driver assigned yet.</span>
            )}
          </div>

          {/* Order Items */}
          {delivery.items && delivery.items.length > 0 && (
            <div className="space-y-2 p-4 rounded-2xl border border-gray-100 bg-white shadow-xs">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Package Items</h3>
              <div className="divide-y divide-gray-100">
                {delivery.items.map((it) => (
                  <div key={it.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-gray-800 block">{it.product_name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">Qty: {it.quantity}</span>
                    </div>
                    <span className="font-mono font-bold text-gray-700">${Number(it.total_price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial Breakdown */}
          <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 text-xs space-y-1.5">
            <div className="flex justify-between text-gray-600">
              <span>Items Subtotal:</span>
              <span className="font-mono">${Number(delivery.order_subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee:</span>
              <span className="font-mono">${Number(delivery.delivery_fee).toFixed(2)}</span>
            </div>
            <div className="border-t border-emerald-200 pt-1.5 flex justify-between font-bold text-sm text-gray-900">
              <span>Grand Total:</span>
              <span className="font-mono text-emerald-700">${Number(delivery.total_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-gray-500 pt-1">
              <span>Payment Type:</span>
              <span className="font-bold uppercase text-gray-700">{delivery.payment_type}</span>
            </div>
            {delivery.payment_type === 'COD' && (
              <div className="flex justify-between text-[11px] font-bold text-amber-800">
                <span>COD Collected:</span>
                <span className="font-mono">${Number(delivery.cod_amount_collected).toFixed(2)} / ${Number(delivery.cod_amount_due).toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Tracking History / Timeline */}
          {delivery.tracking_logs && delivery.tracking_logs.length > 0 && (
            <div className="space-y-2 p-4 rounded-2xl border border-gray-100 bg-white shadow-xs">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Tracking Timeline</h3>
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-2.5 before:w-0.5 before:bg-gray-200">
                {delivery.tracking_logs.map((log, idx) => (
                  <div key={idx} className="relative flex items-start space-x-3 text-xs pl-6">
                    <div className="absolute left-1.5 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800">{log.status.replace(/_/g, ' ')}</span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">{log.notes}</p>
                      {log.actor_name && (
                        <span className="text-[9px] text-gray-400 block mt-0.5">By: {log.actor_name}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proof of delivery if exists */}
          {delivery.proof && (
            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 text-xs space-y-2">
              <h3 className="font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Proof of Delivery Confirmed
              </h3>
              <div className="text-[11px] text-gray-700">
                <div><strong>Receiver:</strong> {delivery.proof.receiver_name} ({delivery.proof.receiver_relationship})</div>
                {delivery.proof.otp_code && <div><strong>OTP Code:</strong> {delivery.proof.otp_code} (Verified)</div>}
              </div>
              {delivery.proof.signature_image_url && (
                <div className="mt-2 bg-white p-2 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-gray-400 block mb-1">Customer Signature:</span>
                  <img src={delivery.proof.signature_image_url} alt="Signature" className="h-16 object-contain" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
