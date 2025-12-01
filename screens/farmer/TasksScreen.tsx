/**
 * Tasks Screen
 * View and confirm tasks from planning
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context'
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import {
  Container,
  H3,
  Body,
  BodySmall,
  BodySemibold,
  Card,
  Spacer,
  Button,
} from '../../components/ui';
import { FarmerPlot, TodayTaskResponse } from '../../types/api';
import { getCurrentFarmerPlots, getTodayTasks } from '../../libs/farmer';
import { TaskDetailModal } from './TaskDetailModal';

export const FarmerTasksScreen = () => {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<'in-progress' | 'completed'>(
    'in-progress',
  );
  const [selectedPlotId, setSelectedPlotId] = useState<string>('all');
  const [isPlotPickerOpen, setIsPlotPickerOpen] = useState(false);
  const [filterCounts, setFilterCounts] = useState<Record<'in-progress' | 'completed', number>>({
    'in-progress': 0,
    completed: 0,
  });
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);

  const statusFilterMap: Record<'in-progress' | 'completed', string> = {
    'in-progress': 'InProgress',
    completed: 'Completed',
  };

  const apiStatusFilter = statusFilterMap[selectedFilter];
  const apiPlotId = selectedPlotId === 'all' ? undefined : selectedPlotId;

  // Fetch plots for dropdown
  const {
    data: plots,
    isLoading: plotsLoading,
    error: plotsError,
  } = useQuery({
    queryKey: ['farmer-plots', { page: 1, size: 100 }],
    queryFn: () => getCurrentFarmerPlots({ currentPage: 1, pageSize: 100 }),
  });

  // Auto-select first plot once data is available
  useEffect(() => {
    if (
      selectedPlotId === 'all' &&
      !plotsLoading &&
      !plotsError &&
      Array.isArray(plots) &&
      plots.length > 0
    ) {
      setSelectedPlotId(plots[0].plotId);
    }
  }, [plots, plotsLoading, plotsError, selectedPlotId]);

  // Fetch today's tasks
  const {
    data: tasks,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['today-tasks', { plotId: apiPlotId, status: apiStatusFilter }],
    queryFn: () => getTodayTasks({ plotId: apiPlotId, statusFilter: apiStatusFilter }),
  });

  const getTaskIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      Spraying: '💨',
      Fertilizing: '💧',
      Harvesting: '🌾',
      Irrigation: '🚿',
      Planting: '🌱',
      Other: '📋',
    };
    return icons[type] || '📋';
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'done':
        return colors.success;
      case 'inprogress':
      case 'in-progress':
        return '#FF9500';
      case 'pending':
      case 'todo':
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  const normalizeStatus = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'inprogress':
        return 'in-progress';
      case 'done':
        return 'completed';
      case 'todo':
        return 'pending';
      default:
        return status?.toLowerCase() || 'pending';
    }
  };

  // Update counts for whichever filter is currently active
  useEffect(() => {
    if (!tasks) return;

    setFilterCounts((prev) => ({
      ...prev,
      [selectedFilter]: tasks.length,
    }));
  }, [tasks, selectedFilter]);

  const filteredTasks = tasks || [];

  const plotDisplayLabel = () => {
    if (selectedPlotId === 'all') {
      return 'All Plots';
    }
    const plot = plots?.find((p) => p.plotId === selectedPlotId);
    if (!plot) {
      return 'Selected plot';
    }
    if (plot.soThua || plot.soTo) {
      return `So thua ${plot.soThua ?? '-'} / So to ${plot.soTo ?? '-'}`;
    }
    return plot.groupName || 'Selected plot';
  };

  const handlePlotSelect = (plotId: string) => {
    setSelectedPlotId(plotId);
    setIsPlotPickerOpen(false);
  };

  const handleConfirmTask = (task: TodayTaskResponse) => {
    router.push({
      pathname: '/farmer/tasks/[taskId]/confirm',
      params: {
        taskId: task.cultivationTaskId,
        plotCultivationId: task.plotCultivationId,
        taskName: task.taskName,
        plotSoThuaSoTo: task.plotSoThuaSoTo,
        materials: JSON.stringify(task.materials || []),
      },
    } as any);
  };

  const handleViewDetail = (taskId: string) => {
    setDetailTaskId(taskId);
    setIsDetailVisible(true);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Container padding="lg">
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Spacer size="md" />
            <Body color={colors.textSecondary}>Loading tasks...</Body>
          </View>
        </Container>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Container padding="lg">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Body>←</Body>
            </TouchableOpacity>
            <H3 style={styles.headerTitle}>My Tasks</H3>
            <View style={styles.headerRight} />
          </View>
          <Spacer size="xl" />
          <View style={styles.errorContainer}>
            <Body color={colors.error}>Failed to load tasks</Body>
            <Spacer size="md" />
            <Button size="sm" onPress={() => refetch()}>
              Retry
            </Button>
          </View>
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
          <H3 style={styles.headerTitle}>My Tasks</H3>
          <View style={styles.headerRight} />
        </View>

        <Spacer size="lg" />

        {/* Plot Filter */}
        <View style={styles.dropdownSection}>
          <BodySmall color={colors.textSecondary}>Filter by plot</BodySmall>
          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={() => setIsPlotPickerOpen((prev) => !prev)}
            disabled={plotsLoading}
          >
            <BodySemibold>{plotDisplayLabel()}</BodySemibold>
            <BodySmall color={colors.textSecondary}>{isPlotPickerOpen ? '^' : 'v'}</BodySmall>
              </TouchableOpacity>
              {plotsError && (
                <BodySmall color={colors.error} style={styles.dropdownError}>
                  Failed to load plots
                </BodySmall>
              )}
              {isPlotPickerOpen && (
                <View style={styles.dropdownList}>
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 220 }}>
                {(plots || []).map((plot: FarmerPlot) => (
                  <TouchableOpacity
                    key={plot.plotId}
                    style={[
                      styles.dropdownOption,
                      selectedPlotId === plot.plotId && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => handlePlotSelect(plot.plotId)}
                  >
                    <Body>
                      {plot.soThua || plot.soTo
                        ? `So thua ${plot.soThua ?? '-'} / So to ${plot.soTo ?? '-'}`
                        : plot.groupName || 'Unnamed plot'}
                    </Body>
                    <BodySmall color={colors.textSecondary}>
                      {plot.area.toFixed(2)} ha
                    </BodySmall>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <Spacer size="lg" />

        {/* Filter Buttons */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => setSelectedFilter('in-progress')}
            style={[
              styles.filterButton,
              selectedFilter === 'in-progress' && styles.filterButtonActive,
            ]}
          >
            <BodySmall
              color={selectedFilter === 'in-progress' ? colors.white : colors.textSecondary}
              style={styles.filterButtonText}
            >
              In Progress
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedFilter('completed')}
            style={[
              styles.filterButton,
              selectedFilter === 'completed' && styles.filterButtonActive,
            ]}
          >
            <BodySmall
              color={selectedFilter === 'completed' ? colors.white : colors.textSecondary}
              style={styles.filterButtonText}
            >
              Completed
            </BodySmall>
          </TouchableOpacity>
        </View>

        <Spacer size="xl" />

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Body color={colors.textSecondary}>No tasks found</Body>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredTasks.map((task: TodayTaskResponse) => (
              <TouchableOpacity key={task.cultivationTaskId}>
                <Card variant="elevated" style={styles.taskCard}>
                  <View style={styles.taskHeader}>
                    <View style={styles.taskIcon}>
                      <Body>{getTaskIcon(task.taskType)}</Body>
                    </View>
                    <View style={styles.taskHeaderInfo}>
                      <View style={styles.taskTitleRow}>
                        <BodySemibold style={styles.taskTitle}>{task.taskName}</BodySemibold>
                        {task.isOverdue && (
                          <View style={styles.overdueBadge}>
                            <BodySmall style={styles.overdueText}>OVERDUE</BodySmall>
                          </View>
                        )}
                      </View>
                      <BodySmall color={colors.textSecondary}>
                        📍 {task.plotSoThuaSoTo}
                      </BodySmall>
                      {task.plotArea > 0 && (
                        <BodySmall color={colors.textSecondary}>
                          Area: {task.plotArea.toFixed(2)} ha
                        </BodySmall>
                      )}
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(task.status) + '20' },
                      ]}
                    >
                      <BodySmall
                        style={{ 
                          color: getStatusColor(task.status), 
                          fontSize: 10,
                          fontWeight: '600',
                        }}
                      >
                        {task.status.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
                      </BodySmall>
                    </View>
                  </View>
                  <Spacer size="md" />
                  {task.description && (
                    <BodySmall color={colors.textSecondary} style={styles.taskDescription}>
                      {task.description}
                    </BodySmall>
                  )}
                  <Spacer size="sm" />
                  <View style={styles.taskDetails}>
                    <View style={styles.taskDetailItem}>
                      <BodySmall color={colors.textSecondary}>Scheduled:</BodySmall>
                      <BodySemibold>
                        {dayjs(task.scheduledDate).format('MMM D, YYYY')}
                      </BodySemibold>
                    </View>
                    <View style={styles.taskDetailItem}>
                      <BodySmall color={colors.textSecondary}>Priority:</BodySmall>
                      <BodySemibold>{task.priority}</BodySemibold>
                    </View>
                    {task.estimatedMaterialCost > 0 && (
                      <View style={styles.taskDetailItem}>
                        <BodySmall color={colors.textSecondary}>Est. Cost:</BodySmall>
                        <BodySemibold>
                          {task.estimatedMaterialCost.toLocaleString()}₫
                        </BodySemibold>
                      </View>
                    )}
                  </View>
                  {task.materials && task.materials.length > 0 && (
                    <>
                      <Spacer size="sm" />
                      <View style={styles.materialsSection}>
                        <BodySemibold style={styles.materialsHeader}>Materials:</BodySemibold>
                        {task.materials.map((material) => (
                          <View key={material.materialId} style={styles.materialItem}>
                            <BodySmall>
                              {material.materialName} ({material.materialUnit})
                            </BodySmall>
                            <BodySmall color={colors.textSecondary}>
                              Quantity: {material.plannedQuantityTotal.toLocaleString()}
                            </BodySmall>
                            <BodySmall color={colors.textSecondary}>
                              Est. Cost: {material.estimatedAmount.toLocaleString()}₫
                            </BodySmall>
                          </View>
                        ))}
                      </View>
                    </>
                  )}
                  <Spacer size="md" />
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => handleViewDetail(task.cultivationTaskId)}
                    >
                      <BodySemibold style={styles.secondaryButtonText}>View Details</BodySemibold>
                    </TouchableOpacity>
                    {normalizeStatus(task.status) !== 'completed' && (
                      <Button
                        size="sm"
                        onPress={() => handleConfirmTask(task)}
                        style={styles.confirmButton}
                      >
                        {normalizeStatus(task.status) === 'pending'
                          ? 'Start Task'
                          : 'Confirm Completion'}
                      </Button>
                    )}
                  </View>
                </Card>
                <Spacer size="md" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
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
  headerRight: {
    width: 40,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.xs,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    shadowOpacity: 0,
  },
  taskCard: {
    padding: spacing.md,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  taskIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskHeaderInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  taskTitle: {
    fontSize: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  filterButtonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  dropdownSection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  dropdownTrigger: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownList: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  dropdownOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  dropdownOptionSelected: {
    backgroundColor: colors.primaryLighter,
  },
  dropdownError: {
    marginTop: spacing.xs,
  },
  taskDescription: {
    lineHeight: 18,
  },
  taskDetails: {
    gap: spacing.xs,
  },
  taskDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmButton: {
    alignSelf: 'flex-start',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  completedInfo: {
    padding: spacing.sm,
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 260,
    paddingVertical: spacing['4xl'],
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  overdueBadge: {
    backgroundColor: colors.error + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
  },
  overdueText: {
    color: colors.error,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  materialsSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  materialsHeader: {
    marginBottom: spacing.xs,
    fontSize: 12,
  },
  materialItem: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
});

