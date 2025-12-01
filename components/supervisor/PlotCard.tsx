/**
 * Plot Card Component
 * Displays a completed plot with polygon
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { BodySemibold, BodySmall } from '../ui';
import { PlotDTO, PlotStatus } from '../../libs/supervisor';

type PlotCardProps = {
  plot: PlotDTO;
  isFocused: boolean;
  onFocus: (plot: PlotDTO) => void;
};

const getStatusColor = (status: PlotStatus): string => {
  switch (status) {
    case 'Active':
      return colors.success;
    case 'Emergency':
      return colors.error;
    case 'Inactive':
      return colors.textSecondary;
    default:
      return colors.textSecondary;
  }
};

export const PlotCard: React.FC<PlotCardProps> = ({ plot, isFocused, onFocus }) => {
  return (
    <TouchableOpacity
      onPress={() => onFocus(plot)}
      style={[styles.card, isFocused && styles.cardFocused]}
    >
      <View style={styles.header}>
        <View>
          <BodySemibold>
            Plot {plot.soThua}/{plot.soTo}
          </BodySemibold>
          <BodySmall color={colors.textSecondary}>
            {plot.farmerName}
          </BodySmall>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              borderColor: getStatusColor(plot.status),
              borderWidth: 1,
              backgroundColor: 'transparent',
            },
          ]}
        >
          <BodySmall style={{ color: getStatusColor(plot.status) }}>
            {plot.status}
          </BodySmall>
        </View>
      </View>
      <BodySmall color={colors.textSecondary}>
        {plot.area} ha • {plot.varietyName || 'N/A'}
      </BodySmall>
      <BodySmall color={colors.success} style={styles.completedBadge}>
        ✓ Polygon available
      </BodySmall>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  cardFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLighter + '20',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  completedBadge: {
    marginTop: spacing.xs,
  },
});

