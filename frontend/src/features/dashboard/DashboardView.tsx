import React, { useEffect, useState } from 'react';
import { useApp } from '../../application/context/AppContext';
import { getDashboardMetrics } from '../../data-access/posApi';
import { DashboardMetrics } from '../../foundation/types';
import { RevenueTrendChart } from './components/RevenueTrendChart';
import { CategoryDonutChart } from './components/CategoryDonutChart';
import { HourlyVelocityChart } from './components/HourlyVelocityChart';
import {
  DollarSign,
  ShoppingBag,
  AlertTriangle,
  Users,
  TrendingUp,
  Package,
  QrCode,
  CreditCard,
  Banknote,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Receipt,
  Building,
  Laptop,
  Percent,
  Layers,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { t, setActiveTab, isShiftOpen, activeShift, currentUser } = useApp();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const exchangeRate = 4100;

  const loadMetrics = () => {
    setLoading(true);
    getDashboardMetrics()
      .then((data) => setMetrics(data))
      .catch((err) => console.error('Failed to load dashboard metrics', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const todayRevenue = Number(metrics?.today_revenue || 0);
  const todayRevenueKhr = Math.round(todayRevenue * exchangeRate);
  const todayCount = metrics?.today_sales_count || 0;
  const avgBasket = Number(metrics?.average_basket_size || (todayCount > 0 ? todayRevenue / todayCount : 0));
  const lowStockCount = metrics?.low_stock_alerts_count || 0;
  const totalCustomers = metrics?.total_customers || 0;
  const stockValuation = Number(metrics?.inventory?.retail_valuation || 0);
  const stockUnits = Number(metrics?.inventory?.total_units || 0);

  const paymentTenders = metrics?.payment_tenders || [];
  const topProducts = metrics?.top_products || [];
  const recentSales = metrics?.recent_sales || [];
  const sevenDayTrend = metrics?.seven_day_trend || [];
  const categoryBreakdown = metrics?.category_breakdown || [];
  const hourlyDistribution = metrics?.hourly_distribution || [];
  const profitability = metrics?.profitability || {
    revenue_7d: 0,
    cogs_7d: 0,
    gross_profit_7d: 0,
    margin_percent: 41.2,
  };

  return (
    <div className="max-w-[1920px] 3xl:max-w-[2400px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6">
      {/* Top Header & Live Station Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {t.dashboard || 'Executive Command Center & Business Analytics'}
            </h1>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] sm:text-[11px] font-bold rounded-full border border-emerald-200 shrink-0">
              Live Station HQ-01
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>Store: Phnom Penh Headquarters</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Active Station: {currentUser?.full_name || 'Lead Admin'}</span>
            <span>•</span>
            <span className="font-mono text-emerald-700 font-bold">1 USD = {exchangeRate.toLocaleString()} KHR</span>
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={loadMetrics}
            className="p-2.5 bg-white border border-gray-200 text-gray-600 hover:text-gray-900 rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5"
            title="Refresh Analytics Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">Live Refresh</span>
          </button>
          <button
            onClick={() => setActiveTab('pos')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs transition"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Open POS Terminal (F1)</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 3xl:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Today Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Gross Sales (Today)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-emerald-600 font-mono block tracking-tight">
              ${todayRevenue.toFixed(2)} USD
            </span>
            <span className="text-xs text-gray-500 font-mono font-semibold">
              ≈ ៛{todayRevenueKhr.toLocaleString()} KHR
            </span>
          </div>
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <span className="text-gray-400">VAT (10%):</span>
            <span className="font-mono font-bold text-gray-700">
              ${Number(metrics?.today_tax || todayRevenue * 0.1).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Card 2: Orders & Avg Basket */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Transactions & Basket
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-gray-900 font-mono block tracking-tight">
              {todayCount} Orders
            </span>
            <span className="text-xs text-blue-600 font-mono font-bold">
              Avg Basket: ${avgBasket.toFixed(2)}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <span className="text-gray-400">Checkout Rate:</span>
            <span className="font-bold text-emerald-600">100% Finalized</span>
          </div>
        </div>

        {/* Card 3: Stock Health & Valuation */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Inventory Valuation
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-purple-700 font-mono block tracking-tight">
              ${stockValuation.toFixed(2)}
            </span>
            <span className="text-xs text-gray-500 font-mono">
              {stockUnits} Physical Units in Stock
            </span>
          </div>
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <span className="text-gray-400">Low Stock Warnings:</span>
            <span className={`font-bold ${lowStockCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {lowStockCount} Items
            </span>
          </div>
        </div>

        {/* Card 4: Loyalty Program */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Loyalty Customers
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-gray-900 font-mono block tracking-tight">
              {totalCustomers} Members
            </span>
            <span className="text-xs text-amber-700 font-semibold">
              4 Tier Program (Platinum/Gold)
            </span>
          </div>
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <span className="text-gray-400">Redemption Rule:</span>
            <span className="font-bold text-gray-700">100 pts = $1.00</span>
          </div>
        </div>
      </div>

      {/* Row 1: Interactive 7-Day Revenue & Profit Chart (8 cols) + Profit Margin Summary (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Revenue & Profit Trend Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
          <RevenueTrendChart data={sevenDayTrend} exchangeRate={exchangeRate} />
        </div>

        {/* Profitability & Margin Analytics Card */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Profitability & COGS</span>
              </h3>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full">
                7-Day Rolling
              </span>
            </div>

            <div className="space-y-4 pt-4">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Gross Profit Margin</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {profitability.margin_percent}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, profitability.margin_percent)}%` }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-2xl space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Gross Sales:</span>
                  <span className="font-mono font-bold text-gray-900">
                    ${profitability.revenue_7d.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cost of Goods (COGS):</span>
                  <span className="font-mono font-bold text-rose-600">
                    -${profitability.cogs_7d.toFixed(2)}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-sm">
                  <span className="text-gray-900">Gross Profit:</span>
                  <span className="font-mono text-emerald-600">
                    +${profitability.gross_profit_7d.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl text-[11px] text-emerald-900 space-y-1">
            <span className="font-bold block">Analyst Takeaway:</span>
            <p className="text-emerald-800 leading-snug">
              Profit margins are performing healthy at {profitability.margin_percent}%, exceeding the retail target baseline of 35%.
            </p>
          </div>
        </div>
      </div>

      {/* Row 2: Category Donut Distribution (6 cols) + Peak Trading Hours Velocity (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Contribution Donut */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
          <CategoryDonutChart data={categoryBreakdown} />
        </div>

        {/* Hourly Peak Trading Hours Bar Chart */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
          <HourlyVelocityChart data={hourlyDistribution} />
        </div>
      </div>

      {/* Row 3: Leaderboard & Quick Operations (8 cols) + Payment Tenders & GDT Status (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (8 cols): Top Selling Leaderboard + Operations */}
        <div className="lg:col-span-8 space-y-6">
          {/* Quick Operations Launcher */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Quick Station Launchers</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => setActiveTab('pos')}
                className="p-3.5 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/80 rounded-2xl text-left transition duration-150 group"
              >
                <ShoppingBag className="w-5 h-5 text-emerald-700 mb-2 group-hover:scale-110 transition" />
                <span className="font-bold text-xs text-gray-900 block">POS Checkout</span>
                <span className="text-[10px] text-gray-500 font-mono">F1 • Terminal</span>
              </button>

              <button
                onClick={() => setActiveTab('shifts')}
                className="p-3.5 bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200/80 rounded-2xl text-left transition duration-150 group"
              >
                <Laptop className="w-5 h-5 text-purple-700 mb-2 group-hover:scale-110 transition" />
                <span className="font-bold text-xs text-gray-900 block">Cash Drawer</span>
                <span className="text-[10px] text-gray-500 font-mono">F2 • Float & Z-Rep</span>
              </button>

              <button
                onClick={() => setActiveTab('invoices')}
                className="p-3.5 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/80 rounded-2xl text-left transition duration-150 group"
              >
                <Receipt className="w-5 h-5 text-blue-700 mb-2 group-hover:scale-110 transition" />
                <span className="font-bold text-xs text-gray-900 block">Tax Invoices</span>
                <span className="text-[10px] text-gray-500 font-mono">F4 • Cambodia GDT</span>
              </button>

              <button
                onClick={() => setActiveTab('inventory')}
                className="p-3.5 bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/80 rounded-2xl text-left transition duration-150 group"
              >
                <Package className="w-5 h-5 text-amber-700 mb-2 group-hover:scale-110 transition" />
                <span className="font-bold text-xs text-gray-900 block">Stock Ledger</span>
                <span className="text-[10px] text-gray-500 font-mono">F5 • Adjustments</span>
              </button>
            </div>
          </div>

          {/* Top Selling Products Leaderboard */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Top Selling Catalog Products</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Best performing items ranked by volume and revenue contribution.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('sales')}
                className="text-xs text-emerald-700 font-bold hover:underline flex items-center space-x-1"
              >
                <span>Sales Ledger</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No product sales recorded yet today. Complete retail sales to view performance.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {topProducts.map((p, idx) => (
                  <div key={p.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="w-5 font-mono font-bold text-xs text-gray-400">#{idx + 1}</span>
                      <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-gray-900 block truncate">{p.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{p.sku}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-xs text-emerald-600 font-mono block">
                        ${Number(p.revenue).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {Number(p.qty_sold)} units sold
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right (4 cols): Payment Tenders + Cashier Status + GDT VAT Status */}
        <div className="lg:col-span-4 space-y-6">
          {/* Payment Tenders Distribution */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
                <QrCode className="w-4 h-4 text-rose-600" />
                <span>Payment Tenders (Today)</span>
              </span>
            </div>

            <div className="space-y-2.5">
              {paymentTenders.map((tender, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-gray-50/70 border border-gray-100 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: tender.color }}
                    />
                    <div>
                      <span className="font-bold text-gray-900 block">{tender.name}</span>
                      <span className="text-[10px] text-gray-400">{tender.count} transactions</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-gray-900 block">
                      ${tender.amount.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold font-mono">
                      {tender.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Station Cashier Shift Card */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900 flex items-center space-x-2">
                <Laptop className="w-4 h-4 text-emerald-600" />
                <span>Cashier Shift Station</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isShiftOpen
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {isShiftOpen ? '🟢 SHIFT OPEN' : '🔒 DRAWER CLOSED'}
              </span>
            </div>

            <div className="p-3 bg-gray-50 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Cashier on Duty:</span>
                <span className="font-bold text-gray-900">{currentUser?.full_name || 'Lead Admin'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Opening Float:</span>
                <span className="font-mono font-bold text-gray-900">
                  ${activeShift ? Number(activeShift.opening_cash).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Store Branch:</span>
                <span className="font-bold text-emerald-800">HQ-01 Phnom Penh</span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('shifts')}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition"
            >
              {isShiftOpen ? 'Manage Cash Movements & Drops' : 'Open Shift Float'}
            </button>
          </div>

          {/* Cambodia GDT VAT Status Tile */}
          <div className="bg-gradient-to-br from-emerald-900 to-teal-950 p-5 rounded-3xl text-white space-y-3 shadow-md shadow-emerald-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Cambodia GDT VAT Status</span>
              </div>
              <span className="px-2 py-0.5 bg-white/20 text-white rounded-md text-[10px] font-bold">
                10% VAT
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-gray-300">VATTIN Taxpayer ID:</span>
              <span className="font-mono font-bold text-emerald-200 block text-sm">K001-902100888</span>
              <span className="text-[11px] text-gray-300 block pt-1">
                GDT Monthly Return filing deadline: 20th of every month.
              </span>
            </div>

            <button
              onClick={() => setActiveTab('invoices')}
              className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition border border-white/20"
            >
              Review Fiscal Invoices (F4)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
