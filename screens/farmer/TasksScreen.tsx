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
  useWindowDimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context'
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { scale, moderateScale, getFontSize, getSpacing, isTablet, verticalScale } from '../../utils/responsive';
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
import { getCurrentFarmerPlots, getTodayTasks, startTask } from '../../libs/farmer';
import { TaskDetailModal } from './TaskDetailModal';
import { Alert } from 'react-native';

export const FarmerTasksScreen = () => {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const [selectedFilter, setSelectedFilter] = useState<'in-progress' | 'approved' | 'completed'>(
    'in-progress',
  );
  const [selectedPlotId, setSelectedPlotId] = useState<string>('all');
  const [isPlotPickerOpen, setIsPlotPickerOpen] = useState(false);
  const [filterCounts, setFilterCounts] = useState<Record<'in-progress' | 'approved' | 'completed', number>>({
    'in-progress': 0,
    approved: 0,
    completed: 0,
  });
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const queryClient = useQueryClient();
  
  // Responsive styles
  const responsiveStyles = getResponsiveStyles(screenWidth);

  const statusFilterMap: Record<'in-progress' | 'approved' | 'completed', string> = {
    'in-progress': 'InProgress',
    approved: 'Approved',
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

  // Start task mutation
  const startTaskMutation = useMutation({
    mutationFn: (request: { cultivationTaskId: string; weatherConditions?: string; notes?: string }) =>
      startTask({
        cultivationTaskId: request.cultivationTaskId,
        weatherConditions: request.weatherConditions || null,
        notes: request.notes || null,
      }),
    onSuccess: () => {
      // Invalidate and refetch tasks to update the status
      queryClient.invalidateQueries({ queryKey: ['today-tasks'] });
      refetch();
      Alert.alert('Success', 'Task started successfully');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to start task';
      Alert.alert('Error', errorMessage);
    },
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
      case 'approved':
        return '#10B981'; // Green for approved
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
      case 'approved':
        return 'approved';
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

  const handleStartTask = (task: TodayTaskResponse) => {
    Alert.alert(
      'Start Task',
      `Are you sure you want to start "${task.taskName}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Start',
          onPress: () => {
            startTaskMutation.mutate({
              cultivationTaskId: task.cultivationTaskId,
              weatherConditions: undefined, // Can be enhanced with weather input later
              notes: undefined, // Can be enhanced with notes input later
            });
          },
        },
      ],
    );
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

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            onPress={() => setSelectedFilter('in-progress')}
            style={[
              styles.filterTab,
              selectedFilter === 'in-progress' && styles.filterTabActive,
            ]}
          >
            <Body
              color={selectedFilter === 'in-progress' ? colors.primary : colors.textSecondary}
              style={styles.filterTabText}
            >
              In Progress
            </Body>
            {filterCounts['in-progress'] > 0 && (
              <View style={[
                styles.filterBadge,
                selectedFilter === 'in-progress' && styles.filterBadgeActive
              ]}>
                <BodySmall style={[
                  styles.filterBadgeText,
                  selectedFilter === 'in-progress' && styles.filterBadgeTextActive
                ]}>
                  {filterCounts['in-progress']}
                </BodySmall>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setSelectedFilter('approved')}
            style={[
              styles.filterTab,
              selectedFilter === 'approved' && styles.filterTabActive,
            ]}
          >
            <Body
              color={selectedFilter === 'approved' ? colors.primary : colors.textSecondary}
              style={styles.filterTabText}
            >
              Approved
            </Body>
            {filterCounts['approved'] > 0 && (
              <View style={[
                styles.filterBadge,
                selectedFilter === 'approved' && styles.filterBadgeActive
              ]}>
                <BodySmall style={[
                  styles.filterBadgeText,
                  selectedFilter === 'approved' && styles.filterBadgeTextActive
                ]}>
                  {filterCounts['approved']}
                </BodySmall>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setSelectedFilter('completed')}
            style={[
              styles.filterTab,
              selectedFilter === 'completed' && styles.filterTabActive,
            ]}
          >
            <Body
              color={selectedFilter === 'completed' ? colors.primary : colors.textSecondary}
              style={styles.filterTabText}
            >
              Completed
            </Body>
            {filterCounts['completed'] > 0 && (
              <View style={[
                styles.filterBadge,
                selectedFilter === 'completed' && styles.filterBadgeActive
              ]}>
                <BodySmall style={[
                  styles.filterBadgeText,
                  selectedFilter === 'completed' && styles.filterBadgeTextActive
                ]}>
                  {filterCounts['completed']}
                </BodySmall>
              </View>
            )}
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
            {filteredTasks.map((task: TodayTaskResponse, index: number) => {
              // Find the first approved task index
              const firstApprovedIndex = filteredTasks.findIndex(
                (t) => normalizeStatus(t.status) === 'approved'
              );
              const isFirstApproved = index === firstApprovedIndex && normalizeStatus(task.status) === 'approved';
              
              return (
              <TouchableOpacity 
                key={task.cultivationTaskId}
                onPress={() => handleViewDetail(task.cultivationTaskId)}
                activeOpacity={0.7}
              >
                <Card variant="elevated" style={styles.taskCard}>
                  {/* Status and overdue badges at top */}
                  <View style={styles.badgesRow}>
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
                          fontWeight: '700',
                          letterSpacing: 0.5,
                        }}
                      >
                        {task.status.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
                      </BodySmall>
                    </View>
                    {task.isOverdue && (
                      <View style={styles.overdueBadge}>
                        <BodySmall style={styles.overdueText}>⚠️ OVERDUE</BodySmall>
                      </View>
                    )}
                  </View>
                  <Spacer size="sm" />
                  
                  {/* Task header */}
                  <View style={styles.taskHeader}>
                    <View style={styles.taskIcon}>
                      <Body style={{ fontSize: 24 }}>{getTaskIcon(task.taskType)}</Body>
                    </View>
                    <View style={styles.taskHeaderInfo}>
                      <BodySemibold style={styles.taskTitle}>{task.taskName}</BodySemibold>
                      <BodySmall color={colors.textSecondary} style={{ marginTop: 2 }}>
                        {task.taskType}
                      </BodySmall>
                    </View>
                  </View>
                  <Spacer size="sm" />
                  
                  {/* Plot info */}
                  <View style={styles.plotInfoCard}>
                    <View style={styles.plotInfoRow}>
                      <BodySmall color={colors.textSecondary}>📍 Plot:</BodySmall>
                      <Body style={styles.plotInfoText}>{task.plotSoThuaSoTo}</Body>
                    </View>
                    {task.plotArea > 0 && (
                      <View style={styles.plotInfoRow}>
                        <BodySmall color={colors.textSecondary}>📏 Area:</BodySmall>
                        <Body style={styles.plotInfoText}>{task.plotArea.toFixed(2)} ha</Body>
                      </View>
                    )}
                  </View>
                  
                  {task.description && (
                    <>
                      <Spacer size="sm" />
                      <BodySmall color={colors.textSecondary} style={styles.taskDescription}>
                        {task.description}
                      </BodySmall>
                    </>
                  )}
                  
                  <Spacer size="sm" />
                  
                  {/* Key details grid */}
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailCard}>
                      <BodySmall color={colors.textSecondary} style={styles.detailLabel}>
                        📅 Scheduled
                      </BodySmall>
                      <BodySemibold style={styles.detailValue}>
                        {dayjs(task.scheduledDate).format('MMM D, YYYY')}
                      </BodySemibold>
                    </View>
                    <View style={styles.detailCard}>
                      <BodySmall color={colors.textSecondary} style={styles.detailLabel}>
                        🎯 Priority
                      </BodySmall>
                      <BodySemibold style={styles.detailValue}>{task.priority}</BodySemibold>
                    </View>
                    {task.estimatedMaterialCost > 0 && (
                      <View style={styles.detailCard}>
                        <BodySmall color={colors.textSecondary} style={styles.detailLabel}>
                          💰 Est. Cost
                        </BodySmall>
                        <BodySemibold style={styles.detailValue}>
                          {task.estimatedMaterialCost.toLocaleString()}₫
                        </BodySemibold>
                      </View>
                    )}
                  </View>
                  {task.materials && task.materials.length > 0 && (
                    <>
                      <Spacer size="md" />
                      <View style={styles.materialsSection}>
                        <View style={styles.materialsSectionHeader}>
                          <BodySemibold style={styles.materialsTitle}>📦 Materials Required</BodySemibold>
                          <View style={styles.materialsCountBadge}>
                            <BodySmall style={styles.materialsCountText}>
                              {task.materials.length}
                            </BodySmall>
                          </View>
                        </View>
                        <Spacer size="xs" />
                        {task.materials.slice(0, 2).map((material) => (
                          <View key={material.materialId} style={styles.materialItem}>
                            <View style={styles.materialHeader}>
                              <BodySemibold style={styles.materialName}>
                                {material.materialName}
                              </BodySemibold>
                              <Body color={colors.textSecondary} style={styles.materialUnit}>
                                ({material.materialUnit})
                              </Body>
                            </View>
                            <View style={styles.materialDetails}>
                              <BodySmall color={colors.textSecondary}>
                                Qty: {material.plannedQuantityTotal.toLocaleString()} • 
                                Cost: {material.estimatedAmount.toLocaleString()}₫
                              </BodySmall>
                            </View>
                          </View>
                        ))}
                        {task.materials.length > 2 && (
                          <BodySmall color={colors.primary} style={styles.moreMaterials}>
                            +{task.materials.length - 2} more materials
                          </BodySmall>
                        )}
                      </View>
                    </>
                  )}
                  <Spacer size="md" />
                  <View style={styles.actionRow}>
                    {/* Only show Start Task for the first approved task */}
                    {isFirstApproved && (
                      <TouchableOpacity
                        style={styles.primaryActionButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleStartTask(task);
                        }}
                        disabled={startTaskMutation.isPending}
                      >
                        <View style={styles.primaryActionButtonContent}>
                          {startTaskMutation.isPending ? (
                            <ActivityIndicator size="small" color={colors.white} />
                          ) : (
                            <BodySemibold style={styles.primaryActionButtonText}>
                              Start Task
                            </BodySemibold>
                          )}
                        </View>
                      </TouchableOpacity>
                    )}
                    {/* Show Confirm Completion for in-progress tasks (not approved, not completed) */}
                    {normalizeStatus(task.status) === 'in-progress' && (
                      <TouchableOpacity
                        style={styles.primaryActionButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleConfirmTask(task);
                        }}
                      >
                        <View style={styles.primaryActionButtonContent}>
                          <BodySemibold style={styles.primaryActionButtonText}>
                            Confirm Completion
                          </BodySemibold>
                        </View>
                      </TouchableOpacity>
                    )}
                    {/* Show Start Task for pending tasks */}
                    {normalizeStatus(task.status) === 'pending' && (
                      <TouchableOpacity
                        style={styles.primaryActionButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleConfirmTask(task);
                        }}
                      >
                        <View style={styles.primaryActionButtonContent}>
                          <BodySemibold style={styles.primaryActionButtonText}>
                            Start Task
                          </BodySemibold>
                        </View>
                      </TouchableOpacity>
                    )}
                    {/* Show completed banner for completed tasks */}
                    {normalizeStatus(task.status) === 'completed' && (
                      <View style={styles.completedBanner}>
                        <Body style={styles.completedText}>
                          ✓ Completed
                        </Body>
                      </View>
                    )}
                    {/* Show approved banner for approved tasks that are not the first one */}
                    {normalizeStatus(task.status) === 'approved' && !isFirstApproved && (
                      <View style={styles.completedBanner}>
                        <Body style={styles.completedText}>
                          ✓ Approved
                        </Body>
                      </View>
                    )}
                  </View>
                </Card>
                <Spacer size="md" />
              </TouchableOpacity>
            );
            })}
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

// Responsive styles function
const getResponsiveStyles = (screenWidth: number) => {
  const isTabletSize = screenWidth >= 768;
  const padding = isTabletSize ? getSpacing(24) : getSpacing(16);
  const fontSize = isTabletSize ? getFontSize(16) : getFontSize(14);
  
  return {
    padding,
    fontSize,
    cardSpacing: isTabletSize ? getSpacing(20) : getSpacing(16),
    iconSize: isTabletSize ? scale(56) : scale(52),
  };
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
    paddingTop: getSpacing(spacing.md),
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: getFontSize(20),
  },
  headerRight: {
    width: scale(40),
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: moderateScale(borderRadius.lg),
    padding: getSpacing(4),
    ...shadows.sm,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getSpacing(spacing.sm),
    paddingHorizontal: getSpacing(spacing.xs),
    borderRadius: moderateScale(borderRadius.md),
    gap: getSpacing(spacing.xs),
  },
  filterTabActive: {
    backgroundColor: colors.primaryLighter,
  },
  filterTabText: {
    fontSize: getFontSize(14),
    fontWeight: '600',
  },
  filterBadge: {
    backgroundColor: colors.textSecondary + '20',
    paddingHorizontal: getSpacing(6),
    paddingVertical: getSpacing(2),
    borderRadius: moderateScale(borderRadius.full),
    minWidth: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeActive: {
    backgroundColor: colors.primary,
  },
  filterBadgeText: {
    color: colors.textSecondary,
    fontSize: getFontSize(11),
    fontWeight: '700',
  },
  filterBadgeTextActive: {
    color: colors.white,
  },
  taskCard: {
    padding: getSpacing(spacing.lg),
    borderRadius: moderateScale(borderRadius.xl),
  },
  badgesRow: {
    flexDirection: 'row',
    gap: getSpacing(spacing.sm),
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: getSpacing(spacing.sm),
    paddingVertical: getSpacing(4),
    borderRadius: moderateScale(borderRadius.full),
    alignItems: 'center',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(spacing.md),
  },
  taskIcon: {
    width: scale(52),
    height: scale(52),
    borderRadius: moderateScale(borderRadius.lg),
    backgroundColor: colors.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.xs,
  },
  taskHeaderInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: getFontSize(17),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dropdownSection: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(borderRadius.lg),
    padding: getSpacing(spacing.md),
    ...shadows.sm,
  },
  dropdownTrigger: {
    marginTop: getSpacing(spacing.xs),
    paddingVertical: getSpacing(spacing.sm),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownList: {
    marginTop: getSpacing(spacing.sm),
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: moderateScale(borderRadius.md),
    backgroundColor: colors.background,
  },
  dropdownOption: {
    paddingVertical: getSpacing(spacing.sm),
    paddingHorizontal: getSpacing(spacing.md),
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  dropdownOptionSelected: {
    backgroundColor: colors.primaryLighter,
  },
  dropdownError: {
    marginTop: getSpacing(spacing.xs),
  },
  plotInfoCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: moderateScale(borderRadius.md),
    padding: getSpacing(spacing.sm),
    gap: getSpacing(spacing.xs),
  },
  plotInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(spacing.sm),
  },
  plotInfoText: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  taskDescription: {
    lineHeight: moderateScale(20),
    fontSize: getFontSize(14),
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getSpacing(spacing.sm),
  },
  detailCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: moderateScale(borderRadius.md),
    padding: getSpacing(spacing.sm),
  },
  detailLabel: {
    fontSize: getFontSize(11),
    marginBottom: getSpacing(4),
  },
  detailValue: {
    fontSize: getFontSize(14),
    color: colors.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(spacing.sm),
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: moderateScale(borderRadius.lg),
    ...shadows.sm,
  },
  primaryActionButtonContent: {
    paddingVertical: getSpacing(spacing.md),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionButtonText: {
    color: colors.white,
    fontSize: getFontSize(15),
  },
  completedBanner: {
    flex: 1,
    backgroundColor: colors.success + '15',
    borderRadius: moderateScale(borderRadius.lg),
    padding: getSpacing(spacing.md),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  completedText: {
    color: colors.success,
    fontWeight: '700',
    fontSize: getFontSize(15),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getSpacing(spacing['2xl']),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getSpacing(spacing['2xl']),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(260),
    paddingVertical: getSpacing(spacing['4xl']),
  },
  overdueBadge: {
    backgroundColor: colors.error + '20',
    paddingHorizontal: getSpacing(spacing.sm),
    paddingVertical: getSpacing(4),
    borderRadius: moderateScale(borderRadius.full),
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  overdueText: {
    color: colors.error,
    fontSize: getFontSize(10),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  materialsSection: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: moderateScale(borderRadius.lg),
    padding: getSpacing(spacing.md),
  },
  materialsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  materialsTitle: {
    fontSize: getFontSize(14),
    color: colors.textPrimary,
  },
  materialsCountBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: getSpacing(spacing.sm),
    paddingVertical: getSpacing(2),
    borderRadius: moderateScale(borderRadius.full),
    minWidth: scale(24),
    alignItems: 'center',
  },
  materialsCountText: {
    color: colors.primary,
    fontSize: getFontSize(12),
    fontWeight: '700',
  },
  materialItem: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(borderRadius.md),
    padding: getSpacing(spacing.sm),
    marginBottom: getSpacing(spacing.xs),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  materialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(spacing.xs),
    marginBottom: getSpacing(4),
  },
  materialName: {
    fontSize: getFontSize(14),
    color: colors.textPrimary,
  },
  materialUnit: {
    fontSize: getFontSize(13),
  },
  materialDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreMaterials: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: getFontSize(13),
  },
});

