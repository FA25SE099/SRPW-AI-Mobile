/**
 * Calendar Tab Screen
 */

import React from 'react';
import { Container, H1, Body, Spacer } from '../../components/ui';
import { colors } from '../../theme';

export default function CalendarScreen() {
  return (
    <Container>
      <Spacer size="xl" />
      <H1>Calendar</H1>
      <Spacer size="md" />
      <Body color={colors.textSecondary}>Calendar view coming soon...</Body>
    </Container>
  );
}

