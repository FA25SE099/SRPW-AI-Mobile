/**
 * Font Loading Configuration
 * Handles loading custom fonts for the app
 */

import * as Font from 'expo-font';

/**
 * Load all custom fonts used in the app
 * Call this before rendering the app
 */
export const loadFonts = async (): Promise<void> => {
  try {
    await Font.loadAsync({
      'LexendDeca-Regular': require('../assets/fonts/LexendDeca-Regular.ttf'),
      'LexendDeca-SemiBold': require('../assets/fonts/LexendDeca-SemiBold.ttf'),
      'LexendDeca-Bold': require('../assets/fonts/LexendDeca-Bold.ttf'),
    });
  } catch (error) {
    console.error('Error loading fonts:', error);
    throw error;
  }
};

/**
 * Font families available in the app
 * These should match the font files loaded above
 */
export const fontFamilies = {
  regular: 'LexendDeca-Regular',
  semibold: 'LexendDeca-SemiBold',
  bold: 'LexendDeca-Bold',
} as const;

