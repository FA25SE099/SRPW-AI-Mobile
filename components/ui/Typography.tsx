/**
 * Typography Components
 * Pre-styled text components matching the design system
 */

import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { textStyles, colors } from '../../theme';

interface TextProps extends RNTextProps {
  color?: string;
}

// Heading Components
export const H1: React.FC<TextProps> = ({ style, color, ...props }) => (
  <RNText style={[textStyles.h1, color && { color }, style]} {...props} />
);

export const H2: React.FC<TextProps> = ({ style, color, ...props }) => (
  <RNText style={[textStyles.h2, color && { color }, style]} {...props} />
);

export const H3: React.FC<TextProps> = ({ style, color, ...props }) => (
  <RNText style={[textStyles.h3, color && { color }, style]} {...props} />
);

export const H4: React.FC<TextProps> = ({ style, color, ...props }) => (
  <RNText style={[textStyles.h4, color && { color }, style]} {...props} />
);

// Body Text Components
export const BodyLarge: React.FC<TextProps> = ({ style, color, ...props }) => (
  <RNText style={[textStyles.bodyLarge, color && { color }, style]} {...props} />
);

export const Body: React.FC<TextProps> = ({ style, color, ...props }) => (
  <RNText style={[textStyles.body, color && { color }, style]} {...props} />
);

export const BodySmall: React.FC<TextProps> = ({ style, color, ...props }) => (
  <RNText style={[textStyles.bodySmall, color && { color }, style]} {...props} />
);

// Semibold Variants
export const BodySemibold: React.FC<TextProps> = ({ style, color, ...props }) => (
  <RNText style={[textStyles.bodySemibold, color && { color }, style]} {...props} />
);

// Special Components
export const Caption: React.FC<TextProps> = ({ style, color, ...props }) => (
  <RNText style={[textStyles.caption, color && { color }, style]} {...props} />
);

export const Link: React.FC<TextProps> = ({ style, ...props }) => (
  <RNText style={[textStyles.link, style]} {...props} />
);

// Generic Text component with variant prop
type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'bodyLarge' | 'body' | 'bodySmall' | 'bodySemibold' | 'caption' | 'link';

interface GenericTextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
}

export const Text: React.FC<GenericTextProps> = ({ 
  variant = 'body', 
  style, 
  color,
  ...props 
}) => {
  const variantStyle = textStyles[variant] || textStyles.body;
  return (
    <RNText 
      style={[variantStyle, color && { color }, style]} 
      {...props} 
    />
  );
};

