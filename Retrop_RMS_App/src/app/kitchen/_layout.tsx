// ============================================================================
// KITCHEN SECTION LAYOUT  (NEW)
// ============================================================================

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKitchenAuth } from '@/context/KitchenAuthContext';
import { ThemeTransitionView, useTheme } from '@/context/ThemeContext';
import { useDialog } from '@/context/DialogContext';
import { connectSocket, disconnectSocket } from '@/utils/socket';
import { registerForPushNotificationsAsync } from '@/services/notificationService';
import { ENDPOINTS } from '@/config/api';
import { apiCall } from '@/utils/apiClient';

export default function KitchenLayout() {
  const { isAuthenticated, isLoading, accessToken, logout } = useKitchenAuth();
  const { theme } = useTheme();
  const { showConfirm } = useDialog();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  // FIX #13: Prevent auth guard from firing after deliberate logout
  const loggingOutRef = useRef(false);

  // ── Auth Guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !loggingOutRef.current) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading]);

  // ── Socket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    connectSocket(accessToken, 'kitchen');
    return () => { disconnectSocket(); };
  }, [isAuthenticated, accessToken]);

  // ── FCM Token Registration ───────────────────────────────────────────────
  // Registers the FCM device token with the backend so the server can send
  // push notifications even when the app is in background or killed.
  // Silently no-ops in Expo Go (SDK 53+) or on simulators.
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    (async () => {
      try {
        const fcmToken = await registerForPushNotificationsAsync();
        if (!fcmToken) return; // Expo Go / simulator — skip
        await apiCall(
          `${ENDPOINTS.KITCHEN_LOGIN.replace('/login', '/fcm-token')}`,
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
      message: 'Sign out from kitchen?',
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

      {/* Minimal footer bar with logout */}
      <View style={[styles.footer, { backgroundColor: c.card, borderTopColor: c.border, paddingBottom: insets.bottom > 0 ? insets.bottom : 10 }]}>
        <View style={styles.kitchenLabel}>
          <MaterialCommunityIcons name="chef-hat" size={16} color={c.textSecondary} />
          <Text style={[styles.kitchenText, { color: c.textSecondary }]}>Kitchen Mode</Text>
        </View>
        <Pressable onPress={handleLogout} style={[styles.logoutBtn, { borderColor: c.error + '40' }]}>
          <MaterialCommunityIcons name="logout" size={14} color={c.error} />
          <Text style={[styles.logoutText, { color: c.error }]}>Logout</Text>
        </Pressable>
      </View>
    </ThemeTransitionView>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  kitchenLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kitchenText: { fontSize: 13, fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1,
  },
  logoutText: { fontSize: 12, fontWeight: '700' },
});
