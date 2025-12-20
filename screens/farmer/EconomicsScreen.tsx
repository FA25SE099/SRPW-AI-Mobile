/**
 * Economic Performance Screen
 * View costs, revenue, and profit per hectare
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
import Svg, { Circle, G } from 'react-native-svg';
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
} from '../../components/ui';
import { EconomicPerformance } from '../../types/api';

// Mock data
const mockEconomics: EconomicPerformance = {
  seasonId: '1',
  seasonName: 'Winter-Spring 2024',
  totalCost: 12500000,
  totalRevenue: 18750000,
  profit: 6250000,
  profitPerHectare: 833333,
  fields: [
    {
      fieldId: '1',
      fieldName: 'Field A',
      area: 2.5,
      cost: 3750000,
      revenue: 5625000,
      profit: 1875000,
    },
    {
      fieldId: '2',
      fieldName: 'Field B',
      area: 1.8,
      cost: 2700000,
      revenue: 4050000,
      profit: 1350000,
    },
    {
      fieldId: '3',
      fieldName: 'Field C',
      area: 3.2,
      cost: 4800000,
      revenue: 7200000,
      profit: 2400000,
    },
  ],
};

export const EconomicsScreen = () => {
  const router = useRouter();
  const [selectedSeason, setSelectedSeason] = useState(mockEconomics);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const totalArea = selectedSeason.fields.reduce((sum, f) => sum + f.area, 0);
  const profitMargin = ((selectedSeason.profit / selectedSeason.totalRevenue) * 100).toFixed(1);

  return (
    <SafeAreaView style={styles.container}>
      <Container padding="lg">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Body>←</Body>
          </TouchableOpacity>
          <H3 style={styles.headerTitle}>Hiệu quả kinh tế</H3>
          <View style={styles.headerRight} />
        </View>

        <Spacer size="lg" />

        {/* Season Info */}
        <Card variant="elevated" style={styles.seasonCard}>
          <H4>{selectedSeason.seasonName}</H4>
          <BodySmall color={colors.textSecondary}>
            Tổng diện tích: {totalArea.toFixed(1)} ha
          </BodySmall>
        </Card>

        <Spacer size="xl" />

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <Card variant="elevated" style={{ ...styles.summaryCard, backgroundColor: '#FF6B6B' }}>
            <Body color={colors.white} style={styles.summaryLabel}>
              Tổng chi phí
            </Body>
            <Body color={colors.white} style={styles.summaryAmount}>
              {formatCurrency(selectedSeason.totalCost)}
            </Body>
          </Card>
          <Card variant="elevated" style={{ ...styles.summaryCard, backgroundColor: greenTheme.primaryLight }}>
            <Body color={colors.white} style={styles.summaryLabel}>
              Tổng doanh thu
            </Body>
            <Body color={colors.white} style={styles.summaryAmount}>
              {formatCurrency(selectedSeason.totalRevenue)}
            </Body>
          </Card>
        </View>

        <Spacer size="md" />

        <Card variant="elevated" style={styles.profitCard}>
          <Body color={colors.white} style={styles.profitLabel}>
            Lợi nhuận ròng
          </Body>
          <Body color={colors.white} style={styles.profitAmount}>
            {formatCurrency(selectedSeason.profit)}
          </Body>
          <Spacer size="sm" />
          <View style={styles.profitDetails}>
            <BodySmall color={colors.white}>
              {formatCurrency(selectedSeason.profitPerHectare)} / ha
            </BodySmall>
            <BodySmall color={colors.white}>
              Biên lợi nhuận {profitMargin}%
            </BodySmall>
          </View>
        </Card>

        <Spacer size="xl" />

        {/* Field Breakdown */}
        <H4>Hiệu quả theo thửa đất</H4>
        <Spacer size="md" />

        <ScrollView showsVerticalScrollIndicator={false}>
          {selectedSeason.fields.map((field) => {
            const fieldProfitMargin = ((field.profit / field.revenue) * 100).toFixed(1);
            return (
              <Card key={field.fieldId} variant="elevated" style={styles.fieldCard}>
                <View style={styles.fieldCardHeader}>
                  <View>
                    <BodySemibold>{field.fieldName}</BodySemibold>
                    <BodySmall color={colors.textSecondary}>
                      {field.area} ha
                    </BodySmall>
                  </View>
                  <Badge variant="success" size="sm" style={{ backgroundColor: greenTheme.primaryLight }}>
                    {fieldProfitMargin}%
                  </Badge>
                </View>
                <Spacer size="md" />
                <View style={styles.fieldMetrics}>
                  <View style={styles.metricItem}>
                    <BodySmall color={colors.textSecondary}>Chi phí</BodySmall>
                    <BodySemibold color={colors.error}>
                      {formatCurrency(field.cost)}
                    </BodySemibold>
                  </View>
                  <View style={styles.metricItem}>
                    <BodySmall color={colors.textSecondary}>Doanh thu</BodySmall>
                    <BodySemibold color={colors.success}>
                      {formatCurrency(field.revenue)}
                    </BodySemibold>
                  </View>
                  <View style={styles.metricItem}>
                    <BodySmall color={colors.textSecondary}>Lợi nhuận</BodySmall>
                    <BodySemibold color={colors.primary}>
                      {formatCurrency(field.profit)}
                    </BodySemibold>
                  </View>
                </View>
                <Spacer size="sm" />
                <View style={styles.fieldProfitPerHa}>
                  <BodySmall color={colors.textSecondary}>
                    Lợi nhuận / ha:
                  </BodySmall>
                  <BodySemibold color={colors.primary}>
                    {formatCurrency(field.profit / field.area)}
                  </BodySemibold>
                </View>
              </Card>
            );
          })}
        </ScrollView>

        <Spacer size="xl" />
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
  headerRight: {
    width: scale(40),
  },
  seasonCard: {
    padding: getSpacing(spacing.md),
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
    gap: getSpacing(spacing.md),
  },
  summaryCard: {
    flex: 1,
    padding: getSpacing(spacing.md),
    borderRadius: moderateScale(borderRadius.lg),
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: getFontSize(12),
    marginBottom: getSpacing(spacing.xs),
  },
  summaryAmount: {
    fontSize: getFontSize(18),
    fontWeight: '700',
  },
  profitCard: {
    padding: getSpacing(spacing.lg),
    borderRadius: moderateScale(borderRadius.lg),
    backgroundColor: greenTheme.primary,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  profitLabel: {
    fontSize: getFontSize(14),
    marginBottom: getSpacing(10),
    opacity: 0.9,
  },
  profitAmount: {
    fontSize: getFontSize(20),
    fontWeight: '700',
    paddingTop: getSpacing(10),
  },
  profitDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: getSpacing(spacing.xs),
  },
  fieldCard: {
    padding: getSpacing(spacing.md),
    marginBottom: getSpacing(spacing.md),
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
  fieldCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: getSpacing(spacing.sm),
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  fieldProfitPerHa: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: getSpacing(spacing.sm),
    borderTopWidth: 1,
    borderTopColor: greenTheme.border,
  },
});

