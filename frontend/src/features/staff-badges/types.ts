import { Employee } from '../../foundation/types';

export type BadgeType = 
  | 'STAFF'
  | 'MANAGER'
  | 'CASHIER'
  | 'WAREHOUSE'
  | 'DRIVER'
  | 'SECURITY'
  | 'CONTRACTOR'
  | 'VISITOR'
  | 'VIP';

export type BadgeOrientation = 'VERTICAL' | 'HORIZONTAL';
export type BadgeCardSize = 'CR80_PVC' | 'LANYARD_CARD' | 'THERMAL_80' | 'CUSTOM';
export type PhotoShape = 'circle' | 'rounded' | 'square';

export interface BadgeFrontDesign {
  theme_color: string;
  accent_color: string;
  background_gradient: string;
  header_text: string;
  header_text_kh?: string;
  photo_shape: PhotoShape;
  photo_border_color: string;
  photo_border_width: number;
  show_logo: boolean;
  show_photo?: boolean;
  show_qr_code: boolean;
  qr_size_px: number;
  show_barcode: boolean;
  barcode_type?: 'CODE_128' | 'CODE_39' | 'QR';
  show_nfc_badge: boolean;
  font_family: string;
  security_watermark?: string;
  show_security_watermark: boolean;
  show_company_name?: boolean;
  show_department?: boolean;
  show_branch?: boolean;
  show_expiry_date?: boolean;
}

export interface BadgeBackDesign {
  background_color: string;
  text_color: string;
  instructions: string;
  instructions_kh?: string;
  show_emergency_contact: boolean;
  emergency_phone?: string;
  show_barcode: boolean;
  barcode_type?: 'CODE_128' | 'QR';
  show_signature_strip: boolean;
  show_terms?: boolean;
}

export interface StaffBadgeTemplate {
  id: number;
  name: string;
  code: string;
  badge_type: BadgeType;
  orientation: BadgeOrientation;
  card_size: BadgeCardSize;
  width_mm: number;
  height_mm: number;
  front_design: BadgeFrontDesign;
  back_design?: BadgeBackDesign;
  is_default: boolean;
  is_active: boolean;
  branch_id?: number | null;
  branch?: { id: number; name: string; code: string };
  badges_count?: number;
  versions_count?: number;
  versions?: StaffBadgeTemplateVersion[];
  created_at?: string;
  updated_at?: string;
}

export interface StaffBadgeTemplateVersion {
  id: number;
  template_id: number;
  version_number: number;
  change_summary?: string;
  front_design: BadgeFrontDesign;
  back_design?: BadgeBackDesign;
  created_by?: number;
  created_at: string;
}

export type StaffBadgeStatus = 
  | 'ACTIVE' 
  | 'INACTIVE' 
  | 'EXPIRED' 
  | 'BLOCKED' 
  | 'LOST' 
  | 'STOLEN' 
  | 'REVOKED' 
  | 'REPLACED';

export interface StaffBadgeCard {
  id: number;
  employee_id: number;
  template_id: number;
  badge_number: string;
  card_number: string;
  qr_token: string;
  barcode_value?: string;
  nfc_uid?: string | null;
  status: StaffBadgeStatus;
  badge_type: BadgeType;
  issued_at?: string;
  activated_at?: string;
  expires_at?: string;
  revoked_at?: string;
  reissue_reason?: string;
  custom_fields?: Record<string, any>;
  employee?: Employee & {
    branch?: { id: number; name: string; code: string };
    department?: { id: number; name: string };
    position?: { id: number; name: string };
  };
  template?: StaffBadgeTemplate;
  created_at?: string;
  updated_at?: string;
}

export interface StaffBadgeScanLog {
  id: number;
  badge_id: number;
  employee_id: number;
  scan_type: 'ATTENDANCE' | 'POS_AUTH' | 'VERIFICATION' | 'STORE_ACCESS';
  scanner_device?: string;
  scanner_ip?: string;
  status: 'SUCCESS' | 'REJECTED' | 'EXPIRED' | 'BLOCKED';
  failure_reason?: string;
  metadata?: Record<string, any>;
  created_at: string;
  badge?: StaffBadgeCard;
  employee?: Employee;
}

export interface BadgeMetrics {
  total_cards: number;
  active_cards: number;
  inactive_cards: number;
  expired_cards: number;
  blocked_cards: number;
  lost_cards: number;
  today_scans: number;
  failed_scans: number;
}

export interface ScanVerificationResult {
  authorized: boolean;
  status: string;
  message: string;
  badge?: StaffBadgeCard;
  employee?: Employee;
}
