// ============================================================================
// MANAGER — RESTAURANT INFO SCREEN  (NEW)
// ============================================================================
// Edit restaurant name, address, mobile, GST toggle, GSTIN, and dynamic taxes.
// GET /api/manager/restaurant-info
// PUT /api/manager/restaurant-info
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Alert, TextInput, Platform, Switch,
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

interface TaxEntry {
  name: string;
  percent: string; // keep as string for input
}

interface RestaurantInfoForm {
  restaurantName: string;
  address: string;
  mobile: string;
  isGST: boolean;
  GSTIN: string;
  taxes: TaxEntry[];
}

const EMPTY_FORM: RestaurantInfoForm = {
  restaurantName: '',
  address: '',
  mobile: '',
  isGST: false,
  GSTIN: '',
  taxes: [],
};

// ============================================================================
// SCREEN
// ============================================================================

export default function RestaurantInfoScreen() {
  const { getAuthHeaders } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  const [form, setForm] = useState<RestaurantInfoForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchInfo = useCallback(async () => {
    try {
      const res = await fetch(ENDPOINTS.MANAGER_RESTAURANT_INFO, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json?.status === 'success' && json.data) {
        const d = json.data;
        setForm({
          restaurantName: d.restaurantName ?? '',
          address: d.address ?? '',
          mobile: d.mobile ?? '',
          isGST: d.isGST ?? false,
          GSTIN: d.GSTIN ?? '',
          taxes: (d.taxes ?? []).map((t: any) => ({
            name: t.name ?? '',
            percent: String(t.percent ?? ''),
          })),
        });
        setError(null);
      } else {
        setError(json?.message ?? 'Failed to load restaurant info.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => { fetchInfo(); }, []);

  // ── Tax helpers ───────────────────────────────────────────────────────────
  const addTax = () => {
    setForm((prev) => ({ ...prev, taxes: [...prev.taxes, { name: '', percent: '' }] }));
  };

  const removeTax = (idx: number) => {
    setForm((prev) => ({ ...prev, taxes: prev.taxes.filter((_, i) => i !== idx) }));
  };

  const updateTax = (idx: number, field: 'name' | 'percent', value: string) => {
    setForm((prev) => {
      const taxes = [...prev.taxes];
      taxes[idx] = { ...taxes[idx], [field]: value };
      return { ...prev, taxes };
    });
  };

  // ── Validate & Save ───────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaveError(null);

    if (!form.restaurantName.trim()) {
      setSaveError('Restaurant name is required.');
      return;
    }

    if (form.isGST && !form.GSTIN.trim()) {
      setSaveError('GSTIN is required when GST is enabled.');
      return;
    }

    for (const tax of form.taxes) {
      if (!tax.name.trim()) { setSaveError('Each tax must have a name.'); return; }
      const pct = parseFloat(tax.percent);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        setSaveError(`Tax "${tax.name}" has an invalid percent (0–100).`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        restaurantName: form.restaurantName.trim(),
        address: form.address.trim() || null,
        mobile: form.mobile.trim() || null,
        isGST: form.isGST,
        GSTIN: form.isGST ? form.GSTIN.trim() : null,
        taxes: form.taxes.map((t) => ({ name: t.name.trim(), percent: parseFloat(t.percent) })),
      };

      const res = await fetch(ENDPOINTS.MANAGER_RESTAURANT_INFO, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json?.status === 'success') {
        Alert.alert('Saved', 'Restaurant info updated successfully.');
      } else {
        setSaveError(json?.message ?? 'Failed to save.');
      }
    } catch {
      setSaveError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
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
        <View>
          <Text style={[styles.title, { color: c.text }]}>Restaurant Info</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>Edit your restaurant details</Text>
        </View>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveBtn, { backgroundColor: c.primary, opacity: saving ? 0.7 : 1 }]}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <>
                <MaterialCommunityIcons name="content-save-outline" size={16} color="#fff" />
                <Text style={styles.saveBtnText}>Save</Text>
              </>
          }
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Fetch error */}
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: c.error + '12', borderColor: c.error + '30' }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={15} color={c.error} />
            <Text style={[{ color: c.error, flex: 1, fontSize: 13 }]}>{error}</Text>
            <Pressable onPress={fetchInfo}><Text style={{ color: c.primary, fontWeight: '700' }}>Retry</Text></Pressable>
          </View>
        )}

        {/* Save error */}
        {saveError && (
          <View style={[styles.errorBanner, { backgroundColor: c.error + '12', borderColor: c.error + '30' }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={15} color={c.error} />
            <Text style={[{ color: c.error, flex: 1, fontSize: 13 }]}>{saveError}</Text>
          </View>
        )}

        {/* ── Basic Info Section ─────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(60).duration(350)}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Basic Information</Text>
          <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
            {/* Restaurant Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Restaurant Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: c.inputBackground, borderColor: c.border, color: c.text }]}
                value={form.restaurantName}
                onChangeText={(v) => setForm((p) => ({ ...p, restaurantName: v }))}
                placeholder="e.g. The Grand Kitchen"
                placeholderTextColor={c.textSecondary + '80'}
              />
            </View>

            {/* Address */}
            <View style={[styles.fieldGroup, { marginTop: 14 }]}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Address</Text>
              <TextInput
                style={[styles.input, styles.multiline, { backgroundColor: c.inputBackground, borderColor: c.border, color: c.text }]}
                value={form.address}
                onChangeText={(v) => setForm((p) => ({ ...p, address: v }))}
                placeholder="Full address"
                placeholderTextColor={c.textSecondary + '80'}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Mobile */}
            <View style={[styles.fieldGroup, { marginTop: 14 }]}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Contact Mobile</Text>
              <TextInput
                style={[styles.input, { backgroundColor: c.inputBackground, borderColor: c.border, color: c.text }]}
                value={form.mobile}
                onChangeText={(v) => setForm((p) => ({ ...p, mobile: v.replace(/\D/g, '').slice(0, 10) }))}
                placeholder="10-digit mobile number"
                placeholderTextColor={c.textSecondary + '80'}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
          </View>
        </Animated.View>

        {/* ── GST Section ────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(120).duration(350)}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>GST Settings</Text>
          <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.toggleRow}>
              <View>
                <Text style={[styles.toggleLabel, { color: c.text }]}>GST Enabled</Text>
                <Text style={[styles.toggleHint, { color: c.textSecondary }]}>
                  Enable to collect GST on orders
                </Text>
              </View>
              <Switch
                value={form.isGST}
                onValueChange={(v) => setForm((p) => ({ ...p, isGST: v }))}
                trackColor={{ false: c.border, true: c.primary + '60' }}
                thumbColor={form.isGST ? c.primary : c.textSecondary}
              />
            </View>

            {form.isGST && (
              <View style={[styles.fieldGroup, { marginTop: 14 }]}>
                <Text style={[styles.label, { color: c.textSecondary }]}>GSTIN *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.inputBackground, borderColor: c.border, color: c.text }]}
                  value={form.GSTIN}
                  onChangeText={(v) => setForm((p) => ({ ...p, GSTIN: v.toUpperCase() }))}
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  placeholderTextColor={c.textSecondary + '80'}
                  autoCapitalize="characters"
                  maxLength={15}
                />
              </View>
            )}
          </View>
        </Animated.View>

        {/* ── Taxes Section ──────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(180).duration(350)}>
          <View style={styles.taxHeader}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Taxes</Text>
            <Pressable
              onPress={addTax}
              style={[styles.addTaxBtn, { backgroundColor: c.primary + '15', borderColor: c.primary + '30' }]}
            >
              <MaterialCommunityIcons name="plus" size={14} color={c.primary} />
              <Text style={[styles.addTaxBtnText, { color: c.primary }]}>Add Tax</Text>
            </Pressable>
          </View>

          {form.taxes.length === 0 ? (
            <View style={[styles.emptyTaxes, { backgroundColor: c.card, borderColor: c.border }]}>
              <MaterialCommunityIcons name="percent-outline" size={28} color={c.textSecondary} />
              <Text style={[{ color: c.textSecondary, fontSize: 13, marginTop: 6 }]}>
                No taxes configured. Tap "+ Add Tax" to add one.
              </Text>
            </View>
          ) : (
            form.taxes.map((tax, idx) => (
              <Animated.View
                key={idx}
                entering={FadeInDown.delay(idx * 50).duration(280)}
                style={[styles.taxRow, { backgroundColor: c.card, borderColor: c.border }]}
              >
                <View style={{ flex: 2 }}>
                  <Text style={[styles.label, { color: c.textSecondary }]}>Tax Name</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: c.inputBackground, borderColor: c.border, color: c.text }]}
                    value={tax.name}
                    onChangeText={(v) => updateTax(idx, 'name', v)}
                    placeholder="e.g. CGST"
                    placeholderTextColor={c.textSecondary + '80'}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.label, { color: c.textSecondary }]}>% Rate</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: c.inputBackground, borderColor: c.border, color: c.text }]}
                    value={tax.percent}
                    onChangeText={(v) => updateTax(idx, 'percent', v)}
                    placeholder="9"
                    placeholderTextColor={c.textSecondary + '80'}
                    keyboardType="decimal-pad"
                    maxLength={5}
                  />
                </View>
                <Pressable
                  onPress={() => removeTax(idx)}
                  style={[styles.removeTaxBtn, { backgroundColor: c.error + '12' }]}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={c.error} />
                </Pressable>
              </Animated.View>
            ))
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 9, paddingHorizontal: 16, borderRadius: 10,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  scrollContent: { paddingHorizontal: 16, paddingTop: 4 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    borderWidth: 1, padding: 12, marginBottom: 12, gap: 8,
  },

  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  section: { borderRadius: 14, borderWidth: 1.5, padding: 16, marginBottom: 4 },

  fieldGroup: {},
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  input: {
    borderRadius: 10, borderWidth: 1.5,
    paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    fontSize: 15,
  },
  multiline: { minHeight: 72, paddingTop: 10 },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  toggleLabel: { fontSize: 15, fontWeight: '700' },
  toggleHint: { fontSize: 12, fontWeight: '400', marginTop: 2 },

  taxHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: 16,
  },
  addTaxBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1,
  },
  addTaxBtnText: { fontSize: 13, fontWeight: '700' },
  emptyTaxes: {
    alignItems: 'center', justifyContent: 'center', padding: 24,
    borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', marginBottom: 8,
  },
  taxRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 0,
    borderRadius: 12, borderWidth: 1.5, padding: 12, marginBottom: 10,
  },
  removeTaxBtn: {
    width: 40, height: 40, borderRadius: 10, justifyContent: 'center',
    alignItems: 'center', marginLeft: 10, marginBottom: 0,
    alignSelf: 'flex-end',
  },
});
