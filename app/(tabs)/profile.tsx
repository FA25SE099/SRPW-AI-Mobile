/**
 * Profile Tab Screen
 */

import React from 'react';
import { Container, H1, Body, Spacer, Button } from '../../components/ui';
import { colors } from '../../theme';
import { useLogout } from '../../libs/auth';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const logout = useLogout();
  const router = useRouter();

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.replace('/auth/login');
  };

  return (
    <Container>
      <Spacer size="xl" />
      <H1>Profile</H1>
      <Spacer size="md" />
      <Body color={colors.textSecondary}>Profile settings coming soon...</Body>
      
      <Spacer size="xl" />
      <Button onPress={handleLogout} variant="outline" loading={logout.isPending}>
        Logout
      </Button>
    </Container>
  );
}

