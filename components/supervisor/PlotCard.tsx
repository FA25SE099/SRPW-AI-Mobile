/**
 * Plot Card Component
 * Displays a completed plot with polygon
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { BodySemibold, BodySmall, Button } from '../ui';
import { PlotDTO, PlotStatus } from '../../libs/supervisor';

type PlotCardProps = {
  plot: PlotDTO;
  isFocused: boolean;
  isEditing: boolean;
  onFocus: (plot: PlotDTO) => void;
  onEdit: (plot: PlotDTO) => void;
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

export const PlotCard: React.FC<PlotCardProps> = ({ plot, isFocused, isEditing, onFocus, onEdit }) => {
  return (
    <TouchableOpacity
      onPress={() => onFocus(plot)}
      style={[
        styles.card,
        isFocused && styles.cardFocused,
        isEditing && styles.cardEditing,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
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
      <View style={styles.footer}>
        <BodySmall color={colors.success} style={styles.completedBadge}>
          ✓ Polygon available
        </BodySmall>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onEdit(plot);
          }}
          style={styles.editButton}
        >
          <BodySmall color={colors.primary} style={styles.editButtonText}>
            ✏️ Edit
          </BodySmall>
        </TouchableOpacity>
      </View>
      {isEditing && (
        <BodySmall color={colors.warning || '#FF9500'} style={styles.editingLabel}>
          → Editing in progress...
        </BodySmall>
      )}
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
  cardEditing: {
    borderColor: colors.warning || '#FF9500',
    backgroundColor: '#FFF3E0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  headerLeft: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  completedBadge: {
    flex: 1,
  },
  editButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primaryLighter + '30',
  },
  editButtonText: {
    fontWeight: '600',
    fontSize: 12,
  },
  editingLabel: {
    marginTop: spacing.xs,
    fontSize: 12,
    fontWeight: '600',
  },
});

