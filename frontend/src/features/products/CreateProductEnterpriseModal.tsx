import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Package,
  Sparkles,
  Barcode,
  Check,
  DollarSign,
  Layers,
  Image as ImageIcon,
  Globe,
  Truck,
  ShieldCheck,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Upload,
  Trash2,
  Link
} from 'lucide-react';
import { EnterpriseProduct, ProductType } from '../../foundation/types/productEnterprise';
import { productEnterpriseApi } from '../../data-access/productEnterpriseApi';
import { useApp } from '../../application/context/AppContext';

interface CreateProductEnterpriseModalProps {
  product?: EnterpriseProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: Array<{ id: number; name: string }>;
  brands: Array<{ id: number; name: string }>;
  units: Array<{ id: number; name: string }>;
}

export const CreateProductEnterpriseModal: React.FC<CreateProductEnterpriseModalProps> = ({
  product,
  isOpen,
  onClose,
  onSaved,
  categories,
  brands,
  units,
}) => {
  const { lang, notify } = useApp();
  const [activeTab, setActiveTab] = useState<'general' | 'pricing' | 'inventory' | 'media_seo'>('general');
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [productCode, setProductCode] = useState('');
  const [productType, setProductType] = useState<ProductType>('SIMPLE');
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [brandId, setBrandId] = useState<number | undefined>(brands[0]?.id);
  const [unitId, setUnitId] = useState<number>(units[0]?.id || 1);
  const [statusId, setStatusId] = useState(1);

  const availableProductTypes = useMemo(() => {
    try {
      const saved = localStorage.getItem('smartpos_custom_product_types');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [
      { type: 'SIMPLE', title: 'Standard / Simple Product', titleKh: 'ទំនិញធម្មតា (Standard / Simple Product)' },
      { type: 'VARIABLE', title: 'Variable Product (Size, Color, Matrix)', titleKh: 'ទំនិញមានវ៉ារ្យ៉ង់ (Variable Product - Size, Color, Matrix)' },
      { type: 'BUNDLE', title: 'Combo Kit / Bundle', titleKh: 'ទំនិញជាកញ្ចប់ (Combo Kit / Bundle)' },
      { type: 'MANUFACTURED', title: 'Manufactured Item (BOM Recipe)', titleKh: 'ទំនិញផលិត (Manufactured Item - BOM Recipe)' },
      { type: 'RAW_MATERIAL', title: 'Raw Material / Ingredient', titleKh: 'វត្ថុតាងដើម (Raw Material / Ingredient)' },
      { type: 'BATCH_TRACKED', title: 'Batch / Lot Tracked (Expiry)', titleKh: 'ទំនិញតាមឡូត៍ (Batch / Lot Tracked - Expiry)' },
      { type: 'SERIALIZED', title: 'Serialized Item (IMEI / Serial)', titleKh: 'ទំនិញតាមលេខស៊េរី (Serialized Item - IMEI / Serial)' },
      { type: 'SERVICE', title: 'Service / Non-physical', titleKh: 'សេវាកម្ម (Service / Non-physical)' },
      { type: 'DIGITAL', title: 'Digital / Downloadable', titleKh: 'ទំនិញឌីជីថល (Digital / Downloadable)' },
      { type: 'COMBO', title: 'Fast Food / Meal Combo', titleKh: 'កញ្ចប់អាហាររហ័ស (Fast Food / Meal Combo)' },
    ];
  }, [isOpen]);

  // Pricing
  const [costPrice, setCostPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [wholesalePrice, setWholesalePrice] = useState(0);
  const [vipPrice, setVipPrice] = useState(0);
  const [memberPrice, setMemberPrice] = useState(0);
  const [onlinePrice, setOnlinePrice] = useState(0);
  const [taxRate, setTaxRate] = useState(10);
  const [shippingCost, setShippingCost] = useState(0);
  const [importTax, setImportTax] = useState(0);
  const [handlingCost, setHandlingCost] = useState(0);

  // Inventory
  const [openingStock, setOpeningStock] = useState(0);
  const [safetyStock, setSafetyStock] = useState(5);
  const [reorderLevel, setReorderLevel] = useState(10);
  const [reorderQuantity, setReorderQuantity] = useState(20);
  const [weight, setWeight] = useState(0);
  const [length, setLength] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  // Media & SEO
  const [imageUrl, setImageUrl] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [seoSlug, setSeoSlug] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [visibility, setVisibility] = useState<'ALL' | 'POS_ONLY' | 'ONLINE_ONLY' | 'HIDDEN'>('ALL');

  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imageInputMode, setImageInputMode] = useState<'file' | 'url'>('file');

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      notify.warning(
        lang === 'kh' ? 'សូមជ្រើសរើសឯកសាររូបភាព (PNG, JPG, WEBP)' : 'Please select a valid image file',
        'Invalid File'
      );
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify.warning(
        lang === 'kh' ? 'ទំហំរូបភាពមិនត្រូវលើសពី 5MB ឡើយ' : 'Image file size must be less than 5MB',
        'File Too Large'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) setImageUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setSku(product.sku || '');
      setBarcode(product.barcode || '');
      setProductCode(product.product_code || '');
      setProductType(product.product_type || 'SIMPLE');
      setCategoryId(product.category_id || (categories[0]?.id || 1));
      setBrandId(product.brand_id);
      setUnitId(product.unit_id || (units[0]?.id || 1));
      setStatusId(product.status_id || 1);

      setCostPrice(product.cost_price || 0);
      setSellingPrice(product.selling_price || 0);
      setWholesalePrice(product.wholesale_price || 0);
      setVipPrice(product.vip_price || 0);
      setMemberPrice(product.member_price || 0);
      setOnlinePrice(product.online_price || 0);
      setTaxRate(product.tax_rate || 10);
      setShippingCost(product.shipping_cost || 0);
      setImportTax(product.import_tax || 0);
      setHandlingCost(product.handling_cost || 0);

      setOpeningStock(product.opening_stock || 0);
      setSafetyStock(product.safety_stock || 5);
      setReorderLevel(product.reorder_level || 10);
      setReorderQuantity(product.reorder_quantity || 20);
      setWeight(product.weight || 0);
      if (product.dimensions) {
        if (typeof product.dimensions === 'object') {
          setLength(product.dimensions.length || 0);
          setWidth(product.dimensions.width || 0);
          setHeight(product.dimensions.height || 0);
        } else if (typeof product.dimensions === 'string') {
          const parts = (product.dimensions as string).replace(/[^\d.xX]/g, '').split(/[xX]/);
          if (parts.length >= 3) {
            setLength(parseFloat(parts[0]) || 0);
            setWidth(parseFloat(parts[1]) || 0);
            setHeight(parseFloat(parts[2]) || 0);
          }
        }
      }

      setImageUrl(product.image_url || '');
      setShortDescription(product.short_description || '');
      setDescription(product.description || '');
      setSeoSlug(product.seo_slug || '');
      setSeoTitle(product.seo_title || '');
      setSeoDescription(product.seo_description || '');
      setIsFeatured(product.is_featured || false);
      setIsNew(product.is_new || false);
      if (Array.isArray(product.visibility)) {
        setVisibility((product.visibility[0] as any) || 'ALL');
      } else {
        setVisibility(product.visibility || 'ALL');
      }
    } else {
      // reset defaults
      setName('');
      setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setBarcode(`200${Math.floor(100000000 + Math.random() * 900000000)}`);
      setProductCode('');
      setProductType('SIMPLE');
      setCostPrice(0);
      setSellingPrice(0);
      setWholesalePrice(0);
      setVipPrice(0);
      setMemberPrice(0);
      setOnlinePrice(0);
      setOpeningStock(10);
      setImageUrl('');
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const autoGenerateSku = () => {
    const prefix = name ? name.substring(0, 3).toUpperCase() : 'PRD';
    setSku(`${prefix}-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const autoGenerateBarcode = () => {
    // Generate valid 13 digit EAN
    const prefix = '200';
    const rand = Math.floor(100000000 + Math.random() * 900000000).toString();
    const twelve = (prefix + rand).slice(0, 12);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(twelve[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const rem = sum % 10;
    const check = rem === 0 ? 0 : 10 - rem;
    setBarcode(twelve + check);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      notify.warning(
        lang === 'kh' ? 'សូមបញ្ចូលឈ្មោះទំនិញ' : 'Product name is required',
        'Validation Warning'
      );
      return;
    }
    if (!sku.trim()) {
      notify.warning(
        lang === 'kh' ? 'សូមបញ្ចូលកូដ SKU ទំនិញ' : 'SKU is required',
        'Validation Warning'
      );
      return;
    }

    try {
      setIsSaving(true);
      const payload: Partial<EnterpriseProduct> = {
        name,
        sku,
        barcode,
        product_code: productCode,
        product_type: productType,
        category_id: categoryId,
        brand_id: brandId,
        unit_id: unitId,
        status_id: statusId,
        cost_price: costPrice,
        selling_price: sellingPrice,
        wholesale_price: wholesalePrice,
        vip_price: vipPrice,
        member_price: memberPrice,
        online_price: onlinePrice,
        tax_rate: taxRate,
        shipping_cost: shippingCost,
        import_tax: importTax,
        handling_cost: handlingCost,
        opening_stock: openingStock,
        safety_stock: safetyStock,
        reorder_level: reorderLevel,
        reorder_quantity: reorderQuantity,
        weight,
        dimensions: { length, width, height },
        image_url: imageUrl,
        short_description: shortDescription,
        description,
        seo_slug: seoSlug || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        seo_title: seoTitle || name,
        seo_description: seoDescription,
        is_featured: isFeatured,
        is_new: isNew,
        visibility,
      };

      if (product?.id) {
        await productEnterpriseApi.updateProduct(product.id, payload);
        notify.success(
          lang === 'kh' ? `ផលិតផល "${name}" ត្រូវបានកែប្រែជោគជ័យ!` : `Product "${name}" updated successfully!`,
          'Product Updated'
        );
      } else {
        await productEnterpriseApi.createProduct(payload);
        notify.success(
          lang === 'kh' ? `ផលិតផល "${name}" ត្រូវបានបង្កើតជោគជ័យ!` : `Product "${name}" created successfully!`,
          'Product Created'
        );
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      notify.error(err?.response?.data?.message || 'Failed to save product. Please check input values.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {product
                  ? (lang === 'kh' ? `កែប្រែផលិតផលសហគ្រាស៖ ${product.name}` : `Edit Enterprise Product: ${product.name}`)
                  : (lang === 'kh' ? 'បង្កើតផលិតផលសហគ្រាសថ្មី' : 'Create Enterprise Product')}
              </h3>
              <p className="text-xs text-gray-500">
                {lang === 'kh'
                  ? 'កំណត់រចនាសម្ព័ន្ធកំណត់ត្រា ថ្លៃដើម តម្លៃច្រើនកម្រិត ដែនកំណត់ស្តុក និងប្រភេទផលិតផល'
                  : 'Configure full product lifecycle, multi-tier pricing, stock limits, and types'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none py-0.5">
            {[
              {
                id: 'general',
                step: '1',
                icon: Package,
                titleKh: '១. ព័ត៌មានទូទៅ & ការបែងចែក',
                titleEn: '1. General & Classification',
              },
              {
                id: 'pricing',
                step: '2',
                icon: DollarSign,
                titleKh: '២. តម្លៃច្រើនកម្រិត & ថ្លៃដើម',
                titleEn: '2. Multi-Tier Pricing & Landed Cost',
              },
              {
                id: 'inventory',
                step: '3',
                icon: Layers,
                titleKh: '៣. ស្តុក & ភស្តុភារ',
                titleEn: '3. Inventory & Logistics',
              },
              {
                id: 'media_seo',
                step: '4',
                icon: Globe,
                titleKh: '៤. មេឌៀ & SEO ពាណិជ្ជកម្ម',
                titleEn: '4. Media & E-commerce SEO',
              },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-2 ring-blue-600/20 translate-y-[-1px]'
                      : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/90 shadow-2xs'
                  }`}
                >
                  <TabIcon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{lang === 'kh' ? tab.titleKh : tab.titleEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === 'kh' ? 'ឈ្មោះផលិតផល *' : 'Product Title / Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={lang === 'kh' ? 'ឧទាហរណ៍៖ កាហ្វេអាល់រ៉ាប៊ីកា ៥០០ក្រាម' : 'e.g. Organic Arabica Coffee Beans 500g'}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  />
                </div>

                {/* Local Image Upload & URL Input Component */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-700">
                      {lang === 'kh' ? 'រូបភាពផលិតផល (ជ្រើសរើសពីកុំព្យូទ័រ / Local File)' : 'Product Image (Upload from Local Computer / File)'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setImageInputMode(imageInputMode === 'file' ? 'url' : 'file')}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
                    >
                      <Link className="w-3 h-3" />
                      <span>
                        {imageInputMode === 'file'
                          ? (lang === 'kh' ? 'ឬបញ្ចូលតំណភ្ជាប់ URL' : 'Or paste image URL')
                          : (lang === 'kh' ? 'ជ្រើសរើសរូបភាពពី local' : 'Upload from local file')}
                      </span>
                    </button>
                  </div>

                  {imageInputMode === 'file' ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-4 text-center transition ${
                        isDragging
                          ? 'border-blue-500 bg-blue-50/50'
                          : imageUrl
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : 'border-slate-300 bg-slate-50/70 hover:bg-slate-100/60'
                      }`}
                    >
                      {imageUrl ? (
                        <div className="flex items-center space-x-4">
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shadow-sm shrink-0 bg-white group">
                            <img src={imageUrl} alt="Product" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setImageUrl('')}
                              className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                              title="Remove Image"
                            >
                              <Trash2 className="w-5 h-5 text-red-300" />
                            </button>
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700">
                              <Check className="w-4 h-4 text-emerald-600" />
                              <span>{lang === 'kh' ? 'រូបភាពត្រូវបានជ្រើសរើសជោគជ័យ!' : 'Image Selected Successfully!'}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {lang === 'kh'
                                ? 'រូបភាព local ត្រូវបានផ្ទុកជា Base64 សម្រាប់ការរក្សាទុក'
                                : 'Local image loaded as Base64 binary data'}
                            </p>
                            <div className="mt-2 flex items-center space-x-2">
                              <label className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer shadow-2xs">
                                <span>{lang === 'kh' ? 'ផ្លាស់ប្តូររូបភាព' : 'Change Image'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                                  }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => setImageUrl('')}
                                className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg border border-red-200 font-medium cursor-pointer"
                              >
                                {lang === 'kh' ? 'លុបចេញ' : 'Remove'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center cursor-pointer py-2">
                          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl mb-2">
                            <Upload className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-bold text-slate-800">
                            {lang === 'kh' ? 'ចុចដើម្បីជ្រើសរើសរូបភាពពីកុំព្យូទ័រ (Local File) ឬអូសទម្លាក់ទីនេះ' : 'Click to upload image from local device or drag & drop'}
                          </span>
                          <span className="text-[11px] text-slate-400 mt-1">
                            PNG, JPG, JPEG, WEBP, GIF (Max 5MB)
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <div className="relative flex-1">
                        <input
                          type="url"
                          placeholder={lang === 'kh' ? 'បញ្ចូលតំណភ្ជាប់ URL (ឧទាហរណ៍៖ https://domain.com/image.jpg)' : 'https://example.com/product-image.jpg'}
                          value={imageUrl}
                          onChange={e => setImageUrl(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        {imageUrl && (
                          <button
                            type="button"
                            onClick={() => setImageUrl('')}
                            className="absolute right-2.5 top-2 text-gray-400 hover:text-red-500 cursor-pointer"
                            title="Clear Image URL"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt="Product Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-gray-700">
                      {lang === 'kh' ? 'កូដ SKU (Stock Keeping Unit) *' : 'SKU (Stock Keeping Unit) *'}
                    </label>
                    <button
                      type="button"
                      onClick={autoGenerateSku}
                      className="text-[11px] text-blue-600 hover:underline flex items-center space-x-0.5"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{lang === 'kh' ? 'បង្កើតស្វ័យប្រវត្តិ' : 'Auto SKU'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-gray-700">
                      {lang === 'kh' ? 'បាកូដ / EAN-13 *' : 'Barcode / EAN-13 *'}
                    </label>
                    <button
                      type="button"
                      onClick={autoGenerateBarcode}
                      className="text-[11px] text-blue-600 hover:underline flex items-center space-x-0.5"
                    >
                      <Barcode className="w-3 h-3" />
                      <span>{lang === 'kh' ? 'បង្កើតបាកូដ' : 'Generate EAN'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === 'kh' ? `ប្រភេទផលិតផល (${availableProductTypes.length} ប្រភេទ)` : `Product Type (${availableProductTypes.length} Types)`}
                  </label>
                  <select
                    value={productType}
                    onChange={e => setProductType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-blue-700"
                  >
                    {availableProductTypes.map((t: any) => (
                      <option key={t.type} value={t.type}>
                        {lang === 'kh' ? (t.titleKh || t.title) : t.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{lang === 'kh' ? 'ជំពូកទំនិញ' : 'Category'}</label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{lang === 'kh' ? 'ម៉ាកយីហោ' : 'Brand'}</label>
                  <select
                    value={brandId || ''}
                    onChange={e => setBrandId(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">{lang === 'kh' ? '-- ទូទៅ / គ្មានម៉ាក --' : '-- None / Generic --'}</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{lang === 'kh' ? 'ខ្នាតរង្វាស់ចម្បង' : 'Primary Unit'}</label>
                  <select
                    value={unitId}
                    onChange={e => setUnitId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {units.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {lang === 'kh' ? 'សេចក្តីសង្ខេបខ្លី / ចំណងជើងរង' : 'Short Description / Subtitle'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'kh' ? 'សេចក្តីសង្ខេបលឿនសម្រាប់វិក្កយបត្រ ឬ POS' : 'Quick summary for receipt or POS line item'}
                  value={shortDescription}
                  onChange={e => setShortDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{lang === 'kh' ? 'ការពិពណ៌នាពេញលេញ' : 'Full Description'}</label>
                <textarea
                  rows={3}
                  placeholder={lang === 'kh' ? 'លក្ខណៈបច្ចេកទេសលម្អិត, គ្រឿងផ្សំ, ការណែនាំអំពីការរក្សាទុក...' : 'Detailed specifications, ingredients, storage instructions...'}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200/70">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
                  {lang === 'kh' ? 'ថ្លៃដើមដឹកជញ្ជូន & ថ្លៃដើមអ្នកផ្គត់ផ្គង់' : 'Landed Cost & Supplier Base'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{lang === 'kh' ? 'ថ្លៃដើមគ្រឹះ ($)' : 'Base Cost ($)'}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costPrice}
                      onChange={e => setCostPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{lang === 'kh' ? 'ថ្លៃដឹកជញ្ជូន ($)' : 'Shipping / Freight ($)'}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={shippingCost}
                      onChange={e => setShippingCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{lang === 'kh' ? 'ពន្ធគយ ($)' : 'Customs & Duty ($)'}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={importTax}
                      onChange={e => setImportTax(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{lang === 'kh' ? 'ថ្លៃសេវាចំណាយផ្សេងៗ ($)' : 'Handling / Port ($)'}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={handlingCost}
                      onChange={e => setHandlingCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none"
                    />
                  </div>
                </div>
                <div className="mt-2 text-xs font-bold text-blue-800">
                  {lang === 'kh' ? 'ថ្លៃដើមសរុប (Landed Cost)៖' : 'Total Landed Cost:'} ${(costPrice + shippingCost + importTax + handlingCost).toFixed(2)}
                </div>
              </div>

              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                {lang === 'kh' ? 'ម៉ាទ្រីសតម្លៃលក់ច្រើនកម្រិត' : 'Multi-Tier Selling Prices'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-emerald-700 mb-1">
                    {lang === 'kh' ? 'តម្លៃលក់រាយ ($) *' : 'Retail Selling Price ($) *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={sellingPrice}
                    onChange={e => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-extrabold text-emerald-800 border-2 border-emerald-400 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-indigo-700 mb-1">{lang === 'kh' ? 'តម្លៃលក់ដុំ ($)' : 'Wholesale Price ($)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={wholesalePrice}
                    onChange={e => setWholesalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-purple-700 mb-1">{lang === 'kh' ? 'តម្លៃអតិថិជន VIP ($)' : 'VIP Customer Price ($)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={vipPrice}
                    onChange={e => setVipPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{lang === 'kh' ? 'តម្លៃសមាជិក/សន្សំពិន្ទុ ($)' : 'Member / Loyalty Price ($)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={memberPrice}
                    onChange={e => setMemberPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{lang === 'kh' ? 'តម្លៃលក់តាមអនឡាញ ($)' : 'Online E-commerce Price ($)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={onlinePrice}
                    onChange={e => setOnlinePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{lang === 'kh' ? 'អត្រាពន្ធ (%)' : 'Tax Rate (%)'}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={taxRate}
                    onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                {lang === 'kh' ? 'កម្រិតស្តុក & វិធានបំពេញស្តុក' : 'Stock Levels & Replenishment Rules'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{lang === 'kh' ? 'ស្តុកដើមគ្រា' : 'Opening Stock'}</label>
                  <input
                    type="number"
                    value={openingStock}
                    onChange={e => setOpeningStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{lang === 'kh' ? 'ស្តុកការពារសុវត្ថិភាព' : 'Safety Buffer Stock'}</label>
                  <input
                    type="number"
                    value={safetyStock}
                    onChange={e => setSafetyStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{lang === 'kh' ? 'កម្រិតព្រមានបញ្ជាទិញឡើងវិញ' : 'Reorder Alert Level'}</label>
                  <input
                    type="number"
                    value={reorderLevel}
                    onChange={e => setReorderLevel(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{lang === 'kh' ? 'ចំនួនបញ្ជាទិញតាមលំនាំដើម' : 'Reorder Default Qty'}</label>
                  <input
                    type="number"
                    value={reorderQuantity}
                    onChange={e => setReorderQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider pt-3">
                {lang === 'kh' ? 'ភស្តុភារ & ទំហំវិមាត្រ' : 'Logistics & Dimensions'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{lang === 'kh' ? 'ទម្ងន់ (គីឡូក្រាម)' : 'Weight (kg)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={weight}
                    onChange={e => setWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{lang === 'kh' ? 'ប្រវែង (សង់ទីម៉ែត្រ)' : 'Length (cm)'}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={length}
                    onChange={e => setLength(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{lang === 'kh' ? 'ទទឹង (សង់ទីម៉ែត្រ)' : 'Width (cm)'}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={width}
                    onChange={e => setWidth(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{lang === 'kh' ? 'កម្ពស់ (សង់ទីម៉ែត្រ)' : 'Height (cm)'}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={height}
                    onChange={e => setHeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'media_seo' && (
            <div className="space-y-4">
              {/* Local Image Upload Component */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700">
                    {lang === 'kh' ? 'រូបភាពផលិតផល (ជ្រើសរើសពីកុំព្យូទ័រ / Local File)' : 'Product Image (Upload from Local Computer / File)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setImageInputMode(imageInputMode === 'file' ? 'url' : 'file')}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
                  >
                    <Link className="w-3 h-3" />
                    <span>
                      {imageInputMode === 'file'
                        ? (lang === 'kh' ? 'ឬបញ្ចូលតំណភ្ជាប់ URL' : 'Or paste image URL')
                        : (lang === 'kh' ? 'ជ្រើសរើសរូបភាពពី local' : 'Upload from local file')}
                    </span>
                  </button>
                </div>

                {imageInputMode === 'file' ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center transition ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50/50'
                        : imageUrl
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : 'border-slate-300 bg-slate-50/70 hover:bg-slate-100/60'
                    }`}
                  >
                    {imageUrl ? (
                      <div className="flex items-center space-x-4">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shadow-sm shrink-0 bg-white group">
                          <img src={imageUrl} alt="Product" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setImageUrl('')}
                            className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                            title="Remove Image"
                          >
                            <Trash2 className="w-5 h-5 text-red-300" />
                          </button>
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700">
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span>{lang === 'kh' ? 'រូបភាពត្រូវបានជ្រើសរើសជោគជ័យ!' : 'Image Selected Successfully!'}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {lang === 'kh'
                              ? 'រូបភាព local ត្រូវបានផ្ទុកជា Base64 សម្រាប់ការរក្សាទុក'
                              : 'Local image loaded as Base64 binary data'}
                          </p>
                          <div className="mt-2 flex items-center space-x-2">
                            <label className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer shadow-2xs">
                              <span>{lang === 'kh' ? 'ផ្លាស់ប្តូររូបភាព' : 'Change Image'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => setImageUrl('')}
                              className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg border border-red-200 font-medium cursor-pointer"
                            >
                              {lang === 'kh' ? 'លុបចេញ' : 'Remove'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center cursor-pointer py-2">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl mb-2">
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          {lang === 'kh' ? 'ចុចដើម្បីជ្រើសរើសរូបភាពពីកុំព្យូទ័រ (Local File) ឬអូសទម្លាក់ទីនេះ' : 'Click to upload image from local device or drag & drop'}
                        </span>
                        <span className="text-[11px] text-slate-400 mt-1">
                          PNG, JPG, JPEG, WEBP, GIF (Max 5MB)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                          }}
                        />
                      </label>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <div className="relative flex-1">
                      <input
                        type="url"
                        placeholder={lang === 'kh' ? 'បញ្ចូលតំណភ្ជាប់ URL (ឧទាហរណ៍៖ https://domain.com/image.jpg)' : 'https://example.com/product-image.jpg'}
                        value={imageUrl}
                        onChange={e => setImageUrl(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      {imageUrl && (
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="absolute right-2.5 top-2 text-gray-400 hover:text-red-500 cursor-pointer"
                          title="Clear Image URL"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt="Product Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{lang === 'kh' ? 'SEO URL Slug' : 'SEO URL Slug'}</label>
                  <input
                    type="text"
                    placeholder="e.g. organic-arabica-coffee-beans"
                    value={seoSlug}
                    onChange={e => setSeoSlug(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{lang === 'kh' ? 'ចំណងជើង Meta' : 'Meta Title'}</label>
                  <input
                    type="text"
                    placeholder={lang === 'kh' ? 'ចំណងជើង SEO សម្រាប់ Google' : 'Meta title for Google & social cards'}
                    value={seoTitle}
                    onChange={e => setSeoTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{lang === 'kh' ? 'ការពិពណ៌នា Meta' : 'Meta Description'}</label>
                <textarea
                  rows={2}
                  placeholder={lang === 'kh' ? 'ការពិពណ៌នា SEO សម្រាប់ម៉ាស៊ីនស្វែងរក...' : 'Meta description for search engines...'}
                  value={seoDescription}
                  onChange={e => setSeoDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                />
              </div>

              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 text-xs font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={e => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>{lang === 'kh' ? 'ទំនិញលេចធ្លោ (បដាទំព័រមុខ)' : 'Featured Product (Frontpage banner)'}</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNew}
                    onChange={e => setIsNew(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>{lang === 'kh' ? 'កំណត់ជាទំនិញមកដល់ថ្មី' : 'Mark as New Arrival'}</span>
                </label>
              </div>
            </div>
          )}

          {/* Sub-Navigation & Submit Footer */}
          <div className="pt-4 mt-6 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 -mx-6 -mb-6 p-4 sm:p-6 rounded-b-2xl">
            {/* Left: Back / Cancel */}
            <div className="flex items-center space-x-2">
              {['general', 'pricing', 'inventory', 'media_seo'].indexOf(activeTab) > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    const tabs: Array<'general' | 'pricing' | 'inventory' | 'media_seo'> = ['general', 'pricing', 'inventory', 'media_seo'];
                    const prevIdx = tabs.indexOf(activeTab) - 1;
                    if (prevIdx >= 0) setActiveTab(tabs[prevIdx]);
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl shadow-2xs flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>
                    {lang === 'kh'
                      ? `ត្រឡប់: ជំហាន ${['general', 'pricing', 'inventory', 'media_seo'].indexOf(activeTab)}`
                      : `Back: Step ${['general', 'pricing', 'inventory', 'media_seo'].indexOf(activeTab)}`}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl border border-transparent transition cursor-pointer"
                >
                  {lang === 'kh' ? 'បោះបង់' : 'Cancel'}
                </button>
              )}
            </div>

            {/* Center: Sub-navigation Step Indicator */}
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>
                {lang === 'kh'
                  ? `ជំហានទី ${['general', 'pricing', 'inventory', 'media_seo'].indexOf(activeTab) + 1} នៃ ៤`
                  : `Step ${['general', 'pricing', 'inventory', 'media_seo'].indexOf(activeTab) + 1} of 4`}
              </span>
            </div>

            {/* Right: Next Step / Submit Product */}
            <div className="flex items-center space-x-2">
              {['general', 'pricing', 'inventory', 'media_seo'].indexOf(activeTab) < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    const tabs: Array<'general' | 'pricing' | 'inventory' | 'media_seo'> = ['general', 'pricing', 'inventory', 'media_seo'];
                    const nextIdx = tabs.indexOf(activeTab) + 1;
                    if (nextIdx < tabs.length) setActiveTab(tabs[nextIdx]);
                  }}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <span>
                    {lang === 'kh'
                      ? `បន្ទាប់: ជំហាន ${['general', 'pricing', 'inventory', 'media_seo'].indexOf(activeTab) + 2}`
                      : `Next: Step ${['general', 'pricing', 'inventory', 'media_seo'].indexOf(activeTab) + 2}`}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : null}

              <button
                type="submit"
                disabled={isSaving}
                className={`px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md flex items-center space-x-1.5 transition cursor-pointer ${
                  ['general', 'pricing', 'inventory', 'media_seo'].indexOf(activeTab) === 3
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-slate-800 hover:bg-slate-900'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>
                  {isSaving
                    ? (lang === 'kh' ? 'កំពុងរក្សាទុក...' : 'Saving Product...')
                    : product
                    ? (lang === 'kh' ? 'រក្សាទុកការកែប្រែ' : 'Update Product')
                    : (lang === 'kh' ? 'បង្កើតផលិតផល' : 'Create Product')}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
