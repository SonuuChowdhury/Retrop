// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================
// Handles Expo push notification permissions and FCM token registration.
// Requires expo-notifications, expo-device, expo-constants.
// ============================================================================

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ============================================================================
// EXPO GO GUARD
// ============================================================================
// expo-notifications push token APIs were removed from Expo Go in SDK 53.
// We detect Expo Go at runtime and skip all push token work.
// Local notification listeners (foreground alerts) still work in Expo Go.
// Push tokens only work in a development build or production APK/IPA.
// ============================================================================

function isExpoGo(): boolean {
  return Constants.executionEnvironment === 'storeClient';
}

// Lazy-load Notifications so the module import itself doesn't crash Expo Go
let Notifications: typeof import('expo-notifications') | null = null;
try {
  Notifications = require('expo-notifications');
} catch {
  // should not happen but guard anyway
}

// Set handler only if available and not Expo Go push restriction
if (Notifications && !isExpoGo()) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Request notification permissions and return the FCM device push token.
 * Returns null in Expo Go, web, simulator, or if permission denied.
 * Only returns a real token in a development build or production APK.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Skip entirely in Expo Go (SDK 53+) or web
  if (isExpoGo() || Platform.OS === 'web' || !Notifications) {
    return null;
  }

  try {
    const Device = require('expo-device');
    if (!Device.isDevice) {
      // Simulator/emulator — no push tokens
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    // Raw FCM token (what firebase-admin on the backend needs)
    const { data: token } = await Notifications.getDevicePushTokenAsync();
    return token;
  } catch (err) {
    console.warn('[Notifications] registerForPushNotificationsAsync failed:', err);
    return null;
  }
}

/**
 * Set up foreground notification listeners.
 * Works in Expo Go for LOCAL notifications; push notifications require a dev build.
 * Returns a cleanup function — always safe to call.
 */
export function setupNotificationListeners(
  onNotification: (notification: any) => void,
  onResponse: (response: any) => void,
): () => void {
  if (!Notifications) return () => {};

  try {
    const notifSub = Notifications.addNotificationReceivedListener(onNotification);
    const respSub = Notifications.addNotificationResponseReceivedListener(onResponse);
    return () => {
      notifSub.remove();
      respSub.remove();
    };
  } catch (err) {
    console.warn('[Notifications] setupNotificationListeners failed:', err);
    return () => {};
  }
}