// ============================================================================
// WAITER — ORDER DETAIL SCREEN  (NEW)
// ============================================================================
// Full order view: items, bill preview, status actions, payment modal.
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Alert, Modal, FlatList, TextInput, Platform,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { useWaiterAuth } from '@/context/WaiterAuthContext';
import { useTheme } from '@/context/ThemeContext';
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

  const isInclusive = bill?.taxType === 'inclusive' || (bill?.taxBreakdown && bill.taxBreakdown.some((t: any) => t.inclusive));
  const displayedSubtotal = isInclusive && bill
    ? parseFloat((bill.finalAmount - (bill.taxBreakdown?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0)).toFixed(2))
    : (bill?.subtotal || 0);

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
                <Text style={[styles.billValue, { color: colors.text }]}>₹{displayedSubtotal.toFixed(2)}</Text>
              </View>
              {(bill.discountBreakdown ?? []).map((d, idx) => (
                <View key={d.name + idx} style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: colors.success }]}>🏷️ {d.name} ({d.percent}%)</Text>
                  <Text style={[styles.billValue, { color: colors.success }]}>-₹{(Number(d.amount) || 0).toFixed(2)}</Text>
                </View>
              ))}
              {(bill.taxBreakdown ?? []).map((t) => (
                <View key={t.name} style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: colors.textSecondary }]}>{t.name} ({t.percent}%{t.inclusive ? ' Incl.' : ''})</Text>
                  <Text style={[styles.billValue, { color: colors.textSecondary }]}>₹{(Number(t.amount) || 0).toFixed(2)}</Text>
                </View>
              ))}
              <View style={[styles.billRow, styles.billTotalRow]}>
                <Text style={[styles.billTotalLabel, { color: colors.text }]}>Total</Text>
                <Text style={[styles.billTotalValue, { color: colors.primary }]}>₹{(Number(bill.finalAmount) || 0).toFixed(2)}</Text>
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



// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { accessToken, refreshToken, logout } = useWaiterAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = theme.colors;

  const [order, setOrder] = useState<Order | null>(null);
  const [bill, setBill] = useState<BillPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleDisabled = useCallback(() => {
    Alert.alert('Account Disabled', 'Your account has been disabled by the manager.', [
      { text: 'OK', onPress: () => logout() },
    ]);
  }, [logout]);

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
    if (result.success) setOrder(result.data as Order);
    setLoading(false);
  }, [orderId, accessToken, refreshToken, handleDisabled]);

  // ── Fetch bill preview ───────────────────────────────────────────────────
  const fetchBill = useCallback(async () => {
    if (!orderId) return;
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
  }, [orderId, accessToken, refreshToken, handleDisabled]);

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
      Alert.alert('Error', result.message ?? 'Failed to update status.');
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
      Alert.alert('Payment Confirmed', 'Order concluded successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else if (result.message?.includes('Already paid') || result.message?.includes('already')) {
      Alert.alert('Already Paid', 'This order has already been paid.');
    } else {
      Alert.alert('Error', result.message ?? 'Failed to conclude order.');
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
    return isInclusive ? parseFloat((price / divisor).toFixed(2)) : price;
  };

  const displayedSubtotal = isInclusive && bill
    ? parseFloat((bill.finalAmount - (bill.taxBreakdown?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0)).toFixed(2))
    : (bill?.subtotal || order.totalAmount);

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
              <Text style={[styles.itemPrice, { color: c.text }]}>₹{itemTotal.toFixed(2)}</Text>
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
              <Text style={[styles.billValue, { color: c.text }]}>₹{displayedSubtotal.toFixed(2)}</Text>
            </View>
            {(bill.discountBreakdown ?? []).map((d, idx) => (
              <View key={d.name + idx} style={styles.billRow}>
                <Text style={[styles.billLabel, { color: c.success }]}>🏷️ {d.name} ({d.percent}%)</Text>
                <Text style={[styles.billValue, { color: c.success }]}>-₹{(Number(d.amount) || 0).toFixed(2)}</Text>
              </View>
            ))}
            {(bill.taxBreakdown ?? []).map((t) => (
              <View key={t.name} style={styles.billRow}>
                <Text style={[styles.billLabel, { color: c.textSecondary }]}>{t.name} ({t.percent}%{t.inclusive ? ' Incl.' : ''})</Text>
                <Text style={[styles.billValue, { color: c.textSecondary }]}>₹{(Number(t.amount) || 0).toFixed(2)}</Text>
              </View>
            ))}
            <View style={[styles.billRow, styles.billTotalRow, { borderTopColor: c.border }]}>
              <Text style={[styles.billTotalLabel, { color: c.text }]}>Total</Text>
              <Text style={[styles.billTotalValue, { color: c.primary }]}>₹{(Number(bill.finalAmount) || 0).toFixed(2)}</Text>
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
            {order.orderStatus === 'ready' && (
              <Pressable
                onPress={handleStartServing}
                style={[styles.actionBtn, { backgroundColor: c.success }]}
              >
                <MaterialCommunityIcons name="room-service-outline" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Start Serving</Text>
              </Pressable>
            )}
            {order.orderStatus === 'serving' && (
              <Pressable
                onPress={() => { fetchBill(); setShowPayment(true); }}
                style={[styles.actionBtn, { backgroundColor: c.primary }]}
              >
                <MaterialCommunityIcons name="cash-register" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Conclude Order</Text>
              </Pressable>
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
});
