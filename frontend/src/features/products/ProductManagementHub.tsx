import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  Sparkles,
  FolderTree,
  Award,
  Scale,
  DollarSign,
  Calculator,
  Boxes,
  MapPin,
  Barcode,
  Truck,
  Calendar,
  Hash,
  ShieldCheck,
  PackagePlus,
  Wrench,
  CheckCircle2,
  Tag,
  Star,
  RotateCcw,
  FileSpreadsheet,
  Copy,
  History,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Printer,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  XCircle,
  Eye,
  ArrowUpDown,
  Download,
  Upload,
  Check,
  X,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Percent,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../application/context/AppContext';
import {
  EnterpriseProduct,
  ProductDashboardData,
  ProductType,
  ProductBatch,
  ProductSerialNumber,
  ProductQcInspection,
  ProductReview,
  ProductAuditLog,
  ProductVariant,
  ProductPriceRule,
  ProductWarehouseLocation
} from '../../foundation/types/productEnterprise';
import { productEnterpriseApi } from '../../data-access/productEnterpriseApi';
import { getCategories, getUnits } from '../../data-access/posApi';
import { CreateProductEnterpriseModal } from './CreateProductEnterpriseModal';
import { VariantMatrixModal } from './VariantMatrixModal';
import { LandedCostModal } from './LandedCostModal';
import { BatchLotModal } from './BatchLotModal';
import { SerialNumberModal } from './SerialNumberModal';
import { BundleBomModal } from './BundleBomModal';
import { BarcodeLabelModal } from './BarcodeLabelModal';

export type SubView =
  | 'dashboard'
  | 'catalog'
  | 'attributes'
  | 'variants'
  | 'pricing'
  | 'tracking'
  | 'manufacturing'
  | 'barcodes'
  | 'data'
  | 'types'
  | 'categories'
  | 'brands'
  | 'units'
  | 'landed_cost'
  | 'inventory'
  | 'warehouse'
  | 'suppliers'
  | 'batches'
  | 'serials'
  | 'warranties'
  | 'bundles'
  | 'bom'
  | 'qc'
  | 'promotions'
  | 'reviews'
  | 'returns'
  | 'import_export'
  | 'templates'
  | 'audit_logs';

export const ProductManagementHub: React.FC = () => {
  const { lang, t, productSubTab, setProductSubTab } = useApp();

  // Navigation State
  const [activeSubView, setActiveSubView] = useState<SubView>(
    (productSubTab as SubView) || 'dashboard'
  );

  // Inner sub-tabs for consolidated modules
  const [attributesTab, setAttributesTab] = useState<'categories' | 'brands' | 'units'>('categories');
  const [variantsTab, setVariantsTab] = useState<'variants' | 'types'>('variants');
  const [pricingTab, setPricingTab] = useState<'pricing' | 'landed_cost' | 'promotions'>('pricing');
  const [trackingTab, setTrackingTab] = useState<'batches' | 'serials' | 'warranties'>('batches');
  const [manufacturingTab, setManufacturingTab] = useState<'bom' | 'bundles' | 'qc'>('bom');
  const [dataTab, setDataTab] = useState<'import_export' | 'templates' | 'audit_logs' | 'returns' | 'reviews'>('import_export');

  // Sync external navigation (from sidebar) with inner tabs
  useEffect(() => {
    if (!productSubTab) return;
    const tab = productSubTab as string;
    if (['attributes', 'categories', 'brands', 'units'].includes(tab)) {
      setActiveSubView('attributes');
      if (tab === 'brands') setAttributesTab('brands');
      else if (tab === 'units') setAttributesTab('units');
      else setAttributesTab('categories');
    } else if (['variants', 'types'].includes(tab)) {
      setActiveSubView('variants');
      if (tab === 'types') setVariantsTab('types');
      else setVariantsTab('variants');
    } else if (['pricing', 'landed_cost', 'promotions'].includes(tab)) {
      setActiveSubView('pricing');
      if (tab === 'landed_cost') setPricingTab('landed_cost');
      else if (tab === 'promotions') setPricingTab('promotions');
      else setPricingTab('pricing');
    } else if (['tracking', 'batches', 'serials', 'warranties'].includes(tab)) {
      setActiveSubView('tracking');
      if (tab === 'serials') setTrackingTab('serials');
      else if (tab === 'warranties') setTrackingTab('warranties');
      else setTrackingTab('batches');
    } else if (['manufacturing', 'bom', 'bundles', 'qc'].includes(tab)) {
      setActiveSubView('manufacturing');
      if (tab === 'bundles') setManufacturingTab('bundles');
      else if (tab === 'qc') setManufacturingTab('qc');
      else setManufacturingTab('bom');
    } else if (['data', 'import_export', 'templates', 'audit_logs', 'returns', 'reviews'].includes(tab)) {
      setActiveSubView('data');
      if (tab === 'templates') setDataTab('templates');
      else if (tab === 'audit_logs') setDataTab('audit_logs');
      else if (tab === 'returns') setDataTab('returns');
      else if (tab === 'reviews') setDataTab('reviews');
      else setDataTab('import_export');
    } else {
      setActiveSubView(tab as SubView);
    }
  }, [productSubTab]);

  const handleSelectSubView = (subView: SubView) => {
    setActiveSubView(subView);
    setProductSubTab(subView);
  };

  // Core Data
  const [products, setProducts] = useState<EnterpriseProduct[]>([]);
  const [dashboardData, setDashboardData] = useState<ProductDashboardData | null>(null);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [units, setUnits] = useState<Array<{ id: number; name: string }>>([]);
  const [brands, setBrands] = useState<Array<{ id: number; name: string }>>([]);
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [serialNumbers, setSerialNumbers] = useState<ProductSerialNumber[]>([]);
  const [qcInspections, setQcInspections] = useState<ProductQcInspection[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [auditLogs, setAuditLogs] = useState<ProductAuditLog[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<string>('ALL');
  const [catalogViewMode, setCatalogViewMode] = useState<'grid' | 'table'>('table');
  const [sortBy, setSortBy] = useState<'name_asc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc'>('name_asc');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EnterpriseProduct | null>(null);

  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [variantProduct, setVariantProduct] = useState<EnterpriseProduct | null>(null);

  const [isLandedCostModalOpen, setIsLandedCostModalOpen] = useState(false);
  const [landedCostProduct, setLandedCostProduct] = useState<EnterpriseProduct | null>(null);

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchProduct, setBatchProduct] = useState<EnterpriseProduct | null>(null);

  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [serialProduct, setSerialProduct] = useState<EnterpriseProduct | null>(null);

  const [isBundleBomModalOpen, setIsBundleBomModalOpen] = useState(false);
  const [bundleBomProduct, setBundleBomProduct] = useState<EnterpriseProduct | null>(null);
  const [bundleBomMode, setBundleBomMode] = useState<'BUNDLE' | 'BOM'>('BUNDLE');

  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState<EnterpriseProduct | null>(null);

  // Bulk Selection
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  // Load Data
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [dash, prodRes, catRes, unitRes] = await Promise.all([
        productEnterpriseApi.getDashboard().catch(() => null),
        productEnterpriseApi.getProducts({ per_page: 100 }).catch(() => ({ data: [] })),
        getCategories().catch(() => []),
        getUnits().catch(() => []),
      ]);

      if (dash) setDashboardData(dash);
      if (prodRes && prodRes.data) {
        setProducts(prodRes.data.data || prodRes.data || []);
      }
      if (Array.isArray(catRes)) setCategories(catRes);
      if (Array.isArray(unitRes)) setUnits(unitRes);

      // Extract brands
      if (prodRes && prodRes.data) {
        const prods = prodRes.data.data || prodRes.data || [];
        const extractedBrands: Record<number, string> = {};
        prods.forEach((p: any) => {
          if (p.brand?.id) extractedBrands[p.brand.id] = p.brand.name;
        });
        setBrands(Object.entries(extractedBrands).map(([id, name]) => ({ id: parseInt(id), name })));
      }
    } catch (err) {
      console.error('Failed loading product hub data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Load secondary tab data when switching subviews
  useEffect(() => {
    if ((activeSubView === 'tracking' || activeSubView === 'batches' || trackingTab === 'batches') && batches.length === 0) {
      productEnterpriseApi.getBatches().then(r => setBatches(r.data || [])).catch(console.error);
    }
    if ((activeSubView === 'tracking' || activeSubView === 'serials' || trackingTab === 'serials') && serialNumbers.length === 0) {
      productEnterpriseApi.getSerialNumbers().then(r => setSerialNumbers(r.data || [])).catch(console.error);
    }
    if ((activeSubView === 'manufacturing' || activeSubView === 'qc' || manufacturingTab === 'qc') && qcInspections.length === 0) {
      productEnterpriseApi.getQcInspections().then(r => setQcInspections(r.data || [])).catch(console.error);
    }
    if ((activeSubView === 'data' || activeSubView === 'reviews' || dataTab === 'reviews') && reviews.length === 0) {
      productEnterpriseApi.getReviews().then(r => setReviews(r.data || [])).catch(console.error);
    }
    if ((activeSubView === 'data' || activeSubView === 'audit_logs' || dataTab === 'audit_logs') && auditLogs.length === 0) {
      productEnterpriseApi.getAuditLogs().then(r => setAuditLogs(r.data || [])).catch(console.error);
    }
  }, [activeSubView, trackingTab, manufacturingTab, dataTab]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchesSearch =
          !searchQuery ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.barcode && p.barcode.includes(searchQuery));

        const matchesCategory =
          selectedCategory === 'ALL' || p.category_id?.toString() === selectedCategory;

        const matchesType =
          selectedType === 'ALL' || p.product_type === selectedType;

        const matchesStock =
          stockFilter === 'ALL' ||
          (stockFilter === 'IN_STOCK' && (p.opening_stock || 0) > (p.reorder_level || 5)) ||
          (stockFilter === 'LOW_STOCK' &&
            (p.opening_stock || 0) > 0 &&
            (p.opening_stock || 0) <= (p.reorder_level || 5)) ||
          (stockFilter === 'OUT_OF_STOCK' && (p.opening_stock || 0) <= 0);

        return matchesSearch && matchesCategory && matchesType && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'price_asc') return (a.selling_price || 0) - (b.selling_price || 0);
        if (sortBy === 'price_desc') return (b.selling_price || 0) - (a.selling_price || 0);
        if (sortBy === 'stock_asc') return (a.opening_stock || 0) - (b.opening_stock || 0);
        if (sortBy === 'stock_desc') return (b.opening_stock || 0) - (a.opening_stock || 0);
        return 0;
      });
  }, [products, searchQuery, selectedCategory, selectedType, stockFilter, sortBy]);

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await productEnterpriseApi.deleteProduct(id);
      loadAllData();
    } catch (err) {
      alert('Error deleting product');
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedProductIds.length) return;
    if (!confirm(`Delete ${selectedProductIds.length} selected products?`)) return;
    for (const id of selectedProductIds) {
      await productEnterpriseApi.deleteProduct(id).catch(console.error);
    }
    setSelectedProductIds([]);
    loadAllData();
  };

  // Consolidated Navigation Modules Configuration
  const navItems = [
    { id: 'dashboard', label: '01. Product Dashboard', icon: LayoutDashboard },
    { id: 'catalog', label: '02. Product Catalog', count: products.length, icon: Package },
    { id: 'attributes', label: '03. Categories, Brands & Units', icon: FolderTree },
    { id: 'variants', label: '04. Variant Matrix', icon: Sparkles },
    { id: 'pricing', label: '05. Pricing & Cost Studio', icon: DollarSign },
    { id: 'tracking', label: '06. Batches, Serials & Warranties', icon: Calendar },
    { id: 'manufacturing', label: '07. Manufacturing & Bundles', icon: Wrench },
    { id: 'barcodes', label: '08. Barcode & Print Studio', icon: Barcode },
    { id: 'data', label: '09. Data & Operations', icon: FileSpreadsheet },
    // Aliases for backward compatibility
    { id: 'types', label: '04. Variant Matrix', icon: Sparkles },
    { id: 'categories', label: '03. Categories, Brands & Units', icon: FolderTree },
    { id: 'brands', label: '03. Categories, Brands & Units', icon: Award },
    { id: 'units', label: '03. Categories, Brands & Units', icon: Scale },
    { id: 'landed_cost', label: '05. Pricing & Cost Studio', icon: Calculator },
    { id: 'inventory', label: '10. Stock & Reorders', icon: Boxes },
    { id: 'warehouse', label: '11. Warehouse Bins', icon: MapPin },
    { id: 'suppliers', label: '13. Suppliers', icon: Truck },
    { id: 'batches', label: '06. Batches, Serials & Warranties', icon: Calendar },
    { id: 'serials', label: '06. Batches, Serials & Warranties', icon: Hash },
    { id: 'warranties', label: '06. Batches, Serials & Warranties', icon: ShieldCheck },
    { id: 'bundles', label: '07. Manufacturing & Bundles', icon: PackagePlus },
    { id: 'bom', label: '07. Manufacturing & Bundles', icon: Wrench },
    { id: 'qc', label: '07. Manufacturing & Bundles', icon: CheckCircle2 },
    { id: 'promotions', label: '05. Pricing & Cost Studio', icon: Tag },
    { id: 'reviews', label: '09. Data & Operations', icon: Star },
    { id: 'returns', label: '09. Data & Operations', icon: RotateCcw },
    { id: 'import_export', label: '09. Data & Operations', icon: FileSpreadsheet },
    { id: 'templates', label: '09. Data & Operations', icon: History },
    { id: 'audit_logs', label: '09. Data & Operations', icon: History },
  ];

  const currentModule = navItems.find((item) => item.id === activeSubView) || navItems[0];
  const CurrentIcon = currentModule.icon;

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col">
      {/* Clean Top Header (Sub-navigation is managed cleanly via Sidebar) */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100">
              <CurrentIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-gray-400">Products</span>
                <span className="text-gray-300">/</span>
                <span className="text-xs font-bold text-indigo-600">
                  {currentModule.label}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                {currentModule.label.replace(/^\d+\.\s*/, '')}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 flex-wrap">
            <button
              onClick={loadAllData}
              disabled={isLoading}
              className="p-2.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl border border-gray-200 transition cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
            <button
              onClick={() => {
                setBarcodeProduct(products[0] || null);
                setIsBarcodeModalOpen(true);
              }}
              className="px-3.5 py-2.5 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-gray-500" />
              <span>Print Labels</span>
            </button>
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Product</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* VIEW 1: DASHBOARD */}
        {activeSubView === 'dashboard' && dashboardData && (
          <div className="space-y-6">
            {/* KPI Cards Row 1: Stock Health & Product Counts */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">Total Products</span>
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-gray-900">
                  {dashboardData.overview.total_products}
                </div>
                <div className="text-[11px] text-green-600 font-bold mt-0.5">
                  {dashboardData.overview.active_products} Active in POS
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">Out of Stock</span>
                  <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
                    <XCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-red-600">
                  {dashboardData.overview.out_of_stock}
                </div>
                <div className="text-[11px] text-red-500 font-semibold mt-0.5">Immediate Restock</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">Low Stock Alert</span>
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-amber-600">
                  {dashboardData.overview.low_stock}
                </div>
                <div className="text-[11px] text-amber-700 font-semibold mt-0.5">Below reorder level</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">Expired Batches</span>
                  <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-rose-600">
                  {dashboardData.overview.expired_products}
                </div>
                <div className="text-[11px] text-rose-700 font-semibold mt-0.5">
                  {dashboardData.overview.expiring_soon} in 30 days
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">Featured</span>
                  <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-purple-600">
                  {dashboardData.overview.featured_products}
                </div>
                <div className="text-[11px] text-purple-700 font-semibold mt-0.5">High Priority Items</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">New Arrivals</span>
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Tag className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-emerald-600">
                  {dashboardData.overview.new_products}
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">Catalog Additions</div>
              </div>
            </div>

            {/* Financial Valuation Summary Card */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10 relative z-10">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-300 rounded-md text-[10px] font-extrabold uppercase tracking-wider">
                      Catalog Intelligence
                    </span>
                    <span className="text-xs text-indigo-300">Live Valuation & Inventory ROI</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black mt-1.5 tracking-tight">
                    Financial Valuation & Profit Analysis
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="px-4 py-2 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                    <span className="text-xs text-gray-300 block">Average Profit Margin</span>
                    <span className="text-lg font-black text-emerald-400">
                      {dashboardData.financials.average_margin_percent}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 relative z-10">
                <div>
                  <span className="text-xs text-gray-400 font-medium">Total Landed Inventory Cost</span>
                  <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                    ${dashboardData.financials.total_stock_value.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Includes freight & duty fees</p>
                </div>

                <div>
                  <span className="text-xs text-gray-400 font-medium">Potential Retail Sales Value</span>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                    ${dashboardData.financials.potential_sales_value.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-emerald-300/80 mt-1">At active selling prices</p>
                </div>

                <div>
                  <span className="text-xs text-gray-400 font-medium">Projected Gross Profit</span>
                  <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
                    ${dashboardData.financials.potential_profit.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-amber-300/80 mt-1">Net of supplier & landed cost</p>
                </div>

                <div>
                  <span className="text-xs text-gray-400 font-medium">Inventory Velocity Rating</span>
                  <div className="text-2xl sm:text-3xl font-black text-cyan-400 mt-1">
                    Optimal (3.8x)
                  </div>
                  <p className="text-[11px] text-cyan-300/80 mt-1">Estimated annual turn cycles</p>
                </div>
              </div>
            </div>

            {/* Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* By Product Type */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
                <h4 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center space-x-2">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span>10 Product Types Distribution</span>
                </h4>
                <div className="space-y-2">
                  {dashboardData.by_type.map(item => (
                    <div
                      key={item.product_type}
                      className="flex justify-between items-center text-xs py-2 border-b border-gray-100 last:border-0"
                    >
                      <span className="font-bold text-gray-700">{item.product_type}</span>
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-extrabold rounded-lg">
                        {item.count} items
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Category */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
                <h4 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center space-x-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <FolderTree className="w-4 h-4" />
                  </div>
                  <span>Category Breakdown</span>
                </h4>
                <div className="space-y-2">
                  {dashboardData.by_category.map(item => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center text-xs py-2 border-b border-gray-100 last:border-0"
                    >
                      <span className="font-bold text-gray-700">{item.name}</span>
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-extrabold rounded-lg">
                        {item.count} items
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions Shortcuts */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
                <h4 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center space-x-2">
                  <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span>Quick Lifecycle Launchers</span>
                </h4>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <button
                    onClick={() => handleSelectSubView('catalog')}
                    className="p-3 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 rounded-xl text-left border border-gray-200 transition cursor-pointer"
                  >
                    <Package className="w-4 h-4 text-blue-600 mb-1" />
                    <div className="font-extrabold text-gray-900">Product List</div>
                    <div className="text-[10px] text-gray-500">Edit & manage items</div>
                  </button>

                  <button
                    onClick={() => handleSelectSubView('variants')}
                    className="p-3 bg-gray-50 hover:bg-purple-50 hover:border-purple-200 rounded-xl text-left border border-gray-200 transition cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-purple-600 mb-1" />
                    <div className="font-extrabold text-gray-900">Variant Matrix</div>
                    <div className="text-[10px] text-gray-500">Sizes, colors, combos</div>
                  </button>

                  <button
                    onClick={() => handleSelectSubView('batches')}
                    className="p-3 bg-gray-50 hover:bg-amber-50 hover:border-amber-200 rounded-xl text-left border border-gray-200 transition cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-amber-600 mb-1" />
                    <div className="font-extrabold text-gray-900">Batch Expiry</div>
                    <div className="text-[10px] text-gray-500">Lot & expiration alert</div>
                  </button>

                  <button
                    onClick={() => handleSelectSubView('bom')}
                    className="p-3 bg-gray-50 hover:bg-violet-50 hover:border-violet-200 rounded-xl text-left border border-gray-200 transition cursor-pointer"
                  >
                    <Wrench className="w-4 h-4 text-violet-600 mb-1" />
                    <div className="font-extrabold text-gray-900">Manufacturing</div>
                    <div className="text-[10px] text-gray-500">BOM recipes & assembly</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: CATALOG (Full Enterprise Table & Grid Modes) */}
        {activeSubView === 'catalog' && (
          <div className="space-y-4">
            {/* Filter & Controls Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-1 items-center space-x-2 flex-wrap gap-y-2">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by Name, SKU, Barcode..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 outline-none font-medium"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 outline-none font-medium"
                >
                  <option value="ALL">All Types (10)</option>
                  <option value="SIMPLE">SIMPLE</option>
                  <option value="VARIABLE">VARIABLE</option>
                  <option value="BUNDLE">BUNDLE</option>
                  <option value="MANUFACTURED">MANUFACTURED</option>
                  <option value="RAW_MATERIAL">RAW_MATERIAL</option>
                  <option value="BATCH_TRACKED">BATCH_TRACKED</option>
                  <option value="SERIALIZED">SERIALIZED</option>
                  <option value="SERVICE">SERVICE</option>
                </select>

                <select
                  value={stockFilter}
                  onChange={e => setStockFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 outline-none font-medium"
                >
                  <option value="ALL">All Stock Levels</option>
                  <option value="IN_STOCK">In Stock</option>
                  <option value="LOW_STOCK">Low Stock Alert</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>

                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 outline-none font-medium"
                >
                  <option value="name_asc">Sort: Name (A-Z)</option>
                  <option value="price_asc">Sort: Price (Low → High)</option>
                  <option value="price_desc">Sort: Price (High → Low)</option>
                  <option value="stock_asc">Sort: Stock (Low → High)</option>
                  <option value="stock_desc">Sort: Stock (High → Low)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                {selectedProductIds.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1 shadow-sm transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete ({selectedProductIds.length})</span>
                  </button>
                )}

                {/* View Mode Switcher */}
                <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                  <button
                    onClick={() => setCatalogViewMode('table')}
                    className={`p-1.5 rounded-lg transition ${
                      catalogViewMode === 'table' ? 'bg-white shadow-xs text-indigo-700' : 'text-gray-500'
                    }`}
                    title="Table View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCatalogViewMode('grid')}
                    className={`p-1.5 rounded-lg transition ${
                      catalogViewMode === 'grid' ? 'bg-white shadow-xs text-indigo-700' : 'text-gray-500'
                    }`}
                    title="Grid Card View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Grid View Mode */}
            {catalogViewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map(product => {
                  const isLow = (product.opening_stock || 0) <= (product.reorder_level || 5);
                  const isOut = (product.opening_stock || 0) <= 0;
                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-lg transition p-4 flex flex-col justify-between group"
                    >
                      <div>
                        {/* Image & Type Header */}
                        <div className="relative rounded-xl overflow-hidden bg-gray-50 aspect-video mb-3 flex items-center justify-center border border-gray-100">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          ) : (
                            <div className="text-3xl font-black text-gray-300">
                              {product.name.charAt(0)}
                            </div>
                          )}
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-black bg-white/90 backdrop-blur-xs text-gray-800 shadow-xs">
                            {product.product_type}
                          </span>
                          <span
                            className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                              isOut
                                ? 'bg-red-500 text-white'
                                : isLow
                                ? 'bg-amber-500 text-white'
                                : 'bg-emerald-500 text-white'
                            }`}
                          >
                            {isOut ? 'Out of Stock' : `${product.opening_stock || 0} in stock`}
                          </span>
                        </div>

                        {/* Title & SKU */}
                        <div className="font-extrabold text-gray-900 text-sm line-clamp-1">
                          {product.name}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5 flex items-center justify-between">
                          <span>{product.sku}</span>
                          <span>{product.category?.name || 'General'}</span>
                        </div>

                        {/* Price & Margins */}
                        <div className="mt-3 flex items-baseline justify-between border-t border-gray-100 pt-2.5">
                          <div>
                            <span className="text-[10px] text-gray-400 block font-medium">Selling Price</span>
                            <span className="text-base font-black text-emerald-600">
                              ${(product.selling_price || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 block font-medium">Cost Price</span>
                            <span className="text-xs font-mono font-bold text-gray-700">
                              ${(product.cost_price || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          {product.product_type === 'VARIABLE' && (
                            <button
                              onClick={() => {
                                setVariantProduct(product);
                                setIsVariantModalOpen(true);
                              }}
                              className="px-2 py-1 text-[10px] font-bold bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100"
                            >
                              Matrix
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setLandedCostProduct(product);
                              setIsLandedCostModalOpen(true);
                            }}
                            className="px-2 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100"
                          >
                            Margin
                          </button>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              setBarcodeProduct(product);
                              setIsBarcodeModalOpen(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg"
                            title="Barcode"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingProduct(product);
                              setIsCreateModalOpen(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                            title="Delete"
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
              /* Table View Mode */
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-600">
                    <thead className="bg-gray-100/80 text-gray-700 font-extrabold uppercase tracking-wider border-b border-gray-200">
                      <tr>
                        <th className="p-3.5 w-8">
                          <input
                            type="checkbox"
                            checked={
                              filteredProducts.length > 0 &&
                              selectedProductIds.length === filteredProducts.length
                            }
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedProductIds(filteredProducts.map(p => p.id));
                              } else {
                                setSelectedProductIds([]);
                              }
                            }}
                            className="rounded text-indigo-600"
                          />
                        </th>
                        <th className="p-3.5">Product Title</th>
                        <th className="p-3.5">SKU / Barcode</th>
                        <th className="p-3.5">Type</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5 text-right">Cost Price</th>
                        <th className="p-3.5 text-right">Selling Price</th>
                        <th className="p-3.5 text-center">Stock Level</th>
                        <th className="p-3.5 text-center">Lifecycle Operations</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-gray-400 italic">
                            No products found matching the criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map(product => {
                          const isSelected = selectedProductIds.includes(product.id);
                          const isLow = (product.opening_stock || 0) <= (product.reorder_level || 5);
                          const isOut = (product.opening_stock || 0) <= 0;

                          return (
                            <tr key={product.id} className="hover:bg-indigo-50/20 transition">
                              <td className="p-3.5">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setSelectedProductIds([...selectedProductIds, product.id]);
                                    } else {
                                      setSelectedProductIds(
                                        selectedProductIds.filter(id => id !== product.id)
                                      );
                                    }
                                  }}
                                  className="rounded text-indigo-600"
                                />
                              </td>
                              <td className="p-3.5">
                                <div className="flex items-center space-x-3">
                                  {product.image_url ? (
                                    <img
                                      src={product.image_url}
                                      alt={product.name}
                                      className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold border border-gray-200 shrink-0">
                                      {product.name.charAt(0)}
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-extrabold text-gray-900 text-[13px]">
                                      {product.name}
                                    </div>
                                    <div className="text-[11px] text-gray-400 flex items-center space-x-1.5">
                                      <span>ID: #{product.id}</span>
                                      <span>•</span>
                                      <span>{product.brand?.name || 'Generic'}</span>
                                      {product.is_featured && (
                                        <span className="text-purple-600 font-bold">★ Featured</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3.5 font-mono text-[11px]">
                                <div className="font-bold text-gray-800">{product.sku}</div>
                                <div className="text-gray-400">{product.barcode}</div>
                              </td>
                              <td className="p-3.5">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide ${
                                    product.product_type === 'VARIABLE'
                                      ? 'bg-purple-100 text-purple-800'
                                      : product.product_type === 'BUNDLE'
                                      ? 'bg-amber-100 text-amber-800'
                                      : product.product_type === 'MANUFACTURED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : product.product_type === 'SERIALIZED'
                                      ? 'bg-cyan-100 text-cyan-800'
                                      : product.product_type === 'BATCH_TRACKED'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {product.product_type}
                                </span>
                              </td>
                              <td className="p-3.5 text-gray-700 font-medium">
                                {product.category?.name || 'Uncategorized'}
                              </td>
                              <td className="p-3.5 text-right font-mono text-gray-700">
                                ${(product.cost_price || 0).toFixed(2)}
                              </td>
                              <td className="p-3.5 text-right font-black text-emerald-600 font-mono text-[13px]">
                                ${(product.selling_price || 0).toFixed(2)}
                              </td>
                              <td className="p-3.5 text-center">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                                    isOut
                                      ? 'bg-red-100 text-red-700 border border-red-200'
                                      : isLow
                                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                  }`}
                                >
                                  {product.opening_stock || 0}
                                </span>
                              </td>
                              <td className="p-3.5 text-center">
                                {/* Quick Lifecycle Badges */}
                                <div className="flex items-center justify-center space-x-1 flex-wrap gap-y-1">
                                  {product.product_type === 'VARIABLE' && (
                                    <button
                                      onClick={() => {
                                        setVariantProduct(product);
                                        setIsVariantModalOpen(true);
                                      }}
                                      className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold rounded-lg border border-purple-200 cursor-pointer"
                                      title="Generate Variant Matrix"
                                    >
                                      Matrix
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setLandedCostProduct(product);
                                      setIsLandedCostModalOpen(true);
                                    }}
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200 cursor-pointer"
                                    title="Calculate Landed Cost"
                                  >
                                    Margin
                                  </button>
                                  {product.product_type === 'BUNDLE' && (
                                    <button
                                      onClick={() => {
                                        setBundleBomProduct(product);
                                        setBundleBomMode('BUNDLE');
                                        setIsBundleBomModalOpen(true);
                                      }}
                                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-200 cursor-pointer"
                                    >
                                      Bundle
                                    </button>
                                  )}
                                  {product.product_type === 'MANUFACTURED' && (
                                    <button
                                      onClick={() => {
                                        setBundleBomProduct(product);
                                        setBundleBomMode('BOM');
                                        setIsBundleBomModalOpen(true);
                                      }}
                                      className="px-2 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 text-[10px] font-bold rounded-lg border border-violet-200 cursor-pointer"
                                    >
                                      BOM
                                    </button>
                                  )}
                                  {product.product_type === 'BATCH_TRACKED' && (
                                    <button
                                      onClick={() => {
                                        setBatchProduct(product);
                                        setIsBatchModalOpen(true);
                                      }}
                                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold rounded-lg border border-rose-200 cursor-pointer"
                                    >
                                      Batch
                                    </button>
                                  )}
                                  {product.product_type === 'SERIALIZED' && (
                                    <button
                                      onClick={() => {
                                        setSerialProduct(product);
                                        setIsSerialModalOpen(true);
                                      }}
                                      className="px-2 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 text-[10px] font-bold rounded-lg border border-cyan-200 cursor-pointer"
                                    >
                                      Serial
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="p-3.5 text-right">
                                <div className="flex items-center justify-end space-x-1">
                                  <button
                                    onClick={() => {
                                      setBarcodeProduct(product);
                                      setIsBarcodeModalOpen(true);
                                    }}
                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg cursor-pointer transition"
                                    title="Print Barcode Label"
                                  >
                                    <Printer className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingProduct(product);
                                      setIsCreateModalOpen(true);
                                    }}
                                    className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg cursor-pointer transition"
                                    title="Edit Product"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg cursor-pointer transition"
                                    title="Delete Product"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: 10 PRODUCT TYPES */}
                {/* VIEW: VARIANTS & MATRIX */}
        {(activeSubView === 'variants' || activeSubView === 'types') && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 border-b border-gray-200 pb-3 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setVariantsTab('variants')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  variantsTab === 'variants'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Variant Matrix Generator</span>
              </button>
              <button
                onClick={() => setVariantsTab('types')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  variantsTab === 'types'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>10 Product Types Guide</span>
              </button>
            </div>

            {variantsTab === 'variants' && (

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-gray-900">Variant Matrix Generator</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Generate cross-product attribute combinations (Size × Color × Material) with custom SKUs and prices.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products
                .filter(p => p.product_type === 'VARIABLE')
                .map(product => (
                  <div key={product.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-gray-900 text-sm">{product.name}</h4>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">SKU: {product.sku}</p>
                      </div>
                      <button
                        onClick={() => {
                          setVariantProduct(product);
                          setIsVariantModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Manage Matrix</span>
                      </button>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-xs">
                      <span className="text-gray-500">Configured Variants:</span>
                      <span className="font-extrabold text-purple-700">
                        {product.variants?.length || 'Ready to generate'}
                      </span>
                    </div>
                  </div>
                ))}
              {products.filter(p => p.product_type === 'VARIABLE').length === 0 && (
                <div className="col-span-2 bg-white p-12 rounded-3xl border border-gray-200 text-center text-gray-400">
                  <Layers className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm font-bold">No Variable Products Configured</p>
                  <p className="text-xs text-gray-500 mt-1">Create a product with type "VARIABLE" to build an attribute matrix.</p>
                </div>
              )}
            </div>
          </div>
            )}

            {variantsTab === 'types' && (

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-gray-900">Supported Enterprise Product Types (10)</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Lifecycle governance configured specifically for retail, manufacturing, assembly, food & beverage, and digital operations.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsCreateModalOpen(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create with Custom Type</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { type: 'SIMPLE', title: 'Standard / Simple Product', desc: 'Single SKU item with standard cost, retail price, and automated stock deduction at POS checkout.', color: 'border-blue-500', badge: 'bg-blue-50 text-blue-700' },
                { type: 'VARIABLE', title: 'Variable Product (Matrix)', desc: 'Multi-attribute matrix (Size, Color, Material) with independent SKUs, prices, barcodes, and stock levels.', color: 'border-purple-500', badge: 'bg-purple-50 text-purple-700' },
                { type: 'BUNDLE', title: 'Combo Kit / Bundle', desc: 'Package of multiple child items sold together as a single kit with dynamic discount calculation.', color: 'border-amber-500', badge: 'bg-amber-50 text-amber-700' },
                { type: 'MANUFACTURED', title: 'Manufactured Item (BOM)', desc: 'Produced in-house using raw ingredients and recipe formulations with scrap rate and labor costs.', color: 'border-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
                { type: 'RAW_MATERIAL', title: 'Raw Material / Ingredient', desc: 'Consumed exclusively in BOM recipes; depleted automatically upon finished good production.', color: 'border-orange-500', badge: 'bg-orange-50 text-orange-700' },
                { type: 'BATCH_TRACKED', title: 'Batch / Lot Tracked', desc: 'Perishable goods tracked by batch numbers, manufacture dates, and shelf-life expiration countdowns.', color: 'border-rose-500', badge: 'bg-rose-50 text-rose-700' },
                { type: 'SERIALIZED', title: 'Serialized Item (IMEI / Serial)', desc: 'High-value electronics where each unit has a unique serial number, IMEI, and warranty policy.', color: 'border-cyan-500', badge: 'bg-cyan-50 text-cyan-700' },
                { type: 'SERVICE', title: 'Service / Non-Physical', desc: 'Labor, installation, repair, consulting, or delivery services with zero physical inventory deduction.', color: 'border-indigo-500', badge: 'bg-indigo-50 text-indigo-700' },
                { type: 'DIGITAL', title: 'Digital / Downloadable', desc: 'Software licenses, digital keys, and downloadable files fulfilled via email or customer portal.', color: 'border-teal-500', badge: 'bg-teal-50 text-teal-700' },
                { type: 'COMBO', title: 'Fast Food Meal Combo', desc: 'Quick service restaurant combo with customizable drink sizes, side options, and upsell modifiers.', color: 'border-yellow-500', badge: 'bg-yellow-50 text-yellow-700' },
              ].map(item => {
                const count = products.filter(p => p.product_type === item.type).length;
                return (
                  <div
                    key={item.type}
                    className={`bg-white p-5 rounded-2xl border-l-4 ${item.color} border-gray-200 shadow-xs hover:shadow-md transition flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2.5">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black ${item.badge}`}>
                          {item.type}
                        </span>
                        <span className="text-xs font-bold text-gray-500">{count} products</span>
                      </div>
                      <h4 className="font-extrabold text-gray-900 text-sm">{item.title}</h4>
                      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{item.desc}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                      <button
                        onClick={() => {
                          setSelectedType(item.type);
                          handleSelectSubView('catalog');
                        }}
                        className="text-xs text-indigo-600 font-extrabold hover:underline flex items-center space-x-1"
                      >
                        <span>Filter in Catalog</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
            )}
          </div>
        )}

        {/* VIEW 5: CATEGORIES */}
                {/* VIEW: ATTRIBUTES & TAXONOMY (CATEGORIES, BRANDS, UNITS) */}
        {(activeSubView === 'attributes' || activeSubView === 'categories' || activeSubView === 'brands' || activeSubView === 'units') && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 border-b border-gray-200 pb-3 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setAttributesTab('categories')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  attributesTab === 'categories'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <FolderTree className="w-4 h-4" />
                <span>Categories Tree ({categories.length})</span>
              </button>
              <button
                onClick={() => setAttributesTab('brands')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  attributesTab === 'brands'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Brands Portfolio ({brands.length})</span>
              </button>
              <button
                onClick={() => setAttributesTab('units')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  attributesTab === 'units'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Scale className="w-4 h-4" />
                <span>Unit Conversions ({units.length})</span>
              </button>
            </div>

            {attributesTab === 'categories' && (

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-gray-900">Product Categories Hierarchy</h3>
                <p className="text-xs text-gray-500 mt-0.5">Structure store catalog into categories and subcategories.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.map(cat => {
                const count = products.filter(p => p.category_id === cat.id).length;
                return (
                  <div key={cat.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <FolderTree className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-gray-900 text-sm">{cat.name}</div>
                        <div className="text-[11px] text-gray-400">Category ID #{cat.id}</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 font-extrabold rounded-full text-xs">
                      {count} items
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
            )}

            {attributesTab === 'brands' && (

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-gray-900">Brand Portfolio</h3>
                <p className="text-xs text-gray-500 mt-0.5">Manage brands, manufacturers, and vendor labels.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {brands.map(b => (
                <div key={b.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-gray-900 text-sm">{b.name}</div>
                      <div className="text-[11px] text-gray-400">Brand ID #{b.id}</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 font-extrabold rounded-full text-xs">
                    {products.filter(p => p.brand_id === b.id).length} items
                  </span>
                </div>
              ))}
              {brands.length === 0 && (
                <div className="col-span-3 text-center py-12 bg-white rounded-3xl border border-gray-200 text-gray-400 italic">
                  No brands defined yet. Set brand during product creation.
                </div>
              )}
            </div>
          </div>
            )}

            {attributesTab === 'units' && (

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
              <h3 className="text-xl font-black text-gray-900">Units of Measure & Multi-Tier Conversions</h3>
              <p className="text-xs text-gray-500 mt-0.5">Define base units and conversion factors for purchasing and sales packaging.</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {units.map(u => (
                  <div key={u.id} className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center text-xs">
                    <span className="font-extrabold text-gray-800">{u.name}</span>
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-700 font-mono rounded-md">ID #{u.id}</span>
                  </div>
                ))}
              </div>
              <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
                <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider mb-1">
                  Active Multi-Unit Conversion Matrix:
                </h4>
                <p className="text-xs text-blue-800 leading-relaxed font-medium">
                  • 1 Box = 24 Cans • 1 Carton = 12 Bottles • 1 kg = 1,000 g • 1 Pack = 10 Units • 1 Case = 48 Packs
                </p>
              </div>
            </div>
          </div>
            )}
          </div>
        )}

        {/* VIEW 8: MULTI-TIER PRICING */}
                {/* VIEW: PRICING & COST STUDIO */}
        {(activeSubView === 'pricing' || activeSubView === 'landed_cost' || activeSubView === 'promotions') && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 border-b border-gray-200 pb-3 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setPricingTab('pricing')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  pricingTab === 'pricing'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Multi-Tier Pricing Matrix</span>
              </button>
              <button
                onClick={() => setPricingTab('landed_cost')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  pricingTab === 'landed_cost'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Calculator className="w-4 h-4" />
                <span>Landed Cost & Margins Studio</span>
              </button>
            </div>

            {pricingTab === 'pricing' && (

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-gray-900">Multi-Tier Pricing Matrix & Volume Breaks</h3>
                <p className="text-xs text-gray-500 mt-0.5">Automated price calculation across Retail, Wholesale, VIP, Member, and Online channels.</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100/80 text-gray-700 font-extrabold uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="p-3.5">Product Name</th>
                      <th className="p-3.5 text-right">Base Cost</th>
                      <th className="p-3.5 text-right text-emerald-600">Retail</th>
                      <th className="p-3.5 text-right text-indigo-600">Wholesale</th>
                      <th className="p-3.5 text-right text-purple-600">VIP Tier</th>
                      <th className="p-3.5 text-right text-blue-600">Member</th>
                      <th className="p-3.5 text-right text-cyan-600">Online</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50/80 transition">
                        <td className="p-3.5 font-bold text-gray-900">{p.name}</td>
                        <td className="p-3.5 text-right font-mono">${(p.cost_price || 0).toFixed(2)}</td>
                        <td className="p-3.5 text-right font-black text-emerald-600 font-mono">${(p.selling_price || 0).toFixed(2)}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-indigo-700">${(p.wholesale_price || 0).toFixed(2)}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-purple-700">${(p.vip_price || 0).toFixed(2)}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-blue-700">${(p.member_price || 0).toFixed(2)}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-cyan-700">${(p.online_price || 0).toFixed(2)}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setIsCreateModalOpen(true);
                            }}
                            className="text-xs text-indigo-600 font-bold hover:underline"
                          >
                            Edit Tiers
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
            )}

            {pricingTab === 'landed_cost' && (

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
              <h3 className="text-xl font-black text-gray-900">Landed Cost & Tariff Studio</h3>
              <p className="text-xs text-gray-500 mt-0.5">Calculate true landed costs incorporating base supplier invoice, shipping, customs duty, and warehouse handling fees.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map(product => (
                <div key={product.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex justify-between items-center">
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-sm">{product.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Base Cost: ${(product.cost_price || 0).toFixed(2)} • True Landed: <span className="font-bold text-emerald-700">${(product.landed_cost || product.cost_price || 0).toFixed(2)}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setLandedCostProduct(product);
                      setIsLandedCostModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Calculate</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
            )}
          </div>
        )}

        {/* VIEW 10: INVENTORY & REORDERS */}
        {activeSubView === 'inventory' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
              <h3 className="text-xl font-black text-gray-900">Inventory Levels & Reorder Triggers</h3>
              <p className="text-xs text-gray-500 mt-0.5">Real-time stock monitors with automated safety buffers and low-stock replenishment thresholds.</p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100/80 text-gray-700 font-extrabold uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="p-3.5">Product</th>
                      <th className="p-3.5 text-center">Opening Stock</th>
                      <th className="p-3.5 text-center">Safety Buffer</th>
                      <th className="p-3.5 text-center">Reorder Alert</th>
                      <th className="p-3.5 text-center">Default Replenishment</th>
                      <th className="p-3.5 text-center">Stock Health</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map(p => {
                      const isLow = (p.opening_stock || 0) <= (p.reorder_level || 5);
                      const isOut = (p.opening_stock || 0) <= 0;
                      return (
                        <tr key={p.id} className="hover:bg-gray-50/80 transition">
                          <td className="p-3.5 font-bold text-gray-900">{p.name}</td>
                          <td className="p-3.5 text-center font-black text-sm">{p.opening_stock || 0}</td>
                          <td className="p-3.5 text-center font-mono">{p.safety_stock || 5}</td>
                          <td className="p-3.5 text-center font-mono">{p.reorder_level || 10}</td>
                          <td className="p-3.5 text-center font-mono">{p.reorder_quantity || 20}</td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-black ${
                                isOut
                                  ? 'bg-red-100 text-red-800'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {isOut ? 'OUT OF STOCK' : isLow ? 'REORDER SOON' : 'OPTIMAL'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 11: WAREHOUSE BINS */}
        {activeSubView === 'warehouse' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
              <h3 className="text-xl font-black text-gray-900">Warehouse Bin Mapping (Aisle / Rack / Shelf / Bin)</h3>
              <p className="text-xs text-gray-500 mt-0.5">Physical warehouse storage coordinates for accelerated picking and put-away dispatching.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.map((p, idx) => (
                <div key={p.id} className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs text-xs">
                  <div className="font-extrabold text-gray-900 text-sm">{p.name}</div>
                  <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-indigo-700 font-bold">
                    Zone A • Aisle 0{((idx % 3) + 1)} • Rack B • Shelf 0{((idx % 4) + 1)} • Bin {10 + idx}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 12: BARCODES & SKU */}
        {activeSubView === 'barcodes' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
              <h3 className="text-xl font-black text-gray-900">Barcode Studio & Label Printing</h3>
              <p className="text-xs text-gray-500 mt-0.5">EAN-13, Code-128, and QR label generation with thermal roll and sheet printer templates.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex justify-between items-center">
                  <div>
                    <div className="font-extrabold text-gray-900 text-xs">{p.name}</div>
                    <div className="font-mono text-gray-500 text-[11px] mt-1">{p.barcode}</div>
                  </div>
                  <button
                    onClick={() => {
                      setBarcodeProduct(p);
                      setIsBarcodeModalOpen(true);
                    }}
                    className="p-2.5 bg-gray-100 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 rounded-xl transition cursor-pointer"
                    title="Print Label"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 13: SUPPLIERS */}
        {activeSubView === 'suppliers' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
              <h3 className="text-xl font-black text-gray-900">Multi-Supplier Directory & Lead Times</h3>
              <p className="text-xs text-gray-500 mt-0.5">Track vendor SKUs, lead time days, primary vendor assignments, and negotiated purchase costs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex justify-between items-center">
                  <div>
                    <div className="font-extrabold text-gray-900 text-sm">{p.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Primary Supplier: <span className="font-bold text-indigo-700">Global Supply Co.</span> • Lead Time: 3-5 Days
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                    Primary Vendor
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 14: BATCHES & EXPIRY */}
                {/* VIEW: TRACKING & TRACEABILITY */}
        {(activeSubView === 'tracking' || activeSubView === 'batches' || activeSubView === 'serials' || activeSubView === 'warranties') && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 border-b border-gray-200 pb-3 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setTrackingTab('batches')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  trackingTab === 'batches'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Batches & Expiry (FEFO) ({batches.length})</span>
              </button>
              <button
                onClick={() => setTrackingTab('serials')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  trackingTab === 'serials'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Hash className="w-4 h-4" />
                <span>Serial & IMEI Registry ({serialNumbers.length})</span>
              </button>
            </div>

            {trackingTab === 'batches' && (

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-gray-900">Batches & Expiry Countdown Alerts</h3>
                <p className="text-xs text-gray-500 mt-0.5">Track manufacture batches, lots, and shelf-life expiration.</p>
              </div>
              <button
                onClick={() => {
                  setBatchProduct(products[0] || null);
                  setIsBatchModalOpen(true);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Batch</span>
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100/80 text-gray-700 font-extrabold uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="p-3.5">Batch Number</th>
                      <th className="p-3.5">Lot Number</th>
                      <th className="p-3.5">Manufacture Date</th>
                      <th className="p-3.5">Expiry Date</th>
                      <th className="p-3.5 text-center">Remaining Qty</th>
                      <th className="p-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {batches.map(b => (
                      <tr key={b.id} className="hover:bg-gray-50/80 transition">
                        <td className="p-3.5 font-mono font-bold text-gray-900">{b.batch_number}</td>
                        <td className="p-3.5 font-mono text-gray-600">{b.lot_number}</td>
                        <td className="p-3.5">{b.manufactured_date}</td>
                        <td className="p-3.5 font-bold text-rose-600">{b.expiry_date}</td>
                        <td className="p-3.5 text-center font-black">{b.remaining_quantity}</td>
                        <td className="p-3.5 text-center">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {batches.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400 italic">
                          No batches registered yet. Click "New Batch" to register an expiry batch.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
            )}

            {trackingTab === 'serials' && (

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-gray-900">Serial Numbers & IMEI Registry</h3>
                <p className="text-xs text-gray-500 mt-0.5">Track individual unit serials, IMEI numbers, and warranty terms.</p>
              </div>
              <button
                onClick={() => {
                  setSerialProduct(products[0] || null);
                  setIsSerialModalOpen(true);
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Register Serial</span>
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100/80 text-gray-700 font-extrabold uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="p-3.5">Serial Number</th>
                      <th className="p-3.5">IMEI</th>
                      <th className="p-3.5">MAC Address</th>
                      <th className="p-3.5 text-center">Warranty (Mos)</th>
                      <th className="p-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {serialNumbers.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50/80 transition">
                        <td className="p-3.5 font-mono font-bold text-gray-900">{s.serial_number}</td>
                        <td className="p-3.5 font-mono text-gray-600">{s.imei || 'N/A'}</td>
                        <td className="p-3.5 font-mono text-gray-500">{s.mac_address || 'N/A'}</td>
                        <td className="p-3.5 text-center font-bold">{s.warranty_months}m</td>
                        <td className="p-3.5 text-center">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-cyan-100 text-cyan-800">
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {serialNumbers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                          No serial numbers recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
            )}
          </div>
        )}

        {/* VIEW 17: BUNDLES */}
                {/* VIEW: MANUFACTURING & BUNDLES */}
        {(activeSubView === 'manufacturing' || activeSubView === 'bom' || activeSubView === 'bundles' || activeSubView === 'qc') && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 border-b border-gray-200 pb-3 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setManufacturingTab('bom')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  manufacturingTab === 'bom'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>Bill of Materials (BOM) Recipes</span>
              </button>
              <button
                onClick={() => setManufacturingTab('bundles')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  manufacturingTab === 'bundles'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <PackagePlus className="w-4 h-4" />
                <span>Bundles & Combo Kits</span>
              </button>
              <button
                onClick={() => setManufacturingTab('qc')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  manufacturingTab === 'qc'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Quality Control Inspections ({qcInspections.length})</span>
              </button>
            </div>

            {manufacturingTab === 'bom' && (

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
              <h3 className="text-xl font-black text-gray-900">Bill of Materials (BOM) & Manufacturing Recipes</h3>
              <p className="text-xs text-gray-500 mt-0.5">Formulate product manufacturing recipes with ingredient quantities, scrap rates, and labor costs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products
                .filter(p => p.product_type === 'MANUFACTURED')
                .map(p => (
                  <div key={p.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex justify-between items-center">
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-sm">{p.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">Finished Good • Recipe Active</p>
                    </div>
                    <button
                      onClick={() => {
                        setBundleBomProduct(p);
                        setBundleBomMode('BOM');
                        setIsBundleBomModalOpen(true);
                      }}
                      className="px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                    >
                      Edit Recipe / BOM
                    </button>
                  </div>
                ))}
            </div>
          </div>
            )}

            {manufacturingTab === 'bundles' && (

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
              <h3 className="text-xl font-black text-gray-900">Combo Kits & Bundled Items</h3>
              <p className="text-xs text-gray-500 mt-0.5">Bundle multiple parent and child products into promotional sales packages.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products
                .filter(p => p.product_type === 'BUNDLE')
                .map(p => (
                  <div key={p.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex justify-between items-center">
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-sm">{p.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">Package Price: ${(p.selling_price || 0).toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => {
                        setBundleBomProduct(p);
                        setBundleBomMode('BUNDLE');
                        setIsBundleBomModalOpen(true);
                      }}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                    >
                      Configure Bundle
                    </button>
                  </div>
                ))}
            </div>
          </div>
            )}

            {manufacturingTab === 'qc' && (

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
              <h3 className="text-xl font-black text-gray-900">Quality Control (QC) & Inspection Logs</h3>
              <p className="text-xs text-gray-500 mt-0.5">Track inspection sample sizes, defect counts, pass/fail ratios, and inspector credentials.</p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100/80 text-gray-700 font-extrabold uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="p-3.5">Inspection Date</th>
                      <th className="p-3.5">Inspector</th>
                      <th className="p-3.5 text-center">Sample Size</th>
                      <th className="p-3.5 text-center text-emerald-600">Passed</th>
                      <th className="p-3.5 text-center text-red-600">Failed</th>
                      <th className="p-3.5 text-center">Verdict</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {qcInspections.map(q => (
                      <tr key={q.id} className="hover:bg-gray-50/80 transition">
                        <td className="p-3.5 font-semibold">{q.inspection_date}</td>
                        <td className="p-3.5 font-bold">{q.inspector_name}</td>
                        <td className="p-3.5 text-center font-bold">{q.sample_size}</td>
                        <td className="p-3.5 text-center text-emerald-600 font-black">{q.passed_quantity}</td>
                        <td className="p-3.5 text-center text-red-600 font-black">{q.failed_quantity}</td>
                        <td className="p-3.5 text-center">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                            {q.inspection_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {qcInspections.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400 italic">
                          No QC inspections recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
            )}
          </div>
        )}

        {/* VIEW 21: REVIEWS & RATINGS */}
                {/* VIEW: DATA & OPERATIONS */}
        {(activeSubView === 'data' || activeSubView === 'import_export' || activeSubView === 'templates' || activeSubView === 'audit_logs' || activeSubView === 'returns' || activeSubView === 'reviews') && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 border-b border-gray-200 pb-3 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setDataTab('import_export')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  dataTab === 'import_export'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Catalog Import & Export</span>
              </button>
              <button
                onClick={() => setDataTab('templates')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  dataTab === 'templates'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Templates & Audit Trail ({auditLogs.length})</span>
              </button>
              <button
                onClick={() => setDataTab('reviews')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  dataTab === 'reviews'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Star className="w-4 h-4" />
                <span>Customer Reviews ({reviews.length})</span>
              </button>
            </div>

            {dataTab === 'import_export' && (

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
              <h3 className="text-xl font-black text-gray-900">Bulk Product Import & Export Studio</h3>
              <p className="text-xs text-gray-500 mt-0.5">High-speed catalog batch operations via CSV or Excel templates.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
                <h4 className="font-black text-gray-900 text-sm flex items-center space-x-2">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>Import Products (CSV / Excel)</span>
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Bulk upload products including SKU, Barcode, Name, Cost, Price, Category ID, and Opening Stock.
                </p>
                <div className="border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-2xl p-8 text-center cursor-pointer transition bg-gray-50/50">
                  <FileSpreadsheet className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <span className="text-xs font-bold text-gray-700 block">Drag & drop catalog CSV or click to browse</span>
                  <span className="text-[10px] text-gray-400 mt-1 block">Supports .csv, .xlsx up to 25MB</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
                <h4 className="font-black text-gray-900 text-sm flex items-center space-x-2">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Export Product Catalog</span>
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Generate complete database export including multi-tier pricing, landed costs, and current warehouse stock counts.
                </p>
                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={() => {
                      alert('Exporting catalog CSV...');
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-2 cursor-pointer transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Full Catalog (.CSV)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
            )}

            {dataTab === 'templates' && (

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
              <h3 className="text-xl font-black text-gray-900">Product Lifecycle Audit Logs & Price History</h3>
              <p className="text-xs text-gray-500 mt-0.5">Immutable audit trail of product price changes, inventory reorders, and metadata adjustments.</p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100/80 text-gray-700 font-extrabold uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="p-3.5">Timestamp</th>
                      <th className="p-3.5">Operation / Action</th>
                      <th className="p-3.5">Product ID</th>
                      <th className="p-3.5">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50/80 transition">
                        <td className="p-3.5 font-mono text-gray-500">{log.created_at}</td>
                        <td className="p-3.5 font-bold text-indigo-700">{log.action}</td>
                        <td className="p-3.5 font-mono font-bold">#{log.product_id}</td>
                        <td className="p-3.5 font-mono text-gray-500">{log.ip_address || '127.0.0.1'}</td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-400 italic">
                          Audit events logged automatically during product adjustments.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
            )}

            {dataTab === 'reviews' && (

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
              <h3 className="text-xl font-black text-gray-900">Customer Reviews & Rating Moderation</h3>
              <p className="text-xs text-gray-500 mt-0.5">Moderate customer star ratings and feedback for store products.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map(r => (
                <div key={r.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-gray-900 text-xs">{r.customer_name}</span>
                    <div className="flex text-amber-400">
                      {'★'.repeat(r.rating)}
                      {'☆'.repeat(5 - r.rating)}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 italic">"{r.review_text}"</p>
                  <div className="text-[10px] text-gray-400 font-mono">{r.created_at}</div>
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="col-span-2 text-center py-12 bg-white rounded-3xl border border-gray-200 text-gray-400 italic">
                  No customer reviews submitted yet.
                </div>
              )}
            </div>
          </div>
            )}
          </div>
        )}
      </div>

      {/* MODALS */}
      {/* 1. Create / Edit Enterprise Product Modal */}
      {isCreateModalOpen && (
        <CreateProductEnterpriseModal
          product={editingProduct}
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingProduct(null);
          }}
          onSaved={() => {
            loadAllData();
          }}
          categories={categories}
          brands={brands}
          units={units}
        />
      )}

      {/* 2. Variant Matrix Modal */}
      {isVariantModalOpen && variantProduct && (
        <VariantMatrixModal
          product={variantProduct}
          isOpen={isVariantModalOpen}
          onClose={() => {
            setIsVariantModalOpen(false);
            setVariantProduct(null);
          }}
          onSaved={() => {
            loadAllData();
          }}
        />
      )}

      {/* 3. Landed Cost Modal */}
      {isLandedCostModalOpen && landedCostProduct && (
        <LandedCostModal
          product={landedCostProduct}
          isOpen={isLandedCostModalOpen}
          onClose={() => {
            setIsLandedCostModalOpen(false);
            setLandedCostProduct(null);
          }}
          onSaved={() => {
            loadAllData();
          }}
        />
      )}

      {/* 4. Batch / Expiry Modal */}
      {isBatchModalOpen && batchProduct && (
        <BatchLotModal
          product={batchProduct}
          isOpen={isBatchModalOpen}
          onClose={() => {
            setIsBatchModalOpen(false);
            setBatchProduct(null);
          }}
          onSaved={() => {
            loadAllData();
          }}
        />
      )}

      {/* 5. Serial Number / IMEI Modal */}
      {isSerialModalOpen && serialProduct && (
        <SerialNumberModal
          product={serialProduct}
          isOpen={isSerialModalOpen}
          onClose={() => {
            setIsSerialModalOpen(false);
            setSerialProduct(null);
          }}
          onSaved={() => {
            loadAllData();
          }}
        />
      )}

      {/* 6. Bundle / BOM Modal */}
      {isBundleBomModalOpen && bundleBomProduct && (
        <BundleBomModal
          product={bundleBomProduct}
          allProducts={products}
          isOpen={isBundleBomModalOpen}
          onClose={() => {
            setIsBundleBomModalOpen(false);
            setBundleBomProduct(null);
          }}
          onSaved={() => {
            loadAllData();
          }}
          mode={bundleBomMode}
        />
      )}

      {/* 7. Barcode Label Modal */}
      {isBarcodeModalOpen && barcodeProduct && (
        <BarcodeLabelModal
          products={products as any}
          initialSelectedProduct={barcodeProduct as any}
          isOpen={isBarcodeModalOpen}
          onClose={() => {
            setIsBarcodeModalOpen(false);
            setBarcodeProduct(null);
          }}
        />
      )}
    </div>
  );
};
