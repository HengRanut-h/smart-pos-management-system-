import React, { useState } from 'react';
import { X, Calculator, Check, Percent } from 'lucide-react';
import { EnterpriseProduct } from '../../foundation/types/productEnterprise';
import { productEnterpriseApi } from '../../data-access/productEnterpriseApi';

interface LandedCostModalProps {
  product: EnterpriseProduct;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const LandedCostModal: React.FC<LandedCostModalProps> = ({
  product,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [baseCost, setBaseCost] = useState(product.cost_price || 0);
  const [shippingCost, setShippingCost] = useState(product.shipping_cost || 0);
  const [importTax, setImportTax] = useState(product.import_tax || 0);
  const [handlingCost, setHandlingCost] = useState(product.handling_cost || 0);
  const [otherExpenses, setOtherExpenses] = useState(product.other_expenses || 0);
  const [targetMargin, setTargetMargin] = useState(40);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const totalLandedCost = parseFloat(
    (baseCost + shippingCost + importTax + handlingCost + otherExpenses).toFixed(2)
  );

  const suggestedSellingPrice = parseFloat(
    (targetMargin < 100 ? totalLandedCost / (1 - targetMargin / 100) : totalLandedCost * 1.5).toFixed(2)
  );

  const projectedProfit = parseFloat((suggestedSellingPrice - totalLandedCost).toFixed(2));

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await productEnterpriseApi.updateLandedCost(product.id, {
        shipping_cost: shippingCost,
        import_tax: importTax,
        handling_cost: handlingCost,
        other_expenses: otherExpenses,
      });

      if (suggestedSellingPrice > product.selling_price) {
        await productEnterpriseApi.updateProduct(product.id, {
          selling_price: suggestedSellingPrice,
        });
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error updating landed cost');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 via-white to-teal-50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Landed Cost & Margin Studio</h3>
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
              <label className="block text-xs font-semibold text-gray-700 mb-1">Base Supplier Cost ($)</label>
              <input
                type="number"
                step="0.01"
                value={baseCost}
                onChange={e => setBaseCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Freight / Shipping ($)</label>
              <input
                type="number"
                step="0.01"
                value={shippingCost}
                onChange={e => setShippingCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Customs Duty & Import Tax ($)</label>
              <input
                type="number"
                step="0.01"
                value={importTax}
                onChange={e => setImportTax(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Warehouse & Handling ($)</label>
              <input
                type="number"
                step="0.01"
                value={handlingCost}
                onChange={e => setHandlingCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Other Tariff & Port Fees ($)</label>
              <input
                type="number"
                step="0.01"
                value={otherExpenses}
                onChange={e => setOtherExpenses(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-gray-700">Calculated True Landed Cost:</span>
              <span className="text-base font-bold text-emerald-700">${totalLandedCost.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center space-x-3 pt-2 border-t border-emerald-200/60">
              <span className="text-xs font-semibold text-gray-600">Target Margin:</span>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={targetMargin}
                  onChange={e => setTargetMargin(parseInt(e.target.value) || 30)}
                  className="w-16 px-2 py-1 text-xs border border-emerald-300 rounded font-bold text-emerald-800 text-center"
                />
                <Percent className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <span className="text-xs text-gray-500">→ Suggested Price:</span>
              <span className="text-sm font-extrabold text-gray-900">${suggestedSellingPrice.toFixed(2)}</span>
            </div>

            <div className="text-xs text-gray-500 flex justify-between">
              <span>Current Selling Price: ${product.selling_price || 0}</span>
              <span className="font-medium text-emerald-700">Projected Profit / Unit: ${projectedProfit.toFixed(2)}</span>
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
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-md flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Updating...' : 'Save Landed Cost'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
