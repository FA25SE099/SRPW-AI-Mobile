import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlotCultivationSelection } from '@/types/farmerCultivation';
import { colors, spacing, borderRadius } from '@/theme';

interface PlotSelectionCardProps {
  selection: PlotCultivationSelection;
  onPress?: () => void;
  actionButton?: React.ReactNode;
}

export const PlotSelectionCard: React.FC<PlotSelectionCardProps> = ({
  selection,
  onPress,
  actionButton,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa chọn';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      style={[styles.card, selection.isConfirmed && styles.cardConfirmed]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons
            name={selection.isConfirmed ? 'checkmark-circle' : 'alert-circle-outline'}
            size={24}
            color={selection.isConfirmed ? '#10b981' : '#f59e0b'}
          />
          <View style={styles.titleContent}>
            <Text style={styles.plotName}>{selection.plotName}</Text>
            <Text style={styles.plotArea}>{selection.plotArea} ha</Text>
          </View>
        </View>
        {selection.isConfirmed && (
          <View style={styles.confirmedBadge}>
            <Text style={styles.confirmedText}>Đã xác nhận</Text>
          </View>
        )}
      </View>

      {selection.isConfirmed && selection.riceVarietyName ? (
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Ionicons name="leaf-outline" size={16} color="#6b7280" />
            <Text style={styles.detailLabel}>Giống lúa:</Text>
            <Text style={styles.detailValue}>{selection.riceVarietyName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <Text style={styles.detailLabel}>Ngày gieo trồng:</Text>
            <Text style={styles.detailValue}>{formatDate(selection.plantingDate)}</Text>
          </View>

          {selection.estimatedHarvestDate && (
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color="#6b7280" />
              <Text style={styles.detailLabel}>Thu hoạch dự kiến:</Text>
              <Text style={styles.detailValue}>{formatDate(selection.estimatedHarvestDate)}</Text>
            </View>
          )}

          {selection.expectedYield && (
            <View style={styles.detailRow}>
              <Ionicons name="trending-up-outline" size={16} color="#6b7280" />
              <Text style={styles.detailLabel}>Năng suất dự kiến:</Text>
              <Text style={styles.detailValue}>{selection.expectedYield.toFixed(2)} tấn</Text>
            </View>
          )}

          {selection.selectionDate && (
            <View style={styles.selectionDateRow}>
              <Text style={styles.selectionDateText}>
                Đã chọn vào {formatDate(selection.selectionDate)}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.pendingSection}>
          <Text style={styles.pendingText}>Chưa chọn giống lúa và ngày gieo trồng</Text>
          {actionButton}
        </View>
      )}
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardConfirmed: {
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  titleContent: {
    flex: 1,
  },
  plotName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  plotArea: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  confirmedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  confirmedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  detailsSection: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    textAlign: 'right',
  },
  selectionDateRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  selectionDateText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  pendingSection: {
    gap: spacing.md,
  },
  pendingText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});

