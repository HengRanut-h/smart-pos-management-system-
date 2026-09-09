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
  Terminal,
  FileBarChart,
  Bell,
  Shield,
  KeyRound,
  Database,
  SlidersHorizontal,
  ChevronLeft,
  Clock,
  QrCode,
  DollarSign,
  ChevronsRight,
  BarChart3,
  Layers,
  MapPin,
  RotateCcw,
  Route as RouteIcon,
  LifeBuoy,
  Star,
  Navigation,
  CheckSquare,
  FileSpreadsheet,
  Sparkles,
  FolderTree,
  Award,
  Scale,
  Boxes,
  Barcode,
  PackagePlus,
  Wrench,
  CheckCircle2,
  Tag,
  Calendar,
  Hash,
  ShieldCheck,
  Calculator,
  TrendingUp,
  Bot,
  CreditCard,
  Printer,
  Server,
  Send,
} from 'lucide-react';

interface NavItem {
  id: NavTab | string;
  name: string;
  nameKh?: string;
  icon: React.ReactNode;
  tab: NavTab;
  subTab?: string;
  badge?: number | string;
  hotkey?: string;
  description?: string;
}

interface NavGroup {
  id: string;
  title: string;
  titleKh: string;
  icon: React.ReactNode;
  badge?: number | string;
  items: NavItem[];
}

interface RailItem {
  id: NavTab;
  label: string;
  labelKh?: string;
  icon: React.ReactNode;
  sub: string;
  subKh?: string;
  badge?: number | string;
  hotkey?: string;
}

export const SidebarNav: React.FC = () => {
  const {
    lang,
    setLang,
    t,
    activeTab,
    setActiveTab,
    productSubTab,
    setProductSubTab,
    deliverySubTab,
    setDeliverySubTab,
    securitySubTab,
    setSecuritySubTab,
    backupSubTab,
    setBackupSubTab,
    settingsSubTab,
    setSettingsSubTab,
    cart,
    isShiftOpen,
    isSidebarCollapsed,
    toggleSidebarCollapse,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    currentUser,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Prevent browser password managers from injecting saved emails/usernames into the module search
  useEffect(() => {
    if (searchQuery.includes('@')) {
      setSearchQuery('');
    }
  }, [searchQuery]);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Poll or load unread notifications count for live badge
  useEffect(() => {
    getNotifications()
      .then((res) => setUnreadNotifCount(res.unread_count))
      .catch(() => {});
  }, [activeTab]);

  const toggleGroup = (groupId: string) => {
    // Single open dropdown accordion: opening one closes any previously open dropdown automatically
    setOpenGroupId((prev) => (prev === groupId ? null : groupId));
  };

  const isCustomerOnly = useMemo(() => {
    if (!currentUser) return false;
    const roleCodes = currentUser.roles?.map((r: any) => r.code?.toUpperCase()) || [];
    const hasStaffRole = roleCodes.some((code: string) =>
      ['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'CASHIER', 'STOCK_MANAGER', 'ACCOUNTANT', 'HR', 'EMPLOYEE'].includes(code)
    );
    return !hasStaffRole && (roleCodes.includes('CUSTOMER') || currentUser.primary_role?.toLowerCase() === 'customer');
  }, [currentUser]);

  // 100% READY AND FUNCTIONAL MODULES
  const navGroups: NavGroup[] = useMemo(() => {
    if (isCustomerOnly) {
      return [
        {
          id: 'customer_portal',
          title: 'Customer Portal',
          titleKh: 'ផតថលអតិថិជន',
          icon: <Home className="w-4 h-4" />,
          items: [
            {
              id: 'dashboard',
              name: 'Customer Dashboard',
              nameKh: 'ផ្ទាំងគ្រប់គ្រងអតិថិជន',
              icon: <Home className="w-4 h-4" />,
              tab: 'dashboard',
              description: 'My points & orders overview',
            },
            {
              id: 'sales',
              name: 'My Purchase Orders',
              nameKh: 'ប្រវត្តិនៃការបញ្ជាទិញ',
              icon: <History className="w-4 h-4" />,
              tab: 'sales',
              description: 'Order receipts & history',
            },
            {
              id: 'invoices',
              name: 'My E-Invoices',
              nameKh: 'វិក្កយបត្រអេឡិចត្រូនិច',
              icon: <FileText className="w-4 h-4" />,
              tab: 'invoices',
              description: 'Official invoices & receipts',
            },
            {
              id: 'notifications',
              name: 'Notifications & Alerts',
              nameKh: 'ដំណឹង និងប្រូម៉ូសិន',
              icon: <Bell className="w-4 h-4" />,
              tab: 'notifications',
              badge: unreadNotifCount,
              description: 'Promotions, orders & updates',
            },
            {
              id: 'profile',
              name: 'My Profile & Security',
              nameKh: 'ព័ត៌មានផ្ទាល់ខ្លួន',
              icon: <Users className="w-4 h-4" />,
              tab: 'profile',
              description: 'Contact info & password',
            },
            {
              id: 'settings',
              name: 'Preferences & Settings',
              nameKh: 'ការកំណត់ផ្ទាល់ខ្លួន',
              icon: <Settings className="w-4 h-4" />,
              tab: 'settings',
              description: 'Language & display preferences',
            },
          ],
        },
      ];
    }

    return [
      {
        id: 'executive_cockpit',
        title: 'Executive 360 Cockpit',
        titleKh: 'ផ្ទាំងបញ្ជាប្រតិបត្តិការ 360°',
        icon: <TrendingUp className="w-4 h-4" />,
        items: [
          {
            id: 'executive',
            name: 'Executive 360 Cockpit',
            nameKh: 'ផ្ទាំងបញ្ជាប្រតិបត្តិការ 360°',
            icon: <TrendingUp className="w-4 h-4" />,
            tab: 'executive',
            description: 'Multi-store, channel & cashier drilldowns',
          },
        ],
      },
      {
        id: 'governance_group',
        title: 'Approval Governance',
        titleKh: 'មជ្ឈមណ្ឌលអនុម័ត',
        icon: <ShieldCheck className="w-4 h-4" />,
        items: [
          {
            id: 'approvals',
            name: 'Approval Governance & Rules',
            nameKh: 'មជ្ឈមណ្ឌលអនុម័ត និងវិធានអាជីវកម្ម',
            icon: <ShieldCheck className="w-4 h-4" />,
            tab: 'approvals',
            description: 'Pending queue, rule policies & multi-tier signoffs',
          },
        ],
      },
      {
        id: 'reports_group',
        title: 'General Reports',
        titleKh: 'របាយការណ៍ទូទៅ',
        icon: <FileBarChart className="w-4 h-4" />,
        items: [
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
        id: 'delivery_group',
        title: 'Delivery & Logistics',
        titleKh: 'ការដឹកជញ្ជូន & ភស្តុភារ',
        icon: <Truck className="w-4 h-4" />,
        items: [
          {
            id: 'delivery_dashboard',
            name: 'Delivery Dashboard',
            nameKh: 'ផ្ទាំងគ្រប់គ្រងដឹកជញ្ជូន',
            icon: <BarChart3 className="w-4 h-4" />,
            tab: 'delivery',
            subTab: 'DASHBOARD',
          },
          {
            id: 'delivery_orders',
            name: 'Orders & Dispatch',
            nameKh: 'ការបញ្ជាទិញ & បែងចែកអ្នកដឹក',
            icon: <Package className="w-4 h-4" />,
            tab: 'delivery',
            subTab: 'ORDERS',
          },
          {
            id: 'delivery_routes',
            name: 'Routes & Scheduling',
            nameKh: 'ផ្លូវដឹក & ម៉ោងកំណត់',
            icon: <RouteIcon className="w-4 h-4" />,
            tab: 'delivery',
            subTab: 'ROUTES',
          },
          {
            id: 'delivery_fleet',
            name: 'Fleet & Drivers',
            nameKh: 'អ្នកដឹក & យានជំនិះ',
            icon: <UserCheck className="w-4 h-4" />,
            tab: 'delivery',
            subTab: 'FLEET',
          },
          {
            id: 'delivery_zones',
            name: 'Zones & Pricing',
            nameKh: 'តំបន់ដឹកជញ្ជូន & ថ្លៃសេវា',
            icon: <Layers className="w-4 h-4" />,
            tab: 'delivery',
            subTab: 'ZONES',
          },
          {
            id: 'delivery_finance',
            name: 'COD & Proof of Delivery',
            nameKh: 'ទូទាត់ COD & ភស្តុតាង (POD)',
            icon: <DollarSign className="w-4 h-4" />,
            tab: 'delivery',
            subTab: 'FINANCE',
          },
          {
            id: 'delivery_service',
            name: 'Support & Reports',
            nameKh: 'សំបុត្រគាំទ្រ & របាយការណ៍',
            icon: <LifeBuoy className="w-4 h-4" />,
            tab: 'delivery',
            subTab: 'SERVICE',
          },
        ],
      },
      {
        id: 'products_group',
        title: 'Product Management',
        titleKh: 'គ្រប់គ្រងទំនិញ',
        icon: <Package className="w-4 h-4" />,
        items: [
          {
            id: 'prod_dashboard',
            name: 'Product Dashboard',
            nameKh: 'ផ្ទាំងគ្រប់គ្រងទំនិញ',
            icon: <BarChart3 className="w-4 h-4" />,
            tab: 'products',
            subTab: 'dashboard',
          },
          {
            id: 'prod_catalog',
            name: 'Product Catalog',
            nameKh: 'កាតាឡុកទំនិញ',
            icon: <Package className="w-4 h-4" />,
            tab: 'products',
            subTab: 'catalog',
          },
          {
            id: 'prod_attributes',
            name: 'Categories & Attributes',
            nameKh: 'ជំពូក ម៉ាកយីហោ & ខ្នាត',
            icon: <FolderTree className="w-4 h-4" />,
            tab: 'products',
            subTab: 'attributes',
          },
          {
            id: 'prod_pricing',
            name: 'Pricing & Costs',
            nameKh: 'តម្លៃទំនិញ & ថ្លៃដើម',
            icon: <DollarSign className="w-4 h-4" />,
            tab: 'products',
            subTab: 'pricing',
          },
          {
            id: 'prod_tracking',
            name: 'Batches & Warranties',
            nameKh: 'ឡូត៍ទំនិញ ស៊េរី & ការធានា',
            icon: <Calendar className="w-4 h-4" />,
            tab: 'products',
            subTab: 'tracking',
          },
          {
            id: 'prod_manufacturing',
            name: 'Manufacturing & Operations',
            nameKh: 'ផលិតកម្ម & ប្រតិបត្តិការ',
            icon: <Wrench className="w-4 h-4" />,
            tab: 'products',
            subTab: 'manufacturing',
          },
        ],
      },
      {
        id: 'inventory',
        title: 'Inventory & Stock',
        titleKh: 'ស្តុកទំនិញ',
        icon: <Boxes className="w-4 h-4" />,
        items: [
          {
            id: 'inventory',
            name: 'Stock Levels & Ledger',
            nameKh: 'កម្រិតស្តុក & ចលនាស្តុក',
            icon: <Boxes className="w-4 h-4" />,
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
          {
            id: 'invoice-designer',
            name: 'Document & Invoice Designer',
            nameKh: 'រចនាវិក្កយបត្រ និងឯកសារ',
            icon: <SlidersHorizontal className="w-4 h-4" />,
            tab: 'invoice-designer',
            description: 'Templates, layouts, numbering & assignments',
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
        id: 'security_group',
        title: 'Security & Audit',
        titleKh: 'សន្តិសុខ & អធិការកិច្ច',
        icon: <Shield className="w-4 h-4" />,
        items: [
          {
            id: 'sec_audit_logs',
            name: 'Audit Trail Logs',
            nameKh: 'កំណត់ត្រាអធិការកិច្ច',
            icon: <Terminal className="w-4 h-4" />,
            tab: 'security',
            subTab: 'AUDIT_LOGS',
          },
          {
            id: 'sec_login_audits',
            name: 'User Login Audit',
            nameKh: 'សវនកម្មការចូលប្រើប្រាស់',
            icon: <KeyRound className="w-4 h-4" />,
            tab: 'security',
            subTab: 'LOGIN_AUDIT',
          },
          {
            id: 'sec_user_roles',
            name: 'User Roles & Access',
            nameKh: 'តួនាទីអ្នកប្រើ & សិទ្ធិ',
            icon: <Users className="w-4 h-4" />,
            tab: 'security',
            subTab: 'USER_ROLES',
          },
          {
            id: 'sec_roles_matrix',
            name: 'Roles & Permission Matrix',
            nameKh: 'ម៉ាទ្រីសសិទ្ធិអនុញ្ញាត',
            icon: <UserCheck className="w-4 h-4" />,
            tab: 'security',
            subTab: 'ROLES',
          },
          {
            id: 'sec_policies',
            name: 'Security Status & Policy',
            nameKh: 'គោលការណ៍សន្តិសុខ & ស្ថានភាព',
            icon: <Lock className="w-4 h-4" />,
            tab: 'security',
            subTab: 'POLICIES',
          },
        ],
      },
      {
        id: 'backup',
        title: 'Database Backup & System Data',
        titleKh: 'ការបម្រុងទុកទិន្នន័យ & ប្រព័ន្ធ',
        icon: <Database className="w-4 h-4" />,
        items: [
          {
            id: 'bak_dashboard',
            name: 'Dashboard & Snapshots',
            nameKh: 'ផ្ទាំងគ្រប់គ្រង & ច្បាប់ចម្លង',
            icon: <Database className="w-4 h-4" />,
            tab: 'backup',
            subTab: 'DASHBOARD',
            hotkey: 'F11',
            description: '3-2-1 strategy, snapshot records & KPIs',
          },
          {
            id: 'bak_schedule',
            name: 'Schedule & Retention',
            nameKh: 'កាលវិភាគ & គោលការណ៍រក្សាទុក',
            icon: <Calendar className="w-4 h-4" />,
            tab: 'backup',
            subTab: 'SCHEDULE',
            description: 'Automated daily/weekly backups & cloud sync',
          },
          {
            id: 'bak_restore',
            name: 'Restore & Recovery',
            nameKh: 'ការស្ដារឡើងវិញ & ការពារទិន្នន័យ',
            icon: <RotateCcw className="w-4 h-4" />,
            tab: 'backup',
            subTab: 'RESTORE',
            description: 'Safe restore, rollback snapshots & recovery',
          },
          {
            id: 'bak_maintenance',
            name: 'System Data & Health',
            nameKh: 'ទិន្នន័យប្រព័ន្ធ & សុខភាព DB',
            icon: <Server className="w-4 h-4" />,
            tab: 'backup',
            subTab: 'MAINTENANCE',
            description: 'VACUUM optimization, cache purge, table stats',
          },
          {
            id: 'bak_import_export',
            name: 'Import & Export Hub',
            nameKh: 'ការនាំចូល & នាំចេញ',
            icon: <FileSpreadsheet className="w-4 h-4" />,
            tab: 'backup',
            subTab: 'IMPORT_EXPORT',
            description: 'Bulk JSON & CSV data exports',
          },
          {
            id: 'bak_telegram',
            name: 'Telegram Bot & Alerts',
            nameKh: 'តេឡេក្រាម & ការជូនដំណឹង',
            icon: <Send className="w-4 h-4" />,
            tab: 'backup',
            subTab: 'TELEGRAM',
            description: 'Bot configuration, audit logs & remote alerts',
          },
        ],
      },
      {
        id: 'settings',
        title: 'System & Branch Settings',
        titleKh: 'ការកំណត់ប្រព័ន្ធ និងសាខា',
        icon: <Settings className="w-4 h-4" />,
        items: [
          {
            id: 'set_system',
            name: 'System Settings',
            nameKh: 'ការកំណត់ប្រព័ន្ធទូទៅ',
            icon: <SlidersHorizontal className="w-4 h-4" />,
            tab: 'settings',
            subTab: 'SYSTEM',
            hotkey: 'F12',
            description: 'Global system name, code, defaults',
          },
          {
            id: 'set_company',
            name: 'Company Profile',
            nameKh: 'ព័ត៌មានក្រុមហ៊ុន & អាសយដ្ឋាន',
            icon: <Building2 className="w-4 h-4" />,
            tab: 'settings',
            subTab: 'COMPANY',
            description: 'Legal registration, TIN, contacts',
          },
          {
            id: 'set_branches',
            name: 'Branch Management',
            nameKh: 'គ្រប់គ្រងសាខាហាង (Stores)',
            icon: <MapPin className="w-4 h-4" />,
            tab: 'settings',
            subTab: 'BRANCHES',
            description: 'Head Office, Phnom Penh, Siem Reap, Battambang',
          },
          {
            id: 'set_branch_settings',
            name: 'Branch-Specific Overrides',
            nameKh: 'ការកំណត់ដោយឡែកតាមសាខា',
            icon: <SlidersHorizontal className="w-4 h-4" />,
            tab: 'settings',
            subTab: 'BRANCH_SETTINGS',
            description: 'Financial, inventory & receipt overrides',
          },
          {
            id: 'set_branch_users',
            name: 'Branch Staff & Permissions',
            nameKh: 'បុគ្គលិកសាខា & សិទ្ធិ',
            icon: <Users className="w-4 h-4" />,
            tab: 'settings',
            subTab: 'BRANCH_USERS',
            description: 'Assign users to stores & terminals',
          },
          {
            id: 'set_business_hours',
            name: 'Business Hours & Holidays',
            nameKh: 'ម៉ោងបើកលក់ & ថ្ងៃឈប់សម្រាក',
            icon: <Calendar className="w-4 h-4" />,
            tab: 'settings',
            subTab: 'BUSINESS_HOURS',
            description: 'Operating days, shifts & national holidays',
          },
          {
            id: 'set_invoice_receipt',
            name: 'Invoice & Receipt Settings',
            nameKh: 'ទម្រង់វិក្កយបត្រ & ស្លាកស្នាម',
            icon: <FileText className="w-4 h-4" />,
            tab: 'settings',
            subTab: 'INVOICE_RECEIPT',
            description: 'Prefixes INV-, POS-, numbering, QR code',
          },
          {
            id: 'set_tax_currency',
            name: 'Tax & Multi-Currency (Bakong)',
            nameKh: 'ពន្ធ & រូបិយប័ណ្ណ (KHQR)',
            icon: <Coins className="w-4 h-4" />,
            tab: 'settings',
            subTab: 'TAX_CURRENCY',
            description: 'USD/KHR rate, VAT %, Bakong merchant',
          },
          {
            id: 'set_inventory',
            name: 'Inventory Rules & Valuation',
            nameKh: 'វិធានស្តុក & ថ្លៃដើម (FIFO)',
            icon: <Boxes className="w-4 h-4" />,
            tab: 'settings',
            subTab: 'INVENTORY',
            description: 'Valuation method, low-stock threshold, negative stock',
          },
          {
            id: 'set_payment',
            name: 'Payment & Cash Drawer',
            nameKh: 'វិធីទូទាត់ & ថតប្រាក់',
            icon: <DollarSign className="w-4 h-4" />,
            tab: 'settings',
            subTab: 'PAYMENT',
            description: 'Cash drawer float, banks, split payment',
          },
          {
            id: 'set_hardware',
            name: 'POS Hardware & Printers',
            nameKh: 'ឧបករណ៍ POS & ម៉ាស៊ីនបោះពុម្ព',
            icon: <Printer className="w-4 h-4" />,
            tab: 'settings',
            subTab: 'PRINTER_HARDWARE',
            description: 'Terminals, 80mm/58mm printers, scanners, scales',
          },
          {
            id: 'set_localization',
            name: 'Localization (Khmer / English)',
            nameKh: 'ភាសា (ខ្មែរ / អង់គ្លេស) & តំបន់',
            icon: <Globe className="w-4 h-4" />,
            tab: 'settings',
            subTab: 'LOCALIZATION',
            description: 'Default language, timezone, date & number format',
          },
          {
            id: 'set_notifications',
            name: 'Notification Channels',
            nameKh: 'ការជូនដំណឹង & កំណត់ហេតុ',
            icon: <Bell className="w-4 h-4" />,
            tab: 'settings',
            subTab: 'NOTIFICATIONS',
            description: 'Email, Telegram, SMS, In-App alerts',
          },
          {
            id: 'set_telegram',
            name: 'Telegram Bot Integration',
            nameKh: 'តេឡេក្រាមបូត & ការដាស់តឿន',
            icon: <Bot className="w-4 h-4" />,
            tab: 'settings',
            subTab: 'TELEGRAM',
            description: 'Bot token, admin chat ID, remote alerts',
          },
          {
            id: 'set_security',
            name: 'Security & Session Policies',
            nameKh: 'សន្តិសុខ & គោលការណ៍ចូលប្រើ',
            icon: <Lock className="w-4 h-4" />,
            tab: 'settings',
            subTab: 'SECURITY',
            description: 'Session timeout, lockout, password expiry, 2FA',
          },
          {
            id: 'set_backup',
            name: 'Backup & Recovery Hub',
            nameKh: 'បម្រុងទុកទិន្នន័យ (3-2-1 Strategy)',
            icon: <Database className="w-4 h-4" />,
            tab: 'settings',
            subTab: 'BACKUP',
            description: 'Automated schedules, encryption, restore',
          },
          {
            id: 'set_audit',
            name: 'Configuration Audit Trail',
            nameKh: 'សវនកម្មការកែប្រែប្រព័ន្ធ',
            icon: <Terminal className="w-4 h-4" />,
            tab: 'settings',
            subTab: 'AUDIT',
            description: 'Tracks old vs new setting changes with IP & device',
          },
        ],
      },
    ];
  }, [totalCartCount, unreadNotifCount, isCustomerOnly]);
  // When activeTab changes (e.g. user continues to another navigation item), auto-close previous dropdown
  useEffect(() => {
    const activeGroup = navGroups.find((g) => g.items.some((item) => item.tab === activeTab));
    if (activeGroup) {
      setOpenGroupId(activeGroup.id);
    } else {
      // If navigating to Dashboard or another top-level screen, close all dropdowns automatically
      setOpenGroupId(null);
    }
  }, [activeTab, navGroups]);

  const railItems: RailItem[] = useMemo(() => {
    if (isCustomerOnly) {
      return [
        { id: 'dashboard' as NavTab, label: 'Dashboard', labelKh: 'ផ្ទាំងគ្រប់គ្រង', icon: <Home className="w-5 h-5" />, sub: 'My Overview', subKh: 'ទិដ្ឋភាពទូទៅ' },
        { id: 'sales' as NavTab, label: 'Orders', labelKh: 'ការបញ្ជាទិញ', icon: <History className="w-5 h-5" />, sub: 'My Orders', subKh: 'ការបញ្ជាទិញរបស់ខ្ញុំ' },
        { id: 'invoices' as NavTab, label: 'Invoices', labelKh: 'វិក្កយបត្រ', icon: <FileText className="w-5 h-5" />, sub: 'My Invoices', subKh: 'វិក្កយបត្ររបស់ខ្ញុំ' },
        { id: 'notifications' as NavTab, label: 'Alerts', labelKh: 'ដំណឹង', icon: <Bell className="w-5 h-5" />, badge: unreadNotifCount, sub: 'Notifications', subKh: 'សារជូនដំណឹង' },
        { id: 'profile' as NavTab, label: 'Profile', labelKh: 'គណនី', icon: <Users className="w-5 h-5" />, sub: 'My Account', subKh: 'គណនីរបស់ខ្ញុំ' },
        { id: 'settings' as NavTab, label: 'Settings', labelKh: 'ការកំណត់', icon: <Settings className="w-5 h-5" />, sub: 'Preferences', subKh: 'ការកំណត់' },
      ];
    }
    return [
      { id: 'dashboard' as NavTab, label: 'Dashboard', labelKh: 'ផ្ទាំងគ្រប់គ្រង', icon: <Home className="w-5 h-5" />, hotkey: 'F7', sub: 'Executive KPI', subKh: 'ទិន្នន័យប្រតិបត្តិការ' },
      { id: 'executive' as NavTab, label: 'Executive 360', labelKh: 'ផ្ទាំងប្រតិបត្តិ', icon: <TrendingUp className="w-5 h-5" />, sub: 'Store Drilldown', subKh: 'ទិដ្ឋភាពសាខា' },
      { id: 'approvals' as NavTab, label: 'Approvals', labelKh: 'ការអនុម័ត', icon: <ShieldCheck className="w-5 h-5" />, sub: 'Workflow Engine', subKh: 'អភិបាលកិច្ច' },
      { id: 'pos' as NavTab, label: 'POS & Sales', labelKh: 'កន្លែងលក់ POS', icon: <ShoppingCart className="w-5 h-5" />, badge: totalCartCount, hotkey: 'F1', sub: 'Cashier Checkout', subKh: 'គិតប្រាក់' },
      { id: 'products' as NavTab, label: 'Products', labelKh: 'គ្រប់គ្រងទំនិញ', icon: <Package className="w-5 h-5" />, sub: 'Product Hub', subKh: 'មជ្ឈមណ្ឌលទំនិញ' },
      { id: 'delivery' as NavTab, label: 'Delivery', labelKh: 'ដឹកជញ្ជូន', icon: <Truck className="w-5 h-5" />, hotkey: 'F7', sub: 'Fleet & Logistics', subKh: 'ភស្តុភារ & អ្នកដឹក' },
      { id: 'inventory' as NavTab, label: 'Inventory', labelKh: 'ស្តុកទំនិញ', icon: <Boxes className="w-5 h-5" />, hotkey: 'F5', sub: 'Stock & Ledger', subKh: 'ស្តុក & ចលនាទំនិញ' },
      { id: 'customers' as NavTab, label: 'Customers', labelKh: 'អតិថិជន', icon: <Users className="w-5 h-5" />, hotkey: 'F8', sub: 'Loyalty Program', subKh: 'សន្សំពិន្ទុ' },
      { id: 'invoices' as NavTab, label: 'Invoices', labelKh: 'វិក្កយបត្រ', icon: <FileText className="w-5 h-5" />, hotkey: 'F4', sub: 'Fiscal Tax Records', subKh: 'វិក្កយបត្រអេឡិចត្រូនិច' },
      { id: 'notifications' as NavTab, label: 'Notifications', labelKh: 'ដំណឹង', icon: <Bell className="w-5 h-5" />, badge: unreadNotifCount, hotkey: 'F9', sub: 'Alerts & Warnings', subKh: 'សារជូនដំណឹង' },
      { id: 'security' as NavTab, label: 'Security & Audit', labelKh: 'សុវត្ថិភាព', icon: <Shield className="w-5 h-5" />, hotkey: 'F10', sub: 'Audit Trail & Roles', subKh: 'កំណត់ហេតុ & សិទ្ធិ' },
      { id: 'backup' as NavTab, label: 'Backup & Data', labelKh: 'បម្រុងទុក', icon: <Database className="w-5 h-5" />, hotkey: 'F11', sub: 'Snapshots & Exports', subKh: 'ទិន្នន័យបម្រុង' },
      { id: 'settings' as NavTab, label: 'Settings', labelKh: 'ការកំណត់', icon: <Settings className="w-5 h-5" />, hotkey: 'F12', sub: 'Store & Branch Config', subKh: 'ការកំណត់ហាង & សាខា' },
    ];
  }, [totalCartCount, unreadNotifCount, isCustomerOnly]);

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

  const handleSelectTab = (tab: NavTab, subTab?: string) => {
    setActiveTab(tab);
    if (tab === 'delivery' && subTab) {
      setDeliverySubTab(subTab);
    } else if (tab === 'products' && subTab) {
      setProductSubTab(subTab);
    } else if (tab === 'security' && subTab) {
      setSecuritySubTab(subTab);
    } else if (tab === 'backup' && subTab) {
      setBackupSubTab(subTab);
    } else if (tab === 'settings' && subTab) {
      setSettingsSubTab(subTab);
    }
    if (searchQuery) {
      setSearchQuery('');
    }
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
                  title={item.hotkey ? `${lang === 'kh' && item.labelKh ? item.labelKh : item.label} (${item.hotkey})` : (lang === 'kh' && item.labelKh ? item.labelKh : item.label)}
                >
                  {item.icon}

                  {/* Notification / Cart Badge */}
                  {item.badge !== undefined && (typeof item.badge === 'number' ? item.badge > 0 : Boolean(item.badge)) && (
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
                      <span className="font-bold">{lang === 'kh' && item.labelKh ? item.labelKh : item.label}</span>
                      {item.hotkey && <span className="text-gray-400 font-mono text-[10px]">({item.hotkey})</span>}
                    </div>
                    <span className="text-[10px] text-gray-400 font-normal">{lang === 'kh' && item.subKh ? item.subKh : item.sub}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Rail: User Profile */}
        <div className="flex flex-col items-center space-y-2.5 w-full px-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => handleSelectTab('profile')}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs transition transform hover:scale-105"
            title={`${currentUser?.first_name || (lang === 'kh' ? 'ប្រធាន' : 'Lead')} ${currentUser?.last_name || (lang === 'kh' ? 'គ្រប់គ្រង' : 'Admin')} (${currentUser?.primary_role || (lang === 'kh' ? 'អភិបាលជាន់ខ្ពស់' : 'SuperAdministrator')})`}
          >
            {currentUser?.first_name?.charAt(0) || 'L'}{currentUser?.last_name?.charAt(0) || 'A'}
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
                type="search"
                name="sidebar_module_search_query"
                id="sidebar_module_search_query"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                data-form-type="other"
                placeholder={lang === 'kh' ? 'ស្វែងរកម៉ឺនុយ...' : 'Search modules...'}
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.includes('@')) return;
                  setSearchQuery(val);
                }}
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

          {/* Top Primary Active Dashboard Pill (styled consistently like all other navigation items) */}
          <div className="px-3 pt-2 pb-0.5">
            <button
              onClick={() => handleSelectTab('dashboard')}
              className={`nav-item-pill ${activeTab === 'dashboard' ? 'is-active' : ''}`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <span className={`${activeTab === 'dashboard' ? 'text-emerald-600' : 'text-slate-500'} shrink-0`}>
                  <Home className="w-4 h-4" />
                </span>
                <span className={`text-[13px] truncate ${activeTab === 'dashboard' ? 'text-emerald-700 font-bold' : 'text-slate-800 font-medium'}`}>
                  {lang === 'kh' ? 'ផ្ទាំងគ្រប់គ្រង' : 'Dashboard'}
                </span>
              </div>
            </button>
          </div>

          {/* Navigation Accordion Groups */}
          <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
            {filteredGroups.map((group) => {
              const hasSubnav = group.items.length > 1;
              const isCollapsed = searchQuery ? false : openGroupId !== group.id;
              const hasActiveChild = group.items.some((item) => activeTab === item.tab);

              const handleGroupClick = () => {
                if (hasSubnav) {
                  toggleGroup(group.id);
                } else if (group.items[0]) {
                  handleSelectTab(group.items[0].tab);
                }
              };

              return (
                <div key={group.id} className="space-y-0.5">
                  {/* Group Header (Clickable: toggles if has subnav, navigates directly if no subnav) */}
                  <button
                    onClick={handleGroupClick}
                    className={`nav-item-pill ${hasActiveChild ? 'is-active' : ''}`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className={`${hasActiveChild ? 'text-emerald-600' : 'text-slate-500'} shrink-0`}>
                        {group.icon}
                      </span>
                      <span className={`text-[13px] truncate ${hasActiveChild ? 'text-emerald-700 font-bold' : 'text-slate-800 font-medium'}`}>
                        {lang === 'kh' ? group.titleKh : group.title}
                      </span>
                    </div>

                    {/* Only display arrow dropdown icon if this item actually has sub-navigation */}
                    {hasSubnav && (
                      <div className={`transition ml-2 shrink-0 ${hasActiveChild ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </div>
                    )}
                  </button>

                  {/* Group Items (only render dropdown if it has sub-navigation and is open) */}
                  {hasSubnav && !isCollapsed && (
                    <div className="pl-3 pr-1 py-1 space-y-1">
                      {group.items.map((item) => {
                        const isProductSubActive = (subTab?: string) => {
                          if (!subTab) return true;
                          if (productSubTab === subTab) return true;
                          if (subTab === 'catalog' && ['catalog', 'variants', 'types', 'barcodes'].includes(productSubTab)) return true;
                          if (subTab === 'attributes' && ['attributes', 'categories', 'brands', 'units'].includes(productSubTab)) return true;
                          if (subTab === 'pricing' && ['pricing', 'landed_cost', 'promotions'].includes(productSubTab)) return true;
                          if (subTab === 'tracking' && ['tracking', 'batches', 'serials', 'warranties'].includes(productSubTab)) return true;
                          if (subTab === 'manufacturing' && ['manufacturing', 'bom', 'bundles', 'qc', 'data', 'import_export', 'templates', 'audit_logs', 'returns', 'reviews'].includes(productSubTab)) return true;
                          return false;
                        };

                        const isDeliverySubActive = (subTab?: string) => {
                          if (!subTab) return true;
                          if (deliverySubTab === subTab) return true;
                          if (subTab === 'ORDERS' && ['ORDERS', 'ASSIGNMENT', 'TRACKING'].includes(deliverySubTab)) return true;
                          if (subTab === 'ROUTES' && ['ROUTES', 'TIMESLOTS'].includes(deliverySubTab)) return true;
                          if (subTab === 'FLEET' && ['STAFF', 'VEHICLES', 'FLEET'].includes(deliverySubTab)) return true;
                          if (subTab === 'ZONES' && ['ZONES', 'FEES', 'ADDRESSES'].includes(deliverySubTab)) return true;
                          if (subTab === 'FINANCE' && ['COD', 'POD', 'RETURNS', 'FINANCE'].includes(deliverySubTab)) return true;
                          if (subTab === 'SERVICE' && ['NOTIFICATIONS', 'SUPPORT', 'RATINGS', 'REPORTS', 'ANALYTICS', 'SERVICE'].includes(deliverySubTab)) return true;
                          return false;
                        };

                        const isSecuritySubActive = (subTab?: string) => {
                          if (!subTab) return true;
                          return securitySubTab === subTab;
                        };

                        const isBackupSubActive = (subTab?: string) => {
                          if (!subTab) return true;
                          return backupSubTab === subTab;
                        };

                        const isSettingsSubActive = (subTab?: string) => {
                          if (!subTab) return true;
                          return settingsSubTab === subTab;
                        };

                        const isActive =
                          item.tab === 'delivery'
                            ? activeTab === 'delivery' && isDeliverySubActive(item.subTab)
                            : item.tab === 'products'
                            ? activeTab === 'products' && isProductSubActive(item.subTab)
                            : item.tab === 'security'
                            ? activeTab === 'security' && isSecuritySubActive(item.subTab)
                            : item.tab === 'backup'
                            ? activeTab === 'backup' && isBackupSubActive(item.subTab)
                            : item.tab === 'settings'
                            ? activeTab === 'settings' && isSettingsSubActive(item.subTab)
                            : activeTab === item.tab;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelectTab(item.tab, item.subTab)}
                            className={`nav-subitem-pill ${isActive ? 'is-active' : ''}`}
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              <span
                                className={`shrink-0 transition ${
                                  isActive ? 'text-emerald-600' : 'text-slate-400'
                                }`}
                              >
                                {item.icon}
                              </span>
                              <span className="truncate text-[12px] font-medium">
                                {lang === 'kh' && item.nameKh ? item.nameKh : item.name}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                              {item.badge !== undefined && (typeof item.badge === 'number' ? item.badge > 0 : Boolean(item.badge)) && (
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
                                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white text-slate-400 border border-slate-200/60">
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

        {/* BOTTOM: User Profile & Brand Tagline */}
        <div className="p-3 border-t border-gray-200 bg-gray-50/50 space-y-2 shrink-0">
          {/* User Profile Card */}
          <div
            onClick={() => handleSelectTab('profile')}
            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
              activeTab === 'profile'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 shadow-xs'
            }`}
            title={lang === 'kh' ? 'មើលព័ត៌មានគណនី និងប្រវត្តិរូប' : 'View User Profile & Account'}
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                {currentUser?.first_name?.charAt(0) || 'L'}{currentUser?.last_name?.charAt(0) || 'A'}
              </div>
              <div className="leading-tight min-w-0">
                <span className="block text-xs font-bold text-gray-900 truncate">
                  {currentUser?.first_name || (lang === 'kh' ? 'ប្រធាន' : 'Lead')} {currentUser?.last_name || (lang === 'kh' ? 'គ្រប់គ្រង' : 'Admin')}
                </span>
                <span className="block text-[10px] text-emerald-600 font-semibold truncate">
                  {currentUser?.primary_role || (lang === 'kh' ? 'អភិបាលជាន់ខ្ពស់' : 'SuperAdministrator')}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
          </div>

          {/* Bottom Brand Tagline matching reference footer */}
          <div className="pt-2 border-t border-gray-200/70 flex items-center justify-center space-x-1.5 text-slate-400">
            <span className="text-[11px] font-bold text-slate-700">SmartPOS</span>
            <span className="text-[10px] text-slate-400">{lang === 'kh' ? '• រហ័ស • ងាយស្រួល • ទុកចិត្ត' : '• Fast • Simple • Reliable'}</span>
          </div>
        </div>
      </aside>
    </>
  );
};
