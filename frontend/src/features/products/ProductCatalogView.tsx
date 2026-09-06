import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../application/context/AppContext';
import { Product } from '../../foundation/types';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getUnits,
} from '../../data-access/posApi';
import {
  Plus,
  Search,
  Filter,
  Printer,
  Edit2,
  Trash2,
  RefreshCw,
  Package,
  Layers,
  DollarSign,
  Barcode,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  LayoutGrid,
  List,
  Image as ImageIcon,
  Sparkles,
  ArrowUpDown,
  Tag,
  Eye,
  Check,
} from 'lucide-react';

// Sample product image presets for fast selection
const SAMPLE_IMAGE_PRESETS = [
  { label: 'Iced Coffee', url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&auto=format&fit=crop&q=80' },
  { label: 'Hot Latte', url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&auto=format&fit=crop&q=80' },
  { label: 'Green Tea', url: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=400&auto=format&fit=crop&q=80' },
  { label: 'Croissant', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&auto=format&fit=crop&q=80' },
  { label: 'Sandwich', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&auto=format&fit=crop&q=80' },
  { label: 'Fruit Juice', url: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&auto=format&fit=crop&q=80' },
  { label: 'Energy Drink', url: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=400&auto=format&fit=crop&q=80' },
  { label: 'Wireless Earbuds', url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=80' },
  { label: 'USB Cable', url: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=400&auto=format&fit=crop&q=80' },
  { label: 'Phone Case', url: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=400&auto=format&fit=crop&q=80' },
];

export const ProductCatalogView: React.FC = () => {
  const { lang, t, refreshProducts: refreshGlobalProducts } = useApp();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [units, setUnits] = useState<Array<{ id: number; name: string; symbol?: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [sortBy, setSortBy] = useState<'name_asc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc'>('name_asc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);
  const [barcodeQuantity, setBarcodeQuantity] = useState(1);

  // Form State for Add / Edit
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<number | ''>('');
  const [formUnitId, setFormUnitId] = useState<number | ''>('');
  const [formCostPrice, setFormCostPrice] = useState<number | ''>('');
  const [formSellingPrice, setFormSellingPrice] = useState<number | ''>('');
  const [formTaxRate, setFormTaxRate] = useState<number | ''>(10);
  const [formReorderLevel, setFormReorderLevel] = useState<number | ''>(10);
  const [formStockQty, setFormStockQty] = useState<number | ''>(50);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes, unitRes] = await Promise.all([
        getProducts(),
        getCategories(),
        getUnits(),
      ]);
      setProducts(prodRes);
      setCategories(catRes);
      setUnits(unitRes);
    } catch (err) {
      console.error('Failed to load products or categories', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // KPI Calculations
  const metrics = useMemo(() => {
    const totalCount = products.length;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalRetailVal = 0;
    let totalCostVal = 0;

    products.forEach((p) => {
      const qty = Number(p.available_quantity ?? 0);
      const reorder = Number(p.reorder_level ?? 10);
      const sellPrice = Number(p.selling_price || 0);
      const costPrice = Number(p.cost_price || 0);

      totalRetailVal += qty * sellPrice;
      totalCostVal += qty * costPrice;

      if (qty <= 0) {
        outOfStock++;
      } else if (qty <= reorder) {
        lowStock++;
      } else {
        inStock++;
      }
    });

    const avgMargin =
      totalRetailVal > 0 ? ((totalRetailVal - totalCostVal) / totalRetailVal) * 100 : 0;

    return {
      totalCount,
      inStock,
      lowStock,
      outOfStock,
      totalRetailVal,
      totalCostVal,
      totalRetailValKhr: totalRetailVal * 4100,
      avgMargin,
    };
  }, [products]);

  // Filter and Sort Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = p.name.toLowerCase().includes(q);
          const matchesSku = p.sku.toLowerCase().includes(q);
          const matchesBarcode = p.barcode?.toLowerCase().includes(q) || false;
          const matchesCat = p.category?.name.toLowerCase().includes(q) || false;
          if (!matchesName && !matchesSku && !matchesBarcode && !matchesCat) return false;
        }

        // Category filter
        if (selectedCategory !== 'ALL') {
          if (String(p.category?.id) !== selectedCategory) return false;
        }

        // Stock status filter
        const qty = Number(p.available_quantity ?? 0);
        const reorder = Number(p.reorder_level ?? 10);
        if (stockStatusFilter === 'IN_STOCK' && qty <= reorder) return false;
        if (stockStatusFilter === 'LOW_STOCK' && (qty <= 0 || qty > reorder)) return false;
        if (stockStatusFilter === 'OUT_OF_STOCK' && qty > 0) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'price_asc') return Number(a.selling_price) - Number(b.selling_price);
        if (sortBy === 'price_desc') return Number(b.selling_price) - Number(a.selling_price);
        if (sortBy === 'stock_asc') return Number(a.available_quantity ?? 0) - Number(b.available_quantity ?? 0);
        if (sortBy === 'stock_desc') return Number(b.available_quantity ?? 0) - Number(a.available_quantity ?? 0);
        return 0;
      });
  }, [products, searchQuery, selectedCategory, stockStatusFilter, sortBy]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setFormSku(`SKU-${randomSuffix}`);
    setFormBarcode(`885${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    setFormCategoryId(categories[0]?.id || 1);
    setFormUnitId(units[0]?.id || 3);
    setFormCostPrice(1.0);
    setFormSellingPrice(2.5);
    setFormTaxRate(10);
    setFormReorderLevel(10);
    setFormStockQty(50);
    setFormImageUrl(SAMPLE_IMAGE_PRESETS[0].url);
    setFormDescription('');
    setFormError('');
    setIsEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormSku(prod.sku);
    setFormBarcode(prod.barcode || '');
    setFormCategoryId(prod.category?.id || categories[0]?.id || 1);
    setFormUnitId(prod.unit?.id || units[0]?.id || 3);
    setFormCostPrice(Number(prod.cost_price));
    setFormSellingPrice(Number(prod.selling_price));
    setFormTaxRate(prod.tax_rate !== undefined ? Number(prod.tax_rate) : 10);
    setFormReorderLevel(prod.reorder_level !== undefined ? Number(prod.reorder_level) : 10);
    setFormStockQty(Number(prod.available_quantity ?? 0));
    setFormImageUrl(prod.image_url || '');
    setFormDescription(prod.description || '');
    setFormError('');
    setIsEditModalOpen(true);
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Product name is required.');
      return;
    }
    if (!formSku.trim()) {
      setFormError('SKU code is required.');
      return;
    }
    if (formCostPrice === '' || Number(formCostPrice) < 0) {
      setFormError('Please enter a valid cost price.');
      return;
    }
    if (formSellingPrice === '' || Number(formSellingPrice) < 0) {
      setFormError('Please enter a valid selling price.');
      return;
    }

    setIsSaving(true);
    setFormError('');

    try {
      if (editingProduct) {
        // Update
        const updated = await updateProduct(editingProduct.id, {
          name: formName,
          sku: formSku,
          barcode: formBarcode || null,
          category_id: formCategoryId ? Number(formCategoryId) : null,
          unit_id: formUnitId ? Number(formUnitId) : 3,
          cost_price: Number(formCostPrice),
          selling_price: Number(formSellingPrice),
          tax_rate: Number(formTaxRate || 0),
          reorder_level: Number(formReorderLevel || 10),
          available_quantity: Number(formStockQty || 0),
          image_url: formImageUrl || null,
          description: formDescription || null,
        });

        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        showToast(`Product "${updated.name}" updated successfully!`);
      } else {
        // Create
        const created = await createProduct({
          name: formName,
          sku: formSku,
          barcode: formBarcode || null,
          category_id: formCategoryId ? Number(formCategoryId) : null,
          unit_id: formUnitId ? Number(formUnitId) : 3,
          cost_price: Number(formCostPrice),
          selling_price: Number(formSellingPrice),
          tax_rate: Number(formTaxRate || 0),
          reorder_level: Number(formReorderLevel || 10),
          initial_stock: Number(formStockQty || 0),
          image_url: formImageUrl || null,
          description: formDescription || null,
        });

        setProducts((prev) => [created, ...prev]);
        showToast(`Product "${created.name}" added to catalog!`);
      }

      refreshGlobalProducts();
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save product', err);
      const errMsg = err.response?.data?.message || err.message || 'An error occurred while saving product.';
      setFormError(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.id);
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      showToast(`Product "${productToDelete.name}" removed from catalog.`);
      refreshGlobalProducts();
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    } catch (err) {
      console.error('Failed to delete product', err);
      alert('Failed to delete product.');
    }
  };

  // Open Barcode Label Modal
  const handleOpenBarcodeModal = (prod: Product) => {
    setBarcodeProduct(prod);
    setBarcodeQuantity(1);
    setIsBarcodeModalOpen(true);
  };

  // Generate Barcode SVG graphic based on string
  const renderBarcodeSvg = (code: string) => {
    // Generate pseudo barcode bars based on char codes
    const bars: boolean[] = [];
    const clean = code || '885000000000';
    for (let i = 0; i < clean.length; i++) {
      const num = clean.charCodeAt(i) % 4;
      bars.push(true, false, num % 2 === 0, true, false, true);
    }
    return (
      <svg className="w-full h-12" viewBox={`0 0 ${bars.length * 3} 40`} preserveAspectRatio="none">
        {bars.map((isBar, idx) =>
          isBar ? <rect key={idx} x={idx * 3} y="0" width="2" height="40" fill="#111827" /> : null
        )}
      </svg>
    );
  };

  // Margin Calculator values for form
  const formMarginStats = useMemo(() => {
    const cost = Number(formCostPrice || 0);
    const sell = Number(formSellingPrice || 0);
    const profit = sell - cost;
    const marginPct = sell > 0 ? (profit / sell) * 100 : 0;
    return {
      profit: Math.max(0, profit),
      marginPct: marginPct.toFixed(1),
      isLoss: profit < 0,
    };
  }, [formCostPrice, formSellingPrice]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast alert */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 animate-fade-in border border-emerald-500">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span className="font-semibold text-sm">{successToast}</span>
        </div>
      )}

      {/* 1. Header & Main Action Bar */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-200">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {lang === 'kh' ? 'កាតាឡុកទំនិញ និងគ្រប់គ្រងតម្លៃ' : 'Product Catalog Management'}
              </h1>
              <p className="text-xs text-gray-500">
                {lang === 'kh'
                  ? 'គ្រប់គ្រង SKU, តម្លៃលក់, បាកូដស្លាកធ្នើរ និងរូបភាពផលិតផល'
                  : 'Manage SKUs, retail pricing, barcode shelf labels, inventory levels & photos.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={loadData}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition flex items-center justify-center"
            title="Refresh Catalog Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-200 flex items-center space-x-2 transition"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{lang === 'kh' ? '+ បន្ថែមទំនិញថ្មី' : '+ Add New Product'}</span>
          </button>
        </div>
      </div>

      {/* 2. Enterprise KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Products */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-2">
            <span>{lang === 'kh' ? 'ទំនិញសរុប' : 'Total SKUs'}</span>
            <Layers className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-black text-gray-900">{metrics.totalCount}</div>
          <div className="text-[11px] text-gray-400 mt-1 flex items-center space-x-1">
            <span className="font-semibold text-emerald-600">{metrics.inStock} In Stock</span>
            <span>•</span>
            <span>{categories.length} Categories</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-2">
            <span>{lang === 'kh' ? 'ជិតអស់ពីស្តុក' : 'Low Stock Alert'}</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{metrics.lowStock}</div>
          <div className="text-[11px] text-gray-400 mt-1">
            <span>{metrics.outOfStock} Out of Stock items</span>
          </div>
        </div>

        {/* Retail Catalog Valuation */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-2">
            <span>{lang === 'kh' ? 'តម្លៃស្តុកលក់រាយ' : 'Retail Inventory Val'}</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-gray-900">${metrics.totalRetailVal.toFixed(2)}</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">
            ៛ {metrics.totalRetailValKhr.toLocaleString()}
          </div>
        </div>

        {/* Average Gross Margin */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold mb-2">
            <span>{lang === 'kh' ? 'ប្រាក់ចំណេញមធ្យម' : 'Avg Gross Margin'}</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-700">{metrics.avgMargin.toFixed(1)}%</div>
          <div className="text-[11px] text-gray-400 mt-1">
            Cost: ${metrics.totalCostVal.toFixed(2)}
          </div>
        </div>
      </div>

      {/* 3. Search, Category Pills & Control Bar */}
      <div className="bg-white rounded-3xl p-4 border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={lang === 'kh' ? 'ស្វែងរកតាមឈ្មោះ, SKU ឬបាកូដ...' : 'Search by name, SKU, or barcode...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-hidden focus:border-emerald-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Stock Filter & View Toggle */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Stock status filter */}
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-hidden focus:border-emerald-500"
            >
              <option value="ALL">All Stock Status</option>
              <option value="IN_STOCK">In Stock (&gt; 10)</option>
              <option value="LOW_STOCK">Low Stock (≤ 10)</option>
              <option value="OUT_OF_STOCK">Out of Stock (0)</option>
            </select>

            {/* Sort filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-hidden focus:border-emerald-500"
            >
              <option value="name_asc">Name: A to Z</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="stock_asc">Stock: Low to High</option>
              <option value="stock_desc">Stock: High to Low</option>
            </select>

            {/* View Mode Toggle: Grid vs Table */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              selectedCategory === 'ALL'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {lang === 'kh' ? 'ទាំងអស់' : 'All Categories'} ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => p.category?.id === cat.id).length;
            const isSelected = selectedCategory === String(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(String(cat.id))}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-emerald-800 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Products Display Area */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-white rounded-3xl border border-gray-200">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-xs font-semibold text-gray-500">Loading catalog items...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-gray-200 p-8 space-y-3">
          <Package className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">No products found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            No products match your current search or category filter. Try clearing your filters or create a new product.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-emerald-700"
          >
            + Add New Product
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredProducts.map((p) => {
            const sellPrice = Number(p.selling_price || 0);
            const costPrice = Number(p.cost_price || 0);
            const profit = sellPrice - costPrice;
            const margin = sellPrice > 0 ? ((profit / sellPrice) * 100).toFixed(0) : '0';
            const qty = Number(p.available_quantity ?? 0);
            const reorder = Number(p.reorder_level ?? 10);
            const isLow = qty > 0 && qty <= reorder;
            const isOut = qty <= 0;

            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-300 transition group flex flex-col justify-between"
              >
                {/* Product Image Header */}
                <div className="relative aspect-4/3 bg-gray-100 overflow-hidden">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon className="w-10 h-10 mb-1 opacity-50" />
                      <span className="text-[10px] font-semibold">No Image</span>
                    </div>
                  )}

                  {/* Category badge */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-1 bg-gray-900/80 backdrop-blur-xs text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">
                      {p.category?.name || 'General'}
                    </span>
                  </div>

                  {/* Stock Pill */}
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-xs ${
                        isOut
                          ? 'bg-rose-500 text-white'
                          : isLow
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {isOut ? 'Out of Stock' : `${qty} in stock`}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                      <span>{p.sku}</span>
                      {p.barcode && <span className="flex items-center space-x-1"><Barcode className="w-3 h-3" /><span>{p.barcode}</span></span>}
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-emerald-700 transition">
                      {p.name}
                    </h3>
                  </div>

                  {/* Price & Economics */}
                  <div className="pt-2 border-t border-gray-100 space-y-1">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-lg font-black text-gray-900">${sellPrice.toFixed(2)}</span>
                        <span className="text-xs text-emerald-600 font-bold ml-1.5">
                          ៛ {(sellPrice * 4100).toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700">
                        {margin}% margin
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-400 flex items-center justify-between">
                      <span>Cost: ${costPrice.toFixed(2)}</span>
                      <span>Unit: {p.unit?.name || 'Piece'}</span>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => handleOpenBarcodeModal(p)}
                      className="flex-1 py-1.5 px-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 border border-gray-200 transition"
                      title="Print Barcode Shelf Label"
                    >
                      <Barcode className="w-3.5 h-3.5" />
                      <span>Tag</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(p)}
                      className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 border border-emerald-200 transition"
                      title="Edit Product"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => {
                        setProductToDelete(p);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold text-[10px] border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3.5">Product</th>
                  <th className="px-4 py-3.5">SKU / Barcode</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5 text-right">Cost ($)</th>
                  <th className="px-4 py-3.5 text-right">Selling Price</th>
                  <th className="px-4 py-3.5 text-right">Margin</th>
                  <th className="px-4 py-3.5 text-center">Stock Level</th>
                  <th className="px-4 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => {
                  const sellPrice = Number(p.selling_price || 0);
                  const costPrice = Number(p.cost_price || 0);
                  const profit = sellPrice - costPrice;
                  const margin = sellPrice > 0 ? ((profit / sellPrice) * 100).toFixed(0) : '0';
                  const qty = Number(p.available_quantity ?? 0);
                  const reorder = Number(p.reorder_level ?? 10);
                  const isLow = qty > 0 && qty <= reorder;
                  const isOut = qty <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition">
                      {/* Product Name & Photo */}
                      <td className="px-4 py-3 flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-gray-900 block truncate">{p.name}</span>
                          <span className="text-[10px] text-gray-400">Unit: {p.unit?.name || 'Piece'}</span>
                        </div>
                      </td>

                      {/* SKU / Barcode */}
                      <td className="px-4 py-3 font-mono text-[11px]">
                        <div className="font-semibold text-gray-800">{p.sku}</div>
                        <div className="text-gray-400">{p.barcode || '—'}</div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-semibold">
                          {p.category?.name || 'General'}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="px-4 py-3 text-right font-mono text-gray-600">
                        ${costPrice.toFixed(2)}
                      </td>

                      {/* Selling Price */}
                      <td className="px-4 py-3 text-right font-mono">
                        <div className="font-bold text-gray-900">${sellPrice.toFixed(2)}</div>
                        <div className="text-[10px] text-emerald-600">៛ {(sellPrice * 4100).toLocaleString()}</div>
                      </td>

                      {/* Margin */}
                      <td className="px-4 py-3 text-right">
                        <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 font-bold text-[11px]">
                          {margin}%
                        </span>
                      </td>

                      {/* Stock Level */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isOut
                              ? 'bg-rose-100 text-rose-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {qty} {p.unit?.name || 'pcs'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleOpenBarcodeModal(p)}
                            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                            title="Print Shelf Tag"
                          >
                            <Barcode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setProductToDelete(p);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CREATE / EDIT PRODUCT MODAL                                            */}
      {/* ========================================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl animate-scale-up">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create New Product'}
                  </h2>
                  <p className="text-xs text-gray-500">Configure SKU, pricing, photo and inventory defaults</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Basic Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Basic Information</h4>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Product Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Signature Iced Americano"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      SKU Code <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex space-x-1.5">
                      <input
                        type="text"
                        required
                        value={formSku}
                        onChange={(e) => setFormSku(e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setFormSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`)}
                        className="px-2.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-xl font-bold"
                        title="Auto Generate SKU"
                      >
                        Auto
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Barcode (EAN-13 / UPC)</label>
                    <div className="flex space-x-1.5">
                      <input
                        type="text"
                        value={formBarcode}
                        onChange={(e) => setFormBarcode(e.target.value)}
                        placeholder="8850123456789"
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setFormBarcode(`885${Math.floor(1000000000 + Math.random() * 9000000000)}`)}
                        className="px-2.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-xl font-bold"
                        title="Generate EAN-13 Barcode"
                      >
                        Gen
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                    <select
                      value={formCategoryId}
                      onChange={(e) => setFormCategoryId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-hidden focus:border-emerald-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Unit of Measure</label>
                    <select
                      value={formUnitId}
                      onChange={(e) => setFormUnitId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-hidden focus:border-emerald-500"
                    >
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} {u.symbol ? `(${u.symbol})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing & Economics */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pricing & Economics</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Cost Price ($ USD) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formCostPrice}
                      onChange={(e) => setFormCostPrice(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Selling Price ($ USD) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formSellingPrice}
                      onChange={(e) => setFormSellingPrice(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono font-bold text-emerald-800 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                    />
                    {formSellingPrice !== '' && (
                      <span className="text-[11px] text-emerald-600 font-bold block mt-0.5">
                        = ៛ {(Number(formSellingPrice) * 4100).toLocaleString()} KHR
                      </span>
                    )}
                  </div>
                </div>

                {/* Real-time Profit & Margin Indicator */}
                <div
                  className={`p-3 rounded-2xl border flex items-center justify-between ${
                    formMarginStats.isLoss
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-semibold">
                      Gross Profit per Unit: <strong>${formMarginStats.profit.toFixed(2)}</strong>
                    </span>
                  </div>
                  <div className="text-xs font-black">
                    Margin: {formMarginStats.marginPct}%
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Stock on Hand (HQ-01)</label>
                    <input
                      type="number"
                      min="0"
                      value={formStockQty}
                      onChange={(e) => setFormStockQty(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Low Stock Warning Threshold</label>
                    <input
                      type="number"
                      min="0"
                      value={formReorderLevel}
                      onChange={(e) => setFormReorderLevel(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Product Media & Image Selector */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Product Photo</h4>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                {/* Quick Presets Picker */}
                <div>
                  <span className="text-[11px] font-semibold text-gray-500 block mb-1.5 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Or Pick from Sample Photo Library:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_IMAGE_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormImageUrl(preset.url)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border ${
                          formImageUrl === preset.url
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Image Preview */}
                {formImageUrl && (
                  <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-2xl border border-gray-200">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-200 shrink-0 border border-gray-300">
                      <img
                        src={formImageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as any).src = 'https://placehold.co/100x100?text=Invalid+URL';
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 min-w-0 flex-1">
                      <span className="font-bold text-gray-800 block">Photo Preview Ready</span>
                      <span className="text-[10px] text-gray-400 truncate block">{formImageUrl}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-200 transition flex items-center space-x-1.5"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. BARCODE SHELF LABEL PRINT MODAL                                        */}
      {/* ========================================================================= */}
      {isBarcodeModalOpen && barcodeProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-gray-200 shadow-2xl p-6 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Print Barcode Shelf Label</h3>
                  <p className="text-[11px] text-gray-400">Retail shelf price tag (50mm x 30mm)</p>
                </div>
              </div>
              <button
                onClick={() => setIsBarcodeModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Label Preview Card */}
            <div
              id="shelf-barcode-tag"
              className="p-4 bg-white border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-between text-center space-y-2 select-none shadow-sm"
            >
              <div className="w-full flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider pb-1 border-b border-gray-100">
                <span>SmartPOS Retail</span>
                <span className="font-mono">{barcodeProduct.sku}</span>
              </div>

              <div className="font-black text-gray-900 text-sm leading-tight px-2">
                {barcodeProduct.name}
              </div>

              {/* Barcode graphic */}
              <div className="w-full max-w-[220px] py-1">
                {renderBarcodeSvg(barcodeProduct.barcode || barcodeProduct.sku)}
                <div className="font-mono text-xs tracking-widest text-gray-800 font-bold mt-0.5">
                  {barcodeProduct.barcode || barcodeProduct.sku}
                </div>
              </div>

              {/* Price Callout */}
              <div className="w-full pt-1.5 border-t border-gray-100 flex items-center justify-between px-2">
                <div className="text-left">
                  <span className="text-[9px] text-gray-400 block uppercase">Retail Price</span>
                  <span className="text-xs text-emerald-600 font-bold">
                    ៛ {(Number(barcodeProduct.selling_price) * 4100).toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-gray-900">
                    ${Number(barcodeProduct.selling_price).toFixed(2)}
                  </span>
                  <span className="text-[9px] text-gray-400 block">VAT 10% Inc.</span>
                </div>
              </div>
            </div>

            {/* Print quantity options */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-gray-600 font-medium">Number of tags to print:</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setBarcodeQuantity((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-gray-700"
                >
                  -
                </button>
                <span className="font-bold font-mono px-2">{barcodeQuantity}</span>
                <button
                  onClick={() => setBarcodeQuantity((q) => q + 1)}
                  className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-gray-700"
                >
                  +
                </button>
              </div>
            </div>

            {/* Print Action */}
            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setIsBarcodeModalOpen(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-200 flex items-center justify-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Tag ({barcodeQuantity})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. DELETE PRODUCT CONFIRMATION MODAL                                      */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && productToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-gray-200 shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-gray-900 text-base">Delete Product?</h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to remove <strong>"{productToDelete.name}"</strong> ({productToDelete.sku}) from the active catalog?
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setProductToDelete(null);
                }}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-200"
              >
                Delete SKU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
