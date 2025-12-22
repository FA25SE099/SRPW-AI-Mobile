import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Body, BodySmall, BodySemibold, H4, Spacer, Button } from '../../components/ui';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { scale, moderateScale, getFontSize, getSpacing, verticalScale } from '../../utils/responsive';
import { useQuery } from '@tanstack/react-query';
import { getCultivationTaskDetail } from '../../libs/farmer';
import { CultivationTaskDetailResponse } from '../../types/api';
import dayjs from 'dayjs';

type Props = {
  visible: boolean;
  taskId?: string | null;
  onClose: () => void;
};

export const TaskDetailModal = ({ visible, taskId, onClose }: Props) => {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['cultivation-task-detail', taskId],
    queryFn: () => getCultivationTaskDetail(taskId || ''),
    enabled: visible && Boolean(taskId),
  });

  if (!visible) {
    return null;
  }

  const renderContent = () => {
    if (isLoading || isFetching) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Spacer size="sm" />
          <BodySmall color={colors.textSecondary}>Đang tải chi tiết công việc...</BodySmall>
        </View>
      );
    }

    if (isError || !data) {
      return (
        <View style={styles.centered}>
          <Body color={colors.error}>Không thể tải chi tiết công việc</Body>
          <Spacer size="sm" />
          <Button size="sm" onPress={() => refetch()}>
            Thử lại
          </Button>
          <Spacer size="sm" />
          <Button variant="outline" size="sm" onPress={onClose}>
            Đóng
          </Button>
        </View>
      );
    }

    const detail: CultivationTaskDetailResponse = data;

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <BodySmall color={colors.textSecondary}>{detail.plotName}</BodySmall>
        <H4 style={styles.title}>{detail.taskName}</H4>

        <View style={styles.badgeRow}>
          <View style={[styles.statusBadge, { backgroundColor: greenTheme.primaryLighter }]}>
            <BodySmall style={[styles.badgeText, { color: greenTheme.primary }]}>
              {detail.status.replace(/([A-Z])/g, ' $1').trim()}
            </BodySmall>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: greenTheme.primaryLighter }]}>
            <BodySmall style={[styles.badgeText, { color: greenTheme.primary }]}>Ưu tiên: {detail.priority}</BodySmall>
          </View>
        </View>

        {detail.description && (
          <>
            <BodySemibold>Mô tả</BodySemibold>
            <Spacer size="xs" />
            <BodySmall color={colors.textSecondary}>{detail.description}</BodySmall>
            <Spacer size="md" />
          </>
        )}

        <BodySemibold>Lịch trình</BodySemibold>
        <Spacer size="xs" />
        <View style={styles.infoRow}>
          <BodySmall color={colors.textSecondary}>Dự kiến:</BodySmall>
          <BodySmall>{dayjs(detail.plannedScheduledDate).format('MMM D, YYYY')}</BodySmall>
        </View>
        {detail.actualStartDate && (
          <View style={styles.infoRow}>
            <BodySmall color={colors.textSecondary}>Bắt đầu thực tế:</BodySmall>
            <BodySmall>{dayjs(detail.actualStartDate).format('MMM D, YYYY')}</BodySmall>
          </View>
        )}
        {detail.actualEndDate && (
          <View style={styles.infoRow}>
            <BodySmall color={colors.textSecondary}>Kết thúc thực tế:</BodySmall>
            <BodySmall>{dayjs(detail.actualEndDate).format('MMM D, YYYY')}</BodySmall>
          </View>
        )}

        <Spacer size="md" />

        <BodySemibold>Chi phí & Diện tích</BodySemibold>
        <Spacer size="xs" />
        <View style={styles.infoRow}>
          <BodySmall color={colors.textSecondary}>Vật liệu dự kiến:</BodySmall>
          <BodySmall>{detail.estimatedMaterialCost.toLocaleString()}₫</BodySmall>
        </View>
        <View style={styles.infoRow}>
          <BodySmall color={colors.textSecondary}>Vật liệu thực tế:</BodySmall>
          <BodySmall>{detail.actualMaterialCost.toLocaleString()}₫</BodySmall>
        </View>
        {detail.actualServiceCost > 0 && (
          <View style={styles.infoRow}>
            <BodySmall color={colors.textSecondary}>Dịch vụ thực tế:</BodySmall>
            <BodySmall>{detail.actualServiceCost.toLocaleString()}₫</BodySmall>
          </View>
        )}
        <View style={styles.infoRow}>
          <BodySmall color={colors.textSecondary}>Diện tích thửa:</BodySmall>
          <BodySmall>{detail.plotArea?.toFixed(2)} ha</BodySmall>
        </View>

        {detail.materials && detail.materials.length > 0 && (
          <>
            <Spacer size="lg" />
            <BodySemibold>Vật liệu</BodySemibold>
            <Spacer size="xs" />
            {detail.materials.map((material) => (
              <View key={material.materialId} style={styles.materialCard}>
                <BodySemibold>{material.materialName}</BodySemibold>
                <BodySmall color={colors.textSecondary}>
                  Dự kiến: {material.plannedQuantityPerHa} {material.materialUnit}/ha • Dự kiến chi phí:{' '}
                  {material.plannedTotalEstimatedCost.toLocaleString()}₫
                </BodySmall>
                <BodySmall color={colors.textSecondary}>
                  Số lượng dự kiến: {material.actualQuantityUsed} {material.materialUnit} • Chi phí thực tế:{' '}
                  {material.actualCost.toLocaleString()}₫
                </BodySmall>
                {material.logNotes && (
                  <BodySmall color={colors.textSecondary}>Ghi chú: {material.logNotes}</BodySmall>
                )}
              </View>
            ))}
          </>
        )}

        {detail.farmLogs && detail.farmLogs.length > 0 && (
          <>
            <Spacer size="lg" />
            <BodySemibold>Nhật ký nông trại</BodySemibold>
            <Spacer size="xs" />
            {detail.farmLogs.map((log) => (
              <View key={log.farmLogId} style={styles.logCard}>
                <BodySemibold>
                  {dayjs(log.loggedDate).format('MMM D, YYYY • HH:mm')}
                </BodySemibold>
                <BodySmall color={colors.textSecondary}>
                  Hoàn thành: {log.completionPercentage}%
                </BodySmall>
                {log.workDescription && (
                  <BodySmall color={colors.textSecondary}>{log.workDescription}</BodySmall>
                )}
                {typeof log.actualServiceCost === 'number' && (
                  <BodySmall color={colors.textSecondary}>
                    Service cost: {log.actualServiceCost.toLocaleString()}₫
                  </BodySmall>
                )}
                {log.photoUrls && log.photoUrls.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.photoRow}
                  >
                    {log.photoUrls.map((url, index) => (
                      <Image key={index} source={{ uri: url }} style={styles.photo} />
                    ))}
                  </ScrollView>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    );
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <H4>Chi tiết công việc</H4>
            <TouchableOpacity onPress={onClose}>
              <Body style={{ fontSize: 18 }}>✕</Body>
            </TouchableOpacity>
          </View>
          <Spacer size="sm" />
          {renderContent()}
          <Spacer size="lg" />
          <Button onPress={onClose} style={{ backgroundColor: greenTheme.primary }}>Đóng</Button>
        </View>
      </View>
    </Modal>
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
    backgroundColor: greenTheme.cardBackground,
    borderTopLeftRadius: moderateScale(borderRadius['2xl']),
    borderTopRightRadius: moderateScale(borderRadius['2xl']),
    padding: getSpacing(spacing.lg),
    borderTopWidth: 3,
    borderTopColor: greenTheme.primary,
    ...shadows.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: getSpacing(spacing.sm),
    borderBottomWidth: 1,
    borderBottomColor: greenTheme.border,
  },
  contentContainer: {
    paddingBottom: getSpacing(spacing.lg),
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getSpacing(spacing.xl),
  },
  title: {
    marginTop: getSpacing(spacing.xs),
    fontSize: getFontSize(18),
    color: greenTheme.primary,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: getSpacing(spacing.sm),
    marginVertical: getSpacing(spacing.sm),
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: getSpacing(spacing.sm),
    paddingVertical: getSpacing(spacing.xs),
    borderRadius: moderateScale(borderRadius.full),
  },
  badgeText: {
    fontSize: getFontSize(12),
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: getSpacing(spacing.xs / 2),
  },
  materialCard: {
    padding: getSpacing(spacing.sm),
    borderRadius: moderateScale(borderRadius.md),
    backgroundColor: greenTheme.primaryLighter,
    marginBottom: getSpacing(spacing.sm),
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  logCard: {
    padding: getSpacing(spacing.sm),
    borderRadius: moderateScale(borderRadius.md),
    borderWidth: 1,
    borderColor: greenTheme.border,
    marginBottom: getSpacing(spacing.sm),
    gap: getSpacing(spacing.xs / 2),
    backgroundColor: greenTheme.primaryLighter,
  },
  photoRow: {
    marginTop: getSpacing(spacing.xs),
  },
  photo: {
    width: scale(72),
    height: scale(72),
    borderRadius: moderateScale(borderRadius.sm),
    marginRight: getSpacing(spacing.xs),
    backgroundColor: greenTheme.primaryLighter,
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
});


