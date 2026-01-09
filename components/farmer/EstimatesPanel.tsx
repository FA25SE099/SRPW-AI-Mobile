import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CultivationValidation } from '@/types/farmerCultivation';
import { colors, spacing, borderRadius } from '@/theme';

interface EstimatesPanelProps {
  validation: CultivationValidation;
  plotArea: number;
}

export const EstimatesPanel: React.FC<EstimatesPanelProps> = ({ validation, plotArea }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (!validation.isValid) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="calculator-outline" size={24} color="#10b981" />
        <Text style={styles.title}>Ước tính</Text>
      </View>

      <View style={styles.grid}>
        {validation.estimatedHarvestDate && (
          <View style={styles.estimateCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
            </View>
            <View style={styles.estimateContent}>
              <Text style={styles.estimateLabel}>Ngày thu hoạch dự kiến</Text>
              <Text style={styles.estimateValue}>
                {formatDate(validation.estimatedHarvestDate)}
              </Text>
            </View>
          </View>
        )}

        {validation.growthDurationDays && (
          <View style={styles.estimateCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="time-outline" size={20} color="#8b5cf6" />
            </View>
            <View style={styles.estimateContent}>
              <Text style={styles.estimateLabel}>Thời gian sinh trưởng</Text>
              <Text style={styles.estimateValue}>{validation.growthDurationDays} ngày</Text>
            </View>
          </View>
        )}

        {validation.expectedYield && (
          <View style={styles.estimateCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="trending-up-outline" size={20} color="#10b981" />
            </View>
            <View style={styles.estimateContent}>
              <Text style={styles.estimateLabel}>Năng suất dự kiến</Text>
              <Text style={styles.estimateValue}>
                {validation.expectedYield.toFixed(2)} tấn
              </Text>
              <Text style={styles.estimateSubtext}>
                ({(validation.expectedYield / plotArea).toFixed(2)} tấn/ha)
              </Text>
            </View>
          </View>
        )}

        {validation.estimatedRevenue && (
          <View style={styles.estimateCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="cash-outline" size={20} color="#f59e0b" />
            </View>
            <View style={styles.estimateContent}>
              <Text style={styles.estimateLabel}>Doanh thu dự kiến</Text>
              <Text style={styles.estimateValue}>
                {formatCurrency(validation.estimatedRevenue)}
              </Text>
              <Text style={styles.estimateSubtext}>
                {formatCurrency(validation.estimatedRevenue / plotArea)}/ha
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.disclaimer}>
        <Ionicons name="information-circle-outline" size={16} color="#6b7280" />
        <Text style={styles.disclaimerText}>
          Các ước tính trên dựa trên dữ liệu lịch sử và có thể thay đổi tùy thuộc vào điều kiện thực tế.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  grid: {
    gap: spacing.md,
  },
  estimateCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: '#f9fafb',
    borderRadius: borderRadius.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  estimateContent: {
    flex: 1,
  },
  estimateLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  estimateValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  estimateSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: '#f9fafb',
    borderRadius: borderRadius.md,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
});

