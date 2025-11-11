/**
 * Onboarding Screen
 * Introduction screen for task management app
 */

import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing } from '../../theme';
import { Container, Button, H1, Body, Spacer } from '../../components/ui';

export const OnboardingScreen = () => {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/auth/login');
  };

  return (
    <Container style={styles.container}>
      {/* Illustration */}
      <View style={styles.illustration}>
        {/* You can add your 3D illustration image here */}
        <View style={styles.illustrationPlaceholder}>
          {/* Add decorative elements */}
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
          <View style={[styles.dot, styles.dot4]} />
          <View style={[styles.dot, styles.dot5]} />
        </View>
      </View>

      <Spacer size="3xl" />

      {/* Content */}
      <View style={styles.content}>
        <H1 style={styles.title}>Task Management & To-Do List</H1>
        
        <Spacer size="lg" />
        
        <Body color={colors.textSecondary} style={styles.description}>
          This productive tool is designed to help you better manage your task project-wise conveniently!
        </Body>
      </View>

      <Spacer size="2xl" />

      {/* Get Started Button */}
      <View style={styles.footer}>
        <Button
          onPress={handleGetStarted}
          fullWidth
          size="lg"
          style={styles.button}
        >
          Let's Start →
        </Button>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'space-between',
    paddingTop: spacing['3xl'],
  },
  illustration: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  illustrationPlaceholder: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    borderRadius: 100,
  },
  dot1: {
    width: 12,
    height: 12,
    backgroundColor: colors.info,
    top: 50,
    right: 20,
  },
  dot2: {
    width: 8,
    height: 8,
    backgroundColor: colors.primary,
    top: 80,
    left: 40,
  },
  dot3: {
    width: 10,
    height: 10,
    backgroundColor: '#FFE066',
    bottom: 80,
    right: 60,
  },
  dot4: {
    width: 8,
    height: 8,
    backgroundColor: '#FFB3BA',
    bottom: 100,
    left: 30,
  },
  dot5: {
    width: 12,
    height: 12,
    backgroundColor: colors.success,
    bottom: 60,
    right: 100,
  },
  content: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  description: {
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  button: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
});

