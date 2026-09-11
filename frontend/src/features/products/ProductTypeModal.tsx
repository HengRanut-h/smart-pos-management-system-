import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  Check,
  AlertCircle,
  Palette,
  Boxes,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../../application/context/AppContext';

export interface ProductTypeDefinition {
  type: string;
  title: string;
  titleKh?: string;
  desc: string;
  descKh?: string;
  color: string;
  badge: string;
  stockRule?: string;
  isCustom?: boolean;
}

interface ProductTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productType: ProductTypeDefinition) => void;
  productType?: ProductTypeDefinition | null;
  existingTypes: ProductTypeDefinition[];
}

const COLOR_OPTIONS = [
  { label: 'Blue', color: 'border-blue-500', badge: 'bg-blue-50 text-blue-700' },
  { label: 'Purple', color: 'border-purple-500', badge: 'bg-purple-50 text-purple-700' },
  { label: 'Emerald', color: 'border-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
  { label: 'Amber', color: 'border-amber-500', badge: 'bg-amber-50 text-amber-700' },
  { label: 'Rose', color: 'border-rose-500', badge: 'bg-rose-50 text-rose-700' },
  { label: 'Cyan', color: 'border-cyan-500', badge: 'bg-cyan-50 text-cyan-700' },
  { label: 'Indigo', color: 'border-indigo-500', badge: 'bg-indigo-50 text-indigo-700' },
  { label: 'Orange', color: 'border-orange-500', badge: 'bg-orange-50 text-orange-700' },
  { label: 'Teal', color: 'border-teal-500', badge: 'bg-teal-50 text-teal-700' },
  { label: 'Yellow', color: 'border-yellow-500', badge: 'bg-yellow-50 text-yellow-700' },
];

export const ProductTypeModal: React.FC<ProductTypeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productType,
  existingTypes,
}) => {
  const { lang, notify } = useApp();

  const [typeCode, setTypeCode] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleKh, setTitleKh] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descKh, setDescKh] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [stockRule, setStockRule] = useState<'DEDUCT_ON_SALE' | 'NO_DEDUCTION' | 'BOM_RECIPE' | 'BATCH_EXPIRY' | 'SERIAL_TRACK' | 'RENTAL_RETURN'>('DEDUCT_ON_SALE');

  useEffect(() => {
    if (productType) {
      setTypeCode(productType.type);
      setTitleEn(productType.title || '');
      setTitleKh(productType.titleKh || '');
      setDescEn(productType.desc || '');
      setDescKh(productType.descKh || '');
      const matchColor = COLOR_OPTIONS.find(c => c.color === productType.color) || COLOR_OPTIONS[0];
      setSelectedColor(matchColor);
      setStockRule((productType.stockRule as any) || 'DEDUCT_ON_SALE');
    } else {
      setTypeCode('');
      setTitleEn('');
      setTitleKh('');
      setDescEn('');
      setDescKh('');
      setSelectedColor(COLOR_OPTIONS[0]);
      setStockRule('DEDUCT_ON_SALE');
    }
  }, [productType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedCode = typeCode.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    if (!normalizedCode) {
      notify.warning(
        lang === 'kh' ? 'សូមបញ្ចូលកូដប្រភេទផលិតផល (ឧ. RENTAL)' : 'Product Type Code is required',
        'Validation Warning'
      );
      return;
    }

    if (!titleEn.trim() && !titleKh.trim()) {
      notify.warning(
        lang === 'kh' ? 'សូមបញ្ចូលឈ្មោះប្រភេទផលិតផល' : 'Product Type Title is required',
        'Validation Warning'
      );
      return;
    }

    // If creating new, check for duplicate code
    if (!productType && existingTypes.some(t => t.type.toUpperCase() === normalizedCode)) {
      notify.warning(
        lang === 'kh' ? `កូដប្រភេទ "${normalizedCode}" មានរួចហើយ!` : `Type code "${normalizedCode}" already exists!`,
        'Duplicate Type'
      );
      return;
    }

    const payload: ProductTypeDefinition = {
      type: normalizedCode,
      title: titleEn.trim() || titleKh.trim(),
      titleKh: titleKh.trim() || titleEn.trim(),
      desc: descEn.trim() || descKh.trim(),
      descKh: descKh.trim() || descEn.trim(),
      color: selectedColor.color,
      badge: selectedColor.badge,
      stockRule,
      isCustom: productType ? productType.isCustom ?? true : true,
    };

    onSave(payload);
    notify.success(
      lang === 'kh'
        ? `ប្រភេទផលិតផល "${payload.titleKh || payload.title}" ត្រូវបានរក្សាទុកជោគជ័យ!`
        : `Product Type "${payload.title}" saved successfully!`,
      'Product Type Updated'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {productType
                  ? (lang === 'kh' ? `កែប្រែប្រភេទផលិតផល៖ ${productType.type}` : `Edit Product Type: ${productType.type}`)
                  : (lang === 'kh' ? 'បង្កើតប្រភេទផលិតផលថ្មី (Custom Product Type)' : 'Create Custom Product Type')}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'kh'
                  ? 'កំណត់លក្ខណៈសម្បត្តិ ពណ៌សម្គាល់ ឈ្មោះ និងវិធានស្តុកសម្រាប់ប្រភេទផលិតផល'
                  : 'Configure code, bilingual titles, badge styling, and inventory rules'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Type Code */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === 'kh' ? 'កូដសម្គាល់ប្រភេទ (Type Code / ID) *' : 'Type Code / Identifier *'}
            </label>
            <input
              type="text"
              required
              disabled={Boolean(productType && !productType.isCustom)}
              placeholder="e.g. RENTAL, CONSIGNMENT, SUBSCRIPTION"
              value={typeCode}
              onChange={e => setTypeCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
              className="w-full px-3.5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
            />
            {productType && !productType.isCustom ? (
              <p className="text-[11px] text-slate-400 mt-1">
                {lang === 'kh'
                  ? 'កូដប្រភេទប្រព័ន្ធគោលមិនអាចកែប្រែបានទេ ប៉ុន្តែអាចកែប្រែឈ្មោះ និងការពិពណ៌នាបាន'
                  : 'System core type code is fixed; titles, styling and descriptions can be customized.'}
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                {lang === 'kh'
                  ? 'ប្រើប្រាស់អក្សរធំ និងសញ្ញា (_) ឧទាហរណ៍៖ RENTAL_EQUIPMENT'
                  : 'Use uppercase letters and underscores, e.g. RENTAL_EQUIPMENT'}
              </p>
            )}
          </div>

          {/* Bilingual Titles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lang === 'kh' ? 'ឈ្មោះជាភាសាអង់គ្លេស (Title EN) *' : 'Title (English) *'}
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rental & Equipment"
                value={titleEn}
                onChange={e => setTitleEn(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lang === 'kh' ? 'ឈ្មោះជាភាសាខ្មែរ (Title KH)' : 'Title (Khmer)'}
              </label>
              <input
                type="text"
                placeholder="ឧទាហរណ៍៖ ទំនិញជួល & គ្រឿងបរិក្ខារ"
                value={titleKh}
                onChange={e => setTitleKh(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              />
            </div>
          </div>

          {/* Bilingual Descriptions */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lang === 'kh' ? 'ការពិពណ៌នាជាភាសាអង់គ្លេស (Description EN)' : 'Description (English)'}
              </label>
              <textarea
                rows={2}
                placeholder="Short explanation of how this product type behaves..."
                value={descEn}
                onChange={e => setDescEn(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lang === 'kh' ? 'ការពិពណ៌នាជាភាសាខ្មែរ (Description KH)' : 'Description (Khmer)'}
              </label>
              <textarea
                rows={2}
                placeholder="ការពន្យល់សង្ខេបអំពីរបៀបប្រើប្រាស់ប្រភេទផលិតផលនេះ..."
                value={descKh}
                onChange={e => setDescKh(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Color & Badge Theme */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-600" />
              <span>{lang === 'kh' ? 'ពណ៌សម្គាល់ & ផ្លាកសញ្ញា (Badge Theme)' : 'Color & Badge Theme'}</span>
            </label>
            <div className="grid grid-cols-5 gap-2.5">
              {COLOR_OPTIONS.map((c) => {
                const isSelected = selectedColor.color === c.color;
                return (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${c.badge}`}>
                      {typeCode || c.label}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-600 mt-1">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inventory Tracking & Stock Behavior */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
              <Boxes className="w-3.5 h-3.5 text-indigo-600" />
              <span>{lang === 'kh' ? 'វិធានគ្រប់គ្រងស្តុក (Inventory Behavior)' : 'Inventory Behavior'}</span>
            </label>
            <select
              value={stockRule}
              onChange={e => setStockRule(e.target.value as any)}
              className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-800"
            >
              <option value="DEDUCT_ON_SALE">
                {lang === 'kh' ? 'កាត់ស្តុកស្វ័យប្រវត្តិនៅពេលលក់ (Deduct on POS checkout)' : 'Deduct on POS checkout (Standard Simple)'}
              </option>
              <option value="NO_DEDUCTION">
                {lang === 'kh' ? 'មិនកាត់ស្តុកទំនិញ (សេវាកម្ម / ឌីជីថល)' : 'No physical stock deduction (Service / Digital)'}
              </option>
              <option value="BOM_RECIPE">
                {lang === 'kh' ? 'កាត់ស្តុកតាមរូបមន្តផលិតកម្ម BOM (Manufactured Item)' : 'Deduct via BOM Recipe formulation (Manufactured)'}
              </option>
              <option value="BATCH_EXPIRY">
                {lang === 'kh' ? 'តាមដានតាមលេខឡូត៍ និងថ្ងៃផុតកំណត់ (Batch & Lot Expiry)' : 'Track by batch number and expiration date'}
              </option>
              <option value="SERIAL_TRACK">
                {lang === 'kh' ? 'តាមដានតាមលេខស៊េរី និងលេខ IMEI (Serialized Item)' : 'Track unique serial numbers & IMEI per unit'}
              </option>
              <option value="RENTAL_RETURN">
                {lang === 'kh' ? 'តាមដានការជួល ប្រាក់កក់ និងប្រគល់ត្រឡប់ (Rental & Return)' : 'Track rental dispatch, deposit & return inspection'}
              </option>
            </select>
          </div>

          {/* Live Preview Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              {lang === 'kh' ? 'ទិដ្ឋភាពបង្ហាញជាក់ស្តែង (Live Preview)' : 'Live Preview Card'}
            </span>
            <div className={`bg-white p-4 rounded-xl border-l-4 ${selectedColor.color} border-slate-200 shadow-2xs`}>
              <div className="flex justify-between items-center mb-1.5">
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black ${selectedColor.badge}`}>
                  {typeCode || 'CUSTOM_TYPE'}
                </span>
                <span className="text-[11px] font-bold text-slate-400">0 products</span>
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">
                {lang === 'kh' ? (titleKh || titleEn || 'ចំណងជើងប្រភេទផលិតផល') : (titleEn || 'Product Type Title')}
              </h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {lang === 'kh' ? (descKh || descEn || 'ការពិពណ៌នាអំពីដំណើរការ និងវិធានស្តុក...') : (descEn || 'Description of product type behavior and stock rules...')}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              {lang === 'kh' ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>
                {productType
                  ? (lang === 'kh' ? 'រក្សាទុកការកែប្រែ' : 'Update Product Type')
                  : (lang === 'kh' ? 'បង្កើតប្រភេទផលិតផល' : 'Create Product Type')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
