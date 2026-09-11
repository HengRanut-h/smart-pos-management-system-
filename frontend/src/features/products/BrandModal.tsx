import React, { useState, useEffect } from 'react';
import { X, Award, Check, Globe } from 'lucide-react';
import { useApp } from '../../application/context/AppContext';

export interface BrandData {
  id?: number;
  name: string;
  code?: string;
  description?: string;
  website?: string;
  logo_path?: string;
}

interface BrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BrandData) => Promise<void>;
  brand?: BrandData | null;
}

export const BrandModal: React.FC<BrandModalProps> = ({
  isOpen,
  onClose,
  onSave,
  brand,
}) => {
  const { lang, notify } = useApp();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (brand) {
      setName(brand.name || '');
      setCode(brand.code || '');
      setWebsite(brand.website || '');
      setDescription(brand.description || '');
    } else {
      setName('');
      setCode('');
      setWebsite('');
      setDescription('');
    }
  }, [brand, isOpen]);

  if (!isOpen) return null;

  const isEditing = !!brand?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      notify.error(
        lang === 'kh' ? 'សូមបញ្ចូលឈ្មោះម៉ាកយីហោ!' : 'Please enter brand name!',
        'Validation Error'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        id: brand?.id,
        name: name.trim(),
        code: code.trim() || undefined,
        website: website.trim() || undefined,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      notify.error(
        err?.response?.data?.message || (lang === 'kh' ? 'បរាជ័យក្នុងការរក្សាទុក' : 'Failed to save brand'),
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
        <div className="px-6 py-5 bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-purple-200 uppercase tracking-widest">
                {lang === 'kh' ? 'ការគ្រប់គ្រងម៉ាកយីហោ' : 'Brand Management'}
              </div>
              <h2 className="text-lg font-black text-white tracking-tight">
                {isEditing
                  ? (lang === 'kh' ? `កែប្រែម៉ាក: ${brand?.name}` : `Edit Brand: ${brand?.name}`)
                  : (lang === 'kh' ? 'បង្កើតម៉ាកយីហោថ្មី' : 'Create New Brand')}
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
              {lang === 'kh' ? 'ឈ្មោះម៉ាកយីហោ *' : 'Brand Name *'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={lang === 'kh' ? 'ឧទាហរណ៍៖ Apple, Samsung, Coca-Cola' : 'e.g. Apple, Samsung, Coca-Cola'}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm font-semibold text-gray-800 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
              {lang === 'kh' ? 'កូដម៉ាក (Brand Code)' : 'Brand Code'}
            </label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={lang === 'kh' ? 'ឧទាហរណ៍៖ BRD-APL (ទុកទំនេរដើម្បីបង្កើតស្វ័យប្រវត្តិ)' : 'e.g. BRD-APL (Auto-generated if blank)'}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm font-mono font-semibold text-gray-800 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
              {lang === 'kh' ? 'គេហទំព័រផ្លូវការ (Website)' : 'Official Website'}
            </label>
            <div className="relative">
              <input
                type="url"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                placeholder="https://example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm font-medium text-gray-800 transition"
              />
              <Globe className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
              {lang === 'kh' ? 'ការពិពណ៌នា' : 'Description'}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={lang === 'kh' ? 'ព័ត៌មានលម្អិតបន្ថែមអំពីម៉ាកយីហោនេះ...' : 'Detailed description for this brand...'}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm font-normal text-gray-800 transition resize-none"
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
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 flex items-center space-x-2 transition cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? (lang === 'kh' ? 'កំពុងរក្សាទុក...' : 'Saving...')
                  : isEditing
                    ? (lang === 'kh' ? 'កែប្រែម៉ាក' : 'Update Brand')
                    : (lang === 'kh' ? 'រក្សាទុកម៉ាក' : 'Save Brand')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
