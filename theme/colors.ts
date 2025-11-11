/**
 * Color System
 * Design specifications: 60% white, 30% dark, 10% purple accent
 */

export const colors = {
  // Primary Colors (10% usage - accent)
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  primaryDark: '#5F50D9',
  primaryLighter: '#E3E0FF',
  
  // Neutral Colors (30% usage - dark/text)
  dark: '#2C2C3E',
  darkGray: '#6C6C80',
  mediumGray: '#8E8E93',
  lightGray: '#C7C7CC',
  
  // Background Colors (60% usage - light backgrounds)
  white: '#FFFFFF',
  background: '#F8F8F8',
  backgroundSecondary: '#F2F2F7',
  backgroundTertiary: '#E5E5EA',
  
  // Semantic Colors
  success: '#34C759',
  successLight: '#E8F5E9',
  error: '#FF3B30',
  errorLight: '#FFEBEE',
  warning: '#FF9500',
  warningLight: '#FFF3E0',
  info: '#007AFF',
  infoLight: '#E3F2FD',
  
  // Text Colors
  textPrimary: '#2C2C3E',
  textSecondary: '#6C6C80',
  textTertiary: '#8E8E93',
  textDisabled: '#C7C7CC',
  textInverse: '#FFFFFF',
  
  // Border Colors
  border: '#E5E5EA',
  borderLight: '#F2F2F7',
  borderDark: '#C7C7CC',
  
  // Overlay
  overlay: 'rgba(44, 44, 62, 0.5)',
  overlayLight: 'rgba(44, 44, 62, 0.2)',
} as const;

export type ColorKey = keyof typeof colors;
export type ColorValue = typeof colors[ColorKey];

