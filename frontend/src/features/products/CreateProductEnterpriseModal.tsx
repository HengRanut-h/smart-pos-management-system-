import React, { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { EnterpriseProduct, ProductType } from '../../foundation/types/productEnterprise';
import { productEnterpriseApi } from '../../data-access/productEnterpriseApi';

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
        setLength(product.dimensions.length || 0);
        setWidth(product.dimensions.width || 0);
        setHeight(product.dimensions.height || 0);
      }

      setImageUrl(product.image_url || '');
      setShortDescription(product.short_description || '');
      setDescription(product.description || '');
      setSeoSlug(product.seo_slug || '');
      setSeoTitle(product.seo_title || '');
      setSeoDescription(product.seo_description || '');
      setIsFeatured(product.is_featured || false);
      setIsNew(product.is_new || false);
      setVisibility(product.visibility || 'ALL');
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
      alert('Product name is required');
      return;
    }
    if (!sku.trim()) {
      alert('SKU is required');
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
      } else {
        await productEnterpriseApi.createProduct(payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save product. Please check input values.');
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
                {product ? 'Edit Enterprise Product' : 'Create Enterprise Product'}
              </h3>
              <p className="text-xs text-gray-500">
                Configure full product lifecycle, multi-tier pricing, stock limits, and types
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-6 bg-gray-50/50 space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'general'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>1. General & Classification</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'pricing'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>2. Multi-Tier Pricing & Landed Cost</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'inventory'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3. Inventory & Logistics</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('media_seo')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'media_seo'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>4. Media & E-commerce SEO</span>
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Product Title / Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Organic Arabica Coffee Beans 500g"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-gray-700">SKU (Stock Keeping Unit) *</label>
                    <button
                      type="button"
                      onClick={autoGenerateSku}
                      className="text-[11px] text-blue-600 hover:underline flex items-center space-x-0.5"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Auto SKU</span>
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
                    <label className="block text-xs font-bold text-gray-700">Barcode / EAN-13 *</label>
                    <button
                      type="button"
                      onClick={autoGenerateBarcode}
                      className="text-[11px] text-blue-600 hover:underline flex items-center space-x-0.5"
                    >
                      <Barcode className="w-3 h-3" />
                      <span>Generate EAN</span>
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
                    Product Type (10 Enterprise Types)
                  </label>
                  <select
                    value={productType}
                    onChange={e => setProductType(e.target.value as ProductType)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-blue-700"
                  >
                    <option value="SIMPLE">Standard / Simple Product</option>
                    <option value="VARIABLE">Variable Product (Size, Color, Matrix)</option>
                    <option value="BUNDLE">Combo Kit / Bundle</option>
                    <option value="MANUFACTURED">Manufactured Item (BOM Recipe)</option>
                    <option value="RAW_MATERIAL">Raw Material / Ingredient</option>
                    <option value="BATCH_TRACKED">Batch / Lot Tracked (Expiry)</option>
                    <option value="SERIALIZED">Serialized Item (IMEI / Serial)</option>
                    <option value="SERVICE">Service / Non-physical</option>
                    <option value="DIGITAL">Digital / Downloadable</option>
                    <option value="COMBO">Fast Food / Meal Combo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
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
                  <label className="block text-xs font-bold text-gray-700 mb-1">Brand</label>
                  <select
                    value={brandId || ''}
                    onChange={e => setBrandId(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- None / Generic --</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Primary Unit</label>
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
                <label className="block text-xs font-bold text-gray-700 mb-1">Short Description / Subtitle</label>
                <input
                  type="text"
                  placeholder="Quick summary for receipt or POS line item"
                  value={shortDescription}
                  onChange={e => setShortDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Description</label>
                <textarea
                  rows={3}
                  placeholder="Detailed specifications, ingredients, storage instructions..."
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
                  Landed Cost & Supplier Base
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Base Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costPrice}
                      onChange={e => setCostPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Shipping / Freight ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={shippingCost}
                      onChange={e => setShippingCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Customs & Duty ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={importTax}
                      onChange={e => setImportTax(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Handling / Port ($)</label>
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
                  Total Landed Cost: ${(costPrice + shippingCost + importTax + handlingCost).toFixed(2)}
                </div>
              </div>

              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Multi-Tier Selling Prices
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-emerald-700 mb-1">Retail Selling Price ($) *</label>
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
                  <label className="block text-xs font-bold text-indigo-700 mb-1">Wholesale Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={wholesalePrice}
                    onChange={e => setWholesalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-purple-700 mb-1">VIP Customer Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={vipPrice}
                    onChange={e => setVipPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Member / Loyalty Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={memberPrice}
                    onChange={e => setMemberPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Online E-commerce Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={onlinePrice}
                    onChange={e => setOnlinePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tax Rate (%)</label>
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
                Stock Levels & Replenishment Rules
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Opening Stock</label>
                  <input
                    type="number"
                    value={openingStock}
                    onChange={e => setOpeningStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Safety Buffer Stock</label>
                  <input
                    type="number"
                    value={safetyStock}
                    onChange={e => setSafetyStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Reorder Alert Level</label>
                  <input
                    type="number"
                    value={reorderLevel}
                    onChange={e => setReorderLevel(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Reorder Default Qty</label>
                  <input
                    type="number"
                    value={reorderQuantity}
                    onChange={e => setReorderQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider pt-3">
                Logistics & Dimensions
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={weight}
                    onChange={e => setWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Length (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={length}
                    onChange={e => setLength(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Width (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={width}
                    onChange={e => setWidth(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Height (cm)</label>
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
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Product Image URL</label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="preview"
                      className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">SEO URL Slug</label>
                  <input
                    type="text"
                    placeholder="e.g. organic-arabica-coffee-beans"
                    value={seoSlug}
                    onChange={e => setSeoSlug(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Meta Title</label>
                  <input
                    type="text"
                    placeholder="Meta title for Google & social cards"
                    value={seoTitle}
                    onChange={e => setSeoTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Meta Description</label>
                <textarea
                  rows={2}
                  placeholder="Meta description for search engines..."
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
                  <span>Featured Product (Frontpage banner)</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNew}
                    onChange={e => setIsNew(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Mark as New Arrival</span>
                </label>
              </div>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-md flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving Product...' : product ? 'Update Product' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
