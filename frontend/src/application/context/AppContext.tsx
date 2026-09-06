import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '../../foundation/i18n/translations';
import { Product, CartItem, Sale, Shift, UserProfile } from '../../foundation/types';
import { getProducts, getCurrentShift, getUserProfile } from '../../data-access/posApi';

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
  addToCart: (product: Product) => void;
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

  // Current User Profile State
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_USER);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

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

  useEffect(() => {
    refreshProducts();
    refreshShiftStatus();
    refreshUserProfile();
  }, []);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      const price = Number(product.selling_price);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * price,
                total_amount: (item.quantity + 1) * price,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unit_price: price,
          discount_amount: 0,
          tax_amount: 0,
          subtotal: price,
          total_amount: price,
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
