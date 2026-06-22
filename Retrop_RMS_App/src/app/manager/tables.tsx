// ============================================================================
// MANAGER — TABLES SCREEN
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Pressable, ActivityIndicator, Alert,
  Modal, TextInput, Platform, Share,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ENDPOINTS } from '@/config/api';

// ============================================================================
// TYPES
// ============================================================================

interface Table {
  tableId: string;
  tableNo: number;
  capacity: number;
  isAvailable: boolean;
  currentOrder: string | null;
}

interface TableStats {
  totalTables: number;
  availableTables: number;
  occupiedTables: number;
  occupancyRate: string;
}

// ============================================================================
// TABLE CARD
// ============================================================================

function TableCard({
  table, onPress, colors,
}: { table: Table; onPress: () => void; colors: any }) {
  const isOccupied = !table.isAvailable;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tableCard,
        {
          backgroundColor: isOccupied ? colors.primary + '10' : colors.card,
          borderColor: isOccupied ? colors.primary : colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.tableNo, { color: colors.text }]}>Table {table.tableNo}</Text>
        <Text style={[styles.tableCap, { color: colors.textSecondary }]}>
          <MaterialCommunityIcons name="account-group-outline" size={13} color={colors.textSecondary} /> {table.capacity} seats
        </Text>
      </View>
      <View style={[styles.tableStatus, { backgroundColor: isOccupied ? colors.primary + '20' : colors.success + '20' }]}>
        <MaterialCommunityIcons
          name={isOccupied ? 'silverware-fork-knife' : 'check-circle-outline'}
          size={16}
          color={isOccupied ? colors.primary : colors.success}
        />
        <Text style={[styles.tableStatusText, { color: isOccupied ? colors.primary : colors.success }]}>
          {isOccupied ? 'Occupied' : 'Free'}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} style={{ marginLeft: 8 }} />
    </Pressable>
  );
}

// ============================================================================
// TABLE DETAIL MODAL
// ============================================================================

function TableDetailModal({
  tableNo, onClose, onDeleted, colors, getAuthHeaders,
}: {
  tableNo: number | null; onClose: () => void; onDeleted: () => void;
  colors: any; getAuthHeaders: () => Record<string, string>;
}) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [newCap, setNewCap] = useState('');
  const [showCapEdit, setShowCapEdit] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (tableNo == null) { setDetail(null); return; }
    setLoading(true);
    fetch(ENDPOINTS.TABLE_BY_NO(tableNo), { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((json) => { if (json?.status === 'success') setDetail(json.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tableNo]);

  const handleUpdateCapacity = async () => {
    const cap = parseInt(newCap, 10);
    if (!cap || cap < 1) { Alert.alert('Error', 'Enter a valid capacity.'); return; }
    setActionLoading(true);
    try {
      const res = await fetch(ENDPOINTS.TABLE_CAPACITY(tableNo!), {
        method: 'PATCH', headers: getAuthHeaders(),
        body: JSON.stringify({ capacity: cap }),
      });
      const json = await res.json();
      if (json?.status === 'success') {
        setDetail((d: any) => ({ ...d, capacity: cap }));
        setNewCap(''); setShowCapEdit(false);
        Alert.alert('Success', 'Capacity updated.');
      } else Alert.alert('Error', json?.message ?? 'Failed.');
    } catch { Alert.alert('Error', 'Network error.'); }
    finally { setActionLoading(false); }
  };

  const handleDelete = () => {
    if (!detail) return;
    if (!detail.isAvailable) {
      Alert.alert('Cannot Delete', 'Table has an active order.'); return;
    }
    Alert.alert('Delete Table', `Delete Table ${detail.tableNo}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          setActionLoading(true);
          try {
            const res = await fetch(ENDPOINTS.TABLE_BY_NO(detail.tableNo), {
              method: 'DELETE', headers: getAuthHeaders(),
            });
            const json = await res.json();
            if (json?.status === 'success') { onDeleted(); onClose(); }
            else Alert.alert('Error', json?.message ?? 'Failed.');
          } catch { Alert.alert('Error', 'Network error.'); }
          finally { setActionLoading(false); }
        },
      },
    ]);
  };

  if (tableNo == null) return null;

  return (
    <Modal visible={tableNo != null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Table Details</Text>
            <Pressable onPress={onClose}><MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} /></Pressable>
          </View>

          {loading ? <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 32 }} /> : detail ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Status */}
              <View style={[styles.detailRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                {[
                  { label: 'Table No', value: `#${detail.tableNo}` },
                  { label: 'Capacity', value: `${detail.capacity} seats` },
                  { label: 'Status', value: detail.isAvailable ? 'Free' : 'Occupied' },
                ].map((item) => (
                  <View key={item.label} style={{ alignItems: 'center' }}>
                    <Text style={[{ fontSize: 18, fontWeight: '800', color: colors.text }]}>{item.value}</Text>
                    <Text style={[{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }]}>{item.label}</Text>
                  </View>
                ))}
              </View>

              {/* Current Order */}
              {detail.currentOrderDetails && (
                <View style={[styles.orderBox, { backgroundColor: colors.primary + '08', borderColor: colors.primary + '30' }]}>
                  <Text style={[{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }]}>Current Order</Text>
                  <Text style={[{ color: colors.text, fontWeight: '600' }]}>
                    Waiter: {detail.currentOrderDetails.waiter?.waiterName ?? '—'}
                  </Text>
                  <Text style={[{ color: colors.textSecondary, marginTop: 4, fontSize: 13 }]}>
                    Status: {detail.currentOrderDetails.orderStatus}
                  </Text>
                  <Text numberOfLines={1} style={[{ color: colors.text, marginTop: 4, fontWeight: '700' }]}>
                    ₹{detail.currentOrderDetails.totalAmount?.toFixed(2) ?? '0'}
                  </Text>
                </View>
              )}

              {/* Actions */}
              <View style={{ gap: 10, marginTop: 8 }}>
                <Pressable
                  onPress={() => setShowCapEdit((p) => !p)}
                  style={[styles.actionBtn, { borderColor: colors.border }]}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.textSecondary} />
                  <Text style={[styles.actionBtnText, { color: colors.text }]}>Edit Capacity</Text>
                  <MaterialCommunityIcons name={showCapEdit ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
                </Pressable>
                {showCapEdit && (
                  <View style={{ gap: 8 }}>
                    <View style={[styles.inputRow, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                      <TextInput
                        style={[{ flex: 1, color: colors.text, fontSize: 15 }]}
                        value={newCap}
                        onChangeText={setNewCap}
                        placeholder={`Current: ${detail.capacity}`}
                        placeholderTextColor={colors.textSecondary + '80'}
                        keyboardType="number-pad"
                      />
                    </View>
                    <Pressable
                      onPress={handleUpdateCapacity}
                      disabled={actionLoading}
                      style={[styles.actionBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    >
                      {actionLoading
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={[styles.actionBtnText, { color: '#fff' }]}>Update Capacity</Text>}
                    </Pressable>
                  </View>
                )}
                <Pressable
                  onPress={handleDelete}
                  disabled={actionLoading || !detail.isAvailable}
                  style={[styles.actionBtn, { borderColor: colors.error, opacity: !detail.isAvailable ? 0.4 : 1 }]}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
                  <Text style={[styles.actionBtnText, { color: colors.error }]}>
                    {!detail.isAvailable ? 'Cannot delete (occupied)' : 'Delete Table'}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          ) : (
            <Text style={[{ color: colors.textSecondary, textAlign: 'center', marginVertical: 24 }]}>Failed to load details.</Text>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function TablesScreen() {
  const { getAuthHeaders } = useAuth();
  const { theme } = useTheme();
  // FIX #1: Use insets manually — no SafeAreaView wrapper
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  const [tables, setTables] = useState<Table[]>([]);
  const [stats, setStats] = useState<TableStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [selectedTableNo, setSelectedTableNo] = useState<number | null>(null);

  // Add Table
  const [showAdd, setShowAdd] = useState(false);
  const [newTableNo, setNewTableNo] = useState('');
  const [newCapacity, setNewCapacity] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const fetchAll = useCallback(async () => {
    setFetchError('');
    try {
      const [tRes, sRes] = await Promise.all([
        fetch(ENDPOINTS.TABLES, { headers: getAuthHeaders() }),
        fetch(ENDPOINTS.TABLE_STATS, { headers: getAuthHeaders() }),
      ]);
      
      // Check content-type for both responses
      const tContentType = tRes.headers.get('content-type') ?? '';
      const sContentType = sRes.headers.get('content-type') ?? '';
      
      if (!tContentType.includes('application/json') || !sContentType.includes('application/json')) {
        setFetchError('Server returned an unexpected response. Check your connection.');
        return;
      }
      
      const [tJson, sJson] = await Promise.all([tRes.json(), sRes.json()]);
      if (tJson?.status === 'success') setTables(tJson.data ?? []);
      else setFetchError(tJson?.message ?? 'Failed to load tables.');
      if (sJson?.status === 'success') setStats(sJson.data);
    } catch (error) {
      console.error('Fetch tables error:', error);
      setFetchError('Network error. Check your connection.');
    } finally {
      setIsLoading(false); setIsRefreshing(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAddTable = async () => {
    const tNo = parseInt(newTableNo, 10);
    const cap = parseInt(newCapacity, 10) || 4;
    if (!tNo || tNo < 1) { setAddError('Enter a valid table number.'); return; }
    setAddLoading(true); setAddError('');
    try {
      const res = await fetch(ENDPOINTS.TABLES, {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ tableNo: tNo, capacity: cap }),
      });

      // Guard against non-JSON responses
      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        setAddError('Server error. Please check your connection.');
        return;
      }

      const json = await res.json();
      if (json?.status === 'success') {
        setShowAdd(false); setNewTableNo(''); setNewCapacity('');
        fetchAll();
      } else setAddError(json?.message ?? 'Failed to add table.');
    } catch (error) { 
      console.error('Add table error:', error);
      setAddError('Network error.');
    }
    finally { setAddLoading(false); }
  };

  const handleExportQRDetails = () => {
    if (tables.length === 0) {
      Alert.alert('No Tables', 'There are no tables to export.');
      return;
    }

    const sortedTables = [...tables].sort((a, b) => a.tableNo - b.tableNo);
    const text = sortedTables
      .map((t) => `table ${t.tableNo}- ${t.tableId}`)
      .join('\n');

    Share.share({
      title: 'Table QR Details',
      message: text,
    }).catch((err) => {
      console.error(err);
      Alert.alert('Error', 'Failed to export table QR details.');
    });
  };

  return (
    // FIX #1: Plain View instead of SafeAreaView
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={[styles.pageTitle, { color: c.text }]}>Tables</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            onPress={handleExportQRDetails}
            style={[styles.exportBtn, { borderColor: c.border }]}
          >
            <MaterialCommunityIcons name="share-variant" size={16} color={c.textSecondary} />
            <Text style={[styles.exportBtnText, { color: c.textSecondary }]}>Export QR</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowAdd(true)}
            style={[styles.addBtn, { backgroundColor: c.primary }]}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>
      </View>

      {/* Stats Row */}
      {stats && (
        <View style={styles.statsRow}>
          {[
            { label: 'Total', value: stats.totalTables, color: c.primary },
            { label: 'Free', value: stats.availableTables, color: c.success },
            { label: 'Occupied', value: stats.occupiedTables, color: '#6366F1' },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: c.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      ) : fetchError ? (
        <View style={styles.center}>
          <Text style={[{ color: c.error, fontWeight: '600' }]}>{fetchError}</Text>
          <Pressable onPress={fetchAll} style={[styles.retryBtn, { backgroundColor: c.primary }]}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); fetchAll(); }} tintColor={c.primary} colors={[c.primary]} />}
        >
          {tables.length === 0 ? (
            <View style={styles.center}>
              <MaterialCommunityIcons name="table-furniture" size={48} color={c.textSecondary} />
              <Text style={[{ color: c.textSecondary, marginTop: 12 }]}>No tables yet. Add one!</Text>
            </View>
          ) : (
            tables.map((t, i) => (
              <Animated.View key={t.tableId} entering={FadeInDown.delay(i * 40).duration(300)}>
                <TableCard table={t} onPress={() => setSelectedTableNo(t.tableNo)} colors={c} />
              </Animated.View>
            ))
          )}
        </ScrollView>
      )}

      {/* Add Table Modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAdd(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.card, borderColor: c.border }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: c.text }]}>Add New Table</Text>
            {[
              { label: 'Table Number', value: newTableNo, setter: setNewTableNo, placeholder: 'e.g. 13' },
              { label: 'Capacity (seats)', value: newCapacity, setter: setNewCapacity, placeholder: 'e.g. 4' },
            ].map((f) => (
              <View key={f.label} style={{ marginBottom: 14 }}>
                <Text style={[styles.modalLabel, { color: c.textSecondary }]}>{f.label}</Text>
                <View style={[styles.inputRow, { backgroundColor: c.inputBackground, borderColor: c.border }]}>
                  <TextInput
                    style={[{ flex: 1, color: c.text, fontSize: 15 }]}
                    value={f.value}
                    onChangeText={f.setter}
                    placeholder={f.placeholder}
                    placeholderTextColor={c.textSecondary + '80'}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            ))}
            {addError ? <Text style={[{ color: c.error, fontSize: 13, fontWeight: '600', marginBottom: 8 }]}>{addError}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowAdd(false)} style={[styles.modalBtn, { borderColor: c.border, borderWidth: 1 }]}>
                <Text style={[{ fontWeight: '700', color: c.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleAddTable} disabled={addLoading} style={[styles.modalBtn, { backgroundColor: c.primary }]}>
                {addLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[{ fontWeight: '700', color: '#fff' }]}>Add Table</Text>}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <TableDetailModal
        tableNo={selectedTableNo}
        onClose={() => setSelectedTableNo(null)}
        onDeleted={fetchAll}
        colors={c}
        getAuthHeaders={getAuthHeaders}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // FIX #1: container replaces SafeAreaView
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
  },
  pageTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, gap: 4,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, gap: 4,
    borderWidth: 1.5,
  },
  exportBtnText: { fontWeight: '700', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 12 },
  statCard: {
    flex: 1, alignItems: 'center', borderRadius: 12,
    borderWidth: 1.5, paddingVertical: 12,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 60, gap: 12,
  },
  retryBtn: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 24 },

  tableCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1.5,
    padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  tableNo: { fontSize: 16, fontWeight: '700' },
  tableCap: { fontSize: 13, marginTop: 2 },
  tableStatus: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8, gap: 4,
  },
  tableStatusText: { fontSize: 12, fontWeight: '700' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  modalLabel: {
    fontSize: 11, fontWeight: '600',
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, borderWidth: 1.5,
    paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 9,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBtn: {
    flex: 1, alignItems: 'center', borderRadius: 10,
    paddingVertical: 13, justifyContent: 'center',
  },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderRadius: 12, borderWidth: 1.5, padding: 14, marginBottom: 14,
  },
  orderBox: {
    borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 14,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, borderWidth: 1.5,
    paddingVertical: 12, paddingHorizontal: 14, gap: 8,
  },
  actionBtnText: { fontSize: 14, fontWeight: '600' },
});