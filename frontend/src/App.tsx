import React from 'react';
import { NotificationProvider } from './application/context/NotificationContext';
import { AppProvider, useApp } from './application/context/AppContext';
import { GlobalToastContainer } from './presentation/components/GlobalToastContainer';
import { Navbar } from './presentation/components/Navbar';
import { SidebarNav } from './presentation/components/SidebarNav';
import { POSTerminal } from './features/pos/POSTerminal';
import { ProductManagementHub } from './features/products/ProductManagementHub';
import { DashboardView } from './features/dashboard/DashboardView';
import { ReportsView } from './features/reports/ReportsView';
import { SalesHistoryView } from './features/sales/SalesHistoryView';
import { InvoiceListView } from './features/invoices/InvoiceListView';
import { InventoryPortalView } from './features/inventory/InventoryPortalView';
import { PurchasingPortalView } from './features/purchasing/PurchasingPortalView';
import { ShiftManagementView } from './features/shifts/ShiftManagementView';
import { CustomerManagementView } from './features/customers/CustomerManagementView';
import { EmployeeManagementView } from './features/employees/EmployeeManagementView';
import { AttendanceKioskView } from './features/employees/AttendanceKioskView';
import { StoreQrManagementView } from './features/employees/StoreQrManagementView';
import { StaffPayrollView } from './features/employees/StaffPayrollView';
import { NotificationsView } from './features/notifications/NotificationsView';
import { SecurityAuditView } from './features/security/SecurityAuditView';
import { BackupManagementView } from './features/backup/BackupManagementView';
import { SettingsView } from './features/settings/SettingsView';
import { UserProfileView } from './features/profile/UserProfileView';
import { DeliveryManagementView } from './features/delivery/DeliveryManagementView';
import { CustomerFacingDisplay } from './features/pos/CustomerFacingDisplay';
import { KeyboardShortcutsModal } from './presentation/components/KeyboardShortcutsModal';
import { LoginView } from './features/auth/LoginView';

const MainContent: React.FC = () => {
  const { activeTab, isSidebarCollapsed } = useApp();

  return (
    <main
      className={`min-h-[calc(100vh-64px)] pb-12 transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
      }`}
    >
      {activeTab === 'pos' && <POSTerminal />}
      {activeTab === 'products' && <ProductManagementHub />}
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'reports' && <ReportsView />}
      {activeTab === 'sales' && <SalesHistoryView />}
      {activeTab === 'invoices' && <InvoiceListView />}
      {activeTab === 'inventory' && <InventoryPortalView />}
      {activeTab === 'purchases' && <PurchasingPortalView />}
      {activeTab === 'shifts' && <ShiftManagementView />}
      {activeTab === 'customers' && <CustomerManagementView />}
      {activeTab === 'delivery' && <DeliveryManagementView />}
      {activeTab === 'employees' && <EmployeeManagementView />}
      {activeTab === 'attendances' && <AttendanceKioskView />}
      {activeTab === 'store-qr-codes' && <StoreQrManagementView />}
      {activeTab === 'payroll' && <StaffPayrollView />}
      {activeTab === 'notifications' && <NotificationsView />}
      {activeTab === 'security' && <SecurityAuditView />}
      {activeTab === 'backup' && <BackupManagementView />}
      {activeTab === 'settings' && <SettingsView />}
      {activeTab === 'profile' && <UserProfileView />}
    </main>
  );
};

const AppShellContent: React.FC = () => {
  const { isAuthenticated, isLocked } = useApp();

  if (!isAuthenticated || isLocked) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col relative">
      <SidebarNav />
      <Navbar />
      <MainContent />
    </div>
  );
};

const AppShell: React.FC = () => {
  const { setActiveTab } = useApp();
  const [isShortcutsOpen, setIsShortcutsOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input, textarea or select
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      if (!isInput && e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      if (e.key === 'Escape') {
        setIsShortcutsOpen(false);
        return;
      }

      // F1 - F12 keys
      switch (e.key) {
        case 'F1':
          e.preventDefault();
          setActiveTab('pos');
          break;
        case 'F2':
          e.preventDefault();
          setActiveTab('shifts');
          break;
        case 'F3':
          e.preventDefault();
          setActiveTab('sales');
          break;
        case 'F4':
          e.preventDefault();
          setActiveTab('invoices');
          break;
        case 'F5':
          e.preventDefault();
          setActiveTab('inventory');
          break;
        case 'F6':
          e.preventDefault();
          setActiveTab('purchases');
          break;
        case 'F7':
          e.preventDefault();
          setActiveTab('dashboard');
          break;
        case 'F8':
          e.preventDefault();
          setActiveTab('customers');
          break;
        case 'F9':
          e.preventDefault();
          setActiveTab('notifications');
          break;
        case 'F10':
          e.preventDefault();
          setActiveTab('security');
          break;
        case 'F11':
          e.preventDefault();
          setActiveTab('backup');
          break;
        case 'F12':
          e.preventDefault();
          setActiveTab('settings');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab]);

  return (
    <>
      <AppShellContent />
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </>
  );
};

export const App: React.FC = () => {
  const isCustomerDisplay =
    typeof window !== 'undefined' &&
    (window.location.search.includes('display=customer') ||
      window.location.pathname.includes('customer-display'));

  if (isCustomerDisplay) {
    return <CustomerFacingDisplay />;
  }

  return (
    <NotificationProvider>
      <GlobalToastContainer />
      <AppProvider>
        <AppShell />
      </AppProvider>
    </NotificationProvider>
  );
};

export default App;
