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
import { getBaseUrl, getProductKey, updateApiConfig, getDecryptionPrivateKey } from '@/config/api';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface AppSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AppSettingsModal({ visible, onClose }: AppSettingsModalProps) {
  const { theme } = useTheme();

  // Field states
  const [urlInput, setUrlInput] = useState('');
  const [keyInput, setKeyInput] = useState('');

  // Backup references for cancel/restore
  const originalUrlRef = useRef('');
  const originalKeyRef = useRef('');

  // Testing connection states
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // QR Scanning States
  const [isScanning, setIsScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessingScan, setIsProcessingScan] = useState(false);

  // Load configuration on mount/open
  useEffect(() => {
    if (visible) {
      const savedUrl = getBaseUrl();
      const savedKey = getProductKey();

      originalUrlRef.current = savedUrl;
      originalKeyRef.current = savedKey;

      setUrlInput(savedUrl);
      setKeyInput(savedKey);

      setTestResult(null);
      setIsScanning(false);
      setIsProcessingScan(false);
    }
  }, [visible]);

  // Helper: Decode base64 to bytes
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const base64Lookup = new Uint8Array(256);
  for (let i = 0; i < base64Chars.length; i++) {
    base64Lookup[base64Chars.charCodeAt(i)] = i;
  }

  const base64ToBytes = (base64: string): Uint8Array => {
    const cleaned = base64.replace(/=+$/, '').replace(/\s/g, '');
    const len = cleaned.length;
    const bufferLength = len * 0.75;
    const bytes = new Uint8Array(Math.floor(bufferLength));
    let p = 0;
    for (let i = 0; i < len; i += 4) {
      const encoded1 = base64Lookup[cleaned.charCodeAt(i)] || 0;
      const encoded2 = base64Lookup[cleaned.charCodeAt(i + 1)] || 0;
      const encoded3 = base64Lookup[cleaned.charCodeAt(i + 2)] || 0;
      const encoded4 = base64Lookup[cleaned.charCodeAt(i + 3)] || 0;

      if (p < bytes.length) bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
      if (p < bytes.length) bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      if (p < bytes.length) bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
    return bytes;
  };

  // Helper: Decode UTF-8 bytes to string
  const utf8ToString = (bytes: Uint8Array): string => {
    let out = '';
    let i = 0;
    const len = bytes.length;
    while (i < len) {
      const c = bytes[i++];
      if (c < 128) {
        out += String.fromCharCode(c);
      } else if (c > 191 && c < 224) {
        out += String.fromCharCode(((c & 31) << 6) | (bytes[i++] & 63));
      } else {
        out += String.fromCharCode(((c & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63));
      }
    }
    return out;
  };

  const startScanning = async () => {
    setTestResult(null);
    if (!permission || !permission.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        alert('Camera permission is required to scan the setup QR code.');
        return;
      }
    }
    setIsScanning(true);
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (isProcessingScan) return;
    setIsProcessingScan(true);
    setTestResult(null);
    setIsTesting(true);

    try {
      // Decode and validate payload size
      const bytes = base64ToBytes(data);
      if (bytes.length > 2000) {
        throw new Error('Payload size is too large.');
      }

      // Fetch private key
      const privateKeyHex = await getDecryptionPrivateKey();
      const privateKeyBytes = new Uint8Array(
        privateKeyHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
      );

      // Decrypt using ECIES default curve (secp256k1)
      const ecies = require('eciesjs');
      const { decrypt: eciesDecrypt } = ecies;

      const decryptedBytes = eciesDecrypt(privateKeyBytes, bytes);
      const decryptedText = utf8ToString(decryptedBytes);

      const parsed = JSON.parse(decryptedText);
      if (!Array.isArray(parsed) || parsed.length < 2) {
        throw new Error('Invalid setup payload structure.');
      }

      const [scannedUrl, scannedProductKey] = parsed;
      let testUrl = scannedUrl.trim().replace(/\/+$/, '');
      if (testUrl && !/^https?:\/\//i.test(testUrl)) {
        testUrl = `https://${testUrl}`;
      }
      const testKey = scannedProductKey.trim();

      // Make connection test API call to verify URL and Key on active server
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
        
        // Save dynamically verified config
        await updateApiConfig(testUrl, testKey, true);
        
        setUrlInput(testUrl);
        setKeyInput(testKey);
        originalUrlRef.current = testUrl;
        originalKeyRef.current = testKey;
        setIsScanning(false);

        setTestResult({
          success: true,
          message: `✓ Setup Successful!\nRestaurant: ${restaurantName}`,
        });
      } else {
        const errorMsg = json.message || `Server status ${response.status}`;
        setTestResult({
          success: false,
          message: `✗ Invalid QR code or server verification failed: ${errorMsg}`,
        });
      }
    } catch (err: any) {
      console.error('[Scan Error]', err.message);
      setTestResult({
        success: false,
        message: '✗ Invalid or unauthorized QR code.',
      });
    } finally {
      setIsTesting(false);
      setIsProcessingScan(false);
    }
  };

  const handleTestConnection = async () => {
    setTestResult(null);

    let testUrl = urlInput.trim().replace(/\/+$/, '');
    if (testUrl && !/^https?:\/\//i.test(testUrl)) {
      testUrl = `https://${testUrl}`;
    }
    const testKey = keyInput.trim();

    if (!testUrl || !testKey) {
      setTestResult({ success: false, message: 'App is not configured. Please scan a setup QR code first.' });
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
          message: `✓ Connection verified!\nRestaurant: ${restaurantName}`,
        });
      } else {
        const errorMsg = json.message || `Server status ${response.status}`;
        setTestResult({
          success: false,
          message: `✗ Connection failed: ${errorMsg}`,
        });
      }
    } catch (err: any) {
      let msg = 'Could not reach server';
      if (err.name === 'AbortError') msg = 'Connection timed out';
      else if (err.message) msg = err.message;
      setTestResult({
        success: false,
        message: `✗ Connection failed: ${msg}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!urlInput || !keyInput) {
      setTestResult({ success: false, message: 'Please scan the setup QR code to configure the app.' });
      return;
    }

    try {
      // Ensure setup via scan is stored as true since manual edit is disabled
      await updateApiConfig(urlInput, keyInput, true);
      onClose();
    } catch (err: any) {
      setTestResult({ success: false, message: `Failed to save configuration: ${err.message}` });
    }
  };

  const handleClose = () => {
    // Restore inputs to original saved values
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
          {isScanning ? (
            <View style={{ flex: 1, minHeight: 400 }}>
              {/* Scan Header */}
              <View style={[styles.header, { borderBottomColor: c.border }]}>
                <View style={styles.headerTitleContainer}>
                  <MaterialCommunityIcons name="camera" size={24} color={c.primary} />
                  <Text style={[styles.headerTitle, { color: c.text }]}>Scan Setup QR Code</Text>
                </View>
                <TouchableOpacity onPress={() => setIsScanning(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <MaterialCommunityIcons name="close" size={24} color={c.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Camera Scanner */}
              <View style={{ flex: 1, overflow: 'hidden' }}>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  onBarcodeScanned={isProcessingScan ? undefined : handleBarcodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                />
                {/* Target Guide HUD Overlay */}
                <View style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'rgba(0,0,0,0.4)'
                }}>
                  <View style={{
                    width: 250, height: 250,
                    borderWidth: 2, borderColor: c.primary,
                    borderRadius: 16, backgroundColor: 'transparent'
                  }} />
                  <Text style={{
                    color: 'white', fontWeight: '600', fontSize: 13,
                    marginTop: 16, backgroundColor: 'rgba(0,0,0,0.6)',
                    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20
                  }}>
                    Align Retrop QR Code within frame
                  </Text>
                </View>
              </View>

              {/* Scan Footer */}
              <View style={[styles.footer, { borderTopColor: c.border }]}>
                <TouchableOpacity
                  onPress={() => setIsScanning(false)}
                  style={[styles.cancelButton, { backgroundColor: c.card, flex: 1 }]}
                >
                  <Text style={[styles.cancelButtonText, { color: c.text }]}>Cancel Scan</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
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
                  </View>
                  <View style={[styles.maskedContainer, { backgroundColor: c.inputBackground, borderColor: c.border }]}>
                    <Text style={[styles.maskedText, { color: c.textSecondary }]} numberOfLines={1}>
                      {urlInput ? '•'.repeat(Math.min(24, urlInput.length)) : 'Not Configured'}
                    </Text>
                    <MaterialCommunityIcons name="lock" size={16} color={urlInput ? c.success : c.textSecondary} style={styles.lockIcon} />
                  </View>
                </View>

                {/* Product Key Config */}
                <View style={[styles.formGroup, { marginTop: 16 }]}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: c.textSecondary }]}>Product Key</Text>
                    <TouchableOpacity
                      onPress={startScanning}
                      style={styles.changeButton}
                    >
                      <MaterialCommunityIcons name="camera" size={14} color={c.primary} />
                      <Text style={[styles.changeButtonText, { color: c.primary }]}>Scan Setup QR</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.maskedContainer, { backgroundColor: c.inputBackground, borderColor: c.border }]}>
                    <Text style={[styles.maskedText, { color: c.textSecondary }]} numberOfLines={1}>
                      {keyInput ? '•'.repeat(Math.min(24, keyInput.length)) : 'Not Configured'}
                    </Text>
                    <MaterialCommunityIcons name="lock" size={16} color={keyInput ? c.success : c.textSecondary} style={styles.lockIcon} />
                  </View>
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
            </>
          )}
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
