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
  Route as RouteIcon,
  LifeBuoy,
  Star,
  Bell,
  Navigation,
  CheckSquare,
  Wrench,
  Sliders,
  Send,
  MessageSquare,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Delivery,
  DeliveryZone,
  DeliveryDriver,
  DeliveryVehicle,
  DeliveryRoute,
  DeliveryTimeSlot,
  CustomerDeliveryAddress,
  DeliverySupportTicket,
  DeliveryRatingRecord,
  DeliveryFeeRule,
  DriverCodSettlement,
  DeliveryDashboardMetrics,
  DeliveryStatus,
  DeliveryAnalyticsData,
} from '../../foundation/types/delivery';
import {
  getDeliveryDashboard,
  getDeliveryOrders,
  getDeliveryDrivers,
  getDeliveryZones,
  getCodSettlements,
  getDeliveryReports,
  getDeliveryVehicles,
  getDeliveryRoutes,
  getDeliveryTimeSlots,
  getCustomerAddresses,
  getDeliveryFeeRules,
  getDeliverySupportTickets,
  getDeliveryRatings,
  getDeliveryAnalytics,
  updateDeliveryStatus,
  updateDriverStatus,
  createDeliveryZone,
  createDeliveryDriver,
  createDeliveryVehicle,
  createDeliveryRoute,
  optimizeDeliveryRoute,
  createDeliverySupportTicket,
  resolveDeliverySupportTicket,
  submitDeliveryRating,
  bulkAssignDeliveries,
  rescheduleDelivery,
  processReturnDelivery,
  saveDeliveryFeeRule,
} from '../../data-access/deliveryApi';
import { useApp } from '../../application/context/AppContext';
import { CreateDeliveryModal } from './CreateDeliveryModal';
import { AssignDriverModal } from './AssignDriverModal';
import { ProofOfDeliveryModal } from './ProofOfDeliveryModal';
import { SettleCodModal } from './SettleCodModal';
import { DeliveryDetailsDrawer } from './DeliveryDetailsDrawer';
import { VehicleModal } from './VehicleModal';
import { DeliveryRouteModal } from './DeliveryRouteModal';
import { DeliveryTicketModal } from './DeliveryTicketModal';
import { RateDeliveryModal } from './RateDeliveryModal';
import { BulkAssignModal } from './BulkAssignModal';

export type DeliverySubTab =
  | 'DASHBOARD'
  | 'ORDERS'
  | 'ROUTES'
  | 'FLEET'
  | 'ZONES'
  | 'FINANCE'
  | 'SERVICE'
  | 'ASSIGNMENT'
  | 'TRACKING'
  | 'STAFF'
  | 'VEHICLES'
  | 'FEES'
  | 'TIMESLOTS'
  | 'ADDRESSES'
  | 'COD'
  | 'POD'
  | 'RETURNS'
  | 'NOTIFICATIONS'
  | 'SUPPORT'
  | 'RATINGS'
  | 'REPORTS'
  | 'ANALYTICS';

export const DeliveryManagementView: React.FC = () => {
  const { lang, t, products, deliverySubTab, setDeliverySubTab } = useApp();

  const [activeTab, setActiveTab] = useState<DeliverySubTab>(
    (deliverySubTab as DeliverySubTab) || 'DASHBOARD'
  );
  const [navCategory, setNavCategory] = useState<'ALL' | 'DISPATCH' | 'FLEET' | 'FINANCE' | 'SERVICE'>('ALL');

  useEffect(() => {
    if (deliverySubTab && deliverySubTab !== activeTab) {
      setActiveTab(deliverySubTab as DeliverySubTab);
    }
  }, [deliverySubTab]);

  const handleSelectSubTab = (tab: DeliverySubTab) => {
    setActiveTab(tab);
    setDeliverySubTab(tab);
  };
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Main data states
  const [metrics, setMetrics] = useState<DeliveryDashboardMetrics | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [vehicles, setVehicles] = useState<DeliveryVehicle[]>([]);
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [timeSlots, setTimeSlots] = useState<DeliveryTimeSlot[]>([]);
  const [addresses, setAddresses] = useState<CustomerDeliveryAddress[]>([]);
  const [feeRules, setFeeRules] = useState<DeliveryFeeRule[]>([]);
  const [supportTickets, setSupportTickets] = useState<DeliverySupportTicket[]>([]);
  const [ratings, setRatings] = useState<DeliveryRatingRecord[]>([]);
  const [analytics, setAnalytics] = useState<DeliveryAnalyticsData | null>(null);
  const [settlements, setSettlements] = useState<DriverCodSettlement[]>([]);
  const [driversWithCash, setDriversWithCash] = useState<any[]>([]);
  const [reportsData, setReportsData] = useState<any>(null);
  const [eligibleEmployees, setEligibleEmployees] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [assignModalDelivery, setAssignModalDelivery] = useState<Delivery | null>(null);
  const [proofModalDelivery, setProofModalDelivery] = useState<Delivery | null>(null);
  const [settleModalDriver, setSettleModalDriver] = useState<any | null>(null);
  const [detailsDrawerDelivery, setDetailsDrawerDelivery] = useState<Delivery | null>(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [ticketModalDelivery, setTicketModalDelivery] = useState<Delivery | null>(null);
  const [rateModalDelivery, setRateModalDelivery] = useState<Delivery | null>(null);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);

  // New zone inline modal state
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [zoneName, setZoneName] = useState('');
  const [zoneCode, setZoneCode] = useState('');
  const [zoneBaseFee, setZoneBaseFee] = useState(1.5);
  const [zonePerKmFee, setZonePerKmFee] = useState(0.25);
  const [zoneMinOrder, setZoneMinOrder] = useState(5);
  const [zoneFreeThreshold, setZoneFreeThreshold] = useState(30);
  const [zoneEstMinutes, setZoneEstMinutes] = useState(30);
  const [zoneDesc, setZoneDesc] = useState('');

  // New driver inline modal state
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverVehicle, setNewDriverVehicle] = useState<'MOTORCYCLE' | 'CAR' | 'VAN'>('MOTORCYCLE');
  const [newDriverPlate, setNewDriverPlate] = useState('');
  const [newDriverLicense, setNewDriverLicense] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [
        dashRes,
        ordersRes,
        driversRes,
        zonesRes,
        settleRes,
        reportsRes,
        vehiclesRes,
        routesRes,
        slotsRes,
        addrRes,
        feesRes,
        ticketsRes,
        ratingsRes,
        analyticsRes,
      ] = await Promise.all([
        getDeliveryDashboard().catch(() => null),
        getDeliveryOrders({ per_page: 50 }).catch(() => null),
        getDeliveryDrivers().catch(() => null),
        getDeliveryZones().catch(() => null),
        getCodSettlements().catch(() => null),
        getDeliveryReports().catch(() => null),
        getDeliveryVehicles().catch(() => null),
        getDeliveryRoutes().catch(() => null),
        getDeliveryTimeSlots().catch(() => null),
        getCustomerAddresses().catch(() => null),
        getDeliveryFeeRules().catch(() => null),
        getDeliverySupportTickets().catch(() => null),
        getDeliveryRatings().catch(() => null),
        getDeliveryAnalytics().catch(() => null),
      ]);

      if (dashRes?.success) {
        setMetrics(dashRes.metrics);
      }
      if (ordersRes?.success && ordersRes.data?.data) {
        setDeliveries(ordersRes.data.data);
      }
      if (driversRes?.success) {
        setDrivers(driversRes.drivers || []);
        setEligibleEmployees(driversRes.eligible_employees || []);
      }
      if (zonesRes?.success) {
        setZones(zonesRes.zones || []);
      }
      if (settleRes?.success) {
        setSettlements(settleRes.settlements || []);
        setDriversWithCash(settleRes.drivers_with_cash || []);
      }
      if (reportsRes?.success) {
        setReportsData(reportsRes);
      }
      if (vehiclesRes?.success) {
        setVehicles(vehiclesRes.data || []);
      }
      if (routesRes?.success) {
        setRoutes(routesRes.data || []);
      }
      if (slotsRes?.success) {
        setTimeSlots(slotsRes.data || []);
      }
      if (addrRes?.success) {
        setAddresses(addrRes.data || []);
      }
      if (feesRes?.success) {
        setFeeRules(feesRes.data || []);
      }
      if (ticketsRes?.success) {
        setSupportTickets(ticketsRes.data || []);
      }
      if (ratingsRes?.success) {
        setRatings(ratingsRes.data || []);
      }
      if (analyticsRes?.success) {
        setAnalytics(analyticsRes.data);
      }
    } catch (err) {
      console.error('Failed to load delivery data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleUpdateStatus = async (
    deliveryId: number,
    nextStatus: DeliveryStatus,
    notes?: string
  ) => {
    try {
      await updateDeliveryStatus(deliveryId, nextStatus, notes);
      await loadAllData();
    } catch (err) {
      console.error('Failed to advance delivery status', err);
    }
  };

  const handleToggleDriverStatus = async (driverId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'AVAILABLE' ? 'BREAK' : 'AVAILABLE';
    try {
      await updateDriverStatus(driverId, nextStatus);
      await loadAllData();
    } catch (err) {
      console.error('Failed to toggle rider status', err);
    }
  };

  const handleCreateZoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName || !zoneCode) return;
    try {
      await createDeliveryZone({
        name: zoneName,
        code: zoneCode.toUpperCase(),
        base_delivery_fee: Number(zoneBaseFee),
        per_km_fee: Number(zonePerKmFee),
        min_order_amount: Number(zoneMinOrder),
        free_delivery_threshold: Number(zoneFreeThreshold),
        estimated_delivery_minutes: Number(zoneEstMinutes),
        area_description: zoneDesc,
      });
      setIsZoneModalOpen(false);
      setZoneName('');
      setZoneCode('');
      await loadAllData();
    } catch (err) {
      console.error('Failed to create zone', err);
    }
  };

  const handleCreateDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverName || !newDriverPhone) return;
    try {
      await createDeliveryDriver({
        name: newDriverName,
        phone: newDriverPhone,
        vehicle_type: newDriverVehicle,
        vehicle_plate_number: newDriverPlate,
        driver_license_number: newDriverLicense,
        employee_id: selectedEmployeeId ? Number(selectedEmployeeId) : undefined,
      });
      setIsDriverModalOpen(false);
      setNewDriverName('');
      setNewDriverPhone('');
      setNewDriverPlate('');
      setNewDriverLicense('');
      await loadAllData();
    } catch (err) {
      console.error('Failed to create driver', err);
    }
  };

  // Filtered deliveries for Orders Tab
  const filteredDeliveries = deliveries.filter((del) => {
    const matchesStatus =
      orderStatusFilter === 'ALL' ||
      (orderStatusFilter === 'UNASSIGNED' && !del.driver_id && del.status === 'PENDING') ||
      del.status === orderStatusFilter;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      del.delivery_number.toLowerCase().includes(q) ||
      del.recipient_name.toLowerCase().includes(q) ||
      del.recipient_phone.toLowerCase().includes(q) ||
      del.delivery_address.toLowerCase().includes(q) ||
      (del.driver?.name && del.driver.name.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case 'PENDING':
      case 'REQUESTED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ASSIGNED':
      case 'ACCEPTED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PREPARING':
      case 'READY_FOR_PICKUP':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'PICKED_UP':
      case 'IN_TRANSIT':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse';
      case 'ARRIVED':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'DELIVERED':
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'FAILED':
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'RETURNED_TO_STORE':
      case 'RESCHEDULED':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

    // Consolidated Inner Tab States
  const [ordersInnerTab, setOrdersInnerTab] = useState<'pipeline' | 'dispatch' | 'tracking'>('pipeline');
  const [routesInnerTab, setRoutesInnerTab] = useState<'routes' | 'timeslots'>('routes');
  const [fleetInnerTab, setFleetInnerTab] = useState<'drivers' | 'vehicles'>('drivers');
  const [zonesInnerTab, setZonesInnerTab] = useState<'zones' | 'fees' | 'addresses'>('zones');
  const [financeInnerTab, setFinanceInnerTab] = useState<'cod' | 'pod' | 'returns'>('cod');
  const [serviceInnerTab, setServiceInnerTab] = useState<'tickets' | 'ratings' | 'reports'>('tickets');

  useEffect(() => {
    if (activeTab === 'ORDERS') setOrdersInnerTab('pipeline');
    else if (activeTab === 'ASSIGNMENT') setOrdersInnerTab('dispatch');
    else if (activeTab === 'TRACKING') setOrdersInnerTab('tracking');
    else if (activeTab === 'ROUTES') setRoutesInnerTab('routes');
    else if (activeTab === 'TIMESLOTS') setRoutesInnerTab('timeslots');
    else if (activeTab === 'STAFF') setFleetInnerTab('drivers');
    else if (activeTab === 'VEHICLES') setFleetInnerTab('vehicles');
    else if (activeTab === 'ZONES') setZonesInnerTab('zones');
    else if (activeTab === 'FEES') setZonesInnerTab('fees');
    else if (activeTab === 'ADDRESSES') setZonesInnerTab('addresses');
    else if (activeTab === 'COD') setFinanceInnerTab('cod');
    else if (activeTab === 'POD') setFinanceInnerTab('pod');
    else if (activeTab === 'RETURNS') setFinanceInnerTab('returns');
    else if (activeTab === 'SUPPORT') setServiceInnerTab('tickets');
    else if (activeTab === 'RATINGS') setServiceInnerTab('ratings');
    else if (activeTab === 'REPORTS' || activeTab === 'ANALYTICS') setServiceInnerTab('reports');
  }, [activeTab]);

  const moduleTitles: Record<string, string> = {
    DASHBOARD: 'Delivery Dashboard',
    ORDERS: 'Orders & Dispatch',
    ASSIGNMENT: 'Orders & Dispatch',
    TRACKING: 'Orders & Dispatch',
    ROUTES: 'Routes & Scheduling',
    TIMESLOTS: 'Routes & Scheduling',
    FLEET: 'Fleet & Drivers',
    STAFF: 'Fleet & Drivers',
    VEHICLES: 'Fleet & Drivers',
    ZONES: 'Zones & Pricing',
    FEES: 'Zones & Pricing',
    ADDRESSES: 'Zones & Pricing',
    FINANCE: 'COD & Proof of Delivery',
    COD: 'COD & Proof of Delivery',
    POD: 'COD & Proof of Delivery',
    RETURNS: 'COD & Proof of Delivery',
    SERVICE: 'Support & Reports',
    SUPPORT: 'Support & Reports',
    RATINGS: 'Support & Reports',
    REPORTS: 'Support & Reports',
    ANALYTICS: 'Support & Reports',
    NOTIFICATIONS: 'Support & Reports',
  };

  const moduleTitlesKh: Record<string, string> = {
    DASHBOARD: 'ផ្ទាំងគ្រប់គ្រងដឹកជញ្ជូន',
    ORDERS: 'ការបញ្ជាទិញ & បែងចែកអ្នកដឹក',
    ASSIGNMENT: 'ការបញ្ជាទិញ & បែងចែកអ្នកដឹក',
    TRACKING: 'ការបញ្ជាទិញ & បែងចែកអ្នកដឹក',
    ROUTES: 'ផ្លូវដឹក & ម៉ោងកំណត់',
    TIMESLOTS: 'ផ្លូវដឹក & ម៉ោងកំណត់',
    FLEET: 'អ្នកដឹក & យានជំនិះ',
    STAFF: 'អ្នកដឹក & យានជំនិះ',
    VEHICLES: 'អ្នកដឹក & យានជំនិះ',
    ZONES: 'តំបន់ដឹកជញ្ជូន & ថ្លៃសេវា',
    FEES: 'តំបន់ដឹកជញ្ជូន & ថ្លៃសេវា',
    ADDRESSES: 'តំបន់ដឹកជញ្ជូន & ថ្លៃសេវា',
    FINANCE: 'ទូទាត់ COD & ភស្តុតាង (POD)',
    COD: 'ទូទាត់ COD & ភស្តុតាង (POD)',
    POD: 'ទូទាត់ COD & ភស្តុតាង (POD)',
    RETURNS: 'ទូទាត់ COD & ភស្តុតាង (POD)',
    SERVICE: 'សំបុត្រគាំទ្រ & របាយការណ៍',
    SUPPORT: 'សំបុត្រគាំទ្រ & របាយការណ៍',
    RATINGS: 'សំបុត្រគាំទ្រ & របាយការណ៍',
    REPORTS: 'សំបុត្រគាំទ្រ & របាយការណ៍',
    ANALYTICS: 'សំបុត្រគាំទ្រ & របាយការណ៍',
    NOTIFICATIONS: 'សំបុត្រគាំទ្រ & របាយការណ៍',
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ========================================================= */}
      {/* 1. HEADER & ACTION BAR */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{lang === 'kh' ? 'ការដឹកជញ្ជូន & ភស្តុភារ' : 'Delivery & Logistics'}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {lang === 'kh' ? (moduleTitlesKh[activeTab] || 'មជ្ឈមណ្ឌលប្រតិបត្តិការ') : (moduleTitles[activeTab] || 'Operational Hub')}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {lang === 'kh'
                ? 'ការបែងចែកផ្លូវដឹកច្រើនកន្លែង យានជំនិះ ប្រព័ន្ធ GPS ផ្ទាល់ ហត្ថលេខាឌីជីថល (POD) ការទូទាត់ COD និងសំបុត្រគាំទ្រ'
                : 'Multi-stop route dispatch, fleet vehicles, real-time GPS tracking, POD canvas, COD settlement & customer tickets'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0 flex-wrap gap-y-2">
          <button
            onClick={loadAllData}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition cursor-pointer"
            title={lang === 'kh' ? 'ផ្ទុកទិន្នន័យឡើងវិញ' : 'Refresh All Modules'}
          >
            <RefreshCw className={'w-4 h-4 ' + (isLoading ? 'animate-spin text-emerald-600' : '')} />
          </button>

          {selectedOrderIds.length > 0 && (
            <button
              onClick={() => setIsBulkAssignModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
            >
              <CheckSquare className="w-4 h-4" />
              <span>{lang === 'kh' ? `បែងចែករួម (${selectedOrderIds.length})` : `Bulk Dispatch (${selectedOrderIds.length})`}</span>
            </button>
          )}

          <button
            onClick={() => setIsRouteModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
          >
            <RouteIcon className="w-4 h-4" />
            <span>{lang === 'kh' ? 'រៀបចំផ្លូវ' : 'Plan Route'}</span>
          </button>

          <button
            onClick={() => setIsVehicleModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Truck className="w-4 h-4" />
            <span>{lang === 'kh' ? 'បន្ថែមយានជំនិះ' : 'Add Vehicle'}</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-emerald-900/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'kh' ? 'បង្កើតការដឹកជញ្ជូន' : 'Create Delivery'}</span>
          </button>
        </div>
      </div>


      {/* ========================================================= */}
      {/* 3. TAB 1: DELIVERY DASHBOARD */}
      {/* ========================================================= */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* Operational Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Total Deliveries', value: metrics?.total_deliveries || deliveries.length, color: 'text-gray-900', bg: 'bg-white' },
              { label: 'Pending Assignment', value: metrics?.pending || deliveries.filter(d => d.status === 'PENDING').length, color: 'text-amber-600', bg: 'bg-amber-50/50' },
              { label: 'In Transit', value: metrics?.in_transit || deliveries.filter(d => d.status === 'IN_TRANSIT').length, color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
              { label: 'Delivered Today', value: metrics?.today_delivered || deliveries.filter(d => d.status === 'DELIVERED').length, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
              { label: 'Failed / Rescheduled', value: metrics?.failed || deliveries.filter(d => d.status === 'FAILED').length, color: 'text-rose-600', bg: 'bg-rose-50/50' },
              { label: 'Active Riders', value: metrics?.active_drivers || drivers.filter(d => d.current_status === 'AVAILABLE').length, color: 'text-teal-600', bg: 'bg-teal-50/50' },
            ].map((kpi, idx) => (
              <div key={idx} className={'p-4 rounded-2xl border border-gray-100 shadow-xs ' + kpi.bg}>
                <span className="text-[11px] font-semibold text-gray-500 uppercase block">{kpi.label}</span>
                <span className={'text-2xl font-black mt-1 block ' + kpi.color}>{kpi.value}</span>
              </div>
            ))}
          </div>

          {/* Financial Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-3xl shadow-md">
              <span className="text-xs uppercase tracking-wider font-semibold text-white/80 block">{lang === 'kh' ? 'ប្រាក់ COD ប្រមូលបាន (ក្នុងដៃ)' : 'COD Collected (In Hand)'}</span>
              <span className="text-3xl font-black mt-1 block">${(metrics?.cod_collected || 0).toFixed(2)}</span>
              <p className="text-xs text-white/70 mt-2 flex items-center justify-between">
                <span>Pending Handover: ${(metrics?.cod_pending || 0).toFixed(2)}</span>
                <button onClick={() => setActiveTab('COD')} className="underline hover:text-white font-bold cursor-pointer">Settle Cash &rarr;</button>
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5 rounded-3xl shadow-md">
              <span className="text-xs uppercase tracking-wider font-semibold text-white/80 block">{lang === 'kh' ? 'ចំណូលថ្លៃសេវាដឹកជញ្ជូន' : 'Delivery Fees Revenue'}</span>
              <span className="text-3xl font-black mt-1 block">${(metrics?.total_delivery_fees || 0).toFixed(2)}</span>
              <p className="text-xs text-white/70 mt-2 flex items-center justify-between">
                <span>Avg Fee / Order: ${((metrics?.total_delivery_fees || 0) / Math.max(1, deliveries.length)).toFixed(2)}</span>
                <span className="font-bold">100% Retained</span>
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-violet-700 text-white p-5 rounded-3xl shadow-md">
              <span className="text-xs uppercase tracking-wider font-semibold text-white/80 block">{lang === 'kh' ? 'អត្រាជោគជ័យនៃការដឹកជញ្ជូន' : 'Fulfillment Success Rate'}</span>
              <span className="text-3xl font-black mt-1 block">{(metrics?.success_rate || 95)}%</span>
              <p className="text-xs text-white/70 mt-2 flex items-center justify-between">
                <span>Avg Duration: ~28 Mins</span>
                <span className="font-bold">⭐ 4.9 Driver Score</span>
              </p>
            </div>
          </div>

          {/* Active Fleet & Recent Deliveries Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Drivers Status */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'kh' ? 'អ្នកដឹកសកម្ម & ស្ថានភាពយានជំនិះ' : 'Active Riders & Fleet Status'}</span>
                </h3>
                <button onClick={() => setActiveTab('STAFF')} className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer">View All</button>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {drivers.map((driver) => (
                  <div key={driver.id} className="p-3 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <div className={'w-2.5 h-2.5 rounded-full ' + (driver.current_status === 'AVAILABLE' ? 'bg-emerald-500 animate-pulse' : driver.current_status === 'ON_DELIVERY' ? 'bg-indigo-500' : 'bg-gray-300')} />
                      <div>
                        <span className="font-bold text-gray-900 block">{driver.name}</span>
                        <span className="text-gray-500 text-[11px]">{driver.phone} &bull; {driver.vehicle_type}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (driver.current_status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700')}>
                        {driver.current_status}
                      </span>
                      <span className="text-[11px] font-mono text-gray-600 block mt-0.5">${Number(driver.active_cash_in_hand).toFixed(2)} cash</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Dispatch Stream */}
            <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'kh' ? 'លំហូរដឹកជញ្ជូនថ្មីៗ' : 'Recent Delivery Pipeline'}</span>
                </h3>
                <button onClick={() => setActiveTab('ORDERS')} className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer">View Pipeline &rarr;</button>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {deliveries.slice(0, 5).map((del) => (
                  <div
                    key={del.id}
                    onClick={() => setDetailsDrawerDelivery(del)}
                    className="p-3.5 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center font-mono font-bold text-[10px] text-gray-700">
                        {del.priority === 'URGENT' ? '⚡' : '📦'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-gray-900">{del.delivery_number}</span>
                          <span className={'px-2 py-0.2 rounded-full text-[10px] font-bold border ' + getStatusBadge(del.status)}>
                            {del.status}
                          </span>
                        </div>
                        <p className="text-gray-500 text-[11px] truncate max-w-sm mt-0.5">{del.recipient_name} &bull; {del.delivery_address}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-gray-900 block">${Number(del.total_amount).toFixed(2)}</span>
                      <span className="text-[11px] text-emerald-600 font-semibold">{del.driver?.name || 'Unassigned'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* 4. ORDERS & DISPATCH */}
      {(activeTab === 'ORDERS' || activeTab === 'ASSIGNMENT' || activeTab === 'TRACKING') && (
        <div className="space-y-6">
          <div className="flex items-center space-x-2 border-b border-gray-200 pb-3 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setOrdersInnerTab('pipeline')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                ordersInnerTab === 'pipeline'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{lang === 'kh' ? `ការបញ្ជាទិញ & ដំណើរការ (${deliveries.length})` : `Orders & Pipeline (${deliveries.length})`}</span>
            </button>
            <button
              onClick={() => setOrdersInnerTab('dispatch')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                ordersInnerTab === 'dispatch'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>{lang === 'kh' ? 'ក្ដារបែងចែកការងារ' : 'Dispatch Board'}</span>
            </button>
            <button
              onClick={() => setOrdersInnerTab('tracking')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                ordersInnerTab === 'tracking'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Navigation className="w-4 h-4" />
              <span>{lang === 'kh' ? 'ប្រព័ន្ធ GPS ផ្ទាល់' : 'Live GPS Tracking'}</span>
            </button>
          </div>

          {ordersInnerTab === 'pipeline' && (
        <div className="space-y-4">
          {/* Status Quick Filters */}
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
              {[
                { id: 'ALL', label: 'All Orders' },
                { id: 'PENDING', label: 'Pending' },
                { id: 'ASSIGNED', label: 'Assigned' },
                { id: 'PICKED_UP', label: 'Picked Up' },
                { id: 'IN_TRANSIT', label: 'In Transit' },
                { id: 'ARRIVED', label: 'Arrived' },
                { id: 'DELIVERED', label: 'Delivered' },
                { id: 'FAILED', label: 'Failed / Rescheduled' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setOrderStatusFilter(filter.id)}
                  className={'px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ' + (
                    orderStatusFilter === filter.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search orders, phone, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
              />
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase border-b border-gray-100">
                  <tr>
                    <th className="p-3.5 pl-5 w-8">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.length > 0 && selectedOrderIds.length === filteredDeliveries.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrderIds(filteredDeliveries.map(d => d.id));
                          } else {
                            setSelectedOrderIds([]);
                          }
                        }}
                        className="rounded-md text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                    <th className="p-3.5">{lang === 'kh' ? 'ការបញ្ជាទិញ / លេខតាមដាន' : 'Order / Tracking'}</th>
                    <th className="p-3.5">Recipient & Destination</th>
                    <th className="p-3.5">Zone / Slot</th>
                    <th className="p-3.5">{lang === 'kh' ? 'អ្នកដឹកជញ្ជូនដែលបានចាត់តាំង' : 'Assigned Rider'}</th>
                    <th className="p-3.5">{lang === 'kh' ? 'ការទូទាត់ & COD' : 'Payment & COD'}</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredDeliveries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400">
                        No delivery orders found matching filter.
                      </td>
                    </tr>
                  ) : (
                    filteredDeliveries.map((del) => {
                      const isSelected = selectedOrderIds.includes(del.id);
                      return (
                        <tr key={del.id} className={'hover:bg-gray-50/60 transition ' + (isSelected ? 'bg-emerald-50/30' : '')}>
                          <td className="p-3.5 pl-5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedOrderIds(prev =>
                                  prev.includes(del.id) ? prev.filter(i => i !== del.id) : [...prev, del.id]
                                );
                              }}
                              className="rounded-md text-emerald-600 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="p-3.5">
                            <span className="font-mono font-bold text-gray-900 block">{del.delivery_number}</span>
                            <span className="text-[11px] text-gray-400">{del.items?.length || 1} package items</span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-gray-900 block">{del.recipient_name}</span>
                            <span className="text-gray-500 text-[11px] flex items-center space-x-1">
                              <Phone className="w-3 h-3" />
                              <span>{del.recipient_phone}</span>
                            </span>
                            <span className="text-gray-400 text-[10px] block truncate max-w-xs">{del.delivery_address}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-medium text-gray-900 block">{del.zone?.name || 'Downtown'}</span>
                            <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded-md font-semibold">
                              {del.time_slot?.label || 'ASAP Delivery'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {del.driver ? (
                              <div>
                                <span className="font-bold text-gray-900 block">{del.driver.name}</span>
                                <span className="text-[11px] text-gray-500">{del.driver.vehicle_type} &bull; {del.driver.phone}</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => setAssignModalDelivery(del)}
                                className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-bold hover:bg-amber-100 cursor-pointer"
                              >
                                + Assign Rider
                              </button>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-gray-900 block">${Number(del.total_amount).toFixed(2)}</span>
                            <span className="text-[10px] font-bold text-indigo-700 uppercase">{del.payment_type}</span>
                            {del.payment_type === 'COD' && (
                              <span className="text-[10px] text-gray-500 block">Due: ${Number(del.cod_amount_due).toFixed(2)}</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span className={'px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ' + getStatusBadge(del.status)}>
                              {del.status}
                            </span>
                          </td>
                          <td className="p-3.5 pr-5 text-right space-x-1.5">
                            <button
                              onClick={() => setDetailsDrawerDelivery(del)}
                              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {del.status === 'IN_TRANSIT' && (
                              <button
                                onClick={() => setProofModalDelivery(del)}
                                className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-500 transition cursor-pointer"
                              >
                                Complete POD
                              </button>
                            )}

                            {del.status === 'PENDING' && (
                              <button
                                onClick={() => handleUpdateStatus(del.id, 'PREPARING')}
                                className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold hover:bg-blue-100 cursor-pointer"
                              >
                                Prepare
                              </button>
                            )}

                            <button
                              onClick={() => setTicketModalDelivery(del)}
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Report Issue / Support Ticket"
                            >
                              <LifeBuoy className="w-3.5 h-3.5" />
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
        </div>
          )}

          {ordersInnerTab === 'dispatch' && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{lang === 'kh' ? 'ក្ដារគ្រប់គ្រងការបញ្ជូនសកម្ម' : 'Active Dispatch Board'}</h4>
                  <p className="text-xs text-gray-500">Assign unassigned pending orders to active drivers</p>
                </div>
                {selectedOrderIds.length > 0 && (
                  <button
                    onClick={() => setIsBulkAssignModalOpen(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition cursor-pointer"
                  >
                    Bulk Dispatch ({selectedOrderIds.length})
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {drivers.map((d) => (
                  <div key={d.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{d.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {d.current_status}
                      </span>
                    </div>
                    <p className="text-gray-500">{d.phone} &bull; {d.vehicle_type}</p>
                    <p className="text-gray-400 text-[11px]">Completed: {d.total_deliveries_completed} &bull; ⭐ {d.rating}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ordersInnerTab === 'tracking' && (
            <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 text-sm flex items-center space-x-2">
                  <Navigation className="w-4 h-4 animate-spin" />
                  <span>{lang === 'kh' ? 'ការតាមដាន GPS ផ្ទាល់ & ដំណាក់កាលដឹក' : 'Real-Time GPS Tracking & Milestone Pipeline'}</span>
                </span>
                <span className="text-slate-400 font-mono">Simulated Coordinates Active</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2">
                  <span className="font-bold text-slate-200">Active Trip: DEL-20260908-0101</span>
                  <p className="text-slate-400">Driver: Vichea Roth (Yamaha QBIX 125)</p>
                  <p className="text-slate-400">Destination: #45B, St 315, Sangkat Boeung Kak 1, Khan Toul Kork</p>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mt-2">
                    <div className="bg-emerald-500 h-full rounded-full w-3/4 animate-pulse" />
                  </div>
                  <span className="text-emerald-400 font-bold block text-[11px]">ETA: ~12 Mins Remaining (Distance: 2.8 KM)</span>
                </div>
                <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2">
                  <span className="font-bold text-slate-200">Live GPS Radar</span>
                  <div className="w-full h-28 bg-slate-950 rounded-xl border border-slate-700 flex items-center justify-center text-slate-500">
                    [Radar map simulation: Phnom Penh Center lat: 11.5682, lng: 104.8911]
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. ROUTES & SCHEDULING */}
      {(activeTab === 'ROUTES' || activeTab === 'TIMESLOTS') && (
        <div className="space-y-6">
          <div className="flex items-center space-x-2 border-b border-gray-200 pb-3 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setRoutesInnerTab('routes')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                routesInnerTab === 'routes'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <RouteIcon className="w-4 h-4" />
              <span>{lang === 'kh' ? `ផ្លូវដឹកជញ្ជូន (${routes.length})` : `Multi-Stop Routes (${routes.length})`}</span>
            </button>
            <button
              onClick={() => setRoutesInnerTab('timeslots')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                routesInnerTab === 'timeslots'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{lang === 'kh' ? `ម៉ោងកំណត់ & វេន (${timeSlots.length})` : `Time Windows & Slots (${timeSlots.length})`}</span>
            </button>
          </div>

          {routesInnerTab === 'routes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{lang === 'kh' ? 'ផ្លូវដឹកជញ្ជូនច្រើនចំណត & ការបង្កើនប្រសិទ្ធភាព' : 'Multi-Stop Delivery Routes & Optimization'}</h3>
              <p className="text-xs text-gray-500">Group multiple deliveries into planned sequence loops</p>
            </div>
            <button
              onClick={() => setIsRouteModalOpen(true)}
              className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-500 transition cursor-pointer flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Route</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routes.map((route) => (
              <div key={route.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg text-xs">
                      {route.route_code}
                    </span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                      {route.status}
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      await optimizeDeliveryRoute(route.id);
                      await loadAllData();
                    }}
                    className="text-xs font-bold text-teal-600 hover:underline cursor-pointer flex items-center space-x-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{lang === 'kh' ? 'បង្កើនប្រសិទ្ធភាពចំណត' : 'Optimize Stops'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs bg-gray-50 p-3 rounded-2xl">
                  <div>
                    <span className="text-gray-400 text-[10px] block">Rider</span>
                    <span className="font-bold text-gray-800">{route.driver?.name || 'Unassigned'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] block">{lang === 'kh' ? 'ចម្ងាយប៉ាន់ស្មាន' : 'Est Distance'}</span>
                    <span className="font-bold text-gray-800">{route.total_distance_km} km</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] block">{lang === 'kh' ? 'ពេលប៉ាន់ស្មាន' : 'Est Time'}</span>
                    <span className="font-bold text-gray-800">{route.estimated_duration_minutes} mins</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-gray-500 uppercase">Stop Sequence:</span>
                  {route.stops?.map((stop) => (
                    <div key={stop.id} className="text-xs flex items-center justify-between p-2 rounded-xl border border-gray-100 bg-white">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold">
                          {stop.sequence_order}
                        </span>
                        <span className="font-mono font-bold text-gray-700">{stop.delivery?.delivery_number}</span>
                        <span className="text-gray-500 text-[11px] truncate max-w-[150px]">{stop.delivery?.recipient_name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500">{stop.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
          )}

          {routesInnerTab === 'timeslots' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {timeSlots.map(slot => (
                <div key={slot.id} className="p-4 rounded-2xl border border-gray-100 bg-white shadow-xs text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{slot.label}</span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">ACTIVE</span>
                  </div>
                  <p className="text-gray-500 text-[11px]">Time Window: {slot.start_time} - {slot.end_time}</p>
                  <p className="text-teal-700 font-semibold text-[11px]">Max Capacity: {slot.max_capacity} orders</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. FLEET & DRIVERS */}
      {(activeTab === 'FLEET' || activeTab === 'STAFF' || activeTab === 'VEHICLES') && (
        <div className="space-y-6">
          <div className="flex items-center space-x-2 border-b border-gray-200 pb-3 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setFleetInnerTab('drivers')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                fleetInnerTab === 'drivers'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>{lang === 'kh' ? `បុគ្គលិកដឹកជញ្ជូន (${drivers.length})` : `Delivery Staff & Drivers (${drivers.length})`}</span>
            </button>
            <button
              onClick={() => setFleetInnerTab('vehicles')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                fleetInnerTab === 'vehicles'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{lang === 'kh' ? `យានជំនិះ (${vehicles.length})` : `Fleet Vehicles (${vehicles.length})`}</span>
            </button>
          </div>

          {fleetInnerTab === 'drivers' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setIsDriverModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 cursor-pointer"
                >
                  + Add Driver
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {drivers.map(d => (
                  <div key={d.id} className="p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2 text-xs bg-white">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 text-sm">{d.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {d.current_status}
                      </span>
                    </div>
                    <p className="text-gray-500">{d.phone} &bull; {d.vehicle_type}</p>
                    <p className="text-gray-400 text-[11px]">Completed: {d.total_deliveries_completed} &bull; ⭐ {d.rating}</p>
                    <p className="font-bold text-emerald-600 text-xs">Cash in Hand: ${Number(d.active_cash_in_hand).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {fleetInnerTab === 'vehicles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{lang === 'kh' ? 'យានជំនិះ & ការថែទាំ' : 'Fleet Vehicles & Maintenance'}</h3>
              <p className="text-xs text-gray-500">Motorcycles, cargo vans, service histories & oil changes</p>
            </div>
            <button
              onClick={() => setIsVehicleModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-500 transition cursor-pointer flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Register Vehicle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vehicles.map((v) => (
              <div key={v.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 text-xs block">{v.brand} {v.model}</span>
                      <span className="font-mono text-[11px] text-gray-500">{v.plate_number}</span>
                    </div>
                  </div>
                  <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (v.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
                    {v.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-2xl">
                  <div>
                    <span className="text-gray-400 text-[10px] block">{lang === 'kh' ? 'អ្នកដឹកជញ្ជូន' : 'Assigned Rider'}</span>
                    <span className="font-bold text-gray-800">{v.assigned_driver?.name || 'Pool Vehicle'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] block">{lang === 'kh' ? 'គីឡូម៉ែត្រ' : 'Mileage'}</span>
                    <span className="font-bold text-gray-800">{v.mileage_km} KM</span>
                  </div>
                </div>

                {v.maintenance_logs && v.maintenance_logs.length > 0 && (
                  <div className="text-xs bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 space-y-1">
                    <span className="text-[10px] font-bold text-amber-900 uppercase">Recent Service:</span>
                    <p className="text-[11px] text-amber-800">{v.maintenance_logs[0].service_type} &bull; ${v.maintenance_logs[0].cost}</p>
                    <p className="text-[10px] text-gray-500">{v.maintenance_logs[0].notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
          )}
        </div>
      )}

      {/* 7. ZONES & PRICING */}
      {(activeTab === 'ZONES' || activeTab === 'FEES' || activeTab === 'ADDRESSES') && (
        <div className="space-y-6">
          <div className="flex items-center space-x-2 border-b border-gray-200 pb-3 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setZonesInnerTab('zones')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                zonesInnerTab === 'zones'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>{lang === 'kh' ? `តំបន់ដឹកជញ្ជូន (${zones.length})` : `Delivery Zones (${zones.length})`}</span>
            </button>
            <button
              onClick={() => setZonesInnerTab('fees')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                zonesInnerTab === 'fees'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>{lang === 'kh' ? `ច្បាប់គិតថ្លៃសេវា (${feeRules.length})` : `Fee Rules & Thresholds (${feeRules.length})`}</span>
            </button>
            <button
              onClick={() => setZonesInnerTab('addresses')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                zonesInnerTab === 'addresses'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>{lang === 'kh' ? `អាសយដ្ឋានអតិថិជន (${addresses.length})` : `Customer Addresses (${addresses.length})`}</span>
            </button>
          </div>

          {zonesInnerTab === 'zones' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setIsZoneModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 cursor-pointer"
                >
                  {lang === 'kh' ? '+ បន្ថែមតំបន់ដឹកជញ្ជូន' : '+ Add Delivery Zone'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {zones.map(z => (
                  <div key={z.id} className="p-4 rounded-2xl border border-gray-100 shadow-xs space-y-1.5 text-xs bg-white">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 text-sm">{z.name}</span>
                      <span className="font-mono text-[10px] bg-gray-100 px-2 py-0.5 rounded-md font-bold">{z.code}</span>
                    </div>
                    <p className="text-gray-500 text-[11px]">{z.area_description || 'General City Zone'}</p>
                    <div className="flex justify-between text-gray-700 pt-2 border-t border-gray-50">
                      <span>Base Fee: <b>${z.base_delivery_fee}</b></span>
                      <span>Free Over: <b>${z.free_delivery_threshold || 30}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {zonesInnerTab === 'fees' && (
            <div className="space-y-3">
              {feeRules.map(rule => (
                <div key={rule.id} className="p-4 rounded-2xl border border-gray-100 bg-white flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-gray-900 block">{rule.name}</span>
                    <span className="text-gray-500 text-[11px]">Tier: ${rule.min_order_value} - ${rule.max_order_value}</span>
                  </div>
                  <span className="text-sm font-black text-emerald-600">
                    {rule.is_free ? 'FREE' : `$${rule.fee_amount}`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {zonesInnerTab === 'addresses' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {addresses.map(a => (
                <div key={a.id} className="p-4 rounded-2xl border border-gray-100 bg-white space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{a.label} &bull; {a.recipient_name}</span>
                    {a.is_default && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Default</span>}
                  </div>
                  <p className="text-gray-600">{a.full_address}</p>
                  <p className="text-gray-400 text-[10px]">Instructions: {a.delivery_instructions || 'None'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 8. COD & PROOF OF DELIVERY */}
      {(activeTab === 'FINANCE' || activeTab === 'COD' || activeTab === 'POD' || activeTab === 'RETURNS') && (
        <div className="space-y-6">
          <div className="flex items-center space-x-2 border-b border-gray-200 pb-3 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setFinanceInnerTab('cod')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                financeInnerTab === 'cod'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>{lang === 'kh' ? 'ការទូទាត់ COD' : 'COD Settlements'}</span>
            </button>
            <button
              onClick={() => setFinanceInnerTab('pod')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                financeInnerTab === 'pod'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{lang === 'kh' ? 'ភស្តុតាងដឹកជញ្ជូន (POD)' : 'Proof of Delivery (POD)'}</span>
            </button>
            <button
              onClick={() => setFinanceInnerTab('returns')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                financeInnerTab === 'returns'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>{lang === 'kh' ? 'ទំនិញប្រគល់មកវិញ' : 'Returned Orders'}</span>
            </button>
          </div>

          {financeInnerTab === 'cod' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {driversWithCash.map(d => (
                  <div key={d.id} className="p-4 rounded-2xl border border-gray-100 bg-amber-50/40 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-gray-900 block">{d.name}</span>
                      <span className="text-gray-500">{d.phone} &bull; {d.vehicle_type}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-amber-900 block">${Number(d.active_cash_in_hand).toFixed(2)}</span>
                      <button
                        onClick={() => setSettleModalDriver(d)}
                        className="mt-1 px-3 py-1 bg-amber-600 text-white rounded-lg text-[10px] font-bold hover:bg-amber-500 cursor-pointer"
                      >
                        Settle Cash
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {financeInnerTab === 'pod' && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Proof of Delivery & Digital Signatures</h4>
                  <p className="text-xs text-gray-500">Verified digital signatures and recipient OTP photo records</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {deliveries.filter(d => d.proof).map(d => (
                  <div key={d.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-2">
                    <span className="font-bold text-gray-900 block">{d.delivery_number}</span>
                    <p className="text-gray-500">{d.recipient_name} &bull; {d.recipient_phone}</p>
                    <div className="p-2 bg-emerald-50 rounded-xl text-emerald-800 text-[11px] font-medium">
                      Signed: {d.proof?.receiver_name || 'Customer Signed'}
                    </div>
                  </div>
                ))}
                {deliveries.filter(d => d.proof).length === 0 && (
                  <div className="col-span-3 text-center py-8 text-gray-400">
                    No completed digital signature proofs yet today.
                  </div>
                )}
              </div>
            </div>
          )}

          {financeInnerTab === 'returns' && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Returns & Restock Processing</h4>
                  <p className="text-xs text-gray-500">Returned parcels ready for inspection and inventory re-entry</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {deliveries.filter(d => d.status === 'RETURNED_TO_STORE' || d.status === 'FAILED' || d.status === 'CANCELLED').map(d => (
                  <div key={d.id} className="p-4 rounded-2xl border border-rose-100 bg-rose-50/30 space-y-2">
                    <span className="font-bold text-gray-900 block">{d.delivery_number}</span>
                    <p className="text-gray-500">{d.recipient_name} &bull; {d.delivery_address}</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                      {d.status}
                    </span>
                  </div>
                ))}
                {deliveries.filter(d => d.status === 'RETURNED_TO_STORE' || d.status === 'FAILED' || d.status === 'CANCELLED').length === 0 && (
                  <div className="col-span-3 text-center py-8 text-gray-400">
                    No returned or failed orders recorded.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 9. SUPPORT, RATINGS & REPORTS */}
      {(activeTab === 'SERVICE' || activeTab === 'SUPPORT' || activeTab === 'RATINGS' || activeTab === 'REPORTS' || activeTab === 'ANALYTICS' || activeTab === 'NOTIFICATIONS') && (
        <div className="space-y-6">
          <div className="flex items-center space-x-2 border-b border-gray-200 pb-3 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setServiceInnerTab('tickets')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                serviceInnerTab === 'tickets'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <LifeBuoy className="w-4 h-4" />
              <span>{lang === 'kh' ? `សំបុត្រគាំទ្រ (${supportTickets.length})` : `Support Tickets (${supportTickets.length})`}</span>
            </button>
            <button
              onClick={() => setServiceInnerTab('ratings')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                serviceInnerTab === 'ratings'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Star className="w-4 h-4" />
              <span>{lang === 'kh' ? `ការវាយតម្លៃ (${ratings.length})` : `Customer Ratings (${ratings.length})`}</span>
            </button>
            <button
              onClick={() => setServiceInnerTab('reports')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                serviceInnerTab === 'reports'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{lang === 'kh' ? 'របាយការណ៍ប្រតិបត្តិការ' : 'Operational Reports & Analytics'}</span>
            </button>
          </div>

          {serviceInnerTab === 'tickets' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{lang === 'kh' ? 'បញ្ហាដឹកជញ្ជូន & សំបុត្រគាំទ្រ' : 'Delivery Issues & Support Tickets'}</h3>
              <p className="text-xs text-gray-500">Log customer complaints, late deliveries, spills and payment disputes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supportTickets.map((ticket) => (
              <div key={ticket.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg">
                      {ticket.ticket_number}
                    </span>
                    <span className={'px-2 py-0.2 rounded-full text-[10px] font-bold ' + (ticket.priority === 'URGENT' ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-700')}>
                      {ticket.priority}
                    </span>
                  </div>
                  <span className={'px-2 py-0.5 rounded-full font-bold ' + (ticket.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
                    {ticket.status}
                  </span>
                </div>

                <p className="font-bold text-gray-900">{ticket.issue_type.replace('_', ' ')}</p>
                <p className="text-gray-600 text-[11px] bg-gray-50 p-2.5 rounded-xl">{ticket.description}</p>

                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                  <span>Order: {ticket.delivery?.delivery_number}</span>
                  {ticket.status !== 'RESOLVED' && (
                    <button
                      onClick={async () => {
                        const note = prompt('Enter resolution notes:');
                        if (note) {
                          await resolveDeliverySupportTicket(ticket.id, note);
                          await loadAllData();
                        }
                      }}
                      className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                    >
                      Resolve Ticket &rarr;
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
          )}

          {serviceInnerTab === 'ratings' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm">{lang === 'kh' ? 'ការវាយតម្លៃ & មតិកែលម្អការដឹកជញ្ជូន' : 'Customer Delivery Ratings & Reviews'}</h3>
            <p className="text-xs text-gray-500">Multi-metric feedback: Rider, Speed, Package Condition, Communication</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ratings.map((r) => (
              <div key={r.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={'w-4 h-4 ' + (s <= r.overall_rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200')}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-gray-800 text-xs">{r.overall_rating}.0</span>
                </div>

                <p className="italic text-gray-700 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 text-[11px]">
                  "{r.review_text || 'Excellent service!'}"
                </p>

                <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-500 pt-1">
                  <span>🏍️ Rider: {r.driver_rating}.0</span>
                  <span>⚡ Speed: {r.speed_rating}.0</span>
                  <span>📞 Comm: {r.communication_rating}.0</span>
                  <span>📦 Package: {r.package_rating}.0</span>
                </div>
              </div>
            ))}
          </div>
        </div>
          )}

          {serviceInnerTab === 'reports' && (
            analytics ? (
        <div className="space-y-6">
          {/* Conversion Funnel */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'kh' ? 'ចីវលោដំណើរការដឹកជញ្ជូនពេញលេញ' : 'End-to-End Delivery Funnel'}</span>
            </h3>

            <div className="grid grid-cols-5 gap-3 text-center text-xs">
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-gray-400 text-[10px] uppercase font-bold block">1. Orders Created</span>
                <span className="text-2xl font-black text-gray-900 mt-1 block">{analytics.funnel.total_orders}</span>
                <span className="text-[10px] text-gray-500">100% Volume</span>
              </div>
              <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                <span className="text-indigo-400 text-[10px] uppercase font-bold block">2. In Transit</span>
                <span className="text-2xl font-black text-indigo-700 mt-1 block">{analytics.funnel.in_transit}</span>
                <span className="text-[10px] text-indigo-500">{lang === 'kh' ? 'កំពុងដឹកតាមផ្លូវ' : 'Active On Road'}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-emerald-500 text-[10px] uppercase font-bold block">3. Successfully Delivered</span>
                <span className="text-2xl font-black text-emerald-700 mt-1 block">{analytics.funnel.successful}</span>
                <span className="text-[10px] text-emerald-600 font-bold">{analytics.funnel.conversion_rate}% Conversion</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                <span className="text-rose-400 text-[10px] uppercase font-bold block">4. Failed Attempts</span>
                <span className="text-2xl font-black text-rose-700 mt-1 block">{analytics.funnel.failed}</span>
                <span className="text-[10px] text-rose-600">{analytics.funnel.failed_rate}% Rate</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                <span className="text-amber-500 text-[10px] uppercase font-bold block">5. Restocked / Returned</span>
                <span className="text-2xl font-black text-amber-700 mt-1 block">{analytics.funnel.returned}</span>
                <span className="text-[10px] text-amber-600">{analytics.funnel.return_rate}% Rate</span>
              </div>
            </div>
          </div>

          {/* Peak Hours & Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-3">
              <h4 className="font-bold text-gray-900 text-xs uppercase text-gray-500">Peak Delivery Windows</h4>
              <div className="space-y-2">
                {analytics.hourly_distribution.map((h, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-gray-700">{h.hour}</span>
                      <span className="font-mono text-emerald-600 font-bold">{h.count} orders ({h.percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${h.percentage * 2}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-3">
              <h4 className="font-bold text-gray-900 text-xs uppercase text-gray-500">Zone Volume & Delivery Speeds</h4>
              <div className="space-y-2">
                {analytics.zone_heatmap.map((z, i) => (
                  <div key={i} className="p-2.5 rounded-xl border border-gray-100 flex items-center justify-between text-xs bg-gray-50/50">
                    <div>
                      <span className="font-bold text-gray-900 block">{z.zone_name}</span>
                      <span className="text-[10px] text-gray-500">Avg Speed: {z.avg_minutes} mins &bull; Base: ${z.base_fee}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full font-bold bg-teal-100 text-teal-800 text-[11px]">
                      {z.deliveries_count} orders
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center text-gray-400">Loading delivery analytics...</div>
            )
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 10. MODALS & POPUPS */}
      {/* ========================================================= */}
      {isCreateModalOpen && (
        <CreateDeliveryModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          zones={zones}
          drivers={drivers}
          products={products}
          onSuccess={loadAllData}
        />
      )}

      {assignModalDelivery && (
        <AssignDriverModal
          isOpen={!!assignModalDelivery}
          onClose={() => setAssignModalDelivery(null)}
          delivery={assignModalDelivery}
          drivers={drivers}
          onSuccess={loadAllData}
        />
      )}

      {proofModalDelivery && (
        <ProofOfDeliveryModal
          isOpen={!!proofModalDelivery}
          onClose={() => setProofModalDelivery(null)}
          delivery={proofModalDelivery}
          onSuccess={loadAllData}
        />
      )}

      {settleModalDriver && (
        <SettleCodModal
          isOpen={!!settleModalDriver}
          onClose={() => setSettleModalDriver(null)}
          driver={settleModalDriver}
          onSuccess={loadAllData}
        />
      )}

      {detailsDrawerDelivery && (
        <DeliveryDetailsDrawer
          isOpen={!!detailsDrawerDelivery}
          onClose={() => setDetailsDrawerDelivery(null)}
          delivery={detailsDrawerDelivery}
          onAdvanceStatus={(id, nextStatus) => handleUpdateStatus(id, nextStatus)}
          onOpenProofModal={(d: Delivery) => setProofModalDelivery(d)}
        />
      )}

      {isVehicleModalOpen && (
        <VehicleModal
          isOpen={isVehicleModalOpen}
          onClose={() => setIsVehicleModalOpen(false)}
          drivers={drivers}
          onSave={async (payload) => {
            await createDeliveryVehicle(payload);
            await loadAllData();
          }}
        />
      )}

      {isRouteModalOpen && (
        <DeliveryRouteModal
          isOpen={isRouteModalOpen}
          onClose={() => setIsRouteModalOpen(false)}
          availableDeliveries={deliveries.filter(d => d.status === 'PENDING')}
          drivers={drivers}
          vehicles={vehicles}
          onCreateRoute={async (payload) => {
            await createDeliveryRoute(payload);
            await loadAllData();
          }}
        />
      )}

      {isBulkAssignModalOpen && (
        <BulkAssignModal
          isOpen={isBulkAssignModalOpen}
          onClose={() => {
            setIsBulkAssignModalOpen(false);
            setSelectedOrderIds([]);
          }}
          selectedDeliveries={deliveries.filter(d => selectedOrderIds.includes(d.id))}
          drivers={drivers}
          vehicles={vehicles}
          onAssign={async (payload) => {
            await bulkAssignDeliveries(payload);
            await loadAllData();
          }}
        />
      )}

      {ticketModalDelivery && (
        <DeliveryTicketModal
          isOpen={!!ticketModalDelivery}
          onClose={() => setTicketModalDelivery(null)}
          delivery={ticketModalDelivery}
          onSubmit={async (payload) => {
            await createDeliverySupportTicket({
              delivery_id: ticketModalDelivery.id,
              customer_id: ticketModalDelivery.customer_id,
              driver_id: ticketModalDelivery.driver_id,
              ...payload,
            });
            await loadAllData();
          }}
        />
      )}

      {rateModalDelivery && (
        <RateDeliveryModal
          isOpen={!!rateModalDelivery}
          onClose={() => setRateModalDelivery(null)}
          delivery={rateModalDelivery}
          onSubmit={async (payload) => {
            await submitDeliveryRating({
              delivery_id: rateModalDelivery.id,
              customer_id: rateModalDelivery.customer_id,
              driver_id: rateModalDelivery.driver_id,
              ...payload,
            });
            await loadAllData();
          }}
        />
      )}

      {/* Inline Create Delivery Zone Modal */}
      {isZoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-gray-900">{lang === 'kh' ? 'បន្ថែមតំបន់ដឹកជញ្ជូន & កម្រិតចម្ងាយ' : 'Add Delivery Zone & Distance Tier'}</h3>
              <button onClick={() => setIsZoneModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 cursor-pointer">
                <Plus className="w-5 h-5 rotate-45 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleCreateZoneSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Zone Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daun Penh & Riverside"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Zone Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="ZONE-DOWNTOWN"
                    value={zoneCode}
                    onChange={(e) => setZoneCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Base Fee ($) *</label>
                  <input
                    type="number"
                    step="0.25"
                    required
                    value={zoneBaseFee}
                    onChange={(e) => setZoneBaseFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Free Delivery Over ($)</label>
                  <input
                    type="number"
                    value={zoneFreeThreshold}
                    onChange={(e) => setZoneFreeThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Estimated Mins</label>
                  <input
                    type="number"
                    value={zoneEstMinutes}
                    onChange={(e) => setZoneEstMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Districts / Administrative Coverage</label>
                <textarea
                  rows={2}
                  value={zoneDesc}
                  onChange={(e) => setZoneDesc(e.target.value)}
                  placeholder="e.g. Sangkat Phsar Thmey 1, 2, 3, Chey Chumneah..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsZoneModalOpen(false)}
                  className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm cursor-pointer"
                >
                  Save Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline Create Driver Modal */}
      {isDriverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-gray-900">Register Delivery Driver / Rider</h3>
              <button onClick={() => setIsDriverModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 cursor-pointer">
                <Plus className="w-5 h-5 rotate-45 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleCreateDriverSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Link Existing Employee (Optional)</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => {
                    setSelectedEmployeeId(e.target.value);
                    const emp = eligibleEmployees.find(em => String(em.id) === e.target.value);
                    if (emp) {
                      setNewDriverName(emp.name);
                      if (emp.phone) setNewDriverPhone(emp.phone);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                >
                  <option value="">-- Or enter external driver --</option>
                  {eligibleEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.phone || 'No phone'})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sokha Meng"
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="012 345 678"
                    value={newDriverPhone}
                    onChange={(e) => setNewDriverPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Vehicle Type</label>
                  <select
                    value={newDriverVehicle}
                    onChange={(e) => setNewDriverVehicle(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                  >
                    <option value="MOTORCYCLE">Motorcycle</option>
                    <option value="CAR">Car</option>
                    <option value="VAN">Van</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">{lang === 'kh' ? 'ស្លាកលេខសម្គាល់' : 'Plate Number'}</label>
                  <input
                    type="text"
                    placeholder="Phnom Penh 1AB-2345"
                    value={newDriverPlate}
                    onChange={(e) => setNewDriverPlate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Driver License No.</label>
                  <input
                    type="text"
                    placeholder="DL-KH-883921"
                    value={newDriverLicense}
                    onChange={(e) => setNewDriverLicense(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsDriverModalOpen(false)}
                  className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm cursor-pointer"
                >
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
