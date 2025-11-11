/**
 * Container Component
 * Screen-level container with consistent padding
 */

import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../../theme';
interface ContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padding?: keyof typeof spacing;
  backgroundColor?: string;
  style?: ViewStyle;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  scrollable = false,
  padding = 'md',
  backgroundColor = colors.background,
  style,
}) => {
  const containerStyle = [
    styles.base,
    { padding: spacing[padding], backgroundColor },
    style,
  ];

  if (scrollable) {
    return (
      <ScrollView
        style={containerStyle}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

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

