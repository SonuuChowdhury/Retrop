// ============================================================================
// MANAGER DASHBOARD SCREEN
// ============================================================================
// • API called on mount + manual pull-to-refresh only (no auto-poll)
// • "New data may be available" banner appears 2 min after last refresh
// • Animated stat cards memoised — no re-animation on parent re-render
// • Stable style objects via useMemo
// ============================================================================

import React, { useEffect, useState, useCallback, useRef, useMemo, memo } from 'react';
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
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ENDPOINTS } from '@/config/api';

const STALE_AFTER_MS = 2 * 60 * 1000; // 2 minutes

// ============================================================================
// TYPES
// ============================================================================

interface DashboardSummary {
  todayOrdersCount: number;
  busyTablesCount: number;
  activeWaitersCount: number;
}

interface StatCard {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  subtitle: string;
}

// ============================================================================
// ANIMATED STAT CARD — memoised so it never re-renders unless data changes
// ============================================================================

const StatCardComponent = memo(function StatCardComponent({
  card,
  index,
  colors,
}: {
  card: StatCard;
  index: number;
  colors: any;
}) {
  const cardStyle = useMemo(
    () => [
      statStyles.card,
      {
        backgroundColor: colors.card,
        borderColor: colors.border,
        shadowColor: card.color,
      },
    ],
    [colors.card, colors.border, card.color]
  );

  const iconCircleStyle = useMemo(
    () => [statStyles.iconCircle, { backgroundColor: card.color + '15' }],
    [card.color]
  );

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100 + 100).duration(400)}
      style={statStyles.cardWrapper}
    >
      <View style={cardStyle}>
        <View style={iconCircleStyle}>
          <MaterialCommunityIcons name={card.icon as any} size={24} color={card.color} />
        </View>
        <Text style={[statStyles.value, { color: colors.text }]}>{card.value}</Text>
        <Text style={[statStyles.label, { color: colors.textSecondary }]} numberOfLines={2}>
          {card.label}
        </Text>
        <Text style={[statStyles.subtitle, { color: card.color }]}>{card.subtitle}</Text>
      </View>
    </Animated.View>
  );
});

const statStyles = StyleSheet.create({
  cardWrapper: { flex: 1 },
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  value: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: { fontSize: 9, fontWeight: '600', textAlign: 'center' },
});

// ============================================================================
// QUICK ACTION — memoised
// ============================================================================

const QuickAction = memo(function QuickAction({
  icon,
  label,
  onPress,
  colors,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  colors: any;
}) {
  const btnStyle = useMemo(
    () => ({ backgroundColor: colors.card, borderColor: colors.border }),
    [colors.card, colors.border]
  );
  const labelStyle = useMemo(() => ({ color: colors.text }), [colors.text]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [qaStyles.button, btnStyle, { opacity: pressed ? 0.75 : 1 }]}
    >
      <MaterialCommunityIcons name={icon as any} size={22} color={colors.primary} />
      <Text style={[qaStyles.label, labelStyle]}>{label}</Text>
    </Pressable>
  );
});

const qaStyles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 6,
    minWidth: 72,
  },
  label: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
});

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
      entering={FadeInDown.duration(350).springify()}
      style={[
        bannerStyles.banner,
        { backgroundColor: colors.primary + '12', borderColor: colors.primary + '35' },
      ]}
    >
      <MaterialCommunityIcons name="information-outline" size={16} color={colors.primary} />
      <Text style={[bannerStyles.text, { color: colors.text }]}>New data may be available</Text>
      <Pressable
        onPress={onRefresh}
        style={[bannerStyles.btn, { backgroundColor: colors.primary }]}
      >
        <Text style={bannerStyles.btnText}>Refresh</Text>
      </Pressable>
    </Animated.View>
  );
});

const bannerStyles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  text: { flex: 1, fontSize: 13, fontWeight: '500' },
  btn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

// ============================================================================
// DASHBOARD SCREEN
// ============================================================================

export default function DashboardScreen() {
  const { manager, getAuthHeaders } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const c = theme.colors;

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [fetchError, setFetchError] = useState('');
  const [isStale, setIsStale] = useState(false);

  const staleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Card width — reactive to orientation ────────────────────────────────
  const cardAreaWidth = SCREEN_WIDTH - 40;
  const CARD_WIDTH = (cardAreaWidth - 20) / 3;

  // ─── Fetch summary ────────────────────────────────────────────────────────
  const fetchSummary = useCallback(
    async (silent = false) => {
      if (!silent) setIsRefreshing(true);
      setFetchError('');
      setIsStale(false);

      // Clear any running stale timer
      if (staleTimerRef.current) clearTimeout(staleTimerRef.current);

      try {
        const response = await fetch(ENDPOINTS.MANAGER_DASHBOARD, {
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          setFetchError(`Server error (${response.status}). Please try again.`);
          return;
        }

        const contentType = response.headers.get('content-type') ?? '';
        if (!contentType.includes('application/json')) {
          setFetchError('Server returned an unexpected response. Please retry.');
          return;
        }

        const json = await response.json();

        if (json?.status === 'success' && json?.data) {
          setSummary(json.data);
          setLastUpdated(new Date());
          setFetchError('');

          // Start stale timer — show banner after 2 minutes
          staleTimerRef.current = setTimeout(() => {
            setIsStale(true);
          }, STALE_AFTER_MS);
        } else {
          setFetchError(json?.message ?? 'Failed to load dashboard data.');
        }
      } catch {
        setFetchError('Network error. Check your connection.');
      } finally {
        setIsRefreshing(false);
        setIsInitialLoading(false);
      }
    },
    [getAuthHeaders]
  );

  // Initial load only — no polling interval
  useEffect(() => {
    fetchSummary();
    return () => {
      if (staleTimerRef.current) clearTimeout(staleTimerRef.current);
    };
  }, [fetchSummary]);

  // ─── Stat cards ───────────────────────────────────────────────────────────
  const statCards: StatCard[] = useMemo(
    () => [
      {
        label: "Today's Orders",
        value: summary?.todayOrdersCount ?? '—',
        icon: 'clipboard-list',
        color: c.primary,
        subtitle: 'Total today',
      },
      {
        label: 'Busy Tables',
        value: summary?.busyTablesCount ?? '—',
        icon: 'table-furniture',
        color: '#6366F1',
        subtitle: 'Occupied now',
      },
      {
        label: 'Active Waiters',
        value: summary?.activeWaitersCount ?? '—',
        icon: 'account-multiple',
        color: c.success,
        subtitle: 'On shift',
      },
    ],
    [summary, c.primary, c.success]
  );

  // ─── Memoised styles ─────────────────────────────────────────────────────
  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: c.background }],
    [c.background]
  );
  const headerStyle = useMemo(
    () => [styles.header, { paddingTop: insets.top + 12 }],
    [insets.top]
  );
  const greetingStyle = useMemo(
    () => [styles.greeting, { color: c.textSecondary }],
    [c.textSecondary]
  );
  const nameStyle = useMemo(() => [styles.managerName, { color: c.text }], [c.text]);
  const lastUpdatedStyle = useMemo(
    () => [styles.lastUpdated, { color: c.textSecondary }],
    [c.textSecondary]
  );
  const iconButtonStyle = useMemo(
    () => [styles.iconButton, { backgroundColor: c.card, borderColor: c.border }],
    [c.card, c.border]
  );
  const roleBadgeStyle = useMemo(
    () => [styles.roleBadge, { backgroundColor: c.primary + '15' }],
    [c.primary]
  );
  const roleTextStyle = useMemo(
    () => [styles.roleText, { color: c.primary }],
    [c.primary]
  );
  const sectionTitleStyle = useMemo(
    () => [styles.sectionTitle, { color: c.text }],
    [c.text]
  );
  const profileCardStyle = useMemo(
    () => [styles.profileCard, { backgroundColor: c.card, borderColor: c.border }],
    [c.card, c.border]
  );
  const profileAvatarStyle = useMemo(
    () => [styles.profileAvatar, { backgroundColor: c.primary + '15' }],
    [c.primary]
  );
  const profileRoleBadgeStyle = useMemo(
    () => [styles.profileRoleBadge, { backgroundColor: c.primary + '15' }],
    [c.primary]
  );
  const profileRoleTextStyle = useMemo(
    () => [styles.profileRoleText, { color: c.primary }],
    [c.primary]
  );
  const errorBannerStyle = useMemo(
    () => [
      styles.errorBanner,
      { backgroundColor: c.error + '12', borderColor: c.error + '30' },
    ],
    [c.error]
  );

  return (
    <View style={containerStyle}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(350)} style={headerStyle}>
        <View style={{ flex: 1 }}>
          <Text style={greetingStyle}>
            {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'},
          </Text>
          <Text style={nameStyle} numberOfLines={1}>
            {manager?.name ?? 'Manager'}
          </Text>
          {lastUpdated && (
            <Text style={lastUpdatedStyle}>
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>

        <View style={styles.headerRight}>
          <Pressable
            onPress={toggleTheme}
            style={iconButtonStyle}
            accessibilityLabel="Toggle theme"
          >
            <MaterialCommunityIcons
              name={isDark ? 'weather-sunny' : 'moon-waning-crescent'}
              size={20}
              color={c.primary}
            />
          </Pressable>
          <View style={roleBadgeStyle}>
            <Text style={roleTextStyle}>
              {(manager?.role ?? 'manager').toUpperCase()}
            </Text>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchSummary()}
            tintColor={c.primary}
            colors={[c.primary]}
          />
        }
      >
        {/* Stale data banner */}
        {isStale && !isRefreshing && (
          <StaleBanner onRefresh={() => fetchSummary()} colors={c} />
        )}

        {/* Error banner */}
        {fetchError ? (
          <Animated.View entering={FadeInDown.duration(300)} style={errorBannerStyle}>
            <MaterialCommunityIcons name="wifi-off" size={16} color={c.error} />
            <Text style={[styles.errorBannerText, { color: c.error }]}>{fetchError}</Text>
            <Pressable onPress={() => fetchSummary()}>
              <Text style={[styles.retryText, { color: c.primary }]}>Retry</Text>
            </Pressable>
          </Animated.View>
        ) : null}

        {/* Stats Section */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <Text style={sectionTitleStyle}>Live Overview</Text>
        </Animated.View>

        {isInitialLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={c.primary} />
            <Text style={[styles.loadingText, { color: c.textSecondary }]}>Loading dashboard…</Text>
          </View>
        ) : (
          <View style={styles.statsRow}>
            {statCards.map((card, i) => (
              <StatCardComponent key={card.label} card={card} index={i} colors={c} />
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)}>
          <Text style={[sectionTitleStyle, { marginTop: 24 }]}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <QuickAction icon="account-multiple-plus" label="Add Waiter" onPress={() => {}} colors={c} />
            <QuickAction icon="food-outline" label="Menu" onPress={() => {}} colors={c} />
            <QuickAction icon="table-plus" label="Add Table" onPress={() => {}} colors={c} />
            <QuickAction icon="chart-bar" label="Reports" onPress={() => {}} colors={c} />
          </View>
        </Animated.View>

        {/* Manager Info Card */}
        {manager && (
          <Animated.View entering={FadeInUp.delay(400).duration(400)}>
            <Text style={[sectionTitleStyle, { marginTop: 24 }]}>Your Profile</Text>
            <View style={profileCardStyle}>
              <View style={profileAvatarStyle}>
                <MaterialCommunityIcons name="account-tie" size={32} color={c.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.profileName, { color: c.text }]}>{manager.name}</Text>
                <Text style={[styles.profileDetail, { color: c.textSecondary }]}>
                  📱 {manager.mobile}
                </Text>
                {manager.email && (
                  <Text
                    style={[styles.profileDetail, { color: c.textSecondary }]}
                    numberOfLines={1}
                  >
                    ✉️ {manager.email}
                  </Text>
                )}
                <View style={profileRoleBadgeStyle}>
                  <Text style={profileRoleTextStyle}>
                    {manager.role.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
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
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  greeting: { fontSize: 14, fontWeight: '500' },
  managerName: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3, marginTop: 2 },
  lastUpdated: { fontSize: 11, marginTop: 4, fontWeight: '500' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  roleBadge: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8 },
  roleText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
    marginBottom: 12,
  },

  statsRow: { flexDirection: 'row', gap: 10 },

  loadingContainer: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '500' },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: { fontSize: 13, fontWeight: '600', flex: 1 },
  retryText: { fontSize: 13, fontWeight: '700' },

  quickActionsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  profileDetail: { fontSize: 13, fontWeight: '500', marginBottom: 2 },
  profileRoleBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  profileRoleText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
});