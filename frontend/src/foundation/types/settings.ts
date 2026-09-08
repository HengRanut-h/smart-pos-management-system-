export interface CompanyInfo {
  id: number;
  name: string;
  code: string;
  legal_name?: string;
  tax_id?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  logo_url?: string;
  favicon_url?: string;
  currency_code: string;
  currency_symbol: string;
  timezone: string;
  fiscal_year_start: string;
  status_id: number;
  created_at?: string;
  updated_at?: string;
}

export type BranchType = 'HEAD_OFFICE' | 'RETAIL_STORE' | 'WAREHOUSE_HUB' | 'FRANCHISE';

export interface BranchItem {
  id: number;
  code: string;
  name: string;
  branch_type: BranchType;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  manager_name?: string;
  manager_phone?: string;
  manager_email?: string;
  opening_date?: string;
  logo_url?: string;
  tax_rate: number;
  tax_id?: string;
  currency_code: string;
  timezone: string;
  default_warehouse_id?: number;
  default_pos_terminal?: string;
  working_hours_summary?: string;
  status_id: number;
  warehouses_count?: number;
  pos_terminals_count?: number;
  employees_count?: number;
  branch_users_count?: number;
  printers_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BranchPosTerminalItem {
  id?: number;
  branch_id: number;
  terminal_code: string;
  terminal_name: string;
  ip_address?: string;
  mac_address?: string;
  status: 'ONLINE' | 'OFFLINE' | 'STANDBY';
  assigned_cashier_id?: number | null;
  assigned_cashier?: {
    id: number;
    username: string;
    email: string;
  };
  default_printer_name?: string;
  cash_drawer_enabled: boolean;
  auto_print: boolean;
  receipt_copies: number;
  last_active_at?: string;
}

export interface BranchPrinterItem {
  id?: number;
  branch_id: number;
  printer_name: string;
  printer_type: 'RECEIPT_80MM' | 'RECEIPT_58MM' | 'LABEL_BARCODE' | 'A4_INVOICE';
  connection_type: 'NETWORK_LAN' | 'USB' | 'BLUETOOTH';
  ip_address?: string;
  port: number;
  paper_width_mm: number;
  is_default: boolean;
  auto_cut: boolean;
  cash_drawer_kick: boolean;
  status: 'ONLINE' | 'OFFLINE';
}

export interface BranchNumberSequenceItem {
  id?: number;
  branch_id: number;
  document_type: 'INVOICE' | 'RECEIPT' | 'ORDER' | 'PURCHASE' | 'RETURN';
  prefix: string;
  starting_number: number;
  current_number: number;
  zero_padding: number;
  date_format_token: 'NONE' | 'YYYY' | 'YYYYMM' | 'YYYYMMDD';
  preview_sample?: string;
}

export interface BranchBusinessHourItem {
  id?: number;
  branch_id: number;
  day_of_week: number;
  day_name: string;
  is_open: boolean;
  open_time: string;
  close_time: string;
  break_start?: string | null;
  break_end?: string | null;
}

export interface BranchHolidayItem {
  id?: number;
  branch_id?: number | null;
  name: string;
  holiday_date: string;
  is_closed: boolean;
  note?: string | null;
}

export interface BranchUserItem {
  id: number;
  branch_id: number;
  user_id: number;
  assigned_role: 'ADMIN' | 'BRANCH_MANAGER' | 'CASHIER' | 'WAREHOUSE_STAFF';
  permissions: string[];
  is_active: boolean;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export interface SystemAuditLogItem {
  id: number;
  user_id?: number | null;
  username?: string | null;
  branch_id?: number | null;
  module: string;
  setting_key: string;
  old_value?: string | null;
  new_value?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  branch?: {
    id: number;
    code: string;
    name: string;
  };
}

export interface NotificationSettingRow {
  event_code: string;
  event_name: string;
  channels: {
    EMAIL: boolean;
    TELEGRAM: boolean;
    SMS: boolean;
    PUSH: boolean;
    IN_APP: boolean;
  };
}

export type SettingsSubSection =
  | 'SYSTEM'
  | 'COMPANY'
  | 'BRANCHES'
  | 'BRANCH_SETTINGS'
  | 'BRANCH_USERS'
  | 'BUSINESS_HOURS'
  | 'INVOICE_RECEIPT'
  | 'TAX_CURRENCY'
  | 'INVENTORY'
  | 'PAYMENT'
  | 'PRINTER_HARDWARE'
  | 'LOCALIZATION'
  | 'NOTIFICATIONS'
  | 'TELEGRAM'
  | 'SECURITY'
  | 'BACKUP'
  | 'AUDIT';
