/**
 * Material Distribution Widget
 * Home screen widget showing pending material confirmations
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, borderRadius } from '../../theme';
import { scale, moderateScale, getFontSize, getSpacing } from '../../utils/responsive';
import { Body, BodySmall, BodySemibold, Spacer } from '../ui';
import { getPendingMaterialReceipts } from '../../libs/farmer';
import { useUser } from '../../libs/auth';

export const MaterialDistributionWidget = () => {
  const router = useRouter();
  const { data: user } = useUser();

  const { data: summary, isLoading } = useQuery({
    queryKey: ['pending-material-receipts', user?.id],
    queryFn: () => getPendingMaterialReceipts(user?.id || ''),
    enabled: !!user?.id, // Only run query when we have a user ID
    refetchInterval: 60000, // Refetch every minute
  });

  // Don't show widget if no pending receipts
  if (isLoading || !summary || summary.totalPending === 0) {
    return null;
  }

  const hasOverdue = (summary.totalOverdue || 0) > 0;
  const hasUrgent = (summary.totalUrgent || 0) > 0;

  return (
    <TouchableOpacity
      style={[
        styles.widget,
        hasOverdue && styles.widgetOverdue,
        !hasOverdue && hasUrgent && styles.widgetUrgent,
      ]}
      onPress={() => router.push('/farmer/material-receipts')}
      activeOpacity={0.7}
    >
      <View style={styles.widgetContent}>
        {/* Icon with badge */}
        <View style={styles.widgetIconContainer}>
          <View style={styles.widgetIcon}>
            <Ionicons name="cube" size={28} color={greenTheme.primary} />
          </View>
          {hasOverdue && (
            <View style={styles.badge}>
              <BodySmall style={styles.badgeText}>{summary.totalOverdue}</BodySmall>
            </View>
          )}
        </View>

        {/* Text Content */}
        <View style={styles.widgetText}>
          <BodySemibold style={styles.widgetTitle}>Xác nhận vật liệu</BodySemibold>
          <Spacer size="xs" />
          <BodySmall color={colors.textSecondary} style={styles.widgetSubtitle}>
            {summary.totalPending} chờ xác nhận
            {hasOverdue && ` • ${summary.totalOverdue} quá hạn`}
            {!hasOverdue && hasUrgent && ` • ${summary.totalUrgent} khẩn cấp`}
          </BodySmall>
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
      </View>

      {/* Urgency indicator bar */}
      {hasOverdue && (
        <View style={styles.urgencyBar}>
          <Ionicons name="warning" size={14} color={colors.white} />
          <BodySmall style={styles.urgencyBarText}>Cần xác nhận ngay</BodySmall>
        </View>
      )}
      {!hasOverdue && hasUrgent && (
        <View style={[styles.urgencyBar, styles.urgencyBarWarning]}>
          <Ionicons name="time" size={14} color={colors.white} />
          <BodySmall style={styles.urgencyBarText}>Xác nhận hôm nay</BodySmall>
        </View>
      )}
    </TouchableOpacity>
  );
};

const greenTheme = {
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  primaryLighter: '#E8F5E9',
  accent: '#66BB6A',
  success: '#10B981',
  background: '#F1F8F4',
  cardBackground: '#FFFFFF',
  border: '#C8E6C9',
};

const styles = StyleSheet.create({
  widget: {
    backgroundColor: greenTheme.cardBackground,
    borderRadius: moderateScale(borderRadius.lg),
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: greenTheme.border,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  widgetOverdue: {
    borderColor: colors.error,
  },
  widgetUrgent: {
    borderColor: colors.warning,
  },
  widgetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getSpacing(spacing.md),
    gap: getSpacing(spacing.md),
  },
  widgetIconContainer: {
    position: 'relative',
  },
  widgetIcon: {
    width: scale(56),
    height: scale(56),
    borderRadius: moderateScale(borderRadius.md),
    backgroundColor: greenTheme.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -getSpacing(4),
    right: -getSpacing(4),
    backgroundColor: colors.error,
    borderRadius: moderateScale(borderRadius.full),
    minWidth: scale(20),
    height: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getSpacing(4),
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    color: colors.white,
    fontSize: getFontSize(11),
    fontWeight: '700',
  },
  widgetText: {
    flex: 1,
  },
  widgetTitle: {
    fontSize: getFontSize(16),
    color: greenTheme.primary,
    fontWeight: '700',
  },
  widgetSubtitle: {
    fontSize: getFontSize(14),
    lineHeight: moderateScale(18),
  },
  urgencyBar: {
    backgroundColor: colors.error,
    paddingVertical: getSpacing(spacing.xs),
    paddingHorizontal: getSpacing(spacing.md),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: getSpacing(spacing.xs),
  },
  urgencyBarWarning: {
    backgroundColor: colors.warning,
  },
  urgencyBarText: {
    color: colors.white,
    fontSize: getFontSize(12),
    fontWeight: '700',
  },
});

