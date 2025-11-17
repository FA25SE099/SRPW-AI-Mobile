/**
 * Typography System
 * Based on Lexend Deca font family
 * Sizes: 44px, 33px, 24px, 19px, 14px, 11px
 */

export const typography = {
  // Font Families
  // Falls back to system fonts if custom fonts are not loaded
  fontFamily: {
    regular: 'LexendDeca-Regular', // Falls back to system default
    semibold: 'LexendDeca-SemiBold', // Falls back to system semibold
    bold: 'LexendDeca-Bold', // Falls back to system bold
  },
  
  // Font Sizes (matching design specs)
  fontSize: {
    xs: 11,   // Small labels, captions
    sm: 14,   // Body text, inputs
    md: 19,   // Emphasized body text
    lg: 24,   // H3, card titles
    xl: 33,   // H2, section headers
    '2xl': 44, // H1, main headings
  },
  
  // Line Heights (1.2-1.5x font size for readability)
  lineHeight: {
    xs: 13,   // 11 * 1.18
    sm: 17,   // 14 * 1.21
    md: 23,   // 19 * 1.21
    lg: 29,   // 24 * 1.21
    xl: 40,   // 33 * 1.21
    '2xl': 53, // 44 * 1.20
  },
  
  // Font Weights
  fontWeight: {
    regular: '400' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Letter Spacing (optional, for fine-tuning)
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
} as const;

export type FontFamily = keyof typeof typography.fontFamily;
export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;

