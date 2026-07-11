// ============================================================================
// MANAGER — DAY CLOSE SCREEN
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Pressable, ActivityIndicator, TextInput, Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useDialog } from '@/context/DialogContext';
import { ENDPOINTS } from '@/config/api';
import { router } from 'expo-router';

interface CloseRecord {
  closeId: string;
  openingCash: number;
  cashSales: number;
  cashExpenses: number;
  expectedCash: number;
  actualCash: number;
  variance: number;
  notes: string;
  admin?: {
    name: string;
  };
}

interface DayCloseInfo {
  closeRecord: CloseRecord | null;
  isClosed: boolean;
  computed: {
    date: string;
    cashSales: number;
    cashExpenses: number;
  };
}

export default function DayCloseScreen() {
  const { getAuthHeaders } = useAuth();
  const { theme } = useTheme();
  const { showConfirm, showError } = useDialog();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  const [info, setInfo] = useState<DayCloseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Form states
  const [openingCash, setOpeningCash] = useState('0');
  const [actualCash, setActualCash] = useState('0');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDayClose = useCallback(async () => {
    try {
      const res = await fetch(`${ENDPOINTS.MANAGER_DAY_CLOSE}?date=${selectedDate}`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setInfo(json.data);
        if (json.data.closeRecord) {
          setOpeningCash(String(json.data.closeRecord.openingCash));
          setActualCash(String(json.data.closeRecord.actualCash));
          setNotes(json.data.closeRecord.notes || '');
        } else {
          setOpeningCash('0');
          setActualCash('0');
          setNotes('');
        }
      } else {
        showError('Error', json.message || 'Failed to fetch day close');
      }
    } catch {
      showError('Error', 'Network error fetching day close info');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAuthHeaders, selectedDate]);

  useEffect(() => {
    fetchDayClose();
  }, [fetchDayClose]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDayClose();
  };

  const handleCloseRegister = async () => {
    if (openingCash === '' || isNaN(parseFloat(openingCash))) {
      showError('Validation Error', 'Please enter a valid opening cash amount');
      return;
    }
    if (actualCash === '' || isNaN(parseFloat(actualCash))) {
      showError('Validation Error', 'Please enter a valid actual cash amount');
      return;
    }

    const opening = parseFloat(openingCash);
    const actual = parseFloat(actualCash);
    const sales = info?.computed?.cashSales || 0;
    const expenses = info?.computed?.cashExpenses || 0;
    const expected = opening + sales - expenses;
    const variance = actual - expected;

    showConfirm({
      title: 'Submit Register Close',
      message: `Expected Cash: ₹${expected.toFixed(2)}\nActual Counted: ₹${actual.toFixed(2)}\nDiscrepancy: ₹${variance.toFixed(2)}\n\nAre you sure you want to close the day's cash register?`,
      confirmText: 'Submit Close',
      cancelText: 'Cancel',
      destructive: Math.abs(variance) > 0,
      onConfirm: async () => {
        setSubmitting(true);
        try {
          const res = await fetch(ENDPOINTS.MANAGER_DAY_CLOSE, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
            body: JSON.stringify({
              openingCash: opening,
              actualCash: actual,
              notes,
              date: selectedDate,
            }),
          });
          const json = await res.json();
          if (json.success) {
            fetchDayClose();
          } else {
            showError('Error', json.message || 'Failed to close register');
          }
        } catch {
          showError('Error', 'Network error closing register');
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Navigation Header */}
      <View style={[styles.navHeader, { borderBottomColor: c.border, paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text }]}>EOD Cash Close</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
      >
        {/* Date view */}
        <View style={styles.dateRow}>
          <Text style={[styles.dateLabel, { color: c.textSecondary }]}>CLOSING REGISTER FOR DATE</Text>
          <View style={[styles.dateBadge, { backgroundColor: c.primary + '12' }]}>
            <MaterialCommunityIcons name="calendar-range" size={16} color={c.primary} />
            <Text style={[styles.dateText, { color: c.primary }]}>{selectedDate}</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 40 }} />
        ) : info?.isClosed ? (
          // Day Closed Details Card
          <Animated.View entering={FadeInDown.duration(340)} style={styles.closedContainer}>
            <View style={[styles.successBanner, { backgroundColor: c.success + '15', borderColor: c.success + '40' }]}>
              <MaterialCommunityIcons name="check-circle" size={24} color={c.success} />
              <Text style={[styles.successText, { color: c.success }]}>Day Register is Closed</Text>
            </View>

            <View style={[styles.detailCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLbl, { color: c.textSecondary }]}>Opening Cash</Text>
                <Text style={[styles.detailVal, { color: c.text }]}>₹{info.closeRecord?.openingCash}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLbl, { color: c.textSecondary }]}>Computed Cash Sales</Text>
                <Text style={[styles.detailVal, { color: c.text }]}>+ ₹{info.closeRecord?.cashSales}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLbl, { color: c.textSecondary }]}>Computed Cash Expenses</Text>
                <Text style={[styles.detailVal, { color: c.text }]}>- ₹{info.closeRecord?.cashExpenses}</Text>
              </View>

              <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: c.border, paddingTop: 10 }]}>
                <Text style={[styles.detailLbl, { color: c.textSecondary, fontWeight: '700' }]}>Expected Cash</Text>
                <Text style={[styles.detailVal, { color: c.text, fontWeight: '700' }]}>₹{info.closeRecord?.expectedCash}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLbl, { color: c.textSecondary, fontWeight: '700' }]}>Actual counted Cash</Text>
                <Text style={[styles.detailVal, { color: c.primary, fontWeight: '800' }]}>₹{info.closeRecord?.actualCash}</Text>
              </View>

              <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: c.border, paddingTop: 10 }]}>
                <Text style={[styles.detailLbl, { color: c.textSecondary, fontWeight: '700' }]}>Discrepancy / Variance</Text>
                <Text
                  style={[
                    styles.detailVal,
                    {
                      fontWeight: '900',
                      color: Number(info.closeRecord?.variance) !== 0 ? c.error : c.success,
                    },
                  ]}
                >
                  ₹{info.closeRecord?.variance}
                </Text>
              </View>
            </View>

            <View style={[styles.metaCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.metaLbl, { color: c.textSecondary }]}>Closed by: {info.closeRecord?.admin?.name || 'Manager'}</Text>
              {info.closeRecord?.notes && (
                <Text style={[styles.notesVal, { color: c.text }]}>Remarks: {info.closeRecord?.notes}</Text>
              )}
            </View>
          </Animated.View>
        ) : (
          // Day Open Form
          <Animated.View entering={FadeInDown.duration(340)} style={styles.formContainer}>
            <View style={[styles.computedInfo, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={styles.compRow}>
                <View>
                  <Text style={[styles.compLbl, { color: c.textSecondary }]}>TODAY'S CASH SALES</Text>
                  <Text style={[styles.compVal, { color: c.success }]}>₹{info?.computed?.cashSales || 0}</Text>
                </View>
                <View style={[styles.statIcon, { backgroundColor: c.success + '15' }]}>
                  <MaterialCommunityIcons name="arrow-up-bold" size={24} color={c.success} />
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: c.border }]} />

              <View style={styles.compRow}>
                <View>
                  <Text style={[styles.compLbl, { color: c.textSecondary }]}>TODAY'S CASH EXPENSES</Text>
                  <Text style={[styles.compVal, { color: c.error }]}>₹{info?.computed?.cashExpenses || 0}</Text>
                </View>
                <View style={[styles.statIcon, { backgroundColor: c.error + '15' }]}>
                  <MaterialCommunityIcons name="arrow-down-bold" size={24} color={c.error} />
                </View>
              </View>
            </View>

            <Text style={[styles.formLabel, { color: c.textSecondary }]}>Opening Register Balance (₹) *</Text>
            <TextInput
              style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.card }]}
              value={openingCash}
              onChangeText={setOpeningCash}
              keyboardType="decimal-pad"
              placeholder="e.g. 5000"
              placeholderTextColor={c.textSecondary}
            />

            <Text style={[styles.formLabel, { color: c.textSecondary }]}>Actual Cash in Register Drawer (₹) *</Text>
            <TextInput
              style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.card }]}
              value={actualCash}
              onChangeText={setActualCash}
              keyboardType="decimal-pad"
              placeholder="Count and enter physically present cash..."
              placeholderTextColor={c.textSecondary}
            />

            <Text style={[styles.formLabel, { color: c.textSecondary }]}>Remarks / Variance reasons</Text>
            <TextInput
              style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.card }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholder="Log discrepancy notes if actual cash doesn't match expected balance..."
              placeholderTextColor={c.textSecondary}
            />

            <Pressable
              onPress={handleCloseRegister}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submitBtn,
                {
                  backgroundColor: c.primary,
                  opacity: pressed || submitting ? 0.9 : 1,
                },
              ]}
            >
              <Text style={styles.submitText}>
                {submitting ? 'Submitting...' : 'Submit Register Closing'}
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  dateLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  dateText: { fontSize: 13, fontWeight: '700' },
  closedContainer: { gap: 16 },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
  },
  successText: { fontSize: 15, fontWeight: '800' },
  detailCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLbl: { fontSize: 13, fontWeight: '500' },
  detailVal: { fontSize: 14, fontWeight: '600' },
  metaCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  metaLbl: { fontSize: 12, fontWeight: '600' },
  notesVal: { fontSize: 13, fontWeight: '500', fontStyle: 'italic' },
  formContainer: { gap: 16 },
  computedInfo: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    marginBottom: 8,
  },
  compRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compLbl: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  compVal: { fontSize: 20, fontWeight: '900', marginTop: 4 },
  statIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  divider: { height: 1 },
  formLabel: { fontSize: 12, fontWeight: '700', marginBottom: -10 },
  input: {
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  submitBtn: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  submitText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});
