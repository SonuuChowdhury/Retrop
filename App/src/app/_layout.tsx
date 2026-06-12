// ============================================================================
// ROOT LAYOUT
// ============================================================================
// Updated to include WaiterAuthProvider and KitchenAuthProvider alongside the
// existing AuthProvider and ThemeProvider.
// ============================================================================

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider } from '@/context/AuthContext';
import { WaiterAuthProvider } from '@/context/WaiterAuthContext';
import { KitchenAuthProvider } from '@/context/KitchenAuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="manager" />
        <Stack.Screen name="waiter" />
        <Stack.Screen name="kitchen" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <WaiterAuthProvider>
          <KitchenAuthProvider>
            <RootLayoutNav />
          </KitchenAuthProvider>
        </WaiterAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}