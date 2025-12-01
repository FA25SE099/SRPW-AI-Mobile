/**
 * UAV Orders Screen
 * View spraying orders from planning
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import {
  Container,
  H3,
  H4,
  Body,
  BodySmall,
  BodySemibold,
  Card,
  Badge,
  Spacer,
  Button,
} from '../../components/ui';
import { getUavServiceOrders } from '../../libs/uav';
import { UavServiceOrder } from '../../types/api';

export const UavOrdersScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedFilter, setSelectedFilter] = useState<string>(
    (params.filter as string) || 'all',
  );
  const pageSize = 20;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['uav-orders', { page: 1, size: pageSize }],
    queryFn: () => getUavServiceOrders({ currentPage: 1, pageSize }),
  });

  const orders: UavServiceOrder[] = data?.data ?? [];

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

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return colors.error;
      case 'normal':
        return '#FF9500';
      case 'low':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const normalizeStatus = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'completed';
      default:
        return 'in-progress';
    }
  };

  const filterCounts = useMemo(() => {
    const counts: Record<'all' | 'in-progress' | 'completed', number> = {
      all: orders.length,
      'in-progress': 0,
      completed: 0,
    };
    orders.forEach((order) => {
      const slug = normalizeStatus(order.status);
      counts[slug as keyof typeof counts] += 1;
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (selectedFilter === 'all') return orders;
    return orders.filter((order) => normalizeStatus(order.status) === selectedFilter);
  }, [orders, selectedFilter]);

  const onRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Container padding="lg">
          <View style={styles.loadingContainer}>
            <Body>Loading orders...</Body>
          </View>
        </Container>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container}>
        <Container padding="lg">
          <View style={styles.loadingContainer}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Body>←</Body>
            </TouchableOpacity>
            <Spacer size="lg" />
            <Body color={colors.error}>Failed to load orders</Body>
            <Spacer size="sm" />
            <Button size="sm" onPress={() => refetch()}>
              Retry
            </Button>
          </View>
        </Container>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Container padding="lg">
        <View style={styles.header}>
          <View>
            <BodySmall color={colors.textSecondary}>Service Orders</BodySmall>
            <H3 style={styles.headerTitle}>Spraying Operations</H3>
          </View>
          <Badge variant="info">
            <BodySmall>Total {filterCounts.all}</BodySmall>
          </Badge>
        </View>

        <Spacer size="lg" />

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <BodySmall style={styles.summaryLabel}>In Progress</BodySmall>
            <BodySemibold style={styles.summaryValue}>{filterCounts['in-progress']}</BodySemibold>
          </View>
          <View style={styles.summaryCard}>
            <BodySmall style={styles.summaryLabel}>Completed</BodySmall>
            <BodySemibold style={styles.summaryValue}>{filterCounts.completed}</BodySemibold>
          </View>
        </View>

        <Spacer size="lg" />

        <View style={styles.segmentedContainer}>
          {[
            { label: 'All', value: 'all' },
            { label: 'In Progress', value: 'in-progress' },
            { label: 'Completed', value: 'completed' },
          ].map((chip) => (
            <TouchableOpacity
              key={chip.value}
              onPress={() => setSelectedFilter(chip.value as typeof selectedFilter)}
              style={[
                styles.segment,
                selectedFilter === chip.value && styles.segmentActive,
              ]}
            >
              <BodySmall
                style={[
                  styles.segmentText,
                  selectedFilter === chip.value && styles.segmentTextActive,
                ]}
              >
                {chip.label}{' '}
                {chip.value === 'all'
                  ? `(${filterCounts.all})`
                  : chip.value === 'in-progress'
                    ? `(${filterCounts['in-progress']})`
                    : `(${filterCounts.completed})`}
              </BodySmall>
            </TouchableOpacity>
          ))}
        </View>

        <Spacer size="xl" />

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Body color={colors.textSecondary}>No orders found</Body>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isFetching} onRefresh={onRefresh} />}
          >
            {filteredOrders.map((order) => (
              <TouchableOpacity
                key={order.orderId}
                onPress={() =>
                  router.push({
                    pathname: '/uav/orders/[orderId]',
                    params: { orderId: order.orderId },
                  } as any)
                }
              >
                <Card variant="elevated" style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                      <View style={styles.orderTitleRow}>
                        <BodySemibold style={styles.orderTitle}>{order.orderName}</BodySemibold>
                        <Badge
                          variant="neutral"
                          style={getPriorityBadgeStyle(getPriorityColor(order.priority))}
                        >
                          <BodySmall style={{ color: getPriorityColor(order.priority) }}>
                            {order.priority}
                          </BodySmall>
                        </Badge>
                      </View>
                      <BodySmall color={colors.textSecondary}>{order.groupName}</BodySmall>
                    </View>
                    <Badge
                      variant="neutral"
                      style={getStatusBadgeStyle(getStatusColor(order.status))}
                    >
                      <BodySmall style={{ color: getStatusColor(order.status) }}>
                        {order.status.replace(/([A-Z])/g, ' $1').trim()}
                      </BodySmall>
                    </Badge>
                  </View>
                  <Spacer size="md" />
                  <View style={styles.orderDetails}>
                    <View style={styles.orderDetailItem}>
                      <BodySmall color={colors.textSecondary}>Scheduled</BodySmall>
                      <BodySemibold>
                        {dayjs(order.scheduledDate).format('MMM D, YYYY')}
                        {order.scheduledTime ? ` • ${order.scheduledTime}` : ''}
                      </BodySemibold>
                    </View>
                    <View style={styles.orderDetailItem}>
                      <BodySmall color={colors.textSecondary}>Area</BodySmall>
                      <BodySemibold>{order.totalArea.toFixed(2)} ha</BodySemibold>
                    </View>
                    <View style={styles.orderDetailItem}>
                      <BodySmall color={colors.textSecondary}>Plots</BodySmall>
                      <BodySemibold>{order.totalPlots}</BodySemibold>
                    </View>
                    <View style={styles.progressWrapper}>
                      <BodySmall color={colors.textSecondary}>Completion</BodySmall>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${order.completionPercentage}%` },
                          ]}
                        />
                      </View>
                      <BodySemibold>{order.completionPercentage}%</BodySemibold>
                    </View>
                  </View>
                </Card>
                <Spacer size="md" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
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
    paddingTop: spacing.md,
  },
  headerTitle: {
    fontSize: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.xs,
  },
  summaryValue: {
    fontSize: 22,
    paddingTop: 12,
    marginTop: spacing.xs / 2,
  },
  summaryLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundSecondary,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.white,
    ...shadows.xs,
  },
  segmentText: {
    fontWeight: '500',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.primary,
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
  orderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  orderTitle: {
    paddingTop: 3,
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  orderDetails: {
    gap: spacing.xs,
  },
  orderDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressWrapper: {
    marginTop: spacing.sm,
    gap: spacing.xs / 2,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.backgroundSecondary,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
});

const flattenStyle = (style: ViewStyle | number) =>
  (StyleSheet.flatten(style as any) as ViewStyle) || {};

const getPriorityBadgeStyle = (color: string): ViewStyle => ({
  ...flattenStyle(styles.priorityBadge),
  borderColor: color,
});

const getStatusBadgeStyle = (color: string): ViewStyle => ({
  ...flattenStyle(styles.statusBadge),
  borderColor: color,
});


