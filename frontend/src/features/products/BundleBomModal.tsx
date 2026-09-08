import React, { useState } from 'react';
import { X, Package, Plus, Trash2, Check } from 'lucide-react';
import { EnterpriseProduct } from '../../foundation/types/productEnterprise';
import { productEnterpriseApi } from '../../data-access/productEnterpriseApi';
import { useApp } from '../../application/context/AppContext';

interface BundleBomModalProps {
  product: EnterpriseProduct;
  allProducts: EnterpriseProduct[];
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  mode: 'BUNDLE' | 'BOM';
}

export const BundleBomModal: React.FC<BundleBomModalProps> = ({
  product,
  allProducts,
  isOpen,
  onClose,
  onSaved,
  mode,
}) => {
  const { notify } = useApp();
  const [items, setItems] = useState<Array<{ id: number; quantity: number; unit_price: number; scrap?: number }>>([]);
  const [selectedProductId, setSelectedProductId] = useState<number>(
    allProducts.find(p => p.id !== product.id)?.id || 1
  );
  const [qty, setQty] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const candidate = allProducts.find(p => p.id === selectedProductId);
    if (!candidate) return;

    setItems([
      ...items,
      {
        id: candidate.id,
        quantity: qty,
        unit_price: candidate.cost_price || candidate.selling_price || 1,
        scrap: 0,
      },
    ]);
    setQty(1);
  };

  const handleRemove = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const totalCost = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (mode === 'BUNDLE') {
        const payload = items.map(item => ({
          child_product_id: item.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: 0,
        }));
        await productEnterpriseApi.saveBundleItems(product.id, payload);
      } else {
        const payload = items.map(item => ({
          raw_material_id: item.id,
          quantity_required: item.quantity,
          scrap_percentage: item.scrap || 0,
          unit_cost: item.unit_price,
        }));
        await productEnterpriseApi.saveBomItems(product.id, payload);
      }
      notify.success(
        mode === 'BUNDLE' ? 'Bundle items saved successfully!' : 'Bill of Materials (BOM) saved successfully!',
        'Saved'
      );
      onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      notify.error(err?.response?.data?.message || 'Error saving items');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 via-white to-purple-50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-violet-600 text-white rounded-xl shadow-md">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {mode === 'BUNDLE' ? 'Combo Kit & Bundle Item Builder' : 'BOM / Manufacturing Recipe Builder'}
              </h3>
              <p className="text-xs text-gray-500">Product: {product.name} ({product.product_type})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h4 className="text-xs font-bold text-gray-700 mb-2 uppercase">
              {mode === 'BUNDLE' ? 'Add Item to Bundle' : 'Add Raw Material / Ingredient'}
            </h4>
            <div className="flex items-center space-x-2">
              <select
                value={selectedProductId}
                onChange={e => setSelectedProductId(parseInt(e.target.value))}
                className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none bg-white"
              >
                {allProducts
                  .filter(p => p.id !== product.id)
                  .map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - ${p.cost_price || p.selling_price}
                    </option>
                  ))}
              </select>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={qty}
                onChange={e => setQty(parseFloat(e.target.value) || 1)}
                className="w-20 px-2 py-2 text-xs border border-gray-300 rounded-lg text-center"
                placeholder="Qty"
              />
              <button
                onClick={handleAddItem}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 text-gray-700 font-semibold uppercase">
                <tr>
                  <th className="px-3 py-2">Item Name</th>
                  <th className="px-3 py-2 text-center">Quantity</th>
                  <th className="px-3 py-2 text-right">Unit Cost</th>
                  <th className="px-3 py-2 text-right">Line Total</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-400 italic">
                      No items added yet. Select products above to build your {mode === 'BUNDLE' ? 'bundle' : 'BOM recipe'}.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const refProd = allProducts.find(p => p.id === item.id);
                    const lineTotal = item.quantity * item.unit_price;
                    return (
                      <tr key={idx} className="hover:bg-violet-50/40">
                        <td className="px-3 py-2 font-medium text-gray-900">{refProd?.name || `Item #${item.id}`}</td>
                        <td className="px-3 py-2 text-center">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">${item.unit_price.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-bold text-gray-900">${lineTotal.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">
                          <button onClick={() => handleRemove(idx)} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center p-3 bg-violet-50 rounded-xl border border-violet-200">
            <span className="text-xs font-semibold text-gray-700">Total Component Cost:</span>
            <span className="text-base font-extrabold text-violet-800">${totalCost.toFixed(2)}</span>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || items.length === 0}
            className="px-5 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-lg shadow-md flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
