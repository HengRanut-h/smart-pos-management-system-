import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../application/context/AppContext';
import { getReportsSummary } from '../../data-access/posApi';
import { ReportSummaryResponse } from '../../foundation/types';
import {
  FileBarChart,
  Calendar,
  Printer,
  Download,
  RefreshCw,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Percent,
  Coins,
  QrCode,
  CreditCard,
  Building2,
  Users,
  Search,
  CheckCircle2,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { lang, t } = useApp();
  const [preset, setPreset] = useState<string>('this_month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [data, setData] = useState<ReportSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [productSearch, setProductSearch] = useState<string>('');
  const [sortField, setSortField] = useState<'revenue' | 'units_sold' | 'profit' | 'margin_pct'>('revenue');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const exchangeRate = 4100;

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const res = await getReportsSummary({
        preset,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load report summary', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [preset]);

  const handleApplyCustomDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    setPreset('custom');
    fetchReport();
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!data) return;

    const rows = [
      ['SmartPOS Financial & Sales Report'],
      ['Report Period', data.period.formatted],
      ['Generated At', new Date().toLocaleString()],
      [''],
      ['FINANCIAL SUMMARY'],
      ['Total Orders', data.summary.total_orders],
      ['Gross Subtotal ($)', data.summary.subtotal],
      ['Total Discounts ($)', data.summary.total_discounts],
      ['10% VAT Collected ($)', data.summary.total_vat_tax],
      ['Net Sales Revenue ($)', data.summary.net_sales],
      ['Cost of Goods Sold (COGS) ($)', data.summary.cogs],
      ['Gross Profit ($)', data.summary.gross_profit],
      ['Gross Margin (%)', data.summary.gross_margin_pct + '%'],
      ['Average Ticket / Basket ($)', data.summary.average_basket],
      [''],
      ['PAYMENT TENDER BREAKDOWN'],
      ['Cash (USD/KHR)', data.tenders.cash],
      ['NBC Bakong KHQR', data.tenders.khqr],
      ['Cards', data.tenders.card],
      ['Total Tendered', data.tenders.total],
      [''],
      ['TOP PRODUCTS PERFORMANCE'],
      ['Product Name', 'SKU', 'Category', 'Units Sold', 'Revenue ($)', 'COGS ($)', 'Profit ($)', 'Margin (%)'],
      ...data.top_products.map((p) => [
        p.name,
        p.sku,
        p.category,
        p.units_sold,
        p.revenue,
        p.cogs,
        p.profit,
        p.margin_pct + '%',
      ]),
      [''],
      ['CASHIER SETTLEMENT PERFORMANCE'],
      ['Cashier Name', 'Employee Code', 'Orders Count', 'Total Sales ($)', 'Average Ticket ($)'],
      ...data.cashiers.map((c) => [c.name, c.code, c.orders_count, c.total_sales, c.avg_ticket]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartPOS_Report_${preset}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredProducts = useMemo(() => {
    if (!data?.top_products) return [];
    let list = [...data.top_products];
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      return sortAsc ? valA - valB : valB - valA;
    });

    return list;
  }, [data, productSearch, sortField, sortAsc]);

  const handleSort = (field: 'revenue' | 'units_sold' | 'profit' | 'margin_pct') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileBarChart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {lang === 'kh' ? 'របាយការណ៍ហិរញ្ញវត្ថុ & ការលក់' : 'Financial & Sales Reports Portal'}
              </h1>
              <p className="text-xs text-slate-500">
                {lang === 'kh'
                  ? 'របាយការណ៍ប្រាក់ចំណូល ចំណាយ គិតពន្ធអាករ និងការទូទាត់វេនបេឡាករ'
                  : 'Audited sales revenue, gross margins, tender reconciliation, and Cambodia GDT tax statements'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>{lang === 'kh' ? 'បោះពុម្ព A4' : 'Print Report'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!data}
            className="flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'kh' ? 'ទាញយក CSV' : 'Export CSV'}</span>
          </button>

          <button
            onClick={fetchReport}
            disabled={isLoading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Date Presets and Custom Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Preset Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'today', label: 'Today', labelKh: 'ថ្ងៃនេះ' },
            { id: 'yesterday', label: 'Yesterday', labelKh: 'ម្សិលមិញ' },
            { id: 'this_week', label: 'This Week', labelKh: 'សប្តាហ៍នេះ' },
            { id: 'this_month', label: 'This Month', labelKh: 'ខែនេះ' },
            { id: 'last_month', label: 'Last Month', labelKh: 'ខែមុន' },
            { id: 'this_year', label: 'This Year', labelKh: 'ឆ្នាំនេះ' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPreset(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                preset === item.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {lang === 'kh' ? item.labelKh : item.label}
            </button>
          ))}
        </div>

        {/* Custom Range Picker */}
        <form onSubmit={handleApplyCustomDate} className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-all shadow-sm"
          >
            {lang === 'kh' ? 'អនុវត្ត' : 'Apply'}
          </button>
        </form>
      </div>

      {/* Current Period Badge */}
      {data && (
        <div className="flex items-center justify-between px-2 mb-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Audit Period: <span className="text-slate-800 font-bold">{data.period.formatted}</span>
          </span>
          <span className="text-xs text-slate-400">
            {data.summary.total_orders} Orders Settled
          </span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Net Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">
              {lang === 'kh' ? 'ចំណូលលក់សុទ្ធ' : 'Net Sales Revenue'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            ${(data?.summary.net_sales || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs font-semibold text-emerald-600 mt-1">
            ៛{Math.round((data?.summary.net_sales || 0) * exchangeRate).toLocaleString('en-US')} KHR
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Subtotal: ${(data?.summary.subtotal || 0).toFixed(2)}</span>
            <span className="text-rose-500">Disc: -${(data?.summary.total_discounts || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Gross Profit & Margin */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">
              {lang === 'kh' ? 'ប្រាក់ចំណេញដុល' : 'Gross Profit & Margin'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            ${(data?.summary.gross_profit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs font-bold text-blue-600 mt-1 flex items-center gap-1">
            <span>Margin: {data?.summary.gross_margin_pct || 0}%</span>
            <span className="text-slate-400 font-normal">| COGS: ${(data?.summary.cogs || 0).toFixed(2)}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 border-t border-slate-100 pt-2">
            Retail profitability benchmark: ~35%
          </div>
        </div>

        {/* 10% VAT Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">
              {lang === 'kh' ? 'ពន្ធអាករលើតម្លៃបន្ថែម (10%)' : 'Cambodia GDT VAT (10%)'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            ${(data?.summary.total_vat_tax || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs font-semibold text-purple-600 mt-1">
            ៛{Math.round((data?.summary.total_vat_tax || 0) * exchangeRate).toLocaleString('en-US')} KHR
          </div>
          <div className="mt-2 text-[11px] text-slate-400 border-t border-slate-100 pt-2">
            Taxable base: ${(data?.tax_statement.taxable_amount || 0).toFixed(2)}
          </div>
        </div>

        {/* Average Basket & Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">
              {lang === 'kh' ? 'ចំនួនវិក្កយបត្រ & មធ្យមភាគ' : 'Average Basket & Orders'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            ${(data?.summary.average_basket || 0).toFixed(2)}
          </div>
          <div className="text-xs font-semibold text-amber-600 mt-1">
            Avg. Ticket per Customer
          </div>
          <div className="mt-2 text-[11px] text-slate-400 border-t border-slate-100 pt-2">
            Total completed orders: <span className="font-bold text-slate-700">{data?.summary.total_orders || 0}</span>
          </div>
        </div>
      </div>

      {/* Tender Breakdown & Tax Statement Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Tender Settlement Split */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-600" />
            {lang === 'kh' ? 'ការទូទាត់តាមវិធីសាស្ត្រនានា' : 'Multi-Tender Payment Reconciliation'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {/* Cash */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-600">Cash (USD/KHR)</span>
                <Coins className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg font-bold text-slate-900">
                ${(data?.tenders.cash || 0).toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {data?.tenders.total ? Math.round((data.tenders.cash / data.tenders.total) * 100) : 0}% of Total
              </div>
            </div>

            {/* KHQR */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-600">NBC Bakong KHQR</span>
                <QrCode className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-lg font-bold text-slate-900">
                ${(data?.tenders.khqr || 0).toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {data?.tenders.total ? Math.round((data.tenders.khqr / data.tenders.total) * 100) : 0}% of Total
              </div>
            </div>

            {/* Cards */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-600">Cards (Visa/Master)</span>
                <CreditCard className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-lg font-bold text-slate-900">
                ${(data?.tenders.card || 0).toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {data?.tenders.total ? Math.round((data.tenders.card / data.tenders.total) * 100) : 0}% of Total
              </div>
            </div>
          </div>

          {/* Progress split bar */}
          {data?.tenders.total ? (
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${(data.tenders.cash / data.tenders.total) * 100}%` }}
                className="bg-emerald-500 h-full"
                title={`Cash: $${data.tenders.cash.toFixed(2)}`}
              />
              <div
                style={{ width: `${(data.tenders.khqr / data.tenders.total) * 100}%` }}
                className="bg-red-500 h-full"
                title={`Bakong KHQR: $${data.tenders.khqr.toFixed(2)}`}
              />
              <div
                style={{ width: `${(data.tenders.card / data.tenders.total) * 100}%` }}
                className="bg-blue-500 h-full"
                title={`Cards: $${data.tenders.card.toFixed(2)}`}
              />
            </div>
          ) : null}
        </div>

        {/* Cambodia GDT Official Tax Summary Box */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                GDT Monthly Statement
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                VATTIN: K001-902100888
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-4">
              Official Tax Summary compliant with Cambodia General Department of Taxation reporting.
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-700/60">
                <span className="text-slate-400">Taxable Sales (10%):</span>
                <span className="font-semibold text-white">
                  ${(data?.tax_statement.taxable_amount || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700/60">
                <span className="text-slate-400">VAT Output Tax:</span>
                <span className="font-bold text-emerald-400">
                  ${(data?.tax_statement.vat_collected || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700/60">
                <span className="text-slate-400">Total Invoiced:</span>
                <span className="font-bold text-white">
                  ${(data?.tax_statement.total_invoiced || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Official KHR Total:</span>
                <span className="font-black text-amber-300">
                  ៛{(data?.tax_statement.riel_equivalent || 0).toLocaleString('en-US')}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Branch: HQ-01 Phnom Penh</span>
            <span className="text-emerald-400">● Validated</span>
          </div>
        </div>
      </div>

      {/* Cashier Settlement & Performance */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-600" />
          {lang === 'kh' ? 'ការទូទាត់វេនបេឡាករ & បុគ្គលិក' : 'Cashier Shifts & Station Performance'}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium">
                <th className="pb-3 pl-2">Cashier / Staff</th>
                <th className="pb-3">Staff Code</th>
                <th className="pb-3 text-center">Orders Settled</th>
                <th className="pb-3 text-right">Total Revenue</th>
                <th className="pb-3 text-right pr-2">Average Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.cashiers && data.cashiers.length > 0 ? (
                data.cashiers.map((c) => (
                  <tr key={c.cashier_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 pl-2 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px]">
                        {c.name.charAt(0)}
                      </div>
                      {c.name}
                    </td>
                    <td className="py-3 font-mono text-slate-500">{c.code}</td>
                    <td className="py-3 text-center font-semibold text-slate-700">{c.orders_count}</td>
                    <td className="py-3 text-right font-bold text-slate-900">
                      ${c.total_sales.toFixed(2)}
                    </td>
                    <td className="py-3 text-right pr-2 font-semibold text-emerald-600">
                      ${c.avg_ticket.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-400">
                    No cashier settlements recorded for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Products & Margin Matrix */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-emerald-600" />
            {lang === 'kh' ? 'ការលក់ទំនិញ & អត្រាចំណេញ' : 'Product Sales Velocity & Margin Analysis'}
          </h2>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={lang === 'kh' ? 'ស្វែងរកទំនិញ...' : 'Filter products...'}
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium">
                <th className="pb-3 pl-2">Product Name</th>
                <th className="pb-3">SKU</th>
                <th className="pb-3">Category</th>
                <th
                  onClick={() => handleSort('units_sold')}
                  className="pb-3 text-center cursor-pointer hover:text-slate-700"
                >
                  Units Sold {sortField === 'units_sold' && (sortAsc ? '▲' : '▼')}
                </th>
                <th
                  onClick={() => handleSort('revenue')}
                  className="pb-3 text-right cursor-pointer hover:text-slate-700"
                >
                  Revenue ($) {sortField === 'revenue' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="pb-3 text-right">COGS ($)</th>
                <th
                  onClick={() => handleSort('profit')}
                  className="pb-3 text-right cursor-pointer hover:text-slate-700"
                >
                  Gross Profit {sortField === 'profit' && (sortAsc ? '▲' : '▼')}
                </th>
                <th
                  onClick={() => handleSort('margin_pct')}
                  className="pb-3 text-right pr-2 cursor-pointer hover:text-slate-700"
                >
                  Margin % {sortField === 'margin_pct' && (sortAsc ? '▲' : '▼')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => (
                  <tr key={p.product_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 pl-2 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3 font-mono text-slate-500">{p.sku}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 text-center font-bold text-slate-800">{p.units_sold}</td>
                    <td className="py-3 text-right font-bold text-slate-900">${p.revenue.toFixed(2)}</td>
                    <td className="py-3 text-right text-slate-500">${p.cogs.toFixed(2)}</td>
                    <td className="py-3 text-right font-bold text-emerald-600">${p.profit.toFixed(2)}</td>
                    <td className="py-3 text-right pr-2 font-semibold text-slate-700">{p.margin_pct}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-4 text-center text-slate-400">
                    No products matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
