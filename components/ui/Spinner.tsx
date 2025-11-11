/**
 * Spinner Component
 * Loading indicator
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../../theme';
import { Body } from './Typography';

interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'large',
  color = colors.primary,
  message,
  fullScreen = false,
  style,
}) => {
  const containerStyle = [
    styles.container,
    fullScreen && styles.fullScreen,
    style,
  ];

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Body style={styles.message} color={colors.textSecondary}>
          {message}
        </Body>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  message: {
    marginTop: spacing.md,
  },
});

