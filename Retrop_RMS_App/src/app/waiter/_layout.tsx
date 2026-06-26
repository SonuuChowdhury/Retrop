// ============================================================================
// WAITER SECTION LAYOUT  (NEW)
// ============================================================================
// Auth guard + socket.io connection + custom tab bar.
// ============================================================================

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useWaiterAuth } from '@/context/WaiterAuthContext';
import { ThemeTransitionView, useTheme } from '@/context/ThemeContext';
import { useDialog } from '@/context/DialogContext';
import { connectSocket, disconnectSocket } from '@/utils/socket';
import { registerForPushNotificationsAsync } from '@/services/notificationService';
import { ENDPOINTS } from '@/config/api';
import { apiCall } from '@/utils/apiClient';

// ============================================================================
// TABS
// ============================================================================

const WAITER_TABS = [
  { name: 'dashboard',     label: 'Home',    icon: 'view-dashboard-outline' as const, iconActive: 'view-dashboard' as const },
  { name: 'active-orders', label: 'Orders',  icon: 'receipt' as const,                 iconActive: 'receipt' as const },
] as const;

type TabName = (typeof WAITER_TABS)[number]['name'];

// ============================================================================
// TAB BUTTON
// ============================================================================

function TabBarButton({ tab, isActive, onPress, colors }: {
  tab: (typeof WAITER_TABS)[number]; isActive: boolean; onPress: () => void; colors: any;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSpring(0.88, { damping: 25, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 18, stiffness: 300 });
    });
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={styles.tabButton} accessibilityLabel={tab.label} accessibilityRole="tab">
      <Animated.View style={[styles.tabInner, animStyle]}>
        {isActive && (
          <Animated.View entering={FadeIn.duration(180)} style={[styles.activeBar, { backgroundColor: colors.primary }]} />
        )}
        <MaterialCommunityIcons
          name={isActive ? tab.iconActive : tab.icon}
          size={24}
          color={isActive ? colors.primary : colors.textSecondary}
        />
        <Text style={[styles.tabLabel, { color: isActive ? colors.primary : colors.textSecondary, fontWeight: isActive ? '700' : '500' }]}>
          {tab.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ============================================================================
// LAYOUT
// ============================================================================

export default function WaiterLayout() {
  const { isAuthenticated, isLoading, accessToken, logout } = useWaiterAuth();
  const { theme } = useTheme();
  const { showConfirm } = useDialog();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  const segments = useSegments();
  const currentTab = (segments[segments.length - 1] as TabName) ?? 'dashboard';

  // FIX #13: Prevent auth guard from firing after deliberate logout
  const loggingOutRef = useRef(false);

  // ── Auth Guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !loggingOutRef.current) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading]);

  // ── Socket connection ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    connectSocket(accessToken, 'waiter');
    return () => { disconnectSocket(); };
  }, [isAuthenticated, accessToken]);

  // ── FCM Token Registration ───────────────────────────────────────────────
  // Registers device push token with backend so server can send FCM notifications.
  // No-ops in Expo Go (SDK 53+) or on simulators.
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    (async () => {
      try {
        const fcmToken = await registerForPushNotificationsAsync();
        if (!fcmToken) return; // Expo Go / simulator — skip
        await apiCall(
          `${ENDPOINTS.WAITER_LOGIN.replace('/login', '/fcm-token')}`,
          { method: 'POST', body: JSON.stringify({ fcmToken }) },
          async () => accessToken,
          async () => false,
          () => {},
        );
      } catch {
        // Non-critical — fail silently
      }
    })();
  }, [isAuthenticated, accessToken]);

  const handleLogout = useCallback(() => {
    showConfirm({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      destructive: true,
      onConfirm: async () => {
        loggingOutRef.current = true;
        disconnectSocket();
        await logout();
        router.replace('/login');
      },
    });
  }, [logout, showConfirm]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <ThemeTransitionView style={{ flex: 1, backgroundColor: c.background }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background }, animation: 'fade_from_bottom', animationDuration: 180 }} />

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: c.card, borderTopColor: c.border, paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
        {WAITER_TABS.map((tab) => (
          <TabBarButton
            key={tab.name}
            tab={tab}
            isActive={currentTab === tab.name}
            onPress={() => router.push(`/waiter/${tab.name}` as any)}
            colors={c}
          />
        ))}
        <Pressable onPress={handleLogout} style={styles.tabButton}>
          <View style={styles.tabInner}>
            <MaterialCommunityIcons name="logout" size={24} color={c.error} />
            <Text style={[styles.tabLabel, { color: c.error, fontWeight: '500' }]}>Logout</Text>
          </View>
        </Pressable>
      </View>
    </ThemeTransitionView>
  );
}

const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8 },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabInner: { alignItems: 'center', justifyContent: 'center', paddingVertical: 4, gap: 2, minWidth: 52 },
  activeBar: { position: 'absolute', top: -8, width: 28, height: 3, borderRadius: 2 },
  tabLabel: { fontSize: 11, letterSpacing: 0.1 },
});
