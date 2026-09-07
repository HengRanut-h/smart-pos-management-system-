import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  UserCheck,
  DollarSign,
  RotateCcw,
  BarChart3,
  Search,
  Plus,
  Filter,
  RefreshCw,
  Phone,
  Eye,
  ArrowRight,
  ShieldCheck,
  Bike,
  Car,
  Layers,
  Calendar,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  Delivery,
  DeliveryZone,
  DeliveryDriver,
  DriverCodSettlement,
  DeliveryDashboardMetrics,
  DeliveryStatus,
} from '../../foundation/types/delivery';
import {
  getDeliveryDashboard,
  getDeliveryOrders,
  getDeliveryDrivers,
  getDeliveryZones,
  getCodSettlements,
  getDeliveryReports,
  updateDeliveryStatus,
  updateDriverStatus,
  createDeliveryZone,
  createDeliveryDriver,
} from '../../data-access/deliveryApi';
import { useApp } from '../../application/context/AppContext';
import { CreateDeliveryModal } from './CreateDeliveryModal';
import { AssignDriverModal } from './AssignDriverModal';
import { ProofOfDeliveryModal } from './ProofOfDeliveryModal';
import { SettleCodModal } from './SettleCodModal';
import { DeliveryDetailsDrawer } from './DeliveryDetailsDrawer';

type DeliverySubTab =
  | 'DASHBOARD'
  | 'ORDERS'
  | 'ASSIGNMENT'
  | 'TRACKING'
  | 'STAFF'
  | 'ZONES'
  | 'POD'
  | 'COD'
  | 'RETURNS'
  | 'REPORTS';

export const DeliveryManagementView: React.FC = () => {
  const { products } = useApp();

  const [activeTab, setActiveTab] = useState<DeliverySubTab>('DASHBOARD');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [metrics, setMetrics] = useState<DeliveryDashboardMetrics | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [settlements, setSettlements] = useState<DriverCodSettlement[]>([]);
  const [driversWithCash, setDriversWithCash] = useState<any[]>([]);
  const [reportsData, setReportsData] = useState<any>(null);
  const [eligibleEmployees, setEligibleEmployees] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [assignModalDelivery, setAssignModalDelivery] = useState<Delivery | null>(null);
  const [proofModalDelivery, setProofModalDelivery] = useState<Delivery | null>(null);
  const [settleModalDriver, setSettleModalDriver] = useState<any | null>(null);
  const [detailsDrawerDelivery, setDetailsDrawerDelivery] = useState<Delivery | null>(null);

  // Quick Zone Modal
  const [isNewZoneOpen, setIsNewZoneOpen] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneCode, setNewZoneCode] = useState('');
  const [newZoneFee, setNewZoneFee] = useState<number>(2.0);

  // Quick Driver Modal
  const [isNewDriverOpen, setIsNewDriverOpen] = useState(false);
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverVehicle, setNewDriverVehicle] = useState<'MOTORCYCLE' | 'CAR' | 'VAN'>('MOTORCYCLE');
  const [newDriverPlate, setNewDriverPlate] = useState('');

  // Tracking tab selection
  const [selectedTrackingDeliveryId, setSelectedTrackingDeliveryId] = useState<number | null>(null);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [dashRes, ordersRes, driversRes, zonesRes, codRes, repRes] = await Promise.all([
        getDeliveryDashboard(),
        getDeliveryOrders({ status: orderStatusFilter, search: searchQuery }),
        getDeliveryDrivers(),
        getDeliveryZones(),
        getCodSettlements(),
        getDeliveryReports(),
      ]);

      setMetrics(dashRes.metrics);
      setDeliveries(ordersRes.data?.data || []);
      setDrivers(driversRes.drivers || []);
      setEligibleEmployees(driversRes.eligible_employees || []);
      setZones(zonesRes.zones || []);
      setSettlements(codRes.settlements || []);
      setDriversWithCash(codRes.drivers_with_cash || []);
      setReportsData(repRes);

      if (!selectedTrackingDeliveryId && ordersRes.data?.data?.length > 0) {
        setSelectedTrackingDeliveryId(ordersRes.data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load delivery data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [orderStatusFilter]);

  const handleAdvanceStatus = async (id: number, nextStatus: DeliveryStatus) => {
    try {
      await updateDeliveryStatus(id, nextStatus);
      loadAllData();
      if (detailsDrawerDelivery && detailsDrawerDelivery.id === id) {
        setDetailsDrawerDelivery((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName || !newZoneCode) return;
    try {
      await createDeliveryZone({
        name: newZoneName,
        code: newZoneCode,
        base_delivery_fee: newZoneFee,
      });
      setIsNewZoneOpen(false);
      setNewZoneName('');
      setNewZoneCode('');
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverName || !newDriverPhone) return;
    try {
      await createDeliveryDriver({
        name: newDriverName,
        phone: newDriverPhone,
        vehicle_type: newDriverVehicle,
        vehicle_plate_number: newDriverPlate,
      });
      setIsNewDriverOpen(false);
      setNewDriverName('');
      setNewDriverPhone('');
      setNewDriverPlate('');
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ACCEPTED':
      case 'PICKED_UP':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'IN_TRANSIT':
        return 'bg-purple-100 text-purple-800 border-purple-200 animate-pulse';
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'FAILED':
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'RETURNED_TO_STORE':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const trackingSelectedDelivery = deliveries.find((d) => d.id === selectedTrackingDeliveryId) || deliveries[0];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-hidden select-none">
      {/* 1. Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-900/20">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black text-gray-900 leading-tight">Delivery Management</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                LIVE DISPATCH
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Fleet dispatch, zone pricing, driver tracking & Cash on Delivery (COD) settlement
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={loadAllData}
            disabled={isLoading}
            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition shadow-2xs"
            title="Refresh Deliveries"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-emerald-900/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Delivery</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 shrink-0 flex items-center space-x-1 overflow-x-auto scrollbar-none py-1">
        {[
          { id: 'DASHBOARD', label: '1. Dashboard', icon: BarChart3 },
          { id: 'ORDERS', label: '2. Orders', icon: Package },
          { id: 'ASSIGNMENT', label: '3. Assignment', icon: UserCheck },
          { id: 'TRACKING', label: '4. Tracking', icon: MapPin },
          { id: 'STAFF', label: '5. Staff & Fleet', icon: Bike },
          { id: 'ZONES', label: '6. Zones & Fees', icon: Layers },
          { id: 'POD', label: '7. Proof of Delivery', icon: ShieldCheck },
          { id: 'COD', label: '8. COD & Settlement', icon: DollarSign },
          { id: 'RETURNS', label: '9. Returns', icon: RotateCcw },
          { id: 'REPORTS', label: '10. Reports', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as DeliverySubTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Main Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* ================= TAB 1: DASHBOARD ================= */}
        {activeTab === 'DASHBOARD' && metrics && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {[
                { label: 'Total Deliveries', value: metrics.total_deliveries, color: 'text-gray-900', bg: 'bg-white', icon: Package },
                { label: 'Pending', value: metrics.pending, color: 'text-amber-600', bg: 'bg-amber-50/50', icon: Clock },
                { label: 'Assigned', value: metrics.assigned, color: 'text-blue-600', bg: 'bg-blue-50/50', icon: UserCheck },
                { label: 'In Transit', value: metrics.in_transit, color: 'text-purple-600', bg: 'bg-purple-50/50', icon: Truck },
                { label: 'Delivered', value: metrics.delivered, color: 'text-emerald-600', bg: 'bg-emerald-50/50', icon: CheckCircle2 },
                { label: 'Failed / Cancelled', value: metrics.failed, color: 'text-rose-600', bg: 'bg-rose-50/50', icon: AlertTriangle },
                { label: 'COD Collected', value: `$${metrics.cod_collected.toFixed(2)}`, color: 'text-emerald-700 font-mono', bg: 'bg-emerald-50/70', icon: DollarSign },
                { label: 'Delivery Fees', value: `$${metrics.total_delivery_fees.toFixed(2)}`, color: 'text-slate-800 font-mono', bg: 'bg-slate-50', icon: Sparkles },
              ].map((kpi, idx) => {
                const Icon = kpi.icon;
                return (
                  <div key={idx} className={`p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs ${kpi.bg}`}>
                    <div className="flex items-center justify-between text-gray-400 mb-1">
                      <span className="text-[11px] font-semibold">{kpi.label}</span>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className={`text-lg font-black block leading-none ${kpi.color}`}>
                      {kpi.value}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quick Dispatch Banner & Drivers Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Active Drivers Bar */}
              <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Bike className="w-4 h-4 text-emerald-600" />
                    <span>Active Riders Fleet ({metrics.active_drivers}/{metrics.total_drivers})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('STAFF')}
                    className="text-xs font-bold text-emerald-600 hover:underline"
                  >
                    View All &rarr;
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {drivers.slice(0, 4).map((d) => (
                    <div key={d.id} className="p-3 rounded-2xl border border-gray-100 bg-gray-50/60 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-gray-800 block">{d.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {d.vehicle_type} • {d.vehicle_plate_number || 'No plate'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.current_status === 'AVAILABLE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {d.current_status}
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          COD: ${Number(d.active_cash_in_hand).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Deliveries Table */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-gray-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span>Recent Deliveries Pipeline</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ORDERS')}
                    className="text-xs font-bold text-emerald-600 hover:underline"
                  >
                    Manage Orders &rarr;
                  </button>
                </div>

                <div className="divide-y divide-gray-100 overflow-x-auto">
                  {deliveries.slice(0, 5).map((d) => (
                    <div key={d.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-gray-900">{d.delivery_number}</span>
                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold border ${getStatusBadge(d.status)}`}>
                            {d.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <span className="text-gray-500 truncate block mt-0.5">{d.recipient_name} — {d.delivery_address}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-emerald-600 block">${Number(d.total_amount).toFixed(2)} ({d.payment_type})</span>
                        <button
                          type="button"
                          onClick={() => setDetailsDrawerDelivery(d)}
                          className="text-[11px] text-gray-400 hover:text-emerald-600 flex items-center gap-0.5 justify-end"
                        >
                          <span>Details</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: ORDERS ================= */}
        {activeTab === 'ORDERS' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Sub-status pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto">
                {['ALL', 'PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'FAILED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      orderStatusFilter === st
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search order #, customer, phone..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="p-3.5">Order Number</th>
                    <th className="p-3.5">Recipient & Destination</th>
                    <th className="p-3.5">Zone & Rider</th>
                    <th className="p-3.5">Payment / COD</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {deliveries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400">
                        No deliveries match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    deliveries.map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50/80 transition">
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-gray-900 block">{d.delivery_number}</span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-gray-800 block">{d.recipient_name}</span>
                          <span className="text-[11px] text-gray-500 font-mono">{d.recipient_phone}</span>
                          <p className="text-[11px] text-gray-400 truncate max-w-xs">{d.delivery_address}</p>
                        </td>
                        <td className="p-3.5">
                          <span className="text-gray-700 font-medium block">{d.zone?.name || 'Standard Zone'}</span>
                          {d.driver ? (
                            <span className="text-emerald-700 text-[11px] font-semibold flex items-center gap-1">
                              <Bike className="w-3 h-3" />
                              {d.driver.name}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAssignModalDelivery(d)}
                              className="text-blue-600 hover:underline text-[11px] font-bold"
                            >
                              + Assign Rider
                            </button>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-gray-900 block">${Number(d.total_amount).toFixed(2)}</span>
                          <span className="text-[10px] font-semibold text-gray-500">
                            {d.payment_type} {d.payment_type === 'COD' && `($${Number(d.cod_amount_due).toFixed(2)})`}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(d.status)}`}>
                            {d.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {d.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => setAssignModalDelivery(d)}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 transition"
                            >
                              Dispatch
                            </button>
                          )}
                          {d.status === 'IN_TRANSIT' && (
                            <button
                              type="button"
                              onClick={() => setProofModalDelivery(d)}
                              className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition shadow-2xs"
                            >
                              POD Complete
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDetailsDrawerDelivery(d)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: ASSIGNMENT ================= */}
        {activeTab === 'ASSIGNMENT' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-150">
            {/* Left: Pending Orders needing Dispatch */}
            <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Unassigned / Pending Deliveries ({deliveries.filter((d) => d.status === 'PENDING').length})</span>
                </h3>
              </div>

              <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
                {deliveries.filter((d) => d.status === 'PENDING').length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs">
                    All deliveries are currently assigned to drivers!
                  </div>
                ) : (
                  deliveries
                    .filter((d) => d.status === 'PENDING')
                    .map((d) => (
                      <div key={d.id} className="p-4 rounded-2xl border border-gray-150 bg-gray-50/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-gray-900">{d.delivery_number}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            {d.priority} PRIORITY
                          </span>
                        </div>
                        <div className="text-xs text-gray-700">
                          <div className="font-bold">{d.recipient_name} ({d.recipient_phone})</div>
                          <p className="text-gray-500 text-[11px] truncate">{d.delivery_address}</p>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-gray-150 text-xs">
                          <span className="font-mono font-bold text-emerald-600">${Number(d.total_amount).toFixed(2)} ({d.payment_type})</span>
                          <button
                            type="button"
                            onClick={() => setAssignModalDelivery(d)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-2xs transition"
                          >
                            Assign Driver &rarr;
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Right: Drivers Workload & Availability */}
            <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Bike className="w-4 h-4 text-emerald-600" />
                  <span>Fleet Availability & Workload</span>
                </h3>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {drivers.map((d) => (
                  <div key={d.id} className="p-4 rounded-2xl border border-gray-100 bg-white shadow-xs flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-gray-900">{d.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.current_status === 'AVAILABLE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {d.current_status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        <span>{d.vehicle_type} • {d.vehicle_plate_number}</span>
                        <span className="mx-1.5">•</span>
                        <span>Rating: ★ {d.rating}</span>
                      </div>
                      <span className="text-[11px] text-gray-400 font-mono mt-0.5 block">
                        Completed: {d.total_deliveries_completed} orders | Cash in hand: ${Number(d.active_cash_in_hand).toFixed(2)}
                      </span>
                    </div>

                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => {
                          const nextStatus = d.current_status === 'AVAILABLE' ? 'BREAK' : 'AVAILABLE';
                          updateDriverStatus(d.id, nextStatus).then(() => loadAllData());
                        }}
                        className="text-xs font-bold text-gray-500 hover:text-gray-900 bg-gray-100 px-2.5 py-1.5 rounded-xl hover:bg-gray-200 transition"
                      >
                        Set {d.current_status === 'AVAILABLE' ? 'Break' : 'Available'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: TRACKING ================= */}
        {activeTab === 'TRACKING' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-150">
            {/* Left: Active Deliveries Selector */}
            <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-gray-900">Select Active Delivery</h3>
              <div className="space-y-2 max-h-[550px] overflow-y-auto">
                {deliveries.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedTrackingDeliveryId(d.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition ${
                      trackingSelectedDelivery?.id === d.id
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                        : 'border-gray-150 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-gray-900">{d.delivery_number}</span>
                      <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold border ${getStatusBadge(d.status)}`}>
                        {d.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-gray-800 block truncate mt-1">{d.recipient_name}</span>
                    <span className="text-[11px] text-gray-400 truncate block">{d.delivery_address}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Timeline & GPS Route Simulator */}
            {trackingSelectedDelivery && (
              <div className="lg:col-span-2 space-y-4">
                {/* Live Delivery Status Map Preview Box */}
                <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider block">
                        Live Tracking & Navigation
                      </span>
                      <h2 className="text-xl font-black mt-0.5">{trackingSelectedDelivery.delivery_number}</h2>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white animate-pulse">
                      {trackingSelectedDelivery.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-800/80 p-3.5 rounded-2xl text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Rider:</span>
                      <span className="font-bold text-white">{trackingSelectedDelivery.driver?.name || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Est. Time:</span>
                      <span className="font-bold text-emerald-400 font-mono">{trackingSelectedDelivery.estimated_delivery_time || '20-30 mins'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Amount Due:</span>
                      <span className="font-bold text-white font-mono">${Number(trackingSelectedDelivery.total_amount).toFixed(2)} ({trackingSelectedDelivery.payment_type})</span>
                    </div>
                  </div>

                  {/* Simulated GPS Route Line */}
                  <div className="mt-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Destination</span>
                        <span className="font-medium text-slate-200">{trackingSelectedDelivery.delivery_address}</span>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-emerald-400 font-bold">GPS: 11.5750° N, 104.8990° E</span>
                  </div>
                </div>

                {/* Tracking Logs List */}
                <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-2xs space-y-3">
                  <h3 className="text-sm font-bold text-gray-900">Timeline Milestones</h3>
                  <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-gray-200">
                    {trackingSelectedDelivery.tracking_logs?.map((log, idx) => (
                      <div key={idx} className="relative flex items-start space-x-3 text-xs pl-8">
                        <div className="absolute left-2 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 border-2 border-white"></div>
                        <div className="flex-1 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                          <div className="flex items-center justify-between font-bold text-gray-900">
                            <span>{log.status.replace(/_/g, ' ')}</span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {new Date(log.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-gray-600 mt-0.5 text-[11px]">{log.notes}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 5: STAFF & FLEET ================= */}
        {activeTab === 'STAFF' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-gray-200/80 shadow-2xs">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Delivery Drivers & Vehicles</h3>
                <p className="text-xs text-gray-500">Fleet management, driver licenses & live availability status</p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewDriverOpen(true)}
                className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Driver</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {drivers.map((d) => (
                <div key={d.id} className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                        {d.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-gray-900">{d.name}</h4>
                        <span className="text-[11px] text-gray-500 font-mono">{d.phone}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      d.current_status === 'AVAILABLE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {d.current_status}
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-2xl text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vehicle:</span>
                      <span className="font-semibold text-gray-800">{d.vehicle_type} ({d.vehicle_plate_number || 'N/A'})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">License #:</span>
                      <span className="font-mono text-gray-800">{d.driver_license_number || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Rating:</span>
                      <span className="font-bold text-amber-600">★ {d.rating}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cash in Hand:</span>
                      <span className="font-mono font-bold text-emerald-600">${Number(d.active_cash_in_hand).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    {d.active_cash_in_hand > 0 && (
                      <button
                        type="button"
                        onClick={() => setSettleModalDriver(d)}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs"
                      >
                        Settle COD
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const next = d.current_status === 'AVAILABLE' ? 'OFFLINE' : 'AVAILABLE';
                        updateDriverStatus(d.id, next).then(() => loadAllData());
                      }}
                      className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
                    >
                      Toggle {d.current_status === 'AVAILABLE' ? 'Offline' : 'Online'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 6: ZONES & FEES ================= */}
        {activeTab === 'ZONES' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-gray-200/80 shadow-2xs">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Delivery Zones & Distance Pricing</h3>
                <p className="text-xs text-gray-500">Configure base fees, free delivery order thresholds & estimated times</p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewZoneOpen(true)}
                className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Zone</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {zones.map((z) => (
                <div key={z.id} className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-bold">
                        {z.code}
                      </span>
                      <h4 className="font-bold text-sm text-gray-900 mt-1">{z.name}</h4>
                    </div>
                    <span className="text-lg font-black font-mono text-emerald-600">
                      ${Number(z.base_delivery_fee).toFixed(2)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500">{z.area_description || 'No description'}</p>

                  <div className="p-3 bg-gray-50 rounded-2xl text-xs space-y-1 text-gray-600">
                    <div className="flex justify-between">
                      <span>Per KM Fee:</span>
                      <span className="font-mono font-bold">${Number(z.per_km_fee).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Free Delivery Over:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {z.free_delivery_threshold ? `$${Number(z.free_delivery_threshold).toFixed(2)}` : 'No Free Threshold'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Est. Duration:</span>
                      <span className="font-semibold">{z.estimated_delivery_minutes} mins</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 7: PROOF OF DELIVERY ================= */}
        {activeTab === 'POD' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-2xs">
              <h3 className="text-sm font-bold text-gray-900">Proof of Delivery (POD) Records</h3>
              <p className="text-xs text-gray-500">Digital signatures, OTP verifications, and delivery timestamps</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {deliveries.filter((d) => d.proof).length === 0 ? (
                <div className="col-span-3 p-12 text-center text-gray-400 text-xs">
                  No proof of delivery records yet. Mark an in-transit order as delivered to capture signature.
                </div>
              ) : (
                deliveries
                  .filter((d) => d.proof)
                  .map((d) => (
                    <div key={d.id} className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-gray-900">{d.delivery_number}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          VERIFIED
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <div><strong>Receiver:</strong> {d.proof?.receiver_name} ({d.proof?.receiver_relationship})</div>
                        <div className="text-gray-500"><strong>Delivered at:</strong> {d.delivered_at ? new Date(d.delivered_at).toLocaleString() : 'N/A'}</div>
                        {d.proof?.otp_code && (
                          <div className="text-emerald-700"><strong>OTP:</strong> {d.proof.otp_code} (Verified)</div>
                        )}
                      </div>

                      {d.proof?.signature_image_url && (
                        <div className="p-2 bg-gray-50 rounded-2xl border border-gray-200">
                          <span className="text-[10px] text-gray-400 block mb-1">Captured Signature:</span>
                          <img src={d.proof.signature_image_url} alt="Signature" className="h-14 object-contain mx-auto" />
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 8: COD & SETTLEMENT ================= */}
        {activeTab === 'COD' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Drivers with Cash Outstanding */}
            <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Drivers Holding Cash on Delivery (COD)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {driversWithCash.length === 0 ? (
                  <div className="col-span-3 p-8 text-center text-gray-400 text-xs">
                    All collected COD cash is reconciled and settled!
                  </div>
                ) : (
                  driversWithCash.map((dc) => (
                    <div key={dc.id} className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-gray-900 block">{dc.name}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{dc.phone}</span>
                        <span className="text-base font-extrabold text-emerald-700 font-mono block mt-1">
                          ${Number(dc.active_cash_in_hand).toFixed(2)} USD
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettleModalDriver(dc)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition"
                      >
                        Settle Cash
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Settlements History Table */}
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-gray-150">
                <h3 className="text-sm font-bold text-gray-900">COD Settlement History</h3>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="p-3.5">Settlement #</th>
                    <th className="p-3.5">Driver</th>
                    <th className="p-3.5">Settled Amount</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Settled At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {settlements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-400">
                        No settlements recorded yet.
                      </td>
                    </tr>
                  ) : (
                    settlements.map((s) => (
                      <tr key={s.id}>
                        <td className="p-3.5 font-mono font-bold text-gray-900">{s.settlement_number}</td>
                        <td className="p-3.5 font-medium text-gray-800">{s.driver?.name}</td>
                        <td className="p-3.5 font-mono font-bold text-emerald-700">${Number(s.net_amount_settled).toFixed(2)}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {s.settlement_status}
                          </span>
                        </td>
                        <td className="p-3.5 text-gray-500">{new Date(s.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 9: RETURNS & FAILED ================= */}
        {activeTab === 'RETURNS' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-2xs">
              <h3 className="text-sm font-bold text-gray-900">Failed Deliveries & Return to Store</h3>
              <p className="text-xs text-gray-500">Review unreachable customers, rejected parcels & restock returned inventory</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {deliveries.filter((d) => ['FAILED', 'RETURNED_TO_STORE', 'CANCELLED'].includes(d.status)).length === 0 ? (
                <div className="col-span-3 p-12 text-center text-gray-400 text-xs">
                  Zero delivery failures! All shipments are progressing or fulfilled.
                </div>
              ) : (
                deliveries
                  .filter((d) => ['FAILED', 'RETURNED_TO_STORE', 'CANCELLED'].includes(d.status))
                  .map((d) => (
                    <div key={d.id} className="bg-white rounded-3xl p-5 border border-rose-150 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-gray-900">{d.delivery_number}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          {d.failure_reason_code?.replace(/_/g, ' ') || 'FAILED'}
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <div><strong>Customer:</strong> {d.recipient_name} ({d.recipient_phone})</div>
                        <div className="text-gray-500"><strong>Address:</strong> {d.delivery_address}</div>
                        {d.failure_notes && (
                          <p className="p-2 bg-rose-50 rounded-xl text-rose-700 text-[11px] mt-1">
                            {d.failure_notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleAdvanceStatus(d.id, 'PENDING')}
                          className="flex-1 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
                        >
                          Reschedule Dispatch
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdvanceStatus(d.id, 'RETURNED_TO_STORE')}
                          className="flex-1 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition"
                        >
                          Restock Store
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 10: REPORTS ================= */}
        {activeTab === 'REPORTS' && reportsData && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Status Breakdown */}
              <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-gray-900">Deliveries by Status</h3>
                <div className="space-y-2">
                  {reportsData.by_status?.map((st: any) => (
                    <div key={st.status} className="flex justify-between text-xs">
                      <span className="font-semibold text-gray-700">{st.status.replace(/_/g, ' ')}</span>
                      <span className="font-bold text-emerald-600 font-mono">{st.count} orders</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Driver Performance */}
              <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-gray-900">Rider Completion Scorecard</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {reportsData.driver_performance?.map((dp: any) => (
                    <div key={dp.id} className="flex justify-between text-xs">
                      <span className="font-semibold text-gray-700">{dp.name}</span>
                      <span className="font-bold text-gray-900 font-mono">
                        {dp.total_deliveries_completed} done (★ {dp.rating})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Zone Distribution */}
              <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-gray-900">Zone Distribution</h3>
                <div className="space-y-2">
                  {reportsData.zone_breakdown?.map((zb: any) => (
                    <div key={zb.id} className="flex justify-between text-xs">
                      <span className="font-semibold text-gray-700">{zb.name}</span>
                      <span className="font-bold text-blue-600 font-mono">{zb.deliveries_count} delivered</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals & Drawers */}
      <CreateDeliveryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadAllData}
        zones={zones}
        drivers={drivers}
        products={products}
      />

      <AssignDriverModal
        isOpen={Boolean(assignModalDelivery)}
        onClose={() => setAssignModalDelivery(null)}
        onSuccess={loadAllData}
        delivery={assignModalDelivery}
        drivers={drivers}
      />

      <ProofOfDeliveryModal
        isOpen={Boolean(proofModalDelivery)}
        onClose={() => setProofModalDelivery(null)}
        onSuccess={loadAllData}
        delivery={proofModalDelivery}
      />

      <SettleCodModal
        isOpen={Boolean(settleModalDriver)}
        onClose={() => setSettleModalDriver(null)}
        onSuccess={loadAllData}
        driver={settleModalDriver}
      />

      <DeliveryDetailsDrawer
        isOpen={Boolean(detailsDrawerDelivery)}
        onClose={() => setDetailsDrawerDelivery(null)}
        delivery={detailsDrawerDelivery}
        onAdvanceStatus={handleAdvanceStatus}
        onOpenProofModal={(d) => setProofModalDelivery(d)}
      />

      {/* Quick Add Zone Modal */}
      {isNewZoneOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Add Delivery Zone</h3>
            <form onSubmit={handleCreateZone} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Zone Name (e.g. Sen Sok)"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200"
              />
              <input
                type="text"
                required
                placeholder="Zone Code (e.g. ZONE-SENSOK)"
                value={newZoneCode}
                onChange={(e) => setNewZoneCode(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 font-mono uppercase"
              />
              <input
                type="number"
                step="0.25"
                placeholder="Base Delivery Fee ($)"
                value={newZoneFee}
                onChange={(e) => setNewZoneFee(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 font-mono"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setIsNewZoneOpen(false)} className="px-3 py-1 text-xs text-gray-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">
                  Save Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Driver Modal */}
      {isNewDriverOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Add Delivery Driver</h3>
            <form onSubmit={handleCreateDriver} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Driver Name"
                value={newDriverName}
                onChange={(e) => setNewDriverName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200"
              />
              <input
                type="text"
                required
                placeholder="Phone Number"
                value={newDriverPhone}
                onChange={(e) => setNewDriverPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 font-mono"
              />
              <select
                value={newDriverVehicle}
                onChange={(e) => setNewDriverVehicle(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200"
              >
                <option value="MOTORCYCLE">Motorcycle</option>
                <option value="CAR">Car</option>
                <option value="VAN">Delivery Van</option>
              </select>
              <input
                type="text"
                placeholder="License Plate (e.g. PP 1AB-2345)"
                value={newDriverPlate}
                onChange={(e) => setNewDriverPlate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 font-mono"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setIsNewDriverOpen(false)} className="px-3 py-1 text-xs text-gray-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">
                  Save Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
