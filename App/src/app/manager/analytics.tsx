// ============================================================================
// MANAGER ANALYTICS SCREEN
// ============================================================================
// • Single API call: GET /api/admins/analytics (all metrics in one request)
// • Pull-to-refresh + stale banner (2 min)
// • Metric filter tabs: Sales / Dishes / Orders / Customers / Payments
// • Partial-success handling (status: 'partial' with errors array)
// • All heavy lists memoised — no layout thrash on scroll
// • Zero external chart libs — pure RN bar/pie visuals
// ============================================================================

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  memo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { API_BASE } from '@/config/api';

// ── New consolidated endpoint ────────────────────────────────────────────────
const ANALYTICS_ENDPOINT = `${API_BASE}/admins/analytics`;
const STALE_AFTER_MS = 2 * 60 * 1000; // 2 minutes

// ============================================================================
// TYPES
// ============================================================================

interface SalesData {
  today: { totalSales: number; ordersCount: number; completedOrders: number; averageOrderValue: number };
  weekly: { dailySales: Record<string, number>; totalSales: number; ordersCount: number; averageDaily: string };
  monthly: { month: string; totalSales: number; ordersCount: number; averageOrderValue: string };
}

interface DishEntry {
  dishId: string;
  dishName: string;
  category: string;
  price: number;
  quantity: number;
}

interface OrderEntry {
  ordersId: string;
  mobile: string;
  tableNo: number;
  orderStatus: string;
  totalAmount: number;
  isPaymentCompleted: boolean;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  waiter: { waiterName: string };
  customer: { name: string; mobile: string };
}

interface CustomerEntry {
  mobile: string;
  name: string;
  orderCount: number;
}

interface AnalyticsData {
  sales?: SalesData;
  dishes?: { bestSelling: DishEntry[] };
  paymentMethods?: Record<string, number>;
  orderStatus?: Record<string, number>;
  orders?: OrderEntry[];
  customers?: { top: CustomerEntry[] };
  completionTime?: { averageMinutes: number };
}

type TabKey = 'sales' | 'orders' | 'dishes' | 'payments' | 'customers';

// ============================================================================
// HELPERS
// ============================================================================

const fmt = (n: number) =>
  n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n}`;

const fmtNum = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ============================================================================
// STALE BANNER
// ============================================================================

const StaleBanner = memo(function StaleBanner({
  onRefresh,
  colors,
}: {
  onRefresh: () => void;
  colors: any;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      style={[bannerSt.banner, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}
    >
      <MaterialCommunityIcons name="information-outline" size={16} color={colors.primary} />
      <Text style={[bannerSt.text, { color: colors.text }]}>Data may be outdated</Text>
      <Pressable onPress={onRefresh} style={[bannerSt.btn, { backgroundColor: colors.primary }]}>
        <Text style={bannerSt.btnText}>Refresh</Text>
      </Pressable>
    </Animated.View>
  );
});
const bannerSt = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 10, marginBottom: 12, gap: 8 },
  text: { flex: 1, fontSize: 13, fontWeight: '500' },
  btn: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 8 },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

// ============================================================================
// ERROR BANNER
// ============================================================================

const ErrorBanner = memo(function ErrorBanner({
  message,
  onRetry,
  colors,
}: {
  message: string;
  onRetry: () => void;
  colors: any;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={[errSt.banner, { backgroundColor: colors.error + '12', borderColor: colors.error + '30' }]}
    >
      <MaterialCommunityIcons name="wifi-off" size={16} color={colors.error} />
      <Text style={[errSt.text, { color: colors.error }]} numberOfLines={2}>{message}</Text>
      <Pressable onPress={onRetry}>
        <Text style={[errSt.retry, { color: colors.primary }]}>Retry</Text>
      </Pressable>
    </Animated.View>
  );
});
const errSt = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 14, gap: 8 },
  text: { flex: 1, fontSize: 13, fontWeight: '600' },
  retry: { fontSize: 13, fontWeight: '700' },
});

// ============================================================================
// PARTIAL WARNING BANNER (status: 'partial')
// ============================================================================

const PartialBanner = memo(function PartialBanner({
  errors,
  colors,
}: {
  errors: string[];
  colors: any;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[partialSt.banner, { backgroundColor: colors.warning + '18', borderColor: colors.warning + '40' }]}
    >
      <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.warning} />
      <View style={{ flex: 1 }}>
        <Text style={[partialSt.title, { color: colors.text }]}>Some data unavailable</Text>
        {errors.map((e, i) => (
          <Text key={i} style={[partialSt.item, { color: colors.textSecondary }]}>• {e}</Text>
        ))}
      </View>
    </Animated.View>
  );
});
const partialSt = StyleSheet.create({
  banner: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 14, flexDirection: 'row', gap: 8 },
  title: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  item: { fontSize: 12, fontWeight: '400', lineHeight: 18 },
});

// ============================================================================
// TAB BAR
// ============================================================================

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'sales', label: 'Sales', icon: 'cash-multiple' },
  { key: 'orders', label: 'Orders', icon: 'receipt' },
  { key: 'dishes', label: 'Dishes', icon: 'food' },
  { key: 'payments', label: 'Payments', icon: 'credit-card-outline' },
  { key: 'customers', label: 'Customers', icon: 'account-group-outline' },
];

const TabBar = memo(function TabBar({
  active,
  onChange,
  colors,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
  colors: any;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={tabSt.container}
    >
      {TABS.map((t) => {
        const isActive = t.key === active;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={[
              tabSt.tab,
              {
                backgroundColor: isActive ? colors.primary : colors.card,
                borderColor: isActive ? colors.primary : colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={t.icon as any}
              size={15}
              color={isActive ? '#fff' : colors.textSecondary}
            />
            <Text style={[tabSt.label, { color: isActive ? '#fff' : colors.textSecondary }]}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});
const tabSt = StyleSheet.create({
  container: { paddingHorizontal: 20, gap: 8, paddingVertical: 4 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  label: { fontSize: 13, fontWeight: '600' },
});

// ============================================================================
// KPI CARD — single stat
// ============================================================================

const KpiCard = memo(function KpiCard({
  icon,
  label,
  value,
  sub,
  accent,
  delay,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  accent: string;
  delay: number;
  colors: any;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(380)}
      style={[kpiSt.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: accent }]}
    >
      <View style={[kpiSt.iconCircle, { backgroundColor: accent + '18' }]}>
        <MaterialCommunityIcons name={icon as any} size={22} color={accent} />
      </View>
      <Text style={[kpiSt.value, { color: colors.text }]}>{value}</Text>
      <Text style={[kpiSt.label, { color: colors.textSecondary }]}>{label}</Text>
      {sub ? <Text style={[kpiSt.sub, { color: accent }]}>{sub}</Text> : null}
    </Animated.View>
  );
});
const kpiSt = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    minWidth: 100,
  },
  iconCircle: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  value: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 3 },
  label: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center', marginBottom: 2 },
  sub: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
});

// ============================================================================
// SECTION HEADER
// ============================================================================

const SectionHeader = memo(function SectionHeader({
  title,
  colors,
  delay = 0,
}: {
  title: string;
  colors: any;
  delay?: number;
}) {
  return (
    <Animated.Text
      entering={FadeInDown.delay(delay).duration(300)}
      style={[secSt.title, { color: colors.text }]}
    >
      {title}
    </Animated.Text>
  );
});
const secSt = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '700', letterSpacing: 0.1, marginBottom: 12, marginTop: 20 },
});

// ============================================================================
// MINI BAR CHART — weekly sales
// ============================================================================

const MiniBarChart = memo(function MiniBarChart({
  data,
  colors,
}: {
  data: Record<string, number>;
  colors: any;
}) {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <Animated.View
      entering={FadeInUp.delay(100).duration(400)}
      style={[chartSt.container, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Text style={[chartSt.title, { color: colors.textSecondary }]}>Daily Revenue</Text>
      <View style={chartSt.bars}>
        {entries.map(([date, val], i) => {
          const pct = val / max;
          const d = new Date(date);
          const label = days[d.getDay()] ?? date.slice(5);
          return (
            <View key={date} style={chartSt.barCol}>
              <Text style={[chartSt.barVal, { color: colors.textSecondary }]}>
                {val > 0 ? fmt(val) : ''}
              </Text>
              <View style={chartSt.barTrack}>
                <View
                  style={[
                    chartSt.bar,
                    {
                      height: `${Math.max(pct * 100, 4)}%`,
                      backgroundColor: colors.primary,
                      opacity: 0.7 + pct * 0.3,
                    },
                  ]}
                />
              </View>
              <Text style={[chartSt.barLabel, { color: colors.textSecondary }]}>{label}</Text>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
});
const chartSt = StyleSheet.create({
  container: { borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 4 },
  title: { fontSize: 12, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  bars: { flexDirection: 'row', height: 100, gap: 6, alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barVal: { fontSize: 8, fontWeight: '600', marginBottom: 3 },
  barTrack: { width: '100%', flex: 1, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 9, fontWeight: '600', marginTop: 4 },
});

// ============================================================================
// PAYMENT PIE — simple percentage bars
// ============================================================================

const PaymentBreakdown = memo(function PaymentBreakdown({
  data,
  colors,
}: {
  data: Record<string, number>;
  colors: any;
}) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  const PALETTE = [colors.primary, colors.success, colors.warning, '#7C4DFF'];

  return (
    <Animated.View
      entering={FadeInUp.delay(100).duration(400)}
      style={[pieSt.container, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Text style={[pieSt.title, { color: colors.textSecondary }]}>Payment Methods</Text>
      {Object.entries(data).map(([method, amount], i) => {
        const pct = total > 0 ? (amount / total) * 100 : 0;
        const accent = PALETTE[i % PALETTE.length];
        return (
          <View key={method} style={pieSt.row}>
            <View style={[pieSt.dot, { backgroundColor: accent }]} />
            <Text style={[pieSt.method, { color: colors.text }]}>{method}</Text>
            <View style={pieSt.barWrap}>
              <View style={[pieSt.barFill, { width: `${pct}%`, backgroundColor: accent }]} />
            </View>
            <Text style={[pieSt.pct, { color: colors.textSecondary }]}>{pct.toFixed(0)}%</Text>
            <Text style={[pieSt.amount, { color: colors.text }]}>{fmt(amount)}</Text>
          </View>
        );
      })}
    </Animated.View>
  );
});
const pieSt = StyleSheet.create({
  container: { borderRadius: 16, borderWidth: 1.5, padding: 16 },
  title: { fontSize: 12, fontWeight: '600', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  method: { fontSize: 13, fontWeight: '600', width: 44 },
  barWrap: { flex: 1, height: 8, backgroundColor: '#00000010', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, maxWidth: '100%' },
  pct: { fontSize: 12, fontWeight: '600', width: 30, textAlign: 'right' },
  amount: { fontSize: 12, fontWeight: '700', width: 60, textAlign: 'right' },
});

// ============================================================================
// ORDER STATUS PILLS
// ============================================================================

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  ordersing: { color: '#7C4DFF', icon: 'clock-outline', label: 'Ordering' },
  preparing: { color: '#FF9800', icon: 'fire', label: 'Preparing' },
  served: { color: '#2196F3', icon: 'check-circle-outline', label: 'Served' },
  completed: { color: '#4CAF50', icon: 'check-all', label: 'Completed' },
  cancelled: { color: '#F44336', icon: 'close-circle-outline', label: 'Cancelled' },
};

const OrderStatusGrid = memo(function OrderStatusGrid({
  data,
  colors,
}: {
  data: Record<string, number>;
  colors: any;
}) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);

  return (
    <Animated.View
      entering={FadeInUp.delay(80).duration(400)}
      style={statusSt.grid}
    >
      {Object.entries(data).map(([status, count], i) => {
        const cfg = STATUS_CONFIG[status] ?? { color: colors.primary, icon: 'circle-outline', label: status };
        return (
          <Animated.View
            key={status}
            entering={FadeInDown.delay(i * 60 + 80).duration(350)}
            style={[statusSt.pill, { backgroundColor: colors.card, borderColor: cfg.color + '40' }]}
          >
            <View style={[statusSt.iconWrap, { backgroundColor: cfg.color + '15' }]}>
              <MaterialCommunityIcons name={cfg.icon as any} size={18} color={cfg.color} />
            </View>
            <Text style={[statusSt.count, { color: colors.text }]}>{fmtNum(count)}</Text>
            <Text style={[statusSt.label, { color: colors.textSecondary }]}>{cfg.label}</Text>
            {total > 0 && count > 0 && (
              <Text style={[statusSt.pct, { color: cfg.color }]}>
                {((count / total) * 100).toFixed(0)}%
              </Text>
            )}
          </Animated.View>
        );
      })}
    </Animated.View>
  );
});
const statusSt = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: {
    width: '47%',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    gap: 4,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  count: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  pct: { fontSize: 10, fontWeight: '700' },
});

// ============================================================================
// DISH ROW
// ============================================================================

const DishRow = memo(function DishRow({
  dish,
  rank,
  colors,
  delay,
}: {
  dish: DishEntry;
  rank: number;
  colors: any;
  delay: number;
}) {
  const CATEGORY_COLORS: Record<string, string> = {
    'Main Course': '#FF6B35',
    Starter: '#7C4DFF',
    Dessert: '#E91E8C',
    Beverages: '#2196F3',
  };
  const accent = CATEGORY_COLORS[dish.category] ?? colors.primary;

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(340)}
      style={[dishSt.row, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[dishSt.rank, { backgroundColor: rank <= 3 ? accent + '20' : colors.background }]}>
        <Text style={[dishSt.rankNum, { color: rank <= 3 ? accent : colors.textSecondary }]}>
          #{rank}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[dishSt.name, { color: colors.text }]} numberOfLines={1}>{dish.dishName}</Text>
        <View style={dishSt.meta}>
          <View style={[dishSt.catPill, { backgroundColor: accent + '15' }]}>
            <Text style={[dishSt.cat, { color: accent }]}>{dish.category}</Text>
          </View>
        </View>
      </View>
      <Text style={[dishSt.price, { color: colors.text }]}>₹{dish.price}</Text>
    </Animated.View>
  );
});
const dishSt = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  rank: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rankNum: { fontSize: 12, fontWeight: '800' },
  name: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  meta: { flexDirection: 'row', gap: 6 },
  catPill: { paddingVertical: 2, paddingHorizontal: 7, borderRadius: 6 },
  cat: { fontSize: 10, fontWeight: '700' },
  qty: { fontSize: 10, fontWeight: '600' },
  price: { fontSize: 14, fontWeight: '800', letterSpacing: -0.3 },
});

// ============================================================================
// ORDER ROW
// ============================================================================

const OrderRow = memo(function OrderRow({
  order,
  colors,
  delay,
}: {
  order: OrderEntry;
  colors: any;
  delay: number;
}) {
  const METHOD_ICON: Record<string, string> = {
    Cash: 'cash',
    UPI: 'cellphone-nfc',
    Card: 'credit-card-outline',
  };
  const statusCfg = STATUS_CONFIG[order.orderStatus] ?? { color: colors.primary, icon: 'circle', label: order.orderStatus };

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(340)}
      style={[orderSt.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={orderSt.top}>
        <View style={orderSt.topLeft}>
          <View style={[orderSt.tableChip, { backgroundColor: colors.primary + '15' }]}>
            <MaterialCommunityIcons name="table-chair" size={13} color={colors.primary} />
            <Text style={[orderSt.tableText, { color: colors.primary }]}>Table {order.tableNo}</Text>
          </View>
          <Text style={[orderSt.customer, { color: colors.text }]}>{order.customer.name}</Text>
          <Text style={[orderSt.waiter, { color: colors.textSecondary }]}>
            by {order.waiter.waiterName}
          </Text>
        </View>
        <View style={orderSt.topRight}>
          <Text style={[orderSt.amount, { color: colors.text }]}>₹{order.totalAmount}</Text>
          <View style={[orderSt.statusPill, { backgroundColor: statusCfg.color + '18' }]}>
            <Text style={[orderSt.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>
      </View>
      <View style={[orderSt.divider, { backgroundColor: colors.border }]} />
      <View style={orderSt.bottom}>
        <View style={orderSt.payRow}>
          <MaterialCommunityIcons
            name={(METHOD_ICON[order.paymentMethod] ?? 'cash') as any}
            size={13}
            color={colors.textSecondary}
          />
          <Text style={[orderSt.payText, { color: colors.textSecondary }]}>{order.paymentMethod}</Text>
          {order.isPaymentCompleted && (
            <View style={[orderSt.paidPill, { backgroundColor: colors.success + '18' }]}>
              <Text style={[orderSt.paidText, { color: colors.success }]}>Paid</Text>
            </View>
          )}
        </View>
        <Text style={[orderSt.time, { color: colors.textSecondary }]}>{relativeTime(order.createdAt)}</Text>
      </View>
    </Animated.View>
  );
});
const orderSt = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 10 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  topLeft: { flex: 1, gap: 3 },
  topRight: { alignItems: 'flex-end', gap: 6 },
  tableChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 2 },
  tableText: { fontSize: 11, fontWeight: '700' },
  customer: { fontSize: 15, fontWeight: '700' },
  waiter: { fontSize: 12, fontWeight: '500' },
  amount: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  statusPill: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  divider: { height: 1, marginVertical: 10 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  payText: { fontSize: 12, fontWeight: '500' },
  paidPill: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 },
  paidText: { fontSize: 10, fontWeight: '700' },
  time: { fontSize: 11, fontWeight: '500' },
});

// ============================================================================
// CUSTOMER ROW
// ============================================================================

const CustomerRow = memo(function CustomerRow({
  customer,
  rank,
  colors,
  delay,
}: {
  customer: CustomerEntry;
  rank: number;
  colors: any;
  delay: number;
}) {
  const initials = customer.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(340)}
      style={[custSt.row, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[custSt.avatar, { backgroundColor: colors.primary + '20' }]}>
        <Text style={[custSt.initials, { color: colors.primary }]}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[custSt.name, { color: colors.text }]}>{customer.name}</Text>
        <Text style={[custSt.mobile, { color: colors.textSecondary }]}>{customer.mobile}</Text>
      </View>
      <View style={custSt.right}>
        <Text style={[custSt.rank, { color: colors.textSecondary }]}>#{rank}</Text>
        <View style={[custSt.badge, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[custSt.badgeText, { color: colors.primary }]}>
            {customer.orderCount} {customer.orderCount === 1 ? 'order' : 'orders'}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
});
const custSt = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  avatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  initials: { fontSize: 15, fontWeight: '800' },
  name: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  mobile: { fontSize: 12, fontWeight: '500' },
  right: { alignItems: 'flex-end', gap: 4 },
  rank: { fontSize: 11, fontWeight: '600' },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});

// ============================================================================
// EMPTY STATE
// ============================================================================

const EmptyState = memo(function EmptyState({
  message,
  icon,
  colors,
}: {
  message: string;
  icon: string;
  colors: any;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[empSt.container, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <MaterialCommunityIcons name={icon as any} size={36} color={colors.textSecondary} />
      <Text style={[empSt.text, { color: colors.textSecondary }]}>{message}</Text>
    </Animated.View>
  );
});
const empSt = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 36, borderRadius: 16, borderWidth: 1.5, gap: 10 },
  text: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
});

// ============================================================================
// SALES TAB CONTENT
// ============================================================================

const SalesTab = memo(function SalesTab({
  data,
  colors,
}: {
  data?: SalesData;
  colors: any;
}) {
  if (!data) return <EmptyState message="Sales data unavailable" icon="chart-line" colors={colors} />;

  return (
    <>
      {/* Today KPIs */}
      <SectionHeader title="Today" colors={colors} delay={0} />
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 4 }}>
        <KpiCard
          icon="cash-multiple"
          label="Revenue"
          value={fmt(data.today.totalSales)}
          accent={colors.primary}
          delay={60}
          colors={colors}
        />
        <KpiCard
          icon="receipt"
          label="Orders"
          value={`${data.today.ordersCount}`}
          accent={colors.success}
          delay={120}
          colors={colors}
        />
        <KpiCard
          icon="trending-up"
          label="Avg Order"
          value={fmt(data.today.averageOrderValue)}
          accent="#7C4DFF"
          delay={180}
          colors={colors}
        />
      </View>

      {/* Weekly */}
      <SectionHeader title="This Week" colors={colors} delay={200} />
      {Object.keys(data.weekly.dailySales).length > 0 ? (
        <MiniBarChart data={data.weekly.dailySales} colors={colors} />
      ) : null}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <KpiCard
          icon="cash-multiple"
          label="Total"
          value={fmt(data.weekly.totalSales)}
          accent={colors.primary}
          delay={240}
          colors={colors}
        />
        <KpiCard
          icon="receipt"
          label="Orders"
          value={`${data.weekly.ordersCount}`}
          accent={colors.success}
          delay={280}
          colors={colors}
        />
        <KpiCard
          icon="calendar-today"
          label="Daily Avg"
          value={fmt(parseFloat(data.weekly.averageDaily))}
          accent="#2196F3"
          delay={320}
          colors={colors}
        />
      </View>

      {/* Monthly */}
      <SectionHeader title={`Month: ${data.monthly.month}`} colors={colors} delay={360} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <KpiCard
          icon="cash-multiple"
          label="Total"
          value={fmt(data.monthly.totalSales)}
          accent={colors.primary}
          delay={380}
          colors={colors}
        />
        <KpiCard
          icon="receipt"
          label="Orders"
          value={`${data.monthly.ordersCount}`}
          accent={colors.success}
          delay={420}
          colors={colors}
        />
        <KpiCard
          icon="trending-up"
          label="Avg Order"
          value={fmt(parseFloat(data.monthly.averageOrderValue))}
          accent="#E91E8C"
          delay={460}
          colors={colors}
        />
      </View>
    </>
  );
});

// ============================================================================
// ORDERS TAB CONTENT
// ============================================================================

const OrdersTab = memo(function OrdersTab({
  orders,
  orderStatus,
  completionTime,
  colors,
}: {
  orders?: OrderEntry[];
  orderStatus?: Record<string, number>;
  completionTime?: { averageMinutes: number };
  colors: any;
}) {
  return (
    <>
      {/* Summary row */}
      <SectionHeader title="Status Overview" colors={colors} delay={0} />
      {orderStatus ? (
        <>
          <OrderStatusGrid data={orderStatus} colors={colors} />
          {completionTime && (
            <Animated.View
              entering={FadeInDown.delay(160).duration(340)}
              style={[compSt.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <MaterialCommunityIcons name="timer-outline" size={22} color={colors.primary} />
              <View>
                <Text style={[compSt.value, { color: colors.text }]}>
                  {completionTime.averageMinutes} min
                </Text>
                <Text style={[compSt.label, { color: colors.textSecondary }]}>Avg Completion Time</Text>
              </View>
            </Animated.View>
          )}
        </>
      ) : (
        <EmptyState message="Order status unavailable" icon="receipt-text-outline" colors={colors} />
      )}

      {/* Order list */}
      <SectionHeader title="Recent Orders" colors={colors} delay={100} />
      {orders && orders.length > 0 ? (
        orders.map((o, i) => (
          <OrderRow key={o.ordersId} order={o} colors={colors} delay={i * 40 + 80} />
        ))
      ) : (
        <EmptyState message="No orders found" icon="receipt-text-outline" colors={colors} />
      )}
    </>
  );
});
const compSt = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1.5, padding: 14, marginTop: 10 },
  value: { fontSize: 20, fontWeight: '800' },
  label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
});

// ============================================================================
// DISHES TAB
// ============================================================================

const DishesTab = memo(function DishesTab({
  dishes,
  colors,
}: {
  dishes?: { bestSelling: DishEntry[] };
  colors: any;
}) {
  if (!dishes?.bestSelling?.length)
    return <EmptyState message="No dish data available" icon="food-off" colors={colors} />;

  return (
    <>
      <SectionHeader title="Best Selling Dishes" colors={colors} delay={0} />
      {dishes.bestSelling.map((d, i) => (
        <DishRow key={d.dishId} dish={d} rank={i + 1} colors={colors} delay={i * 50 + 60} />
      ))}
    </>
  );
});

// ============================================================================
// PAYMENTS TAB
// ============================================================================

const PaymentsTab = memo(function PaymentsTab({
  paymentMethods,
  colors,
}: {
  paymentMethods?: Record<string, number>;
  colors: any;
}) {
  if (!paymentMethods)
    return <EmptyState message="Payment data unavailable" icon="credit-card-off-outline" colors={colors} />;

  const total = Object.values(paymentMethods).reduce((a, b) => a + b, 0);
  const PALETTE = [colors.primary, colors.success, colors.warning];

  return (
    <>
      <SectionHeader title="Revenue by Payment Method" colors={colors} delay={0} />
      <PaymentBreakdown data={paymentMethods} colors={colors} />
      <SectionHeader title="Breakdown" colors={colors} delay={80} />
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        {Object.entries(paymentMethods).map(([method, amount], i) => (
          <KpiCard
            key={method}
            icon={i === 0 ? 'cash' : i === 1 ? 'cellphone-nfc' : 'credit-card-outline'}
            label={method}
            value={fmt(amount)}
            sub={total > 0 ? `${((amount / total) * 100).toFixed(0)}% share` : undefined}
            accent={PALETTE[i % PALETTE.length]}
            delay={i * 80 + 100}
            colors={colors}
          />
        ))}
      </View>
    </>
  );
});

// ============================================================================
// CUSTOMERS TAB
// ============================================================================

const CustomersTab = memo(function CustomersTab({
  customers,
  colors,
}: {
  customers?: { top: CustomerEntry[] };
  colors: any;
}) {
  if (!customers?.top?.length)
    return <EmptyState message="No customer data available" icon="account-off-outline" colors={colors} />;

  return (
    <>
      <SectionHeader title="Top Customers" colors={colors} delay={0} />
      {customers.top.map((c, i) => (
        <CustomerRow key={c.mobile} customer={c} rank={i + 1} colors={colors} delay={i * 50 + 60} />
      ))}
    </>
  );
});

// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function AnalyticsScreen() {
  const { getAuthHeaders } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({});
  const [partialErrors, setPartialErrors] = useState<string[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('sales');

  const staleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchAnalytics = useCallback(
    async (silent = false) => {
      if (!silent) {
        setIsInitialLoading(true);
        setFetchError(null);
        setPartialErrors([]);
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      try {
        const res = await fetch(ANALYTICS_ENDPOINT, {
          headers: getAuthHeaders(),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const json = await res.json();

        if (!res.ok) {
          setFetchError(json?.message ?? `Server error ${res.status}`);
          return;
        }

        // Handle both 'success' and 'partial'
        if (json?.status === 'success' || json?.status === 'partial') {
          setAnalyticsData(json.data ?? {});
          setPartialErrors(json.errors ?? []);
          setFetchError(null);
          const now = new Date();
          setLastUpdated(now);
          setIsStale(false);

          // Reset stale timer
          if (staleTimer.current) clearTimeout(staleTimer.current);
          staleTimer.current = setTimeout(() => setIsStale(true), STALE_AFTER_MS);
        } else {
          setFetchError(json?.message ?? 'Unexpected response from server');
        }
      } catch (err: any) {
        clearTimeout(timeout);
        if (err?.name === 'AbortError') {
          setFetchError('Request timed out. Please check your connection.');
        } else if (err?.message?.includes('Network request failed')) {
          setFetchError('Unable to reach server. Check your connection.');
        } else {
          setFetchError('Failed to load analytics. Please try again.');
        }
      } finally {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    },
    [getAuthHeaders]
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchAnalytics(true);
  }, [fetchAnalytics]);

  useEffect(() => {
    fetchAnalytics();
    return () => {
      if (staleTimer.current) clearTimeout(staleTimer.current);
    };
  }, []);

  // ── Memoised styles ────────────────────────────────────────────────────────
  const containerStyle = useMemo(
    () => [sc.container, { backgroundColor: c.background, paddingTop: insets.top }],
    [c.background, insets.top]
  );

  const headerStyle = useMemo(
    () => [sc.header, { borderBottomColor: c.border }],
    [c.border]
  );

  const iconBtnStyle = useMemo(
    () => [sc.iconBtn, { backgroundColor: c.card, borderColor: c.border }],
    [c.card, c.border]
  );

  // ── Tab content ────────────────────────────────────────────────────────────
  const tabContent = useMemo(() => {
    switch (activeTab) {
      case 'sales':
        return <SalesTab data={analyticsData.sales} colors={c} />;
      case 'orders':
        return (
          <OrdersTab
            orders={analyticsData.orders}
            orderStatus={analyticsData.orderStatus}
            completionTime={analyticsData.completionTime}
            colors={c}
          />
        );
      case 'dishes':
        return <DishesTab dishes={analyticsData.dishes} colors={c} />;
      case 'payments':
        return <PaymentsTab paymentMethods={analyticsData.paymentMethods} colors={c} />;
      case 'customers':
        return <CustomersTab customers={analyticsData.customers} colors={c} />;
    }
  }, [activeTab, analyticsData, c]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={containerStyle}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(350)} style={headerStyle}>
        <View style={{ flex: 1 }}>
          <Text style={[sc.title, { color: c.text }]}>Analytics</Text>
          {lastUpdated && (
            <Text style={[sc.subtitle, { color: c.textSecondary }]}>
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
        <Pressable
          onPress={toggleTheme}
          style={({ pressed }) => [iconBtnStyle, { opacity: pressed ? 0.7 : 1 }]}
          accessibilityLabel="Toggle theme"
        >
          <MaterialCommunityIcons
            name={isDark ? 'weather-sunny' : 'moon-waning-crescent'}
            size={20}
            color={c.primary}
          />
        </Pressable>
      </Animated.View>

      {/* Tab bar */}
      <Animated.View entering={FadeInDown.delay(80).duration(300)} style={{ marginVertical: 8 }}>
        <TabBar active={activeTab} onChange={setActiveTab} colors={c} />
      </Animated.View>

      {/* Main scroll */}
      <ScrollView
        contentContainerStyle={[sc.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={c.primary}
            colors={[c.primary]}
          />
        }
      >
        {/* Stale banner */}
        {isStale && !isRefreshing && !isInitialLoading && (
          <StaleBanner onRefresh={handleRefresh} colors={c} />
        )}

        {/* Fetch error */}
        {fetchError && (
          <ErrorBanner message={fetchError} onRetry={() => fetchAnalytics()} colors={c} />
        )}

        {/* Partial errors */}
        {partialErrors.length > 0 && (
          <PartialBanner errors={partialErrors} colors={c} />
        )}

        {/* Loading state */}
        {isInitialLoading ? (
          <View style={sc.loadingWrap}>
            <ActivityIndicator size="large" color={c.primary} />
            <Text style={[sc.loadingText, { color: c.textSecondary }]}>Loading analytics…</Text>
          </View>
        ) : (
          tabContent
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// SCREEN STYLES
// ============================================================================

const sc = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  loadingWrap: { alignItems: 'center', paddingVertical: 60, gap: 14 },
  loadingText: { fontSize: 14, fontWeight: '500' },
});