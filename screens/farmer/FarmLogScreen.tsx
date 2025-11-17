/**
 * Farm Log Screen
 * Record and view farm activities
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
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
import { FarmActivity } from '../../types/api';

// Mock data
const mockActivities: FarmActivity[] = [
  {
    id: '1',
    createdAt: Date.now(),
    fieldId: '1',
    fieldName: 'Field A',
    activityType: 'fertilizing',
    date: '2024-01-15',
    materialId: '1',
    materialName: 'NPK 20-20-20',
    quantity: 50,
    unit: 'kg',
    cost: 150000,
    notes: 'Applied evenly across the field',
  },
  {
    id: '2',
    createdAt: Date.now(),
    fieldId: '2',
    fieldName: 'Field B',
    activityType: 'spraying',
    date: '2024-01-14',
    materialId: '2',
    materialName: 'Pesticide X',
    quantity: 2,
    unit: 'liters',
    cost: 85000,
  },
  {
    id: '3',
    createdAt: Date.now(),
    fieldId: '3',
    fieldName: 'Field C',
    activityType: 'irrigation',
    date: '2024-01-13',
    quantity: 100,
    unit: 'm³',
    cost: 25000,
  },
];

const activityTypes = [
  { value: 'planting', label: 'Planting', icon: '🌱' },
  { value: 'fertilizing', label: 'Fertilizing', icon: '💧' },
  { value: 'spraying', label: 'Spraying', icon: '💨' },
  { value: 'irrigation', label: 'Irrigation', icon: '🚿' },
  { value: 'harvesting', label: 'Harvesting', icon: '🌾' },
];

export const FarmLogScreen = () => {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const getActivityIcon = (type: string) => {
    const activity = activityTypes.find((a) => a.value === type);
    return activity?.icon || '📝';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const filteredActivities =
    selectedFilter === 'all'
      ? mockActivities
      : mockActivities.filter((a) => a.activityType === selectedFilter);

  const totalCost = filteredActivities.reduce((sum, a) => sum + a.cost, 0);

  return (
    <SafeAreaView style={styles.container}>
      <Container padding="lg">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Body>←</Body>
          </TouchableOpacity>
          <H3 style={styles.headerTitle}>Farm Log</H3>
          <TouchableOpacity
            onPress={() => router.push('/farmer/farm-log/add' as any)}
            style={styles.addButton}
          >
            <Body color={colors.primary}>+</Body>
          </TouchableOpacity>
        </View>

        <Spacer size="lg" />

        {/* Summary Card */}
        <Card variant="elevated" style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <BodySmall color={colors.textSecondary}>Total Activities</BodySmall>
              <BodySemibold style={styles.summaryNumber}>
                {filteredActivities.length}
              </BodySemibold>
            </View>
            <View>
              <BodySmall color={colors.textSecondary}>Total Cost</BodySmall>
              <BodySemibold style={styles.summaryNumber} color={colors.primary}>
                {formatCurrency(totalCost)}
              </BodySemibold>
            </View>
          </View>
        </Card>

        <Spacer size="lg" />

        {/* Filter Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity
            onPress={() => setSelectedFilter('all')}
            style={[
              styles.filterButton,
              selectedFilter === 'all' && styles.filterButtonActive,
            ]}
          >
            <BodySmall
              color={selectedFilter === 'all' ? colors.white : colors.textPrimary}
            >
              All
            </BodySmall>
          </TouchableOpacity>
          {activityTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              onPress={() => setSelectedFilter(type.value)}
              style={[
                styles.filterButton,
                selectedFilter === type.value && styles.filterButtonActive,
              ]}
            >
              <BodySmall
                color={selectedFilter === type.value ? colors.white : colors.textPrimary}
              >
                {type.icon} {type.label}
              </BodySmall>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Spacer size="xl" />

        {/* Activities List */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {filteredActivities.map((activity) => (
            <TouchableOpacity key={activity.id}>
              <Card variant="elevated" style={styles.activityCard}>
                <View style={styles.activityCardHeader}>
                  <View style={styles.activityIcon}>
                    <Body>{getActivityIcon(activity.activityType)}</Body>
                  </View>
                  <View style={styles.activityHeaderInfo}>
                    <BodySemibold>{activity.fieldName}</BodySemibold>
                    <BodySmall color={colors.textSecondary}>
                      {dayjs(activity.date).format('MMM D, YYYY')}
                    </BodySmall>
                  </View>
                  <Badge
                    variant="primary"
                    size="sm"
                    style={styles.costBadge}
                  >
                    {formatCurrency(activity.cost)}
                  </Badge>
                </View>
                <Spacer size="md" />
                <View style={styles.activityDetails}>
                  <View style={styles.activityDetailRow}>
                    <BodySmall color={colors.textSecondary}>Activity:</BodySmall>
                    <BodySemibold>{activity.activityType}</BodySemibold>
                  </View>
                  {activity.materialName && (
                    <View style={styles.activityDetailRow}>
                      <BodySmall color={colors.textSecondary}>Material:</BodySmall>
                      <BodySemibold>
                        {activity.materialName} ({activity.quantity} {activity.unit})
                      </BodySemibold>
                    </View>
                  )}
                  {activity.notes && (
                    <View style={styles.activityNotes}>
                      <BodySmall color={colors.textSecondary}>{activity.notes}</BodySmall>
                    </View>
                  )}
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
    paddingTop: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    padding: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryNumber: {
    fontSize: 24,
    marginTop: spacing.xs,
  },
  filterContainer: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  activityCard: {
    padding: spacing.md,
  },
  activityCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityHeaderInfo: {
    flex: 1,
  },
  costBadge: {
    alignSelf: 'flex-start',
  },
  activityDetails: {
    gap: spacing.sm,
  },
  activityDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityNotes: {
    marginTop: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.sm,
  },
});

