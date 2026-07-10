// ============================================================================
// MANAGER — WAITERS SCREEN  (UPDATED: delete button added)
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Pressable, ActivityIndicator, Modal, TextInput, Platform,
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

interface Waiter {
  waiterId: string;
  waiterName: string;
  mobile: string;
  isActive: boolean;
  lastLogIn?: string;
  todayOrders?: number;
  todayEarnings?: number;
}

// ============================================================================
// WAITER CARD
// ============================================================================

function WaiterCard({
  waiter, colors, onToggle, onDelete, onResetPassword, toggling, deleting,
}: {
  waiter: Waiter; colors: any;
  onToggle: () => void;
  onDelete: () => void;
  onResetPassword: () => void;
  toggling: boolean;
  deleting: boolean;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(340)}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {/* Avatar + Info */}
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + '18' }]}>
          <Text style={[styles.initials, { color: colors.primary }]}>
            {waiter.waiterName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.waiterName, { color: colors.text }]}>{waiter.waiterName}</Text>
          <Text style={[styles.mobile, { color: colors.textSecondary }]}>{waiter.mobile}</Text>
          {waiter.lastLogIn && (
            <Text style={[styles.lastLogin, { color: colors.textSecondary }]}>
              Last login: {new Date(waiter.lastLogIn).toLocaleDateString()}
            </Text>
          )}
        </View>
        {/* Active badge */}
        <View style={[styles.statusBadge, { backgroundColor: waiter.isActive ? colors.success + '18' : colors.error + '18' }]}>
          <Text style={[styles.statusText, { color: waiter.isActive ? colors.success : colors.error }]}>
            {waiter.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {/* Stats row */}
      {(waiter.todayOrders !== undefined) && (
        <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: colors.text }]}>{waiter.todayOrders ?? 0}</Text>
            <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Today's Orders</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text numberOfLines={1} style={[styles.statVal, { color: colors.text }]}>₹{waiter.todayEarnings ?? 0}</Text>
            <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Today's Revenue</Text>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {/* Toggle active/inactive */}
        <Pressable
          onPress={onToggle}
          disabled={toggling || deleting}
          style={[
            styles.actionBtn,
            {
              backgroundColor: waiter.isActive ? colors.error + '12' : colors.success + '12',
              borderColor: waiter.isActive ? colors.error + '30' : colors.success + '30',
            },
          ]}
        >
          {toggling ? (
            <ActivityIndicator size="small" color={waiter.isActive ? colors.error : colors.success} />
          ) : (
            <>
              <MaterialCommunityIcons
                name={waiter.isActive ? 'account-off-outline' : 'account-check-outline'}
                size={15}
                color={waiter.isActive ? colors.error : colors.success}
              />
              <Text style={[styles.actionBtnText, { color: waiter.isActive ? colors.error : colors.success }]}>
                {waiter.isActive ? 'Disable' : 'Enable'}
              </Text>
            </>
          )}
        </Pressable>

        {/* Reset password */}
        <Pressable
          onPress={onResetPassword}
          disabled={toggling || deleting}
          style={[styles.actionBtn, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '25' }]}
        >
          <MaterialCommunityIcons name="lock-reset" size={15} color={colors.primary} />
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>Reset PWD</Text>
        </Pressable>

        {/* DELETE */}
        <Pressable
          onPress={onDelete}
          disabled={toggling || deleting}
          style={[styles.actionBtn, { backgroundColor: colors.error + '14', borderColor: colors.error + '35' }]}
        >
          {deleting ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <>
              <MaterialCommunityIcons name="delete-outline" size={15} color={colors.error} />
              <Text style={[styles.actionBtnText, { color: colors.error }]}>Delete</Text>
            </>
          )}
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ============================================================================
// ADD WAITER MODAL
// ============================================================================

function AddWaiterModal({
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
    if (!name.trim()) { setError('Name is required.'); return; }
    if (!/^\d{10}$/.test(mobile)) { setError('Enter a valid 10-digit mobile.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(ENDPOINTS.WAITERS, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ waiterName: name.trim(), mobile, password }),
      });
      const json = await res.json();
      if (json?.status === 'success') {
        reset();
        onAdded();
        onClose();
      } else {
        setError(json?.message ?? 'Failed to add waiter.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Waiter</Text>
            <Pressable onPress={onClose}><MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} /></Pressable>
          </View>

          {(['Name', 'Mobile', 'Password'] as const).map((field) => (
            <View key={field} style={{ marginBottom: 12 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{field}</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                placeholder={field === 'Name' ? 'Waiter Name' : field === 'Mobile' ? '10-digit mobile' : 'Password (min 6 chars)'}
                placeholderTextColor={colors.textSecondary + '80'}
                value={field === 'Name' ? name : field === 'Mobile' ? mobile : password}
                onChangeText={field === 'Name' ? setName : field === 'Mobile' ? (v) => setMobile(v.replace(/\D/g, '').slice(0, 10)) : setPassword}
                keyboardType={field === 'Mobile' ? 'number-pad' : 'default'}
                secureTextEntry={field === 'Password'}
                maxLength={field === 'Mobile' ? 10 : undefined}
              />
            </View>
          ))}

          {error ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.error + '12', borderColor: colors.error + '30' }]}>
              <Text style={[{ color: colors.error, fontSize: 13 }]}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={[styles.modalBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
              <Text style={[{ color: colors.text, fontWeight: '600' }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleAdd}
              disabled={loading}
              style={[styles.modalBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            >
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Add Waiter</Text>}
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
  waiter, visible, onClose, colors, getAuthHeaders, showSuccess,
}: {
  waiter: Waiter | null; visible: boolean; onClose: () => void;
  colors: any; getAuthHeaders: () => Record<string, string>;
  showSuccess: (t: string, m?: string) => void;
}) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!waiter) return;
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(ENDPOINTS.WAITER_RESET_PASSWORD(waiter.waiterId), {
        method: 'PATCH', headers: getAuthHeaders(),
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
            Reset password for <Text style={{ fontWeight: '700', color: colors.text }}>{waiter?.waiterName}</Text>
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

export default function WaitersScreen() {
  const { getAuthHeaders } = useAuth();
  const { theme } = useTheme();
  const { showError, showSuccess, showConfirm } = useDialog();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [resetTarget, setResetTarget] = useState<Waiter | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchWaiters = useCallback(async () => {
    try {
      const res = await fetch(ENDPOINTS.WAITERS, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json?.status === 'success') {
        setWaiters(json.data ?? []);
        setError(null);
      } else {
        setError(json?.message ?? 'Failed to load waiters.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => { fetchWaiters(); }, []);

  const handleToggle = async (waiter: Waiter) => {
    setTogglingId(waiter.waiterId);
    try {
      const res = await fetch(ENDPOINTS.WAITER_STATUS(waiter.waiterId), {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive: !waiter.isActive }),
      });
      const json = await res.json();
      if (json?.status === 'success') {
        setWaiters((prev) => prev.map((w) =>
          w.waiterId === waiter.waiterId ? { ...w, isActive: !w.isActive } : w,
        ));
      } else {
        showError('Error', json?.message ?? 'Failed to update status.');
      }
    } catch {
      showError('Error', 'Network error.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = (waiter: Waiter) => {
    showConfirm({
      title: 'Delete Waiter',
      message: `Delete ${waiter.waiterName}? This will remove all their data. If they have active orders, deletion will be blocked.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
      onConfirm: async () => {
        setDeletingId(waiter.waiterId);
        try {
          const res = await fetch(ENDPOINTS.WAITER_BY_ID(waiter.waiterId), {
            method: 'DELETE',
            headers: getAuthHeaders(),
          });
          const json = await res.json();
          if (json?.status === 'success') {
            setWaiters((prev) => prev.filter((w) => w.waiterId !== waiter.waiterId));
          } else {
            showError('Cannot Delete', json?.message ?? 'Deletion failed.');
          }
        } catch {
          showError('Error', 'Network error.');
        } finally {
          setDeletingId(null);
        }
      },
    });
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
          <Text style={[styles.title, { color: c.text }]}>Waiters</Text>
        </View>
        <Pressable
          onPress={() => setShowAddModal(true)}
          style={[styles.addBtn, { backgroundColor: c.primary }]}
        >
          <MaterialCommunityIcons name="plus" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchWaiters(); }} tintColor={c.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: c.error + '12', borderColor: c.error + '30' }]}>
            <Text style={[{ color: c.error, flex: 1, fontSize: 13 }]}>{error}</Text>
            <Pressable onPress={fetchWaiters}><Text style={[{ color: c.primary, fontWeight: '700' }]}>Retry</Text></Pressable>
          </View>
        )}

        {waiters.length === 0 && !error ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-group-outline" size={48} color={c.textSecondary} />
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>No waiters yet. Add your first waiter.</Text>
          </View>
        ) : (
          waiters.map((w) => (
            <WaiterCard
              key={w.waiterId}
              waiter={w}
              colors={c}
              onToggle={() => handleToggle(w)}
              onDelete={() => handleDelete(w)}
              onResetPassword={() => setResetTarget(w)}
              toggling={togglingId === w.waiterId}
              deleting={deletingId === w.waiterId}
            />
          ))
        )}
      </ScrollView>

      <AddWaiterModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={fetchWaiters}
        colors={c}
        getAuthHeaders={getAuthHeaders}
      />

      <ResetPasswordModal
        waiter={resetTarget}
        visible={!!resetTarget}
        onClose={() => setResetTarget(null)}
        colors={c}
        getAuthHeaders={getAuthHeaders}
        showSuccess={showSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },

  card: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  initials: { fontSize: 16, fontWeight: '800' },
  waiterName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  mobile: { fontSize: 13, fontWeight: '500' },
  lastLogin: { fontSize: 11, marginTop: 2 },
  statusBadge: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLbl: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  statDivider: { width: 1 },

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
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '500', textAlign: 'center' },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  textInput: {
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    fontSize: 15,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalBtn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 13,
    justifyContent: 'center',
  },
});
