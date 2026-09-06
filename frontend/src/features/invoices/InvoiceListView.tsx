import React, { useEffect, useState } from 'react';
import { useApp } from '../../application/context/AppContext';
import { getInvoices, getSales, generateInvoiceFromSale } from '../../data-access/posApi';
import { Invoice, Sale } from '../../foundation/types';
import { TaxInvoiceModal } from '../../presentation/components/TaxInvoiceModal';
import {
  FileText,
  Search,
  Printer,
  Plus,
  DollarSign,
  Receipt,
  Building,
  CheckCircle2,
  Clock,
  RefreshCw,
  X,
  Calendar,
} from 'lucide-react';

export const InvoiceListView: React.FC = () => {
  const { t } = useApp();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'DUE'>('ALL');

  // Selected Invoice for Tax Modal
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Generate From Sale Modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const exchangeRate = 4100;

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, salesData] = await Promise.all([getInvoices(), getSales()]);
      setInvoices(invData);
      setSales(salesData);
    } catch (err) {
      console.error('Failed to load invoice data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateInvoice = async (saleId: number) => {
    setIsGenerating(true);
    try {
      const newInv = await generateInvoiceFromSale(saleId);
      await loadData();
      setIsGenerateModalOpen(false);
      setSelectedInvoice(newInv);
    } catch (err: any) {
      console.error('Failed to generate invoice', err);
      alert(err.response?.data?.message || 'Failed to generate tax invoice.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (inv.customer?.name && inv.customer.name.toLowerCase().includes(search.toLowerCase()));

    const balance = Number(inv.balance_amount || 0);
    const isPaid = balance <= 0;

    if (statusFilter === 'PAID') return matchesSearch && isPaid;
    if (statusFilter === 'DUE') return matchesSearch && !isPaid;
    return matchesSearch;
  });

  // Calculate KPIs
  const totalInvoicedUsd = invoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
  const totalTaxUsd = invoices.reduce((sum, inv) => sum + Number(inv.tax_amount || 0), 0);
  const totalBalanceUsd = invoices.reduce((sum, inv) => sum + Number(inv.balance_amount || 0), 0);

  // Filter sales eligible for invoice generation (sales without existing invoice)
  const existingSaleIds = new Set(invoices.map((i) => i.sale_id).filter(Boolean));
  const eligibleSales = sales.filter((s) => !existingSaleIds.has(s.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {t.invoices || 'Official Fiscal Invoices'}
            </h1>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
              Cambodia GDT Compliant
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            General Department of Taxation (GDT) standard tax invoices with 10% VAT and dual currency.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={loadData}
            className="p-2.5 bg-white border border-gray-200 text-gray-600 hover:text-gray-900 rounded-xl text-xs font-bold transition shadow-xs"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Invoice from Sale</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Invoices</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-gray-900 font-mono block">
            {invoices.length} Records
          </span>
          <span className="text-[11px] text-gray-500">Official tax invoices issued</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gross Invoiced</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-emerald-600 font-mono block">
            ${totalInvoicedUsd.toFixed(2)}
          </span>
          <span className="text-[11px] text-gray-500 font-mono">
            ≈ ៛{(Math.round(totalInvoicedUsd * exchangeRate)).toLocaleString()} KHR
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">VAT Collected (10%)</span>
            <Receipt className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-gray-900 font-mono block">
            ${totalTaxUsd.toFixed(2)}
          </span>
          <span className="text-[11px] text-gray-500">Payable to GDT Cambodia</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Balance Due</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-black text-amber-600 font-mono block">
            ${totalBalanceUsd.toFixed(2)}
          </span>
          <span className="text-[11px] text-gray-500">Unsettled credit terms</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice number or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto self-end">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'ALL'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({invoices.length})
          </button>
          <button
            onClick={() => setStatusFilter('PAID')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'PAID'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Paid ({invoices.filter((i) => Number(i.balance_amount || 0) <= 0).length})
          </button>
          <button
            onClick={() => setStatusFilter('DUE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'DUE'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Due ({invoices.filter((i) => Number(i.balance_amount || 0) > 0).length})
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading invoices...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <FileText className="w-10 h-10 mx-auto text-gray-300 stroke-1" />
            <p className="text-xs">No invoices found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-4">Invoice No</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Buyer / Customer</th>
                  <th className="p-4 text-right">Subtotal</th>
                  <th className="p-4 text-right">VAT (10%)</th>
                  <th className="p-4 text-right">Total Amount</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.map((inv) => {
                  const total = Number(inv.total_amount || 0);
                  const subtotal = Number(inv.subtotal || 0);
                  const tax = Number(inv.tax_amount || 0);
                  const balance = Number(inv.balance_amount || 0);
                  const isPaid = balance <= 0;

                  return (
                    <tr key={inv.id} className="hover:bg-gray-50/80 transition">
                      <td className="p-4 font-mono font-bold text-emerald-700">
                        {inv.invoice_number}
                      </td>
                      <td className="p-4 text-gray-500 font-mono">
                        {new Date(inv.invoice_date).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-gray-900 block">
                          {inv.customer?.name || 'Walk-in Customer'}
                        </span>
                        {inv.customer?.phone && (
                          <span className="text-[10px] text-gray-400 font-mono">
                            {inv.customer.phone}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right font-mono text-gray-600">
                        ${subtotal.toFixed(2)}
                      </td>
                      <td className="p-4 text-right font-mono text-gray-600">
                        ${tax.toFixed(2)}
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-bold font-mono text-gray-900 block">
                          ${total.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          ៛{(Math.round(total * exchangeRate)).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            PAID
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            DUE (${balance.toFixed(2)})
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-xl flex items-center space-x-1.5 transition mx-auto border border-emerald-200/80"
                          title="Preview & Print Official Tax Invoice"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-600" />
                          <span>View A4 Tax Slip</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Generate Tax Invoice from Sale */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span>Generate GDT Tax Invoice from Sale</span>
              </h3>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Select a completed retail sale below to issue a formal GDT Tax Invoice (វិក្កយបត្រពន្ធ) with 10% VAT and company TIN.
            </p>

            <div className="max-h-72 overflow-y-auto space-y-2 divide-y divide-gray-100 pr-1">
              {eligibleSales.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  All recent sales already have associated tax invoices.
                </div>
              ) : (
                eligibleSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="pt-2 flex items-center justify-between hover:bg-gray-50 p-2 rounded-xl transition"
                  >
                    <div>
                      <span className="font-mono font-bold text-xs text-gray-900 block">
                        {sale.sale_number}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(sale.sale_date).toLocaleString()} • {sale.customer?.name || 'Walk-in'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-xs text-emerald-600">
                        ${Number(sale.total_amount).toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleGenerateInvoice(sale.id)}
                        disabled={isGenerating}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition"
                      >
                        {isGenerating ? '...' : 'Create Invoice'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GDT Official Tax Invoice Modal */}
      {selectedInvoice && (
        <TaxInvoiceModal
          invoice={selectedInvoice}
          exchangeRate={exchangeRate}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};
