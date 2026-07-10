// ============================================================================
// MANAGER — MENU SCREEN  (rewritten)
// ============================================================================
// Full CRUD: list, add, edit, delete dishes with image upload.
// Availability toggles per dish and per category.
//
// IMAGE UPLOAD FIX:
//   The old code used FileReader (a Web API) which does NOT exist in React
//   Native, causing a silent crash on native devices.
//   Fix: use expo-file-system's readAsStringAsync(..., { encoding: 'base64' })
//   to convert the picked image URI to a base64 string, then POST it as
//   application/json { image, mimeType, fileName } — matching the backend's
//   "Method B" upload path.
// ============================================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
  Switch,
  Image as RNImage,
  KeyboardAvoidingView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';


import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useDialog } from '@/context/DialogContext';
import { ENDPOINTS } from '@/config/api';
import { router } from 'expo-router';

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
  spicyLevel: number | null;
  isVegetarian: boolean;
}

interface PickedImage {
  uri: string;
  mimeType: string;
  fileName: string;
  base64: string;       // provided directly by ImagePicker — no filesystem needed
}

const SPICY_LEVELS = [
  { label: 'Mild',        value: 1 },
  { label: 'Medium',      value: 2 },
  { label: 'Spicy',       value: 3 },
  { label: 'Extra Spicy', value: 4 },
];

// ============================================================================
// DISH FORM MODAL  (Add / Edit) — fully rewritten
// ============================================================================

function DishFormModal({
  visible,
  dish,
  categories,
  onClose,
  onSuccess,
  colors,
  getAuthHeaders,
  showWarning,
  showError,
}: {
  visible: boolean;
  dish: MenuItem | null;
  categories: string[];
  onClose: () => void;
  onSuccess: () => void;
  colors: any;
  getAuthHeaders: () => Record<string, string>;
  showWarning: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
}) {
  const isEdit = !!dish;

  // ── Form state ──────────────────────────────────────────────────────────────
  const [name,        setName]        = useState('');
  const [price,       setPrice]       = useState('');
  const [category,    setCategory]    = useState('');
  const [description, setDescription] = useState('');
  const [prepTime,    setPrepTime]    = useState('15');
  const [spicyLevel,  setSpicyLevel]  = useState<number | null>(null);
  const [isVeg,       setIsVeg]       = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  // ── Image state ─────────────────────────────────────────────────────────────
  // pickedImage: the NEW local image the user just picked (not yet uploaded)
  // existingImageUrl: the current remote URL already in the DB (for edit mode)
  const [pickedImage,       setPickedImage]       = useState<PickedImage | null>(null);
  const [existingImageUrl,  setExistingImageUrl]  = useState<string | null>(null);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [loading,       setLoading]       = useState(false);
  const [uploadingImg,  setUploadingImg]  = useState(false);
  const [error,         setError]         = useState('');

  // ── Populate form when modal opens ──────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      if (dish) {
        setName(dish.dishName);
        setPrice(String(dish.price));
        setCategory(dish.category ?? '');
        setDescription(dish.description ?? '');
        setPrepTime(String(dish.preparationTime));
        setSpicyLevel(dish.spicyLevel ?? null);
        setIsVeg(dish.isVegetarian);
        setIsAvailable(dish.isAvailable);
        setExistingImageUrl(dish.imageUrl);
      } else {
        setName('');
        setPrice('');
        setCategory('');
        setDescription('');
        setPrepTime('15');
        setSpicyLevel(null);
        setIsVeg(false);
        setIsAvailable(true);
        setExistingImageUrl(null);
      }
      setPickedImage(null);
      setError('');
    }
  }, [visible, dish]);

  // ── Image picker ────────────────────────────────────────────────────────────
  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showWarning('Permission needed', 'Allow photo library access to add a dish photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,       // ask the picker to return base64 directly — no filesystem needed
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const uri = asset.uri;

        if (!asset.base64) {
          showError('Error', 'Could not read image data. Please try a different photo.');
          return;
        }

        const mimeType = asset.mimeType ?? 'image/jpeg';
        const ext      = mimeType.split('/')[1] ?? 'jpg';
        const fileName = asset.fileName ?? `photo_${Date.now()}.${ext}`;

        setPickedImage({ uri, mimeType, fileName, base64: asset.base64 });
      }
    } catch (err) {
      console.error('[pickImage] error:', err);
      showError('Error', 'Failed to open image picker.');
    }
  };

  // ── Image upload (React Native safe — uses expo-file-system, NOT FileReader) ─
  //
  //  WHY: FileReader is a Web API. React Native does NOT have it.
  //       Using it causes "FileReader is not defined" or a silent crash.
  //
  //  HOW: expo-file-system reads the local file URI and returns a base64
  //       string natively. We then POST { image, mimeType, fileName } as JSON,
  //       which matches the backend's "Method B" base64 upload path.
  // ─────────────────────────────────────────────────────────────────────────────
  const uploadImage = async (dishId: string, image: PickedImage): Promise<boolean> => {
    setUploadingImg(true);
    try {
      // base64 was already read by ImagePicker (base64: true option)
      // No filesystem access needed at all — works on all SDK versions
      const base64 = image.base64;

      if (!base64 || base64.length === 0) {
        throw new Error('base64 data is empty');
      }

      const headers = {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      };

      const res = await fetch(ENDPOINTS.MENU_ITEM_IMAGE(dishId), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          image:    base64,
          mimeType: image.mimeType,
          fileName: image.fileName,
        }),
      });

      const json = await res.json();

      if (json?.status !== 'success') {
        console.error('[uploadImage] server rejected upload:', json);
        // Non-fatal: dish was saved, image failed — inform user but don't block
        showError(
          'Image Upload Failed',
          json?.message ?? 'Dish was saved but the photo could not be uploaded. You can try again from Edit.',
        );
        return false;
      }

      return true;
    } catch (err: any) {
      console.error('[uploadImage] error:', err);
      showError(
        'Image Upload Failed',
        'Dish was saved but the photo could not be uploaded. You can try again from Edit.',
      );
      return false;
    } finally {
      setUploadingImg(false);
    }
  };

  // ── Save (create or update) ──────────────────────────────────────────────────
  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      setError('Dish name is required.');
      return;
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Enter a valid price.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const body: Record<string, any> = {
        dishName:        name.trim(),
        price:           priceNum,
        category:        category.trim() || undefined,
        description:     description.trim() || undefined,
        preparationTime: parseInt(prepTime, 10) || 15,
        spicyLevel:      spicyLevel ?? undefined,
        isVegetarian:    isVeg,
        isAvailable,
      };

      let dishId: string | undefined = dish?.dishId;

      // ── Create or Update dish record ───────────────────────────────────────
      if (isEdit && dishId) {
        // PUT /api/manager/menu/:dishId
        const res = await fetch(ENDPOINTS.MENU_ITEM(dishId), {
          method:  'PUT',
          headers: getAuthHeaders(),
          body:    JSON.stringify(body),
        });

        const contentType = res.headers.get('content-type') ?? '';
        if (!contentType.includes('application/json')) {
          setError('Server error — unexpected response. Try again.');
          setLoading(false);
          return;
        }

        const json = await res.json();
        if (json?.status !== 'success') {
          setError(json?.message ?? 'Update failed.');
          setLoading(false);
          return;
        }
      } else {
        // POST /api/manager/menu
        const res = await fetch(ENDPOINTS.MENU, {
          method:  'POST',
          headers: getAuthHeaders(),
          body:    JSON.stringify(body),
        });

        const contentType = res.headers.get('content-type') ?? '';
        if (!contentType.includes('application/json')) {
          setError('Server error — unexpected response. Check your connection.');
          setLoading(false);
          return;
        }

        const json = await res.json();
        if (json?.status !== 'success') {
          setError(json?.message ?? 'Add failed.');
          setLoading(false);
          return;
        }

        dishId = json.data.dishId as string;
      }

      // ── Upload image if a new one was picked ───────────────────────────────
      if (pickedImage && dishId) {
        await uploadImage(dishId, pickedImage);
      }

      onSuccess();
    } catch (err: any) {
      console.error('[handleSave] error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Derived display values ───────────────────────────────────────────────────
  // What to show in the image preview box:
  //   1. Newly picked local image takes priority
  //   2. Fall back to existing remote URL (edit mode)
  const previewUri = pickedImage?.uri ?? existingImageUrl ?? null;
  const hasNewImage = !!pickedImage;

  const isBusy = loading || uploadingImg;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          {/* Backdrop tap to close */}
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

          <View
            style={[
              styles.formModal,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {/* ── Header ─────────────────────────────────────────────────── */}
            <View style={styles.formHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isEdit ? 'Edit Dish' : 'Add New Dish'}
              </Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 24 }}
            >

              {/* ── Image Section ─────────────────────────────────────────── */}
              <View style={{ marginBottom: 20 }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  Dish Photo
                </Text>

                {/* Preview / Tap-to-pick box */}
                <Pressable
                  onPress={pickImage}
                  style={[
                    styles.imagePicker,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: previewUri ? colors.primary : colors.border,
                      borderStyle: previewUri ? 'solid' : 'dashed',
                    },
                  ]}
                >
                  {previewUri ? (
                    <>
                      <RNImage
                        source={{ uri: previewUri }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                      {/* Overlay "Change" indicator */}
                      <View style={styles.imageOverlay}>
                        <MaterialCommunityIcons name="camera-retake-outline" size={22} color="#fff" />
                        <Text style={styles.imageOverlayText}>Change</Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <MaterialCommunityIcons
                        name="camera-plus-outline"
                        size={36}
                        color={colors.primary}
                      />
                      <Text style={[styles.imagePlaceholderText, { color: colors.textSecondary }]}>
                        Tap to add photo
                      </Text>
                      <Text style={[styles.imagePlaceholderSub, { color: colors.textSecondary + '80' }]}>
                        JPG, PNG, WEBP · max 5 MB
                      </Text>
                    </View>
                  )}
                </Pressable>

                {/* "New image selected" badge + remove button */}
                {hasNewImage && (
                  <View style={styles.imageStatusRow}>
                    <View style={[styles.imageStatusBadge, { backgroundColor: colors.success + '18' }]}>
                      <MaterialCommunityIcons name="check-circle-outline" size={13} color={colors.success} />
                      <Text style={[styles.imageStatusText, { color: colors.success }]}>
                        New photo selected
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setPickedImage(null)}
                      hitSlop={8}
                    >
                      <Text style={[styles.removePhotoText, { color: colors.error }]}>Remove</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {/* ── Text Fields ───────────────────────────────────────────── */}
              {[
                {
                  label:       'Dish Name *',
                  value:       name,
                  setter:      setName,
                  placeholder: 'e.g. Paneer Butter Masala',
                  keyboard:    'default' as const,
                  multi:       false,
                },
                {
                  label:       'Price (₹) *',
                  value:       price,
                  setter:      setPrice,
                  placeholder: '0.00',
                  keyboard:    'decimal-pad' as const,
                  multi:       false,
                },
                {
                  label:       'Category',
                  value:       category,
                  setter:      setCategory,
                  placeholder: 'e.g. Main Course',
                  keyboard:    'default' as const,
                  multi:       false,
                },
                {
                  label:       'Description',
                  value:       description,
                  setter:      setDescription,
                  placeholder: 'Short description of the dish',
                  keyboard:    'default' as const,
                  multi:       true,
                },
                {
                  label:       'Prep Time (min)',
                  value:       prepTime,
                  setter:      setPrepTime,
                  placeholder: '15',
                  keyboard:    'number-pad' as const,
                  multi:       false,
                },
              ].map((f) => (
                <View key={f.label} style={{ marginBottom: 14 }}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    {f.label}
                  </Text>
                  <View
                    style={[
                      styles.inputBox,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor:     colors.border,
                        ...(f.multi
                          ? { minHeight: 76, alignItems: 'flex-start', paddingTop: 10 }
                          : {}),
                      },
                    ]}
                  >
                    <TextInput
                      style={[
                        {
                          flex:     1,
                          color:    colors.text,
                          fontSize: 15,
                          ...(f.multi ? { minHeight: 56 } : {}),
                        },
                      ]}
                      value={f.value}
                      onChangeText={f.setter}
                      placeholder={f.placeholder}
                      placeholderTextColor={colors.textSecondary + '80'}
                      keyboardType={f.keyboard}
                      multiline={f.multi}
                      textAlignVertical={f.multi ? 'top' : 'center'}
                    />
                  </View>
                </View>
              ))}

              {/* ── Spicy Level chips ─────────────────────────────────────── */}
              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  Spicy Level
                </Text>
                <View style={styles.chipRow}>
                  {/* "None" chip */}
                  <Pressable
                    onPress={() => setSpicyLevel(null)}
                    style={[
                      styles.chipBtn,
                      {
                        backgroundColor: spicyLevel === null ? colors.primary : colors.inputBackground,
                        borderColor:     spicyLevel === null ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: spicyLevel === null ? '#fff' : colors.textSecondary },
                      ]}
                    >
                      None
                    </Text>
                  </Pressable>

                  {SPICY_LEVELS.map((lvl) => {
                    const active = spicyLevel === lvl.value;
                    return (
                      <Pressable
                        key={lvl.value}
                        onPress={() => setSpicyLevel(lvl.value)}
                        style={[
                          styles.chipBtn,
                          {
                            backgroundColor: active ? colors.primary : colors.inputBackground,
                            borderColor:     active ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: active ? '#fff' : colors.textSecondary },
                          ]}
                        >
                          {lvl.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* ── Toggles ───────────────────────────────────────────────── */}
              {[
                { label: 'Vegetarian', icon: 'leaf',           value: isVeg,       setter: setIsVeg,       color: colors.success },
                { label: 'Available',  icon: 'check-circle',   value: isAvailable, setter: setIsAvailable, color: colors.primary },
              ].map((t) => (
                <View
                  key={t.label}
                  style={[styles.toggleRow, { borderColor: colors.border }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialCommunityIcons
                      name={t.icon as any}
                      size={18}
                      color={t.value ? t.color : colors.textSecondary}
                    />
                    <Text style={[{ fontSize: 14, fontWeight: '600', color: colors.text }]}>
                      {t.label}
                    </Text>
                  </View>
                  <Switch
                    value={t.value}
                    onValueChange={t.setter}
                    trackColor={{ false: colors.border, true: t.color }}
                    thumbColor="#fff"
                  />
                </View>
              ))}

              {/* ── Error message ─────────────────────────────────────────── */}
              {error ? (
                <View
                  style={[
                    styles.errorBox,
                    { backgroundColor: colors.error + '12', borderColor: colors.error + '30' },
                  ]}
                >
                  <MaterialCommunityIcons name="alert-circle-outline" size={15} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                </View>
              ) : null}

              {/* ── Action buttons ────────────────────────────────────────── */}
              <View style={styles.modalActions}>
                <Pressable
                  onPress={onClose}
                  disabled={isBusy}
                  style={[
                    styles.modalBtn,
                    {
                      borderColor: colors.border,
                      borderWidth: 1.5,
                      opacity: isBusy ? 0.5 : 1,
                    },
                  ]}
                >
                  <Text style={[{ fontWeight: '700', fontSize: 15, color: colors.textSecondary }]}>
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleSave}
                  disabled={isBusy}
                  style={[
                    styles.modalBtn,
                    {
                      backgroundColor: colors.primary,
                      opacity: isBusy ? 0.75 : 1,
                    },
                  ]}
                >
                  {isBusy ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                        {uploadingImg ? 'Uploading photo…' : 'Saving…'}
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ fontWeight: '700', fontSize: 15, color: '#fff' }}>
                      {isEdit ? 'Save Changes' : 'Add Dish'}
                    </Text>
                  )}
                </Pressable>
              </View>

            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ============================================================================
// DISH CARD
// ============================================================================

function DishCard({
  item,
  onEdit,
  onToggle,
  onDelete,
  colors,
}: {
  item: MenuItem;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  colors: any;
}) {
  return (
    <View
      style={[
        styles.dishCard,
        {
          backgroundColor: colors.card,
          borderColor:     colors.border,
          opacity:         item.isAvailable ? 1 : 0.65,
        },
      ]}
    >
      {/* Dish image / placeholder */}
      {item.imageUrl ? (
        <RNImage source={{ uri: item.imageUrl }} style={styles.dishImage} resizeMode="cover" />
      ) : (
        <View
          style={[
            styles.dishImage,
            {
              backgroundColor: colors.primary + '12',
              justifyContent:  'center',
              alignItems:      'center',
            },
          ]}
        >
          <MaterialCommunityIcons name="food" size={28} color={colors.primary + '80'} />
        </View>
      )}

      {/* Info */}
      <View style={{ flex: 1, paddingLeft: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons
            name={item.isVegetarian ? 'leaf' : 'food-drumstick'}
            size={13}
            color={item.isVegetarian ? colors.success : colors.error}
          />
          <Text style={[styles.dishName, { color: colors.text }]} numberOfLines={1}>
            {item.dishName}
          </Text>
        </View>
        {item.category && (
          <Text style={[styles.dishCategory, { color: colors.textSecondary }]}>
            {item.category}
          </Text>
        )}
        <Text numberOfLines={1} style={[styles.dishPrice, { color: colors.primary }]}>
          ₹{item.price.toFixed(2)}
        </Text>
        <View
          style={[
            styles.availBadge,
            {
              backgroundColor: item.isAvailable
                ? colors.success + '18'
                : colors.error + '18',
            },
          ]}
        >
          <Text
            style={[
              {
                fontSize:   10,
                fontWeight: '700',
                color:      item.isAvailable ? colors.success : colors.error,
              },
            ]}
          >
            {item.isAvailable ? 'Available' : 'Unavailable'}
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.dishActions}>
        <Pressable
          onPress={onToggle}
          style={[styles.iconBtn, { backgroundColor: colors.inputBackground }]}
        >
          <MaterialCommunityIcons
            name={item.isAvailable ? 'eye-off-outline' : 'eye-outline'}
            size={16}
            color={colors.textSecondary}
          />
        </Pressable>
        <Pressable
          onPress={onEdit}
          style={[styles.iconBtn, { backgroundColor: colors.inputBackground }]}
        >
          <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.primary} />
        </Pressable>
        <Pressable
          onPress={onDelete}
          style={[styles.iconBtn, { backgroundColor: colors.error + '12' }]}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.error} />
        </Pressable>
      </View>
    </View>
  );
}

// ============================================================================
// FILTER DROPDOWN
// ============================================================================

function FilterDropdown({
  label,
  options,
  selected,
  onSelect,
  colors,
  activeColor,
}: {
  label: string;
  options: { value: string | null; label: string }[];
  selected: string | null | boolean;
  onSelect: (val: any) => void;
  colors: any;
  activeColor?: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedLabel = options.find(
    (o) => o.value === selected || (o.value === String(selected) && selected !== null),
  )?.label;

  const isActive     = selected !== null && selected !== undefined;
  const accentColor  = activeColor ?? colors.primary;

  return (
    <View style={{ position: 'relative' }}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={[
          styles.dropdownBtn,
          {
            backgroundColor: isActive ? accentColor + '15' : colors.inputBackground,
            borderColor:     isActive ? accentColor       : colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.dropdownBtnText,
            { color: isActive ? accentColor : colors.text },
          ]}
          numberOfLines={1}
        >
          {selectedLabel ?? label}
        </Text>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={isActive ? accentColor : colors.textSecondary}
        />
      </Pressable>

      {open && (
        <View
          style={[
            styles.dropdownMenu,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {options.map((opt) => {
            const isSelected =
              opt.value === selected ||
              (opt.value !== null && opt.value === String(selected));

            return (
              <Pressable
                key={opt.value ?? '__null__'}
                onPress={() => {
                  onSelect(opt.value);
                  setOpen(false);
                }}
                style={[
                  styles.dropdownItem,
                  {
                    backgroundColor: isSelected ? accentColor + '15' : 'transparent',
                    borderColor:     colors.border,
                  },
                ]}
              >
                {isSelected && (
                  <MaterialCommunityIcons name="check" size={14} color={accentColor} />
                )}
                <Text
                  style={[
                    styles.dropdownItemText,
                    {
                      color:      isSelected ? accentColor : colors.text,
                      fontWeight: isSelected ? '700' : '500',
                      marginLeft: isSelected ? 0 : 18,
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function MenuScreen() {
  const { getAuthHeaders } = useAuth();
  const { theme }          = useTheme();
  const { showError, showWarning, showConfirm } = useDialog();
  const insets             = useSafeAreaInsets();
  const c                  = theme.colors;

  const [items,       setItems]       = useState<MenuItem[]>([]);
  const [categories,  setCategories]  = useState<string[]>([]);
  const [filterCat,   setFilterCat]   = useState<string | null>(null);
  const [filterAvail, setFilterAvail] = useState<boolean | null>(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const [isRefreshing,setIsRefreshing]= useState(false);
  const [fetchError,  setFetchError]  = useState('');
  const [showForm,    setShowForm]    = useState(false);
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (filterCat)          params.set('category',    filterCat);
    if (filterAvail !== null) params.set('isAvailable', String(filterAvail));
    const qs = params.toString();
    return qs ? `${ENDPOINTS.MENU}?${qs}` : ENDPOINTS.MENU;
  }, [filterCat, filterAvail]);

  const fetchMenu = useCallback(async () => {
    setFetchError('');
    try {
      const [mRes, cRes] = await Promise.all([
        fetch(buildUrl(),              { headers: getAuthHeaders() }),
        fetch(ENDPOINTS.MENU_CATEGORIES, { headers: getAuthHeaders() }),
      ]);

      const mCT = mRes.headers.get('content-type') ?? '';
      const cCT = cRes.headers.get('content-type') ?? '';

      if (!mCT.includes('application/json') || !cCT.includes('application/json')) {
        setFetchError('Server returned an unexpected response. Check your connection.');
        return;
      }

      const [mJson, cJson] = await Promise.all([mRes.json(), cRes.json()]);

      if (mJson?.status === 'success') setItems(mJson.data ?? []);
      else setFetchError(mJson?.message ?? 'Failed to load menu.');

      if (cJson?.status === 'success') setCategories(cJson.data ?? []);
    } catch (err) {
      console.error('[fetchMenu] error:', err);
      setFetchError('Network error.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [buildUrl, getAuthHeaders]);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const res = await fetch(ENDPOINTS.MENU_AVAILABILITY(item.dishId), {
        method:  'PATCH',
        headers: getAuthHeaders(),
        body:    JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      const json = await res.json();
      if (json?.status === 'success') {
        setItems((prev) =>
          prev.map((d) =>
            d.dishId === item.dishId ? { ...d, isAvailable: !d.isAvailable } : d,
          ),
        );
      } else {
        showError('Error', json?.message ?? 'Failed to update.');
      }
    } catch {
      showError('Error', 'Network error.');
    }
  };

  const handleDelete = (item: MenuItem) => {
    showConfirm({
      title: 'Delete Dish',
      message: `Delete "${item.dishName}"? This also removes the photo and cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(ENDPOINTS.MENU_ITEM(item.dishId), {
            method:  'DELETE',
            headers: getAuthHeaders(),
          });
          const json = await res.json();
          if (json?.status === 'success') {
            setItems((prev) => prev.filter((d) => d.dishId !== item.dishId));
          } else {
            showError('Error', json?.message ?? 'Failed to delete.');
          }
        } catch {
          showError('Error', 'Network error.');
        }
      },
    });
  };

  const isAllActive = filterAvail === null && filterCat === null;

  const availOptions = [
    { value: null,    label: 'All Status'  },
    { value: 'true',  label: 'Available'   },
    { value: 'false', label: 'Unavailable' },
  ];

  const categoryOptions = [
    { value: null, label: 'All Categories' },
    ...categories.map((cat) => ({ value: cat, label: cat })),
  ];

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable onPress={() => router.back()} style={{ marginRight: 4 }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={c.text} />
          </Pressable>
          <Text style={[styles.pageTitle, { color: c.text }]}>Menu</Text>
        </View>
        <Pressable
          onPress={() => { setEditingDish(null); setShowForm(true); }}
          style={[styles.addBtn, { backgroundColor: c.primary }]}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add Dish</Text>
        </Pressable>
      </View>

      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <View style={styles.filterBar}>
        <Pressable
          onPress={() => { setFilterAvail(null); setFilterCat(null); }}
          style={[
            styles.allBtn,
            {
              backgroundColor: isAllActive ? c.primary    : c.inputBackground,
              borderColor:     isAllActive ? c.primary    : c.border,
            },
          ]}
        >
          <Text style={[styles.allBtnText, { color: isAllActive ? '#fff' : c.textSecondary }]}>
            All
          </Text>
        </Pressable>

        <FilterDropdown
          label="Status"
          options={availOptions}
          selected={filterAvail === null ? null : String(filterAvail)}
          onSelect={(val: string | null) => {
            if (val === null) setFilterAvail(null);
            else setFilterAvail(val === 'true');
          }}
          colors={c}
          activeColor={
            filterAvail === true  ? c.success :
            filterAvail === false ? c.error   :
            c.primary
          }
        />

        <FilterDropdown
          label="Category"
          options={categoryOptions}
          selected={filterCat}
          onSelect={(val: string | null) => setFilterCat(val)}
          colors={c}
        />
      </View>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      ) : fetchError ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="wifi-off" size={40} color={c.textSecondary} />
          <Text style={[{ color: c.error, fontWeight: '600', marginTop: 8 }]}>{fetchError}</Text>
          <Pressable onPress={fetchMenu} style={[styles.retryBtn, { backgroundColor: c.primary }]}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => { setIsRefreshing(true); fetchMenu(); }}
              tintColor={c.primary}
              colors={[c.primary]}
            />
          }
        >
          {items.length === 0 ? (
            <View style={styles.center}>
              <MaterialCommunityIcons name="food-off-outline" size={48} color={c.textSecondary} />
              <Text style={[{ color: c.textSecondary, marginTop: 12, fontSize: 15 }]}>
                No dishes found
              </Text>
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

      {/* ── Add / Edit modal ────────────────────────────────────────────────── */}
      <DishFormModal
        visible={showForm}
        dish={editingDish}
        categories={categories}
        onClose={() => { setShowForm(false); setEditingDish(null); }}
        onSuccess={() => { setShowForm(false); setEditingDish(null); fetchMenu(); }}
        colors={c}
        getAuthHeaders={getAuthHeaders}
        showWarning={showWarning}
        showError={showError}
      />
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: 20,
    paddingBottom:   8,
  },
  pageTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  addBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    borderRadius:   10,
    paddingVertical:  8,
    paddingHorizontal: 14,
    gap: 4,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // ── Filter bar ──────────────────────────────────────────────────────────────
  filterBar: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal: 16,
    paddingBottom:    10,
    gap:              8,
  },
  allBtn: {
    paddingVertical:   8,
    paddingHorizontal: 16,
    borderRadius:      10,
    borderWidth:       1.5,
  },
  allBtnText: { fontSize: 13, fontWeight: '700' },
  dropdownBtn: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingVertical:   8,
    paddingHorizontal: 12,
    borderRadius:      10,
    borderWidth:       1.5,
    gap:               4,
    minWidth:          100,
    maxWidth:          140,
  },
  dropdownBtnText: { fontSize: 13, fontWeight: '600', flex: 1 },
  dropdownMenu: {
    position:     'absolute',
    top:          42,
    left:          0,
    minWidth:      160,
    borderRadius:  12,
    borderWidth:   1.5,
    zIndex:        999,
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius:  8,
    elevation:     8,
    overflow:      'hidden',
  },
  dropdownItem: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical:  10,
    paddingHorizontal: 14,
    gap:              6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dropdownItemText: { fontSize: 13 },

  // ── List ────────────────────────────────────────────────────────────────────
  list:   { paddingHorizontal: 16, paddingBottom: 24 },
  center: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: 60,
    gap:             12,
  },
  retryBtn: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 24 },

  // ── Dish card ────────────────────────────────────────────────────────────────
  dishCard: {
    flexDirection:  'row',
    alignItems:     'center',
    borderRadius:   14,
    borderWidth:    1.5,
    padding:        10,
    marginBottom:   10,
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 2 },
    shadowOpacity:  0.05,
    shadowRadius:   6,
    elevation:      2,
  },
  dishImage:    { width: 70, height: 70, borderRadius: 10 },
  dishName:     { fontSize: 14, fontWeight: '700', flex: 1 },
  dishCategory: { fontSize: 11, marginTop: 2 },
  dishPrice:    { fontSize: 15, fontWeight: '800', marginTop: 4 },
  availBadge: {
    alignSelf:       'flex-start',
    borderRadius:    6,
    paddingVertical:  2,
    paddingHorizontal: 6,
    marginTop:       4,
  },
  dishActions: { gap: 6, alignItems: 'center' },
  iconBtn: {
    width:          32,
    height:         32,
    borderRadius:   8,
    justifyContent: 'center',
    alignItems:     'center',
  },

  // ── Modal ────────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent:  'flex-end',
  },
  formModal: {
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    borderWidth:          1,
    padding:              24,
    paddingBottom:        Platform.OS === 'ios' ? 40 : 24,
    maxHeight:            '92%',
  },
  formHeader: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    marginBottom:    16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },

  // ── Image picker ─────────────────────────────────────────────────────────────
  imagePicker: {
    height:         160,
    borderRadius:   14,
    borderWidth:    1.5,
    overflow:       'hidden',
    justifyContent: 'center',
    alignItems:     'center',
  },
  imagePreview: { width: '100%', height: '100%' },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent:  'center',
    alignItems:      'center',
    gap:             6,
  },
  imageOverlayText: {
    color:      '#fff',
    fontSize:   13,
    fontWeight: '700',
  },
  imagePlaceholder: {
    alignItems: 'center',
    gap:        6,
    padding:    20,
  },
  imagePlaceholderText: { fontSize: 14, fontWeight: '600' },
  imagePlaceholderSub:  { fontSize: 11 },
  imageStatusRow: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    marginTop:       8,
  },
  imageStatusBadge: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              4,
    paddingVertical:   4,
    paddingHorizontal: 8,
    borderRadius:      6,
  },
  imageStatusText:  { fontSize: 12, fontWeight: '600' },
  removePhotoText:  { fontSize: 12, fontWeight: '700' },

  // ── Fields ───────────────────────────────────────────────────────────────────
  fieldLabel: {
    fontSize:        11,
    fontWeight:      '600',
    letterSpacing:   0.5,
    textTransform:   'uppercase',
    marginBottom:    6,
  },
  inputBox: {
    flexDirection:    'row',
    alignItems:       'center',
    borderRadius:     10,
    borderWidth:      1.5,
    paddingHorizontal: 12,
    paddingVertical:  Platform.OS === 'ios' ? 12 : 9,
  },

  // ── Chips ────────────────────────────────────────────────────────────────────
  chipRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipBtn: {
    paddingVertical:   6,
    paddingHorizontal: 12,
    borderRadius:      20,
    borderWidth:       1.5,
  },
  chipText: { fontSize: 12, fontWeight: '600' },

  // ── Toggles ──────────────────────────────────────────────────────────────────
  toggleRow: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    borderBottomWidth: 1,
    paddingVertical:  12,
    marginBottom:     4,
  },

  // ── Error ────────────────────────────────────────────────────────────────────
  errorBox: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              6,
    borderRadius:     8,
    borderWidth:      1,
    padding:          10,
    marginBottom:     12,
    marginTop:        4,
  },
  errorText: { fontSize: 13, fontWeight: '600', flex: 1 },

  // ── Modal actions ────────────────────────────────────────────────────────────
  modalActions: {
    flexDirection: 'row',
    gap:           10,
    marginTop:     12,
  },
  modalBtn: {
    flex:           1,
    alignItems:     'center',
    borderRadius:   12,
    paddingVertical: 14,
    justifyContent: 'center',
  },
});