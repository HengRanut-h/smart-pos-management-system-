export interface Product {
  id: number;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  cost_price: string | number;
  selling_price: string | number;
  tax_rate?: string | number;
  reorder_level?: string | number;
  image_url?: string;
  category?: { id: number; name: string };
  brand?: { id: number; name: string };
  unit?: { id: number; name: string; symbol?: string };
  available_quantity?: number;
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_amount: number;
  subtotal: number;
  total_amount: number;
}

export interface Sale {
  id: number;
  sale_number: string;
  subtotal: string | number;
  discount_amount: string | number;
  tax_amount: string | number;
  total_amount: string | number;
  paid_amount: string | number;
  change_amount: string | number;
  sale_date: string;
  items?: Array<{
    id: number;
    product_id: number;
    quantity: string | number;
    unit_price: string | number;
    total_amount: string | number;
    product?: Product;
  }>;
}

export interface DashboardMetrics {
  today_sales_count: number;
  today_revenue: number;
  today_revenue_khr?: number;
  today_tax?: number;
  average_basket_size?: number;
  low_stock_alerts_count: number;
  total_customers: number;
  timestamp: string;
  inventory?: {
    total_units: number;
    cost_valuation: number;
    retail_valuation: number;
  };
  profitability?: {
    revenue_7d: number;
    cogs_7d: number;
    gross_profit_7d: number;
    margin_percent: number;
  };
  seven_day_trend?: Array<{
    date: string;
    day: string;
    label: string;
    revenue: number;
    revenue_khr: number;
    orders: number;
    cogs: number;
    profit: number;
    margin_percent: number;
  }>;
  category_breakdown?: Array<{
    name: string;
    revenue: number;
    qty_sold: number;
    percentage: number;
    color: string;
  }>;
  hourly_distribution?: Array<{
    hour: string;
    revenue: number;
    orders: number;
    is_peak: boolean;
  }>;
  payment_tenders?: Array<{
    name: string;
    type: string;
    amount: number;
    count: number;
    percentage: number;
    color: string;
  }>;
  payment_methods?: Array<{
    name: string;
    type: string;
    count: number;
    amount: number;
  }>;
  top_products?: Array<{
    id: number;
    name: string;
    sku: string;
    image_url?: string;
    qty_sold: number;
    revenue: number;
  }>;
  recent_sales?: Array<{
    id: number;
    sale_number: string;
    customer_name: string;
    total_amount: number;
    created_at: string;
    status: string;
  }>;
  hourly_slots?: { [slot: string]: number };
}

export interface Invoice {
  id: number;
  invoice_number: string;
  subtotal: string | number;
  tax_amount: string | number;
  total_amount: string | number;
  paid_amount: string | number;
  balance_amount: string | number;
  invoice_date: string;
}

export interface WarehouseItem {
  id: number;
  code: string;
  name: string;
  type: string;
}

export interface StockItem {
  id: number;
  warehouse_id: number;
  product_id: number;
  quantity: string | number;
  reserved_quantity: string | number;
  available_quantity: string | number;
  reorder_level?: string | number;
  product?: Product;
  warehouse?: WarehouseItem;
}

export interface StockMovementItem {
  id: number;
  product_id: number;
  warehouse_id: number;
  movement_type: string;
  quantity: string | number;
  before_quantity: string | number;
  after_quantity: string | number;
  reference_type?: string;
  reference_id?: number;
  created_at: string;
  product?: Product;
  warehouse?: WarehouseItem;
  creator?: { id: number; username: string };
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  tax_number?: string;
  address?: string;
}

export interface PurchaseItemDetail {
  id: number;
  purchase_id: number;
  product_id: number;
  unit_id: number;
  quantity: string | number;
  received_quantity: string | number;
  unit_cost: string | number;
  subtotal: string | number;
  total_amount: string | number;
  product?: Product;
}

export interface PurchaseOrder {
  id: number;
  purchase_number: string;
  supplier_id: number;
  branch_id: number;
  warehouse_id: number;
  subtotal: string | number;
  discount_amount: string | number;
  tax_amount: string | number;
  shipping_amount: string | number;
  total_amount: string | number;
  paid_amount: string | number;
  balance_amount: string | number;
  status_id: number;
  purchase_date: string;
  notes?: string;
  created_at: string;
  supplier?: Supplier;
  warehouse?: WarehouseItem;
  status?: { id: number; code: string; name: string };
  items?: PurchaseItemDetail[];
}

export interface PosRegister {
  id: number;
  code: string;
  name: string;
  status: string;
}

export interface CashMovement {
  id: number;
  shift_id: number;
  type: string;
  amount: string | number;
  reason: string;
  created_at: string;
}

export interface Shift {
  id: number;
  shift_number: string;
  register_id: number;
  cashier_id: number;
  opened_at: string;
  closed_at?: string;
  opening_cash: string | number;
  expected_cash?: string | number;
  actual_cash?: string | number;
  cash_difference?: string | number;
  status: string;
  notes?: string;
  register?: PosRegister;
  cashier?: { id: number; username: string };
  cash_movements?: CashMovement[];
}

export interface ZReport {
  shift_id: number;
  shift_number: string;
  register: string;
  cashier: string;
  opened_at: string;
  closed_at: string;
  opening_cash: number;
  total_sales_count: number;
  total_sales_amount: number;
  cash_in: number;
  cash_out: number;
  expected_cash: number;
  actual_cash: number;
  cash_difference: number;
  reconciliation_result: 'BALANCED' | 'SHORT' | 'OVER';
  notes?: string;
}

export interface Customer {
  id: number;
  customer_code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  loyalty_points: string | number;
  credit_limit: string | number;
  date_of_birth?: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  user_id?: number;
  type: string;
  title: string;
  message: string;
  channel: string;
  priority: 'HIGH' | 'MEDIUM' | 'INFO';
  reference_type?: string;
  reference_id?: number;
  read_at?: string;
  created_at: string;
}

export interface AuditLogItem {
  id: number;
  user_id?: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  created_at: string;
  user?: { id: number; username: string };
}

export interface BackupStatus {
  database_type: string;
  database_size_kb: number;
  backup_directory: string;
  total_backups: number;
  backups: Array<{
    filename: string;
    size_kb: number;
    created_at: string;
  }>;
  system_status: string;
  auto_backup_enabled: boolean;
  last_backup?: string;
}

export interface SystemSettings {
  store_name: string;
  branch_code: string;
  address: string;
  tax_identification_number: string;
  phone_number: string;
  email: string;
  currency_code: string;
  secondary_currency_code: string;
  exchange_rate: number;
  default_vat_rate: number;
  vat_enabled: boolean;
  bakong_merchant_id: string;
  bakong_account_name: string;
  receipt_printer_type: string;
  auto_print_receipt: boolean;
  receipt_footer_note: string;
}


export interface UserProfile {
  id: number;
  username: string;
  email: string | null;
  phone: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  employee_code: string;
  branch: {
    id: number;
    name: string;
    code: string;
    address?: string;
  };
  roles: Array<{ id: number; name: string; code: string }>;
  primary_role: string;
  permissions: string[];
  status: string;
  last_login_at: string;
  last_login_ip: string;
  stats: {
    active_shift: {
      id: number;
      opened_at: string;
      opening_cash: number;
    } | null;
    today_sales_count: number;
    today_sales_total: number;
  };
}
