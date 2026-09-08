import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '../../application/context/AppContext';
import { getSales, voidSale } from '../../data-access/posApi';
import { Sale } from '../../foundation/types';
import { ThermalReceiptModal } from '../../presentation/components/ThermalReceiptModal';
import {
  Ban,
  Printer,
  Search,
  RefreshCw,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Receipt,
  User,
  Calendar,
} from 'lucide-react';

export const SalesHistoryView: React.FC = () => {
  const { t, lang, notify } = useApp();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);

  const fetchSales = () => {
    setLoading(true);
    getSales()
      .then((data) => setSales(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleVoid = async (id: number) => {
    const reason = prompt(lang === 'kh' ? 'សូមបញ្ចូលមូលហេតុនៃការលុបចោលការលក់នេះ:' : 'Please enter reason for voiding this sale:');
    if (!reason) return;
    try {
      await voidSale(id, reason);
      notify.success(
        lang === 'kh'
          ? 'ការលក់ត្រូវបានលុបចោលជោគជ័យ! ចលនាសន្និធិត្រូវបានកែតម្រូវឡើងវិញ។'
          : 'Sale voided successfully! Compensating inventory movement created.',
        'Sale Voided'
      );
      fetchSales();
    } catch (err: any) {
      notify.error('Void failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredSales = useMemo(() => {
    if (!searchQuery.trim()) return sales;
    const q = searchQuery.toLowerCase();
    return sales.filter(
      (s) =>
        s.sale_number.toLowerCase().includes(q) ||
        (s.items && s.items.some((it) => it.product?.name.toLowerCase().includes(q)))
    );
  }, [sales, searchQuery]);

  // Aggregate KPIs
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
  const avgOrderValue = sales.length > 0 ? totalRevenue / sales.length : 0;
  const totalItemsSold = sales.reduce((sum, s) => {
    const itemCount = (s.items || []).reduce((iSum, it) => iSum + Number(it.quantity || 1), 0);
    return sum + (itemCount || 1);
  }, 0);

  return (
    <div className="flex-1 bg-gray-50 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {lang === 'kh' ? 'ប្រវត្តិការលក់ & បោះពុម្ពវិក្កយបត្រ' : 'Sales History & Thermal Receipts'}
              </h1>
              <p className="text-xs text-gray-500">
                {lang === 'kh'
                  ? 'កំណត់ត្រាប្រតិបត្តិការលក់ទាំងអស់ និងការបោះពុម្ពឡើងវិញ'
                  : 'Immutable transaction ledger, thermal slip reprinting, and order voids'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchSales}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Gross Sales
              </span>
              <h3 className="text-2xl font-black text-gray-900 mt-1">
                ${totalRevenue.toFixed(2)}
              </h3>
              <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">
                ≈ ៛{(totalRevenue * 4100).toLocaleString()} KHR
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Orders
              </span>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{sales.length}</h3>
              <span className="text-xs text-blue-600 font-medium mt-1 inline-block">
                Completed Checkouts
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Average Basket Size
              </span>
              <h3 className="text-2xl font-black text-purple-600 mt-1">
                ${avgOrderValue.toFixed(2)}
              </h3>
              <span className="text-xs text-gray-500 font-medium mt-1 inline-block">
                Per checkout transaction
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Items Dispatched
              </span>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{totalItemsSold}</h3>
              <span className="text-xs text-gray-500 font-medium mt-1 inline-block">
                From Warehouse HQ
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by sale number (e.g. SALE-...) or item name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition"
            />
          </div>
          <span className="text-xs text-gray-400 font-mono">
            {filteredSales.length} Orders Found
          </span>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Sale Number</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Items Summary</th>
                  <th className="py-3.5 px-4 text-right">Subtotal</th>
                  <th className="py-3.5 px-4 text-right">Total (USD)</th>
                  <th className="py-3.5 px-4 text-right">Total (KHR)</th>
                  <th className="py-3.5 px-4 text-center">Receipt & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                      Loading transactions...
                    </td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      <Receipt className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      No completed sales matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => {
                    const total = Number(sale.total_amount || 0);
                    const subtotal = Number(sale.subtotal || total);
                    const items = sale.items || [];

                    return (
                      <tr key={sale.id} className="hover:bg-gray-50/50 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                          {sale.sale_number}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                          {new Date(sale.sale_date).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-gray-700">
                          {items.length > 0 ? (
                            <span>
                              {items.map((it: any) => `${it.quantity}x ${it.product?.name || 'Item'}`).join(', ')}
                            </span>
                          ) : (
                            <span className="text-gray-400">Retail checkout</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-gray-500">
                          ${subtotal.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-600 text-sm">
                          ${total.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-gray-500">
                          ៛{(total * 4100).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => setSelectedSaleForReceipt(sale)}
                              className="flex items-center space-x-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition shadow-2xs"
                              title="Print Thermal Receipt"
                            >
                              <Printer className="w-3.5 h-3.5 text-gray-600" />
                              <span>Print Slip</span>
                            </button>
                            <button
                              onClick={() => handleVoid(sale.id)}
                              className="flex items-center space-x-1 px-2.5 py-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg text-xs font-bold transition"
                              title="Void Sale"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Void</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Thermal Receipt Modal */}
      {selectedSaleForReceipt && (
        <ThermalReceiptModal
          sale={selectedSaleForReceipt}
          onClose={() => setSelectedSaleForReceipt(null)}
        />
      )}
    </div>
  );
};
