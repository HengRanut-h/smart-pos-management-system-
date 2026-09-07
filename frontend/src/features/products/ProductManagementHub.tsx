import React, { useState, useEffect } from 'react';
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
  Upload
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

type SubView =
  | 'dashboard'
  | 'catalog'
  | 'types'
  | 'variants'
  | 'categories'
  | 'brands'
  | 'units'
  | 'pricing'
  | 'landed_cost'
  | 'inventory'
  | 'warehouse'
  | 'barcodes'
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
  const { lang, t } = useApp();

  // Navigation State
  const [activeSubView, setActiveSubView] = useState<SubView>('dashboard');

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
    if (activeSubView === 'batches' && batches.length === 0) {
      productEnterpriseApi.getBatches().then(r => setBatches(r.data || [])).catch(console.error);
    } else if (activeSubView === 'serials' && serialNumbers.length === 0) {
      productEnterpriseApi.getSerialNumbers().then(r => setSerialNumbers(r.data || [])).catch(console.error);
    } else if (activeSubView === 'qc' && qcInspections.length === 0) {
      productEnterpriseApi.getQcInspections().then(r => setQcInspections(r.data || [])).catch(console.error);
    } else if (activeSubView === 'reviews' && reviews.length === 0) {
      productEnterpriseApi.getReviews().then(r => setReviews(r.data || [])).catch(console.error);
    } else if (activeSubView === 'audit_logs' && auditLogs.length === 0) {
      productEnterpriseApi.getAuditLogs().then(r => setAuditLogs(r.data || [])).catch(console.error);
    }
  }, [activeSubView]);

  // Filtered Products
  const filteredProducts = products.filter(p => {
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
      (stockFilter === 'LOW_STOCK' && (p.opening_stock || 0) > 0 && (p.opening_stock || 0) <= (p.reorder_level || 5)) ||
      (stockFilter === 'OUT_OF_STOCK' && (p.opening_stock || 0) <= 0);

    return matchesSearch && matchesCategory && matchesType && matchesStock;
  });

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

  // Sub-Navigation Tabs Configuration
  const navItems = [
    { id: 'dashboard', label: '01. Dashboard', icon: LayoutDashboard },
    { id: 'catalog', label: '02. Catalog', icon: Package },
    { id: 'types', label: '03. 10 Product Types', icon: Layers },
    { id: 'variants', label: '04. Variant Matrix', icon: Sparkles },
    { id: 'categories', label: '05. Categories', icon: FolderTree },
    { id: 'brands', label: '06. Brands', icon: Award },
    { id: 'units', label: '07. Unit Conversions', icon: Scale },
    { id: 'pricing', label: '08. Multi-Tier Pricing', icon: DollarSign },
    { id: 'landed_cost', label: '09. Landed Cost', icon: Calculator },
    { id: 'inventory', label: '10. Stock & Reorders', icon: Boxes },
    { id: 'warehouse', label: '11. Warehouse Bins', icon: MapPin },
    { id: 'barcodes', label: '12. Barcode & Auto-SKU', icon: Barcode },
    { id: 'suppliers', label: '13. Suppliers', icon: Truck },
    { id: 'batches', label: '14. Batches & Expiry', icon: Calendar },
    { id: 'serials', label: '15. Serial & IMEI', icon: Hash },
    { id: 'warranties', label: '16. Warranties', icon: ShieldCheck },
    { id: 'bundles', label: '17. Bundles & Kits', icon: PackagePlus },
    { id: 'bom', label: '18. BOM Manufacturing', icon: Wrench },
    { id: 'qc', label: '19. Quality Control', icon: CheckCircle2 },
    { id: 'promotions', label: '20. Promotions & Rules', icon: Tag },
    { id: 'reviews', label: '21. Reviews & Ratings', icon: Star },
    { id: 'returns', label: '22. Returns & Quarantine', icon: RotateCcw },
    { id: 'import_export', label: '23. Import / Export', icon: FileSpreadsheet },
    { id: 'templates', label: '24. Templates & Audits', icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col">
      {/* Top Banner Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-md">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
                  Enterprise Product Hub
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  42 Modules Active
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Master lifecycle: Design → Sourcing → Manufacturing → Inventory → POS Sales → Audits
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={loadAllData}
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg border border-gray-200 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Product</span>
            </button>
          </div>
        </div>

        {/* 24-Tab Scrollable Sub-Navigation */}
        <div className="border-t border-gray-100 bg-gray-50/60 overflow-x-auto scrollbar-thin">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex space-x-1 py-1.5 min-w-max">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeSubView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSubView(item.id as SubView)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* VIEW 1: DASHBOARD */}
        {activeSubView === 'dashboard' && dashboardData && (
          <div className="space-y-6">
            {/* KPI Cards Row 1: Stock Health & Product Counts */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Total Products</span>
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                <div className="mt-2 text-2xl font-black text-gray-900">
                  {dashboardData.overview.total_products}
                </div>
                <div className="text-[11px] text-green-600 font-medium mt-0.5">
                  {dashboardData.overview.active_products} Active in POS
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Out of Stock</span>
                  <XCircle className="w-4 h-4 text-red-600" />
                </div>
                <div className="mt-2 text-2xl font-black text-red-600">
                  {dashboardData.overview.out_of_stock}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">Immediate Restock</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Low Stock Alert</span>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="mt-2 text-2xl font-black text-amber-600">
                  {dashboardData.overview.low_stock}
                </div>
                <div className="text-[11px] text-amber-700 mt-0.5">Below reorder level</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Expired Batches</span>
                  <Calendar className="w-4 h-4 text-rose-600" />
                </div>
                <div className="mt-2 text-2xl font-black text-rose-600">
                  {dashboardData.overview.expired_products}
                </div>
                <div className="text-[11px] text-rose-700 mt-0.5">
                  {dashboardData.overview.expiring_soon} Expiring in 30d
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Featured</span>
                  <Sparkles className="w-4 h-4 text-purple-600" />
                </div>
                <div className="mt-2 text-2xl font-black text-purple-600">
                  {dashboardData.overview.featured_products}
                </div>
                <div className="text-[11px] text-purple-700 mt-0.5">High Priority</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">New Arrivals</span>
                  <Tag className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 text-2xl font-black text-emerald-600">
                  {dashboardData.overview.new_products}
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5">Recently Added</div>
              </div>
            </div>

            {/* Financial Valuation Summary Card */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    Product Financial Valuation & Margins
                  </span>
                  <h3 className="text-2xl font-black mt-1">Live Catalog Asset Intelligence</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-indigo-200 backdrop-blur-md">
                    Average Profit Margin: {dashboardData.financials.average_margin_percent}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
                <div>
                  <span className="text-xs text-gray-400">Total Stock Cost</span>
                  <div className="text-xl md:text-2xl font-bold text-white mt-1">
                    ${dashboardData.financials.total_stock_value.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">Includes landed freight</p>
                </div>

                <div>
                  <span className="text-xs text-gray-400">Potential Sales Value</span>
                  <div className="text-xl md:text-2xl font-bold text-emerald-400 mt-1">
                    ${dashboardData.financials.potential_sales_value.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-emerald-300/80 mt-0.5">At retail pricing</p>
                </div>

                <div>
                  <span className="text-xs text-gray-400">Potential Gross Profit</span>
                  <div className="text-xl md:text-2xl font-bold text-amber-400 mt-1">
                    ${dashboardData.financials.potential_profit.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-amber-300/80 mt-0.5">Revenue - Landed Cost</p>
                </div>

                <div>
                  <span className="text-xs text-gray-400">Inventory Turnover Potential</span>
                  <div className="text-xl md:text-2xl font-bold text-cyan-400 mt-1">
                    3.8x / Year
                  </div>
                  <p className="text-[11px] text-cyan-300/80 mt-0.5">Optimal stocking</p>
                </div>
              </div>
            </div>

            {/* Breakdown Charts / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* By Product Type */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Breakdown by 10 Types</span>
                </h4>
                <div className="space-y-2">
                  {dashboardData.by_type.map(item => (
                    <div key={item.product_type} className="flex justify-between items-center text-xs py-1.5 border-b border-gray-100 last:border-0">
                      <span className="font-semibold text-gray-700">{item.product_type}</span>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-md">
                        {item.count} items
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Category */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center space-x-2">
                  <FolderTree className="w-4 h-4 text-blue-600" />
                  <span>Breakdown by Category</span>
                </h4>
                <div className="space-y-2">
                  {dashboardData.by_category.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-xs py-1.5 border-b border-gray-100 last:border-0">
                      <span className="font-semibold text-gray-700">{item.name}</span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-md">
                        {item.count} items
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions Shortcuts */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Product Lifecycle Shortcuts</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setActiveSubView('catalog')}
                    className="p-3 bg-gray-50 hover:bg-blue-50 rounded-xl text-left border border-gray-200 transition"
                  >
                    <Package className="w-4 h-4 text-blue-600 mb-1" />
                    <div className="font-bold text-gray-800">Product List</div>
                    <div className="text-[10px] text-gray-500">Edit & manage items</div>
                  </button>

                  <button
                    onClick={() => setActiveSubView('variants')}
                    className="p-3 bg-gray-50 hover:bg-purple-50 rounded-xl text-left border border-gray-200 transition"
                  >
                    <Layers className="w-4 h-4 text-purple-600 mb-1" />
                    <div className="font-bold text-gray-800">Variant Matrix</div>
                    <div className="text-[10px] text-gray-500">Sizes, colors, combos</div>
                  </button>

                  <button
                    onClick={() => setActiveSubView('batches')}
                    className="p-3 bg-gray-50 hover:bg-amber-50 rounded-xl text-left border border-gray-200 transition"
                  >
                    <Calendar className="w-4 h-4 text-amber-600 mb-1" />
                    <div className="font-bold text-gray-800">Batch Expiry</div>
                    <div className="text-[10px] text-gray-500">Lot & expiration alert</div>
                  </button>

                  <button
                    onClick={() => setActiveSubView('bom')}
                    className="p-3 bg-gray-50 hover:bg-violet-50 rounded-xl text-left border border-gray-200 transition"
                  >
                    <Wrench className="w-4 h-4 text-violet-600 mb-1" />
                    <div className="font-bold text-gray-800">Manufacturing</div>
                    <div className="text-[10px] text-gray-500">BOM recipes & assembly</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: CATALOG (Full Enterprise Table) */}
        {activeSubView === 'catalog' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-1 items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by Name, SKU, Barcode..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-xl bg-white outline-none"
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
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-xl bg-white outline-none"
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
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-xl bg-white outline-none"
                >
                  <option value="ALL">All Stock Levels</option>
                  <option value="IN_STOCK">In Stock</option>
                  <option value="LOW_STOCK">Low Stock Alert</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>
              </div>

              {selectedProductIds.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-gray-600">
                    {selectedProductIds.length} selected
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected</span>
                  </button>
                </div>
              )}
            </div>

            {/* Catalog Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-100/80 text-gray-700 font-semibold uppercase tracking-wider border-b border-gray-200">
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
                          className="rounded text-blue-600"
                        />
                      </th>
                      <th className="p-3.5">Product</th>
                      <th className="p-3.5">SKU / Barcode</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5 text-right">Cost Price</th>
                      <th className="p-3.5 text-right">Selling Price</th>
                      <th className="p-3.5 text-center">Stock</th>
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
                        return (
                          <tr key={product.id} className="hover:bg-blue-50/20 transition">
                            <td className="p-3.5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedProductIds([...selectedProductIds, product.id]);
                                  } else {
                                    setSelectedProductIds(selectedProductIds.filter(id => id !== product.id));
                                  }
                                }}
                                className="rounded text-blue-600"
                              />
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center space-x-3">
                                {product.image_url ? (
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-9 h-9 rounded-lg object-cover border border-gray-200"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 font-bold border border-gray-200">
                                    {product.name.charAt(0)}
                                  </div>
                                )}
                                <div>
                                  <div className="font-bold text-gray-900">{product.name}</div>
                                  <div className="text-[11px] text-gray-400">
                                    ID: #{product.id} • {product.brand?.name || 'No brand'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5 font-mono text-[11px]">
                              <div className="font-bold text-gray-700">{product.sku}</div>
                              <div className="text-gray-400">{product.barcode}</div>
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                            <td className="p-3.5 text-gray-700">
                              {product.category?.name || 'Uncategorized'}
                            </td>
                            <td className="p-3.5 text-right font-medium">
                              ${(product.cost_price || 0).toFixed(2)}
                            </td>
                            <td className="p-3.5 text-right font-bold text-emerald-600">
                              ${(product.selling_price || 0).toFixed(2)}
                            </td>
                            <td className="p-3.5 text-center font-bold">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] ${
                                  (product.opening_stock || 0) <= 0
                                    ? 'bg-red-100 text-red-700'
                                    : (product.opening_stock || 0) <= (product.reorder_level || 5)
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-green-100 text-green-700'
                                }`}
                              >
                                {product.opening_stock || 0}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              {/* Quick Action Badges */}
                              <div className="flex items-center justify-center space-x-1">
                                {product.product_type === 'VARIABLE' && (
                                  <button
                                    onClick={() => {
                                      setVariantProduct(product);
                                      setIsVariantModalOpen(true);
                                    }}
                                    className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold rounded-lg border border-purple-200"
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
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200"
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
                                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-200"
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
                                    className="px-2 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 text-[10px] font-bold rounded-lg border border-violet-200"
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
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold rounded-lg border border-rose-200"
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
                                    className="px-2 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 text-[10px] font-bold rounded-lg border border-cyan-200"
                                  >
                                    Serial
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  onClick={() => {
                                    setBarcodeProduct(product);
                                    setIsBarcodeModalOpen(true);
                                  }}
                                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg"
                                  title="Print Barcode Label"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingProduct(product);
                                    setIsCreateModalOpen(true);
                                  }}
                                  className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg"
                                  title="Edit Product"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg"
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
          </div>
        )}

        {/* VIEW 3: 10 PRODUCT TYPES */}
        {activeSubView === 'types' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Supported Enterprise Product Types (10)</h3>
              <p className="text-xs text-gray-500">
                Full lifecycle governance configured according to retail, manufacturing, F&B, and digital business operations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { type: 'SIMPLE', title: 'Standard / Simple Product', desc: 'Single SKU item with standard cost, price, and stock tracking.', color: 'border-blue-500' },
                { type: 'VARIABLE', title: 'Variable Product (Matrix)', desc: 'Multi-attribute matrix (Size, Color, Material) with independent SKUs and prices.', color: 'border-purple-500' },
                { type: 'BUNDLE', title: 'Combo Kit / Bundle', desc: 'Package of multiple child items sold as a kit with dynamic bundle discount.', color: 'border-amber-500' },
                { type: 'MANUFACTURED', title: 'Manufactured Item (BOM)', desc: 'Produced in-house using raw materials and recipe formulations with scrap rates.', color: 'border-emerald-500' },
                { type: 'RAW_MATERIAL', title: 'Raw Material / Ingredient', desc: 'Used exclusively in BOM recipes; consumed automatically upon finished item production.', color: 'border-orange-500' },
                { type: 'BATCH_TRACKED', title: 'Batch / Lot Tracked', desc: 'Perishable goods tracked by batch numbers, manufacture dates, and expiry countdowns.', color: 'border-rose-500' },
                { type: 'SERIALIZED', title: 'Serialized Item (IMEI / Serial)', desc: 'High-value electronics where each unit has a unique serial number and warranty.', color: 'border-cyan-500' },
                { type: 'SERVICE', title: 'Service / Labor', desc: 'Non-physical billing items like labor, installation, cleaning, or consulting.', color: 'border-indigo-500' },
                { type: 'DIGITAL', title: 'Digital / Downloadable', desc: 'Software keys, license tokens, and downloadable digital assets.', color: 'border-teal-500' },
                { type: 'COMBO', title: 'Fast Food Meal Combo', desc: 'POS quick combo with customizable sides, drink upgrades, and size modifiers.', color: 'border-yellow-500' },
              ].map(item => {
                const count = products.filter(p => p.product_type === item.type).length;
                return (
                  <div key={item.type} className={`bg-white p-5 rounded-2xl border-l-4 ${item.color} border-gray-200 shadow-sm flex flex-col justify-between`}>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-gray-100 text-gray-800">
                          {item.type}
                        </span>
                        <span className="text-xs font-bold text-gray-500">{count} products</span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                      <button
                        onClick={() => {
                          setSelectedType(item.type);
                          setActiveSubView('catalog');
                        }}
                        className="text-xs text-blue-600 font-bold hover:underline"
                      >
                        View in Catalog →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 4: VARIANTS */}
        {activeSubView === 'variants' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Variant Matrix Explorer</h3>
                <p className="text-xs text-gray-500">Products with active variant combinations</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products
                .filter(p => p.product_type === 'VARIABLE')
                .map(product => (
                  <div key={product.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-900">{product.name}</h4>
                        <p className="text-xs text-gray-500 font-mono">SKU: {product.sku}</p>
                      </div>
                      <button
                        onClick={() => {
                          setVariantProduct(product);
                          setIsVariantModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Manage Matrix</span>
                      </button>
                    </div>
                    <div className="mt-3 text-xs text-gray-600">
                      Variants defined: <span className="font-bold text-purple-700">{product.variants?.length || 'Configurable'}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* VIEW 5: CATEGORIES */}
        {activeSubView === 'categories' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Product Categories Hierarchy</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.map(cat => {
                const count = products.filter(p => p.category_id === cat.id).length;
                return (
                  <div key={cat.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center">
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{cat.name}</div>
                      <div className="text-xs text-gray-400">ID: #{cat.id}</div>
                    </div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold rounded-full text-xs">
                      {count} items
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 6: BRANDS */}
        {activeSubView === 'brands' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Brand Portfolio</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {brands.map(b => (
                <div key={b.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center">
                  <div className="font-bold text-gray-900 text-sm">{b.name}</div>
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 font-bold rounded-full text-xs">
                    {products.filter(p => p.brand_id === b.id).length} items
                  </span>
                </div>
              ))}
              {brands.length === 0 && (
                <div className="col-span-3 text-center py-8 text-gray-400 italic">
                  No brands defined yet. Set brands during product creation.
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 7: UNITS & CONVERSIONS */}
        {activeSubView === 'units' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Units of Measurement & Multi-Unit Conversions</h3>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {units.map(u => (
                  <div key={u.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-800">{u.name}</span>
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-700 font-mono rounded">Unit #{u.id}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl">
                <h4 className="text-xs font-bold text-blue-900 mb-1">Standard Conversion Matrix:</h4>
                <p className="text-xs text-blue-700">
                  1 Box = 24 Cans • 1 Carton = 12 Bottles • 1 kg = 1,000 g • 1 Meter = 100 cm
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 8: MULTI-TIER PRICING */}
        {activeSubView === 'pricing' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Multi-Tier Pricing Matrix & Volume Breaks</h3>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-700 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Product Name</th>
                    <th className="p-3 text-right">Base Cost</th>
                    <th className="p-3 text-right">Retail</th>
                    <th className="p-3 text-right">Wholesale</th>
                    <th className="p-3 text-right">VIP Tier</th>
                    <th className="p-3 text-right">Member Tier</th>
                    <th className="p-3 text-right">Online</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">{p.name}</td>
                      <td className="p-3 text-right font-mono">${(p.cost_price || 0).toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">${(p.selling_price || 0).toFixed(2)}</td>
                      <td className="p-3 text-right font-mono">${(p.wholesale_price || 0).toFixed(2)}</td>
                      <td className="p-3 text-right font-mono">${(p.vip_price || 0).toFixed(2)}</td>
                      <td className="p-3 text-right font-mono">${(p.member_price || 0).toFixed(2)}</td>
                      <td className="p-3 text-right font-mono">${(p.online_price || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 9: LANDED COST */}
        {activeSubView === 'landed_cost' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Landed Cost & Tariff Studio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map(product => (
                <div key={product.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-900">{product.name}</h4>
                    <p className="text-xs text-gray-500">
                      Base Cost: ${(product.cost_price || 0).toFixed(2)} • True Landed: ${(product.landed_cost || product.cost_price || 0).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setLandedCostProduct(product);
                      setIsLandedCostModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Calculate</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 10: INVENTORY & STOCK */}
        {activeSubView === 'inventory' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Inventory Safety & Reorder Alerts</h3>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-700 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3 text-center">Opening Stock</th>
                    <th className="p-3 text-center">Safety Buffer</th>
                    <th className="p-3 text-center">Reorder Alert</th>
                    <th className="p-3 text-center">Default Replenishment</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map(p => {
                    const isLow = (p.opening_stock || 0) <= (p.reorder_level || 5);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-900">{p.name}</td>
                        <td className="p-3 text-center font-bold">{p.opening_stock || 0}</td>
                        <td className="p-3 text-center">{p.safety_stock || 5}</td>
                        <td className="p-3 text-center font-mono">{p.reorder_level || 10}</td>
                        <td className="p-3 text-center">{p.reorder_quantity || 20}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isLow ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {isLow ? 'Restock Soon' : 'Optimal'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 11: WAREHOUSE & BINS */}
        {activeSubView === 'warehouse' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Warehouse & Bin Locations (Aisle / Rack / Shelf / Bin)</h3>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {products.map(p => (
                  <div key={p.id} className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                    <div className="font-bold text-gray-900">{p.name}</div>
                    <div className="mt-2 text-indigo-700 font-mono">
                      Location: Aisle 02 • Rack B • Shelf 04 • Bin 12
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 12: BARCODES & SKU */}
        {activeSubView === 'barcodes' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Barcode Studio & Printing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center">
                  <div>
                    <div className="font-bold text-gray-900 text-xs">{p.name}</div>
                    <div className="font-mono text-gray-500 text-[11px] mt-1">{p.barcode}</div>
                  </div>
                  <button
                    onClick={() => {
                      setBarcodeProduct(p);
                      setIsBarcodeModalOpen(true);
                    }}
                    className="p-2 bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-lg transition"
                    title="Print Label"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 14: BATCHES & EXPIRY */}
        {activeSubView === 'batches' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Batches & Expiry Countdown Alerts</h3>
                <p className="text-xs text-gray-500">Track manufacture batches, lots, and shelf-life expiration</p>
              </div>
              <button
                onClick={() => {
                  setBatchProduct(products[0] || null);
                  setIsBatchModalOpen(true);
                }}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>New Batch</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-700 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Batch Number</th>
                    <th className="p-3">Lot Number</th>
                    <th className="p-3">Manufacture Date</th>
                    <th className="p-3">Expiry Date</th>
                    <th className="p-3 text-center">Remaining Qty</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {batches.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono font-bold text-gray-900">{b.batch_number}</td>
                      <td className="p-3 font-mono text-gray-600">{b.lot_number}</td>
                      <td className="p-3">{b.manufactured_date}</td>
                      <td className="p-3 font-semibold text-rose-600">{b.expiry_date}</td>
                      <td className="p-3 text-center font-bold">{b.remaining_quantity}</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {batches.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-400 italic">
                        No batches registered yet. Click "New Batch" to register an expiry batch.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 15: SERIALS & IMEI */}
        {activeSubView === 'serials' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Serial Numbers & IMEI Registry</h3>
                <p className="text-xs text-gray-500">Track high-value hardware items and device warranties</p>
              </div>
              <button
                onClick={() => {
                  setSerialProduct(products[0] || null);
                  setIsSerialModalOpen(true);
                }}
                className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Register Serial</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-700 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Serial Number</th>
                    <th className="p-3">IMEI</th>
                    <th className="p-3">MAC Address</th>
                    <th className="p-3 text-center">Warranty (Mos)</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {serialNumbers.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono font-bold text-gray-900">{s.serial_number}</td>
                      <td className="p-3 font-mono text-gray-600">{s.imei || 'N/A'}</td>
                      <td className="p-3 font-mono text-gray-500">{s.mac_address || 'N/A'}</td>
                      <td className="p-3 text-center font-bold">{s.warranty_months}m</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {serialNumbers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-gray-400 italic">
                        No serial numbers recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 17: BUNDLES */}
        {activeSubView === 'bundles' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Combo Kits & Bundled Items</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products
                .filter(p => p.product_type === 'BUNDLE')
                .map(p => (
                  <div key={p.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-gray-900">{p.name}</h4>
                      <p className="text-xs text-gray-500">Combo Price: ${(p.selling_price || 0).toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => {
                        setBundleBomProduct(p);
                        setBundleBomMode('BUNDLE');
                        setIsBundleBomModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm"
                    >
                      Configure Bundle
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* VIEW 18: BOM MANUFACTURING */}
        {activeSubView === 'bom' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Bill of Materials (BOM) & Manufacturing Recipes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products
                .filter(p => p.product_type === 'MANUFACTURED')
                .map(p => (
                  <div key={p.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-gray-900">{p.name}</h4>
                      <p className="text-xs text-gray-500">Finished Good • Recipe Active</p>
                    </div>
                    <button
                      onClick={() => {
                        setBundleBomProduct(p);
                        setBundleBomMode('BOM');
                        setIsBundleBomModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg shadow-sm"
                    >
                      Edit Recipe / BOM
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* VIEW 19: QC INSPECTIONS */}
        {activeSubView === 'qc' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Quality Control (QC) & Inspection Logs</h3>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-700 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Inspection Date</th>
                    <th className="p-3">Inspector</th>
                    <th className="p-3 text-center">Sample Size</th>
                    <th className="p-3 text-center">Passed</th>
                    <th className="p-3 text-center">Failed</th>
                    <th className="p-3 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {qcInspections.map(q => (
                    <tr key={q.id} className="hover:bg-gray-50">
                      <td className="p-3 font-semibold">{q.inspection_date}</td>
                      <td className="p-3">{q.inspector_name}</td>
                      <td className="p-3 text-center">{q.sample_size}</td>
                      <td className="p-3 text-center text-emerald-600 font-bold">{q.passed_quantity}</td>
                      <td className="p-3 text-center text-red-600 font-bold">{q.failed_quantity}</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                          {q.inspection_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {qcInspections.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-400 italic">
                        No QC inspections recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 21: REVIEWS & RATINGS */}
        {activeSubView === 'reviews' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Customer Reviews & Rating Moderation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map(r => (
                <div key={r.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900 text-xs">{r.customer_name}</span>
                    <div className="flex text-amber-400">
                      {'★'.repeat(r.rating)}
                      {'☆'.repeat(5 - r.rating)}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 italic">"{r.review_text}"</p>
                  <div className="text-[10px] text-gray-400">{r.created_at}</div>
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-400 italic">
                  No customer reviews submitted yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 23: IMPORT / EXPORT */}
        {activeSubView === 'import_export' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900">Bulk Product Import & Export Studio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <h4 className="font-bold text-gray-800 text-sm flex items-center space-x-2">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Import Products (CSV / Excel)</span>
                </h4>
                <p className="text-xs text-gray-500">
                  Upload bulk catalog files with columns: SKU, Barcode, Name, Cost, Selling Price, Category ID, Stock.
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 cursor-pointer transition">
                  <FileSpreadsheet className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <span className="text-xs font-semibold text-gray-700">Drag & drop CSV file or click to browse</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <h4 className="font-bold text-gray-800 text-sm flex items-center space-x-2">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Export Product Catalog</span>
                </h4>
                <p className="text-xs text-gray-500">
                  Export all active products, inventory levels, barcodes, and tier prices into formatted Excel/CSV.
                </p>
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => {
                      alert('Exporting catalog CSV...');
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Full Catalog (.CSV)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 24: AUDIT LOGS & TEMPLATES */}
        {(activeSubView === 'templates' || activeSubView === 'audit_logs') && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Product Lifecycle Audit Logs & Price Change Trail</h3>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-700 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Product ID</th>
                    <th className="p-3">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono">{log.created_at}</td>
                      <td className="p-3 font-bold text-indigo-700">{log.action}</td>
                      <td className="p-3 font-mono">#{log.product_id}</td>
                      <td className="p-3 font-mono text-gray-500">{log.ip_address || '127.0.0.1'}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-gray-400 italic">
                        Audit events logged during product create/update/price adjustments.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
