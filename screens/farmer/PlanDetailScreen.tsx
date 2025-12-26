/**
 * Plan Detail Screen
 * Shows cultivation plan stages and tasks for a specific plot cultivation ID
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import {
  Container,
  H3,
  Body,
  BodySmall,
  BodySemibold,
  Card,
  Spacer,
  Spinner,
  Button,
} from '../../components/ui';
import { colors, spacing, borderRadius } from '../../theme';
import { scale, moderateScale, getFontSize, getSpacing, verticalScale } from '../../utils/responsive';
import { getPlotPlanView, getFarmLogsByCultivation } from '../../libs/farmer';
import {
  PlotPlanStage,
  PlotPlanTask,
  FarmerMaterialComparison,
  FarmLogDetailResponse,
} from '../../types/api';
import { TaskDetailModal } from './TaskDetailModal';
import {
  translateTaskStatus,
  translatePriority,
} from '../../utils/translations';

export const PlanDetailScreen = () => {
  const router = useRouter();
  const { planCultivationId, planName } = useLocalSearchParams<{
    planCultivationId?: string;
    planName?: string;
  }>();

  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);

  const {
    data: plan,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['plot-plan-view', planCultivationId],
    queryFn: () => {
      if (!planCultivationId) {
        throw new Error('Plan cultivation ID is required');
      }
      return getPlotPlanView(planCultivationId);
    },
    enabled: Boolean(planCultivationId),
  });

  const {
    data: farmLogsPage,
    isLoading: farmLogsLoading,
    isError: farmLogsError,
    refetch: refetchFarmLogs,
  } = useQuery({
    queryKey: ['farm-logs-by-cultivation', planCultivationId],
    queryFn: () => {
      if (!planCultivationId) {
        throw new Error('Plan cultivation ID is required');
      }
      return getFarmLogsByCultivation({
        plotCultivationId: planCultivationId,
        currentPage: 1,
        pageSize: 10,
      });
    },
    enabled: Boolean(planCultivationId),
  });

  if (isLoading) {
    return <Spinner fullScreen />;
  }

  if (isError || !plan) {
    return (
      <SafeAreaView style={styles.container}>
        <Container padding="lg">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Body>←</Body>
            </TouchableOpacity>
            <H3 style={styles.headerTitle}>{planName || 'Chi tiết kế hoạch'}</H3>
            <View style={styles.headerRight} />
          </View>
          <Spacer size="3xl" />
          <Card variant="elevated" style={styles.errorCard}>
            <BodySemibold>Không thể tải chi tiết kế hoạch</BodySemibold>
            <Spacer size="xs" />
            <BodySmall color={colors.textSecondary}>
              Please check your connection and try again.
            </BodySmall>
            <Spacer size="md" />
            <Button onPress={() => refetch()} size="sm">
              Try Again
            </Button>
          </Card>
        </Container>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Container padding="lg">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Body>←</Body>
          </TouchableOpacity>
          <H3 style={styles.headerTitle}>{plan.planName || planName}</H3>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/farmer/reports/create',
                params: { plotCultivationId: planCultivationId },
              } as any)
            }
            style={styles.reportButton}
          >
            <BodySmall color={colors.error}>Báo cáo</BodySmall>
          </TouchableOpacity>
        </View>

        <BodySmall color={colors.textSecondary}>
          Status: {plan.planStatus} • Base date:{' '}
          {dayjs(plan.basePlantingDate).format('MMM D, YYYY')}
        </BodySmall>

        <Spacer size="xl" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          {plan.stages.length === 0 ? (
            <Card variant="flat" style={styles.emptyState}>
              <BodySemibold>Không tìm thấy giai đoạn nào</BodySemibold>
              <Spacer size="xs" />
              <BodySmall color={colors.textSecondary}>
                Kế hoạch này chưa có giai đoạn nào được định nghĩa.
              </BodySmall>
            </Card>
          ) : (
            plan.stages.map((stage: PlotPlanStage, stageIndex) => (
              <Card key={stageIndex} variant="elevated" style={styles.stageCard}>
                <View style={styles.stageHeader}>
                  <BodySemibold>{stage.stageName}</BodySemibold>
                  <BodySmall color={colors.textSecondary}>
                    Thứ tự #{stage.sequenceOrder}
                  </BodySmall>
                </View>

                <Spacer size="md" />

                {stage.tasks.length === 0 ? (
                  <BodySmall color={colors.textSecondary}>
                    Không có công việc nào được định nghĩa cho giai đoạn này.
                  </BodySmall>
                ) : (
                  stage.tasks.map((task: PlotPlanTask) => (
                    <View key={task.id} style={styles.taskCard}>
                      <View style={styles.taskHeader}>
                        <BodySemibold>{task.taskName}</BodySemibold>
                        <BodySmall
                          color={
                            task.status === 'Completed' ? greenTheme.success : greenTheme.primary
                          }
                          style={{ fontWeight: '600' }}
                        >
                          {translateTaskStatus(task.status)}
                        </BodySmall>
                      </View>
                      {task.description && (
                        <>
                          <Spacer size="xs" />
                          <BodySmall color={colors.textSecondary}>
                            {task.description}
                          </BodySmall>
                        </>
                      )}
                      <Spacer size="xs" />
                      <BodySmall color={colors.textSecondary}>
                        Scheduled:{' '}
                        {dayjs(task.scheduledDate).format('MMM D, YYYY')}
                      </BodySmall>
                      <BodySmall color={colors.textSecondary}>
                        Ưu tiên: {translatePriority(task.priority)}
                      </BodySmall>
                      {typeof task.actualMaterialCost === 'number' && (
                        <BodySmall color={colors.textSecondary}>
                          Material Cost:{' '}
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(task.actualMaterialCost)}
                        </BodySmall>
                      )}

                      {task.materials && task.materials.length > 0 && (
                        <View style={styles.materialSection}>
                          <Spacer size="xs" />
                          <BodySemibold>Vật tư sử dụng</BodySemibold>
                          <Spacer size="xs" />
                          {task.materials.map(
                            (material: FarmerMaterialComparison) => (
                              <View
                                key={material.materialId}
                                style={styles.materialCard}
                              >
                                <BodySemibold>{material.materialName}</BodySemibold>
                                <BodySmall color={colors.textSecondary}>
                                  Đơn vị: {material.materialUnit}
                                </BodySmall>
                                <BodySmall color={colors.textSecondary}>
                                  Dự kiến: {material.plannedQuantityPerHa}{' '}
                                  {material.materialUnit} / ha
                                </BodySmall>
                                <BodySmall color={colors.textSecondary}>
                                  Dự kiến chi phí:{' '}
                                  {material.plannedEstimatedAmount.toLocaleString()}₫
                                </BodySmall>
                                <BodySmall color={colors.textSecondary}>
                                  Số lượng dự kiến {material.actualQuantity}{' '}
                                  {material.materialUnit}
                                </BodySmall>
                              </View>
                            ),
                          )}
                        </View>
                      )}
                      <Spacer size="sm" />
                      <View style={styles.taskActions}>
                        <TouchableOpacity
                          style={styles.secondaryButton}
                          onPress={() => {
                            setDetailTaskId(task.id);
                            setIsDetailVisible(true);
                          }}
                        >
                          <BodySemibold style={styles.secondaryButtonText}>
                            Xem chi tiết
                          </BodySemibold>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </Card>
            ))
          )}

          <Spacer size="xl" />

          {/* Farm Logs for this cultivation plan */}
          <H3>Nhật ký nông trại</H3>
          <Spacer size="sm" />

          {farmLogsLoading && (
            <Card variant="flat" style={styles.emptyState}>
              <BodySmall color={colors.textSecondary}>Đang tải nhật ký nông trại...</BodySmall>
            </Card>
          )}

          {farmLogsError && (
            <Card variant="elevated" style={styles.errorCard}>
              <BodySemibold>Không thể tải nhật ký nông trại</BodySemibold>
              <Spacer size="xs" />
              <BodySmall color={colors.textSecondary}>
                Vui lòng kiểm tra kết nối và thử lại.
              </BodySmall>
              <Spacer size="md" />
              <Button onPress={() => refetchFarmLogs()} size="sm">
                Thử lại
              </Button>
            </Card>
          )}

          {!farmLogsLoading && !farmLogsError && (
            <>
              {(!farmLogsPage || farmLogsPage.data.length === 0) ? (
                <Card variant="flat" style={styles.emptyState}>
                  <BodySemibold>Không có nhật ký nông trại nào</BodySemibold>
                  <Spacer size="xs" />
                  <BodySmall color={colors.textSecondary}>
                    Khi bạn ghi nhật ký hoạt động cho kế hoạch này, chúng sẽ hiện ở đây.
                  </BodySmall>
                </Card>
              ) : (
                farmLogsPage.data.map((log: FarmLogDetailResponse) => (
                  <Card key={log.farmLogId} variant="elevated" style={styles.logCard}>
                    <View style={styles.logHeader}>
                      <View style={{ flex: 1 }}>
                        <BodySemibold>{log.cultivationTaskName}</BodySemibold>
                        <BodySmall color={colors.textSecondary}>{log.plotName}</BodySmall>
                      </View>
                      <BodySmall color={colors.textSecondary}>
                        {dayjs(log.loggedDate).format('MMM D, YYYY')}
                      </BodySmall>
                    </View>
                    <Spacer size="xs" />
                    <BodySmall color={colors.textSecondary}>
                      Hoàn thành: {log.completionPercentage}%
                    </BodySmall>
                    {typeof log.actualAreaCovered === 'number' && (
                      <BodySmall color={colors.textSecondary}>
                        Diện tích: {log.actualAreaCovered.toLocaleString()} ha
                      </BodySmall>
                    )}
                    {/* {typeof log.serviceCost === 'number' && (
                      <BodySmall color={colors.textSecondary}>
                        Chi phí dịch vụ:{' '}
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(log.serviceCost)}
                      </BodySmall>
                    )} */}
                    {log.workDescription && (
                      <>
                        <Spacer size="xs" />
                        <BodySmall color={colors.textSecondary}>
                          {log.workDescription}
                        </BodySmall>
                      </>
                    )}
                    {log.weatherConditions && (
                      <BodySmall color={colors.textSecondary}>
                        Thời tiết: {log.weatherConditions}
                      </BodySmall>
                    )}
                    {log.materialsUsed && log.materialsUsed.length > 0 && (
                      <>
                        <Spacer size="sm" />
                        <BodySemibold>Vật tư sử dụng</BodySemibold>
                        <Spacer size="xs" />
                        {log.materialsUsed.map((mat, index) => (
                          <View key={index} style={styles.logMaterialRow}>
                            <BodySmall>{mat.materialName}</BodySmall>
                            <BodySmall color={colors.textSecondary}>
                              {mat.actualQuantityUsed.toLocaleString()} •{' '}
                              {mat.actualCost.toLocaleString()}₫
                            </BodySmall>
                          </View>
                        ))}
                      </>
                    )}
                  </Card>
                ))
              )}
            </>
          )}
        </ScrollView>
      </Container>
      <TaskDetailModal
        visible={isDetailVisible}
        taskId={detailTaskId}
        onClose={() => setIsDetailVisible(false)}
      />
    </SafeAreaView>
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
  container: {
    flex: 1,
    backgroundColor: greenTheme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: getSpacing(spacing.md),
    backgroundColor: greenTheme.cardBackground,
    paddingBottom: getSpacing(spacing.sm),
    borderBottomWidth: 1,
    borderBottomColor: greenTheme.border,
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(borderRadius.full),
    backgroundColor: greenTheme.primaryLighter,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: getFontSize(20),
    color: greenTheme.primary,
    fontWeight: '700',
  },
  reportButton: {
    paddingHorizontal: getSpacing(spacing.sm),
    paddingVertical: getSpacing(spacing.xs),
    borderRadius: moderateScale(borderRadius.sm),
    borderWidth: 1,
    borderColor: colors.error,
    minWidth: scale(60),
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
  },
  errorCard: {
    padding: getSpacing(spacing.lg),
    gap: getSpacing(spacing.sm),
    backgroundColor: greenTheme.cardBackground,
    borderRadius: moderateScale(borderRadius.lg),
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  emptyState: {
    padding: getSpacing(spacing.lg),
    gap: getSpacing(spacing.sm),
    backgroundColor: greenTheme.cardBackground,
    borderRadius: moderateScale(borderRadius.lg),
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  stageCard: {
    padding: getSpacing(spacing.md),
    marginBottom: getSpacing(spacing.md),
    gap: getSpacing(spacing.sm),
    borderRadius: moderateScale(borderRadius.lg),
    backgroundColor: greenTheme.cardBackground,
    borderWidth: 1,
    borderColor: greenTheme.border,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskCard: {
    padding: getSpacing(spacing.sm),
    borderWidth: 1,
    borderColor: greenTheme.border,
    borderRadius: moderateScale(borderRadius.md),
    marginTop: getSpacing(spacing.sm),
    gap: getSpacing(spacing.xs),
    backgroundColor: greenTheme.primaryLighter,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  materialSection: {
    marginTop: getSpacing(spacing.sm),
    gap: getSpacing(spacing.xs),
  },
  materialCard: {
    padding: getSpacing(spacing.sm),
    borderRadius: moderateScale(borderRadius.sm),
    backgroundColor: greenTheme.cardBackground,
    gap: getSpacing(spacing.xs / 2),
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  secondaryButton: {
    paddingHorizontal: getSpacing(spacing.md),
    paddingVertical: getSpacing(spacing.sm),
    borderRadius: moderateScale(borderRadius.full),
    borderWidth: 1,
    borderColor: greenTheme.primary,
    backgroundColor: greenTheme.cardBackground,
  },
  secondaryButtonText: {
    color: greenTheme.primary,
    fontSize: getFontSize(14),
    fontWeight: '600',
  },
  logCard: {
    padding: getSpacing(spacing.md),
    marginBottom: getSpacing(spacing.md),
    borderRadius: moderateScale(borderRadius.lg),
    backgroundColor: greenTheme.cardBackground,
    borderWidth: 1,
    borderColor: greenTheme.border,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logMaterialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: getSpacing(spacing.xs),
  },
});

