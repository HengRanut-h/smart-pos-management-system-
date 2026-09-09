import React, { useState, useEffect } from 'react';
import { InvoiceAssignment, InvoiceTemplate } from './types';
import { getInvoiceAssignments, saveInvoiceAssignments, getBranches } from '../../../data-access/posApi';
import { useApp } from '../../../application/context/AppContext';
import { Building2, Plus, Trash2, CheckCircle2, Sliders, ShieldCheck } from 'lucide-react';

interface InvoiceAssignmentMatrixProps {
  templates: InvoiceTemplate[];
}

export const InvoiceAssignmentMatrix: React.FC<InvoiceAssignmentMatrixProps> = ({ templates }) => {
  const { lang, notify } = useApp();
  const [assignments, setAssignments] = useState<InvoiceAssignment[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assigns, branchList] = await Promise.all([
        getInvoiceAssignments(),
        getBranches(),
      ]);
      setAssignments(assigns);
      setBranches(branchList);
    } catch (err) {
      console.error('Failed to load assignments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddAssignment = () => {
    if (templates.length === 0) return;
    const newRule: InvoiceAssignment = {
      template_id: templates[0].id,
      document_type: templates[0].document_type,
      branch_id: branches.length > 0 ? branches[0].id : null,
      sales_channel: 'POS',
      customer_group: 'RETAIL',
      priority: assignments.length + 1,
      is_active: true,
    };
    setAssignments([...assignments, newRule]);
  };

  const handleRemoveAssignment = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveInvoiceAssignments(assignments);
      notify.success(
        lang === 'kh' ? 'ការចាត់ចែងគំរូវិក្កយបត្រត្រូវបានរក្សាទុក!' : 'Template routing assignments saved successfully!',
        'Routing Saved'
      );
      await loadData();
    } catch (err: any) {
      notify.error('Failed to save assignments: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-gray-900 flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <span>{lang === 'kh' ? 'ការចាត់ចែងគំរូតាមសាខា និងប៉ុស្តិ៍លក់' : 'Multi-Branch Template Assignments'}</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Route specific templates automatically based on store branch location, POS terminal, and customer channel.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleAddAssignment}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Override Rule</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Apply Assignments'}</span>
          </button>
        </div>
      </div>

      {/* Assignment Rules Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase text-[10px] font-bold">
            <tr>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Document Type</th>
              <th className="py-3 px-4">Branch / Store Location</th>
              <th className="py-3 px-4">Assigned Template</th>
              <th className="py-3 px-4">Sales Channel</th>
              <th className="py-3 px-4 text-center">Active</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assignments.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400">
                  No branch override rules configured. Global default templates are used everywhere.
                </td>
              </tr>
            ) : (
              assignments.map((rule, idx) => (
                <tr key={idx} className="hover:bg-gray-50/60 transition">
                  <td className="py-3 px-4 font-mono font-bold text-gray-500">#{idx + 1}</td>
                  <td className="py-3 px-4">
                    <select
                      value={rule.document_type}
                      onChange={(e) => {
                        const updated = [...assignments];
                        updated[idx].document_type = e.target.value;
                        setAssignments(updated);
                      }}
                      className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg font-semibold text-xs"
                    >
                      <option value="TAX_INVOICE">Tax Invoice</option>
                      <option value="POS_RECEIPT">POS Receipt</option>
                      <option value="DELIVERY_NOTE">Delivery Note</option>
                      <option value="QUOTATION">Quotation</option>
                      <option value="WHOLESALE_INVOICE">Wholesale Invoice</option>
                    </select>
                  </td>

                  <td className="py-3 px-4">
                    <select
                      value={rule.branch_id || ''}
                      onChange={(e) => {
                        const updated = [...assignments];
                        updated[idx].branch_id = e.target.value ? Number(e.target.value) : null;
                        setAssignments(updated);
                      }}
                      className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg font-semibold text-xs"
                    >
                      <option value="">All Branches (Global)</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                  </td>

                  <td className="py-3 px-4">
                    <select
                      value={rule.template_id}
                      onChange={(e) => {
                        const updated = [...assignments];
                        updated[idx].template_id = Number(e.target.value);
                        setAssignments(updated);
                      }}
                      className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg font-bold text-emerald-800 text-xs"
                    >
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.paper_size})</option>
                      ))}
                    </select>
                  </td>

                  <td className="py-3 px-4">
                    <select
                      value={rule.sales_channel || 'POS'}
                      onChange={(e) => {
                        const updated = [...assignments];
                        updated[idx].sales_channel = e.target.value;
                        setAssignments(updated);
                      }}
                      className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                    >
                      <option value="POS">POS Retail Checkout</option>
                      <option value="ECOMMERCE">Online Store / Web</option>
                      <option value="WHOLESALE">B2B Wholesale</option>
                      <option value="ALL">All Channels</option>
                    </select>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={rule.is_active}
                      onChange={(e) => {
                        const updated = [...assignments];
                        updated[idx].is_active = e.target.checked;
                        setAssignments(updated);
                      }}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                  </td>

                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleRemoveAssignment(idx)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Remove override rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
