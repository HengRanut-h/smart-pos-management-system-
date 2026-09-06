import React, { useState, useEffect } from 'react';
import { useApp } from '../../application/context/AppContext';
import { StockItem, StockMovementItem, Product } from '../../foundation/types';
import { getStocks, getStockMovements, adjustStock, transferStock } from '../../data-access/posApi';
import { Package, ArrowDownUp, RefreshCw, AlertTriangle, ArrowRight, ArrowDownLeft, ArrowUpRight, Search, CheckCircle2 } from 'lucide-react';

export const InventoryPortalView: React.FC = () => {
  const { t, products } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'stocks' | 'movements'>('stocks');
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovementItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Modals state
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);

  // Form states
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<'INCREASE' | 'DECREASE'>('INCREASE');
  const [adjustReason, setAdjustReason] = useState<string>('Physical cycle count verification');

  const [transferQty, setTransferQty] = useState<number>(1);
  const [transferToWarehouseId, setTransferToWarehouseId] = useState<number>(1);
  const [transferNotes, setTransferNotes] = useState<string>('Warehouse replenishment');

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [stocksData, movementsData] = await Promise.all([
        getStocks(),
        getStockMovements(),
      ]);
      setStocks(stocksData);
      setMovements(movementsData);
    } catch (err) {
      console.error('Failed to load inventory data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) return;
    try {
      await adjustStock({
        warehouse_id: selectedStock.warehouse_id,
        product_id: selectedStock.product_id,
        quantity: adjustQty,
        type: adjustType,
        reason: adjustReason,
      });
      setMessage({ text: 'Stock adjustment completed successfully!', type: 'success' });
      setShowAdjustModal(false);
      loadData();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Failed to adjust stock', type: 'error' });
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) return;
    try {
      await transferStock({
        from_warehouse_id: selectedStock.warehouse_id,
        to_warehouse_id: transferToWarehouseId,
        product_id: selectedStock.product_id,
        quantity: transferQty,
        notes: transferNotes,
      });
      setMessage({ text: 'Stock transfer completed successfully!', type: 'success' });
      setShowTransferModal(false);
      loadData();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Failed to transfer stock', type: 'error' });
    }
  };

  const filteredStocks = stocks.filter((st) => {
    const term = search.toLowerCase();
    return (
      st.product?.name.toLowerCase().includes(term) ||
      st.product?.sku.toLowerCase().includes(term) ||
      st.warehouse?.name.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.inventory}</h1>
            <p className="text-sm text-gray-500">Real-time stock ledger, movements, adjustments & transfers</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-medium transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-semibold">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-6 rounded-t-2xl">
        <button
          onClick={() => setActiveSubTab('stocks')}
          className={`py-4 px-6 text-sm font-bold border-b-2 transition ${
            activeSubTab === 'stocks'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Warehouse Stock Levels ({stocks.length})
        </button>
        <button
          onClick={() => setActiveSubTab('movements')}
          className={`py-4 px-6 text-sm font-bold border-b-2 transition ${
            activeSubTab === 'movements'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Audit Movements Ledger ({movements.length})
        </button>
      </div>

      {/* Tab: Stock Levels */}
      {activeSubTab === 'stocks' && (
        <div className="bg-white rounded-b-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search inventory by product name, SKU or warehouse..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">SKU</th>
                  <th className="px-6 py-3 text-left">Product</th>
                  <th className="px-6 py-3 text-left">Warehouse</th>
                  <th className="px-6 py-3 text-right">Physical Qty</th>
                  <th className="px-6 py-3 text-right">Available Qty</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      No stock records found
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((stock) => {
                    const avail = parseFloat(stock.available_quantity as string) || 0;
                    const reorder = parseFloat(stock.reorder_level as string) || 10;
                    const isLow = avail <= reorder;

                    return (
                      <tr key={stock.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-mono font-medium text-gray-700">
                          {stock.product?.sku || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{stock.product?.name}</div>
                          <div className="text-xs text-gray-500">{stock.product?.category?.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {stock.warehouse?.name || 'Central Warehouse'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">
                          {parseFloat(stock.quantity as string).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-600">
                          {avail.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isLow ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setSelectedStock(stock);
                              setShowAdjustModal(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                          >
                            Adjust
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStock(stock);
                              setShowTransferModal(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                          >
                            Transfer
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Movements Ledger */}
      {activeSubTab === 'movements' && (
        <div className="bg-white rounded-b-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">Date / Time</th>
                  <th className="px-6 py-3 text-left">Product</th>
                  <th className="px-6 py-3 text-left">Warehouse</th>
                  <th className="px-6 py-3 text-center">Movement Type</th>
                  <th className="px-6 py-3 text-right">Quantity</th>
                  <th className="px-6 py-3 text-right">Before</th>
                  <th className="px-6 py-3 text-right">After</th>
                  <th className="px-6 py-3 text-left">Created By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">
                      No stock movement audit records found
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => {
                    const qty = parseFloat(m.quantity as string);
                    const isPositive = qty > 0;
                    return (
                      <tr key={m.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(m.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {m.product?.name || `Product #${m.product_id}`}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {m.warehouse?.name || `Warehouse #${m.warehouse_id}`}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            m.movement_type.includes('INCREASE') || m.movement_type === 'PURCHASE' || m.movement_type === 'TRANSFER_IN'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            {m.movement_type}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-right font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isPositive ? `+${qty}` : qty}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-500">
                          {parseFloat(m.before_quantity as string).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">
                          {parseFloat(m.after_quantity as string).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {m.creator?.username || 'System'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedStock && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Adjust Inventory Stock</h3>
            <p className="text-sm text-gray-500 mb-4">
              Item: <span className="font-semibold text-gray-800">{selectedStock.product?.name}</span>
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('INCREASE')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                      adjustType === 'INCREASE'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-700'
                        : 'bg-white border-gray-200 text-gray-600'
                    }`}
                  >
                    + Increase Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('DECREASE')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                      adjustType === 'DECREASE'
                        ? 'bg-rose-50 border-rose-600 text-rose-700'
                        : 'bg-white border-gray-200 text-gray-600'
                    }`}
                  >
                    - Decrease Stock
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Quantity</label>
                <input
                  type="number"
                  step="any"
                  min="0.001"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Reason / Note</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Stock Modal */}
      {showTransferModal && selectedStock && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Transfer Stock Between Warehouses</h3>
            <p className="text-sm text-gray-500 mb-4">
              Item: <span className="font-semibold text-gray-800">{selectedStock.product?.name}</span>
            </p>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Transfer To Warehouse ID</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={transferToWarehouseId}
                  onChange={(e) => setTransferToWarehouseId(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-400 mt-1">Default Warehouse #1 is Central Warehouse</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Transfer Quantity</label>
                <input
                  type="number"
                  step="any"
                  min="0.001"
                  required
                  value={transferQty}
                  onChange={(e) => setTransferQty(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Notes</label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
