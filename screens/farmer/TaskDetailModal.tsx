import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Body, BodySmall, BodySemibold, H4, Spacer, Button } from '../../components/ui';
import { colors, spacing, borderRadius, shadows } from '../../theme';
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
          <BodySmall color={colors.textSecondary}>Loading task detail...</BodySmall>
        </View>
      );
    }

    if (isError || !data) {
      return (
        <View style={styles.centered}>
          <Body color={colors.error}>Unable to load task detail</Body>
          <Spacer size="sm" />
          <Button size="sm" onPress={() => refetch()}>
            Try again
          </Button>
        </View>
      );
    }

    const detail: CultivationTaskDetailResponse = data;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <BodySmall color={colors.textSecondary}>{detail.plotName}</BodySmall>
        <H4 style={styles.title}>{detail.taskName}</H4>

        <View style={styles.badgeRow}>
          <View style={[styles.statusBadge, { backgroundColor: colors.primaryLighter }]}>
            <BodySmall style={[styles.badgeText, { color: colors.primary }]}>
              {detail.status.replace(/([A-Z])/g, ' $1').trim()}
            </BodySmall>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: colors.backgroundSecondary }]}>
            <BodySmall style={styles.badgeText}>Priority: {detail.priority}</BodySmall>
          </View>
        </View>

        {detail.description && (
          <>
            <BodySemibold>Description</BodySemibold>
            <Spacer size="xs" />
            <BodySmall color={colors.textSecondary}>{detail.description}</BodySmall>
            <Spacer size="md" />
          </>
        )}

        <BodySemibold>Schedule</BodySemibold>
        <Spacer size="xs" />
        <View style={styles.infoRow}>
          <BodySmall color={colors.textSecondary}>Planned:</BodySmall>
          <BodySmall>{dayjs(detail.plannedScheduledDate).format('MMM D, YYYY')}</BodySmall>
        </View>
        {detail.actualStartDate && (
          <View style={styles.infoRow}>
            <BodySmall color={colors.textSecondary}>Actual start:</BodySmall>
            <BodySmall>{dayjs(detail.actualStartDate).format('MMM D, YYYY')}</BodySmall>
          </View>
        )}
        {detail.actualEndDate && (
          <View style={styles.infoRow}>
            <BodySmall color={colors.textSecondary}>Actual end:</BodySmall>
            <BodySmall>{dayjs(detail.actualEndDate).format('MMM D, YYYY')}</BodySmall>
          </View>
        )}

        <Spacer size="md" />

        <BodySemibold>Costs & Area</BodySemibold>
        <Spacer size="xs" />
        <View style={styles.infoRow}>
          <BodySmall color={colors.textSecondary}>Est. materials:</BodySmall>
          <BodySmall>{detail.estimatedMaterialCost.toLocaleString()}₫</BodySmall>
        </View>
        <View style={styles.infoRow}>
          <BodySmall color={colors.textSecondary}>Actual materials:</BodySmall>
          <BodySmall>{detail.actualMaterialCost.toLocaleString()}₫</BodySmall>
        </View>
        {detail.actualServiceCost > 0 && (
          <View style={styles.infoRow}>
            <BodySmall color={colors.textSecondary}>Actual service:</BodySmall>
            <BodySmall>{detail.actualServiceCost.toLocaleString()}₫</BodySmall>
          </View>
        )}
        <View style={styles.infoRow}>
          <BodySmall color={colors.textSecondary}>Plot area:</BodySmall>
          <BodySmall>{detail.plotArea?.toFixed(2)} ha</BodySmall>
        </View>

        {detail.materials && detail.materials.length > 0 && (
          <>
            <Spacer size="lg" />
            <BodySemibold>Materials</BodySemibold>
            <Spacer size="xs" />
            {detail.materials.map((material) => (
              <View key={material.materialId} style={styles.materialCard}>
                <BodySemibold>{material.materialName}</BodySemibold>
                <BodySmall color={colors.textSecondary}>
                  Planned: {material.plannedQuantityPerHa} {material.materialUnit}/ha • Est:{' '}
                  {material.plannedTotalEstimatedCost.toLocaleString()}₫
                </BodySmall>
                <BodySmall color={colors.textSecondary}>
                  Actual used: {material.actualQuantityUsed} {material.materialUnit} • Cost:{' '}
                  {material.actualCost.toLocaleString()}₫
                </BodySmall>
                {material.logNotes && (
                  <BodySmall color={colors.textSecondary}>Notes: {material.logNotes}</BodySmall>
                )}
              </View>
            ))}
          </>
        )}

        {detail.farmLogs && detail.farmLogs.length > 0 && (
          <>
            <Spacer size="lg" />
            <BodySemibold>Farm Logs</BodySemibold>
            <Spacer size="xs" />
            {detail.farmLogs.map((log) => (
              <View key={log.farmLogId} style={styles.logCard}>
                <BodySemibold>
                  {dayjs(log.loggedDate).format('MMM D, YYYY • HH:mm')}
                </BodySemibold>
                <BodySmall color={colors.textSecondary}>
                  Completion: {log.completionPercentage}%
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
            <H4>Task Detail</H4>
            <TouchableOpacity onPress={onClose}>
              <Body style={{ fontSize: 18 }}>✕</Body>
            </TouchableOpacity>
          </View>
          <Spacer size="sm" />
          {renderContent()}
          <Spacer size="lg" />
          <Button onPress={onClose}>Close</Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing.lg,
    ...shadows.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  title: {
    marginTop: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.sm,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs / 2,
  },
  materialCard: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
    marginBottom: spacing.sm,
  },
  logCard: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm,
    gap: spacing.xs / 2,
  },
  photoRow: {
    marginTop: spacing.xs,
  },
  photo: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
    backgroundColor: colors.backgroundSecondary,
  },
});


