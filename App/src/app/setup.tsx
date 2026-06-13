// ============================================================================
// SETUP SCREEN — Server URL Configuration
// ============================================================================
// Shown on first launch or when server URL is not configured.
// The user enters the backend server base URL (e.g. ngrok URL).
// ============================================================================

import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Alert, Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { updateBaseUrl } from '@/config/api';

// ── Validate URL format ───────────────────────────────────────────────────────
function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function SetupScreen() {
  const router = useRouter();
  const [url, setUrl]           = useState('');
  const [saving, setSaving]     = useState(false);
  const [testing, setTesting]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [testOk, setTestOk]     = useState(false);

  // ── Test server connectivity before saving ─────────────────────────────────
  const handleTest = async () => {
    const trimmed = url.trim().replace(/\/+$/, '');
    if (!isValidUrl(trimmed)) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }
    setError(null);
    setTesting(true);
    setTestOk(false);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${trimmed}/`, {
        signal: controller.signal,
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      clearTimeout(timeout);

      if (res.status < 500) {
        // Any non-server-error response means server is reachable
        setTestOk(true);
      } else {
        setError(`Server returned status ${res.status}. Check if backend is running.`);
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        setError('Connection timed out. Check the URL and try again.');
      } else {
        setError('Could not reach server. Check the URL and your network connection.');
      }
    } finally {
      setTesting(false);
    }
  };

  // ── Save and proceed ──────────────────────────────────────────────────────
  const handleSave = async () => {
    const trimmed = url.trim().replace(/\/+$/, '');
    if (!isValidUrl(trimmed)) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateBaseUrl(trimmed);
      // Navigate to the login screen
      router.replace('/login');
    } catch {
      setError('Failed to save server URL. Please try again.');
      setSaving(false);
    }
  };

  const bgColor    = '#0F0F12';
  const cardBg     = '#1A1A22';
  const accent     = '#6366F1';
  const textPrimary = '#F8F8FF';
  const textMuted  = '#8B8B9E';
  const border     = '#2C2C3A';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bgColor }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.iconWrap}>
          <View style={[styles.iconBg, { backgroundColor: accent + '22' }]}>
            <MaterialCommunityIcons name="server-network" size={52} color={accent} />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.titleWrap}>
          <Text style={[styles.title, { color: textPrimary }]}>Server Setup</Text>
          <Text style={[styles.subtitle, { color: textMuted }]}>
            Enter the backend server URL to connect this app to your restaurant management system.
          </Text>
        </Animated.View>

        {/* Info box */}
        <Animated.View
          entering={FadeInDown.delay(280).duration(500)}
          style={[styles.infoBox, { backgroundColor: accent + '12', borderColor: accent + '35' }]}
        >
          <MaterialCommunityIcons name="information-outline" size={18} color={accent} />
          <Text style={[styles.infoText, { color: textMuted }]}>
            Please contact your developer or system administrator to get this server URL.{'\n'}
            This is a one-time setup required to connect to your restaurant system.
          </Text>
        </Animated.View>

        {/* Input */}
        <Animated.View entering={FadeInDown.delay(360).duration(500)} style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: textPrimary }]}>Backend Server URL</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: cardBg, borderColor: error ? '#EF4444' : testOk ? '#22C55E' : border, color: textPrimary },
            ]}
            value={url}
            onChangeText={(t) => { setUrl(t); setError(null); setTestOk(false); }}
            placeholder="https://your-server.ngrok-free.app"
            placeholderTextColor={textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            textContentType="URL"
            returnKeyType="done"
            onSubmitEditing={handleSave}
            editable={!saving}
          />

          {/* Error message */}
          {error && (
            <Animated.View entering={FadeInDown.duration(200)} style={styles.errorRow}>
              <MaterialCommunityIcons name="alert-circle" size={15} color="#EF4444" />
              <Text style={[styles.errorText, { color: '#EF4444' }]}>{error}</Text>
            </Animated.View>
          )}

          {/* Test OK message */}
          {testOk && (
            <Animated.View entering={FadeInDown.duration(200)} style={styles.errorRow}>
              <MaterialCommunityIcons name="check-circle" size={15} color="#22C55E" />
              <Text style={[styles.errorText, { color: '#22C55E' }]}>Server reachable! You can proceed.</Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* Buttons */}
        <Animated.View entering={FadeInDown.delay(440).duration(500)} style={styles.buttonRow}>
          {/* Test Connection */}
          <Pressable
            onPress={handleTest}
            disabled={saving || testing || !url.trim()}
            style={[
              styles.btnSecondary,
              { borderColor: accent, opacity: (!url.trim() || testing || saving) ? 0.5 : 1 },
            ]}
          >
            {testing ? (
              <ActivityIndicator size="small" color={accent} />
            ) : (
              <>
                <MaterialCommunityIcons name="wifi-check" size={18} color={accent} />
                <Text style={[styles.btnSecondaryText, { color: accent }]}>Test</Text>
              </>
            )}
          </Pressable>

          {/* Save & Continue */}
          <Pressable
            onPress={handleSave}
            disabled={saving || !url.trim()}
            style={[
              styles.btnPrimary,
              { backgroundColor: accent, opacity: (!url.trim() || saving) ? 0.6 : 1 },
            ]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.btnPrimaryText}>Save & Continue</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
              </>
            )}
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).duration(400)}>
          <Text style={[styles.hint, { color: textMuted }]}>
            You can change this URL later from the app settings.
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
    gap: 24,
  },
  iconWrap: { alignItems: 'center' },
  iconBg: {
    width: 96,
    height: 96,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrap: { alignItems: 'center', gap: 8 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, fontWeight: '500' },

  infoBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  infoText: { fontSize: 13.5, lineHeight: 20, fontWeight: '500', flex: 1 },

  inputSection: { gap: 8 },
  inputLabel: { fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
  input: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '500',
  },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { fontSize: 13, fontWeight: '500', flex: 1 },

  buttonRow: { flexDirection: 'row', gap: 12 },
  btnSecondary: {
    flex: 0,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    minWidth: 80,
  },
  btnSecondaryText: { fontSize: 15, fontWeight: '700' },
  btnPrimary: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  hint: { fontSize: 12.5, textAlign: 'center', fontWeight: '500' },
});
