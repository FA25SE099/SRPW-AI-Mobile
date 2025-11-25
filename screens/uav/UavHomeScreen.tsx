/**
 * UAV Home Screen
 * Dashboard for UAV vendor-specific functions
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

// Mock data
const mockStats = {
  pendingOrders: 5,
  inProgressOrders: 2,
  completedToday: 3,
  totalSprayed: 45.5, // hectares
};

const quickActions = [
  {
    id: '1',
    title: 'View Orders',
    icon: '📋',
    color: colors.primary,
    route: '/(uav-tabs)/orders',
  },
  {
    id: '2',
    title: 'Pending',
    icon: '⏳',
    color: '#FF9500',
    route: '/(uav-tabs)/orders?filter=pending',
  },
  {
    id: '3',
    title: 'In Progress',
    icon: '🚁',
    color: '#34C759',
    route: '/(uav-tabs)/orders?filter=in-progress',
  },
];

const recentOrders = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    fieldName: 'DongThap1 - Plot 16',
    status: 'Completed',
    date: '2024-01-15',
    area: 12.5,
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    fieldName: 'AnGiang2 - Plot 18',
    status: 'In Progress',
    date: '2024-01-16',
    area: 8.3,
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-003',
    fieldName: 'DongThap1 - Plot 20',
    status: 'Pending',
    date: '2024-01-17',
    area: 15.2,
  },
];

export const UavHomeScreen = () => {
  const router = useRouter();
  const { data: user } = useUser();

  const userName = user
    ? `${user.firstName} ${user.lastName}`.trim() || user.email
    : 'UAV Operator';

  const userInitials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
    : 'U';

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return colors.success;
      case 'in progress':
        return '#FF9500';
      case 'pending':
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Container padding="lg">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Avatar size="md" initials={userInitials} />
            <Spacer size="sm" horizontal />
            <View>
              <BodySmall color={colors.textSecondary}>Welcome back</BodySmall>
              <BodySemibold>{userName}</BodySemibold>
            </View>
          </View>
        </View>

        <Spacer size="xl" />

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card variant="elevated" style={styles.statCard}>
            <BodySmall color={colors.textSecondary}>Pending Orders</BodySmall>
            <Spacer size="xs" />
            <H3>{mockStats.pendingOrders}</H3>
          </Card>
          <Card variant="elevated" style={styles.statCard}>
            <BodySmall color={colors.textSecondary}>In Progress</BodySmall>
            <Spacer size="xs" />
            <H3>{mockStats.inProgressOrders}</H3>
          </Card>
        </View>

        <Spacer size="lg" />

        <View style={styles.statsContainer}>
          <Card variant="elevated" style={styles.statCard}>
            <BodySmall color={colors.textSecondary}>Completed Today</BodySmall>
            <Spacer size="xs" />
            <H3>{mockStats.completedToday}</H3>
          </Card>
          <Card variant="elevated" style={styles.statCard}>
            <BodySmall color={colors.textSecondary}>Total Sprayed</BodySmall>
            <Spacer size="xs" />
            <H3>{mockStats.totalSprayed} ha</H3>
          </Card>
        </View>

        <Spacer size="xl" />

        {/* Quick Actions */}
        <H4>Quick Actions</H4>
        <Spacer size="md" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              onPress={() => router.push(action.route as any)}
              style={[styles.actionCard, { borderLeftColor: action.color }]}
            >
              <View style={styles.actionIcon}>
                <Body style={styles.actionIconText}>{action.icon}</Body>
              </View>
              <Spacer size="sm" />
              <BodySemibold style={styles.actionTitle}>{action.title}</BodySemibold>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Spacer size="xl" />

        {/* Recent Orders */}
        <View style={styles.sectionHeader}>
          <H4>Recent Orders</H4>
          <TouchableOpacity onPress={() => router.push('/(uav-tabs)/orders' as any)}>
            <BodySmall color={colors.primary}>View All</BodySmall>
          </TouchableOpacity>
        </View>
        <Spacer size="md" />

        <ScrollView showsVerticalScrollIndicator={false}>
          {recentOrders.map((order) => (
            <TouchableOpacity
              key={order.id}
              onPress={() =>
                router.push({
                  pathname: '/uav/orders/[orderId]',
                  params: { orderId: order.id },
                } as any)
              }
            >
              <Card variant="elevated" style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderInfo}>
                    <BodySemibold>{order.orderNumber}</BodySemibold>
                    <BodySmall color={colors.textSecondary}>{order.fieldName}</BodySmall>
                  </View>
                  <Badge
                    variant="outline"
                    style={[
                      styles.statusBadge,
                      { borderColor: getStatusColor(order.status) },
                    ]}
                  >
                    <BodySmall style={{ color: getStatusColor(order.status) }}>
                      {order.status}
                    </BodySmall>
                  </Badge>
                </View>
                <Spacer size="sm" />
                <View style={styles.orderDetails}>
                  <View style={styles.orderDetailItem}>
                    <BodySmall color={colors.textSecondary}>Date:</BodySmall>
                    <BodySmall>{order.date}</BodySmall>
                  </View>
                  <View style={styles.orderDetailItem}>
                    <BodySmall color={colors.textSecondary}>Area:</BodySmall>
                    <BodySmall>{order.area} ha</BodySmall>
                  </View>
                </View>
              </Card>
              <Spacer size="md" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Container>
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
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    minWidth: 120,
    marginRight: spacing.md,
    ...shadows.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconText: {
    fontSize: 24,
  },
  actionTitle: {
    fontSize: 14,
  },
  orderCard: {
    padding: spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  orderDetails: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  orderDetailItem: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});

