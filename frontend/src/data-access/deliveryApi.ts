import axios from 'axios';
import {
  Delivery,
  DeliveryZone,
  DeliveryDriver,
  DeliveryVehicle,
  VehicleMaintenanceRecord,
  DeliveryRoute,
  DeliveryTimeSlot,
  CustomerDeliveryAddress,
  DeliverySupportTicket,
  DeliveryRatingRecord,
  DeliveryFeeRule,
  DriverCodSettlement,
  DeliveryDashboardMetrics,
  DeliveryStatus,
  DeliveryAnalyticsData,
} from '../foundation/types/delivery';

const API_BASE = '/api/v1/delivery';

export const getDeliveryDashboard = async (): Promise<{
  success: boolean;
  metrics: DeliveryDashboardMetrics;
  recent_deliveries: Delivery[];
}> => {
  const res = await axios.get(`${API_BASE}/dashboard`);
  return res.data;
};

export const getDeliveryOrders = async (params?: {
  status?: string;
  search?: string;
  driver_id?: number;
  zone_id?: number;
  priority?: string;
  page?: number;
  per_page?: number;
}): Promise<{
  success: boolean;
  data: {
    data: Delivery[];
    current_page: number;
    last_page: number;
    total: number;
  };
}> => {
  const res = await axios.get(`${API_BASE}/orders`, { params });
  return res.data;
};

export const getDeliveryOrderDetails = async (id: number): Promise<{
  success: boolean;
  delivery: Delivery;
}> => {
  const res = await axios.get(`${API_BASE}/orders/${id}`);
  return res.data;
};

export const createDeliveryOrder = async (payload: {
  recipient_name: string;
  recipient_phone: string;
  recipient_secondary_phone?: string;
  delivery_address: string;
  delivery_notes?: string;
  priority?: string;
  payment_type?: string;
  cod_amount_due?: number;
  delivery_fee?: number;
  order_subtotal?: number;
  zone_id?: number;
  driver_id?: number;
  customer_id?: number;
  sale_id?: number;
  time_slot_id?: number;
  vehicle_id?: number;
  items?: Array<{
    product_name: string;
    product_id?: number;
    sku?: string;
    quantity: number;
    unit_price: number;
    image_url?: string;
  }>;
}): Promise<{
  success: boolean;
  message: string;
  delivery: Delivery;
}> => {
  const res = await axios.post(`${API_BASE}/orders`, payload);
  return res.data;
};

export const generateDeliveryFromSale = async (payload: {
  sale_id: number;
  recipient_name?: string;
  recipient_phone?: string;
  delivery_address?: string;
  zone_id?: number;
  time_slot_id?: number;
  delivery_fee?: number;
  priority?: string;
  notes?: string;
  payment_type?: string;
}): Promise<{
  success: boolean;
  message: string;
  delivery: Delivery;
}> => {
  const res = await axios.post(`${API_BASE}/orders/from-sale`, payload);
  return res.data;
};

export const bulkAssignDeliveries = async (payload: {
  delivery_ids: number[];
  driver_id: number;
  vehicle_id?: number;
}): Promise<{
  success: boolean;
  message: string;
}> => {
  const res = await axios.post(`${API_BASE}/orders/bulk-assign`, payload);
  return res.data;
};

export const updateDeliveryStatus = async (
  id: number,
  status: DeliveryStatus,
  notes?: string,
  latitude?: number,
  longitude?: number
): Promise<{
  success: boolean;
  message: string;
  delivery: Delivery;
}> => {
  const res = await axios.patch(`${API_BASE}/orders/${id}/status`, {
    status,
    notes,
    latitude,
    longitude,
  });
  return res.data;
};

export const assignDriverToDelivery = async (
  deliveryId: number,
  driverId: number,
  notes?: string
): Promise<{
  success: boolean;
  message: string;
  delivery: Delivery;
}> => {
  const res = await axios.post(`${API_BASE}/orders/${deliveryId}/assign`, {
    driver_id: driverId,
    notes,
  });
  return res.data;
};

export const rescheduleDelivery = async (
  deliveryId: number,
  payload: {
    scheduled_date: string;
    time_slot_id?: number;
    reason?: string;
  }
): Promise<{
  success: boolean;
  message: string;
  delivery: Delivery;
}> => {
  const res = await axios.post(`${API_BASE}/orders/${deliveryId}/reschedule`, payload);
  return res.data;
};

export const processReturnDelivery = async (
  deliveryId: number,
  payload: {
    return_reason: string;
    restock_items?: boolean;
    inspection_notes?: string;
  }
): Promise<{
  success: boolean;
  message: string;
  delivery: Delivery;
}> => {
  const res = await axios.post(`${API_BASE}/orders/${deliveryId}/return`, payload);
  return res.data;
};

export const submitProofOfDelivery = async (
  deliveryId: number,
  payload: {
    receiver_name: string;
    receiver_relationship?: string;
    signature_image_url?: string;
    delivery_photo_url?: string;
    otp_code?: string;
    delivered_latitude?: number;
    delivered_longitude?: number;
    cod_collected?: number;
  }
): Promise<{
  success: boolean;
  message: string;
  delivery: Delivery;
}> => {
  const res = await axios.post(`${API_BASE}/orders/${deliveryId}/proof`, payload);
  return res.data;
};

export const markDeliveryFailed = async (
  deliveryId: number,
  payload: {
    failure_reason_code: string;
    failure_notes?: string;
    action: 'RESCHEDULE' | 'RETURN_TO_STORE';
    reschedule_date?: string;
  }
): Promise<{
  success: boolean;
  message: string;
  delivery: Delivery;
}> => {
  const res = await axios.post(`${API_BASE}/orders/${deliveryId}/fail`, payload);
  return res.data;
};

// Vehicles API
export const getDeliveryVehicles = async (params?: { status?: string; vehicle_type?: string }): Promise<{
  success: boolean;
  data: DeliveryVehicle[];
}> => {
  const res = await axios.get(`${API_BASE}/vehicles`, { params });
  return res.data;
};

export const createDeliveryVehicle = async (payload: Partial<DeliveryVehicle>): Promise<{
  success: boolean;
  message: string;
  data: DeliveryVehicle;
}> => {
  const res = await axios.post(`${API_BASE}/vehicles`, payload);
  return res.data;
};

export const updateDeliveryVehicleStatus = async (id: number, status: string): Promise<{
  success: boolean;
  message: string;
  data: DeliveryVehicle;
}> => {
  const res = await axios.patch(`${API_BASE}/vehicles/${id}/status`, { status });
  return res.data;
};

export const addVehicleMaintenance = async (id: number, payload: Partial<VehicleMaintenanceRecord>): Promise<{
  success: boolean;
  message: string;
  data: VehicleMaintenanceRecord;
}> => {
  const res = await axios.post(`${API_BASE}/vehicles/${id}/maintenance`, payload);
  return res.data;
};

// Routes API
export const getDeliveryRoutes = async (params?: { date?: string; status?: string }): Promise<{
  success: boolean;
  data: DeliveryRoute[];
}> => {
  const res = await axios.get(`${API_BASE}/routes`, { params });
  return res.data;
};

export const createDeliveryRoute = async (payload: {
  driver_id?: number;
  vehicle_id?: number;
  route_date: string;
  delivery_ids: number[];
  notes?: string;
}): Promise<{
  success: boolean;
  message: string;
  data: DeliveryRoute;
}> => {
  const res = await axios.post(`${API_BASE}/routes`, payload);
  return res.data;
};

export const optimizeDeliveryRoute = async (id: number): Promise<{
  success: boolean;
  message: string;
  data: DeliveryRoute;
}> => {
  const res = await axios.post(`${API_BASE}/routes/${id}/optimize`);
  return res.data;
};

// Time Slots API
export const getDeliveryTimeSlots = async (): Promise<{
  success: boolean;
  data: DeliveryTimeSlot[];
}> => {
  const res = await axios.get(`${API_BASE}/time-slots`);
  return res.data;
};

export const createDeliveryTimeSlot = async (payload: Partial<DeliveryTimeSlot>): Promise<{
  success: boolean;
  message: string;
  data: DeliveryTimeSlot;
}> => {
  const res = await axios.post(`${API_BASE}/time-slots`, payload);
  return res.data;
};

// Customer Addresses API
export const getCustomerAddresses = async (customerId?: number): Promise<{
  success: boolean;
  data: CustomerDeliveryAddress[];
}> => {
  const res = await axios.get(`${API_BASE}/addresses`, { params: { customer_id: customerId } });
  return res.data;
};

export const createCustomerAddress = async (payload: Partial<CustomerDeliveryAddress>): Promise<{
  success: boolean;
  message: string;
  data: CustomerDeliveryAddress;
}> => {
  const res = await axios.post(`${API_BASE}/addresses`, payload);
  return res.data;
};

// Fee Rules API
export const getDeliveryFeeRules = async (): Promise<{
  success: boolean;
  data: DeliveryFeeRule[];
}> => {
  const res = await axios.get(`${API_BASE}/fee-rules`);
  return res.data;
};

export const saveDeliveryFeeRule = async (payload: Partial<DeliveryFeeRule>): Promise<{
  success: boolean;
  message: string;
  data: DeliveryFeeRule;
}> => {
  const res = await axios.post(`${API_BASE}/fee-rules`, payload);
  return res.data;
};

// Support Tickets API
export const getDeliverySupportTickets = async (params?: { status?: string; priority?: string }): Promise<{
  success: boolean;
  data: DeliverySupportTicket[];
}> => {
  const res = await axios.get(`${API_BASE}/support-tickets`, { params });
  return res.data;
};

export const createDeliverySupportTicket = async (payload: {
  delivery_id: number;
  customer_id?: number;
  driver_id?: number;
  issue_type: string;
  priority: string;
  description: string;
}): Promise<{
  success: boolean;
  message: string;
  data: DeliverySupportTicket;
}> => {
  const res = await axios.post(`${API_BASE}/support-tickets`, payload);
  return res.data;
};

export const resolveDeliverySupportTicket = async (id: number, resolution_notes: string): Promise<{
  success: boolean;
  message: string;
  data: DeliverySupportTicket;
}> => {
  const res = await axios.post(`${API_BASE}/support-tickets/${id}/resolve`, { resolution_notes });
  return res.data;
};

// Ratings & Reviews API
export const getDeliveryRatings = async (): Promise<{
  success: boolean;
  data: DeliveryRatingRecord[];
}> => {
  const res = await axios.get(`${API_BASE}/ratings`);
  return res.data;
};

export const submitDeliveryRating = async (payload: Partial<DeliveryRatingRecord>): Promise<{
  success: boolean;
  message: string;
  data: DeliveryRatingRecord;
}> => {
  const res = await axios.post(`${API_BASE}/ratings`, payload);
  return res.data;
};

// Analytics API
export const getDeliveryAnalytics = async (): Promise<{
  success: boolean;
  data: DeliveryAnalyticsData;
}> => {
  const res = await axios.get(`${API_BASE}/analytics`);
  return res.data;
};

// Drivers & Zones API
export const getDeliveryDrivers = async (): Promise<{
  success: boolean;
  drivers: DeliveryDriver[];
  eligible_employees: Array<{ id: number; name: string; phone?: string; email?: string; avatar_url?: string }>;
}> => {
  const res = await axios.get(`${API_BASE}/drivers`);
  return res.data;
};

export const createDeliveryDriver = async (payload: {
  employee_id?: number;
  name: string;
  phone: string;
  vehicle_type: string;
  vehicle_plate_number?: string;
  driver_license_number?: string;
  driver_license_expiry?: string;
  current_status?: string;
}): Promise<{
  success: boolean;
  message: string;
  driver: DeliveryDriver;
}> => {
  const res = await axios.post(`${API_BASE}/drivers`, payload);
  return res.data;
};

export const updateDriverStatus = async (
  driverId: number,
  current_status: string
): Promise<{
  success: boolean;
  message: string;
  driver: DeliveryDriver;
}> => {
  const res = await axios.patch(`${API_BASE}/drivers/${driverId}/status`, {
    current_status,
  });
  return res.data;
};

export const getDeliveryZones = async (): Promise<{
  success: boolean;
  zones: DeliveryZone[];
}> => {
  const res = await axios.get(`${API_BASE}/zones`);
  return res.data;
};

export const createDeliveryZone = async (payload: {
  name: string;
  code: string;
  area_description?: string;
  base_delivery_fee: number;
  per_km_fee?: number;
  min_order_amount?: number;
  free_delivery_threshold?: number;
  estimated_delivery_minutes?: number;
}): Promise<{
  success: boolean;
  message: string;
  zone: DeliveryZone;
}> => {
  const res = await axios.post(`${API_BASE}/zones`, payload);
  return res.data;
};

export const getCodSettlements = async (): Promise<{
  success: boolean;
  settlements: DriverCodSettlement[];
  drivers_with_cash: Array<{
    id: number;
    name: string;
    phone: string;
    vehicle_type: string;
    active_cash_in_hand: number;
    current_status: string;
  }>;
}> => {
  const res = await axios.get(`${API_BASE}/settlements`);
  return res.data;
};

export const settleDriverCod = async (payload: {
  driver_id: number;
  amount_to_settle: number;
  notes?: string;
}): Promise<{
  success: boolean;
  message: string;
  settlement: DriverCodSettlement;
  remaining_cash_in_hand: number;
}> => {
  const res = await axios.post(`${API_BASE}/settlements`, payload);
  return res.data;
};

export const getDeliveryReports = async (): Promise<{
  success: boolean;
  by_status: Array<{ status: string; count: number }>;
  driver_performance: Array<{
    id: number;
    name: string;
    vehicle_type: string;
    rating: number;
    total_deliveries_completed: number;
    active_cash_in_hand: number;
    total_assigned_count: number;
  }>;
  zone_breakdown: Array<{
    id: number;
    name: string;
    code: string;
    deliveries_count: number;
  }>;
  failure_breakdown: Array<{
    failure_reason_code: string;
    count: number;
  }>;
}> => {
  const res = await axios.get(`${API_BASE}/reports`);
  return res.data;
};
