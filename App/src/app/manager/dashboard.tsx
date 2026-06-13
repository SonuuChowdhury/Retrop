// ============================================================================
// MANAGER — DASHBOARD SCREEN
// ============================================================================
// Removed "Quick Actions" grid.
// Added prominent restaurant open/close toggle.
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Pressable, ActivityIndicator, Alert, Switch,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ENDPOINTS } from '@/config/api';

import { SkeletonLoader, SkeletonKPI } from '@/components/SkeletonLoader/SkeletonLoader';

// ============================================================================
// TYPES
// ============================================================================

interface DashboardData {
  totalWaiters?: number;
  activeWaiters?: number;
  totalTables?: number;
  occupiedTables?: number;
  todayOrders?: number;
  todayRevenue?: number;
  pendingOrders?: number;
  restaurantName?: string;
}

interface RestaurantSettings {
  isRestaurantOpen: boolean;
}

// ============================================================================
// DASHBOARD SCREEN
// ============================================================================

export default function ManagerDashboard() {
  const { getAuthHeaders, manager } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  const [data, setData] = useState<DashboardData | null>(null);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch dashboard + settings ──────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [dashRes, settingsRes] = await Promise.all([
        fetch(ENDPOINTS.MANAGER_DASHBOARD, { headers: getAuthHeaders() }),
        fetch(ENDPOINTS.MANAGER_SETTINGS, { headers: getAuthHeaders() }),
      ]);

      const dashJson = await dashRes.json();
      const settingsJson = await settingsRes.json();

      if (dashJson?.status === 'success') setData(dashJson.data);
      if (settingsJson?.status === 'success') setSettings(settingsJson.data);

      setError(null);
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // ── Restaurant Toggle ────────────────────────────────────────────────────
  const handleToggleRestaurant = () => {
    if (!settings) return;
    const willOpen = !settings.isRestaurantOpen;

    Alert.alert(
      willOpen ? 'Open Restaurant' : 'Close Restaurant',
      willOpen
        ? 'Are you sure you want to open the restaurant?'
        : 'Are you sure you want to close the restaurant? All active waiters will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: willOpen ? 'Open' : 'Close',
          style: willOpen ? 'default' : 'destructive',
          onPress: () => doToggle(willOpen),
        },
      ],
    );
  };

  const doToggle = async (isOpen: boolean) => {
    setToggleLoading(true);
    try {
      const res = await fetch(ENDPOINTS.MANAGER_SETTINGS_TOGGLE, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isRestaurantOpen: isOpen }),
      });
      const json = await res.json();
      if (json?.status === 'success') {
        setSettings({ isRestaurantOpen: isOpen });
      } else {
        Alert.alert('Error', json?.message ?? 'Failed to update status.');
      }
    } catch {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setToggleLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background, paddingTop: insets.top + 16, paddingHorizontal: 20 }}>
        {/* Header Skeleton */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <View style={{ gap: 6 }}>
            <SkeletonLoader width={80} height={14} />
            <SkeletonLoader width={140} height={24} style={{ marginTop: 4 }} />
          </View>
          <SkeletonLoader width={80} height={24} borderRadius={12} />
        </View>

        {/* Toggle Card Skeleton */}
        <View style={{ width: '100%', height: 74, borderRadius: 16, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.card, padding: 18, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <SkeletonLoader width={32} height={32} borderRadius={16} />
            <View style={{ gap: 6 }}>
              <SkeletonLoader width={120} height={16} />
              <SkeletonLoader width={160} height={12} />
            </View>
          </View>
          <SkeletonLoader width={48} height={24} borderRadius={12} />
        </View>

        {/* Stats Grid Skeleton */}
        <View style={styles.statsGrid}>
          <SkeletonKPI colors={c} />
          <SkeletonKPI colors={c} />
          <SkeletonKPI colors={c} />
          <SkeletonKPI colors={c} />
        </View>
      </View>
    );
  }

  const isOpen = settings?.isRestaurantOpen ?? false;

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
      ]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={FadeInUp.duration(350)} style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: c.textSecondary }]}>Good day,</Text>
          <Text style={[styles.managerName, { color: c.text }]}>
            {manager?.name ?? 'Manager'}
          </Text>
        </View>
        <View style={[styles.roleChip, { backgroundColor: c.primary + '18' }]}>
          <MaterialCommunityIcons name="account-tie" size={14} color={c.primary} />
          <Text style={[styles.roleText, { color: c.primary }]}>{manager?.role ?? 'manager'}</Text>
        </View>
      </Animated.View>

      {/* Error Banner */}
      {error && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[styles.errorBanner, { backgroundColor: c.error + '12', borderColor: c.error + '30' }]}
        >
          <MaterialCommunityIcons name="wifi-off" size={15} color={c.error} />
          <Text style={[styles.errorText, { color: c.error }]}>{error}</Text>
          <Pressable onPress={fetchData}>
            <Text style={[styles.retryText, { color: c.primary }]}>Retry</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* ── RESTAURANT OPEN/CLOSE TOGGLE ───────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.delay(80).duration(380)}
        style={[
          styles.toggleCard,
          {
            backgroundColor: isOpen ? c.success + '12' : c.error + '10',
            borderColor: isOpen ? c.success + '40' : c.error + '30',
          },
        ]}
      >
        <View style={styles.toggleLeft}>
          <MaterialCommunityIcons
            name={isOpen ? 'storefront' : 'storefront-outline'}
            size={32}
            color={isOpen ? c.success : c.error}
          />
          <View style={{ marginLeft: 14 }}>
            <Text style={[styles.toggleTitle, { color: c.text }]}>Restaurant Status</Text>
            <Text style={[styles.toggleSubtitle, { color: isOpen ? c.success : c.error }]}>
              {isOpen ? '● OPEN — Accepting orders' : '○ CLOSED — Not accepting orders'}
            </Text>
          </View>
        </View>

        <View style={styles.toggleRight}>
          {toggleLoading ? (
            <ActivityIndicator size="small" color={isOpen ? c.success : c.error} />
          ) : (
            <Switch
              value={isOpen}
              onValueChange={handleToggleRestaurant}
              trackColor={{ false: c.error + '60', true: c.success + '60' }}
              thumbColor={isOpen ? c.success : c.error}
              ios_backgroundColor={c.error + '40'}
            />
          )}
        </View>
      </Animated.View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {[
          { label: 'Active Waiters', value: `${data?.activeWaiters ?? 0} / ${data?.totalWaiters ?? 0}`, icon: 'account-multiple', color: c.primary, delay: 150 },
          { label: 'Tables Occupied', value: `${data?.occupiedTables ?? 0} / ${data?.totalTables ?? 0}`, icon: 'table-furniture', color: c.warning, delay: 200 },
          { label: "Today's Orders", value: data?.todayOrders ?? 0, icon: 'receipt', color: c.success, delay: 250 },
          { label: "Today's Revenue", value: `₹${((data?.todayRevenue ?? 0) / 100).toFixed(0)}`, icon: 'cash-multiple', color: '#8B5CF6', delay: 300 },
        ].map((stat) => (
          <Animated.View
            key={stat.label}
            entering={FadeInDown.delay(stat.delay).duration(350)}
            style={[styles.statCard, { backgroundColor: c.card, borderColor: c.border }]}
          >
            <View style={[styles.statIconBg, { backgroundColor: stat.color + '18' }]}>
              <MaterialCommunityIcons name={stat.icon as any} size={20} color={stat.color} />
            </View>
            <Text style={[styles.statValue, { color: c.text }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: c.textSecondary }]}>{stat.label}</Text>
          </Animated.View>
        ))}
      </View>

      {/* Pending Orders Badge */}
      {(data?.pendingOrders ?? 0) > 0 && (
        <Animated.View
          entering={FadeInDown.delay(350).duration(350)}
          style={[styles.pendingCard, { backgroundColor: c.warning + '12', borderColor: c.warning + '35' }]}
        >
          <MaterialCommunityIcons name="clock-alert-outline" size={18} color={c.warning} />
          <Text style={[styles.pendingText, { color: c.text }]}>
            <Text style={{ fontWeight: '800', color: c.warning }}>{data?.pendingOrders}</Text> order{(data?.pendingOrders ?? 0) > 1 ? 's' : ''} pending kitchen preparation
          </Text>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: { fontSize: 13, fontWeight: '500' },
  managerName: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  roleText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: { flex: 1, fontSize: 13, fontWeight: '600' },
  retryText: { fontSize: 13, fontWeight: '700' },

  // Restaurant toggle card
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 18,
    marginBottom: 20,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  toggleRight: { marginLeft: 12 },
  toggleTitle: { fontSize: 16, fontWeight: '700', marginBottom: 3 },
  toggleSubtitle: { fontSize: 13, fontWeight: '600' },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '47%',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    gap: 8,
  },
  statIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, fontWeight: '500' },

  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    marginBottom: 16,
  },
  pendingText: { fontSize: 14, fontWeight: '500', flex: 1 },
});
