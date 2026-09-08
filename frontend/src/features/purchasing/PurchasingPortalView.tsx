import React, { useState, useEffect } from 'react';
import { useApp } from '../../application/context/AppContext';
import { Supplier, PurchaseOrder, Product } from '../../foundation/types';
import { getSuppliers, createSupplier, getPurchases, createPurchaseOrder, approvePurchaseOrder, receivePurchaseGoods } from '../../data-access/posApi';
import { Truck, Plus, RefreshCw, CheckCircle2, AlertCircle, Eye, Check, ArrowDownToLine, Users, FileText } from 'lucide-react';

export const PurchasingPortalView: React.FC = () => {
  const { t, products, lang, notify } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'suppliers'>('orders');
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [showCreatePOModal, setShowCreatePOModal] = useState(false);
  const [showCreateSupplierModal, setShowCreateSupplierModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // New PO State
  const [poSupplierId, setPoSupplierId] = useState<number>(1);
  const [poNotes, setPoNotes] = useState<string>('');
  const [poItems, setPoItems] = useState<Array<{ product_id: number; unit_id: number; quantity: number; unit_cost: number }>>([
    { product_id: 1, unit_id: 1, quantity: 20, unit_cost: 0.35 }
  ]);

  // New Supplier State
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');

  // Receive items state
  const [receiveInputs, setReceiveInputs] = useState<{ [purchaseItemId: number]: number }>({});

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [poData, supData] = await Promise.all([
        getPurchases(),
        getSuppliers(),
      ]);
      setPurchases(poData);
      setSuppliers(supData);
      if (supData.length > 0 && !poSupplierId) {
        setPoSupplierId(supData[0].id);
      }
    } catch (err) {
      console.error('Failed to load purchasing data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSupplier({
        name: supName,
        contact_person: supContact,
        phone: supPhone,
        email: supEmail,
        address: supAddress,
      });
      const msg = lang === 'kh' ? 'អ្នកផ្គត់ផ្គង់ត្រូវបានចុះឈ្មោះដោយជោគជ័យ!' : 'Supplier registered successfully!';
      setMessage({ text: msg, type: 'success' });
      notify.success(msg, lang === 'kh' ? 'អ្នកផ្គត់ផ្គង់' : 'Supplier');
      setShowCreateSupplierModal(false);
      setSupName('');
      setSupContact('');
      setSupPhone('');
      setSupEmail('');
      setSupAddress('');
      loadData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || (lang === 'kh' ? 'បរាជ័យក្នុងការចុះឈ្មោះអ្នកផ្គត់ផ្គង់' : 'Failed to create supplier');
      setMessage({ text: errorMsg, type: 'error' });
      notify.error(errorMsg, lang === 'kh' ? 'កំហុស' : 'Supplier Error');
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPurchaseOrder({
        supplier_id: poSupplierId,
        branch_id: 1,
        warehouse_id: 1,
        items: poItems,
        notes: poNotes,
      });
      const msg = lang === 'kh' ? 'ការបញ្ជាទិញទំនិញត្រូវបានបង្កើតដោយជោគជ័យ!' : 'Purchase order created successfully!';
      setMessage({ text: msg, type: 'success' });
      notify.success(msg, lang === 'kh' ? 'ការបញ្ជាទិញ' : 'Purchase Order');
      setShowCreatePOModal(false);
      loadData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || (lang === 'kh' ? 'បរាជ័យក្នុងការបង្កើតការបញ្ជាទិញ' : 'Failed to create purchase order');
      setMessage({ text: errorMsg, type: 'error' });
      notify.error(errorMsg, lang === 'kh' ? 'កំហុស' : 'Purchase Order Error');
    }
  };

  const handleApprovePO = async (id: number) => {
    try {
      await approvePurchaseOrder(id);
      const msg = lang === 'kh' ? `ការបញ្ជាទិញ #${id} ត្រូវបានអនុម័ត!` : `Purchase Order #${id} approved!`;
      setMessage({ text: msg, type: 'success' });
      notify.success(msg, lang === 'kh' ? 'ការបញ្ជាទិញ' : 'Purchase Order');
      loadData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || (lang === 'kh' ? 'ការអនុម័តបានបរាជ័យ' : 'Approval failed');
      setMessage({ text: errorMsg, type: 'error' });
      notify.error(errorMsg, lang === 'kh' ? 'កំហុស' : 'Approval Error');
    }
  };

  const openReceiveModal = (po: PurchaseOrder) => {
    setSelectedPO(po);
    const initialInputs: { [id: number]: number } = {};
    po.items?.forEach((item) => {
      const remaining = Math.max(0, parseFloat(item.quantity as string) - parseFloat(item.received_quantity as string));
      initialInputs[item.id] = remaining;
    });
    setReceiveInputs(initialInputs);
    setShowReceiveModal(true);
  };

  const handleReceiveGoods = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) return;
    try {
      const itemsToReceive = Object.entries(receiveInputs)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => ({
          purchase_item_id: parseInt(id),
          quantity: qty,
        }));

      if (itemsToReceive.length === 0) {
        const warnMsg = lang === 'kh' ? 'សូមបញ្ជាក់ចំនួនទំនិញដែលត្រូវទទួល' : 'Please specify quantities to receive';
        setMessage({ text: warnMsg, type: 'error' });
        notify.warning(warnMsg, lang === 'kh' ? 'ការព្រមាន' : 'Receive Goods');
        return;
      }

      await receivePurchaseGoods(selectedPO.id, itemsToReceive);
      const msg = lang === 'kh' ? 'ទំនិញត្រូវបានទទួល ហើយស្តុកត្រូវបានបន្ថែមដោយស្វ័យប្រវត្តិ!' : 'Goods received and inventory automatically incremented!';
      setMessage({ text: msg, type: 'success' });
      notify.success(msg, lang === 'kh' ? 'ទទួលទំនិញ' : 'Receive Goods');
      setShowReceiveModal(false);
      loadData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || (lang === 'kh' ? 'បរាជ័យក្នុងការទទួលទំនិញ' : 'Failed to receive goods');
      setMessage({ text: errorMsg, type: 'error' });
      notify.error(errorMsg, lang === 'kh' ? 'កំហុស' : 'Receive Error');
    }
  };

  const addItemToPO = () => {
    if (products.length === 0) return;
    const p = products[0];
    const cost = typeof p.cost_price === 'string' ? parseFloat(p.cost_price) : p.cost_price;
    setPoItems([...poItems, { product_id: p.id, unit_id: p.unit?.id || 1, quantity: 10, unit_cost: cost }]);
  };

  const removeItemFromPO = (index: number) => {
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.purchases}</h1>
            <p className="text-sm text-gray-500">Procurement orders, supplier vendor registry & goods receipt</p>
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
          <button
            onClick={() => setShowCreateSupplierModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 text-sm font-semibold transition"
          >
            <Users className="w-4 h-4" />
            <span>New Supplier</span>
          </button>
          <button
            onClick={() => setShowCreatePOModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-semibold transition shadow-sm shadow-emerald-200"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
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
          onClick={() => setActiveSubTab('orders')}
          className={`py-4 px-6 text-sm font-bold border-b-2 transition ${
            activeSubTab === 'orders'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Purchase Orders ({purchases.length})
        </button>
        <button
          onClick={() => setActiveSubTab('suppliers')}
          className={`py-4 px-6 text-sm font-bold border-b-2 transition ${
            activeSubTab === 'suppliers'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Suppliers Directory ({suppliers.length})
        </button>
      </div>

      {/* Tab: Orders */}
      {activeSubTab === 'orders' && (
        <div className="bg-white rounded-b-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">PO Number</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Supplier</th>
                  <th className="px-6 py-3 text-right">Items</th>
                  <th className="px-6 py-3 text-right">Total Amount</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      No purchase orders recorded yet
                    </td>
                  </tr>
                ) : (
                  purchases.map((po) => {
                    const statusName = po.status?.name || 'Draft';
                    const statusCode = po.status?.code || 'DRAFT';
                    const isFullyReceived = statusCode.includes('FULLY') || statusCode.includes('RECEIVED');
                    const isApproved = statusCode.includes('APPROVED');

                    return (
                      <tr key={po.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-mono font-bold text-gray-900">
                          {po.purchase_number}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(po.purchase_date || po.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-800">
                          {po.supplier?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          {po.items?.length || 0} line(s)
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                          ${parseFloat(po.total_amount as string).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isFullyReceived
                                ? 'bg-emerald-100 text-emerald-800'
                                : isApproved
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {statusName}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {!isApproved && !isFullyReceived && (
                            <button
                              onClick={() => handleApprovePO(po.id)}
                              className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                            >
                              Approve
                            </button>
                          )}
                          {!isFullyReceived && (
                            <button
                              onClick={() => openReceiveModal(po)}
                              className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition"
                            >
                              Receive Goods
                            </button>
                          )}
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

      {/* Tab: Suppliers */}
      {activeSubTab === 'suppliers' && (
        <div className="bg-white rounded-b-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">Code</th>
                  <th className="px-6 py-3 text-left">Company Name</th>
                  <th className="px-6 py-3 text-left">Contact Person</th>
                  <th className="px-6 py-3 text-left">Phone</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Tax / VAT ID</th>
                  <th className="px-6 py-3 text-left">Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      No suppliers registered yet
                    </td>
                  </tr>
                ) : (
                  suppliers.map((sup) => (
                    <tr key={sup.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-mono font-medium text-gray-700">{sup.code}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{sup.name}</td>
                      <td className="px-6 py-4 text-gray-700">{sup.contact_person || '—'}</td>
                      <td className="px-6 py-4 text-gray-600">{sup.phone || '—'}</td>
                      <td className="px-6 py-4 text-gray-600">{sup.email || '—'}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{sup.tax_number || '—'}</td>
                      <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">{sup.address || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Supplier Modal */}
      {showCreateSupplierModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Register New Supplier</h3>
            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Company / Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={supContact}
                    onChange={(e) => setSupContact(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Tax / VAT ID</label>
                  <input
                    type="text"
                    value={supAddress}
                    onChange={(e) => setSupAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateSupplierModal(false)}
                  className="flex-1 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      {showCreatePOModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Purchase Order</h3>
            <form onSubmit={handleCreatePO} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Supplier</label>
                  <select
                    value={poSupplierId}
                    onChange={(e) => setPoSupplierId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">PO Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Monthly beverage restock"
                    value={poNotes}
                    onChange={(e) => setPoNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Order Line Items</label>
                  <button
                    type="button"
                    onClick={addItemToPO}
                    className="text-xs text-emerald-600 font-bold hover:underline"
                  >
                    + Add Product Line
                  </button>
                </div>

                <div className="space-y-2">
                  {poItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl">
                      <select
                        value={item.product_id}
                        onChange={(e) => {
                          const pId = parseInt(e.target.value);
                          const prod = products.find((p) => p.id === pId);
                          const cost = prod ? (typeof prod.cost_price === 'string' ? parseFloat(prod.cost_price) : prod.cost_price) : 0;
                          const newItems = [...poItems];
                          newItems[idx] = { ...newItems[idx], product_id: pId, unit_id: prod?.unit?.id || 1, unit_cost: cost };
                          setPoItems(newItems);
                        }}
                        className="flex-2 px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>

                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...poItems];
                            newItems[idx].quantity = parseFloat(e.target.value) || 0;
                            setPoItems(newItems);
                          }}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
                        />
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Unit Cost"
                          value={item.unit_cost}
                          onChange={(e) => {
                            const newItems = [...poItems];
                            newItems[idx].unit_cost = parseFloat(e.target.value) || 0;
                            setPoItems(newItems);
                          }}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
                        />
                      </div>

                      <div className="w-24 text-right font-bold text-sm text-gray-800">
                        ${(item.quantity * item.unit_cost).toFixed(2)}
                      </div>

                      {poItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemFromPO(idx)}
                          className="text-xs text-rose-500 font-bold px-2 py-1 hover:bg-rose-50 rounded"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="text-right pt-3 font-bold text-base text-gray-900">
                  Total Order Value: ${poItems.reduce((sum, it) => sum + it.quantity * it.unit_cost, 0).toFixed(2)}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreatePOModal(false)}
                  className="flex-1 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700"
                >
                  Submit Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Goods Modal */}
      {showReceiveModal && selectedPO && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Receive Goods into Warehouse</h3>
            <p className="text-sm text-gray-500 mb-4">
              PO: <span className="font-semibold text-gray-800">{selectedPO.purchase_number}</span> ({selectedPO.supplier?.name})
            </p>

            <form onSubmit={handleReceiveGoods} className="space-y-4">
              <div className="space-y-3">
                {selectedPO.items?.map((item) => {
                  const qty = parseFloat(item.quantity as string);
                  const received = parseFloat(item.received_quantity as string);
                  const remaining = Math.max(0, qty - received);

                  return (
                    <div key={item.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm text-gray-900">{item.product?.name}</div>
                        <div className="text-xs text-gray-500">
                          Ordered: {qty} | Already Received: {received} | Remaining: {remaining}
                        </div>
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max={remaining}
                          value={receiveInputs[item.id] ?? remaining}
                          onChange={(e) => {
                            setReceiveInputs({
                              ...receiveInputs,
                              [item.id]: parseFloat(e.target.value) || 0,
                            });
                          }}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-right font-bold bg-white"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="flex-1 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700"
                >
                  Confirm & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
