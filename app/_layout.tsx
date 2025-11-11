/**
 * Root Layout
 * App-wide configuration and providers
 */

import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { loadFonts } from '../theme/fonts';
import { Spinner } from '../components/ui';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    loadFonts()
      .then(() => setFontsLoaded(true))
      .catch((error) => {
        console.error('Error loading fonts:', error);
        // Continue without custom fonts
        setFontsLoaded(true);
      });
  }, []);

  if (!fontsLoaded) {
    return <Spinner fullScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/onboarding" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueryClientProvider>
  );
}

