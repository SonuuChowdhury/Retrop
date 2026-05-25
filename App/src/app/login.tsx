import {
  StyleSheet,
  Text,
  View,
  Pressable,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenAnimationWrapper } from '@/components/ScreenAnimationWrapper';
import { useState } from 'react';

type Role = 'waiter' | 'manager' | 'kitchen';

const ROLES: { key: Role; label: string; icon: string }[] = [
  { key: 'waiter', label: 'Waiter', icon: 'room-service-outline' },
  { key: 'manager', label: 'Manager', icon: 'account-tie-outline' },
  { key: 'kitchen', label: 'Kitchen', icon: 'chef-hat' },
];

export default function LoginScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedRole, setSelectedRole] = useState<Role>('waiter');
  const [mobile, setMobile] = useState('');
  const [uuid, setUuid] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mobileError, setMobileError] = useState('');
  const [touched, setTouched] = useState({ mobile: false, uuid: false, password: false });

  const handleRoleSwitch = (role: Role) => {
    setSelectedRole(role);
    setMobile('');
    setUuid('');
    setPassword('');
    setMobileError('');
    setShowPassword(false);
    setTouched({ mobile: false, uuid: false, password: false });
  };

  const validateMobile = (value: string) => {
    if (!value) return 'Mobile number is required';
    if (!/^\d{10}$/.test(value)) return 'Enter a valid 10-digit mobile number';
    return '';
  };

  const handleMobileChange = (value: string) => {
    // Only allow digits, max 10
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    setMobile(cleaned);
    if (touched.mobile) {
      setMobileError(validateMobile(cleaned));
    }
  };

  const handleMobileBlur = () => {
    setTouched((prev) => ({ ...prev, mobile: true }));
    setMobileError(validateMobile(mobile));
  };

  const handleSubmit = () => {
    const newTouched = { mobile: true, uuid: true, password: true };
    setTouched(newTouched);

    if (selectedRole !== 'kitchen') {
      const err = validateMobile(mobile);
      setMobileError(err);
      if (err) return;
    }

    // TODO: connect to auth API in next step
    console.log('Login pressed:', { role: selectedRole, mobile, uuid, password });
  };

  const c = theme.colors;
  const isKitchen = selectedRole === 'kitchen';

  return (
    <ScreenAnimationWrapper>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: c.background }]}>
        {/* Back Button */}
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            { marginTop: insets.top + 4, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={c.primary} />
        </Pressable>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.headerSection}>
              <View style={[styles.logoCircle, { backgroundColor: c.primary + '18' }]}>
                <MaterialCommunityIcons
                  name={
                    selectedRole === 'waiter'
                      ? 'room-service-outline'
                      : selectedRole === 'manager'
                      ? 'account-tie-outline'
                      : 'chef-hat'
                  }
                  size={36}
                  color={c.primary}
                />
              </View>
              <Text style={[styles.greeting, { color: c.text }]}>Welcome Back</Text>
              <Text style={[styles.subGreeting, { color: c.textSecondary }]}>
                Sign in to continue
              </Text>
            </View>

            {/* Role Switcher Bar */}
            <View style={[styles.roleSwitcher, { backgroundColor: c.card, borderColor: c.border }]}>
              {ROLES.map((role, idx) => {
                const isActive = selectedRole === role.key;
                return (
                  <TouchableOpacity
                    key={role.key}
                    onPress={() => handleRoleSwitch(role.key)}
                    activeOpacity={0.85}
                    style={[
                      styles.roleTab,
                      idx === 0 && styles.roleTabFirst,
                      idx === ROLES.length - 1 && styles.roleTabLast,
                      isActive && [styles.roleTabActive, { backgroundColor: c.primary }],
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={role.icon as any}
                      size={16}
                      color={isActive ? '#FFFFFF' : c.textSecondary}
                      style={{ marginRight: 5 }}
                    />
                    <Text
                      style={[
                        styles.roleTabText,
                        { color: isActive ? '#FFFFFF' : c.textSecondary },
                        isActive && styles.roleTabTextActive,
                      ]}
                    >
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Form Card */}
            <View
              style={[
                styles.formCard,
                { backgroundColor: c.card, borderColor: c.border },
              ]}
            >
              {/* Mobile / UUID Field */}
              {!isKitchen ? (
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: c.textSecondary }]}>Mobile Number</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: c.inputBackground,
                        borderColor: mobileError && touched.mobile ? c.error : c.border,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="phone-outline"
                      size={20}
                      color={mobile ? c.primary : c.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: c.text }]}
                      placeholder="Enter 10-digit mobile"
                      placeholderTextColor={c.textSecondary + '80'}
                      keyboardType="number-pad"
                      maxLength={10}
                      value={mobile}
                      onChangeText={handleMobileChange}
                      onBlur={handleMobileBlur}
                      returnKeyType="next"
                    />
                    {mobile.length === 10 && !mobileError && (
                      <MaterialCommunityIcons name="check-circle" size={18} color={c.success} />
                    )}
                  </View>
                  {mobileError && touched.mobile && (
                    <View style={styles.errorRow}>
                      <MaterialCommunityIcons name="alert-circle-outline" size={13} color={c.error} />
                      <Text style={[styles.errorText, { color: c.error }]}>{mobileError}</Text>
                    </View>
                  )}
                  {!mobileError && mobile.length > 0 && (
                    <Text style={[styles.charCount, { color: c.textSecondary }]}>
                      {mobile.length}/10
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: c.textSecondary }]}>Kitchen UUID</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      { backgroundColor: c.inputBackground, borderColor: c.border },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="identifier"
                      size={20}
                      color={uuid ? c.primary : c.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: c.text }]}
                      placeholder="Enter kitchen UUID"
                      placeholderTextColor={c.textSecondary + '80'}
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={uuid}
                      onChangeText={setUuid}
                      returnKeyType="next"
                    />
                  </View>
                </View>
              )}

              {/* Password Field */}
              <View style={[styles.fieldGroup, { marginTop: 16 }]}>
                <Text style={[styles.label, { color: c.textSecondary }]}>Password</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    { backgroundColor: c.inputBackground, borderColor: c.border },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={20}
                    color={password ? c.primary : c.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: c.text }]}
                    placeholder="Enter your password"
                    placeholderTextColor={c.textSecondary + '80'}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={c.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Login Button */}
            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.loginButton,
                { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={[styles.loginButtonText, { color: c.buttonText }]}>
                Sign In as {ROLES.find((r) => r.key === selectedRole)?.label}
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color={c.buttonText} />
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenAnimationWrapper>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backButton: {
    padding: 12,
    marginLeft: 8,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // Header
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 8,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subGreeting: {
    fontSize: 14,
    marginTop: 4,
  },

  // Role Switcher
  roleSwitcher: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 4,
  },
  roleTabFirst: {
    borderTopLeftRadius: 11,
    borderBottomLeftRadius: 11,
  },
  roleTabLast: {
    borderTopRightRadius: 11,
    borderBottomRightRadius: 11,
  },
  roleTabActive: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  roleTabTextActive: {
    fontWeight: '700',
  },

  // Form Card
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  fieldGroup: {
    // spacing handled per instance
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
    margin: 0,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  charCount: {
    fontSize: 11,
    marginTop: 5,
    textAlign: 'right',
  },

  // Login Button
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 15,
    gap: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});