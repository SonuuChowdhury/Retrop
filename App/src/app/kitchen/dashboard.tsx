// ============================================================================
// KITCHEN — DASHBOARD SCREEN  (NEW)
// ============================================================================
// Kanban-style board: QUEUE → PREPARING → READY → SERVING
// Auto-refresh every 30s + socket.io real-time events.
// ============================================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKitchenAuth } from '@/context/KitchenAuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ENDPOINTS } from '@/config/api';
import { apiCall } from '@/utils/apiClient';
import { setupNotificationListeners } from '@/services/notificationService';
import { getSocket } from '@/utils/socket';

// ============================================================================
// TYPES
// ============================================================================

type KanbanStatus = 'ordering' | 'preparing' | 'ready' | 'serving';

interface KitchenOrderItem { dishName: string; quantity: number }
interface KitchenOrder {
  ordersId: string;
  dailyOrderNo: number;
  tableNo: number;
  orderStatus: KanbanStatus;
  ordersInfo: KitchenOrderItem[];
  customer?: { name: string };
  createdAt: string;
  isModified?: boolean;
}

interface KitchenDashboard {
  orders: KitchenOrder[];
}

// ============================================================================
// HELPERS
// ============================================================================

function elapsed(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return '<1m';
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

const COLUMN_CFG: { status: KanbanStatus; label: string; color: string; icon: string; actionLabel?: string }[] = [
  { status: 'ordering',  label: 'Queue',     color: '#FF6B35', icon: 'clock-outline',          actionLabel: 'Start Preparing' },
  { status: 'preparing', label: 'Preparing', color: '#FFA726', icon: 'chef-hat',                actionLabel: 'Mark Ready' },
  { status: 'ready',     label: 'Ready',     color: '#4CAF50', icon: 'check-circle-outline' },
  { status: 'serving',   label: 'Serving',   color: '#42A5F5', icon: 'room-service-outline' },
];

// ============================================================================
// ORDER CARD
// ============================================================================

function KitchenOrderCard({
  order, colors, onAction, actionLabel, actionLoading, highlighted,
}: {
  order: KitchenOrder; colors: any;
  onAction?: () => void; actionLabel?: string; actionLoading?: boolean; highlighted?: boolean;
}) {
  const minElapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
  const isUrgent = minElapsed > 20 && order.orderStatus !== 'ready' && order.orderStatus !== 'serving';

  return (
    <Animated.View
      entering={FadeInRight.duration(300)}
      style={[
        styles.orderCard,
        {
          backgroundColor: highlighted ? colors.warning + '12' : colors.card,
          borderColor: highlighted ? colors.warning : isUrgent ? colors.error + '50' : colors.border,
          borderWidth: highlighted || isUrgent ? 2 : 1.5,
        },
      ]}
    >
      {/* Card header */}
      <View style={styles.cardHeader}>
        <Text style={[styles.orderNo, { color: colors.text }]}>#{order.dailyOrderNo}</Text>
        <View style={styles.headerRight}>
          {isUrgent && (
            <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
          )}
          {highlighted && (
            <MaterialCommunityIcons name="pencil-circle" size={14} color={colors.warning} />
          )}
          <Text style={[styles.elapsedTime, { color: isUrgent ? colors.error : colors.textSecondary }]}>
            {elapsed(order.createdAt)}
          </Text>
        </View>
      </View>

      {/* Table + Customer */}
      <View style={styles.cardMeta}>
        <View style={[styles.tableChip, { backgroundColor: colors.primary + '12' }]}>
          <MaterialCommunityIcons name="table-chair" size={11} color={colors.primary} />
          <Text style={[styles.tableText, { color: colors.primary }]}>T{order.tableNo}</Text>
        </View>
        {order.customer?.name && (
          <Text style={[styles.customerText, { color: colors.textSecondary }]} numberOfLines={1}>
            {order.customer.name}
          </Text>
        )}
      </View>

      {/* Items */}
      <View style={styles.itemsList}>
        {order.ordersInfo.map((item, i) => (
          <Text key={i} style={[styles.itemLine, { color: colors.text }]}>
            <Text style={{ fontWeight: '700' }}>{item.quantity}×</Text> {item.dishName}
          </Text>
        ))}
      </View>

      {/* Action button */}
      {onAction && actionLabel && (
        <Pressable
          onPress={onAction}
          disabled={actionLoading}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: order.orderStatus === 'ordering' ? colors.warning : colors.success,
              opacity: pressed || actionLoading ? 0.75 : 1,
            },
          ]}
        >
          {actionLoading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.actionBtnText}>{actionLabel}</Text>
          }
        </Pressable>
      )}
    </Animated.View>
  );
}

// ============================================================================
// COLUMN
// ============================================================================

function KanbanColumn({
  cfg, orders, colors, onAction, actionLoadingId, highlightedId,
}: {
  cfg: typeof COLUMN_CFG[number];
  orders: KitchenOrder[];
  colors: any;
  onAction?: (orderId: string) => void;
  actionLoadingId?: string | null;
  highlightedId?: string | null;
}) {
  return (
    <View style={[styles.column, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Column header */}
      <View style={[styles.columnHeader, { borderBottomColor: colors.border }]}>
        <View style={[styles.columnDot, { backgroundColor: cfg.color }]} />
        <Text style={[styles.columnTitle, { color: colors.text }]}>{cfg.label}</Text>
        <View style={[styles.columnCount, { backgroundColor: cfg.color + '20' }]}>
          <Text style={[styles.columnCountText, { color: cfg.color }]}>{orders.length}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.columnContent}
        nestedScrollEnabled
      >
        {orders.length === 0 && (
          <View style={[styles.emptyCol, { borderColor: colors.border }]}>
            <MaterialCommunityIcons name={cfg.icon as any} size={22} color={colors.border} />
          </View>
        )}
        {orders.map((order) => (
          <KitchenOrderCard
            key={order.ordersId}
            order={order}
            colors={colors}
            onAction={onAction ? () => onAction(order.ordersId) : undefined}
            actionLabel={cfg.actionLabel}
            actionLoading={actionLoadingId === order.ordersId}
            highlighted={highlightedId === order.ordersId}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function KitchenDashboard() {
  const { kitchen, accessToken, refreshToken, logout } = useKitchenAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleDisabled = useCallback(() => { logout(); }, [logout]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchDashboard = useCallback(async () => {
    const result = await apiCall(
      ENDPOINTS.KITCHEN_DASHBOARD,
      { method: 'GET' },
      async () => accessToken,
      refreshToken,
      handleDisabled,
    );
    if (result.success) {
      const data = result.data as any;
      // Backend returns { queued, preparing, ready, serving } as separate arrays.
      // Merge them into one list — the Kanban board filters by status itself.
      const merged: KitchenOrder[] = [
        ...(data.queued    ?? []),
        ...(data.preparing ?? []),
        ...(data.ready     ?? []),
        ...(data.serving   ?? []),
        // Fallback: if backend ever switches to a flat `orders` array
        ...(data.orders    ?? []),
      ];
      setOrders(merged);
      setError(null);
    } else {
      setError(result.message ?? 'Failed to load orders.');
    }
    setLoading(false);
    setRefreshing(false);
  }, [accessToken, refreshToken, handleDisabled]);

  useEffect(() => {
    fetchDashboard();
    autoRefreshRef.current = setInterval(fetchDashboard, 30_000);
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current); };
  }, []);

  // ── Push notifications ────────────────────────────────────────────────────
  useEffect(() => {
    const cleanup = setupNotificationListeners(
      (notification) => {
        const data = notification.request.content.data as any;
        if (data?.type === 'order_modified' && data.orderId) {
          setHighlightedId(data.orderId);
          fetchDashboard();
          setTimeout(() => setHighlightedId(null), 8000);
        }
        if (data?.type === 'new_order') { fetchDashboard(); }
      },
      () => {},
    );
    return cleanup;
  }, [fetchDashboard]);

  // ── Socket ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewOrder = () => { fetchDashboard(); };
    const onModified = (data: any) => {
      if (data?.orderId) {
        setHighlightedId(data.orderId);
        setTimeout(() => setHighlightedId(null), 8000);
      }
      fetchDashboard();
    };

    socket.on('order:new', onNewOrder);
    socket.on('order:modified', onModified);
    return () => {
      socket.off('order:new', onNewOrder);
      socket.off('order:modified', onModified);
    };
  }, [fetchDashboard]);

  // ── Start / Ready actions ─────────────────────────────────────────────────
  const handleAction = async (orderId: string, status: 'ordering' | 'preparing') => {
    const endpoint = status === 'ordering' ? ENDPOINTS.KITCHEN_START(orderId) : ENDPOINTS.KITCHEN_READY(orderId);
    setActionLoadingId(orderId);
    const result = await apiCall(endpoint, { method: 'PATCH' }, async () => accessToken, refreshToken, handleDisabled);
    if (result.success) {
      fetchDashboard();
    } else {
      Alert.alert('Error', result.message ?? 'Action failed.');
    }
    setActionLoadingId(null);
  };

  // ── Partition orders ──────────────────────────────────────────────────────
  const getOrders = (status: KanbanStatus) => orders.filter((o) => o.orderStatus === status);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  return (
    <View style={[{ flex: 1, backgroundColor: c.background }]}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(350)} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={[styles.title, { color: c.text }]}>Kitchen</Text>
          <Text style={[styles.kitchenName, { color: c.textSecondary }]}>{kitchen?.kitchenName}</Text>
        </View>
        <Pressable
          onPress={() => { setRefreshing(true); fetchDashboard(); }}
          style={[styles.refreshBtn, { backgroundColor: c.card, borderColor: c.border }]}
        >
          <MaterialCommunityIcons name="refresh" size={18} color={c.primary} />
        </Pressable>
      </Animated.View>

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: c.error + '12', borderColor: c.error + '30' }]}>
          <Text style={[{ color: c.error, flex: 1, fontSize: 13 }]}>{error}</Text>
          <Pressable onPress={fetchDashboard}><Text style={{ color: c.primary, fontWeight: '700' }}>Retry</Text></Pressable>
        </View>
      )}

      {/* Kanban Board */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.board, { paddingBottom: insets.bottom + 80 }]}
      >
        {COLUMN_CFG.map((cfg) => (
          <KanbanColumn
            key={cfg.status}
            cfg={cfg}
            orders={getOrders(cfg.status)}
            colors={c}
            onAction={cfg.actionLabel ? (id) => handleAction(id, cfg.status as 'ordering' | 'preparing') : undefined}
            actionLoadingId={actionLoadingId}
            highlightedId={highlightedId}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  kitchenName: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  refreshBtn: {
    width: 38, height: 38, borderRadius: 10, justifyContent: 'center',
    alignItems: 'center', borderWidth: 1,
  },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1,
    padding: 12, marginHorizontal: 16, marginBottom: 8, gap: 8,
  },

  board: { paddingHorizontal: 12, gap: 10, alignItems: 'flex-start' },

  column: {
    width: 200, borderRadius: 14, borderWidth: 1.5,
    maxHeight: '100%',
  },
  columnHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    padding: 12, borderBottomWidth: 1,
  },
  columnDot: { width: 8, height: 8, borderRadius: 4 },
  columnTitle: { flex: 1, fontSize: 13, fontWeight: '700' },
  columnCount: { paddingVertical: 2, paddingHorizontal: 7, borderRadius: 8 },
  columnCountText: { fontSize: 11, fontWeight: '800' },
  columnContent: { padding: 8, gap: 8 },
  emptyCol: {
    height: 80, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
  },

  orderCard: { borderRadius: 10, borderWidth: 1.5, padding: 10, gap: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNo: { fontSize: 14, fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  elapsedTime: { fontSize: 10, fontWeight: '600' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tableChip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 5 },
  tableText: { fontSize: 10, fontWeight: '700' },
  customerText: { fontSize: 11, fontWeight: '400', flex: 1 },
  itemsList: { gap: 3 },
  itemLine: { fontSize: 12, lineHeight: 17 },
  actionBtn: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 7, borderRadius: 8, marginTop: 2,
  },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
