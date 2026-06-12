// ============================================================================
// MANAGER ANALYTICS SCREEN  (UPDATED — fixed import, uses ENDPOINTS)
// ============================================================================
// • GET /api/manager/analytics/orders  (order list with filter)
// • GET /api/admins/analytics           (aggregate metrics)
// • Pull-to-refresh + stale banner (2 min)
// • Filter tabs: Sales / Dishes / Orders / Customers / Payments
// • Zero external chart libs — pure RN bar / pie visuals
// ============================================================================

import React, {
  useEffect, useState, useCallback, useRef, useMemo, memo,
} from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Pressable, ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ENDPOINTS } from '@/config/api';

const STALE_AFTER_MS = 2 * 60 * 1000;

// ============================================================================
// TYPES
// ============================================================================

interface SalesData {
  today: { totalSales: number; ordersCount: number; completedOrders: number; averageOrderValue: number };
  weekly: { dailySales: Record<string, number>; totalSales: number; ordersCount: number; averageDaily: string };
  monthly: { month: string; totalSales: number; ordersCount: number; averageOrderValue: string };
}
interface DishEntry { dishId: string; dishName: string; category: string; price: number; quantity: number }
interface OrderEntry {
  ordersId: string; tableNo: number; orderStatus: string; totalAmount: number;
  isPaymentCompleted: boolean; paymentMethod: string; createdAt: string;
  waiter: { waiterName: string }; customer: { name: string; mobile: string };
}
interface CustomerEntry { mobile: string; name: string; orderCount: number }
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

const fmt = (n: number) => n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n}`;
const fmtNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
function relativeTime(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}

// ============================================================================
// SUB-COMPONENTS (memoised for perf)
// ============================================================================

const StaleBanner = memo(({ onRefresh, colors }: { onRefresh: () => void; colors: any }) => (
  <Animated.View entering={FadeInDown.duration(300)} style={[bannerSt.banner, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
    <MaterialCommunityIcons name="information-outline" size={16} color={colors.primary} />
    <Text style={[bannerSt.text, { color: colors.text }]}>Data may be outdated</Text>
    <Pressable onPress={onRefresh} style={[bannerSt.btn, { backgroundColor: colors.primary }]}>
      <Text style={bannerSt.btnText}>Refresh</Text>
    </Pressable>
  </Animated.View>
));
const bannerSt = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 10, marginBottom: 12, gap: 8 },
  text: { flex: 1, fontSize: 13, fontWeight: '500' },
  btn: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 8 },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

const ErrorBanner = memo(({ message, onRetry, colors }: { message: string; onRetry: () => void; colors: any }) => (
  <Animated.View entering={FadeInDown.duration(300)} style={[errSt.banner, { backgroundColor: colors.error + '12', borderColor: colors.error + '30' }]}>
    <MaterialCommunityIcons name="wifi-off" size={16} color={colors.error} />
    <Text style={[errSt.text, { color: colors.error }]} numberOfLines={2}>{message}</Text>
    <Pressable onPress={onRetry}><Text style={[errSt.retry, { color: colors.primary }]}>Retry</Text></Pressable>
  </Animated.View>
));
const errSt = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 14, gap: 8 },
  text: { flex: 1, fontSize: 13, fontWeight: '600' },
  retry: { fontSize: 13, fontWeight: '700' },
});

const KpiCard = memo(({ icon, label, value, sub, accent, delay, colors }: {
  icon: string; label: string; value: string; sub?: string; accent: string; delay: number; colors: any;
}) => (
  <Animated.View entering={FadeInDown.delay(delay).duration(380)} style={[kpiSt.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={[kpiSt.iconCircle, { backgroundColor: accent + '18' }]}>
      <MaterialCommunityIcons name={icon as any} size={22} color={accent} />
    </View>
    <Text style={[kpiSt.value, { color: colors.text }]}>{value}</Text>
    <Text style={[kpiSt.label, { color: colors.textSecondary }]}>{label}</Text>
    {sub ? <Text style={[kpiSt.sub, { color: accent }]}>{sub}</Text> : null}
  </Animated.View>
));
const kpiSt = StyleSheet.create({
  card: { flex: 1, borderRadius: 16, borderWidth: 1.5, padding: 14, alignItems: 'center', minWidth: 100 },
  iconCircle: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  value: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 3 },
  label: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center', marginBottom: 2 },
  sub: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
});

const SectionHeader = memo(({ title, colors, delay = 0 }: { title: string; colors: any; delay?: number }) => (
  <Animated.Text entering={FadeInDown.delay(delay).duration(300)} style={[secSt.title, { color: colors.text }]}>
    {title}
  </Animated.Text>
));
const secSt = StyleSheet.create({ title: { fontSize: 16, fontWeight: '700', letterSpacing: 0.1, marginBottom: 12, marginTop: 20 } });

const MiniBarChart = memo(({ data, colors }: { data: Record<string, number>; colors: any }) => {
  const entries = Object.entries(data);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  return (
    <Animated.View entering={FadeInUp.delay(100).duration(400)} style={[chartSt.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[chartSt.title, { color: colors.textSecondary }]}>Daily Revenue</Text>
      <View style={chartSt.bars}>
        {entries.map(([date, val]) => {
          const pct = val / max;
          const label = days[new Date(date).getDay()] ?? date.slice(5);
          return (
            <View key={date} style={chartSt.barCol}>
              <Text style={[chartSt.barVal, { color: colors.textSecondary }]}>{val > 0 ? fmt(val) : ''}</Text>
              <View style={chartSt.barTrack}>
                <View style={[chartSt.bar, { height: `${Math.max(pct * 100, 4)}%`, backgroundColor: colors.primary, opacity: 0.7 + pct * 0.3 }]} />
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

const PaymentBreakdown = memo(({ data, colors }: { data: Record<string, number>; colors: any }) => {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  const PALETTE = [colors.primary, colors.success, colors.warning, '#7C4DFF'];
  return (
    <Animated.View entering={FadeInUp.delay(100).duration(400)} style={[pieSt.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[pieSt.title, { color: colors.textSecondary }]}>Payment Methods</Text>
      {Object.entries(data).map(([method, amount], i) => {
        const pct = total > 0 ? (amount / total) * 100 : 0;
        const accent = PALETTE[i % PALETTE.length];
        return (
          <View key={method} style={pieSt.row}>
            <View style={[pieSt.dot, { backgroundColor: accent }]} />
            <Text style={[pieSt.method, { color: colors.text }]}>{method}</Text>
            <View style={pieSt.barWrap}>
              <View style={[pieSt.barFill, { width: `${pct}%` as any, backgroundColor: accent }]} />
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

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  ordering:  { color: '#7C4DFF', icon: 'clock-outline',          label: 'Ordering' },
  preparing: { color: '#FF9800', icon: 'fire',                   label: 'Preparing' },
  ready:     { color: '#2196F3', icon: 'check-circle-outline',   label: 'Ready' },
  serving:   { color: '#00BCD4', icon: 'room-service-outline',   label: 'Serving' },
  completed: { color: '#4CAF50', icon: 'check-all',              label: 'Completed' },
  cancelled: { color: '#F44336', icon: 'close-circle-outline',   label: 'Cancelled' },
};

const OrderStatusGrid = memo(({ data, colors }: { data: Record<string, number>; colors: any }) => {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  return (
    <Animated.View entering={FadeInUp.delay(80).duration(400)} style={statusSt.grid}>
      {Object.entries(data).map(([status, count], i) => {
        const cfg = STATUS_CONFIG[status] ?? { color: colors.primary, icon: 'circle-outline', label: status };
        return (
          <Animated.View key={status} entering={FadeInDown.delay(i * 60 + 80).duration(350)}
            style={[statusSt.pill, { backgroundColor: colors.card, borderColor: cfg.color + '40' }]}>
            <View style={[statusSt.iconWrap, { backgroundColor: cfg.color + '15' }]}>
              <MaterialCommunityIcons name={cfg.icon as any} size={18} color={cfg.color} />
            </View>
            <Text style={[statusSt.count, { color: colors.text }]}>{fmtNum(count)}</Text>
            <Text style={[statusSt.label, { color: colors.textSecondary }]}>{cfg.label}</Text>
            {total > 0 && count > 0 && <Text style={[statusSt.pct, { color: cfg.color }]}>{((count / total) * 100).toFixed(0)}%</Text>}
          </Animated.View>
        );
      })}
    </Animated.View>
  );
});
const statusSt = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: { width: '47%', borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 4 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  count: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  pct: { fontSize: 10, fontWeight: '700' },
});

const DishRow = memo(({ dish, rank, colors, delay }: { dish: DishEntry; rank: number; colors: any; delay: number }) => {
  const CAT_COLORS: Record<string, string> = { 'Main Course': '#FF6B35', Starter: '#7C4DFF', Dessert: '#E91E8C', Beverages: '#2196F3' };
  const accent = CAT_COLORS[dish.category] ?? colors.primary;
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(340)} style={[dishSt.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[dishSt.rank, { backgroundColor: rank <= 3 ? accent + '20' : colors.background }]}>
        <Text style={[dishSt.rankNum, { color: rank <= 3 ? accent : colors.textSecondary }]}>#{rank}</Text>
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
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, padding: 12, marginBottom: 8, gap: 12 },
  rank: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rankNum: { fontSize: 12, fontWeight: '800' },
  name: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  meta: { flexDirection: 'row', gap: 6 },
  catPill: { paddingVertical: 2, paddingHorizontal: 7, borderRadius: 6 },
  cat: { fontSize: 10, fontWeight: '700' },
  price: { fontSize: 14, fontWeight: '800', letterSpacing: -0.3 },
});

const AnalyticsOrderRow = memo(({ order, colors, delay }: { order: OrderEntry; colors: any; delay: number }) => {
  const METHOD_ICON: Record<string, string> = { Cash: 'cash', UPI: 'cellphone-nfc', Card: 'credit-card-outline', cash: 'cash', upi: 'cellphone-nfc', online: 'credit-card-outline' };
  const statusCfg = STATUS_CONFIG[order.orderStatus] ?? { color: colors.primary, icon: 'circle', label: order.orderStatus };
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(340)} style={[aOrderSt.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={aOrderSt.top}>
        <View style={aOrderSt.topLeft}>
          <View style={[aOrderSt.tableChip, { backgroundColor: colors.primary + '15' }]}>
            <MaterialCommunityIcons name="table-chair" size={13} color={colors.primary} />
            <Text style={[aOrderSt.tableText, { color: colors.primary }]}>Table {order.tableNo}</Text>
          </View>
          <Text style={[aOrderSt.customer, { color: colors.text }]}>{order.customer.name}</Text>
          <Text style={[aOrderSt.waiter, { color: colors.textSecondary }]}>by {order.waiter.waiterName}</Text>
        </View>
        <View style={aOrderSt.topRight}>
          <Text style={[aOrderSt.amount, { color: colors.text }]}>₹{order.totalAmount}</Text>
          <View style={[aOrderSt.statusPill, { backgroundColor: statusCfg.color + '18' }]}>
            <Text style={[aOrderSt.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>
      </View>
      <View style={[aOrderSt.divider, { backgroundColor: colors.border }]} />
      <View style={aOrderSt.bottom}>
        <View style={aOrderSt.payRow}>
          <MaterialCommunityIcons name={(METHOD_ICON[order.paymentMethod] ?? 'cash') as any} size={13} color={colors.textSecondary} />
          <Text style={[aOrderSt.payText, { color: colors.textSecondary }]}>{order.paymentMethod}</Text>
          {order.isPaymentCompleted && (
            <View style={[aOrderSt.paidPill, { backgroundColor: colors.success + '18' }]}>
              <Text style={[aOrderSt.paidText, { color: colors.success }]}>Paid</Text>
            </View>
          )}
        </View>
        <Text style={[aOrderSt.time, { color: colors.textSecondary }]}>{relativeTime(order.createdAt)}</Text>
      </View>
    </Animated.View>
  );
});
const aOrderSt = StyleSheet.create({
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

const CustomerRow = memo(({ customer, rank, colors, delay }: { customer: CustomerEntry; rank: number; colors: any; delay: number }) => {
  const initials = customer.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(340)} style={[custSt.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
          <Text style={[custSt.badgeText, { color: colors.primary }]}>{customer.orderCount} {customer.orderCount === 1 ? 'order' : 'orders'}</Text>
        </View>
      </View>
    </Animated.View>
  );
});
const custSt = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, padding: 12, marginBottom: 8, gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  initials: { fontSize: 15, fontWeight: '800' },
  name: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  mobile: { fontSize: 12, fontWeight: '500' },
  right: { alignItems: 'flex-end', gap: 4 },
  rank: { fontSize: 11, fontWeight: '600' },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});

const EmptyState = memo(({ message, icon, colors }: { message: string; icon: string; colors: any }) => (
  <Animated.View entering={FadeIn.duration(300)} style={[empSt.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <MaterialCommunityIcons name={icon as any} size={36} color={colors.textSecondary} />
    <Text style={[empSt.text, { color: colors.textSecondary }]}>{message}</Text>
  </Animated.View>
));
const empSt = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 36, borderRadius: 16, borderWidth: 1.5, gap: 10 },
  text: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
});

// ============================================================================
// TAB CONTENT
// ============================================================================

const SalesTab = memo(({ data, colors }: { data?: SalesData; colors: any }) => {
  if (!data) return <EmptyState message="Sales data unavailable" icon="chart-line" colors={colors} />;
  return (
    <>
      <SectionHeader title="Today" colors={colors} delay={0} />
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 4 }}>
        <KpiCard icon="cash-multiple" label="Revenue"   value={fmt(data.today.totalSales)}        accent={colors.primary} delay={60}  colors={colors} />
        <KpiCard icon="receipt"       label="Orders"    value={`${data.today.ordersCount}`}       accent={colors.success} delay={120} colors={colors} />
        <KpiCard icon="trending-up"   label="Avg Order" value={fmt(data.today.averageOrderValue)} accent="#7C4DFF"        delay={180} colors={colors} />
      </View>
      <SectionHeader title="This Week" colors={colors} delay={200} />
      {Object.keys(data.weekly.dailySales).length > 0 && <MiniBarChart data={data.weekly.dailySales} colors={colors} />}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <KpiCard icon="cash-multiple"  label="Total"     value={fmt(data.weekly.totalSales)}                   accent={colors.primary} delay={240} colors={colors} />
        <KpiCard icon="receipt"        label="Orders"    value={`${data.weekly.ordersCount}`}                  accent={colors.success} delay={280} colors={colors} />
        <KpiCard icon="calendar-today" label="Daily Avg" value={fmt(parseFloat(data.weekly.averageDaily))}     accent="#2196F3"        delay={320} colors={colors} />
      </View>
      <SectionHeader title={`Month: ${data.monthly.month}`} colors={colors} delay={360} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <KpiCard icon="cash-multiple" label="Total"     value={fmt(data.monthly.totalSales)}                    accent={colors.primary} delay={380} colors={colors} />
        <KpiCard icon="receipt"       label="Orders"    value={`${data.monthly.ordersCount}`}                   accent={colors.success} delay={420} colors={colors} />
        <KpiCard icon="trending-up"   label="Avg Order" value={fmt(parseFloat(data.monthly.averageOrderValue))} accent="#E91E8C"        delay={460} colors={colors} />
      </View>
    </>
  );
});

const OrdersTab = memo(({ orders, orderStatus, colors }: { orders?: OrderEntry[]; orderStatus?: Record<string, number>; colors: any }) => (
  <>
    {orderStatus && Object.keys(orderStatus).length > 0 && (
      <>
        <SectionHeader title="Order Breakdown" colors={colors} delay={0} />
        <OrderStatusGrid data={orderStatus} colors={colors} />
      </>
    )}
    <SectionHeader title="Recent Orders" colors={colors} delay={100} />
    {(!orders || orders.length === 0)
      ? <EmptyState message="No orders found" icon="receipt" colors={colors} />
      : orders.slice(0, 50).map((o, i) => <AnalyticsOrderRow key={o.ordersId} order={o} colors={colors} delay={i * 40} />)
    }
  </>
));

const DishesTab = memo(({ data, colors }: { data?: { bestSelling: DishEntry[] }; colors: any }) => (
  <>
    <SectionHeader title="Best-Selling Dishes" colors={colors} delay={0} />
    {(!data || data.bestSelling.length === 0)
      ? <EmptyState message="No dish data yet" icon="food-outline" colors={colors} />
      : data.bestSelling.map((d, i) => <DishRow key={d.dishId} dish={d} rank={i + 1} colors={colors} delay={i * 50} />)
    }
  </>
));

const PaymentsTab = memo(({ paymentMethods, colors }: { paymentMethods?: Record<string, number>; colors: any }) => (
  <>
    <SectionHeader title="Payment Methods" colors={colors} delay={0} />
    {(!paymentMethods || Object.keys(paymentMethods).length === 0)
      ? <EmptyState message="No payment data yet" icon="cash-multiple" colors={colors} />
      : <PaymentBreakdown data={paymentMethods} colors={colors} />
    }
  </>
));

const CustomersTab = memo(({ data, colors }: { data?: { top: CustomerEntry[] }; colors: any }) => (
  <>
    <SectionHeader title="Top Customers" colors={colors} delay={0} />
    {(!data || data.top.length === 0)
      ? <EmptyState message="No customer data yet" icon="account-group-outline" colors={colors} />
      : data.top.map((c, i) => <CustomerRow key={c.mobile} customer={c} rank={i + 1} colors={colors} delay={i * 50} />)
    }
  </>
));

// ============================================================================
// MAIN SCREEN
// ============================================================================

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'sales',     label: 'Sales',     icon: 'chart-line' },
  { key: 'orders',    label: 'Orders',    icon: 'receipt' },
  { key: 'dishes',    label: 'Dishes',    icon: 'food-outline' },
  { key: 'payments',  label: 'Payments',  icon: 'cash-multiple' },
  { key: 'customers', label: 'Customers', icon: 'account-group-outline' },
];

export default function AnalyticsScreen() {
  const { getAuthHeaders } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('sales');

  const fetchedAt = useRef<number | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const [aggRes, ordersRes] = await Promise.all([
        fetch(ENDPOINTS.ANALYTICS, { headers: getAuthHeaders() }),
        fetch(ENDPOINTS.MANAGER_ANALYTICS_ORDERS, { headers: getAuthHeaders() }),
      ]);
      const aggJson = await aggRes.json();
      const ordersJson = await ordersRes.json();

      const combined: AnalyticsData = {};
      if (aggJson?.status === 'success' || aggJson?.status === 'partial') {
        Object.assign(combined, aggJson.data);
      }
      if (ordersJson?.status === 'success') {
        combined.orders = ordersJson.data as OrderEntry[];
      }

      if (Object.keys(combined).length === 0) {
        setError(aggJson?.message ?? 'Failed to load analytics data.');
      } else {
        setData(combined);
        fetchedAt.current = Date.now();
        setIsStale(false);
        setError(null);
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => { fetchAnalytics(); }, []);

  // Stale check
  useEffect(() => {
    const interval = setInterval(() => {
      if (fetchedAt.current && Date.now() - fetchedAt.current > STALE_AFTER_MS) {
        setIsStale(true);
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const activeTabContent = useMemo(() => {
    if (!data) return null;
    switch (activeTab) {
      case 'sales':     return <SalesTab data={data.sales} colors={c} />;
      case 'orders':    return <OrdersTab orders={data.orders} orderStatus={data.orderStatus} colors={c} />;
      case 'dishes':    return <DishesTab data={data.dishes} colors={c} />;
      case 'payments':  return <PaymentsTab paymentMethods={data.paymentMethods} colors={c} />;
      case 'customers': return <CustomersTab data={data.customers} colors={c} />;
      default: return null;
    }
  }, [activeTab, data, c]);

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
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: c.text }]}>Analytics</Text>
        <Pressable
          onPress={() => { setRefreshing(true); fetchAnalytics(); }}
          style={[styles.refreshBtn, { backgroundColor: c.card, borderColor: c.border }]}
        >
          <MaterialCommunityIcons name="refresh" size={18} color={c.primary} />
        </Pressable>
      </View>

      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}
        style={{ flexGrow: 0 }}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tab, active && [styles.tabActive, { backgroundColor: c.primary }], !active && { borderColor: c.border }]}
            >
              <MaterialCommunityIcons name={tab.icon as any} size={14} color={active ? '#fff' : c.textSecondary} />
              <Text style={[styles.tabLabel, { color: active ? '#fff' : c.textSecondary, fontWeight: active ? '700' : '500' }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAnalytics(); }} tintColor={c.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {isStale && <StaleBanner onRefresh={fetchAnalytics} colors={c} />}
        {error && <ErrorBanner message={error} onRetry={fetchAnalytics} colors={c} />}
        {!error && activeTabContent}
        {!data && !error && !loading && (
          <EmptyState message="No data yet. Place some orders first!" icon="chart-line" colors={c} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  refreshBtn: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },

  tabBar: { paddingHorizontal: 16, paddingBottom: 8, gap: 8, alignItems: 'center' },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1,
  },
  tabActive: { borderWidth: 0 },
  tabLabel: { fontSize: 13 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },
});
