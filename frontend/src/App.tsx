import React from 'react';
import { AppProvider, useApp } from './application/context/AppContext';
import { Navbar } from './presentation/components/Navbar';
import { SidebarNav } from './presentation/components/SidebarNav';
import { POSTerminal } from './features/pos/POSTerminal';
import { ProductCatalogView } from './features/products/ProductCatalogView';
import { DashboardView } from './features/dashboard/DashboardView';
import { SalesHistoryView } from './features/sales/SalesHistoryView';
import { InvoiceListView } from './features/invoices/InvoiceListView';
import { InventoryPortalView } from './features/inventory/InventoryPortalView';
import { PurchasingPortalView } from './features/purchasing/PurchasingPortalView';
import { ShiftManagementView } from './features/shifts/ShiftManagementView';
import { CustomerManagementView } from './features/customers/CustomerManagementView';
import { NotificationsView } from './features/notifications/NotificationsView';
import { SecurityAuditView } from './features/security/SecurityAuditView';
import { BackupManagementView } from './features/backup/BackupManagementView';
import { SettingsView } from './features/settings/SettingsView';
import { UserProfileView } from './features/profile/UserProfileView';

const MainContent: React.FC = () => {
  const { activeTab, isSidebarCollapsed } = useApp();

  return (
    <main
      className={`min-h-[calc(100vh-64px)] pb-12 transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
      }`}
    >
      {activeTab === 'pos' && <POSTerminal />}
      {activeTab === 'products' && <ProductCatalogView />}
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'sales' && <SalesHistoryView />}
      {activeTab === 'invoices' && <InvoiceListView />}
      {activeTab === 'inventory' && <InventoryPortalView />}
      {activeTab === 'purchases' && <PurchasingPortalView />}
      {activeTab === 'shifts' && <ShiftManagementView />}
      {activeTab === 'customers' && <CustomerManagementView />}
      {activeTab === 'notifications' && <NotificationsView />}
      {activeTab === 'security' && <SecurityAuditView />}
      {activeTab === 'backup' && <BackupManagementView />}
      {activeTab === 'settings' && <SettingsView />}
      {activeTab === 'profile' && <UserProfileView />}
    </main>
  );
};


export const App: React.FC = () => {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        <SidebarNav />
        <Navbar />
        <MainContent />
      </div>
    </AppProvider>
  );
};

export default App;
