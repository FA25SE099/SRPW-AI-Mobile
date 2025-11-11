/**
 * Tasks Tab Screen
 */

import React from 'react';
import { Container, H1, Body, Spacer } from '../../components/ui';
import { colors } from '../../theme';

export default function TasksScreen() {
  return (
    <Container>
      <Spacer size="xl" />
      <H1>Tasks</H1>
      <Spacer size="md" />
      <Body color={colors.textSecondary}>Task list coming soon...</Body>
    </Container>
  );
}

