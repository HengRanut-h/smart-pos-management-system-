import React, { useState, useEffect } from 'react';
import { InvoiceSequence } from './types';
import { getInvoiceSequences, saveInvoiceSequence, previewSequencePattern } from '../../../data-access/posApi';
import { useApp } from '../../../application/context/AppContext';
import { Hash, Plus, Edit2, CheckCircle2, RotateCcw, Sparkles, RefreshCw } from 'lucide-react';

export const InvoiceNumberingManager: React.FC = () => {
  const { lang, notify } = useApp();
  const [sequences, setSequences] = useState<InvoiceSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSeq, setEditingSeq] = useState<Partial<InvoiceSequence> | null>(null);
  const [livePreview, setLivePreview] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getInvoiceSequences();
      setSequences(data);
    } catch (err) {
      console.error('Failed to load invoice sequences', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update live preview when editing pattern or padding
  useEffect(() => {
    if (!editingSeq) return;
    const pat = editingSeq.pattern || 'INV-{YYYY}-{####}';
    const pad = editingSeq.padding || 4;
    const curr = (editingSeq.current_number || 0) + 1;

    previewSequencePattern(pat, pad, curr)
      .then(res => setLivePreview(res.sample_output))
      .catch(() => {
        // Fallback local generator
        const now = new Date();
        const numStr = String(curr).padStart(pad, '0');
        const out = pat
          .replace('{YYYY}', String(now.getFullYear()))
          .replace('{MM}', String(now.getMonth() + 1).padStart(2, '0'))
          .replace('{BRANCH}', 'HQ')
          .replace('{####}', numStr);
        setLivePreview(out);
      });
  }, [editingSeq?.pattern, editingSeq?.padding, editingSeq?.current_number]);

  const handleSave = async () => {
    if (!editingSeq || !editingSeq.name || !editingSeq.document_type || !editingSeq.pattern) {
      notify.error('Please fill in all required fields.');
      return;
    }

    setIsSaving(true);
    try {
      await saveInvoiceSequence(editingSeq, editingSeq.id);
      notify.success(
        lang === 'kh' ? 'ទម្រង់លេខវិក្កយបត្រត្រូវបានរក្សាទុក!' : 'Numbering sequence saved successfully!',
        'Sequence Saved'
      );
      setEditingSeq(null);
      await loadData();
    } catch (err: any) {
      notify.error('Failed to save sequence: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-gray-900 flex items-center space-x-2">
            <Hash className="w-5 h-5 text-emerald-600" />
            <span>{lang === 'kh' ? 'កំណត់ទម្រង់លេខឯកសារ និងវិក្កយបត្រ' : 'Document Numbering Sequences'}</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Configure automated sequential numbering masks, prefixes, and annual/monthly resets for all document types.
          </p>
        </div>

        <button
          onClick={() => setEditingSeq({
            name: 'New Custom Sequence',
            document_type: 'TAX_INVOICE',
            pattern: 'INV-{YYYY}-{####}',
            prefix: 'INV-',
            current_number: 0,
            padding: 4,
            reset_frequency: 'YEARLY',
            is_active: true,
          })}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Sequence</span>
        </button>
      </div>

      {/* Grid of Sequences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sequences.map((seq) => (
          <div
            key={seq.id}
            className="p-5 bg-white rounded-2xl border border-gray-200 shadow-2xs space-y-4 hover:border-emerald-300 transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  {seq.document_type.replace('_', ' ')}
                </span>
                <h3 className="font-bold text-gray-900 text-sm mt-1">{seq.name}</h3>
              </div>
              <button
                onClick={() => setEditingSeq({ ...seq })}
                className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-emerald-600 transition"
                title="Edit Sequence Mask"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Format Mask</span>
              <div className="font-mono text-sm font-black text-gray-900">{seq.pattern}</div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-600 border-t border-gray-100 pt-3">
              <div>
                <span className="text-gray-400 block text-[10px]">Counter</span>
                <span className="font-bold text-gray-800 font-mono">#{seq.current_number}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Padding</span>
                <span className="font-bold text-gray-800">{seq.padding} digits</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Reset Cycle</span>
                <span className="font-bold text-gray-800 capitalize">{seq.reset_frequency.toLowerCase()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT / CREATE SEQUENCE MODAL */}
      {editingSeq && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-gray-100 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-sm">
                {editingSeq.id ? 'Edit Numbering Sequence' : 'Create New Sequence'}
              </h3>
              <button
                onClick={() => setEditingSeq(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-xl"
              >
                ✕
              </button>
            </div>

            {/* Live Sample Output Card */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Live Next Generated Number Preview:
              </span>
              <div className="font-mono text-lg font-black text-emerald-900">
                {livePreview || 'Calculating...'}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Sequence Name</label>
                <input
                  type="text"
                  value={editingSeq.name || ''}
                  onChange={(e) => setEditingSeq({ ...editingSeq, name: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                  placeholder="e.g. Tax Invoices 2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Document Type</label>
                  <select
                    value={editingSeq.document_type || 'TAX_INVOICE'}
                    onChange={(e) => setEditingSeq({ ...editingSeq, document_type: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-semibold"
                  >
                    <option value="TAX_INVOICE">Tax Invoice</option>
                    <option value="POS_RECEIPT">POS Receipt</option>
                    <option value="DELIVERY_NOTE">Delivery Note</option>
                    <option value="QUOTATION">Quotation</option>
                    <option value="WHOLESALE_INVOICE">Wholesale</option>
                    <option value="CREDIT_NOTE">Credit Note</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Reset Cycle</label>
                  <select
                    value={editingSeq.reset_frequency || 'YEARLY'}
                    onChange={(e) => setEditingSeq({ ...editingSeq, reset_frequency: e.target.value as any })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-semibold"
                  >
                    <option value="YEARLY">Yearly (Every Jan 1st)</option>
                    <option value="MONTHLY">Monthly (Every 1st of Month)</option>
                    <option value="DAILY">Daily</option>
                    <option value="NEVER">Never (Continuous counter)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Pattern Mask</label>
                <input
                  type="text"
                  value={editingSeq.pattern || ''}
                  onChange={(e) => setEditingSeq({ ...editingSeq, pattern: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs font-bold"
                  placeholder="INV-{YYYY}-{####}"
                />
                <div className="flex flex-wrap gap-1.5 pt-1.5 text-[10px]">
                  {['{YYYY}', '{YY}', '{MM}', '{YYYYMM}', '{BRANCH}', '{####}'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setEditingSeq({ ...editingSeq, pattern: (editingSeq.pattern || '') + tag })}
                      className="px-1.5 py-0.5 bg-gray-100 hover:bg-emerald-100 text-gray-600 hover:text-emerald-800 rounded font-mono transition"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Current Counter</label>
                  <input
                    type="number"
                    value={editingSeq.current_number || 0}
                    onChange={(e) => setEditingSeq({ ...editingSeq, current_number: Number(e.target.value) })}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Padding Digits</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={editingSeq.padding || 4}
                    onChange={(e) => setEditingSeq({ ...editingSeq, padding: Number(e.target.value) })}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditingSeq(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Sequence'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
