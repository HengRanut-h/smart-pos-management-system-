import React, { useState } from 'react';
import { X, Plus, Trash2, Sparkles, Check, Layers } from 'lucide-react';
import { ProductVariant, EnterpriseProduct } from '../../foundation/types/productEnterprise';
import { productEnterpriseApi } from '../../data-access/productEnterpriseApi';
import { useApp } from '../../application/context/AppContext';

interface VariantMatrixModalProps {
  product: EnterpriseProduct;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const VariantMatrixModal: React.FC<VariantMatrixModalProps> = ({
  product,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { notify } = useApp();
  const [attributeNames, setAttributeNames] = useState<string[]>(['Size', 'Color']);
  const [attributeValues, setAttributeValues] = useState<Record<string, string[]>>({
    Size: ['S', 'M', 'L', 'XL'],
    Color: ['Black', 'White', 'Navy Blue'],
  });
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrValue, setNewAttrValue] = useState<Record<string, string>>({});
  const [generatedVariants, setGeneratedVariants] = useState<Partial<ProductVariant>[]>(product.variants || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleAddAttribute = () => {
    if (!newAttrName.trim() || attributeNames.includes(newAttrName.trim())) return;
    const name = newAttrName.trim();
    setAttributeNames([...attributeNames, name]);
    setAttributeValues({ ...attributeValues, [name]: [] });
    setNewAttrName('');
  };

  const handleAddValue = (attr: string) => {
    const val = (newAttrValue[attr] || '').trim();
    if (!val || (attributeValues[attr] || []).includes(val)) return;
    setAttributeValues({
      ...attributeValues,
      [attr]: [...(attributeValues[attr] || []), val],
    });
    setNewAttrValue({ ...newAttrValue, [attr]: '' });
  };

  const handleRemoveValue = (attr: string, valToRemove: string) => {
    setAttributeValues({
      ...attributeValues,
      [attr]: (attributeValues[attr] || []).filter(v => v !== valToRemove),
    });
  };

  const generateMatrix = () => {
    setIsGenerating(true);
    const activeAttrs = attributeNames.filter(name => (attributeValues[name] || []).length > 0);
    if (activeAttrs.length === 0) {
      setIsGenerating(false);
      return;
    }

    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce((acc, curr) => {
        return acc.flatMap(c => curr.map(n => [...c, n]));
      }, [[]] as string[][]);
    };

    const valueArrays = activeAttrs.map(name => attributeValues[name]);
    const combos = cartesian(valueArrays);

    const newVariants: Partial<ProductVariant>[] = combos.map((combo, idx) => {
      const attrMap: Record<string, string> = {};
      combo.forEach((val, i) => {
        attrMap[activeAttrs[i]] = val;
      });

      const sku = `${product.sku || 'SKU'}-${combo.map(c => c.substring(0, 2).toUpperCase()).join('')}-${idx + 1}`;

      return {
        product_id: product.id,
        variant_name: `${product.name} (${combo.join(' / ')})`,
        sku,
        barcode: `200${Math.floor(100000000 + Math.random() * 900000000)}`,
        attribute_values: attrMap,
        cost_price: product.cost_price || 0,
        selling_price: product.selling_price || 0,
        wholesale_price: product.wholesale_price || 0,
        stock_quantity: 10,
        is_active: true,
      };
    });

    setGeneratedVariants(newVariants);
    setIsGenerating(false);
  };

  const handleSaveVariants = async () => {
    try {
      setIsSaving(true);
      const formattedAttrs = attributeNames.map(name => ({
        name,
        values: attributeValues[name] || [],
      }));

      await productEnterpriseApi.generateVariants(product.id, {
        attributes: formattedAttrs,
        default_cost: product.cost_price,
        default_price: product.selling_price,
      });

      notify.success('Variant matrix generated and saved successfully!', 'Variants Saved');
      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to save variants', err);
      notify.error(err?.response?.data?.message || 'Error saving variant matrix.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 via-white to-purple-50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Variant Matrix Generator</h3>
              <p className="text-xs text-gray-500">
                Product: <span className="font-semibold text-indigo-700">{product.name}</span> ({product.sku})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/70">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                1. Define Attributes & Values
              </h4>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="New Attribute (e.g. Material)"
                  value={newAttrName}
                  onChange={e => setNewAttrName(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  onClick={handleAddAttribute}
                  className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Attribute</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attributeNames.map(attr => (
                <div key={attr} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-800">{attr}</span>
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="text"
                        placeholder="Add value..."
                        value={newAttrValue[attr] || ''}
                        onChange={e => setNewAttrValue({ ...newAttrValue, [attr]: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && handleAddValue(attr)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded-md outline-none w-28"
                      />
                      <button
                        onClick={() => handleAddValue(attr)}
                        className="p-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                    {(attributeValues[attr] || []).map(val => (
                      <span
                        key={val}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                      >
                        {val}
                        <button
                          onClick={() => handleRemoveValue(attr, val)}
                          className="ml-1 text-indigo-400 hover:text-indigo-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {(attributeValues[attr] || []).length === 0 && (
                      <span className="text-xs text-gray-400 italic">No values added yet</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={generateMatrix}
                disabled={isGenerating}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-lg shadow flex items-center space-x-2 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Auto-Generate Variant Combinations</span>
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                2. Generated Variant Combinations ({generatedVariants.length})
              </h4>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-100 text-gray-700 font-semibold sticky top-0 uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2.5">Variant Name</th>
                      <th className="px-3 py-2.5">SKU</th>
                      <th className="px-3 py-2.5">Barcode</th>
                      <th className="px-3 py-2.5">Cost ($)</th>
                      <th className="px-3 py-2.5">Selling Price ($)</th>
                      <th className="px-3 py-2.5">Stock</th>
                      <th className="px-3 py-2.5 text-center">Status</th>
                      <th className="px-3 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {generatedVariants.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-400 italic">
                          Click "Auto-Generate Variant Combinations" to produce the variant grid.
                        </td>
                      </tr>
                    ) : (
                      generatedVariants.map((variant, idx) => (
                        <tr key={idx} className="hover:bg-indigo-50/30">
                          <td className="px-3 py-2 font-medium text-gray-900">
                            {variant.variant_name}
                          </td>
                          <td className="px-3 py-2 font-mono text-[11px] text-gray-600">
                            {variant.sku}
                          </td>
                          <td className="px-3 py-2 font-mono text-[11px] text-gray-500">
                            {variant.barcode}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={variant.cost_price ?? ''}
                              onChange={e => {
                                const val = parseFloat(e.target.value) || 0;
                                const updated = [...generatedVariants];
                                updated[idx].cost_price = val;
                                setGeneratedVariants(updated);
                              }}
                              className="w-16 px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={variant.selling_price ?? ''}
                              onChange={e => {
                                const val = parseFloat(e.target.value) || 0;
                                const updated = [...generatedVariants];
                                updated[idx].selling_price = val;
                                setGeneratedVariants(updated);
                              }}
                              className="w-16 px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 font-semibold text-emerald-600"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={variant.stock_quantity ?? ''}
                              onChange={e => {
                                const val = parseInt(e.target.value) || 0;
                                const updated = [...generatedVariants];
                                updated[idx].stock_quantity = val;
                                setGeneratedVariants(updated);
                              }}
                              className="w-14 px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                              Active
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => {
                                setGeneratedVariants(generatedVariants.filter((_, i) => i !== idx));
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {generatedVariants.length} variants ready to save
          </span>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveVariants}
              disabled={isSaving || generatedVariants.length === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-md flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Apply & Save Matrix'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
