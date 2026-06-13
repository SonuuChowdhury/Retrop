// ============================================================================
// ROOT LAYOUT
// ============================================================================
// Initializes the API (loads server URL from storage) before rendering.
// If server URL is not configured, redirects to /setup screen.
// ============================================================================

import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { AuthProvider } from '@/context/AuthContext';
import { WaiterAuthProvider } from '@/context/WaiterAuthContext';
import { KitchenAuthProvider } from '@/context/KitchenAuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { initializeApi } from '@/config/api';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav({ apiReady }: { apiReady: 'setup' | 'ready' | null }) {
  const { isDark } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (apiReady === 'setup') {
      // Server URL not configured — go to setup screen
      router.replace('/setup');
    }
    // 'ready' case: normal flow, index.tsx handles routing
  }, [apiReady]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="setup" />
        <Stack.Screen name="login" />
        <Stack.Screen name="manager" />
        <Stack.Screen name="waiter" />
        <Stack.Screen name="kitchen" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [apiReady, setApiReady] = useState<'setup' | 'ready' | null>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const result = await initializeApi();
        if (mounted) setApiReady(result);
      } catch {
        // If initialization fails, still let the app load
        if (mounted) setApiReady('ready');
      } finally {
        await SplashScreen.hideAsync();
      }
    };

    init();
    return () => { mounted = false; };
  }, []);

  // Keep splash screen visible until API is initialized
  if (apiReady === null) return null;

  return (
    <ThemeProvider>
      <AuthProvider>
        <WaiterAuthProvider>
          <KitchenAuthProvider>
            <RootLayoutNav apiReady={apiReady} />
          </KitchenAuthProvider>
        </WaiterAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}