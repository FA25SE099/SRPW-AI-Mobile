import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RiceVarietySeason } from '@/types/farmerCultivation';
import { colors, spacing, borderRadius } from '@/theme';

interface RiceVarietyCardProps {
  variety: RiceVarietySeason;
  selected: boolean;
  onSelect: () => void;
}

export const RiceVarietyCard: React.FC<RiceVarietyCardProps> = ({
  variety,
  selected,
  onSelect,
}) => {
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low':
        return '#10b981';
      case 'Medium':
        return '#f59e0b';
      case 'High':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getRiskLabel = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low':
        return 'Thấp';
      case 'Medium':
        return 'Trung bình';
      case 'High':
        return 'Cao';
      default:
        return riskLevel;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.varietyName}>{variety.varietyName}</Text>
          {variety.isRecommended && (
            <View style={styles.recommendedBadge}>
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text style={styles.recommendedText}>Khuyến nghị</Text>
            </View>
          )}
        </View>
        {selected && (
          <View style={styles.checkIcon}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
          </View>
        )}
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={16} color="#6b7280" />
          <Text style={styles.infoLabel}>Thời gian sinh trưởng</Text>
          <Text style={styles.infoValue}>{variety.growthDurationDays} ngày</Text>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="trending-up-outline" size={16} color="#6b7280" />
          <Text style={styles.infoLabel}>Năng suất dự kiến</Text>
          <Text style={styles.infoValue}>{variety.expectedYieldPerHectare} tấn/ha</Text>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="alert-circle-outline" size={16} color={getRiskColor(variety.riskLevel)} />
          <Text style={styles.infoLabel}>Mức độ rủi ro</Text>
          <Text style={[styles.infoValue, { color: getRiskColor(variety.riskLevel) }]}>
            {getRiskLabel(variety.riskLevel)}
          </Text>
        </View>
      </View>

      {variety.seasonalNotes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesText}>{variety.seasonalNotes}</Text>
        </View>
      )}

      {variety.optimalPlantingStart && variety.optimalPlantingEnd && (
        <View style={styles.plantingWindow}>
          <Ionicons name="calendar-outline" size={14} color="#6b7280" />
          <Text style={styles.plantingWindowText}>
            Thời gian gieo trồng tối ưu: {variety.optimalPlantingStart} - {variety.optimalPlantingEnd}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  varietyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f59e0b',
  },
  checkIcon: {
    marginLeft: spacing.sm,
  },
  infoGrid: {
    gap: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  notesSection: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: '#f9fafb',
    borderRadius: borderRadius.md,
  },
  notesText: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
  },
  plantingWindow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  plantingWindowText: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
});

