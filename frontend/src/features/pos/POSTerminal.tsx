import { SmartPosLogo } from '../../presentation/components/SmartPosLogo';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../application/context/AppContext';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  QrCode,
  DollarSign,
  Users,
  UserCheck,
  Award,
  X,
  RefreshCw,
  Wifi,
  WifiOff,
  Star,
  Receipt,
  Printer,
  Tag,
  Barcode,
  ScanBarcode,
  Volume2,
  PauseCircle,
  PlayCircle,
  Clock,
  CreditCard,
  Percent,
  Layers,
  Monitor,
  Package,
  ShoppingCart,
  Coins,
  Truck,
  MapPin,
  Calendar,
  Navigation,
} from 'lucide-react';
import { Customer, Product } from '../../foundation/types';
import { DeliveryZone, DeliveryTimeSlot } from '../../foundation/types/delivery';
import {
  completeSale,
  generateKHQR,
  getCustomers,
  createCustomer,
  validateCoupon,
} from '../../data-access/posApi';
import {
  getDeliveryZones,
  getDeliveryTimeSlots,
  generateDeliveryFromSale,
} from '../../data-access/deliveryApi';
import { ThermalReceiptModal } from '../../presentation/components/ThermalReceiptModal';
import { BarcodeScannerModal } from './BarcodeScannerModal';

export const POSTerminal: React.FC = () => {
  const {
    t,
    lang,
    products,
    isLoadingProducts,
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    setCartItems,
    cartSubtotal,
    cartTax,
    cartTotal,
    setLastCompletedSale,
    isScanBeepEnabled,
  } = useApp();

  const exchangeRate = 4100; // 1 USD = 4,100 KHR standard retail rate

  const [search, setSearch] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'KHQR'>('CASH');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [cashCurrency, setCashCurrency] = useState<'USD' | 'KHR'>('USD');
  const [cashReceivedKhr, setCashReceivedKhr] = useState<number>(0);
  const [khqrData, setKhqrData] = useState<{ qr_string: string; md5: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSuccess, setCompletedSuccess] = useState<any>(null);
  const [showThermalReceipt, setShowThermalReceipt] = useState(false);
  // Held Orders / Parked Carts State
  const [heldOrders, setHeldOrders] = useState<Array<{
    id: string;
    timestamp: number;
    items: typeof cart;
    customer: Customer | null;
    notes?: string;
    total: number;
  }>>(() => {
    try {
      const saved = localStorage.getItem('smartpos_held_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isHeldOrdersModalOpen, setIsHeldOrdersModalOpen] = useState(false);
  const [isHoldConfirmOpen, setIsHoldConfirmOpen] = useState(false);
  const [holdOrderNote, setHoldOrderNote] = useState('');

  // Manual Discount State
  const [manualDiscount, setManualDiscount] = useState<{
    type: 'PERCENT' | 'FIXED';
    value: number;
    amount: number;
    reason: string;
  } | null>(null);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountInputVal, setDiscountInputVal] = useState<number>(10);
  const [discountInputType, setDiscountInputType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [discountReason, setDiscountReason] = useState<string>('Manager Approval');

  // Split Payment (Multi-Tender) State
  const [checkoutMode, setCheckoutMode] = useState<'SINGLE' | 'SPLIT'>('SINGLE');
  const [splitCashUsd, setSplitCashUsd] = useState<number>(0);
  const [splitCashKhr, setSplitCashKhr] = useState<number>(0);
  const [splitKhqr, setSplitKhqr] = useState<number>(0);
  const [splitCard, setSplitCard] = useState<number>(0);
  const [splitKhqrData, setSplitKhqrData] = useState<{ qr_string: string; md5: string } | null>(null);


  // Barcode Scanner & Notification State
  const [scannedNotification, setScannedNotification] = useState<string | null>(null);
  const [isBarcodeScannerModalOpen, setIsBarcodeScannerModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Customer Loyalty State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({ name: '', phone: '', email: '' });

  // Points Redemption State
  const [isRedeemingPoints, setIsRedeemingPoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);

  // Coupon / Promo Code State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    name: string;
    discount_amount: number;
    discount_type: string;
    discount_value: number;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Offline Sync Queue State
  const [offlineQueue, setOfflineQueue] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('smartpos_offline_sales');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');

  // Delivery Dispatch State
  const [isDeliveryRequested, setIsDeliveryRequested] = useState<boolean>(false);
  const [deliveryRecipientName, setDeliveryRecipientName] = useState<string>('');
  const [deliveryRecipientPhone, setDeliveryRecipientPhone] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [deliveryZoneId, setDeliveryZoneId] = useState<number | undefined>(undefined);
  const [deliveryTimeSlotId, setDeliveryTimeSlotId] = useState<number | undefined>(undefined);
  const [deliveryPriority, setDeliveryPriority] = useState<'STANDARD' | 'EXPRESS' | 'URGENT'>('STANDARD');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [deliveryTimeSlots, setDeliveryTimeSlots] = useState<DeliveryTimeSlot[]>([]);

  // Load Delivery Zones & Time Slots
  useEffect(() => {
    getDeliveryZones().then((res) => {
      if (res.success && res.zones) {
        setDeliveryZones(res.zones);
        if (res.zones.length > 0) {
          setDeliveryZoneId((prev) => prev ?? res.zones[0].id);
        }
      }
    }).catch((err) => console.error('Failed to load delivery zones', err));

    getDeliveryTimeSlots().then((res) => {
      if (res.success && res.data) {
        setDeliveryTimeSlots(res.data);
        if (res.data.length > 0) {
          setDeliveryTimeSlotId((prev) => prev ?? res.data[0].id);
        }
      }
    }).catch((err) => console.error('Failed to load time slots', err));
  }, []);

  // Prefill delivery info when customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      setDeliveryRecipientName(selectedCustomer.name || '');
      if (selectedCustomer.phone) setDeliveryRecipientPhone(selectedCustomer.phone);
      if (selectedCustomer.address) setDeliveryAddress(selectedCustomer.address);
    }
  }, [selectedCustomer]);

  const [selectedPosCategory, setSelectedPosCategory] = useState<string>('ALL');

  // Compute unique categories from products
  const uniqueCategories = useMemo(() => {
    const map = new Map<number, string>();
    products.forEach((p) => {
      if (p.category?.id && p.category?.name) {
        map.set(p.category.id, p.category.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat =
        selectedPosCategory === 'ALL' || String(p.category?.id) === selectedPosCategory;
      const term = search.toLowerCase();
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        (p.barcode && p.barcode.toLowerCase().includes(term));
      return matchesCat && matchesSearch;
    });
  }, [products, selectedPosCategory, search]);



  // Cash Register / Success Chime Sound
  const playRegisterChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      // High bell tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Secondary chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1320, now + 0.08);
      osc2.frequency.exponentialRampToValueAtTime(2640, now + 0.35);
      gain2.gain.setValueAtTime(0.25, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.45);
    } catch (e) {}
  };

  // Audio Beep for Barcode Scanning
  const playScanBeep = () => {
    if (isScanBeepEnabled === false) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  // Global Hardware Barcode Scanner Listener
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      // Quick hotkey to toggle Barcode Scanner Hub (F9 or Alt+S)
      if ((e.key === 'F9' || (e.altKey && (e.key === 's' || e.key === 'S'))) && !isInput) {
        e.preventDefault();
        setIsBarcodeScannerModalOpen((prev) => !prev);
        return;
      }

      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 2) {
          let raw = barcodeBuffer.trim();
          let qty = 1;
          if (raw.includes('*')) {
            const parts = raw.split('*');
            const parsedQty = parseInt(parts[0], 10);
            if (!isNaN(parsedQty) && parsedQty > 0) {
              qty = parsedQty;
              raw = parts.slice(1).join('*').trim();
            }
          }
          const code = raw.toLowerCase();
          const matched = products.find(
            (p) =>
              p.sku.toLowerCase() === code ||
              (p.barcode && p.barcode.toLowerCase() === code) ||
              p.name.toLowerCase() === code ||
              p.name.toLowerCase().includes(code)
          );

          if (matched) {
            addToCart(matched, qty);
            playScanBeep();
            setScannedNotification(`Scanned: ${qty > 1 ? `${qty}x ` : ''}${matched.name} (${matched.barcode || matched.sku})`);
            setTimeout(() => setScannedNotification(null), 2500);
            barcodeBuffer = '';
            e.preventDefault();
            return;
          }
        }
        barcodeBuffer = '';
        return;
      }

      // Barcode scanners trigger keys rapidly (<60ms)
      if (!isInput || timeDiff < 60) {
        if (e.key.length === 1) {
          if (timeDiff > 250 && !isInput) {
            barcodeBuffer = '';
          }
          barcodeBuffer += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, addToCart]);

  // Load customers when modal opens or search changes
  useEffect(() => {
    if (isCustomerModalOpen) {
      setIsLoadingCustomers(true);
      getCustomers(customerSearch)
        .then((res) => setCustomerList(res))
        .catch((err) => console.error('Failed to load customers', err))
        .finally(() => setIsLoadingCustomers(false));
    }
  }, [isCustomerModalOpen, customerSearch]);


  // Save held orders to localStorage
  const saveHeldOrders = (list: typeof heldOrders) => {
    setHeldOrders(list);
    try {
      localStorage.setItem('smartpos_held_orders', JSON.stringify(list));
    } catch {}
  };

  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    const newHold = {
      id: `HOLD-${Date.now().toString().slice(-6)}`,
      timestamp: Date.now(),
      items: [...cart],
      customer: selectedCustomer,
      notes: holdOrderNote.trim() || 'Held Customer Cart',
      total: finalPayableTotal,
    };
    const updated = [newHold, ...heldOrders];
    saveHeldOrders(updated);
    clearCart();
    setSelectedCustomer(null);
    setHoldOrderNote('');
    setIsHoldConfirmOpen(false);
    playScanBeep();
    setScannedNotification(`Order #${newHold.id} parked safely`);
    setTimeout(() => setScannedNotification(null), 2500);
  };

  const handleResumeHeldOrder = (held: typeof heldOrders[0]) => {
    if (cart.length > 0) {
      if (!confirm('Current active cart has items. Replace with this held order?')) {
        return;
      }
    }
    setCartItems(held.items);
    setSelectedCustomer(held.customer);
    const remaining = heldOrders.filter((h) => h.id !== held.id);
    saveHeldOrders(remaining);
    setIsHeldOrdersModalOpen(false);
    playScanBeep();
    setScannedNotification(`Order #${held.id} resumed!`);
    setTimeout(() => setScannedNotification(null), 2500);
  };

  const handleDiscardHeldOrder = (heldId: string) => {
    if (confirm('Are you sure you want to discard this parked order?')) {
      const remaining = heldOrders.filter((h) => h.id !== heldId);
      saveHeldOrders(remaining);
    }
  };

  // Manual Discount Calculator
  const manualDiscountAmount = useMemo(() => {
    if (!manualDiscount) return 0;
    if (manualDiscount.type === 'PERCENT') {
      return Math.round((cartSubtotal * (manualDiscount.value / 100)) * 100) / 100;
    }
    return Math.min(cartSubtotal, manualDiscount.value);
  }, [manualDiscount, cartSubtotal]);

  const handleApplyManualDiscount = () => {
    const val = Number(discountInputVal) || 0;
    if (val <= 0) return;
    const calculated = discountInputType === 'PERCENT'
      ? Math.round((cartSubtotal * (val / 100)) * 100) / 100
      : Math.min(cartSubtotal, val);

    setManualDiscount({
      type: discountInputType,
      value: val,
      amount: calculated,
      reason: discountReason,
    });
    setIsDiscountModalOpen(false);
  };

  const getTier = (points: number | string) => {
    const pts = Number(points) || 0;
    if (pts >= 2000) return { name: 'Platinum', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '💎' };
    if (pts >= 1000) return { name: 'Gold', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: '⭐' };
    if (pts >= 500) return { name: 'Silver', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: '🥈' };
    return { name: 'Bronze', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '🥉' };
  };

  // Calculate discount from redeemed points (100 pts = $1.00 USD)
  const maxRedeemablePoints = selectedCustomer
    ? Math.min(
        Number(selectedCustomer.loyalty_points) || 0,
        Math.floor(cartTotal * 100)
      )
    : 0;

  const pointsDiscount = isRedeemingPoints ? Math.round(pointsToRedeem) / 100 : 0;
  const couponDiscount = appliedCoupon ? appliedCoupon.discount_amount : 0;

  // Calculate delivery fee
  const currentDeliveryFee = useMemo(() => {
    if (!isDeliveryRequested) return 0;
    const zone = deliveryZones.find((z) => z.id === deliveryZoneId);
    let fee = zone ? Number(zone.base_delivery_fee) : 1.5;
    if (deliveryPriority === 'EXPRESS') fee += 1.0;
    if (deliveryPriority === 'URGENT') fee += 2.5;
    return Math.round(fee * 100) / 100;
  }, [isDeliveryRequested, deliveryZoneId, deliveryZones, deliveryPriority]);

  const finalPayableTotal = Math.max(
    0,
    cartTotal - pointsDiscount - couponDiscount - manualDiscountAmount + currentDeliveryFee
  );
  const finalPayableTotalKhr = Math.round(finalPayableTotal * exchangeRate);

  // Customer-Facing Display Sync (BroadcastChannel & localStorage)
  useEffect(() => {
    try {
      const payload = {
        items: cart.map((i) => ({
          product: {
            id: i.product.id,
            name: i.product.name,
            sku: i.product.sku,
            barcode: i.product.barcode,
            selling_price: i.product.selling_price,
            image_url: i.product.image_url,
            unit: i.product.unit,
          },
          quantity: i.quantity,
          unit_price: i.unit_price,
          subtotal: i.subtotal,
        })),
        subtotal: cartSubtotal,
        tax: cartTax,
        discount: (manualDiscount?.amount || 0) + (appliedCoupon?.discount_amount || 0) + (isRedeemingPoints ? pointsToRedeem / 100 : 0),
        deliveryFee: currentDeliveryFee,
        isDeliveryRequested,
        total: finalPayableTotal,
        totalKhr: finalPayableTotalKhr,
        isCheckoutOpen,
        khqrData,
        completedSuccess,
        customer: selectedCustomer,
      };

      localStorage.setItem('smartpos_customer_display_state', JSON.stringify(payload));

      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('smartpos_customer_display');
        channel.postMessage({ type: 'UPDATE_CART', payload });
        channel.close();
      }
    } catch (err) {
      console.error('Failed to sync Customer Display', err);
    }
  }, [
    cart,
    cartSubtotal,
    cartTax,
    currentDeliveryFee,
    isDeliveryRequested,
    finalPayableTotal,
    finalPayableTotalKhr,
    isCheckoutOpen,
    khqrData,
    completedSuccess,
    selectedCustomer,
    manualDiscount,
    appliedCoupon,
    isRedeemingPoints,
    pointsToRedeem,
  ]);

  // Handle applying coupon code
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError(null);

    const code = couponInput.trim().toUpperCase();

    try {
      const res = await validateCoupon(code, cartSubtotal);
      if (res.valid) {
        setAppliedCoupon({
          code: res.code,
          name: res.name,
          discount_amount: res.discount_amount,
          discount_type: res.discount_type,
          discount_value: res.discount_value,
        });
        setCouponInput('');
      } else {
        setCouponError(res.message || 'Invalid coupon code');
      }
    } catch (err: any) {
      // Local fallback for offline simulation
      if (code === 'WELCOME10') {
        const disc = Math.min(20, Math.round(cartSubtotal * 0.1 * 100) / 100);
        setAppliedCoupon({
          code: 'WELCOME10',
          name: 'Welcome 10% Off',
          discount_amount: disc,
          discount_type: 'PERCENTAGE',
          discount_value: 10,
        });
        setCouponInput('');
      } else if (code === 'SMARTPOS5' && cartSubtotal >= 20) {
        setAppliedCoupon({
          code: 'SMARTPOS5',
          name: 'SmartPOS $5 Voucher',
          discount_amount: 5,
          discount_type: 'FIXED',
          discount_value: 5,
        });
        setCouponInput('');
      } else if (code === 'VIP20' && cartSubtotal >= 30) {
        const disc = Math.min(50, Math.round(cartSubtotal * 0.2 * 100) / 100);
        setAppliedCoupon({
          code: 'VIP20',
          name: 'VIP 20% Off',
          discount_amount: disc,
          discount_type: 'PERCENTAGE',
          discount_value: 20,
        });
        setCouponInput('');
      } else {
        setCouponError(err.response?.data?.message || 'Invalid coupon or spend minimum unmet.');
      }
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const handleOpenCheckout = async () => {
    setIsRedeemingPoints(false);
    setPointsToRedeem(0);
    setCashCurrency('USD');
    setCashReceived(Math.ceil(finalPayableTotal));
    setCashReceivedKhr(Math.ceil(finalPayableTotalKhr / 1000) * 1000);
    setCheckoutMode('SINGLE');
    setSplitCashUsd(0);
    setSplitCashKhr(0);
    setSplitKhqr(0);
    setSplitCard(0);
    setSplitKhqrData(null);
    setIsCheckoutOpen(true);
    setCompletedSuccess(null);

    if (paymentMethod === 'KHQR') {
      try {
        const qr = await generateKHQR('BILL-' + Date.now(), finalPayableTotal);
        setKhqrData(qr);
      } catch (err) {
        console.error('Failed to generate KHQR', err);
      }
    }
  };

  const handleToggleRedeem = (checked: boolean) => {
    setIsRedeemingPoints(checked);
    if (checked) {
      setPointsToRedeem(maxRedeemablePoints);
      const newTotal = Math.max(0, cartTotal - maxRedeemablePoints / 100 - couponDiscount);
      setCashReceived(Math.ceil(newTotal));
      setCashReceivedKhr(Math.ceil((newTotal * exchangeRate) / 1000) * 1000);
    } else {
      setPointsToRedeem(0);
      const newTotal = Math.max(0, cartTotal - couponDiscount);
      setCashReceived(Math.ceil(newTotal));
      setCashReceivedKhr(Math.ceil((newTotal * exchangeRate) / 1000) * 1000);
    }
  };

  const handlePointsChange = (val: number) => {
    const clamped = Math.max(0, Math.min(maxRedeemablePoints, val));
    setPointsToRedeem(clamped);
    const newTotal = Math.max(0, cartTotal - clamped / 100 - couponDiscount);
    setCashReceived(Math.ceil(newTotal));
    setCashReceivedKhr(Math.ceil((newTotal * exchangeRate) / 1000) * 1000);
  };

  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddForm.name.trim()) return;
    try {
      const newCust = await createCustomer(quickAddForm);
      setSelectedCustomer(newCust);
      setIsQuickAddOpen(false);
      setIsCustomerModalOpen(false);
      setQuickAddForm({ name: '', phone: '', email: '' });
    } catch (err) {
      console.error('Failed to create customer', err);
      alert('Failed to register customer');
    }
  };

  // Convert cash received to USD equivalent for validation and saving
  const effectiveCashReceivedUsd =
    cashCurrency === 'USD' ? Number(cashReceived) : Number(cashReceivedKhr) / exchangeRate;

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    let paidAmountUsd = finalPayableTotal;
    let changeUsd = 0;
    let paymentMethodId = 1; // Cash default
    let paymentNotes = '';

    if (checkoutMode === 'SPLIT') {
      const splitTotal = splitCashUsd + (splitCashKhr / exchangeRate) + splitKhqr + splitCard;
      paidAmountUsd = splitTotal;
      changeUsd = Math.max(0, splitTotal - finalPayableTotal);
      paymentMethodId = splitKhqr > 0 ? 3 : (splitCard > 0 ? 2 : 1);
      paymentNotes = `Split Tender: Cash $${(splitCashUsd + (splitCashKhr / exchangeRate)).toFixed(2)}, KHQR $${splitKhqr.toFixed(2)}, Card $${splitCard.toFixed(2)}`;
    } else {
      paidAmountUsd = paymentMethod === 'CASH' ? effectiveCashReceivedUsd : finalPayableTotal;
      changeUsd = Math.max(0, paidAmountUsd - finalPayableTotal);
      paymentMethodId = paymentMethod === 'KHQR' ? 3 : 1;
    }

    const payload = {
      branch_id: 1,
      warehouse_id: 1,
      customer_id: selectedCustomer?.id || null,
      points_redeemed: isRedeemingPoints ? pointsToRedeem : 0,
      coupon_code: appliedCoupon ? appliedCoupon.code : null,
      items: cart.map((item) => ({
        product_id: item.product.id,
        unit_id: item.product.unit?.id || 1,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: 0,
        tax_rate: 0.1,
        tax_amount: item.subtotal * 0.1,
      })),
      payment: {
        payment_method_id: paymentMethod === 'CASH' ? 1 : 2,
        amount: paidAmountUsd,
        currency: cashCurrency,
        reference_number: paymentMethod === 'KHQR' ? khqrData?.md5 : null,
      },
      notes: `SmartPOS Checkout - Customer: ${selectedCustomer?.name || 'Walk-in'}`,
    };

    try {
      const sale = await completeSale(payload);
      setLastCompletedSale(sale);

      let createdDelivery = null;
      if (isDeliveryRequested && sale?.id) {
        try {
          const delRes = await generateDeliveryFromSale({
            sale_id: sale.id,
            recipient_name: deliveryRecipientName || selectedCustomer?.name || 'Walk-in Customer',
            recipient_phone: deliveryRecipientPhone || selectedCustomer?.phone || '012345678',
            delivery_address: deliveryAddress || 'Store Pickup / Address to be confirmed',
            zone_id: deliveryZoneId,
            time_slot_id: deliveryTimeSlotId,
            delivery_fee: currentDeliveryFee,
            priority: deliveryPriority,
            notes: deliveryNotes,
            payment_type: paymentMethod === 'CASH' ? 'COD' : 'PREPAID',
          });
          createdDelivery = delRes?.delivery || null;
        } catch (delErr) {
          console.error('Failed to auto-generate delivery from sale', delErr);
        }
      }

      setCompletedSuccess({
        ...sale,
        items: cart.map((i) => ({
          product_id: i.product.id,
          product: i.product,
          name: i.product.name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          total_amount: i.unit_price * i.quantity,
        })),
        pointsRedeemed: isRedeemingPoints ? pointsToRedeem : 0,
        pointsEarned: Math.floor(finalPayableTotal),
        customer: selectedCustomer,
        coupon: appliedCoupon,
        cashCurrency,
        paid_amount: paidAmountUsd,
        change_amount: changeUsd,
        delivery: createdDelivery,
        isDeliveryRequested,
        deliveryFee: currentDeliveryFee,
      });
      clearCart();
      setSelectedCustomer(null);
      setAppliedCoupon(null);
      setIsCheckoutOpen(false);
      setIsDeliveryRequested(false);
      setDeliveryRecipientName('');
      setDeliveryRecipientPhone('');
      setDeliveryAddress('');
      setDeliveryNotes('');
    } catch (err: any) {
      // Offline fallback: Queue sale in local storage
      const queuedSale = {
        ...payload,
        items: cart.map((i) => ({
          product_id: i.product.id,
          product: i.product,
          name: i.product.name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          total_amount: i.unit_price * i.quantity,
        })),
        queued_at: new Date().toISOString(),
        local_id: 'OFFLINE-' + Date.now(),
        isDeliveryRequested,
        deliveryFee: currentDeliveryFee,
        deliveryRecipientName,
        deliveryRecipientPhone,
        deliveryAddress,
      };
      const updatedQueue = [...offlineQueue, queuedSale];
      setOfflineQueue(updatedQueue);
      localStorage.setItem('smartpos_offline_sales', JSON.stringify(updatedQueue));

      setCompletedSuccess({
        sale_number: queuedSale.local_id,
        items: queuedSale.items,
        total_amount: finalPayableTotal,
        subtotal: cartSubtotal,
        tax_amount: cartTax,
        discount_amount: pointsDiscount + couponDiscount,
        paid_amount: paidAmountUsd,
        change_amount: changeUsd,
        offline: true,
        pointsRedeemed: isRedeemingPoints ? pointsToRedeem : 0,
        pointsEarned: Math.floor(finalPayableTotal),
        customer: selectedCustomer,
        coupon: appliedCoupon,
        cashCurrency,
        delivery: isDeliveryRequested ? {
          delivery_number: 'DEL-OFFLINE-' + Date.now().toString().slice(-4),
          recipient_name: deliveryRecipientName || selectedCustomer?.name || 'Customer',
          recipient_phone: deliveryRecipientPhone || selectedCustomer?.phone || '',
          delivery_address: deliveryAddress || 'Offline Delivery',
          status: 'PENDING_OFFLINE',
          priority: deliveryPriority,
        } : null,
        isDeliveryRequested,
        deliveryFee: currentDeliveryFee,
      });
      clearCart();
      setSelectedCustomer(null);
      setAppliedCoupon(null);
      setIsCheckoutOpen(false);
      setIsDeliveryRequested(false);
      setDeliveryRecipientName('');
      setDeliveryRecipientPhone('');
      setDeliveryAddress('');
      setDeliveryNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncOfflineSales = async () => {
    if (offlineQueue.length === 0 || isSyncingOffline) return;
    setIsSyncingOffline(true);
    let remaining = [...offlineQueue];
    try {
      for (const sale of offlineQueue) {
        await completeSale({
          branch_id: sale.branch_id,
          warehouse_id: sale.warehouse_id,
          customer_id: sale.customer_id,
          points_redeemed: sale.points_redeemed,
          coupon_code: sale.coupon_code,
          items: sale.items,
          payment: sale.payment,
          notes: sale.notes,
        });
        remaining = remaining.filter((s) => s.local_id !== sale.local_id);
      }
      setOfflineQueue(remaining);
      localStorage.setItem('smartpos_offline_sales', JSON.stringify(remaining));
      alert('Offline sales synced successfully!');
    } catch (err) {
      console.error('Failed to sync offline sales', err);
      alert('Some sales could not be synced. Will retry when connection stabilizes.');
    } finally {
      setIsSyncingOffline(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] relative">
      {/* Floating Barcode Scanner Toast */}
      {scannedNotification && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 text-white px-4 py-2 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-bounce">
          <Barcode className="w-4 h-4 text-emerald-400" />
          <span>{scannedNotification}</span>
        </div>
      )}

      {/* Offline Banner */}
      {offlineQueue.length > 0 && (
        <div className="bg-amber-500/10 border-b border-amber-200 px-4 py-1.5 flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center space-x-2 font-medium">
            <WifiOff className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>
              {offlineQueue.length} sale(s) saved offline in browser storage.
            </span>
          </div>
          <button
            onClick={handleSyncOfflineSales}
            disabled={isSyncingOffline}
            className="flex items-center space-x-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncingOffline ? 'animate-spin' : ''}`} />
            <span>{isSyncingOffline ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      )}

      {/* Mobile Screen Tab Switcher (Ensures mobile cashiers see everything) */}
      <div className="flex lg:hidden bg-white border-b border-gray-200 p-2 gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            mobileTab === 'catalog'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>{lang === 'kh' ? `កាតាឡុក (${filteredProducts.length})` : `Catalog (${filteredProducts.length})`}</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            mobileTab === 'cart'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{lang === 'kh' ? `កន្ត្រក (${cart.length})` : `Cart (${cart.length})`} • ${finalPayableTotal.toFixed(2)}</span>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Products Catalog Panel */}
        <div className={`flex-1 flex flex-col p-3 sm:p-4 bg-gray-50/50 overflow-hidden border-r border-gray-200 ${
          mobileTab === 'cart' ? 'hidden lg:flex' : 'flex'
        }`}>
          {/* Search Header */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={lang === 'kh' ? "ស្កេនបាកូដ ឬស្វែងរកតាមឈ្មោះ / SKU..." : "Scan barcode or search by name / SKU (Press Enter to add)..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredProducts.length === 1) {
                    addToCart(filteredProducts[0]);
                    playScanBeep();
                    setScannedNotification(`Added: ${filteredProducts[0].name}`);
                    setTimeout(() => setScannedNotification(null), 2000);
                    setSearch('');
                  }
                }}
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-xs transition"
              />
              <Barcode className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="button"
              onClick={() => setIsBarcodeScannerModalOpen(true)}
              className="w-10 h-10 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition shrink-0 group"
              title="Open Barcode Scanner & Camera Hub"
              aria-label="Scan Barcode"
            >
              <ScanBarcode className="w-5 h-5 text-emerald-100 group-hover:scale-110 transition" />
            </button>

            <button
              type="button"
              onClick={() => {
                const url = window.location.origin + window.location.pathname + '?display=customer';
                window.open(url, 'SmartPOS_CustomerDisplay', 'width=1024,height=768');
              }}
              className="flex items-center space-x-1.5 px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200/80 transition shrink-0"
              title="Open Dual-Screen Customer Facing Display"
            >
              <Monitor className="w-4 h-4 text-indigo-600" />
              <span className="hidden md:inline">{lang === 'kh' ? 'អេក្រង់អតិថិជន' : 'Customer Screen'}</span>
            </button>
            <div className="text-xs text-gray-500 font-semibold shrink-0 bg-white px-3 py-2.5 border border-gray-200 rounded-xl shadow-xs">
              {filteredProducts.length} {lang === 'kh' ? 'មុខទំនិញ' : 'Items'}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 mb-3 text-xs shrink-0 select-none">
            <button
              onClick={() => setSelectedPosCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                selectedPosCategory === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {lang === 'kh' ? `ទំនិញទាំងអស់ (${products.length})` : `All Items (${products.length})`}
            </button>
            {uniqueCategories.map((cat: { id: number; name: string }) => {
              const catCount = products.filter((p: Product) => p.category?.id === cat.id).length;
              const isSelected = selectedPosCategory === String(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedPosCategory(String(cat.id))}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-emerald-800 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {catCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            {isLoadingProducts ? (
              <div className="flex items-center justify-center h-64 text-xs text-gray-400">
                Loading products catalog...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-2">
                <Search className="w-8 h-8 text-gray-300" />
                <span className="text-xs">No matching products found</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredProducts.map((p) => {
                  const hasImage = Boolean(p.image_url);
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        addToCart(p);
                        playScanBeep();
                      }}
                      className="group flex flex-col text-left bg-white border border-gray-200/80 hover:border-emerald-500 hover:shadow-md rounded-2xl p-2.5 transition duration-150 relative overflow-hidden"
                    >
                      {/* Product Image Box */}
                      <div className="w-full h-32 mb-2 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center relative">
                        {hasImage ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            loading="lazy"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-extrabold text-base uppercase shadow-xs">
                            {p.name.slice(0, 2)}
                          </div>
                        )}
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/60 backdrop-blur-xs text-[9px] font-bold font-mono text-white rounded-md">
                          {p.sku}
                        </span>
                        {p.category && (
                          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-white/90 backdrop-blur-xs text-[9px] font-bold text-gray-700 rounded-md">
                            {p.category.name}
                          </span>
                        )}
                      </div>

                      {/* Product Meta */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <span className="font-bold text-xs text-gray-900 line-clamp-2 leading-tight group-hover:text-emerald-600 transition">
                            {p.name}
                          </span>
                          <span className="font-mono text-[10px] text-gray-400 block mt-0.5 flex items-center gap-1">
                            <Barcode className="w-3 h-3 text-slate-400" />
                            {p.barcode || p.sku}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-gray-100">
                          <div>
                            <span className="text-emerald-600 font-extrabold text-sm font-mono block">
                              ${Number(p.selling_price).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              ៛{(Math.round(Number(p.selling_price) * exchangeRate)).toLocaleString()}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-semibold">
                            {p.unit?.name || 'unit'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart & Checkout Panel */}
        <div className={`w-full lg:w-96 flex flex-col bg-white border-l border-gray-200 ${
          mobileTab === 'catalog' ? 'hidden lg:flex' : 'flex'
        }`}>
          {/* Customer Loyalty Banner */}
          <div className="p-3 border-b border-gray-100 bg-purple-50/40">
            {selectedCustomer ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-xs text-gray-900 truncate">
                        {selectedCustomer.name}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${
                          getTier(selectedCustomer.loyalty_points).color
                        }`}
                      >
                        {getTier(selectedCustomer.loyalty_points).icon} {getTier(selectedCustomer.loyalty_points).name}
                      </span>
                    </div>
                    <span className="text-[10px] text-purple-600 font-semibold block">
                      Balance: {selectedCustomer.loyalty_points || 0} pts (≈ $
                      {((Number(selectedCustomer.loyalty_points) || 0) / 100).toFixed(2)})
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setIsRedeemingPoints(false);
                    setPointsToRedeem(0);
                  }}
                  className="text-gray-400 hover:text-rose-500 transition p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>{lang === 'kh' ? 'អតិថិជនទូទៅ' : 'Walk-in Customer'}</span>
                </span>
                <button
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 text-[11px] font-bold rounded-lg transition"
                >
                  + Member
                </button>
              </div>
            )}
          </div>

          {/* Cart Header */}
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-sm text-gray-900 flex items-center space-x-1.5">
                <span>{t.cart}</span>
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-mono font-bold">
                  {cart.length}
                </span>
              </h2>
              {heldOrders.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsHeldOrdersModalOpen(true)}
                  className="flex items-center space-x-1 px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold shadow-xs transition"
                >
                  <PauseCircle className="w-3 h-3 text-amber-600" />
                  <span>{lang === 'kh' ? `ផ្អាក (${heldOrders.length})` : `Held (${heldOrders.length})`}</span>
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {cart.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsHoldConfirmOpen(true)}
                    className="flex items-center space-x-1 text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg transition"
                    title="Park this order and serve next customer"
                  >
                    <PauseCircle className="w-3.5 h-3.5" />
                    <span>{lang === 'kh' ? 'ផ្អាក' : 'Hold'}</span>
                  </button>
                  <button
                    onClick={clearCart}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition px-1 py-0.5"
                  >
                    Clear All
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                <Receipt className="w-10 h-10 text-gray-200 stroke-1" />
                <span className="text-xs">{lang === 'kh' ? 'មិនទាន់មានទំនិញក្នុងកន្ត្រកទេ' : 'Your cart is empty'}</span>
                <span className="text-[11px] text-gray-400">{lang === 'kh' ? 'ស្កេនបាកូដ ឬចុចលើទំនិញដើម្បីបញ្ចូល' : 'Scan product or click to add'}</span>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="p-2.5 bg-gray-50/70 hover:bg-gray-50/90 border border-gray-100 hover:border-gray-200 rounded-xl flex items-center justify-between gap-2.5 transition group"
                >
                  {/* Product Thumbnail */}
                  <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200/80 flex items-center justify-center relative shadow-2xs">
                    {item.product.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-full h-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-extrabold text-xs uppercase ${
                        item.product.image_url ? 'hidden' : 'flex'
                      }`}
                    >
                      {item.product.name.slice(0, 2)}
                    </div>
                  </div>

                  {/* Product Meta */}
                  <div className="flex-1 min-w-0 pr-1">
                    <span className="font-bold text-xs text-gray-800 block truncate" title={item.product.name}>
                      {item.product.name}
                    </span>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span className="text-[10px] text-gray-400 font-mono">
                        ${item.unit_price.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-gray-300">•</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {item.product.barcode || item.product.sku}
                      </span>
                    </div>
                  </div>

                  {/* Quantity and Actions */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <div className="flex items-center border border-gray-200 rounded-lg bg-white shadow-2xs">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 hover:bg-gray-100 rounded text-gray-600 transition active:scale-95"
                        title="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold font-mono">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 hover:bg-gray-100 rounded text-gray-600 transition active:scale-95"
                        title="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-bold text-xs text-gray-900 w-14 text-right font-mono">
                      ${(item.unit_price * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-gray-400 hover:text-rose-600 transition p-1 rounded-md hover:bg-rose-50"
                      title="Remove from cart"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Promo / Coupon Code Section */}
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/40">
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                <div className="flex items-center space-x-2">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <div>
                    <span className="font-bold text-emerald-900">{appliedCoupon.code}</span>
                    <span className="text-[10px] text-emerald-600 block">
                      {appliedCoupon.name} (-${appliedCoupon.discount_amount.toFixed(2)})
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-emerald-700 hover:text-rose-600 transition p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex space-x-1.5">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={lang === 'kh' ? "កូដបញ្ចុះតម្លៃ (ឧ. WELCOME10)" : "Coupon (e.g. WELCOME10)"}
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        setCouponError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleApplyCoupon();
                      }}
                      className="w-full pl-8 pr-2 py-1.5 text-xs bg-white border border-gray-200 rounded-xl font-mono uppercase focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    disabled={isValidatingCoupon || !couponInput.trim()}
                    className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition"
                  >
                    {isValidatingCoupon ? '...' : (lang === 'kh' ? 'អនុវត្ត' : 'Apply')}
                  </button>
                </div>
                {couponError && (
                  <p className="text-[10px] text-rose-600 font-medium pl-1">{couponError}</p>
                )}
              </div>
            )}
          </div>

          {/* Cart Footer Summary with Dual-Currency */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-2 shrink-0">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{t.subtotal}</span>
              <span className="font-mono">${cartSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{lang === 'kh' ? 'អាករលើតម្លៃបន្ថែម (10%)' : 'VAT (10%)'}</span>
              <span className="font-mono">${cartTax.toFixed(2)}</span>
            </div>
            {pointsDiscount > 0 && (
              <div className="flex justify-between text-xs text-purple-600 font-medium">
                <span>Loyalty Discount ({pointsToRedeem} pts)</span>
                <span className="font-mono">-${pointsDiscount.toFixed(2)}</span>
              </div>
            )}
            {couponDiscount > 0 && (
              <div className="flex justify-between text-xs text-emerald-600 font-medium">
                <span>Coupon ({appliedCoupon?.code})</span>
                <span className="font-mono">-${couponDiscount.toFixed(2)}</span>
              </div>
            )}
            {manualDiscount && manualDiscountAmount > 0 && (
              <div className="flex justify-between items-center text-xs text-indigo-600 font-medium bg-indigo-50/60 px-2 py-1 rounded-lg border border-indigo-100">
                <div className="flex items-center space-x-1">
                  <Percent className="w-3 h-3" />
                  <span>Discount ({manualDiscount.reason})</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-mono font-bold">-${manualDiscountAmount.toFixed(2)}</span>
                  <button
                    onClick={() => setManualDiscount(null)}
                    className="text-gray-400 hover:text-rose-500 transition ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
            {isDeliveryRequested && (
              <div className="flex justify-between items-center text-xs text-amber-800 font-medium bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200">
                <div className="flex items-center space-x-1.5">
                  <Truck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Delivery ({deliveryPriority})</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-mono font-bold text-amber-900">+${currentDeliveryFee.toFixed(2)}</span>
                  <button
                    onClick={() => setIsDeliveryRequested(false)}
                    className="text-amber-500 hover:text-rose-600 transition ml-1"
                    title="Cancel Delivery"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 gap-2">
              <button
                type="button"
                onClick={() => setIsDiscountModalOpen(true)}
                className="flex-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition flex items-center justify-center space-x-1 border border-indigo-200"
              >
                <Percent className="w-3 h-3" />
                <span>{lang === 'kh' ? (manualDiscount ? 'បញ្ចុះតម្លៃ' : '+ បញ្ចុះតម្លៃ') : (manualDiscount ? 'Discount' : '+ Discount')}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDeliveryRequested(!isDeliveryRequested)}
                className={`flex-1 text-[11px] font-bold px-2 py-1 rounded-lg transition flex items-center justify-center space-x-1 border ${
                  isDeliveryRequested
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-200'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{lang === 'kh' ? (isDeliveryRequested ? '🚚 ដឹកជញ្ជូន (បើក)' : '+ ដឹកជញ្ជូន') : (isDeliveryRequested ? '🚚 Delivery (On)' : '+ Delivery')}</span>
              </button>
            </div>

            <div className="flex justify-between items-baseline pt-2 border-t border-gray-200">
              <span className="text-base font-extrabold text-gray-900">{t.total}</span>
              <div className="text-right">
                <span className="text-emerald-600 font-black text-lg font-mono block">
                  ${finalPayableTotal.toFixed(2)} USD
                </span>
                <span className="text-xs text-gray-500 font-mono font-semibold">
                  ≈ ៛{finalPayableTotalKhr.toLocaleString()} KHR
                </span>
              </div>
            </div>

            <button
              onClick={handleOpenCheckout}
              disabled={cart.length === 0}
              className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-200 transition disabled:shadow-none"
            >
              {t.checkout || 'Proceed to Checkout'}
            </button>
          </div>
        </div>
      </div>

      {/* Customer Selection Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span>Select Member Customer</span>
              </h3>
              <button
                onClick={() => {
                  setIsCustomerModalOpen(false);
                  setIsQuickAddOpen(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isQuickAddOpen ? (
              <form onSubmit={handleQuickAddCustomer} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={quickAddForm.name}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={quickAddForm.phone}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsQuickAddOpen(false)}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl"
                  >
                    Save & Select
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search member by name, phone..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                    />
                  </div>
                  <button
                    onClick={() => setIsQuickAddOpen(true)}
                    className="px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-bold whitespace-nowrap transition"
                  >
                    + New
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                  {isLoadingCustomers ? (
                    <div className="py-8 text-center text-xs text-gray-400">Loading customers...</div>
                  ) : customerList.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400">No customers found.</div>
                  ) : (
                    customerList.map((c) => {
                      const tier = getTier(c.loyalty_points);
                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomer(c);
                            setIsCustomerModalOpen(false);
                          }}
                          className="py-2.5 px-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer rounded-xl transition"
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-xs text-gray-900">{c.name}</span>
                              <span
                                className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${tier.color}`}
                              >
                                {tier.icon} {tier.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400">{c.phone || 'No phone'}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-purple-700 block font-mono">
                              {c.loyalty_points || 0} pts
                            </span>
                            <span className="text-[9px] text-gray-400 font-mono">
                              ≈ ${((Number(c.loyalty_points) || 0) / 100).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal with Dual-Currency Payment */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">Complete Payment</h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Due Banner with Dual-Currency */}
            <div className="bg-emerald-50/60 p-4 rounded-xl text-center space-y-1 border border-emerald-100">
              <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider block">
                Total Payable Amount
              </span>
              <span className="text-2xl font-black text-emerald-700 block font-mono">
                ${finalPayableTotal.toFixed(2)} USD
              </span>
              <span className="text-xs font-bold text-emerald-800/80 font-mono">
                ≈ ៛{finalPayableTotalKhr.toLocaleString()} KHR
              </span>
            </div>

            {/* Loyalty Points Redemption Slider */}
            {selectedCustomer && maxRedeemablePoints > 0 && (
              <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-purple-900 flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRedeemingPoints}
                      onChange={(e) => handleToggleRedeem(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                    />
                    <span>Redeem Loyalty Points</span>
                  </label>
                  <span className="text-[11px] text-purple-700 font-mono">
                    Avail: {selectedCustomer.loyalty_points} pts
                  </span>
                </div>

                {isRedeemingPoints && (
                  <div className="space-y-1.5 pt-1">
                    <input
                      type="range"
                      min={0}
                      max={maxRedeemablePoints}
                      step={10}
                      value={pointsToRedeem}
                      onChange={(e) => handlePointsChange(Number(e.target.value))}
                      className="w-full accent-purple-600 h-1.5 bg-purple-200 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-purple-800 font-semibold font-mono">
                      <span>{pointsToRedeem} pts</span>
                      <span className="text-emerald-700">-${(pointsToRedeem / 100).toFixed(2)} OFF</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Delivery Order Dispatch Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-800 flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDeliveryRequested}
                    onChange={(e) => setIsDeliveryRequested(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                  />
                  <div className="flex items-center space-x-1.5">
                    <Truck className={`w-3.5 h-3.5 ${isDeliveryRequested ? 'text-amber-600' : 'text-gray-400'}`} />
                    <span>Ship via Delivery Dispatch</span>
                  </div>
                </label>
                {isDeliveryRequested && (
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-mono">
                    Fee: +${currentDeliveryFee.toFixed(2)}
                  </span>
                )}
              </div>

              {isDeliveryRequested && (
                <div className="space-y-2 pt-1 border-t border-slate-200/80">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Recipient Name</label>
                      <input
                        type="text"
                        value={deliveryRecipientName}
                        onChange={(e) => setDeliveryRecipientName(e.target.value)}
                        placeholder="Customer name"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Recipient Phone</label>
                      <input
                        type="text"
                        value={deliveryRecipientPhone}
                        onChange={(e) => setDeliveryRecipientPhone(e.target.value)}
                        placeholder="Phone number"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Delivery Address</label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Street address / House # / Sangkat"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Zone</label>
                      <select
                        value={deliveryZoneId || ''}
                        onChange={(e) => setDeliveryZoneId(Number(e.target.value))}
                        className="w-full px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-lg font-medium text-gray-800"
                      >
                        {deliveryZones.map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.name} (${Number(z.base_delivery_fee).toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Time Slot</label>
                      <select
                        value={deliveryTimeSlotId || ''}
                        onChange={(e) => setDeliveryTimeSlotId(Number(e.target.value))}
                        className="w-full px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-lg font-medium text-gray-800"
                      >
                        <option value="">Immediate</option>
                        {deliveryTimeSlots.map((slot) => (
                          <option key={slot.id} value={slot.id}>
                            {slot.label} ({slot.start_time}-{slot.end_time})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Priority</label>
                      <select
                        value={deliveryPriority}
                        onChange={(e: any) => setDeliveryPriority(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-lg font-medium text-gray-800"
                      >
                        <option value="STANDARD">Standard</option>
                        <option value="EXPRESS">Express (+$1)</option>
                        <option value="URGENT">Urgent (+$2.5)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="Instructions for driver (optional)"
                      className="w-full px-2.5 py-1 text-[11px] bg-white border border-gray-200 rounded-lg focus:outline-none placeholder-gray-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Checkout Tender Mode Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setCheckoutMode('SINGLE')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  checkoutMode === 'SINGLE'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Single Tender
              </button>
              <button
                type="button"
                onClick={() => {
                  setCheckoutMode('SPLIT');
                  setSplitCashUsd(0);
                  setSplitCashKhr(0);
                  setSplitKhqr(0);
                  setSplitCard(0);
                }}
                className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center space-x-1 ${
                  checkoutMode === 'SPLIT'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Split Tender</span>
              </button>
            </div>

            {checkoutMode === 'SPLIT' ? (
              /* SPLIT TENDER CONTROLS */
              <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600 uppercase">Allocated Breakdown</span>
                  {(() => {
                    const allocated = splitCashUsd + (splitCashKhr / exchangeRate) + splitKhqr + splitCard;
                    const remaining = Math.max(0, finalPayableTotal - allocated);
                    return (
                      <span className={`font-mono font-bold ${remaining <= 0.001 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {remaining <= 0.001 ? '✓ Fully Allocated' : `Due: $${remaining.toFixed(2)}`}
                      </span>
                    );
                  })()}
                </div>

                {/* Cash USD */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-gray-600">
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-emerald-600" /> Cash USD ($)</span>
                    <button
                      type="button"
                      onClick={() => {
                        const otherAlloc = (splitCashKhr / exchangeRate) + splitKhqr + splitCard;
                        setSplitCashUsd(Math.max(0, Number((finalPayableTotal - otherAlloc).toFixed(2))));
                      }}
                      className="text-[10px] text-emerald-600 hover:underline font-bold"
                    >
                      Fill Remaining
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    value={splitCashUsd || ''}
                    onChange={(e) => setSplitCashUsd(Number(e.target.value))}
                    placeholder="$0.00"
                    className="w-full px-2.5 py-1.5 text-xs font-bold font-mono border border-gray-200 rounded-lg bg-white"
                  />
                </div>

                {/* Cash KHR */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-gray-600">
                    <span className="flex items-center gap-1"><Coins className="w-3 h-3 text-emerald-600" /> Cash KHR (៛)</span>
                    <button
                      type="button"
                      onClick={() => {
                        const otherAlloc = splitCashUsd + splitKhqr + splitCard;
                        const remUsd = Math.max(0, finalPayableTotal - otherAlloc);
                        setSplitCashKhr(Math.round(remUsd * exchangeRate));
                      }}
                      className="text-[10px] text-emerald-600 hover:underline font-bold"
                    >
                      Fill Remaining
                    </button>
                  </div>
                  <input
                    type="number"
                    step="500"
                    min={0}
                    value={splitCashKhr || ''}
                    onChange={(e) => setSplitCashKhr(Number(e.target.value))}
                    placeholder="0 ៛"
                    className="w-full px-2.5 py-1.5 text-xs font-bold font-mono border border-gray-200 rounded-lg bg-white"
                  />
                </div>

                {/* Bakong KHQR */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-gray-600">
                    <span className="flex items-center gap-1"><QrCode className="w-3 h-3 text-red-600" /> Bakong KHQR ($)</span>
                    <button
                      type="button"
                      onClick={() => {
                        const otherAlloc = splitCashUsd + (splitCashKhr / exchangeRate) + splitCard;
                        const rem = Math.max(0, Number((finalPayableTotal - otherAlloc).toFixed(2)));
                        setSplitKhqr(rem);
                        if (rem > 0) {
                          generateKHQR('SPLIT-' + Date.now(), rem).then(setSplitKhqrData);
                        }
                      }}
                      className="text-[10px] text-red-600 hover:underline font-bold"
                    >
                      Fill Remaining
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      value={splitKhqr || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSplitKhqr(val);
                        if (val > 0) {
                          generateKHQR('SPLIT-' + Date.now(), val).then(setSplitKhqrData);
                        } else {
                          setSplitKhqrData(null);
                        }
                      }}
                      placeholder="$0.00"
                      className="flex-1 px-2.5 py-1.5 text-xs font-bold font-mono border border-gray-200 rounded-lg bg-white"
                    />
                    {splitKhqr > 0 && splitKhqrData && (
                      <button
                        type="button"
                        onClick={() => alert(`Bakong KHQR for $${splitKhqr.toFixed(2)} active!`)}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-[10px] font-bold shrink-0"
                      >
                        View QR
                      </button>
                    )}
                  </div>
                </div>

                {/* Credit / Debit Card */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-gray-600">
                    <span className="flex items-center gap-1"><CreditCard className="w-3 h-3 text-blue-600" /> Card ($)</span>
                    <button
                      type="button"
                      onClick={() => {
                        const otherAlloc = splitCashUsd + (splitCashKhr / exchangeRate) + splitKhqr;
                        setSplitCard(Math.max(0, Number((finalPayableTotal - otherAlloc).toFixed(2))));
                      }}
                      className="text-[10px] text-blue-600 hover:underline font-bold"
                    >
                      Fill Remaining
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    value={splitCard || ''}
                    onChange={(e) => setSplitCard(Number(e.target.value))}
                    placeholder="$0.00"
                    className="w-full px-2.5 py-1.5 text-xs font-bold font-mono border border-gray-200 rounded-lg bg-white"
                  />
                </div>
              </div>
            ) : null}

            {/* Payment Method Selector */}
            {checkoutMode === 'SINGLE' && (
              <>
                <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition ${
                  paymentMethod === 'CASH'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-xs'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Cash Payment</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('KHQR');
                  if (!khqrData) {
                    generateKHQR('BILL-' + Date.now(), finalPayableTotal).then(setKhqrData);
                  }
                }}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition ${
                  paymentMethod === 'KHQR'
                    ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-xs'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Bakong KHQR</span>
              </button>
            </div>

            {/* Payment Inputs */}
            {paymentMethod === 'CASH' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase">
                    Cash Tendered Currency
                  </label>
                  <div className="flex space-x-1 bg-gray-100 p-0.5 rounded-lg text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setCashCurrency('USD')}
                      className={`px-2 py-0.5 rounded-md ${
                        cashCurrency === 'USD' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      USD ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashCurrency('KHR')}
                      className={`px-2 py-0.5 rounded-md ${
                        cashCurrency === 'KHR' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      KHR (៛)
                    </button>
                  </div>
                </div>

                {cashCurrency === 'USD' ? (
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={cashReceived || ''}
                      onChange={(e) => setCashReceived(Number(e.target.value))}
                      placeholder="Amount in USD ($)"
                      className="w-full px-3.5 py-2.5 text-base font-bold font-mono border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500"
                    />
                    <div className="flex space-x-1.5 mt-1.5">
                      {[Math.ceil(finalPayableTotal), 10, 20, 50, 100].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCashReceived(preset)}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-[11px] font-mono font-bold text-gray-700"
                        >
                          ${preset}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="number"
                      step="500"
                      min={0}
                      value={cashReceivedKhr || ''}
                      onChange={(e) => setCashReceivedKhr(Number(e.target.value))}
                      placeholder="Amount in KHR (៛)"
                      className="w-full px-3.5 py-2.5 text-base font-bold font-mono border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500"
                    />
                    <div className="flex space-x-1.5 mt-1.5">
                      {[
                        Math.ceil(finalPayableTotalKhr / 1000) * 1000,
                        20000,
                        40000,
                        50000,
                        100000,
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCashReceivedKhr(preset)}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-[10px] font-mono font-bold text-gray-700"
                        >
                          {preset.toLocaleString()}៛
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Change Calculation (Dual Currency) */}
                <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-xs text-gray-500 font-semibold">
                    <span>Change Due (USD):</span>
                    <span className="font-mono font-bold text-gray-900">
                      ${Math.max(0, effectiveCashReceivedUsd - finalPayableTotal).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 font-semibold">
                    <span>Change Due (KHR):</span>
                    <span className="font-mono font-bold text-emerald-700">
                      ៛{Math.round(Math.max(0, effectiveCashReceivedUsd - finalPayableTotal) * exchangeRate).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-center py-2">
                {khqrData ? (
                  <div className="space-y-2">
                    <div className="w-44 h-44 mx-auto bg-rose-50 border-2 border-dashed border-rose-300 rounded-2xl flex flex-col items-center justify-center p-3">
                      <QrCode className="w-28 h-28 text-rose-600" />
                      <span className="text-[10px] font-bold text-rose-700 uppercase mt-1">
                        Scan with Bakong App
                      </span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 block font-mono">
                      ${finalPayableTotal.toFixed(2)} USD ≈ ៛{finalPayableTotalKhr.toLocaleString()} KHR
                    </span>
                  </div>
                ) : (
                  <div className="py-6 text-xs text-gray-400">Generating Bakong KHQR...</div>
                )}
              </div>
            )}
              </>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteSale}
                disabled={
                  isSubmitting ||
                  (checkoutMode === 'SINGLE' && paymentMethod === 'CASH' && effectiveCashReceivedUsd < finalPayableTotal) ||
                  (checkoutMode === 'SPLIT' && (splitCashUsd + (splitCashKhr / exchangeRate) + splitKhqr + splitCard) < (finalPayableTotal - 0.001))
                }
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                {isSubmitting ? 'Processing...' : 'Complete & Finalize'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Success / Receipt Slip Modal */}
      {completedSuccess && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="flex flex-col items-center space-y-1.5">
              <SmartPosLogo variant="full" size="sm" showSubtitle={false} />
              <h3 className="text-base font-bold text-gray-900">Sale Receipt Finalized</h3>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                {completedSuccess.sale_number}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-xs text-left font-mono">
              <div className="flex justify-between text-gray-600">
                <span>Total Due:</span>
                <span className="font-bold text-gray-900">
                  ${Number(completedSuccess.total_amount).toFixed(2)} (៛{(Math.round(Number(completedSuccess.total_amount) * exchangeRate)).toLocaleString()})
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Paid ({completedSuccess.cashCurrency || 'USD'}):</span>
                <span>${Number(completedSuccess.paid_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Change:</span>
                <span>
                  ${Number(completedSuccess.change_amount || 0).toFixed(2)} (៛{(Math.round(Number(completedSuccess.change_amount || 0) * exchangeRate)).toLocaleString()})
                </span>
              </div>

              {/* Coupon Applied Recap */}
              {completedSuccess.coupon && (
                <div className="pt-2 border-t border-gray-200 flex justify-between text-emerald-700 text-[11px]">
                  <span>Promo Code:</span>
                  <span className="font-bold">
                    {completedSuccess.coupon.code} (-${completedSuccess.coupon.discount_amount.toFixed(2)})
                  </span>
                </div>
              )}

              {/* Loyalty Points Recap */}
              {completedSuccess.customer && (
                <div className="pt-2 border-t border-gray-200 space-y-1 text-[11px] text-purple-700">
                  <div className="flex justify-between font-bold">
                    <span>Member:</span>
                    <span>{completedSuccess.customer.name}</span>
                  </div>
                  {completedSuccess.pointsRedeemed > 0 && (
                    <div className="flex justify-between">
                      <span>Points Redeemed:</span>
                      <span>-{completedSuccess.pointsRedeemed} pts</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-emerald-600">
                    <span>Points Earned:</span>
                    <span>+{completedSuccess.pointsEarned} pts</span>
                  </div>
                </div>
              )}

              {/* Delivery Order Dispatch Notice */}
              {completedSuccess.delivery && (
                <div className="pt-2 border-t border-gray-200 text-left space-y-1 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
                  <div className="flex items-center justify-between text-amber-900 font-bold text-[11px]">
                    <span className="flex items-center space-x-1">
                      <Truck className="w-3.5 h-3.5 text-amber-600" />
                      <span>Delivery Dispatched:</span>
                    </span>
                    <span className="font-mono">{completedSuccess.delivery.delivery_number}</span>
                  </div>
                  <div className="text-[10px] text-gray-600 truncate">
                    <span className="font-semibold text-gray-700">To: </span>
                    {completedSuccess.delivery.recipient_name} ({completedSuccess.delivery.recipient_phone})
                  </div>
                  <div className="text-[10px] text-gray-600 truncate">
                    <span className="font-semibold text-gray-700">Address: </span>
                    {completedSuccess.delivery.delivery_address}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider">
                      Priority: {completedSuccess.delivery.priority || 'STANDARD'}
                    </span>
                    <span className="bg-amber-200/80 text-amber-900 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">
                      {completedSuccess.delivery.status || 'PENDING'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => setShowThermalReceipt(true)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-xs transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Receipt (80mm)</span>
              </button>
              <button
                onClick={() => {
                  setCompletedSuccess(null);
                  setShowThermalReceipt(false);
                }}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition"
              >
                New Order (ESC)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner & Hardware Hub Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerModalOpen}
        onClose={() => setIsBarcodeScannerModalOpen(false)}
        products={products}
        onScanProduct={(product, quantity = 1) => {
          addToCart(product, quantity);
          setScannedNotification(`Auto-Added: +${quantity} ${product.name} (${product.barcode || product.sku})`);
          setTimeout(() => setScannedNotification(null), 2500);
        }}
        playScanBeep={playScanBeep}
      />

      {/* 80mm/58mm GDT Fiscal Thermal Slip Modal */}
      {showThermalReceipt && completedSuccess && (
        <ThermalReceiptModal
          sale={completedSuccess}
          exchangeRate={exchangeRate}
          onClose={() => setShowThermalReceipt(false)}
        />
      )}
      {/* Floating Mobile Cart Summary Button */}
      {cart.length > 0 && mobileTab === 'catalog' && (
        <div className="lg:hidden fixed bottom-4 inset-x-4 z-40 animate-in slide-in-from-bottom-2">
          <button
            type="button"
            onClick={() => setMobileTab('cart')}
            className="w-full bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between font-bold text-xs"
          >
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-[11px] flex items-center justify-center">
                {cart.reduce((s, it) => s + it.quantity, 0)}
              </span>
              <span>Items in Cart</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-emerald-400 font-mono text-sm">${finalPayableTotal.toFixed(2)}</span>
              <span className="bg-emerald-600 px-3 py-1 rounded-xl text-white text-xs">View Cart & Pay &rarr;</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
