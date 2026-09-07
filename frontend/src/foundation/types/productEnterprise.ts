export type ProductType = 
  | 'SIMPLE' 
  | 'VARIABLE' 
  | 'COMBO' 
  | 'SERVICE' 
  | 'DIGITAL' 
  | 'MANUFACTURED' 
  | 'RAW_MATERIAL' 
  | 'BATCH_TRACKED' 
  | 'SERIALIZED' 
  | 'BUNDLE';

export interface UnitConversion {
  id: number;
  from_unit_id: number;
  to_unit_id: number;
  operator: '*' | '/' | '+' | '-';
  operation_value: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductAttributeValue {
  id: number;
  attribute_id: number;
  value: string;
  color_code?: string;
  sort_order: number;
}

export interface ProductAttribute {
  id: number;
  name: string;
  slug: string;
  values?: ProductAttributeValue[];
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  barcode?: string;
  variant_name: string;
  attribute_values?: Record<string, any>;
  cost_price: number;
  selling_price: number;
  wholesale_price?: number;
  stock_quantity: number;
  image_url?: string;
  is_active: boolean;
}

export interface ProductPriceRule {
  id: number;
  product_id: number;
  variant_id?: number;
  tier_name: string;
  min_quantity: number;
  discount_type: 'PERCENTAGE' | 'FIXED_PRICE' | 'DISCOUNT_AMOUNT';
  price_or_discount: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
}

export interface ProductWarehouseLocation {
  id: number;
  product_id: number;
  variant_id?: number;
  warehouse_id: number;
  aisle?: string;
  rack?: string;
  shelf?: string;
  bin?: string;
  quantity: number;
  reserved_quantity: number;
  warehouse?: { id: number; name: string };
}

export interface ProductSupplier {
  id: number;
  product_id: number;
  supplier_id: number;
  supplier_sku?: string;
  cost_price: number;
  lead_time_days: number;
  is_primary: boolean;
  supplier?: { id: number; name: string; contact_phone?: string; email?: string };
}

export interface ProductBundleItem {
  id: number;
  parent_product_id: number;
  child_product_id: number;
  child_variant_id?: number;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  child_product?: EnterpriseProduct;
}

export interface ProductBomItem {
  id: number;
  product_id: number;
  raw_material_id: number;
  quantity_required: number;
  scrap_percentage: number;
  unit_cost: number;
  raw_material?: EnterpriseProduct;
}

export interface ProductBatch {
  id: number;
  product_id: number;
  variant_id?: number;
  batch_number: string;
  lot_number?: string;
  manufactured_date?: string;
  expiry_date: string;
  alert_before_days: number;
  initial_quantity: number;
  remaining_quantity: number;
  cost_per_unit: number;
  status: 'ACTIVE' | 'EXPIRED' | 'RECALLED' | 'DEPLETED';
  product?: EnterpriseProduct;
}

export interface ProductSerialNumber {
  id: number;
  product_id: number;
  variant_id?: number;
  serial_number: string;
  imei?: string;
  mac_address?: string;
  batch_id?: number;
  status: 'AVAILABLE' | 'ALLOCATED' | 'SOLD' | 'DEFECTIVE' | 'RETURNED';
  warranty_months: number;
  product?: EnterpriseProduct;
}

export interface ProductWarranty {
  id: number;
  product_id: number;
  serial_number_id?: number;
  warranty_type: 'MANUFACTURER' | 'SELLER' | 'EXTENDED';
  period_months: number;
  policy_details?: string;
  claim_terms?: string;
  is_active: boolean;
}

export interface ProductQcInspection {
  id: number;
  product_id: number;
  batch_id?: number;
  sample_size: number;
  passed_quantity: number;
  failed_quantity: number;
  defect_reasons?: string;
  inspector_name: string;
  inspection_status: 'PASSED' | 'FAILED' | 'CONDITIONAL';
  inspection_date: string;
  product?: EnterpriseProduct;
}

export interface ProductReview {
  id: number;
  product_id: number;
  customer_id?: number;
  customer_name: string;
  rating: number;
  review_text?: string;
  is_approved: boolean;
  product?: EnterpriseProduct;
  created_at: string;
}

export interface ProductTemplate {
  id: number;
  name: string;
  category_id?: number;
  product_type: ProductType;
  default_attributes?: Record<string, any>;
  default_pricing_tiers?: Record<string, any>;
  tax_rate?: number;
}

export interface ProductAuditLog {
  id: number;
  product_id: number;
  user_id?: number;
  action: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface ProductPriceHistory {
  id: number;
  product_id: number;
  variant_id?: number;
  user_id?: number;
  old_cost_price: number;
  new_cost_price: number;
  old_selling_price: number;
  new_selling_price: number;
  reason?: string;
  created_at: string;
}

export interface EnterpriseProduct {
  id: number;
  sku: string;
  barcode: string;
  name: string;
  description?: string;
  short_description?: string;
  category_id: number;
  brand_id?: number;
  unit_id: number;
  cost_price: number;
  selling_price: number;
  wholesale_price: number;
  vip_price: number;
  member_price: number;
  online_price: number;
  landed_cost: number;
  shipping_cost: number;
  import_tax: number;
  handling_cost: number;
  other_expenses: number;
  tax_rate: number;
  reorder_level?: number;
  min_stock?: number;
  max_stock?: number;
  safety_stock: number;
  reorder_quantity: number;
  opening_stock: number;
  damaged_stock: number;
  expired_stock: number;
  in_transit_stock: number;
  weight?: number;
  dimensions?: { length?: number; width?: number; height?: number };
  status_id: number;
  product_type: ProductType;
  product_code?: string;
  image_url?: string;
  gallery_images?: string[];
  tags?: string[];
  seo_slug?: string;
  seo_title?: string;
  seo_description?: string;
  meta_keywords?: string;
  is_featured: boolean;
  is_new: boolean;
  is_discontinued: boolean;
  visibility?: 'ALL' | 'POS_ONLY' | 'ONLINE_ONLY' | 'HIDDEN';
  rating_avg: number;
  rating_count: number;
  template_id?: number;
  category?: { id: number; name: string };
  brand?: { id: number; name: string };
  unit?: { id: number; name: string; code?: string };
  status?: { id: number; name: string; color?: string };
  variants?: ProductVariant[];
  warehouse_locations?: ProductWarehouseLocation[];
  batches?: ProductBatch[];
  created_at?: string;
  updated_at?: string;
}

export interface ProductDashboardOverview {
  total_products: number;
  active_products: number;
  inactive_products: number;
  draft_products: number;
  out_of_stock: number;
  low_stock: number;
  expired_products: number;
  expiring_soon: number;
  featured_products: number;
  new_products: number;
  discontinued_products: number;
}

export interface ProductDashboardFinancials {
  total_product_cost: number;
  total_stock_value: number;
  potential_sales_value: number;
  potential_profit: number;
  average_margin_percent: number;
}

export interface ProductDashboardData {
  success: boolean;
  overview: ProductDashboardOverview;
  financials: ProductDashboardFinancials;
  by_category: Array<{ id: number; name: string; count: number }>;
  by_brand: Array<{ id: number; name: string; count: number }>;
  by_type: Array<{ product_type: string; count: number }>;
}
