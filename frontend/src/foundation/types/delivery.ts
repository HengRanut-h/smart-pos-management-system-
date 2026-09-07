export type DeliveryStatus =
  | 'PENDING'
  | 'REQUESTED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'RETURNED_TO_STORE'
  | 'RESCHEDULED';

export type DriverStatus = 'AVAILABLE' | 'BUSY' | 'ON_DELIVERY' | 'BREAK' | 'OFFLINE' | 'SUSPENDED';
export type VehicleType = 'MOTORCYCLE' | 'BICYCLE' | 'CAR' | 'VAN' | 'TRUCK';
export type VehicleStatus = 'AVAILABLE' | 'ASSIGNED' | 'IN_USE' | 'MAINTENANCE' | 'DAMAGED' | 'INACTIVE';
export type DeliveryPriority = 'STANDARD' | 'EXPRESS' | 'URGENT';
export type DeliveryPaymentType = 'PREPAID' | 'COD' | 'PARTIAL';

export type FailureReasonCode =
  | 'CUSTOMER_UNAVAILABLE'
  | 'WRONG_ADDRESS'
  | 'PHONE_UNREACHABLE'
  | 'CUSTOMER_REJECTED'
  | 'RESCHEDULE_REQUESTED'
  | 'PAYMENT_ISSUE'
  | 'DAMAGED_ITEM'
  | 'MISSING_ITEM'
  | 'VEHICLE_PROBLEM'
  | 'DRIVER_ISSUE'
  | 'WEATHER'
  | 'RETURNED_TO_STORE'
  | 'OTHER';

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

export interface DeliveryVehicle {
  id: number;
  plate_number: string;
  vehicle_type: VehicleType;
  brand?: string;
  model?: string;
  color?: string;
  capacity_kg: number;
  fuel_type: string;
  assigned_driver_id?: number;
  branch_id?: number;
  status: VehicleStatus;
  mileage_km: number;
  next_service_date?: string;
  assigned_driver?: DeliveryDriver;
  maintenance_logs?: VehicleMaintenanceRecord[];
  created_at: string;
}

export interface VehicleMaintenanceRecord {
  id: number;
  vehicle_id: number;
  service_type: string;
  service_date: string;
  cost: number;
  mileage_at_service: number;
  notes?: string;
  technician_name?: string;
  created_at: string;
}

export interface DeliveryFeeRule {
  id: number;
  name: string;
  rule_type: string;
  min_order_value?: number;
  max_order_value?: number;
  min_distance_km?: number;
  max_distance_km?: number;
  fee_amount: number;
  is_free: boolean;
  peak_hour_surcharge?: number;
  weekend_surcharge?: number;
  holiday_surcharge?: number;
  is_active: boolean;
}

export interface DeliveryTimeSlot {
  id: number;
  slot_code: string;
  label: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  current_bookings: number;
  is_active: boolean;
}

export interface CustomerDeliveryAddress {
  id: number;
  customer_id: number;
  label: string;
  recipient_name: string;
  recipient_phone: string;
  province?: string;
  district?: string;
  commune?: string;
  village?: string;
  street?: string;
  house_number?: string;
  full_address: string;
  latitude?: number;
  longitude?: number;
  landmark?: string;
  delivery_instructions?: string;
  is_default: boolean;
  customer?: {
    id: number;
    name: string;
  };
}

export interface DeliveryRoute {
  id: number;
  route_code: string;
  driver_id?: number;
  vehicle_id?: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  route_date: string;
  total_distance_km: number;
  estimated_duration_minutes: number;
  total_stops: number;
  completed_stops: number;
  notes?: string;
  driver?: DeliveryDriver;
  vehicle?: DeliveryVehicle;
  stops?: DeliveryRouteStop[];
}

export interface DeliveryRouteStop {
  id: number;
  route_id: number;
  delivery_id: number;
  sequence_order: number;
  status: 'PENDING' | 'ARRIVED' | 'DELIVERED' | 'FAILED' | 'SKIPPED';
  estimated_arrival_time?: string;
  actual_arrival_time?: string;
  distance_from_prev_km: number;
  stop_notes?: string;
  delivery?: Delivery;
}

export interface DeliverySupportTicket {
  id: number;
  ticket_number: string;
  delivery_id: number;
  customer_id?: number;
  driver_id?: number;
  issue_type: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  description: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  resolution_notes?: string;
  assigned_user_id?: number;
  resolved_at?: string;
  created_at: string;
  delivery?: Delivery;
  customer?: { id: number; name: string };
  driver?: DeliveryDriver;
}

export interface DeliveryRatingRecord {
  id: number;
  delivery_id: number;
  customer_id?: number;
  driver_id?: number;
  overall_rating: number;
  driver_rating: number;
  speed_rating: number;
  communication_rating: number;
  package_rating: number;
  review_text?: string;
  created_at: string;
  delivery?: Delivery;
  customer?: { id: number; name: string };
  driver?: DeliveryDriver;
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
  time_slot_id?: number;
  vehicle_id?: number;
  route_id?: number;
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
  failure_reason_code?: FailureReasonCode;
  failure_notes?: string;
  reschedule_count: number;
  created_at: string;
  updated_at: string;
  driver?: DeliveryDriver;
  zone?: DeliveryZone;
  vehicle?: DeliveryVehicle;
  time_slot?: DeliveryTimeSlot;
  route?: DeliveryRoute;
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

export interface DeliveryAnalyticsData {
  funnel: {
    total_orders: number;
    in_transit: number;
    successful: number;
    failed: number;
    returned: number;
    conversion_rate: number;
    failed_rate: number;
    return_rate: number;
  };
  financial_performance: {
    total_revenue: number;
    total_delivery_fees: number;
    avg_order_value: number;
    avg_delivery_minutes: number;
    cost_per_delivery: number;
    profit_per_delivery: number;
  };
  hourly_distribution: Array<{
    hour: string;
    count: number;
    percentage: number;
  }>;
  zone_heatmap: Array<{
    zone_name: string;
    code: string;
    deliveries_count: number;
    avg_minutes: number;
    base_fee: number;
  }>;
}
