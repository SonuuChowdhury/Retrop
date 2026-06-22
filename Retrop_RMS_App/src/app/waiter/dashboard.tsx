// ============================================================================
// WAITER — DASHBOARD SCREEN  (UPDATED)
// ============================================================================
// KEY CHANGE: Added polling-based "pending sessions" panel so waiters can
// accept table orders IN-SCREEN without needing push notifications.
//
// How it works:
//   • Polls GET /api/waiter/pending-sessions every 20 seconds
//   • Timer resets on manual pull-to-refresh (so next auto-poll is 20s away)
//   • Shows a prominent "New Table Requests" section above active orders
//   • Each pending table shows customer name, table no, and an Accept button
//   • Works in Expo Go (no push notifications required)
//   • Socket events still work as a real-time bonus when available
// ============================================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Alert, RefreshControl, Modal,
} from 'react-native';
import Animated, {
  FadeInDown, FadeInUp, FadeIn, FadeOut, SlideInUp, SlideOutUp,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useWaiterAuth } from '@/context/WaiterAuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ENDPOINTS } from '@/config/api';
import { apiCall } from '@/utils/apiClient';
import { setupNotificationListeners } from '@/services/notificationService';
import { getSocket } from '@/utils/socket';

// ============================================================================
// TYPES
// ============================================================================

interface OrderStats {
  totalOrders: number;
  completedOrders: number;
  activeOrders: number;
}

interface ActiveOrder {
  ordersId: string;
  tableNo: number;
  orderStatus: string;
  dailyOrderNo: number;
  totalAmount: number;
  createdAt: string;
  ordersInfo: { dishName: string; quantity: number }[];
}

interface DashboardData {
  waiter: { waiterId: string; waiterName: string; mobile: string };
  todayStats: OrderStats;
  activeOrders: ActiveOrder[];
}

// NEW: Pending session from GET /api/waiter/pending-sessions
interface PendingSession {
  tableId: string;
  tableNo: number;
  customerName: string;
  customerMobile: string;
  sessionToken: string;
  createdAt: string;
  customerSubmittedAt?: string;
}

import { SkeletonLoader, SkeletonCard, SkeletonKPI } from '@/components/SkeletonLoader/SkeletonLoader';

// ============================================================================
// STATUS CONFIG
// ============================================================================

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ordering:  { label: 'Ordering',  color: '#FF6B35' },
  preparing: { label: 'Preparing', color: '#FFA726' },
  ready:     { label: 'Ready',     color: '#4CAF50' },
  serving:   { label: 'Serving',   color: '#42A5F5' },
  completed: { label: 'Completed', color: '#78909C' },
  cancelled: { label: 'Cancelled', color: '#EF5350' },
};

// ============================================================================
// ORDER CARD COMPONENT
// ============================================================================

function OrderCard({
  order, colors, onPress,
}: {
  order: ActiveOrder; colors: any; onPress: () => void;
}) {
  const statusCfg = STATUS_CONFIG[order.orderStatus] ?? { label: order.orderStatus, color: '#888' };
  const mins = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.orderCard,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.orderCardTop}>
        <View style={[styles.tableChip, { backgroundColor: colors.primary + '15' }]}>
          <MaterialCommunityIcons name="table-chair" size={12} color={colors.primary} />
          <Text style={[styles.tableChipText, { color: colors.primary }]}>Table {order.tableNo}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusCfg.color + '18' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
          <Text style={[styles.statusPillText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
      </View>

      <View style={styles.orderCardMid}>
        <Text style={[styles.orderNo, { color: colors.text }]}>Order #{order.dailyOrderNo}</Text>
        <Text style={[styles.orderTime, { color: colors.textSecondary }]}>
          {mins < 1 ? 'Just now' : `${mins}m ago`}
        </Text>
      </View>

      <View style={styles.orderCardBottom}>
        <Text numberOfLines={1} style={[styles.amount, { color: colors.text }]}>₹{order.totalAmount ?? 0}</Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
      </View>
    </Pressable>
  );
}

// ============================================================================
// PENDING SESSION CARD  ← NEW COMPONENT
// ============================================================================

function PendingSessionCard({
  session, colors, onAccept, accepting,
}: {
  session: PendingSession;
  colors: any;
  onAccept: () => void;
  accepting: boolean;
}) {
  const submittedAt = session.customerSubmittedAt || session.createdAt;
  const mins = Math.floor((Date.now() - new Date(submittedAt).getTime()) / 60000);

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOut.duration(200)}
      style={[
        styles.pendingCard,
        {
          backgroundColor: colors.warning + '12',
          borderColor: colors.warning,
        },
      ]}
    >
      {/* Pulsing indicator + header */}
      <View style={styles.pendingCardHeader}>
        <View style={styles.pendingCardLeft}>
          <View style={[styles.pendingTableBadge, { backgroundColor: colors.warning + '25' }]}>
            <MaterialCommunityIcons name="table-chair" size={14} color={colors.warning} />
            <Text style={[styles.pendingTableText, { color: colors.warning }]}>
              Table {session.tableNo}
            </Text>
          </View>
          <Text style={[styles.pendingWaiting, { color: colors.textSecondary }]}>
            {mins < 1 ? 'Just arrived' : `Waiting ${mins}m`}
          </Text>
        </View>
        <MaterialCommunityIcons name="bell-ring" size={20} color={colors.warning} />
      </View>

      {/* Customer info */}
      <View style={styles.pendingCustomerRow}>
        <MaterialCommunityIcons name="account" size={15} color={colors.textSecondary} />
        <Text style={[styles.pendingCustomerName, { color: colors.text }]}>
          {session.customerName}
        </Text>
        <Text style={[styles.pendingCustomerMobile, { color: colors.textSecondary }]}>
          • {session.customerMobile}
        </Text>
      </View>

      {/* Accept button */}
      <Pressable
        onPress={onAccept}
        disabled={accepting}
        style={({ pressed }) => [
          styles.acceptBtn,
          {
            backgroundColor: accepting ? colors.warning + '60' : colors.warning,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        {accepting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <MaterialCommunityIcons name="check-circle" size={16} color="#fff" />
            <Text style={styles.acceptBtnText}>Accept Table</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ============================================================================
// DASHBOARD SCREEN
// ============================================================================

export default function WaiterDashboard() {
  const { waiter, accessToken, getAuthHeaders, refreshToken, logout } = useWaiterAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = theme.colors;

  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NEW: Pending sessions state (replaces single newOrderBanner)
  const [pendingSessions, setPendingSessions] = useState<PendingSession[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Forced logout on account disabled ──────────────────────────────────────
  const handleDisabled = useCallback(() => {
    Alert.alert(
      'Account Disabled',
      'Your account has been disabled by the manager.',
      [{ text: 'OK', onPress: () => logout() }],
    );
  }, [logout]);

  // ── Fetch dashboard ─────────────────────────────────────────────────────────
  const fetchDashboard = useCallback(async () => {
    const result = await apiCall(
      ENDPOINTS.WAITER_DASHBOARD,
      { method: 'GET' },
      async () => accessToken,
      refreshToken,
      handleDisabled,
    );

    if (result.success) {
      setDashData(result.data as DashboardData);
      setError(null);
    } else {
      setError(result.message ?? 'Failed to load dashboard.');
    }
    setLoading(false);
    setRefreshing(false);
  }, [accessToken, refreshToken, handleDisabled]);

  // ── NEW: Fetch pending sessions ────────────────────────────────────────────
  // Polls GET /api/waiter/pending-sessions every 8 seconds.
  // This is the in-screen alternative to push notifications.
  const fetchPendingSessions = useCallback(async () => {
    try {
      const result = await apiCall(
        ENDPOINTS.WAITER_PENDING_SESSIONS,   // add this to your ENDPOINTS config
        { method: 'GET' },
        async () => accessToken,
        refreshToken,
        handleDisabled,
      );

      if (result.success && Array.isArray(result.data)) {
        setPendingSessions(result.data as PendingSession[]);
      }
    } catch {
      // Silently fail — polling should not disrupt the UI
    }
  }, [accessToken, refreshToken, handleDisabled]);

  // ── Initial load ────────────────────────────────────────────────────────────
  // restartPollTimer: clears any existing interval and starts a fresh 20-second
  // countdown. Call this after a manual refresh so the timer resets properly.
  const restartPollTimer = useCallback(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(fetchPendingSessions, 20_000);
  }, [fetchPendingSessions]);

  useEffect(() => {
    fetchDashboard();
    fetchPendingSessions();

    // Poll for pending sessions every 20 seconds
    restartPollTimer();

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Push notification listeners (still works in native builds) ─────────────
  useEffect(() => {
    const cleanup = setupNotificationListeners(
      (notification) => {
        const data = notification.request.content.data as any;
        // Trigger an immediate poll when a push notification arrives
        if (data?.type === 'new_order_request') {
          fetchPendingSessions();
        }
        if (data?.type === 'order_ready') {
          fetchDashboard();
        }
        if (data?.type === 'order_modified') {
          // Customer changed their order — refresh active orders
          fetchDashboard();
        }
        if (data?.type === 'order_preparing') {
          // Kitchen started preparing — refresh dashboard
          fetchDashboard();
        }
      },
      (response) => {
        const data = response.notification.request.content.data as any;
        if (data?.orderId) {
          router.push(`/waiter/order-detail?orderId=${data.orderId}` as any);
        }
      },
    );
    return cleanup;
  }, []);

  // ── Socket listeners (real-time bonus) ────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewRequest = () => {
      // Immediately re-poll instead of setting banner state
      fetchPendingSessions();
    };
    const onOrderReady = () => { fetchDashboard(); };
    const onOrderModified = () => { fetchDashboard(); };

    socket.on('order:new_request', onNewRequest);
    socket.on('order:ready', onOrderReady);
    socket.on('order:modified', onOrderModified);

    return () => {
      socket.off('order:new_request', onNewRequest);
      socket.off('order:ready', onOrderReady);
      socket.off('order:modified', onOrderModified);
    };
  }, []);

  // ── Accept order ─────────────────────────────────────────────────────────
  const handleAcceptOrder = async (session: PendingSession) => {
    setAcceptingId(session.tableId);
    try {
      const result = await apiCall(
        ENDPOINTS.WAITER_ACCEPT_ORDER(session.tableId),
        { method: 'POST', body: JSON.stringify({ sessionToken: session.sessionToken }) },
        async () => accessToken,
        refreshToken,
        handleDisabled,
      );

      if (result.success) {
        // Remove accepted session from list immediately
        setPendingSessions((prev) => prev.filter((s) => s.tableId !== session.tableId));
        // Refresh dashboard to show new active order
        fetchDashboard();
      } else if (result.message?.includes('already') || result.message?.includes('409')) {
        Alert.alert('Already Taken', 'This table was just accepted by another waiter.');
        setPendingSessions((prev) => prev.filter((s) => s.tableId !== session.tableId));
        fetchDashboard();
      } else {
        Alert.alert('Error', result.message ?? 'Failed to accept order.');
      }
    } finally {
      setAcceptingId(null);
    }
  };

  if (loading) {
    return (
      <View style={{ backgroundColor: c.background, paddingHorizontal: 16, paddingTop: insets.top + 20, flex: 1 }}>
        {/* Header Skeleton */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 30, alignItems: 'center' }}>
          <View style={{ gap: 6 }}>
            <SkeletonLoader width={120} height={16} />
            <SkeletonLoader width={160} height={26} style={{ marginTop: 4 }} />
          </View>
          <SkeletonLoader width={100} height={28} borderRadius={14} />
        </View>

        {/* Stats Row Skeleton */}
        <View style={{ flexDirection: 'row', gap: 10, width: '100%', marginBottom: 30 }}>
          <SkeletonKPI colors={c} />
          <SkeletonKPI colors={c} />
        </View>

        {/* Section Header Skeleton */}
        <View style={{ width: '100%', marginBottom: 16 }}>
          <SkeletonLoader width={140} height={20} />
        </View>

        {/* Order Cards Skeletons */}
        <View style={{ width: '100%', gap: 10 }}>
          <SkeletonCard colors={c} />
          <SkeletonCard colors={c} />
          <SkeletonCard colors={c} />
        </View>
      </View>
    );
  }

  const stats = dashData?.todayStats;
  const activeOrders = dashData?.activeOrders ?? [];

  return (
    <View style={[{ flex: 1, backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchDashboard();
              fetchPendingSessions();
              // Reset the polling timer so next auto-poll is 20s from NOW
              restartPollTimer();
            }}
            tintColor={c.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(350)} style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: c.textSecondary }]}>Welcome back,</Text>
            <Text style={[styles.waiterName, { color: c.text }]}>{waiter?.waiterName ?? 'Waiter'}</Text>
          </View>
          <View style={[styles.mobileBadge, { backgroundColor: c.card, borderColor: c.border }]}>
            <MaterialCommunityIcons name="phone-outline" size={12} color={c.textSecondary} />
            <Text style={[styles.mobileText, { color: c.textSecondary }]}>{waiter?.mobile}</Text>
          </View>
        </Animated.View>

        {/* Error */}
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: c.error + '12', borderColor: c.error + '30' }]}>
            <MaterialCommunityIcons name="wifi-off" size={14} color={c.error} />
            <Text style={[{ color: c.error, flex: 1, fontSize: 13 }]}>{error}</Text>
            <Pressable onPress={fetchDashboard}>
              <Text style={{ color: c.primary, fontWeight: '700' }}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* ── NEW: Pending Table Requests Section ──────────────────────── */}
        {pendingSessions.length > 0 && (
          <Animated.View entering={SlideInUp.duration(350)} exiting={SlideOutUp.duration(250)}>
            {/* Section header */}
            <View style={styles.pendingSectionHeader}>
              <View style={[styles.pendingDot, { backgroundColor: c.warning }]} />
              <Text style={[styles.pendingSectionTitle, { color: c.warning }]}>
                New Table Requests
              </Text>
              <View style={[styles.pendingCountBadge, { backgroundColor: c.warning }]}>
                <Text style={styles.pendingCountText}>{pendingSessions.length}</Text>
              </View>
              <Text style={[styles.pendingHint, { color: c.textSecondary }]}>
                Tap to accept
              </Text>
            </View>

            {/* One card per pending table */}
            {pendingSessions.map((session) => (
              <PendingSessionCard
                key={session.tableId}
                session={session}
                colors={c}
                onAccept={() => handleAcceptOrder(session)}
                accepting={acceptingId === session.tableId}
              />
            ))}
          </Animated.View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: "Today's Orders", value: stats?.totalOrders ?? 0, icon: 'receipt', color: c.primary },
            { label: 'Completed', value: stats?.completedOrders ?? 0, icon: 'check-circle-outline', color: c.success },
          ].map((s, i) => (
            <Animated.View
              key={s.label}
              entering={FadeInDown.delay(i * 80).duration(340)}
              style={[styles.statCard, { backgroundColor: c.card, borderColor: c.border }]}
            >
              <MaterialCommunityIcons name={s.icon as any} size={20} color={s.color} />
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.statValue, { color: c.text }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: c.textSecondary }]}>{s.label}</Text>
            </Animated.View>
          ))}
        </View>

        {/* Active Orders */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Active Orders</Text>
          <View style={[styles.countBadge, { backgroundColor: c.primary + '18' }]}>
            <Text style={[styles.countText, { color: c.primary }]}>{activeOrders.length}</Text>
          </View>
        </View>

        {activeOrders.length === 0 ? (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={[styles.emptyState, { backgroundColor: c.card, borderColor: c.border }]}
          >
            <MaterialCommunityIcons name="receipt" size={36} color={c.textSecondary} />
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>No active orders right now</Text>
          </Animated.View>
        ) : (
          activeOrders.map((order, i) => (
            <Animated.View key={order.ordersId} entering={FadeInDown.delay(i * 60).duration(320)}>
              <OrderCard
                order={order}
                colors={c}
                onPress={() => router.push(`/waiter/order-detail?orderId=${order.ordersId}` as any)}
              />
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 16 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  greeting: { fontSize: 13, fontWeight: '500' },
  waiterName: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  mobileBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1,
  },
  mobileText: { fontSize: 12, fontWeight: '500' },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    borderWidth: 1, padding: 12, marginBottom: 14, gap: 8,
  },

  // ── Pending sessions ───────────────────────────────────────────────────────
  pendingSectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10,
  },
  pendingDot: { width: 8, height: 8, borderRadius: 4 },
  pendingSectionTitle: { fontSize: 16, fontWeight: '800', flex: 1 },
  pendingCountBadge: {
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
  pendingCountText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  pendingHint: { fontSize: 11, fontWeight: '500' },

  pendingCard: {
    borderRadius: 14, borderWidth: 2, padding: 14, marginBottom: 10, gap: 10,
  },
  pendingCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  pendingCardLeft: { gap: 4 },
  pendingTableBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8,
    alignSelf: 'flex-start',
  },
  pendingTableText: { fontSize: 14, fontWeight: '800' },
  pendingWaiting: { fontSize: 12, fontWeight: '500' },

  pendingCustomerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pendingCustomerName: { fontSize: 15, fontWeight: '700' },
  pendingCustomerMobile: { fontSize: 13, fontWeight: '400' },

  acceptBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 10, marginTop: 2,
  },
  acceptBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // ── Stats ──────────────────────────────────────────────────────────────────
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  statCard: {
    flex: 1, borderRadius: 12, borderWidth: 1.5, padding: 12,
    alignItems: 'center', gap: 6,
  },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '500', textAlign: 'center' },

  // ── Section header ─────────────────────────────────────────────────────────
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  countBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 10 },
  countText: { fontSize: 12, fontWeight: '700' },

  // ── Order card ─────────────────────────────────────────────────────────────
  orderCard: { borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 10 },
  orderCardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  tableChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6,
  },
  tableChipText: { fontSize: 11, fontWeight: '700' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  orderCardMid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderNo: { fontSize: 16, fontWeight: '800' },
  orderTime: { fontSize: 12, fontWeight: '400' },
  orderCardBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  amount: { fontSize: 18, fontWeight: '800' },

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center', padding: 36, borderRadius: 16, borderWidth: 1.5, gap: 10,
  },
  emptyText: { fontSize: 14, fontWeight: '500' },
});