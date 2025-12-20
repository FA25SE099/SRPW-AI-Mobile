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
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { scale, moderateScale, getFontSize, getSpacing, verticalScale } from '../../utils/responsive';
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
  { value: 'planting', label: 'Gieo trồng', icon: { name: 'seed-outline', library: 'MaterialCommunityIcons' } },
  { value: 'fertilizing', label: 'Bón phân', icon: { name: 'water-outline', library: 'Ionicons' } },
  { value: 'spraying', label: 'Phun thuốc', icon: { name: 'spray', library: 'MaterialCommunityIcons' } },
  { value: 'irrigation', label: 'Tưới tiêu', icon: { name: 'water', library: 'Ionicons' } },
  { value: 'harvesting', label: 'Thu hoạch', icon: { name: 'leaf-outline', library: 'Ionicons' } },
];

export const FarmLogScreen = () => {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const getActivityIcon = (type: string) => {
    const activity = activityTypes.find((a) => a.value === type);
    return activity?.icon || { name: 'document-text-outline', library: 'Ionicons' };
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
          <H3 style={styles.headerTitle}>Nhật ký nông trại</H3>
          <TouchableOpacity
            onPress={() => router.push('/farmer/farm-log/add' as any)}
            style={styles.addButton}
          >
            <Body color={greenTheme.primary} style={{ fontSize: getFontSize(24), fontWeight: '700' }}>+</Body>
          </TouchableOpacity>
        </View>

        <Spacer size="lg" />

        {/* Summary Card */}
        <Card variant="elevated" style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <BodySmall color={colors.textSecondary}>Tổng hoạt động</BodySmall>
              <BodySemibold style={styles.summaryNumber}>
                {filteredActivities.length}
              </BodySemibold>
            </View>
            <View>
              <BodySmall color={colors.textSecondary}>Tổng chi phí</BodySmall>
              <BodySemibold style={styles.summaryNumber} color={greenTheme.primary}>
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
              Tất cả
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                {type.icon.library === 'Ionicons' ? (
                  <Ionicons name={type.icon.name as any} size={16} color={selectedFilter === type.value ? colors.white : colors.textPrimary} />
                ) : (
                  <MaterialCommunityIcons name={type.icon.name as any} size={16} color={selectedFilter === type.value ? colors.white : colors.textPrimary} />
                )}
                <BodySmall
                  color={selectedFilter === type.value ? colors.white : colors.textPrimary}
                >
                  {type.label}
                </BodySmall>
              </View>
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
                    {(() => {
                      const icon = getActivityIcon(activity.activityType);
                      return icon.library === 'Ionicons' ? (
                        <Ionicons name={icon.name as any} size={24} color={greenTheme.primary} />
                      ) : (
                        <MaterialCommunityIcons name={icon.name as any} size={24} color={greenTheme.primary} />
                      );
                    })()}
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
                    <BodySmall color={colors.textSecondary}>Hoạt động:</BodySmall>
                    <BodySemibold>{activity.activityType}</BodySemibold>
                  </View>
                  {activity.materialName && (
                    <View style={styles.activityDetailRow}>
                      <BodySmall color={colors.textSecondary}>Vật liệu:</BodySmall>
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
    paddingTop: getSpacing(spacing.md),
    backgroundColor: greenTheme.cardBackground,
    paddingBottom: getSpacing(spacing.sm),
    borderBottomWidth: 1,
    borderBottomColor: greenTheme.border,
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(borderRadius.full),
    backgroundColor: greenTheme.primaryLighter,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: getFontSize(20),
    color: greenTheme.primary,
    fontWeight: '700',
  },
  addButton: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(borderRadius.full),
    backgroundColor: greenTheme.primaryLighter,
  },
  summaryCard: {
    padding: getSpacing(spacing.lg),
    borderRadius: moderateScale(borderRadius.lg),
    backgroundColor: greenTheme.cardBackground,
    borderWidth: 1,
    borderColor: greenTheme.border,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryNumber: {
    fontSize: getFontSize(24),
    marginTop: getSpacing(spacing.xs),
    color: greenTheme.primary,
  },
  filterContainer: {
    gap: getSpacing(spacing.sm),
    paddingRight: getSpacing(spacing.lg),
  },
  filterButton: {
    paddingHorizontal: getSpacing(spacing.md),
    paddingVertical: getSpacing(spacing.sm),
    borderRadius: moderateScale(borderRadius.lg),
    backgroundColor: greenTheme.primaryLighter,
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  filterButtonActive: {
    backgroundColor: greenTheme.primary,
    borderColor: greenTheme.primary,
  },
  activityCard: {
    padding: getSpacing(spacing.md),
    borderRadius: moderateScale(borderRadius.lg),
    backgroundColor: greenTheme.cardBackground,
    borderWidth: 1,
    borderColor: greenTheme.border,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(spacing.md),
  },
  activityIcon: {
    width: scale(48),
    height: scale(48),
    borderRadius: moderateScale(borderRadius.md),
    backgroundColor: greenTheme.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityHeaderInfo: {
    flex: 1,
  },
  costBadge: {
    alignSelf: 'flex-start',
    backgroundColor: greenTheme.primaryLight,
  },
  activityDetails: {
    gap: getSpacing(spacing.sm),
  },
  activityDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityNotes: {
    marginTop: getSpacing(spacing.xs),
    padding: getSpacing(spacing.sm),
    backgroundColor: greenTheme.primaryLighter,
    borderRadius: moderateScale(borderRadius.sm),
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
});

