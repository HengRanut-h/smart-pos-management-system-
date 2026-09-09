import React, { useState, useEffect } from 'react';
import { InvoiceTemplate, DocumentType, PaperSize } from './types';
import { 
  getInvoiceTemplates, 
  getInvoiceTemplateById, 
  createInvoiceTemplate, 
  updateInvoiceTemplate, 
  duplicateInvoiceTemplate, 
  setDefaultInvoiceTemplate, 
  deleteInvoiceTemplate, 
  restoreInvoiceTemplateVersion 
} from '../../../data-access/posApi';
import { DocumentPaperPreview } from './DocumentPaperPreview';
import { InvoiceDesignerStudio } from './InvoiceDesignerStudio';
import { InvoiceNumberingManager } from './InvoiceNumberingManager';
import { InvoiceAssignmentMatrix } from './InvoiceAssignmentMatrix';
import { useApp } from '../../../application/context/AppContext';
import { 
  FileText, 
  Layers, 
  Hash, 
  Building2, 
  Printer, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Copy, 
  Trash2, 
  Star, 
  Eye, 
  CheckCircle2, 
  Sparkles, 
  Settings2,
  RefreshCw,
  X
} from 'lucide-react';

export const InvoiceDesignerHub: React.FC = () => {
  const { lang, notify, confirmDelete, confirmAction } = useApp();

  const [activeMainTab, setActiveMainTab] = useState<'TEMPLATES' | 'NUMBERING' | 'ASSIGNMENTS' | 'PRINT_RULES'>('TEMPLATES');
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Active Template Being Edited in Studio
  const [activeEditingTemplate, setActiveEditingTemplate] = useState<InvoiceTemplate | null>(null);

  // Quick Preview Modal
  const [previewingTemplate, setPreviewingTemplate] = useState<InvoiceTemplate | null>(null);

  // New Template Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTemplateData, setNewTemplateData] = useState({
    name: '',
    document_type: 'TAX_INVOICE' as DocumentType,
    paper_size: 'A4' as PaperSize,
  });

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await getInvoiceTemplates(typeFilter !== 'ALL' ? typeFilter : undefined);
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [typeFilter]);

  // Handle Edit
  const handleOpenStudio = async (template: InvoiceTemplate) => {
    try {
      const full = await getInvoiceTemplateById(template.id);
      setActiveEditingTemplate(full);
    } catch (err) {
      setActiveEditingTemplate(template);
    }
  };

  // Handle Save from Studio
  const handleSaveFromStudio = async (updated: Partial<InvoiceTemplate>, changeSummary: string) => {
    if (!activeEditingTemplate) return;
    const res = await updateInvoiceTemplate(activeEditingTemplate.id, {
      ...updated,
      change_summary: changeSummary,
    });
    setActiveEditingTemplate(res.data);
    await loadTemplates();
  };

  // Handle Restore Version
  const handleRestoreVersion = async (versionId: number) => {
    if (!activeEditingTemplate) return;
    const res = await restoreInvoiceTemplateVersion(activeEditingTemplate.id, versionId);
    setActiveEditingTemplate(res.data);
    await loadTemplates();
  };

  // Handle Duplicate
  const handleDuplicate = async (template: InvoiceTemplate) => {
    try {
      await duplicateInvoiceTemplate(template.id);
      notify.success(
        lang === 'kh' ? `បានចម្លងគំរូ "${template.name}" ជោគជ័យ!` : `Template "${template.name}" duplicated successfully!`,
        'Duplicated'
      );
      await loadTemplates();
    } catch (err: any) {
      notify.error('Duplicate failed: ' + (err.response?.data?.message || err.message));
    }
  };

  // Handle Set Default
  const handleSetDefault = async (template: InvoiceTemplate) => {
    try {
      await setDefaultInvoiceTemplate(template.id);
      notify.success(
        lang === 'kh' ? `បានកំណត់ "${template.name}" ជាគំរូលំនាំដើម!` : `"${template.name}" set as default template!`,
        'Default Updated'
      );
      await loadTemplates();
    } catch (err: any) {
      notify.error('Failed to set default: ' + (err.response?.data?.message || err.message));
    }
  };

  // Handle Delete
  const handleDelete = async (template: InvoiceTemplate) => {
    if (template.is_default) {
      notify.warning('Cannot delete the default template.');
      return;
    }

    const confirmed = await confirmDelete({
      title: lang === 'kh' ? 'លុបគំរូវិក្កយបត្រ?' : 'Delete Invoice Template?',
      message: lang === 'kh' 
        ? `តើអ្នកប្រាកដជាចង់លុប "${template.name}" ទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`
        : `Are you sure you want to delete "${template.name}"? This action cannot be undone.`,
    });
    if (!confirmed) return;

    try {
      await deleteInvoiceTemplate(template.id);
      notify.success(
        lang === 'kh' ? 'បានលុបគំរូជោគជ័យ!' : 'Template deleted successfully.',
        'Deleted'
      );
      await loadTemplates();
    } catch (err: any) {
      notify.error('Failed to delete template: ' + (err.response?.data?.message || err.message));
    }
  };

  // Handle Create New Template
  const handleCreateNew = async () => {
    if (!newTemplateData.name.trim()) {
      notify.error('Please enter a template name.');
      return;
    }

    // Clone base layout from an existing template of that paper size or standard
    const baseMatch = templates.find(t => t.paper_size === newTemplateData.paper_size) || templates[0];
    const newPayload: Partial<InvoiceTemplate> = {
      name: newTemplateData.name.trim(),
      document_type: newTemplateData.document_type,
      paper_size: newTemplateData.paper_size,
      orientation: 'PORTRAIT',
      is_default: false,
      is_active: true,
      layout_config: baseMatch ? baseMatch.layout_config : {
        show_logo: true,
        company_name_en: 'SmartPOS Enterprise',
        table_columns: [
          { id: 'num', label_kh: 'ល.រ', label_en: 'No', visible: true, width: '10%' },
          { id: 'name', label_kh: 'ទំនិញ', label_en: 'Item', visible: true, width: '50%' },
          { id: 'qty', label_kh: 'ចំនួន', label_en: 'Qty', visible: true, width: '15%' },
          { id: 'total', label_kh: 'សរុប', label_en: 'Total', visible: true, width: '25%' },
        ],
      },
      styles_config: baseMatch ? baseMatch.styles_config : {
        primary_color: '#059669',
        accent_color: '#047857',
        font_family: 'Battambang, sans-serif',
        font_size_scale: 'sm',
        border_style: 'solid',
        header_bg: '#f0fdf4',
        margin_mm: 12,
      },
    };

    try {
      const created = await createInvoiceTemplate(newPayload);
      setIsNewModalOpen(false);
      setNewTemplateData({ name: '', document_type: 'TAX_INVOICE', paper_size: 'A4' });
      await loadTemplates();
      // Open immediately in Studio
      setActiveEditingTemplate(created.data);
    } catch (err: any) {
      notify.error('Failed to create template: ' + (err.response?.data?.message || err.message));
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  // If in Visual Studio mode
  if (activeEditingTemplate) {
    return (
      <InvoiceDesignerStudio
        template={activeEditingTemplate}
        onSave={handleSaveFromStudio}
        onRestoreVersion={handleRestoreVersion}
        onBackToList={() => {
          setActiveEditingTemplate(null);
          loadTemplates();
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-2xl">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {lang === 'kh' ? 'ប្រព័ន្ធរចនាវិក្កយបត្រ និងឯកសារផ្លូវការ' : 'Document & Invoice Designer Engine'}
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enterprise document builder for GDT tax invoices, POS thermal receipts, delivery slips, quotations, and numbering sequences.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md shadow-emerald-200 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Template</span>
          </button>
        </div>
      </div>

      {/* Main Hub Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-2xl p-1.5 shadow-2xs gap-1">
        {[
          { id: 'TEMPLATES', label: lang === 'kh' ? 'គំរូវិក្កយបត្រទាំងអស់' : 'Invoice Templates', icon: <Layers className="w-4 h-4" />, count: templates.length },
          { id: 'NUMBERING', label: lang === 'kh' ? 'ទម្រង់លេខកូដ' : 'Numbering Sequences', icon: <Hash className="w-4 h-4" /> },
          { id: 'ASSIGNMENTS', label: lang === 'kh' ? 'ការចាត់ចែងតាមសាខា' : 'Branch Assignments', icon: <Building2 className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveMainTab(tab.id as any)}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition ${
              activeMainTab === tab.id
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60 shadow-xs'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-white border border-gray-200 text-gray-700">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TEMPLATES LIBRARY GRID                                             */}
      {/* ========================================================================= */}
      {activeMainTab === 'TEMPLATES' && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates by title or code..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
              {['ALL', 'TAX_INVOICE', 'POS_RECEIPT', 'DELIVERY_NOTE', 'QUOTATION'].map((dtype) => (
                <button
                  key={dtype}
                  onClick={() => setTypeFilter(dtype)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    typeFilter === dtype
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {dtype.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((tpl) => {
              const isThermal = tpl.paper_size.includes('THERMAL');
              return (
                <div
                  key={tpl.id}
                  className="bg-white rounded-3xl border border-gray-200 shadow-xs hover:shadow-lg transition flex flex-col justify-between overflow-hidden group hover:border-emerald-300"
                >
                  {/* Card Header */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-gray-100 text-gray-700">
                          {tpl.paper_size.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {tpl.document_type.replace('_', ' ')}
                        </span>
                        {tpl.is_default && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-900 flex items-center space-x-1">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>Default</span>
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleSetDefault(tpl)}
                        disabled={tpl.is_default}
                        className="p-1.5 text-gray-400 hover:text-amber-500 rounded-lg transition disabled:opacity-40"
                        title={tpl.is_default ? 'Default Template' : 'Set as Default'}
                      >
                        <Star className={`w-4 h-4 ${tpl.is_default ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-gray-900 text-base group-hover:text-emerald-700 transition">
                        {tpl.name}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                        {tpl.description || 'Custom business document template configured with corporate branding and layout.'}
                      </p>
                    </div>

                    {/* Paper Preview Thumbnail Lockup */}
                    <div 
                      onClick={() => setPreviewingTemplate(tpl)}
                      className="p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl border border-gray-100 flex items-center justify-center cursor-pointer transition relative group/thumb"
                    >
                      <div className={`bg-white border border-gray-300 rounded shadow-xs p-3 flex flex-col items-center justify-center space-y-1 ${
                        isThermal ? 'w-24 h-32' : 'w-28 h-36'
                      }`}>
                        <div className="w-8 h-1 bg-gray-300 rounded" />
                        <div className="w-16 h-0.5 bg-gray-200 rounded" />
                        <div className="w-12 h-0.5 bg-gray-200 rounded" />
                        <div className="w-full border-t border-dashed border-gray-300 my-1" />
                        <div className="w-14 h-0.5 bg-gray-200 rounded" />
                        <div className="w-14 h-0.5 bg-gray-200 rounded" />
                        <div className="w-8 h-8 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center mt-2">
                          <Eye className="w-4 h-4 text-emerald-600" />
                        </div>
                      </div>
                      <span className="absolute bottom-2 right-2 text-[10px] font-bold text-gray-400 group-hover/thumb:text-emerald-700">
                        Click to Preview &rarr;
                      </span>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="px-5 py-3.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenStudio(tpl)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs transition"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Customize in Studio</span>
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleDuplicate(tpl)}
                        className="p-2 text-gray-500 hover:text-gray-800 rounded-xl hover:bg-gray-200 transition"
                        title="Duplicate template"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(tpl)}
                        disabled={tpl.is_default}
                        className="p-2 text-gray-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition disabled:opacity-30"
                        title={tpl.is_default ? 'Default template cannot be deleted' : 'Delete template'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: NUMBERING SEQUENCES                                                */}
      {/* ========================================================================= */}
      {activeMainTab === 'NUMBERING' && (
        <InvoiceNumberingManager />
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BRANCH & CHANNEL ASSIGNMENTS                                       */}
      {/* ========================================================================= */}
      {activeMainTab === 'ASSIGNMENTS' && (
        <InvoiceAssignmentMatrix templates={templates} />
      )}

      {/* ========================================================================= */}
      {/* QUICK PREVIEW MODAL                                                       */}
      {/* ========================================================================= */}
      {previewingTemplate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-100 rounded-3xl max-w-4xl w-full border border-gray-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-gray-900 text-sm">Preview: {previewingTemplate.name}</span>
                <span className="text-xs text-gray-500 font-mono">({previewingTemplate.paper_size})</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setPreviewingTemplate(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex justify-center">
              <DocumentPaperPreview
                layout={previewingTemplate.layout_config}
                styles={previewingTemplate.styles_config}
                paperSize={previewingTemplate.paper_size}
                zoom={0.9}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE NEW TEMPLATE MODAL                                                 */}
      {/* ========================================================================= */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base">Create Document Template</h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Template Name</label>
                <input
                  type="text"
                  value={newTemplateData.name}
                  onChange={(e) => setNewTemplateData({ ...newTemplateData, name: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                  placeholder="e.g. Siem Reap Branch Retail Invoice"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Document Category</label>
                <select
                  value={newTemplateData.document_type}
                  onChange={(e) => setNewTemplateData({ ...newTemplateData, document_type: e.target.value as any })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-semibold"
                >
                  <option value="TAX_INVOICE">Official Tax Invoice</option>
                  <option value="POS_RECEIPT">POS Sales Receipt</option>
                  <option value="DELIVERY_NOTE">Warehouse Delivery Slip</option>
                  <option value="QUOTATION">Commercial Quotation</option>
                  <option value="WHOLESALE_INVOICE">B2B Wholesale Invoice</option>
                  <option value="PROFORMA_INVOICE">Proforma Invoice</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Paper Format</label>
                <select
                  value={newTemplateData.paper_size}
                  onChange={(e) => setNewTemplateData({ ...newTemplateData, paper_size: e.target.value as any })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-semibold"
                >
                  <option value="A4">A4 Sheet (210 x 297mm)</option>
                  <option value="A5">A5 Sheet (148 x 210mm)</option>
                  <option value="LETTER">Letter (8.5 x 11 in)</option>
                  <option value="THERMAL_80MM">Thermal 80mm Roll (Standard POS)</option>
                  <option value="THERMAL_58MM">Thermal 58mm Roll (Handheld Mobile)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNew}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs"
              >
                Create & Open Studio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
