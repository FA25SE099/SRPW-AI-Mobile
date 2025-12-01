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
    color: colors.primary,
    route: '/(supervisor-tabs)/farmers',
  },
  {
    id: '2',
    title: 'Tasks',
    icon: '📋',
    color: '#FF9500',
    route: '/(supervisor-tabs)/tasks',
  },
  {
    id: '3',
    title: 'Farm Logs',
    icon: '📝',
    color: '#34C759',
    route: '/(supervisor-tabs)/farm-logs',
  },
  {
    id: '4',
    title: 'Fields',
    icon: '🌾',
    color: '#5AC8FA',
    route: '/(supervisor-tabs)/fields',
  },
  {
    id: '5',
    title: 'Alerts',
    icon: '🔔',
    color: colors.error,
    route: '/(supervisor-tabs)/alerts',
  },
  {
    id: '6',
    title: 'Draw Polygons',
    icon: '🗺️',
    color: '#9B59B6',
    route: '/supervisor/polygon-drawing',
  },
];

const recentActivities = [
  {
    id: '1',
    type: 'approval',
    farmerName: 'Nguyen Van A',
    description: 'Task completion approval',
    date: '2024-01-15',
    status: 'pending',
  },
  {
    id: '2',
    type: 'log',
    farmerName: 'Tran Thi B',
    description: 'Farm log submitted',
    date: '2024-01-15',
    status: 'new',
  },
  {
    id: '3',
    type: 'alert',
    farmerName: 'Le Van C',
    description: 'Critical alert: Pest detected',
    date: '2024-01-14',
    status: 'urgent',
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

  const getActivityIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      approval: '✅',
      log: '📝',
      alert: '🔔',
      task: '📋',
    };
    return icons[type] || '📝';
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'urgent':
        return colors.error;
      case 'pending':
        return '#FF9500';
      case 'new':
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

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
            <Card variant="elevated" style={[styles.statCard, { backgroundColor: colors.primary }]}>
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
              <Badge variant="primary" size="sm">
                {mockStats.overallProgress}%
              </Badge>
            </View>
            <Spacer size="md" />
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${mockStats.overallProgress}%`, backgroundColor: colors.primary },
                  ]}
                />
              </View>
            </View>
          </Card>

          <Spacer size="xl" />

          {/* Recent Activities */}
          <View style={styles.sectionHeader}>
            <H4>Recent Activities</H4>
            <TouchableOpacity>
              <BodySmall color={colors.primary}>View All</BodySmall>
            </TouchableOpacity>
          </View>
          <Spacer size="md" />

          {recentActivities.map((activity) => (
            <TouchableOpacity key={activity.id}>
              <Card variant="flat" style={styles.activityCard}>
                <View style={styles.activityCardLeft}>
                  <View style={styles.activityIcon}>
                    <Body>{getActivityIcon(activity.type)}</Body>
                  </View>
                  <View style={styles.activityInfo}>
                    <BodySemibold>{activity.farmerName}</BodySemibold>
                    <BodySmall color={colors.textSecondary}>
                      {activity.description} • {new Date(activity.date).toLocaleDateString()}
                    </BodySmall>
                  </View>
                </View>
                <Badge
                  variant="outline"
                  style={[
                    styles.statusBadge,
                    { borderColor: getStatusColor(activity.status) },
                  ]}
                >
                  <BodySmall style={{ color: getStatusColor(activity.status) }}>
                    {activity.status}
                  </BodySmall>
                </Badge>
              </Card>
              <Spacer size="sm" />
            </TouchableOpacity>
          ))}

          <Spacer size="3xl" />
        </Container>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.backgroundSecondary,
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
  activityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  activityCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});

