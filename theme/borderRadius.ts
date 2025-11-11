/**
 * Border Radius System
 * Consistent corner rounding for UI elements
 */

export const borderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999, // Circular/pill shape
} as const;

export type BorderRadiusKey = keyof typeof borderRadius;
export type BorderRadiusValue = typeof borderRadius[BorderRadiusKey];

