import React, { useState, useEffect } from 'react';
import { X, Tag, Check, Plus, Trash2, Palette, Sparkles, Layers } from 'lucide-react';
import { useApp } from '../../application/context/AppContext';

export interface AttributeData {
  id?: number;
  name: string;
  slug?: string;
  type?: 'TEXT_PILL' | 'COLOR_PICKER' | 'BUTTON_SELECT' | 'IMAGE_SWATCH';
  description?: string;
  values: string[];
}

interface AttributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AttributeData) => Promise<void> | void;
  attribute?: AttributeData | null;
}

export const AttributeModal: React.FC<AttributeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  attribute,
}) => {
  const { lang, notify } = useApp();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState<'TEXT_PILL' | 'COLOR_PICKER' | 'BUTTON_SELECT' | 'IMAGE_SWATCH'>('TEXT_PILL');
  const [description, setDescription] = useState('');
  const [values, setValues] = useState<string[]>([]);
  const [newValueInput, setNewValueInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (attribute) {
      setName(attribute.name || '');
      setSlug(attribute.slug || '');
      setType(attribute.type || 'TEXT_PILL');
      setDescription(attribute.description || '');
      setValues(Array.isArray(attribute.values) ? [...attribute.values] : []);
    } else {
      setName('');
      setSlug('');
      setType('TEXT_PILL');
      setDescription('');
      setValues(['Default']);
    }
    setNewValueInput('');
  }, [attribute, isOpen]);

  if (!isOpen) return null;

  const isEditing = !!attribute?.id;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing && !slug) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
  };

  const handleAddValue = () => {
    const trimmed = newValueInput.trim();
    if (!trimmed) return;
    if (values.includes(trimmed)) {
      notify.error(lang === 'kh' ? 'តម្លៃនេះមានរួចហើយ!' : 'This value already exists!', 'Duplicate Value');
      return;
    }
    setValues(prev => [...prev, trimmed]);
    setNewValueInput('');
  };

  const handleRemoveValue = (indexToRemove: number) => {
    setValues(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDownValue = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddValue();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      notify.error(
        lang === 'kh' ? 'សូមបញ្ចូលឈ្មោះលក្ខណៈទំនិញ!' : 'Please enter attribute name!',
        'Validation Error'
      );
      return;
    }

    if (values.length === 0) {
      notify.error(
        lang === 'kh' ? 'សូមបញ្ចូលយ៉ាងហោចណាស់តម្លៃ ១ សម្រាប់លក្ខណៈនេះ!' : 'Please add at least 1 attribute value!',
        'Validation Error'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        id: attribute?.id,
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        type,
        description: description.trim() || undefined,
        values,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      notify.error(
        err?.response?.data?.message || (lang === 'kh' ? 'បរាជ័យក្នុងការរក្សាទុក' : 'Failed to save attribute'),
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
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xs">
              <Tag className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-indigo-200 uppercase tracking-widest">
                {lang === 'kh' ? 'ការគ្រប់គ្រងលក្ខណៈទំនិញ' : 'Attribute Management'}
              </div>
              <h2 className="text-lg font-black text-white tracking-tight">
                {isEditing
                  ? (lang === 'kh' ? `កែប្រែលក្ខណៈ: ${attribute?.name}` : `Edit Attribute: ${attribute?.name}`)
                  : (lang === 'kh' ? 'បង្កើតលក្ខណៈទំនិញថ្មី' : 'Create Product Attribute')}
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
          {/* Attribute Name */}
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
              {lang === 'kh' ? 'ឈ្មោះលក្ខណៈ (Attribute Name) *' : 'Attribute Name *'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder={lang === 'kh' ? 'ឧទាហរណ៍៖ ទំហំ (Size), ពណ៌ (Color), ក្លិន (Flavor)' : 'e.g. Size, Color, Flavor, Material, Storage'}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-semibold text-gray-800 transition"
            />
          </div>

          {/* Slug & Type Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                {lang === 'kh' ? 'កូដ Slug' : 'Code Slug'}
              </label>
              <input
                type="text"
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="e.g. size, color"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-mono font-semibold text-gray-800 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                {lang === 'kh' ? 'ទម្រង់បង្ហាញ' : 'Display Type'}
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-semibold text-gray-800 transition bg-white"
              >
                <option value="TEXT_PILL">Text Badge / Pill (S, M, L)</option>
                <option value="COLOR_PICKER">Color Swatch (Red, Blue)</option>
                <option value="BUTTON_SELECT">Button Radio Group</option>
                <option value="IMAGE_SWATCH">Visual Image Swatch</option>
              </select>
            </div>
          </div>

          {/* Attribute Values Builder */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider">
              {lang === 'kh' ? 'តម្លៃលក្ខណៈ (Attribute Values) *' : 'Attribute Values / Options *'}
            </label>
            <p className="text-[11px] text-gray-500">
              {lang === 'kh'
                ? 'បញ្ចូលតម្លៃនីមួយៗ រួចចុច Enter ឬប៊ូតុង + បន្ថែម'
                : 'Enter each value and press Enter or click Add (e.g. Small, Medium, Large)'}
            </p>

            <div className="flex space-x-2">
              <input
                type="text"
                value={newValueInput}
                onChange={e => setNewValueInput(e.target.value)}
                onKeyDown={handleKeyDownValue}
                placeholder={lang === 'kh' ? 'ឧ. Small, 500ml, XL, ក្រហម...' : 'e.g. Small, 128GB, Medium, Red...'}
                className="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-semibold text-gray-800 transition"
              />
              <button
                type="button"
                onClick={handleAddValue}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'kh' ? 'បន្ថែម' : 'Add'}</span>
              </button>
            </div>

            {/* Values Chips List */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 min-h-[70px] flex flex-wrap gap-2 items-center">
              {values.map((val, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white border border-indigo-200 text-indigo-800 text-xs font-bold rounded-xl shadow-2xs group"
                >
                  <span>{val}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveValue(idx)}
                    className="p-0.5 text-gray-400 hover:text-red-600 rounded-full transition cursor-pointer"
                    title="Remove value"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {values.length === 0 && (
                <span className="text-xs text-gray-400 italic">
                  {lang === 'kh' ? 'គ្មានតម្លៃនៅឡើយទេ។ សូមបន្ថែមតម្លៃខាងលើ' : 'No values added yet. Add values above.'}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
              {lang === 'kh' ? 'ការពិពណ៌នា' : 'Description / Notes'}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={lang === 'kh' ? 'ព័ត៌មានលម្អិតអំពីលក្ខណៈនេះ...' : 'Usage guidance or notes for this attribute...'}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-normal text-gray-800 transition resize-none"
            />
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
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center space-x-2 transition cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? (lang === 'kh' ? 'កំពុងរក្សាទុក...' : 'Saving...')
                  : isEditing
                    ? (lang === 'kh' ? 'កែប្រែលក្ខណៈ' : 'Update Attribute')
                    : (lang === 'kh' ? 'រក្សាទុកលក្ខណៈ' : 'Save Attribute')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
