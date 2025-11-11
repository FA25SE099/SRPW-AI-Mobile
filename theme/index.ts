/**
 * Theme System
 * Central export for all theme tokens and utilities
 */

export { colors, type ColorKey, type ColorValue } from './colors';
export { typography, type FontFamily, type FontSize, type FontWeight } from './typography';
export { textStyles, type TextStyleKey } from './textStyles';
export { spacing, padding, margin, type SpacingKey, type SpacingValue } from './spacing';
export { shadows, type ShadowKey } from './shadows';
export { borderRadius, type BorderRadiusKey, type BorderRadiusValue } from './borderRadius';

import { colors } from './colors';
import { typography } from './typography';
import { textStyles } from './textStyles';
import { spacing, padding, margin } from './spacing';
import { shadows } from './shadows';
import { borderRadius } from './borderRadius';

/**
 * Complete theme object
 * Use this for accessing all theme values in one place
 */
export const theme = {
  colors,
  typography,
  textStyles,
  spacing,
  padding,
  margin,
  shadows,
  borderRadius,
} as const;

export type Theme = typeof theme;

/**
 * Default export for convenience
 */
export default theme;

