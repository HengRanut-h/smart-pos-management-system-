import React, { useState, useEffect } from 'react';
import { X, FolderTree, Check } from 'lucide-react';
import { useApp } from '../../application/context/AppContext';

export interface CategoryData {
  id?: number;
  name: string;
  code?: string;
  description?: string;
  parent_id?: number | null;
  sort_order?: number;
  status?: string;
  is_active?: boolean;
  created_at?: string;
  image_url?: string;
  parent?: { id: number; name: string };
  products_count?: number;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CategoryData) => Promise<void>;
  category?: CategoryData | null;
  allCategories: Array<{ id: number; name: string }>;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  category,
  allCategories,
}) => {
  const { lang, notify } = useApp();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [parentId, setParentId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setCode(category.code || '');
      setParentId(category.parent_id || null);
      setDescription(category.description || '');
    } else {
      setName('');
      setCode('');
      setParentId(null);
      setDescription('');
    }
  }, [category, isOpen]);

  if (!isOpen) return null;

  const isEditing = !!category?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      notify.error(
        lang === 'kh' ? 'សូមបញ្ចូលឈ្មោះជំពូកទំនិញ!' : 'Please enter category name!',
        'Validation Error'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        id: category?.id,
        name: name.trim(),
        code: code.trim() || undefined,
        parent_id: parentId || null,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      notify.error(
        err?.response?.data?.message || (lang === 'kh' ? 'បរាជ័យក្នុងការរក្សាទុក' : 'Failed to save category'),
        'Save Error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prevent selecting self as parent
  const parentOptions = allCategories.filter(c => !category?.id || c.id !== category.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <FolderTree className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-blue-200 uppercase tracking-widest">
                {lang === 'kh' ? 'ការគ្រប់គ្រងជំពូកទំនិញ' : 'Category Management'}
              </div>
              <h2 className="text-lg font-black text-white tracking-tight">
                {isEditing
                  ? (lang === 'kh' ? `កែប្រែជំពូក: ${category?.name}` : `Edit Category: ${category?.name}`)
                  : (lang === 'kh' ? 'បង្កើតជំពូកទំនិញថ្មី' : 'Create New Category')}
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
              {lang === 'kh' ? 'ឈ្មោះជំពូកទំនិញ *' : 'Category Name *'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={lang === 'kh' ? 'ឧទាហរណ៍៖ ភេសជ្ជៈ ឬ គ្រឿងទេស' : 'e.g. Beverages, Dairy, Snacks'}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-semibold text-gray-800 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
              {lang === 'kh' ? 'កូដជំពូក (Category Code)' : 'Category Code'}
            </label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={lang === 'kh' ? 'ឧទាហរណ៍៖ CAT-BEV (ទុកទំនេរដើម្បីបង្កើតស្វ័យប្រវត្តិ)' : 'e.g. CAT-BEV (Auto-generated if blank)'}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono font-semibold text-gray-800 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
              {lang === 'kh' ? 'ជំពូកមេ (Parent Category)' : 'Parent Category (Hierarchy)'}
            </label>
            <select
              value={parentId || ''}
              onChange={e => setParentId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-semibold text-gray-800 transition bg-white"
            >
              <option value="">
                {lang === 'kh' ? '-- គ្មាន (ជំពូកកម្រិតកំពូល) --' : '-- None (Root Category) --'}
              </option>
              {parentOptions.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-500 mt-1">
              {lang === 'kh'
                ? 'ជ្រើសរើសជំពូកមេ ប្រសិនបើនេះជាជំពូករង (Subcategory)'
                : 'Select a parent if this is a subcategory in your hierarchy'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
              {lang === 'kh' ? 'ការពិពណ៌នា' : 'Description'}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={lang === 'kh' ? 'ព័ត៌មានលម្អិតបន្ថែមអំពីជំពូកនេះ...' : 'Detailed description for this category...'}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-normal text-gray-800 transition resize-none"
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
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center space-x-2 transition cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? (lang === 'kh' ? 'កំពុងរក្សាទុក...' : 'Saving...')
                  : isEditing
                    ? (lang === 'kh' ? 'កែប្រែជំពូក' : 'Update Category')
                    : (lang === 'kh' ? 'រក្សាទុកជំពូក' : 'Save Category')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
