/**
 * Spacing System
 * Based on 8px grid system for consistent spacing
 */

export const spacing = {
  xs: 4,    // 0.5x base
  sm: 8,    // 1x base
  md: 16,   // 2x base
  lg: 24,   // 3x base
  xl: 32,   // 4x base
  '2xl': 48, // 6x base
  '3xl': 64, // 8x base
  '4xl': 96, // 12x base
} as const;

// Padding presets for common use cases
export const padding = {
  screen: spacing.md,        // Standard screen padding
  card: spacing.md,          // Card content padding
  button: {
    horizontal: spacing.lg,
    vertical: spacing.md,
  },
  input: {
    horizontal: spacing.md,
    vertical: spacing.sm,
  },
} as const;

// Margin presets
export const margin = {
  section: spacing.xl,       // Between major sections
  element: spacing.md,       // Between elements
  text: spacing.sm,         // Between text elements
} as const;

export type SpacingKey = keyof typeof spacing;
export type SpacingValue = typeof spacing[SpacingKey];

