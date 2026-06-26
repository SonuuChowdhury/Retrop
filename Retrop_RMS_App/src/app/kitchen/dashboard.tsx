// ============================================================================
// KITCHEN — DASHBOARD SCREEN
// ============================================================================
// Kanban-style board: QUEUE → PREPARING → READY → SERVING
// Auto-refresh every 30s + socket.io real-time events.
// When a customer modifies an order, the card shows a prominent "UPDATED" banner.
// ============================================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInRight, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKitchenAuth } from '@/context/KitchenAuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useDialog } from '@/context/DialogContext';
import { ENDPOINTS } from '@/config/api';
import { apiCall } from '@/utils/apiClient';
import { setupNotificationListeners } from '@/services/notificationService';
import { getSocket } from '@/utils/socket';

import { SkeletonLoader, SkeletonCard } from '@/components/SkeletonLoader/SkeletonLoader';

// ============================================================================
// TYPES
// ============================================================================

type KanbanStatus = 'ordering' | 'preparing' | 'ready' | 'serving';

interface KitchenOrderItem { dishName: string; quantity: number; isNew?: boolean }
interface AddonBatch {
  addonId: string;
  addonItems: KitchenOrderItem[];
  timestamp: string;
  kitchenAcknowledged: boolean;
  orderId: string;
  dailyOrderNo: number;
  tableNo: number;
}
interface KitchenOrder {
  ordersId: string;
  dailyOrderNo: number;
  tableNo: number;
  orderStatus: KanbanStatus;
  ordersInfo: KitchenOrderItem[];
  ordersUpdateInfo?: Array<{ type?: string; addonId?: string; addonItems?: KitchenOrderItem[]; timestamp: string; customer?: boolean; action?: string; kitchenAcknowledged?: boolean }>;
  customer?: { name: string };
  createdAt: string;
  isModified?: boolean;
  totalAmount?: string | number;
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
// PULSING "UPDATED" BANNER
// ============================================================================

function UpdatedBanner({ colors }: { colors: any }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 700 }),
        withTiming(1, { duration: 700 }),
      ),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.updatedBanner, { backgroundColor: colors.warning }, animStyle]}>
      <MaterialCommunityIcons name="alert" size={12} color="#fff" />
      <Text style={styles.updatedBannerText}>ITEMS UPDATED BY CUSTOMER</Text>
    </Animated.View>
  );
}

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
  const showModified = order.isModified || highlighted;

  return (
    <Animated.View
      entering={FadeInRight.duration(300)}
      style={[
        styles.orderCard,
        {
          backgroundColor: showModified ? colors.warning + '10' : colors.card,
          borderColor: showModified ? colors.warning : isUrgent ? colors.error + '50' : colors.border,
          borderWidth: showModified || isUrgent ? 2 : 1.5,
        },
      ]}
    >
      {/* Modified banner — shown prominently when customer changed items */}
      {showModified && <UpdatedBanner colors={colors} />}

      {/* Card header */}
      <View style={styles.cardHeader}>
        <Text style={[styles.orderNo, { color: colors.text }]}>#{order.dailyOrderNo}</Text>
        <View style={styles.headerRight}>
          {isUrgent && !showModified && (
            <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
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

      {/* Items — bold style for modified items */}
      <View style={styles.itemsList}>
        {order.ordersInfo.map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <Text
              style={[
                styles.itemLine,
                { color: showModified ? colors.warning : colors.text },
              ]}
            >
              <Text style={{ fontWeight: '800' }}>{item.quantity}×</Text>{' '}{item.dishName}
            </Text>
          </View>
        ))}
      </View>

      {/* Total items count */}
      <View style={[styles.itemsCountRow, { borderTopColor: colors.border + '60' }]}>
        <Text style={[styles.itemsCountText, { color: colors.textSecondary }]}>
          {order.ordersInfo.reduce((s, i) => s + i.quantity, 0)} item(s)
        </Text>
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
// ADDON CARD — ISSUE 2: Separate card for customer-added items
// ============================================================================

function AddonCard({
  addon, colors, onDone, dismissing,
}: {
  addon: AddonBatch; colors: any;
  onDone: () => void; dismissing?: boolean;
}) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 600 }),
        withTiming(1, { duration: 600 }),
      ),
      -1,
      false,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      entering={FadeInRight.duration(350)}
      style={[
        styles.orderCard,
        styles.addonCard,
        { backgroundColor: colors.primary + '10', borderColor: colors.primary + '80' },
      ]}
    >
      {/* Addon banner */}
      <Animated.View style={[styles.addonBanner, { backgroundColor: colors.primary }, pulseStyle]}>
        <MaterialCommunityIcons name="plus-circle" size={11} color="#fff" />
        <Text style={styles.updatedBannerText}>🆕 ADD-ON — #{addon.dailyOrderNo}</Text>
      </Animated.View>

      {/* Table chip */}
      <View style={styles.cardMeta}>
        <View style={[styles.tableChip, { backgroundColor: colors.primary + '20' }]}>
          <MaterialCommunityIcons name="table-chair" size={11} color={colors.primary} />
          <Text style={[styles.tableText, { color: colors.primary }]}>T{addon.tableNo}</Text>
        </View>
        <Text style={[styles.customerText, { color: colors.textSecondary }]}>Customer added items</Text>
      </View>

      {/* Addon items */}
      <View style={styles.itemsList}>
        {addon.addonItems.map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <Text style={[styles.itemLine, { color: colors.primary, fontWeight: '700' }]}>
              <Text style={{ fontWeight: '800' }}>{item.quantity}×</Text>{' '}{item.dishName}
            </Text>
          </View>
        ))}
      </View>

      {/* Done button */}
      <Pressable
        onPress={onDone}
        disabled={dismissing}
        style={({ pressed }) => [
          styles.actionBtn,
          { backgroundColor: colors.primary, opacity: pressed || dismissing ? 0.7 : 1 },
        ]}
      >
        {dismissing
          ? <ActivityIndicator size="small" color="#fff" />
          : <Text style={styles.actionBtnText}>✓ Done — Dismiss</Text>
        }
      </Pressable>
    </Animated.View>
  );
}

// ============================================================================
// COLUMN
// ============================================================================

function KanbanColumn({
  cfg, orders, addons, colors, onAction, onAddonDone, actionLoadingId, highlightedId, dismissingAddonId,
}: {
  cfg: typeof COLUMN_CFG[number];
  orders: KitchenOrder[];
  addons: AddonBatch[];
  colors: any;
  onAction?: (orderId: string) => void;
  onAddonDone?: (orderId: string, addonId: string) => void;
  actionLoadingId?: string | null;
  highlightedId?: string | null;
  dismissingAddonId?: string | null;
}) {
  const totalCount = orders.length + (cfg.status === 'preparing' ? addons.length : 0);
  return (
    <View style={[styles.column, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Column header */}
      <View style={[styles.columnHeader, { borderBottomColor: colors.border }]}>
        <View style={[styles.columnDot, { backgroundColor: cfg.color }]} />
        <Text style={[styles.columnTitle, { color: colors.text }]}>{cfg.label}</Text>
        <View style={[styles.columnCount, { backgroundColor: cfg.color + '20' }]}>
          <Text style={[styles.columnCountText, { color: cfg.color }]}>{totalCount}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.columnContent}
        nestedScrollEnabled
      >
        {/* ISSUE 2: Addon cards shown first in Preparing column */}
        {cfg.status === 'preparing' && addons.map((addon) => (
          <AddonCard
            key={addon.addonId}
            addon={addon}
            colors={colors}
            onDone={() => onAddonDone?.(addon.orderId, addon.addonId)}
            dismissing={dismissingAddonId === addon.addonId}
          />
        ))}
        {orders.length === 0 && (cfg.status !== 'preparing' || addons.length === 0) && (
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
  const { showError } = useDialog();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [addons, setAddons] = useState<AddonBatch[]>([]); // ISSUE 2: standalone addon batches
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [dismissingAddonId, setDismissingAddonId] = useState<string | null>(null);

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
      const merged: KitchenOrder[] = [
        ...(data.queued    ?? []),
        ...(data.preparing ?? []),
        ...(data.ready     ?? []),
        ...(data.serving   ?? []),
        ...(data.orders    ?? []),
      ];
      setOrders(merged);

      // ISSUE 2: Extract unacknowledged addon batches from all orders
      const allAddons: AddonBatch[] = [];
      for (const order of merged) {
        const updateInfo = order.ordersUpdateInfo || [];
        for (const entry of updateInfo) {
          if (entry.type === 'addon' && !entry.kitchenAcknowledged && entry.addonItems?.length) {
            allAddons.push({
              addonId: entry.addonId!,
              addonItems: entry.addonItems,
              timestamp: entry.timestamp,
              kitchenAcknowledged: false,
              orderId: order.ordersId,
              dailyOrderNo: order.dailyOrderNo,
              tableNo: order.tableNo,
            });
          }
        }
      }
      setAddons(allAddons);
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
          // Immediately highlight the modified card and refresh
          setHighlightedId(data.orderId);
          fetchDashboard();
          setTimeout(() => setHighlightedId(null), 10000);
        }
        if (data?.type === 'new_order') {
          fetchDashboard();
        }
      },
      (response) => {
        // Tapping a notification: just refresh
        fetchDashboard();
      },
    );
    return cleanup;
  }, [fetchDashboard]);

  // ── Socket ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // New order placed → refresh dashboard
    const onNewOrder = (data: any) => {
      fetchDashboard();
    };

    // Order modified (by waiter OR customer) → update items in-place + highlight
    const onModified = (data: any) => {
      if (data?.orderId) {
        setHighlightedId(data.orderId);
        setTimeout(() => setHighlightedId(null), 10000);

        // Update items in-place if the socket payload includes ordersInfo
        if (data.ordersInfo) {
          setOrders((prev) =>
            prev.map((o) =>
              o.ordersId === data.orderId
                ? {
                    ...o,
                    ordersInfo: data.ordersInfo,
                    totalAmount: data.totalAmount ?? o.totalAmount,
                    // Mark as modified (customer-initiated) for visual banner
                    isModified: data.modifiedBy === 'customer',
                  }
                : o
            )
          );
          return; // No need to full-refresh — in-place update is enough
        }
      }
      fetchDashboard();
    };

    // Status change (preparing, ready, etc.) → refresh to move card between columns
    const onStatusChange = (data: any) => {
      if (data?.orderStatus) {
        fetchDashboard();
      }
    };

    socket.on('order:new', onNewOrder);
    socket.on('order:modified', onModified);
    socket.on('order:status_change', onStatusChange);

    // ISSUE 2: Listen for customer addon events — add a new addon card in real time
    const onCustomerAddon = (data: any) => {
      if (data?.orderId && data.addonId && data.addonItems?.length) {
        const newAddon: AddonBatch = {
          addonId: data.addonId,
          addonItems: data.addonItems,
          timestamp: new Date().toISOString(),
          kitchenAcknowledged: false,
          orderId: data.orderId,
          dailyOrderNo: data.dailyOrderNo,
          tableNo: data.tableNo,
        };
        setAddons((prev) => {
          // Avoid duplicates
          if (prev.some(a => a.addonId === data.addonId)) return prev;
          return [newAddon, ...prev];
        });
      }
    };
    socket.on('order:customer_addon', onCustomerAddon);

    return () => {
      socket.off('order:new', onNewOrder);
      socket.off('order:modified', onModified);
      socket.off('order:status_change', onStatusChange);
      socket.off('order:customer_addon', onCustomerAddon);
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
      showError('Error', result.message ?? 'Action failed.');
    }
    setActionLoadingId(null);
  };

  // ISSUE 2: Kitchen dismisses an addon card
  const handleAddonDone = async (orderId: string, addonId: string) => {
    setDismissingAddonId(addonId);
    await apiCall(
      ENDPOINTS.KITCHEN_ADDON_DONE(orderId, addonId),
      { method: 'PATCH' },
      async () => accessToken,
      refreshToken,
      handleDisabled,
    );
    // Remove from local state immediately (optimistic)
    setAddons((prev) => prev.filter(a => a.addonId !== addonId));
    setDismissingAddonId(null);
  };

  // ── Partition orders ──────────────────────────────────────────────────────
  const getOrders = (status: KanbanStatus) => orders.filter((o) => o.orderStatus === status);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background, paddingTop: insets.top + 12 }}>
        {/* Header Skeleton */}
        <View style={[styles.header, { marginBottom: 12 }]}>
          <View style={{ gap: 4 }}>
            <SkeletonLoader width={100} height={26} />
            <SkeletonLoader width={120} height={14} style={{ marginTop: 4 }} />
          </View>
          <SkeletonLoader width={38} height={38} borderRadius={10} />
        </View>

        {/* Board columns skeleton */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.board} style={{ flexGrow: 1 }}>
          {[1, 2, 3].map((colId) => (
            <View key={colId} style={[styles.column, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={[styles.columnHeader, { borderBottomColor: c.border, gap: 8 }]}>
                <SkeletonLoader width={12} height={12} borderRadius={6} />
                <SkeletonLoader width={60} height={14} />
                <SkeletonLoader width={22} height={22} borderRadius={8} />
              </View>
              <View style={{ padding: 8, gap: 8 }}>
                <SkeletonCard colors={c} />
                <SkeletonCard colors={c} />
              </View>
            </View>
          ))}
        </ScrollView>
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
          disabled={refreshing}
          style={[styles.refreshBtn, { backgroundColor: c.card, borderColor: c.border }]}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={c.primary} />
          ) : (
            <MaterialCommunityIcons name="refresh" size={18} color={c.primary} />
          )}
        </Pressable>
      </Animated.View>

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: c.error + '12', borderColor: c.error + '30' }]}>
          <Text style={[{ color: c.error, flex: 1, fontSize: 13 }]}>{error}</Text>
          <Pressable onPress={fetchDashboard}><Text style={{ color: c.primary, fontWeight: '700' }}>Retry</Text></Pressable>
        </View>
      )}

      {/* Kanban Board with pull-to-refresh */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchDashboard(); }}
            tintColor={c.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
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
              addons={cfg.status === 'preparing' ? addons : []}
              colors={c}
              onAction={cfg.actionLabel ? (id) => handleAction(id, cfg.status as 'ordering' | 'preparing') : undefined}
              onAddonDone={handleAddonDone}
              actionLoadingId={actionLoadingId}
              highlightedId={highlightedId}
              dismissingAddonId={dismissingAddonId}
            />
          ))}
        </ScrollView>
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
    width: 210, borderRadius: 14, borderWidth: 1.5,
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

  orderCard: { borderRadius: 10, borderWidth: 1.5, overflow: 'hidden', gap: 0 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, paddingBottom: 4 },
  orderNo: { fontSize: 15, fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  elapsedTime: { fontSize: 10, fontWeight: '600' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingBottom: 6 },
  tableChip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 5 },
  tableText: { fontSize: 10, fontWeight: '700' },
  customerText: { fontSize: 11, fontWeight: '400', flex: 1 },
  itemsList: { paddingHorizontal: 10, gap: 3 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  itemLine: { fontSize: 12, lineHeight: 18 },
  itemsCountRow: { marginTop: 6, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, paddingVertical: 5 },
  itemsCountText: { fontSize: 10, fontWeight: '500' },
  actionBtn: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, marginHorizontal: 10, marginBottom: 10, borderRadius: 8, marginTop: 4,
  },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Modified banner
  updatedBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 5, gap: 5,
  },
  updatedBannerText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },

  // Addon card styles (ISSUE 2)
  addonCard: { borderWidth: 2 },
  addonBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 5, gap: 5,
  },
});
