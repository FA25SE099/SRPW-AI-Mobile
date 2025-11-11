/**
 * Badge Component
 * Small status indicator or label
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, borderRadius, textStyles } from '../../theme';
type BadgeVariant = 'primary' | 'success' | 'error' | 'warning' | 'info' | 'neutral';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
}) => {
  return (
    <View style={[styles.base, styles[variant], styles[size], style]}>
      <Text style={[styles.text, styles[`${size}Text`], textStyle]}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  
  // Variants
  primary: {
    backgroundColor: colors.primaryLighter,
  },
  success: {
    backgroundColor: colors.successLight,
  },
  error: {
    backgroundColor: colors.errorLight,
  },
  warning: {
    backgroundColor: colors.warningLight,
  },
  info: {
    backgroundColor: colors.infoLight,
  },
  neutral: {
    backgroundColor: colors.backgroundSecondary,
  },
  
  // Sizes
  sm: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  lg: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  
  // Text styles
  text: {
    ...textStyles.bodySmallSemibold,
  },
  smText: {
    fontSize: 10,
  },
  mdText: {
    fontSize: textStyles.bodySmall.fontSize,
  },
  lgText: {
    fontSize: textStyles.body.fontSize,
  },
});

