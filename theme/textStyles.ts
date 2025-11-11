/**
 * Text Style Presets
 * Pre-configured text styles matching design system
 */

import { TextStyle } from 'react-native';
import { colors } from './colors';
import { typography } from './typography';

export const textStyles = {
  // Heading Styles - Bold
  h1: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    lineHeight: typography.lineHeight['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  } as TextStyle,
  
  h2: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    lineHeight: typography.lineHeight.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  } as TextStyle,
  
  h3: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  } as TextStyle,
  
  h4: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    lineHeight: typography.lineHeight.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  } as TextStyle,
  
  // Heading Styles - Semibold
  h1Semibold: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize['2xl'],
    lineHeight: typography.lineHeight['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  } as TextStyle,
  
  h2Semibold: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xl,
    lineHeight: typography.lineHeight.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  } as TextStyle,
  
  h3Semibold: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  } as TextStyle,
  
  // Body Text Styles - Regular
  bodyLarge: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    lineHeight: typography.lineHeight.md,
    fontWeight: typography.fontWeight.regular,
    color: colors.textPrimary,
  } as TextStyle,
  
  body: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.fontWeight.regular,
    color: colors.textPrimary,
  } as TextStyle,
  
  bodySmall: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
  } as TextStyle,
  
  // Body Text Styles - Semibold
  bodyLargeSemibold: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.md,
    lineHeight: typography.lineHeight.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  } as TextStyle,
  
  bodySemibold: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  } as TextStyle,
  
  bodySmallSemibold: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  } as TextStyle,
  
  // Special Styles
  caption: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.fontWeight.regular,
    color: colors.textTertiary,
  } as TextStyle,
  
  button: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  } as TextStyle,
  
  link: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  } as TextStyle,
} as const;

export type TextStyleKey = keyof typeof textStyles;

