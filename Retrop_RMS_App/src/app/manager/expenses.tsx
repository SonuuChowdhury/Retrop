// ============================================================================
// MANAGER — EXPENSES SCREEN
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

interface Expense {
  expenseId: string;
  amount: number;
  category: string;
  description: string;
  paymentMode: string;
  expenseDate: string;
  admin?: {
    name: string;
  };
}

export default function ExpensesScreen() {
  const { getAuthHeaders } = useAuth();
  const { theme } = useTheme();
  const { showConfirm, showError } = useDialog();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Modal forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Ingredients');
  const [description, setDescription] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await fetch(`${ENDPOINTS.MANAGER_EXPENSES}?date=${selectedDate}`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setExpenses(json.data);
        setTotalAmount(json.meta?.totalAmount || 0);
      } else {
        showError('Error', json.message || 'Failed to fetch expenses');
      }
    } catch (err) {
      showError('Error', 'Network error fetching expenses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAuthHeaders, selectedDate]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
  };

  const handleCreateExpense = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      showError('Validation Error', 'Please enter a valid amount');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(ENDPOINTS.MANAGER_EXPENSES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          category,
          description,
          paymentMode,
          expenseDate: selectedDate,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setAmount('');
        setDescription('');
        fetchExpenses();
      } else {
        showError('Error', json.message || 'Failed to save expense');
      }
    } catch {
      showError('Error', 'Network error creating expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = (id: string, name: string) => {
    showConfirm({
      title: 'Delete Expense',
      message: `Are you sure you want to delete "${name}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(ENDPOINTS.MANAGER_EXPENSE_DELETE(id), {
            method: 'DELETE',
            headers: getAuthHeaders(),
          });
          const json = await res.json();
          if (json.success) {
            fetchExpenses();
          } else {
            showError('Error', json.message || 'Failed to delete expense');
          }
        } catch {
          showError('Error', 'Network error deleting expense');
        }
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Top Header Navigation */}
      <View style={[styles.navHeader, { borderBottomColor: c.border, paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text }]}>Expenses Ledger</Text>
        <Pressable onPress={() => setShowAddModal(true)} style={[styles.addBtn, { backgroundColor: c.primary }]}>
          <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
      >
        {/* Date Selector & Total summary */}
        <View style={[styles.summaryCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View>
            <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>TOTAL OUTFLOW ({selectedDate})</Text>
            <Text style={[styles.summaryValue, { color: c.text }]}>₹{totalAmount.toFixed(2)}</Text>
          </View>
          <View style={[styles.dateBadge, { backgroundColor: c.primary + '15' }]}>
            <MaterialCommunityIcons name="calendar" size={16} color={c.primary} />
            <Text style={[styles.dateText, { color: c.primary }]}>{selectedDate}</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 40 }} />
        ) : expenses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="cash-register" size={60} color={c.textSecondary + '40'} />
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>No cash expenses logged on this date.</Text>
          </View>
        ) : (
          expenses.map((item) => (
            <Animated.View
              key={item.expenseId}
              entering={FadeInDown.duration(300)}
              style={[styles.expenseCard, { backgroundColor: c.card, borderColor: c.border }]}
            >
              <View style={styles.cardInfo}>
                <View style={[styles.catBadge, { backgroundColor: c.primary + '10' }]}>
                  <Text style={[styles.catText, { color: c.primary }]}>{item.category}</Text>
                </View>
                <Text style={[styles.desc, { color: c.text }]}>{item.description || 'No description provided'}</Text>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaText, { color: c.textSecondary }]}>Mode: {item.paymentMode}</Text>
                  <Text style={[styles.metaText, { color: c.textSecondary }]}>By: {item.admin?.name || 'System'}</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={[styles.amount, { color: c.text }]}>₹{item.amount}</Text>
                <Pressable
                  onPress={() => handleDeleteExpense(item.expenseId, `${item.category} (₹${item.amount})`)}
                  style={styles.deleteBtn}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color={c.error} />
                </Pressable>
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: c.card }]}>
            <Text style={[styles.modalTitle, { color: c.text }]}>Log Expense</Text>

            <TextInput
              style={[styles.input, { borderColor: c.border, color: c.text }]}
              placeholder="Amount (₹) *"
              placeholderTextColor={c.textSecondary}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={[styles.label, { color: c.textSecondary }]}>Category</Text>
            <View style={styles.catGrid}>
              {['Ingredients', 'Rent', 'Utilities', 'Salaries', 'Maintenance', 'Other'].map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.catChip,
                    {
                      borderColor: category === cat ? c.primary : c.border,
                      backgroundColor: category === cat ? c.primary + '12' : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ color: category === cat ? c.primary : c.textSecondary, fontSize: 13, fontWeight: '600' }}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, { color: c.textSecondary }]}>Payment Mode</Text>
            <View style={styles.catGrid}>
              {['Cash', 'UPI', 'Card', 'Bank Transfer'].map((mode) => (
                <Pressable
                  key={mode}
                  onPress={() => setPaymentMode(mode)}
                  style={[
                    styles.catChip,
                    {
                      borderColor: paymentMode === mode ? c.primary : c.border,
                      backgroundColor: paymentMode === mode ? c.primary + '12' : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ color: paymentMode === mode ? c.primary : c.textSecondary, fontSize: 13, fontWeight: '600' }}>
                    {mode}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={[styles.input, { borderColor: c.border, color: c.text }]}
              placeholder="Description / Remarks"
              placeholderTextColor={c.textSecondary}
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowAddModal(false)}
                style={[styles.modalBtn, { borderColor: c.border, borderWidth: 1 }]}
              >
                <Text style={{ color: c.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateExpense}
                disabled={submitting}
                style={[styles.modalBtn, { backgroundColor: c.primary }]}
              >
                <Text style={{ color: '#FFF', fontWeight: '700' }}>
                  {submitting ? 'Saving...' : 'Save Expense'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  addBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20,
  },
  summaryLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  summaryValue: { fontSize: 24, fontWeight: '900', marginTop: 4 },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  dateText: { fontSize: 13, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, marginTop: 12, textAlign: 'center' },
  expenseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardInfo: { flex: 1, marginRight: 12 },
  catBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginBottom: 6,
  },
  catText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  desc: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  metaRow: { flexDirection: 'row', gap: 12 },
  metaText: { fontSize: 11, fontWeight: '500' },
  cardRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  amount: { fontSize: 16, fontWeight: '800' },
  deleteBtn: { padding: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  label: { fontSize: 12, fontWeight: '700', marginBottom: -8 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  modalBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
