/**
 * Supervisor Home Screen
 * Dashboard for supervisor-specific functions
 */

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import {
  Container,
  H3,
  H4,
  Body,
  BodySmall,
  BodySemibold,
  Avatar,
  Card,
  Badge,
  Spacer,
} from '../../components/ui';
import { useUser } from '../../libs/auth';

// Green theme colors for nature-friendly design
const greenTheme = {
  primary: '#2E7D32', // Forest green
  primaryLight: '#4CAF50', // Medium green
  primaryLighter: '#E8F5E9', // Light green background
  accent: '#66BB6A', // Accent green
  success: '#10B981', // Success green
  background: '#F1F8F4', // Very light green tint
  cardBackground: '#FFFFFF',
  border: '#C8E6C9', // Light green border
};

// Mock data - will be replaced with API calls
const mockStats = {
  totalFarmers: 12,
  pendingApprovals: 5,
  activeTasks: 28,
  criticalAlerts: 3,
  overallProgress: 72,
};

const quickActions = [
  {
    id: '1',
    title: 'Farmers',
    icon: '👥',
    color: greenTheme.primary,
    route: '/(supervisor-tabs)/farmers',
  },
  {
    id: '6',
    title: 'Draw Polygons',
    icon: '🗺️',
    color: greenTheme.primaryLight,
    route: '/supervisor/polygon-drawing',
  },
];

export const SupervisorHomeScreen = () => {
  const router = useRouter();
  const { data: user } = useUser();

  const userName = user
    ? `${user.firstName} ${user.lastName}`.trim() || user.email
    : 'Supervisor';

  const userInitials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'S'
    : 'S';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Container padding="lg">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Avatar size="md" initials={userInitials} />
              <Spacer size="sm" horizontal />
              <View>
                <BodySmall color={colors.textSecondary}>Welcome back</BodySmall>
                <BodySemibold>{userName}</BodySemibold>
                <BodySmall color={colors.textSecondary}>Supervisor</BodySmall>
              </View>
            </View>
          </View>

          <Spacer size="xl" />

          {/* Stats Cards */}
          <View style={styles.statsRow}>
            <Card variant="elevated" style={[styles.statCard, { backgroundColor: greenTheme.primary }]}>
              <Body color={colors.white} style={styles.statNumber}>
                {mockStats.totalFarmers}
              </Body>
              <BodySmall color={colors.white}>Farmers</BodySmall>
            </Card>
            <Card variant="elevated" style={[styles.statCard, { backgroundColor: '#FF9500' }]}>
              <Body color={colors.white} style={styles.statNumber}>
                {mockStats.pendingApprovals}
              </Body>
              <BodySmall color={colors.white}>Pending</BodySmall>
            </Card>
          </View>

          <Spacer size="md" />

          <View style={styles.statsRow}>
            <Card variant="elevated" style={[styles.statCard, { backgroundColor: '#34C759' }]}>
              <Body color={colors.white} style={styles.statNumber}>
                {mockStats.activeTasks}
              </Body>
              <BodySmall color={colors.white}>Active Tasks</BodySmall>
            </Card>
            <Card variant="elevated" style={[styles.statCard, { backgroundColor: colors.error }]}>
              <Body color={colors.white} style={styles.statNumber}>
                {mockStats.criticalAlerts}
              </Body>
              <BodySmall color={colors.white}>Alerts</BodySmall>
            </Card>
          </View>

          <Spacer size="xl" />

          {/* Quick Actions */}
          <H4>Quick Actions</H4>
          <Spacer size="md" />
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                onPress={() => router.push(action.route as any)}
                style={styles.quickActionCard}
              >
                <Card variant="elevated" style={styles.quickActionCardInner}>
                  <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                    <Body style={styles.quickActionIconText}>{action.icon}</Body>
                  </View>
                  <Spacer size="sm" />
                  <BodySemibold style={styles.quickActionTitle}>{action.title}</BodySemibold>
                </Card>
              </TouchableOpacity>
            ))}
          </View>

          <Spacer size="xl" />

          {/* Overall Progress */}
          <Card variant="elevated" style={styles.progressCard}>
            <View style={styles.progressCardHeader}>
              <View>
                <H4>Overall Progress</H4>
                <BodySmall color={colors.textSecondary}>All supervised farmers</BodySmall>
              </View>
              <Badge variant="primary" size="sm" style={{ backgroundColor: greenTheme.primary }}>
                {mockStats.overallProgress}%
              </Badge>
            </View>
            <Spacer size="md" />
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${mockStats.overallProgress}%`, backgroundColor: greenTheme.primary },
                  ]}
                />
              </View>
            </View>
          </Card>

          <Spacer size="xl" />

          <Spacer size="3xl" />
        </Container>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: greenTheme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickActionCard: {
    width: '30%',
  },
  quickActionCardInner: {
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: greenTheme.cardBackground,
    borderWidth: 1,
    borderColor: greenTheme.border,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionIconText: {
    fontSize: 24,
  },
  quickActionTitle: {
    textAlign: 'center',
    fontSize: 12,
  },
  progressCard: {
    padding: spacing.lg,
    backgroundColor: greenTheme.cardBackground,
    borderWidth: 1,
    borderColor: greenTheme.border,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  progressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: greenTheme.primaryLighter,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
