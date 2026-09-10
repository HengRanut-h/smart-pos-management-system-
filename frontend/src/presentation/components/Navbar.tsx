import React from 'react';
import { useApp } from '../../application/context/AppContext';
import {
  Menu,
  ShoppingCart,
  Globe,
  Lock,
  LogOut,
  Keyboard,
  Volume2,
  VolumeX,
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
    logoutUser,
    lockSession,
    isScanBeepEnabled,
    toggleScanBeep,
  } = useApp();

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'pos':
        return t.posTerminal;
      case 'products':
        return t.productManagement || t.products;
      case 'shifts':
        return t.shifts || t.shiftsAndDrawer;
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
        return t.reports;
      case 'customers':
        return t.customers;
      case 'delivery':
        return t.delivery;
      case 'employees':
        return t.employees;
      case 'attendances':
        return t.attendances;
      case 'payroll':
        return t.payroll;
      case 'store-qr-codes':
        return t.storeQrCodes;
      case 'notifications':
        return t.notifications;
      case 'security':
        return t.security;
      case 'backup':
        return t.backup;
      case 'settings':
        return t.settings;
      case 'profile':
        return t.profile || t.userProfile;
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
        {/* Left: Sidebar Toggle Button & Active Page Title & Station Badge */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                toggleMobileDrawer();
              } else {
                toggleSidebarCollapse();
              }
            }}
            className="w-10 h-10 rounded-xl text-gray-700 bg-gray-50/80 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all flex items-center justify-center border border-gray-200 shadow-xs shrink-0 cursor-pointer"
            title={isSidebarCollapsed ? (lang === 'kh' ? 'ពង្រីករបាររុករក' : 'Expand Sidebar Navigation') : (lang === 'kh' ? 'បង្រួមរបាររុករក' : 'Collapse Sidebar Navigation')}
            aria-label="Toggle Sidebar Navigation"
          >
            <Menu className="w-5 h-5" strokeWidth={2.2} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center space-x-2 min-w-0">
              <h1 className="font-bold text-base text-gray-900 leading-tight truncate max-w-[150px] sm:max-w-xs md:max-w-none">{getPageTitle()}</h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 shrink-0">
                HQ-01
              </span>
            </div>
            <span className="text-[11px] text-gray-400 hidden sm:block truncate">{t.hqStation}</span>
          </div>
        </div>

        {/* Right: Quick Action Buttons, Status & Actions */}
        <div className="flex items-center space-x-2.5">
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

          {/* Quick POS Cart Access Button (shown on desktop, mobile has bottom bar) */}
          <button
            onClick={() => setActiveTab('pos')}
            className={`hidden lg:flex relative w-10 h-10 rounded-xl transition-all items-center justify-center border shadow-xs shrink-0 cursor-pointer ${
              activeTab === 'pos'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-200'
                : 'bg-gray-50/80 text-gray-700 border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700'
            }`}
            title={lang === 'kh' ? 'កន្រ្តកទំនិញ POS & គិតប្រាក់' : 'POS Cart & Checkout'}
            aria-label={lang === 'kh' ? 'កន្រ្តកទំនិញ POS' : 'POS Cart'}
          >
            <ShoppingCart className="w-5 h-5" strokeWidth={2.2} />
            {totalCartCount > 0 && (
              <span
                className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs ${
                  activeTab === 'pos'
                    ? 'bg-white text-emerald-700 ring-2 ring-emerald-600'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {totalCartCount}
              </span>
            )}
          </button>

          {/* Beep Sound Scan Toggle Button */}
          <button
            onClick={toggleScanBeep}
            className={`hidden sm:flex w-10 h-10 rounded-xl transition-all items-center justify-center border shadow-xs shrink-0 cursor-pointer ${
              isScanBeepEnabled
                ? 'bg-emerald-50/80 text-emerald-700 border-emerald-300 hover:bg-emerald-100/70 hover:border-emerald-400'
                : 'bg-gray-50/80 text-gray-400 border-gray-200 hover:bg-gray-100 hover:text-gray-600'
            }`}
            title={
              isScanBeepEnabled
                ? (lang === 'kh' ? 'សំឡេងស្កេនបាកូដ៖ បើក (ចុចដើម្បីបិទ)' : 'Beep Sound Scan: ON (Click to Mute / Test)')
                : (lang === 'kh' ? 'សំឡេងស្កេនបាកូដ៖ បិទ (ចុចដើម្បីបើក)' : 'Beep Sound Scan: MUTED (Click to Enable)')
            }
            aria-label={lang === 'kh' ? 'បិទ/បើកសំឡេងស្កេនបាកូដ' : 'Toggle Barcode Scan Beep Sound'}
          >
            {isScanBeepEnabled ? (
              <Volume2 className="w-5 h-5 text-emerald-600" strokeWidth={2.2} />
            ) : (
              <VolumeX className="w-5 h-5 text-gray-400" strokeWidth={2.2} />
            )}
          </button>

          {/* Keyboard Shortcuts Guide Button */}
          <button
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
            }}
            className="hidden md:flex w-10 h-10 rounded-xl text-gray-700 bg-gray-50/80 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all items-center justify-center border border-gray-200 shadow-xs shrink-0 cursor-pointer"
            title={lang === 'kh' ? 'ផ្លូវកាត់ក្ដារចុច (ចុច ?)' : 'Keyboard Shortcuts (Press ?)'}
            aria-label={lang === 'kh' ? 'ផ្លូវកាត់ក្ដារចុច' : 'Keyboard Shortcuts'}
          >
            <Keyboard className="w-5 h-5 text-emerald-600" strokeWidth={2.2} />
          </button>

          {/* Quick Logout */}
          <button
            onClick={logoutUser}
            className="w-10 h-10 rounded-xl text-gray-600 bg-gray-50/80 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all flex items-center justify-center border border-gray-200 shadow-xs shrink-0 cursor-pointer"
            title={lang === 'kh' ? 'ចាកចេញពីប្រព័ន្ធ' : 'Log Out of System'}
            aria-label={lang === 'kh' ? 'ចាកចេញ' : 'Log Out'}
          >
            <LogOut className="w-5 h-5" strokeWidth={2.2} />
          </button>
        </div>

      </div>
    </header>
  );
};
