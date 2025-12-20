import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { loadFonts } from '../theme/fonts';
import { Spinner } from '../components/ui';
import Mapbox from '@rnmapbox/maps';

Mapbox.setAccessToken('pk.eyJ1IjoiZHVjbmd1eWVuMTIwNDA0IiwiYSI6ImNtamF4b3RuNDA3N3gzZnF4Z2RiZGNudGgifQ.frZ1ll3lizDPgi9DPb4kEw');
import { env } from '../configs/env';

// Initialize Mapbox once at app startup
let mapboxInitialized = false;
const initializeMapbox = () => {
  if (mapboxInitialized) return;
  
  try {
    const Mapbox = require('@rnmapbox/maps');
    if (Mapbox && Mapbox.setAccessToken && env.MAPBOX_TOKEN) {
      Mapbox.setAccessToken(env.MAPBOX_TOKEN);
      mapboxInitialized = true;
      console.log('[Mapbox] Initialized successfully');
    }
  } catch (error) {
    console.warn('[Mapbox] Native module not available:', error);
  }
};

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function AppContent() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    // Initialize Mapbox once when app starts
    initializeMapbox();
    
    loadFonts()
      .then(() => setFontsLoaded(true))
      .catch((error) => {
        // Font loading errors are expected if font files don't exist
        // The app will use system fonts instead, which is perfectly fine
        console.log('Fonts not available, using system fonts (this is normal)');
        // Continue without custom fonts
        setFontsLoaded(true);
      });
  }, []);

  if (!fontsLoaded) {
    return <Spinner fullScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/onboarding" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(farmer-tabs)" />
      <Stack.Screen name="(uav-tabs)" />
      <Stack.Screen name="(supervisor-tabs)" />
      <Stack.Screen name="supervisor" />
      <Stack.Screen name="add-project" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}