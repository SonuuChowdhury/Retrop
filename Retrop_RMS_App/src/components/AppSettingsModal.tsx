import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { getBaseUrl, getProductKey, updateApiConfig } from '@/config/api';

interface AppSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AppSettingsModal({ visible, onClose }: AppSettingsModalProps) {
  const { theme } = useTheme();

  // Field states
  const [urlInput, setUrlInput] = useState('');
  const [keyInput, setKeyInput] = useState('');

  // Editing states (true if showing TextInput, false if showing dots)
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);

  // Backup references for cancel/restore
  const originalUrlRef = useRef('');
  const originalKeyRef = useRef('');

  // Testing connection states
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Load configuration on mount/open
  useEffect(() => {
    if (visible) {
      const savedUrl = getBaseUrl();
      const savedKey = getProductKey();

      originalUrlRef.current = savedUrl;
      originalKeyRef.current = savedKey;

      setUrlInput(savedUrl);
      setKeyInput(savedKey);

      // If already configured, show dots instead of input
      setIsEditingUrl(!savedUrl);
      setIsEditingKey(!savedKey);

      setTestResult(null);
    }
  }, [visible]);

  const handleTestConnection = async () => {
    setTestResult(null);

    // Validate inputs
    let testUrl = urlInput.trim().replace(/\/+$/, '');
    if (testUrl && !/^https?:\/\//i.test(testUrl)) {
      testUrl = `https://${testUrl}`;
    }
    const testKey = keyInput.trim();

    if (!testUrl) {
      setTestResult({ success: false, message: 'Server URL is required' });
      return;
    }
    if (!testKey) {
      setTestResult({ success: false, message: 'Product Key is required' });
      return;
    }

    setIsTesting(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(`${testUrl}/api/public/restaurant-info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'X-Product-Key': testKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const json = await response.json();

      if (response.status === 200 && json.status === 'success') {
        const restaurantName = json.data?.restaurantName || 'Restaurant';
        setTestResult({
          success: true,
          message: `✓ Connection successful!\nRestaurant: ${restaurantName}`,
        });
      } else {
        const errorMsg = json.message || `Server returned status ${response.status}`;
        setTestResult({
          success: false,
          message: `✗ Connection failed: ${errorMsg}`,
        });
      }
    } catch (err: any) {
      let msg = 'Could not reach server';
      if (err.name === 'AbortError') {
        msg = 'Connection timed out';
      } else if (err.message) {
        msg = err.message;
      }
      setTestResult({
        success: false,
        message: `✗ Connection failed: ${msg}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    let finalUrl = urlInput.trim().replace(/\/+$/, '');
    if (finalUrl && !/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }
    const finalKey = keyInput.trim();

    if (!finalUrl || !finalKey) {
      setTestResult({ success: false, message: 'Both URL and Product Key are required to save.' });
      return;
    }

    try {
      await updateApiConfig(finalUrl, finalKey);
      onClose();
    } catch (err: any) {
      setTestResult({ success: false, message: `Failed to save configuration: ${err.message}` });
    }
  };

  const handleCancelUrlEdit = () => {
    setUrlInput(originalUrlRef.current);
    setIsEditingUrl(false);
  };

  const handleCancelKeyEdit = () => {
    setKeyInput(originalKeyRef.current);
    setIsEditingKey(false);
  };

  const handleClose = () => {
    // Restore states
    setUrlInput(originalUrlRef.current);
    setKeyInput(originalKeyRef.current);
    onClose();
  };

  const c = theme.colors;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modalContainer, { backgroundColor: c.background, borderColor: c.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: c.border }]}>
            <View style={styles.headerTitleContainer}>
              <MaterialCommunityIcons name="cog" size={24} color={c.primary} />
              <Text style={[styles.headerTitle, { color: c.text }]}>Retrop Configuration</Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialCommunityIcons name="close" size={24} color={c.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Text style={[styles.introText, { color: c.textSecondary }]}>
              Configure the connection settings to your restaurant server instance.
            </Text>

            {/* Server URL Config */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: c.textSecondary }]}>Server URL</Text>
                {!isEditingUrl && originalUrlRef.current ? (
                  <TouchableOpacity
                    onPress={() => {
                      setUrlInput('');
                      setIsEditingUrl(true);
                    }}
                    style={styles.changeButton}
                  >
                    <MaterialCommunityIcons name="pencil" size={14} color={c.primary} />
                    <Text style={[styles.changeButtonText, { color: c.primary }]}>Change</Text>
                  </TouchableOpacity>
                ) : isEditingUrl && originalUrlRef.current ? (
                  <TouchableOpacity onPress={handleCancelUrlEdit} style={styles.changeButton}>
                    <Text style={[styles.changeButtonText, { color: c.textSecondary }]}>Cancel</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {!isEditingUrl ? (
                <View style={[styles.maskedContainer, { backgroundColor: c.inputBackground, borderColor: c.border }]}>
                  <Text style={[styles.maskedText, { color: c.textSecondary }]}>{'•'.repeat(24)}</Text>
                  <MaterialCommunityIcons name="lock" size={16} color={c.success} style={styles.lockIcon} />
                </View>
              ) : (
                <View style={[styles.inputWrapper, { backgroundColor: c.inputBackground, borderColor: c.border }]}>
                  <MaterialCommunityIcons name="web" size={20} color={c.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: c.text }]}
                    placeholder="https://api.retrop.in"
                    placeholderTextColor={c.textSecondary + '70'}
                    value={urlInput}
                    onChangeText={setUrlInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                </View>
              )}
            </View>

            {/* Product Key Config */}
            <View style={[styles.formGroup, { marginTop: 16 }]}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: c.textSecondary }]}>Product Key</Text>
                {!isEditingKey && originalKeyRef.current ? (
                  <TouchableOpacity
                    onPress={() => {
                      setKeyInput('');
                      setIsEditingKey(true);
                    }}
                    style={styles.changeButton}
                  >
                    <MaterialCommunityIcons name="pencil" size={14} color={c.primary} />
                    <Text style={[styles.changeButtonText, { color: c.primary }]}>Change</Text>
                  </TouchableOpacity>
                ) : isEditingKey && originalKeyRef.current ? (
                  <TouchableOpacity onPress={handleCancelKeyEdit} style={styles.changeButton}>
                    <Text style={[styles.changeButtonText, { color: c.textSecondary }]}>Cancel</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {!isEditingKey ? (
                <View style={[styles.maskedContainer, { backgroundColor: c.inputBackground, borderColor: c.border }]}>
                  <Text style={[styles.maskedText, { color: c.textSecondary }]}>{'•'.repeat(24)}</Text>
                  <MaterialCommunityIcons name="lock" size={16} color={c.success} style={styles.lockIcon} />
                </View>
              ) : (
                <View style={[styles.inputWrapper, { backgroundColor: c.inputBackground, borderColor: c.border }]}>
                  <MaterialCommunityIcons name="key-outline" size={20} color={c.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: c.text }]}
                    placeholder="RETROP-XXXX-XXXX-XXXX"
                    placeholderTextColor={c.textSecondary + '70'}
                    value={keyInput}
                    onChangeText={setKeyInput}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>
              )}
            </View>

            {/* Connection Test Status banner */}
            {testResult && (
              <View
                style={[
                  styles.statusBanner,
                  {
                    backgroundColor: testResult.success ? c.success + '15' : c.error + '15',
                    borderColor: testResult.success ? c.success + '40' : c.error + '40',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={testResult.success ? 'check-circle-outline' : 'alert-circle-outline'}
                  size={20}
                  color={testResult.success ? c.success : c.error}
                />
                <Text style={[styles.statusText, { color: testResult.success ? c.success : c.error }]}>
                  {testResult.message}
                </Text>
              </View>
            )}

            {/* Test Connection Button */}
            <TouchableOpacity
              onPress={handleTestConnection}
              disabled={isTesting}
              style={[styles.testButton, { borderColor: c.primary }]}
            >
              {isTesting ? (
                <ActivityIndicator size="small" color={c.primary} />
              ) : (
                <>
                  <MaterialCommunityIcons name="connection" size={18} color={c.primary} />
                  <Text style={[styles.testButtonText, { color: c.primary }]}>Test Connection</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>

          {/* Action Footer */}
          <View style={[styles.footer, { borderTopColor: c.border }]}>
            <TouchableOpacity
              onPress={handleClose}
              style={[styles.cancelButton, { backgroundColor: c.card }]}
            >
              <Text style={[styles.cancelButtonText, { color: c.text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveButton, { backgroundColor: c.primary }]}
            >
              <Text style={[styles.saveButtonText, { color: c.buttonText }]}>Save & Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '90%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
  },
  introText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  formGroup: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  maskedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 14 : 11,
  },
  maskedText: {
    fontSize: 15,
    letterSpacing: 3,
  },
  lockIcon: {
    opacity: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 9,
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 20,
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    paddingVertical: 12,
    marginTop: 20,
    gap: 8,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1.5,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
