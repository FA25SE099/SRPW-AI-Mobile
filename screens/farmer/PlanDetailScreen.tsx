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
import { getPlotPlanView, getFarmLogsByCultivation } from '../../libs/farmer';
import {
  PlotPlanStage,
  PlotPlanTask,
  FarmerMaterialComparison,
  FarmLogDetailResponse,
} from '../../types/api';
import { TaskDetailModal } from './TaskDetailModal';

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
            <H3 style={styles.headerTitle}>{planName || 'Plan Detail'}</H3>
            <View style={styles.headerRight} />
          </View>
          <Spacer size="3xl" />
          <Card variant="elevated" style={styles.errorCard}>
            <BodySemibold>Unable to load plan details</BodySemibold>
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
            <BodySmall color={colors.error}>Report</BodySmall>
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
              <BodySemibold>No stages found</BodySemibold>
              <Spacer size="xs" />
              <BodySmall color={colors.textSecondary}>
                This plan does not have any stages defined yet.
              </BodySmall>
            </Card>
          ) : (
            plan.stages.map((stage: PlotPlanStage, stageIndex) => (
              <Card key={stageIndex} variant="elevated" style={styles.stageCard}>
                <View style={styles.stageHeader}>
                  <BodySemibold>{stage.stageName}</BodySemibold>
                  <BodySmall color={colors.textSecondary}>
                    Order #{stage.sequenceOrder}
                  </BodySmall>
                </View>

                <Spacer size="md" />

                {stage.tasks.length === 0 ? (
                  <BodySmall color={colors.textSecondary}>
                    No tasks defined for this stage.
                  </BodySmall>
                ) : (
                  stage.tasks.map((task: PlotPlanTask) => (
                    <View key={task.id} style={styles.taskCard}>
                      <View style={styles.taskHeader}>
                        <BodySemibold>{task.taskName}</BodySemibold>
                        <BodySmall
                          color={
                            task.status === 'Completed' ? colors.success : colors.primary
                          }
                        >
                          {task.status}
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
                        Priority: {task.priority}
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
                          <BodySemibold>Materials</BodySemibold>
                          <Spacer size="xs" />
                          {task.materials.map(
                            (material: FarmerMaterialComparison) => (
                              <View
                                key={material.materialId}
                                style={styles.materialCard}
                              >
                                <BodySemibold>{material.materialName}</BodySemibold>
                                <BodySmall color={colors.textSecondary}>
                                  Unit: {material.materialUnit}
                                </BodySmall>
                                <BodySmall color={colors.textSecondary}>
                                  Planned: {material.plannedQuantityPerHa}{' '}
                                  {material.materialUnit} / ha
                                </BodySmall>
                                <BodySmall color={colors.textSecondary}>
                                  Planned Amount:{' '}
                                  {material.plannedEstimatedAmount.toLocaleString()}₫
                                </BodySmall>
                                <BodySmall color={colors.textSecondary}>
                                  Actual Qty: {material.actualQuantity}{' '}
                                  {material.materialUnit}
                                </BodySmall>
                                <BodySmall color={colors.textSecondary}>
                                  Actual Cost:{' '}
                                  {material.actualCost.toLocaleString()}₫
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
                            View Details
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
          <H3>Farm Logs</H3>
          <Spacer size="sm" />

          {farmLogsLoading && (
            <Card variant="flat" style={styles.emptyState}>
              <BodySmall color={colors.textSecondary}>Loading farm logs...</BodySmall>
            </Card>
          )}

          {farmLogsError && (
            <Card variant="elevated" style={styles.errorCard}>
              <BodySemibold>Unable to load farm logs</BodySemibold>
              <Spacer size="xs" />
              <BodySmall color={colors.textSecondary}>
                Please check your connection and try again.
              </BodySmall>
              <Spacer size="md" />
              <Button onPress={() => refetchFarmLogs()} size="sm">
                Retry
              </Button>
            </Card>
          )}

          {!farmLogsLoading && !farmLogsError && (
            <>
              {(!farmLogsPage || farmLogsPage.data.length === 0) ? (
                <Card variant="flat" style={styles.emptyState}>
                  <BodySemibold>No farm logs yet</BodySemibold>
                  <Spacer size="xs" />
                  <BodySmall color={colors.textSecondary}>
                    When you record activities for this plan, they will appear here.
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
                      Completion: {log.completionPercentage}%
                    </BodySmall>
                    {typeof log.actualAreaCovered === 'number' && (
                      <BodySmall color={colors.textSecondary}>
                        Area: {log.actualAreaCovered.toLocaleString()} ha
                      </BodySmall>
                    )}
                    {typeof log.serviceCost === 'number' && (
                      <BodySmall color={colors.textSecondary}>
                        Service cost:{' '}
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(log.serviceCost)}
                      </BodySmall>
                    )}
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
                        Weather: {log.weatherConditions}
                      </BodySmall>
                    )}
                    {log.materialsUsed && log.materialsUsed.length > 0 && (
                      <>
                        <Spacer size="sm" />
                        <BodySemibold>Materials used</BodySemibold>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  reportButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.error,
    minWidth: 60,
    alignItems: 'center',
  },
  errorCard: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyState: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  stageCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskCard: {
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  materialSection: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  materialCard: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.backgroundSecondary,
    gap: spacing.xs / 2,
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  secondaryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  secondaryButtonText: {
    color: colors.primary,
  },
  logCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logMaterialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
});

