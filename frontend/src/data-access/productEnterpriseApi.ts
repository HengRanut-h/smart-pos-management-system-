import { apiClient } from './apiClient';
import {
  ProductDashboardData,
  EnterpriseProduct,
  ProductVariant,
  ProductAttribute,
  ProductPriceRule,
  ProductWarehouseLocation,
  ProductBatch,
  ProductSerialNumber,
  ProductWarranty,
  ProductQcInspection,
  ProductReview,
  ProductTemplate,
  ProductAuditLog,
  UnitConversion
} from '../foundation/types/productEnterprise';

export const productEnterpriseApi = {
  // Dashboard
  getDashboard: async (): Promise<ProductDashboardData> => {
    const res = await apiClient.get('/products/dashboard');
    return res.data;
  },

  // Catalog
  getProducts: async (params?: Record<string, any>) => {
    const res = await apiClient.get('/products', { params });
    return res.data;
  },

  getProduct: async (id: number): Promise<{ success: boolean; data: EnterpriseProduct }> => {
    const res = await apiClient.get(`/products/${id}`);
    return res.data;
  },

  createProduct: async (payload: Partial<EnterpriseProduct>) => {
    const res = await apiClient.post('/products', payload);
    return res.data;
  },

  updateProduct: async (id: number, payload: Partial<EnterpriseProduct>) => {
    const res = await apiClient.put(`/products/${id}`, payload);
    return res.data;
  },

  deleteProduct: async (id: number) => {
    const res = await apiClient.delete(`/products/${id}`);
    return res.data;
  },

  bulkUpdateProducts: async (payload: { ids: number[]; status_id?: number; category_id?: number; brand_id?: number }) => {
    const res = await apiClient.post('/products/bulk-update', payload);
    return res.data;
  },

  // Variants & Attributes
  getAttributes: async (): Promise<{ success: boolean; data: ProductAttribute[] }> => {
    const res = await apiClient.get('/products/attributes');
    return res.data;
  },

  saveAttribute: async (payload: { name: string; values?: string[] }) => {
    const res = await apiClient.post('/products/attributes', payload);
    return res.data;
  },

  generateVariants: async (id: number, payload: { attributes: Array<{ name: string; values: string[] }>; default_price?: number; default_cost?: number }) => {
    const res = await apiClient.post(`/products/${id}/variants/generate`, payload);
    return res.data;
  },

  updateVariant: async (variantId: number, payload: Partial<ProductVariant>) => {
    const res = await apiClient.put(`/products/variants/${variantId}`, payload);
    return res.data;
  },

  deleteVariant: async (variantId: number) => {
    const res = await apiClient.delete(`/products/variants/${variantId}`);
    return res.data;
  },

  // Pricing & Rules
  savePriceRules: async (id: number, rules: Partial<ProductPriceRule>[]) => {
    const res = await apiClient.post(`/products/${id}/price-rules`, { rules });
    return res.data;
  },

  updateLandedCost: async (id: number, payload: { shipping_cost: number; import_tax: number; handling_cost: number; other_expenses: number }) => {
    const res = await apiClient.post(`/products/${id}/landed-cost`, payload);
    return res.data;
  },

  // Inventory & Warehouse
  getWarehouseStock: async (id: number) => {
    const res = await apiClient.get(`/products/${id}/warehouse-stock`);
    return res.data;
  },

  saveWarehouseLocation: async (id: number, payload: Partial<ProductWarehouseLocation>) => {
    const res = await apiClient.post(`/products/${id}/warehouse-locations`, payload);
    return res.data;
  },

  // Batches & Expiry
  getBatches: async (params?: Record<string, any>): Promise<{ success: boolean; data: ProductBatch[] }> => {
    const res = await apiClient.get('/products/batches', { params });
    return res.data;
  },

  saveBatch: async (payload: Partial<ProductBatch>) => {
    const res = await apiClient.post('/products/batches', payload);
    return res.data;
  },

  // Serial Numbers & Warranties
  getSerialNumbers: async (params?: Record<string, any>): Promise<{ success: boolean; data: ProductSerialNumber[] }> => {
    const res = await apiClient.get('/products/serial-numbers', { params });
    return res.data;
  },

  saveSerialNumber: async (payload: Partial<ProductSerialNumber>) => {
    const res = await apiClient.post('/products/serial-numbers', payload);
    return res.data;
  },

  saveWarranty: async (payload: Partial<ProductWarranty>) => {
    const res = await apiClient.post('/products/warranties', payload);
    return res.data;
  },

  // Bundles & Manufacturing BOM
  saveBundleItems: async (id: number, items: Array<{ child_product_id: number; quantity: number; unit_price: number; discount_amount?: number }>) => {
    const res = await apiClient.post(`/products/${id}/bundle-items`, { items });
    return res.data;
  },

  saveBomItems: async (id: number, items: Array<{ raw_material_id: number; quantity_required: number; scrap_percentage?: number; unit_cost?: number }>) => {
    const res = await apiClient.post(`/products/${id}/bom-items`, { items });
    return res.data;
  },

  // Quality Control & Reviews
  getQcInspections: async (params?: Record<string, any>): Promise<{ success: boolean; data: ProductQcInspection[] }> => {
    const res = await apiClient.get('/products/qc-inspections', { params });
    return res.data;
  },

  saveQcInspection: async (payload: Partial<ProductQcInspection>) => {
    const res = await apiClient.post('/products/qc-inspections', payload);
    return res.data;
  },

  getReviews: async (params?: Record<string, any>): Promise<{ success: boolean; data: ProductReview[] }> => {
    const res = await apiClient.get('/products/reviews', { params });
    return res.data;
  },

  saveReview: async (payload: Partial<ProductReview>) => {
    const res = await apiClient.post('/products/reviews', payload);
    return res.data;
  },

  // Templates
  getTemplates: async (): Promise<{ success: boolean; data: ProductTemplate[] }> => {
    const res = await apiClient.get('/products/templates');
    return res.data;
  },

  saveTemplate: async (payload: Partial<ProductTemplate>) => {
    const res = await apiClient.post('/products/templates', payload);
    return res.data;
  },

  // Analytics & Audits
  getAnalytics: async () => {
    const res = await apiClient.get('/products/analytics');
    return res.data;
  },

  getAuditLogs: async (params?: Record<string, any>): Promise<{ success: boolean; data: ProductAuditLog[] }> => {
    const res = await apiClient.get('/products/audit-logs', { params });
    return res.data;
  },
};
