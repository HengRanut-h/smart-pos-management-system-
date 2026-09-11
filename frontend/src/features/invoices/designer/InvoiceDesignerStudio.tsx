import React, { useState } from 'react';
import { 
  InvoiceTemplate, 
  InvoiceLayoutConfig, 
  InvoiceStylesConfig, 
  PaperSize, 
  DocumentType,
} from './types';
import { DocumentPaperPreview } from './DocumentPaperPreview';
import { useApp } from '../../../application/context/AppContext';
import { 
  Save, 
  Printer, 
  Undo2, 
  Layers, 
  Palette, 
  FileSpreadsheet, 
  Sliders, 
  Sparkles, 
  History, 
  X,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Stamp,
  FileText,
} from 'lucide-react';
import { BACKGROUND_TONE_PRESETS, WATERMARK_PRESETS } from '../invoiceCustomization';

interface InvoiceDesignerStudioProps {
  template: InvoiceTemplate;
  onSave: (updated: Partial<InvoiceTemplate>, changeSummary: string) => Promise<void>;
  onRestoreVersion: (versionId: number) => Promise<void>;
  onBackToList: () => void;
}

export const InvoiceDesignerStudio: React.FC<InvoiceDesignerStudioProps> = ({
  template,
  onSave,
  onRestoreVersion,
  onBackToList,
}) => {
  const { lang, notify } = useApp();

  const [activeConfigTab, setActiveConfigTab] = useState<'LAYOUT' | 'TABLE' | 'STYLING' | 'POLICIES' | 'VERSIONS'>('LAYOUT');
  const [layout, setLayout] = useState<InvoiceLayoutConfig>(template.layout_config);
  const [styles, setStyles] = useState<InvoiceStylesConfig>(template.styles_config);
  const [paperSize, setPaperSize] = useState<PaperSize>(template.paper_size);
  const [docType, setDocType] = useState<DocumentType>(template.document_type);
  const [templateName, setTemplateName] = useState(template.name);
  const [zoom, setZoom] = useState(0.85);
  const [previewLang, setPreviewLang] = useState<'kh' | 'en'>('kh');
  const [isSaving, setIsSaving] = useState(false);
  const [showVariableHelper, setShowVariableHelper] = useState(false);
  const [mobileStudioView, setMobileStudioView] = useState<'preview' | 'controls'>('preview');
  const [changeSummary, setChangeSummary] = useState('');

  // Handle Save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        name: templateName,
        document_type: docType,
        paper_size: paperSize,
        layout_config: layout,
        styles_config: styles,
      }, changeSummary.trim() || 'Updated layout & styling in Visual Studio');
      notify.success(
        lang === 'kh' ? 'គំរូវិក្កយបត្រត្រូវបានរក្សាទុកជោគជ័យ!' : 'Invoice template saved and new version recorded!',
        'Saved & Published'
      );
      setChangeSummary('');
    } catch (err: any) {
      notify.error('Failed to save template: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  // Test Print
  const handleTestPrint = () => {
    window.print();
  };

  // Update table column visibility
  const toggleColumnVisibility = (colId: string) => {
    setLayout(prev => ({
      ...prev,
      table_columns: prev.table_columns.map(col => 
        col.id === colId ? { ...col, visible: !col.visible } : col
      ),
    }));
  };

  // Update column header label
  const updateColumnLabel = (colId: string, field: 'label_kh' | 'label_en', value: string) => {
    setLayout(prev => ({
      ...prev,
      table_columns: prev.table_columns.map(col => 
        col.id === colId ? { ...col, [field]: value } : col
      ),
    }));
  };

  const colorPresets = [
    { label: 'Emerald GDT', primary: '#059669', bg: '#f0fdf4' },
    { label: 'Indigo Modern', primary: '#4f46e5', bg: '#eef2ff' },
    { label: 'Sapphire Blue', primary: '#2563eb', bg: '#eff6ff' },
    { label: 'Royal Purple', primary: '#7c3aed', bg: '#faf5ff' },
    { label: 'Slate Executive', primary: '#334155', bg: '#f8fafc' },
    { label: 'Crimson Wine', primary: '#e11d48', bg: '#fff1f2' },
    { label: 'Monochrome POS', primary: '#111827', bg: '#ffffff' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-100 overflow-hidden">
      {/* 1. STUDIO TOP ACTION BAR */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-2xs z-10 print:hidden">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToList}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition"
            title="Back to Templates Library"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <div>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="font-extrabold text-gray-900 text-sm sm:text-base border-b border-transparent hover:border-gray-300 focus:border-emerald-500 focus:outline-hidden px-1 py-0.5 rounded transition"
            />
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-[11px] font-semibold text-gray-700">
                {template.code}
              </span>
              <span>•</span>
              <span className="capitalize">{paperSize.replace('_', ' ')}</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">{docType.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Zoom controls */}
          <div className="hidden md:flex items-center bg-gray-100 p-1 rounded-xl space-x-1 text-xs">
            <button
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
              className="p-1 hover:bg-white rounded text-gray-600"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono font-bold text-gray-700">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(1.4, z + 0.1))}
              className="p-1 hover:bg-white rounded text-gray-600"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(0.85)}
              className="px-1.5 py-0.5 hover:bg-white rounded text-[11px] font-semibold text-gray-500"
              title="Reset Zoom"
            >
              Reset
            </button>
          </div>

          {/* Placeholders Helper Modal Trigger */}
          <button
            onClick={() => setShowVariableHelper(true)}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
            title="Dynamic Placeholders Cheatsheet"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Variables</span>
          </button>

          {/* Test Print */}
          <button
            onClick={handleTestPrint}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Test Print</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-200 transition disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save & Publish'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Screen Tab Switcher */}
      <div className="flex lg:hidden bg-white border-b border-gray-200 p-2 gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setMobileStudioView('preview')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileStudioView === 'preview'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Paper Preview</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileStudioView('controls')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileStudioView === 'controls'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Design Controls</span>
        </button>
      </div>

      {/* 2. SPLIT WORKSPACE: LEFT CONTROLS, RIGHT LIVE PREVIEW */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: CUSTOMIZATION PANELS */}
        <div className={`w-full lg:w-[440px] bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden print:hidden ${
          mobileStudioView === 'preview' ? 'hidden lg:flex' : 'flex'
        }`}>
          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-gray-100 bg-gray-50/70 p-1.5 gap-1 text-xs font-bold">
            <button
              onClick={() => setActiveConfigTab('LAYOUT')}
              className={`flex-1 py-2 px-1 rounded-xl flex items-center justify-center space-x-1 transition ${
                activeConfigTab === 'LAYOUT'
                  ? 'bg-white text-emerald-700 shadow-xs border border-gray-200/60'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Layout</span>
            </button>
            <button
              onClick={() => setActiveConfigTab('TABLE')}
              className={`flex-1 py-2 px-1 rounded-xl flex items-center justify-center space-x-1 transition ${
                activeConfigTab === 'TABLE'
                  ? 'bg-white text-emerald-700 shadow-xs border border-gray-200/60'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Columns</span>
            </button>
            <button
              onClick={() => setActiveConfigTab('STYLING')}
              className={`flex-1 py-2 px-1 rounded-xl flex items-center justify-center space-x-1 transition ${
                activeConfigTab === 'STYLING'
                  ? 'bg-white text-emerald-700 shadow-xs border border-gray-200/60'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Theme</span>
            </button>
            <button
              onClick={() => setActiveConfigTab('POLICIES')}
              className={`flex-1 py-2 px-1 rounded-xl flex items-center justify-center space-x-1 transition ${
                activeConfigTab === 'POLICIES'
                  ? 'bg-white text-emerald-700 shadow-xs border border-gray-200/60'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Policies</span>
            </button>
            <button
              onClick={() => setActiveConfigTab('VERSIONS')}
              className={`flex-1 py-2 px-1 rounded-xl flex items-center justify-center space-x-1 transition ${
                activeConfigTab === 'VERSIONS'
                  ? 'bg-white text-emerald-700 shadow-xs border border-gray-200/60'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Versions</span>
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-gray-700">
            {/* TAB: LAYOUT */}
            {activeConfigTab === 'LAYOUT' && (
              <div className="space-y-5">
                <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-200/70">
                  <span className="font-bold text-gray-900 block text-xs uppercase tracking-wider">
                    Paper Size & Document Format
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 block mb-1">Paper Size</label>
                      <select
                        value={paperSize}
                        onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                        className="w-full p-2 bg-white border border-gray-200 rounded-xl font-semibold text-xs text-gray-800 focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="A4">A4 (Standard 210 x 297mm)</option>
                        <option value="A5">A5 (Half Sheet 148 x 210mm)</option>
                        <option value="LETTER">Letter (8.5 x 11 in)</option>
                        <option value="THERMAL_80MM">Thermal 80mm Roll (POS)</option>
                        <option value="THERMAL_58MM">Thermal 58mm Roll (Mini)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 block mb-1">Document Type</label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value as DocumentType)}
                        className="w-full p-2 bg-white border border-gray-200 rounded-xl font-semibold text-xs text-gray-800 focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="TAX_INVOICE">Official Tax Invoice</option>
                        <option value="POS_RECEIPT">POS Sales Receipt</option>
                        <option value="WHOLESALE_INVOICE">Wholesale Invoice</option>
                        <option value="DELIVERY_NOTE">Delivery Slip / Dispatch</option>
                        <option value="QUOTATION">Price Quotation</option>
                        <option value="PROFORMA_INVOICE">Proforma Invoice</option>
                        <option value="CREDIT_NOTE">Credit Note</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="font-bold text-gray-900 block text-xs uppercase tracking-wider">
                    Header & Branding Elements
                  </span>

                  <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition">
                    <div>
                      <p className="font-bold text-gray-900">National Header (Kingdom of Cambodia)</p>
                      <p className="text-[11px] text-gray-500">Includes National Emblem and Motto for official GDT invoices</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={layout.show_national_header || false}
                      onChange={(e) => setLayout(l => ({ ...l, show_national_header: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition">
                    <div>
                      <p className="font-bold text-gray-900">Company Logo & Branding</p>
                      <p className="text-[11px] text-gray-500">Show high-res SmartPOS logo at top</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={layout.show_logo !== false}
                      onChange={(e) => setLayout(l => ({ ...l, show_logo: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition">
                    <div>
                      <p className="font-bold text-gray-900">Customer Details Box</p>
                      <p className="text-[11px] text-gray-500">Billing name, address, phone & account group</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={layout.show_customer_info !== false}
                      onChange={(e) => setLayout(l => ({ ...l, show_customer_info: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition">
                    <div>
                      <p className="font-bold text-gray-900">Bakong KHQR Payment Code</p>
                      <p className="text-[11px] text-gray-500">Dynamic KHQR for instant customer mobile banking</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={layout.show_payment_qr !== false}
                      onChange={(e) => setLayout(l => ({ ...l, show_payment_qr: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition">
                    <div>
                      <p className="font-bold text-gray-900">Dual Currency (USD + Khmer Riel)</p>
                      <p className="text-[11px] text-gray-500">Display final sum in KHR using official exchange rate</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={layout.show_dual_currency !== false}
                      onChange={(e) => setLayout(l => ({ ...l, show_dual_currency: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition">
                    <div>
                      <p className="font-bold text-gray-900">Signatures & Official Stamp Area</p>
                      <p className="text-[11px] text-gray-500">Seller and Customer signature lines</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={layout.show_signatures !== false}
                      onChange={(e) => setLayout(l => ({ ...l, show_signatures: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                  </label>
                </div>

                <div className="space-y-2 p-4 bg-gray-50 rounded-2xl border border-gray-200/70">
                  <span className="font-bold text-gray-900 block text-xs uppercase tracking-wider">
                    Company Header Info
                  </span>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 block mb-1">Company Name (Khmer)</label>
                    <input
                      type="text"
                      value={layout.company_name_kh || ''}
                      onChange={(e) => setLayout(l => ({ ...l, company_name_kh: e.target.value }))}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl font-semibold text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 block mb-1">Company Name (English)</label>
                    <input
                      type="text"
                      value={layout.company_name_en || ''}
                      onChange={(e) => setLayout(l => ({ ...l, company_name_en: e.target.value }))}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl font-semibold text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 block mb-1">VATTIN / Tax ID</label>
                    <input
                      type="text"
                      value={layout.vattin || ''}
                      onChange={(e) => setLayout(l => ({ ...l, vattin: e.target.value }))}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: COLUMNS */}
            {activeConfigTab === 'TABLE' && (
              <div className="space-y-4">
                <div>
                  <span className="font-bold text-gray-900 block text-xs uppercase tracking-wider">
                    Itemized Table Columns
                  </span>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Toggle visibility and customize bilingual column headers
                  </p>
                </div>

                <div className="space-y-2">
                  {layout.table_columns.map((col) => (
                    <div key={col.id} className="p-3 bg-white border border-gray-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 uppercase text-xs">{col.id}</span>
                        <input
                          type="checkbox"
                          checked={col.visible}
                          onChange={() => toggleColumnVisibility(col.id)}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                      </div>
                      {col.visible && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="text-[10px] text-gray-500 block">Khmer Header</label>
                            <input
                              type="text"
                              value={col.label_kh}
                              onChange={(e) => updateColumnLabel(col.id, 'label_kh', e.target.value)}
                              className="w-full p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 block">English Header</label>
                            <input
                              type="text"
                              value={col.label_en}
                              onChange={(e) => updateColumnLabel(col.id, 'label_en', e.target.value)}
                              className="w-full p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: STYLING */}
            {activeConfigTab === 'STYLING' && (
              <div className="space-y-5">
                <div>
                  <span className="font-bold text-gray-900 block text-xs uppercase tracking-wider">
                    Color Palette & Branding
                  </span>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setStyles(s => ({ ...s, primary_color: preset.primary, header_bg: preset.bg }))}
                        className={`p-2.5 rounded-xl border flex items-center space-x-2 text-left transition ${
                          styles.primary_color === preset.primary
                            ? 'border-emerald-500 bg-emerald-50/50 shadow-2xs'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <span 
                          className="w-4 h-4 rounded-full shrink-0 shadow-2xs" 
                          style={{ backgroundColor: preset.primary }} 
                        />
                        <span className="font-bold text-xs truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paper Background Tone */}
                <div className="space-y-2 p-4 bg-gray-50 rounded-2xl border border-gray-200/70">
                  <span className="font-bold text-gray-900 block text-xs uppercase tracking-wider">
                    Paper Background Tone
                  </span>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {BACKGROUND_TONE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setStyles(s => ({ ...s, background_color: preset.bg, background_tone: preset.id }))}
                        className={`p-2 rounded-xl border flex items-center space-x-2 text-left transition ${
                          styles.background_color === preset.bg
                            ? 'border-emerald-500 bg-white ring-1 ring-emerald-500 shadow-2xs'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-gray-300 shrink-0"
                          style={{ backgroundColor: preset.bg }}
                        />
                        <span className="font-bold text-xs truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <label className="text-[11px] font-semibold text-gray-500">Custom Color:</label>
                    <input
                      type="color"
                      value={styles.background_color || '#ffffff'}
                      onChange={(e) => setStyles(s => ({ ...s, background_color: e.target.value, background_tone: 'custom' }))}
                      className="w-6 h-6 rounded-md border border-gray-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={styles.background_color || '#ffffff'}
                      onChange={(e) => setStyles(s => ({ ...s, background_color: e.target.value, background_tone: 'custom' }))}
                      className="w-20 px-2 py-0.5 bg-white border border-gray-200 rounded-md font-mono text-[11px]"
                    />
                  </div>
                </div>

                {/* Watermark Overlay */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-200/70">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 block text-xs uppercase tracking-wider">
                      Document Watermark
                    </span>
                    <label className="text-[11px] font-semibold flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(styles.watermark_text)}
                        onChange={(e) =>
                          setStyles(s => ({
                            ...s,
                            watermark_text: e.target.checked ? 'ច្បាប់ដើម • ORIGINAL' : '',
                          }))
                        }
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span>Enable</span>
                    </label>
                  </div>

                  {Boolean(styles.watermark_text) && (
                    <div className="space-y-2 pt-1">
                      <div>
                        <label className="text-[11px] font-semibold text-gray-500 block mb-1">Watermark Text</label>
                        <input
                          type="text"
                          value={styles.watermark_text || ''}
                          onChange={(e) => setStyles(s => ({ ...s, watermark_text: e.target.value }))}
                          placeholder="e.g. ច្បាប់ដើម • ORIGINAL"
                          className="w-full p-2 bg-white border border-gray-200 rounded-xl font-bold text-xs"
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <label className="text-[11px] font-semibold text-gray-500">Watermark Color:</label>
                        <input
                          type="color"
                          value={styles.watermark_color || '#64748b'}
                          onChange={(e) => setStyles(s => ({ ...s, watermark_color: e.target.value }))}
                          className="w-6 h-6 rounded-md border border-gray-300 cursor-pointer p-0.5"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Official Stamp Toggle */}
                <div className="space-y-2 p-4 bg-gray-50 rounded-2xl border border-gray-200/70">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Stamp className="w-4 h-4 text-rose-600" />
                      <span className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                        Official Cambodia GDT Seal
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(styles.show_official_stamp)}
                      onChange={(e) => setStyles(s => ({ ...s, show_official_stamp: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                  </div>

                  {Boolean(styles.show_official_stamp) && (
                    <div className="pt-2">
                      <label className="text-[11px] font-semibold text-gray-500 block mb-1">Stamp Type</label>
                      <select
                        value={styles.stamp_type || 'PAID'}
                        onChange={(e) => setStyles(s => ({ ...s, stamp_type: e.target.value }))}
                        className="w-full p-2 bg-white border border-gray-200 rounded-xl font-semibold text-xs"
                      >
                        <option value="PAID">PAID (បានទូទាត់រួច)</option>
                        <option value="VERIFIED">VERIFIED (បានផ្ទៀងផ្ទាត់)</option>
                        <option value="APPROVED">APPROVED (បានអនុម័ត)</option>
                        <option value="OFFICIAL">OFFICIAL (ផ្លូវការ)</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-200/70">
                  <span className="font-bold text-gray-900 block text-xs uppercase tracking-wider">
                    Typography & Fonts
                  </span>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 block mb-1">Primary Font Family</label>
                    <select
                      value={styles.font_family}
                      onChange={(e) => setStyles(s => ({ ...s, font_family: e.target.value }))}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl font-semibold text-xs"
                    >
                      <option value="Battambang, sans-serif">Khmer Battambang + Modern Sans</option>
                      <option value="Hanuman, serif">Khmer Hanuman (Traditional Serif)</option>
                      <option value="Inter, sans-serif">Inter Clean Sans-Serif</option>
                      <option value='monospace, "Courier New"'>Monospace Receipt Roll Font</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 block mb-1">Page Margins (mm)</label>
                    <input
                      type="range"
                      min="2"
                      max="25"
                      value={styles.margin_mm}
                      onChange={(e) => setStyles(s => ({ ...s, margin_mm: Number(e.target.value) }))}
                      className="w-full accent-emerald-600"
                    />
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>Tight (2mm)</span>
                      <span className="font-bold text-gray-900">{styles.margin_mm} mm</span>
                      <span>Spacious (25mm)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: POLICIES */}
            {activeConfigTab === 'POLICIES' && (
              <div className="space-y-4">
                <div>
                  <span className="font-bold text-gray-900 block text-xs uppercase tracking-wider">
                    Terms, Return Policy & Notes
                  </span>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Included at the bottom of the printed receipt or invoice
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">Customer Terms & Notes</label>
                  <textarea
                    rows={4}
                    value={layout.notes || ''}
                    onChange={(e) => setLayout(l => ({ ...l, notes: e.target.value }))}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-medium text-xs focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter return policy or payment instructions..."
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">Exchange Rate (USD to KHR)</label>
                  <input
                    type="number"
                    value={layout.exchange_rate || 4100}
                    onChange={(e) => setLayout(l => ({ ...l, exchange_rate: Number(e.target.value) }))}
                    className="w-full p-2 bg-white border border-gray-200 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>
            )}

            {/* TAB: VERSIONS */}
            {activeConfigTab === 'VERSIONS' && (
              <div className="space-y-4">
                <div>
                  <span className="font-bold text-gray-900 block text-xs uppercase tracking-wider">
                    Version Snapshots & Rollback
                  </span>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Restore previous designs with a single click
                  </p>
                </div>

                <div className="space-y-2">
                  {template.versions && template.versions.length > 0 ? (
                    template.versions.map((ver) => (
                      <div
                        key={ver.id}
                        className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between hover:border-emerald-300 transition"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-gray-900 text-xs">Version #{ver.version_number}</span>
                          <p className="text-[11px] text-gray-500">{ver.change_summary || 'Automatic snapshot'}</p>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {new Date(ver.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <button
                          onClick={async () => {
                            await onRestoreVersion(ver.id);
                            notify.success(`Restored to Version #${ver.version_number}`);
                          }}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-400">No previous versions yet</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE DOCUMENT CANVAS */}
        <div className={`flex-1 bg-gray-200/80 overflow-auto flex flex-col items-center justify-start p-3 sm:p-6 relative ${
          mobileStudioView === 'controls' ? 'hidden lg:flex' : 'flex'
        }`}>
          {/* Mobile floating button to open controls */}
          {mobileStudioView === 'preview' && (
            <div className="lg:hidden fixed bottom-16 left-4 right-4 z-30">
              <button
                type="button"
                onClick={() => setMobileStudioView('controls')}
                className="w-full py-3 bg-slate-900/95 hover:bg-black text-white font-bold rounded-2xl shadow-xl flex items-center justify-center space-x-2 active:scale-98 transition cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Customize Layout, Fonts & Policies</span>
              </button>
            </div>
          )}
          <DocumentPaperPreview
            layout={layout}
            styles={styles}
            paperSize={paperSize}
            zoom={zoom}
            previewLang={previewLang}
          />
        </div>
      </div>

      {/* DYNAMIC VARIABLES CHEATSHEET MODAL */}
      {showVariableHelper && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-gray-900 text-sm">Dynamic Placeholders Reference</h3>
              </div>
              <button
                onClick={() => setShowVariableHelper(false)}
                className="p-1 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Paste these tokens into your Notes, Headers, or Terms to inject dynamic data during checkout or invoicing:
            </p>

            <div className="space-y-1.5 max-h-72 overflow-y-auto font-mono text-[11px]">
              {[
                { tag: '{{invoice.number}}', desc: 'Current invoice / receipt number' },
                { tag: '{{invoice.date}}', desc: 'Transaction issuance timestamp' },
                { tag: '{{invoice.grand_total}}', desc: 'Total transaction amount' },
                { tag: '{{company.name}}', desc: 'Registered company trading name' },
                { tag: '{{branch.name}}', desc: 'Issuing store / branch location' },
                { tag: '{{customer.name}}', desc: 'Client account or buyer name' },
                { tag: '{{cashier.name}}', desc: 'Name of cashier logged in' },
              ].map((item) => (
                <div key={item.tag} className="flex justify-between p-2 bg-gray-50 rounded-lg border border-gray-200/60">
                  <span className="font-bold text-emerald-700">{item.tag}</span>
                  <span className="text-gray-500 font-sans text-xs">{item.desc}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowVariableHelper(false)}
              className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition"
            >
              Close Cheatsheet
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
