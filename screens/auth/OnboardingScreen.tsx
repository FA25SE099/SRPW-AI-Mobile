/**
 * Onboarding Screen
 * Introduction screen for task management app
 */

import React from 'react';
import { View, StyleSheet, Image, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius } from '../../theme';
import { Container, Button, H1, Body, BodySemibold, Spacer } from '../../components/ui';

const farmerHighlights = [
  'Check today’s field work at a glance',
  'Coordinate UAV spraying visits',
  'Capture proof photos and farm logs',
];

export const OnboardingScreen = () => {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/auth/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Container style={styles.container}>
          <View style={styles.heroCard}>
            <Image
              source={require('../../assets/icons/splash-icon.png')}
              style={styles.heroImage}
              resizeMode="contain"
            />
            <Spacer size="lg" />
            <BodySemibold color={colors.primary}>App quản lý kế hoạch sản xuất</BodySemibold>
            <H1 style={styles.title}>Quản lý trại với độ tin cậy</H1>
            <Spacer size="sm" />
            <Body color={colors.textSecondary} style={styles.description}>
              Theo dõi các nhiệm vụ sản xuất, lịch phun thuốc của UAV và nhật ký trại trong một
              không gian làm việc được thiết kế cho nông dân.
            </Body>
          </View>

          <Spacer size="xl" />

          <View style={styles.highlightList}>
            {farmerHighlights.map((item) => (
              <View key={item} style={styles.highlightItem}>
                <View style={styles.checkDot} />
                <Body>{item}</Body>
              </View>
            ))}
          </View>

          <Spacer size="xl" />

          <View style={styles.footer}>
            <Button onPress={handleGetStarted} fullWidth size="lg" style={styles.button}>
              Bắt đầu
            </Button>
            <Spacer size="sm" />
            <Body color={colors.textSecondary}>Linh hoạt cho cả nông dân và nhà cung cấp UAV.</Body>
          </View>
        </Container>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['2xl'],
  },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...{
      shadowColor: colors.dark,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 4,
    },
  },
  heroImage: {
    width: 180,
    height: 180,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  highlightList: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...{
      shadowColor: colors.dark,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
    },
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  button: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
});

