// ============================================================================
// MANAGER — ANALYTICS SCREEN
// ============================================================================
// • In-memory TTL cache (5 min) — no redundant fetches on tab re-visit
// • BarChart entries memoised
// • Stable style objects via useMemo
// • SafeAreaView removed in favour of inset-based padding (matches other screens)
// ============================================================================

import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ENDPOINTS } from '@/config/api';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Module-level cache so it survives tab switches ───────────────────────
const analyticsCache: {
  data: AnalyticsState | null;
  fetchedAt: number;
} = { data: null, fetchedAt: 0 };

interface AnalyticsState {
  todaySales: any;
  weeklySales: any;
  bestSelling: any[];
  paymentMethods: any;
  ordersStatus: any;
  topCustomers: any[];
}

// ============================================================================
// MINI BAR CHART — memoised
// ============================================================================

const BarChart = memo(function BarChart({
  data,
  colors,
}: {
  data: Record<string, number>;
  colors: any;
}) {
  const entries = useMemo(() => Object.entries(data), [data]);
  const max = useMemo(() => Math.max(...entries.map(([, v]) => v), 1), [entries]);
  const labels = useMemo(
    () =>
      entries.map(([date, value]) => ({
        date,
        value,
        height: Math.max((value / max) * 80, 4),
        label: new Date(date).toLocaleDateString('en-IN', { weekday: 'short' }),
        display: value > 0 ? `₹${(value / 1000).toFixed(1)}k` : '',
      })),
    [entries, max]
  );

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 100 }}>
      {labels.map(({ date, value, height, label, display }) => (
        <View key={date} style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 9, color: colors.textSecondary, marginBottom: 4 }}>
            {display}
          </Text>
          <View
            style={{
              width: '70%',
              borderRadius: 4,
              backgroundColor: colors.primary,
              height,
            }}
          />
          <Text style={{ fontSize: 9, color: colors.textSecondary, marginTop: 4 }}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
});

// ============================================================================
// SECTION CARD — memoised
// ============================================================================

const SectionCard = memo(function SectionCard({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: any;
}) {
  const cardStyle = useMemo(
    () => [styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }],
    [colors.card, colors.border]
  );
  return (
    <View style={cardStyle}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
});

// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function AnalyticsScreen() {
  const { getAuthHeaders } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  const [state, setState] = useState<AnalyticsState | null>(
    analyticsCache.data && Date.now() - analyticsCache.fetchedAt < CACHE_TTL_MS
      ? analyticsCache.data
      : null
  );
  const [isLoading, setIsLoading] = useState(
    !(analyticsCache.data && Date.now() - analyticsCache.fetchedAt < CACHE_TTL_MS)
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const fetchAll = useCallback(
    async (forceRefresh = false) => {
      // Use cache unless forcing refresh
      if (
        !forceRefresh &&
        analyticsCache.data &&
        Date.now() - analyticsCache.fetchedAt < CACHE_TTL_MS
      ) {
        setState(analyticsCache.data);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      setFetchError('');
      try {
        const headers = getAuthHeaders();
        const [todayRes, weeklyRes, bestRes, payRes, statusRes, custRes] = await Promise.all([
          fetch(ENDPOINTS.ANALYTICS_TODAY, { headers }),
          fetch(ENDPOINTS.ANALYTICS_WEEKLY, { headers }),
          fetch(`${ENDPOINTS.ANALYTICS_BEST_SELLING}?days=7`, { headers }),
          fetch(`${ENDPOINTS.ANALYTICS_PAYMENT_METHODS}?days=7`, { headers }),
          fetch(ENDPOINTS.ANALYTICS_ORDERS_STATUS, { headers }),
          fetch(`${ENDPOINTS.ANALYTICS_TOP_CUSTOMERS}?limit=5`, { headers }),
        ]);

        for (const res of [todayRes, weeklyRes, bestRes, payRes, statusRes, custRes]) {
          const ct = res.headers.get('content-type') ?? '';
          if (!ct.includes('application/json')) {
            setFetchError('Server returned an unexpected response. Check your connection.');
            return;
          }
        }

        const [todayJson, weeklyJson, bestJson, payJson, statusJson, custJson] =
          await Promise.all([
            todayRes.json(),
            weeklyRes.json(),
            bestRes.json(),
            payRes.json(),
            statusRes.json(),
            custRes.json(),
          ]);

        const fresh: AnalyticsState = {
          todaySales: todayJson?.status === 'success' ? todayJson.data : null,
          weeklySales: weeklyJson?.status === 'success' ? weeklyJson.data : null,
          bestSelling: bestJson?.status === 'success' ? (bestJson.data ?? []) : [],
          paymentMethods: payJson?.status === 'success' ? payJson.data : null,
          ordersStatus: statusJson?.status === 'success' ? statusJson.data : null,
          topCustomers: custJson?.status === 'success' ? (custJson.data ?? []) : [],
        };

        analyticsCache.data = fresh;
        analyticsCache.fetchedAt = Date.now();
        setState(fresh);
      } catch {
        setFetchError('Network error. Pull to refresh.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [getAuthHeaders]
  );

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ─── Memoised styles ─────────────────────────────────────────────────────
  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: c.background }],
    [c.background]
  );
  const headerStyle = useMemo(
    () => [styles.header, { paddingTop: insets.top + 8 }],
    [insets.top]
  );

  if (isLoading) {
    return (
      <View style={containerStyle}>
        <View style={[styles.center, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={{ color: c.textSecondary, marginTop: 12 }}>Loading analytics…</Text>
        </View>
      </View>
    );
  }

  const {
    todaySales,
    weeklySales,
    bestSelling,
    paymentMethods,
    ordersStatus,
    topCustomers,
  } = state ?? {
    todaySales: null,
    weeklySales: null,
    bestSelling: [],
    paymentMethods: null,
    ordersStatus: null,
    topCustomers: [],
  };

  return (
    <View style={containerStyle}>
      <View style={headerStyle}>
        <Text style={[styles.pageTitle, { color: c.text }]}>Analytics</Text>
        <Pressable
          onPress={() => {
            setIsRefreshing(true);
            fetchAll(true);
          }}
        >
          <MaterialCommunityIcons name="refresh" size={22} color={c.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              fetchAll(true);
            }}
            tintColor={c.primary}
            colors={[c.primary]}
          />
        }
      >
        {fetchError ? (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: c.error + '12', borderColor: c.error + '30' },
            ]}
          >
            <MaterialCommunityIcons name="wifi-off" size={16} color={c.error} />
            <Text style={{ color: c.error, fontWeight: '600', flex: 1 }}>{fetchError}</Text>
          </View>
        ) : null}

        {/* TODAY'S SALES */}
        {todaySales && (
          <Animated.View entering={FadeInDown.delay(0).duration(350)}>
            <SectionCard title="Today's Sales" colors={c}>
              <View style={styles.statsGrid}>
                {[
                  { label: 'Revenue', value: `₹${todaySales.totalSales?.toFixed(0) ?? 0}`, color: c.primary },
                  { label: 'Orders', value: todaySales.ordersCount ?? 0, color: '#6366F1' },
                  { label: 'Completed', value: todaySales.completedOrders ?? 0, color: c.success },
                  { label: 'Avg Order', value: `₹${todaySales.averageOrderValue?.toFixed(0) ?? 0}`, color: c.warning },
                ].map((s) => (
                  <View
                    key={s.label}
                    style={[styles.miniStat, { backgroundColor: c.background, borderColor: c.border }]}
                  >
                    <Text style={[styles.miniStatValue, { color: s.color }]}>{s.value}</Text>
                    <Text style={[styles.miniStatLabel, { color: c.textSecondary }]}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </SectionCard>
          </Animated.View>
        )}

        {/* WEEKLY CHART */}
        {weeklySales?.dailySales && (
          <Animated.View entering={FadeInDown.delay(80).duration(350)}>
            <SectionCard title="7-Day Sales" colors={c}>
              <BarChart data={weeklySales.dailySales} colors={c} />
              <View style={[styles.weekTotal, { borderColor: c.border }]}>
                <Text style={{ color: c.textSecondary, fontSize: 13 }}>Total this week</Text>
                <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>
                  ₹{weeklySales.totalSales?.toFixed(0) ?? 0}
                </Text>
              </View>
            </SectionCard>
          </Animated.View>
        )}

        {/* ORDERS BY STATUS */}
        {ordersStatus && (
          <Animated.View entering={FadeInDown.delay(160).duration(350)}>
            <SectionCard title="Orders by Status" colors={c}>
              {Object.entries(ordersStatus).map(([status, count]) => {
                const colorMap: Record<string, string> = {
                  ordering: c.warning,
                  preparing: '#6366F1',
                  served: c.primary,
                  completed: c.success,
                  cancelled: c.error,
                };
                const statusColor = colorMap[status] ?? c.textSecondary;
                const total = Object.values(ordersStatus).reduce(
                  (a: any, b: any) => a + b,
                  0
                ) as number;
                const pct = total ? Math.round(((count as number) / total) * 100) : 0;
                return (
                  <View key={status} style={styles.statusRow}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        width: 80,
                        color: c.text,
                        textTransform: 'capitalize',
                      }}
                    >
                      {status}
                    </Text>
                    <View style={[styles.barOuter, { backgroundColor: c.inputBackground }]}>
                      <View
                        style={[styles.barInner, { backgroundColor: statusColor, width: `${pct}%` }]}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: statusColor,
                        width: 32,
                        textAlign: 'right',
                      }}
                    >
                      {count as number}
                    </Text>
                  </View>
                );
              })}
            </SectionCard>
          </Animated.View>
        )}

        {/* BEST SELLING */}
        {bestSelling.length > 0 && (
          <Animated.View entering={FadeInDown.delay(240).duration(350)}>
            <SectionCard title="Best Selling (7 days)" colors={c}>
              {bestSelling.slice(0, 5).map((dish, i) => (
                <View key={dish.dishId} style={[styles.listRow, { borderColor: c.border }]}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: c.primary, width: 20 }}>
                    #{i + 1}
                  </Text>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>
                      {dish.dishName}
                    </Text>
                    {dish.category && (
                      <Text style={{ fontSize: 11, color: c.textSecondary }}>{dish.category}</Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: c.success }}>
                    {dish.quantity}x
                  </Text>
                </View>
              ))}
            </SectionCard>
          </Animated.View>
        )}

        {/* PAYMENT METHODS */}
        {paymentMethods && (
          <Animated.View entering={FadeInDown.delay(320).duration(350)}>
            <SectionCard title="Payment Methods (7 days)" colors={c}>
              <View style={styles.statsGrid}>
                {Object.entries(paymentMethods).map(([method, amount]) => (
                  <View
                    key={method}
                    style={[styles.miniStat, { backgroundColor: c.background, borderColor: c.border }]}
                  >
                    <Text style={[styles.miniStatValue, { color: c.primary }]}>
                      ₹{(amount as number).toFixed(0)}
                    </Text>
                    <Text
                      style={[
                        styles.miniStatLabel,
                        { color: c.textSecondary, textTransform: 'capitalize' },
                      ]}
                    >
                      {method}
                    </Text>
                  </View>
                ))}
              </View>
            </SectionCard>
          </Animated.View>
        )}

        {/* TOP CUSTOMERS */}
        {topCustomers.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400).duration(350)}>
            <SectionCard title="Top Customers" colors={c}>
              {topCustomers.map((cust, i) => (
                <View key={cust.mobile} style={[styles.listRow, { borderColor: c.border }]}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: c.primary, width: 20 }}>
                    #{i + 1}
                  </Text>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>
                      {cust.name ?? '—'}
                    </Text>
                    <Text style={{ fontSize: 11, color: c.textSecondary }}>📱 {cust.mobile}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: c.primary + '15' }]}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: c.primary }}>
                      {cust.orderCount} orders
                    </Text>
                  </View>
                </View>
              ))}
            </SectionCard>
          </Animated.View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  pageTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  miniStat: {
    flex: 1,
    minWidth: '44%',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
  },
  miniStatValue: { fontSize: 18, fontWeight: '800' },
  miniStatLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  weekTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 10,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  barOuter: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  barInner: { height: 8, borderRadius: 4 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
});