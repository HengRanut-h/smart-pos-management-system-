export type DeliveryStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED'
  | 'RETURNED_TO_STORE';

export type DriverStatus = 'AVAILABLE' | 'BUSY' | 'ON_DELIVERY' | 'OFFLINE' | 'BREAK';
export type VehicleType = 'MOTORCYCLE' | 'BICYCLE' | 'CAR' | 'VAN' | 'TRUCK';
export type DeliveryPriority = 'STANDARD' | 'EXPRESS' | 'URGENT';
export type DeliveryPaymentType = 'PREPAID' | 'COD' | 'PARTIAL';

export interface DeliveryZone {
  id: number;
  name: string;
  code: string;
  area_description?: string;
  base_delivery_fee: number;
  per_km_fee: number;
  min_order_amount: number;
  free_delivery_threshold?: number;
  estimated_delivery_minutes: number;
  is_active: boolean;
  deliveries_count?: number;
}

export interface DeliveryDriver {
  id: number;
  employee_id?: number;
  name: string;
  phone: string;
  vehicle_type: VehicleType;
  vehicle_plate_number?: string;
  driver_license_number?: string;
  driver_license_expiry?: string;
  current_status: DriverStatus;
  current_latitude?: number;
  current_longitude?: number;
  rating: number;
  total_deliveries_completed: number;
  active_cash_in_hand: number;
  is_active: boolean;
  active_deliveries_count?: number;
  employee?: {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    avatar_url?: string;
  };
}

export interface DeliveryItem {
  id: number;
  delivery_id: number;
  product_id?: number;
  product_name: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url?: string;
}

export interface DeliveryTrackingLog {
  id: number;
  delivery_id: number;
  status: DeliveryStatus;
  actor_type: string;
  actor_name?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface DeliveryProof {
  id: number;
  delivery_id: number;
  receiver_name?: string;
  receiver_relationship?: string;
  signature_image_url?: string;
  delivery_photo_url?: string;
  otp_code?: string;
  otp_verified_at?: string;
  delivered_latitude?: number;
  delivered_longitude?: number;
  created_at: string;
}

export interface Delivery {
  id: number;
  delivery_number: string;
  sale_id?: number;
  invoice_id?: number;
  customer_id?: number;
  driver_id?: number;
  zone_id?: number;
  status: DeliveryStatus;
  recipient_name: string;
  recipient_phone: string;
  recipient_secondary_phone?: string;
  delivery_address: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  delivery_notes?: string;
  priority: DeliveryPriority;
  payment_type: DeliveryPaymentType;
  cod_amount_due: number;
  cod_amount_collected: number;
  delivery_fee: number;
  order_subtotal: number;
  total_amount: number;
  scheduled_at?: string;
  assigned_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  estimated_delivery_time?: string;
  actual_delivery_minutes?: number;
  failure_reason_code?: string;
  failure_notes?: string;
  reschedule_count: number;
  created_at: string;
  updated_at: string;
  driver?: DeliveryDriver;
  zone?: DeliveryZone;
  customer?: {
    id: number;
    name: string;
    phone?: string;
    email?: string;
  };
  items?: DeliveryItem[];
  tracking_logs?: DeliveryTrackingLog[];
  proof?: DeliveryProof;
}

export interface DriverCodSettlement {
  id: number;
  settlement_number: string;
  driver_id: number;
  total_cod_collected: number;
  total_delivery_fees: number;
  net_amount_settled: number;
  settlement_status: 'PENDING' | 'VERIFIED' | 'RECONCILED';
  settled_by_user_id?: number;
  notes?: string;
  settled_at?: string;
  created_at: string;
  driver?: DeliveryDriver;
  settled_by?: {
    id: number;
    name: string;
  };
}

export interface DeliveryDashboardMetrics {
  total_deliveries: number;
  pending: number;
  assigned: number;
  picked_up: number;
  in_transit: number;
  delivered: number;
  failed: number;
  cod_collected: number;
  cod_pending: number;
  total_delivery_fees: number;
  active_drivers: number;
  total_drivers: number;
  total_zones: number;
  success_rate: number;
  today_deliveries: number;
  today_delivered: number;
}
