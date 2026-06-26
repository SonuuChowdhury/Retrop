// ============================================================================
// MANAGER SECTION LAYOUT
// ============================================================================
// Auth guard + WebSocket connection + custom tab bar.
// Fixes:
//   - #13: Logout redirect loop fixed via loggingOutRef guard
//   - #16: Tab bar shows icons only (no labels) except Logout
// ============================================================================

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter, useSegments } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SOCKET_CONFIG, getSocketUrl } from "@/config/api";
import { useAuth } from "@/context/AuthContext";
import { ThemeTransitionView, useTheme } from "@/context/ThemeContext";
import { useDialog } from "@/context/DialogContext";

// ============================================================================
// TAB DEFINITION
// ============================================================================

const MANAGER_TABS = [
  { name: "dashboard",       label: "Home",       icon: "view-dashboard-outline" as const, iconActive: "view-dashboard" as const },
  { name: "waiters",         label: "Waiters",    icon: "account-multiple-outline" as const, iconActive: "account-multiple" as const },
  { name: "kitchen",         label: "Kitchen",    icon: "chef-hat" as const, iconActive: "chef-hat" as const },
  { name: "tables",          label: "Tables",     icon: "table-furniture" as const, iconActive: "table-furniture" as const },
  { name: "menu",            label: "Menu",       icon: "food-outline" as const, iconActive: "food" as const },
  { name: "analytics",       label: "Analytics",  icon: "chart-line" as const, iconActive: "chart-line" as const },
  { name: "restaurant-info", label: "Info",       icon: "storefront-outline" as const, iconActive: "storefront" as const },
] as const;

type TabName = (typeof MANAGER_TABS)[number]["name"];

// ============================================================================
// TAB BAR BUTTON — Icons only, no labels (Issue #16)
// ============================================================================

interface TabBarButtonProps {
  tab: (typeof MANAGER_TABS)[number];
  isActive: boolean;
  onPress: () => void;
  colors: any;
}

function TabBarButton({ tab, isActive, onPress, colors }: TabBarButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.88, { damping: 25, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 18, stiffness: 300 });
    });
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={styles.tabButton}
      accessibilityLabel={tab.label}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View style={[styles.tabButtonInner, animatedStyle]}>
        {isActive && (
          <Animated.View
            entering={FadeIn.duration(180)}
            style={[styles.activeIndicator, { backgroundColor: colors.primary }]}
          />
        )}
        <MaterialCommunityIcons
          name={isActive ? tab.iconActive : tab.icon}
          size={24}  /* slightly larger since no label */
          color={isActive ? colors.primary : colors.textSecondary}
        />
        {/* NO label text — Issue #16: icons only for all tabs except Logout */}
      </Animated.View>
    </Pressable>
  );
}

// ============================================================================
// MANAGER LAYOUT
// ============================================================================

export default function ManagerLayout() {
  const { isAuthenticated, isLoading, accessToken, logout } = useAuth();
  const { theme } = useTheme();
  const { showConfirm } = useDialog();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  const segments = useSegments();
  const currentTab = (segments[segments.length - 1] as TabName) ?? "dashboard";

  const socketRef = useRef<any>(null);
  const activityIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // FIX #13: Track logout-in-progress to prevent auth guard from re-firing and
  // causing a redirect loop back to the login page → home → layout → login...
  const loggingOutRef = useRef(false);

  // ─── Auth Guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !loggingOutRef.current) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading]);

  // ─── WebSocket Connection ────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    connectManagerSocket(accessToken);
    return () => { disconnectSocket(); };
  }, [isAuthenticated, accessToken]);

  const connectManagerSocket = async (token: string) => {
    try {
      const { io } = await import("socket.io-client").catch(() => ({ io: null }));
      if (!io) return;

      socketRef.current = io(getSocketUrl(), {
        auth: { token },
        ...SOCKET_CONFIG,
        transports: ["websocket"],
      });

      socketRef.current.on("connected", (data: any) => {
        console.log("[Socket] Manager connected:", data?.sessionId);
      });
      socketRef.current.on("disconnect", () => {
        console.log("[Socket] Manager disconnected");
      });
      socketRef.current.on("manager:error", (data: any) => {
        console.warn("[Socket] Manager error:", data?.message);
      });

      activityIntervalRef.current = setInterval(() => {
        if (socketRef.current?.connected) {
          socketRef.current.emit("manager:activity");
        }
      }, 60_000);
    } catch (error) {
      console.warn("[Socket] Connection failed:", error);
    }
  };

  const disconnectSocket = () => {
    if (activityIntervalRef.current) {
      clearInterval(activityIntervalRef.current);
      activityIntervalRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  // ─── Logout — FIX #13 ────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    showConfirm({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out from the manager portal?',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      destructive: true,
      onConfirm: async () => {
        // Set flag BEFORE logout to prevent auth guard from firing on isAuthenticated=false
        loggingOutRef.current = true;
        disconnectSocket();
        await logout();
        // Go directly to login — NOT home — to avoid loop
        router.replace("/login");
      },
    });
  }, [logout, showConfirm]);

  const navigateToTab = (tabName: TabName) => {
    router.push(`/manager/${tabName}` as any);
  };

  if (isLoading || !isAuthenticated) return null;

  return (
    <ThemeTransitionView style={{ flex: 1, backgroundColor: c.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.background },
          animation: "fade_from_bottom",
          animationDuration: 200,
        }}
      />

      {/* Custom Tab Bar — icons only (Issue #16) */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: c.card,
            borderTopColor: c.border,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          },
        ]}
      >
        {MANAGER_TABS.map((tab) => (
          <TabBarButton
            key={tab.name}
            tab={tab}
            isActive={currentTab === tab.name}
            onPress={() => navigateToTab(tab.name as TabName)}
            colors={c}
          />
        ))}

        {/* Logout button — keeps label text as per Issue #16 spec */}
        <Pressable
          onPress={handleLogout}
          style={styles.tabButton}
          accessibilityLabel="Sign out"
        >
          <View style={styles.tabButtonInner}>
            <MaterialCommunityIcons name="logout" size={24} color={c.error} />
            <Text style={[styles.logoutLabel, { color: c.error }]}>
              Logout
            </Text>
          </View>
        </Pressable>
      </View>
    </ThemeTransitionView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonInner: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 2,
    minWidth: 36,
  },
  activeIndicator: {
    position: "absolute",
    top: -8,
    width: 24,
    height: 3,
    borderRadius: 2,
  },
  // Only used for Logout button label
  logoutLabel: {
    fontSize: 10,
    letterSpacing: 0.1,
    fontWeight: "600",
  },
});
