import React, { useState } from 'react';
import { X, Calendar, Check } from 'lucide-react';
import { EnterpriseProduct } from '../../foundation/types/productEnterprise';
import { productEnterpriseApi } from '../../data-access/productEnterpriseApi';
import { useApp } from '../../application/context/AppContext';

interface BatchLotModalProps {
  product: EnterpriseProduct;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const BatchLotModal: React.FC<BatchLotModalProps> = ({
  product,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { notify } = useApp();
  const [batchNumber, setBatchNumber] = useState(`BATCH-${Date.now().toString().slice(-6)}`);
  const [lotNumber, setLotNumber] = useState(`LOT-${new Date().getFullYear()}-01`);
  const [mfgDate, setMfgDate] = useState(new Date().toISOString().split('T')[0]);
  const [expDate, setExpDate] = useState(
    new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [alertDays, setAlertDays] = useState(30);
  const [quantity, setQuantity] = useState(50);
  const [costPerUnit, setCostPerUnit] = useState(product.cost_price || 0);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await productEnterpriseApi.saveBatch({
        product_id: product.id,
        batch_number: batchNumber,
        lot_number: lotNumber,
        manufactured_date: mfgDate,
        expiry_date: expDate,
        alert_before_days: alertDays,
        initial_quantity: quantity,
        remaining_quantity: quantity,
        cost_per_unit: costPerUnit,
        status: 'ACTIVE',
      });
      notify.success('Batch / Lot created successfully!', 'Batch Created');
      onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      notify.error(err?.response?.data?.message || 'Error creating batch');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 via-white to-orange-50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-600 text-white rounded-xl shadow-md">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Add Batch & Expiry Tracker</h3>
              <p className="text-xs text-gray-500">Product: {product.name} ({product.sku})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Batch Number</label>
              <input
                type="text"
                value={batchNumber}
                onChange={e => setBatchNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Lot Number</label>
              <input
                type="text"
                value={lotNumber}
                onChange={e => setLotNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Manufacturing Date</label>
              <input
                type="date"
                value={mfgDate}
                onChange={e => setMfgDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                value={expDate}
                onChange={e => setExpDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-semibold text-red-600 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Batch Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Cost Per Unit ($)</label>
              <input
                type="number"
                step="0.01"
                value={costPerUnit}
                onChange={e => setCostPerUnit(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Alert Threshold (Days Before Expiry)</label>
              <input
                type="number"
                value={alertDays}
                onChange={e => setAlertDays(parseInt(e.target.value) || 15)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg shadow-md flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Registering...' : 'Register Batch'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
