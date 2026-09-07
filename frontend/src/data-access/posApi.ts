import { apiClient, ensureCsrfCookie } from './apiClient';
import {
  Product,
  Employee,
  RoleItem,
  PermissionItem,
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
  AttendanceRecord,
  AttendanceMetrics,
  ScanAttendanceResponse,
  StoreAttendanceQrResponse,
  AttendanceReportResponse,
  AttendanceQrCode,
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

export const uploadStoreLogo = async (file: File): Promise<{ success: boolean; image_url: string; store_logo_url: string; relative_url: string }> => {
  const formData = new FormData();
  formData.append('image', file);
  const res = await apiClient.post('/settings/upload-logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

// Authentication API
export const loginApi = async (credentials: { username: string; password?: string; pin?: string }) => {
  try {
    await ensureCsrfCookie();
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  } catch (err: any) {
    throw err;
  }
};

export const logoutApi = async (): Promise<any> => {
  try {
    const res = await apiClient.post('/auth/logout');
    return res.data;
  } catch (err) {
    return null;
  }
};

export const sendOtpApi = async (data: { type?: 'register' | 'forgot_password'; purpose?: string; identifier?: string; destination?: string; channel?: 'EMAIL' | 'SMS' }) => {
  const res = await apiClient.post('/auth/send-otp', {
    ...data,
    destination: data.destination || data.identifier,
    purpose: data.purpose || (data.type === 'forgot_password' ? 'PASSWORD_RESET' : 'REGISTRATION'),
  });
  return res.data;
};

export const verifyOtpApi = async (data: { type?: 'register' | 'forgot_password'; purpose?: string; identifier?: string; destination?: string; otp?: string; otp_code?: string }) => {
  const res = await apiClient.post('/auth/verify-otp', {
    ...data,
    destination: data.destination || data.identifier,
    otp_code: data.otp_code || data.otp,
    purpose: data.purpose || (data.type === 'forgot_password' ? 'PASSWORD_RESET' : 'REGISTRATION'),
  });
  return res.data;
};

export const verifyRegistrationOtpApi = async (data: { identifier: string; otp_code: string }) => {
  const res = await apiClient.post('/auth/verify-registration-otp', data);
  return res.data;
};

export const resendRegistrationOtpApi = async (data: { identifier: string; channel?: 'EMAIL' | 'SMS' }) => {
  const res = await apiClient.post('/auth/resend-registration-otp', data);
  return res.data;
};

export const sendResetOtpApi = async (data: { email: string; channel?: 'EMAIL' | 'SMS' }) => {
  const res = await apiClient.post('/auth/forgot-password', data);
  return res.data;
};

export const verifyResetOtpApi = async (data: { identifier: string; otp_code: string }) => {
  const res = await apiClient.post('/auth/verify-reset-otp', data);
  return res.data;
};

export const resendResetOtpApi = async (data: { identifier: string; channel?: 'EMAIL' | 'SMS' }) => {
  const res = await apiClient.post('/auth/resend-reset-otp', data);
  return res.data;
};

export const oauthLoginApi = async (provider: string) => {
  const res = await apiClient.post(`/auth/oauth/${provider}/callback`);
  return res.data;
};

export const registerApi = async (data: {
  username: string;
  email: string;
  password: string;
  confirm_password?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role?: string;
  accept_terms?: boolean;
  channel?: 'EMAIL' | 'SMS';
}) => {
  await ensureCsrfCookie();
  const res = await apiClient.post('/auth/register', data);
  return res.data;
};

export const forgotPasswordApi = async (email: string, channel?: 'EMAIL' | 'SMS') => {
  const res = await apiClient.post('/auth/forgot-password', { email, channel });
  return res.data;
};

export const resetPasswordApi = async (data: { email?: string; reset_token: string; new_password: string; confirm_password?: string }) => {
  const res = await apiClient.post('/auth/reset-password', data);
  return res.data;
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

export const uploadProductImage = async (file: File): Promise<{ success: boolean; image_url: string; relative_url: string }> => {
  const formData = new FormData();
  formData.append('image', file);

  const res = await apiClient.post('/products/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
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

export const uploadEmployeeAvatar = async (file: File): Promise<{ success: boolean; avatar_url: string; relative_url: string }> => {
  const formData = new FormData();
  formData.append('image', file);
  const res = await apiClient.post('/employees/upload-avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const deleteEmployee = async (id: number): Promise<void> => {
  await apiClient.delete(`/employees/${id}`);
};

export const getRoles = async (): Promise<RoleItem[]> => {
  const res = await apiClient.get('/roles');
  return res.data?.data || [];
};

export const getSystemPermissions = async (): Promise<{ data: PermissionItem[]; grouped: Record<string, PermissionItem[]> }> => {
  const res = await apiClient.get('/roles/permissions');
  return res.data;
};

export const createRole = async (payload: { name: string; code?: string; description?: string; permission_ids?: number[] }): Promise<RoleItem> => {
  const res = await apiClient.post('/roles', payload);
  return res.data.data;
};

export const updateRole = async (id: number, payload: { name?: string; code?: string; description?: string; permission_ids?: number[] }): Promise<RoleItem> => {
  const res = await apiClient.put(`/roles/${id}`, payload);
  return res.data.data;
};

export const syncRolePermissions = async (roleId: number, permissionIds: number[]): Promise<RoleItem> => {
  const res = await apiClient.put(`/roles/${roleId}/permissions`, { permission_ids: permissionIds });
  return res.data.data;
};

export const deleteRole = async (id: number): Promise<void> => {
  await apiClient.delete(`/roles/${id}`);
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

// Attendance & Scanner Time Clock APIs
export const getAttendances = async (params?: {
  date?: string;
  start_date?: string;
  end_date?: string;
  employee_id?: number;
  status?: string;
}): Promise<{ data: AttendanceRecord[]; metrics: AttendanceMetrics }> => {
  const res = await apiClient.get('/attendances', { params });
  return res.data;
};

export const scanAttendance = async (
  barcode: string,
  method: 'BARCODE_SCANNER' | 'CAMERA' | 'MANUAL' = 'BARCODE_SCANNER'
): Promise<ScanAttendanceResponse> => {
  const res = await apiClient.post('/attendances/scan', { barcode, method });
  return res.data;
};

export const createManualAttendance = async (payload: {
  employee_id: number;
  date: string;
  clock_in: string;
  clock_out?: string;
  status?: string;
  notes?: string;
}): Promise<AttendanceRecord> => {
  const res = await apiClient.post('/attendances/manual', payload);
  return res.data.data;
};

export const getStoreAttendanceQr = async (branchId: number = 1): Promise<StoreAttendanceQrResponse> => {
  const res = await apiClient.get('/attendances/store-qr', { params: { branch_id: branchId } });
  return res.data.data;
};

export const scanStoreAttendance = async (
  storeQrCode: string,
  employeeId?: number,
  method: string = 'QR_SCAN',
  latitude?: number,
  longitude?: number,
  deviceInfo?: string
): Promise<ScanAttendanceResponse> => {
  const res = await apiClient.post('/attendances/scan-store', {
    store_qr_code: storeQrCode,
    employee_id: employeeId,
    method,
    latitude,
    longitude,
    device_info: deviceInfo,
  });
  return res.data;
};

export const getAttendanceReport = async (params?: {
  preset?: string;
  year?: number;
  month?: number;
  start_date?: string;
  end_date?: string;
  employee_id?: number;
  punctuality_status?: string;
  branch_id?: number;
}): Promise<AttendanceReportResponse> => {
  const res = await apiClient.get('/attendances/report', { params });
  return res.data;
};

// Store QR Codes Admin CRUD APIs
export const getAttendanceQrCodes = async (params?: {
  store_id?: number;
  status?: string;
}): Promise<{ success: boolean; data: AttendanceQrCode[]; stores: any[] }> => {
  const res = await apiClient.get('/attendances/qr-codes', { params });
  return res.data;
};

export const createAttendanceQrCode = async (payload: {
  store_id: number;
  name?: string;
  expires_at?: string;
}): Promise<{ success: boolean; data: AttendanceQrCode; message: string }> => {
  const res = await apiClient.post('/attendances/qr-codes', payload);
  return res.data;
};

export const regenerateAttendanceQrCode = async (id: number): Promise<{ success: boolean; data: AttendanceQrCode; message: string }> => {
  const res = await apiClient.post(`/attendances/qr-codes/${id}/regenerate`);
  return res.data;
};

export const updateAttendanceQrCodeStatus = async (
  id: number,
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED'
): Promise<{ success: boolean; data: AttendanceQrCode; message: string }> => {
  const res = await apiClient.patch(`/attendances/qr-codes/${id}/status`, { status });
  return res.data;
};

export const deleteAttendanceQrCode = async (id: number): Promise<{ success: boolean; message: string }> => {
  const res = await apiClient.delete(`/attendances/qr-codes/${id}`);
  return res.data;
};

export const updateAttendanceNotes = async (
  id: number,
  notes: string
): Promise<{ success: boolean; data: AttendanceRecord; message: string }> => {
  const res = await apiClient.put(`/attendances/${id}/notes`, { notes });
  return res.data;
};

export interface AdminUserItem {
  id: number;
  username: string;
  email: string;
  phone?: string;
  registration_source?: string;
  status_id?: number;
  customer_id?: number;
  employee_id?: number;
  created_at?: string;
  roles?: Array<{ id: number; name: string; code: string }>;
  customer?: { id: number; customer_code: string; name: string; email: string; phone: string; status?: string };
  employee?: { id: number; employee_code: string; first_name: string; last_name: string; branch_id?: number; branch?: { id: number; name: string } };
}

export const getAdminUsers = async (params?: { search?: string; role?: string }): Promise<AdminUserItem[]> => {
  const res = await apiClient.get('/admin/users', { params });
  return res.data?.data || [];
};

export const getAdminBranches = async (): Promise<Array<{ id: number; name: string; code: string; is_active: boolean }>> => {
  const res = await apiClient.get('/admin/branches');
  return res.data?.data || [];
};

export const assignUserRole = async (
  userId: number,
  payload: { role: string; branch_id?: number; reason?: string }
): Promise<{ success: boolean; message: string; data: any }> => {
  const res = await apiClient.post(`/admin/users/${userId}/role`, payload);
  return res.data;
};
