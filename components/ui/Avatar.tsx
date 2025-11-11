/**
 * Avatar Component
 * User profile picture or initials
 */

import React from 'react';
import { View, Image, Text, StyleSheet, ImageStyle, ImageSourcePropType } from 'react-native';
import { colors, borderRadius, textStyles } from '../../theme';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: ImageSourcePropType;
  initials?: string;
  size?: AvatarSize;
  backgroundColor?: string;
  style?: ImageStyle;
}

const SIZES = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

export const Avatar: React.FC<AvatarProps> = ({
  source,
  initials,
  size = 'md',
  backgroundColor = colors.primary,
  style,
}) => {
  const avatarSize = SIZES[size];
  const avatarStyle: ImageStyle[] = [
    styles.base,
    {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
      backgroundColor: source ? colors.backgroundSecondary : backgroundColor,
    },
    style,
  ] as ImageStyle[];

  if (source) {
    return (
      <Image
        source={source}
        style={avatarStyle}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={avatarStyle}>
      {initials && (
        <Text style={[styles.initials, { fontSize: avatarSize / 2.5 }]}>
          {initials.substring(0, 2).toUpperCase()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  } as ImageStyle,
  initials: {
    ...textStyles.bodySemibold,
    color: colors.white,
  },
});