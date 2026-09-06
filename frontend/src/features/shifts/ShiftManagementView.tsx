import React, { useState, useEffect } from 'react';
import { useApp } from '../../application/context/AppContext';
import { Shift, CashMovement, ZReport, PosRegister } from '../../foundation/types';
import { getRegisters, getCurrentShift, openShift, recordCashMovement, closeShift, getShiftHistory } from '../../data-access/posApi';
import { Coins, Plus, RefreshCw, CheckCircle2, AlertTriangle, ArrowDownRight, ArrowUpRight, Lock, Unlock, FileCheck, DollarSign } from 'lucide-react';

export const ShiftManagementView: React.FC = () => {
  const { t } = useApp();
  const [registers, setRegisters] = useState<PosRegister[]>([]);
  const [selectedRegisterId, setSelectedRegisterId] = useState<number>(1);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [drawerBalance, setDrawerBalance] = useState<number>(0);
  const [history, setHistory] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [latestZReport, setLatestZReport] = useState<ZReport | null>(null);

  // Form states
  const [openFloat, setOpenFloat] = useState<number>(100);
  const [openNotes, setOpenNotes] = useState<string>('Starting shift cash float');

  const [movementType, setMovementType] = useState<'CASH_IN' | 'CASH_OUT' | 'SAFE_DROP' | 'EXPENSE'>('CASH_IN');
  const [movementAmount, setMovementAmount] = useState<number>(10);
  const [movementReason, setMovementReason] = useState<string>('Petty cash top up');

  const [actualCashCounted, setActualCashCounted] = useState<number>(100);
  const [closeNotes, setCloseNotes] = useState<string>('Shift closed cleanly');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [regs, current, hist] = await Promise.all([
        getRegisters(),
        getCurrentShift(selectedRegisterId),
        getShiftHistory(),
      ]);
      setRegisters(regs);
      setActiveShift(current.active_shift);
      setDrawerBalance(parseFloat(current.drawer?.current_balance || '0'));
      setHistory(hist);
    } catch (err) {
      console.error('Failed to load shift data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedRegisterId]);

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await openShift({
        register_id: selectedRegisterId,
        opening_cash: openFloat,
        notes: openNotes,
      });
      setMessage({ text: 'Shift opened and cash drawer initialized!', type: 'success' });
      setShowOpenModal(false);
      loadData();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Failed to open shift', type: 'error' });
    }
  };

  const handleCashMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    try {
      await recordCashMovement({
        shift_id: activeShift.id,
        type: movementType,
        amount: movementAmount,
        reason: movementReason,
      });
      setMessage({ text: 'Cash movement logged in drawer ledger!', type: 'success' });
      setShowMovementModal(false);
      loadData();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Movement failed', type: 'error' });
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    try {
      const report = await closeShift({
        shift_id: activeShift.id,
        actual_cash: actualCashCounted,
        notes: closeNotes,
      });
      setLatestZReport(report);
      setShowCloseModal(false);
      setMessage({ text: `Shift closed! Z-Report generated: ${report.reconciliation_result}`, type: 'success' });
      loadData();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Failed to close shift', type: 'error' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cash Drawer & Shift Management</h1>
            <p className="text-sm text-gray-500">Opening floats, cash drops, real-time drawer balance & Z-Report reconciliation</p>
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

      {/* Active Shift Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        {activeShift ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <span className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Unlock className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-lg text-gray-900">Active Shift: {activeShift.shift_number}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      OPEN
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Cashier: <span className="font-semibold text-gray-700">{activeShift.cashier?.username || 'admin'}</span> | Opened:{' '}
                    {new Date(activeShift.opened_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowMovementModal(true)}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 text-sm font-semibold transition"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Cash In / Out</span>
                </button>
                <button
                  onClick={() => {
                    setActualCashCounted(drawerBalance);
                    setShowCloseModal(true);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 text-sm font-semibold transition shadow-sm shadow-rose-200"
                >
                  <Lock className="w-4 h-4" />
                  <span>Close Shift & Z-Report</span>
                </button>
              </div>
            </div>

            {/* Shift Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <span className="text-xs text-gray-500 font-semibold uppercase">Opening Cash Float</span>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  ${parseFloat(activeShift.opening_cash as string).toFixed(2)}
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-xl">
                <span className="text-xs text-emerald-700 font-semibold uppercase">Live Drawer Cash</span>
                <div className="text-2xl font-bold text-emerald-600 mt-1">
                  ${drawerBalance.toFixed(2)}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <span className="text-xs text-gray-500 font-semibold uppercase">Cash Movements</span>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {activeShift.cash_movements?.length || 0} entry(ies)
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <span className="text-xs text-gray-500 font-semibold uppercase">Terminal Register</span>
                <div className="text-sm font-bold text-gray-900 mt-1">
                  {activeShift.register?.name || 'REG-01'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 space-y-4">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Cash Drawer is Closed</h3>
              <p className="text-sm text-gray-500">Please start a shift and declare the starting cash float before making cash transactions.</p>
            </div>
            <button
              onClick={() => setShowOpenModal(true)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold text-sm shadow-md shadow-emerald-200 transition"
            >
              <Unlock className="w-4 h-4" />
              <span>Start Shift & Open Drawer</span>
            </button>
          </div>
        )}
      </div>

      {/* Shift History & Past Z-Reports */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Shift History & Reconciliation Records</h3>
          <span className="text-xs text-gray-500">{history.length} shift(s) logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Shift Reference</th>
                <th className="px-6 py-3 text-left">Cashier</th>
                <th className="px-6 py-3 text-left">Opened</th>
                <th className="px-6 py-3 text-left">Closed</th>
                <th className="px-6 py-3 text-right">Opening Float</th>
                <th className="px-6 py-3 text-right">Expected</th>
                <th className="px-6 py-3 text-right">Actual Counted</th>
                <th className="px-6 py-3 text-center">Variance</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">
                    No historical shifts logged yet
                  </td>
                </tr>
              ) : (
                history.map((s) => {
                  const diff = parseFloat(s.cash_difference as string) || 0;
                  const isBalanced = diff === 0;
                  const isShort = diff < 0;

                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-mono font-bold text-gray-900">{s.shift_number}</td>
                      <td className="px-6 py-4 font-medium text-gray-800">{s.cashier?.username || 'admin'}</td>
                      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(s.opened_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                        {s.closed_at ? new Date(s.closed_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-700">
                        ${parseFloat(s.opening_cash as string).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-700">
                        {s.expected_cash ? `$${parseFloat(s.expected_cash as string).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        {s.actual_cash ? `$${parseFloat(s.actual_cash as string).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {s.closed_at ? (
                          isBalanced ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              BALANCED
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                                isShort ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {isShort ? `SHORT ($${Math.abs(diff).toFixed(2)})` : `OVER (+$${diff.toFixed(2)})`}
                            </span>
                          )
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            s.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Shift Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Declare Opening Cash Float</h3>
            <p className="text-sm text-gray-500 mb-4">Input starting cash inside the physical drawer to initiate cashier shift.</p>

            <form onSubmit={handleOpenShift} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Starting Cash Float ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={openFloat}
                  onChange={(e) => setOpenFloat(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Shift Notes</label>
                <input
                  type="text"
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="flex-1 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700"
                >
                  Confirm & Open
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cash Movement Modal */}
      {showMovementModal && activeShift && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Cash Movement (Drawer In / Out)</h3>

            <form onSubmit={handleCashMovement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Movement Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementType('CASH_IN')}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      movementType === 'CASH_IN'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-700'
                        : 'bg-white border-gray-200 text-gray-600'
                    }`}
                  >
                    + Cash In (Deposit)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('SAFE_DROP')}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      movementType === 'SAFE_DROP'
                        ? 'bg-rose-50 border-rose-600 text-rose-700'
                        : 'bg-white border-gray-200 text-gray-600'
                    }`}
                  >
                    - Safe Drop
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Reason / Description *</label>
                <input
                  type="text"
                  required
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="flex-1 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700"
                >
                  Save Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Shift & Z-Report Modal */}
      {showCloseModal && activeShift && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Close Shift & Generate Z-Report</h3>
            <p className="text-sm text-gray-500 mb-4">Count the physical cash in drawer and record reconciliation.</p>

            <form onSubmit={handleCloseShift} className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-500 uppercase">System Calculated Balance</span>
                <span className="text-lg font-bold text-gray-900">${drawerBalance.toFixed(2)}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Actual Physical Count ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={actualCashCounted}
                  onChange={(e) => setActualCashCounted(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Real-time Variance preview */}
              <div className="p-3 rounded-xl border flex items-center justify-between text-xs font-bold">
                <span>Reconciliation Variance:</span>
                {actualCashCounted === drawerBalance ? (
                  <span className="text-emerald-600">BALANCED ($0.00)</span>
                ) : actualCashCounted < drawerBalance ? (
                  <span className="text-rose-600">SHORT (-${(drawerBalance - actualCashCounted).toFixed(2)})</span>
                ) : (
                  <span className="text-blue-600">OVER (+${(actualCashCounted - drawerBalance).toFixed(2)})</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Closing Notes</label>
                <input
                  type="text"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="flex-1 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700"
                >
                  Close Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Z-Report Slip Modal */}
      {latestZReport && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 font-mono text-sm space-y-4">
            <div className="text-center border-b border-gray-200 pb-3">
              <div className="font-bold text-lg text-gray-900 tracking-wider">OFFICIAL Z-REPORT</div>
              <div className="text-xs text-gray-500">SmartPOS Cash Drawer Reconciliation</div>
              <div className="text-xs text-gray-400 mt-1">Ref: {latestZReport.shift_number}</div>
            </div>

            <div className="space-y-1.5 text-xs text-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-500">Register:</span>
                <span className="font-bold">{latestZReport.register}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cashier:</span>
                <span className="font-bold">{latestZReport.cashier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Opened At:</span>
                <span>{new Date(latestZReport.opened_at).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Closed At:</span>
                <span>{new Date(latestZReport.closed_at).toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="border-t border-b border-dashed border-gray-200 py-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Opening Cash Float:</span>
                <span className="font-bold">${latestZReport.opening_cash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Cash Sales ({latestZReport.total_sales_count} txns):</span>
                <span className="font-bold">+${latestZReport.total_sales_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cash In Additions:</span>
                <span className="font-bold">+${latestZReport.cash_in.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cash Out / Drops:</span>
                <span className="font-bold text-rose-600">-${latestZReport.cash_out.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-gray-900 border-t border-gray-100 pt-2">
                <span>Expected Cash in Drawer:</span>
                <span>${latestZReport.expected_cash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-gray-900">
                <span>Actual Counted Cash:</span>
                <span>${latestZReport.actual_cash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm">
                <span>Variance:</span>
                <span
                  className={
                    latestZReport.cash_difference === 0
                      ? 'text-emerald-600'
                      : latestZReport.cash_difference < 0
                      ? 'text-rose-600'
                      : 'text-blue-600'
                  }
                >
                  {latestZReport.cash_difference === 0
                    ? '$0.00 (BALANCED)'
                    : latestZReport.cash_difference < 0
                    ? `-$${Math.abs(latestZReport.cash_difference).toFixed(2)} (SHORT)`
                    : `+$${latestZReport.cash_difference.toFixed(2)} (OVER)`}
                </span>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => setLatestZReport(null)}
                className="w-full py-2 bg-gray-900 text-white rounded-xl font-bold text-xs hover:bg-gray-800 transition"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
