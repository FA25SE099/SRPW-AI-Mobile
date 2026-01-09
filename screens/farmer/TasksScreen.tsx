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
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context'
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
import { FarmerPlot, TodayTaskResponse, PlotCultivationPlan } from '../../types/api';
import { getCurrentFarmerPlots, getTodayTasks, startTask, getPlotCultivationPlans } from '../../libs/farmer';
import { TaskDetailModal } from './TaskDetailModal';
import { Alert } from 'react-native';
import {
  translateTaskStatus,
  translatePriority,
  translateTaskType,
} from '../../utils/translations';

export const FarmerTasksScreen = () => {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const [selectedFilter, setSelectedFilter] = useState<'in-progress' | 'approved' | 'completed' | 'emergency' | 'emergency-approval'>(
    'in-progress',
  );
  const [selectedPlotId, setSelectedPlotId] = useState<string>('all');
  const [isPlotPickerOpen, setIsPlotPickerOpen] = useState(false);
  const [selectedPlotCultivationId, setSelectedPlotCultivationId] = useState<string>('all');
  const [isCultivationPlanPickerOpen, setIsCultivationPlanPickerOpen] = useState(false);
  const [filterCounts, setFilterCounts] = useState<Record<'in-progress' | 'approved' | 'completed' | 'emergency' | 'emergency-approval', number>>({
    'in-progress': 0,
    approved: 0,
    completed: 0,
    emergency: 0,
    'emergency-approval': 0,
  });
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const queryClient = useQueryClient();
  
  // Responsive styles
  const responsiveStyles = getResponsiveStyles(screenWidth);

  const statusFilterMap: Record<'in-progress' | 'approved' | 'completed' | 'emergency' | 'emergency-approval', string> = {
    'in-progress': 'InProgress',
    approved: 'Approved',
    completed: 'Completed',
    emergency: 'Emergency',
    'emergency-approval': 'EmergencyApproval',
  };

  const apiStatusFilter = statusFilterMap[selectedFilter];
  const apiPlotCultivationId = selectedPlotCultivationId === 'all' ? undefined : selectedPlotCultivationId;

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

  // Fetch cultivation plans for selected plot
  const {
    data: cultivationPlansData,
    isLoading: cultivationPlansLoading,
    error: cultivationPlansError,
  } = useQuery({
    queryKey: ['plot-cultivation-plans', selectedPlotId],
    queryFn: () => getPlotCultivationPlans(selectedPlotId, { currentPage: 1, pageSize: 100 }),
    enabled: selectedPlotId !== 'all',
  });

  const cultivationPlans: PlotCultivationPlan[] = cultivationPlansData?.data || [];

  // Auto-select first cultivation plan once data is available
  useEffect(() => {
    if (
      selectedPlotCultivationId === 'all' &&
      !cultivationPlansLoading &&
      !cultivationPlansError &&
      cultivationPlans.length > 0
    ) {
      setSelectedPlotCultivationId(cultivationPlans[0].plotCultivationId);
    }
  }, [cultivationPlans, cultivationPlansLoading, cultivationPlansError, selectedPlotCultivationId]);

  // Reset cultivation plan selection when plot changes
  useEffect(() => {
    if (selectedPlotId === 'all') {
      setSelectedPlotCultivationId('all');
    } else if (cultivationPlans.length > 0) {
      setSelectedPlotCultivationId(cultivationPlans[0].plotCultivationId);
    }
  }, [selectedPlotId, cultivationPlans]);

  // Fetch today's tasks
  const {
    data: tasks,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['today-tasks', { plotCultivationId: apiPlotCultivationId, status: apiStatusFilter }],
    queryFn: () => getTodayTasks({ plotCultivationId: apiPlotCultivationId, statusFilter: apiStatusFilter }),
    enabled: selectedPlotId === 'all' || (selectedPlotId !== 'all' && selectedPlotCultivationId !== 'all'),
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
      console.error('❌ [startTask] Error:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message,
        url: error?.config?.url,
        method: error?.config?.method,
      });
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to start task';
      Alert.alert('Error', `Status: ${error?.response?.status || 'Unknown'}\n${errorMessage}`);
    },
  });

  const getTaskIcon = (type: string) => {
    const icons: { [key: string]: { name: string; library: 'Ionicons' | 'MaterialCommunityIcons' } } = {
      Spraying: { name: 'spray', library: 'MaterialCommunityIcons' },
      Fertilizing: { name: 'water-outline', library: 'Ionicons' },
      Harvesting: { name: 'leaf-outline', library: 'Ionicons' },
      Irrigation: { name: 'water', library: 'Ionicons' },
      Planting: { name: 'seed-outline', library: 'MaterialCommunityIcons' },
      Other: { name: 'document-text-outline', library: 'Ionicons' },
    };
    return icons[type] || { name: 'document-text-outline', library: 'Ionicons' };
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
      case 'emergency':
        return colors.error; // Red for emergency
      case 'emergencyapproval':
      case 'emergency-approval':
        return '#EF4444'; // Dark red for emergency approval
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
      case 'emergency':
        return 'emergency';
      case 'emergencyapproval':
        return 'emergency-approval';
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
    // Reset cultivation plan selection when plot changes
    setSelectedPlotCultivationId('all');
  };

  const handleCultivationPlanSelect = (plotCultivationId: string) => {
    setSelectedPlotCultivationId(plotCultivationId);
    setIsCultivationPlanPickerOpen(false);
  };

  const cultivationPlanDisplayLabel = () => {
    if (selectedPlotCultivationId === 'all') {
      return 'Tất cả kế hoạch';
    }
    const plan = cultivationPlans.find((p) => p.plotCultivationId === selectedPlotCultivationId);
    if (!plan) {
      return 'Chọn kế hoạch';
    }
    return `${plan.productionPlanName} - ${plan.seasonName}`;
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
        plotArea: task.plotArea?.toString() || '',
      },
    } as any);
  };

  const handleViewDetail = (taskId: string) => {
    setDetailTaskId(taskId);
    setIsDetailVisible(true);
  };

  const handleStartTask = (task: TodayTaskResponse) => {
    Alert.alert(
      'Bắt đầu công việc',
      `Bạn có chắc chắn muốn bắt đầu "${task.taskName}"?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Bắt đầu',
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
            <Body color={colors.textSecondary}>Đang tải công việc...</Body>
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
            <H3 style={styles.headerTitle}>Công việc của tôi</H3>
            <View style={styles.headerRight} />
          </View>
          <Spacer size="xl" />
          <View style={styles.errorContainer}>
            <Body color={colors.error}>Không thể tải công việc</Body>
            <Spacer size="md" />
            <Button size="sm" onPress={() => refetch()}>
              Thử lại
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
          <H3 style={styles.headerTitle}>Công việc của tôi</H3>
          <View style={styles.headerRight} />
        </View>

        <Spacer size="lg" />

        {/* Plot Filter */}
        <View style={styles.dropdownSection}>
          <BodySmall color={colors.textSecondary}>Lọc theo thửa đất</BodySmall>
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
                  Không thể tải thửa đất
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

        <Spacer size="md" />

        {/* Cultivation Plan Filter */}
        {selectedPlotId !== 'all' && (
          <View style={styles.dropdownSection}>
            <BodySmall color={colors.textSecondary}>Lọc theo kế hoạch canh tác</BodySmall>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => setIsCultivationPlanPickerOpen((prev) => !prev)}
              disabled={cultivationPlansLoading || selectedPlotId === 'all'}
            >
              <BodySemibold>{cultivationPlanDisplayLabel()}</BodySemibold>
              <BodySmall color={colors.textSecondary}>{isCultivationPlanPickerOpen ? '^' : 'v'}</BodySmall>
            </TouchableOpacity>
            {cultivationPlansError && (
              <BodySmall color={colors.error} style={styles.dropdownError}>
                Không thể tải kế hoạch canh tác
              </BodySmall>
            )}
            {isCultivationPlanPickerOpen && (
              <View style={styles.dropdownList}>
                <ScrollView nestedScrollEnabled style={{ maxHeight: 220 }}>
                  <TouchableOpacity
                    style={[
                      styles.dropdownOption,
                      selectedPlotCultivationId === 'all' && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => handleCultivationPlanSelect('all')}
                  >
                    <Body>Tất cả kế hoạch</Body>
                  </TouchableOpacity>
                  {cultivationPlans.map((plan: PlotCultivationPlan) => (
                    <TouchableOpacity
                      key={plan.plotCultivationId}
                      style={[
                        styles.dropdownOption,
                        selectedPlotCultivationId === plan.plotCultivationId && styles.dropdownOptionSelected,
                      ]}
                      onPress={() => handleCultivationPlanSelect(plan.plotCultivationId)}
                    >
                      <Body>
                        {plan.productionPlanName} - {plan.seasonName}
                      </Body>
                      <BodySmall color={colors.textSecondary}>
                        {plan.area ? `${plan.area.toFixed(2)} ha` : 'N/A'}
                      </BodySmall>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        <Spacer size="lg" />

        {/* Filter Tabs */}
        <View style={styles.filterWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
          <TouchableOpacity
            onPress={() => setSelectedFilter('in-progress')}
            style={[
              styles.filterTab,
              selectedFilter === 'in-progress' && styles.filterTabActive,
            ]}
          >
            <Body
              color={selectedFilter === 'in-progress' ? greenTheme.primary : colors.textSecondary}
              style={styles.filterTabText}
            >
              Đang thực hiện
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
              color={selectedFilter === 'approved' ? greenTheme.primary : colors.textSecondary}
              style={styles.filterTabText}
            >
              Đã duyệt
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
              color={selectedFilter === 'completed' ? greenTheme.primary : colors.textSecondary}
              style={styles.filterTabText}
            >
              Hoàn thành
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

          <TouchableOpacity
            onPress={() => setSelectedFilter('emergency')}
            style={[
              styles.filterTab,
              selectedFilter === 'emergency' && [
                styles.filterTabActive,
                { backgroundColor: colors.error + '15' }
              ],
            ]}
          >
            <Body
              color={selectedFilter === 'emergency' ? colors.error : colors.textSecondary}
              style={styles.filterTabText}
            >
              Khẩn cấp
            </Body>
            {filterCounts['emergency'] > 0 && (
              <View style={[
                styles.filterBadge,
                selectedFilter === 'emergency' && styles.filterBadgeActive,
                { backgroundColor: selectedFilter === 'emergency' ? colors.error : greenTheme.border }
              ]}>
                <BodySmall style={[
                  styles.filterBadgeText,
                  selectedFilter === 'emergency' && styles.filterBadgeTextActive,
                  { color: selectedFilter === 'emergency' ? colors.white : colors.error }
                ]}>
                  {filterCounts['emergency']}
                </BodySmall>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedFilter('emergency-approval')}
            style={[
              styles.filterTab,
              styles.filterTabLast,
              selectedFilter === 'emergency-approval' && [
                styles.filterTabActive,
                { backgroundColor: '#EF4444' + '15' }
              ],
            ]}
          >
            <Body
              color={selectedFilter === 'emergency-approval' ? '#EF4444' : colors.textSecondary}
              style={styles.filterTabText}
            >
              Hoàn thành khẩn cấp
            </Body>
            {filterCounts['emergency-approval'] > 0 && (
              <View style={[
                styles.filterBadge,
                selectedFilter === 'emergency-approval' && styles.filterBadgeActive,
                { backgroundColor: selectedFilter === 'emergency-approval' ? '#EF4444' : greenTheme.border }
              ]}>
                <BodySmall style={[
                  styles.filterBadgeText,
                  selectedFilter === 'emergency-approval' && styles.filterBadgeTextActive,
                  { color: selectedFilter === 'emergency-approval' ? colors.white : '#EF4444' }
                ]}>
                  {filterCounts['emergency-approval']}
                </BodySmall>
              </View>
            )}
          </TouchableOpacity>
          </ScrollView>
        </View>

        <Spacer size="xl" />

        {/* Tasks List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[greenTheme.primary]} />}
          contentContainerStyle={filteredTasks.length === 0 ? { flexGrow: 1 } : undefined}
        >
          {filteredTasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Body color={colors.textSecondary}>Không tìm thấy công việc nào</Body>
            </View>
          ) : (
            <>
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
                        {translateTaskStatus(task.status).toUpperCase()}
                      </BodySmall>
                    </View>
                    {task.isUav && (
                      <View style={styles.uavBadge}>
                        <Ionicons name="airplane-outline" size={12} color={greenTheme.primary} style={{ marginRight: 4 }} />
                        <BodySmall style={styles.uavBadgeText}>UAV</BodySmall>
                      </View>
                    )}
                    {task.isOverdue && (
                      <View style={styles.overdueBadge}>
                        <Ionicons name="warning-outline" size={12} color={colors.error} style={{ marginRight: 4 }} />
                        <BodySmall style={styles.overdueText}>QUÁ HẠN</BodySmall>
                      </View>
                    )}
                  </View>
                  <Spacer size="sm" />
                  
                  {/* Task header */}
                  <View style={styles.taskHeader}>
                    <View style={styles.taskIcon}>
                      {(() => {
                        const icon = getTaskIcon(task.taskType);
                        return icon.library === 'Ionicons' ? (
                          <Ionicons name={icon.name as any} size={28} color={greenTheme.primary} />
                        ) : (
                          <MaterialCommunityIcons name={icon.name as any} size={28} color={greenTheme.primary} />
                        );
                      })()}
                    </View>
                    <View style={styles.taskHeaderInfo}>
                      <BodySemibold style={styles.taskTitle}>{task.taskName}</BodySemibold>
                      <BodySmall color={colors.textSecondary} style={{ marginTop: 2 }}>
                        {translateTaskType(task.taskType)}
                      </BodySmall>
                    </View>
                  </View>
                  <Spacer size="sm" />
                  
                  {/* Plot info */}
                  <View style={styles.plotInfoCard}>
                      <View style={styles.plotInfoRow}>
                        <Ionicons name="location-outline" size={16} color={greenTheme.primary} style={{ marginRight: 4 }} />
                        <BodySmall color={greenTheme.primary} style={{ fontWeight: '600' }}>Thửa đất:</BodySmall>
                        <Body style={styles.plotInfoText}>{task.plotSoThuaSoTo}</Body>
                      </View>
                      {task.plotArea > 0 && (
                        <View style={styles.plotInfoRow}>
                          <Ionicons name="resize-outline" size={16} color={greenTheme.primary} style={{ marginRight: 4 }} />
                          <BodySmall color={greenTheme.primary} style={{ fontWeight: '600' }}>Diện tích:</BodySmall>
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
                      <View style={styles.detailLabelRow}>
                        <Ionicons name="calendar-outline" size={14} color={greenTheme.primary} />
                        <BodySmall color={greenTheme.primary} style={styles.detailLabel}>
                          Lịch trình
                        </BodySmall>
                      </View>
                      <BodySemibold style={styles.detailValue}>
                        {dayjs(task.scheduledDate).format('MMM D, YYYY')}
                      </BodySemibold>
                    </View>
                    <View style={styles.detailCard}>
                      <View style={styles.detailLabelRow}>
                        <Ionicons name="flag-outline" size={14} color={greenTheme.primary} />
                        <BodySmall color={greenTheme.primary} style={styles.detailLabel}>
                          Ưu tiên
                        </BodySmall>
                      </View>
                      <BodySemibold style={styles.detailValue}>{translatePriority(task.priority)}</BodySemibold>
                    </View>
                    {task.estimatedMaterialCost > 0 && (
                      <View style={styles.detailCard}>
                        <View style={styles.detailLabelRow}>
                          <Ionicons name="cash-outline" size={14} color={greenTheme.primary} />
                          <BodySmall color={greenTheme.primary} style={styles.detailLabel}>
                            Chi phí dự kiến
                          </BodySmall>
                        </View>
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
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Ionicons name="cube-outline" size={16} color={greenTheme.primary} />
                            <BodySemibold style={styles.materialsTitle}>Vật liệu cần thiết</BodySemibold>
                          </View>
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
                                SL: {material.plannedQuantityTotal.toLocaleString()} • 
                                Chi phí: {material.estimatedAmount.toLocaleString()}₫
                              </BodySmall>
                            </View>
                          </View>
                        ))}
                        {task.materials.length > 2 && (
                          <BodySmall color={colors.primary} style={styles.moreMaterials}>
                            +{task.materials.length - 2} vật liệu khác
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
                              Bắt đầu
                            </BodySemibold>
                          )}
                        </View>
                      </TouchableOpacity>
                    )}
                    {/* Show Confirm Completion and Report Issue for in-progress tasks (not approved, not completed) */}
                    {normalizeStatus(task.status) === 'in-progress' && (
                      <>
                        <TouchableOpacity
                          style={styles.primaryActionButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleConfirmTask(task);
                          }}
                        >
                          <View style={styles.primaryActionButtonContent}>
                            <BodySemibold style={styles.primaryActionButtonText}>
                              Hoàn thành
                            </BodySemibold>
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.secondaryActionButton, { borderColor: colors.error }]}
                          onPress={(e) => {
                            e.stopPropagation();
                            router.push({
                              pathname: '/farmer/reports/create',
                              params: {
                                plotCultivationId: task.plotCultivationId,
                                affectedCultivationTaskId: task.cultivationTaskId,
                              },
                            } as any);
                          }}
                        >
                          <View style={styles.secondaryActionButtonContent}>
                            <Ionicons name="warning-outline" size={16} color={colors.error} style={{ marginRight: 4 }} />
                            <BodySemibold style={[styles.secondaryActionButtonText, { color: colors.error }]}>
                              Báo cáo
                            </BodySemibold>
                          </View>
                        </TouchableOpacity>
                      </>
                    )}
                    {/* Show Confirm Completion for emergency tasks */}
                    {normalizeStatus(task.status) === 'emergency' && (
                      <TouchableOpacity
                        style={[styles.primaryActionButton, { backgroundColor: colors.error }]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleConfirmTask(task);
                        }}
                      >
                        <View style={styles.primaryActionButtonContent}>
                          <BodySemibold style={styles.primaryActionButtonText}>
                            Xác nhận hoàn thành
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
                            Bắt đầu
                          </BodySemibold>
                        </View>
                      </TouchableOpacity>
                    )}
                    {/* Show completed banner for completed tasks */}
                        {normalizeStatus(task.status) === 'completed' && (
                      <View style={styles.completedBanner}>
                        <Ionicons name="checkmark-circle" size={18} color={greenTheme.success} style={{ marginRight: 4 }} />
                        <Body style={styles.completedText}>
                          Hoàn thành
                        </Body>
                      </View>
                    )}
                    {/* Show approved banner for approved tasks that are not the first one */}
                    {normalizeStatus(task.status) === 'approved' && !isFirstApproved && (
                      <View style={styles.completedBanner}>
                        <Ionicons name="checkmark-circle" size={18} color={greenTheme.success} style={{ marginRight: 4 }} />
                        <Body style={styles.completedText}>
                          Đã duyệt
                        </Body>
                      </View>
                    )}
                  </View>
                </Card>
                <Spacer size="md" />
              </TouchableOpacity>
            );
            })}
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
  headerRight: {
    width: scale(40),
  },
  filterWrapper: {
    width: '100%',
    minHeight: scale(50),
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: greenTheme.cardBackground,
    borderRadius: moderateScale(borderRadius.lg),
    padding: getSpacing(4),
    borderWidth: 1,
    borderColor: greenTheme.border,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
    paddingHorizontal: getSpacing(spacing.xs),
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getSpacing(spacing.sm),
    paddingHorizontal: getSpacing(spacing.md),
    borderRadius: moderateScale(borderRadius.md),
    marginRight: getSpacing(spacing.xs),
    minWidth: scale(100),
  },
  filterTabLast: {
    marginRight: 0,
  },
  filterTabActive: {
    backgroundColor: greenTheme.primaryLighter,
  },
  filterTabText: {
    fontSize: getFontSize(14),
    fontWeight: '600',
  },
  filterBadge: {
    backgroundColor: greenTheme.border,
    paddingHorizontal: getSpacing(6),
    paddingVertical: getSpacing(2),
    borderRadius: moderateScale(borderRadius.full),
    minWidth: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeActive: {
    backgroundColor: greenTheme.primary,
  },
  filterBadgeText: {
    color: greenTheme.primary,
    fontSize: getFontSize(11),
    fontWeight: '700',
  },
  filterBadgeTextActive: {
    color: colors.white,
  },
  taskCard: {
    padding: getSpacing(spacing.lg),
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
    borderRadius: moderateScale(borderRadius.md),
    backgroundColor: greenTheme.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  taskHeaderInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: getFontSize(17),
    fontWeight: '700',
    color: greenTheme.primary,
  },
  dropdownSection: {
    backgroundColor: greenTheme.cardBackground,
    borderRadius: moderateScale(borderRadius.lg),
    padding: getSpacing(spacing.md),
    borderWidth: 1,
    borderColor: greenTheme.border,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    borderColor: greenTheme.border,
    borderRadius: moderateScale(borderRadius.md),
    backgroundColor: greenTheme.background,
  },
  dropdownOption: {
    paddingVertical: getSpacing(spacing.sm),
    paddingHorizontal: getSpacing(spacing.md),
    borderBottomWidth: 1,
    borderBottomColor: greenTheme.border,
  },
  dropdownOptionSelected: {
    backgroundColor: greenTheme.primaryLighter,
  },
  dropdownError: {
    marginTop: getSpacing(spacing.xs),
  },
  plotInfoCard: {
    backgroundColor: greenTheme.primaryLighter,
    borderRadius: moderateScale(borderRadius.md),
    padding: getSpacing(spacing.sm),
    gap: getSpacing(spacing.xs),
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  plotInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(spacing.xs),
  },
  detailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: getSpacing(4),
  },
  plotInfoText: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: greenTheme.primary,
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
    backgroundColor: greenTheme.primaryLighter,
    borderRadius: moderateScale(borderRadius.md),
    padding: getSpacing(spacing.sm),
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  detailLabel: {
    fontSize: getFontSize(11),
    marginBottom: getSpacing(4),
  },
  detailValue: {
    fontSize: getFontSize(14),
    color: greenTheme.primary,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(spacing.sm),
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: greenTheme.primary,
    borderRadius: moderateScale(borderRadius.lg),
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryActionButtonContent: {
    paddingVertical: getSpacing(spacing.md),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionButtonText: {
    color: colors.white,
    fontSize: getFontSize(15),
    fontWeight: '700',
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: greenTheme.cardBackground,
    borderRadius: moderateScale(borderRadius.lg),
    borderWidth: 2,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryActionButtonContent: {
    paddingVertical: getSpacing(spacing.md),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  secondaryActionButtonText: {
    fontSize: getFontSize(15),
    fontWeight: '700',
    color: greenTheme.primary,
  },
  completedBanner: {
    flex: 1,
    backgroundColor: greenTheme.success + '15',
    borderRadius: moderateScale(borderRadius.lg),
    padding: getSpacing(spacing.md),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: greenTheme.success + '30',
  },
  completedText: {
    color: greenTheme.success,
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
  uavBadge: {
    backgroundColor: greenTheme.primaryLighter,
    paddingHorizontal: getSpacing(spacing.sm),
    paddingVertical: getSpacing(4),
    borderRadius: moderateScale(borderRadius.full),
    borderWidth: 1,
    borderColor: greenTheme.primary + '40',
    flexDirection: 'row',
    alignItems: 'center',
  },
  uavBadgeText: {
    color: greenTheme.primary,
    fontSize: getFontSize(10),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  overdueBadge: {
    backgroundColor: colors.error + '20',
    paddingHorizontal: getSpacing(spacing.sm),
    paddingVertical: getSpacing(4),
    borderRadius: moderateScale(borderRadius.full),
    borderWidth: 1,
    borderColor: colors.error + '40',
    flexDirection: 'row',
    alignItems: 'center',
  },
  overdueText: {
    color: colors.error,
    fontSize: getFontSize(10),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  materialsSection: {
    backgroundColor: greenTheme.primaryLighter,
    borderRadius: moderateScale(borderRadius.lg),
    padding: getSpacing(spacing.md),
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  materialsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  materialsTitle: {
    fontSize: getFontSize(14),
    color: greenTheme.primary,
    fontWeight: '700',
  },
  materialsCountBadge: {
    backgroundColor: greenTheme.primary,
    paddingHorizontal: getSpacing(spacing.sm),
    paddingVertical: getSpacing(2),
    borderRadius: moderateScale(borderRadius.full),
    minWidth: scale(24),
    alignItems: 'center',
  },
  materialsCountText: {
    color: colors.white,
    fontSize: getFontSize(12),
    fontWeight: '700',
  },
  materialItem: {
    backgroundColor: greenTheme.cardBackground,
    borderRadius: moderateScale(borderRadius.md),
    padding: getSpacing(spacing.sm),
    marginBottom: getSpacing(spacing.xs),
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  materialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(spacing.xs),
    marginBottom: getSpacing(4),
  },
  materialName: {
    fontSize: getFontSize(14),
    color: greenTheme.primary,
    fontWeight: '600',
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
    color: greenTheme.primary,
  },
});
