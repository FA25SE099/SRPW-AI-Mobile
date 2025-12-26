import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/theme';

interface DeadlineCountdownProps {
  deadline: string;
  daysRemaining: number;
}

export const DeadlineCountdown: React.FC<DeadlineCountdownProps> = ({
  deadline,
  daysRemaining,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUrgencyColor = () => {
    if (daysRemaining <= 0) return '#ef4444';
    if (daysRemaining <= 3) return '#f59e0b';
    if (daysRemaining <= 7) return '#3b82f6';
    return '#10b981';
  };

  const getUrgencyBgColor = () => {
    if (daysRemaining <= 0) return '#fef2f2';
    if (daysRemaining <= 3) return '#fffbeb';
    if (daysRemaining <= 7) return '#eff6ff';
    return '#f0fdf4';
  };

  const getUrgencyBorderColor = () => {
    if (daysRemaining <= 0) return '#fecaca';
    if (daysRemaining <= 3) return '#fde68a';
    if (daysRemaining <= 7) return '#bfdbfe';
    return '#bbf7d0';
  };

  const getUrgencyMessage = () => {
    if (daysRemaining <= 0) return 'Đã quá hạn!';
    if (daysRemaining === 1) return 'Còn 1 ngày!';
    if (daysRemaining <= 3) return `Còn ${daysRemaining} ngày - Khẩn cấp!`;
    if (daysRemaining <= 7) return `Còn ${daysRemaining} ngày`;
    return `Còn ${daysRemaining} ngày`;
  };

  const urgencyColor = getUrgencyColor();
  const urgencyBgColor = getUrgencyBgColor();
  const urgencyBorderColor = getUrgencyBorderColor();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: urgencyBgColor, borderColor: urgencyBorderColor },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: urgencyColor }]}>
          <Ionicons name="time-outline" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.content}>
          <Text style={[styles.urgencyText, { color: urgencyColor }]}>
            {getUrgencyMessage()}
          </Text>
          <Text style={styles.deadlineText}>
            Hạn chọn: {formatDate(deadline)}
          </Text>
        </View>
      </View>

      {daysRemaining <= 3 && daysRemaining > 0 && (
        <View style={styles.warningSection}>
          <Ionicons name="warning-outline" size={16} color={urgencyColor} />
          <Text style={[styles.warningText, { color: urgencyColor }]}>
            Vui lòng hoàn thành lựa chọn của bạn trước khi hết hạn!
          </Text>
        </View>
      )}

      {daysRemaining <= 0 && (
        <View style={styles.warningSection}>
          <Ionicons name="close-circle-outline" size={16} color={urgencyColor} />
          <Text style={[styles.warningText, { color: urgencyColor }]}>
            Đã quá hạn chọn. Vui lòng liên hệ với quản lý để được hỗ trợ.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  urgencyText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  deadlineText: {
    fontSize: 13,
    color: '#6b7280',
  },
  warningSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
});

