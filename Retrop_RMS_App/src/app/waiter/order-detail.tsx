// ============================================================================
// WAITER — ORDER DETAIL SCREEN  (NEW)
// ============================================================================
// Full order view: items, bill preview, status actions, payment modal.
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Modal, FlatList, TextInput, Platform, Image,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { useWaiterAuth } from '@/context/WaiterAuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useDialog } from '@/context/DialogContext';
import { ENDPOINTS } from '@/config/api';
import { apiCall } from '@/utils/apiClient';

// ============================================================================
// TYPES
// ============================================================================

type OrderStatus = 'ordering' | 'preparing' | 'ready' | 'serving' | 'completed' | 'cancelled';
type PaymentMethod = 'cash' | 'card' | 'upi';

interface OrderItem { dishId: string; dishName: string; price: number; quantity: number; remarks: string | null }
interface Order {
  ordersId: string; dailyOrderNo: number; tableNo: number; orderStatus: OrderStatus;
  ordersInfo: OrderItem[]; totalAmount: number; finalAmount: number | null;
  taxBreakdown: { name: string; percent: number; amount: number; inclusive?: boolean }[];
  gstAmount: number; paymentMethod: PaymentMethod | null; isPaymentCompleted: boolean;
  createdAt: string; customer?: { name: string; mobile: string };
  taxType?: string;
  lockedItems?: OrderItem[];
  discountAmount?: number;
  discountBreakdown?: { name: string; percent: number; amount: number }[];
  customerToken?: string;
}
interface BillPreview {
  subtotal: number;
  taxBreakdown: { name: string; percent: number; amount: number; inclusive?: boolean }[];
  gstAmount: number;
  finalAmount: number;
  taxType?: string;
  discountAmount?: number;
  discountBreakdown?: { name: string; percent: number; amount: number }[];
}
interface MenuItem { dishId: string; dishName: string; price: number; category: string; isAvailable: boolean }

// ============================================================================
// PAYMENT MODAL
// ============================================================================

function PaymentModal({
  visible, onClose, bill, onConfirm, confirming, colors,
}: {
  visible: boolean; onClose: () => void; bill: BillPreview | null;
  onConfirm: (method: PaymentMethod) => void; confirming: boolean; colors: any;
}) {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const METHODS: { key: PaymentMethod; label: string; icon: string }[] = [
    { key: 'cash', label: 'Cash', icon: 'cash' },
    { key: 'upi',  label: 'UPI',  icon: 'cellphone-nfc' },
    { key: 'card', label: 'Card', icon: 'credit-card-outline' },
  ];

  const displayedSubtotal = bill?.subtotal || 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Conclude Order</Text>
            <Pressable onPress={onClose}><MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} /></Pressable>
          </View>

          {/* Bill preview */}
          {bill && (
            <View style={[styles.billBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: colors.textSecondary }]}>Subtotal</Text>
                <Text numberOfLines={1} style={[styles.billValue, { color: colors.text }]}>₹{displayedSubtotal.toFixed(2)}</Text>
              </View>
              {(bill.discountBreakdown ?? []).map((d, idx) => (
                <View key={d.name + idx} style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: colors.success }]}>🏷️ {d.name} ({d.percent}%)</Text>
                  <Text numberOfLines={1} style={[styles.billValue, { color: colors.success }]}>-₹{(Number(d.amount) || 0).toFixed(2)}</Text>
                </View>
              ))}
              {(bill.taxBreakdown ?? []).map((t) => (
                <View key={t.name} style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: colors.textSecondary }]}>{t.name} ({t.percent}%{t.inclusive ? ' Incl.' : ' Excl.'})</Text>
                  <Text numberOfLines={1} style={[styles.billValue, { color: colors.textSecondary }]}>₹{(Number(t.amount) || 0).toFixed(2)}</Text>
                </View>
              ))}
              <View style={[styles.billRow, styles.billTotalRow]}>
                <Text style={[styles.billTotalLabel, { color: colors.text }]}>Total</Text>
                <Text numberOfLines={1} style={[styles.billTotalValue, { color: colors.primary }]}>₹{(Number(bill.finalAmount) || 0).toFixed(2)}</Text>
              </View>
            </View>
          )}

          {/* Payment method */}
          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 14 }]}>Payment Method</Text>
          <View style={styles.methodRow}>
            {METHODS.map((m) => (
              <Pressable
                key={m.key}
                onPress={() => setMethod(m.key)}
                style={[
                  styles.methodBtn,
                  { borderColor: method === m.key ? colors.primary : colors.border,
                    backgroundColor: method === m.key ? colors.primary + '12' : colors.card },
                ]}
              >
                <MaterialCommunityIcons name={m.icon as any} size={20} color={method === m.key ? colors.primary : colors.textSecondary} />
                <Text style={[styles.methodLabel, { color: method === m.key ? colors.primary : colors.textSecondary, fontWeight: method === m.key ? '700' : '500' }]}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={() => onConfirm(method)}
            disabled={confirming}
            style={[styles.confirmBtn, { backgroundColor: colors.success, opacity: confirming ? 0.7 : 1 }]}
          >
            {confirming
              ? <ActivityIndicator size="small" color="#fff" />
              : <>
                  <MaterialCommunityIcons name="check-circle" size={18} color="#fff" />
                  <Text style={styles.confirmBtnText}>Confirm Payment</Text>
                </>
            }
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ============================================================================
// MENU PICKER MODAL
// ============================================================================

interface MenuPickerModalProps {
  visible: boolean;
  onClose: () => void;
  orderInfo: OrderItem[];
  lockedItems: OrderItem[];
  onSave: (items: { dishId: string; quantity: number; remarks: string }[]) => void;
  saving: boolean;
  colors: any;
  accessToken: string;
  refreshToken: string;
  handleDisabled: () => void;
}

function MenuPickerModal({
  visible, onClose, orderInfo, lockedItems, onSave, saving, colors, accessToken, refreshToken, handleDisabled
}: MenuPickerModalProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [editCart, setEditCart] = useState<Record<string, { item: MenuItem; quantity: number; remarks: string }>>({});

  useEffect(() => {
    if (visible && orderInfo) {
      const initialCart: Record<string, { item: MenuItem; quantity: number; remarks: string }> = {};
      orderInfo.forEach(item => {
        initialCart[item.dishId] = {
          item: {
            dishId: item.dishId,
            dishName: item.dishName,
            price: item.price,
            category: '',
            isAvailable: true
          },
          quantity: item.quantity,
          remarks: item.remarks || '',
        };
      });
      setEditCart(initialCart);
      fetchMenu();
    }
  }, [visible, orderInfo]);

  const fetchMenu = async () => {
    setLoadingMenu(true);
    try {
      const res = await apiCall(
        ENDPOINTS.WAITER_MENU,
        { method: 'GET' },
        async () => accessToken,
        refreshToken,
        handleDisabled
      );
      if (res.success && Array.isArray(res.data)) {
        setMenuItems(res.data);
        setEditCart(prev => {
          const next = { ...prev };
          res.data.forEach((mItem: MenuItem) => {
            if (next[mItem.dishId]) {
              next[mItem.dishId].item.category = mItem.category;
            }
          });
          return next;
        });
      }
    } catch (err) {
      console.error('Menu load error', err);
    } finally {
      setLoadingMenu(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    setEditCart(prev => {
      const existing = prev[item.dishId];
      return {
        ...prev,
        [item.dishId]: {
          item,
          quantity: (existing?.quantity || 0) + 1,
          remarks: existing?.remarks || ''
        }
      };
    });
  };

  const removeFromCart = (dishId: string) => {
    const locked = lockedItems?.find(i => i.dishId === dishId);
    const lockedQty = locked?.quantity || 0;

    setEditCart(prev => {
      const existing = prev[dishId];
      if (!existing) return prev;
      
      if (existing.quantity <= lockedQty) {
        return prev;
      }

      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[dishId];
        return next;
      }

      return {
        ...prev,
        [dishId]: { ...existing, quantity: existing.quantity - 1 }
      };
    });
  };

  const updateRemarks = (dishId: string, remarks: string) => {
    setEditCart(prev => {
      const existing = prev[dishId];
      if (!existing) return prev;
      return {
        ...prev,
        [dishId]: { ...existing, remarks }
      };
    });
  };

  const handleSave = () => {
    const itemsArray = Object.values(editCart).map(c => ({
      dishId: c.item.dishId,
      quantity: c.quantity,
      remarks: c.remarks
    }));
    onSave(itemsArray);
  };

  const categories = ['All', ...new Set(menuItems.map(i => i.category))];
  const filteredItems = menuItems.filter(i => {
    const matchesCat = activeCategory === 'All' || i.category === activeCategory;
    const matchesSearch = i.dishName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'ios' ? 48 : 16 }}>
        <View style={[styles.modalHeader, { paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text, fontSize: 18 }]}>Modify Items</Text>
          <Pressable onPress={onClose}><MaterialCommunityIcons name="close" size={24} color={colors.text} /></Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
          <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 12 }]}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search dishes..."
              placeholderTextColor={colors.textSecondary + '70'}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, maxHeight: 44 }}>
            {categories.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: activeCategory === cat ? colors.primary : colors.card,
                    borderColor: activeCategory === cat ? colors.primary : colors.border,
                  }
                ]}
              >
                <Text style={{ color: activeCategory === cat ? '#FFFFFF' : colors.text, fontWeight: '700' }}>
                  {cat}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {loadingMenu ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : filteredItems.length === 0 ? (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 40 }}>No dishes found.</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {filteredItems.map((item) => {
                const cartItem = editCart[item.dishId];
                const locked = lockedItems?.find(i => i.dishId === item.dishId);
                const lockedQty = locked?.quantity || 0;

                return (
                  <View key={item.dishId} style={[styles.dishCard, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'column', gap: 10, alignItems: 'stretch' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.dishName, { color: colors.text }]}>{item.dishName}</Text>
                        <Text style={[styles.dishPrice, { color: colors.primary }]}>₹{item.price.toFixed(2)}</Text>
                        {lockedQty > 0 && (
                          <Text style={{ fontSize: 11, color: colors.warning, fontWeight: '700' }}>
                            🔒 {lockedQty} already prepared (cannot decrease)
                          </Text>
                        )}
                      </View>
                      
                      {cartItem ? (
                        <View style={styles.qtyRow}>
                          <Pressable 
                            onPress={() => removeFromCart(item.dishId)} 
                            disabled={cartItem.quantity <= lockedQty}
                            style={[styles.qtyBtn, { backgroundColor: colors.background, opacity: cartItem.quantity <= lockedQty ? 0.3 : 1 }]}
                          >
                            <MaterialCommunityIcons name="minus" size={16} color={colors.primary} />
                          </Pressable>
                          <Text style={[styles.qtyText, { color: colors.text }]}>{cartItem.quantity}</Text>
                          <Pressable onPress={() => addToCart(item)} style={[styles.qtyBtn, { backgroundColor: colors.background }]}>
                            <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable onPress={() => addToCart(item)} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
                          <Text style={styles.addBtnText}>ADD</Text>
                        </Pressable>
                      )}
                    </View>

                    {cartItem && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, gap: 6, backgroundColor: colors.background }}>
                        <MaterialCommunityIcons name="pencil-outline" size={14} color={colors.textSecondary} />
                        <TextInput
                          value={cartItem.remarks}
                          onChangeText={(txt) => updateRemarks(item.dishId, txt)}
                          placeholder="Add instructions (e.g. no onion)"
                          placeholderTextColor={colors.textSecondary + '70'}
                          style={{ flex: 1, fontSize: 12, padding: 0, color: colors.text }}
                        />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 24, paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Pressable 
            onPress={handleSave} 
            disabled={saving} 
            style={{ backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, opacity: saving ? 0.7 : 1 }}
          >
            {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 15 }}>Save Modifications</Text>}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// MAIN SCREEN
// ============================================================================



// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { accessToken, refreshToken, logout } = useWaiterAuth();
  const { theme } = useTheme();
  const { showDialog, showError } = useDialog();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = theme.colors;

  const [order, setOrder] = useState<Order | null>(null);
  const [bill, setBill] = useState<BillPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [confirming, setConfirming] = useState(false);
 
  // Cancellation states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Menu Picker & Receipt states
  const [showMenuPicker, setShowMenuPicker] = useState(false);
  const [savingMenu, setSavingMenu] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptBill, setReceiptBill] = useState<{ invoiceNo?: string; totalAmount: number; paymentMethod: string } | null>(null);

  const handleSaveMenuModifications = async (items: { dishId: string; quantity: number; remarks: string }[]) => {
    setSavingMenu(true);
    try {
      const res = await apiCall(
        ENDPOINTS.WAITER_MODIFY_ORDER(orderId),
        {
          method: 'PATCH',
          body: JSON.stringify({
            action: 'replace',
            items
          })
        },
        async () => accessToken,
        refreshToken,
        handleDisabled
      );

      if (res.success) {
        setShowMenuPicker(false);
        fetchOrder();
        fetchBill();
      } else {
        showError('Modification Failed', res.message || 'Failed to modify items');
      }
    } catch (err) {
      showError('Error', 'Network error modifying items');
    } finally {
      setSavingMenu(false);
    }
  };

  const handleDisabled = useCallback(() => {
    showDialog({
      type: 'warning',
      title: 'Account Disabled',
      message: 'Your account has been disabled by the manager.',
      buttons: [{ text: 'OK', style: 'default', onPress: () => logout() }],
    });
  }, [logout, showDialog]);

  // ── Fetch order ─────────────────────────────────────────────────────────
  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    const result = await apiCall(
      ENDPOINTS.WAITER_ORDER_DETAIL(orderId),
      { method: 'GET' },
      async () => accessToken,
      refreshToken,
      handleDisabled,
    );
    if (result.success) {
      const ord = result.data as Order;
      setOrder(ord);
      if (ord.finalAmount !== null) {
        setBill({
          subtotal: ord.totalAmount,
          taxBreakdown: ord.taxBreakdown || [],
          gstAmount: ord.gstAmount || 0,
          finalAmount: ord.finalAmount,
          taxType: ord.taxType,
          discountAmount: ord.discountAmount,
          discountBreakdown: ord.discountBreakdown,
        });
      }
    }
    setLoading(false);
  }, [orderId, accessToken, refreshToken, handleDisabled]);
 
  // ── Fetch bill preview ───────────────────────────────────────────────────
  const fetchBill = useCallback(async () => {
    if (!orderId) return;
    // If we already have the completed order's bill, don't fetch preview
    if (order && order.finalAmount !== null) return;
    const result = await apiCall(
      ENDPOINTS.WAITER_BILL_PREVIEW(orderId),
      { method: 'GET' },
      async () => accessToken,
      refreshToken,
      handleDisabled,
    );
    if (result.success) {
      // Backend returns { order, restaurantInfo, billing: { subtotal, taxBreakdown, gstAmount, finalAmount } }
      const billing = (result.data as any)?.billing ?? result.data;
      setBill(billing as BillPreview);
    }
  }, [orderId, order, accessToken, refreshToken, handleDisabled]);

  useEffect(() => {
    fetchOrder();
    fetchBill();
  }, [orderId]);

  // ── Start Serving ────────────────────────────────────────────────────────
  const handleStartServing = async () => {
    if (!orderId) return;
    setActionLoading(true);
    const result = await apiCall(
      ENDPOINTS.WAITER_ORDER_STATUS(orderId),
      { method: 'PATCH', body: JSON.stringify({ status: 'serving' }) },
      async () => accessToken,
      refreshToken,
      handleDisabled,
    );
    if (result.success) {
      setOrder((prev) => prev ? { ...prev, orderStatus: 'serving' } : prev);
    } else {
      showError('Error', result.message ?? 'Failed to update status.');
    }
    setActionLoading(false);
  };



  // ── Conclude order ───────────────────────────────────────────────────────
  const handleConclude = async (paymentMethod: PaymentMethod) => {
    if (!orderId) return;
    setConfirming(true);
    const result = await apiCall(
      ENDPOINTS.WAITER_CONCLUDE_ORDER(orderId),
      { method: 'POST', body: JSON.stringify({ paymentMethod }) },
      async () => accessToken,
      refreshToken,
      handleDisabled,
    );
    setConfirming(false);
    if (result.success) {
      setShowPayment(false);
      setReceiptUrl(result.data?.billUrl || '');
      setReceiptBill({
        invoiceNo: result.data?.invoiceNo || `Order #${order.dailyOrderNo}`,
        totalAmount: result.data?.finalAmount || bill?.finalAmount || order.totalAmount,
        paymentMethod: paymentMethod.toUpperCase(),
      });
      setShowReceipt(true);
    } else if (result.message?.includes('Already paid') || result.message?.includes('already')) {
      showError('Already Paid', 'This order has already been paid.');
    } else {
      showError('Error', result.message ?? 'Failed to conclude order.');
    }
  };

  // ── Cancel order ─────────────────────────────────────────────────────────
  const handleConfirmCancel = async () => {
    if (!orderId || !cancelReason.trim()) return;
    setCancelling(true);
    const result = await apiCall(
      ENDPOINTS.WAITER_ORDER_STATUS(orderId),
      {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'cancelled',
          cancellationReason: cancelReason.trim(),
        }),
      },
      async () => accessToken,
      refreshToken,
      handleDisabled,
    );
    setCancelling(false);
    if (result.success) {
      setShowCancelModal(false);
      showDialog({
        type: 'success',
        title: 'Order Cancelled',
        message: 'The order has been cancelled and the table is now free.',
        buttons: [{ text: 'OK', style: 'default', onPress: () => router.back() }],
      });
    } else {
      showError('Error', result.message ?? 'Failed to cancel order.');
    }
  };

  if (loading || !order) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  const isEditable = !['completed', 'cancelled'].includes(order.orderStatus);

  const isInclusive = bill?.taxType === 'inclusive' || (bill?.taxBreakdown && bill.taxBreakdown.some((t: any) => t.inclusive)) || (order?.taxBreakdown && order.taxBreakdown.some((t: any) => t.inclusive)) || order?.taxType === 'inclusive';
  const totalTaxPercent = bill?.taxBreakdown?.reduce((sum: number, t: any) => sum + (t.percent || 0), 0) || order?.taxBreakdown?.reduce((sum: number, t: any) => sum + (t.percent || 0), 0) || 0;
  const divisor = 1 + totalTaxPercent / 100;

  const getDispPrice = (price: number) => {
    return price;
  };

  const displayedSubtotal = bill?.subtotal || order.totalAmount;

  return (
    <View style={[{ flex: 1, backgroundColor: c.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={c.primary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: c.text }]}>Order #{order.dailyOrderNo}</Text>
          <Text style={[styles.headerSub, { color: c.textSecondary }]}>Table {order.tableNo}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: (order.orderStatus === 'ready' ? c.success : c.primary) + '15' }]}>
          <Text style={[styles.statusText, { color: order.orderStatus === 'ready' ? c.success : c.primary }]}>
            {order.orderStatus}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer info */}
        {order.customer && (
          <Animated.View
            entering={FadeInDown.delay(60).duration(320)}
            style={[styles.infoCard, { backgroundColor: c.card, borderColor: c.border }]}
          >
            <MaterialCommunityIcons name="account-outline" size={16} color={c.textSecondary} />
            <Text style={[styles.infoText, { color: c.text }]}>
              {order.customer.name} · {order.customer.mobile}
            </Text>
          </Animated.View>
        )}

        {/* Items */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Items</Text>
          {isEditable && order.customerToken?.startsWith('tok_manual_') && (
            <Pressable
              onPress={() => setShowMenuPicker(true)}
              style={[styles.addItemBtn, { borderColor: c.primary }]}
            >
              <MaterialCommunityIcons name="pencil-outline" size={14} color={c.primary} />
              <Text style={[styles.addItemText, { color: c.primary }]}>Add/Edit Items</Text>
            </Pressable>
          )}
        </View>

        {order.ordersInfo.map((item, i) => {
          const itemPrice = getDispPrice(item.price);
          const itemTotal = itemPrice * item.quantity;
          const lockedItem = order.lockedItems?.find(l => l.dishId === item.dishId);
          const isLocked = !!lockedItem;
          return (
            <Animated.View
              key={item.dishId + i}
              entering={FadeInDown.delay(80 + i * 40).duration(300)}
              style={[styles.itemRow, { backgroundColor: c.card, borderColor: c.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: c.text }]}>{item.dishName}</Text>
                {item.remarks && (
                  <Text style={[styles.itemRemarks, { color: c.textSecondary }]}>Note: {item.remarks}</Text>
                )}
                {isLocked && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <MaterialCommunityIcons name="lock" size={12} color={c.success} />
                    <Text style={{ fontSize: 11, color: c.success, fontWeight: '700' }}>
                      Served ({lockedItem.quantity})
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.itemQty, { color: c.textSecondary }]}>×{item.quantity}</Text>
              <Text numberOfLines={1} style={[styles.itemPrice, { color: c.text }]}>₹{itemTotal.toFixed(2)}</Text>
            </Animated.View>
          );
        })}

        {/* Bill summary */}
        {bill && (
          <Animated.View
            entering={FadeInDown.delay(200).duration(320)}
            style={[styles.billCard, { backgroundColor: c.card, borderColor: c.border }]}
          >
            <Text style={[styles.sectionTitle, { color: c.text, marginBottom: 10 }]}>Bill</Text>
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: c.textSecondary }]}>Subtotal</Text>
              <Text numberOfLines={1} style={[styles.billValue, { color: c.text }]}>₹{displayedSubtotal.toFixed(2)}</Text>
            </View>
            {(bill.discountBreakdown ?? []).map((d, idx) => (
              <View key={d.name + idx} style={styles.billRow}>
                <Text style={[styles.billLabel, { color: c.success }]}>🏷️ {d.name} ({d.percent}%)</Text>
                <Text numberOfLines={1} style={[styles.billValue, { color: c.success }]}>-₹{(Number(d.amount) || 0).toFixed(2)}</Text>
              </View>
            ))}
            {(bill.taxBreakdown ?? []).map((t) => (
              <View key={t.name} style={styles.billRow}>
                <Text style={[styles.billLabel, { color: c.textSecondary }]}>{t.name} ({t.percent}%{t.inclusive ? ' Incl.' : ' Excl.'})</Text>
                <Text numberOfLines={1} style={[styles.billValue, { color: c.textSecondary }]}>₹{(Number(t.amount) || 0).toFixed(2)}</Text>
              </View>
            ))}
            <View style={[styles.billRow, styles.billTotalRow, { borderTopColor: c.border }]}>
              <Text style={[styles.billTotalLabel, { color: c.text }]}>Total</Text>
              <Text numberOfLines={1} style={[styles.billTotalValue, { color: c.primary }]}>₹{(Number(bill.finalAmount) || 0).toFixed(2)}</Text>
            </View>
            {isInclusive && (
              <Text style={{ fontSize: 11, color: c.textSecondary, fontStyle: 'italic', marginTop: 8 }}>
                * Dishes are inclusive of taxes. Taxes have been extracted for display.
              </Text>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionBar, { backgroundColor: c.card, borderTopColor: c.border, paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
        {actionLoading ? (
          <ActivityIndicator size="small" color={c.primary} />
        ) : (
          <>
             {isEditable && (
              <View style={{ gap: 10, width: '100%' }}>
                {order.orderStatus === 'serving' ? (
                  <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                    <Pressable
                      onPress={() => setShowCancelModal(true)}
                      style={[styles.cancelBtn, { borderColor: c.error }]}
                    >
                      <MaterialCommunityIcons name="close-circle-outline" size={18} color={c.error} />
                      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.cancelBtnText, { color: c.error }]}>Cancel Order</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => { fetchBill(); setShowPayment(true); }}
                      style={[styles.actionBtn, { backgroundColor: c.primary }]}
                    >
                      <MaterialCommunityIcons name="cash-register" size={18} color="#fff" />
                      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.actionBtnText}>Conclude Order</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={{ gap: 10, width: '100%' }}>
                    <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                      <Pressable
                        onPress={() => setShowCancelModal(true)}
                        style={[styles.cancelBtn, { borderColor: c.error }]}
                      >
                        <MaterialCommunityIcons name="close-circle-outline" size={18} color={c.error} />
                        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.cancelBtnText, { color: c.error }]}>Cancel Order</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleStartServing}
                        style={[styles.actionBtn, { backgroundColor: c.success }]}
                      >
                        <MaterialCommunityIcons name="room-service-outline" size={18} color="#fff" />
                        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.actionBtnText}>Start Serving</Text>
                      </Pressable>
                    </View>
                    <Pressable
                      onPress={() => { fetchBill(); setShowPayment(true); }}
                      style={[styles.actionBtn, { backgroundColor: c.primary, width: '100%', flex: 0 }]}
                    >
                      <MaterialCommunityIcons name="cash-register" size={18} color="#fff" />
                      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.actionBtnText}>Conclude Order</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </View>

      {/* Modals */}
      <PaymentModal
        visible={showPayment}
        onClose={() => setShowPayment(false)}
        bill={bill}
        onConfirm={handleConclude}
        confirming={confirming}
        colors={c}
      />

      <MenuPickerModal
        visible={showMenuPicker}
        onClose={() => setShowMenuPicker(false)}
        orderInfo={order.ordersInfo}
        lockedItems={order.lockedItems || []}
        onSave={handleSaveMenuModifications}
        saving={savingMenu}
        colors={c}
        accessToken={accessToken || ''}
        refreshToken={refreshToken || ''}
        handleDisabled={handleDisabled}
      />

      {/* Concluded Receipt Modal (QR Code) */}
      <Modal visible={showReceipt} transparent={false} animationType="slide" onRequestClose={() => { setShowReceipt(false); router.back(); }}>
        <View style={{ flex: 1, backgroundColor: c.background, paddingTop: Platform.OS === 'ios' ? 48 : 24, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', gap: 20 }}>
          <MaterialCommunityIcons name="check-circle" size={64} color={c.success} />
          
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: c.text }}>Payment Successful</Text>
            <Text style={{ fontSize: 14, color: c.textSecondary, textAlign: 'center' }}>
              Order Concluded! Show the QR code below to the customer to scan and view/download their PDF bill receipt.
            </Text>
          </View>

          {/* QR Code Container */}
          {receiptUrl ? (
            <View style={{ padding: 16, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: c.border }}>
              <Image
                source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(receiptUrl)}` }}
                style={{ width: 220, height: 220 }}
                resizeMode="contain"
              />
            </View>
          ) : (
            <ActivityIndicator size="large" color={c.primary} />
          )}

          {/* Transaction details card */}
          {receiptBill && (
            <View style={{ width: '100%', padding: 16, borderRadius: 12, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: c.textSecondary }}>Bill/Invoice</Text>
                <Text style={{ color: c.text, fontWeight: '700' }}>{receiptBill.invoiceNo}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: c.textSecondary }}>Payment Method</Text>
                <Text style={{ color: c.text, fontWeight: '700' }}>{receiptBill.paymentMethod}</Text>
              </View>
              <View style={{ height: 1, backgroundColor: c.border }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: c.text, fontWeight: '800' }}>Amount Paid</Text>
                <Text style={{ color: c.primary, fontWeight: '800', fontSize: 16 }}>₹{Number(receiptBill.totalAmount).toFixed(2)}</Text>
              </View>
            </View>
          )}

          <Pressable
            onPress={() => {
              setShowReceipt(false);
              router.back();
            }}
            style={{ width: '100%', backgroundColor: c.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 16 }}>Done & Finish</Text>
          </Pressable>
        </View>
      </Modal>

      {/* Cancel Order Modal */}
      <Modal visible={showCancelModal} transparent animationType="slide" onRequestClose={() => setShowCancelModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowCancelModal(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.card, borderColor: c.border }]} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: c.text }]}>Cancel Order</Text>
              <Pressable onPress={() => setShowCancelModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color={c.textSecondary} />
              </Pressable>
            </View>
            
            <Text style={{ fontSize: 14, color: c.textSecondary, marginBottom: 12 }}>
              Please specify the reason for cancelling this order.
            </Text>

            <TextInput
              style={[
                styles.cancelInput,
                {
                  backgroundColor: c.background,
                  borderColor: c.border,
                  color: c.text,
                }
              ]}
              multiline
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="e.g. Customer walked out / Duplicate order..."
              placeholderTextColor={c.textSecondary + '70'}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowCancelModal(false)}
                disabled={cancelling}
                style={[styles.modalBtn, { borderWidth: 1.5, borderColor: c.border }]}
              >
                <Text style={{ color: c.textSecondary, fontWeight: '700', fontSize: 15 }}>Back</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmCancel}
                disabled={cancelling || !cancelReason.trim()}
                style={[styles.modalBtn, { backgroundColor: c.error, opacity: (cancelling || !cancelReason.trim()) ? 0.6 : 1 }]}
              >
                {cancelling ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Cancel Order</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSub: { fontSize: 13, fontWeight: '500' },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },

  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },

  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 14,
  },
  infoText: { fontSize: 13, fontWeight: '500' },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  addItemBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1,
  },
  addItemText: { fontSize: 12, fontWeight: '700' },

  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 8,
  },
  itemName: { fontSize: 14, fontWeight: '600' },
  itemRemarks: { fontSize: 11, fontWeight: '400', marginTop: 2 },
  itemQty: { fontSize: 13, fontWeight: '600' },
  itemPrice: { fontSize: 14, fontWeight: '700', minWidth: 48, textAlign: 'right' },
  removeBtn: { padding: 2 },

  billCard: { borderRadius: 14, borderWidth: 1.5, padding: 14, marginTop: 8, marginBottom: 16 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  billTotalRow: { borderTopWidth: 1, paddingTop: 10, marginTop: 4 },
  billLabel: { fontSize: 13, fontWeight: '500' },
  billValue: { fontSize: 13, fontWeight: '600' },
  billTotalLabel: { fontSize: 15, fontWeight: '800' },
  billTotalValue: { fontSize: 18, fontWeight: '800' },

  actionBar: {
    flexDirection: 'row', padding: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12,
  },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Modals
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1, padding: 20, paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },

  billBox: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 4 },
  methodRow: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 6 },
  methodBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5,
  },
  methodLabel: { fontSize: 12 },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 14,
  },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemName: { fontSize: 14, fontWeight: '600' },
  menuItemCat: { fontSize: 11, fontWeight: '400', marginTop: 2 },
  menuItemPrice: { fontSize: 14, fontWeight: '700' },
  selectedItem: { borderRadius: 10, borderWidth: 1, padding: 12, flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  input: {
    borderRadius: 10, borderWidth: 1.5,
    paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 9, fontSize: 15,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalBtn: { flex: 1, alignItems: 'center', borderRadius: 12, paddingVertical: 13, justifyContent: 'center' },
  cancelBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700' },
  cancelInput: {
    borderRadius: 10, borderWidth: 1.5, padding: 12, fontSize: 15, minHeight: 90, textAlignVertical: 'top',
  },

  // ── Menu Picker styles ──
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  categoryPill: {
    borderWidth: 1.5,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    justifyContent: 'center',
  },
  dishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  dishName: {
    fontSize: 15,
    fontWeight: '700',
  },
  dishPrice: {
    fontSize: 14,
    fontWeight: '800',
  },
  addBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 15,
    fontWeight: '800',
    minWidth: 16,
    textAlign: 'center',
  },
});
