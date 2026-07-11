// ============================================================================
// MANAGER — KITCHEN ACCOUNTS SCREEN  (NEW)
// ============================================================================
// List, add, toggle, and delete kitchen accounts.
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Pressable, ActivityIndicator, Modal, TextInput, Platform, Switch,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useDialog } from '@/context/DialogContext';
import { ENDPOINTS } from '@/config/api';
import { router } from 'expo-router';

// ============================================================================
// TYPES
// ============================================================================

interface KitchenAccount {
  kitchenId: string;
  kitchenName: string;
  mobile: string;
  isActive: boolean;
  lastLogIn?: string;
}

// ============================================================================
// KITCHEN CARD
// ============================================================================

function KitchenCard({
  account, colors, onToggle, onResetPassword, toggling,
}: {
  account: KitchenAccount; colors: any;
  onToggle: () => void; onResetPassword: () => void;
  toggling: boolean;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(340)}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {/* Top Info */}
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + '18' }]}>
          <Text style={[styles.initials, { color: colors.primary }]}>
            {account.kitchenName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.accountName, { color: colors.text }]}>{account.kitchenName}</Text>
          <Text style={[styles.mobile, { color: colors.textSecondary }]}>{account.mobile}</Text>
          {account.lastLogIn && (
            <Text style={[styles.lastLogin, { color: colors.textSecondary }]}>
              Last login: {new Date(account.lastLogIn).toLocaleDateString()}
            </Text>
          )}
        </View>
        {/* Active badge */}
        <View style={[styles.statusBadge, { backgroundColor: account.isActive ? colors.success + '18' : colors.error + '18' }]}>
          <Text style={[styles.statusText, { color: account.isActive ? colors.success : colors.error }]}>
            {account.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {/* Toggle active/inactive */}
        <Pressable
          onPress={onToggle}
          disabled={toggling}
          style={[
            styles.actionBtn,
            {
              backgroundColor: account.isActive ? colors.error + '12' : colors.success + '12',
              borderColor: account.isActive ? colors.error + '30' : colors.success + '30',
            },
          ]}
        >
          {toggling ? (
            <ActivityIndicator size="small" color={account.isActive ? colors.error : colors.success} />
          ) : (
            <>
              <MaterialCommunityIcons
                name={account.isActive ? 'account-off-outline' : 'account-check-outline'}
                size={15}
                color={account.isActive ? colors.error : colors.success}
              />
              <Text style={[styles.actionBtnText, { color: account.isActive ? colors.error : colors.success }]}>
                {account.isActive ? 'Disable' : 'Enable'}
              </Text>
            </>
          )}
        </Pressable>

        {/* Reset password */}
        <Pressable
          onPress={onResetPassword}
          disabled={toggling}
          style={[styles.actionBtn, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '25' }]}
        >
          <MaterialCommunityIcons name="lock-reset" size={15} color={colors.primary} />
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>Reset PWD</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ============================================================================
// ADD KITCHEN MODAL
// ============================================================================

function AddKitchenModal({
  visible, onClose, onAdded, colors, getAuthHeaders,
}: {
  visible: boolean; onClose: () => void; onAdded: () => void;
  colors: any; getAuthHeaders: () => Record<string, string>;
}) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => { setName(''); setMobile(''); setPassword(''); setError(''); };

  const handleAdd = async () => {
    if (!name.trim()) { setError('Kitchen name is required.'); return; }
    if (!/^\d{10}$/.test(mobile)) { setError('Enter a valid 10-digit mobile.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true); setError('');
    try {
      const res = await fetch(ENDPOINTS.MANAGER_KITCHEN_ADD, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ kitchenName: name.trim(), mobile, password }),
      });
      const json = await res.json();
      if (json?.status === 'success') {
        reset(); onAdded(); onClose();
      } else {
        setError(json?.message ?? 'Failed to add kitchen account.');
      }
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Kitchen Account</Text>
            <Pressable onPress={onClose}><MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} /></Pressable>
          </View>

          {[
            { key: 'name', label: 'Kitchen Name', value: name, setter: setName, keyboard: 'default', secure: false },
            { key: 'mobile', label: 'Mobile', value: mobile, setter: (v: string) => setMobile(v.replace(/\D/g, '').slice(0, 10)), keyboard: 'number-pad', secure: false },
            { key: 'password', label: 'Password', value: password, setter: setPassword, keyboard: 'default', secure: true },
          ].map((field) => (
            <View key={field.key} style={{ marginBottom: 12 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{field.label}</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                value={field.value}
                onChangeText={field.setter as any}
                keyboardType={field.keyboard as any}
                secureTextEntry={field.secure}
                placeholder={field.label}
                placeholderTextColor={colors.textSecondary + '80'}
                maxLength={field.key === 'mobile' ? 10 : undefined}
              />
            </View>
          ))}

          {error ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.error + '12', borderColor: colors.error + '30' }]}>
              <Text style={{ color: colors.error, fontSize: 13 }}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={[styles.modalBtn, { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleAdd} disabled={loading} style={[styles.modalBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}>
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Add Kitchen</Text>}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ============================================================================
// RESET PASSWORD MODAL
// ============================================================================

function ResetPasswordModal({
  visible, onClose, account, colors, getAuthHeaders,
}: {
  visible: boolean; onClose: () => void; account: KitchenAccount | null;
  colors: any; getAuthHeaders: () => Record<string, string>;
}) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showSuccess } = useDialog();

  const handleReset = async () => {
    if (!account) return;
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true); setError('');
    try {
      const res = await fetch(ENDPOINTS.MANAGER_KITCHEN_RESET_PASSWORD(account.kitchenId), {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ newPassword: password }),
      });
      const json = await res.json();
      if (json?.status === 'success') {
        showSuccess('Success', 'Password reset successfully.');
        setPassword(''); onClose();
      } else {
        setError(json?.message ?? 'Failed to reset password.');
      }
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Reset Password</Text>
            <Pressable onPress={onClose}><MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} /></Pressable>
          </View>
          <Text style={[{ color: colors.textSecondary, marginBottom: 14, fontSize: 14 }]}>
            Reset password for kitchen account: <Text style={{ fontWeight: '700', color: colors.text }}>{account?.kitchenName}</Text>
          </Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>New Password</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
            placeholder="New password (min 6 chars)"
            placeholderTextColor={colors.textSecondary + '80'}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {error ? <Text style={[{ color: colors.error, fontSize: 13, marginTop: 6 }]}>{error}</Text> : null}
          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={[styles.modalBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
              <Text style={[{ color: colors.text, fontWeight: '600' }]}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleReset} disabled={loading} style={[styles.modalBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}>
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Reset</Text>}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function KitchenManagementScreen() {
  const { getAuthHeaders } = useAuth();
  const { theme } = useTheme();
  const { showError } = useDialog();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  const [accounts, setAccounts] = useState<KitchenAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<KitchenAccount | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch(ENDPOINTS.MANAGER_KITCHEN_LIST, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json?.status === 'success') {
        setAccounts(json.data ?? []);
        setError(null);
      } else {
        setError(json?.message ?? 'Failed to load kitchen accounts.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => { fetchAccounts(); }, []);

  const handleToggle = async (account: KitchenAccount) => {
    setTogglingId(account.kitchenId);
    try {
      const res = await fetch(ENDPOINTS.MANAGER_KITCHEN_STATUS(account.kitchenId), {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive: !account.isActive }),
      });
      const json = await res.json();
      if (json?.status === 'success') {
        setAccounts((prev) => prev.map((a) =>
          a.kitchenId === account.kitchenId ? { ...a, isActive: !a.isActive } : a,
        ));
      } else {
        showError('Error', json?.message ?? 'Failed to update status.');
      }
    } catch { showError('Error', 'Network error.'); }
    finally { setTogglingId(null); };
  };

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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable onPress={() => router.back()} style={{ marginRight: 4 }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={c.text} />
          </Pressable>
          <View>
            <Text style={[styles.title, { color: c.text }]}>Kitchen</Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>Manage kitchen accounts</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAccounts(); }} tintColor={c.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: c.error + '12', borderColor: c.error + '30' }]}>
            <Text style={{ color: c.error, flex: 1, fontSize: 13 }}>{error}</Text>
            <Pressable onPress={fetchAccounts}><Text style={{ color: c.primary, fontWeight: '700' }}>Retry</Text></Pressable>
          </View>
        )}

        {accounts.length === 0 && !error ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="chef-hat" size={48} color={c.textSecondary} />
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>No kitchen accounts yet.</Text>
          </View>
        ) : (
          accounts.map((a) => (
            <KitchenCard
              key={a.kitchenId}
              account={a}
              colors={c}
              onToggle={() => handleToggle(a)}
              onResetPassword={() => setResetTarget(a)}
              toggling={togglingId === a.kitchenId}
            />
          ))
        )}
      </ScrollView>

      <ResetPasswordModal
        visible={!!resetTarget}
        onClose={() => setResetTarget(null)}
        account={resetTarget}
        colors={c}
        getAuthHeaders={getAuthHeaders}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },

  card: { borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  initials: { fontSize: 16, fontWeight: '800' },
  accountName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  mobile: { fontSize: 13, fontWeight: '500' },
  lastLogin: { fontSize: 11, marginTop: 2 },
  statusBadge: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },

  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    borderWidth: 1, padding: 12, marginBottom: 12, gap: 8,
  },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '500', textAlign: 'center' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, padding: 20, paddingBottom: 36 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  textInput: { borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 9, fontSize: 15 },
  errorBannerInline: {},
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalBtn: { flex: 1, alignItems: 'center', borderRadius: 12, paddingVertical: 13, justifyContent: 'center' },
});
