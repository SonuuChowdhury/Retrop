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
import Constants from 'expo-constants';
import { useTheme } from '@/context/ThemeContext';
import {
  getBaseUrl,
  getProductKey,
  getRestaurantName,
  updateApiConfig,
  updateRestaurantName,
  getDecryptionPrivateKey,
  isSetupViaScan,
  resetApiConfig,
} from '@/config/api';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface AppSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

type ViewState = 'list' | 'auth' | 'theme';

export default function AppSettingsModal({ visible, onClose }: AppSettingsModalProps) {
  const { theme, themePreference, setThemePreference } = useTheme();

  // Navigation states
  const [currentView, setCurrentView] = useState<ViewState>('list');

  // Configuration states
  const [urlInput, setUrlInput] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [restName, setRestName] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  // Backup references for restore on cancel
  const originalUrlRef = useRef('');
  const originalKeyRef = useRef('');
  const originalNameRef = useRef('');

  // Scanning / Testing states
  const [isScanning, setIsScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  // Custom dialogs/banners states
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [errorDialogMsg, setErrorDialogMsg] = useState<string | null>(null);

  // Load configuration on open
  useEffect(() => {
    if (visible) {
      const savedUrl = getBaseUrl();
      const savedKey = getProductKey();
      const savedName = getRestaurantName();

      originalUrlRef.current = savedUrl;
      originalKeyRef.current = savedKey;
      originalNameRef.current = savedName;

      setUrlInput(savedUrl);
      setKeyInput(savedKey);
      setRestName(savedName);

      setIsConfigured(savedUrl.length > 4 && savedKey.length > 4);

      setCurrentView('list');
      setIsScanning(false);
      setIsProcessingScan(false);
      setIsTesting(false);
      setTestResult(null);
      setErrorDialogMsg(null);
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
        setErrorDialogMsg('Camera permission is required to scan the setup QR code.');
        return;
      }
    }
    setIsScanning(true);
    setIsProcessingScan(false);
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
        throw new Error('Payload data is corrupted or too large.');
      }

      // Fetch private key from storage/SecureStore
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
        const fetchedName = json.data.restaurantName || 'Retrop Partner';

        // Persist Configuration
        await updateApiConfig(testUrl, testKey, true);
        await updateRestaurantName(fetchedName);

        // Update local state
        setUrlInput(testUrl);
        setKeyInput(testKey);
        setRestName(fetchedName);
        setIsConfigured(true);

        originalUrlRef.current = testUrl;
        originalKeyRef.current = testKey;
        originalNameRef.current = fetchedName;

        setIsScanning(false);
        setIsProcessingScan(false);
        setIsTesting(false);
        setTestResult({
          success: true,
          message: `✓ Setup successful! Connected to ${fetchedName}.`,
        });
      } else {
        throw new Error(json.message || `Server status ${response.status}`);
      }
    } catch (err: any) {
      console.error('[Scan Error]', err.message);
      setIsTesting(false);
      setIsProcessingScan(false);
      setIsScanning(false);
      setErrorDialogMsg(`Invalid QR Code:\n${err.message || 'Verification failed.'}`);
    }
  };

  const handleReset = async () => {
    try {
      await resetApiConfig();
      setUrlInput('');
      setKeyInput('');
      setRestName('');
      setIsConfigured(false);
      setTestResult(null);
    } catch (err: any) {
      setErrorDialogMsg(`Failed to reset configuration: ${err.message}`);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const getThemeText = () => {
    if (themePreference === 'light') return 'Light';
    if (themePreference === 'dark') return 'Dark';
    return 'Default';
  };

  const c = theme.colors;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modalContainer, { backgroundColor: c.background, borderColor: c.border }]}>
          
          {/* CAMERA SCANNING MODE */}
          {isScanning ? (
            <View style={{ flex: 1, minHeight: 400 }}>
              <View style={[styles.header, { borderBottomColor: c.border }]}>
                <View style={styles.headerTitleContainer}>
                  <MaterialCommunityIcons name="camera" size={24} color={c.primary} />
                  <Text style={[styles.headerTitle, { color: c.text }]}>Scan Setup QR Code</Text>
                </View>
                <TouchableOpacity onPress={() => setIsScanning(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <MaterialCommunityIcons name="close" size={24} color={c.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1, overflow: 'hidden' }}>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  onBarcodeScanned={isProcessingScan ? undefined : handleBarcodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                />
                <View style={styles.scannerOverlay}>
                  <View style={[styles.scannerFrame, { borderColor: c.primary }]} />
                  <Text style={styles.scannerInstructions}>
                    Align Retrop QR Code within frame
                  </Text>
                </View>
              </View>

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
              {/* HEADER CONTAINER */}
              <View style={[styles.header, { borderBottomColor: c.border }]}>
                <View style={styles.headerTitleContainer}>
                  {currentView !== 'list' ? (
                    <TouchableOpacity 
                      onPress={() => setCurrentView('list')}
                      style={styles.backButton}
                    >
                      <MaterialCommunityIcons name="chevron-left" size={28} color={c.primary} />
                    </TouchableOpacity>
                  ) : (
                    <MaterialCommunityIcons name="cog" size={24} color={c.primary} />
                  )}
                  <Text style={[styles.headerTitle, { color: c.text }]}>
                    {currentView === 'auth' 
                      ? 'App Authentication' 
                      : currentView === 'theme' 
                      ? 'Theme & Appearance' 
                      : 'App Settings'}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <MaterialCommunityIcons name="close" size={24} color={c.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                
                {/* 1. SETTINGS LIST VIEW */}
                {currentView === 'list' && (
                  <View style={styles.listContainer}>
                    <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>
                      General Settings
                    </Text>

                    {/* App Authentication Option */}
                    <TouchableOpacity
                      style={[styles.listItem, { backgroundColor: c.card, borderColor: c.border }]}
                      onPress={() => setCurrentView('auth')}
                      activeOpacity={0.7}
                    >
                      <View style={styles.listItemLeft}>
                        <View style={[styles.listIconCircle, { backgroundColor: c.primary + '18' }]}>
                          <MaterialCommunityIcons name="shield-key-outline" size={22} color={c.primary} />
                        </View>
                        <View style={styles.listItemTextContainer}>
                          <Text style={[styles.listItemTitle, { color: c.text }]} numberOfLines={1}>App Authentication</Text>
                          <Text style={[styles.listItemDesc, { color: c.textSecondary }]} numberOfLines={1}>
                            {isConfigured ? 'App is set up & secured' : 'Scan setup QR code to connect'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.listItemRight}>
                        {isConfigured ? (
                          <View style={[styles.statusTag, { backgroundColor: c.success + '20' }]}>
                            <Text style={[styles.statusTagText, { color: c.success }]}>Active</Text>
                          </View>
                        ) : (
                          <View style={[styles.statusTag, { backgroundColor: c.error + '20' }]}>
                            <Text style={[styles.statusTagText, { color: c.error }]}>Setup Required</Text>
                          </View>
                        )}
                        <MaterialCommunityIcons name="chevron-right" size={24} color={c.textSecondary} />
                      </View>
                    </TouchableOpacity>

                    {/* Theme Preference Settings Option */}
                    <TouchableOpacity
                      style={[styles.listItem, { backgroundColor: c.card, borderColor: c.border }]}
                      onPress={() => setCurrentView('theme')}
                      activeOpacity={0.7}
                    >
                      <View style={styles.listItemLeft}>
                        <View style={[styles.listIconCircle, { backgroundColor: c.primary + '18' }]}>
                          <MaterialCommunityIcons name="palette-outline" size={22} color={c.primary} />
                        </View>
                        <View style={styles.listItemTextContainer}>
                          <Text style={[styles.listItemTitle, { color: c.text }]} numberOfLines={1}>Appearance & Theme</Text>
                          <Text style={[styles.listItemDesc, { color: c.textSecondary }]} numberOfLines={1}>
                            Set screen theme preferences
                          </Text>
                        </View>
                      </View>
                      <View style={styles.listItemRight}>
                        <Text style={[styles.versionText, { color: c.textSecondary, marginRight: 4 }]}>
                          {getThemeText()}
                        </Text>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={c.textSecondary} />
                      </View>
                    </TouchableOpacity>

                    <View style={styles.aboutContainer}>
                      <Text style={[styles.aboutText, { color: c.textSecondary }]}>Retrop RMS v{Constants.expoConfig?.version || '1.0.0'}</Text>
                      <Text style={[styles.aboutSubText, { color: c.textSecondary }]}>Secured Restaurant Client</Text>
                    </View>
                  </View>
                )}

                {/* 2. APP AUTHENTICATION DETAIL VIEW */}
                {currentView === 'auth' && (
                  <View style={styles.authContainer}>
                    
                    {/* Setup Banner */}
                    <View style={styles.authIntroSection}>
                      <View style={[styles.shieldCircle, { backgroundColor: isConfigured ? c.success + '18' : c.primary + '18' }]}>
                        <MaterialCommunityIcons 
                          name={isConfigured ? "check-decagram-outline" : "qrcode-scan"} 
                          size={48} 
                          color={isConfigured ? c.success : c.primary} 
                        />
                      </View>
                      <Text style={[styles.authIntroTitle, { color: c.text }]}>
                        {isConfigured ? 'Device Configured' : 'Setup Required'}
                      </Text>
                      <Text style={[styles.authIntroDesc, { color: c.textSecondary }]}>
                        {isConfigured 
                          ? 'This client is successfully authenticated and registered with the restaurant server instance.' 
                          : 'You must scan the encrypted setup QR code from your Retrop Restaurant Admin Portal to link this client.'}
                      </Text>
                    </View>

                    {/* Loader */}
                    {isTesting && (
                      <View style={[styles.authCard, { backgroundColor: c.card, borderColor: c.border, alignItems: 'center', padding: 24 }]}>
                        <ActivityIndicator size="large" color={c.primary} />
                        <Text style={[styles.loaderText, { color: c.text, marginTop: 12 }]}>
                          Verifying credentials with server...
                        </Text>
                      </View>
                    )}

                    {/* Config Details */}
                    {!isTesting && isConfigured && (
                      <View style={[styles.authCard, { backgroundColor: c.card, borderColor: c.border }]}>
                        <Text style={[styles.cardHeader, { color: c.textSecondary }]}>Configuration Details</Text>
                        
                        <View style={styles.detailRow}>
                          <Text style={[styles.detailLabel, { color: c.textSecondary }]}>Restaurant</Text>
                          <Text style={[styles.detailValue, { color: c.text }]}>{restName || 'Retrop Partner'}</Text>
                        </View>
                        
                        <View style={[styles.divider, { backgroundColor: c.border }]} />

                        <View style={styles.detailRow}>
                          <Text style={[styles.detailLabel, { color: c.textSecondary }]}>Product Key</Text>
                          <View style={styles.maskedValueContainer}>
                            <Text style={[styles.maskedValueText, { color: c.textSecondary }]}>
                              {'•'.repeat(24)}
                            </Text>
                            <MaterialCommunityIcons name="lock" size={14} color={c.success} style={styles.lockIcon} />
                          </View>
                        </View>

                        <View style={[styles.divider, { backgroundColor: c.border }]} />

                        <View style={styles.detailRow}>
                          <Text style={[styles.detailLabel, { color: c.textSecondary }]}>Status</Text>
                          <Text style={[styles.detailValue, { color: c.success, fontWeight: '700' }]}>Linked & Active</Text>
                        </View>
                      </View>
                    )}

                    {/* Test Banner */}
                    {!isTesting && testResult && (
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

                    {/* Action buttons */}
                    {!isTesting && (
                      <View style={styles.authButtonsContainer}>
                        {isConfigured ? (
                          <>
                            <TouchableOpacity
                              onPress={startScanning}
                              style={[styles.scanButton, { backgroundColor: c.primary }]}
                            >
                              <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
                              <Text style={styles.scanButtonText}>Re-authenticate App</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={handleReset}
                              style={[styles.resetButton, { borderColor: c.error }]}
                            >
                              <MaterialCommunityIcons name="trash-can-outline" size={18} color={c.error} />
                              <Text style={[styles.resetButtonText, { color: c.error }]}>Reset Device Config</Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <TouchableOpacity
                            onPress={startScanning}
                            style={[styles.scanButton, { backgroundColor: c.primary }]}
                          >
                            <MaterialCommunityIcons name="qrcode-scan" size={20} color="#FFFFFF" />
                            <Text style={styles.scanButtonText}>Scan Setup QR Code</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                  </View>
                )}

                {/* 3. THEME SELECTION VIEW */}
                {currentView === 'theme' && (
                  <View style={styles.listContainer}>
                    <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>
                      Theme Mode Settings
                    </Text>

                    {/* Radio Button Options */}
                    
                    {/* Option 1: Light Mode */}
                    <TouchableOpacity
                      style={[
                        styles.themeRadioItem, 
                        { backgroundColor: c.card, borderColor: themePreference === 'light' ? c.primary : c.border }
                      ]}
                      onPress={() => setThemePreference('light')}
                      activeOpacity={0.7}
                    >
                      <View style={styles.themeRadioLeft}>
                        <View style={[styles.listIconCircle, { backgroundColor: '#FFA000' + '18' }]}>
                          <MaterialCommunityIcons name="weather-sunny" size={24} color="#FFA000" />
                        </View>
                        <Text style={[styles.themeRadioTitle, { color: c.text }]}>Light</Text>
                      </View>
                      <View style={[styles.radioCircle, { borderColor: themePreference === 'light' ? c.primary : c.textSecondary }]}>
                        {themePreference === 'light' && <View style={[styles.radioCircleFilled, { backgroundColor: c.primary }]} />}
                      </View>
                    </TouchableOpacity>

                    {/* Option 2: Dark Mode */}
                    <TouchableOpacity
                      style={[
                        styles.themeRadioItem, 
                        { backgroundColor: c.card, borderColor: themePreference === 'dark' ? c.primary : c.border }
                      ]}
                      onPress={() => setThemePreference('dark')}
                      activeOpacity={0.7}
                    >
                      <View style={styles.themeRadioLeft}>
                        <View style={[styles.listIconCircle, { backgroundColor: '#8E24AA' + '18' }]}>
                          <MaterialCommunityIcons name="moon-waning-crescent" size={24} color="#8E24AA" />
                        </View>
                        <Text style={[styles.themeRadioTitle, { color: c.text }]}>Dark</Text>
                      </View>
                      <View style={[styles.radioCircle, { borderColor: themePreference === 'dark' ? c.primary : c.textSecondary }]}>
                        {themePreference === 'dark' && <View style={[styles.radioCircleFilled, { backgroundColor: c.primary }]} />}
                      </View>
                    </TouchableOpacity>

                    {/* Option 3: System Default */}
                    <TouchableOpacity
                      style={[
                        styles.themeRadioItem, 
                        { backgroundColor: c.card, borderColor: themePreference === 'system' ? c.primary : c.border }
                      ]}
                      onPress={() => setThemePreference('system')}
                      activeOpacity={0.7}
                    >
                      <View style={styles.themeRadioLeft}>
                        <View style={[styles.listIconCircle, { backgroundColor: c.primary + '18' }]}>
                          <MaterialCommunityIcons name="cellphone-cog" size={24} color={c.primary} />
                        </View>
                        <Text style={[styles.themeRadioTitle, { color: c.text }]}>Default</Text>
                      </View>
                      <View style={[styles.radioCircle, { borderColor: themePreference === 'system' ? c.primary : c.textSecondary }]}>
                        {themePreference === 'system' && <View style={[styles.radioCircleFilled, { backgroundColor: c.primary }]} />}
                      </View>
                    </TouchableOpacity>

                    <Text style={[styles.themeInfoText, { color: c.textSecondary }]}>
                      Selecting Default will align the app appearance automatically to match your phone's operating system dark/light theme setting.
                    </Text>
                  </View>
                )}

              </ScrollView>

              {/* FOOTER CONTAINER */}
              <View style={[styles.footer, { borderTopColor: c.border }]}>
                {currentView !== 'list' ? (
                  <TouchableOpacity
                    onPress={() => setCurrentView('list')}
                    style={[styles.cancelButton, { backgroundColor: c.card, flex: 1 }]}
                  >
                    <Text style={[styles.cancelButtonText, { color: c.text }]}>Back</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handleClose}
                    style={[styles.cancelButton, { backgroundColor: c.card, flex: 1 }]}
                  >
                    <Text style={[styles.cancelButtonText, { color: c.text }]}>Close Settings</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {/* CUSTOM MODAL ERROR DIALOG */}
          {errorDialogMsg !== null && (
            <View style={styles.dialogOverlay}>
              <View style={[styles.dialogContainer, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={[styles.dialogHeader, { borderBottomColor: c.border }]}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={28} color={c.error} />
                  <Text style={[styles.dialogTitle, { color: c.text }]}>Authentication Error</Text>
                </View>
                <Text style={[styles.dialogMessage, { color: c.textSecondary }]}>
                  {errorDialogMsg}
                </Text>
                <TouchableOpacity
                  onPress={() => setErrorDialogMsg(null)}
                  style={[styles.dialogButton, { backgroundColor: c.primary }]}
                >
                  <Text style={styles.dialogButtonText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    overflow: 'hidden',
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
  backButton: {
    marginRight: 2,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
  },
  
  // List settings styles
  listContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 16,
  },
  listItemTextContainer: {
    flex: 1,
  },
  listIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  listItemDesc: {
    fontSize: 12,
  },
  listItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  versionText: {
    fontSize: 13,
  },
  aboutContainer: {
    alignItems: 'center',
    marginTop: 30,
    gap: 4,
  },
  aboutText: {
    fontSize: 13,
    fontWeight: '600',
  },
  aboutSubText: {
    fontSize: 11,
  },

  // Auth view styles
  authContainer: {
    flex: 1,
  },
  authIntroSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  shieldCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  authIntroTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  authIntroDesc: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  authCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 16,
  },
  cardHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  maskedValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  maskedValueText: {
    fontSize: 14,
    letterSpacing: 2.5,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  lockIcon: {
    opacity: 0.8,
  },
  loaderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  authButtonsContainer: {
    gap: 12,
    marginBottom: 10,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 14,
    gap: 8,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Scanner Mode styles
  scannerOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  scannerInstructions: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
    marginTop: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },

  // Modal common footer styles
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Custom alert dialog styles
  dialogOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialogContainer: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  dialogMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  dialogButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Theme settings radio button styles
  themeRadioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    marginBottom: 12,
  },
  themeRadioLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeRadioTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleFilled: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  themeInfoText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
    paddingHorizontal: 4,
    textAlign: 'center',
  },
});
