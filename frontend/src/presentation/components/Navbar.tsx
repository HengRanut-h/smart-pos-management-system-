import React from 'react';
import { useApp } from '../../application/context/AppContext';
import {
  Menu,
  ShoppingCart,
  Globe,
  Lock,
  Keyboard,
} from 'lucide-react';

export const Navbar: React.FC = () => {
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
    toggleMobileDrawer,
    currentUser,
  } = useApp();

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'pos':
        return t.posTerminal;
      case 'products':
        return t.products || 'Product Catalog';
      case 'shifts':
        return t.shiftsAndDrawer || 'Shifts & Cash Drawer';
      case 'sales':
        return t.salesHistory;
      case 'invoices':
        return t.invoices;
      case 'inventory':
        return t.inventory;
      case 'purchases':
        return t.purchases;
      case 'dashboard':
        return t.dashboard;
      case 'reports':
        return 'Financial & Sales Reports Portal';
      case 'customers':
        return 'Customers & Loyalty';
      case 'employees':
        return 'Staff & Cashiers Directory';
      case 'notifications':
        return 'Notification Center';
      case 'security':
        return 'Security & Audit Trail';
      case 'backup':
        return 'Database Backup & Snapshots';
      case 'settings':
        return 'System & Station Settings';
      case 'profile':
        return t.userProfile || 'User Profile & Station';
      default:
        return 'SmartPOS';
    }
  };

  return (
    <header
      className={`bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs h-16 flex items-center select-none transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
      }`}
    >
      <div className="w-full px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Active Page Title & Station Badge (circled hamburger button removed) */}
        <div className="flex items-center space-x-3">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-base text-gray-900 leading-tight">{getPageTitle()}</h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                HQ-01
              </span>
            </div>
            <span className="text-[11px] text-gray-400 hidden sm:block">Phnom Penh Headquarters Station</span>
          </div>
        </div>

        {/* Right: Quick Action Buttons, User Profile Chip, Status & Menu Toggle on Far Right */}
        <div className="flex items-center space-x-2.5">
          {/* Quick POS Cart Access Button */}
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
              activeTab === 'pos'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cart</span>
            {totalCartCount > 0 && (
              <span className="bg-white text-emerald-700 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {totalCartCount}
              </span>
            )}
          </button>

          {/* Live Shift Pill */}
          <button
            onClick={() => setActiveTab('shifts')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              isShiftOpen
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
            }`}
          >
            {isShiftOpen ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="hidden sm:inline">{t.shiftOpen || 'Shift Open'}</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">{t.shiftClosed || 'Drawer Closed'}</span>
              </>
            )}
          </button>

          {/* User Profile Quick Chip */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-2 p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-bold transition border ${
              activeTab === 'profile'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                : 'bg-white border-gray-200/80 hover:bg-gray-50 text-gray-700 shadow-xs'
            }`}
            title="User Profile & Cashier Account"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
              {currentUser?.first_name?.charAt(0) || 'L'}{currentUser?.last_name?.charAt(0) || 'A'}
            </div>
            <div className="text-left hidden md:block leading-tight">
              <span className="block text-xs font-bold text-gray-900 truncate max-w-[90px]">
                {currentUser?.first_name || 'Lead'} {currentUser?.last_name || 'Admin'}
              </span>
              <span className="block text-[9px] text-emerald-600 font-semibold truncate max-w-[90px]">
                {currentUser?.primary_role || 'Admin'}
              </span>
            </div>
          </button>

          {/* Bilingual Switcher */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            <Globe className="w-3.5 h-3.5 text-gray-500 ml-1.5 mr-1" />
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 text-xs font-bold rounded-lg transition ${
                lang === 'en' ? 'bg-white shadow-xs text-emerald-700' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('kh')}
              className={`px-2 py-0.5 text-xs font-bold rounded-lg transition ${
                lang === 'kh' ? 'bg-white shadow-xs text-emerald-700' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              ខ្មែរ
            </button>
          </div>

          {/* Keyboard Shortcuts Guide Button */}
          <button
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
            }}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition flex items-center justify-center border border-gray-200/80 shadow-xs"
            title="Keyboard Shortcuts (Press ?)"
            aria-label="Keyboard Shortcuts"
          >
            <Keyboard className="w-4 h-4 text-emerald-600" />
          </button>
          {/* Remaining Menu Toggle Button Fixed on Far Right */}
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                toggleMobileDrawer();
              } else {
                toggleSidebarCollapse();
              }
            }}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition flex items-center justify-center ml-1 border border-gray-200/80 shadow-xs"
            title="Toggle Sidebar Navigation (Expand / Collapse)"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

      </div>
    </header>
  );
};
