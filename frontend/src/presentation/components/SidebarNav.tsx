import { SmartPosLogo } from './SmartPosLogo';
import React, { useState, useEffect, useMemo } from 'react';
import { useApp, NavTab } from '../../application/context/AppContext';
import { getNotifications } from '../../data-access/posApi';
import {
  Building2,
  Menu,
  X,
  Search,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  Package,
  FileText,
  LayoutDashboard,
  Settings,
  Globe,
  Lock,
  History,
  Coins,
  Truck,
  Home,
  Users,
  UserCheck,
  FileBarChart,
  Bell,
  Shield,
  Database,
  SlidersHorizontal,
  ChevronLeft,
  Clock,
  QrCode,
  DollarSign,
} from 'lucide-react';

interface NavItem {
  id: NavTab;
  name: string;
  nameKh?: string;
  icon: React.ReactNode;
  tab: NavTab;
  badge?: number;
  hotkey?: string;
  description?: string;
}

interface NavGroup {
  id: string;
  title: string;
  titleKh: string;
  icon: React.ReactNode;
  items: NavItem[];
}

export const SidebarNav: React.FC = () => {
  const {
    lang,
    setLang,
    t,
    activeTab,
    setActiveTab,
    cart,
    isShiftOpen,
    isSidebarCollapsed,
    toggleSidebarCollapse,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    currentUser,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<{ [key: string]: boolean }>({});
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Poll or load unread notifications count for live badge
  useEffect(() => {
    getNotifications()
      .then((res) => setUnreadNotifCount(res.unread_count))
      .catch(() => {});
  }, [activeTab]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // 100% READY AND FUNCTIONAL MODULES
  const navGroups: NavGroup[] = useMemo(
    () => [
      {
        id: 'analytics',
        title: 'Dashboard & KPI',
        titleKh: 'ផ្ទាំងគ្រប់គ្រង & ទិន្នន័យ',
        icon: <Home className="w-4 h-4" />,
        items: [
          {
            id: 'dashboard',
            name: 'Executive Dashboard',
            nameKh: 'ផ្ទាំងគ្រប់គ្រងទូទៅ',
            icon: <Home className="w-4 h-4" />,
            tab: 'dashboard',
            hotkey: 'F7',
            description: 'Live revenue & sales metrics',
          },
          {
            id: 'reports',
            name: 'Financial & Sales Reports',
            nameKh: 'របាយការណ៍ហិរញ្ញវត្ថុ & ការលក់',
            icon: <FileBarChart className="w-4 h-4" />,
            tab: 'reports',
            description: 'Revenues, margins, VAT & tenders',
          },
        ],
      },
      {
        id: 'sales_commerce',
        title: 'Sales & Commerce',
        titleKh: 'ការលក់ និងពាណិជ្ជកម្ម',
        icon: <ShoppingCart className="w-4 h-4" />,
        items: [
          {
            id: 'pos',
            name: 'POS Terminal',
            nameKh: 'កន្លែងលក់ POS',
            icon: <ShoppingCart className="w-4 h-4" />,
            tab: 'pos',
            badge: totalCartCount,
            hotkey: 'F1',
            description: 'Cashier checkout & KHQR',
          },
          {
            id: 'shifts',
            name: 'Cash Drawer & Shifts',
            nameKh: 'វេន និងថតប្រាក់',
            icon: <Coins className="w-4 h-4" />,
            tab: 'shifts',
            hotkey: 'F2',
            description: 'Float, safe drops & Z-Reports',
          },
          {
            id: 'sales',
            name: 'Sales History',
            nameKh: 'ប្រវត្តិការលក់',
            icon: <History className="w-4 h-4" />,
            tab: 'sales',
            hotkey: 'F3',
            description: 'Order log & refunds',
          },
          {
            id: 'purchases',
            name: 'Purchasing & Suppliers',
            nameKh: 'ការទិញទំនិញ & អ្នកផ្គត់ផ្គង់',
            icon: <Truck className="w-4 h-4" />,
            tab: 'purchases',
            hotkey: 'F6',
            description: 'Vendor orders & receiving',
          },
        ],
      },
      {
        id: 'inventory',
        title: 'Inventory & Stock',
        titleKh: 'ស្តុកទំនិញ',
        icon: <Package className="w-4 h-4" />,
        items: [
          {
            id: 'products',
            name: 'Product Catalog',
            nameKh: 'កាតាឡុកទំនិញ & រូបភាព',
            icon: <Package className="w-4 h-4" />,
            tab: 'products',
            description: 'SKUs, pricing, barcodes & photos',
          },
          {
            id: 'inventory',
            name: 'Stock Levels & Ledger',
            nameKh: 'កម្រិតស្តុក & ចលនាស្តុក',
            icon: <Package className="w-4 h-4" />,
            tab: 'inventory',
            hotkey: 'F5',
            description: 'Multi-warehouse & adjustments',
          },
        ],
      },
      {
        id: 'customers',
        title: 'Customers & People',
        titleKh: 'អតិថិជន & កម្មវិធីសន្សំពិន្ទុ',
        icon: <Users className="w-4 h-4" />,
        items: [
          {
            id: 'customers',
            name: 'Customers & Loyalty',
            nameKh: 'បញ្ជីអតិថិជន & ពិន្ទុ',
            icon: <Users className="w-4 h-4" />,
            tab: 'customers',
            hotkey: 'F8',
            description: 'Customer directory & tiers',
          },
          {
            id: 'employees',
            name: 'Staff & Cashiers',
            nameKh: 'បុគ្គលិក & បេឡាករ',
            icon: <UserCheck className="w-4 h-4" />,
            tab: 'employees',
            description: 'Staff directory, roles & shifts',
          },
          {
            id: 'attendances',
            name: 'Attendance & Scanners',
            nameKh: 'វត្តមាន & ស្កេនកាត',
            icon: <Clock className="w-4 h-4" />,
            tab: 'attendances',
            description: 'Barcode punch clock-in & shifts',
          },
          {
            id: 'store-qr-codes',
            name: 'Store QR Codes',
            nameKh: 'កូដ QR វត្តមានតាមហាង',
            icon: <QrCode className="w-4 h-4" />,
            tab: 'store-qr-codes',
            description: 'Generate secure store QR tokens',
          },
          {
            id: 'payroll',
            name: 'Payroll & Salary Calculator',
            nameKh: 'គណនាប្រាក់បៀវត្សរ៍',
            icon: <DollarSign className="w-4 h-4" />,
            tab: 'payroll',
            description: 'Hours, OT (1.5x), part-time & payslips',
          },
        ],
      },
      {
        id: 'documents',
        title: 'Fiscal Documents',
        titleKh: 'ឯកសារ និងវិក្កយបត្រ',
        icon: <FileText className="w-4 h-4" />,
        items: [
          {
            id: 'invoices',
            name: 'Tax Invoices Registry',
            nameKh: 'វិក្កយបត្រផ្លូវការ',
            icon: <FileText className="w-4 h-4" />,
            tab: 'invoices',
            hotkey: 'F4',
            description: 'Official tax invoice records',
          },
        ],
      },
      {
        id: 'notifications',
        title: 'Notification Center',
        titleKh: 'មជ្ឈមណ្ឌលដំណឹង',
        icon: <Bell className="w-4 h-4" />,
        items: [
          {
            id: 'notifications',
            name: 'System Notifications',
            nameKh: 'ដំណឹងប្រព័ន្ធ & ស្តុក',
            icon: <Bell className="w-4 h-4" />,
            tab: 'notifications',
            badge: unreadNotifCount,
            hotkey: 'F9',
            description: 'Low stock alerts & shift logs',
          },
        ],
      },
      {
        id: 'security',
        title: 'Security & Audit',
        titleKh: 'សន្តិសុខ & អធិការកិច្ច',
        icon: <Shield className="w-4 h-4" />,
        items: [
          {
            id: 'security',
            name: 'Audit Trail & Roles',
            nameKh: 'កំណត់ត្រាអធិការកិច្ច & សិទ្ធិ',
            icon: <Shield className="w-4 h-4" />,
            tab: 'security',
            hotkey: 'F10',
            description: 'Immutable logs & permissions',
          },
        ],
      },
      {
        id: 'backup',
        title: 'Backup & Maintenance',
        titleKh: 'ការបម្រុងទុកទិន្នន័យ',
        icon: <Database className="w-4 h-4" />,
        items: [
          {
            id: 'backup',
            name: 'Database Snapshots',
            nameKh: 'បម្រុងទុកមូលទិន្នន័យ',
            icon: <Database className="w-4 h-4" />,
            tab: 'backup',
            hotkey: 'F11',
            description: 'Snapshots & JSON data exports',
          },
        ],
      },
      {
        id: 'settings',
        title: 'System Configuration',
        titleKh: 'ការកំណត់ប្រព័ន្ធ',
        icon: <Settings className="w-4 h-4" />,
        items: [
          {
            id: 'settings',
            name: 'Store & Branch Setup',
            nameKh: 'ព័ត៌មានហាង & អត្រាប្តូរប្រាក់',
            icon: <Settings className="w-4 h-4" />,
            tab: 'settings',
            hotkey: 'F12',
            description: 'VAT rates, Bakong & printer',
          },
        ],
      },
    ],
    [totalCartCount, unreadNotifCount]
  );

  // Exact 9-item rail list matching user concept:
  // logo
  // ───
  // 🏠 (Dashboard)
  // 🛒 (Sales & Commerce / POS)
  // 📦 (Inventory)
  // 👥 (Customers)
  // 📄 (Invoices)
  // 🔔 (Notifications)
  // 🛡️ (Security & Audit)
  // 💾 (Backup & Data)
  // ⚙️ (Settings)
  const railItems = useMemo(() => {
    return [
      { id: 'dashboard' as NavTab, label: 'Dashboard', icon: <Home className="w-5 h-5" />, hotkey: 'F7', sub: 'Executive KPI' },
      { id: 'pos' as NavTab, label: 'POS & Sales', icon: <ShoppingCart className="w-5 h-5" />, badge: totalCartCount, hotkey: 'F1', sub: 'Cashier Checkout' },
      { id: 'inventory' as NavTab, label: 'Inventory', icon: <Package className="w-5 h-5" />, hotkey: 'F5', sub: 'Stock & Ledger' },
      { id: 'customers' as NavTab, label: 'Customers', icon: <Users className="w-5 h-5" />, hotkey: 'F8', sub: 'Loyalty Program' },
      { id: 'invoices' as NavTab, label: 'Invoices', icon: <FileText className="w-5 h-5" />, hotkey: 'F4', sub: 'Fiscal Tax Records' },
      { id: 'notifications' as NavTab, label: 'Notifications', icon: <Bell className="w-5 h-5" />, badge: unreadNotifCount, hotkey: 'F9', sub: 'Alerts & Warnings' },
      { id: 'security' as NavTab, label: 'Security & Audit', icon: <Shield className="w-5 h-5" />, hotkey: 'F10', sub: 'Audit Trail & Roles' },
      { id: 'backup' as NavTab, label: 'Backup & Data', icon: <Database className="w-5 h-5" />, hotkey: 'F11', sub: 'Snapshots & Exports' },
      { id: 'settings' as NavTab, label: 'Settings', icon: <Settings className="w-5 h-5" />, hotkey: 'F12', sub: 'Store & Branch Config' },
    ];
  }, [totalCartCount, unreadNotifCount]);

  // Search filter for expanded mode
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return navGroups;
    const q = searchQuery.toLowerCase();
    return navGroups
      .map((group) => {
        const groupMatches =
          group.title.toLowerCase().includes(q) || group.titleKh.toLowerCase().includes(q);
        const matchingItems = group.items.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            (item.nameKh && item.nameKh.toLowerCase().includes(q)) ||
            (item.description && item.description.toLowerCase().includes(q))
        );
        if (groupMatches) return group;
        if (matchingItems.length > 0) return { ...group, items: matchingItems };
        return null;
      })
      .filter(Boolean) as NavGroup[];
  }, [navGroups, searchQuery]);

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      setIsMobileDrawerOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileDrawerOpen && (
        <div
          onClick={() => setIsMobileDrawerOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* ========================================================= */}
      {/* 1. COLLAPSED RAIL SIDEBAR (DESKTOP when isSidebarCollapsed) */}
      {/* Exactly matches user concept:                             */}
      {/* ┌───┐                                                     */}
      {/* │logo│                                                    */}
      {/* ├───┤                                                     */}
      {/* │ 🏠 │                                                     */}
      {/* │ 🛒 │                                                     */}
      {/* │ 📦 │                                                     */}
      {/* │ 👥 │                                                     */}
      {/* │ 📄 │                                                     */}
      {/* │ 🔔 │                                                     */}
      {/* │ 🛡️ │                                                     */}
      {/* │ 💾 │                                                     */}
      {/* │ ⚙️ │                                                     */}
      {/* └──-┘                                                     */}
      {/* ========================================================= */}
      <aside
        className={`hidden lg:flex fixed top-0 left-0 bottom-0 z-50 w-20 bg-white border-r border-gray-200 flex-col justify-between py-3 items-center transition-all duration-300 select-none ${
          isSidebarCollapsed ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        {/* Top: SmartPOS Brand Logo Button */}
        <div className="flex flex-col items-center space-y-3 w-full pt-1">
          <button
            onClick={toggleSidebarCollapse}
            className="p-1 rounded-2xl transition transform hover:scale-105 active:scale-95 group relative focus:outline-hidden"
            title="SmartPOS — Click to Expand Menu"
          >
            <SmartPosLogo variant="icon" size="md" />
            <div className="absolute left-16 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition whitespace-nowrap z-50 shadow-xl flex items-center space-x-1.5">
              <span>SmartPOS</span>
              <span className="text-emerald-400 text-[10px] font-mono">(Expand ☰)</span>
            </div>
          </button>

          {/* Rail Divider ─── */}
          <div className="w-8 border-b border-gray-200" />

          {/* 9 Vertical Icons matching concept */}
          <nav className="flex flex-col items-center space-y-1.5 w-full px-2">
            {railItems.map((item) => {
              const isActive =
                activeTab === item.id ||
                (item.id === 'pos' && ['pos', 'sales', 'shifts', 'purchases'].includes(activeTab)) ||
                (item.id === 'inventory' && ['inventory', 'products'].includes(activeTab));

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition group ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title={`${item.label} (${item.hotkey})`}
                >
                  {item.icon}

                  {/* Notification / Cart Badge */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-white text-emerald-700'
                          : item.id === 'notifications'
                          ? 'bg-rose-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Floating Hover Tooltip */}
                  <div className="absolute left-16 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition whitespace-nowrap z-50 shadow-xl flex flex-col items-start leading-tight">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold">{item.label}</span>
                      <span className="text-gray-400 font-mono text-[10px]">({item.hotkey})</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-normal">{item.sub}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Rail: Live Shift Status & Language Switcher */}
        <div className="flex flex-col items-center space-y-2.5 w-full px-2 pt-2 border-t border-gray-100">
          {/* Shift status pulse dot */}
          <button
            onClick={() => handleSelectTab('shifts')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition relative group ${
              isShiftOpen ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}
            title={isShiftOpen ? 'Shift Open (F2)' : 'Drawer Closed (F2)'}
          >
            {isShiftOpen ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            ) : (
              <Lock className="w-4 h-4 text-amber-600" />
            )}

            <div className="absolute left-14 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-50 shadow-lg">
              {isShiftOpen ? 'Shift Active (F2)' : 'Shift Closed (F2)'}
            </div>
          </button>

          {/* Compact Language button */}
          <button
            onClick={() => setLang(lang === 'en' ? 'kh' : 'en')}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold transition"
            title={`Switch to ${lang === 'en' ? 'Khmer' : 'English'}`}
          >
            {lang === 'en' ? 'EN' : 'ខ្មែរ'}
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. EXPANDED SIDEBAR (DESKTOP when !isSidebarCollapsed OR MOBILE DRAWER) */}
      {/* ========================================================= */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col justify-between transition-all duration-300 font-sans ${
          isMobileDrawerOpen
            ? 'translate-x-0'
            : isSidebarCollapsed
            ? '-translate-x-full'
            : 'translate-x-0'
        }`}
      >
        {/* TOP: Brand Header & Search */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <div className="h-16 px-4 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
            <div
              className="cursor-pointer group"
              onClick={() => handleSelectTab('pos')}
              title="SmartPOS Terminal"
            >
              <SmartPosLogo variant="full" size="md" />
            </div>

            {/* Collapse toggle button: ☰ fixed on far right */}
            <button
              onClick={toggleSidebarCollapse}
              className="hidden lg:flex p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              title="Collapse to Rail Mode (☰)"
            >
              <Menu className="w-5 h-5" />
            </button>


            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              className="lg:hidden p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Search */}
          <div className="p-3 border-b border-gray-100 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={lang === 'kh' ? 'ស្វែងរកម៉ឺនុយ...' : 'Search modules...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500 focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation Accordion Groups */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
            {filteredGroups.map((group) => {
              const isCollapsed = collapsedGroups[group.id];
              const hasActiveChild = group.items.some((item) => activeTab === item.tab);

              return (
                <div key={group.id} className="space-y-1">
                  {/* Group Header (Clickable Dropdown Toggle) */}
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 rounded-lg transition hover:bg-gray-50 select-none group"
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`${hasActiveChild ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                        {group.icon}
                      </span>
                      <span className="uppercase tracking-wider text-[11px]">
                        {lang === 'kh' ? group.titleKh : group.title}
                      </span>
                    </div>
                    <div className="text-gray-400 group-hover:text-gray-600 transition">
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </button>

                  {/* Group Items */}
                  {!isCollapsed && (
                    <div className="space-y-1 pl-1">
                      {group.items.map((item) => {
                        const isActive = activeTab === item.tab;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelectTab(item.tab)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition text-left group ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-xs border border-emerald-200/60'
                                : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <span
                                className={`shrink-0 transition ${
                                  isActive ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600'
                                }`}
                              >
                                {item.icon}
                              </span>
                              <div className="truncate">
                                <span className="block truncate">
                                  {lang === 'kh' && item.nameKh ? item.nameKh : item.name}
                                </span>
                                {item.description && (
                                  <span className="block text-[10px] text-gray-400 truncate">
                                    {item.description}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                              {item.badge !== undefined && item.badge > 0 && (
                                <span
                                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                    isActive
                                      ? 'bg-emerald-600 text-white'
                                      : item.id === 'notifications'
                                      ? 'bg-rose-500 text-white'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                              {item.hotkey && (
                                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-600 transition">
                                  {item.hotkey}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM: Shift Status & Language Switcher */}
        <div className="p-3 border-t border-gray-200 bg-gray-50/50 space-y-2 shrink-0">
          {/* Shift status card */}
          <div
            onClick={() => handleSelectTab('shifts')}
            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
              isShiftOpen
                ? 'bg-white border-emerald-200 hover:border-emerald-300'
                : 'bg-white border-amber-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                {isShiftOpen ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                )}
              </span>
              <div className="leading-tight">
                <span className="text-[11px] font-bold text-gray-900 block">
                  {isShiftOpen ? 'Cash Drawer Open' : 'Drawer Closed'}
                </span>
                <span className="text-[9px] text-gray-400">Terminal #REG-01</span>
              </div>
            </div>
            <span className="font-mono text-[10px] text-gray-400 font-bold">F2</span>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 text-xs font-bold rounded-lg transition ${
                  lang === 'en' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-200'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('kh')}
                className={`px-2 py-1 text-xs font-bold rounded-lg transition ${
                  lang === 'kh' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-200'
                }`}
              >
                ខ្មែរ
              </button>
            </div>

            <button
              onClick={() => handleSelectTab('profile')}
              className="flex items-center space-x-1.5 px-2 py-1 rounded-lg hover:bg-gray-100 transition text-[11px] text-gray-500 hover:text-emerald-700"
              title="View User Profile"
            >
              <div className="w-4 h-4 rounded-md bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-[8px] shadow-xs">
                {currentUser?.first_name?.charAt(0) || 'L'}
              </div>
              <span className="font-bold text-gray-800 truncate max-w-[80px]">
                {currentUser?.first_name || 'Admin'}
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
