// ============================================================================
// MANAGER — MENU SCREEN
// ============================================================================
// Full CRUD: list, add, edit, delete dishes with image upload.
// Availability toggles per dish and per category.
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Pressable, ActivityIndicator, Alert,
  Modal, TextInput, Platform, TouchableOpacity, Switch,
  Image as RNImage, KeyboardAvoidingView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ENDPOINTS } from '@/config/api';

// ============================================================================
// TYPES
// ============================================================================

interface MenuItem {
  dishId: string;
  dishName: string;
  price: number;
  isAvailable: boolean;
  category: string | null;
  description: string | null;
  imageUrl: string | null;
  preparationTime: number;
  spicyLevel: string | null;
  isVegetarian: boolean;
}

const SPICY_LEVELS = ['Mild', 'Medium', 'Spicy', 'Extra Spicy'];

// ============================================================================
// DISH FORM MODAL (Add / Edit)
// ============================================================================

function DishFormModal({
  visible, dish, categories, onClose, onSuccess, colors, getAuthHeaders,
}: {
  visible: boolean;
  dish: MenuItem | null;
  categories: string[];
  onClose: () => void;
  onSuccess: () => void;
  colors: any;
  getAuthHeaders: () => Record<string, string>;
}) {
  const isEdit = !!dish;
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('15');
  const [spicyLevel, setSpicyLevel] = useState<string | null>(null);
  const [isVeg, setIsVeg] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Populate when editing
  useEffect(() => {
    if (dish) {
      setName(dish.dishName);
      setPrice(String(dish.price));
      setCategory(dish.category ?? '');
      setDescription(dish.description ?? '');
      setPrepTime(String(dish.preparationTime));
      setSpicyLevel(dish.spicyLevel ?? null);
      setIsVeg(dish.isVegetarian);
      setIsAvailable(dish.isAvailable);
      setImageUri(dish.imageUrl);
    } else {
      setName(''); setPrice(''); setCategory(''); setDescription('');
      setPrepTime('15'); setSpicyLevel(null); setIsVeg(false);
      setIsAvailable(true); setImageUri(null);
    }
    setError('');
  }, [dish, visible]);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed', 'Allow photo library access.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageMime(result.assets[0].mimeType ?? 'image/jpeg');
    }
  };

  const uploadImage = async (dishId: string, uri: string) => {
    const filename = uri.split('/').pop() ?? 'photo.jpg';
    const formData = new FormData();
    formData.append('image', { uri, name: filename, type: imageMime } as any);
    const headers = getAuthHeaders();
    delete (headers as any)['Content-Type'];
    const res = await fetch(ENDPOINTS.MENU_ITEM_IMAGE(dishId), {
      method: 'POST',
      headers: { ...headers, 'X-File-Name': filename, 'Content-Type': imageMime },
      body: { uri, name: filename, type: imageMime } as any,
    });
    return res.json();
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Dish name is required.'); return; }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) { setError('Enter a valid price.'); return; }

    setLoading(true); setError('');
    try {
      const body: any = {
        dishName: name.trim(),
        price: priceNum,
        category: category || undefined,
        description: description || undefined,
        preparationTime: parseInt(prepTime, 10) || 15,
        spicyLevel: spicyLevel || undefined,
        isVegetarian: isVeg,
        isAvailable,
      };

      let dishId = dish?.dishId;

      if (isEdit && dishId) {
        const res = await fetch(ENDPOINTS.MENU_ITEM(dishId), {
          method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(body),
        });
        // Guard against non-JSON
        const ct = res.headers.get('content-type') ?? '';
        if (!ct.includes('application/json')) { setError('Server error. Try again.'); setLoading(false); return; }
        const json = await res.json();
        if (json?.status !== 'success') { setError(json?.message ?? 'Update failed.'); setLoading(false); return; }
      } else {
        // FIX #9: POST to add dish — guard content-type to detect server errors
        const res = await fetch(ENDPOINTS.MENU, {
          method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(body),
        });
        const ct = res.headers.get('content-type') ?? '';
        if (!ct.includes('application/json')) { setError('Server error. Check your connection.'); setLoading(false); return; }
        const json = await res.json();
        if (json?.status !== 'success') { setError(json?.message ?? 'Add failed.'); setLoading(false); return; }
        dishId = json.data.dishId;
      }

      // Upload new image if selected (not the existing URL)
      if (imageUri && !imageUri.startsWith('http') && dishId) {
        await uploadImage(dishId, imageUri);
      }

      onSuccess();
    } catch (error) {
      console.error('Dish form error:', error);
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* FIX #8: KeyboardAvoidingView wraps the modal so keyboard doesn't cover inputs.
          Using flex:1 to take up available space */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.modalOverlay, { flex: 1 }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.formModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{isEdit ? 'Edit Dish' : 'Add New Dish'}</Text>

          {/* FIX #8: ScrollView with keyboardShouldPersistTaps ensures scroll works
              even when keyboard is open and you tap on a non-input area. 
              Removed maxHeight to allow proper scrolling. */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 16 }}
            scrollEnabled={true}
            nestedScrollEnabled={true}
          >
            {/* Image Picker */}
            <Pressable onPress={pickImage} style={[styles.imagePicker, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              {imageUri ? (
                <RNImage source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
              ) : (
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <MaterialCommunityIcons name="camera-plus-outline" size={32} color={colors.primary} />
                  <Text style={[{ fontSize: 13, color: colors.textSecondary }]}>Tap to add photo</Text>
                </View>
              )}
            </Pressable>
            {imageUri && !imageUri.startsWith('http') && (
              <Pressable onPress={() => setImageUri(null)} style={{ alignSelf: 'flex-end', marginBottom: 8 }}>
                <Text style={[{ color: colors.error, fontSize: 12, fontWeight: '600' }]}>Remove photo</Text>
              </Pressable>
            )}

            {/* Text Fields */}
            {[
              { label: 'Dish Name *', value: name, setter: setName, placeholder: 'e.g. Paneer Butter Masala' },
              { label: 'Price (₹) *', value: price, setter: setPrice, placeholder: '0.00', keyboard: 'decimal-pad' as any },
              { label: 'Category', value: category, setter: setCategory, placeholder: 'e.g. Main Course' },
              { label: 'Description', value: description, setter: setDescription, placeholder: 'Short description', multi: true },
              { label: 'Prep Time (min)', value: prepTime, setter: setPrepTime, placeholder: '15', keyboard: 'number-pad' as any },
            ].map((f) => (
              <View key={f.label} style={{ marginBottom: 14 }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{f.label}</Text>
                <View style={[styles.inputBox, { backgroundColor: colors.inputBackground, borderColor: colors.border, ...(f.multi ? { minHeight: 70, alignItems: 'flex-start', paddingTop: 10 } : {}) }]}>
                  <TextInput
                    style={[{ flex: 1, color: colors.text, fontSize: 15, ...(f.multi ? { minHeight: 50 } : {}) }]}
                    value={f.value}
                    onChangeText={f.setter}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.textSecondary + '80'}
                    keyboardType={f.keyboard ?? 'default'}
                    multiline={f.multi}
                    textAlignVertical={f.multi ? 'top' : 'center'}
                  />
                </View>
              </View>
            ))}

            {/* Spicy Level */}
            <View style={{ marginBottom: 14 }}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Spicy Level</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {[null, ...SPICY_LEVELS].map((level) => (
                  <Pressable
                    key={level ?? 'none'}
                    onPress={() => setSpicyLevel(level)}
                    style={[styles.chipBtn, {
                      backgroundColor: spicyLevel === level ? colors.primary : colors.inputBackground,
                      borderColor: spicyLevel === level ? colors.primary : colors.border,
                    }]}
                  >
                    <Text style={[{ fontSize: 12, fontWeight: '600', color: spicyLevel === level ? '#fff' : colors.textSecondary }]}>
                      {level ?? 'None'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Toggles */}
            {[
              { label: 'Vegetarian', value: isVeg, setter: setIsVeg },
              { label: 'Available', value: isAvailable, setter: setIsAvailable },
            ].map((t) => (
              <View key={t.label} style={[styles.toggleRow, { borderColor: colors.border }]}>
                <Text style={[{ fontSize: 14, fontWeight: '600', color: colors.text }]}>{t.label}</Text>
                <Switch
                  value={t.value}
                  onValueChange={t.setter}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            ))}

            {error ? <Text style={[{ color: colors.error, fontSize: 13, fontWeight: '600', marginBottom: 8 }]}>{error}</Text> : null}

            <View style={styles.modalActions}>
              <Pressable onPress={onClose} style={[styles.modalBtn, { borderColor: colors.border, borderWidth: 1 }]}>
                <Text style={[{ fontWeight: '700', color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave} disabled={loading} style={[styles.modalBtn, { backgroundColor: colors.primary }]}>
                {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[{ fontWeight: '700', color: '#fff' }]}>{isEdit ? 'Save Changes' : 'Add Dish'}</Text>}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ============================================================================
// DISH CARD
// ============================================================================

function DishCard({ item, onEdit, onToggle, onDelete, colors }: {
  item: MenuItem; onEdit: () => void;
  onToggle: () => void; onDelete: () => void; colors: any;
}) {
  return (
    <View style={[styles.dishCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: item.isAvailable ? 1 : 0.65 }]}>
      {item.imageUrl ? (
        <RNImage source={{ uri: item.imageUrl }} style={styles.dishImage} resizeMode="cover" />
      ) : (
        <View style={[styles.dishImage, { backgroundColor: colors.primary + '12', justifyContent: 'center', alignItems: 'center' }]}>
          <MaterialCommunityIcons name="food" size={28} color={colors.primary + '80'} />
        </View>
      )}
      <View style={{ flex: 1, paddingLeft: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons
            name={item.isVegetarian ? 'leaf' : 'food-drumstick'}
            size={13}
            color={item.isVegetarian ? colors.success : colors.error}
          />
          <Text style={[styles.dishName, { color: colors.text }]} numberOfLines={1}>{item.dishName}</Text>
        </View>
        {item.category && <Text style={[styles.dishCategory, { color: colors.textSecondary }]}>{item.category}</Text>}
        <Text style={[styles.dishPrice, { color: colors.primary }]}>₹{item.price.toFixed(2)}</Text>
        <View style={[styles.availBadge, { backgroundColor: item.isAvailable ? colors.success + '18' : colors.error + '18' }]}>
          <Text style={[{ fontSize: 10, fontWeight: '700', color: item.isAvailable ? colors.success : colors.error }]}>
            {item.isAvailable ? 'Available' : 'Unavailable'}
          </Text>
        </View>
      </View>
      {/* Actions */}
      <View style={styles.dishActions}>
        <Pressable onPress={onToggle} style={[styles.iconBtn, { backgroundColor: colors.inputBackground }]}>
          <MaterialCommunityIcons
            name={item.isAvailable ? 'eye-off-outline' : 'eye-outline'}
            size={16}
            color={colors.textSecondary}
          />
        </Pressable>
        <Pressable onPress={onEdit} style={[styles.iconBtn, { backgroundColor: colors.inputBackground }]}>
          <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.primary} />
        </Pressable>
        <Pressable onPress={onDelete} style={[styles.iconBtn, { backgroundColor: colors.error + '12' }]}>
          <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.error} />
        </Pressable>
      </View>
    </View>
  );
}

// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function MenuScreen() {
  const { getAuthHeaders } = useAuth();
  const { theme } = useTheme();
  // FIX #1: Use insets for paddingTop — no SafeAreaView
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [filterAvail, setFilterAvail] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (filterCat) params.set('category', filterCat);
    if (filterAvail !== null) params.set('isAvailable', String(filterAvail));
    const qs = params.toString();
    return qs ? `${ENDPOINTS.MENU}?${qs}` : ENDPOINTS.MENU;
  }, [filterCat, filterAvail]);

  const fetchMenu = useCallback(async () => {
    setFetchError('');
    try {
      const [mRes, cRes] = await Promise.all([
        fetch(buildUrl(), { headers: getAuthHeaders() }),
        fetch(ENDPOINTS.MENU_CATEGORIES, { headers: getAuthHeaders() }),
      ]);
      
      // Check content-type
      const mContentType = mRes.headers.get('content-type') ?? '';
      const cContentType = cRes.headers.get('content-type') ?? '';
      
      if (!mContentType.includes('application/json') || !cContentType.includes('application/json')) {
        setFetchError('Server returned an unexpected response. Check your connection.');
        return;
      }
      
      const [mJson, cJson] = await Promise.all([mRes.json(), cRes.json()]);
      if (mJson?.status === 'success') setItems(mJson.data ?? []);
      else setFetchError(mJson?.message ?? 'Failed to load menu.');
      if (cJson?.status === 'success') setCategories(cJson.data ?? []);
    } catch (error) {
      console.error('Fetch menu error:', error);
      setFetchError('Network error.');
    } finally {
      setIsLoading(false); setIsRefreshing(false);
    }
  }, [buildUrl, getAuthHeaders]);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const res = await fetch(ENDPOINTS.MENU_AVAILABILITY(item.dishId), {
        method: 'PATCH', headers: getAuthHeaders(),
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      const json = await res.json();
      if (json?.status === 'success') {
        setItems((prev) => prev.map((d) => d.dishId === item.dishId ? { ...d, isAvailable: !d.isAvailable } : d));
      } else Alert.alert('Error', json?.message ?? 'Failed.');
    } catch { Alert.alert('Error', 'Network error.'); }
  };

  const handleDelete = (item: MenuItem) => {
    Alert.alert('Delete Dish', `Delete "${item.dishName}"? This also removes the photo.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const res = await fetch(ENDPOINTS.MENU_ITEM(item.dishId), { method: 'DELETE', headers: getAuthHeaders() });
            const json = await res.json();
            if (json?.status === 'success') setItems((prev) => prev.filter((d) => d.dishId !== item.dishId));
            else Alert.alert('Error', json?.message ?? 'Failed.');
          } catch { Alert.alert('Error', 'Network error.'); }
        },
      },
    ]);
  };

  return (
    // FIX #1: Plain View instead of SafeAreaView
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={[styles.pageTitle, { color: c.text }]}>Menu</Text>
        <Pressable
          onPress={() => { setEditingDish(null); setShowForm(true); }}
          style={[styles.addBtn, { backgroundColor: c.primary }]}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add Dish</Text>
        </Pressable>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        <Pressable
          onPress={() => setFilterAvail(null)}
          style={[styles.filterChip, { backgroundColor: filterAvail === null ? c.primary : c.inputBackground, borderColor: filterAvail === null ? c.primary : c.border }]}
        >
          <Text style={[styles.filterChipText, { color: filterAvail === null ? '#fff' : c.textSecondary }]}>All</Text>
        </Pressable>
        <Pressable
          onPress={() => setFilterAvail(true)}
          style={[styles.filterChip, { backgroundColor: filterAvail === true ? c.success : c.inputBackground, borderColor: filterAvail === true ? c.success : c.border }]}
        >
          <Text style={[styles.filterChipText, { color: filterAvail === true ? '#fff' : c.textSecondary }]}>Available</Text>
        </Pressable>
        <Pressable
          onPress={() => setFilterAvail(false)}
          style={[styles.filterChip, { backgroundColor: filterAvail === false ? c.error : c.inputBackground, borderColor: filterAvail === false ? c.error : c.border }]}
        >
          <Text style={[styles.filterChipText, { color: filterAvail === false ? '#fff' : c.textSecondary }]}>Unavailable</Text>
        </Pressable>
        {categories.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setFilterCat(filterCat === cat ? null : cat)}
            style={[styles.filterChip, { backgroundColor: filterCat === cat ? c.primary : c.inputBackground, borderColor: filterCat === cat ? c.primary : c.border }]}
          >
            <Text style={[styles.filterChipText, { color: filterCat === cat ? '#fff' : c.textSecondary }]}>{cat}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={c.primary} /></View>
      ) : fetchError ? (
        <View style={styles.center}>
          <Text style={[{ color: c.error, fontWeight: '600' }]}>{fetchError}</Text>
          <Pressable onPress={fetchMenu} style={[styles.retryBtn, { backgroundColor: c.primary }]}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); fetchMenu(); }} tintColor={c.primary} colors={[c.primary]} />}
        >
          {items.length === 0 ? (
            <View style={styles.center}>
              <MaterialCommunityIcons name="food-off-outline" size={48} color={c.textSecondary} />
              <Text style={[{ color: c.textSecondary, marginTop: 12, fontSize: 15 }]}>No dishes found</Text>
            </View>
          ) : (
            items.map((item, i) => (
              <Animated.View key={item.dishId} entering={FadeInDown.delay(i * 40).duration(300)}>
                <DishCard
                  item={item}
                  onEdit={() => { setEditingDish(item); setShowForm(true); }}
                  onToggle={() => handleToggleAvailability(item)}
                  onDelete={() => handleDelete(item)}
                  colors={c}
                />
              </Animated.View>
            ))
          )}
        </ScrollView>
      )}

      <DishFormModal
        visible={showForm}
        dish={editingDish}
        categories={categories}
        onClose={() => { setShowForm(false); setEditingDish(null); }}
        onSuccess={() => { setShowForm(false); setEditingDish(null); fetchMenu(); }}
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
    justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 8,
  },
  pageTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, gap: 4,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  filterBar: { marginBottom: 8, maxHeight: 44 },
  filterChip: {
    paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: 20, borderWidth: 1.5,
  },
  filterChipText: { fontSize: 12, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 60, gap: 12,
  },
  retryBtn: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 24 },

  dishCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1.5,
    padding: 10, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  dishImage: { width: 70, height: 70, borderRadius: 10 },
  dishName: { fontSize: 14, fontWeight: '700', flex: 1 },
  dishCategory: { fontSize: 11, marginTop: 2 },
  dishPrice: { fontSize: 15, fontWeight: '800', marginTop: 4 },
  availBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingVertical: 2, paddingHorizontal: 6, marginTop: 4 },
  dishActions: { gap: 6, alignItems: 'center' },
  iconBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

  // Modal — FIX #8: overlay is now the KeyboardAvoidingView flex container
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  formModal: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    // FIX #8: Removed maxHeight - use flex to allow ScrollView to work properly
    flex: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 4 },
  modalBtn: {
    flex: 1, alignItems: 'center', borderRadius: 10,
    paddingVertical: 13, justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 11, fontWeight: '600',
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, borderWidth: 1.5,
    paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 9,
  },
  chipBtn: {
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 20, borderWidth: 1.5,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1, paddingVertical: 12, marginBottom: 4,
  },
  imagePicker: {
    height: 120, borderRadius: 14, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10, overflow: 'hidden',
  },
  imagePreview: { width: '100%', height: '100%' },
});