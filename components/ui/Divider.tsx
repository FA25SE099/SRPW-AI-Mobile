/**
 * Divider Component
 * Horizontal or vertical separator line
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../../theme';
interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  spacing?: keyof typeof spacing;
  color?: string;
  thickness?: number;
  style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  spacing: spacingKey = 'md',
  color = colors.border,
  thickness = 1,
  style,
}) => {
  const dividerStyle = [
    orientation === 'horizontal' ? styles.horizontal : styles.vertical,
    orientation === 'horizontal'
      ? { 
          marginVertical: spacing[spacingKey] / 2,
          height: thickness,
          backgroundColor: color,
        }
      : { 
          marginHorizontal: spacing[spacingKey] / 2,
          width: thickness,
          backgroundColor: color,
        },
    style,
  ];

  return <View style={dividerStyle} />;
};

const styles = StyleSheet.create({
  horizontal: {
    width: '100%',
  },
  vertical: {
    height: '100%',
  },
});

