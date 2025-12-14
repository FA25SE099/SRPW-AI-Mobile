import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 11 Pro)
const baseWidth = 375;
const baseHeight = 812;

// Screen size categories
export const isSmallDevice = SCREEN_WIDTH < 375;
export const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 768;
export const isLargeDevice = SCREEN_WIDTH >= 768;
export const isTablet = SCREEN_WIDTH >= 768;

/**
 * Scale size based on device width
 */
export const scale = (size: number): number => {
  return (SCREEN_WIDTH / baseWidth) * size;
};

/**
 * Scale size vertically based on device height
 */
export const verticalScale = (size: number): number => {
  return (SCREEN_HEIGHT / baseHeight) * size;
};

/**
 * Moderate scale - less aggressive scaling
 */
export const moderateScale = (size: number, factor = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

/**
 * Get responsive font size
 */
export const getFontSize = (size: number): number => {
  const newSize = moderateScale(size, 0.3);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Get responsive spacing
 */
export const getSpacing = (size: number): number => {
  return moderateScale(size, 0.4);
};

/**
 * Get number of columns for grid layouts
 */
export const getNumColumns = (minColumnWidth = 150): number => {
  return Math.floor(SCREEN_WIDTH / minColumnWidth);
};

/**
 * Get responsive card width for grids
 */
export const getCardWidth = (
  numColumns: number,
  spacing: number = 16
): number => {
  const totalSpacing = spacing * (numColumns + 1);
  return (SCREEN_WIDTH - totalSpacing) / numColumns;
};

/**
 * Responsive breakpoints
 */
export const breakpoints = {
  small: 320,
  medium: 375,
  large: 768,
  xlarge: 1024,
};

/**
 * Check if current screen matches breakpoint
 */
export const matchesBreakpoint = (breakpoint: keyof typeof breakpoints): boolean => {
  return SCREEN_WIDTH >= breakpoints[breakpoint];
};

/**
 * Get responsive value based on screen size
 */
export const responsive = <T,>(values: {
  small?: T;
  medium?: T;
  large?: T;
  xlarge?: T;
  default: T;
}): T => {
  if (values.xlarge && SCREEN_WIDTH >= breakpoints.xlarge) return values.xlarge;
  if (values.large && SCREEN_WIDTH >= breakpoints.large) return values.large;
  if (values.medium && SCREEN_WIDTH >= breakpoints.medium) return values.medium;
  if (values.small && SCREEN_WIDTH >= breakpoints.small) return values.small;
  return values.default;
};

/**
 * Get dynamic dimensions
 */
export const getDimensions = () => ({
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: isSmallDevice,
  isMedium: isMediumDevice,
  isLarge: isLargeDevice,
  isTablet: isTablet,
});

