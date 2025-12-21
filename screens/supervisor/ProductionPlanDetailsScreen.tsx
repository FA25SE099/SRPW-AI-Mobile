/**
 * Production Plan Details Screen
 * Complete plan details with stages, tasks, plots, economics, and farm logs
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, borderRadius } from '@/theme';
import {
  Container,
  H3,
  H4,
  Body,
  BodySmall,
  BodySemibold,
  Card,
  Badge,
  Spacer,
  Button,
} from '@/components/ui';
import {
  getProductionPlanDetail,
  getFarmLogsByProductionPlanTask,
  ProductionPlanTask,
  FarmLogByTask,
} from '@/libs/supervisor';
import { Ionicons } from '@expo/vector-icons';

export const ProductionPlanDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ planId: string; planName: string }>();
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<{ [key: string]: boolean }>({});
  const [selectedTask, setSelectedTask] = useState<ProductionPlanTask | null>(null);
  const [showFarmLogsModal, setShowFarmLogsModal] = useState(false);

  const { data: planDetail, isLoading } = useQuery({
    queryKey: ['production-plan-detail', params.planId],
    queryFn: () => getProductionPlanDetail(params.planId),
    enabled: !!params.planId,
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: farmLogsData, isLoading: farmLogsLoading } = useQuery({
    queryKey: ['farm-logs-by-task', selectedTask?.taskId],
    queryFn: () =>
      getFarmLogsByProductionPlanTask({
        productionPlanTaskId: selectedTask!.taskId,
        currentPage: 1,
        pageSize: 20,
      }),
    enabled: !!selectedTask && showFarmLogsModal,
    staleTime: 0,
    refetchOnMount: true,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return colors.success;
      case 'inprogress':
        return colors.primary;
      case 'pending':
        return colors.warning;
      case 'approved':
        return colors.success;
      case 'rejected':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const toggleTask = (taskId: string) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Container>
          <Spacer size="md" />
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.dark} />
            <BodySemibold style={styles.backText}>Back</BodySemibold>
          </TouchableOpacity>
          <Spacer size="xl" />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Spacer size="md" />
            <BodySmall>Loading plan details...</BodySmall>
          </View>
        </Container>
      </SafeAreaView>
    );
  }

  if (!planDetail) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Container>
          <Spacer size="md" />
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.dark} />
            <BodySemibold style={styles.backText}>Back</BodySemibold>
          </TouchableOpacity>
          <Spacer size="xl" />
          <View style={styles.centered}>
            <Body>Plan not found</Body>
          </View>
        </Container>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Container>
          <Spacer size="md" />

          {/* Header */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.dark} />
            <BodySemibold style={styles.backText}>Back to Plans</BodySemibold>
          </TouchableOpacity>

          <Spacer size="md" />

          <H3>{planDetail.planName}</H3>
          <BodySmall style={styles.subtitle}>
            {planDetail.seasonName} {planDetail.seasonYear} • {planDetail.groupName}
          </BodySmall>

          <Spacer size="lg" />

          {/* Summary Cards */}
          <View style={styles.summaryGrid}>
            <Card style={styles.summaryCard}>
              <BodySmall style={styles.summaryLabel}>Progress</BodySmall>
              <H4 style={styles.summaryValue}>
                {planDetail.overallProgressPercentage.toFixed(0)}%
              </H4>
              <View style={styles.progressBarSmall}>
                <View
                  style={[
                    styles.progressFillSmall,
                    { width: `${planDetail.overallProgressPercentage}%` },
                  ]}
                />
              </View>
            </Card>

            <Card style={styles.summaryCard}>
              <BodySmall style={styles.summaryLabel}>Tasks</BodySmall>
              <H4 style={styles.summaryValue}>
                {planDetail.completedTasks}/{planDetail.totalTasks}
              </H4>
              <BodySmall style={styles.summarySubtext}>completed</BodySmall>
            </Card>

            <Card style={styles.summaryCard}>
              <BodySmall style={styles.summaryLabel}>Days</BodySmall>
              <H4 style={styles.summaryValue}>{planDetail.daysElapsed}</H4>
              <BodySmall style={styles.summarySubtext}>elapsed</BodySmall>
            </Card>

            <Card style={styles.summaryCard}>
              <BodySmall style={styles.summaryLabel}>Cost</BodySmall>
              <BodySmall style={styles.summaryValueSmall}>
                {formatCurrency(planDetail.totalActualCost || planDetail.totalEstimatedCost)}
              </BodySmall>
            </Card>
          </View>

          <Spacer size="lg" />

          {/* Stages & Tasks Content */}
          <View>
            {planDetail.stages.map((stage) => {
                const isExpanded = expandedStage === stage.stageId;
                return (
                  <Card key={stage.stageId} style={styles.stageCard}>
                    <TouchableOpacity
                      onPress={() =>
                        setExpandedStage(isExpanded ? null : stage.stageId)
                      }
                    >
                      <View style={styles.stageHeader}>
                        <View style={styles.stageHeaderLeft}>
                          <Ionicons
                            name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                            size={20}
                            color={colors.textPrimary}
                          />
                          <View style={styles.stageHeaderText}>
                            <BodySemibold>{stage.stageName}</BodySemibold>
                            <BodySmall style={styles.stageDays}>
                              Day {stage.startDay} - {stage.endDay}
                            </BodySmall>
                          </View>
                        </View>
                        <BodySmall style={styles.stageProgress}>
                          {stage.progressPercentage.toFixed(0)}%
                        </BodySmall>
                      </View>

                      <Spacer size="xs" />

                      <View style={styles.progressBarSmall}>
                        <View
                          style={[
                            styles.progressFillSmall,
                            { width: `${stage.progressPercentage}%` },
                          ]}
                        />
                      </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <>
                        <Spacer size="md" />
                        {stage.tasks.map((task) => (
                          <View key={task.taskId} style={styles.taskItem}>
                            <TouchableOpacity
                              onPress={() => toggleTask(task.taskId)}
                              style={styles.taskHeader}
                            >
                              <View style={styles.taskLeft}>
                                <Ionicons
                                  name={
                                    task.status === 'Completed'
                                      ? 'checkmark-circle'
                                      : task.status === 'InProgress'
                                      ? 'sync-circle'
                                      : 'ellipse-outline'
                                  }
                                  size={20}
                                  color={getStatusColor(task.status)}
                                />
                                <View style={styles.taskInfo}>
                                  <BodySemibold style={styles.taskName}>
                                    {task.taskName}
                                  </BodySemibold>
                                  <BodySmall style={styles.taskType}>
                                    {task.taskType} • {formatDate(task.scheduledDate)}
                                  </BodySmall>
                                </View>
                              </View>
                              <View style={styles.taskRight}>
                                <Badge
                                  variant={task.status === 'Completed' ? 'success' : 'neutral'}
                                  size="sm"
                                >
                                  {task.status}
                                </Badge>
                                <Ionicons
                                  name={expandedTasks[task.taskId] ? 'chevron-down' : 'chevron-forward'}
                                  size={16}
                                  color={colors.textTertiary}
                                  style={{ marginLeft: spacing.xs }}
                                />
                              </View>
                            </TouchableOpacity>

                            {expandedTasks[task.taskId] && (
                              <View style={styles.taskDetails}>
                                <Spacer size="sm" />
                                {task.description && (
                                  <>
                                    <BodySmall style={styles.label}>Description</BodySmall>
                                    <Body>{task.description}</Body>
                                    <Spacer size="sm" />
                                  </>
                                )}

                                {task.materials && task.materials.length > 0 && (
                                  <>
                                    <BodySmall style={styles.label}>Materials</BodySmall>
                                    {task.materials.map((material, idx) => (
                                      <View key={idx} style={styles.materialItem}>
                                        <Body style={styles.materialName}>{material.materialName}</Body>
                                        <BodySmall style={styles.materialQuantity}>
                                          {material.quantityPerHa} {material.unit}/ha
                                        </BodySmall>
                                      </View>
                                    ))}
                                    <Spacer size="sm" />
                                  </>
                                )}

                                <View style={styles.taskFooter}>
                                  <BodySmall style={styles.taskCost}>
                                    Est. Cost: {formatCurrency(task.estimatedCost)}
                                  </BodySmall>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onPress={() => {
                                      setSelectedTask(task);
                                      setShowFarmLogsModal(true);
                                    }}
                                  >
                                    View Farm Logs
                                  </Button>
                                </View>
                              </View>
                            )}
                          </View>
                        ))}
                      </>
                    )}
                  </Card>
                );
              })}
          </View>

          <Spacer size="xl" />
        </Container>
      </ScrollView>

      {/* Farm Logs Modal */}
      <Modal
        visible={showFarmLogsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFarmLogsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowFarmLogsModal(false)}
              style={styles.modalClose}
            >
              <Ionicons name="close" size={24} color={colors.dark} />
            </TouchableOpacity>
            <H4 style={styles.modalTitle}>Farm Logs</H4>
            <View style={{ width: 24 }} />
          </View>

          <Spacer size="sm" />

          {selectedTask && (
            <View style={styles.modalTaskInfo}>
              <BodySemibold>{selectedTask.taskName}</BodySemibold>
              <BodySmall style={styles.modalTaskType}>
                {selectedTask.taskType}
              </BodySmall>
            </View>
          )}

          <Spacer size="md" />

          {farmLogsLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Spacer size="md" />
              <BodySmall>Loading farm logs...</BodySmall>
            </View>
          ) : (
            <ScrollView style={styles.modalContent}>
              {farmLogsData && farmLogsData.data.length > 0 ? (
                farmLogsData.data.map((log) => (
                  <Card key={log.farmLogId} style={styles.farmLogCard}>
                    <View style={styles.farmLogHeader}>
                      <View>
                        <BodySemibold>{log.farmerName}</BodySemibold>
                        <BodySmall style={styles.farmLogPlot}>{log.plotName}</BodySmall>
                      </View>
                      <Badge
                        variant={
                          log.status === 'Approved'
                            ? 'success'
                            : log.status === 'Rejected'
                            ? 'error'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {log.status}
                      </Badge>
                    </View>

                    <Spacer size="sm" />

                    <View style={styles.farmLogDetails}>
                      <View style={styles.farmLogRow}>
                        <BodySmall style={styles.farmLogLabel}>Date:</BodySmall>
                        <BodySmall>{formatDate(log.logDate)}</BodySmall>
                      </View>
                      <View style={styles.farmLogRow}>
                        <BodySmall style={styles.farmLogLabel}>Area Covered:</BodySmall>
                        <BodySmall>{log.actualAreaCovered.toFixed(2)} ha</BodySmall>
                      </View>
                      <View style={styles.farmLogRow}>
                        <BodySmall style={styles.farmLogLabel}>Progress:</BodySmall>
                        <BodySmall>{log.completionPercentage.toFixed(0)}%</BodySmall>
                      </View>
                      {log.actualCost && (
                        <View style={styles.farmLogRow}>
                          <BodySmall style={styles.farmLogLabel}>Cost:</BodySmall>
                          <BodySmall>{formatCurrency(log.actualCost)}</BodySmall>
                        </View>
                      )}
                    </View>

                    {log.workDescription && (
                      <>
                        <Spacer size="sm" />
                        <BodySmall style={styles.farmLogDescription}>
                          {log.workDescription}
                        </BodySmall>
                      </>
                    )}

                    {log.materials.length > 0 && (
                      <>
                        <Spacer size="sm" />
                        <BodySmall style={styles.materialsTitle}>Materials Used:</BodySmall>
                        {log.materials.map((material, idx) => (
                          <View key={idx} style={styles.materialRow}>
                            <BodySmall>
                              • {material.materialName}: {material.quantity} {material.unit}
                            </BodySmall>
                            {material.cost && (
                              <BodySmall>{formatCurrency(material.cost)}</BodySmall>
                            )}
                          </View>
                        ))}
                      </>
                    )}

                    {log.photoUrls.length > 0 && (
                      <>
                        <Spacer size="sm" />
                        <View style={styles.photoIndicator}>
                          <Ionicons name="images" size={16} color={colors.primary} />
                          <BodySmall style={{ color: colors.primary }}>
                            {log.photoUrls.length} photos
                          </BodySmall>
                        </View>
                      </>
                    )}
                  </Card>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="document-text-outline" size={48} color={colors.lightGray} />
                  <Spacer size="md" />
                  <Body style={styles.emptyText}>No farm logs found</Body>
                </View>
              )}
              <Spacer size="xl" />
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backText: {
    color: colors.dark,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    minWidth: '48%',
    padding: spacing.md,
  },
  summaryLabel: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  summaryValueSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  summarySubtext: {
    color: colors.textTertiary,
  },
  progressBarSmall: {
    height: 4,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  progressFillSmall: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  tabContent: {
    padding: spacing.md,
  },
  stageCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  stageHeaderText: {
    flex: 1,
  },
  stageDays: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  stageProgress: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  taskItem: {
    padding: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  taskRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    color: colors.textPrimary,
  },
  taskType: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  taskDetails: {
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  taskCost: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  plotItem: {
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  plotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plotDetails: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  plotLabel: {
    color: colors.textSecondary,
  },
  plotStage: {
    color: colors.primary,
    fontStyle: 'italic',
  },
  plotProgress: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  economicsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  economicsRowHighlight: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  economicsLabel: {
    color: colors.textPrimary,
  },
  economicsValue: {
    color: colors.textPrimary,
  },
  marginBadge: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.successLight,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  marginLabel: {
    color: colors.success,
  },
  marginValue: {
    color: colors.success,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  costLabel: {
    color: colors.textSecondary,
  },
  costValue: {
    color: colors.textPrimary,
  },
  label: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
  },
  modalClose: {
    padding: spacing.xs,
  },
  modalTitle: {
    textAlign: 'center',
  },
  modalTaskInfo: {
    paddingHorizontal: spacing.md,
  },
  modalTaskType: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  farmLogCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  farmLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  farmLogPlot: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  farmLogDetails: {
    gap: spacing.xs,
  },
  farmLogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  farmLogLabel: {
    color: colors.textSecondary,
    flex: 1,
  },
  farmLogDescription: {
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
  materialsTitle: {
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  materialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
  },
  photoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    color: colors.textSecondary,
  },
});
