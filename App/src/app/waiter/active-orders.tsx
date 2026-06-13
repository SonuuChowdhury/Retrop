// ============================================================================
// WAITER — ACTIVE ORDERS SCREEN  (NEW)
// ============================================================================
// Lists all non-completed orders for this waiter.
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Pressable, ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useWaiterAuth } from '@/context/WaiterAuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ENDPOINTS } from '@/config/api';
import { apiCall } from '@/utils/apiClient';
import { getSocket } from '@/utils/socket';

import { SkeletonLoader, SkeletonRow } from '@/components/SkeletonLoader/SkeletonLoader';

// ============================================================================
// TYPES
// ============================================================================

type OrderStatus = 'ordering' | 'preparing' | 'ready' | 'serving';

interface ActiveOrder {
  ordersId: string;
  dailyOrderNo: number;
  tableNo: number;
  orderStatus: OrderStatus;
  totalAmount: number;
  customer?: { name: string; mobile: string };
  ordersInfo?: { dishId: string; quantity: number }[];
  createdAt: string;
}

const STATUS_CFG: Record<OrderStatus, { color: string; label: string; icon: string }> = {
  ordering:  { color: '#FF6B35', label: 'Ordering',  icon: 'food-outline' },
  preparing: { color: '#FFA726', label: 'Preparing', icon: 'chef-hat' },
  ready:     { color: '#4CAF50', label: 'Ready ✓',   icon: 'check-circle-outline' },
  serving:   { color: '#42A5F5', label: 'Serving',   icon: 'room-service-outline' },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

// ============================================================================
// ORDER ROW
// ============================================================================

function OrderRow({ order, colors, onPress }: { order: ActiveOrder; colors: any; onPress: () => void }) {
  const cfg = STATUS_CFG[order.orderStatus] ?? { color: colors.primary, label: order.orderStatus, icon: 'receipt' };
  const isReady = order.orderStatus === 'ready';
  const itemCount = order.ordersInfo?.reduce((s, i) => s + i.quantity, 0) ?? 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.orderRow,
        {
          backgroundColor: isReady ? colors.success + '10' : colors.card,
          borderColor: isReady ? colors.success : colors.border,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      {isReady && (
        <View style={[styles.readyStripe, { backgroundColor: colors.success }]} />
      )}

      <View style={styles.orderLeft}>
        <View style={styles.orderTopLine}>
          <Text style={[styles.orderNo, { color: colors.text }]}>#{order.dailyOrderNo}</Text>
          <View style={[styles.statusPill, { backgroundColor: cfg.color + '18' }]}>
            <MaterialCommunityIcons name={cfg.icon as any} size={11} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
        <View style={styles.orderMetaRow}>
          <MaterialCommunityIcons name="table-chair" size={12} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>Table {order.tableNo}</Text>
          {order.customer?.name && (
            <>
              <Text style={[{ color: colors.border }]}>·</Text>
              <MaterialCommunityIcons name="account-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>{order.customer.name}</Text>
            </>
          )}
        </View>
        <Text style={[styles.timeText, { color: colors.textSecondary }]}>{relativeTime(order.createdAt)}</Text>
      </View>

      <View style={styles.orderRight}>
        <Text style={[styles.amount, { color: colors.text }]}>₹{order.totalAmount}</Text>
        {itemCount > 0 && (
          <Text style={[styles.itemCount, { color: colors.textSecondary }]}>{itemCount} items</Text>
        )}
        <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
      </View>
    </Pressable>
  );
}

// ============================================================================
// SCREEN
// ============================================================================

export default function ActiveOrdersScreen() {
  const { accessToken, refreshToken, logout } = useWaiterAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = theme.colors;

  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDisabled = useCallback(() => {
    logout();
  }, [logout]);

  const fetchOrders = useCallback(async () => {
    const result = await apiCall(
      ENDPOINTS.WAITER_ACTIVE_ORDERS,
      { method: 'GET' },
      async () => accessToken,
      refreshToken,
      handleDisabled,
    );

    if (result.success) {
      setOrders(result.data as ActiveOrder[] ?? []);
      setError(null);
    } else {
      setError(result.message ?? 'Failed to load orders.');
    }
    setLoading(false);
    setRefreshing(false);
  }, [accessToken, refreshToken, handleDisabled]);

  useEffect(() => { fetchOrders(); }, []);

  // Socket refresh
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const refresh = () => fetchOrders();
    socket.on('order:ready', refresh);
    socket.on('order:modified', refresh);
    return () => {
      socket.off('order:ready', refresh);
      socket.off('order:modified', refresh);
    };
  }, [fetchOrders]);

  const statusFilter = (s: OrderStatus) => orders.filter((o) => o.orderStatus === s);
  const readyOrders = statusFilter('ready');
  const otherOrders = orders.filter((o) => o.orderStatus !== 'ready');

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background, paddingTop: insets.top + 12, paddingHorizontal: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <SkeletonLoader width={180} height={28} />
          <SkeletonLoader width={34} height={22} borderRadius={11} />
        </View>

        {/* Rows */}
        <View style={{ gap: 10 }}>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </View>
      </View>
    );
  }

  return (
    <View style={[{ flex: 1, backgroundColor: c.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: c.text }]}>Active Orders</Text>
        <View style={[styles.countBadge, { backgroundColor: c.primary + '15' }]}>
          <Text style={[styles.countText, { color: c.primary }]}>{orders.length}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor={c.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: c.error + '12', borderColor: c.error + '30' }]}>
            <Text style={[{ color: c.error, flex: 1, fontSize: 13 }]}>{error}</Text>
            <Pressable onPress={fetchOrders}><Text style={{ color: c.primary, fontWeight: '700' }}>Retry</Text></Pressable>
          </View>
        )}

        {/* Ready orders first */}
        {readyOrders.length > 0 && (
          <>
            <Text style={[styles.groupLabel, { color: c.success }]}>
              <MaterialCommunityIcons name="bell-ring" size={13} /> Ready to Serve ({readyOrders.length})
            </Text>
            {readyOrders.map((o, i) => (
              <Animated.View key={o.ordersId} entering={FadeInDown.delay(i * 50).duration(300)}>
                <OrderRow order={o} colors={c} onPress={() => router.push(`/waiter/order-detail?orderId=${o.ordersId}` as any)} />
              </Animated.View>
            ))}
          </>
        )}

        {/* Other active orders */}
        {otherOrders.length > 0 && (
          <>
            {readyOrders.length > 0 && (
              <Text style={[styles.groupLabel, { color: c.textSecondary }]}>In Progress ({otherOrders.length})</Text>
            )}
            {otherOrders.map((o, i) => (
              <Animated.View key={o.ordersId} entering={FadeInDown.delay((readyOrders.length + i) * 50).duration(300)}>
                <OrderRow order={o} colors={c} onPress={() => router.push(`/waiter/order-detail?orderId=${o.ordersId}` as any)} />
              </Animated.View>
            ))}
          </>
        )}

        {orders.length === 0 && !error && (
          <Animated.View entering={FadeIn.duration(300)} style={[styles.emptyState, { backgroundColor: c.card, borderColor: c.border }]}>
            <MaterialCommunityIcons name="receipt" size={40} color={c.textSecondary} />
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>No active orders right now</Text>
            <Text style={[styles.emptyHint, { color: c.textSecondary }]}>Pull down to refresh</Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  countBadge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 12 },
  countText: { fontSize: 13, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    borderWidth: 1, padding: 12, marginBottom: 12, gap: 8,
  },

  groupLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3, marginBottom: 8, marginTop: 4 },

  orderRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 10,
    overflow: 'hidden',
  },
  readyStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  orderLeft: { flex: 1, gap: 4 },
  orderTopLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderNo: { fontSize: 16, fontWeight: '800' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 3, paddingHorizontal: 7, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  orderMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontWeight: '500' },
  timeText: { fontSize: 11, fontWeight: '400' },
  orderRight: { alignItems: 'flex-end', gap: 2 },
  amount: { fontSize: 17, fontWeight: '800' },
  itemCount: { fontSize: 11, fontWeight: '500' },

  emptyState: { alignItems: 'center', padding: 40, borderRadius: 16, borderWidth: 1.5, gap: 8, marginTop: 16 },
  emptyText: { fontSize: 15, fontWeight: '600' },
  emptyHint: { fontSize: 12, fontWeight: '400' },
});
