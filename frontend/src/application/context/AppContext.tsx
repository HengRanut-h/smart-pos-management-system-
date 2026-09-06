import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '../../foundation/i18n/translations';
import { Product, CartItem, Sale, Shift, UserProfile, SystemSettings } from '../../foundation/types';
import { getProducts, getCurrentShift, getUserProfile, getSystemSettings } from '../../data-access/posApi';

export type NavTab =
  | 'pos'
  | 'dashboard'
  | 'reports'
  | 'products'
  | 'sales'
  | 'invoices'
  | 'inventory'
  | 'purchases'
  | 'shifts'
  | 'customers'
  | 'employees'
  | 'attendances'
  | 'store-qr-codes'
  | 'payroll'
  | 'notifications'
  | 'security'
  | 'backup'
  | 'settings'
  | 'profile';

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof translations['en'];
  products: Product[];
  isLoadingProducts: boolean;
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, qty: number) => void;
  clearCart: () => void;
  setCartItems: (items: CartItem[]) => void;
  cartSubtotal: number;
  cartTax: number;
  cartTotal: number;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  lastCompletedSale: Sale | null;
  setLastCompletedSale: (sale: Sale | null) => void;
  refreshProducts: () => void;
  isShiftOpen: boolean;
  activeShift: Shift | null;
  refreshShiftStatus: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebarCollapse: () => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
  toggleMobileDrawer: () => void;
  currentUser: UserProfile | null;
  isLoadingProfile: boolean;
  refreshUserProfile: () => void;
  storeSettings: SystemSettings | null;
  refreshStoreSettings: () => void;
  updateStoreSettingsState: (settings: SystemSettings) => void;
  isAuthenticated: boolean;
  isLocked: boolean;
  loginUser: (user: UserProfile) => void;
  logoutUser: () => void;
  lockSession: () => void;
  unlockSession: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const DEFAULT_USER: UserProfile = {
  id: 1,
  username: 'admin',
  email: 'admin@smartpos.com',
  phone: '012 345 678',
  first_name: 'Lead',
  last_name: 'Admin',
  full_name: 'Lead Admin',
  employee_code: 'EMP-001',
  branch: {
    id: 1,
    name: 'Phnom Penh Headquarters',
    code: 'HQ-01',
    address: 'Preah Monivong Blvd, Phnom Penh',
  },
  roles: [{ id: 1, name: 'Super Administrator', code: 'SUPER_ADMIN' }],
  primary_role: 'Super Administrator',
  permissions: ['ALL_PERMISSIONS'],
  status: 'ACTIVE',
  last_login_at: new Date().toISOString(),
  last_login_ip: '127.0.0.1',
  stats: {
    active_shift: null,
    today_sales_count: 0,
    today_sales_total: 0,
  },
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<NavTab>('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Current User Profile State & Auth Session
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('smartpos_auth_user');
      return saved ? JSON.parse(saved) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('smartpos_auth_logged_out') !== 'true';
  });
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const loginUser = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setIsLocked(false);
    localStorage.removeItem('smartpos_auth_logged_out');
    localStorage.setItem('smartpos_auth_user', JSON.stringify(user));
  };

  const logoutUser = () => {
    setIsAuthenticated(false);
    setIsLocked(false);
    localStorage.setItem('smartpos_auth_logged_out', 'true');
  };

  const lockSession = () => {
    setIsLocked(true);
  };

  const unlockSession = () => {
    setIsLocked(false);
  };

  // System Store Settings State with localStorage persistence
  const [storeSettings, setStoreSettings] = useState<SystemSettings | null>(() => {
    try {
      const saved = localStorage.getItem('smartpos_store_settings');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const t = translations[lang];

  const refreshProducts = () => {
    setIsLoadingProducts(true);
    getProducts()
      .then((data) => setProducts(data))
      .catch((err) => console.error('Failed to load products', err))
      .finally(() => setIsLoadingProducts(false));
  };

  const refreshShiftStatus = () => {
    getCurrentShift(1)
      .then((data) => {
        setActiveShift(data.active_shift);
      })
      .catch((err) => console.error('Failed to load shift', err));
  };

  const refreshUserProfile = () => {
    setIsLoadingProfile(true);
    getUserProfile()
      .then((data) => setCurrentUser(data))
      .catch((err) => {
        console.error('Failed to load user profile, using fallback', err);
      })
      .finally(() => setIsLoadingProfile(false));
  };

  const refreshStoreSettings = () => {
    getSystemSettings()
      .then((data) => {
        setStoreSettings(data);
        try {
          localStorage.setItem('smartpos_store_settings', JSON.stringify(data));
        } catch (e) {
          console.error('Failed to save store settings to localStorage', e);
        }
      })
      .catch((err) => {
        console.error('Failed to load store settings', err);
      });
  };

  const updateStoreSettingsState = (settings: SystemSettings) => {
    setStoreSettings(settings);
    try {
      localStorage.setItem('smartpos_store_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save store settings to localStorage', e);
    }
  };

  useEffect(() => {
    refreshProducts();
    refreshShiftStatus();
    refreshUserProfile();
    refreshStoreSettings();
  }, []);

  const addToCart = (product: Product, quantity: number = 1) => {
    const qtyToAdd = Math.max(1, quantity);
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      const price = Number(product.selling_price);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + qtyToAdd,
                subtotal: (item.quantity + qtyToAdd) * price,
                total_amount: (item.quantity + qtyToAdd) * price,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: qtyToAdd,
          unit_price: price,
          discount_amount: 0,
          tax_amount: 0,
          subtotal: price * qtyToAdd,
          total_amount: price * qtyToAdd,
        },
      ];
    });
  };

  const updateQuantity = (productId: number, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const sub = qty * item.unit_price;
          return { ...item, quantity: qty, subtotal: sub, total_amount: sub };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);
  const setCartItems = (items: CartItem[]) => setCart(items);

  const cartSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const cartTax = cartSubtotal * 0.1; // 10% VAT
  const cartTotal = cartSubtotal + cartTax;

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t,
        products,
        isLoadingProducts,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        setCartItems,
        cartSubtotal,
        cartTax,
        cartTotal,
        activeTab,
        setActiveTab,
        lastCompletedSale,
        setLastCompletedSale,
        refreshProducts,
        isShiftOpen: !!activeShift && activeShift.status === 'OPEN',
        activeShift,
        refreshShiftStatus,
        isSidebarCollapsed,
        toggleSidebarCollapse: () => setIsSidebarCollapsed((prev) => !prev),
        isMobileDrawerOpen,
        setIsMobileDrawerOpen,
        toggleMobileDrawer: () => setIsMobileDrawerOpen((prev) => !prev),
        currentUser,
        isLoadingProfile,
        refreshUserProfile,
        storeSettings,
        refreshStoreSettings,
        updateStoreSettingsState,
        isAuthenticated,
        isLocked,
        loginUser,
        logoutUser,
        lockSession,
        unlockSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
