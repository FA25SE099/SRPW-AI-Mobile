/**
 * Plot Cultivation Detail Screen
 * Shows cultivation plan details for a specific plot
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
} from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import {
  getCultivationPlanByGroupPlot,
  getFarmLogsByCultivation,
  type CultivationPlanStage,
  type CultivationPlanTask,
} from '@/libs/supervisor';

// Green theme colors for nature-friendly design
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

export const PlotCultivationDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    plotId: string;
    groupId: string;
    plotName?: string;
  }>();

  const [expandedStages, setExpandedStages] = useState<{ [key: string]: boolean }>({});
  const [expandedTasks, setExpandedTasks] = useState<{ [key: string]: boolean }>({});

  const { data: cultivationPlan, isLoading, error, refetch } = useQuery({
    queryKey: ['cultivation-plan', params.plotId, params.groupId],
    queryFn: () => getCultivationPlanByGroupPlot({
      plotId: params.plotId!,
      groupId: params.groupId!,
    }),
    enabled: !!params.plotId && !!params.groupId,
    staleTime: 0,
    refetchOnMount: true,
  });

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Completed':
        return greenTheme.success;
      case 'InProgress':
        return greenTheme.primary;
      case 'Pending':
        return colors.textTertiary;
      default:
        return colors.textSecondary;
    }
  };

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'Fertilization':
        return 'flask-outline';
      case 'Sowing':
        return 'leaf-outline';
      case 'PestControl':
        return 'bug-outline';
      case 'Harvesting':
        return 'basket-outline';
      case 'LandPreparation':
        return 'hammer-outline';
      default:
        return 'document-text-outline';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const toggleStage = (stageId: string) => {
    setExpandedStages(prev => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  const toggleTask = (taskId: string) => {
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Container>
          <Spacer size="md" />
          <H3>{params.plotName || 'Plot Cultivation'}</H3>
          <Spacer size="xl" />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={greenTheme.primary} />
          </View>
        </Container>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Container>
          <Spacer size="md" />
          <H3>{params.plotName || 'Plot Cultivation'}</H3>
          <Spacer size="xl" />
          <Card style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
            <Spacer size="md" />
            <Body style={styles.errorText}>Failed to load cultivation plan</Body>
            <Spacer size="sm" />
            <TouchableOpacity onPress={() => refetch()}>
              <BodySemibold style={{ color: greenTheme.primary }}>Retry</BodySemibold>
            </TouchableOpacity>
          </Card>
        </Container>
      </SafeAreaView>
    );
  }

  if (!cultivationPlan) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Container>
          <Spacer size="md" />
          <H3>{params.plotName || 'Plot Cultivation'}</H3>
          <Spacer size="xl" />
          <Card style={styles.emptyCard}>
            <Ionicons name="file-tray-outline" size={48} color={colors.textSecondary} />
            <Spacer size="md" />
            <Body style={styles.emptyText}>No cultivation plan found</Body>
          </Card>
        </Container>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Container>
          <Spacer size="md" />

          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={greenTheme.primary} />
            <BodySemibold style={styles.backText}>Back</BodySemibold>
          </TouchableOpacity>
          <Spacer size="sm" />

          {/* Header */}
          <H3>{cultivationPlan.plotName || params.plotName || 'Plot Cultivation'}</H3>

          <Spacer size="lg" />

          {/* Overview Cards */}
          <View style={styles.overviewGrid}>
            <Card style={styles.overviewCard}>
              <Ionicons name="map-outline" size={32} color={greenTheme.primary} />
              <Spacer size="xs" />
              <BodySmall style={styles.overviewLabel}>Area</BodySmall>
              <BodySemibold>{cultivationPlan.plotArea.toFixed(2)} ha</BodySemibold>
            </Card>

            <Card style={styles.overviewCard}>
              <Ionicons name="leaf-outline" size={32} color={greenTheme.success} />
              <Spacer size="xs" />
              <BodySmall style={styles.overviewLabel}>Variety</BodySmall>
              <BodySemibold style={styles.overviewValueSmall}>
                {cultivationPlan.riceVarietyName}
              </BodySemibold>
            </Card>

            <Card style={styles.overviewCard}>
              <Ionicons name="calendar-outline" size={32} color={colors.warning} />
              <Spacer size="xs" />
              <BodySmall style={styles.overviewLabel}>Season</BodySmall>
              <BodySemibold>{cultivationPlan.seasonName}</BodySemibold>
            </Card>

            <Card style={styles.overviewCard}>
              <Ionicons name="trending-up-outline" size={32} color={greenTheme.primary} />
              <Spacer size="xs" />
              <BodySmall style={styles.overviewLabel}>Status</BodySmall>
              <Badge variant="primary" style={{ alignSelf: 'center', backgroundColor: greenTheme.primary }}>
                {cultivationPlan.status}
              </Badge>
            </Card>
          </View>

          <Spacer size="lg" />

          {/* Production Plan Info */}
          <Card>
            <BodySmall style={styles.label}>Production Plan</BodySmall>
            <BodySemibold>{cultivationPlan.productionPlanName}</BodySemibold>
            <Spacer size="sm" />
            <BodySmall style={styles.label}>Planting Date</BodySmall>
            <Body>{formatDate(cultivationPlan.plantingDate)}</Body>
            {cultivationPlan.expectedYield && (
              <>
                <Spacer size="sm" />
                <BodySmall style={styles.label}>Expected Yield</BodySmall>
                <Body>{cultivationPlan.expectedYield.toFixed(2)} tons</Body>
              </>
            )}
          </Card>

          <Spacer size="lg" />

          {/* Task Progress */}
          <Card>
            <H4>Task Progress</H4>
            <Spacer size="md" />
            <View style={styles.progressGrid}>
              <View style={styles.progressItem}>
                <BodySemibold style={styles.progressValue}>
                  {cultivationPlan.progress.totalTasks}
                </BodySemibold>
                <BodySmall style={styles.progressLabel}>Total</BodySmall>
              </View>
              <View style={styles.progressItem}>
                <BodySemibold style={[styles.progressValue, { color: greenTheme.success }]}>
                  {cultivationPlan.progress.completedTasks}
                </BodySemibold>
                <BodySmall style={styles.progressLabel}>Completed</BodySmall>
              </View>
              <View style={styles.progressItem}>
                <BodySemibold style={[styles.progressValue, { color: greenTheme.primary }]}>
                  {cultivationPlan.progress.inProgressTasks}
                </BodySemibold>
                <BodySmall style={styles.progressLabel}>In Progress</BodySmall>
              </View>
              <View style={styles.progressItem}>
                <BodySemibold style={[styles.progressValue, { color: colors.textSecondary }]}>
                  {cultivationPlan.progress.pendingTasks}
                </BodySemibold>
                <BodySmall style={styles.progressLabel}>Pending</BodySmall>
              </View>
            </View>
          </Card>

          <Spacer size="lg" />

          {/* Stages and Tasks */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <H4>Cultivation Stages & Tasks</H4>
            <TouchableOpacity onPress={() => router.push({
              pathname: '/supervisor/farm-logs',
              params: {
                plotCultivationId: cultivationPlan.plotCultivationId,
                plotName: cultivationPlan.plotName
              }
            })}>
              <BodySmall style={{ color: greenTheme.primary }}>View All Logs</BodySmall>
            </TouchableOpacity>
          </View>
          <Spacer size="md" />

          {cultivationPlan.stages.map((stage) => (
            <View key={stage.stageId}>
              <Card>
                <TouchableOpacity
                  onPress={() => toggleStage(stage.stageId)}
                  style={styles.stageHeader}
                >
                  <View style={styles.stageHeaderLeft}>
                    <Ionicons
                      name={expandedStages[stage.stageId] ? 'chevron-down' : 'chevron-forward'}
                      size={20}
                      color={colors.textPrimary}
                    />
                    <BodySemibold>{stage.stageName}</BodySemibold>
                  </View>
                    <Badge variant="primary" style={{ backgroundColor: greenTheme.primary }}>{stage.tasks.length} tasks</Badge>
                </TouchableOpacity>

                {stage.description && expandedStages[stage.stageId] && (
                  <>
                    <Spacer size="sm" />
                    <BodySmall style={styles.stageDescription}>
                      {stage.description}
                    </BodySmall>
                  </>
                )}

                {expandedStages[stage.stageId] && (
                  <>
                    <Spacer size="md" />
                    {stage.tasks.map((task) => (
                      <TaskItem
                        key={task.taskId}
                        task={task}
                        plotCultivationId={cultivationPlan.plotCultivationId}
                        isExpanded={expandedTasks[task.taskId]}
                        onToggle={() => toggleTask(task.taskId)}
                        getStatusColor={getStatusColor}
                        getTaskIcon={getTaskIcon}
                        formatDate={formatDate}
                      />
                    ))}
                  </>
                )}
              </Card>
              <Spacer size="md" />
            </View>
          ))}

          <Spacer size="xl" />
        </Container>
      </ScrollView>
    </SafeAreaView>
  );
};

// Task Item Component
const TaskItem = ({
  task,
  plotCultivationId,
  isExpanded,
  onToggle,
  getStatusColor,
  getTaskIcon,
  formatDate,
}: {
  task: CultivationPlanTask;
  plotCultivationId: string;
  isExpanded: boolean;
  onToggle: () => void;
  getStatusColor: (status: string) => keyof typeof colors;
  getTaskIcon: (taskType: string) => any;
  formatDate: (date?: string) => string;
}) => {
  return (
    <View style={styles.taskContainer}>
      <TouchableOpacity onPress={onToggle} style={styles.taskHeader}>
        <View style={styles.taskHeaderLeft}>
          <Ionicons
            name={isExpanded ? 'chevron-down' : 'chevron-forward'}
            size={18}
            color={colors.textSecondary}
          />
          <Ionicons name={getTaskIcon(task.taskType)} size={18} color={greenTheme.primary} />
          <Body style={styles.taskName}>{task.taskName}</Body>
        </View>
        <Badge variant="primary" style={{ backgroundColor: getStatusColor(task.status) }}>
          {task.status}
        </Badge>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.taskDetails}>
          <Spacer size="sm" />
          
          {task.taskDescription && (
            <>
              <BodySmall style={styles.label}>Description</BodySmall>
              <Body>{task.taskDescription}</Body>
              <Spacer size="sm" />
            </>
          )}

          <View style={styles.taskDates}>
            {task.plannedStartDate && (
              <View style={styles.dateItem}>
                <BodySmall style={styles.dateLabel}>Planned Start:</BodySmall>
                <BodySmall>{formatDate(task.plannedStartDate)}</BodySmall>
              </View>
            )}
            {task.plannedEndDate && (
              <View style={styles.dateItem}>
                <BodySmall style={styles.dateLabel}>Planned End:</BodySmall>
                <BodySmall>{formatDate(task.plannedEndDate)}</BodySmall>
              </View>
            )}
          </View>

          {task.materials.length > 0 && (
            <>
              <Spacer size="sm" />
              <BodySmall style={styles.label}>Materials</BodySmall>
              {task.materials.map((material) => (
                <View key={material.materialId} style={styles.materialItem}>
                  <Body style={styles.materialName}>{material.materialName}</Body>
                  <BodySmall style={styles.materialQuantity}>
                    {material.actualQuantity} {material.unit}
                  </BodySmall>
                </View>
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: greenTheme.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backText: {
    color: greenTheme.primary,
  },
  errorCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    color: colors.error,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  overviewCard: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: greenTheme.cardBackground,
    borderWidth: 1,
    borderColor: greenTheme.border,
    borderRadius: borderRadius.md,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  overviewLabel: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  overviewValueSmall: {
    fontSize: 12,
    textAlign: 'center',
  },
  label: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  progressGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressItem: {
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 24,
    fontWeight: '600',
  },
  progressLabel: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
  stageDescription: {
    color: colors.textSecondary,
    paddingLeft: spacing.xl,
  },
  taskContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  taskName: {
    flex: 1,
  },
  taskDetails: {
    paddingLeft: spacing.xl,
  },
  taskDates: {
    gap: spacing.xs,
  },
  dateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateLabel: {
    color: colors.textSecondary,
  },
  materialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: greenTheme.primaryLighter,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  materialName: {
    flex: 1,
  },
  materialQuantity: {
    color: colors.textSecondary,
  },
  farmLogsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  farmLogsList: {
    gap: spacing.sm,
  },
  farmLogItem: {
    padding: spacing.sm,
    backgroundColor: greenTheme.primaryLighter,
    borderRadius: borderRadius.sm,
  },
  farmLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  farmLogNotes: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  farmLogFarmer: {
    color: colors.textTertiary,
    fontSize: 11,
  },
  noLogs: {
    textAlign: 'center',
    color: colors.textSecondary,
    paddingVertical: spacing.md,
  },
});
