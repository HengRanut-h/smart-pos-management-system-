export interface InvoiceCustomizationState {
  // Background & Paper
  backgroundColor: string;
  backgroundTone: 'white' | 'cream' | 'slate' | 'mint' | 'blue' | 'parchment' | 'custom';
  paperTexture?: 'smooth' | 'subtle-grid' | 'lined' | 'none';
  
  // Watermark
  showWatermark: boolean;
  watermarkText: string;
  watermarkOpacity: number; // 0.04 - 0.25
  watermarkColor: string;
  watermarkRotation: number; // -45 to 0
  
  // Official Seal / Rubber Stamp
  showOfficialStamp: boolean;
  stampType: 'PAID' | 'VERIFIED' | 'APPROVED' | 'OFFICIAL';
  stampPosition: 'bottom-right' | 'bottom-left' | 'center';
  stampColor: string;
  
  // Theme Colors
  primaryColor: string;
  headerBg: string;
  accentColor: string;
  
  // Typography
  fontFamily: string;
  fontSizeScale: 'xs' | 'sm' | 'base' | 'lg';
  
  // Layout Options
  showNationalHeader: boolean;
  showDualCurrency: boolean;
  showPaymentQr: boolean;
  showSignatures: boolean;
  paperFormat: 'A4' | 'A5' | 'THERMAL_80MM';
  
  // Borders
  borderStyle: 'solid' | 'dashed' | 'double' | 'rounded' | 'none';
}

export const BACKGROUND_TONE_PRESETS = [
  { id: 'white', label: 'Crisp White', labelKh: 'សធម្មតា', bg: '#ffffff', text: '#111827', border: '#e5e7eb' },
  { id: 'cream', label: 'Soft Ivory', labelKh: 'ពណ៌ភ្លុកទន់', bg: '#fdfcf7', text: '#1f2937', border: '#e9e5d9' },
  { id: 'slate', label: 'Executive Slate', labelKh: 'ប្រផេះប្រតិបត្តិ', bg: '#f8fafc', text: '#0f172a', border: '#e2e8f0' },
  { id: 'mint', label: 'Fiscal Mint', labelKh: 'បៃតងខ្ចី', bg: '#f0fdf4', text: '#064e3b', border: '#bbf7d0' },
  { id: 'blue', label: 'Corporate Blue', labelKh: 'ខៀវសាជីវកម្ម', bg: '#f0f7ff', text: '#1e3a8a', border: '#bfdbfe' },
  { id: 'parchment', label: 'Warm Parchment', labelKh: 'ក្រដាសបុរាណ', bg: '#faf6f0', text: '#451a03', border: '#e7ded1' },
];

export const WATERMARK_PRESETS = [
  { id: 'NONE', label: 'No Watermark', text: '' },
  { id: 'ORIGINAL', label: 'ច្បាប់ដើម • ORIGINAL', text: 'ច្បាប់ដើម • ORIGINAL' },
  { id: 'DUPLICATE', label: 'ច្បាប់ចម្លង • DUPLICATE', text: 'ច្បាប់ចម្លង • DUPLICATE' },
  { id: 'PAID', label: 'បានទូទាត់រួច • PAID', text: 'បានទូទាត់រួច • PAID' },
  { id: 'SAMPLE', label: 'គំរូវិក្កយបត្រ • SAMPLE', text: 'គំរូ • SAMPLE' },
  { id: 'CONFIDENTIAL', label: 'ឯកសារសម្ងាត់ • CONFIDENTIAL', text: 'សម្ងាត់ • CONFIDENTIAL' },
];

export const THEME_COLOR_PRESETS = [
  { id: 'emerald', label: 'GDT Emerald', primary: '#059669', bg: '#ecfdf5', text: 'Emerald' },
  { id: 'navy', label: 'Royal Navy', primary: '#1e3a8a', bg: '#eff6ff', text: 'Navy' },
  { id: 'charcoal', label: 'Executive Slate', primary: '#1e293b', bg: '#f1f5f9', text: 'Charcoal' },
  { id: 'crimson', label: 'Ruby Crimson', primary: '#991b1b', bg: '#fef2f2', text: 'Crimson' },
  { id: 'amber', label: 'Bronze Amber', primary: '#92400e', bg: '#fffbeb', text: 'Amber' },
  { id: 'indigo', label: 'Deep Indigo', primary: '#4338ca', bg: '#eef2ff', text: 'Indigo' },
];

export const DEFAULT_INVOICE_CUSTOMIZATION: InvoiceCustomizationState = {
  backgroundColor: '#ffffff',
  backgroundTone: 'white',
  paperTexture: 'none',
  showWatermark: false,
  watermarkText: 'ច្បាប់ដើម • ORIGINAL',
  watermarkOpacity: 0.08,
  watermarkColor: '#64748b',
  watermarkRotation: -30,
  showOfficialStamp: true,
  stampType: 'PAID',
  stampPosition: 'bottom-right',
  stampColor: '#dc2626',
  primaryColor: '#059669',
  headerBg: '#ecfdf5',
  accentColor: '#10b981',
  fontFamily: 'Battambang, sans-serif',
  fontSizeScale: 'sm',
  showNationalHeader: true,
  showDualCurrency: true,
  showPaymentQr: true,
  showSignatures: true,
  paperFormat: 'A4',
  borderStyle: 'solid',
};

const STORAGE_KEY = 'smartpos_tax_invoice_custom_settings';

export function loadInvoiceCustomization(): InvoiceCustomizationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_INVOICE_CUSTOMIZATION;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_INVOICE_CUSTOMIZATION, ...parsed };
  } catch {
    return DEFAULT_INVOICE_CUSTOMIZATION;
  }
}

export function saveInvoiceCustomization(settings: InvoiceCustomizationState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save invoice customization to localStorage', err);
  }
}
