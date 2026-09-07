import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '../../foundation/i18n/translations';
import { getProducts, getCurrentShift, getUserProfile, getSystemSettings, logoutApi } from '../../data-access/posApi';
import { Product, CartItem, Sale, Shift, UserProfile, SystemSettings } from '../../foundation/types';

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
  | 'delivery'
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
  deliverySubTab: string;
  setDeliverySubTab: (subTab: string) => void;
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
  isScanBeepEnabled: boolean;
  toggleScanBeep: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('smartpos_lang') as Language) || 'en';
  });
  const setLang = (newLang: Language) => {
    localStorage.setItem('smartpos_lang', newLang);
    setLangState(newLang);
  };

  const [activeTab, setActiveTab] = useState<NavTab>('pos');
  const [deliverySubTab, setDeliverySubTab] = useState<string>('DASHBOARD');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('smartpos_sidebar_collapsed') === 'true';
  });
  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('smartpos_sidebar_collapsed', String(next));
      return next;
    });
  };

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const [isScanBeepEnabled, setIsScanBeepEnabled] = useState<boolean>(() => {
    return localStorage.getItem('smartpos_scan_beep') !== 'false';
  });
  const toggleScanBeep = () => {
    setIsScanBeepEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('smartpos_scan_beep', String(next));
      if (next) {
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.12);
          }
        } catch (e) {}
      }
      return next;
    });
  };

  // Current User Profile State & Auth Session (Managed via HttpOnly Session Cookie)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);

  const loginUser = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setIsLocked(false);
  };

  const logoutUser = () => {
    logoutApi().finally(() => {
      setCurrentUser(null);
      setIsAuthenticated(false);
      setIsLocked(false);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('smartpos_auth_user');
      localStorage.removeItem('smartpos_auth_logged_out');
    });
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
    const urlParams = new URLSearchParams(window.location.search);
    const hasOAuth = urlParams.has('oauth') || urlParams.has('token');

    setIsLoadingProfile(true);
    getUserProfile()
      .then((data) => {
        if (data && data.id) {
          setCurrentUser(data);
          setIsAuthenticated(true);

          // Route to Customer Portal or Staff POS based on role
          const roleCodes = data.roles?.map((r) => r.code?.toUpperCase()) || [];
          const hasStaffRole = roleCodes.some((code) =>
            ['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'CASHIER', 'STOCK_MANAGER', 'ACCOUNTANT', 'HR', 'EMPLOYEE'].includes(code)
          );
          const isCust = !hasStaffRole && (roleCodes.includes('CUSTOMER') || data.registration_source === 'public');
          setActiveTab(isCust ? 'dashboard' : 'pos');
        } else {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      })
      .catch((err) => {
        setCurrentUser(null);
        setIsAuthenticated(false);
      })
      .finally(() => {
        setIsLoadingProfile(false);
        if (hasOAuth) {
          window.history.replaceState({}, document.title, window.location.pathname || '/');
        }
      });
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
        deliverySubTab,
        setDeliverySubTab,
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
        isScanBeepEnabled,
        toggleScanBeep,
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
