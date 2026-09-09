export type DocumentType = 
  | 'TAX_INVOICE'
  | 'POS_RECEIPT'
  | 'WHOLESALE_INVOICE'
  | 'PROFORMA_INVOICE'
  | 'DELIVERY_NOTE'
  | 'QUOTATION'
  | 'CREDIT_NOTE'
  | 'PURCHASE_ORDER';

export type PaperSize = 
  | 'A4'
  | 'A5'
  | 'A6'
  | 'LETTER'
  | 'LEGAL'
  | 'THERMAL_80MM'
  | 'THERMAL_58MM'
  | 'CUSTOM';

export type Orientation = 'PORTRAIT' | 'LANDSCAPE';

export type FontFamily = 
  | 'Battambang, sans-serif'
  | 'Hanuman, serif'
  | 'Inter, sans-serif'
  | 'monospace, "Courier New"'
  | 'Arial, sans-serif';

export interface TableColumnConfig {
  id: string;
  label_kh: string;
  label_en: string;
  visible: boolean;
  width?: string;
}

export interface SignatureConfig {
  role: string;
  label_kh: string;
  label_en: string;
}

export interface InvoiceLayoutConfig {
  show_national_header?: boolean;
  national_header_text_kh?: string;
  national_header_sub_kh?: string;
  show_logo?: boolean;
  logo_url?: string;
  logo_height_px?: number;
  company_name_kh?: string;
  company_name_en?: string;
  vattin?: string;
  company_address_kh?: string;
  company_address_en?: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
  
  show_customer_info?: boolean;
  show_customer_vattin?: boolean;
  
  show_doc_meta?: boolean;
  doc_title_kh?: string;
  doc_title_en?: string;
  
  table_columns: TableColumnConfig[];
  
  show_vat_breakdown?: boolean;
  vat_rate_percent?: number;
  show_dual_currency?: boolean;
  exchange_rate?: number;
  
  show_payment_qr?: boolean;
  qr_type?: 'KHQR' | 'VERIFICATION' | 'NONE';
  show_barcode?: boolean;
  barcode_field?: string;
  
  show_signatures?: boolean;
  signatures?: SignatureConfig[];
  
  notes?: string;
  terms_conditions?: string;
}

export interface InvoiceStylesConfig {
  primary_color: string;
  accent_color: string;
  font_family: FontFamily | string;
  font_size_scale: 'xs' | 'sm' | 'base' | 'lg';
  border_style: 'solid' | 'dashed' | 'dotted' | 'none';
  header_bg: string;
  margin_mm: number;
  paper_shadow?: boolean;
}

export interface InvoiceTemplate {
  id: number;
  name: string;
  code: string;
  document_type: DocumentType;
  paper_size: PaperSize;
  orientation: Orientation;
  is_default: boolean;
  is_active: boolean;
  description?: string;
  layout_config: InvoiceLayoutConfig;
  styles_config: InvoiceStylesConfig;
  branch_id?: number | null;
  branch?: { id: number; name: string; code: string };
  assignments_count?: number;
  versions?: InvoiceTemplateVersion[];
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceTemplateVersion {
  id: number;
  template_id: number;
  version_number: number;
  change_summary?: string;
  layout_config: InvoiceLayoutConfig;
  styles_config: InvoiceStylesConfig;
  created_at: string;
}

export interface InvoiceAssignment {
  id?: number;
  template_id: number;
  document_type: DocumentType | string;
  branch_id?: number | null;
  pos_terminal_code?: string;
  sales_channel?: string;
  customer_group?: string;
  priority: number;
  is_active: boolean;
  template?: InvoiceTemplate;
  branch?: { id: number; name: string; code: string };
}

export interface InvoiceSequence {
  id?: number;
  name: string;
  document_type: string;
  pattern: string;
  prefix?: string;
  suffix?: string;
  current_number: number;
  padding: number;
  reset_frequency: 'NEVER' | 'YEARLY' | 'MONTHLY' | 'DAILY';
  last_reset_date?: string;
  branch_id?: number | null;
  is_active: boolean;
  branch?: { id: number; name: string };
}
