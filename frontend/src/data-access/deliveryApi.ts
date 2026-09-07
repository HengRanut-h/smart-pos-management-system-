import axios from 'axios';
import {
  Delivery,
  DeliveryZone,
  DeliveryDriver,
  DriverCodSettlement,
  DeliveryDashboardMetrics,
  DeliveryStatus,
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
