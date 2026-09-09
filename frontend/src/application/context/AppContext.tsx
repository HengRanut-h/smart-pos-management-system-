import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '../../foundation/i18n/translations';
import { getProducts, getCurrentShift, getUserProfile, getSystemSettings, logoutApi } from '../../data-access/posApi';
import { Product, CartItem, Sale, Shift, UserProfile, SystemSettings } from '../../foundation/types';

import { useNotification, NotificationMethods } from './NotificationContext';
import { ConfirmationModal } from '../../presentation/components/ConfirmationModal';

export interface ConfirmOptions {
  title?: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export type NavTab =
  | 'pos'
  | 'dashboard'
  | 'executive'
  | 'approvals'
  | 'reports'
  | 'products'
  | 'sales'
  | 'invoices'
  | 'invoice-designer'
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
  productSubTab: string;
  setProductSubTab: (subTab: string) => void;
  deliverySubTab: string;
  setDeliverySubTab: (subTab: string) => void;
  securitySubTab: string;
  setSecuritySubTab: (subTab: string) => void;
  backupSubTab: string;
  setBackupSubTab: (subTab: string) => void;
  settingsSubTab: string;
  setSettingsSubTab: (subTab: string) => void;
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
  notify: NotificationMethods;
  confirmAction: (options: ConfirmOptions) => Promise<boolean>;
  confirmDelete: (options?: Partial<ConfirmOptions> | string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { notify } = useNotification();
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('smartpos_lang') as Language) || 'en';
  });
  const setLang = (newLang: Language) => {
    localStorage.setItem('smartpos_lang', newLang);
    setLangState(newLang);
  };

  const [activeTab, setActiveTab] = useState<NavTab>('pos');
  const [productSubTab, setProductSubTab] = useState<string>('dashboard');
  const [deliverySubTab, setDeliverySubTab] = useState<string>('DASHBOARD');
  const [securitySubTab, setSecuritySubTab] = useState<string>('AUDIT_LOGS');
  const [backupSubTab, setBackupSubTab] = useState<string>('DASHBOARD');
  const [settingsSubTab, setSettingsSubTab] = useState<string>('SYSTEM');
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

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve?: (value: boolean) => void;
  }>({
    isOpen: false,
    options: { message: '' },
  });

  const confirmAction = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({
        isOpen: true,
        options,
        resolve,
      });
    });
  };

  const confirmDelete = (opts?: Partial<ConfirmOptions> | string): Promise<boolean> => {
    const isString = typeof opts === 'string';
    const message = isString
      ? opts
      : opts?.message || (lang === 'kh' ? 'តើអ្នកពិតជាចង់លុបទិន្នន័យនេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។' : 'Are you sure you want to delete this item? This action cannot be undone.');
    const title = !isString && opts?.title ? opts.title : (lang === 'kh' ? 'បញ្ជាក់ការលុប' : 'Confirm Delete');
    const confirmText = !isString && opts?.confirmText ? opts.confirmText : (lang === 'kh' ? 'យល់ព្រមលុប' : 'Yes, Delete');
    const cancelText = !isString && opts?.cancelText ? opts.cancelText : (lang === 'kh' ? 'បោះបង់' : 'Cancel');

    return confirmAction({
      title,
      message,
      confirmText,
      cancelText,
      variant: (!isString && opts?.variant) || 'danger',
    });
  };

  const handleConfirmAccept = () => {
    confirmDialog.resolve?.(true);
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirmClose = () => {
    confirmDialog.resolve?.(false);
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
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
        notify,
        confirmAction,
        confirmDelete,
      }}
    >
      {children}
      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        onClose={handleConfirmClose}
        onConfirm={handleConfirmAccept}
        title={confirmDialog.options.title}
        message={confirmDialog.options.message}
        confirmText={confirmDialog.options.confirmText}
        cancelText={confirmDialog.options.cancelText}
        variant={confirmDialog.options.variant}
      />
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
