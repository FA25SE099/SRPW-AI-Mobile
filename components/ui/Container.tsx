/**
 * Container Component
 * Screen-level container with consistent padding
 */

import React, { PropsWithChildren } from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../../theme';

interface ContainerProps {
  scrollable?: boolean;
  padding?: keyof typeof spacing;
  backgroundColor?: string;
  style?: ViewStyle;
}

export const Container: React.FC<PropsWithChildren<ContainerProps>> = ({
  children,
  scrollable = false,
  padding = 'md',
  backgroundColor = colors.background,
  style,
}) => {
  if (scrollable) {
    return (
      <ScrollView
        style={[styles.base, { backgroundColor }, style]}
        contentContainerStyle={[
          styles.scrollContent,
          { padding: spacing[padding] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  const containerStyle = [
    styles.base,
    { padding: spacing[padding], backgroundColor },
    style,
  ];

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

