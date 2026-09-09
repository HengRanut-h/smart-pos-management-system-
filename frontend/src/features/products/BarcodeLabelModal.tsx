import React, { useState, useMemo } from 'react';
import { Product } from '../../foundation/types';
import { BarcodeView } from '../../presentation/components/barcode/BarcodeView';
import {
  Printer,
  X,
  Layers,
  Settings2,
  Barcode,
  Check,
  Tag,
  Copy,
  Sliders,
  DollarSign,
  Sparkles,
  FileText,
  RotateCcw,
} from 'lucide-react';

interface BarcodeLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  initialSelectedProduct?: Product | null;
}

type LabelTemplate = 'thermal_58' | 'thermal_80' | 'a4_30' | 'shelf_talker';

export const BarcodeLabelModal: React.FC<BarcodeLabelModalProps> = ({
  isOpen,
  onClose,
  products,
  initialSelectedProduct,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<LabelTemplate>('thermal_58');
  const [selectedProductId, setSelectedProductId] = useState<number | 'ALL'>(() => {
    return initialSelectedProduct ? initialSelectedProduct.id : 'ALL';
  });
  const [labelQuantity, setLabelQuantity] = useState<number>(6);
  const [storeName, setStoreName] = useState<string>('SmartPOS Cambodia');
  
  // Customization toggles
  const [showStoreName, setShowStoreName] = useState<boolean>(true);
  const [showPriceUsd, setShowPriceUsd] = useState<boolean>(true);
  const [showPriceKhr, setShowPriceKhr] = useState<boolean>(true);
  const [showSku, setShowSku] = useState<boolean>(true);
  const [showCategory, setShowCategory] = useState<boolean>(false);
  const [exchangeRate] = useState<number>(4100);

  // List of items to generate labels for
  const targetProducts = useMemo(() => {
    if (selectedProductId === 'ALL') {
      return products;
    }
    const found = products.find((p) => p.id === selectedProductId);
    return found ? [found] : products;
  }, [selectedProductId, products]);

  // Generate standards-compliant, scannable barcode
  const renderBarcodeSvg = (code: string) => {
    return <BarcodeView value={code} height={28} width={1.8} className="w-full h-8" />;
  };

  // Build the flat list of labels based on quantity
  const labelsToPrint = useMemo(() => {
    const list: Product[] = [];
    targetProducts.forEach((prod) => {
      const count = selectedProductId === 'ALL' ? Math.min(labelQuantity, 4) : labelQuantity;
      for (let i = 0; i < count; i++) {
        list.push(prod);
      }
    });
    return list;
  }, [targetProducts, labelQuantity, selectedProductId]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-gray-900">Barcode & Price Label Studio</h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold">
                  PHASE 5 LABELS
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Design and print barcode price stickers for thermal rolls (58mm, 80mm) or A4 sheet stickers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-3 shrink-0">
          {/* 1. Template Picker */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Label Template
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'thermal_58', label: '58mm Roll' },
                { id: 'thermal_80', label: '80mm Roll' },
                { id: 'a4_30', label: 'A4 (30-up)' },
                { id: 'shelf_talker', label: 'Shelf Tag' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTemplate(t.id as LabelTemplate)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition text-left truncate ${
                    selectedTemplate === t.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Product Selector & Quantity */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Product & Qty
            </label>
            <div className="space-y-2">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Products in Catalog ({products.length})</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.barcode || p.sku})
                  </option>
                ))}
              </select>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Copies per item:</span>
                <div className="flex items-center space-x-1">
                  {[1, 2, 6, 12, 24].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setLabelQuantity(q)}
                      className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition ${
                        labelQuantity === q
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Field Toggles */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Visible Information
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showStoreName}
                  onChange={(e) => setShowStoreName(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <span className="text-slate-700 font-medium">Store Header</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPriceUsd}
                  onChange={(e) => setShowPriceUsd(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <span className="text-slate-700 font-medium">USD Price ($)</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPriceKhr}
                  onChange={(e) => setShowPriceKhr(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <span className="text-slate-700 font-medium">KHR Price (៛)</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSku}
                  onChange={(e) => setShowSku(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <span className="text-slate-700 font-medium">SKU Number</span>
              </label>
            </div>
          </div>
        </div>

        {/* Live Preview Container (Screen preview + Print Area) */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-700">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              Print Preview ({labelsToPrint.length} total labels):
            </span>
            <span>Template: <strong>{selectedTemplate.toUpperCase().replace('_', ' ')}</strong></span>
          </div>

          {/* Printable Label Grid */}
          <div
            id="print-label-canvas"
            className={`mx-auto bg-white p-3 shadow-md rounded-xl transition-all ${
              selectedTemplate === 'thermal_58'
                ? 'max-w-xs space-y-2'
                : selectedTemplate === 'thermal_80'
                ? 'max-w-sm space-y-3'
                : selectedTemplate === 'shelf_talker'
                ? 'grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl'
                : 'grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-w-3xl'
            }`}
          >
            {labelsToPrint.map((p, idx) => {
              const bc = p.barcode || p.sku;
              const priceUsd = Number(p.selling_price);
              const priceKhr = Math.round(priceUsd * exchangeRate);

              if (selectedTemplate === 'shelf_talker') {
                return (
                  <div
                    key={`${p.id}-${idx}`}
                    className="p-3 border-2 border-dashed border-slate-800 rounded-xl flex flex-col justify-between bg-white text-slate-900"
                  >
                    <div className="border-b border-slate-300 pb-1 mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {showStoreName ? storeName : 'SMARTPOS'}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {p.sku}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1 mb-1">{p.name}</h3>

                    <div className="flex items-baseline justify-between my-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-extrabold text-emerald-700">
                          ${priceUsd.toFixed(2)}
                        </span>
                        {showPriceKhr && (
                          <span className="text-xs font-bold text-slate-500">
                            / {priceKhr.toLocaleString()} ៛
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-bold uppercase text-slate-600">
                        {p.unit?.name || 'Unit'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 text-center">
                      <div className="w-full px-2">
                        {renderBarcodeSvg(bc)}
                      </div>
                      <span className="text-[10px] font-mono font-bold tracking-widest text-slate-700 block mt-0.5">
                        {bc}
                      </span>
                    </div>
                  </div>
                );
              }

              // Standard Thermal 58mm / 80mm / A4 Label
              return (
                <div
                  key={`${p.id}-${idx}`}
                  className={`border border-slate-300 rounded-lg p-2 flex flex-col justify-between bg-white text-center ${
                    selectedTemplate === 'thermal_58' ? 'max-w-[200px] mx-auto' : ''
                  }`}
                >
                  {showStoreName && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block truncate">
                      {storeName}
                    </span>
                  )}

                  <h4 className="text-xs font-bold text-slate-900 truncate my-0.5">
                    {p.name}
                  </h4>

                  <div className="w-full my-1">
                    {renderBarcodeSvg(bc)}
                    <span className="text-[10px] font-mono font-bold tracking-widest text-slate-700 block">
                      {bc}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold mt-0.5">
                    {showPriceUsd && (
                      <span className="text-emerald-700">${priceUsd.toFixed(2)}</span>
                    )}
                    {showPriceUsd && showPriceKhr && <span className="text-slate-300">|</span>}
                    {showPriceKhr && (
                      <span className="text-slate-600 text-[11px]">{priceKhr.toLocaleString()} ៛</span>
                    )}
                  </div>

                  {showSku && (
                    <span className="text-[9px] text-slate-400 font-mono block">
                      SKU: {p.sku}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer with Print Button */}
        <div className="pt-3.5 border-t border-gray-100 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Ready to print <strong>{labelsToPrint.length} stickers</strong> via browser print dialog.
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print {labelsToPrint.length} Labels</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
