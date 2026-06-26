// ============================================================================
// HOME SCREEN — original design fully restored
// ============================================================================
// Added: auto-redirect if a session already exists for any role.
// Everything else is exactly as originally written.
// ============================================================================

import { StyleSheet, Text, View, Pressable, ScrollView, Linking, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenAnimationWrapper } from '@/components/ScreenAnimationWrapper';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWaiterAuth } from '@/context/WaiterAuthContext';
import { useKitchenAuth } from '@/context/KitchenAuthContext';
import AppSettingsModal from '@/components/AppSettingsModal';
import { isSetupViaScan, getRestaurantName } from '@/config/api';

export default function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showSettings, setShowSettings] = useState(false);
  const [isConfiguredByScan, setIsConfiguredByScan] = useState<boolean>(false);

  const { isAuthenticated: isManagerAuth, isLoading: managerLoading } = useAuth();
  const { isAuthenticated: isWaiterAuth, isLoading: waiterLoading } = useWaiterAuth();
  const { isAuthenticated: isKitchenAuth, isLoading: kitchenLoading } = useKitchenAuth();

  const isLoading = managerLoading || waiterLoading || kitchenLoading;

  const checkConfig = async () => {
    const configured = await isSetupViaScan();
    setIsConfiguredByScan(configured);
  };

  useEffect(() => {
    checkConfig();
  }, [showSettings]);

  // Auto-redirect if a session is already active
  useEffect(() => {
    if (isLoading) return;
    if (isManagerAuth) router.replace('/manager/dashboard');
    else if (isWaiterAuth) router.replace('/waiter/dashboard');
    else if (isKitchenAuth) router.replace('/kitchen/dashboard');
  }, [isLoading, isManagerAuth, isWaiterAuth, isKitchenAuth]);

  const handleCall = () => {
    Linking.openURL('tel:8420564402');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:chowdhurysonu047@gmail.com');
  };

  // Show spinner while checking existing sessions
  if (isLoading) {
    return (
      <View style={[styles.safeArea, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // If already authenticated, return null while redirect fires
  if (isManagerAuth || isWaiterAuth || isKitchenAuth) return null;

  return (
    <ScreenAnimationWrapper>
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      >
      {/* Header with Settings */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => setShowSettings(true)}
          style={[
            styles.settingsButton,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
          android_ripple={{ color: theme.colors.primary }}
        >
          <MaterialCommunityIcons
            name="cog"
            size={24}
            color={theme.colors.primary}
          />
        </Pressable>
      </View>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo/Icon Section */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.colors.primaryLight },
          ]}
        >
          <MaterialCommunityIcons
            name="silverware-fork-knife"
            size={60}
            color={theme.colors.primary}
          />
        </View>

        {/* Title */}
        <Text style={[styles.mainTitle, { color: theme.colors.text }]}>
          {isConfiguredByScan && getRestaurantName() ? getRestaurantName() : 'Restaurant Management System'}
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {isConfiguredByScan && getRestaurantName() ? 'RMS Client for Waiters & Managers' : 'RMS Client for Waiters and Managers'}
        </Text>

        {/* Description */}
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          Streamline your restaurant operations with our comprehensive management system
        </Text>

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          <View
            style={[
              styles.featureCard,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
          >
            <MaterialCommunityIcons
              name="account-multiple"
              size={28}
              color={theme.colors.primary}
            />
            <Text style={[styles.featureText, { color: theme.colors.text }]}>
              Manage Team
            </Text>
          </View>

          <View
            style={[
              styles.featureCard,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
          >
            <MaterialCommunityIcons
              name="clipboard-list"
              size={28}
              color={theme.colors.primary}
            />
            <Text style={[styles.featureText, { color: theme.colors.text }]}>
              Track Orders
            </Text>
          </View>

          <View
            style={[
              styles.featureCard,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
          >
            <MaterialCommunityIcons
              name="chart-line"
              size={28}
              color={theme.colors.primary}
            />
            <Text style={[styles.featureText, { color: theme.colors.text }]}>
              Analytics
            </Text>
          </View>

          <View
            style={[
              styles.featureCard,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
          >
            <MaterialCommunityIcons
              name="table-furniture"
              size={28}
              color={theme.colors.primary}
            />
            <Text style={[styles.featureText, { color: theme.colors.text }]}>
              Tables
            </Text>
          </View>
        </View>

        {/* Login Button */}
        <Pressable
          onPress={() => isConfiguredByScan && router.push('/login')}
          disabled={!isConfiguredByScan}
          style={({ pressed }) => [
            styles.loginButton,
            {
              backgroundColor: isConfiguredByScan ? theme.colors.primary : '#9ca3af',
              opacity: pressed && isConfiguredByScan ? 0.8 : 1,
            },
          ]}
        >
          <Text style={[styles.loginButtonText, { color: theme.colors.buttonText }]}>
            Login
          </Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color={theme.colors.buttonText}
            style={styles.loginIcon}
          />
        </Pressable>

        {!isConfiguredByScan && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 12,
            paddingHorizontal: 16,
            gap: 6
          }}>
            <MaterialCommunityIcons name="alert-decagram" size={16} color={theme.colors.error || '#ef4444'} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.error || '#ef4444' }}>
              Setup required. Scan the Retrop QR code in Settings first.
            </Text>
          </View>
        )}

        {/* Divider */}
        <View
          style={[
            styles.divider,
            { backgroundColor: theme.colors.border },
          ]}
        />

        {/* Support Section */}
        <View style={styles.supportSection}>
          <Text style={[styles.supportTitle, { color: theme.colors.text }]}>
            Support & Contact
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Image
              source={require('../../assets/images/retrop-logo.png')}
              style={{ width: 24, height: 24, resizeMode: 'contain' }}
            />
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text }}>
              Powered by Retrop
            </Text>
          </View>

          {/* Phone */}
          <Pressable
            onPress={handleCall}
            style={({ pressed }) => [
              styles.contactRow,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <MaterialCommunityIcons
              name="phone"
              size={18}
              color={theme.colors.primary}
              style={styles.contactIcon}
            />
            <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>
              8420564402
            </Text>
          </Pressable>

          {/* Email */}
          <Pressable
            onPress={handleEmail}
            style={({ pressed }) => [
              styles.contactRow,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <MaterialCommunityIcons
              name="email"
              size={18}
              color={theme.colors.primary}
              style={styles.contactIcon}
            />
            <Text
              style={[styles.contactText, { color: theme.colors.textSecondary }]}
              numberOfLines={1}
            >
              chowdhurysonu047@gmail.com
            </Text>
          </Pressable>
        </View>

        {/* Footer */}
        <Text style={[styles.footer, { color: theme.colors.textSecondary }]}>
          © 2026 Restaurant Management System. All rights reserved.
        </Text>
      </ScrollView>
      <AppSettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />
    </SafeAreaView>
    </ScreenAnimationWrapper>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingVertical: 8,
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  featuresGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  featureCard: {
    width: '48%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  loginButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loginIcon: {
    marginLeft: 10,
  },
  divider: {
    width: '100%',
    height: 1,
    marginVertical: 24,
  },
  supportSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  developerName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  contactIcon: {
    marginRight: 12,
  },
  contactText: {
    fontSize: 14,
    flex: 1,
  },
  footer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});