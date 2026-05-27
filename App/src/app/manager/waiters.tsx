// ============================================================================
// MANAGER — WAITERS SCREEN
// ============================================================================
// • FlatList replaces ScrollView + .map() for large lists
// • Per-item entrance animation only fires on first mount via initialNumToRender
// • WaiterCard memoised
// • Stable style objects via useMemo
// ============================================================================

import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItemInfo,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ENDPOINTS } from "@/config/api";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

// ============================================================================
// TYPES
// ============================================================================

interface Waiter {
  waiterId: string;
  waiterName: string;
  mobile: string;
  isActive: boolean;
  createdAt: string;
}

interface WaiterProfile extends Waiter {
  isCurrentlyLoggedIn: boolean;
  sessionStartTime?: string;
  todayStats: {
    totalOrders: number;
    completedOrders: number;
    totalEarnings: number;
  };
  currentTable?: number | null;
}

// ============================================================================
// ADD WAITER MODAL
// ============================================================================

function AddWaiterModal({
  visible,
  onClose,
  onSuccess,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  colors: any;
}) {
  const { getAuthHeaders } = useAuth();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setName("");
    setMobile("");
    setPassword("");
    setShowPass(false);
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleAdd = async () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      setError("Enter a valid 10-digit mobile.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(ENDPOINTS.WAITERS, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ waiterName: name.trim(), mobile, password }),
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        setError("Server error. Please check your connection and retry.");
        return;
      }

      const json = await res.json();
      if (json?.status === "success") {
        reset();
        onSuccess();
      } else {
        setError(json?.message ?? "Failed to add waiter.");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.modalOverlay} onPress={handleClose}>
        <Pressable
          style={[
            styles.modalCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => {}}
        >
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Add New Waiter
          </Text>

          {(["Name", "Mobile", "Password"] as const).map((field) => {
            const value =
              field === "Name" ? name : field === "Mobile" ? mobile : password;
            const setter =
              field === "Name"
                ? setName
                : field === "Mobile"
                  ? (v: string) => setMobile(v.replace(/\D/g, "").slice(0, 10))
                  : setPassword;
            return (
              <View key={field} style={{ marginBottom: 14 }}>
                <Text
                  style={[styles.modalLabel, { color: colors.textSecondary }]}
                >
                  {field}
                </Text>
                <View
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <TextInput
                    style={{ flex: 1, color: colors.text, fontSize: 15 }}
                    value={value}
                    onChangeText={setter as any}
                    placeholder={`Enter ${field.toLowerCase()}`}
                    placeholderTextColor={colors.textSecondary + "80"}
                    keyboardType={field === "Mobile" ? "number-pad" : "default"}
                    secureTextEntry={field === "Password" && !showPass}
                    autoCapitalize={field === "Name" ? "words" : "none"}
                  />
                  {field === "Password" && (
                    <TouchableOpacity onPress={() => setShowPass((p) => !p)}>
                      <MaterialCommunityIcons
                        name={showPass ? "eye-off-outline" : "eye-outline"}
                        size={18}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          {error ? (
            <Text style={[styles.modalError, { color: colors.error }]}>
              {error}
            </Text>
          ) : null}

          <View style={styles.modalActions}>
            <Pressable
              onPress={handleClose}
              style={[
                styles.modalBtn,
                { borderColor: colors.border, borderWidth: 1 },
              ]}
            >
              <Text
                style={[styles.modalBtnText, { color: colors.textSecondary }]}
              >
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleAdd}
              disabled={loading}
              style={[styles.modalBtn, { backgroundColor: colors.primary }]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>
                  Add Waiter
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ============================================================================
// WAITER PROFILE MODAL
// ============================================================================

function WaiterProfileModal({
  waiterId,
  onClose,
  onDeleted,
  colors,
  getAuthHeaders,
}: {
  waiterId: string | null;
  onClose: () => void;
  onDeleted: () => void;
  colors: any;
  getAuthHeaders: () => Record<string, string>;
}) {
  const [profile, setProfile] = useState<WaiterProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!waiterId) {
      setProfile(null);
      return;
    }
    setLoading(true);
    fetch(ENDPOINTS.WAITER_BY_ID(waiterId), { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((json) => {
        if (json?.status === "success") setProfile(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [waiterId]);

  const handleToggleStatus = async () => {
    if (!profile) return;
    setActionLoading(true);
    try {
      const res = await fetch(ENDPOINTS.WAITER_STATUS(profile.waiterId), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive: !profile.isActive }),
      });
      const json = await res.json();
      if (json?.status === "success")
        setProfile((p) => (p ? { ...p, isActive: !p.isActive } : p));
      else Alert.alert("Error", json?.message ?? "Failed to update status.");
    } catch {
      Alert.alert("Error", "Network error.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!profile || newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(
        ENDPOINTS.WAITER_RESET_PASSWORD(profile.waiterId),
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ newPassword }),
        },
      );
      const json = await res.json();
      if (json?.status === "success") {
        Alert.alert("Success", "Password reset successfully.");
        setNewPassword("");
        setShowReset(false);
      } else Alert.alert("Error", json?.message ?? "Failed.");
    } catch {
      Alert.alert("Error", "Network error.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = () => {
    if (!profile) return;
    Alert.alert(
      "Delete Waiter",
      `Are you sure you want to delete ${profile.waiterName}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await fetch(
                ENDPOINTS.WAITER_BY_ID(profile.waiterId),
                {
                  method: "DELETE",
                  headers: getAuthHeaders(),
                },
              );
              const json = await res.json();
              if (json?.status === "success") {
                onDeleted();
                onClose();
              } else
                Alert.alert("Error", json?.message ?? "Cannot delete waiter.");
            } catch {
              Alert.alert("Error", "Network error.");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  if (!waiterId) return null;

  return (
    <Modal
      visible={!!waiterId}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[
            styles.profileModal,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => {}}
        >
          <View style={styles.profileModalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Waiter Profile
            </Text>
            <Pressable onPress={onClose}>
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginVertical: 32 }}
            />
          ) : profile ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Name & Status */}
              <View style={styles.profileRow}>
                <View
                  style={[
                    styles.profileAvatar,
                    { backgroundColor: colors.primary + "15" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="account"
                    size={28}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: "700",
                      color: colors.text,
                    }}
                  >
                    {profile.waiterName}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.textSecondary,
                      marginTop: 2,
                    }}
                  >
                    📱 {profile.mobile}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: profile.isActive
                            ? colors.success + "20"
                            : colors.error + "20",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          {
                            color: profile.isActive
                              ? colors.success
                              : colors.error,
                          },
                        ]}
                      >
                        {profile.isActive ? "Active" : "Inactive"}
                      </Text>
                    </View>
                    {profile.isCurrentlyLoggedIn && (
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: colors.primary + "20" },
                        ]}
                      >
                        <Text
                          style={[styles.badgeText, { color: colors.primary }]}
                        >
                          Online
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Today Stats */}
              <View
                style={[
                  styles.statsBox,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: colors.textSecondary,
                    marginBottom: 10,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  Today's Stats
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  {[
                    { label: "Orders", value: profile.todayStats.totalOrders },
                    {
                      label: "Completed",
                      value: profile.todayStats.completedOrders,
                    },
                    {
                      label: "Earnings",
                      value: `₹${profile.todayStats.totalEarnings.toFixed(0)}`,
                    },
                  ].map((stat) => (
                    <View key={stat.label} style={{ alignItems: "center" }}>
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: "800",
                          color: colors.text,
                        }}
                      >
                        {stat.value}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.textSecondary,
                          marginTop: 2,
                        }}
                      >
                        {stat.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Actions */}
              <View style={{ gap: 10, marginTop: 4 }}>
                <Pressable
                  onPress={handleToggleStatus}
                  disabled={actionLoading}
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: profile.isActive
                        ? colors.warning + "15"
                        : colors.success + "15",
                      borderColor: profile.isActive
                        ? colors.warning
                        : colors.success,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      profile.isActive
                        ? "account-off-outline"
                        : "account-check-outline"
                    }
                    size={18}
                    color={profile.isActive ? colors.warning : colors.success}
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      {
                        color: profile.isActive
                          ? colors.warning
                          : colors.success,
                      },
                    ]}
                  >
                    {profile.isActive ? "Deactivate Waiter" : "Activate Waiter"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setShowReset((p) => !p)}
                  style={[styles.actionBtn, { borderColor: colors.border }]}
                >
                  <MaterialCommunityIcons
                    name="lock-reset"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <Text style={[styles.actionBtnText, { color: colors.text }]}>
                    Reset Password
                  </Text>
                  <MaterialCommunityIcons
                    name={showReset ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.textSecondary}
                    style={{ marginLeft: "auto" }}
                  />
                </Pressable>

                {showReset && (
                  <View style={{ gap: 8 }}>
                    <View
                      style={[
                        styles.modalInput,
                        {
                          backgroundColor: colors.inputBackground,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <TextInput
                        style={{ flex: 1, color: colors.text, fontSize: 15 }}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="New password (min 6 chars)"
                        placeholderTextColor={colors.textSecondary + "80"}
                        secureTextEntry
                      />
                    </View>
                    <Pressable
                      onPress={handleResetPassword}
                      disabled={actionLoading}
                      style={[
                        styles.actionBtn,
                        {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      {actionLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={[styles.actionBtnText, { color: "#fff" }]}>
                          Confirm Reset
                        </Text>
                      )}
                    </Pressable>
                  </View>
                )}

                <Pressable
                  onPress={handleDelete}
                  disabled={actionLoading || profile.isCurrentlyLoggedIn}
                  style={[
                    styles.actionBtn,
                    {
                      borderColor: colors.error,
                      opacity: profile.isCurrentlyLoggedIn ? 0.4 : 1,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={18}
                    color={colors.error}
                  />
                  <Text style={[styles.actionBtnText, { color: colors.error }]}>
                    {profile.isCurrentlyLoggedIn
                      ? "Cannot delete (logged in)"
                      : "Delete Waiter"}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          ) : (
            <Text
              style={{
                color: colors.textSecondary,
                textAlign: "center",
                marginVertical: 24,
              }}
            >
              Failed to load profile.
            </Text>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ============================================================================
// WAITER CARD — memoised, entrance animation only on initial mount
// ============================================================================

const WaiterCard = memo(function WaiterCard({
  waiter,
  onPress,
  colors,
  index,
}: {
  waiter: Waiter;
  onPress: () => void;
  colors: any;
  index: number;
}) {
  const avatarStyle = useMemo(
    () => [styles.waiterAvatar, { backgroundColor: colors.primary + "15" }],
    [colors.primary],
  );
  const badgeStyle = useMemo(
    () => [
      styles.badge,
      {
        backgroundColor: waiter.isActive
          ? colors.success + "20"
          : colors.error + "20",
      },
    ],
    [waiter.isActive, colors.success, colors.error],
  );
  const badgeTextStyle = useMemo(
    () => [
      styles.badgeText,
      { color: waiter.isActive ? colors.success : colors.error },
    ],
    [waiter.isActive, colors.success, colors.error],
  );

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(280)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.waiterCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <View style={avatarStyle}>
          <MaterialCommunityIcons
            name="account"
            size={24}
            color={colors.primary}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
            {waiter.waiterName}
          </Text>
          <Text
            style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}
          >
            📱 {waiter.mobile}
          </Text>
        </View>
        <View style={badgeStyle}>
          <Text style={badgeTextStyle}>
            {waiter.isActive ? "Active" : "Off"}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={colors.textSecondary}
          style={{ marginLeft: 8 }}
        />
      </Pressable>
    </Animated.View>
  );
});

// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function WaitersScreen() {
  const { getAuthHeaders } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedWaiterId, setSelectedWaiterId] = useState<string | null>(null);

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchWaiters = useCallback(
    async (q = "") => {
      setFetchError("");
      try {
        const url = q
          ? `${ENDPOINTS.WAITERS}?search=${encodeURIComponent(q)}`
          : ENDPOINTS.WAITERS;
        const res = await fetch(url, { headers: getAuthHeaders() });

        const contentType = res.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) {
          setFetchError(
            "Server returned an unexpected response. Check your connection.",
          );
          return;
        }

        const json = await res.json();
        if (json?.status === "success") setWaiters(json.data ?? []);
        else setFetchError(json?.message ?? "Failed to load waiters.");
      } catch {
        setFetchError("Network error. Check your connection.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [getAuthHeaders],
  );

  useEffect(() => {
    fetchWaiters();
  }, [fetchWaiters]);

  const handleSearchChange = (text: string) => {
    setSearch(text);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => fetchWaiters(text), 400);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchWaiters(search);
  };

  // ─── FlatList renderItem — stable reference ───────────────────────────────
  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Waiter>) => (
      <WaiterCard
        waiter={item}
        index={index}
        onPress={() => setSelectedWaiterId(item.waiterId)}
        colors={c}
      />
    ),
    [c],
  );

  const keyExtractor = useCallback((item: Waiter) => item.waiterId, []);

  // ─── Memoised styles ─────────────────────────────────────────────────────
  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: c.background }],
    [c.background],
  );
  const headerStyle = useMemo(
    () => [styles.header, { paddingTop: insets.top + 8 }],
    [insets.top],
  );
  const searchWrapperStyle = useMemo(
    () => [
      styles.searchWrapper,
      { backgroundColor: c.inputBackground, borderColor: c.border },
    ],
    [c.inputBackground, c.border],
  );
  const addBtnStyle = useMemo(
    () => [styles.addBtn, { backgroundColor: c.primary }],
    [c.primary],
  );

  return (
    <View style={containerStyle}>
      {/* Header */}
      <View style={headerStyle}>
        <Text style={[styles.pageTitle, { color: c.text }]}>Waiters</Text>
        <Pressable onPress={() => setShowAddModal(true)} style={addBtnStyle}>
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={searchWrapperStyle}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={c.textSecondary}
        />
        <TextInput
          style={[styles.searchInput, { color: c.text }]}
          placeholder="Search by mobile number..."
          placeholderTextColor={c.textSecondary + "80"}
          value={search}
          onChangeText={handleSearchChange}
          keyboardType="number-pad"
        />
        {search ? (
          <Pressable
            onPress={() => {
              setSearch("");
              fetchWaiters("");
            }}
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={18}
              color={c.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={[styles.loadingText, { color: c.textSecondary }]}>
            Loading waiters…
          </Text>
        </View>
      ) : fetchError ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="wifi-off" size={40} color={c.error} />
          <Text style={[styles.errorText, { color: c.error }]}>
            {fetchError}
          </Text>
          <Pressable
            onPress={() => fetchWaiters(search)}
            style={[styles.retryBtn, { backgroundColor: c.primary }]}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={waiters}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={c.primary}
              colors={[c.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <MaterialCommunityIcons
                name="account-multiple-outline"
                size={48}
                color={c.textSecondary}
              />
              <Text
                style={{ color: c.textSecondary, marginTop: 12, fontSize: 15 }}
              >
                No waiters found
              </Text>
            </View>
          }
        />
      )}

      <AddWaiterModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchWaiters(search);
        }}
        colors={c}
      />

      <WaiterProfileModal
        waiterId={selectedWaiterId}
        onClose={() => setSelectedWaiterId(null)}
        onDeleted={() => fetchWaiters(search)}
        colors={c}
        getAuthHeaders={getAuthHeaders}
      />
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  pageTitle: { fontSize: 24, fontWeight: "800", letterSpacing: -0.3 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 4,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 9,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: "500" },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: { fontSize: 14, fontWeight: "500" },
  errorText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginHorizontal: 24,
  },
  retryBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 4,
  },

  waiterCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  waiterAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: "700" },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  profileModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    maxHeight: "85%",
  },
  profileModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 16 },
  modalLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  modalInput: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 9,
  },
  modalError: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalBtn: {
    flex: 1,
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 13,
    justifyContent: "center",
  },
  modalBtnText: { fontSize: 14, fontWeight: "700" },
  profileRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  statsBox: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 16,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  actionBtnText: { fontSize: 14, fontWeight: "600" },
});
