/**
 * Material Receipt Card Component
 * Displays a pending material receipt with urgency indicators
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { colors, spacing, borderRadius } from '../../theme';
import { scale, moderateScale, getFontSize, getSpacing } from '../../utils/responsive';
import {
  Body,
  BodySmall,
  BodySemibold,
  Card,
  Spacer,
} from '../ui';
import { PendingMaterialReceiptResponse } from '../../types/api';

type MaterialReceiptCardProps = {
  receipt: PendingMaterialReceiptResponse;
  onConfirm: () => void;
  onViewImage?: (imageUrl: string) => void;
};

export const MaterialReceiptCard: React.FC<MaterialReceiptCardProps> = ({
  receipt,
  onConfirm,
  onViewImage,
}) => {
  // Calculate days until deadline
  const daysUntilDeadline = dayjs(receipt.farmerConfirmationDeadline).diff(dayjs(), 'day');
  const isOverdue = receipt.isFarmerOverdue || daysUntilDeadline < 0;
  const isUrgent = !isOverdue && daysUntilDeadline <= 1;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onConfirm}
      style={[
        styles.cardWrapper,
        isOverdue && styles.cardOverdue,
        isUrgent && styles.cardUrgent,
      ]}
    >
      <Card variant="elevated" style={styles.card}>
        {/* Urgency Banner */}
        {isOverdue && (
          <View style={styles.overdueBar}>
            <Ionicons name="warning" size={16} color={colors.white} />
            <BodySmall style={styles.overdueBarText}>
              ⚠️ Quá hạn {Math.abs(daysUntilDeadline)} ngày
            </BodySmall>
          </View>
        )}
        {isUrgent && !isOverdue && (
          <View style={styles.urgentBar}>
            <Ionicons name="time" size={16} color={colors.white} />
            <BodySmall style={styles.urgentBarText}>
              ⏰ Xác nhận hôm nay!
            </BodySmall>
          </View>
        )}

        {/* Material Header */}
        <View style={styles.materialHeader}>
          <View style={styles.materialIcon}>
            <Ionicons name="cube" size={32} color={greenTheme.primary} />
          </View>
          <View style={styles.materialInfo}>
            <BodySemibold style={styles.materialName}>
              {receipt.materialName}
            </BodySemibold>
            <Body style={styles.quantity}>
              {receipt.quantity} {receipt.unit}
            </Body>
          </View>
        </View>

        <Spacer size="md" />

        {/* Plot Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color={greenTheme.primary} />
            <BodySmall color={greenTheme.primary} style={styles.label}>
              Thửa đất:
            </BodySmall>
            <Body style={styles.value}>{receipt.plotName}</Body>
          </View>
        </View>

        <Spacer size="sm" />

        {/* Distribution Info */}
        <View style={styles.distributionInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={14} color={colors.textSecondary} />
            <BodySmall color={colors.textSecondary} style={styles.label}>
              Phân phối bởi:
            </BodySmall>
            <BodySmall style={styles.value}>{receipt.supervisorName}</BodySmall>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={14} color={colors.textSecondary} />
            <BodySmall color={colors.textSecondary} style={styles.label}>
              Ngày phân phối:
            </BodySmall>
            <BodySmall style={styles.value}>
              {dayjs(receipt.actualDistributionDate).format('DD/MM/YYYY')}
            </BodySmall>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name="time"
              size={14}
              color={isOverdue ? colors.error : isUrgent ? colors.warning : colors.textSecondary}
            />
            <BodySmall
              color={isOverdue ? colors.error : isUrgent ? colors.warning : colors.textSecondary}
              style={styles.label}
            >
              Xác nhận trước:
            </BodySmall>
            <BodySmall
              style={[
                styles.value,
                isOverdue && styles.overdueText,
                isUrgent && styles.urgentText,
              ]}
            >
              {dayjs(receipt.farmerConfirmationDeadline).format('DD/MM/YYYY')}
            </BodySmall>
          </View>
        </View>

        {/* Supervisor Notes */}
        {receipt.supervisorNotes && (
          <>
            <Spacer size="sm" />
            <View style={styles.notesSection}>
              <BodySmall style={styles.notesLabel}>Ghi chú từ giám sát viên:</BodySmall>
              <BodySmall color={colors.textSecondary} style={styles.notesText}>
                {receipt.supervisorNotes}
              </BodySmall>
            </View>
          </>
        )}

        {/* Photos */}
        {receipt.imageUrls && receipt.imageUrls.length > 0 && (
          <>
            <Spacer size="sm" />
            <View style={styles.photosSection}>
              <BodySmall style={styles.photosLabel}>Ảnh giao hàng:</BodySmall>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.photosScroll}
              >
                {receipt.imageUrls.map((url, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => onViewImage?.(url)}
                    style={styles.photoThumbnail}
                  >
                    <Image source={{ uri: url }} style={styles.thumbnailImage} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        )}

        <Spacer size="md" />

        {/* Confirm Button */}
        <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
          <Ionicons name="checkmark-circle" size={20} color={colors.white} />
          <BodySemibold style={styles.confirmButtonText}>Xác nhận đã nhận</BodySemibold>
        </TouchableOpacity>
      </Card>
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
  cardWrapper: {
    marginBottom: getSpacing(spacing.md),
  },
  cardOverdue: {
    borderColor: colors.error,
    borderWidth: 2,
    borderRadius: moderateScale(borderRadius.lg),
  },
  cardUrgent: {
    borderColor: colors.warning,
    borderWidth: 2,
    borderRadius: moderateScale(borderRadius.lg),
  },
  card: {
    padding: getSpacing(spacing.lg),
    borderRadius: moderateScale(borderRadius.lg),
    backgroundColor: greenTheme.cardBackground,
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  overdueBar: {
    backgroundColor: colors.error,
    marginHorizontal: -getSpacing(spacing.lg),
    marginTop: -getSpacing(spacing.lg),
    marginBottom: getSpacing(spacing.md),
    paddingVertical: getSpacing(spacing.sm),
    paddingHorizontal: getSpacing(spacing.md),
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(spacing.xs),
    borderTopLeftRadius: moderateScale(borderRadius.lg),
    borderTopRightRadius: moderateScale(borderRadius.lg),
  },
  overdueBarText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: getFontSize(13),
  },
  urgentBar: {
    backgroundColor: colors.warning,
    marginHorizontal: -getSpacing(spacing.lg),
    marginTop: -getSpacing(spacing.lg),
    marginBottom: getSpacing(spacing.md),
    paddingVertical: getSpacing(spacing.sm),
    paddingHorizontal: getSpacing(spacing.md),
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(spacing.xs),
    borderTopLeftRadius: moderateScale(borderRadius.lg),
    borderTopRightRadius: moderateScale(borderRadius.lg),
  },
  urgentBarText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: getFontSize(13),
  },
  materialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(spacing.md),
  },
  materialIcon: {
    width: scale(56),
    height: scale(56),
    borderRadius: moderateScale(borderRadius.md),
    backgroundColor: greenTheme.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: getFontSize(18),
    fontWeight: '700',
    color: greenTheme.primary,
  },
  quantity: {
    fontSize: getFontSize(16),
    color: colors.textSecondary,
    marginTop: getSpacing(2),
  },
  infoCard: {
    backgroundColor: greenTheme.primaryLighter,
    borderRadius: moderateScale(borderRadius.md),
    padding: getSpacing(spacing.sm),
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  distributionInfo: {
    gap: getSpacing(spacing.xs),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(spacing.xs),
  },
  label: {
    fontWeight: '600',
  },
  value: {
    flex: 1,
    fontSize: getFontSize(14),
  },
  overdueText: {
    color: colors.error,
    fontWeight: '700',
  },
  urgentText: {
    color: colors.warning,
    fontWeight: '700',
  },
  notesSection: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: moderateScale(borderRadius.md),
    padding: getSpacing(spacing.sm),
  },
  notesLabel: {
    fontWeight: '600',
    marginBottom: getSpacing(4),
    color: greenTheme.primary,
  },
  notesText: {
    lineHeight: moderateScale(20),
  },
  photosSection: {
    gap: getSpacing(spacing.xs),
  },
  photosLabel: {
    fontWeight: '600',
    color: greenTheme.primary,
  },
  photosScroll: {
    marginTop: getSpacing(spacing.xs),
  },
  photoThumbnail: {
    width: scale(80),
    height: scale(80),
    borderRadius: moderateScale(borderRadius.md),
    marginRight: getSpacing(spacing.sm),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  confirmButton: {
    backgroundColor: greenTheme.primary,
    borderRadius: moderateScale(borderRadius.lg),
    paddingVertical: getSpacing(spacing.md),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: getSpacing(spacing.xs),
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: getFontSize(16),
    fontWeight: '700',
  },
});

