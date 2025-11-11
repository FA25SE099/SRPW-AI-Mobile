/**
 * Spacer Component
 * Adds consistent spacing between elements
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { spacing } from '../../theme';

interface SpacerProps {
  size?: keyof typeof spacing;
  horizontal?: boolean;
  style?: ViewStyle;
}

export const Spacer: React.FC<SpacerProps> = ({
  size = 'md',
  horizontal = false,
  style,
}) => {
  const spacerStyle: ViewStyle = horizontal
    ? { width: spacing[size] }
    : { height: spacing[size] };

  return <View style={[spacerStyle, style]} />;
};

