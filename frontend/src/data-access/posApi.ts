import { apiClient } from './apiClient';
import {
  Product,
  Employee,
  RoleItem,
  Sale,
  DashboardMetrics,
  Invoice,
  StockItem,
  StockMovementItem,
  Supplier,
  PurchaseOrder,
  PosRegister,
  Shift,
  CashMovement,
  ZReport,
  Customer,
  NotificationItem,
  AuditLogItem,
  BackupStatus,
  SystemSettings,
  UserProfile,
  ReportSummaryResponse,
} from '../foundation/types';

export const getProducts = async (): Promise<Product[]> => {
  const res = await apiClient.get('/products');
  // Handle paginated response structure
  return res.data?.data?.data || res.data?.data || [];
};

export const completeSale = async (payload: any): Promise<Sale> => {
  const res = await apiClient.post('/sales', payload);
  return res.data.data;
};

export const getSales = async (): Promise<Sale[]> => {
  const res = await apiClient.get('/sales');
  return res.data?.data?.data || res.data?.data || [];
};

export const getInvoices = async (): Promise<Invoice[]> => {
  const res = await apiClient.get('/invoices');
  return res.data?.data?.data || res.data?.data || [];
};

export const generateInvoiceFromSale = async (saleId: number): Promise<Invoice> => {
  const res = await apiClient.post(`/invoices/generate-from-sale/${saleId}`);
  return res.data.data;
};

export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const res = await apiClient.get('/dashboard/metrics');
  return res.data.data;
};

export const generateKHQR = async (billNumber: string, amount: number) => {
  const res = await apiClient.post('/payments/khqr/generate', {
    bill_number: billNumber,
    amount,
    currency: 'USD',
  });
  return res.data.data;
};

export const voidSale = async (saleId: number, reason: string) => {
  const res = await apiClient.post(`/returns/sales/${saleId}/void`, { reason });
  return res.data.data;
};

export const getStocks = async (warehouseId?: number): Promise<StockItem[]> => {
  const params = warehouseId ? { warehouse_id: warehouseId } : {};
  const res = await apiClient.get('/inventory/stocks', { params });
  return res.data?.data?.data || res.data?.data || [];
};

export const getStockMovements = async (): Promise<StockMovementItem[]> => {
  const res = await apiClient.get('/inventory/movements');
  return res.data?.data?.data || res.data?.data || [];
};

export const getLowStockAlerts = async (): Promise<StockItem[]> => {
  const res = await apiClient.get('/inventory/alerts');
  return res.data?.data || [];
};

export const adjustStock = async (payload: {
  warehouse_id: number;
  product_id: number;
  quantity: number;
  type: 'INCREASE' | 'DECREASE';
  reason: string;
}) => {
  const res = await apiClient.post('/inventory/adjust', payload);
  return res.data.data;
};

export const transferStock = async (payload: {
  from_warehouse_id: number;
  to_warehouse_id: number;
  product_id: number;
  quantity: number;
  notes?: string;
}) => {
  const res = await apiClient.post('/inventory/transfer', payload);
  return res.data.data;
};

export const getSuppliers = async (): Promise<Supplier[]> => {
  const res = await apiClient.get('/suppliers');
  return res.data?.data?.data || res.data?.data || [];
};

export const createSupplier = async (payload: {
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  tax_number?: string;
  address?: string;
}): Promise<Supplier> => {
  const res = await apiClient.post('/suppliers', payload);
  return res.data.data;
};

export const getPurchases = async (): Promise<PurchaseOrder[]> => {
  const res = await apiClient.get('/purchases');
  return res.data?.data?.data || res.data?.data || [];
};

export const createPurchaseOrder = async (payload: any): Promise<PurchaseOrder> => {
  const res = await apiClient.post('/purchases', payload);
  return res.data.data;
};

export const approvePurchaseOrder = async (id: number): Promise<PurchaseOrder> => {
  const res = await apiClient.post(`/purchases/${id}/approve`);
  return res.data.data;
};

export const receivePurchaseGoods = async (id: number, items: Array<{ purchase_item_id: number; quantity: number }>): Promise<PurchaseOrder> => {
  const res = await apiClient.post(`/purchases/${id}/receive`, { items });
  return res.data.data;
};

export const getRegisters = async (): Promise<PosRegister[]> => {
  const res = await apiClient.get('/pos/registers');
  return res.data?.data || [];
};

export const getCurrentShift = async (registerId: number = 1): Promise<{ active_shift: Shift | null; drawer: any }> => {
  const res = await apiClient.get('/pos/shifts/current', { params: { register_id: registerId } });
  return res.data?.data || { active_shift: null, drawer: null };
};

export const openShift = async (payload: { register_id: number; opening_cash: number; notes?: string }): Promise<Shift> => {
  const res = await apiClient.post('/pos/shifts/open', payload);
  return res.data.data;
};

export const recordCashMovement = async (payload: {
  shift_id: number;
  type: 'CASH_IN' | 'CASH_OUT' | 'SAFE_DROP' | 'EXPENSE';
  amount: number;
  reason: string;
}): Promise<CashMovement> => {
  const res = await apiClient.post('/pos/shifts/movement', payload);
  return res.data.data;
};

export const closeShift = async (payload: { shift_id: number; actual_cash: number; notes?: string }): Promise<ZReport> => {
  const res = await apiClient.post('/pos/shifts/close', payload);
  return res.data.data;
};

export const getShiftHistory = async (): Promise<Shift[]> => {
  const res = await apiClient.get('/pos/shifts/history');
  return res.data?.data?.data || res.data?.data || [];
};

// Customer APIs
export const getCustomers = async (search?: string): Promise<Customer[]> => {
  const params = search ? { search } : {};
  const res = await apiClient.get('/customers', { params });
  return res.data?.data?.data || res.data?.data || [];
};

export const createCustomer = async (data: { name: string; phone?: string; email?: string; address?: string }): Promise<Customer> => {
  const res = await apiClient.post('/customers', data);
  return res.data.data;
};

// Notification APIs
export const getNotifications = async (): Promise<{ notifications: NotificationItem[]; unread_count: number }> => {
  const res = await apiClient.get('/notifications');
  return {
    notifications: res.data?.data?.data || res.data?.data || [],
    unread_count: res.data?.unread_count || 0,
  };
};

export const markNotificationRead = async (id: number): Promise<void> => {
  await apiClient.post(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await apiClient.post('/notifications/mark-all-read');
};

// Audit APIs
export const getAuditLogs = async (params?: { entity_type?: string; action?: string }): Promise<AuditLogItem[]> => {
  const res = await apiClient.get('/audit-logs', { params });
  return res.data?.data?.data || res.data?.data || [];
};

// Backup APIs
export const getBackupStatus = async (): Promise<BackupStatus> => {
  const res = await apiClient.get('/backup/status');
  return res.data.data;
};

export const createBackup = async (): Promise<any> => {
  const res = await apiClient.post('/backup/create');
  return res.data;
};

export const exportBackupData = async (type: 'sales' | 'products'): Promise<any> => {
  const res = await apiClient.get(`/backup/export/${type}`);
  return res.data;
};

// Settings APIs
export const getSystemSettings = async (): Promise<SystemSettings> => {
  const res = await apiClient.get('/settings');
  return res.data.data;
};

export const updateSystemSettings = async (data: Partial<SystemSettings>): Promise<SystemSettings> => {
  const res = await apiClient.post('/settings', data);
  return res.data.data;
};


// Coupon & Promotion APIs
export const getCoupons = async (): Promise<any[]> => {
  const res = await apiClient.get('/coupons');
  return res.data?.data || [];
};

export const validateCoupon = async (code: string, subtotal: number): Promise<{
  valid: boolean;
  discount_amount: number;
  discount_type: string;
  discount_value: number;
  coupon_id: number;
  code: string;
  name: string;
  message?: string;
}> => {
  const res = await apiClient.post('/coupons/validate', { code, subtotal });
  return res.data;
};

// User Profile APIs
export const getUserProfile = async (): Promise<UserProfile> => {
  const res = await apiClient.get('/user/profile');
  return res.data.data;
};

export const updateUserProfile = async (payload: {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  current_password?: string;
  new_password?: string;
}): Promise<UserProfile> => {
  const res = await apiClient.put('/user/profile', payload);
  return res.data.data;
};


export const createProduct = async (payload: any): Promise<Product> => {
  const res = await apiClient.post('/products', payload);
  return res.data.data;
};

export const updateProduct = async (id: number, payload: any): Promise<Product> => {
  const res = await apiClient.put(`/products/${id}`, payload);
  return res.data.data;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await apiClient.delete(`/products/${id}`);
};

export const getCategories = async (): Promise<Array<{ id: number; name: string }>> => {
  const res = await apiClient.get('/categories');
  return res.data?.data || [];
};

export const getUnits = async (): Promise<Array<{ id: number; name: string; symbol?: string }>> => {
  const res = await apiClient.get('/units');
  return res.data?.data || [];
};


// Employee & Staff APIs
export const getEmployees = async (search?: string): Promise<Employee[]> => {
  const params = search ? { search } : {};
  const res = await apiClient.get('/employees', { params });
  return res.data?.data?.data || res.data?.data || [];
};

export const createEmployee = async (payload: any): Promise<Employee> => {
  const res = await apiClient.post('/employees', payload);
  return res.data.data;
};

export const updateEmployee = async (id: number, payload: any): Promise<Employee> => {
  const res = await apiClient.put(`/employees/${id}`, payload);
  return res.data.data;
};

export const deleteEmployee = async (id: number): Promise<void> => {
  await apiClient.delete(`/employees/${id}`);
};

export const getRoles = async (): Promise<RoleItem[]> => {
  const res = await apiClient.get('/roles');
  return res.data?.data || [];
};

// Reporting & Analytics APIs
export const getReportsSummary = async (params?: {
  preset?: string;
  start_date?: string;
  end_date?: string;
  branch_id?: number;
}): Promise<ReportSummaryResponse> => {
  const res = await apiClient.get('/reports/summary', { params });
  return res.data;
};

