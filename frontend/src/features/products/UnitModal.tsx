import React, { useState, useEffect } from 'react';
import { X, Scale, Check } from 'lucide-react';
import { useApp } from '../../application/context/AppContext';

export interface UnitData {
  id?: number;
  name: string;
  code?: string;
  symbol?: string;
  decimal_places?: number;
}

interface UnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UnitData) => Promise<void>;
  unit?: UnitData | null;
}

export const UnitModal: React.FC<UnitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  unit,
}) => {
  const { lang, notify } = useApp();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimalPlaces, setDecimalPlaces] = useState<number>(2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (unit) {
      setName(unit.name || '');
      setCode(unit.code || '');
      setSymbol(unit.symbol || '');
      setDecimalPlaces(unit.decimal_places ?? 2);
    } else {
      setName('');
      setCode('');
      setSymbol('');
      setDecimalPlaces(2);
    }
  }, [unit, isOpen]);

  if (!isOpen) return null;

  const isEditing = !!unit?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      notify.error(
        lang === 'kh' ? 'សូមបញ្ចូលឈ្មោះខ្នាតទំនិញ!' : 'Please enter unit name!',
        'Validation Error'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        id: unit?.id,
        name: name.trim(),
        code: code.trim() || undefined,
        symbol: symbol.trim() || undefined,
        decimal_places: decimalPlaces,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      notify.error(
        err?.response?.data?.message || (lang === 'kh' ? 'បរាជ័យក្នុងការរក្សាទុក' : 'Failed to save unit'),
        'Save Error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-emerald-200 uppercase tracking-widest">
                {lang === 'kh' ? 'ការគ្រប់គ្រងខ្នាតរង្វាស់' : 'Unit of Measure'}
              </div>
              <h2 className="text-lg font-black text-white tracking-tight">
                {isEditing
                  ? (lang === 'kh' ? `កែប្រែខ្នាត: ${unit?.name}` : `Edit Unit: ${unit?.name}`)
                  : (lang === 'kh' ? 'បង្កើតខ្នាតរង្វាស់ថ្មី' : 'Create New Unit')}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
              {lang === 'kh' ? 'ឈ្មោះខ្នាត *' : 'Unit Name *'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={lang === 'kh' ? 'ឧទាហរណ៍៖ គីឡូក្រាម, កំប៉ុង, ប្រអប់, ដប' : 'e.g. Kilogram, Box, Can, Bottle'}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold text-gray-800 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                {lang === 'kh' ? 'និមិត្តសញ្ញា (Symbol)' : 'Symbol / Abbreviation'}
              </label>
              <input
                type="text"
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                placeholder={lang === 'kh' ? 'ឧទាហរណ៍៖ kg, bx, pcs' : 'e.g. kg, bx, pcs'}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-mono font-semibold text-gray-800 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                {lang === 'kh' ? 'កូដខ្នាត (Code)' : 'Unit Code'}
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder={lang === 'kh' ? 'ឧទាហរណ៍៖ UNT-KG' : 'e.g. UNT-KG'}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-mono font-semibold text-gray-800 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
              {lang === 'kh' ? 'ខ្ទង់ទសភាគ (Decimal Places)' : 'Decimal Precision'}
            </label>
            <select
              value={decimalPlaces}
              onChange={e => setDecimalPlaces(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold text-gray-800 transition bg-white"
            >
              <option value={0}>0 - {lang === 'kh' ? 'ចំនួនគត់ (ឧ. ដប, កំប៉ុង)' : 'Whole numbers only (e.g. Bottles, Cans)'}</option>
              <option value={1}>1 - {lang === 'kh' ? 'ទសភាគ ១ ខ្ទង់ (0.1)' : '1 decimal place (0.1)'}</option>
              <option value={2}>2 - {lang === 'kh' ? 'ទសភាគ ២ ខ្ទង់ (0.01)' : '2 decimal places (0.01)'}</option>
              <option value={3}>3 - {lang === 'kh' ? 'ទសភាគ ៣ ខ្ទង់ (0.001 - គីឡូក្រាម)' : '3 decimal places (0.001 - Weight/Volume)'}</option>
            </select>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
            >
              {lang === 'kh' ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center space-x-2 transition cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? (lang === 'kh' ? 'កំពុងរក្សាទុក...' : 'Saving...')
                  : isEditing
                    ? (lang === 'kh' ? 'កែប្រែខ្នាត' : 'Update Unit')
                    : (lang === 'kh' ? 'រក្សាទុកខ្នាត' : 'Save Unit')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
