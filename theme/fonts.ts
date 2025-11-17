/**
 * Font Loading Configuration
 * Handles loading custom fonts for the app
 * 
 * Note: Font loading is optional. If font files don't exist in assets/fonts/,
 * the app will automatically use system fonts. This is perfectly fine and
 * the app will work normally without custom fonts.
 * 
 * To add custom fonts:
 * 1. Download Lexend Deca from: https://fonts.google.com/specimen/Lexend+Deca
 * 2. Place the .ttf files in assets/fonts/ directory:
 *    - LexendDeca-Regular.ttf
 *    - LexendDeca-SemiBold.ttf
 *    - LexendDeca-Bold.ttf
 */

import * as Font from 'expo-font';

/**
 * Load all custom fonts used in the app
 * Call this before rendering the app
 * Gracefully handles missing font files by falling back to system fonts
 */
export const loadFonts = async (): Promise<void> => {
  try {
    const fontMap: { [key: string]: any } = {};
    let hasFonts = false;
    
    // Try to load each font file
    // If any font file doesn't exist, Metro will throw an error which we catch
    try {
      // @ts-ignore - Metro will try to resolve this, but we catch if it fails
      fontMap['LexendDeca-Regular'] = require('../assets/fonts/LexendDeca-Regular.ttf');
      // @ts-ignore
      fontMap['LexendDeca-SemiBold'] = require('../assets/fonts/LexendDeca-SemiBold.ttf');
      // @ts-ignore
      fontMap['LexendDeca-Bold'] = require('../assets/fonts/LexendDeca-Bold.ttf');
      hasFonts = true;
    } catch (requireError) {
      // Font files don't exist - this is expected and fine
      // The app will use system fonts instead
      console.log('Custom fonts not found, using system fonts (this is normal)');
      return;
    }
    
    // If we got here, fonts exist - load them
    if (hasFonts && Object.keys(fontMap).length > 0) {
      await Font.loadAsync(fontMap);
      console.log('Custom fonts loaded successfully');
    }
  } catch (error) {
    // Any other error during font loading - just continue with system fonts
    console.warn('Error loading fonts, using system fonts:', error);
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

