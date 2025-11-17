/**
 * Farmer Home Screen
 * Dashboard for farmer-specific functions
 */

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, shadows } from '../theme';
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
} from '../components/ui';
import { useUser } from '../libs/auth';

// Mock data
const mockStats = {
  totalFields: 5,
  pendingTasks: 3,
  activeAlerts: 2,
  seasonProgress: 65,
};

const quickActions = [
  {
    id: '1',
    title: 'My Fields',
    icon: '🌾',
    color: colors.primary,
    route: '/(farmer-tabs)/fields',
  },
  {
    id: '2',
    title: 'Farm Log',
    icon: '📝',
    color: '#34C759',
    route: '/farmer/farm-log',
  },
  {
    id: '3',
    title: 'Tasks',
    icon: '✅',
    color: '#FF9500',
    route: '/(farmer-tabs)/tasks',
  },
  {
    id: '4',
    title: 'Alerts',
    icon: '🔔',
    color: colors.error,
    route: '/(farmer-tabs)/alerts',
  },
  {
    id: '5',
    title: 'Economics',
    icon: '💰',
    color: '#FFD60A',
    route: '/farmer/economics',
  },
];

const recentActivities = [
  {
    id: '1',
    type: 'fertilizing',
    fieldName: 'Field A',
    date: '2024-01-15',
    material: 'NPK 20-20-20',
    cost: 150000,
  },
  {
    id: '2',
    type: 'spraying',
    fieldName: 'Field B',
    date: '2024-01-14',
    material: 'Pesticide X',
    cost: 85000,
  },
  {
    id: '3',
    type: 'irrigation',
    fieldName: 'Field C',
    date: '2024-01-13',
    material: 'Water',
    cost: 25000,
  },
];

export const FarmerHomeScreen = () => {
  const router = useRouter();
  const { data: user } = useUser();

  const getActivityIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      planting: '🌱',
      fertilizing: '💧',
      spraying: '💨',
      irrigation: '🚿',
      harvesting: '🌾',
    };
    return icons[type] || '📝';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Container padding="lg">
        {/* Header */}
        <View style={styles.header}>
          <View>
            <BodySmall color={colors.textSecondary}>Hello!</BodySmall>
            <H3>{user?.firstName} {user?.lastName}</H3>
            <BodySmall color={colors.textSecondary}>Farmer</BodySmall>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton}>
              <View style={styles.notificationBadge} />
              <Body>🔔</Body>
            </TouchableOpacity>
            <Avatar
              initials={`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`}
              size="md"
              backgroundColor={colors.primary}
            />
          </View>
        </View>

        <Spacer size="lg" />

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <Card variant="elevated" style={[styles.statCard, { backgroundColor: colors.primary }]}>
            <Body color={colors.white} style={styles.statNumber}>
              {mockStats.totalFields}
            </Body>
            <BodySmall color={colors.white}>Fields</BodySmall>
          </Card>
          <Card variant="elevated" style={[styles.statCard, { backgroundColor: '#FF9500' }]}>
            <Body color={colors.white} style={styles.statNumber}>
              {mockStats.pendingTasks}
            </Body>
            <BodySmall color={colors.white}>Tasks</BodySmall>
          </Card>
          <Card variant="elevated" style={[styles.statCard, { backgroundColor: colors.error }]}>
            <Body color={colors.white} style={styles.statNumber}>
              {mockStats.activeAlerts}
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

        {/* Recent Activities */}
        <View style={styles.sectionHeader}>
          <H4>Recent Activities</H4>
          <TouchableOpacity onPress={() => router.push('/farmer/farm-log' as any)}>
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
                  <BodySemibold>{activity.fieldName}</BodySemibold>
                  <BodySmall color={colors.textSecondary}>
                    {activity.material} • {new Date(activity.date).toLocaleDateString()}
                  </BodySmall>
                </View>
              </View>
              <BodySemibold color={colors.primary}>
                {formatCurrency(activity.cost)}
              </BodySemibold>
            </Card>
            <Spacer size="sm" />
          </TouchableOpacity>
        ))}

        <Spacer size="xl" />

        {/* Season Progress */}
        <Card variant="elevated" style={styles.seasonCard}>
          <View style={styles.seasonCardHeader}>
            <View>
              <H4>Current Season</H4>
              <BodySmall color={colors.textSecondary}>Winter-Spring 2024</BodySmall>
            </View>
            <Badge variant="primary" size="sm">
              {mockStats.seasonProgress}%
            </Badge>
          </View>
          <Spacer size="md" />
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${mockStats.seasonProgress}%`, backgroundColor: colors.primary },
                ]}
              />
            </View>
          </View>
          <Spacer size="md" />
          <TouchableOpacity onPress={() => router.push('/farmer/economics' as any)}>
            <Body color={colors.primary} style={styles.viewDetailsText}>
              View Economic Performance →
            </Body>
          </TouchableOpacity>
        </Card>

        <Spacer size="3xl" />
      </Container>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickActionCard: {
    width: '47%',
  },
  quickActionCardInner: {
    padding: 16,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionIconText: {
    fontSize: 14,
  },
  quickActionTitle: {
    textAlign: 'center',
    fontSize: 14,
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
  seasonCard: {
    padding: spacing.lg,
  },
  seasonCardHeader: {
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
  viewDetailsText: {
    fontWeight: '600',
  },
});

