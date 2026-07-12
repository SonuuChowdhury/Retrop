import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable,
  ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useWaiterAuth } from '@/context/WaiterAuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ENDPOINTS } from '@/config/api';
import { apiCall } from '@/utils/apiClient';

interface MenuItem {
  dishId: string;
  dishName: string;
  price: number;
  category: string;
  isAvailable: boolean;
  description?: string;
}

interface Table {
  tableId: string;
  tableNo: number;
  capacity: number;
  isAvailable: boolean;
}

export default function CreateOrderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { accessToken, refreshToken, handleDisabled } = useWaiterAuth();
  const c = theme.colors;

  // Wizard state
  const [step, setStep] = useState(1);

  // Step 1: Customer details & Table
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [selectedTableNo, setSelectedTableNo] = useState<number | null>(null);
  
  // Available tables
  const [tables, setTables] = useState<Table[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  // Step 2: Menu browser
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart state: map dishId -> { item, quantity, remarks }
  const [cart, setCart] = useState<Record<string, { item: MenuItem; quantity: number; remarks: string }>>({});

  // Submission/Error
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available tables on mount (Step 1)
  useEffect(() => {
    fetchAvailableTables();
  }, []);

  // Fetch available tables
  const fetchAvailableTables = async () => {
    setLoadingTables(true);
    setError(null);
    try {
      const res = await apiCall(
        ENDPOINTS.WAITER_TABLES,
        { method: 'GET' },
        async () => accessToken,
        refreshToken,
        handleDisabled
      );
      if (res.success && Array.isArray(res.data)) {
        setTables(res.data);
      } else {
        setError(res.message || 'Failed to load available tables');
      }
    } catch (err) {
      setError('Network error loading tables');
    } finally {
      setLoadingTables(false);
    }
  };

  // Fetch menu (Step 2)
  const fetchMenu = async () => {
    setLoadingMenu(true);
    setError(null);
    try {
      const res = await apiCall(
        ENDPOINTS.WAITER_MENU,
        { method: 'GET' },
        async () => accessToken,
        refreshToken,
        handleDisabled
      );
      if (res.success && Array.isArray(res.data)) {
        setMenuItems(res.data);
      } else {
        setError(res.message || 'Failed to load menu');
      }
    } catch (err) {
      setError('Network error loading menu');
    } finally {
      setLoadingMenu(false);
    }
  };

  // Step 1 Validation
  const handleProceedToMenu = () => {
    if (!customerName.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!/^\d{10}$/.test(customerMobile.replace(/\D/g, ''))) {
      setError('Valid 10-digit mobile number is required');
      return;
    }
    if (!selectedTableNo) {
      setError('Please select a dining table');
      return;
    }
    setError(null);
    setStep(2);
    if (menuItems.length === 0) {
      fetchMenu();
    }
  };

  // Cart operations
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev[item.dishId];
      return {
        ...prev,
        [item.dishId]: {
          item,
          quantity: (existing?.quantity || 0) + 1,
          remarks: existing?.remarks || '',
        },
      };
    });
  };

  const removeFromCart = (dishId: string) => {
    setCart((prev) => {
      const existing = prev[dishId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[dishId];
        return next;
      }
      return {
        ...prev,
        [dishId]: {
          ...existing,
          quantity: existing.quantity - 1,
        },
      };
    });
  };

  const updateRemarks = (dishId: string, remarks: string) => {
    setCart((prev) => {
      const existing = prev[dishId];
      if (!existing) return prev;
      return {
        ...prev,
        [dishId]: {
          ...existing,
          remarks,
        },
      };
    });
  };

  // Place manual order
  const handlePlaceOrder = async () => {
    const itemsArray = Object.values(cart).map((i) => ({
      dishId: i.item.dishId,
      quantity: i.quantity,
      remarks: i.remarks.trim() || null,
    }));

    if (itemsArray.length === 0) {
      setError('Cart is empty. Please select at least one item');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await apiCall(
        ENDPOINTS.WAITER_CREATE_MANUAL_ORDER,
        {
          method: 'POST',
          body: JSON.stringify({
            tableNo: selectedTableNo,
            customerName: customerName.trim(),
            customerMobile: customerMobile.trim(),
            items: itemsArray,
          }),
        },
        async () => accessToken,
        refreshToken,
        handleDisabled
      );

      if (res.success && res.data?.orderId) {
        router.replace(`/waiter/order-detail?orderId=${res.data.orderId}` as any);
      } else {
        setError(res.message || 'Failed to place manual order');
      }
    } catch (err) {
      setError('Network error placing order');
    } finally {
      setSubmitting(false);
    }
  };

  const cartTotal = Object.values(cart).reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const cartCount = Object.values(cart).reduce((sum, c) => sum + c.quantity, 0);

  const categories = ['All', ...new Set(menuItems.map((item) => item.category))];
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.dishName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: c.background }}
    >
      {/* Top Navbar */}
      <View style={[styles.navbar, { paddingTop: insets.top + 8, backgroundColor: c.card, borderBottomColor: c.border }]}>
        <View style={styles.navRow}>
          <Pressable onPress={() => {
            if (step > 1) {
              setStep(step - 1);
            } else {
              router.back();
            }
          }} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={c.text} />
          </Pressable>
          <Text style={[styles.navTitle, { color: c.text }]}>
            {step === 1 && 'Customer & Table'}
            {step === 2 && 'Browse Menu'}
            {step === 3 && 'Review & Place'}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 80 }}
        keyboardShouldPersistTaps="handled"
      >
        {error && (
          <View style={[styles.errorBox, { backgroundColor: c.error + '12', borderColor: c.error }]}>
            <Text style={{ color: c.error, fontWeight: '600', fontSize: 13 }}>{error}</Text>
          </View>
        )}

        {/* STEP 1: CUSTOMER DETAILS & TABLE SELECTION */}
        {step === 1 && (
          <Animated.View entering={FadeInDown.duration(200)}>
            <Text style={[styles.sectionHeading, { color: c.text }]}>Customer Details</Text>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Customer Name *</Text>
              <TextInput
                value={customerName}
                onChangeText={setCustomerName}
                style={[styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.text }]}
                placeholder="e.g. John Doe"
                placeholderTextColor={c.textSecondary + '70'}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Customer Mobile *</Text>
              <TextInput
                value={customerMobile}
                onChangeText={setCustomerMobile}
                keyboardType="phone-pad"
                maxLength={10}
                style={[styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.text }]}
                placeholder="e.g. 9876543210"
                placeholderTextColor={c.textSecondary + '70'}
              />
            </View>

            <Text style={[styles.sectionHeading, { color: c.text, marginTop: 14 }]}>Select Dining Table</Text>
            {loadingTables ? (
              <ActivityIndicator size="small" color={c.primary} style={{ marginVertical: 20 }} />
            ) : tables.length === 0 ? (
              <Text style={{ color: c.textSecondary, fontSize: 13, marginVertical: 10 }}>No tables available right now.</Text>
            ) : (
              <View style={styles.tableGrid}>
                {tables.map((t) => (
                  <Pressable
                    key={t.tableId}
                    onPress={() => setSelectedTableNo(t.tableNo)}
                    style={[
                      styles.tableCard,
                      {
                        backgroundColor: selectedTableNo === t.tableNo ? c.primary : c.card,
                        borderColor: selectedTableNo === t.tableNo ? c.primary : c.border,
                      }
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="table-chair"
                      size={20}
                      color={selectedTableNo === t.tableNo ? '#FFFFFF' : c.textSecondary}
                    />
                    <Text style={[styles.tableNo, { color: selectedTableNo === t.tableNo ? '#FFFFFF' : c.text }]}>
                      T{t.tableNo}
                    </Text>
                    <Text style={[styles.tableCapacity, { color: selectedTableNo === t.tableNo ? '#FFFFFF' : c.textSecondary }]}>
                      {t.capacity} pax
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {/* STEP 2: BROWSE MENU & ADD ITEMS */}
        {step === 2 && (
          <Animated.View entering={FadeIn.duration(200)}>
            <View style={[styles.searchBox, { backgroundColor: c.card, borderColor: c.border }]}>
              <MaterialCommunityIcons name="magnify" size={20} color={c.textSecondary} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search dishes..."
                placeholderTextColor={c.textSecondary + '70'}
                style={[styles.searchInput, { color: c.text }]}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {categories.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor: activeCategory === cat ? c.primary : c.card,
                      borderColor: activeCategory === cat ? c.primary : c.border,
                    }
                  ]}
                >
                  <Text style={{ color: activeCategory === cat ? '#FFFFFF' : c.text, fontWeight: '700' }}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {loadingMenu ? (
              <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 40 }} />
            ) : filteredMenuItems.length === 0 ? (
              <Text style={{ color: c.textSecondary, textAlign: 'center', marginTop: 40 }}>No dishes found.</Text>
            ) : (
              <View style={{ gap: 10 }}>
                {filteredMenuItems.map((item) => {
                  const cartItem = cart[item.dishId];
                  return (
                    <View key={item.dishId} style={[styles.dishCard, { backgroundColor: c.card, borderColor: c.border }]}>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={[styles.dishName, { color: c.text }]}>{item.dishName}</Text>
                        <Text style={[styles.dishPrice, { color: c.primary }]}>₹{item.price.toFixed(2)}</Text>
                        <Text style={[styles.dishCategory, { color: c.textSecondary }]}>{item.category}</Text>
                      </View>
                      
                      {cartItem ? (
                        <View style={styles.qtyRow}>
                          <Pressable onPress={() => removeFromCart(item.dishId)} style={[styles.qtyBtn, { backgroundColor: c.background }]}>
                            <MaterialCommunityIcons name="minus" size={16} color={c.primary} />
                          </Pressable>
                          <Text style={[styles.qtyText, { color: c.text }]}>{cartItem.quantity}</Text>
                          <Pressable onPress={() => addToCart(item)} style={[styles.qtyBtn, { backgroundColor: c.background }]}>
                            <MaterialCommunityIcons name="plus" size={16} color={c.primary} />
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable onPress={() => addToCart(item)} style={[styles.addBtn, { backgroundColor: c.primary }]}>
                          <Text style={styles.addBtnText}>ADD</Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </Animated.View>
        )}

        {/* STEP 3: REVIEW & PLACE ORDER */}
        {step === 3 && (
          <Animated.View entering={FadeIn.duration(200)}>
            <Text style={[styles.sectionHeading, { color: c.text }]}>Selected Dishes</Text>
            <View style={{ gap: 12 }}>
              {Object.values(cart).map(({ item, quantity, remarks }) => (
                <View key={item.dishId} style={[styles.reviewCard, { backgroundColor: c.card, borderColor: c.border }]}>
                  <View style={styles.reviewHeader}>
                    <Text style={[styles.reviewDishName, { color: c.text }]}>{item.dishName}</Text>
                    <Text style={[styles.reviewDishPrice, { color: c.primary }]}>
                      ₹{(item.price * quantity).toFixed(2)} ({quantity} x ₹{item.price})
                    </Text>
                  </View>
                  
                  <View style={[styles.remarksInputContainer, { backgroundColor: c.background, borderColor: c.border }]}>
                    <MaterialCommunityIcons name="pencil-outline" size={14} color={c.textSecondary} />
                    <TextInput
                      value={remarks}
                      onChangeText={(txt) => updateRemarks(item.dishId, txt)}
                      placeholder="Add customization remarks (e.g. no onion)"
                      placeholderTextColor={c.textSecondary + '70'}
                      style={[styles.remarksInput, { color: c.text }]}
                    />
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.billSummaryBox, { backgroundColor: c.card, borderColor: c.border, marginTop: 20 }]}>
              <Text style={[styles.billHeading, { color: c.text }]}>Order Details</Text>
              <View style={styles.billRow}>
                <Text style={{ color: c.textSecondary }}>Customer</Text>
                <Text style={{ color: c.text, fontWeight: '600' }}>{customerName}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={{ color: c.textSecondary }}>Mobile</Text>
                <Text style={{ color: c.text, fontWeight: '600' }}>{customerMobile}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={{ color: c.textSecondary }}>Dining Table</Text>
                <Text style={{ color: c.text, fontWeight: '600' }}>Table {selectedTableNo}</Text>
              </View>
              <View style={[styles.billSeparator, { backgroundColor: c.border }]} />
              <View style={styles.billRow}>
                <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>Total Amount</Text>
                <Text style={{ color: c.primary, fontWeight: '800', fontSize: 16 }}>₹{cartTotal.toFixed(2)}</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Persistent Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 12, backgroundColor: c.card, borderTopColor: c.border }]}>
        {step === 1 && (
          <Pressable
            onPress={handleProceedToMenu}
            style={[styles.actionBtn, { backgroundColor: c.primary }]}
          >
            <Text style={styles.actionBtnText}>Select Menu Items</Text>
          </Pressable>
        )}

        {step === 2 && (
          <View style={styles.step2Footer}>
            <View>
              <Text style={[styles.footerCartCount, { color: c.textSecondary }]}>{cartCount} items</Text>
              <Text style={[styles.footerCartTotal, { color: c.text }]}>₹{cartTotal.toFixed(2)}</Text>
            </View>
            <Pressable
              onPress={() => {
                if (cartCount === 0) {
                  setError('Please add at least 1 item to the cart');
                  return;
                }
                setError(null);
                setStep(3);
              }}
              style={[styles.reviewBtn, { backgroundColor: c.primary }]}
            >
              <Text style={styles.reviewBtnText}>Review Order</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        )}

        {step === 3 && (
          <Pressable
            onPress={handlePlaceOrder}
            disabled={submitting}
            style={[styles.actionBtn, { backgroundColor: c.primary, opacity: submitting ? 0.7 : 1 }]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.actionBtnText}>Place Manual Order (₹{cartTotal.toFixed(2)})</Text>
            )}
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  navbar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 4,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  errorBox: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
  },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tableCard: {
    width: '30%',
    aspectRatio: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tableNo: {
    fontSize: 16,
    fontWeight: '800',
  },
  tableCapacity: {
    fontSize: 11,
    fontWeight: '500',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  categoryPill: {
    borderWidth: 1.5,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
  },
  dishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  dishName: {
    fontSize: 15,
    fontWeight: '700',
  },
  dishPrice: {
    fontSize: 14,
    fontWeight: '800',
  },
  dishCategory: {
    fontSize: 11,
    fontWeight: '500',
  },
  addBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 15,
    fontWeight: '800',
    minWidth: 16,
    textAlign: 'center',
  },
  reviewCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewDishName: {
    fontSize: 15,
    fontWeight: '700',
  },
  reviewDishPrice: {
    fontSize: 13,
    fontWeight: '600',
  },
  remarksInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
  },
  remarksInput: {
    flex: 1,
    fontSize: 12,
    padding: 0,
  },
  billSummaryBox: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  billHeading: {
    fontSize: 15,
    fontWeight: '800',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billSeparator: {
    height: 1,
    marginVertical: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  step2Footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerCartCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  footerCartTotal: {
    fontSize: 18,
    fontWeight: '800',
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  reviewBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
