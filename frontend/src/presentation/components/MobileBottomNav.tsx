import React from 'react';
import { useApp, NavTab } from '../../application/context/AppContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  CreditCard,
  Menu,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    cart,
    toggleMobileDrawer,
    lang,
  } = useApp();

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const navItems: Array<{
    id: 'dashboard' | 'pos' | 'products' | 'staff-badges' | 'menu';
    labelEn: string;
    labelKh: string;
    icon: React.ReactNode;
    action: () => void;
    isActive: boolean;
    badge?: number;
  }> = [
    {
      id: 'dashboard',
      labelEn: 'Home',
      labelKh: 'ទំព័រដើម',
      icon: <LayoutDashboard className="w-5 h-5" />,
      action: () => setActiveTab('dashboard'),
      isActive: activeTab === 'dashboard' || activeTab === 'executive',
    },
    {
      id: 'pos',
      labelEn: 'POS',
      labelKh: 'លក់ (POS)',
      icon: <ShoppingCart className="w-5 h-5" />,
      action: () => setActiveTab('pos'),
      isActive: activeTab === 'pos',
      badge: totalCartCount > 0 ? totalCartCount : undefined,
    },
    {
      id: 'products',
      labelEn: 'Catalog',
      labelKh: 'ទំនិញ',
      icon: <Package className="w-5 h-5" />,
      action: () => setActiveTab('products'),
      isActive: activeTab === 'products' || activeTab === 'inventory',
    },
    {
      id: 'staff-badges',
      labelEn: 'Badges',
      labelKh: 'កាតសម្គាល់',
      icon: <CreditCard className="w-5 h-5" />,
      action: () => setActiveTab('staff-badges'),
      isActive: activeTab === 'staff-badges' || activeTab === 'attendances',
    },
    {
      id: 'menu',
      labelEn: 'Menu',
      labelKh: 'ម៉ឺនុយ',
      icon: <Menu className="w-5 h-5" />,
      action: toggleMobileDrawer,
      isActive: false,
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-gray-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe transition-transform select-none"
    >
      <div className="grid grid-cols-5 h-14 items-center px-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = item.isActive;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`flex flex-col items-center justify-center h-full w-full py-1 relative transition-colors group cursor-pointer ${
                active ? 'text-emerald-700 font-bold' : 'text-gray-500 hover:text-gray-900 font-medium'
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-emerald-600 rounded-full" />
              )}

              <div className="relative flex items-center justify-center">
                <span className={`p-1 rounded-xl transition ${active ? 'bg-emerald-50 text-emerald-700' : ''}`}>
                  {item.icon}
                </span>

                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 bg-emerald-600 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center shadow-xs">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              <span className="text-[10px] tracking-tight truncate max-w-full px-1 mt-0.5">
                {lang === 'kh' ? item.labelKh : item.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
