import React, { useState } from 'react';
import { X, Truck, DollarSign, MapPin, Phone, User, AlertCircle, ShoppingBag, Plus, Trash2 } from 'lucide-react';
import { DeliveryZone, DeliveryDriver } from '../../foundation/types/delivery';
import { createDeliveryOrder } from '../../data-access/deliveryApi';
import { Product } from '../../foundation/types';

interface CreateDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  zones: DeliveryZone[];
  drivers: DeliveryDriver[];
  products: Product[];
}

export const CreateDeliveryModal: React.FC<CreateDeliveryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  zones,
  drivers,
  products,
}) => {
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientSecondaryPhone, setRecipientSecondaryPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<number | ''>(zones[0]?.id || '');
  const [selectedDriverId, setSelectedDriverId] = useState<number | ''>('');
  const [priority, setPriority] = useState<'STANDARD' | 'EXPRESS' | 'URGENT'>('STANDARD');
  const [paymentType, setPaymentType] = useState<'COD' | 'PREPAID'>('COD');
  const [deliveryFee, setDeliveryFee] = useState<number>(zones[0]?.base_delivery_fee || 1.5);
  const [codAmountDue, setCodAmountDue] = useState<number>(0);
  const [items, setItems] = useState<Array<{ product_name: string; product_id?: number; sku?: string; quantity: number; unit_price: number }>>([]);
  const [selectedProdId, setSelectedProdId] = useState<number | ''>('');
  const [selectedProdQty, setSelectedProdQty] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleZoneChange = (zoneId: number) => {
    setSelectedZoneId(zoneId);
    const z = zones.find((item) => item.id === zoneId);
    if (z) {
      setDeliveryFee(z.base_delivery_fee);
    }
  };

  const handleAddItem = () => {
    if (!selectedProdId) return;
    const prod = products.find((p) => p.id === Number(selectedProdId));
    if (!prod) return;

    const existingIdx = items.findIndex((it) => it.product_id === prod.id);
    if (existingIdx >= 0) {
      const updated = [...items];
      updated[existingIdx].quantity += selectedProdQty;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          product_name: prod.name,
          product_id: prod.id,
          sku: prod.sku,
          quantity: selectedProdQty,
          unit_price: Number(prod.selling_price) || 0,
        },
      ]);
    }
    setSelectedProdId('');
    setSelectedProdQty(1);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const subtotal = items.reduce((sum, it) => sum + it.unit_price * it.quantity, 0);
  const totalAmount = subtotal + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !recipientPhone.trim() || !deliveryAddress.trim()) {
      setError('Please fill in recipient name, phone number, and delivery address.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createDeliveryOrder({
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        recipient_secondary_phone: recipientSecondaryPhone || undefined,
        delivery_address: deliveryAddress,
        delivery_notes: deliveryNotes || undefined,
        zone_id: selectedZoneId ? Number(selectedZoneId) : undefined,
        driver_id: selectedDriverId ? Number(selectedDriverId) : undefined,
        priority,
        payment_type: paymentType,
        delivery_fee: deliveryFee,
        order_subtotal: subtotal,
        cod_amount_due: paymentType === 'COD' ? (codAmountDue > 0 ? codAmountDue : totalAmount) : 0,
        items: items.map((it) => ({
          product_name: it.product_name,
          product_id: it.product_id,
          sku: it.sku,
          quantity: it.quantity,
          unit_price: it.unit_price,
        })),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create delivery order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">New Delivery Order</h2>
              <p className="text-xs text-slate-400">Dispatch items with zone fees & COD management</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Recipient Details */}
          <div className="space-y-3 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
            <h3 className="text-xs font-bold text-gray-800 flex items-center gap-1.5 uppercase tracking-wide">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              Recipient Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">Customer / Recipient Name *</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Sokly Heng"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">Primary Phone Number *</label>
                <input
                  type="text"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="e.g. 012 345 678"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1">Delivery Address *</label>
              <textarea
                required
                rows={2}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="House/Street/Sangkat, Khan, City..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1">Special Delivery Notes</label>
              <input
                type="text"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="e.g. Call 5 mins before arrival, deliver to reception..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Zone & Driver Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1">Delivery Zone</label>
              <select
                value={selectedZoneId}
                onChange={(e) => handleZoneChange(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} (${Number(z.base_delivery_fee).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1">Assign Driver / Rider</label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">-- Unassigned (Dispatch Later) --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.vehicle_type}) - {d.current_status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="STANDARD">Standard</option>
                <option value="EXPRESS">Express (Fast)</option>
                <option value="URGENT">Urgent (Immediate)</option>
              </select>
            </div>
          </div>

          {/* Package Items */}
          <div className="space-y-2 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
            <h3 className="text-xs font-bold text-gray-800 flex items-center justify-between uppercase tracking-wide">
              <span className="flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                Delivery Package Items
              </span>
              <span className="text-[11px] text-gray-500 font-mono">Subtotal: ${subtotal.toFixed(2)}</span>
            </h3>

            {/* Add product line */}
            <div className="flex items-center space-x-2">
              <select
                value={selectedProdId}
                onChange={(e) => setSelectedProdId(e.target.value ? Number(e.target.value) : '')}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">-- Select Product from Inventory --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${Number(p.selling_price).toFixed(2)})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={selectedProdQty}
                onChange={(e) => setSelectedProdQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 px-2 py-2 text-xs text-center rounded-xl border border-gray-200 bg-white font-mono"
              />
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Items list */}
            {items.length > 0 && (
              <div className="divide-y divide-gray-100 mt-2 bg-white rounded-xl border border-gray-150 p-2 max-h-32 overflow-y-auto">
                {items.map((it, idx) => (
                  <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                    <span className="truncate max-w-[240px] font-medium text-gray-800">
                      {it.quantity}x {it.product_name}
                    </span>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="font-mono font-bold text-gray-700">
                        ${(it.unit_price * it.quantity).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-gray-400 hover:text-rose-500 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment & COD */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
            <div>
              <label className="text-[11px] font-semibold text-emerald-800 block mb-1">Payment Method</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="COD">Cash On Delivery (COD)</option>
                <option value="PREPAID">Prepaid (Paid via POS / Online)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-emerald-800 block mb-1">Delivery Fee ($)</label>
              <input
                type="number"
                step="0.25"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-emerald-800 block mb-1">
                {paymentType === 'COD' ? 'COD Amount Due ($)' : 'Total Order ($)'}
              </label>
              <input
                type="number"
                step="0.01"
                value={paymentType === 'COD' ? (codAmountDue > 0 ? codAmountDue : totalAmount) : totalAmount}
                onChange={(e) => setCodAmountDue(parseFloat(e.target.value) || 0)}
                disabled={paymentType === 'PREPAID'}
                className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono font-bold text-emerald-700"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 shrink-0">
          <div className="text-xs">
            <span className="text-gray-500">Grand Total: </span>
            <span className="font-extrabold text-gray-900 font-mono text-sm">${totalAmount.toFixed(2)} USD</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-900/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Delivery'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
