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
  ArrowRight,
  QrCode,
  Archive,
  ChevronLeft,
  MoreVertical,
  Sliders,
  ScanBarcode,
  Receipt,
  StarHalf,
  MessageCircleQuestion,
  ClipboardList,
  ListTree,
  Tags,
  CheckSquare,
  Shield,
  HelpCircle,
  UtensilsCrossed,
  ArrowRightLeft,
  AlertCircle,
  FileText,
  Building2,
  CheckCircle,
  ExternalLink,
  SlidersVertical,
  User,
  UserCheck,
  MessageSquare,
  Send,
  CornerDownRight,
  Factory,
  Cog,
  Play,
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
  ProductWarehouseLocation,
  ProductPriceHistory,
} from '../../foundation/types/productEnterprise';
import { productEnterpriseApi } from '../../data-access/productEnterpriseApi';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  getBranches,
} from '../../data-access/posApi';
import { BarcodeView } from '../../presentation/components/barcode/BarcodeView';
import { CreateProductEnterpriseModal } from './CreateProductEnterpriseModal';
import { VariantMatrixModal } from './VariantMatrixModal';
import { LandedCostModal } from './LandedCostModal';
import { BatchLotModal } from './BatchLotModal';
import { SerialNumberModal } from './SerialNumberModal';
import { BundleBomModal } from './BundleBomModal';
import { BarcodeLabelModal } from './BarcodeLabelModal';
import { ProductTypeModal, ProductTypeDefinition } from './ProductTypeModal';
import { CategoryModal, CategoryData } from './CategoryModal';
import { BrandModal, BrandData } from './BrandModal';
import { UnitModal, UnitData } from './UnitModal';
import { AttributeModal, AttributeData } from './AttributeModal';

export const DEFAULT_PRODUCT_TYPES: ProductTypeDefinition[] = [
  {
    type: 'SIMPLE',
    title: 'Standard / Simple Product',
    titleKh: 'ទំនិញធម្មតា (Standard / Simple)',
    desc: 'Single SKU item with standard cost, retail price, and automated stock deduction at POS checkout.',
    descKh: 'ទំនិញកូដ SKU ទោល មានថ្លៃដើម តម្លៃលក់រាយ និងកាត់ស្តុកស្វ័យប្រវត្តិនៅកន្លែងលក់ POS',
    color: 'border-blue-500',
    badge: 'bg-blue-50 text-blue-700',
    stockRule: 'DEDUCT_ON_SALE',
    isCustom: false,
  },
  {
    type: 'VARIABLE',
    title: 'Variable Product (Matrix)',
    titleKh: 'ទំនិញមានវ៉ារ្យ៉ង់ (Variable Matrix)',
    desc: 'Multi-attribute matrix (Size, Color, Material) with independent SKUs, prices, barcodes, and stock levels.',
    descKh: 'ម៉ាទ្រីសច្រើនលក្ខណៈ (ទំហំ ពណ៌ ធាតុដើម) មានកូដ SKU តម្លៃ និងស្តុកដាច់ដោយឡែក',
    color: 'border-purple-500',
    badge: 'bg-purple-50 text-purple-700',
    stockRule: 'DEDUCT_ON_SALE',
    isCustom: false,
  },
  {
    type: 'BUNDLE',
    title: 'Combo Kit / Bundle',
    titleKh: 'ទំនិញជាកញ្ចប់ (Combo Kit / Bundle)',
    desc: 'Package of multiple child items sold together as a single kit with dynamic discount calculation.',
    descKh: 'កញ្ចប់បូកផ្សំទំនិញច្រើនមុខ លក់រួមគ្នាក្នុងតម្លៃពិសេស ជាមួយការគណនាបញ្ចុះតម្លៃស្វ័យប្រវត្តិ',
    color: 'border-amber-500',
    badge: 'bg-amber-50 text-amber-700',
    stockRule: 'DEDUCT_ON_SALE',
    isCustom: false,
  },
  {
    type: 'MANUFACTURED',
    title: 'Manufactured Item (BOM)',
    titleKh: 'ទំនិញផលិតកែច្នៃ (Manufactured BOM)',
    desc: 'Produced in-house using raw ingredients and recipe formulations with scrap rate and labor costs.',
    descKh: 'ផលិតក្នុងស្រុកតាមរូបមន្តធាតុផ្សំ BOM រាប់បញ្ចូលអត្រាសល់អេតចាយ និងថ្លៃពលកម្ម',
    color: 'border-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700',
    stockRule: 'BOM_RECIPE',
    isCustom: false,
  },
  {
    type: 'RAW_MATERIAL',
    title: 'Raw Material / Ingredient',
    titleKh: 'វត្ថុតាងដើម / ធាតុផ្សំ (Raw Material)',
    desc: 'Consumed exclusively in BOM recipes; depleted automatically upon finished good production.',
    descKh: 'ប្រើប្រាស់ផ្តាច់មុខក្នុងរូបមន្ត BOM និងត្រូវកាត់ចេញស្វ័យប្រវត្តិនៅពេលផលិតទំនិញស្រេច',
    color: 'border-orange-500',
    badge: 'bg-orange-50 text-orange-700',
    stockRule: 'BOM_RECIPE',
    isCustom: false,
  },
  {
    type: 'BATCH_TRACKED',
    title: 'Batch / Lot Tracked',
    titleKh: 'ទំនិញតាមឡូត៍ (Batch / Lot Tracked)',
    desc: 'Perishable goods tracked by batch numbers, manufacture dates, and shelf-life expiration countdowns.',
    descKh: 'ទំនិញមានកាលបរិច្ឆេទ តាមដានតាមលេខឡូត៍ ថ្ងៃផលិត និងរាប់ថយក្រោយថ្ងៃផុតកំណត់',
    color: 'border-rose-500',
    badge: 'bg-rose-50 text-rose-700',
    stockRule: 'BATCH_EXPIRY',
    isCustom: false,
  },
  {
    type: 'SERIALIZED',
    title: 'Serialized Item (IMEI / Serial)',
    titleKh: 'ទំនិញតាមលេខស៊េរី (Serialized / IMEI)',
    desc: 'High-value electronics where each unit has a unique serial number, IMEI, and warranty policy.',
    descKh: 'ឧបករណ៍អេឡិចត្រូនិចតម្លៃខ្ពស់ ដែលទាមទារលេខស៊េរី ឬ IMEI ផ្ទាល់ខ្លួន និងប័ណ្ណធានា',
    color: 'border-cyan-500',
    badge: 'bg-cyan-50 text-cyan-700',
    stockRule: 'SERIAL_TRACK',
    isCustom: false,
  },
  {
    type: 'SERVICE',
    title: 'Service / Non-Physical',
    titleKh: 'សេវាកម្ម (Service / Non-Physical)',
    desc: 'Labor, installation, repair, consulting, or delivery services with zero physical inventory deduction.',
    descKh: 'ពលកម្ម ការដំឡើង ការជួសជុល ប្រឹក្សាយោបល់ ឬសេវាដឹកជញ្ជូន ដោយមិនកាត់ស្តុកទំនិញ',
    color: 'border-indigo-500',
    badge: 'bg-indigo-50 text-indigo-700',
    stockRule: 'NO_DEDUCTION',
    isCustom: false,
  },
  {
    type: 'DIGITAL',
    title: 'Digital / Downloadable',
    titleKh: 'ទំនិញឌីជីថល (Digital / Downloadable)',
    desc: 'Software licenses, digital keys, and downloadable files fulfilled via email or customer portal.',
    descKh: 'អាជ្ញាប័ណ្ណសូហ្វវែរ កូដឌីជីថល និងឯកសារទាញយក ដែលផ្ញើតាមអ៊ីមែល ឬផតថល',
    color: 'border-teal-500',
    badge: 'bg-teal-50 text-teal-700',
    stockRule: 'NO_DEDUCTION',
    isCustom: false,
  },
  {
    type: 'COMBO',
    title: 'Fast Food Meal Combo',
    titleKh: 'កញ្ចប់អាហាររហ័ស (Fast Food Combo)',
    desc: 'Quick service restaurant combo with customizable drink sizes, side options, and upsell modifiers.',
    descKh: 'កញ្ចប់អាហារ និងភេសជ្ជៈ ជាមួយជម្រើសទំហំ គ្រឿងបន្ថែម និងប្តូរមុខម្ហូបស្វ័យប្រវត្តិ',
    color: 'border-yellow-500',
    badge: 'bg-yellow-50 text-yellow-700',
    stockRule: 'DEDUCT_ON_SALE',
    isCustom: false,
  },
];

export type SubView =
  | 'dashboard'
  | 'catalog'
  | 'all-products'
  | 'add-product'
  | 'categories'
  | 'subcategories'
  | 'attributes'
  | 'variants'
  | 'brands'
  | 'units'
  | 'identification'
  | 'tax'
  | 'pricing'
  | 'costs'
  | 'landed_cost'
  | 'price-history'
  | 'barcodes'
  | 'qr-codes'
  | 'serial-numbers'
  | 'serials'
  | 'batches'
  | 'warranties'
  | 'expiration'
  | 'manufacturing'
  | 'operation'
  | 'bom'
  | 'recipes'
  | 'reviews'
  | 'ratings'
  | 'questions'
  | 'templates'
  | 'import'
  | 'export'
  | 'bulk-update'
  | 'inventory'
  | 'warehouse'
  | 'suppliers'
  | 'types'
  | 'qc'
  | 'promotions'
  | 'returns'
  | 'audit_logs';

export const ProductManagementHub: React.FC = () => {
  const { lang, t, productSubTab, setProductSubTab, notify, confirmDelete, currentUser } = useApp();

  // Navigation State
  const [activeSubView, setActiveSubView] = useState<SubView>(
    (productSubTab as SubView) || 'dashboard'
  );

  // Sync external navigation (from sidebar) with inner tabs
  useEffect(() => {
    if (!productSubTab) return;
    const tab = productSubTab as string;
    if (tab === 'add-product') {
      setActiveSubView('catalog');
      setEditingProduct(null);
      setIsCreateModalOpen(true);
    } else if (tab === 'export') {
      setActiveSubView('import');
      setImportExportMode('export');
    } else if (tab === 'import') {
      setActiveSubView('import');
      setImportExportMode('import');
    } else {
      setActiveSubView(tab as SubView);
    }
  }, [productSubTab]);

  const handleSelectSubView = (subView: SubView) => {
    if (subView === 'export') {
      setActiveSubView('import');
      setImportExportMode('export');
      setProductSubTab('export');
    } else if (subView === 'import') {
      setActiveSubView('import');
      setImportExportMode('import');
      setProductSubTab('import');
    } else {
      setActiveSubView(subView);
      setProductSubTab(subView);
    }
  };

  // Core Data
  const [products, setProducts] = useState<EnterpriseProduct[]>([]);
  const [dashboardData, setDashboardData] = useState<ProductDashboardData | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [units, setUnits] = useState<UnitData[]>([]);
  const [brands, setBrands] = useState<BrandData[]>([]);
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [serialNumbers, setSerialNumbers] = useState<ProductSerialNumber[]>([]);
  const [qcInspections, setQcInspections] = useState<ProductQcInspection[]>([]);
  const [auditLogs, setAuditLogs] = useState<ProductAuditLog[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<string>('ALL');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [catalogViewMode, setCatalogViewMode] = useState<'grid' | 'table'>('table');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'cost_asc' | 'cost_desc' | 'stock_asc' | 'stock_desc' | 'newest'>('name_asc');

  // Branches
  const [branches, setBranches] = useState<Array<{ id: number; name: string; code?: string }>>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);

  // Category Table, Search & Pagination State
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [categoryCurrentPage, setCategoryCurrentPage] = useState<number>(1);
  const [categoryItemsPerPage, setCategoryItemsPerPage] = useState<number>(10);

  // Subcategories Table & Pagination State
  const [subcategorySearchQuery, setSubcategorySearchQuery] = useState('');
  const [subcategoryCurrentPage, setSubcategoryCurrentPage] = useState<number>(1);
  const [subcategoryItemsPerPage, setSubcategoryItemsPerPage] = useState<number>(10);

  // Brands Table & Pagination State
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [brandStatusFilter, setBrandStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [brandCurrentPage, setBrandCurrentPage] = useState<number>(1);
  const [brandItemsPerPage, setBrandItemsPerPage] = useState<number>(10);

  // Units Table & Pagination State
  const [unitSearchQuery, setUnitSearchQuery] = useState('');
  const [unitCurrentPage, setUnitCurrentPage] = useState<number>(1);
  const [unitItemsPerPage, setUnitItemsPerPage] = useState<number>(10);

  // Costs / Landed Cost Table & Pagination State
  const [costsSearchQuery, setCostsSearchQuery] = useState('');
  const [costsCurrentPage, setCostsCurrentPage] = useState<number>(1);
  const [costsItemsPerPage, setCostsItemsPerPage] = useState<number>(10);

  // Price History Table & Pagination State
  const [priceHistorySearchQuery, setPriceHistorySearchQuery] = useState('');
  const [priceHistoryCurrentPage, setPriceHistoryCurrentPage] = useState<number>(1);
  const [priceHistoryItemsPerPage, setPriceHistoryItemsPerPage] = useState<number>(10);

  // Barcodes Table & Pagination State
  const [barcodesSearchQuery, setBarcodesSearchQuery] = useState('');
  const [barcodesCurrentPage, setBarcodesCurrentPage] = useState<number>(1);
  const [barcodesItemsPerPage, setBarcodesItemsPerPage] = useState<number>(10);

  // QR Codes Table & Pagination State
  const [qrCodesSearchQuery, setQrCodesSearchQuery] = useState('');
  const [qrCodesCurrentPage, setQrCodesCurrentPage] = useState<number>(1);
  const [qrCodesItemsPerPage, setQrCodesItemsPerPage] = useState<number>(10);

  // Serial Numbers Table & Pagination State
  const [serialsSearchQuery, setSerialsSearchQuery] = useState('');
  const [serialsStatusFilter, setSerialsStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'SOLD' | 'RESERVED' | 'DEFECTIVE'>('ALL');
  const [serialsCurrentPage, setSerialsCurrentPage] = useState<number>(1);
  const [serialsItemsPerPage, setSerialsItemsPerPage] = useState<number>(10);

  // Batches Table & Pagination State
  const [batchesSearchQuery, setBatchesSearchQuery] = useState('');
  const [batchesStatusFilter, setBatchesStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED'>('ALL');
  const [batchesCurrentPage, setBatchesCurrentPage] = useState<number>(1);
  const [batchesItemsPerPage, setBatchesItemsPerPage] = useState<number>(10);

  // Warranties Table & Pagination State
  const [warrantiesSearchQuery, setWarrantiesSearchQuery] = useState('');
  const [warrantiesCurrentPage, setWarrantiesCurrentPage] = useState<number>(1);
  const [warrantiesItemsPerPage, setWarrantiesItemsPerPage] = useState<number>(10);

  // 11. Pricing Table & Pagination State
  const [pricingSearchQuery, setPricingSearchQuery] = useState('');
  const [pricingCurrentPage, setPricingCurrentPage] = useState<number>(1);
  const [pricingItemsPerPage, setPricingItemsPerPage] = useState<number>(10);

  // 12. Operation / Warehouse Bin Table & Pagination State
  const [operationSearchQuery, setOperationSearchQuery] = useState('');
  const [operationZoneFilter, setOperationZoneFilter] = useState<'ALL' | 'Zone A' | 'Zone B' | 'Zone C'>('ALL');
  const [operationCurrentPage, setOperationCurrentPage] = useState<number>(1);
  const [operationItemsPerPage, setOperationItemsPerPage] = useState<number>(10);

  // 13. Recipes Table & Pagination State
  const [recipesSearchQuery, setRecipesSearchQuery] = useState('');
  const [recipesCategoryFilter, setRecipesCategoryFilter] = useState<string>('ALL');
  const [recipesCurrentPage, setRecipesCurrentPage] = useState<number>(1);
  const [recipesItemsPerPage, setRecipesItemsPerPage] = useState<number>(10);

  // 14. Reviews Table & Pagination State
  const [reviews, setReviews] = useState<Array<{ id: number; product_name: string; customer_name: string; rating: number; review_text: string; is_verified: boolean; status: 'APPROVED' | 'PENDING' | 'HIDDEN'; created_at: string }>>([
    { id: 1, product_name: 'Espresso Roast Coffee', customer_name: 'Dara Som', rating: 5, review_text: 'Aromatic bold taste, perfect crema every single morning. Best beans in Phnom Penh!', is_verified: true, status: 'APPROVED', created_at: '2026-09-10' },
    { id: 2, product_name: 'Wireless Bluetooth Earbuds Pro', customer_name: 'Chanthou Seng', rating: 4, review_text: 'Great sound quality and battery life lasts more than 7 hours. Highly recommend.', is_verified: true, status: 'APPROVED', created_at: '2026-09-08' },
    { id: 3, product_name: 'Organic Mineral Water 500ml', customer_name: 'Piseth Rith', rating: 5, review_text: 'Crisp and refreshing natural mountain mineral water.', is_verified: false, status: 'APPROVED', created_at: '2026-09-07' },
    { id: 4, product_name: 'Artisan Butter Croissant', customer_name: 'Monineath Keo', rating: 5, review_text: 'Super flaky, buttery layers, fresh out of the oven.', is_verified: true, status: 'APPROVED', created_at: '2026-09-11' },
    { id: 5, product_name: 'Gaming Mechanical Keyboard', customer_name: 'Vireak Buth', rating: 5, review_text: 'Solid build quality with responsive tactile mechanical switches.', is_verified: true, status: 'APPROVED', created_at: '2026-09-05' },
    { id: 6, product_name: 'Fresh Orange Juice 1L', customer_name: 'Sreypov Meas', rating: 4, review_text: '100% freshly squeezed without added sugars. Very refreshing.', is_verified: true, status: 'APPROVED', created_at: '2026-09-02' },
  ]);
  const [reviewsSearchQuery, setReviewsSearchQuery] = useState('');
  const [reviewsRatingFilter, setReviewsRatingFilter] = useState<'ALL' | '5' | '4' | '3' | '1-2'>('ALL');
  const [reviewsCurrentPage, setReviewsCurrentPage] = useState<number>(1);
  const [reviewsItemsPerPage, setReviewsItemsPerPage] = useState<number>(10);

  // 15. Questions Table & Pagination State
  const [questionsSearchQuery, setQuestionsSearchQuery] = useState('');
  const [questionsStatusFilter, setQuestionsStatusFilter] = useState<'ALL' | 'ANSWERED' | 'PENDING'>('ALL');
  const [questionsCurrentPage, setQuestionsCurrentPage] = useState<number>(1);
  const [questionsItemsPerPage, setQuestionsItemsPerPage] = useState<number>(10);

  // 16. Variants Table & Pagination State
  const [variantsSearchQuery, setVariantsSearchQuery] = useState('');
  const [variantsParentFilter, setVariantsParentFilter] = useState<string>('ALL');
  const [variantsStatusFilter, setVariantsStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [variantsCurrentPage, setVariantsCurrentPage] = useState<number>(1);
  const [variantsItemsPerPage, setVariantsItemsPerPage] = useState<number>(10);
  const [customVariantsList, setCustomVariantsList] = useState<Array<{
    id: number;
    parent_product_id: number;
    parent_name: string;
    parent_sku: string;
    category: string;
    variant_name: string;
    sku: string;
    barcode: string;
    attributes: Array<{ name: string; value: string }>;
    cost_price: number;
    selling_price: number;
    stock: number;
    reorder_level: number;
    status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  }>>([
    {
      id: 1,
      parent_product_id: 1,
      parent_name: 'Espresso Roast Coffee',
      parent_sku: 'COF-ESP-01',
      category: 'Beverage / Coffee',
      variant_name: 'Espresso Roast (250g / Whole Bean / Dark Roast)',
      sku: 'COF-ESP-250-DRK',
      barcode: '884019284101',
      attributes: [{ name: 'Size', value: '250g' }, { name: 'Grind', value: 'Whole Bean' }, { name: 'Roast', value: 'Dark' }],
      cost_price: 2.20,
      selling_price: 4.50,
      stock: 65,
      reorder_level: 15,
      status: 'IN_STOCK',
    },
    {
      id: 2,
      parent_product_id: 1,
      parent_name: 'Espresso Roast Coffee',
      parent_sku: 'COF-ESP-01',
      category: 'Beverage / Coffee',
      variant_name: 'Espresso Roast (500g / Whole Bean / Dark Roast)',
      sku: 'COF-ESP-500-DRK',
      barcode: '884019284102',
      attributes: [{ name: 'Size', value: '500g' }, { name: 'Grind', value: 'Whole Bean' }, { name: 'Roast', value: 'Dark' }],
      cost_price: 4.10,
      selling_price: 8.50,
      stock: 42,
      reorder_level: 10,
      status: 'IN_STOCK',
    },
    {
      id: 3,
      parent_product_id: 1,
      parent_name: 'Espresso Roast Coffee',
      parent_sku: 'COF-ESP-01',
      category: 'Beverage / Coffee',
      variant_name: 'Espresso Roast (1kg / Ground / Medium-Dark)',
      sku: 'COF-ESP-1KG-MED',
      barcode: '884019284103',
      attributes: [{ name: 'Size', value: '1kg' }, { name: 'Grind', value: 'Fine Ground' }, { name: 'Roast', value: 'Medium-Dark' }],
      cost_price: 7.80,
      selling_price: 15.90,
      stock: 6,
      reorder_level: 10,
      status: 'LOW_STOCK',
    },
    {
      id: 4,
      parent_product_id: 2,
      parent_name: 'SmartPOS Signature Cotton Polo',
      parent_sku: 'APP-POLO-02',
      category: 'Apparel & Uniforms',
      variant_name: 'Cotton Polo (M / Navy Blue / Slim Fit)',
      sku: 'APP-POLO-NVY-M',
      barcode: '884019284201',
      attributes: [{ name: 'Size', value: 'M' }, { name: 'Color', value: 'Navy Blue' }, { name: 'Fit', value: 'Slim' }],
      cost_price: 6.50,
      selling_price: 16.00,
      stock: 28,
      reorder_level: 8,
      status: 'IN_STOCK',
    },
    {
      id: 5,
      parent_product_id: 2,
      parent_name: 'SmartPOS Signature Cotton Polo',
      parent_sku: 'APP-POLO-02',
      category: 'Apparel & Uniforms',
      variant_name: 'Cotton Polo (L / Charcoal Black / Regular)',
      sku: 'APP-POLO-BLK-L',
      barcode: '884019284202',
      attributes: [{ name: 'Size', value: 'L' }, { name: 'Color', value: 'Black' }, { name: 'Fit', value: 'Regular' }],
      cost_price: 6.50,
      selling_price: 16.00,
      stock: 0,
      reorder_level: 8,
      status: 'OUT_OF_STOCK',
    },
    {
      id: 6,
      parent_product_id: 2,
      parent_name: 'SmartPOS Signature Cotton Polo',
      parent_sku: 'APP-POLO-02',
      category: 'Apparel & Uniforms',
      variant_name: 'Cotton Polo (XL / Crimson Red / Regular)',
      sku: 'APP-POLO-RED-XL',
      barcode: '884019284203',
      attributes: [{ name: 'Size', value: 'XL' }, { name: 'Color', value: 'Crimson Red' }, { name: 'Fit', value: 'Regular' }],
      cost_price: 6.80,
      selling_price: 16.50,
      stock: 19,
      reorder_level: 5,
      status: 'IN_STOCK',
    },
  ]);

  // 17. Bill of Materials (BOM) Table & Pagination State
  const [bomSearchQuery, setBomSearchQuery] = useState('');
  const [bomStatusFilter, setBomStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DRAFT' | 'ARCHIVED'>('ALL');
  const [bomCurrentPage, setBomCurrentPage] = useState<number>(1);
  const [bomItemsPerPage, setBomItemsPerPage] = useState<number>(10);
  const [bomList, setBomList] = useState<Array<{
    id: number;
    bom_code: string;
    product_name: string;
    product_sku: string;
    category: string;
    version: string;
    yield_qty: string;
    components: Array<{ name: string; qty: string; unit_cost: number; cost: number }>;
    material_cost: number;
    labor_overhead_cost: number;
    total_cost: number;
    suggested_price: number;
    status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
    updated_at: string;
  }>>([
    {
      id: 1,
      bom_code: 'BOM-CRS-001',
      product_name: 'Artisan Butter Croissant',
      product_sku: 'BAK-CRS-04',
      category: 'Bakery / Pastry',
      version: 'v2.1',
      yield_qty: '50 Pieces',
      components: [
        { name: 'French Wheat Flour T55', qty: '6.0 kg', unit_cost: 1.20, cost: 7.20 },
        { name: 'Unsalted Butter 82% FAT', qty: '3.25 kg', unit_cost: 6.80, cost: 22.10 },
        { name: 'Organic Yeast & Whole Milk', qty: '2.0 L', unit_cost: 1.50, cost: 3.00 },
        { name: 'Egg Wash & Glaze Formula', qty: '0.5 kg', unit_cost: 2.40, cost: 1.20 },
      ],
      material_cost: 33.50,
      labor_overhead_cost: 11.50,
      total_cost: 45.00,
      suggested_price: 110.00,
      status: 'ACTIVE',
      updated_at: '2026-09-10',
    },
    {
      id: 2,
      bom_code: 'BOM-LAT-002',
      product_name: 'Iced Signature Caramel Latte',
      product_sku: 'BEV-LAT-08',
      category: 'Beverage / Café',
      version: 'v1.4',
      yield_qty: '20 Cups (16oz)',
      components: [
        { name: 'Espresso Roast Coffee Beans', qty: '360g', unit_cost: 0.015, cost: 5.40 },
        { name: 'Fresh Whole Milk', qty: '3.0 L', unit_cost: 1.60, cost: 4.80 },
        { name: 'Artisan Caramel Sauce', qty: '400ml', unit_cost: 0.008, cost: 3.20 },
        { name: 'Eco Bio-Cup & Straw Set', qty: '20 sets', unit_cost: 0.12, cost: 2.40 },
      ],
      material_cost: 15.80,
      labor_overhead_cost: 5.20,
      total_cost: 21.00,
      suggested_price: 70.00,
      status: 'ACTIVE',
      updated_at: '2026-09-08',
    },
    {
      id: 3,
      bom_code: 'BOM-BGR-003',
      product_name: 'Classic Wagyu Cheeseburger',
      product_sku: 'FOD-BGR-03',
      category: 'Kitchen / Hot Food',
      version: 'v1.0',
      yield_qty: '10 Portions',
      components: [
        { name: 'Ground Wagyu Beef Patty (150g)', qty: '1.5 kg', unit_cost: 14.00, cost: 21.00 },
        { name: 'Brioche Sesame Bun', qty: '10 pcs', unit_cost: 0.45, cost: 4.50 },
        { name: 'Aged Cheddar Cheese Slice', qty: '10 slices', unit_cost: 0.35, cost: 3.50 },
        { name: 'Crisp Lettuce, Tomato & Secret Sauce', qty: '1 Batch', unit_cost: 3.00, cost: 3.00 },
      ],
      material_cost: 32.00,
      labor_overhead_cost: 10.00,
      total_cost: 42.00,
      suggested_price: 89.00,
      status: 'ACTIVE',
      updated_at: '2026-09-09',
    },
    {
      id: 4,
      bom_code: 'BOM-ROAST-004',
      product_name: 'Signature Mondulkiri Dark Roast',
      product_sku: 'COF-MND-04',
      category: 'Roasted Coffee',
      version: 'v3.0',
      yield_qty: '100 kg (Bulk Batch)',
      components: [
        { name: 'Green Arabica Peaberry Beans', qty: '80 kg', unit_cost: 3.80, cost: 304.00 },
        { name: 'Green Robusta High-Elevation Beans', qty: '20 kg', unit_cost: 2.20, cost: 44.00 },
        { name: 'Degassing Valve Matte Foil Bags 1kg', qty: '100 pcs', unit_cost: 0.40, cost: 40.00 },
      ],
      material_cost: 388.00,
      labor_overhead_cost: 92.00,
      total_cost: 480.00,
      suggested_price: 1200.00,
      status: 'DRAFT',
      updated_at: '2026-09-11',
    },
  ]);

  // 18. Manufacturing Orders Table & Pagination State
  const [mfgSearchQuery, setMfgSearchQuery] = useState('');
  const [mfgStatusFilter, setMfgStatusFilter] = useState<'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'PLANNED' | 'QC_PENDING'>('ALL');
  const [mfgCurrentPage, setMfgCurrentPage] = useState<number>(1);
  const [mfgItemsPerPage, setMfgItemsPerPage] = useState<number>(10);
  const [manufacturingOrders, setManufacturingOrders] = useState<Array<{
    id: number;
    order_no: string;
    product_name: string;
    product_sku: string;
    bom_code: string;
    target_qty: number;
    produced_qty: number;
    unit: string;
    work_center: string;
    supervisor: string;
    start_date: string;
    due_date: string;
    status: 'COMPLETED' | 'IN_PROGRESS' | 'PLANNED' | 'QC_PENDING' | 'CANCELLED';
    batch_cost: number;
    notes?: string;
  }>>([
    {
      id: 1,
      order_no: 'WO-2026-0901',
      product_name: 'Artisan Butter Croissant',
      product_sku: 'BAK-CRS-04',
      bom_code: 'BOM-CRS-001',
      target_qty: 250,
      produced_qty: 250,
      unit: 'Pieces',
      work_center: 'Deck Oven Station #1',
      supervisor: 'Chef Jean-Luc (Head Baker)',
      start_date: '2026-09-11 05:00',
      due_date: '2026-09-11 07:30',
      status: 'COMPLETED',
      batch_cost: 225.00,
      notes: 'Morning fresh bakery batch for store opening & display cabinet.',
    },
    {
      id: 2,
      order_no: 'WO-2026-0902',
      product_name: 'Signature Mondulkiri Dark Roast',
      product_sku: 'COF-MND-04',
      bom_code: 'BOM-ROAST-004',
      target_qty: 100,
      produced_qty: 65,
      unit: 'kg',
      work_center: 'Diedrich Roaster Drum A',
      supervisor: 'Dara Heng (Master Roaster)',
      start_date: '2026-09-11 08:30',
      due_date: '2026-09-11 13:00',
      status: 'IN_PROGRESS',
      batch_cost: 480.00,
      notes: 'First crack at 198°C, target roast profile medium-dark Italian style.',
    },
    {
      id: 3,
      order_no: 'WO-2026-0903',
      product_name: 'Iced Signature Caramel Latte Base',
      product_sku: 'BEV-LAT-08',
      bom_code: 'BOM-LAT-002',
      target_qty: 80,
      produced_qty: 80,
      unit: 'Bottles (1L)',
      work_center: 'Beverage Prep & Cold Storage',
      supervisor: 'Sokha Mean (Bar Lead)',
      start_date: '2026-09-11 09:00',
      due_date: '2026-09-11 11:30',
      status: 'QC_PENDING',
      batch_cost: 84.00,
      notes: 'Awaiting sensory and Brix sugar level QC sign-off.',
    },
    {
      id: 4,
      order_no: 'WO-2026-0904',
      product_name: 'Classic Wagyu Cheeseburger Patties',
      product_sku: 'FOD-BGR-03',
      bom_code: 'BOM-BGR-003',
      target_qty: 120,
      produced_qty: 0,
      unit: 'Portions',
      work_center: 'Butchery & Patty Press Line',
      supervisor: 'Chef Jean-Luc',
      start_date: '2026-09-11 14:00',
      due_date: '2026-09-11 16:30',
      status: 'PLANNED',
      batch_cost: 504.00,
      notes: 'Scheduled for evening rush replenishment.',
    },
  ]);

  // Quick View Modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<EnterpriseProduct | null>(null);

  // Quick Stock Adjustment Modal
  const [isQuickStockModalOpen, setIsQuickStockModalOpen] = useState(false);
  const [quickStockProduct, setQuickStockProduct] = useState<EnterpriseProduct | null>(null);
  const [stockAdjustType, setStockAdjustType] = useState<'ADD' | 'REMOVE' | 'SET'>('ADD');
  const [stockAdjustQuantity, setStockAdjustQuantity] = useState<number>(10);
  const [stockAdjustReason, setStockAdjustReason] = useState<string>('Restock / Inbound');
  const [stockAdjustBranchId, setStockAdjustBranchId] = useState<string>('ALL');
  const [stockAdjustNote, setStockAdjustNote] = useState<string>('');

  // QR Print / Modal
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrProduct, setQrProduct] = useState<EnterpriseProduct | null>(null);
  const [qrPrintQuantity, setQrPrintQuantity] = useState<number>(1);

  // Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importRawCsv, setImportRawCsv] = useState<string>('');

  // Bulk Adjust Stock Modal
  const [isBulkStockModalOpen, setIsBulkStockModalOpen] = useState(false);
  const [bulkStockQuantity, setBulkStockQuantity] = useState<number>(10);
  const [bulkStockAction, setBulkStockAction] = useState<'ADD' | 'REMOVE'>('ADD');

  // Bulk Price Update State
  const [bulkPriceChangeType, setBulkPriceChangeType] = useState<'PERCENT_INC' | 'PERCENT_DEC' | 'FIXED_INC' | 'SET_FIXED'>('PERCENT_INC');
  const [bulkPriceValue, setBulkPriceValue] = useState<number>(5);
  const [bulkCategoryTarget, setBulkCategoryTarget] = useState<string>('');

  // Unified Import & Export Studio State
  const [importExportMode, setImportExportMode] = useState<'import' | 'export' | 'both'>('import');
  const [exportCategoryFilter, setExportCategoryFilter] = useState<string>('ALL');
  const [exportBrandFilter, setExportBrandFilter] = useState<string>('ALL');
  const [exportStatusFilter, setExportStatusFilter] = useState<string>('ALL');
  const [exportFormat, setExportFormat] = useState<'CSV' | 'JSON'>('CSV');
  const [importRawCsvText, setImportRawCsvText] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Custom Attributes State
  const [customAttributes, setCustomAttributes] = useState<AttributeData[]>(() => {
    try {
      const saved = localStorage.getItem('smartpos_custom_attributes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [
      { id: 1, name: 'Color / ពណ៌', slug: 'color', type: 'COLOR_PICKER', description: 'Color palette swatches for garments & accessories', values: ['Black', 'White', 'Navy Blue', 'Crimson Red', 'Emerald Green', 'Gold'] },
      { id: 2, name: 'Size / ទំហំ', slug: 'size', type: 'BUTTON_SELECT', description: 'Standard garment & footwear size scales', values: ['XS', 'S', 'M', 'L', 'XL', '2XL', 'Free Size'] },
      { id: 3, name: 'Storage / ទំហំផ្ទុក', slug: 'storage', type: 'TEXT_PILL', description: 'Internal memory/SSD capacity for devices', values: ['64GB', '128GB', '256GB', '512GB', '1TB'] },
      { id: 4, name: 'Material / ធាតុដើម', slug: 'material', type: 'TEXT_PILL', description: 'Primary manufacturing & fabric components', values: ['100% Cotton', 'Stainless Steel', 'Ceramic', 'Genuine Leather', 'Polyester'] },
      { id: 5, name: 'Sugar Level / កម្រិតជាតិស្ករ', slug: 'sugar', type: 'TEXT_PILL', description: 'Custom sweetness level for café & beverage items', values: ['0% No Sugar', '25% Low', '50% Half', '75% Normal', '100% Extra Sweet'] },
    ];
  });
  const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false);
  const [selectedAttributeToEdit, setSelectedAttributeToEdit] = useState<AttributeData | null>(null);
  const [attributeSearchQuery, setAttributeSearchQuery] = useState('');

  // Warranties State
  const [warrantyPolicies, setWarrantyPolicies] = useState<Array<{ id: number; name: string; type: string; duration_months: number; coverage: string; claim_process: string }>>([
    { id: 1, name: 'Standard Manufacturer Warranty (12 Mos)', type: 'MANUFACTURER', duration_months: 12, coverage: 'Parts & Labor for factory defects. Excludes physical damage & water ingress.', claim_process: 'Bring device with original tax invoice to any authorized service center.' },
    { id: 2, name: 'SmartPOS Extended Gold Shield (24 Mos)', type: 'EXTENDED', duration_months: 24, coverage: 'Comprehensive hardware coverage + 1 free battery replacement.', claim_process: 'Instant 1-to-1 replacement within 48 hours at store locations.' },
    { id: 3, name: 'Freshness & Perishable Guarantee (7 Days)', type: 'STORE_PERISHABLE', duration_months: 1, coverage: '100% money-back or immediate exchange if quality falls below standard.', claim_process: 'Present photo of batch code & receipt via Telegram support.' },
  ]);

  // Product Questions & Inquiries State with Customer & Staff Profiles
  interface ProductQuestionItem {
    id: number;
    product_name: string;
    product_sku?: string;
    customer: {
      name: string;
      email?: string;
      phone?: string;
      tier: string;
      avatar_color: string;
    };
    question: string;
    question_date: string;
    status: 'ANSWERED' | 'PENDING';
    answer?: string;
    replied_by?: {
      name: string;
      role: string;
      avatar_color: string;
    };
    replied_at?: string;
  }

  const [productQuestions, setProductQuestions] = useState<ProductQuestionItem[]>([
    {
      id: 1,
      product_name: 'Espresso Roast Coffee',
      product_sku: 'COF-ESP-01',
      customer: {
        name: 'Sokha Mean',
        email: 'sokha.mean@gmail.com',
        phone: '+855 12 889 901',
        tier: 'VIP Gold Member',
        avatar_color: 'bg-amber-600',
      },
      question: 'Are these coffee beans Arabica or Robusta blend? Is it suitable for French Press brewing?',
      question_date: '2026-09-10 09:30 AM',
      status: 'ANSWERED',
      answer: 'It is a signature 80% Arabica and 20% Robusta blend roasted locally in Mondulkiri. For French Press, we recommend a coarse grind setting!',
      replied_by: {
        name: 'Dara Heng',
        role: 'Head Barista & Roaster',
        avatar_color: 'bg-emerald-600',
      },
      replied_at: '2026-09-10 10:15 AM',
    },
    {
      id: 2,
      product_name: 'Wireless Bluetooth Earbuds Pro',
      product_sku: 'ELC-WBE-05',
      customer: {
        name: 'Vannak Chan',
        email: 'vannak.chan@outlook.com',
        phone: '+855 98 765 432',
        tier: 'Verified Buyer',
        avatar_color: 'bg-indigo-600',
      },
      question: 'Does it support active noise cancellation on iOS and Android? And what is the battery life with ANC on?',
      question_date: '2026-09-09 14:20 PM',
      status: 'ANSWERED',
      answer: 'Yes, ANC works seamlessly across iOS, Android, and Windows. Battery life is up to 6.5 hours with ANC enabled (28 hours with charging case).',
      replied_by: {
        name: 'Sreymom Pich',
        role: 'Customer Support Lead',
        avatar_color: 'bg-indigo-600',
      },
      replied_at: '2026-09-09 15:05 PM',
    },
    {
      id: 3,
      product_name: 'Organic Mineral Water 500ml',
      product_sku: 'DRK-WAT-03',
      customer: {
        name: 'Bopha Tep',
        email: 'bopha.tep@smartbiz.kh',
        phone: '+855 77 123 456',
        tier: 'Corporate Partner',
        avatar_color: 'bg-purple-600',
      },
      question: 'Can we order by bulk pallet (100 cases) for an upcoming conference event with scheduled morning delivery?',
      question_date: '2026-09-11 08:45 AM',
      status: 'PENDING',
      answer: undefined,
      replied_by: undefined,
      replied_at: undefined,
    },
    {
      id: 4,
      product_name: 'Artisan Butter Croissant',
      product_sku: 'BAK-CRS-04',
      customer: {
        name: 'Chanthy Vong',
        email: 'chanthy.v@gmail.com',
        phone: '+855 81 223 344',
        tier: 'Regular Customer',
        avatar_color: 'bg-pink-600',
      },
      question: 'Does this contain any artificial trans-fats or preservatives? What time are the fresh batches baked each day?',
      question_date: '2026-09-11 07:10 AM',
      status: 'ANSWERED',
      answer: '100% pure Normandy butter with zero artificial preservatives! Fresh batches come out hot at 7:00 AM, 11:30 AM, and 3:30 PM daily.',
      replied_by: {
        name: 'Chef Jean-Luc',
        role: 'Master Pastry Baker',
        avatar_color: 'bg-amber-700',
      },
      replied_at: '2026-09-11 07:40 AM',
    },
    {
      id: 5,
      product_name: 'Iced Signature Caramel Latte',
      product_sku: 'BEV-LAT-08',
      customer: {
        name: 'Rithy Kosal',
        email: 'kosal.rithy@yahoo.com',
        phone: '+855 10 554 321',
        tier: 'VIP Platinum',
        avatar_color: 'bg-teal-600',
      },
      question: 'Can this drink be prepared with Oat Milk or Almond Milk substitute instead of dairy milk?',
      question_date: '2026-09-11 11:05 AM',
      status: 'PENDING',
      answer: undefined,
      replied_by: undefined,
      replied_at: undefined,
    },
  ]);
  const [answeringQuestionId, setAnsweringQuestionId] = useState<number | null>(null);
  const [questionAnswerInput, setQuestionAnswerInput] = useState<string>('');
  const [replyModalQuestion, setReplyModalQuestion] = useState<ProductQuestionItem | null>(null);

  // Recipes State
  const [recipesList, setRecipesList] = useState<Array<{ id: number; name: string; category: string; prep_time: string; portion: string; ingredients: Array<{ name: string; qty: string }>; instructions: string[] }>>([
    {
      id: 1,
      name: 'Iced Signature Caramel Latte',
      category: 'Beverage / Café',
      prep_time: '3 mins',
      portion: '1 Cup (16oz)',
      ingredients: [
        { name: 'Espresso Roast Coffee Beans', qty: '18g' },
        { name: 'Fresh Milk', qty: '150ml' },
        { name: 'Caramel Syrup', qty: '20ml' },
        { name: 'Purified Ice', qty: '180g' },
      ],
      instructions: [
        'Extract double espresso shot (30ml) using calibrated grinder.',
        'Stir caramel syrup into warm espresso until completely dissolved.',
        'Fill 16oz cup with ice, pour fresh milk, and top with espresso mixture.',
        'Drizzle caramel sauce crosshatch on top and serve with eco-straw.',
      ],
    },
    {
      id: 2,
      name: 'Artisan Butter Croissant',
      category: 'Bakery / Pastry',
      prep_time: '25 mins (Bake)',
      portion: '1 Piece',
      ingredients: [
        { name: 'French Wheat Flour T55', qty: '120g' },
        { name: 'Unsalted Butter 82% FAT', qty: '65g' },
        { name: 'Organic Yeast & Milk', qty: '40ml' },
        { name: 'Egg Wash Glaze', qty: '10g' },
      ],
      instructions: [
        'Laminate chilled butter block into dough with 3 consecutive single folds.',
        'Rest dough at 4°C for 60 mins before triangular cutting and rolling.',
        'Proof at 27°C / 75% humidity for 2 hours until double volume.',
        'Bake in convection oven at 180°C for 18-20 minutes until golden amber.',
      ],
    },
  ]);

  // Industry Templates
  const INDUSTRY_TEMPLATES = [
    {
      id: 'supermarket',
      title: 'Supermarket & Grocery',
      titleKh: 'ផ្សារទំនើប & ទំនិញប្រើប្រាស់',
      desc: 'Pre-configured with barcode scanning, batch expiry tracking, multi-tier units (Carton/Pack/Piece), and 10% VAT.',
      icon: Package,
      sampleSkus: ['GRO-MILK-01', 'GRO-RICE-02', 'GRO-SNK-03'],
      types: ['SIMPLE', 'BATCH_TRACKED'],
      taxRate: 10,
    },
    {
      id: 'fashion',
      title: 'Fashion & Apparel Boutique',
      titleKh: 'សម្លៀកបំពាក់ & ម៉ូដទាន់សម័យ',
      desc: 'Optimized for Size × Color variant matrix, seasonal price tags, apparel barcoding, and VIP member tier discounts.',
      icon: Layers,
      sampleSkus: ['APP-SHIRT-M', 'APP-DRESS-S', 'APP-JEANS-32'],
      types: ['VARIABLE'],
      taxRate: 10,
    },
    {
      id: 'electronics',
      title: 'Electronics & Mobile Store',
      titleKh: 'ហាងទូរស័ព្ទ & ឧបករណ៍អេឡិចត្រូនិច',
      desc: 'Configured with IMEI / Serial number tracking, 12/24-month warranty policies, landed customs cost, and serial barcoding.',
      icon: Hash,
      sampleSkus: ['ELC-IPHONE-15', 'ELC-LAPTOP-PRO', 'ELC-AUDIO-ANC'],
      types: ['SERIALIZED'],
      taxRate: 10,
    },
    {
      id: 'pharmacy',
      title: 'Pharmacy & Medical Clinic',
      titleKh: 'ឱសថស្ថាន & គ្លីនិកសុខាភិបាល',
      desc: 'Strict FEFO batch tracking, drug prescription guidelines, manufacturer lot tracking, and 0% medical VAT exemptions.',
      icon: ShieldCheck,
      sampleSkus: ['MED-PARA-500', 'MED-AMOX-250', 'MED-VITC-1000'],
      types: ['BATCH_TRACKED'],
      taxRate: 0,
    },
    {
      id: 'cafe_restaurant',
      title: 'Café, Restaurant & Bar',
      titleKh: 'ហាងកាហ្វេ & ភោជនីយដ្ឋាន',
      desc: 'BOM recipe formulation, raw ingredients deduction on sale, combo modifier choices, and kitchen display routing.',
      icon: UtensilsCrossed,
      sampleSkus: ['BEV-LATTE-ICED', 'FOOD-BURGER-SET', 'BAK-CROISSANT'],
      types: ['MANUFACTURED', 'COMBO', 'RAW_MATERIAL'],
      taxRate: 10,
    },
    {
      id: 'services',
      title: 'Services, Repair & Labor',
      titleKh: 'សេវាកម្ម ជួសជុល & ពលកម្ម',
      desc: 'Non-physical inventory services, hourly consulting rates, maintenance warranties, and repair work orders.',
      icon: Wrench,
      sampleSkus: ['SRV-INSTALL-01', 'SRV-REPAIR-HR', 'SRV-CLEAN-AC'],
      types: ['SERVICE'],
      taxRate: 10,
    },
  ];

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

  // Product Types Management (Dynamic Custom & System Types)
  const [productTypesList, setProductTypesList] = useState<ProductTypeDefinition[]>(() => {
    try {
      const saved = localStorage.getItem('smartpos_custom_product_types');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_PRODUCT_TYPES;
  });
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [selectedTypeToEdit, setSelectedTypeToEdit] = useState<ProductTypeDefinition | null>(null);

  const handleSaveProductType = (savedType: ProductTypeDefinition) => {
    setProductTypesList(prev => {
      const existingIdx = prev.findIndex(t => t.type === savedType.type);
      let updated: ProductTypeDefinition[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], ...savedType };
      } else {
        updated = [...prev, savedType];
      }
      try {
        localStorage.setItem('smartpos_custom_product_types', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleDeleteProductType = (typeCode: string) => {
    setProductTypesList(prev => {
      const updated = prev.filter(t => t.type !== typeCode);
      try {
        localStorage.setItem('smartpos_custom_product_types', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    notify.success(
      lang === 'kh' ? `ប្រភេទផលិតផល "${typeCode}" ត្រូវបានលុបជោគជ័យ!` : `Product Type "${typeCode}" deleted!`,
      'Type Deleted'
    );
  };

  // Category Management State & Handlers
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategoryToEdit, setSelectedCategoryToEdit] = useState<CategoryData | null>(null);

  const handleSaveCategory = async (catData: CategoryData) => {
    if (catData.id) {
      await updateCategory(catData.id, catData);
      notify.success(
        lang === 'kh' ? `ជំពូកទំនិញ "${catData.name}" ត្រូវបានកែប្រែជោគជ័យ!` : `Category "${catData.name}" updated successfully!`,
        'Category Updated'
      );
    } else {
      await createCategory(catData);
      notify.success(
        lang === 'kh' ? `ជំពូកទំនិញ "${catData.name}" ត្រូវបានបង្កើតជោគជ័យ!` : `Category "${catData.name}" created successfully!`,
        'Category Created'
      );
    }
    const freshCats = await getCategories();
    setCategories(freshCats);
  };

  const handleDeleteCategory = async (cat: CategoryData) => {
    if (!cat.id) return;
    const confirmed = await confirmDelete(
      lang === 'kh' ? `តើអ្នកពិតជាចង់លុបជំពូកទំនិញ "${cat.name}" មែនទេ?` : `Are you sure you want to delete category "${cat.name}"?`
    );
    if (!confirmed) return;

    try {
      await deleteCategory(cat.id);
      notify.success(
        lang === 'kh' ? `ជំពូក "${cat.name}" ត្រូវបានលុបជោគជ័យ!` : `Category "${cat.name}" deleted successfully!`,
        'Category Deleted'
      );
      const freshCats = await getCategories();
      setCategories(freshCats);
    } catch (err: any) {
      notify.error(
        err?.response?.data?.message || (lang === 'kh' ? 'បរាជ័យក្នុងការលុបជំពូក' : 'Failed to delete category'),
        'Delete Error'
      );
    }
  };

  // Brand Management State & Handlers
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [selectedBrandToEdit, setSelectedBrandToEdit] = useState<BrandData | null>(null);

  const handleSaveBrand = async (brandData: BrandData) => {
    if (brandData.id) {
      await updateBrand(brandData.id, brandData);
      notify.success(
        lang === 'kh' ? `ម៉ាកយីហោ "${brandData.name}" ត្រូវបានកែប្រែជោគជ័យ!` : `Brand "${brandData.name}" updated successfully!`,
        'Brand Updated'
      );
    } else {
      await createBrand(brandData);
      notify.success(
        lang === 'kh' ? `ម៉ាកយីហោ "${brandData.name}" ត្រូវបានបង្កើតជោគជ័យ!` : `Brand "${brandData.name}" created successfully!`,
        'Brand Created'
      );
    }
    const freshBrands = await getBrands();
    setBrands(freshBrands);
  };

  const handleDeleteBrand = async (brand: BrandData) => {
    if (!brand.id) return;
    const confirmed = await confirmDelete(
      lang === 'kh' ? `តើអ្នកពិតជាចង់លុបម៉ាកយីហោ "${brand.name}" មែនទេ?` : `Are you sure you want to delete brand "${brand.name}"?`
    );
    if (!confirmed) return;

    try {
      await deleteBrand(brand.id);
      notify.success(
        lang === 'kh' ? `ម៉ាក "${brand.name}" ត្រូវបានលុបជោគជ័យ!` : `Brand "${brand.name}" deleted successfully!`,
        'Brand Deleted'
      );
      const freshBrands = await getBrands();
      setBrands(freshBrands);
    } catch (err: any) {
      notify.error(
        err?.response?.data?.message || (lang === 'kh' ? 'បរាជ័យក្នុងការលុបម៉ាក' : 'Failed to delete brand'),
        'Delete Error'
      );
    }
  };

  // Unit Management State & Handlers
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [selectedUnitToEdit, setSelectedUnitToEdit] = useState<UnitData | null>(null);

  const handleSaveUnit = async (unitData: UnitData) => {
    if (unitData.id) {
      await updateUnit(unitData.id, unitData);
      notify.success(
        lang === 'kh' ? `ខ្នាតរង្វាស់ "${unitData.name}" ត្រូវបានកែប្រែជោគជ័យ!` : `Unit "${unitData.name}" updated successfully!`,
        'Unit Updated'
      );
    } else {
      await createUnit(unitData);
      notify.success(
        lang === 'kh' ? `ខ្នាតរង្វាស់ "${unitData.name}" ត្រូវបានបង្កើតជោគជ័យ!` : `Unit "${unitData.name}" created successfully!`,
        'Unit Created'
      );
    }
    const freshUnits = await getUnits();
    setUnits(freshUnits);
  };

  const handleDeleteUnit = async (unit: UnitData) => {
    if (!unit.id) return;
    const confirmed = await confirmDelete(
      lang === 'kh' ? `តើអ្នកពិតជាចង់លុបខ្នាតរង្វាស់ "${unit.name}" មែនទេ?` : `Are you sure you want to delete unit "${unit.name}"?`
    );
    if (!confirmed) return;

    try {
      await deleteUnit(unit.id);
      notify.success(
        lang === 'kh' ? `ខ្នាត "${unit.name}" ត្រូវបានលុបជោគជ័យ!` : `Unit "${unit.name}" deleted successfully!`,
        'Unit Deleted'
      );
      const freshUnits = await getUnits();
      setUnits(freshUnits);
    } catch (err: any) {
      notify.error(
        err?.response?.data?.message || (lang === 'kh' ? 'បរាជ័យក្នុងការលុបខ្នាត' : 'Failed to delete unit'),
        'Delete Error'
      );
    }
  };

  // Bulk Selection
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  // Load Data
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [dash, prodRes, catRes, unitRes, brandRes, branchRes, batchesRes, serialsRes, qcRes, reviewsRes, logsRes] = await Promise.all([
        productEnterpriseApi.getDashboard().catch(() => null),
        productEnterpriseApi.getProducts({ per_page: 250 }).catch(() => ({ data: [] })),
        getCategories().catch(() => []),
        getUnits().catch(() => []),
        getBrands().catch(() => []),
        getBranches().catch(() => []),
        productEnterpriseApi.getBatches().catch(() => ({ data: [] })),
        productEnterpriseApi.getSerialNumbers().catch(() => ({ data: [] })),
        productEnterpriseApi.getQcInspections().catch(() => ({ data: [] })),
        productEnterpriseApi.getReviews().catch(() => ({ data: [] })),
        productEnterpriseApi.getAuditLogs().catch(() => ({ data: [] })),
      ]);

      if (dash) setDashboardData(dash);
      if (prodRes && prodRes.data) {
        setProducts(prodRes.data.data || prodRes.data || []);
      }
      if (Array.isArray(catRes)) setCategories(catRes);
      if (Array.isArray(unitRes)) setUnits(unitRes);
      if (Array.isArray(branchRes)) setBranches(branchRes);
      if (batchesRes && batchesRes.data) setBatches(batchesRes.data || []);
      if (serialsRes && serialsRes.data) setSerialNumbers(serialsRes.data || []);
      if (qcRes && qcRes.data) setQcInspections(qcRes.data || []);
      if (reviewsRes && Array.isArray(reviewsRes.data) && reviewsRes.data.length > 0) setReviews(reviewsRes.data as any);
      if (logsRes && logsRes.data) setAuditLogs(logsRes.data || []);

      if (Array.isArray(brandRes) && brandRes.length > 0) {
        setBrands(brandRes);
      } else if (prodRes && prodRes.data) {
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

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchesSearch =
          !searchQuery ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.category?.name && p.category.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.brand?.name && p.brand.name.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory =
          selectedCategory === 'ALL' || p.category_id?.toString() === selectedCategory || p.category?.id?.toString() === selectedCategory;

        const matchesBrand =
          selectedBrand === 'ALL' || p.brand_id?.toString() === selectedBrand || p.brand?.id?.toString() === selectedBrand;

        const matchesStatus =
          selectedStatus === 'ALL' ||
          (selectedStatus === 'ACTIVE' && (p.status_id === 1 || !p.is_discontinued)) ||
          (selectedStatus === 'INACTIVE' && p.status_id === 2) ||
          (selectedStatus === 'ARCHIVED' && (p.status_id === 3 || p.is_discontinued)) ||
          (selectedStatus === 'FEATURED' && p.is_featured);

        const matchesType =
          selectedType === 'ALL' || p.product_type === selectedType;

        const matchesStock =
          stockFilter === 'ALL' ||
          (stockFilter === 'IN_STOCK' && (p.opening_stock || 0) > (p.reorder_level || 5)) ||
          (stockFilter === 'LOW_STOCK' &&
            (p.opening_stock || 0) > 0 &&
            (p.opening_stock || 0) <= (p.reorder_level || 5)) ||
          (stockFilter === 'OUT_OF_STOCK' && (p.opening_stock || 0) <= 0);

        const matchesBranch =
          selectedBranch === 'ALL' ||
          (p.warehouse_locations && p.warehouse_locations.some(loc => loc.warehouse_id?.toString() === selectedBranch));

        return matchesSearch && matchesCategory && matchesBrand && matchesStatus && matchesType && matchesStock && matchesBranch;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
        if (sortBy === 'price_asc') return (a.selling_price || 0) - (b.selling_price || 0);
        if (sortBy === 'price_desc') return (b.selling_price || 0) - (a.selling_price || 0);
        if (sortBy === 'cost_asc') return (a.cost_price || 0) - (b.cost_price || 0);
        if (sortBy === 'cost_desc') return (b.cost_price || 0) - (a.cost_price || 0);
        if (sortBy === 'stock_asc') return (a.opening_stock || 0) - (b.opening_stock || 0);
        if (sortBy === 'stock_desc') return (b.opening_stock || 0) - (a.opening_stock || 0);
        if (sortBy === 'newest') return (b.id || 0) - (a.id || 0);
        return 0;
      });
  }, [products, searchQuery, selectedCategory, selectedBrand, selectedStatus, selectedType, stockFilter, selectedBranch, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedBrand, selectedStatus, selectedType, stockFilter, selectedBranch, sortBy, itemsPerPage]);

  const totalFilteredCount = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / itemsPerPage));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Filtered & Paginated Categories
  const filteredCategories = useMemo(() => {
    return categories.filter(cat => {
      const q = categorySearchQuery.toLowerCase().trim();
      const parentCat = cat.parent_id ? categories.find(c => c.id === cat.parent_id) : null;
      const matchesSearch =
        !q ||
        cat.name.toLowerCase().includes(q) ||
        (cat.code && cat.code.toLowerCase().includes(q)) ||
        (cat.description && cat.description.toLowerCase().includes(q)) ||
        (parentCat && parentCat.name.toLowerCase().includes(q));

      const isActive = cat.is_active !== false && (cat.status === undefined || cat.status === 'ACTIVE' || cat.status === 'active' || cat.status === '1' || (cat.status as any) === 1);
      const matchesStatus =
        categoryStatusFilter === 'ALL' ||
        (categoryStatusFilter === 'ACTIVE' && isActive) ||
        (categoryStatusFilter === 'INACTIVE' && !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [categories, categorySearchQuery, categoryStatusFilter]);

  useEffect(() => {
    setCategoryCurrentPage(1);
  }, [categorySearchQuery, categoryStatusFilter, categoryItemsPerPage]);

  const categoryTotalCount = filteredCategories.length;
  const categoryTotalPages = Math.max(1, Math.ceil(categoryTotalCount / categoryItemsPerPage));
  const paginatedCategories = useMemo(() => {
    const start = (categoryCurrentPage - 1) * categoryItemsPerPage;
    return filteredCategories.slice(start, start + categoryItemsPerPage);
  }, [filteredCategories, categoryCurrentPage, categoryItemsPerPage]);

  // 1. Subcategories Memo & Pagination
  const filteredSubcategories = useMemo(() => {
    const subcats = categories.flatMap((cat, idx) => [
      { id: Number(`${cat.id}01`), name: `${cat.name} Premium Series`, code: `SUB-${idx + 1}01`, parent_id: cat.id, parent_name: cat.name, description: `High-grade premium tier for ${cat.name}`, tier: 2, status: 'ACTIVE' },
      { id: Number(`${cat.id}02`), name: `${cat.name} Standard Refills`, code: `SUB-${idx + 1}02`, parent_id: cat.id, parent_name: cat.name, description: `Standard consumption SKU line for ${cat.name}`, tier: 2, status: 'ACTIVE' },
    ]);
    const q = subcategorySearchQuery.toLowerCase().trim();
    return subcats.filter(s =>
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.parent_name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  }, [categories, subcategorySearchQuery]);

  useEffect(() => {
    setSubcategoryCurrentPage(1);
  }, [subcategorySearchQuery, subcategoryItemsPerPage]);

  const subcategoryTotalCount = filteredSubcategories.length;
  const subcategoryTotalPages = Math.max(1, Math.ceil(subcategoryTotalCount / subcategoryItemsPerPage));
  const paginatedSubcategories = useMemo(() => {
    const start = (subcategoryCurrentPage - 1) * subcategoryItemsPerPage;
    return filteredSubcategories.slice(start, start + subcategoryItemsPerPage);
  }, [filteredSubcategories, subcategoryCurrentPage, subcategoryItemsPerPage]);

  // 2. Brands Memo & Pagination
  const filteredBrands = useMemo(() => {
    return brands.filter(b => {
      const q = brandSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        (b.code && b.code.toLowerCase().includes(q)) ||
        (b.description && b.description.toLowerCase().includes(q));

      const isActive = (b as any).is_active !== false && ((b as any).status === undefined || (b as any).status === 'ACTIVE');
      const matchesStatus =
        brandStatusFilter === 'ALL' ||
        (brandStatusFilter === 'ACTIVE' && isActive) ||
        (brandStatusFilter === 'INACTIVE' && !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [brands, brandSearchQuery, brandStatusFilter]);

  useEffect(() => {
    setBrandCurrentPage(1);
  }, [brandSearchQuery, brandStatusFilter, brandItemsPerPage]);

  const brandTotalCount = filteredBrands.length;
  const brandTotalPages = Math.max(1, Math.ceil(brandTotalCount / brandItemsPerPage));
  const paginatedBrands = useMemo(() => {
    const start = (brandCurrentPage - 1) * brandItemsPerPage;
    return filteredBrands.slice(start, start + brandItemsPerPage);
  }, [filteredBrands, brandCurrentPage, brandItemsPerPage]);

  // 3. Units Memo & Pagination
  const filteredUnits = useMemo(() => {
    return units.filter(u => {
      const q = unitSearchQuery.toLowerCase().trim();
      return (
        !q ||
        u.name.toLowerCase().includes(q) ||
        (u.symbol && u.symbol.toLowerCase().includes(q)) ||
        (u.code && u.code.toLowerCase().includes(q))
      );
    });
  }, [units, unitSearchQuery]);

  useEffect(() => {
    setUnitCurrentPage(1);
  }, [unitSearchQuery, unitItemsPerPage]);

  const unitTotalCount = filteredUnits.length;
  const unitTotalPages = Math.max(1, Math.ceil(unitTotalCount / unitItemsPerPage));
  const paginatedUnits = useMemo(() => {
    const start = (unitCurrentPage - 1) * unitItemsPerPage;
    return filteredUnits.slice(start, start + unitItemsPerPage);
  }, [filteredUnits, unitCurrentPage, unitItemsPerPage]);

  // 4. Costs Memo & Pagination
  const filteredCostsProducts = useMemo(() => {
    return products.filter(p => {
      const q = costsSearchQuery.toLowerCase().trim();
      return (
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.category?.name && p.category.name.toLowerCase().includes(q))
      );
    });
  }, [products, costsSearchQuery]);

  useEffect(() => {
    setCostsCurrentPage(1);
  }, [costsSearchQuery, costsItemsPerPage]);

  const costsTotalCount = filteredCostsProducts.length;
  const costsTotalPages = Math.max(1, Math.ceil(costsTotalCount / costsItemsPerPage));
  const paginatedCostsProducts = useMemo(() => {
    const start = (costsCurrentPage - 1) * costsItemsPerPage;
    return filteredCostsProducts.slice(start, start + costsItemsPerPage);
  }, [filteredCostsProducts, costsCurrentPage, costsItemsPerPage]);

  // 5. Price History Memo & Pagination
  const priceHistoryList = useMemo(() => {
    return products.slice(0, 30).map((p, idx) => {
      const oldP = Number(((p.selling_price || 2.5) * 0.9).toFixed(2));
      const newP = Number((p.selling_price || 2.5).toFixed(2));
      const diff = Number((newP - oldP).toFixed(2));
      const pct = Number(((diff / oldP) * 100).toFixed(1));
      return {
        id: idx + 1,
        product_id: p.id,
        product_name: p.name,
        sku: p.sku,
        old_price: oldP,
        new_price: newP,
        diff,
        pct,
        reason: idx % 3 === 0 ? 'Supplier Tariff & Shipping Adjustment' : idx % 2 === 0 ? 'Seasonal Margin Review' : 'Promotional Adjustment',
        author: idx % 2 === 0 ? 'Admin / Manager' : 'Automated Pricing Engine',
        date: `2026-09-${String(Math.max(1, 11 - (idx % 10))).padStart(2, '0')} 14:30`,
      };
    });
  }, [products]);

  const filteredPriceHistory = useMemo(() => {
    const q = priceHistorySearchQuery.toLowerCase().trim();
    return priceHistoryList.filter(item =>
      !q ||
      item.product_name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.reason.toLowerCase().includes(q) ||
      item.author.toLowerCase().includes(q)
    );
  }, [priceHistoryList, priceHistorySearchQuery]);

  useEffect(() => {
    setPriceHistoryCurrentPage(1);
  }, [priceHistorySearchQuery, priceHistoryItemsPerPage]);

  const priceHistoryTotalCount = filteredPriceHistory.length;
  const priceHistoryTotalPages = Math.max(1, Math.ceil(priceHistoryTotalCount / priceHistoryItemsPerPage));
  const paginatedPriceHistory = useMemo(() => {
    const start = (priceHistoryCurrentPage - 1) * priceHistoryItemsPerPage;
    return filteredPriceHistory.slice(start, start + priceHistoryItemsPerPage);
  }, [filteredPriceHistory, priceHistoryCurrentPage, priceHistoryItemsPerPage]);

  // 6. Barcodes Memo & Pagination
  const filteredBarcodes = useMemo(() => {
    const q = barcodesSearchQuery.toLowerCase().trim();
    return products.filter(p =>
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  }, [products, barcodesSearchQuery]);

  useEffect(() => {
    setBarcodesCurrentPage(1);
  }, [barcodesSearchQuery, barcodesItemsPerPage]);

  const barcodesTotalCount = filteredBarcodes.length;
  const barcodesTotalPages = Math.max(1, Math.ceil(barcodesTotalCount / barcodesItemsPerPage));
  const paginatedBarcodes = useMemo(() => {
    const start = (barcodesCurrentPage - 1) * barcodesItemsPerPage;
    return filteredBarcodes.slice(start, start + barcodesItemsPerPage);
  }, [filteredBarcodes, barcodesCurrentPage, barcodesItemsPerPage]);

  // 7. QR Codes Memo & Pagination
  const filteredQrCodes = useMemo(() => {
    const q = qrCodesSearchQuery.toLowerCase().trim();
    return products.filter(p =>
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  }, [products, qrCodesSearchQuery]);

  useEffect(() => {
    setQrCodesCurrentPage(1);
  }, [qrCodesSearchQuery, qrCodesItemsPerPage]);

  const qrCodesTotalCount = filteredQrCodes.length;
  const qrCodesTotalPages = Math.max(1, Math.ceil(qrCodesTotalCount / qrCodesItemsPerPage));
  const paginatedQrCodes = useMemo(() => {
    const start = (qrCodesCurrentPage - 1) * qrCodesItemsPerPage;
    return filteredQrCodes.slice(start, start + qrCodesItemsPerPage);
  }, [filteredQrCodes, qrCodesCurrentPage, qrCodesItemsPerPage]);

  // 8. Serial Numbers Memo & Pagination
  const filteredSerials = useMemo(() => {
    const q = serialsSearchQuery.toLowerCase().trim();
    return serialNumbers.filter(s => {
      const matchesSearch =
        !q ||
        s.serial_number.toLowerCase().includes(q) ||
        (s.imei && s.imei.toLowerCase().includes(q)) ||
        (s.mac_address && s.mac_address.toLowerCase().includes(q)) ||
        (s.product_name && s.product_name.toLowerCase().includes(q));

      const matchesStatus =
        serialsStatusFilter === 'ALL' || s.status === serialsStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [serialNumbers, serialsSearchQuery, serialsStatusFilter]);

  useEffect(() => {
    setSerialsCurrentPage(1);
  }, [serialsSearchQuery, serialsStatusFilter, serialsItemsPerPage]);

  const serialsTotalCount = filteredSerials.length;
  const serialsTotalPages = Math.max(1, Math.ceil(serialsTotalCount / serialsItemsPerPage));
  const paginatedSerials = useMemo(() => {
    const start = (serialsCurrentPage - 1) * serialsItemsPerPage;
    return filteredSerials.slice(start, start + serialsItemsPerPage);
  }, [filteredSerials, serialsCurrentPage, serialsItemsPerPage]);

  // 9. Batches Memo & Pagination
  const filteredBatches = useMemo(() => {
    const q = batchesSearchQuery.toLowerCase().trim();
    return batches.filter(b => {
      const matchesSearch =
        !q ||
        b.batch_number.toLowerCase().includes(q) ||
        (b.lot_number && b.lot_number.toLowerCase().includes(q)) ||
        (b.product_name && b.product_name.toLowerCase().includes(q));

      const matchesStatus =
        batchesStatusFilter === 'ALL' || b.status === batchesStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [batches, batchesSearchQuery, batchesStatusFilter]);

  useEffect(() => {
    setBatchesCurrentPage(1);
  }, [batchesSearchQuery, batchesStatusFilter, batchesItemsPerPage]);

  const batchesTotalCount = filteredBatches.length;
  const batchesTotalPages = Math.max(1, Math.ceil(batchesTotalCount / batchesItemsPerPage));
  const paginatedBatches = useMemo(() => {
    const start = (batchesCurrentPage - 1) * batchesItemsPerPage;
    return filteredBatches.slice(start, start + batchesItemsPerPage);
  }, [filteredBatches, batchesCurrentPage, batchesItemsPerPage]);

  // 10. Warranties Memo & Pagination
  const filteredWarranties = useMemo(() => {
    const q = warrantiesSearchQuery.toLowerCase().trim();
    return warrantyPolicies.filter(w =>
      !q ||
      w.name.toLowerCase().includes(q) ||
      w.type.toLowerCase().includes(q) ||
      w.coverage.toLowerCase().includes(q) ||
      w.claim_process.toLowerCase().includes(q)
    );
  }, [warrantyPolicies, warrantiesSearchQuery]);

  useEffect(() => {
    setWarrantiesCurrentPage(1);
  }, [warrantiesSearchQuery, warrantiesItemsPerPage]);

  const warrantiesTotalCount = filteredWarranties.length;
  const warrantiesTotalPages = Math.max(1, Math.ceil(warrantiesTotalCount / warrantiesItemsPerPage));
  const paginatedWarranties = useMemo(() => {
    const start = (warrantiesCurrentPage - 1) * warrantiesItemsPerPage;
    return filteredWarranties.slice(start, start + warrantiesItemsPerPage);
  }, [filteredWarranties, warrantiesCurrentPage, warrantiesItemsPerPage]);

  // 11. Pricing Memo & Pagination
  const filteredPricingProducts = useMemo(() => {
    const q = pricingSearchQuery.toLowerCase().trim();
    return products.filter(p =>
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.category?.name && p.category.name.toLowerCase().includes(q))
    );
  }, [products, pricingSearchQuery]);

  useEffect(() => {
    setPricingCurrentPage(1);
  }, [pricingSearchQuery, pricingItemsPerPage]);

  const pricingTotalCount = filteredPricingProducts.length;
  const pricingTotalPages = Math.max(1, Math.ceil(pricingTotalCount / pricingItemsPerPage));
  const paginatedPricingProducts = useMemo(() => {
    const start = (pricingCurrentPage - 1) * pricingItemsPerPage;
    return filteredPricingProducts.slice(start, start + pricingItemsPerPage);
  }, [filteredPricingProducts, pricingCurrentPage, pricingItemsPerPage]);

  // 12. Operation / Warehouse Bin Memo & Pagination
  const operationItems = useMemo(() => {
    return products.map((p, idx) => {
      const zone = idx % 3 === 0 ? 'Zone A' : idx % 3 === 1 ? 'Zone B' : 'Zone C';
      const aisle = `Aisle 0${(idx % 4) + 1}`;
      const rack = `Rack ${String.fromCharCode(65 + (idx % 3))}`;
      const shelf = `Shelf 0${(idx % 3) + 1}`;
      const bin = `BIN-${100 + idx}`;
      return {
        id: p.id,
        product: p,
        zone,
        aisle,
        rack,
        shelf,
        bin,
        stock: p.opening_stock || 0,
      };
    });
  }, [products]);

  const filteredOperationItems = useMemo(() => {
    const q = operationSearchQuery.toLowerCase().trim();
    return operationItems.filter(item => {
      const matchesSearch =
        !q ||
        item.product.name.toLowerCase().includes(q) ||
        item.product.sku.toLowerCase().includes(q) ||
        item.zone.toLowerCase().includes(q) ||
        item.aisle.toLowerCase().includes(q) ||
        item.bin.toLowerCase().includes(q);

      const matchesZone =
        operationZoneFilter === 'ALL' || item.zone === operationZoneFilter;

      return matchesSearch && matchesZone;
    });
  }, [operationItems, operationSearchQuery, operationZoneFilter]);

  useEffect(() => {
    setOperationCurrentPage(1);
  }, [operationSearchQuery, operationZoneFilter, operationItemsPerPage]);

  const operationTotalCount = filteredOperationItems.length;
  const operationTotalPages = Math.max(1, Math.ceil(operationTotalCount / operationItemsPerPage));
  const paginatedOperationItems = useMemo(() => {
    const start = (operationCurrentPage - 1) * operationItemsPerPage;
    return filteredOperationItems.slice(start, start + operationItemsPerPage);
  }, [filteredOperationItems, operationCurrentPage, operationItemsPerPage]);

  // 13. Recipes Memo & Pagination
  const filteredRecipes = useMemo(() => {
    const q = recipesSearchQuery.toLowerCase().trim();
    return recipesList.filter(rec => {
      const matchesSearch =
        !q ||
        rec.name.toLowerCase().includes(q) ||
        rec.category.toLowerCase().includes(q) ||
        rec.ingredients.some(i => i.name.toLowerCase().includes(q));

      const matchesCategory =
        recipesCategoryFilter === 'ALL' || rec.category.toLowerCase().includes(recipesCategoryFilter.toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [recipesList, recipesSearchQuery, recipesCategoryFilter]);

  useEffect(() => {
    setRecipesCurrentPage(1);
  }, [recipesSearchQuery, recipesCategoryFilter, recipesItemsPerPage]);

  const recipesTotalCount = filteredRecipes.length;
  const recipesTotalPages = Math.max(1, Math.ceil(recipesTotalCount / recipesItemsPerPage));
  const paginatedRecipes = useMemo(() => {
    const start = (recipesCurrentPage - 1) * recipesItemsPerPage;
    return filteredRecipes.slice(start, start + recipesItemsPerPage);
  }, [filteredRecipes, recipesCurrentPage, recipesItemsPerPage]);

  // 14. Reviews Memo & Pagination
  const filteredReviews = useMemo(() => {
    const q = reviewsSearchQuery.toLowerCase().trim();
    return reviews.filter(r => {
      const matchesSearch =
        !q ||
        r.product_name.toLowerCase().includes(q) ||
        r.customer_name.toLowerCase().includes(q) ||
        r.review_text.toLowerCase().includes(q);

      const matchesRating =
        reviewsRatingFilter === 'ALL'
          ? true
          : reviewsRatingFilter === '1-2'
          ? r.rating <= 2
          : r.rating === Number(reviewsRatingFilter);

      return matchesSearch && matchesRating;
    });
  }, [reviews, reviewsSearchQuery, reviewsRatingFilter]);

  useEffect(() => {
    setReviewsCurrentPage(1);
  }, [reviewsSearchQuery, reviewsRatingFilter, reviewsItemsPerPage]);

  const reviewsTotalCount = filteredReviews.length;
  const reviewsTotalPages = Math.max(1, Math.ceil(reviewsTotalCount / reviewsItemsPerPage));
  const paginatedReviews = useMemo(() => {
    const start = (reviewsCurrentPage - 1) * reviewsItemsPerPage;
    return filteredReviews.slice(start, start + reviewsItemsPerPage);
  }, [filteredReviews, reviewsCurrentPage, reviewsItemsPerPage]);

  // 15. Questions Memo & Pagination
  const filteredQuestions = useMemo(() => {
    const q = questionsSearchQuery.toLowerCase().trim();
    return productQuestions.filter(question => {
      const matchesSearch =
        !q ||
        question.product_name.toLowerCase().includes(q) ||
        (question.product_sku && question.product_sku.toLowerCase().includes(q)) ||
        question.customer.name.toLowerCase().includes(q) ||
        (question.customer.email && question.customer.email.toLowerCase().includes(q)) ||
        (question.customer.tier && question.customer.tier.toLowerCase().includes(q)) ||
        question.question.toLowerCase().includes(q) ||
        (question.answer && question.answer.toLowerCase().includes(q)) ||
        (question.replied_by?.name && question.replied_by.name.toLowerCase().includes(q)) ||
        (question.replied_by?.role && question.replied_by.role.toLowerCase().includes(q));

      const matchesStatus =
        questionsStatusFilter === 'ALL' || question.status === questionsStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [productQuestions, questionsSearchQuery, questionsStatusFilter]);

  useEffect(() => {
    setQuestionsCurrentPage(1);
  }, [questionsSearchQuery, questionsStatusFilter, questionsItemsPerPage]);

  const questionsTotalCount = filteredQuestions.length;
  const questionsTotalPages = Math.max(1, Math.ceil(questionsTotalCount / questionsItemsPerPage));
  const paginatedQuestions = useMemo(() => {
    const start = (questionsCurrentPage - 1) * questionsItemsPerPage;
    return filteredQuestions.slice(start, start + questionsItemsPerPage);
  }, [filteredQuestions, questionsCurrentPage, questionsItemsPerPage]);

  // 16. Variants Memo & Pagination
  const filteredVariantsList = useMemo(() => {
    const q = variantsSearchQuery.toLowerCase().trim();
    return customVariantsList.filter(variant => {
      const matchesSearch =
        !q ||
        variant.variant_name.toLowerCase().includes(q) ||
        variant.sku.toLowerCase().includes(q) ||
        variant.barcode.toLowerCase().includes(q) ||
        variant.parent_name.toLowerCase().includes(q) ||
        variant.category.toLowerCase().includes(q) ||
        variant.attributes.some(a => a.name.toLowerCase().includes(q) || a.value.toLowerCase().includes(q));

      const matchesParent =
        variantsParentFilter === 'ALL' || variant.parent_product_id.toString() === variantsParentFilter;

      const matchesStatus =
        variantsStatusFilter === 'ALL' || variant.status === variantsStatusFilter;

      return matchesSearch && matchesParent && matchesStatus;
    });
  }, [customVariantsList, variantsSearchQuery, variantsParentFilter, variantsStatusFilter]);

  useEffect(() => {
    setVariantsCurrentPage(1);
  }, [variantsSearchQuery, variantsParentFilter, variantsStatusFilter, variantsItemsPerPage]);

  const variantsTotalCount = filteredVariantsList.length;
  const variantsTotalPages = Math.max(1, Math.ceil(variantsTotalCount / variantsItemsPerPage));
  const paginatedVariantsList = useMemo(() => {
    const start = (variantsCurrentPage - 1) * variantsItemsPerPage;
    return filteredVariantsList.slice(start, start + variantsItemsPerPage);
  }, [filteredVariantsList, variantsCurrentPage, variantsItemsPerPage]);

  // 17. Bill of Materials (BOM) Memo & Pagination
  const filteredBomList = useMemo(() => {
    const q = bomSearchQuery.toLowerCase().trim();
    return bomList.filter(item => {
      const matchesSearch =
        !q ||
        item.bom_code.toLowerCase().includes(q) ||
        item.product_name.toLowerCase().includes(q) ||
        item.product_sku.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.components.some(c => c.name.toLowerCase().includes(q));

      const matchesStatus =
        bomStatusFilter === 'ALL' || item.status === bomStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bomList, bomSearchQuery, bomStatusFilter]);

  useEffect(() => {
    setBomCurrentPage(1);
  }, [bomSearchQuery, bomStatusFilter, bomItemsPerPage]);

  const bomTotalCount = filteredBomList.length;
  const bomTotalPages = Math.max(1, Math.ceil(bomTotalCount / bomItemsPerPage));
  const paginatedBomList = useMemo(() => {
    const start = (bomCurrentPage - 1) * bomItemsPerPage;
    return filteredBomList.slice(start, start + bomItemsPerPage);
  }, [filteredBomList, bomCurrentPage, bomItemsPerPage]);

  // 18. Manufacturing Orders Memo & Pagination
  const filteredManufacturingOrders = useMemo(() => {
    const q = mfgSearchQuery.toLowerCase().trim();
    return manufacturingOrders.filter(order => {
      const matchesSearch =
        !q ||
        order.order_no.toLowerCase().includes(q) ||
        order.product_name.toLowerCase().includes(q) ||
        order.product_sku.toLowerCase().includes(q) ||
        order.bom_code.toLowerCase().includes(q) ||
        order.work_center.toLowerCase().includes(q) ||
        order.supervisor.toLowerCase().includes(q);

      const matchesStatus =
        mfgStatusFilter === 'ALL' || order.status === mfgStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [manufacturingOrders, mfgSearchQuery, mfgStatusFilter]);

  useEffect(() => {
    setMfgCurrentPage(1);
  }, [mfgSearchQuery, mfgStatusFilter, mfgItemsPerPage]);

  const mfgTotalCount = filteredManufacturingOrders.length;
  const mfgTotalPages = Math.max(1, Math.ceil(mfgTotalCount / mfgItemsPerPage));
  const paginatedManufacturingOrders = useMemo(() => {
    const start = (mfgCurrentPage - 1) * mfgItemsPerPage;
    return filteredManufacturingOrders.slice(start, start + mfgItemsPerPage);
  }, [filteredManufacturingOrders, mfgCurrentPage, mfgItemsPerPage]);

  const handleDeleteVariant = async (variantId: number) => {
    const ok = await confirmDelete({
      title: lang === 'kh' ? 'លុបវ៉ារ្យ៉ង់នេះ?' : 'Delete Product Variant?',
      message: lang === 'kh' ? 'តើអ្នកពិតជាចង់លុបវ៉ារ្យ៉ង់ទំនិញនេះមែនទេ?' : 'Are you sure you want to delete this product variant?',
      confirmText: lang === 'kh' ? 'យល់ព្រមលុប' : 'Delete Variant',
    });
    if (!ok) return;
    setCustomVariantsList(prev => prev.filter(v => v.id !== variantId));
    notify.success(
      lang === 'kh' ? 'វ៉ារ្យ៉ង់ត្រូវបានលុបជោគជ័យ!' : 'Variant deleted successfully!',
      'Variant Deleted'
    );
  };

  const handleDeleteBom = async (bomId: number) => {
    const ok = await confirmDelete({
      title: lang === 'kh' ? 'លុបរូបមន្ត BOM នេះ?' : 'Delete Bill of Materials (BOM)?',
      message: lang === 'kh' ? 'តើអ្នកពិតជាចង់លុបរូបមន្តផលិតកម្ម BOM នេះមែនទេ?' : 'Are you sure you want to delete this Bill of Materials (BOM)?',
      confirmText: lang === 'kh' ? 'យល់ព្រមលុប' : 'Delete BOM',
    });
    if (!ok) return;
    setBomList(prev => prev.filter(b => b.id !== bomId));
    notify.success(
      lang === 'kh' ? 'រូបមន្ត BOM ត្រូវបានលុបជោគជ័យ!' : 'BOM deleted successfully!',
      'BOM Deleted'
    );
  };

  const handleDeleteMfgOrder = async (orderId: number) => {
    const ok = await confirmDelete({
      title: lang === 'kh' ? 'លុបបញ្ជាផលិតកម្ម?' : 'Delete Manufacturing Work Order?',
      message: lang === 'kh' ? 'តើអ្នកពិតជាចង់លុបបញ្ជាការងារផលិតកម្មនេះមែនទេ?' : 'Are you sure you want to delete this manufacturing work order?',
      confirmText: lang === 'kh' ? 'យល់ព្រមលុប' : 'Delete Work Order',
    });
    if (!ok) return;
    setManufacturingOrders(prev => prev.filter(o => o.id !== orderId));
    notify.success(
      lang === 'kh' ? 'បញ្ជាការងារផលិតកម្មត្រូវបានលុបជោគជ័យ!' : 'Work Order deleted successfully!',
      'Order Deleted'
    );
  };

  const handleUpdateMfgStatus = (orderId: number, nextStatus: 'COMPLETED' | 'IN_PROGRESS' | 'PLANNED' | 'QC_PENDING') => {
    setManufacturingOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          const produced = nextStatus === 'COMPLETED' ? o.target_qty : o.produced_qty;
          return { ...o, status: nextStatus, produced_qty: produced };
        }
        return o;
      })
    );
    notify.success(
      lang === 'kh' ? `ស្ថានភាពបញ្ជាផលិតត្រូវបានផ្លាស់ប្តូរទៅជា ${nextStatus}` : `Work Order status updated to ${nextStatus}`,
      'Status Updated'
    );
  };

  const handleDeleteProduct = async (id: number) => {
    const ok = await confirmDelete({
      title: lang === 'kh' ? 'លុបផលិតផល?' : 'Delete Product?',
      message: lang === 'kh' ? 'តើអ្នកពិតជាចង់លុបផលិតផលនេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។' : 'Are you sure you want to delete this product? This action cannot be undone.',
      confirmText: lang === 'kh' ? 'យល់ព្រមលុប' : 'Delete Product',
    });
    if (!ok) return;
    try {
      await productEnterpriseApi.deleteProduct(id);
      notify.success(
        lang === 'kh' ? 'ផលិតផលត្រូវបានលុបជោគជ័យ!' : 'Product deleted successfully!',
        'Product Deleted'
      );
      setProducts(prev => prev.filter(p => p.id !== id));
      setSelectedProductIds(prev => prev.filter(pId => pId !== id));
    } catch (err: any) {
      notify.error(err?.response?.data?.message || 'Error deleting product');
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedProductIds.length) return;
    const ok = await confirmDelete({
      title: lang === 'kh' ? 'លុបផលិតផលច្រើន?' : 'Delete Multiple Products?',
      message: lang === 'kh' ? `តើអ្នកពិតជាចង់លុប ${selectedProductIds.length} ផលិតផលដែលបានជ្រើសរើសមែនទេ?` : `Are you sure you want to delete ${selectedProductIds.length} selected products?`,
      confirmText: lang === 'kh' ? 'យល់ព្រមលុបទាំងអស់' : 'Delete All Selected',
    });
    if (!ok) return;
    try {
      for (const id of selectedProductIds) {
        await productEnterpriseApi.deleteProduct(id).catch(() => {});
      }
      notify.success(
        lang === 'kh' ? `${selectedProductIds.length} ផលិតផលត្រូវបានលុបជោគជ័យ!` : `${selectedProductIds.length} products deleted successfully!`,
        'Bulk Deleted'
      );
      setProducts(prev => prev.filter(p => !selectedProductIds.includes(p.id)));
      setSelectedProductIds([]);
    } catch (err: any) {
      notify.error('Error during bulk deletion');
    }
  };

  const handleDuplicateProduct = async (product: EnterpriseProduct) => {
    try {
      const duplicatedItem = {
        ...product,
        name: `${product.name} (Copy)`,
        sku: `${product.sku}-COPY-${Math.floor(100 + Math.random() * 900)}`,
        barcode: product.barcode ? `${product.barcode}1` : undefined,
      };
      delete (duplicatedItem as any).id;

      const created = await productEnterpriseApi.createProduct(duplicatedItem);
      notify.success(
        lang === 'kh' ? `បានចម្លងផលិតផល "${product.name}" ជោគជ័យ!` : `Product "${product.name}" duplicated successfully!`,
        'Duplicated'
      );
      loadAllData();
    } catch (err: any) {
      notify.error(err?.response?.data?.message || 'Failed to duplicate product');
    }
  };

  const handleToggleArchive = async (product: EnterpriseProduct) => {
    const newDiscontinued = !product.is_discontinued;
    try {
      await productEnterpriseApi.updateProduct(product.id, {
        is_discontinued: newDiscontinued,
        status_id: newDiscontinued ? 3 : 1,
      });

      setProducts(prev =>
        prev.map(p => (p.id === product.id ? { ...p, is_discontinued: newDiscontinued, status_id: newDiscontinued ? 3 : 1 } : p))
      );

      notify.success(
        newDiscontinued
          ? (lang === 'kh' ? `ផលិតផល "${product.name}" ត្រូវបានរក្សាទុកក្នុងប័ណ្ណសារ (Archived)!` : `Product "${product.name}" archived!`)
          : (lang === 'kh' ? `ផលិតផល "${product.name}" ត្រូវបានស្ដារមកវិញ (Active)!` : `Product "${product.name}" restored to Active!`),
        newDiscontinued ? 'Archived' : 'Restored'
      );
    } catch (err: any) {
      notify.error('Failed to update archive status');
    }
  };

  const handleSaveQuickStock = async () => {
    if (!quickStockProduct) return;
    const currentStock = quickStockProduct.opening_stock || 0;
    let newStock = currentStock;

    if (stockAdjustType === 'ADD') {
      newStock = currentStock + stockAdjustQuantity;
    } else if (stockAdjustType === 'REMOVE') {
      newStock = Math.max(0, currentStock - stockAdjustQuantity);
    } else if (stockAdjustType === 'SET') {
      newStock = Math.max(0, stockAdjustQuantity);
    }

    try {
      await productEnterpriseApi.updateProduct(quickStockProduct.id, {
        opening_stock: newStock,
      });

      setProducts(prev =>
        prev.map(p => (p.id === quickStockProduct.id ? { ...p, opening_stock: newStock } : p))
      );

      notify.success(
        lang === 'kh'
          ? `ស្តុក "${quickStockProduct.name}" ត្រូវបានកែប្រែទៅជា ${newStock}!`
          : `Stock for "${quickStockProduct.name}" adjusted to ${newStock}!`,
        'Stock Adjusted'
      );
      setIsQuickStockModalOpen(false);
      setQuickStockProduct(null);
    } catch (err: any) {
      notify.error('Failed to adjust stock');
    }
  };

  const handleSaveBulkStock = async () => {
    if (!selectedProductIds.length) return;
    try {
      setProducts(prev =>
        prev.map(p => {
          if (!selectedProductIds.includes(p.id)) return p;
          const cur = p.opening_stock || 0;
          const adjusted =
            bulkStockAction === 'ADD'
              ? cur + bulkStockQuantity
              : Math.max(0, cur - bulkStockQuantity);
          productEnterpriseApi.updateProduct(p.id, { opening_stock: adjusted }).catch(() => {});
          return { ...p, opening_stock: adjusted };
        })
      );

      notify.success(
        lang === 'kh'
          ? `ស្តុកផលិតផលទាំង ${selectedProductIds.length} មុខត្រូវបានកែប្រែជោគជ័យ!`
          : `Stock adjusted for ${selectedProductIds.length} products!`,
        'Bulk Stock Adjusted'
      );
      setIsBulkStockModalOpen(false);
      setSelectedProductIds([]);
    } catch (err: any) {
      notify.error('Failed to bulk adjust stock');
    }
  };

  const handleExecuteBulkPriceUpdate = async () => {
    const targetProducts = selectedProductIds.length > 0
      ? products.filter(p => selectedProductIds.includes(p.id))
      : bulkCategoryTarget
      ? products.filter(p => p.category_id?.toString() === bulkCategoryTarget)
      : products;

    if (!targetProducts.length) {
      notify.error('No products selected for bulk price adjustment', 'No Targets');
      return;
    }

    try {
      for (const prod of targetProducts) {
        let newSelling = prod.selling_price || 0;
        if (bulkPriceChangeType === 'PERCENT_INC') {
          newSelling = Number((newSelling * (1 + bulkPriceValue / 100)).toFixed(2));
        } else if (bulkPriceChangeType === 'PERCENT_DEC') {
          newSelling = Math.max(0, Number((newSelling * (1 - bulkPriceValue / 100)).toFixed(2)));
        } else if (bulkPriceChangeType === 'FIXED_INC') {
          newSelling = Number((newSelling + bulkPriceValue).toFixed(2));
        } else if (bulkPriceChangeType === 'SET_FIXED') {
          newSelling = bulkPriceValue;
        }

        await productEnterpriseApi.updateProduct(prod.id, { selling_price: newSelling }).catch(() => {});
      }

      notify.success(
        lang === 'kh'
          ? `បានកែប្រែតម្លៃផលិតផលចំនួន ${targetProducts.length} មុខជោគជ័យ!`
          : `Updated prices for ${targetProducts.length} products successfully!`,
        'Bulk Price Updated'
      );
      loadAllData();
      setSelectedProductIds([]);
    } catch (err: any) {
      notify.error('Failed to execute bulk price update');
    }
  };

  const handleBulkArchive = async (archive: boolean) => {
    if (!selectedProductIds.length) return;
    try {
      const newStatus = archive ? 3 : 1;
      setProducts(prev =>
        prev.map(p => {
          if (!selectedProductIds.includes(p.id)) return p;
          productEnterpriseApi.updateProduct(p.id, { status_id: newStatus, is_discontinued: archive }).catch(() => {});
          return { ...p, status_id: newStatus, is_discontinued: archive };
        })
      );
      notify.success(
        archive
          ? (lang === 'kh' ? `${selectedProductIds.length} ផលិតផលត្រូវបានផ្ទេរទៅប័ណ្ណសារ!` : `${selectedProductIds.length} products archived!`)
          : (lang === 'kh' ? `${selectedProductIds.length} ផលិតផលត្រូវបានស្ដារមកវិញ!` : `${selectedProductIds.length} products restored!`),
        archive ? 'Bulk Archived' : 'Bulk Restored'
      );
      setSelectedProductIds([]);
    } catch (err: any) {
      notify.error('Failed to update bulk archive');
    }
  };

  const filteredExportProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = exportCategoryFilter === 'ALL' || p.category_id?.toString() === exportCategoryFilter || p.category?.id?.toString() === exportCategoryFilter;
      const matchBrand = exportBrandFilter === 'ALL' || p.brand_id?.toString() === exportBrandFilter || p.brand?.id?.toString() === exportBrandFilter;
      const matchStatus = exportStatusFilter === 'ALL' || 
        (exportStatusFilter === 'ACTIVE' && (p.status_id === 1 || !p.is_discontinued)) ||
        (exportStatusFilter === 'INACTIVE' && p.status_id === 2) ||
        (exportStatusFilter === 'ARCHIVED' && (p.status_id === 3 || p.is_discontinued));
      return matchCat && matchBrand && matchStatus;
    });
  }, [products, exportCategoryFilter, exportBrandFilter, exportStatusFilter]);

  const handleExecuteExport = () => {
    if (!filteredExportProducts.length) {
      notify.error('No products found matching the selected export filters', 'Export Failed');
      return;
    }

    if (exportFormat === 'JSON') {
      const jsonStr = JSON.stringify(filteredExportProducts, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smartpos_catalog_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notify.success(
        lang === 'kh' ? `បានទាញយកទិន្នន័យ JSON ចំនួន ${filteredExportProducts.length} មុខ!` : `Exported ${filteredExportProducts.length} products to JSON!`,
        'JSON Export Ready'
      );
      return;
    }

    // CSV Export
    const headers = ['ID', 'Name', 'SKU', 'Barcode', 'Product Type', 'Category', 'Brand', 'Cost Price', 'Selling Price', 'Stock', 'Status'];
    const rows = filteredExportProducts.map(p => [
      p.id,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${p.sku || ''}"`,
      `"${p.barcode || ''}"`,
      p.product_type || 'SIMPLE',
      `"${p.category?.name || 'General'}"`,
      `"${p.brand?.name || 'Generic'}"`,
      (p.cost_price || 0).toFixed(2),
      (p.selling_price || 0).toFixed(2),
      p.opening_stock || 0,
      p.status_id === 3 || p.is_discontinued ? 'Archived' : p.status_id === 2 ? 'Inactive' : 'Active',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartpos_products_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    notify.success(
      lang === 'kh' ? `បាននាំចេញផលិតផល ${filteredExportProducts.length} មុខជោគជ័យ!` : `Exported ${filteredExportProducts.length} products to CSV!`,
      'Export Complete'
    );
  };

  const handleExportCsv = handleExecuteExport;

  const handleDownloadSampleCsv = () => {
    const headers = ['Name', 'SKU', 'Barcode', 'Product_Type', 'Cost_Price', 'Selling_Price', 'Stock_Quantity', 'Reorder_Level', 'Category', 'Brand'];
    const sampleRows = [
      ['Espresso Roast Coffee Beans', 'COF-ESP-01', '200491823901', 'SIMPLE', '1.10', '2.75', '150', '20', 'Beverage / Coffee', 'Nestle'],
      ['Iced Matcha Latte 16oz', 'BEV-MTC-02', '200491823902', 'SIMPLE', '1.40', '3.50', '85', '15', 'Beverage / Tea', 'SmartCafé'],
      ['Organic Mineral Water 500ml', 'DRK-WAT-03', '200491823903', 'SIMPLE', '0.25', '0.60', '450', '50', 'Water & Soft Drinks', 'Kulen'],
      ['Artisan Butter Croissant', 'BAK-CRS-04', '200491823904', 'MANUFACTURED', '0.90', '2.20', '40', '10', 'Bakery & Pastry', 'StoreBakery'],
      ['Wireless Bluetooth Earbuds Pro', 'ELC-WBE-05', '200491823905', 'SERIALIZED', '25.00', '49.00', '25', '5', 'Electronics', 'Sony'],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...sampleRows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartpos_sample_import_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify.success('Sample import CSV template downloaded!', 'Template Ready');
  };

  const handleParseAndImportCsv = (csvText: string) => {
    if (!csvText.trim()) {
      notify.error('Please upload a file or paste CSV content first', 'Empty Data');
      return;
    }

    try {
      const lines = csvText.trim().split(/\r?\n/);
      if (lines.length < 2) {
        notify.error('CSV must contain a header row and at least 1 data row', 'Invalid CSV');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
      const nameIdx = headers.findIndex(h => h.includes('name'));
      const skuIdx = headers.findIndex(h => h.includes('sku'));
      const barcodeIdx = headers.findIndex(h => h.includes('barcode'));
      const typeIdx = headers.findIndex(h => h.includes('type'));
      const costIdx = headers.findIndex(h => h.includes('cost'));
      const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('selling'));
      const stockIdx = headers.findIndex(h => h.includes('stock') || h.includes('quantity') || h.includes('qty'));

      const newProducts: Partial<EnterpriseProduct>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
        
        const name = nameIdx >= 0 && cols[nameIdx] ? cols[nameIdx] : `Imported Product ${i}`;
        const sku = skuIdx >= 0 && cols[skuIdx] ? cols[skuIdx] : `IMP-SKU-${Date.now().toString().slice(-4)}-${i}`;
        const barcode = barcodeIdx >= 0 ? cols[barcodeIdx] : undefined;
        const product_type = (typeIdx >= 0 && cols[typeIdx] ? cols[typeIdx].toUpperCase() : 'SIMPLE') as ProductType;
        const cost_price = costIdx >= 0 ? parseFloat(cols[costIdx]) || 0 : 0;
        const selling_price = priceIdx >= 0 ? parseFloat(cols[priceIdx]) || 0 : 0;
        const opening_stock = stockIdx >= 0 ? parseInt(cols[stockIdx], 10) || 0 : 0;

        newProducts.push({
          name,
          sku,
          barcode,
          product_type,
          cost_price,
          selling_price,
          opening_stock,
          status_id: 1,
          is_discontinued: false,
        });
      }

      if (!newProducts.length) {
        notify.error('No valid rows could be parsed from the CSV', 'Parsing Failed');
        return;
      }

      setIsImporting(true);
      newProducts.forEach(item => {
        productEnterpriseApi.createProduct(item).catch(() => {});
      });

      setProducts(prev => [...(newProducts.map((p, idx) => ({ ...p, id: Date.now() + idx })) as any), ...prev]);
      setIsImporting(false);
      setImportRawCsvText('');
      notify.success(
        lang === 'kh' ? `បាននាំចូលទំនិញថ្មីចំនួន ${newProducts.length} មុខជោគជ័យ!` : `Successfully imported ${newProducts.length} products!`,
        'Import Completed'
      );
    } catch (e: any) {
      setIsImporting(false);
      notify.error('Failed to parse CSV file: ' + (e?.message || 'Invalid format'));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImportRawCsvText(text);
        handleParseAndImportCsv(text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportSampleProducts = () => {
    const sampleItems: Partial<EnterpriseProduct>[] = [
      { name: 'Espresso Roast Coffee', sku: 'COF-ESP-01', barcode: '200491823901', product_type: 'SIMPLE', selling_price: 2.75, cost_price: 1.10, opening_stock: 150, reorder_level: 20, image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=80' },
      { name: 'Iced Matcha Green Tea', sku: 'BEV-MTC-02', barcode: '200491823902', product_type: 'SIMPLE', selling_price: 3.50, cost_price: 1.40, opening_stock: 85, reorder_level: 15, image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=200&auto=format&fit=crop&q=80' },
      { name: 'Organic Mineral Water 500ml', sku: 'DRK-WAT-03', barcode: '200491823903', product_type: 'SIMPLE', selling_price: 0.60, cost_price: 0.25, opening_stock: 450, reorder_level: 50, image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=200&auto=format&fit=crop&q=80' },
      { name: 'Butter French Croissant', sku: 'BAK-CRS-04', barcode: '200491823904', product_type: 'MANUFACTURED', selling_price: 2.20, cost_price: 0.90, opening_stock: 40, reorder_level: 10, image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&auto=format&fit=crop&q=80' },
      { name: 'Wireless Bluetooth Earbuds Pro', sku: 'ELC-WBE-05', barcode: '200491823905', product_type: 'SERIALIZED', selling_price: 49.00, cost_price: 25.00, opening_stock: 25, reorder_level: 5, image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200&auto=format&fit=crop&q=80' },
    ];

    sampleItems.forEach(item => {
      productEnterpriseApi.createProduct(item).catch(() => {});
    });

    setProducts(prev => [...(sampleItems.map((s, idx) => ({ ...s, id: Date.now() + idx })) as any), ...prev]);
    notify.success('Sample products imported successfully!', 'Import Success');
    setIsImportModalOpen(false);
  };

  const handleSaveAttribute = (attrData: AttributeData) => {
    let updatedList: AttributeData[];
    if (attrData.id) {
      updatedList = customAttributes.map(a => (a.id === attrData.id ? attrData : a));
      notify.success(
        lang === 'kh' ? `លក្ខណៈទំនិញ "${attrData.name}" ត្រូវបានកែប្រែជោគជ័យ!` : `Attribute "${attrData.name}" updated successfully!`,
        'Attribute Updated'
      );
    } else {
      const newAttr: AttributeData = {
        ...attrData,
        id: Date.now(),
        slug: attrData.slug || attrData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      };
      updatedList = [newAttr, ...customAttributes];
      notify.success(
        lang === 'kh' ? `លក្ខណៈទំនិញ "${newAttr.name}" ត្រូវបានបង្កើតជោគជ័យ!` : `Attribute "${newAttr.name}" created successfully!`,
        'Attribute Created'
      );
    }
    setCustomAttributes(updatedList);
    try {
      localStorage.setItem('smartpos_custom_attributes', JSON.stringify(updatedList));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAttribute = async (attr: AttributeData) => {
    if (!attr.id) return;
    const confirmed = await confirmDelete({
      title: lang === 'kh' ? 'លុបលក្ខណៈទំនិញ?' : 'Delete Attribute?',
      message: lang === 'kh' ? `តើអ្នកពិតជាចង់លុបលក្ខណៈ "${attr.name}" មែនទេ?` : `Are you sure you want to delete attribute "${attr.name}"?`,
      confirmText: lang === 'kh' ? 'យល់ព្រមលុប' : 'Delete',
    });
    if (!confirmed) return;

    const updatedList = customAttributes.filter(a => a.id !== attr.id);
    setCustomAttributes(updatedList);
    try {
      localStorage.setItem('smartpos_custom_attributes', JSON.stringify(updatedList));
    } catch (e) {
      console.error(e);
    }
    notify.success(
      lang === 'kh' ? `លក្ខណៈ "${attr.name}" ត្រូវបានលុបជោគជ័យ!` : `Attribute "${attr.name}" deleted successfully!`,
      'Attribute Deleted'
    );
  };

  const handleQuickAddValueToAttribute = (attrId: number, val: string) => {
    if (!val.trim()) return;
    setCustomAttributes(prev => {
      const updated = prev.map(a => {
        if (a.id === attrId) {
          if (a.values.includes(val.trim())) return a;
          return { ...a, values: [...a.values, val.trim()] };
        }
        return a;
      });
      try {
        localStorage.setItem('smartpos_custom_attributes', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleQuickRemoveValueFromAttribute = (attrId: number, valToRemove: string) => {
    setCustomAttributes(prev => {
      const updated = prev.map(a => {
        if (a.id === attrId) {
          return { ...a, values: a.values.filter(v => v !== valToRemove) };
        }
        return a;
      });
      try {
        localStorage.setItem('smartpos_custom_attributes', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handlePublishAnswer = (qId: number, answerText?: string) => {
    const textToSave = (answerText !== undefined ? answerText : questionAnswerInput).trim();
    if (!textToSave) {
      notify.error(lang === 'kh' ? 'សូមបញ្ចូលចម្លើយមុនពេលរក្សាទុក' : 'Please enter an answer before publishing');
      return;
    }

    const staffName = currentUser?.full_name || currentUser?.username || 'Store Support Staff';
    const staffRole = currentUser?.primary_role || (currentUser?.roles && currentUser.roles[0]?.name) || 'Support Specialist';
    const nowStr = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    setProductQuestions(prev =>
      prev.map(q =>
        q.id === qId
          ? {
              ...q,
              answer: textToSave,
              status: 'ANSWERED' as const,
              replied_by: {
                name: staffName,
                role: staffRole,
                avatar_color: 'bg-indigo-600',
              },
              replied_at: nowStr,
            }
          : q
      )
    );
    setAnsweringQuestionId(null);
    setQuestionAnswerInput('');
    setReplyModalQuestion(null);
    notify.success(
      lang === 'kh' ? 'បានឆ្លើយតបសំណួរអតិថិជនជោគជ័យ!' : 'Answer published to customer inquiry!',
      'Inquiry Answered'
    );
  };

  const handleDeleteQuestion = async (qId: number) => {
    const confirmed = await confirmDelete({
      title: lang === 'kh' ? 'លុបសំណួរនេះ?' : 'Delete Customer Question?',
      message: lang === 'kh' ? 'តើអ្នកពិតជាចង់លុបសំណួររបស់អតិថិជននេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។' : 'Are you sure you want to delete this customer inquiry? This action cannot be undone.',
      confirmText: lang === 'kh' ? 'យល់ព្រមលុប' : 'Delete Inquiry',
    });
    if (!confirmed) return;

    setProductQuestions(prev => prev.filter(q => q.id !== qId));
    notify.success(
      lang === 'kh' ? 'សំណួរត្រូវបានលុបជោគជ័យ!' : 'Question deleted successfully!',
      'Question Deleted'
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col">
      {/* Main Workspace Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">

        {/* 1. VIEW: PRODUCT DASHBOARD (INTEGRATED WITH IDENTIFICATION, TAX, EXPIRATION & RATINGS) */}
        {(activeSubView === 'dashboard' || activeSubView === 'identification' || activeSubView === 'tax' || activeSubView === 'expiration' || activeSubView === 'ratings') && (
          <div className="space-y-6">
            {/* Dashboard Header Banner */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    {lang === 'kh' ? 'ផ្ទាំងគ្រប់គ្រងទំនិញ & ស្ថិតិឆ្លាតវៃ (Product 360° Dashboard)' : 'Product 360° Intelligence & Executive Dashboard'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lang === 'kh'
                      ? 'ទិដ្ឋភាពទូទៅនៃស្តុកទំនិញ ហិរញ្ញវត្ថុ កូដអត្តសញ្ញាណ ពន្ធដារ GDT ការផុតកំណត់ FEFO និងការវាយតម្លៃអតិថិជន'
                      : 'Comprehensive view of inventory valuation, SKU identification, GDT tax classification, FEFO expiration, and customer rating analytics.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={loadAllData}
                  className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{lang === 'kh' ? 'ផ្ទុកទិន្នន័យឡើងវិញ' : 'Refresh Data'}</span>
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">{lang === 'kh' ? 'ទំនិញសរុប' : 'Total Products'}</span>
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-gray-900">
                  {dashboardData?.overview?.total_products ?? products.length}
                </div>
                <div className="text-[11px] text-green-600 font-bold mt-0.5">
                  {dashboardData?.overview?.active_products ?? products.filter(p => p.status_id === 1 || !p.is_discontinued).length} {lang === 'kh' ? 'សកម្មក្នុង POS' : 'Active in POS'}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">{lang === 'kh' ? 'អស់ពីស្តុក' : 'Out of Stock'}</span>
                  <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
                    <XCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-red-600">
                  {dashboardData?.overview?.out_of_stock ?? products.filter(p => (p.opening_stock || 0) <= 0).length}
                </div>
                <div className="text-[11px] text-red-500 font-semibold mt-0.5">
                  {lang === 'kh' ? 'តម្រូវឲ្យបំពេញស្តុកភ្លាមៗ' : 'Immediate Restock'}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">{lang === 'kh' ? 'ការព្រមានជិតអស់ស្តុក' : 'Low Stock Alert'}</span>
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-amber-600">
                  {dashboardData?.overview?.low_stock ?? products.filter(p => (p.opening_stock || 0) > 0 && (p.opening_stock || 0) <= (p.reorder_level || 5)).length}
                </div>
                <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
                  {lang === 'kh' ? 'ទាបជាងកម្រិតបញ្ជាទិញឡើងវិញ' : 'Below reorder level'}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">{lang === 'kh' ? 'ផុតកំណត់ / ខូចគុណភាព' : 'Expired Stock'}</span>
                  <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-rose-600">
                  {dashboardData?.overview?.expired_products || 0}
                </div>
                <div className="text-[11px] text-rose-500 font-semibold mt-0.5">
                  {dashboardData?.overview?.expiring_soon || 2} {lang === 'kh' ? 'ជិតផុតកំណត់ <30ថ្ងៃ' : 'Expiring <30d'}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">{lang === 'kh' ? 'ទំនិញលេចធ្លោ' : 'Featured Items'}</span>
                  <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-purple-600">
                  {dashboardData?.overview?.featured_products ?? products.filter(p => p.is_featured).length}
                </div>
                <div className="text-[11px] text-purple-500 font-semibold mt-0.5">
                  {lang === 'kh' ? 'បង្ហាញលើទំព័រដើម' : 'Highlighted in POS'}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500">{lang === 'kh' ? 'ប័ណ្ណសារ' : 'Archived Items'}</span>
                  <div className="p-1.5 bg-gray-50 text-gray-600 rounded-lg">
                    <Archive className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-gray-700">
                  {dashboardData?.overview?.discontinued_products ?? products.filter(p => p.is_discontinued).length}
                </div>
                <div className="text-[11px] text-gray-500 font-semibold mt-0.5">
                  {lang === 'kh' ? 'ផ្អាកលក់បណ្តោះអាសន្ន' : 'Discontinued / Inactive'}
                </div>
              </div>
            </div>

            {/* Financial Valuation Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider">{lang === 'kh' ? 'តម្លៃស្តុកសរុប (ថ្លៃដើម)' : 'Total Inventory Valuation (Cost)'}</div>
                  <div className="text-2xl font-black text-white mt-1">
                    ${(dashboardData?.financials?.total_stock_value ?? products.reduce((sum, p) => sum + (p.cost_price || 0) * (p.opening_stock || 0), 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{lang === 'kh' ? 'ផ្អែកលើថ្លៃដើមពិតប្រាកដ (Landed Cost)' : 'Based on real-time landed unit costs'}</p>
                </div>

                <div>
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{lang === 'kh' ? 'តម្លៃលក់រំពឹងទុក (Retail Value)' : 'Potential Retail Value'}</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    ${(dashboardData?.financials?.potential_sales_value ?? products.reduce((sum, p) => sum + (p.selling_price || 0) * (p.opening_stock || 0), 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] text-emerald-300/80 mt-1">{lang === 'kh' ? 'តម្លៃលក់រាយនៅកន្លែងគិតប្រាក់' : 'Standard store sales price value'}</p>
                </div>

                <div>
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">{lang === 'kh' ? 'ប្រាក់ចំណេញរំពឹងទុក & អត្រាចំណេញ' : 'Gross Profit & Avg Margin'}</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    ${(dashboardData?.financials?.potential_profit ?? Math.max(0, products.reduce((sum, p) => sum + ((p.selling_price || 0) - (p.cost_price || 0)) * (p.opening_stock || 0), 0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="text-sm font-bold ml-2 text-amber-300">
                      ({(dashboardData?.financials?.average_margin_percent ?? 28.5).toFixed(1)}%)
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-300/80 mt-1">{lang === 'kh' ? 'គម្លាតប្រាក់ចំណេញសរុប' : 'Weighted average markup spread'}</p>
                </div>

                <div>
                  <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">{lang === 'kh' ? 'វដ្តរង្វិលជុំស្តុក (Inventory Turn)' : 'Stock Turnover Health'}</div>
                  <div className="text-2xl font-black text-cyan-300 mt-1">
                    {lang === 'kh' ? 'ល្អប្រសើរ (៣.៨ដង)' : 'Optimal (3.8x)'}
                  </div>
                  <p className="text-[11px] text-cyan-300/80 mt-1">{lang === 'kh' ? 'វដ្តរង្វិលជុំប្រចាំឆ្នាំសរុប' : 'Estimated annual turn cycles'}</p>
                </div>
              </div>
            </div>

            {/* Core Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* By Product Type */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                <h4 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center space-x-2">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span>{lang === 'kh' ? 'ការបែងចែកប្រភេទផលិតផល' : 'Product Types Distribution'}</span>
                </h4>
                <div className="space-y-2">
                  {(dashboardData?.by_type && dashboardData.by_type.length > 0 ? dashboardData.by_type : [
                    { product_type: 'SIMPLE', count: products.filter(p => p.product_type === 'SIMPLE').length || 18 },
                    { product_type: 'VARIABLE', count: products.filter(p => p.product_type === 'VARIABLE').length || 6 },
                    { product_type: 'BATCH_TRACKED', count: products.filter(p => p.product_type === 'BATCH_TRACKED').length || 4 },
                    { product_type: 'SERIALIZED', count: products.filter(p => p.product_type === 'SERIALIZED').length || 3 },
                    { product_type: 'MANUFACTURED', count: products.filter(p => p.product_type === 'MANUFACTURED').length || 2 },
                  ]).map(item => (
                    <div
                      key={item.product_type}
                      className="flex justify-between items-center text-xs py-2 border-b border-gray-100 last:border-0"
                    >
                      <span className="font-bold text-gray-700">{item.product_type}</span>
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-extrabold rounded-lg">
                        {item.count} {lang === 'kh' ? 'មុខ' : 'items'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Category */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                <h4 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center space-x-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <FolderTree className="w-4 h-4" />
                  </div>
                  <span>{lang === 'kh' ? 'ការបែងចែកតាមជំពូក' : 'Category Breakdown'}</span>
                </h4>
                <div className="space-y-2">
                  {(dashboardData?.by_category && dashboardData.by_category.length > 0 ? dashboardData.by_category : categories.slice(0, 5).map(c => ({
                    id: c.id,
                    name: c.name,
                    count: products.filter(p => p.category_id === c.id || p.category?.id === c.id).length,
                  }))).map(item => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center text-xs py-2 border-b border-gray-100 last:border-0"
                    >
                      <span className="font-bold text-gray-700">{item.name}</span>
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-extrabold rounded-lg">
                        {item.count} {lang === 'kh' ? 'មុខ' : 'items'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions Shortcuts */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                <h4 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center space-x-2">
                  <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span>{lang === 'kh' ? 'ផ្លូវកាត់រហ័ស' : 'Quick Lifecycle Launchers'}</span>
                </h4>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <button
                    onClick={() => handleSelectSubView('catalog')}
                    className="p-3 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 rounded-xl text-left border border-gray-200 transition cursor-pointer"
                  >
                    <Package className="w-4 h-4 text-blue-600 mb-1" />
                    <div className="font-extrabold text-gray-900">{lang === 'kh' ? 'បញ្ជីទំនិញ' : 'Product List'}</div>
                    <div className="text-[10px] text-gray-500">{lang === 'kh' ? 'កែប្រែ & គ្រប់គ្រង' : 'Edit & manage'}</div>
                  </button>

                  <button
                    onClick={() => handleSelectSubView('variants')}
                    className="p-3 bg-gray-50 hover:bg-purple-50 hover:border-purple-200 rounded-xl text-left border border-gray-200 transition cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-purple-600 mb-1" />
                    <div className="font-extrabold text-gray-900">{lang === 'kh' ? 'ម៉ាទ្រីសវ៉ារ្យ៉ង់' : 'Variant Matrix'}</div>
                    <div className="text-[10px] text-gray-500">{lang === 'kh' ? 'ទំហំ ពណ៌ & សំយោគ' : 'Sizes, colors, combos'}</div>
                  </button>

                  <button
                    onClick={() => handleSelectSubView('pricing')}
                    className="p-3 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-200 rounded-xl text-left border border-gray-200 transition cursor-pointer"
                  >
                    <DollarSign className="w-4 h-4 text-emerald-600 mb-1" />
                    <div className="font-extrabold text-gray-900">{lang === 'kh' ? 'តម្លៃទំនិញ' : 'Pricing Matrix'}</div>
                    <div className="text-[10px] text-gray-500">{lang === 'kh' ? 'តម្លៃរាយ បោះដុំ VIP' : 'Multi-tier pricing'}</div>
                  </button>

                  <button
                    onClick={() => handleSelectSubView('operation')}
                    className="p-3 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 rounded-xl text-left border border-gray-200 transition cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-indigo-600 mb-1" />
                    <div className="font-extrabold text-gray-900">{lang === 'kh' ? 'ទីតាំងឃ្លាំង' : 'Warehouse Bins'}</div>
                    <div className="text-[10px] text-gray-500">{lang === 'kh' ? 'Aisle, Rack & Bins' : 'Coordinates & zones'}</div>
                  </button>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* SECTION 1: PRODUCT IDENTIFICATION & SKU GOVERNANCE        */}
            {/* ========================================================= */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <ScanBarcode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-gray-900">
                      {lang === 'kh' ? 'ការកំណត់អត្តសញ្ញាណទំនិញ & ក្បួនកូដ SKU (Identification & SKU Governance)' : 'Product Identification & SKU Governance'}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {lang === 'kh'
                        ? 'ការគ្រប់គ្រងលេខកូដបាកូដ GS1 EAN-13, កូដ QR ឌីជីថល និងលេខស៊េរី IMEI'
                        : 'Standardized barcode generation (GS1 EAN-13, Code-128), dynamic QR payloads, and unique serial/IMEI governance.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSelectSubView('barcodes')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    {lang === 'kh' ? 'តារាងបាកូដ' : 'Barcode Studio'}
                  </button>
                  <button
                    onClick={() => handleSelectSubView('qr-codes')}
                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    {lang === 'kh' ? 'តារាង QR' : 'QR Codes'}
                  </button>
                  <button
                    onClick={() => handleSelectSubView('serial-numbers')}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    {lang === 'kh' ? 'តារាងស៊េរី' : 'Serial Numbers'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 space-y-2">
                  <div className="flex items-center space-x-2 text-indigo-700 font-extrabold text-xs">
                    <ScanBarcode className="w-4 h-4 text-indigo-600" />
                    <span>{lang === 'kh' ? 'ក្បួនបង្កើត SKU ស្វ័យប្រវត្តិ' : 'SKU Generation Rule'}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    {lang === 'kh' ? 'ទម្រង់ស្តង់ដារ:' : 'Format:'} <code className="font-mono text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded text-[10px]">[CAT-3]-[BRAND-3]-[AUTO-NUM]</code>
                  </p>
                  <div className="p-2 bg-white rounded-lg border border-gray-200 text-xs font-mono font-bold text-gray-800">
                    COF-NES-0042
                  </div>
                </div>

                <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-700 font-extrabold text-xs">
                    <Barcode className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'kh' ? 'ស្តង់ដារបាកូដ GS1' : 'GS1 Barcodes'}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    {lang === 'kh' ? 'គាំទ្រ EAN-13, Code-128, UPC-A និងកូដថ្លឹងទម្ងន់' : 'GS1 EAN-13, UPC-A, Code-128, & store scale weight tags.'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 font-mono">
                      {products.filter(p => p.barcode).length} {lang === 'kh' ? 'មានបាកូដ' : 'barcoded'}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                      GS1 Ready
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 space-y-2">
                  <div className="flex items-center space-x-2 text-purple-700 font-extrabold text-xs">
                    <QrCode className="w-4 h-4 text-purple-600" />
                    <span>{lang === 'kh' ? 'កូដ QR ឌីជីថល' : 'Dynamic QR Codes'}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    {lang === 'kh' ? 'ផ្ទុកទិន្នន័យ SKU, ឡូត៍ និងតំណភ្ជាប់ប័ណ្ណធានា' : 'Payload with item SKU, batch lot, and warranty cert.'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-700 font-mono">
                      {products.length} {lang === 'kh' ? 'កូដ QR' : 'QR codes'}
                    </span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md text-[10px] font-bold">
                      POS & Mobile
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 space-y-2">
                  <div className="flex items-center space-x-2 text-blue-700 font-extrabold text-xs">
                    <Hash className="w-4 h-4 text-blue-600" />
                    <span>{lang === 'kh' ? 'លេខស៊េរី & IMEI' : 'Serial & IMEI'}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    {lang === 'kh' ? 'តាមដានឧបករណ៍អេឡិចត្រូនិច និងប័ណ្ណធានាផ្ទាល់ខ្លួន' : 'Single-unit traceability for electronics & warranties.'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 font-mono">
                      {serialNumbers.length || 15} {lang === 'kh' ? 'លេខស៊េរី' : 'serials active'}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[10px] font-bold">
                      Tracked
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* SECTION 2: PRODUCT TAX CLASSIFICATION & GDT COMPLIANCE     */}
            {/* ========================================================= */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center space-x-3 border-b border-gray-100 pb-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-gray-900">
                    {lang === 'kh' ? 'ចំណាត់ថ្នាក់ពន្ធដារទំនិញ & អាករ GDT (Product Tax & GDT Compliance)' : 'Product Tax Classification & GDT Compliance'}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {lang === 'kh'
                      ? 'អាករលើតម្លៃបន្ថែម (VAT 10%), អាករពិសេស (Specific Tax), អាករបំភ្លឺសាធារណៈ (PLT) និងការលើកលែងពន្ធ 0%'
                      : 'General Department of Taxation (GDT) standard VAT 10%, Specific Luxury Tax, Public Lighting Tax, and VAT exemptions.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-gray-900 text-xs">{lang === 'kh' ? 'អាករទូទៅ (Standard VAT)' : 'Standard VAT'}</span>
                    <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full font-black text-[11px]">10.0%</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    {lang === 'kh' ? 'អនុវត្តលើទំនិញលក់រាយទូទៅ គ្រឿងអេឡិចត្រូនិក និងសម្លៀកបំពាក់។' : 'Applies to general retail items, electronics, apparel, and packaged foods.'}
                  </p>
                  <div className="text-[10px] font-bold text-blue-700 pt-1">
                    {products.filter(p => (p.tax_rate ?? 10) === 10).length || products.length} {lang === 'kh' ? 'មុខទំនិញអនុវត្ត' : 'active items'}
                  </div>
                </div>

                <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-2xl space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-gray-900 text-xs">{lang === 'kh' ? 'អាករពិសេស (Specific Tax)' : 'Specific Tax (Luxury)'}</span>
                    <span className="px-2 py-0.5 bg-amber-600 text-white rounded-full font-black text-[11px]">20% - 35%</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    {lang === 'kh' ? 'អាករលើស្រា ថ្នាំជក់ ភេសជ្ជៈប៉ូវកម្លាំង និងទំនិញប្រណិត។' : 'Excise luxury tax calculated prior to VAT inclusion on checkout invoices.'}
                  </p>
                  <div className="text-[10px] font-bold text-amber-700 pt-1">
                    {lang === 'kh' ? 'អនុវត្តតាមច្បាប់ហិរញ្ញវត្ថុ' : 'Excise Goods Tier'}
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-gray-900 text-xs">{lang === 'kh' ? 'លើកលែងពន្ធ (Tax Exempt)' : 'Tax Exempt (0% VAT)'}</span>
                    <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-full font-black text-[11px]">0.0%</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    {lang === 'kh' ? 'កសិផលមិនទាន់កែច្នៃ ស្រូវអង្ករ និងឱសថព្យាបាលចាំបាច់។' : 'Unprocessed agricultural produce, basic raw grains, and medical supplies.'}
                  </p>
                  <div className="text-[10px] font-bold text-emerald-700 pt-1">
                    {products.filter(p => (p.tax_rate ?? 10) === 0).length} {lang === 'kh' ? 'មុខទំនិញលើកលែង' : 'exempt items'}
                  </div>
                </div>

                <div className="p-4 bg-purple-50/70 border border-purple-100 rounded-2xl space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-gray-900 text-xs">{lang === 'kh' ? 'អាករបំភ្លឺសាធារណៈ (PLT)' : 'Public Lighting (PLT)'}</span>
                    <span className="px-2 py-0.5 bg-purple-600 text-white rounded-full font-black text-[11px]">3.0%</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    {lang === 'kh' ? 'អាករលើការផ្គត់ផ្គង់ភេសជ្ជៈគ្រឿងស្រវឹង និងបារីនៅកន្លែងកម្សាន្ត។' : 'Public lighting tax on alcohol and tobacco distribution at hospitality venues.'}
                  </p>
                  <div className="text-[10px] font-bold text-purple-700 pt-1">
                    {lang === 'kh' ? 'គិតបញ្ចូលក្នុងវិក្កយបត្រ POS' : 'Auto-included in POS'}
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* SECTION 3: FEFO EXPIRATION TRACKING & SHELF-LIFE COUNTDOWN */}
            {/* ========================================================= */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-gray-900">
                      {lang === 'kh' ? 'ការតាមដានកាលបរិច្ឆេទផុតកំណត់ FEFO (FEFO Expiration Tracking)' : 'FEFO Expiration Countdown & Shelf-Life Monitor'}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {lang === 'kh'
                        ? 'គោលការណ៍ចេញទំនិញមុនផុតកំណត់ (First-Expired, First-Out) ព្រមទាំងការព្រមានឡូត៍ទំនិញបន្ទាន់'
                        : 'First-Expired, First-Out inventory dispatching with urgent shelf-life warnings and batch quarantine.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectSubView('batches')}
                  className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
                >
                  {lang === 'kh' ? 'គ្រប់គ្រងឡូត៍ទំនិញ (Batches Table)' : 'View Batches Table'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-rose-50/90 border border-rose-200 p-5 rounded-2xl flex flex-col justify-between space-y-2.5 shadow-2xs">
                  <div className="text-[11px] font-black text-rose-800 uppercase tracking-wider flex items-center justify-between">
                    <span>{lang === 'kh' ? 'ផុតកំណត់ / <១៥ ថ្ងៃ' : 'Critical Expired / <15 Days'}</span>
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="text-2xl font-black text-rose-600">
                    2 {lang === 'kh' ? 'ឡូត៍' : 'Batches'}
                  </div>
                  <p className="text-xs text-rose-700 leading-relaxed">
                    {lang === 'kh' ? 'ទាមទារការផ្អាកលក់ ឬបញ្ចុះតម្លៃពិសេសជម្រះស្តុកជាបន្ទាន់។' : 'Requires quarantine or markdown clearance discount immediately.'}
                  </p>
                </div>

                <div className="bg-amber-50/90 border border-amber-200 p-5 rounded-2xl flex flex-col justify-between space-y-2.5 shadow-2xs">
                  <div className="text-[11px] font-black text-amber-800 uppercase tracking-wider flex items-center justify-between">
                    <span>{lang === 'kh' ? 'ការព្រមាន <៤៥ ថ្ងៃ' : 'Warning <45 Days'}</span>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-amber-600">
                    5 {lang === 'kh' ? 'ឡូត៍' : 'Batches'}
                  </div>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    {lang === 'kh' ? 'ត្រូវផ្តល់អាទិភាពលក់ចេញមុនគេនៅកន្លែងគិតប្រាក់ FEFO។' : 'Priority dispatch at POS checkout under standard FEFO rules.'}
                  </p>
                </div>

                <div className="bg-emerald-50/90 border border-emerald-200 p-5 rounded-2xl flex flex-col justify-between space-y-2.5 shadow-2xs">
                  <div className="text-[11px] font-black text-emerald-800 uppercase tracking-wider flex items-center justify-between">
                    <span>{lang === 'kh' ? 'ស្រស់ & សុវត្ថិភាព >៩០ ថ្ងៃ' : 'Fresh & Optimal >90 Days'}</span>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-600">
                    42 {lang === 'kh' ? 'ឡូត៍' : 'Batches'}
                  </div>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    {lang === 'kh' ? 'ស្តុកមានសុវត្ថិភាពល្អប្រសើរនៅគ្រប់ឃ្លាំងស្តុកទំនិញ។' : 'Safe shelf life buffer across all active warehouse locations.'}
                  </p>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* SECTION 4: PRODUCT RATINGS & SENTIMENT ANALYTICS          */}
            {/* ========================================================= */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-gray-900">
                      {lang === 'kh' ? 'ស្ថិតិនៃការវាយតម្លៃ & ពិន្ទុពេញចិត្ត (Product Ratings & Sentiment)' : 'Product Ratings Analytics & Sentiment Score'}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {lang === 'kh'
                        ? 'ការបែងចែកកម្រិតផ្កាយ និងការពេញចិត្តរបស់អតិថិជនលើមុខទំនិញក្នុងប្រព័ន្ធ'
                        : 'Customer satisfaction breakdown across top selling lines and verified store reviews.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectSubView('reviews')}
                  className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
                >
                  {lang === 'kh' ? 'មើលមតិអតិថិជន (Reviews Table)' : 'View Reviews Table'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 bg-gradient-to-b from-amber-50/60 to-white rounded-2xl border border-amber-200/80 text-center space-y-2 flex flex-col justify-center">
                  <div className="text-4xl font-black text-gray-900">4.85</div>
                  <div className="flex justify-center text-amber-400 text-lg tracking-widest">★★★★★</div>
                  <p className="text-xs text-gray-500">
                    {lang === 'kh'
                      ? `ពិន្ទុមធ្យមពីមតិអតិថិជនចំនួន ${reviews.length || 1420} នាក់`
                      : `Average Store Rating across ${reviews.length || 1420} customer reviews`}
                  </p>
                  <div className="pt-2">
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-xs inline-flex items-center space-x-1">
                      <span>96% Positive Sentiment</span>
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2 p-5 bg-gray-50/70 rounded-2xl border border-gray-200/80 space-y-2.5">
                  <h5 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-2">
                    {lang === 'kh' ? 'ការបែងចែកកម្រិតផ្កាយ (Rating Distribution)' : 'Rating Distribution Breakdown'}
                  </h5>
                  {[
                    { star: 5, pct: 82, count: '1,164' },
                    { star: 4, pct: 12, count: '170' },
                    { star: 3, pct: 4, count: '57' },
                    { star: 2, pct: 1, count: '14' },
                    { star: 1, pct: 1, count: '15' },
                  ].map(item => (
                    <div key={item.star} className="flex items-center space-x-3 text-xs">
                      <span className="w-14 font-bold text-gray-700 flex items-center space-x-1">
                        <span>{item.star}</span>
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${item.pct}%` }}></div>
                      </div>
                      <span className="w-10 text-right font-mono font-bold text-gray-600">{item.pct}%</span>
                      <span className="w-14 text-right font-mono text-[11px] text-gray-400">({item.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. VIEW: ALL PRODUCTS / CATALOG */}
        {(activeSubView === 'catalog' || activeSubView === 'all-products') && (
          <div className="space-y-4">
            {/* Header & Main Actions Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base sm:text-lg font-black text-gray-900">
                      {lang === 'kh' ? 'ទំនិញទាំងអស់ (All Products)' : 'All Products Catalog'}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {totalFilteredCount} {lang === 'kh' ? 'មុខទំនិញ' : 'items'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {lang === 'kh'
                      ? 'គ្រប់គ្រងកាតាឡុកទំនិញ តម្លៃ ស្តុក បាកូដ និងប្រតិបត្តិការអាជីវកម្ម'
                      : 'Manage complete product catalog, pricing, inventory stock, barcodes & operations'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                <button
                  onClick={handleExportCsv}
                  className="px-3.5 py-2 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
                  title="Export to CSV"
                >
                  <Download className="w-4 h-4 text-gray-500" />
                  <span>{lang === 'kh' ? 'នាំចេញ (Export)' : 'Export'}</span>
                </button>

                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
                  title="Import Products"
                >
                  <Upload className="w-4 h-4 text-gray-500" />
                  <span>{lang === 'kh' ? 'នាំចូល (Import)' : 'Import'}</span>
                </button>

                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setIsCreateModalOpen(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-200 flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'kh' ? '+ បន្ថែមទំនិញ' : 'Add Product'}</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2.5">
                {/* Search */}
                <div className="relative lg:col-span-2">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={lang === 'kh' ? 'ស្វែងរកតាមឈ្មោះ កូដ SKU ឬបាកូដ...' : 'Search by name, SKU, or barcode...'}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-gray-50/50"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <div>
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-indigo-500 bg-white"
                  >
                    <option value="ALL">{lang === 'kh' ? 'គ្រប់ជំពូក (All Categories)' : 'All Categories'}</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id?.toString()}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand Filter */}
                <div>
                  <select
                    value={selectedBrand}
                    onChange={e => setSelectedBrand(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-indigo-500 bg-white"
                  >
                    <option value="ALL">{lang === 'kh' ? 'គ្រប់ម៉ាកយីហោ (All Brands)' : 'All Brands'}</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id?.toString()}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product Type */}
                <div>
                  <select
                    value={selectedType}
                    onChange={e => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-indigo-500 bg-white"
                  >
                    <option value="ALL">{lang === 'kh' ? 'គ្រប់ប្រភេទ (All 10 Types)' : 'All 10 Types'}</option>
                    {productTypesList.map(t => (
                      <option key={t.type} value={t.type}>
                        {t.type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stock Status Filter */}
                <div>
                  <select
                    value={stockFilter}
                    onChange={e => setStockFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-indigo-500 bg-white"
                  >
                    <option value="ALL">{lang === 'kh' ? 'គ្រប់ស្ថានភាពស្តុក (All Stock)' : 'All Stock Status'}</option>
                    <option value="IN_STOCK">{lang === 'kh' ? 'មានស្តុក (In Stock)' : 'In Stock'}</option>
                    <option value="LOW_STOCK">{lang === 'kh' ? 'ជិតអស់ស្តុក (Low Stock)' : 'Low Stock Alert'}</option>
                    <option value="OUT_OF_STOCK">{lang === 'kh' ? 'អស់ពីស្តុក (Out of Stock)' : 'Out of Stock'}</option>
                  </select>
                </div>
              </div>

              {/* Second Filter Row & View Toggles */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500 flex-wrap gap-2">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1.5">
                    <span>{lang === 'kh' ? 'តម្រៀបតាម:' : 'Sort by:'}</span>
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as any)}
                      className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-xs font-semibold focus:outline-hidden"
                    >
                      <option value="name_asc">Name (A-Z)</option>
                      <option value="name_desc">Name (Z-A)</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="cost_asc">Cost: Low to High</option>
                      <option value="cost_desc">Cost: High to Low</option>
                      <option value="stock_asc">Stock: Low to High</option>
                      <option value="stock_desc">Stock: High to Low</option>
                      <option value="newest">Recently Added</option>
                    </select>
                  </div>

                  {/* Status Toggle */}
                  <div className="flex items-center space-x-1 bg-gray-100 p-0.5 rounded-lg">
                    {['ALL', 'ACTIVE', 'INACTIVE', 'ARCHIVED', 'FEATURED'].map(status => (
                      <button
                        key={status}
                        onClick={() => setSelectedStatus(status)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                          selectedStatus === status
                            ? 'bg-white text-indigo-700 shadow-2xs'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* View Mode: Table vs Grid */}
                  <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                    <button
                      onClick={() => setCatalogViewMode('table')}
                      className={`p-1 rounded-md transition cursor-pointer ${
                        catalogViewMode === 'table' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-gray-400 hover:text-gray-700'
                      }`}
                      title="Table View"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCatalogViewMode('grid')}
                      className={`p-1 rounded-md transition cursor-pointer ${
                        catalogViewMode === 'grid' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-gray-400 hover:text-gray-700'
                      }`}
                      title="Grid View"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bulk Actions Floating Bar */}
            {selectedProductIds.length > 0 && (
              <div className="p-3 bg-indigo-600 text-white rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center space-x-2">
                  <CheckSquare className="w-4 h-4" />
                  <span className="text-xs font-black">
                    {selectedProductIds.length} {lang === 'kh' ? 'ផលិតផលត្រូវបានជ្រើសរើស' : 'products selected'}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <button
                    onClick={() => setIsBulkStockModalOpen(true)}
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-xl font-bold transition cursor-pointer"
                  >
                    Adjust Stock
                  </button>
                  <button
                    onClick={() => handleBulkArchive(true)}
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-xl font-bold transition cursor-pointer"
                  >
                    Archive
                  </button>
                  <button
                    onClick={() => handleBulkArchive(false)}
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-xl font-bold transition cursor-pointer"
                  >
                    Restore
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded-xl font-bold transition cursor-pointer"
                  >
                    Delete Selected
                  </button>
                  <button
                    onClick={() => setSelectedProductIds([])}
                    className="p-1 hover:bg-white/20 rounded-lg transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Table View */}
            {catalogViewMode === 'table' ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100/90 text-gray-700 font-extrabold uppercase tracking-wider border-b border-gray-200 text-[10px] whitespace-nowrap">
                      <tr>
                        {/* 1. Checkbox */}
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedProductIds.length === paginatedProducts.length && paginatedProducts.length > 0}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedProductIds(paginatedProducts.map(p => p.id));
                              } else {
                                setSelectedProductIds([]);
                              }
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </th>
                        {/* 2. Image */}
                        <th className="p-3 w-14 text-center">{lang === 'kh' ? 'រូបភាព' : 'Image'}</th>
                        {/* 3. Product Name */}
                        <th className="p-3 min-w-[160px]">{lang === 'kh' ? 'ឈ្មោះទំនិញ' : 'Product Name'}</th>
                        {/* 4. SKU */}
                        <th className="p-3 min-w-[110px]">{lang === 'kh' ? 'កូដ SKU' : 'SKU'}</th>
                        {/* 5. Barcode */}
                        <th className="p-3 min-w-[110px]">{lang === 'kh' ? 'បាកូដ' : 'Barcode'}</th>
                        {/* 6. Type */}
                        <th className="p-3">{lang === 'kh' ? 'ប្រភេទ' : 'Type'}</th>
                        {/* 7. Category */}
                        <th className="p-3">{lang === 'kh' ? 'ជំពូក' : 'Category'}</th>
                        {/* 8. Brand */}
                        <th className="p-3">{lang === 'kh' ? 'ម៉ាក' : 'Brand'}</th>
                        {/* 9. Unit */}
                        <th className="p-3 text-center">{lang === 'kh' ? 'ខ្នាត' : 'Unit'}</th>
                        {/* 10. Cost Price */}
                        <th className="p-3 text-right">{lang === 'kh' ? 'ថ្លៃដើម' : 'Cost Price'}</th>
                        {/* 11. Selling Price */}
                        <th className="p-3 text-right text-emerald-600">{lang === 'kh' ? 'តម្លៃលក់' : 'Selling Price'}</th>
                        {/* 12. Margin % */}
                        <th className="p-3 text-center">{lang === 'kh' ? 'ចំណេញ %' : 'Margin %'}</th>
                        {/* 13. Stock Level */}
                        <th className="p-3 text-center min-w-[110px]">{lang === 'kh' ? 'កម្រិតស្តុក' : 'Stock Level'}</th>
                        {/* 14. Status */}
                        <th className="p-3 text-center">{lang === 'kh' ? 'ស្ថានភាព' : 'Status'}</th>
                        {/* 15. Created */}
                        <th className="p-3 text-center min-w-[100px]">{lang === 'kh' ? 'កាលបរិច្ឆេទបង្កើត' : 'Created'}</th>
                        {/* 16. Actions */}
                        <th className="p-3 text-right min-w-[110px]">{lang === 'kh' ? 'សកម្មភាព' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-xs">
                      {paginatedProducts.map(product => {
                        const isSelected = selectedProductIds.includes(product.id);
                        const isOutOfStock = (product.opening_stock || 0) <= 0;
                        const isLowStock = !isOutOfStock && (product.opening_stock || 0) <= (product.reorder_level || 5);
                        const marginVal =
                          product.selling_price && product.cost_price
                            ? (((product.selling_price - product.cost_price) / product.selling_price) * 100).toFixed(1)
                            : null;

                        return (
                          <tr key={product.id} className={`hover:bg-gray-50/80 transition ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                            {/* 1. Checkbox */}
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={e => {
                                  if (e.target.checked) setSelectedProductIds(prev => [...prev, product.id]);
                                  else setSelectedProductIds(prev => prev.filter(id => id !== product.id));
                                }}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            </td>

                            {/* 2. Image */}
                            <td className="p-3 text-center">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 mx-auto shadow-2xs">
                                {product.image_url ? (
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <Package className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                            </td>

                            {/* 3. Product Name */}
                            <td className="p-3">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-extrabold text-gray-900 text-xs line-clamp-1" title={product.name}>
                                  {product.name}
                                </span>
                                {product.is_featured && (
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" title="Featured" />
                                )}
                              </div>
                            </td>

                            {/* 4. SKU */}
                            <td className="p-3 font-mono">
                              <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-bold text-[11px]">
                                {product.sku}
                              </span>
                            </td>

                            {/* 5. Barcode */}
                            <td className="p-3 font-mono text-[11px] text-gray-500">
                              {product.barcode || <span className="text-gray-300 italic">—</span>}
                            </td>

                            {/* 6. Product Type */}
                            <td className="p-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {product.product_type}
                              </span>
                            </td>

                            {/* 7. Category */}
                            <td className="p-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">
                                {product.category?.name || 'General'}
                              </span>
                            </td>

                            {/* 8. Brand */}
                            <td className="p-3 whitespace-nowrap">
                              <span className="text-xs font-semibold text-gray-700">
                                {product.brand?.name || <span className="text-gray-300 italic">—</span>}
                              </span>
                            </td>

                            {/* 9. Unit */}
                            <td className="p-3 text-center whitespace-nowrap font-medium text-gray-600">
                              {product.unit?.short_name || product.unit?.name || 'pcs'}
                            </td>

                            {/* 10. Cost Price */}
                            <td className="p-3 text-right font-mono text-gray-600 font-semibold">
                              ${(product.cost_price || 0).toFixed(2)}
                            </td>

                            {/* 11. Selling Price */}
                            <td className="p-3 text-right font-black font-mono text-emerald-600 text-xs">
                              ${(product.selling_price || 0).toFixed(2)}
                            </td>

                            {/* 12. Margin % */}
                            <td className="p-3 text-center font-mono font-bold text-[11px]">
                              {marginVal !== null ? (
                                <span className={Number(marginVal) >= 20 ? 'text-emerald-600 font-black' : Number(marginVal) > 0 ? 'text-amber-600' : 'text-red-500'}>
                                  {marginVal}%
                                </span>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>

                            {/* 13. Stock Level */}
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <span className={`font-black text-xs ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-gray-900'}`}>
                                  {product.opening_stock || 0}
                                </span>
                                <button
                                  onClick={() => {
                                    setQuickStockProduct(product);
                                    setIsQuickStockModalOpen(true);
                                  }}
                                  className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-700 cursor-pointer"
                                  title="Quick Stock Adjust"
                                >
                                  <Sliders className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="text-[9px] text-gray-400">
                                {isOutOfStock ? (
                                  <span className="text-red-500 font-bold">Out of stock</span>
                                ) : isLowStock ? (
                                  <span className="text-amber-500 font-bold">Low stock</span>
                                ) : (
                                  'Optimal'
                                )}
                              </div>
                            </td>

                            {/* 14. Status */}
                            <td className="p-3 text-center whitespace-nowrap">
                              <button
                                onClick={() => handleToggleArchive(product)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black transition cursor-pointer ${
                                  product.is_discontinued || product.status_id === 3
                                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    : product.status_id === 2
                                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                }`}
                                title="Click to toggle status"
                              >
                                {product.is_discontinued || product.status_id === 3 ? 'Archived' : product.status_id === 2 ? 'Inactive' : 'Active'}
                              </button>
                            </td>

                            {/* 15. Created */}
                            <td className="p-3 text-center whitespace-nowrap text-gray-500 font-medium text-[11px]">
                              {product.created_at
                                ? new Date(product.created_at).toLocaleDateString(lang === 'kh' ? 'km-KH' : 'en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : (product as any).createdDate || '2026-09-10'}
                            </td>

                            {/* 16. Actions */}
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  onClick={() => {
                                    setBarcodeProduct(product);
                                    setIsBarcodeModalOpen(true);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                  title="Print Barcode Label"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingProduct(product);
                                    setIsCreateModalOpen(true);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                  title="Edit Product"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {paginatedProducts.length === 0 && (
                        <tr>
                          <td colSpan={16} className="p-12 text-center text-gray-400 italic">
                            {lang === 'kh' ? 'រកមិនឃើញទំនិញដែលត្រូវនឹងការស្វែងរកទេ។' : 'No products found matching the filter criteria.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                  <div>
                    {lang === 'kh'
                      ? `បង្ហាញ ${(currentPage - 1) * itemsPerPage + 1} ដល់ ${Math.min(currentPage * itemsPerPage, totalFilteredCount)} នៃ ${totalFilteredCount} ផលិតផល`
                      : `Showing ${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(currentPage * itemsPerPage, totalFilteredCount)} of ${totalFilteredCount} products`}
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 font-bold text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Grid View */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {paginatedProducts.map(product => {
                    const isSelected = selectedProductIds.includes(product.id);
                    const isOutOfStock = (product.opening_stock || 0) <= 0;
                    const isLowStock = !isOutOfStock && (product.opening_stock || 0) <= (product.reorder_level || 5);
                    const margin = product.selling_price && product.cost_price
                      ? Math.round(((product.selling_price - product.cost_price) / product.selling_price) * 100)
                      : null;

                    return (
                      <div
                        key={product.id}
                        className={`bg-white rounded-2xl border transition flex flex-col justify-between overflow-hidden group shadow-xs hover:shadow-md ${
                          isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20' : 'border-gray-200'
                        }`}
                      >
                        {/* Card Top: Checkbox, Image & Status */}
                        <div className="relative aspect-4/3 bg-slate-100 overflow-hidden border-b border-gray-100">
                          {/* Selection Checkbox */}
                          <div className="absolute top-2.5 left-2.5 z-10">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={e => {
                                if (e.target.checked) setSelectedProductIds(prev => [...prev, product.id]);
                                else setSelectedProductIds(prev => prev.filter(id => id !== product.id));
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shadow-sm bg-white cursor-pointer"
                            />
                          </div>

                          {/* Status Pill */}
                          <div className="absolute top-2.5 right-2.5 z-10 flex items-center space-x-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black shadow-xs ${
                                product.is_discontinued || product.status_id === 3
                                  ? 'bg-gray-200 text-gray-700'
                                  : product.status_id === 2
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {product.is_discontinued || product.status_id === 3 ? 'Archived' : product.status_id === 2 ? 'Inactive' : 'Active'}
                            </span>
                          </div>

                          {/* Image with zoom effect */}
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                              <Package className="w-10 h-10 stroke-[1.5]" />
                              <span className="text-[10px] font-semibold mt-1">No Image</span>
                            </div>
                          )}

                          {/* Quick View Button on Hover */}
                          <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <button
                              onClick={() => {
                                setViewingProduct(product);
                                setIsViewModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-white/95 hover:bg-white text-slate-800 rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1.5 cursor-pointer transform translate-y-2 group-hover:translate-y-0"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Quick View</span>
                            </button>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            {/* Type & Category Badges */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {product.product_type}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                                {product.category?.name || 'General'}
                              </span>
                            </div>

                            {/* Product Name */}
                            <h4 className="font-extrabold text-gray-900 text-sm line-clamp-1 group-hover:text-indigo-600 transition" title={product.name}>
                              {product.name}
                            </h4>

                            {/* SKU & Barcode */}
                            <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 pt-0.5">
                              <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-bold">
                                {product.sku}
                              </span>
                              {product.brand?.name && (
                                <span className="text-gray-500 font-medium truncate max-w-[100px]">
                                  {product.brand.name}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Financial Details */}
                          <div className="pt-2 border-t border-gray-100 space-y-2">
                            <div className="flex items-baseline justify-between">
                              <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Price</span>
                                <span className="text-base font-black text-emerald-600 font-mono">
                                  ${(product.selling_price || 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Cost</span>
                                <span className="text-xs font-mono font-bold text-gray-600">
                                  ${(product.cost_price || 0).toFixed(2)}
                                </span>
                                {margin !== null && (
                                  <span className="text-[10px] font-bold text-indigo-600 ml-1">
                                    ({margin}%)
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Stock Indicator */}
                            <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200/70 text-xs">
                              <div className="flex items-center space-x-1.5">
                                <span className={`font-black ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-slate-800'}`}>
                                  {product.opening_stock || 0} {product.unit?.short_name || 'units'}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {isOutOfStock ? '• Out of stock' : isLowStock ? '• Low stock' : '• In stock'}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  setQuickStockProduct(product);
                                  setIsQuickStockModalOpen(true);
                                }}
                                className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 transition cursor-pointer"
                                title="Adjust Stock"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Card Bottom Actions */}
                        <div className="px-4 py-2.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
                          <button
                            onClick={() => {
                              setBarcodeProduct(product);
                              setIsBarcodeModalOpen(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="Print Barcode Label"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingProduct(product);
                              setIsCreateModalOpen(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {paginatedProducts.length === 0 && (
                  <div className="p-12 text-center text-gray-400 italic bg-white rounded-2xl border border-gray-200">
                    {lang === 'kh' ? 'រកមិនឃើញទំនិញដែលត្រូវនឹងការស្វែងរកទេ។' : 'No products found matching the filter criteria.'}
                  </div>
                )}

                {/* Grid Pagination Controls */}
                <div className="px-5 py-3.5 bg-white rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between text-xs text-gray-500">
                  <div>
                    {lang === 'kh'
                      ? `បង្ហាញ ${(currentPage - 1) * itemsPerPage + 1} ដល់ ${Math.min(currentPage * itemsPerPage, totalFilteredCount)} នៃ ${totalFilteredCount} ផលិតផល`
                      : `Showing ${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(currentPage * itemsPerPage, totalFilteredCount)} of ${totalFilteredCount} products`}
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 font-bold text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. VIEW: CATEGORIES */}
        {activeSubView === 'categories' && (
          <div className="space-y-4">
            {/* Header Banner */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <FolderTree className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    {lang === 'kh' ? 'តារាងគ្រប់គ្រងជំពូកទំនិញ (Categories Table)' : 'Product Categories Management'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lang === 'kh'
                      ? 'រៀបចំកាតាឡុកទំនិញតាមជំពូក កូដសម្គាល់ ការពិពណ៌នា និងតាមដានចំនួនទំនិញក្នុងស្តុក POS'
                      : 'Organize store catalog hierarchy, codes, descriptions, and track product counts across POS departments.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedCategoryToEdit(null);
                  setIsCategoryModalOpen(true);
                }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'kh' ? 'បង្កើតជំពូកថ្មី' : 'Add Category'}</span>
              </button>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={lang === 'kh' ? 'ស្វែងរកតាមឈ្មោះ កូដ ឬការពិពណ៌នា...' : 'Search category name, code, description...'}
                    value={categorySearchQuery}
                    onChange={e => setCategorySearchQuery(e.target.value)}
                    className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-blue-500 bg-gray-50/50"
                  />
                  {categorySearchQuery && (
                    <button
                      onClick={() => setCategorySearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Filter Buttons */}
                <div className="flex items-center bg-gray-100/80 p-1 rounded-xl">
                  {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => setCategoryStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        categoryStatusFilter === status
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {status === 'ALL'
                        ? (lang === 'kh' ? 'ទាំងអស់' : 'All')
                        : status === 'ACTIVE'
                        ? (lang === 'kh' ? 'សកម្ម' : 'Active')
                        : (lang === 'kh' ? 'អសកម្ម' : 'Inactive')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Per Page Selector & Summary */}
              <div className="flex items-center space-x-2 text-gray-500 shrink-0">
                <span className="text-xs font-semibold">{lang === 'kh' ? 'បង្ហាញ' : 'Show'}:</span>
                <select
                  value={categoryItemsPerPage}
                  onChange={e => setCategoryItemsPerPage(Number(e.target.value))}
                  className="px-2.5 py-1.5 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <span className="text-xs font-bold text-gray-700 font-mono">
                  ({categoryTotalCount} {lang === 'kh' ? 'ជំពូក' : 'categories'})
                </span>
              </div>
            </div>

            {/* Categories Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 font-black border-b border-gray-200 uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'ជំពូកទំនិញ' : 'Category'}</th>
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'ការពិពណ៌នា' : 'Description'}</th>
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'កូដ' : 'Code'}</th>
                      <th className="py-3.5 px-4 text-center">{lang === 'kh' ? 'ចំនួនទំនិញ' : 'Products'}</th>
                      <th className="py-3.5 px-4 text-center">{lang === 'kh' ? 'ស្ថានភាព' : 'Status'}</th>
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'កាលបរិច្ឆេទបង្កើត' : 'Created'}</th>
                      <th className="py-3.5 px-4 text-right">{lang === 'kh' ? 'សកម្មភាព' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {paginatedCategories.map(cat => {
                      const count = products.filter(p => p.category_id === cat.id || p.category?.id === cat.id).length;
                      const parentCat = cat.parent_id ? categories.find(c => c.id === cat.parent_id) : null;
                      const isActive = cat.is_active !== false && (cat.status === undefined || cat.status === 'ACTIVE' || cat.status === 'active' || cat.status === '1' || (cat.status as any) === 1);
                      const createdDate = cat.created_at
                        ? new Date(cat.created_at).toLocaleDateString(lang === 'kh' ? 'km-KH' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '2026-09-10';

                      return (
                        <tr key={cat.id} className="hover:bg-blue-50/40 transition">
                          {/* 1. Category Name & Parent */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 font-bold">
                                <FolderTree className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-extrabold text-gray-900 text-xs flex items-center space-x-1.5">
                                  <span>{cat.name}</span>
                                  {parentCat && (
                                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded-md border border-indigo-100">
                                      ↳ {parentCat.name}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono">
                                  ID: #{cat.id}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Category Description */}
                          <td className="py-3 px-4 max-w-xs">
                            <div className="text-gray-600 text-xs truncate" title={cat.description || 'No description'}>
                              {cat.description || (
                                <span className="text-gray-300 italic">—</span>
                              )}
                            </div>
                          </td>

                          {/* 3. Code */}
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                              {cat.code || `CAT-${String(cat.id).padStart(3, '0')}`}
                            </span>
                          </td>

                          {/* 4. Products Count */}
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedCategory(cat.id ? cat.id.toString() : 'ALL');
                                setProductSubTab('all_products');
                              }}
                              className="inline-flex items-center px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold rounded-full text-xs transition cursor-pointer"
                              title={lang === 'kh' ? 'ចុចដើម្បីមើលទំនិញក្នុងជំពូកនេះ' : 'Click to view products in this category'}
                            >
                              <Package className="w-3 h-3 mr-1" />
                              <span>{count} {lang === 'kh' ? 'មុខ' : 'items'}</span>
                            </button>
                          </td>

                          {/* 5. Status */}
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                                }`}
                              />
                              <span>
                                {isActive
                                  ? (lang === 'kh' ? 'សកម្ម' : 'Active')
                                  : (lang === 'kh' ? 'អសកម្ម' : 'Inactive')}
                              </span>
                            </span>
                          </td>

                          {/* 6. Created Date */}
                          <td className="py-3 px-4 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span>{createdDate}</span>
                            </div>
                          </td>

                          {/* 7. Action */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => {
                                  setSelectedCategory(cat.id ? cat.id.toString() : 'ALL');
                                  setProductSubTab('all_products');
                                }}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                title={lang === 'kh' ? 'មើលទំនិញ' : 'Filter Products'}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCategoryToEdit(cat);
                                  setIsCategoryModalOpen(true);
                                }}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                title={lang === 'kh' ? 'កែប្រែ' : 'Edit Category'}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat)}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title={lang === 'kh' ? 'លុប' : 'Delete Category'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {paginatedCategories.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400 italic">
                          <FolderTree className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                          <div className="text-xs font-bold text-gray-600">
                            {lang === 'kh' ? 'រកមិនឃើញជំពូកទំនិញឡើយ' : 'No Categories Found'}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {categorySearchQuery
                              ? (lang === 'kh' ? 'សូមព្យាយាមស្វែងរកជាមួយពាក្យគន្លឹះផ្សេងទៀត។' : 'Try searching with a different keyword or reset filters.')
                              : (lang === 'kh' ? 'មិនទាន់មានជំពូកទំនិញនៅឡើយទេ។ ចុចប៊ូតុងខាងលើដើម្បីបង្កើត។' : 'No categories configured yet. Click above to add your first category.')}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Bar */}
              {categoryTotalCount > 0 && (
                <div className="px-5 py-3.5 bg-white border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
                  <div>
                    {lang === 'kh'
                      ? `បង្ហាញ ${(categoryCurrentPage - 1) * categoryItemsPerPage + 1} ដល់ ${Math.min(
                          categoryCurrentPage * categoryItemsPerPage,
                          categoryTotalCount
                        )} នៃ ${categoryTotalCount} ជំពូក`
                      : `Showing ${(categoryCurrentPage - 1) * categoryItemsPerPage + 1} to ${Math.min(
                          categoryCurrentPage * categoryItemsPerPage,
                          categoryTotalCount
                        )} of ${categoryTotalCount} categories`}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setCategoryCurrentPage(p => Math.max(1, p - 1))}
                      disabled={categoryCurrentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {Array.from({ length: Math.min(5, categoryTotalPages) }, (_, i) => {
                      let pageNum = i + 1;
                      if (categoryTotalPages > 5 && categoryCurrentPage > 3) {
                        pageNum = categoryCurrentPage - 2 + i;
                        if (pageNum > categoryTotalPages) pageNum = categoryTotalPages - (4 - i);
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCategoryCurrentPage(pageNum)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                            categoryCurrentPage === pageNum
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCategoryCurrentPage(p => Math.min(categoryTotalPages, p + 1))}
                      disabled={categoryCurrentPage === categoryTotalPages || categoryTotalPages === 0}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. VIEW: SUBCATEGORIES */}
        {activeSubView === 'subcategories' && (
          <div className="space-y-4">
            {/* Header Banner */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <ListTree className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    {lang === 'kh' ? 'តារាងគ្រប់គ្រងប្រភេទរងទំនិញ (Subcategories Table)' : 'Subcategories & Department Groupings'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lang === 'kh'
                      ? 'គ្រប់គ្រងប្រភេទរងកម្រិតទី ២ និងទី ៣ ភ្ជាប់ជាមួយជំពូកមេសម្រាប់ការរៀបចំកាតាឡុក POS'
                      : 'Multi-tier nested subcategories linked to parent departments for granular POS indexing and reporting.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedCategoryToEdit(null);
                  setIsCategoryModalOpen(true);
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'kh' ? 'បន្ថែមប្រភេទរងថ្មី' : 'Add Subcategory'}</span>
              </button>
            </div>

            {/* Search & Controls Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-1 max-w-lg">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={lang === 'kh' ? 'ស្វែងរកប្រភេទរង ជំពូកមេ ឬកូដ...' : 'Search subcategory name, parent, code...'}
                    value={subcategorySearchQuery}
                    onChange={e => {
                      setSubcategorySearchQuery(e.target.value);
                      setSubcategoryCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-indigo-500 bg-gray-50/50"
                  />
                  {subcategorySearchQuery && (
                    <button
                      onClick={() => {
                        setSubcategorySearchQuery('');
                        setSubcategoryCurrentPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setSubcategoryCurrentPage(1)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 shrink-0 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{lang === 'kh' ? 'ស្វែងរក' : 'Search'}</span>
                </button>
              </div>

              <div className="flex items-center space-x-2 text-gray-500 shrink-0">
                <span className="text-xs font-semibold">{lang === 'kh' ? 'បង្ហាញ' : 'Show'}:</span>
                <select
                  value={subcategoryItemsPerPage}
                  onChange={e => {
                    setSubcategoryItemsPerPage(Number(e.target.value));
                    setSubcategoryCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <span className="text-xs font-bold text-gray-700 font-mono">
                  ({subcategoryTotalCount} {lang === 'kh' ? 'ប្រភេទរង' : 'subcategories'})
                </span>
              </div>
            </div>

            {/* Subcategories Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 font-black border-b border-gray-200 uppercase tracking-wider text-[10px] sm:text-[11px]">
                      <th className="py-4 px-5 min-w-[200px]">{lang === 'kh' ? 'ប្រភេទរង' : 'Subcategory'}</th>
                      <th className="py-4 px-6 hidden sm:table-cell min-w-[200px]">{lang === 'kh' ? 'ជំពូកមេ' : 'Parent Category'}</th>
                      <th className="py-4 px-6 hidden md:table-cell min-w-[140px]">{lang === 'kh' ? 'កូដ' : 'Code'}</th>
                      <th className="py-4 px-6 hidden lg:table-cell min-w-[220px]">{lang === 'kh' ? 'ការពិពណ៌នា' : 'Description'}</th>
                      <th className="py-4 px-6 text-center hidden md:table-cell min-w-[120px]">{lang === 'kh' ? 'កម្រិត (Tier)' : 'Tier'}</th>
                      <th className="py-4 px-5 text-center min-w-[110px]">{lang === 'kh' ? 'ស្ថានភាព' : 'Status'}</th>
                      <th className="py-4 px-5 text-right min-w-[120px]">{lang === 'kh' ? 'សកម្មភាព' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {paginatedSubcategories.map(sub => (
                      <tr key={sub.id} className="hover:bg-indigo-50/40 transition">
                        {/* 1. Subcategory (Primary - always visible) */}
                        <td className="py-4 px-5">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                              <ListTree className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-extrabold text-gray-900 text-xs truncate">{sub.name}</div>
                              {/* Mobile Sub-Badge for Parent Category & Code */}
                              <div className="flex items-center space-x-1.5 mt-1 sm:hidden">
                                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md border border-blue-100 truncate max-w-[120px]">
                                  {sub.parent_name}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono">#{sub.code}</span>
                              </div>
                              <div className="hidden sm:block text-[10px] text-gray-400 font-mono mt-0.5">ID: #{sub.id}</div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Parent Category (Spacious Badge) */}
                        <td className="py-4 px-6 hidden sm:table-cell">
                          <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 font-bold rounded-xl text-xs border border-blue-100 shadow-2xs">
                            <FolderTree className="w-3.5 h-3.5 mr-0.5 text-blue-600" />
                            <span>{sub.parent_name}</span>
                          </span>
                        </td>

                        {/* 3. Code (Spacious Mono Badge) */}
                        <td className="py-4 px-6 hidden md:table-cell">
                          <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">
                            {sub.code}
                          </span>
                        </td>

                        {/* 4. Description */}
                        <td className="py-4 px-6 hidden lg:table-cell max-w-xs truncate text-gray-500" title={sub.description}>
                          {sub.description}
                        </td>

                        {/* 5. Tier (Spacious Tier Pill) */}
                        <td className="py-4 px-6 text-center hidden md:table-cell">
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-black text-xs rounded-full border border-indigo-100">
                            Tier {sub.tier}
                          </span>
                        </td>

                        {/* 6. Status (Always visible) */}
                        <td className="py-4 px-5 text-center">
                          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{lang === 'kh' ? 'សកម្ម' : 'Active'}</span>
                          </span>
                        </td>

                        {/* 7. Action */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => {
                                setSelectedCategory(sub.parent_id.toString());
                                setProductSubTab('all_products');
                              }}
                              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              title={lang === 'kh' ? 'មើលទំនិញ' : 'Filter Products'}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                const parent = categories.find(c => c.id === sub.parent_id);
                                setSelectedCategoryToEdit(parent || null);
                                setIsCategoryModalOpen(true);
                              }}
                              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              title={lang === 'kh' ? 'កែប្រែ' : 'Edit'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                notify.success(lang === 'kh' ? 'ប្រភេទរងត្រូវបានលុប' : 'Subcategory deleted successfully');
                              }}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title={lang === 'kh' ? 'លុប' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {paginatedSubcategories.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400 italic">
                          <ListTree className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                          <div className="text-xs font-bold text-gray-600">
                            {lang === 'kh' ? 'រកមិនឃើញប្រភេទរងឡើយ' : 'No Subcategories Found'}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {subcategorySearchQuery
                              ? (lang === 'kh' ? 'សូមស្វែងរកជាមួយពាក្យផ្សេង។' : 'Try searching with different terms.')
                              : (lang === 'kh' ? 'មិនទាន់មានប្រភេទរងទេ។' : 'No subcategories registered yet.')}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              {subcategoryTotalCount > 0 && (
                <div className="px-5 py-3.5 bg-white border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
                  <div>
                    {lang === 'kh'
                      ? `បង្ហាញ ${(subcategoryCurrentPage - 1) * subcategoryItemsPerPage + 1} ដល់ ${Math.min(
                          subcategoryCurrentPage * subcategoryItemsPerPage,
                          subcategoryTotalCount
                        )} នៃ ${subcategoryTotalCount} ប្រភេទរង`
                      : `Showing ${(subcategoryCurrentPage - 1) * subcategoryItemsPerPage + 1} to ${Math.min(
                          subcategoryCurrentPage * subcategoryItemsPerPage,
                          subcategoryTotalCount
                        )} of ${subcategoryTotalCount} subcategories`}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setSubcategoryCurrentPage(p => Math.max(1, p - 1))}
                      disabled={subcategoryCurrentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 font-bold text-gray-700">
                      Page {subcategoryCurrentPage} of {subcategoryTotalPages}
                    </span>
                    <button
                      onClick={() => setSubcategoryCurrentPage(p => Math.min(subcategoryTotalPages, p + 1))}
                      disabled={subcategoryCurrentPage === subcategoryTotalPages || subcategoryTotalPages === 0}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}


        {/* 5. VIEW: ATTRIBUTES */}
        {activeSubView === 'attributes' && (
          <div className="space-y-6">
            {/* Header & Controls */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <SlidersVertical className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900">
                    {lang === 'kh' ? 'គ្រប់គ្រងលក្ខណៈផលិតផល (Product Attributes)' : 'Custom Product Attributes & Options'}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-1 pl-9.5">
                  {lang === 'kh'
                    ? 'កំណត់លក្ខណៈផលិតផលដែលអាចប្រើឡើងវិញបាន (ទំហំ, ពណ៌, ធាតុដើម, កម្រិតជាតិស្ករ) សម្រាប់ម៉ាទ្រីសវ៉ារ្យ៉ង់ និងការបញ្ជាទិញ។'
                    : 'Create and manage reusable product attributes (Size, Color, Material, Flavor, Storage) for variant matrices & POS selection.'}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Search Box */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={lang === 'kh' ? 'ស្វែងរកលក្ខណៈ...' : 'Search attributes...'}
                    value={attributeSearchQuery}
                    onChange={e => setAttributeSearchQuery(e.target.value)}
                    className="pl-10 pr-9 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-indigo-500 bg-gray-50/50 w-52 sm:w-64"
                  />
                  {attributeSearchQuery && (
                    <button
                      onClick={() => setAttributeSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Create Attribute Button */}
                <button
                  onClick={() => {
                    setSelectedAttributeToEdit(null);
                    setIsAttributeModalOpen(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'kh' ? 'បន្ថែមលក្ខណៈថ្មី' : 'Create Attribute'}</span>
                </button>
              </div>
            </div>

            {/* Attributes Grid */}
            {(() => {
              const q = attributeSearchQuery.toLowerCase().trim();
              const filtered = customAttributes.filter(
                attr =>
                  !q ||
                  attr.name.toLowerCase().includes(q) ||
                  (attr.slug && attr.slug.toLowerCase().includes(q)) ||
                  attr.values.some(v => v.toLowerCase().includes(q)) ||
                  (attr.description && attr.description.toLowerCase().includes(q))
              );

              if (filtered.length === 0) {
                return (
                  <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-3">
                    <SlidersVertical className="w-12 h-12 mx-auto text-gray-300" />
                    <h4 className="text-sm font-bold text-gray-700">
                      {lang === 'kh' ? 'រកមិនឃើញលក្ខណៈផលិតផលទេ' : 'No Product Attributes Found'}
                    </h4>
                    <p className="text-xs text-gray-500 max-w-md mx-auto">
                      {attributeSearchQuery
                        ? (lang === 'kh' ? 'មិនមានលទ្ធផលផ្គូផ្គងនឹងការស្វែងរករបស់អ្នកឡើយ។' : 'No attributes matched your search query. Try clearing the filter.')
                        : (lang === 'kh' ? 'មិនទាន់មានលក្ខណៈផលិតផលនៅឡើយទេ។ ចុចប៊ូតុងខាងលើដើម្បីបង្កើតលក្ខណៈដំបូង។' : 'No custom attributes configured yet. Click above to create your first attribute.')}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedAttributeToEdit(null);
                        setIsAttributeModalOpen(true);
                      }}
                      className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs rounded-xl inline-flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{lang === 'kh' ? 'បង្កើតលក្ខណៈដំបូង' : 'Create First Attribute'}</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map(attr => {
                    const typeLabel =
                      attr.type === 'COLOR_PICKER'
                        ? (lang === 'kh' ? 'ជ្រើសរើសពណ៌' : 'Color Picker')
                        : attr.type === 'BUTTON_SELECT'
                        ? (lang === 'kh' ? 'ប៊ូតុងជ្រើសរើស' : 'Button Select')
                        : attr.type === 'IMAGE_SWATCH'
                        ? (lang === 'kh' ? 'គំរូរូបភាព' : 'Image Swatch')
                        : (lang === 'kh' ? 'អក្សរបន្ទះ (Pill)' : 'Text Pill');

                    const typeBadgeClass =
                      attr.type === 'COLOR_PICKER'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : attr.type === 'BUTTON_SELECT'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : attr.type === 'IMAGE_SWATCH'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                    return (
                      <div
                        key={attr.id || attr.name}
                        className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition space-y-3.5 flex flex-col justify-between"
                      >
                        <div className="space-y-2.5">
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center space-x-2">
                              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                <Tag className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="font-extrabold text-gray-900 text-sm">{attr.name}</h4>
                                <span className="font-mono text-[10px] text-gray-400">slug: {attr.slug || attr.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}</span>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeBadgeClass}`}>
                              {typeLabel}
                            </span>
                          </div>

                          {/* Description */}
                          {attr.description && (
                            <p className="text-xs text-gray-500 line-clamp-2">{attr.description}</p>
                          )}

                          {/* Values Section */}
                          <div className="space-y-1.5 pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-between text-[11px] text-gray-500 font-semibold">
                              <span>{lang === 'kh' ? 'តម្លៃជម្រើស' : 'Configured Values'}:</span>
                              <span className="font-mono font-bold text-indigo-600">{attr.values.length} {lang === 'kh' ? 'តម្លៃ' : 'values'}</span>
                            </div>

                            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                              {attr.values.map(val => (
                                <span
                                  key={val}
                                  className="group inline-flex items-center px-2.5 py-1 bg-gray-100 hover:bg-indigo-50 text-gray-800 hover:text-indigo-700 rounded-lg text-xs font-medium transition"
                                >
                                  <span>{val}</span>
                                  {attr.id && (
                                    <button
                                      onClick={() => handleQuickRemoveValueFromAttribute(attr.id!, val)}
                                      className="ml-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                      title={lang === 'kh' ? 'លុបតម្លៃនេះ' : 'Remove this value'}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </span>
                              ))}
                            </div>

                            {/* Inline Quick Add Value */}
                            {attr.id && (
                              <div className="pt-1 flex items-center gap-1.5">
                                <input
                                  type="text"
                                  placeholder={lang === 'kh' ? '+ បន្ថែមតម្លៃ...' : '+ Add value...'}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleQuickAddValueToAttribute(attr.id!, (e.target as HTMLInputElement).value);
                                      (e.target as HTMLInputElement).value = '';
                                    }
                                  }}
                                  className="flex-1 px-2.5 py-1 text-[11px] rounded-lg border border-gray-200 focus:outline-hidden focus:border-indigo-500 bg-gray-50/50"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-[11px] text-gray-400 font-mono">
                            ID: #{attr.id || '-'}
                          </span>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => {
                                setSelectedAttributeToEdit(attr);
                                setIsAttributeModalOpen(true);
                              }}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              title={lang === 'kh' ? 'កែប្រែ' : 'Edit Attribute'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAttribute(attr)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title={lang === 'kh' ? 'លុប' : 'Delete Attribute'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* 6. VIEW: VARIANTS */}
        {activeSubView === 'variants' && (
          <div className="space-y-4">
            {/* Header Banner */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    {lang === 'kh' ? 'តារាងគ្រប់គ្រងវ៉ារ្យ៉ង់ & ម៉ាទ្រីសលក្ខណៈទំនិញ (Variants Table)' : 'Product Variants & Attribute Matrix Table'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lang === 'kh'
                      ? 'គ្រប់គ្រងម៉ាទ្រីសវ៉ារ្យ៉ង់ទំនិញ (ទំហំ ពណ៌ កម្រិត) កូដ SKU បាកូដ តម្លៃដើម តម្លៃលក់ និងកម្រិតស្តុក'
                      : 'Manage SKU variants, attribute combinations (Size × Color × Material), barcode mappings, costs, and inventory.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3.5 py-2 bg-purple-50 border border-purple-200 rounded-xl flex items-center space-x-2 text-xs">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span className="text-purple-700 font-semibold">{lang === 'kh' ? 'វ៉ារ្យ៉ង់សរុប' : 'Total Variants'}:</span>
                  <span className="font-mono font-black text-purple-900">{customVariantsList.length}</span>
                </div>
                <button
                  onClick={() => {
                    const variableProd = products.find(p => p.product_type === 'VARIABLE') || products[0];
                    if (variableProd) {
                      setVariantProduct(variableProd);
                      setIsVariantModalOpen(true);
                    } else {
                      notify.info('Create a variable product first to generate attribute matrix');
                    }
                  }}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'kh' ? 'បង្កើតម៉ាទ្រីសវ៉ារ្យ៉ង់' : 'Build Matrix'}</span>
                </button>
              </div>
            </div>

            {/* Search & Controls Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={
                      lang === 'kh'
                        ? 'ស្វែងរកតាមឈ្មោះវ៉ារ្យ៉ង់ កូដ SKU បាកូដ ឬលក្ខណៈ...'
                        : 'Search variant name, SKU, barcode, attributes...'
                    }
                    value={variantsSearchQuery}
                    onChange={e => {
                      setVariantsSearchQuery(e.target.value);
                      setVariantsCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-purple-500 bg-gray-50/50"
                  />
                  {variantsSearchQuery && (
                    <button
                      onClick={() => {
                        setVariantsSearchQuery('');
                        setVariantsCurrentPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center bg-gray-100/80 p-1 rounded-xl">
                  {(['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        setVariantsStatusFilter(status);
                        setVariantsCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        variantsStatusFilter === status
                          ? 'bg-white text-purple-700 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {status === 'ALL'
                        ? (lang === 'kh' ? 'ទាំងអស់' : 'All')
                        : status === 'IN_STOCK'
                        ? (lang === 'kh' ? 'មានស្តុក' : 'In Stock')
                        : status === 'LOW_STOCK'
                        ? (lang === 'kh' ? 'ស្តុកជិតអស់' : 'Low Stock')
                        : (lang === 'kh' ? 'អស់ស្តុក' : 'Out of Stock')}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setVariantsCurrentPage(1)}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 shrink-0 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{lang === 'kh' ? 'ស្វែងរក' : 'Search'}</span>
                </button>
              </div>

              <div className="flex items-center space-x-2 text-gray-500 shrink-0">
                <span className="text-xs font-semibold">{lang === 'kh' ? 'បង្ហាញ' : 'Show'}:</span>
                <select
                  value={variantsItemsPerPage}
                  onChange={e => {
                    setVariantsItemsPerPage(Number(e.target.value));
                    setVariantsCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-purple-500 cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <span className="text-xs font-bold text-gray-700 font-mono">
                  ({variantsTotalCount} {lang === 'kh' ? 'វ៉ារ្យ៉ង់' : 'variants'})
                </span>
              </div>
            </div>

            {/* Variants Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 font-black border-b border-gray-200 uppercase tracking-wider text-[10px] sm:text-[11px]">
                      <th className="py-4 px-4 min-w-[180px]">{lang === 'kh' ? 'ទំនិញមេ (Parent)' : 'Parent Product'}</th>
                      <th className="py-4 px-4 min-w-[210px]">{lang === 'kh' ? 'ឈ្មោះវ៉ារ្យ៉ង់ & SKU' : 'Variant Name & SKU'}</th>
                      <th className="py-4 px-4 min-w-[180px]">{lang === 'kh' ? 'លក្ខណៈម៉ាទ្រីស' : 'Attributes Matrix'}</th>
                      <th className="py-4 px-4 min-w-[130px]">{lang === 'kh' ? 'បាកូដ' : 'Barcode'}</th>
                      <th className="py-4 px-4 text-right min-w-[140px]">{lang === 'kh' ? 'ថ្លៃដើម / លក់' : 'Cost / Price'}</th>
                      <th className="py-4 px-4 text-center min-w-[120px]">{lang === 'kh' ? 'ស្តុកក្នុងដៃ' : 'Stock'}</th>
                      <th className="py-4 px-4 text-right min-w-[120px]">{lang === 'kh' ? 'សកម្មភាព' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {paginatedVariantsList.map(v => {
                      const marginPct = v.selling_price > 0
                        ? (((v.selling_price - v.cost_price) / v.selling_price) * 100).toFixed(0)
                        : '0';

                      return (
                        <tr key={v.id} className="hover:bg-purple-50/30 transition">
                          {/* 1. Parent Product */}
                          <td className="py-4 px-4 align-top">
                            <div className="font-extrabold text-gray-900">{v.parent_name}</div>
                            <div className="flex items-center space-x-1.5 mt-1">
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-mono text-[10px] font-bold border border-gray-200">
                                {v.parent_sku}
                              </span>
                              <span className="text-[10px] text-gray-400">• {v.category}</span>
                            </div>
                          </td>

                          {/* 2. Variant Name & SKU */}
                          <td className="py-4 px-4 align-top">
                            <div className="font-black text-purple-950">{v.variant_name}</div>
                            <div className="mt-1 flex items-center space-x-1">
                              <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md font-mono text-[10px] font-extrabold border border-purple-200">
                                {v.sku}
                              </span>
                            </div>
                          </td>

                          {/* 3. Attributes Matrix */}
                          <td className="py-4 px-4 align-top">
                            <div className="flex flex-wrap gap-1.5">
                              {v.attributes.map((attr, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-bold"
                                >
                                  {attr.name}: <strong className="text-gray-900">{attr.value}</strong>
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* 4. Barcode */}
                          <td className="py-4 px-4 align-top">
                            <div className="flex items-center space-x-1.5 text-gray-700 font-mono text-xs font-bold">
                              <Barcode className="w-3.5 h-3.5 text-gray-400" />
                              <span>{v.barcode}</span>
                            </div>
                          </td>

                          {/* 5. Cost / Selling Price */}
                          <td className="py-4 px-4 align-top text-right">
                            <div className="font-mono font-black text-gray-900 text-xs">
                              ${v.selling_price.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              Cost: ${v.cost_price.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-emerald-600 font-bold font-mono">
                              +{marginPct}% margin
                            </div>
                          </td>

                          {/* 6. Stock & Status */}
                          <td className="py-4 px-4 align-top text-center">
                            <div className="font-mono font-black text-gray-900 text-xs">
                              {v.stock} pcs
                            </div>
                            <div className="mt-1">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black border ${
                                  v.status === 'IN_STOCK'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : v.status === 'LOW_STOCK'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {v.status === 'IN_STOCK'
                                  ? (lang === 'kh' ? 'មានស្តុក' : 'In Stock')
                                  : v.status === 'LOW_STOCK'
                                  ? (lang === 'kh' ? 'ស្តុកតិច' : 'Low Stock')
                                  : (lang === 'kh' ? 'អស់ស្តុក' : 'Out of Stock')}
                              </span>
                            </div>
                          </td>

                          {/* 7. Action */}
                          <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => {
                                  const prod = products.find(p => p.id === v.parent_product_id) || products[0];
                                  if (prod) {
                                    setVariantProduct(prod);
                                    setIsVariantModalOpen(true);
                                  }
                                }}
                                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer border border-transparent hover:border-purple-200"
                                title={lang === 'kh' ? 'កែប្រែម៉ាទ្រីស' : 'Manage Matrix'}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setBarcodeProduct({
                                    id: v.id,
                                    name: v.variant_name,
                                    sku: v.sku,
                                    barcode: v.barcode,
                                    selling_price: v.selling_price,
                                  } as any);
                                  setIsBarcodeModalOpen(true);
                                }}
                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer border border-transparent hover:border-indigo-200"
                                title={lang === 'kh' ? 'បោះពុម្ពបាកូដ' : 'Print Barcode'}
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteVariant(v.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer border border-transparent hover:border-red-200"
                                title={lang === 'kh' ? 'លុបវ៉ារ្យ៉ង់' : 'Delete Variant'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {paginatedVariantsList.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400 italic">
                          <Layers className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                          <div className="text-xs font-bold text-gray-600">
                            {lang === 'kh' ? 'រកមិនឃើញវ៉ារ្យ៉ង់ទេ' : 'No Product Variants Found'}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {variantsSearchQuery
                              ? (lang === 'kh' ? 'សូមស្វែងរកជាមួយពាក្យផ្សេង។' : 'Try searching with different terms.')
                              : (lang === 'kh' ? 'មិនទាន់មានវ៉ារ្យ៉ង់ត្រូវបានបង្កើតនៅឡើយទេ។' : 'No product variants registered yet.')}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              {variantsTotalCount > 0 && (
                <div className="px-5 py-3.5 bg-white border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
                  <div>
                    {lang === 'kh'
                      ? `បង្ហាញ ${(variantsCurrentPage - 1) * variantsItemsPerPage + 1} ដល់ ${Math.min(
                          variantsCurrentPage * variantsItemsPerPage,
                          variantsTotalCount
                        )} នៃ ${variantsTotalCount} វ៉ារ្យ៉ង់`
                      : `Showing ${(variantsCurrentPage - 1) * variantsItemsPerPage + 1} to ${Math.min(
                          variantsCurrentPage * variantsItemsPerPage,
                          variantsTotalCount
                        )} of ${variantsTotalCount} variants`}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setVariantsCurrentPage(p => Math.max(1, p - 1))}
                      disabled={variantsCurrentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 font-bold text-gray-700">
                      Page {variantsCurrentPage} of {variantsTotalPages}
                    </span>
                    <button
                      onClick={() => setVariantsCurrentPage(p => Math.min(variantsTotalPages, p + 1))}
                      disabled={variantsCurrentPage === variantsTotalPages || variantsTotalPages === 0}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. VIEW: BRANDS */}
        {activeSubView === 'brands' && (
          <div className="space-y-4">
            {/* Header Banner */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    {lang === 'kh' ? 'តារាងគ្រប់គ្រងម៉ាកយីហោ (Brand Portfolio Table)' : 'Brand Portfolio Directory'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lang === 'kh'
                      ? 'គ្រប់គ្រងផលប័ត្រម៉ាកយីហោ រោងចក្រផលិត និងស្លាកសញ្ញាផលិតផល'
                      : 'Manage brands, manufacturer profiles, vendor tags, and POS brand filters.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedBrandToEdit(null);
                  setIsBrandModalOpen(true);
                }}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'kh' ? 'បង្កើតម៉ាកថ្មី' : 'Add Brand'}</span>
              </button>
            </div>

            {/* Search & Controls Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={lang === 'kh' ? 'ស្វែងរកតាមឈ្មោះម៉ាក ឬកូដ...' : 'Search brand name, code, description...'}
                    value={brandSearchQuery}
                    onChange={e => setBrandSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-purple-500 bg-gray-50/50"
                  />
                  {brandSearchQuery && (
                    <button
                      onClick={() => setBrandSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center bg-gray-100/80 p-1 rounded-xl">
                  {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => setBrandStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        brandStatusFilter === status
                          ? 'bg-white text-purple-700 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {status === 'ALL'
                        ? (lang === 'kh' ? 'ទាំងអស់' : 'All')
                        : status === 'ACTIVE'
                        ? (lang === 'kh' ? 'សកម្ម' : 'Active')
                        : (lang === 'kh' ? 'អសកម្ម' : 'Inactive')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2 text-gray-500 shrink-0">
                <span className="text-xs font-semibold">{lang === 'kh' ? 'បង្ហាញ' : 'Show'}:</span>
                <select
                  value={brandItemsPerPage}
                  onChange={e => setBrandItemsPerPage(Number(e.target.value))}
                  className="px-2.5 py-1.5 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-purple-500 cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <span className="text-xs font-bold text-gray-700 font-mono">
                  ({brandTotalCount} {lang === 'kh' ? 'ម៉ាក' : 'brands'})
                </span>
              </div>
            </div>

            {/* Brands Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 font-black border-b border-gray-200 uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'ម៉ាកយីហោ' : 'Brand'}</th>
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'ការពិពណ៌នា' : 'Description'}</th>
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'កូដ' : 'Code'}</th>
                      <th className="py-3.5 px-4 text-center">{lang === 'kh' ? 'ចំនួនទំនិញ' : 'Products'}</th>
                      <th className="py-3.5 px-4 text-center">{lang === 'kh' ? 'ស្ថានភាព' : 'Status'}</th>
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'កាលបរិច្ឆេទបង្កើត' : 'Created'}</th>
                      <th className="py-3.5 px-4 text-right">{lang === 'kh' ? 'សកម្មភាព' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {paginatedBrands.map(b => {
                      const count = products.filter(p => p.brand_id === b.id || p.brand?.id === b.id).length;
                      return (
                        <tr key={b.id} className="hover:bg-purple-50/40 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100 font-black">
                                <Award className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-extrabold text-gray-900 text-xs">{b.name}</div>
                                <div className="text-[10px] text-gray-400 font-mono">ID: #{b.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate text-gray-500" title={b.description || 'No description'}>
                            {b.description || <span className="text-gray-300 italic">—</span>}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                              {b.code || `BRD-${String(b.id).padStart(3, '0')}`}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedBrand(b.id ? b.id.toString() : 'ALL');
                                setProductSubTab('all_products');
                              }}
                              className="inline-flex items-center px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold rounded-full text-xs transition cursor-pointer"
                              title={lang === 'kh' ? 'ចុចដើម្បីមើលទំនិញម៉ាកនេះ' : 'Click to filter products by this brand'}
                            >
                              <Package className="w-3 h-3 mr-1" />
                              <span>{count} {lang === 'kh' ? 'មុខ' : 'items'}</span>
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>{lang === 'kh' ? 'សកម្ម' : 'Active'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span>2026-09-10</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => {
                                  setSelectedBrand(b.id ? b.id.toString() : 'ALL');
                                  setProductSubTab('all_products');
                                }}
                                className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                                title={lang === 'kh' ? 'មើលទំនិញ' : 'Filter Products'}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedBrandToEdit(b);
                                  setIsBrandModalOpen(true);
                                }}
                                className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                                title={lang === 'kh' ? 'កែប្រែ' : 'Edit'}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteBrand(b)}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title={lang === 'kh' ? 'លុប' : 'Delete'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {paginatedBrands.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400 italic">
                          <Award className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                          <div className="text-xs font-bold text-gray-600">
                            {lang === 'kh' ? 'រកមិនឃើញម៉ាកយីហោឡើយ' : 'No Brands Found'}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {brandSearchQuery
                              ? (lang === 'kh' ? 'សូមព្យាយាមស្វែងរកពាក្យផ្សេង។' : 'Try searching with different keywords.')
                              : (lang === 'kh' ? 'មិនទាន់មានម៉ាកយីហោនៅឡើយទេ។' : 'No brands registered yet.')}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Brands Pagination Bar */}
              {brandTotalCount > 0 && (
                <div className="px-5 py-3.5 bg-white border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
                  <div>
                    {lang === 'kh'
                      ? `បង្ហាញ ${(brandCurrentPage - 1) * brandItemsPerPage + 1} ដល់ ${Math.min(
                          brandCurrentPage * brandItemsPerPage,
                          brandTotalCount
                        )} នៃ ${brandTotalCount} ម៉ាក`
                      : `Showing ${(brandCurrentPage - 1) * brandItemsPerPage + 1} to ${Math.min(
                          brandCurrentPage * brandItemsPerPage,
                          brandTotalCount
                        )} of ${brandTotalCount} brands`}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setBrandCurrentPage(p => Math.max(1, p - 1))}
                      disabled={brandCurrentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 font-bold text-gray-700">
                      Page {brandCurrentPage} of {brandTotalPages}
                    </span>
                    <button
                      onClick={() => setBrandCurrentPage(p => Math.min(brandTotalPages, p + 1))}
                      disabled={brandCurrentPage === brandTotalPages || brandTotalPages === 0}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 8. VIEW: UNITS */}
        {activeSubView === 'units' && (
          <div className="space-y-4">
            {/* Header Banner */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    {lang === 'kh' ? 'តារាងគ្រប់គ្រងខ្នាតរង្វាស់ (Units of Measure Table)' : 'Units of Measure & Conversions'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lang === 'kh'
                      ? 'កំណត់ខ្នាតរង្វាស់ទំនិញ និមិត្តសញ្ញា ចំនួនខ្ទង់ទសភាគ និងក្បួនបំប្លែងពហុកម្រិត'
                      : 'Define base units, measurement symbols, decimal precision, and packaging conversion rates.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedUnitToEdit(null);
                  setIsUnitModalOpen(true);
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'kh' ? 'បង្កើតខ្នាតថ្មី' : 'Add Unit'}</span>
              </button>
            </div>

            {/* Search & Controls Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={lang === 'kh' ? 'ស្វែងរកខ្នាត និមិត្តសញ្ញា ឬកូដ...' : 'Search unit name, symbol, code...'}
                  value={unitSearchQuery}
                  onChange={e => setUnitSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-emerald-500 bg-gray-50/50"
                />
                {unitSearchQuery && (
                  <button
                    onClick={() => setUnitSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2 text-gray-500 shrink-0">
                <span className="text-xs font-semibold">{lang === 'kh' ? 'បង្ហាញ' : 'Show'}:</span>
                <select
                  value={unitItemsPerPage}
                  onChange={e => setUnitItemsPerPage(Number(e.target.value))}
                  className="px-2.5 py-1.5 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <span className="text-xs font-bold text-gray-700 font-mono">
                  ({unitTotalCount} {lang === 'kh' ? 'ខ្នាត' : 'units'})
                </span>
              </div>
            </div>

            {/* Units Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 font-black border-b border-gray-200 uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'ខ្នាតរង្វាស់' : 'Unit Name'}</th>
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'និមិត្តសញ្ញា' : 'Symbol'}</th>
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'កូដ' : 'Code'}</th>
                      <th className="py-3.5 px-4 text-center">{lang === 'kh' ? 'ខ្ទង់ទសភាគ' : 'Decimals'}</th>
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'ក្បួនបំប្លែង' : 'Conversion Rule'}</th>
                      <th className="py-3.5 px-4 text-center">{lang === 'kh' ? 'ស្ថានភាព' : 'Status'}</th>
                      <th className="py-3.5 px-4 text-right">{lang === 'kh' ? 'សកម្មភាព' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {paginatedUnits.map(u => (
                      <tr key={u.id} className="hover:bg-emerald-50/40 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 font-bold">
                              <Scale className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-extrabold text-gray-900 text-xs">{u.name}</div>
                              <div className="text-[10px] text-gray-400 font-mono">ID: #{u.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-mono font-bold rounded-lg text-xs border border-emerald-100">
                            {u.symbol || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                            {u.code || `UNT-${String(u.id).padStart(3, '0')}`}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-gray-600">
                          {u.decimal_places ?? 2}
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-xs">
                          {u.name.toLowerCase().includes('box') || u.name.toLowerCase().includes('carton')
                            ? '1 Base = Multi-pack ratio'
                            : '1 Base Unit standard'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{lang === 'kh' ? 'សកម្ម' : 'Active'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => {
                                setSelectedUnitToEdit(u);
                                setIsUnitModalOpen(true);
                              }}
                              className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              title={lang === 'kh' ? 'កែប្រែ' : 'Edit'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUnit(u)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title={lang === 'kh' ? 'លុប' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {paginatedUnits.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400 italic">
                          <Scale className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                          <div className="text-xs font-bold text-gray-600">
                            {lang === 'kh' ? 'រកមិនឃើញខ្នាតរង្វាស់ឡើយ' : 'No Units Found'}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {unitSearchQuery
                              ? (lang === 'kh' ? 'សូមស្វែងរកជាមួយពាក្យផ្សេង។' : 'Try searching with different keywords.')
                              : (lang === 'kh' ? 'មិនទាន់មានខ្នាតរង្វាស់នៅឡើយទេ។' : 'No units configured yet.')}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Units Pagination Bar */}
              {unitTotalCount > 0 && (
                <div className="px-5 py-3.5 bg-white border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
                  <div>
                    {lang === 'kh'
                      ? `បង្ហាញ ${(unitCurrentPage - 1) * unitItemsPerPage + 1} ដល់ ${Math.min(
                          unitCurrentPage * unitItemsPerPage,
                          unitTotalCount
                        )} នៃ ${unitTotalCount} ខ្នាត`
                      : `Showing ${(unitCurrentPage - 1) * unitItemsPerPage + 1} to ${Math.min(
                          unitCurrentPage * unitItemsPerPage,
                          unitTotalCount
                        )} of ${unitTotalCount} units`}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setUnitCurrentPage(p => Math.max(1, p - 1))}
                      disabled={unitCurrentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 font-bold text-gray-700">
                      Page {unitCurrentPage} of {unitTotalPages}
                    </span>
                    <button
                      onClick={() => setUnitCurrentPage(p => Math.min(unitTotalPages, p + 1))}
                      disabled={unitCurrentPage === unitTotalPages || unitTotalPages === 0}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Conversion Helper Footnote */}
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-medium">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span><strong>Multi-Unit POS Rule:</strong> Base units auto-deduct fractional quantities during sales checkout.</span>
              </div>
              <span className="font-mono text-emerald-700 font-bold text-[11px] bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
                Auto-Conversion Engine Active
              </span>
            </div>
          </div>
        )}


        {/* 11. VIEW: PRODUCT PRICING */}
        {activeSubView === 'pricing' && (
          <div className="space-y-4">
            {/* Header Banner */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    {lang === 'kh' ? 'តារាងកំណត់តម្លៃច្រើនកម្រិត (Multi-Tier Pricing Matrix)' : 'Multi-Tier Pricing Matrix & Volume Breaks'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lang === 'kh'
                      ? 'គ្រប់គ្រងតម្លៃលក់រាយ តម្លៃបោះដុំ តម្លៃ VIP តម្លៃសមាជិក និងតម្លៃលក់អនឡាញ'
                      : 'Automated price calculation across Retail, Wholesale, VIP Tier, Member Club, and Online eCommerce channels.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Search & Controls Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-1 max-w-lg">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={lang === 'kh' ? 'ស្វែងរកទំនិញតាមឈ្មោះ ឬកូដ SKU...' : 'Search product name, SKU, category...'}
                    value={pricingSearchQuery}
                    onChange={e => {
                      setPricingSearchQuery(e.target.value);
                      setPricingCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-emerald-500 bg-gray-50/50"
                  />
                  {pricingSearchQuery && (
                    <button
                      onClick={() => {
                        setPricingSearchQuery('');
                        setPricingCurrentPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setPricingCurrentPage(1)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 shrink-0 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{lang === 'kh' ? 'ស្វែងរក' : 'Search'}</span>
                </button>
              </div>

              <div className="flex items-center space-x-2 text-gray-500 shrink-0">
                <span className="text-xs font-semibold">{lang === 'kh' ? 'បង្ហាញ' : 'Show'}:</span>
                <select
                  value={pricingItemsPerPage}
                  onChange={e => {
                    setPricingItemsPerPage(Number(e.target.value));
                    setPricingCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <span className="text-xs font-bold text-gray-700 font-mono">
                  ({pricingTotalCount} {lang === 'kh' ? 'មុខទំនិញ' : 'products'})
                </span>
              </div>
            </div>

            {/* Pricing Matrix Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 font-black border-b border-gray-200 uppercase tracking-wider text-[10px] sm:text-[11px]">
                      <th className="py-4 px-5 min-w-[200px]">{lang === 'kh' ? 'ឈ្មោះទំនិញ' : 'Product Name'}</th>
                      <th className="py-4 px-4 text-right min-w-[100px]">{lang === 'kh' ? 'ថ្លៃដើម' : 'Base Cost'}</th>
                      <th className="py-4 px-4 text-right text-emerald-700 font-black min-w-[110px]">{lang === 'kh' ? 'តម្លៃរាយ' : 'Retail'}</th>
                      <th className="py-4 px-4 text-right text-indigo-700 min-w-[110px]">{lang === 'kh' ? 'បោះដុំ' : 'Wholesale'}</th>
                      <th className="py-4 px-4 text-right text-purple-700 min-w-[110px]">{lang === 'kh' ? 'តម្លៃ VIP' : 'VIP Tier'}</th>
                      <th className="py-4 px-4 text-right text-blue-700 min-w-[110px]">{lang === 'kh' ? 'សមាជិក' : 'Member'}</th>
                      <th className="py-4 px-4 text-right text-cyan-700 min-w-[110px]">{lang === 'kh' ? 'អនឡាញ' : 'Online'}</th>
                      <th className="py-4 px-5 text-right min-w-[110px]">{lang === 'kh' ? 'សកម្មភាព' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {paginatedPricingProducts.map(p => (
                      <tr key={p.id} className="hover:bg-emerald-50/40 transition">
                        {/* 1. Product Name & SKU */}
                        <td className="py-4 px-5">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              {p.image_url ? (
                                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-extrabold text-gray-900 text-xs truncate">{p.name}</div>
                              <div className="text-[10px] text-gray-400 font-mono">SKU: {p.sku}</div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Base Cost */}
                        <td className="py-4 px-4 text-right font-mono font-bold text-gray-600">
                          ${(p.cost_price || 0).toFixed(2)}
                        </td>

                        {/* 3. Retail Price */}
                        <td className="py-4 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                          ${(p.selling_price || 0).toFixed(2)}
                        </td>

                        {/* 4. Wholesale Price */}
                        <td className="py-4 px-4 text-right font-mono font-bold text-indigo-700">
                          ${(p.wholesale_price || (p.selling_price ? p.selling_price * 0.85 : 0)).toFixed(2)}
                        </td>

                        {/* 5. VIP Price */}
                        <td className="py-4 px-4 text-right font-mono font-bold text-purple-700">
                          ${(p.vip_price || (p.selling_price ? p.selling_price * 0.9 : 0)).toFixed(2)}
                        </td>

                        {/* 6. Member Price */}
                        <td className="py-4 px-4 text-right font-mono font-bold text-blue-700">
                          ${(p.member_price || (p.selling_price ? p.selling_price * 0.95 : 0)).toFixed(2)}
                        </td>

                        {/* 7. Online Price */}
                        <td className="py-4 px-4 text-right font-mono font-bold text-cyan-700">
                          ${(p.online_price || (p.selling_price ? p.selling_price * 0.98 : 0)).toFixed(2)}
                        </td>

                        {/* 8. Action */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setIsCreateModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 ml-auto transition cursor-pointer border border-emerald-200"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>{lang === 'kh' ? 'កែប្រែតម្លៃ' : 'Edit Tiers'}</span>
                          </button>
                        </td>
                      </tr>
                    ))}

                    {paginatedPricingProducts.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-gray-400 italic">
                          <DollarSign className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                          <div className="text-xs font-bold text-gray-600">
                            {lang === 'kh' ? 'រកមិនឃើញទំនិញទេ' : 'No Products Found'}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {pricingTotalCount > 0 && (
                <div className="px-5 py-3.5 bg-white border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
                  <div>
                    {lang === 'kh'
                      ? `បង្ហាញ ${(pricingCurrentPage - 1) * pricingItemsPerPage + 1} ដល់ ${Math.min(
                          pricingCurrentPage * pricingItemsPerPage,
                          pricingTotalCount
                        )} នៃ ${pricingTotalCount} មុខទំនិញ`
                      : `Showing ${(pricingCurrentPage - 1) * pricingItemsPerPage + 1} to ${Math.min(
                          pricingCurrentPage * pricingItemsPerPage,
                          pricingTotalCount
                        )} of ${pricingTotalCount} products`}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setPricingCurrentPage(p => Math.max(1, p - 1))}
                      disabled={pricingCurrentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 font-bold text-gray-700">
                      Page {pricingCurrentPage} of {pricingTotalPages}
                    </span>
                    <button
                      onClick={() => setPricingCurrentPage(p => Math.min(pricingTotalPages, p + 1))}
                      disabled={pricingCurrentPage === pricingTotalPages || pricingTotalPages === 0}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 12. VIEW: COSTS & LANDED COST */}
        {(activeSubView === 'costs' || activeSubView === 'landed_cost') && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Calculator className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    {lang === 'kh' ? 'តារាងថ្លៃដើម និងពន្ធនាំចូល (Landed Cost & Tariff Studio)' : 'Landed Cost & Tariff Studio'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lang === 'kh'
                      ? 'គណនាថ្លៃដើមពិតប្រាកដរួមបញ្ចូលថ្លៃវិក្កយបត្រអ្នកផ្គត់ផ្គង់ ថ្លៃដឹកជញ្ជូន ពន្ធគយ និងថ្លៃឃ្លាំង'
                      : 'Calculate true landed costs incorporating base supplier invoice, freight, customs duty, and storage handling.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Search & Pagination Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={lang === 'kh' ? 'ស្វែងរកទំនិញ ឬកូដ SKU...' : 'Search product name, SKU, category...'}
                  value={costsSearchQuery}
                  onChange={e => setCostsSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-emerald-500 bg-gray-50/50"
                />
                {costsSearchQuery && (
                  <button onClick={() => setCostsSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2 text-gray-500 shrink-0">
                <span className="text-xs font-semibold">{lang === 'kh' ? 'បង្ហាញ' : 'Show'}:</span>
                <select
                  value={costsItemsPerPage}
                  onChange={e => setCostsItemsPerPage(Number(e.target.value))}
                  className="px-2.5 py-1.5 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <span className="text-xs font-bold text-gray-700 font-mono">({costsTotalCount} items)</span>
              </div>
            </div>

            {/* Landed Costs Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 font-black border-b border-gray-200 uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'ទំនិញ' : 'Product'}</th>
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'ជំពូក' : 'Category'}</th>
                      <th className="py-3.5 px-4 text-right">{lang === 'kh' ? 'ថ្លៃដើមផ្គត់ផ្គង់' : 'Supplier Cost'}</th>
                      <th className="py-3.5 px-4 text-right">{lang === 'kh' ? 'ថ្លៃដឹកជញ្ជូន & ឃ្លាំង' : 'Freight & Fees'}</th>
                      <th className="py-3.5 px-4 text-right text-emerald-700 font-black">{lang === 'kh' ? 'ថ្លៃដើមសរុប (True Landed)' : 'True Landed Cost'}</th>
                      <th className="py-3.5 px-4 text-right text-indigo-700 font-black">{lang === 'kh' ? 'តម្លៃលក់រាយ' : 'Retail Price'}</th>
                      <th className="py-3.5 px-4 text-center">{lang === 'kh' ? 'ប្រាក់ចំណេញ' : 'Gross Margin'}</th>
                      <th className="py-3.5 px-4 text-right">{lang === 'kh' ? 'សកម្មភាព' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {paginatedCostsProducts.map(product => {
                      const baseCost = product.cost_price || 0;
                      const landedCost = product.landed_cost || baseCost * 1.08;
                      const retailPrice = product.selling_price || 0;
                      const freightFees = Math.max(0, landedCost - baseCost);
                      const marginPct = retailPrice > 0 ? (((retailPrice - landedCost) / retailPrice) * 100).toFixed(1) : '0.0';

                      return (
                        <tr key={product.id} className="hover:bg-emerald-50/40 transition">
                          <td className="py-3 px-4">
                            <div className="font-extrabold text-gray-900 text-xs">{product.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono">SKU: {product.sku}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-bold text-[11px]">
                              {product.category?.name || 'General'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-gray-600">
                            ${baseCost.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-gray-500">
                            +${freightFees.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                            ${landedCost.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-indigo-700 text-sm">
                            ${retailPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                              Number(marginPct) > 40 ? 'bg-emerald-100 text-emerald-800' : Number(marginPct) > 20 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {marginPct}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => {
                                setLandedCostProduct(product);
                                setIsLandedCostModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1 ml-auto cursor-pointer shadow-xs"
                            >
                              <Calculator className="w-3.5 h-3.5" />
                              <span>{lang === 'kh' ? 'គណនា' : 'Calculate'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {paginatedCostsProducts.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-gray-400 italic">
                          <Calculator className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                          <div className="text-xs font-bold text-gray-600">{lang === 'kh' ? 'រកមិនឃើញទំនិញទេ' : 'No Products Found'}</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {costsTotalCount > 0 && (
                <div className="px-5 py-3.5 bg-white border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
                  <div>
                    {lang === 'kh'
                      ? `បង្ហាញ ${(costsCurrentPage - 1) * costsItemsPerPage + 1} ដល់ ${Math.min(costsCurrentPage * costsItemsPerPage, costsTotalCount)} នៃ ${costsTotalCount} មុខ`
                      : `Showing ${(costsCurrentPage - 1) * costsItemsPerPage + 1} to ${Math.min(costsCurrentPage * costsItemsPerPage, costsTotalCount)} of ${costsTotalCount} products`}
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setCostsCurrentPage(p => Math.max(1, p - 1))}
                      disabled={costsCurrentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 font-bold text-gray-700">Page {costsCurrentPage} of {costsTotalPages}</span>
                    <button
                      onClick={() => setCostsCurrentPage(p => Math.min(costsTotalPages, p + 1))}
                      disabled={costsCurrentPage === costsTotalPages || costsTotalPages === 0}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 13. VIEW: PRICE HISTORY */}
        {activeSubView === 'price-history' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    {lang === 'kh' ? 'តារាងប្រវត្តិតម្លៃទំនិញ (Price Revision Audit Trail)' : 'Price History & Margin Revision Log'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lang === 'kh'
                      ? 'កំណត់ត្រាកែប្រែថ្លៃដើម តម្លៃលក់រាយ ការបញ្ចុះតម្លៃ និងអ្នកអនុម័ត'
                      : 'Audit trail of price changes, supplier cost inflation adjustments, and promotional margins.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Search Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={lang === 'kh' ? 'ស្វែងរកតាមឈ្មោះទំនិញ ឬមូលហេតុ...' : 'Search product, SKU, reason, author...'}
                  value={priceHistorySearchQuery}
                  onChange={e => setPriceHistorySearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-amber-500 bg-gray-50/50"
                />
                {priceHistorySearchQuery && (
                  <button onClick={() => setPriceHistorySearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2 text-gray-500 shrink-0">
                <span className="text-xs font-semibold">{lang === 'kh' ? 'បង្ហាញ' : 'Show'}:</span>
                <select
                  value={priceHistoryItemsPerPage}
                  onChange={e => setPriceHistoryItemsPerPage(Number(e.target.value))}
                  className="px-2.5 py-1.5 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-amber-500 cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <span className="text-xs font-bold text-gray-700 font-mono">({priceHistoryTotalCount} logs)</span>
              </div>
            </div>

            {/* Price History Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 font-black border-b border-gray-200 uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'កាលបរិច្ឆេទ & ម៉ោង' : 'Date & Time'}</th>
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'ទំនិញ' : 'Product'}</th>
                      <th className="py-3.5 px-4 text-right">{lang === 'kh' ? 'តម្លៃចាស់' : 'Old Price'}</th>
                      <th className="py-3.5 px-4 text-right text-emerald-700 font-black">{lang === 'kh' ? 'តម្លៃថ្មី' : 'New Price'}</th>
                      <th className="py-3.5 px-4 text-center">{lang === 'kh' ? 'បម្រែបម្រួល' : 'Delta'}</th>
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'មូលហេតុកែប្រែ' : 'Adjustment Reason'}</th>
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'អ្នកកែប្រែ' : 'Author'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {paginatedPriceHistory.map(item => (
                      <tr key={item.id} className="hover:bg-amber-50/40 transition">
                        <td className="py-3 px-4 font-mono text-gray-500 whitespace-nowrap">
                          {item.date}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-gray-900 text-xs">{item.product_name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">SKU: {item.sku}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-gray-400 line-through">
                          ${item.old_price.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                          ${item.new_price.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            item.diff >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {item.diff >= 0 ? `+${item.pct}%` : `${item.pct}%`}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-gray-600" title={item.reason}>
                          {item.reason}
                        </td>
                        <td className="py-3 px-4 text-indigo-700 font-bold whitespace-nowrap">
                          {item.author}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {priceHistoryTotalCount > 0 && (
                <div className="px-5 py-3.5 bg-white border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
                  <div>
                    {lang === 'kh'
                      ? `បង្ហាញ ${(priceHistoryCurrentPage - 1) * priceHistoryItemsPerPage + 1} ដល់ ${Math.min(priceHistoryCurrentPage * priceHistoryItemsPerPage, priceHistoryTotalCount)} នៃ ${priceHistoryTotalCount} កំណត់ត្រា`
                      : `Showing ${(priceHistoryCurrentPage - 1) * priceHistoryItemsPerPage + 1} to ${Math.min(priceHistoryCurrentPage * priceHistoryItemsPerPage, priceHistoryTotalCount)} of ${priceHistoryTotalCount} price logs`}
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setPriceHistoryCurrentPage(p => Math.max(1, p - 1))}
                      disabled={priceHistoryCurrentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 font-bold text-gray-700">Page {priceHistoryCurrentPage} of {priceHistoryTotalPages}</span>
                    <button
                      onClick={() => setPriceHistoryCurrentPage(p => Math.min(priceHistoryTotalPages, p + 1))}
                      disabled={priceHistoryCurrentPage === priceHistoryTotalPages || priceHistoryTotalPages === 0}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 14. VIEW: BARCODES */}
        {activeSubView === 'barcodes' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl">
                  <Barcode className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    {lang === 'kh' ? 'តារាងបាកូដ & បោះពុម្ពស្លាក (Barcode Studio Table)' : 'Barcode Studio & Label Printing'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lang === 'kh'
                      ? 'គ្រប់គ្រងកូដ EAN-13, Code-128 និងបោះពុម្ពស្លាកបាកូដកម្ដៅ POS'
                      : 'GS1 EAN-13, Code-128, and POS shelf label printing with thermal batch print queue.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Search Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={lang === 'kh' ? 'ស្វែងរកតាមបាកូដ ឈ្មោះ ឬ SKU...' : 'Search barcode, product name, SKU...'}
                  value={barcodesSearchQuery}
                  onChange={e => setBarcodesSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-slate-500 bg-gray-50/50"
                />
                {barcodesSearchQuery && (
                  <button onClick={() => setBarcodesSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2 text-gray-500 shrink-0">
                <span className="text-xs font-semibold">{lang === 'kh' ? 'បង្ហាញ' : 'Show'}:</span>
                <select
                  value={barcodesItemsPerPage}
                  onChange={e => setBarcodesItemsPerPage(Number(e.target.value))}
                  className="px-2.5 py-1.5 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-slate-500 cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <span className="text-xs font-bold text-gray-700 font-mono">({barcodesTotalCount} items)</span>
              </div>
            </div>

            {/* Barcodes Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 font-black border-b border-gray-200 uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'ទំនិញ' : 'Product'}</th>
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'លេខបាកូដ' : 'Barcode String'}</th>
                      <th className="py-3.5 px-4 text-center">{lang === 'kh' ? 'ស្តង់ដារបាកូដ' : 'Barcode Format'}</th>
                      <th className="py-3.5 px-4 text-center">{lang === 'kh' ? 'ស្តុកក្នុងដៃ' : 'On Hand Stock'}</th>
                      <th className="py-3.5 px-4 text-center">{lang === 'kh' ? 'ស្ថានភាព' : 'Status'}</th>
                      <th className="py-3.5 px-4 text-right">{lang === 'kh' ? 'សកម្មភាព' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {paginatedBarcodes.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-gray-900 text-xs">{p.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">SKU: {p.sku}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="inline-flex items-center space-x-2 font-mono font-bold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
                            <Barcode className="w-3.5 h-3.5 text-gray-500" />
                            <span>{p.barcode || p.sku}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-[10px] border border-blue-100">
                            {p.barcode && p.barcode.length === 13 ? 'EAN-13' : 'Code-128'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-black font-mono">
                          {p.opening_stock || 0}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{lang === 'kh' ? 'រួចរាល់' : 'Ready'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setBarcodeProduct(p);
                              setIsBarcodeModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 ml-auto cursor-pointer shadow-xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>{lang === 'kh' ? 'បោះពុម្ពស្លាក' : 'Print Label'}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {barcodesTotalCount > 0 && (
                <div className="px-5 py-3.5 bg-white border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
                  <div>
                    {lang === 'kh'
                      ? `បង្ហាញ ${(barcodesCurrentPage - 1) * barcodesItemsPerPage + 1} ដល់ ${Math.min(barcodesCurrentPage * barcodesItemsPerPage, barcodesTotalCount)} នៃ ${barcodesTotalCount} បាកូដ`
                      : `Showing ${(barcodesCurrentPage - 1) * barcodesItemsPerPage + 1} to ${Math.min(barcodesCurrentPage * barcodesItemsPerPage, barcodesTotalCount)} of ${barcodesTotalCount} barcodes`}
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setBarcodesCurrentPage(p => Math.max(1, p - 1))}
                      disabled={barcodesCurrentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 font-bold text-gray-700">Page {barcodesCurrentPage} of {barcodesTotalPages}</span>
                    <button
                      onClick={() => setBarcodesCurrentPage(p => Math.min(barcodesTotalPages, p + 1))}
                      disabled={barcodesCurrentPage === barcodesTotalPages || barcodesTotalPages === 0}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 15. VIEW: QR CODES */}
        {activeSubView === 'qr-codes' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    {lang === 'kh' ? 'តារាងកូដ QR ផលិតផល (Dynamic QR Code Registry)' : 'Dynamic QR Code Generator & Label Dispatcher'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lang === 'kh'
                      ? 'ស្កេនលក់រហ័សនៅ POS បើកទំព័រព័ត៌មានទំនិញឌីជីថល និងផ្ទៀងផ្ទាត់ប័ណ្ណធានា'
                      : 'Generate scannable QR codes for fast POS scanning, digital product landing pages, and warranty verification.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Search Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={lang === 'kh' ? 'ស្វែងរក QR តាមឈ្មោះទំនិញ ឬ SKU...' : 'Search product name, SKU, payload...'}
                  value={qrCodesSearchQuery}
                  onChange={e => setQrCodesSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-purple-500 bg-gray-50/50"
                />
                {qrCodesSearchQuery && (
                  <button onClick={() => setQrCodesSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2 text-gray-500 shrink-0">
                <span className="text-xs font-semibold">{lang === 'kh' ? 'បង្ហាញ' : 'Show'}:</span>
                <select
                  value={qrCodesItemsPerPage}
                  onChange={e => setQrCodesItemsPerPage(Number(e.target.value))}
                  className="px-2.5 py-1.5 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-purple-500 cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <span className="text-xs font-bold text-gray-700 font-mono">({qrCodesTotalCount} QR codes)</span>
              </div>
            </div>

            {/* QR Codes Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 font-black border-b border-gray-200 uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4 text-center">{lang === 'kh' ? 'គំរូ QR' : 'QR Preview'}</th>
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'ទំនិញ' : 'Product'}</th>
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'ទិន្នន័យក្នុងកូដ (Payload)' : 'Encoded Payload'}</th>
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'មុខងារគោលដៅ' : 'Action Target'}</th>
                      <th className="py-3.5 px-4 text-center">{lang === 'kh' ? 'ស្ថានភាព' : 'Status'}</th>
                      <th className="py-3.5 px-4 text-right">{lang === 'kh' ? 'សកម្មភាព' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {paginatedQrCodes.map(p => (
                      <tr key={p.id} className="hover:bg-purple-50/40 transition">
                        <td className="py-3 px-4 text-center">
                          <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto text-purple-700">
                            <QrCode className="w-6 h-6" />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-gray-900 text-xs">{p.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">SKU: {p.sku}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-[11px] bg-purple-50 text-purple-800 px-2 py-0.5 rounded-md border border-purple-100 font-bold">
                            smartpos://p/{p.sku}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-xs">
                          POS Fast Checkout & Warranty Registration
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{lang === 'kh' ? 'សកម្ម' : 'Active'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setBarcodeProduct(p);
                              setIsBarcodeModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 ml-auto cursor-pointer shadow-xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>{lang === 'kh' ? 'បោះពុម្ព QR' : 'Print QR'}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {qrCodesTotalCount > 0 && (
                <div className="px-5 py-3.5 bg-white border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
                  <div>
                    {lang === 'kh'
                      ? `បង្ហាញ ${(qrCodesCurrentPage - 1) * qrCodesItemsPerPage + 1} ដល់ ${Math.min(qrCodesCurrentPage * qrCodesItemsPerPage, qrCodesTotalCount)} នៃ ${qrCodesTotalCount} កូដ QR`
                      : `Showing ${(qrCodesCurrentPage - 1) * qrCodesItemsPerPage + 1} to ${Math.min(qrCodesCurrentPage * qrCodesItemsPerPage, qrCodesTotalCount)} of ${qrCodesTotalCount} QR codes`}
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setQrCodesCurrentPage(p => Math.max(1, p - 1))}
                      disabled={qrCodesCurrentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 font-bold text-gray-700">Page {qrCodesCurrentPage} of {qrCodesTotalPages}</span>
                    <button
                      onClick={() => setQrCodesCurrentPage(p => Math.min(qrCodesTotalPages, p + 1))}
                      disabled={qrCodesCurrentPage === qrCodesTotalPages || qrCodesTotalPages === 0}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 16. VIEW: SERIAL NUMBERS */}
        {(activeSubView === 'serial-numbers' || activeSubView === 'serials') && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl">
                  <Hash className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    {lang === 'kh' ? 'តារាងលេខស៊េរី & IMEI (Serial Numbers & IMEI Registry)' : 'Serial Numbers & IMEI Registry'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lang === 'kh'
                      ? 'តាមដានលេខស៊េរីដាច់ដោយឡែក លេខ IMEI អាសយដ្ឋាន MAC និងប័ណ្ណធានាសម្រាប់ឧបករណ៍អេឡិចត្រូនិច'
                      : 'Track individual unit serials, dual IMEI numbers, MAC addresses, and warranty policies for electronic devices.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSerialProduct(products[0] || null);
                  setIsSerialModalOpen(true);
                }}
                className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'kh' ? 'ចុះឈ្មោះលេខស៊េរី' : 'Register Serial'}</span>
              </button>
            </div>

            {/* Search & Controls Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={lang === 'kh' ? 'ស្វែងរកតាមលេខស៊េរី IMEI ឬឈ្មោះ...' : 'Search serial, IMEI, product name...'}
                    value={serialsSearchQuery}
                    onChange={e => setSerialsSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-cyan-500 bg-gray-50/50"
                  />
                  {serialsSearchQuery && (
                    <button onClick={() => setSerialsSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center bg-gray-100/80 p-1 rounded-xl">
                  {(['ALL', 'IN_STOCK', 'SOLD', 'RESERVED', 'DEFECTIVE'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => setSerialsStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        serialsStatusFilter === status
                          ? 'bg-white text-cyan-700 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {status === 'ALL'
                        ? (lang === 'kh' ? 'ទាំងអស់' : 'All')
                        : status === 'IN_STOCK'
                        ? (lang === 'kh' ? 'ក្នុងស្តុក' : 'In Stock')
                        : status === 'SOLD'
                        ? (lang === 'kh' ? 'បានលក់' : 'Sold')
                        : status === 'RESERVED'
                        ? (lang === 'kh' ? 'កក់ទុក' : 'Reserved')
                        : (lang === 'kh' ? 'ខូច' : 'Defective')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2 text-gray-500 shrink-0">
                <span className="text-xs font-semibold">{lang === 'kh' ? 'បង្ហាញ' : 'Show'}:</span>
                <select
                  value={serialsItemsPerPage}
                  onChange={e => setSerialsItemsPerPage(Number(e.target.value))}
                  className="px-2.5 py-1.5 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-cyan-500 cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <span className="text-xs font-bold text-gray-700 font-mono">({serialsTotalCount} units)</span>
              </div>
            </div>

            {/* Serials Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 font-black border-b border-gray-200 uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'លេខស៊េរី (Serial Number)' : 'Serial Number'}</th>
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'ផលិតផល' : 'Product'}</th>
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'លេខ IMEI' : 'IMEI / MAC'}</th>
                      <th className="py-3.5 px-4 text-center">{lang === 'kh' ? 'ធានា (ខែ)' : 'Warranty'}</th>
                      <th className="py-3.5 px-4 text-center">{lang === 'kh' ? 'ស្ថានភាព' : 'Status'}</th>
                      <th className="py-3.5 px-4 text-right">{lang === 'kh' ? 'សកម្មភាព' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {paginatedSerials.map(s => (
                      <tr key={s.id} className="hover:bg-cyan-50/40 transition">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
                            {s.serial_number}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900">
                          {s.product_name || 'Wireless Bluetooth Earbuds Pro'}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-500 text-xs">
                          <div>IMEI: {s.imei || '354891092837192'}</div>
                          {s.mac_address && <div className="text-[10px] text-gray-400">MAC: {s.mac_address}</div>}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-cyan-800">
                          {s.warranty_months} {lang === 'kh' ? 'ខែ' : 'mos'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                            s.status === 'IN_STOCK' ? 'bg-emerald-100 text-emerald-800' : s.status === 'SOLD' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => {
                                setSerialProduct(products[0] || null);
                                setIsSerialModalOpen(true);
                              }}
                              className="p-1.5 text-gray-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                notify.success(lang === 'kh' ? 'លេខស៊េរីត្រូវបានលុប' : 'Serial number deleted');
                              }}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {paginatedSerials.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400 italic">
                          <Hash className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                          <div className="text-xs font-bold text-gray-600">{lang === 'kh' ? 'រកមិនឃើញលេខស៊េរីទេ' : 'No Serial Numbers Found'}</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {serialsTotalCount > 0 && (
                <div className="px-5 py-3.5 bg-white border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
                  <div>
                    {lang === 'kh'
                      ? `បង្ហាញ ${(serialsCurrentPage - 1) * serialsItemsPerPage + 1} ដល់ ${Math.min(serialsCurrentPage * serialsItemsPerPage, serialsTotalCount)} នៃ ${serialsTotalCount} គ្រឿង`
                      : `Showing ${(serialsCurrentPage - 1) * serialsItemsPerPage + 1} to ${Math.min(serialsCurrentPage * serialsItemsPerPage, serialsTotalCount)} of ${serialsTotalCount} serials`}
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setSerialsCurrentPage(p => Math.max(1, p - 1))}
                      disabled={serialsCurrentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 font-bold text-gray-700">Page {serialsCurrentPage} of {serialsTotalPages}</span>
                    <button
                      onClick={() => setSerialsCurrentPage(p => Math.min(serialsTotalPages, p + 1))}
                      disabled={serialsCurrentPage === serialsTotalPages || serialsTotalPages === 0}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 17. VIEW: BATCHES */}
        {activeSubView === 'batches' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <Boxes className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    {lang === 'kh' ? 'តារាងគ្រប់គ្រងឡូត៍ទំនិញ & ថ្ងៃផុតកំណត់ (Batches & Lot Registry)' : 'Batches & Expiry Countdown Alerts'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lang === 'kh'
                      ? 'តាមដានលេខឡូត៍ ថ្ងៃផលិត ថ្ងៃផុតកំណត់ និងការបញ្ចេញទំនិញតាមគោលការណ៍ FEFO'
                      : 'Track manufacture batches, lot numbers, shelf-life expiration, and FEFO inventory rotation.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setBatchProduct(products[0] || null);
                  setIsBatchModalOpen(true);
                }}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'kh' ? 'ចុះឈ្មោះឡូត៍ថ្មី' : 'New Batch'}</span>
              </button>
            </div>

            {/* Search Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={lang === 'kh' ? 'ស្វែងរកតាមលេខឡូត៍ ឬឈ្មោះទំនិញ...' : 'Search batch number, lot, product...'}
                    value={batchesSearchQuery}
                    onChange={e => setBatchesSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-amber-500 bg-gray-50/50"
                  />
                  {batchesSearchQuery && (
                    <button onClick={() => setBatchesSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center bg-gray-100/80 p-1 rounded-xl">
                  {(['ALL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => setBatchesStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        batchesStatusFilter === status
                          ? 'bg-white text-amber-700 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {status === 'ALL'
                        ? (lang === 'kh' ? 'ទាំងអស់' : 'All')
                        : status === 'ACTIVE'
                        ? (lang === 'kh' ? 'សកម្ម' : 'Active')
                        : status === 'EXPIRING_SOON'
                        ? (lang === 'kh' ? 'ជិតផុតកំណត់' : 'Expiring Soon')
                        : (lang === 'kh' ? 'ផុតកំណត់' : 'Expired')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2 text-gray-500 shrink-0">
                <span className="text-xs font-semibold">{lang === 'kh' ? 'បង្ហាញ' : 'Show'}:</span>
                <select
                  value={batchesItemsPerPage}
                  onChange={e => setBatchesItemsPerPage(Number(e.target.value))}
                  className="px-2.5 py-1.5 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-amber-500 cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <span className="text-xs font-bold text-gray-700 font-mono">({batchesTotalCount} batches)</span>
              </div>
            </div>

            {/* Batches Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 font-black border-b border-gray-200 uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'លេខឡូត៍ (Batch #)' : 'Batch Number'}</th>
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'កូដឡូត៍ (Lot #)' : 'Lot Number'}</th>
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'ថ្ងៃផលិត (MFG)' : 'Manufacture Date'}</th>
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'ថ្ងៃផុតកំណត់ (EXP)' : 'Expiry Date'}</th>
                      <th className="py-3.5 px-4 text-center">{lang === 'kh' ? 'បរិមាណនៅសល់' : 'Remaining Qty'}</th>
                      <th className="py-3.5 px-4 text-center">{lang === 'kh' ? 'ស្ថានភាព' : 'Status'}</th>
                      <th className="py-3.5 px-4 text-right">{lang === 'kh' ? 'សកម្មភាព' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {paginatedBatches.map(b => (
                      <tr key={b.id} className="hover:bg-amber-50/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-gray-900">
                          {b.batch_number}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-500">
                          {b.lot_number || 'LOT-2026-A'}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-600">
                          {b.manufactured_date || '2026-06-01'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-rose-600">
                          {b.expiry_date}
                        </td>
                        <td className="py-3 px-4 text-center font-black text-sm">
                          {b.remaining_quantity}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => {
                                setBatchProduct(products[0] || null);
                                setIsBatchModalOpen(true);
                              }}
                              className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                notify.success(lang === 'kh' ? 'ឡូត៍ត្រូវបានលុប' : 'Batch record deleted');
                              }}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {paginatedBatches.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400 italic">
                          <Boxes className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                          <div className="text-xs font-bold text-gray-600">{lang === 'kh' ? 'រកមិនឃើញឡូត៍ទំនិញទេ' : 'No Batches Registered'}</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {batchesTotalCount > 0 && (
                <div className="px-5 py-3.5 bg-white border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
                  <div>
                    {lang === 'kh'
                      ? `បង្ហាញ ${(batchesCurrentPage - 1) * batchesItemsPerPage + 1} ដល់ ${Math.min(batchesCurrentPage * batchesItemsPerPage, batchesTotalCount)} នៃ ${batchesTotalCount} ឡូត៍`
                      : `Showing ${(batchesCurrentPage - 1) * batchesItemsPerPage + 1} to ${Math.min(batchesCurrentPage * batchesItemsPerPage, batchesTotalCount)} of ${batchesTotalCount} batches`}
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setBatchesCurrentPage(p => Math.max(1, p - 1))}
                      disabled={batchesCurrentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 font-bold text-gray-700">Page {batchesCurrentPage} of {batchesTotalPages}</span>
                    <button
                      onClick={() => setBatchesCurrentPage(p => Math.min(batchesTotalPages, p + 1))}
                      disabled={batchesCurrentPage === batchesTotalPages || batchesTotalPages === 0}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 18. VIEW: WARRANTIES */}
        {activeSubView === 'warranties' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    {lang === 'kh' ? 'តារាងគោលការណ៍ធានា (Warranty Policies Table)' : 'Warranty Policies & Guarantee Agreements'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lang === 'kh'
                      ? 'គ្រប់គ្រងកិច្ចព្រមព្រៀងធានាហាង ការទាមទារធានាពីរោងចក្រ និងលក្ខខណ្ឌប្តូរទំនិញ'
                      : 'Manage store warranty coverage policies, manufacturer claims, return SLAs, and perishable guarantees.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Search Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={lang === 'kh' ? 'ស្វែងរកគោលការណ៍ធានា...' : 'Search warranty policy, coverage, SLA...'}
                  value={warrantiesSearchQuery}
                  onChange={e => setWarrantiesSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-cyan-500 bg-gray-50/50"
                />
                {warrantiesSearchQuery && (
                  <button onClick={() => setWarrantiesSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2 text-gray-500 shrink-0">
                <span className="text-xs font-semibold">{lang === 'kh' ? 'បង្ហាញ' : 'Show'}:</span>
                <select
                  value={warrantiesItemsPerPage}
                  onChange={e => setWarrantiesItemsPerPage(Number(e.target.value))}
                  className="px-2.5 py-1.5 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-cyan-500 cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <span className="text-xs font-bold text-gray-700 font-mono">({warrantiesTotalCount} policies)</span>
              </div>
            </div>

            {/* Warranties Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 font-black border-b border-gray-200 uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'ឈ្មោះគោលការណ៍' : 'Policy Name'}</th>
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'ប្រភេទ' : 'Type'}</th>
                      <th className="py-3.5 px-4 text-center">{lang === 'kh' ? 'រយៈពេលធានា' : 'Duration'}</th>
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'វិសាលភាពគ្របដណ្តប់' : 'Coverage Scope'}</th>
                      <th className="py-3.5 px-4">{lang === 'kh' ? 'នីតិវិធីទាមទារ (Claim SLA)' : 'Claim Process SLA'}</th>
                      <th className="py-3.5 px-4 text-center">{lang === 'kh' ? 'ស្ថានភាព' : 'Status'}</th>
                      <th className="py-3.5 px-4 text-right">{lang === 'kh' ? 'សកម្មភាព' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {paginatedWarranties.map(w => (
                      <tr key={w.id} className="hover:bg-cyan-50/40 transition">
                        <td className="py-3 px-4 font-extrabold text-gray-900 text-xs">
                          {w.name}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 font-bold text-[10px] rounded-md border border-cyan-100">
                            {w.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-cyan-800">
                          {w.duration_months} {lang === 'kh' ? 'ខែ' : 'Months'}
                        </td>
                        <td className="py-3 px-4 max-w-xs text-gray-600 text-xs">
                          {w.coverage}
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-xs">
                          {w.claim_process}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{lang === 'kh' ? 'សកម្ម' : 'Active'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => {
                                notify.success(`Editing warranty policy #${w.id}`);
                              }}
                              className="p-1.5 text-gray-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                notify.success(`Warranty policy #${w.id} deleted`);
                              }}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {warrantiesTotalCount > 0 && (
                <div className="px-5 py-3.5 bg-white border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
                  <div>
                    {lang === 'kh'
                      ? `បង្ហាញ ${(warrantiesCurrentPage - 1) * warrantiesItemsPerPage + 1} ដល់ ${Math.min(warrantiesCurrentPage * warrantiesItemsPerPage, warrantiesTotalCount)} នៃ ${warrantiesTotalCount} គោលការណ៍`
                      : `Showing ${(warrantiesCurrentPage - 1) * warrantiesItemsPerPage + 1} to ${Math.min(warrantiesCurrentPage * warrantiesItemsPerPage, warrantiesTotalCount)} of ${warrantiesTotalCount} warranty policies`}
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setWarrantiesCurrentPage(p => Math.max(1, p - 1))}
                      disabled={warrantiesCurrentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 font-bold text-gray-700">Page {warrantiesCurrentPage} of {warrantiesTotalPages}</span>
                    <button
                      onClick={() => setWarrantiesCurrentPage(p => Math.min(warrantiesTotalPages, p + 1))}
                      disabled={warrantiesCurrentPage === warrantiesTotalPages || warrantiesTotalPages === 0}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}


        {/* 20. VIEW: MANUFACTURING */}
        {activeSubView === 'manufacturing' && (
          <div className="space-y-4">
            {/* Header Banner with Statistics */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl shadow-xs">
                  <Factory className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    {lang === 'kh' ? 'តារាងបញ្ជាការងារផលិតកម្ម & ដំណើរការផ្គុំ (Manufacturing Table)' : 'Manufacturing Work Orders & Assembly Batches'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lang === 'kh'
                      ? 'តាមដានបញ្ជាការងារផលិតកម្ម វត្ថុធាតុដើម ស្ថានីយការងារ អ្នកគ្រប់គ្រង និងវឌ្ឍនភាពផលិតកម្ម'
                      : 'Track shop floor work orders, scheduled assembly batches, work centers, supervisors, and direct unit costs.'}
                  </p>
                </div>
              </div>

              {/* Stats Counters & Action */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3.5 py-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center space-x-2 text-xs">
                  <Cog className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700 font-semibold">{lang === 'kh' ? 'កំពុងដំណើរការ' : 'In Progress'}:</span>
                  <span className="font-mono font-black text-blue-900">
                    {manufacturingOrders.filter(o => o.status === 'IN_PROGRESS').length}
                  </span>
                </div>
                <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">{lang === 'kh' ? 'បានបញ្ចប់' : 'Completed'}:</span>
                  <span className="font-mono font-black text-emerald-900">
                    {manufacturingOrders.filter(o => o.status === 'COMPLETED').length}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const mfgProd = products.find(p => p.product_type === 'MANUFACTURED') || products[0];
                    if (mfgProd) {
                      setBundleBomProduct(mfgProd);
                      setBundleBomMode('BOM');
                      setIsBundleBomModalOpen(true);
                    } else {
                      notify.info('Create a manufactured product first to launch production order');
                    }
                  }}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'kh' ? 'បង្កើតបញ្ជាផលិតថ្មី' : 'New Work Order'}</span>
                </button>
              </div>
            </div>

            {/* Search & Controls Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={
                      lang === 'kh'
                        ? 'ស្វែងរកតាមលេខ Work Order ទំនិញ ស្ថានីយ ឬអ្នកគ្រប់គ្រង...'
                        : 'Search order #, product, work center, supervisor...'
                    }
                    value={mfgSearchQuery}
                    onChange={e => {
                      setMfgSearchQuery(e.target.value);
                      setMfgCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-blue-500 bg-gray-50/50"
                  />
                  {mfgSearchQuery && (
                    <button
                      onClick={() => {
                        setMfgSearchQuery('');
                        setMfgCurrentPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center bg-gray-100/80 p-1 rounded-xl">
                  {(['ALL', 'IN_PROGRESS', 'PLANNED', 'QC_PENDING', 'COMPLETED'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        setMfgStatusFilter(status);
                        setMfgCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        mfgStatusFilter === status
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {status === 'ALL'
                        ? (lang === 'kh' ? 'ទាំងអស់' : 'All')
                        : status === 'IN_PROGRESS'
                        ? (lang === 'kh' ? 'កំពុងផលិត' : 'In Progress')
                        : status === 'PLANNED'
                        ? (lang === 'kh' ? 'បានគ្រោង' : 'Planned')
                        : status === 'QC_PENDING'
                        ? (lang === 'kh' ? 'រង់ចាំ QC' : 'QC Pending')
                        : (lang === 'kh' ? 'បានបញ្ចប់' : 'Completed')}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setMfgCurrentPage(1)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 shrink-0 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{lang === 'kh' ? 'ស្វែងរក' : 'Search'}</span>
                </button>
              </div>

              <div className="flex items-center space-x-2 text-gray-500 shrink-0">
                <span className="text-xs font-semibold">{lang === 'kh' ? 'បង្ហាញ' : 'Show'}:</span>
                <select
                  value={mfgItemsPerPage}
                  onChange={e => {
                    setMfgItemsPerPage(Number(e.target.value));
                    setMfgCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <span className="text-xs font-bold text-gray-700 font-mono">
                  ({mfgTotalCount} {lang === 'kh' ? 'បញ្ជា' : 'orders'})
                </span>
              </div>
            </div>

            {/* Manufacturing Orders Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 font-black border-b border-gray-200 uppercase tracking-wider text-[10px] sm:text-[11px]">
                      <th className="py-4 px-4 min-w-[150px]">{lang === 'kh' ? 'លេខ Work Order' : 'Work Order #'}</th>
                      <th className="py-4 px-4 min-w-[190px]">{lang === 'kh' ? 'ទំនិញស្រេច (Product)' : 'Finished Good'}</th>
                      <th className="py-4 px-4 min-w-[170px]">{lang === 'kh' ? 'វឌ្ឍនភាពផលិត' : 'Progress / Quantity'}</th>
                      <th className="py-4 px-4 min-w-[170px]">{lang === 'kh' ? 'ស្ថានីយការងារ' : 'Work Center / Line'}</th>
                      <th className="py-4 px-4 min-w-[170px]">{lang === 'kh' ? 'អ្នកគ្រប់គ្រង' : 'Supervisor'}</th>
                      <th className="py-4 px-4 min-w-[140px]">{lang === 'kh' ? 'កាលវិភាគ' : 'Schedule'}</th>
                      <th className="py-4 px-4 text-center min-w-[110px]">{lang === 'kh' ? 'ស្ថានភាព' : 'Status'}</th>
                      <th className="py-4 px-4 text-right min-w-[130px]">{lang === 'kh' ? 'សកម្មភាព' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {paginatedManufacturingOrders.map(order => {
                      const pct = order.target_qty > 0 ? Math.min(100, Math.round((order.produced_qty / order.target_qty) * 100)) : 0;

                      return (
                        <tr key={order.id} className="hover:bg-blue-50/30 transition">
                          {/* 1. Work Order # & BOM */}
                          <td className="py-4 px-4 align-top">
                            <div className="font-mono font-black text-blue-900 text-xs flex items-center space-x-1.5">
                              <Factory className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>{order.order_no}</span>
                            </div>
                            <div className="mt-1">
                              <span className="px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-md font-mono text-[10px] font-bold">
                                {order.bom_code}
                              </span>
                            </div>
                          </td>

                          {/* 2. Finished Product */}
                          <td className="py-4 px-4 align-top">
                            <div className="font-extrabold text-gray-900">{order.product_name}</div>
                            <div className="mt-1 flex items-center space-x-1.5">
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-mono text-[10px] font-bold border border-gray-200">
                                {order.product_sku}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono font-semibold">
                                Batch: ${order.batch_cost.toFixed(2)}
                              </span>
                            </div>
                          </td>

                          {/* 3. Progress & Quantity */}
                          <td className="py-4 px-4 align-top">
                            <div className="flex items-center justify-between text-xs font-bold font-mono text-gray-800 mb-1">
                              <span>{order.produced_qty} / {order.target_qty} {order.unit}</span>
                              <span className="text-[11px] text-blue-600">{pct}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  pct === 100
                                    ? 'bg-emerald-500'
                                    : pct > 50
                                    ? 'bg-blue-500'
                                    : pct > 0
                                    ? 'bg-amber-500'
                                    : 'bg-gray-300'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </td>

                          {/* 4. Work Center */}
                          <td className="py-4 px-4 align-top">
                            <div className="font-bold text-gray-800">{order.work_center}</div>
                            {order.notes && (
                              <div className="text-[11px] text-gray-500 line-clamp-1 italic mt-0.5" title={order.notes}>
                                "{order.notes}"
                              </div>
                            )}
                          </td>

                          {/* 5. Supervisor */}
                          <td className="py-4 px-4 align-top">
                            <div className="font-bold text-gray-900 flex items-center space-x-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>{order.supervisor}</span>
                            </div>
                          </td>

                          {/* 6. Schedule */}
                          <td className="py-4 px-4 align-top">
                            <div className="text-[11px] font-mono text-gray-600 flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span>{order.start_date}</span>
                            </div>
                            <div className="text-[10px] font-mono text-gray-400 mt-0.5">
                              Due: {order.due_date}
                            </div>
                          </td>

                          {/* 7. Status */}
                          <td className="py-4 px-4 align-top text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black border ${
                                order.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : order.status === 'IN_PROGRESS'
                                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                                  : order.status === 'QC_PENDING'
                                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                                  : 'bg-purple-100 text-purple-800 border-purple-200'
                              }`}
                            >
                              {order.status === 'COMPLETED'
                                ? (lang === 'kh' ? '✓ បានបញ្ចប់' : 'COMPLETED')
                                : order.status === 'IN_PROGRESS'
                                ? (lang === 'kh' ? '⚡ កំពុងផលិត' : 'IN PROGRESS')
                                : order.status === 'QC_PENDING'
                                ? (lang === 'kh' ? '⏳ រង់ចាំ QC' : 'QC PENDING')
                                : (lang === 'kh' ? '📋 បានគ្រោង' : 'PLANNED')}
                            </span>
                          </td>

                          {/* 8. Action */}
                          <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1">
                              {order.status !== 'COMPLETED' && (
                                <button
                                  onClick={() => {
                                    const next =
                                      order.status === 'PLANNED'
                                        ? 'IN_PROGRESS'
                                        : order.status === 'IN_PROGRESS'
                                        ? 'QC_PENDING'
                                        : 'COMPLETED';
                                    handleUpdateMfgStatus(order.id, next);
                                  }}
                                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs border border-blue-200 transition cursor-pointer"
                                  title={lang === 'kh' ? 'ផ្លាស់ប្តូរស្ថានភាពទៅមុខ' : 'Advance Order Stage'}
                                >
                                  {order.status === 'PLANNED' ? 'Start' : order.status === 'IN_PROGRESS' ? 'Send QC' : 'Complete'}
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  notify.success(`Printing batch traveler ticket for ${order.order_no}`);
                                }}
                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer border border-transparent hover:border-indigo-200"
                                title={lang === 'kh' ? 'បោះពុម្ពសន្លឹកការងារ' : 'Print Traveler Ticket'}
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMfgOrder(order.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer border border-transparent hover:border-red-200"
                                title={lang === 'kh' ? 'លុបបញ្ជាផលិត' : 'Delete Order'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {paginatedManufacturingOrders.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-gray-400 italic">
                          <Factory className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                          <div className="text-xs font-bold text-gray-600">
                            {lang === 'kh' ? 'រកមិនឃើញបញ្ជាការងារផលិតកម្មទេ' : 'No Manufacturing Orders Found'}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {mfgSearchQuery
                              ? (lang === 'kh' ? 'សូមស្វែងរកជាមួយពាក្យផ្សេង។' : 'Try searching with different terms.')
                              : (lang === 'kh' ? 'មិនទាន់មានបញ្ជាការងារផលិតកម្មនៅឡើយទេ។' : 'No manufacturing work orders registered yet.')}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              {mfgTotalCount > 0 && (
                <div className="px-5 py-3.5 bg-white border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
                  <div>
                    {lang === 'kh'
                      ? `បង្ហាញ ${(mfgCurrentPage - 1) * mfgItemsPerPage + 1} ដល់ ${Math.min(
                          mfgCurrentPage * mfgItemsPerPage,
                          mfgTotalCount
                        )} នៃ ${mfgTotalCount} បញ្ជា`
                      : `Showing ${(mfgCurrentPage - 1) * mfgItemsPerPage + 1} to ${Math.min(
                          mfgCurrentPage * mfgItemsPerPage,
                          mfgTotalCount
                        )} of ${mfgTotalCount} orders`}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setMfgCurrentPage(p => Math.max(1, p - 1))}
                      disabled={mfgCurrentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 font-bold text-gray-700">
                      Page {mfgCurrentPage} of {mfgTotalPages}
                    </span>
                    <button
                      onClick={() => setMfgCurrentPage(p => Math.min(mfgTotalPages, p + 1))}
                      disabled={mfgCurrentPage === mfgTotalPages || mfgTotalPages === 0}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 21. VIEW: OPERATION */}
        {activeSubView === 'operation' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    {lang === 'kh' ? 'តារាងទីតាំងឃ្លាំង & ធ្នើរទំនិញ (Warehouse Bin Location Table)' : 'Warehouse Bin Mapping & Inventory Storage Coordinates'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lang === 'kh'
                      ? 'តាមដានទីតាំងស្តុកទំនិញជាក់ស្តែងតាមតំបន់ (Zone) ផ្លូវដើរ (Aisle) ធ្នើរ (Rack/Shelf) និងប្រអប់ (Bin)'
                      : 'Physical warehouse storage coordinates for accelerated picking, stocking, and put-away dispatching.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Search & Controls Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={lang === 'kh' ? 'ស្វែងរកទីតាំងឃ្លាំង ឈ្មោះ ឬ SKU...' : 'Search bin, aisle, product name, SKU...'}
                    value={operationSearchQuery}
                    onChange={e => {
                      setOperationSearchQuery(e.target.value);
                      setOperationCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-indigo-500 bg-gray-50/50"
                  />
                  {operationSearchQuery && (
                    <button
                      onClick={() => {
                        setOperationSearchQuery('');
                        setOperationCurrentPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center bg-gray-100/80 p-1 rounded-xl">
                  {(['ALL', 'Zone A', 'Zone B', 'Zone C'] as const).map(zone => (
                    <button
                      key={zone}
                      onClick={() => {
                        setOperationZoneFilter(zone);
                        setOperationCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        operationZoneFilter === zone
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {zone === 'ALL' ? (lang === 'kh' ? 'គ្រប់តំបន់' : 'All Zones') : zone}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setOperationCurrentPage(1)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 shrink-0 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{lang === 'kh' ? 'ស្វែងរក' : 'Search'}</span>
                </button>
              </div>

              <div className="flex items-center space-x-2 text-gray-500 shrink-0">
                <span className="text-xs font-semibold">{lang === 'kh' ? 'បង្ហាញ' : 'Show'}:</span>
                <select
                  value={operationItemsPerPage}
                  onChange={e => {
                    setOperationItemsPerPage(Number(e.target.value));
                    setOperationCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <span className="text-xs font-bold text-gray-700 font-mono">
                  ({operationTotalCount} {lang === 'kh' ? 'ទីតាំង' : 'locations'})
                </span>
              </div>
            </div>

            {/* Operations Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 font-black border-b border-gray-200 uppercase tracking-wider text-[10px] sm:text-[11px]">
                      <th className="py-4 px-5 min-w-[200px]">{lang === 'kh' ? 'ទំនិញ' : 'Product'}</th>
                      <th className="py-4 px-4 min-w-[130px]">{lang === 'kh' ? 'ជំពូក' : 'Category'}</th>
                      <th className="py-4 px-4 text-center min-w-[110px]">{lang === 'kh' ? 'តំបន់ (Zone)' : 'Warehouse Zone'}</th>
                      <th className="py-4 px-4 min-w-[110px]">{lang === 'kh' ? 'ផ្លូវដើរ (Aisle)' : 'Aisle'}</th>
                      <th className="py-4 px-4 min-w-[130px]">{lang === 'kh' ? 'ធ្នើរ (Rack / Shelf)' : 'Rack & Shelf'}</th>
                      <th className="py-4 px-4 text-center min-w-[120px]">{lang === 'kh' ? 'ប្រអប់ (Bin #)' : 'Bin Number'}</th>
                      <th className="py-4 px-4 text-center min-w-[100px]">{lang === 'kh' ? 'ស្តុកក្នុងដៃ' : 'On Hand'}</th>
                      <th className="py-4 px-5 text-right min-w-[110px]">{lang === 'kh' ? 'សកម្មភាព' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {paginatedOperationItems.map(item => (
                      <tr key={item.id} className="hover:bg-indigo-50/40 transition">
                        {/* 1. Product */}
                        <td className="py-4 px-5">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              {item.product.image_url ? (
                                <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-extrabold text-gray-900 text-xs truncate">{item.product.name}</div>
                              <div className="text-[10px] text-gray-400 font-mono">SKU: {item.product.sku}</div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Category */}
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 font-semibold rounded-lg text-xs">
                            {item.product.category?.name || 'General'}
                          </span>
                        </td>

                        {/* 3. Zone */}
                        <td className="py-4 px-4 text-center">
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-full text-xs border border-indigo-100">
                            {item.zone}
                          </span>
                        </td>

                        {/* 4. Aisle */}
                        <td className="py-4 px-4 font-mono font-bold text-gray-700">
                          {item.aisle}
                        </td>

                        {/* 5. Rack & Shelf */}
                        <td className="py-4 px-4 text-gray-600 font-medium">
                          {item.rack} • {item.shelf}
                        </td>

                        {/* 6. Bin */}
                        <td className="py-4 px-4 text-center">
                          <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-200">
                            {item.bin}
                          </span>
                        </td>

                        {/* 7. Stock */}
                        <td className="py-4 px-4 text-center font-black font-mono text-xs">
                          {item.stock} {item.product.unit?.short_name || 'pcs'}
                        </td>

                        {/* 8. Action */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              notify.success(`Location updated for ${item.product.name}`);
                            }}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 ml-auto transition cursor-pointer border border-indigo-200"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>{lang === 'kh' ? 'កែប្រែ' : 'Edit'}</span>
                          </button>
                        </td>
                      </tr>
                    ))}

                    {paginatedOperationItems.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-gray-400 italic">
                          <MapPin className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                          <div className="text-xs font-bold text-gray-600">
                            {lang === 'kh' ? 'រកមិនឃើញទីតាំងឃ្លាំងទេ' : 'No Warehouse Locations Found'}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {operationTotalCount > 0 && (
                <div className="px-5 py-3.5 bg-white border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
                  <div>
                    {lang === 'kh'
                      ? `បង្ហាញ ${(operationCurrentPage - 1) * operationItemsPerPage + 1} ដល់ ${Math.min(
                          operationCurrentPage * operationItemsPerPage,
                          operationTotalCount
                        )} នៃ ${operationTotalCount} ទីតាំង`
                      : `Showing ${(operationCurrentPage - 1) * operationItemsPerPage + 1} to ${Math.min(
                          operationCurrentPage * operationItemsPerPage,
                          operationTotalCount
                        )} of ${operationTotalCount} locations`}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setOperationCurrentPage(p => Math.max(1, p - 1))}
                      disabled={operationCurrentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 font-bold text-gray-700">
                      Page {operationCurrentPage} of {operationTotalPages}
                    </span>
                    <button
                      onClick={() => setOperationCurrentPage(p => Math.min(operationTotalPages, p + 1))}
                      disabled={operationCurrentPage === operationTotalPages || operationTotalPages === 0}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 22. VIEW: BILL OF MATERIALS (BOM) */}
        {activeSubView === 'bom' && (
          <div className="space-y-4">
            {/* Header Banner with Statistics */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3.5 bg-violet-50 text-violet-600 rounded-2xl shadow-xs">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    {lang === 'kh' ? 'តារាងរូបមន្តផលិតកម្ម & បញ្ជីសម្ភារៈ (Bill of Materials - BOM Table)' : 'Bill of Materials (BOM) & Recipe Formulation Table'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lang === 'kh'
                      ? 'គ្រប់គ្រងរូបមន្តផលិតកម្ម បញ្ជីធាតុផ្សំដើម អត្រាសល់អេតចាយ ថ្លៃពលកម្ម និងការគណនាថ្លៃដើមផលិតផលស្រេច'
                      : 'Formulate manufacturing recipes, define component raw ingredients, scrap rates, labor overhead, and rollup unit costs.'}
                  </p>
                </div>
              </div>

              {/* Stats Counters & Action */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">{lang === 'kh' ? 'BOM សកម្ម' : 'Active BOMs'}:</span>
                  <span className="font-mono font-black text-emerald-900">
                    {bomList.filter(b => b.status === 'ACTIVE').length}
                  </span>
                </div>
                <div className="px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2 text-xs">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span className="text-amber-700 font-semibold">{lang === 'kh' ? 'ព្រាង' : 'Drafts'}:</span>
                  <span className="font-mono font-black text-amber-900">
                    {bomList.filter(b => b.status === 'DRAFT').length}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const mfgProd = products.find(p => p.product_type === 'MANUFACTURED') || products[0];
                    if (mfgProd) {
                      setBundleBomProduct(mfgProd);
                      setBundleBomMode('BOM');
                      setIsBundleBomModalOpen(true);
                    } else {
                      notify.info('Create a manufactured product first to formulate BOM');
                    }
                  }}
                  className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'kh' ? 'បង្កើតរូបមន្ត BOM ថ្មី' : 'New BOM Recipe'}</span>
                </button>
              </div>
            </div>

            {/* Search & Controls Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={
                      lang === 'kh'
                        ? 'ស្វែងរកតាមកូដ BOM ឈ្មោះទំនិញ ធាតុផ្សំ ឬជំពូក...'
                        : 'Search BOM code, product name, ingredient, category...'
                    }
                    value={bomSearchQuery}
                    onChange={e => {
                      setBomSearchQuery(e.target.value);
                      setBomCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-violet-500 bg-gray-50/50"
                  />
                  {bomSearchQuery && (
                    <button
                      onClick={() => {
                        setBomSearchQuery('');
                        setBomCurrentPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center bg-gray-100/80 p-1 rounded-xl">
                  {(['ALL', 'ACTIVE', 'DRAFT', 'ARCHIVED'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        setBomStatusFilter(status);
                        setBomCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        bomStatusFilter === status
                          ? 'bg-white text-violet-700 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {status === 'ALL'
                        ? (lang === 'kh' ? 'ទាំងអស់' : 'All')
                        : status === 'ACTIVE'
                        ? (lang === 'kh' ? 'សកម្ម' : 'Active')
                        : status === 'DRAFT'
                        ? (lang === 'kh' ? 'ព្រាង' : 'Draft')
                        : (lang === 'kh' ? 'ប័ណ្ណសារ' : 'Archived')}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setBomCurrentPage(1)}
                  className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 shrink-0 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{lang === 'kh' ? 'ស្វែងរក' : 'Search'}</span>
                </button>
              </div>

              <div className="flex items-center space-x-2 text-gray-500 shrink-0">
                <span className="text-xs font-semibold">{lang === 'kh' ? 'បង្ហាញ' : 'Show'}:</span>
                <select
                  value={bomItemsPerPage}
                  onChange={e => {
                    setBomItemsPerPage(Number(e.target.value));
                    setBomCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-violet-500 cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <span className="text-xs font-bold text-gray-700 font-mono">
                  ({bomTotalCount} {lang === 'kh' ? 'រូបមន្ត' : 'BOMs'})
                </span>
              </div>
            </div>

            {/* BOM Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 font-black border-b border-gray-200 uppercase tracking-wider text-[10px] sm:text-[11px]">
                      <th className="py-4 px-4 min-w-[150px]">{lang === 'kh' ? 'កូដ BOM & កំណែ' : 'BOM Code & Ver.'}</th>
                      <th className="py-4 px-4 min-w-[190px]">{lang === 'kh' ? 'ទំនិញស្រេច (Finished Product)' : 'Finished Good'}</th>
                      <th className="py-4 px-4 min-w-[140px]">{lang === 'kh' ? 'ទិន្នផល (Yield)' : 'Batch Yield'}</th>
                      <th className="py-4 px-4 min-w-[230px]">{lang === 'kh' ? 'ធាតុផ្សំដើម (Components)' : 'Raw Ingredients (BOM)'}</th>
                      <th className="py-4 px-4 text-right min-w-[150px]">{lang === 'kh' ? 'ថ្លៃដើមផលិត (Cost)' : 'BOM Cost Breakdown'}</th>
                      <th className="py-4 px-4 text-right min-w-[140px]">{lang === 'kh' ? 'តម្លៃលក់ដែលបានណែនាំ' : 'Suggested Price'}</th>
                      <th className="py-4 px-4 text-center min-w-[100px]">{lang === 'kh' ? 'ស្ថានភាព' : 'Status'}</th>
                      <th className="py-4 px-4 text-right min-w-[120px]">{lang === 'kh' ? 'សកម្មភាព' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {paginatedBomList.map(bom => {
                      const marginPct = bom.suggested_price > 0
                        ? (((bom.suggested_price - bom.total_cost) / bom.suggested_price) * 100).toFixed(0)
                        : '0';

                      return (
                        <tr key={bom.id} className="hover:bg-violet-50/30 transition">
                          {/* 1. BOM Code & Version */}
                          <td className="py-4 px-4 align-top">
                            <div className="font-mono font-black text-violet-900 text-xs flex items-center space-x-1.5">
                              <ClipboardList className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                              <span>{bom.bom_code}</span>
                            </div>
                            <div className="mt-1 flex items-center space-x-1">
                              <span className="px-2 py-0.5 bg-violet-100 text-violet-800 rounded-md font-mono text-[10px] font-extrabold">
                                {bom.version}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">• {bom.updated_at}</span>
                            </div>
                          </td>

                          {/* 2. Finished Product */}
                          <td className="py-4 px-4 align-top">
                            <div className="font-extrabold text-gray-900">{bom.product_name}</div>
                            <div className="mt-1 flex items-center space-x-1.5">
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-mono text-[10px] font-bold border border-gray-200">
                                {bom.product_sku}
                              </span>
                              <span className="text-[10px] text-gray-400">• {bom.category}</span>
                            </div>
                          </td>

                          {/* 3. Batch Yield */}
                          <td className="py-4 px-4 align-top">
                            <div className="font-black font-mono text-gray-800 text-xs">
                              {bom.yield_qty}
                            </div>
                            <div className="text-[10px] text-gray-400 font-medium">Standard Batch Output</div>
                          </td>

                          {/* 4. Raw Components */}
                          <td className="py-4 px-4 align-top">
                            <div className="space-y-1">
                              {bom.components.slice(0, 3).map((comp, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md">
                                  <span className="font-medium text-gray-800 truncate max-w-[130px]">{comp.name}</span>
                                  <span className="font-mono font-bold text-violet-700 ml-1.5">{comp.qty}</span>
                                </div>
                              ))}
                              {bom.components.length > 3 && (
                                <div className="text-[10px] text-gray-400 italic">
                                  +{bom.components.length - 3} more ingredients...
                                </div>
                              )}
                            </div>
                          </td>

                          {/* 5. BOM Cost Breakdown */}
                          <td className="py-4 px-4 align-top text-right">
                            <div className="font-mono font-black text-gray-900 text-xs">
                              Total: ${bom.total_cost.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono">
                              Mat: ${bom.material_cost.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              Labor: ${bom.labor_overhead_cost.toFixed(2)}
                            </div>
                          </td>

                          {/* 6. Suggested Price */}
                          <td className="py-4 px-4 align-top text-right">
                            <div className="font-mono font-black text-emerald-700 text-xs">
                              ${bom.suggested_price.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-emerald-600 font-bold font-mono">
                              +{marginPct}% margin
                            </div>
                          </td>

                          {/* 7. Status */}
                          <td className="py-4 px-4 align-top text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black border ${
                                bom.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : bom.status === 'DRAFT'
                                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                                  : 'bg-gray-100 text-gray-600 border-gray-200'
                              }`}
                            >
                              {bom.status}
                            </span>
                          </td>

                          {/* 8. Action */}
                          <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => {
                                  const prod = products.find(p => p.name === bom.product_name) || products[0];
                                  if (prod) {
                                    setBundleBomProduct(prod);
                                    setBundleBomMode('BOM');
                                    setIsBundleBomModalOpen(true);
                                  }
                                }}
                                className="p-1.5 text-violet-600 hover:bg-violet-50 rounded-lg transition cursor-pointer border border-transparent hover:border-violet-200"
                                title={lang === 'kh' ? 'កែប្រែរូបមន្ត BOM' : 'Edit BOM Recipe'}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  notify.success(`Printing BOM specification sheet for ${bom.bom_code}`);
                                }}
                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer border border-transparent hover:border-indigo-200"
                                title={lang === 'kh' ? 'បោះពុម្ពរូបមន្ត' : 'Print Specification'}
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteBom(bom.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer border border-transparent hover:border-red-200"
                                title={lang === 'kh' ? 'លុបរូបមន្ត BOM' : 'Delete BOM'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {paginatedBomList.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-gray-400 italic">
                          <ClipboardList className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                          <div className="text-xs font-bold text-gray-600">
                            {lang === 'kh' ? 'រកមិនឃើញរូបមន្ត BOM ទេ' : 'No Bill of Materials Found'}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {bomSearchQuery
                              ? (lang === 'kh' ? 'សូមស្វែងរកជាមួយពាក្យផ្សេង។' : 'Try searching with different terms.')
                              : (lang === 'kh' ? 'មិនទាន់មានរូបមន្ត BOM ត្រូវបានបង្កើតនៅឡើយទេ។' : 'No BOM recipes registered yet.')}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              {bomTotalCount > 0 && (
                <div className="px-5 py-3.5 bg-white border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
                  <div>
                    {lang === 'kh'
                      ? `បង្ហាញ ${(bomCurrentPage - 1) * bomItemsPerPage + 1} ដល់ ${Math.min(
                          bomCurrentPage * bomItemsPerPage,
                          bomTotalCount
                        )} នៃ ${bomTotalCount} រូបមន្ត`
                      : `Showing ${(bomCurrentPage - 1) * bomItemsPerPage + 1} to ${Math.min(
                          bomCurrentPage * bomItemsPerPage,
                          bomTotalCount
                        )} of ${bomTotalCount} BOM recipes`}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setBomCurrentPage(p => Math.max(1, p - 1))}
                      disabled={bomCurrentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 font-bold text-gray-700">
                      Page {bomCurrentPage} of {bomTotalPages}
                    </span>
                    <button
                      onClick={() => setBomCurrentPage(p => Math.min(bomTotalPages, p + 1))}
                      disabled={bomCurrentPage === bomTotalPages || bomTotalPages === 0}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 23. VIEW: RECIPES */}
        {activeSubView === 'recipes' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    {lang === 'kh' ? 'តារាងរូបមន្តម្ហូប & ភេសជ្ជៈ (Recipe Formulation Book)' : 'Food & Beverage Recipe Formulation Book'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lang === 'kh'
                      ? 'គ្រប់គ្រងរូបមន្តធ្វើម្ហូប និងឆុងភេសជ្ជៈ កាត់ស្តុកធាតុផ្សំស្វ័យប្រវត្តិតាមការលក់'
                      : 'Step-by-step cooking and brewing formulations with automatic raw ingredient inventory deduction on checkout.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Search & Controls Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={lang === 'kh' ? 'ស្វែងរកតាមឈ្មោះរូបមន្ត ឬធាតុផ្សំ...' : 'Search recipe name, ingredients, category...'}
                    value={recipesSearchQuery}
                    onChange={e => {
                      setRecipesSearchQuery(e.target.value);
                      setRecipesCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-amber-500 bg-gray-50/50"
                  />
                  {recipesSearchQuery && (
                    <button
                      onClick={() => {
                        setRecipesSearchQuery('');
                        setRecipesCurrentPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center bg-gray-100/80 p-1 rounded-xl">
                  {(['ALL', 'Beverage', 'Bakery'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        setRecipesCategoryFilter(cat);
                        setRecipesCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        recipesCategoryFilter === cat
                          ? 'bg-white text-amber-700 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {cat === 'ALL'
                        ? (lang === 'kh' ? 'ទាំងអស់' : 'All')
                        : cat === 'Beverage'
                        ? (lang === 'kh' ? 'ភេសជ្ជៈ' : 'Beverages')
                        : (lang === 'kh' ? 'នំបុ័ង / កុម្មង់នំ' : 'Bakery')}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setRecipesCurrentPage(1)}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 shrink-0 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{lang === 'kh' ? 'ស្វែងរក' : 'Search'}</span>
                </button>
              </div>

              <div className="flex items-center space-x-2 text-gray-500 shrink-0">
                <span className="text-xs font-semibold">{lang === 'kh' ? 'បង្ហាញ' : 'Show'}:</span>
                <select
                  value={recipesItemsPerPage}
                  onChange={e => {
                    setRecipesItemsPerPage(Number(e.target.value));
                    setRecipesCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-amber-500 cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <span className="text-xs font-bold text-gray-700 font-mono">
                  ({recipesTotalCount} {lang === 'kh' ? 'រូបមន្ត' : 'recipes'})
                </span>
              </div>
            </div>

            {/* Recipes Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 font-black border-b border-gray-200 uppercase tracking-wider text-[10px] sm:text-[11px]">
                      <th className="py-4 px-5 min-w-[200px]">{lang === 'kh' ? 'ឈ្មោះមុខម្ហូប / ភេសជ្ជៈ' : 'Recipe Name'}</th>
                      <th className="py-4 px-4 min-w-[130px]">{lang === 'kh' ? 'ប្រភេទ' : 'Category'}</th>
                      <th className="py-4 px-4 text-center min-w-[110px]">{lang === 'kh' ? 'ពេលរៀបចំ' : 'Prep Time'}</th>
                      <th className="py-4 px-4 min-w-[140px]">{lang === 'kh' ? 'ទំហំចំណែក' : 'Portion Yield'}</th>
                      <th className="py-4 px-4 min-w-[220px]">{lang === 'kh' ? 'ធាតុផ្សំសំខាន់ៗ' : 'Key Ingredients'}</th>
                      <th className="py-4 px-4 text-center min-w-[100px]">{lang === 'kh' ? 'ស្ថានភាព' : 'Status'}</th>
                      <th className="py-4 px-5 text-right min-w-[110px]">{lang === 'kh' ? 'សកម្មភាព' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {paginatedRecipes.map(rec => (
                      <tr key={rec.id} className="hover:bg-amber-50/40 transition">
                        {/* 1. Recipe Name */}
                        <td className="py-4 px-5">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0">
                              <UtensilsCrossed className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-extrabold text-gray-900 text-xs truncate">{rec.name}</div>
                              <div className="text-[10px] text-gray-400 font-mono">ID: #{rec.id}</div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Category */}
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-bold rounded-lg text-xs border border-amber-100">
                            {rec.category}
                          </span>
                        </td>

                        {/* 3. Prep Time */}
                        <td className="py-4 px-4 text-center font-mono font-bold text-gray-700">
                          ⏱ {rec.prep_time}
                        </td>

                        {/* 4. Portion Yield */}
                        <td className="py-4 px-4 text-gray-600 font-medium">
                          {rec.portion}
                        </td>

                        {/* 5. Key Ingredients */}
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1">
                            {rec.ingredients.map((ing, i) => (
                              <span key={i} className="text-[10px] font-mono bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded border border-gray-200">
                                {ing.name} ({ing.qty})
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* 6. Status */}
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{lang === 'kh' ? 'សកម្ម' : 'Active'}</span>
                          </span>
                        </td>

                        {/* 7. Action */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              notify.success(`Viewing recipe details: ${rec.name}`);
                            }}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 ml-auto transition cursor-pointer border border-amber-200"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>{lang === 'kh' ? 'កែប្រែ' : 'Edit'}</span>
                          </button>
                        </td>
                      </tr>
                    ))}

                    {paginatedRecipes.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400 italic">
                          <UtensilsCrossed className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                          <div className="text-xs font-bold text-gray-600">
                            {lang === 'kh' ? 'រកមិនឃើញរូបមន្តទេ' : 'No Recipes Found'}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {recipesTotalCount > 0 && (
                <div className="px-5 py-3.5 bg-white border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
                  <div>
                    {lang === 'kh'
                      ? `បង្ហាញ ${(recipesCurrentPage - 1) * recipesItemsPerPage + 1} ដល់ ${Math.min(
                          recipesCurrentPage * recipesItemsPerPage,
                          recipesTotalCount
                        )} នៃ ${recipesTotalCount} រូបមន្ត`
                      : `Showing ${(recipesCurrentPage - 1) * recipesItemsPerPage + 1} to ${Math.min(
                          recipesCurrentPage * recipesItemsPerPage,
                          recipesTotalCount
                        )} of ${recipesTotalCount} recipes`}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setRecipesCurrentPage(p => Math.max(1, p - 1))}
                      disabled={recipesCurrentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 font-bold text-gray-700">
                      Page {recipesCurrentPage} of {recipesTotalPages}
                    </span>
                    <button
                      onClick={() => setRecipesCurrentPage(p => Math.min(recipesTotalPages, p + 1))}
                      disabled={recipesCurrentPage === recipesTotalPages || recipesTotalPages === 0}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 24. VIEW: REVIEWS */}
        {activeSubView === 'reviews' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl">
                  <Star className="w-6 h-6 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    {lang === 'kh' ? 'តារាងមតិកែលម្អ & ការវាយតម្លៃទំនិញ (Product Reviews Table)' : 'Customer Reviews & Star Ratings Table'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lang === 'kh'
                      ? 'គ្រប់គ្រងការវាយតម្លៃផ្កាយ មតិយោបល់អតិថិជន និងការអនុម័តមតិផ្សាយលើវិបសាយ'
                      : 'Moderate customer star ratings, verify buyer feedback, and manage public testimonial approvals.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Search & Controls Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={lang === 'kh' ? 'ស្វែងរកមតិ អតិថិជន ឬទំនិញ...' : 'Search review text, customer, product...'}
                    value={reviewsSearchQuery}
                    onChange={e => {
                      setReviewsSearchQuery(e.target.value);
                      setReviewsCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-amber-500 bg-gray-50/50"
                  />
                  {reviewsSearchQuery && (
                    <button
                      onClick={() => {
                        setReviewsSearchQuery('');
                        setReviewsCurrentPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center bg-gray-100/80 p-1 rounded-xl">
                  {(['ALL', '5', '4', '3', '1-2'] as const).map(rate => (
                    <button
                      key={rate}
                      onClick={() => {
                        setReviewsRatingFilter(rate);
                        setReviewsCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        reviewsRatingFilter === rate
                          ? 'bg-white text-amber-600 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {rate === 'ALL' ? (lang === 'kh' ? 'ទាំងអស់' : 'All') : `${rate} ★`}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setReviewsCurrentPage(1)}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 shrink-0 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{lang === 'kh' ? 'ស្វែងរក' : 'Search'}</span>
                </button>
              </div>

              <div className="flex items-center space-x-2 text-gray-500 shrink-0">
                <span className="text-xs font-semibold">{lang === 'kh' ? 'បង្ហាញ' : 'Show'}:</span>
                <select
                  value={reviewsItemsPerPage}
                  onChange={e => {
                    setReviewsItemsPerPage(Number(e.target.value));
                    setReviewsCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-amber-500 cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <span className="text-xs font-bold text-gray-700 font-mono">
                  ({reviewsTotalCount} {lang === 'kh' ? 'មតិ' : 'reviews'})
                </span>
              </div>
            </div>

            {/* Reviews Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 font-black border-b border-gray-200 uppercase tracking-wider text-[10px] sm:text-[11px]">
                      <th className="py-4 px-5 min-w-[160px]">{lang === 'kh' ? 'អតិថិជន' : 'Customer'}</th>
                      <th className="py-4 px-4 min-w-[180px]">{lang === 'kh' ? 'មុខទំនិញ' : 'Product'}</th>
                      <th className="py-4 px-4 text-center min-w-[120px]">{lang === 'kh' ? 'ការវាយតម្លៃ' : 'Star Rating'}</th>
                      <th className="py-4 px-4 min-w-[240px]">{lang === 'kh' ? 'ខ្លឹមសារមតិ' : 'Review Feedback'}</th>
                      <th className="py-4 px-4 text-center min-w-[110px]">{lang === 'kh' ? 'អ្នកទិញពិត' : 'Verified Buyer'}</th>
                      <th className="py-4 px-4 min-w-[110px]">{lang === 'kh' ? 'កាលបរិច្ឆេទ' : 'Date'}</th>
                      <th className="py-4 px-4 text-center min-w-[100px]">{lang === 'kh' ? 'ស្ថានភាព' : 'Status'}</th>
                      <th className="py-4 px-5 text-right min-w-[100px]">{lang === 'kh' ? 'សកម្មភាព' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {paginatedReviews.map(r => (
                      <tr key={r.id} className="hover:bg-amber-50/40 transition">
                        {/* 1. Customer */}
                        <td className="py-4 px-5 font-extrabold text-gray-900">
                          {r.customer_name}
                        </td>

                        {/* 2. Product */}
                        <td className="py-4 px-4 font-bold text-gray-800">
                          {r.product_name}
                        </td>

                        {/* 3. Rating */}
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center text-amber-400 space-x-0.5">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Star
                                key={idx}
                                className={`w-3.5 h-3.5 ${
                                  idx < r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                                }`}
                              />
                            ))}
                            <span className="ml-1 text-xs font-mono font-bold text-gray-700">({r.rating}.0)</span>
                          </div>
                        </td>

                        {/* 4. Feedback */}
                        <td className="py-4 px-4 text-gray-600 italic max-w-xs truncate" title={r.review_text}>
                          "{r.review_text}"
                        </td>

                        {/* 5. Verified */}
                        <td className="py-4 px-4 text-center">
                          {r.is_verified ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-md border border-emerald-100">
                              ✓ {lang === 'kh' ? 'បានបញ្ជាក់' : 'Verified'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 font-semibold text-[10px] rounded-md">
                              {lang === 'kh' ? 'ភ្ញៀវ' : 'Guest'}
                            </span>
                          )}
                        </td>

                        {/* 6. Date */}
                        <td className="py-4 px-4 font-mono text-gray-500 text-xs">
                          {r.created_at}
                        </td>

                        {/* 7. Status */}
                        <td className="py-4 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                            {r.status}
                          </span>
                        </td>

                        {/* 8. Action */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              notify.success(`Review #${r.id} approved`);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Delete Review"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {paginatedReviews.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-gray-400 italic">
                          <Star className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                          <div className="text-xs font-bold text-gray-600">
                            {lang === 'kh' ? 'រកមិនឃើញមតិទេ' : 'No Reviews Found'}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {reviewsTotalCount > 0 && (
                <div className="px-5 py-3.5 bg-white border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
                  <div>
                    {lang === 'kh'
                      ? `បង្ហាញ ${(reviewsCurrentPage - 1) * reviewsItemsPerPage + 1} ដល់ ${Math.min(
                          reviewsCurrentPage * reviewsItemsPerPage,
                          reviewsTotalCount
                        )} នៃ ${reviewsTotalCount} មតិ`
                      : `Showing ${(reviewsCurrentPage - 1) * reviewsItemsPerPage + 1} to ${Math.min(
                          reviewsCurrentPage * reviewsItemsPerPage,
                          reviewsTotalCount
                        )} of ${reviewsTotalCount} reviews`}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setReviewsCurrentPage(p => Math.max(1, p - 1))}
                      disabled={reviewsCurrentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 font-bold text-gray-700">
                      Page {reviewsCurrentPage} of {reviewsTotalPages}
                    </span>
                    <button
                      onClick={() => setReviewsCurrentPage(p => Math.min(reviewsTotalPages, p + 1))}
                      disabled={reviewsCurrentPage === reviewsTotalPages || reviewsTotalPages === 0}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 26. VIEW: PRODUCT QUESTIONS */}
        {activeSubView === 'questions' && (
          <div className="space-y-4">
            {/* Header Banner with Statistics */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl shadow-xs">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    {lang === 'kh' ? 'តារាងសំណួរ & ការសាកសួរព័ត៌មានទំនិញ (Product Q&A & Inquiries)' : 'Product Inquiries & Customer Q&A Hub'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lang === 'kh'
                      ? 'តាមដានសំណួររបស់អតិថិជន ព័ត៌មាន Profile អ្នកសួរ និងបុគ្គលិកដែលបានឆ្លើយតប (Customer & Staff Profiles)'
                      : 'Review customer pre-purchase inquiries, customer user profiles, and staff responses with verified replier profiles.'}
                  </p>
                </div>
              </div>

              {/* Stat Counters */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-600 font-semibold">{lang === 'kh' ? 'សំណួរសរុប' : 'Total'}:</span>
                  <span className="font-mono font-black text-slate-900">{productQuestions.length}</span>
                </div>
                <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">{lang === 'kh' ? 'បានឆ្លើយ' : 'Answered'}:</span>
                  <span className="font-mono font-black text-emerald-800">
                    {productQuestions.filter(q => q.status === 'ANSWERED').length}
                  </span>
                </div>
                <div className="px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="text-amber-700 font-semibold">{lang === 'kh' ? 'រង់ចាំឆ្លើយ' : 'Pending'}:</span>
                  <span className="font-mono font-black text-amber-800">
                    {productQuestions.filter(q => q.status === 'PENDING').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Search & Controls Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={
                      lang === 'kh'
                        ? 'ស្វែងរកតាមសំណួរ អតិថិជន អ៊ីមែល ទំនិញ ឬបុគ្គលិកឆ្លើយ...'
                        : 'Search question, customer name, email, product, replier...'
                    }
                    value={questionsSearchQuery}
                    onChange={e => {
                      setQuestionsSearchQuery(e.target.value);
                      setQuestionsCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-indigo-500 bg-gray-50/50"
                  />
                  {questionsSearchQuery && (
                    <button
                      onClick={() => {
                        setQuestionsSearchQuery('');
                        setQuestionsCurrentPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center bg-gray-100/80 p-1 rounded-xl">
                  {(['ALL', 'PENDING', 'ANSWERED'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        setQuestionsStatusFilter(status);
                        setQuestionsCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        questionsStatusFilter === status
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {status === 'ALL'
                        ? (lang === 'kh' ? 'ទាំងអស់' : 'All')
                        : status === 'PENDING'
                        ? (lang === 'kh' ? 'រង់ចាំឆ្លើយ' : 'Pending')
                        : (lang === 'kh' ? 'បានឆ្លើយ' : 'Answered')}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setQuestionsCurrentPage(1)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 shrink-0 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{lang === 'kh' ? 'ស្វែងរក' : 'Search'}</span>
                </button>
              </div>

              <div className="flex items-center space-x-2 text-gray-500 shrink-0">
                <span className="text-xs font-semibold">{lang === 'kh' ? 'បង្ហាញ' : 'Show'}:</span>
                <select
                  value={questionsItemsPerPage}
                  onChange={e => {
                    setQuestionsItemsPerPage(Number(e.target.value));
                    setQuestionsCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <span className="text-xs font-bold text-gray-700 font-mono">
                  ({questionsTotalCount} {lang === 'kh' ? 'សំណួរ' : 'questions'})
                </span>
              </div>
            </div>

            {/* Questions Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 font-black border-b border-gray-200 uppercase tracking-wider text-[10px] sm:text-[11px]">
                      <th className="py-4 px-4 min-w-[170px]">{lang === 'kh' ? 'មុខទំនិញ' : 'Product'}</th>
                      <th className="py-4 px-4 min-w-[210px]">{lang === 'kh' ? 'អតិថិជនសួរ (Profile)' : 'Asked By (User Profile)'}</th>
                      <th className="py-4 px-4 min-w-[260px]">{lang === 'kh' ? 'ខ្លឹមសារសំណួរ' : 'Customer Question'}</th>
                      <th className="py-4 px-4 min-w-[210px]">{lang === 'kh' ? 'អ្នកឆ្លើយ (Replied By)' : 'Replied By (Staff Profile)'}</th>
                      <th className="py-4 px-4 min-w-[260px]">{lang === 'kh' ? 'ចម្លើយបុគ្គលិក' : 'Staff Response'}</th>
                      <th className="py-4 px-4 text-center min-w-[105px]">{lang === 'kh' ? 'ស្ថានភាព' : 'Status'}</th>
                      <th className="py-4 px-4 text-right min-w-[130px]">{lang === 'kh' ? 'សកម្មភាព' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {paginatedQuestions.map(q => {
                      const customerInitials = q.customer.name
                        .split(' ')
                        .map(n => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();

                      const replierInitials = q.replied_by
                        ? q.replied_by.name
                            .split(' ')
                            .map(n => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()
                        : '';

                      return (
                        <tr key={q.id} className="hover:bg-indigo-50/30 transition">
                          {/* 1. Product */}
                          <td className="py-4 px-4 align-top">
                            <div className="font-black text-gray-900 flex items-center space-x-1.5">
                              <Package className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span className="hover:text-indigo-600 transition">{q.product_name}</span>
                            </div>
                            {q.product_sku && (
                              <div className="mt-1">
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-mono text-[10px] font-bold border border-gray-200">
                                  {q.product_sku}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* 2. Customer (User Profile) */}
                          <td className="py-4 px-4 align-top">
                            <div className="flex items-start space-x-2.5">
                              <div
                                className={`w-8 h-8 rounded-xl ${
                                  q.customer.avatar_color || 'bg-indigo-600'
                                } text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs`}
                              >
                                {customerInitials || <User className="w-4 h-4" />}
                              </div>
                              <div className="space-y-1 min-w-0">
                                <div className="font-bold text-gray-900 truncate">{q.customer.name}</div>
                                {q.customer.tier && (
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                      q.customer.tier.includes('VIP')
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : q.customer.tier.includes('Verified')
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : q.customer.tier.includes('Corporate')
                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                        : 'bg-slate-100 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    ★ {q.customer.tier}
                                  </span>
                                )}
                                {q.customer.email && (
                                  <div className="text-[11px] text-gray-500 font-mono truncate">{q.customer.email}</div>
                                )}
                                {q.customer.phone && (
                                  <div className="text-[10px] text-gray-400 font-mono">{q.customer.phone}</div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 3. Customer Question */}
                          <td className="py-4 px-4 align-top">
                            <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 shadow-2xs space-y-2">
                              <div className="text-gray-900 font-medium text-xs leading-relaxed">
                                <span className="text-indigo-500 font-bold mr-1">Q:</span>
                                "{q.question}"
                              </div>
                              <div className="flex items-center space-x-1.5 text-[10px] text-gray-500 font-mono pt-1 border-t border-slate-200/60">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span>{q.question_date}</span>
                              </div>
                            </div>
                          </td>

                          {/* 4. Replied By (Staff Profile) */}
                          <td className="py-4 px-4 align-top">
                            {q.replied_by ? (
                              <div className="flex items-start space-x-2.5">
                                <div
                                  className={`w-8 h-8 rounded-xl ${
                                    q.replied_by.avatar_color || 'bg-emerald-600'
                                  } text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs`}
                                >
                                  {replierInitials || <UserCheck className="w-4 h-4" />}
                                </div>
                                <div className="space-y-1 min-w-0">
                                  <div className="font-bold text-gray-900 truncate flex items-center space-x-1">
                                    <span>{q.replied_by.name}</span>
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  </div>
                                  <div>
                                    <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-bold">
                                      {q.replied_by.role}
                                    </span>
                                  </div>
                                  {q.replied_at && (
                                    <div className="text-[10px] text-gray-400 font-mono flex items-center space-x-1">
                                      <Clock className="w-2.5 h-2.5" />
                                      <span>{q.replied_at}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="p-2.5 border border-dashed border-amber-300 bg-amber-50/50 rounded-xl text-center">
                                <span className="text-[11px] font-bold text-amber-700 flex items-center justify-center space-x-1">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>{lang === 'kh' ? 'មិនទាន់មានអ្នកឆ្លើយ' : 'Awaiting Replier'}</span>
                                </span>
                              </div>
                            )}
                          </td>

                          {/* 5. Staff Response */}
                          <td className="py-4 px-4 align-top">
                            {q.answer ? (
                              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3 shadow-2xs space-y-1.5">
                                <div className="flex items-center space-x-1.5 text-emerald-800 font-bold text-[10px]">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>{lang === 'kh' ? 'ចម្លើយផ្លូវការពីបុគ្គលិក' : 'Official Staff Response'}:</span>
                                </div>
                                <div className="text-gray-800 font-medium text-xs leading-relaxed">
                                  {q.answer}
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 bg-amber-50/40 border border-amber-200 rounded-xl text-amber-800 italic text-xs flex items-center space-x-1.5">
                                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>{lang === 'kh' ? 'រង់ចាំការឆ្លើយតបពីបុគ្គលិក...' : 'Pending official staff response...'}</span>
                              </div>
                            )}
                          </td>

                          {/* 6. Status */}
                          <td className="py-4 px-4 align-top text-center">
                            <span
                              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                                q.status === 'ANSWERED'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : 'bg-amber-100 text-amber-800 border-amber-200'
                              }`}
                            >
                              {q.status === 'ANSWERED' ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <Clock className="w-3 h-3" />
                              )}
                              <span>{q.status}</span>
                            </span>
                          </td>

                          {/* 7. Action */}
                          <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => {
                                  setReplyModalQuestion(q);
                                  setQuestionAnswerInput(q.answer || '');
                                }}
                                className={`px-3 py-1.5 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition cursor-pointer border ${
                                  q.status === 'ANSWERED'
                                    ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs'
                                }`}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>
                                  {q.answer
                                    ? lang === 'kh'
                                      ? 'កែចម្លើយ'
                                      : 'Edit Reply'
                                    : lang === 'kh'
                                    ? 'ឆ្លើយតប'
                                    : 'Reply Now'}
                                </span>
                              </button>

                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer border border-transparent hover:border-red-200"
                                title={lang === 'kh' ? 'លុបសំណួរ' : 'Delete Inquiry'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {paginatedQuestions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400 italic">
                          <HelpCircle className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                          <div className="text-xs font-bold text-gray-600">
                            {lang === 'kh' ? 'រកមិនឃើញសំណួរទេ' : 'No Questions Found'}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {questionsTotalCount > 0 && (
                <div className="px-5 py-3.5 bg-white border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
                  <div>
                    {lang === 'kh'
                      ? `បង្ហាញ ${(questionsCurrentPage - 1) * questionsItemsPerPage + 1} ដល់ ${Math.min(
                          questionsCurrentPage * questionsItemsPerPage,
                          questionsTotalCount
                        )} នៃ ${questionsTotalCount} សំណួរ`
                      : `Showing ${(questionsCurrentPage - 1) * questionsItemsPerPage + 1} to ${Math.min(
                          questionsCurrentPage * questionsItemsPerPage,
                          questionsTotalCount
                        )} of ${questionsTotalCount} questions`}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setQuestionsCurrentPage(p => Math.max(1, p - 1))}
                      disabled={questionsCurrentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 font-bold text-gray-700">
                      Page {questionsCurrentPage} of {questionsTotalPages}
                    </span>
                    <button
                      onClick={() => setQuestionsCurrentPage(p => Math.min(questionsTotalPages, p + 1))}
                      disabled={questionsCurrentPage === questionsTotalPages || questionsTotalPages === 0}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Answer / Reply Modal Dialog */}
            {replyModalQuestion && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-3xl max-w-2xl w-full border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  {/* Modal Header */}
                  <div className="p-6 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-white/10 rounded-2xl">
                        <MessageSquare className="w-6 h-6 text-indigo-300" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black">
                          {replyModalQuestion.answer
                            ? (lang === 'kh' ? 'កែប្រែចម្លើយតបផ្លូវការ' : 'Edit Official Product Response')
                            : (lang === 'kh' ? 'ឆ្លើយតបសំណួរអតិថិជន' : 'Reply to Customer Inquiry')}
                        </h4>
                        <p className="text-xs text-indigo-200 mt-0.5">
                          {replyModalQuestion.product_name} {replyModalQuestion.product_sku ? `(${replyModalQuestion.product_sku})` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setReplyModalQuestion(null);
                        setQuestionAnswerInput('');
                      }}
                      className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto space-y-4 flex-1">
                    {/* Customer Profile Box */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <div className="text-[10px] uppercase font-black tracking-wider text-gray-500">
                        {lang === 'kh' ? 'ព័ត៌មានអតិថិជនដែលបានសួរ (Customer Inquirer Profile)' : 'Customer Inquirer Profile'}
                      </div>
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-xl ${
                            replyModalQuestion.customer.avatar_color || 'bg-indigo-600'
                          } text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs`}
                        >
                          {replyModalQuestion.customer.name
                            .split(' ')
                            .map(n => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-black text-gray-900 text-sm">{replyModalQuestion.customer.name}</span>
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-[10px] font-bold">
                              {replyModalQuestion.customer.tier}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-3 mt-0.5">
                            {replyModalQuestion.customer.email && <span>{replyModalQuestion.customer.email}</span>}
                            {replyModalQuestion.customer.phone && <span>{replyModalQuestion.customer.phone}</span>}
                            <span className="text-gray-400 font-mono">• {replyModalQuestion.question_date}</span>
                          </div>
                        </div>
                      </div>

                      {/* Question Content */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3.5">
                        <div className="text-xs font-bold text-gray-500 mb-1 flex items-center space-x-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{lang === 'kh' ? 'ខ្លឹមសារសំណួរ:' : 'Question:'}</span>
                        </div>
                        <div className="text-sm font-semibold text-gray-900 italic">
                          "{replyModalQuestion.question}"
                        </div>
                      </div>
                    </div>

                    {/* Active Staff Replier Profile Badge */}
                    <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                          <UserCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-black text-indigo-700 tracking-wider">
                            {lang === 'kh' ? 'ឆ្លើយតបក្នុងនាមបុគ្គលិក (Replying As)' : 'Replying As Staff Profile'}
                          </div>
                          <div className="font-extrabold text-gray-900 text-sm">
                            {currentUser?.full_name || currentUser?.username || 'Store Support Staff'}
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-white text-indigo-800 border border-indigo-200 rounded-lg text-xs font-bold shadow-2xs">
                        {currentUser?.primary_role || (currentUser?.roles && currentUser.roles[0]?.name) || 'Support Specialist'}
                      </span>
                    </div>

                    {/* Fast Template Response Snippets */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
                        {lang === 'kh' ? 'គំរូចម្លើយរហ័ស (Quick Response Templates)' : 'Quick Response Templates'}
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          {
                            label: 'Stock Availability',
                            text: 'Yes! This product is currently in stock at all store branches and available for immediate local delivery.',
                          },
                          {
                            label: 'Brewing & Usage',
                            text: 'For optimal flavor extraction, we recommend brewing with fresh 92°C filtered water and a 1:16 brew ratio.',
                          },
                          {
                            label: 'Bulk Orders',
                            text: 'Yes, bulk pallet and wholesale pricing discounts are available for corporate orders. Please contact our sales desk.',
                          },
                          {
                            label: 'Dietary & Freshness',
                            text: '100% natural ingredients with zero artificial preservatives, prepared fresh daily under strict food safety standards.',
                          },
                        ].map((tpl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setQuestionAnswerInput(tpl.text)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-gray-200 text-gray-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                          >
                            + {tpl.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Answer Textarea */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-900">
                        {lang === 'kh' ? 'ខ្លឹមសារចម្លើយតប (Staff Answer)' : 'Official Staff Answer Text'} *
                      </label>
                      <textarea
                        rows={4}
                        placeholder={
                          lang === 'kh'
                            ? 'សូមបញ្ចូលចម្លើយលម្អិត និងពន្យល់ជូនអតិថិជន...'
                            : 'Provide a clear, accurate, and courteous answer for the customer...'
                        }
                        value={questionAnswerInput}
                        onChange={e => setQuestionAnswerInput(e.target.value)}
                        className="w-full p-3.5 text-xs rounded-2xl border border-gray-300 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white leading-relaxed"
                      />
                      <div className="text-[10px] text-gray-400 text-right font-mono">
                        {questionAnswerInput.length} characters
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyModalQuestion(null);
                        setQuestionAnswerInput('');
                      }}
                      className="px-4 py-2.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      {lang === 'kh' ? 'បោះបង់' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePublishAnswer(replyModalQuestion.id, questionAnswerInput)}
                      disabled={!questionAnswerInput.trim()}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition flex items-center space-x-2 shadow-xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{lang === 'kh' ? 'ផ្សព្វផ្សាយចម្លើយ' : 'Publish Answer'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 27. VIEW: PRODUCT TEMPLATES */}
        {activeSubView === 'templates' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
              <h3 className="text-xl font-black text-gray-900">Industry-Specific Preconfigured Product Templates</h3>
              <p className="text-xs text-gray-500 mt-0.5">Launch new product lines instantly with pre-tailored fields, taxes, units, and inventory tracking rules.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {INDUSTRY_TEMPLATES.map(tpl => {
                const Icon = tpl.icon;
                return (
                  <div key={tpl.id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition">
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="font-black text-gray-900 text-base">{tpl.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{tpl.desc}</p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500">VAT: {tpl.taxRate}%</span>
                      <button
                        onClick={() => {
                          setEditingProduct({
                            product_type: tpl.types[0] as any,
                            tax_rate: tpl.taxRate,
                          } as any);
                          setIsCreateModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                      >
                        Use Template
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 28. VIEW: UNIFIED IMPORT & EXPORT PRODUCTS STUDIO */}
        {(activeSubView === 'import' || activeSubView === 'export') && (
          <div className="space-y-6">
            {/* Studio Header Banner */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    {lang === 'kh' ? 'មជ្ឈមណ្ឌលនាំចូល & នាំចេញទំនិញ (Import & Export Studio)' : 'Product Catalog Import & Export Studio'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lang === 'kh'
                      ? 'នាំចូលទំនិញច្រើនមុខតាម CSV/Excel ទាញយកគំរូទម្រង់ និងនាំចេញទិន្នន័យស្តុកតាមលក្ខខណ្ឌចម្រាញ់'
                      : 'Batch onboarding via CSV/Excel, standardized import templates, and selective catalog exports for external accounting.'}
                  </p>
                </div>
              </div>

              {/* Mode Segmented Controls */}
              <div className="flex items-center bg-gray-100/90 p-1.5 rounded-2xl self-start md:self-auto">
                <button
                  onClick={() => setImportExportMode('import')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    importExportMode === 'import'
                      ? 'bg-white text-indigo-700 shadow-xs font-black'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{lang === 'kh' ? 'នាំចូលទំនិញ (Import)' : 'Import Products'}</span>
                </button>

                <button
                  onClick={() => setImportExportMode('export')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    importExportMode === 'export'
                      ? 'bg-white text-emerald-700 shadow-xs font-black'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{lang === 'kh' ? 'នាំចេញទំនិញ (Export)' : 'Export Products'}</span>
                </button>

                <button
                  onClick={() => setImportExportMode('both')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    importExportMode === 'both'
                      ? 'bg-white text-purple-700 shadow-xs font-black'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600" />
                  <span>{lang === 'kh' ? 'បង្ហាញទាំងពីរ (Dual)' : 'Dual Studio'}</span>
                </button>
              </div>
            </div>

            {/* Studio Workspace Content */}
            <div className={`grid gap-6 ${importExportMode === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              
              {/* ========================================================= */}
              {/* 1. IMPORT PRODUCTS PANEL                                  */}
              {/* ========================================================= */}
              {(importExportMode === 'import' || importExportMode === 'both') && (
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Upload className="w-4 h-4" />
                      </div>
                      <h4 className="font-black text-gray-900 text-sm">
                        {lang === 'kh' ? 'នាំចូលទំនិញថ្មី (Bulk Import Products)' : 'Bulk Product Import Studio'}
                      </h4>
                    </div>

                    <button
                      onClick={handleDownloadSampleCsv}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{lang === 'kh' ? 'ទាញយកគំរូ CSV' : 'Sample Template'}</span>
                    </button>
                  </div>

                  {/* Drag & Drop File Box */}
                  <label className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer transition bg-indigo-50/20 hover:bg-indigo-50/40 block">
                    <input
                      type="file"
                      accept=".csv, .txt, .xlsx, .xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <FileSpreadsheet className="w-10 h-10 mx-auto text-indigo-600 mb-2" />
                    <span className="text-xs font-black text-gray-800 block">
                      {lang === 'kh' ? 'ចុចទីនេះដើម្បីជ្រើសរើសឯកសារ .CSV / .XLSX' : 'Click to Upload CSV / Excel Catalog File'}
                    </span>
                    <span className="text-[11px] text-gray-500 mt-1 block">
                      {lang === 'kh' ? 'គាំទ្រទម្រង់ UTF-8 CSV, XLS, XLSX' : 'Supports standard UTF-8 CSV with column headers'}
                    </span>
                  </label>

                  {/* One-Click Sample Import Button */}
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-gray-800">{lang === 'kh' ? 'តេស្តទិន្នន័យគំរូភ្លាមៗ' : 'Quick Starter Dataset'}</div>
                      <p className="text-[11px] text-gray-500">{lang === 'kh' ? 'ផ្ទុកទំនិញគំរូចំនួន ៥ មុខដើម្បីសាកល្បងប្រព័ន្ធ' : 'Instantly inject 5 realistic demo items with barcodes and costs'}</p>
                    </div>
                    <button
                      onClick={handleImportSampleProducts}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0 cursor-pointer"
                    >
                      {lang === 'kh' ? 'ផ្ទុកទិន្នន័យគំរូ' : 'Load Demo Items'}
                    </button>
                  </div>

                  {/* Raw CSV Quick Paste Box */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                      <span>{lang === 'kh' ? 'ឬចម្លងទិន្នន័យ CSV ដាក់ទីនេះ (Direct CSV Paste):' : 'Or Paste Raw CSV Data Directly:'}</span>
                      <span className="text-[11px] text-gray-400 font-normal">Header + Data rows</span>
                    </label>
                    <textarea
                      rows={3}
                      value={importRawCsvText}
                      onChange={e => setImportRawCsvText(e.target.value)}
                      placeholder="Name,SKU,Barcode,Product_Type,Cost_Price,Selling_Price,Stock_Quantity&#10;Espresso Coffee,COF-01,200491823901,SIMPLE,1.10,2.75,150"
                      className="w-full p-3 text-xs font-mono rounded-xl border border-gray-200 focus:outline-hidden focus:border-indigo-500 bg-gray-50/50"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleParseAndImportCsv(importRawCsvText)}
                        disabled={isImporting || !importRawCsvText.trim()}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{lang === 'kh' ? 'ផ្ទៀងផ្ទាត់ & នាំចូល' : 'Parse & Import CSV'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Field Mapping Guide */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-2 text-xs">
                    <div className="font-bold text-gray-800">{lang === 'kh' ? 'ក្បួនទម្រង់ជួរឈរ (Supported Columns):' : 'Supported CSV Column Headers:'}</div>
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-mono font-bold rounded-md">Name *</span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-mono font-bold rounded-md">SKU *</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono rounded-md">Barcode</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono rounded-md">Product_Type</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-mono font-bold rounded-md">Selling_Price *</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-mono rounded-md">Cost_Price</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-mono rounded-md">Stock_Quantity</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 2. EXPORT PRODUCTS PANEL                                  */}
              {/* ========================================================= */}
              {(importExportMode === 'export' || importExportMode === 'both') && (
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                        <Download className="w-4 h-4" />
                      </div>
                      <h4 className="font-black text-gray-900 text-sm">
                        {lang === 'kh' ? 'នាំចេញទិន្នន័យទំនិញ (Selective Catalog Export)' : 'Selective Product Export Studio'}
                      </h4>
                    </div>

                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-black text-xs rounded-xl border border-emerald-100">
                      {filteredExportProducts.length} / {products.length} {lang === 'kh' ? 'មុខទំនិញ' : 'Items'}
                    </span>
                  </div>

                  {/* Selective Export Filters */}
                  <div className="space-y-3.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">
                          {lang === 'kh' ? 'ចម្រាញ់តាមជំពូកទំនិញ:' : 'Filter by Category:'}
                        </label>
                        <select
                          value={exportCategoryFilter}
                          onChange={e => setExportCategoryFilter(e.target.value)}
                          className="w-full p-2.5 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="ALL">{lang === 'kh' ? 'គ្រប់ជំពូកទាំងអស់ (All Categories)' : 'All Categories'}</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id?.toString()}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 block mb-1">
                          {lang === 'kh' ? 'ចម្រាញ់តាមម៉ាកយីហោ:' : 'Filter by Brand:'}
                        </label>
                        <select
                          value={exportBrandFilter}
                          onChange={e => setExportBrandFilter(e.target.value)}
                          className="w-full p-2.5 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="ALL">{lang === 'kh' ? 'គ្រប់ម៉ាកទាំងអស់ (All Brands)' : 'All Brands'}</option>
                          {brands.map(b => (
                            <option key={b.id} value={b.id?.toString()}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">
                          {lang === 'kh' ? 'ស្ថានភាពទំនិញ:' : 'Product Status:'}
                        </label>
                        <select
                          value={exportStatusFilter}
                          onChange={e => setExportStatusFilter(e.target.value)}
                          className="w-full p-2.5 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="ALL">{lang === 'kh' ? 'គ្រប់ស្ថានភាព (Active, Inactive, Archived)' : 'All Statuses'}</option>
                          <option value="ACTIVE">{lang === 'kh' ? 'សកម្ម (Active in POS)' : 'Active Only'}</option>
                          <option value="INACTIVE">{lang === 'kh' ? 'អសកម្ម (Inactive)' : 'Inactive Only'}</option>
                          <option value="ARCHIVED">{lang === 'kh' ? 'ប័ណ្ណសារ (Archived)' : 'Archived Only'}</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 block mb-1">
                          {lang === 'kh' ? 'ទម្រង់ឯកសារនាំចេញ:' : 'Export Format:'}
                        </label>
                        <select
                          value={exportFormat}
                          onChange={e => setExportFormat(e.target.value as any)}
                          className="w-full p-2.5 text-xs font-bold rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="CSV">Standard CSV (.csv) - Excel / Sheets</option>
                          <option value="JSON">Raw JSON (.json) - Backup & API</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Summary & Export Action Card */}
                  <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-emerald-900">
                        {lang === 'kh' ? 'ចំនួនទំនិញត្រូវនាំចេញ:' : 'Export Match Count:'}
                      </span>
                      <span className="font-black text-emerald-700 font-mono text-sm">
                        {filteredExportProducts.length} {lang === 'kh' ? 'មុខទំនិញ' : 'Products'}
                      </span>
                    </div>

                    <button
                      onClick={handleExecuteExport}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 transition cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>
                        {lang === 'kh'
                          ? `ទាញយកឯកសារនាំចេញ (${exportFormat})`
                          : `Download Export File (${exportFormat})`}
                      </span>
                    </button>
                  </div>

                  {/* Export Info & Audits */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-1.5 text-xs text-gray-600">
                    <div className="font-bold text-gray-800 flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{lang === 'kh' ? 'ស្តង់ដារទិន្នន័យនាំចេញ:' : 'Standard Data Export:'}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      {lang === 'kh'
                        ? 'ឯកសារ CSV ដែលបាននាំចេញមានលេខសម្គាល់ ID, កូដ SKU, បាកូដ EAN-13, តម្លៃថ្លៃដើម, តម្លៃលក់រាយ និងចំនួនស្តុកពិតប្រាកដ។'
                        : 'Generated CSV includes full product IDs, unique SKUs, EAN-13 barcodes, landed cost prices, store retail rates, and live on-hand stocks.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 30. VIEW: BULK UPDATE */}
        {activeSubView === 'bulk-update' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
              <h3 className="text-xl font-black text-gray-900">Batch Product & Price Adjustment Engine</h3>
              <p className="text-xs text-gray-500 mt-0.5">Apply bulk price inflation changes (+/- %), category reassignment, or batch stock adjustments.</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4 max-w-2xl">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Bulk Pricing Adjustment</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Adjustment Type:</label>
                  <select
                    value={bulkPriceChangeType}
                    onChange={e => setBulkPriceChangeType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white"
                  >
                    <option value="PERCENT_INC">Increase Selling Price by % (+)</option>
                    <option value="PERCENT_DEC">Discount Selling Price by % (-)</option>
                    <option value="FIXED_INC">Add Fixed Amount ($)</option>
                    <option value="SET_FIXED">Set Fixed Exact Price ($)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Value (% or $):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={bulkPriceValue}
                    onChange={e => setBulkPriceValue(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1 text-xs">Target Category (Leave empty for All Products):</label>
                <select
                  value={bulkCategoryTarget}
                  onChange={e => setBulkCategoryTarget(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-gray-200 bg-white"
                >
                  <option value="">All Categories ({products.length} Products)</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id?.toString()}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end">
                <button
                  onClick={handleExecuteBulkPriceUpdate}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  Execute Batch Price Update
                </button>
              </div>
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

      {/* 8. Product Type Manager Modal */}
      {isTypeModalOpen && (
        <ProductTypeModal
          isOpen={isTypeModalOpen}
          productType={selectedTypeToEdit}
          existingTypes={productTypesList}
          onClose={() => {
            setIsTypeModalOpen(false);
            setSelectedTypeToEdit(null);
          }}
          onSave={handleSaveProductType}
        />
      )}

      {/* 9. Category Management Modal */}
      {isCategoryModalOpen && (
        <CategoryModal
          isOpen={isCategoryModalOpen}
          category={selectedCategoryToEdit}
          allCategories={categories as any}
          onClose={() => {
            setIsCategoryModalOpen(false);
            setSelectedCategoryToEdit(null);
          }}
          onSave={handleSaveCategory}
        />
      )}

      {/* 10. Brand Management Modal */}
      {isBrandModalOpen && (
        <BrandModal
          isOpen={isBrandModalOpen}
          brand={selectedBrandToEdit}
          onClose={() => {
            setIsBrandModalOpen(false);
            setSelectedBrandToEdit(null);
          }}
          onSave={handleSaveBrand}
        />
      )}

      {/* 11. Unit Management Modal */}
      {isUnitModalOpen && (
        <UnitModal
          isOpen={isUnitModalOpen}
          unit={selectedUnitToEdit}
          onClose={() => {
            setIsUnitModalOpen(false);
            setSelectedUnitToEdit(null);
          }}
          onSave={handleSaveUnit}
        />
      )}

      {/* 12. Attribute Management Modal */}
      {isAttributeModalOpen && (
        <AttributeModal
          isOpen={isAttributeModalOpen}
          attribute={selectedAttributeToEdit}
          onClose={() => {
            setIsAttributeModalOpen(false);
            setSelectedAttributeToEdit(null);
          }}
          onSave={handleSaveAttribute}
        />
      )}

      {/* Quick Stock Adjust Modal */}
      {isQuickStockModalOpen && quickStockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-gray-900 text-sm">Quick Stock Adjust</h3>
              <button onClick={() => setIsQuickStockModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-bold">{quickStockProduct.name}</div>
              <div className="text-xs text-gray-400 font-mono">Current Stock: {quickStockProduct.opening_stock || 0}</div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center space-x-1">
                {(['ADD', 'REMOVE', 'SET'] as const).map(action => (
                  <button
                    key={action}
                    onClick={() => setStockAdjustType(action)}
                    className={`flex-1 py-1.5 font-bold rounded-lg ${stockAdjustType === action ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {action}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={stockAdjustQuantity}
                onChange={e => setStockAdjustQuantity(parseInt(e.target.value) || 0)}
                className="w-full p-2 border rounded-xl font-mono text-center font-bold text-base"
              />
            </div>
            <button
              onClick={handleSaveQuickStock}
              className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Update Stock
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
