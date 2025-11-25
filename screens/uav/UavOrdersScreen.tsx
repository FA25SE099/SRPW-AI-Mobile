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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import dayjs from 'dayjs';
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

// Mock data - in real app, this would come from API
const mockOrders = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    plotName: 'DongThap1 - Plot 16',
    plotId: 'plot-1',
    scheduledDate: '2024-01-17T08:00:00Z',
    status: 'Pending',
    priority: 'High',
    area: 12.5,
    materials: [
      { name: 'Herbicide A', dosage: '2L/ha', quantity: 25 },
      { name: 'Fungicide B', dosage: '1.5L/ha', quantity: 18.75 },
    ],
    estimatedDuration: '2.5 hours',
    zoneCoordinates: [
      { latitude: 11.21129, longitude: 106.425131 },
      { latitude: 11.212688, longitude: 106.427436 },
      { latitude: 11.215, longitude: 106.43 },
      { latitude: 11.21129, longitude: 106.425131 },
    ],
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    plotName: 'AnGiang2 - Plot 18',
    plotId: 'plot-2',
    scheduledDate: '2024-01-16T14:00:00Z',
    status: 'In Progress',
    priority: 'Normal',
    area: 8.3,
    materials: [
      { name: 'Pesticide C', dosage: '1L/ha', quantity: 8.3 },
    ],
    estimatedDuration: '1.5 hours',
    zoneCoordinates: [
      { latitude: 11.213, longitude: 106.428 },
      { latitude: 11.218, longitude: 106.428 },
      { latitude: 11.218, longitude: 106.438 },
      { latitude: 11.213, longitude: 106.438 },
      { latitude: 11.213, longitude: 106.428 },
    ],
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-003',
    plotName: 'DongThap1 - Plot 20',
    plotId: 'plot-3',
    scheduledDate: '2024-01-18T10:00:00Z',
    status: 'Pending',
    priority: 'Normal',
    area: 15.2,
    materials: [
      { name: 'Fertilizer D', dosage: '3kg/ha', quantity: 45.6 },
      { name: 'Herbicide A', dosage: '2L/ha', quantity: 30.4 },
    ],
    estimatedDuration: '3 hours',
    zoneCoordinates: [
      { latitude: 11.216, longitude: 106.43 },
      { latitude: 11.221, longitude: 106.43 },
      { latitude: 11.221, longitude: 106.44 },
      { latitude: 11.216, longitude: 106.44 },
      { latitude: 11.216, longitude: 106.43 },
    ],
  },
  {
    id: '4',
    orderNumber: 'ORD-2024-004',
    plotName: 'DongThap1 - Plot 21',
    plotId: 'plot-4',
    scheduledDate: '2024-01-19T09:00:00Z',
    status: 'Pending',
    priority: 'Low',
    area: 6.8,
    materials: [
      { name: 'Pesticide C', dosage: '1L/ha', quantity: 6.8 },
    ],
    estimatedDuration: '1 hour',
    zoneCoordinates: [
      { latitude: 11.217, longitude: 106.432 },
      { latitude: 11.22, longitude: 106.432 },
      { latitude: 11.22, longitude: 106.435 },
      { latitude: 11.217, longitude: 106.435 },
      { latitude: 11.217, longitude: 106.432 },
    ],
  },
];

export const UavOrdersScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedFilter, setSelectedFilter] = useState<string>(
    (params.filter as string) || 'all',
  );
  const [refreshing, setRefreshing] = useState(false);

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

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    return {
      all: mockOrders.length,
      pending: mockOrders.filter((o) => o.status === 'Pending').length,
      'in-progress': mockOrders.filter((o) => o.status === 'In Progress').length,
      completed: mockOrders.filter((o) => o.status === 'Completed').length,
    };
  }, []);

  const filteredOrders = useMemo(() => {
    if (selectedFilter === 'all') return mockOrders;
    if (selectedFilter === 'pending') {
      return mockOrders.filter((o) => o.status === 'Pending');
    }
    if (selectedFilter === 'in-progress') {
      return mockOrders.filter((o) => o.status === 'In Progress');
    }
    if (selectedFilter === 'completed') {
      return mockOrders.filter((o) => o.status === 'Completed');
    }
    return mockOrders;
  }, [selectedFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Container padding="lg">
        {/* Header */}
        <View style={styles.header}>
          <H3 style={styles.headerTitle}>Spraying Orders</H3>
        </View>

        <Spacer size="lg" />

        {/* Filter Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity
            onPress={() => setSelectedFilter('all')}
            disabled={filterCounts.all === 0}
            style={[
              styles.filterButton,
              selectedFilter === 'all' && styles.filterButtonActive,
              filterCounts.all === 0 && styles.filterButtonDisabled,
            ]}
          >
            <BodySmall
              color={
                filterCounts.all === 0
                  ? colors.textSecondary
                  : selectedFilter === 'all'
                    ? colors.white
                    : colors.textSecondary
              }
              style={styles.filterButtonText}
            >
              All {filterCounts.all > 0 && `(${filterCounts.all})`}
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedFilter('pending')}
            disabled={filterCounts.pending === 0}
            style={[
              styles.filterButton,
              selectedFilter === 'pending' && styles.filterButtonActive,
              filterCounts.pending === 0 && styles.filterButtonDisabled,
            ]}
          >
            <BodySmall
              color={
                filterCounts.pending === 0
                  ? colors.textSecondary
                  : selectedFilter === 'pending'
                    ? colors.white
                    : colors.textSecondary
              }
              style={styles.filterButtonText}
            >
              Pending {filterCounts.pending > 0 && `(${filterCounts.pending})`}
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedFilter('in-progress')}
            disabled={filterCounts['in-progress'] === 0}
            style={[
              styles.filterButton,
              selectedFilter === 'in-progress' && styles.filterButtonActive,
              filterCounts['in-progress'] === 0 && styles.filterButtonDisabled,
            ]}
          >
            <BodySmall
              color={
                filterCounts['in-progress'] === 0
                  ? colors.textSecondary
                  : selectedFilter === 'in-progress'
                    ? colors.white
                    : colors.textSecondary
              }
              style={styles.filterButtonText}
            >
              In Progress {filterCounts['in-progress'] > 0 && `(${filterCounts['in-progress']})`}
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedFilter('completed')}
            disabled={filterCounts.completed === 0}
            style={[
              styles.filterButton,
              selectedFilter === 'completed' && styles.filterButtonActive,
              filterCounts.completed === 0 && styles.filterButtonDisabled,
            ]}
          >
            <BodySmall
              color={
                filterCounts.completed === 0
                  ? colors.textSecondary
                  : selectedFilter === 'completed'
                    ? colors.white
                    : colors.textSecondary
              }
              style={styles.filterButtonText}
            >
              Completed {filterCounts.completed > 0 && `(${filterCounts.completed})`}
            </BodySmall>
          </TouchableOpacity>
        </ScrollView>

        <Spacer size="xl" />

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Body color={colors.textSecondary}>No orders found</Body>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {filteredOrders.map((order) => (
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
                      <View style={styles.orderTitleRow}>
                        <BodySemibold style={styles.orderTitle}>{order.orderNumber}</BodySemibold>
                        <Badge
                          variant="outline"
                          style={[
                            styles.priorityBadge,
                            { borderColor: getPriorityColor(order.priority) },
                          ]}
                        >
                          <BodySmall style={{ color: getPriorityColor(order.priority) }}>
                            {order.priority}
                          </BodySmall>
                        </Badge>
                      </View>
                      <BodySmall color={colors.textSecondary}>{order.plotName}</BodySmall>
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
                  <Spacer size="md" />
                  <View style={styles.orderDetails}>
                    <View style={styles.orderDetailItem}>
                      <BodySmall color={colors.textSecondary}>Scheduled:</BodySmall>
                      <BodySemibold>
                        {dayjs(order.scheduledDate).format('MMM D, YYYY h:mm A')}
                      </BodySemibold>
                    </View>
                    <View style={styles.orderDetailItem}>
                      <BodySmall color={colors.textSecondary}>Area:</BodySmall>
                      <BodySemibold>{order.area} ha</BodySemibold>
                    </View>
                    <View style={styles.orderDetailItem}>
                      <BodySmall color={colors.textSecondary}>Duration:</BodySmall>
                      <BodySemibold>{order.estimatedDuration}</BodySemibold>
                    </View>
                  </View>
                  <Spacer size="sm" />
                  <View style={styles.materialsPreview}>
                    <BodySmall color={colors.textSecondary}>Materials:</BodySmall>
                    <BodySmall>
                      {order.materials.map((m) => m.name).join(', ')}
                    </BodySmall>
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
    flex: 1,
    textAlign: 'center',
  },
  filterContainer: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
    paddingLeft: spacing.xs,
  },
  filterButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonDisabled: {
    opacity: 0.5,
  },
  filterButtonText: {
    fontWeight: '500',
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
  materialsPreview: {
    gap: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
});

