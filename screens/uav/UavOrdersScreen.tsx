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
import {
  translateTaskStatus,
  translatePriority,
} from '../../utils/translations';

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
      case 'approved':
        return 'approved';
      default:
        return 'in-progress';
    }
  };

  const filterCounts = useMemo(() => {
    const counts: Record<'all' | 'in-progress' | 'completed' | 'approved', number> = {
      all: orders.length,
      'in-progress': 0,
      completed: 0,
      approved: 0,
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
            <Body>Đang tải đơn hàng...</Body>
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
            <Body color={colors.error}>Không thể tải đơn hàng</Body>
            <Spacer size="sm" />
            <Button size="sm" onPress={() => refetch()}>
              Thử lại
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
            <BodySmall color={greenTheme.primary} style={{ fontWeight: '600' }}>Đơn hàng</BodySmall>
            <H3 style={styles.headerTitle}>Phun thuốc</H3>
          </View>
          <Badge variant="info" style={{ backgroundColor: greenTheme.primaryLight }}>
            <BodySmall style={{ color: colors.white, fontWeight: '700' }}>Tổng {filterCounts.all}</BodySmall>
          </Badge>
        </View>

        <Spacer size="lg" />

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <BodySmall style={styles.summaryLabel}>Đang tiến hành</BodySmall>
            <BodySemibold style={styles.summaryValue}>{filterCounts['in-progress']}</BodySemibold>
          </View>
          <View style={styles.summaryCard}>
            <BodySmall style={styles.summaryLabel}>Hoàn thành</BodySmall>
            <BodySemibold style={styles.summaryValue}>{filterCounts.completed}</BodySemibold>
          </View>
        </View>

        <Spacer size="lg" />

        <View style={styles.segmentedContainer}>
          {[
            { label: 'Tất cả', value: 'all' },
            { label: 'Đang tiến hành', value: 'in-progress' },
            { label: 'Đã đặt', value: 'approved' },
            { label: 'Hoàn thành', value: 'completed' },
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
                    : chip.value === 'approved'
                      ? `(${filterCounts.approved})`
                      : `(${filterCounts.completed})`}
              </BodySmall>
            </TouchableOpacity>
          ))}
        </View>

        <Spacer size="xl" />

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Body color={colors.textSecondary}>Không tìm thấy đơn hàng</Body>
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
                            {translatePriority(order.priority)}
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
                        {translateTaskStatus(order.status)}
                      </BodySmall>
                    </Badge>
                  </View>
                  <Spacer size="md" />
                  <View style={styles.orderDetails}>
                    <View style={styles.orderDetailItem}>
                      <BodySmall color={colors.textSecondary}>Lịch</BodySmall>
                      <BodySemibold>
                        {dayjs(order.scheduledDate).format('MMM D, YYYY')}
                        {order.scheduledTime ? ` • ${order.scheduledTime}` : ''}
                      </BodySemibold>
                    </View>
                    <View style={styles.orderDetailItem}>
                      <BodySmall color={colors.textSecondary}>Diện tích</BodySmall>
                      <BodySemibold>{order.totalArea.toFixed(2)} ha</BodySemibold>
                    </View>
                    <View style={styles.orderDetailItem}>
                      <BodySmall color={colors.textSecondary}>Thửa đất</BodySmall>
                      <BodySemibold>{order.totalPlots}</BodySemibold>
                    </View>
                    <View style={styles.progressWrapper}>
                        <BodySmall color={colors.textSecondary}>Hoàn thành</BodySmall>
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
    backgroundColor: greenTheme.cardBackground,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: greenTheme.border,
  },
  headerTitle: {
    fontSize: 24,
    color: greenTheme.primary,
    fontWeight: '700',
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
    borderRadius: borderRadius.full,
    backgroundColor: greenTheme.primaryLighter,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: greenTheme.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: greenTheme.border,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 22,
    paddingTop: 12,
    marginTop: spacing.xs / 2,
    color: greenTheme.primary,
    fontWeight: '700',
  },
  summaryLabel: {
    color: greenTheme.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: borderRadius.full,
    backgroundColor: greenTheme.primaryLighter,
    padding: 4,
    paddingHorizontal: 0,
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: greenTheme.cardBackground,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: {
    fontWeight: '500',
    color: greenTheme.primary,
  },
  segmentTextActive: {
    color: greenTheme.primary,
    fontWeight: '700',
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
  orderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  orderTitle: {
    paddingTop: 3,
    fontSize: 16,
    color: greenTheme.primary,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: greenTheme.border,
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
    backgroundColor: greenTheme.primaryLighter,
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: greenTheme.primary,
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


