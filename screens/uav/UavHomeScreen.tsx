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

// Green theme colors for farmer-friendly design
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
    color: greenTheme.primary,
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
    color: greenTheme.primaryLight,
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
              <BodySmall color={greenTheme.primary} style={{ fontWeight: '600' }}>Welcome back</BodySmall>
              <BodySemibold style={{ color: greenTheme.primary }}>{userName}</BodySemibold>
            </View>
          </View>
        </View>

        <Spacer size="xl" />

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card variant="elevated" style={styles.statCard}>
            <BodySmall color={greenTheme.primary} style={{ fontWeight: '600' }}>Pending Orders</BodySmall>
            <Spacer size="xs" />
            <H3 style={{ color: greenTheme.primary }}>{mockStats.pendingOrders}</H3>
          </Card>
          <Card variant="elevated" style={styles.statCard}>
            <BodySmall color={greenTheme.primary} style={{ fontWeight: '600' }}>In Progress</BodySmall>
            <Spacer size="xs" />
            <H3 style={{ color: greenTheme.primary }}>{mockStats.inProgressOrders}</H3>
          </Card>
        </View>

        <Spacer size="lg" />

        <View style={styles.statsContainer}>
          <Card variant="elevated" style={styles.statCard}>
            <BodySmall color={greenTheme.primary} style={{ fontWeight: '600' }}>Completed Today</BodySmall>
            <Spacer size="xs" />
            <H3 style={{ color: greenTheme.success }}>{mockStats.completedToday}</H3>
          </Card>
          <Card variant="elevated" style={styles.statCard}>
            <BodySmall color={greenTheme.primary} style={{ fontWeight: '600' }}>Total Sprayed</BodySmall>
            <Spacer size="xs" />
            <H3 style={{ color: greenTheme.primary }}>{mockStats.totalSprayed} ha</H3>
          </Card>
        </View>

        <Spacer size="xl" />

        {/* Quick Actions */}
        <H4 style={{ color: greenTheme.primary }}>Quick Actions</H4>
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
          <H4 style={{ color: greenTheme.primary }}>Recent Orders</H4>
          <TouchableOpacity onPress={() => router.push('/(uav-tabs)/orders' as any)}>
            <BodySmall color={greenTheme.primary} style={{ fontWeight: '600' }}>View All</BodySmall>
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
                    variant="neutral"
                    style={{
                      ...styles.statusBadge,
                      borderColor: getStatusColor(order.status),
                    }}
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
    backgroundColor: greenTheme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: greenTheme.cardBackground,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: greenTheme.border,
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
    backgroundColor: greenTheme.cardBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: greenTheme.border,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionCard: {
    backgroundColor: greenTheme.cardBackground,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: greenTheme.border,
    minWidth: 120,
    marginRight: spacing.md,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: greenTheme.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconText: {
    fontSize: 24,
  },
  actionTitle: {
    fontSize: 14,
    color: greenTheme.primary,
    fontWeight: '600',
  },
  orderCard: {
    padding: spacing.md,
    backgroundColor: greenTheme.cardBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: greenTheme.border,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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

