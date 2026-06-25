// App Entry Point - Kosmos Astro
import React, { useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

import { queryClient, asyncStoragePersister, CACHE_MAX_AGE } from './src/services/queryClient';
import { initSentry } from './src/services/sentry';
import { OfflineBanner } from './src/components/OfflineBanner';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useStore } from './src/store/useStore';
import { initializeRevenueCat } from './src/services/revenueCat';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { ToastProvider } from './src/components/Toast';
import { startHealthMonitoring } from './src/services/healthCheck';
import { syncPendingUsers } from './src/services/api';
import { tracker } from './src/services/eventTracker';
import { sessionTracker } from './src/services/sessionTracker';
import { initNotifications } from './src/services/notifications';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

// Initialize crash/error monitoring (no-op unless a DSN is configured)
initSentry();

export default function App() {
  const theme = useStore((state) => state.theme);
  const loadPersistedState = useStore((state) => state.loadPersistedState);

  useEffect(() => {
    const prepare = async () => {
      try {
        // Initialize RevenueCat
        await initializeRevenueCat();

        // Load persisted state
        await loadPersistedState();

        // Start health monitoring
        startHealthMonitoring();

        // Sync any locally-created users to backend (background, non-blocking)
        syncPendingUsers().catch(() => {});

        // Start analytics tracking
        tracker.start();
        sessionTracker.start();

        // Install notification channel/handler
        initNotifications().catch(() => {});
      } catch (e) {
        console.warn('Error initializing app:', e);
      } finally {
        await SplashScreen.hideAsync();
      }
    };

    prepare();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister, maxAge: CACHE_MAX_AGE }}
        >
          <ErrorBoundary>
            <ToastProvider>
              <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
              <OfflineBanner />
              <AppNavigator />
            </ToastProvider>
          </ErrorBoundary>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
