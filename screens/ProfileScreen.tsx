/**
 * Profile Screen
 * User profile and settings
 */

import React from 'react';
import { Container, H1, Body, Spacer, Button, Avatar, H3, BodySmall } from '../components/ui';
import { colors, spacing } from '../theme';
import { useLogout, useUser } from '../libs/auth';
import { useRouter } from 'expo-router';
import { View, StyleSheet } from 'react-native';

export const ProfileScreen = () => {
  const logout = useLogout();
  const router = useRouter();
  const { data: user } = useUser();

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.replace('/auth/login');
  };

  const userName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
    : 'User';
  const userInitials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
    : 'U';

  return (
    <Container padding="lg">
      <Spacer size="xl" />
      
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Avatar
          initials={userInitials}
          size="xl"
          backgroundColor={colors.primary}
        />
        <Spacer size="md" />
        <H3>{userName}</H3>
        {user?.email && (
          <BodySmall color={colors.textSecondary}>{user.email}</BodySmall>
        )}
        {user?.role && (
          <BodySmall color={colors.primary} style={styles.roleBadge}>
            {user.role}
          </BodySmall>
        )}
      </View>

      <Spacer size="xl" />

      {/* Profile Info */}
      <View style={styles.section}>
        <H1>Profile</H1>
        <Spacer size="md" />
        <Body color={colors.textSecondary}>Profile settings coming soon...</Body>
      </View>

      <Spacer size="xl" />
      
      {/* Logout Button */}
      <Button onPress={handleLogout} variant="outline" loading={logout.isPending} fullWidth>
        Logout
      </Button>
      
      <Spacer size="xl" />
    </Container>
  );
};

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: 'center',
  },
  roleBadge: {
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  section: {
    width: '100%',
  },
});

