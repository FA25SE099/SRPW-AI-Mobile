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
  Image,
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
} from '@/libs/supervisor';
import { Ionicons } from '@expo/vector-icons';

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

export const ProductionPlanDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ planId: string; planName: string }>();
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  
  // Global image viewer state
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const { data: planDetail, isLoading } = useQuery({
    queryKey: ['production-plan-detail', params.planId],
    queryFn: () => getProductionPlanDetail(params.planId),
    enabled: !!params.planId,
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
        return greenTheme.success;
      case 'inprogress':
        return greenTheme.primary;
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Container>
          <Spacer size="md" />
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={greenTheme.primary} />
            <BodySemibold style={styles.backText}>Quay lại</BodySemibold>
          </TouchableOpacity>
          <Spacer size="xl" />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={greenTheme.primary} />
            <Spacer size="md" />
            <BodySmall>Đang tải chi tiết kế hoạch...</BodySmall>
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
            <Ionicons name="arrow-back" size={24} color={greenTheme.primary} />
            <BodySemibold style={styles.backText}>Quay lại</BodySemibold>
          </TouchableOpacity>
          <Spacer size="xl" />
          <View style={styles.centered}>
            <Body>Không tìm thấy kế hoạch</Body>
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
            <Ionicons name="arrow-back" size={24} color={greenTheme.primary} />
            <BodySemibold style={styles.backText}>Quay lại Kế hoạch</BodySemibold>
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
              <BodySmall style={styles.summaryLabel}>Tiến độ</BodySmall>
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
              <BodySmall style={styles.summaryLabel}>Công việc</BodySmall>
              <H4 style={styles.summaryValue}>
                {planDetail.completedTasks}/{planDetail.totalTasks}
              </H4>
              <BodySmall style={styles.summarySubtext}>đã hoàn thành</BodySmall>
            </Card>

            {/* <Card style={styles.summaryCard}>
              <BodySmall style={styles.summaryLabel}>Days</BodySmall>
              <H4 style={styles.summaryValue}>{planDetail.daysElapsed}</H4>
              <BodySmall style={styles.summarySubtext}>elapsed</BodySmall>
            </Card> */}

            {/* <Card style={styles.summaryCard}>
              <BodySmall style={styles.summaryLabel}>Cost</BodySmall>
              <BodySmall style={styles.summaryValueSmall}>
                {formatCurrency(planDetail.totalActualCost || planDetail.totalEstimatedCost)}
              </BodySmall>
            </Card> */}
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
                              Stage {stage.stageOrder} - {stage.status}
                            </BodySmall>
                          </View>
                        </View>
                        {/* <BodySmall style={styles.stageProgress}>
                          {stage.progressPercentage.toFixed(0)}%
                        </BodySmall> */}
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
                          <ProductionPlanTaskItem 
                            key={task.taskId} 
                            task={task} 
                            getStatusColor={getStatusColor}
                            formatDate={formatDate}
                            formatCurrency={formatCurrency}
                            onViewImage={(url) => setSelectedPhoto(url)}
                          />
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

      {/* Full Screen Image Modal */}
      <Modal
        visible={!!selectedPhoto}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.fullScreenImageContainer}>
          <TouchableOpacity
            style={styles.fullScreenImageBackground}
            activeOpacity={1}
            onPress={() => setSelectedPhoto(null)}
          >
            <TouchableOpacity
              style={styles.fullScreenImageClose}
              onPress={() => setSelectedPhoto(null)}
            >
              <Ionicons name="close" size={30} color={colors.white} />
            </TouchableOpacity>
            {selectedPhoto && (
              <Image
                source={{ uri: selectedPhoto }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Extracted Task Item Component to handle local state for logs
const ProductionPlanTaskItem = ({ task, getStatusColor, formatDate, formatCurrency, onViewImage }: any) => {
  const [expanded, setExpanded] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsLoaded, setLogsLoaded] = useState(false);

  const toggleExpand = async () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);

    if (newExpanded && !logsLoaded) {
      setLoadingLogs(true);
      try {
        const data = await getFarmLogsByProductionPlanTask({
          productionPlanTaskId: task.taskId,
          currentPage: 1,
          pageSize: 20
        });
        setLogs(data?.data || []);
        setLogsLoaded(true);
      } catch (error) {
        console.error("Failed to load logs", error);
      } finally {
        setLoadingLogs(false);
      }
    }
  };

  return (
    <View style={styles.taskItem}>
      <TouchableOpacity onPress={toggleExpand} style={styles.taskHeader}>
        <View style={styles.taskLeft}>
          <Ionicons
            name={task.status === 'Completed' ? 'checkmark-circle' : task.status === 'InProgress' ? 'sync-circle' : 'ellipse-outline'}
            size={20}
            color={getStatusColor(task.status)}
          />
          <View style={styles.taskInfo}>
            <BodySemibold style={styles.taskName}>{task.taskName}</BodySemibold>
            <BodySmall style={styles.taskType}>{task.taskType} • {formatDate(task.scheduledDate)}</BodySmall>
          </View>
        </View>
        <View style={styles.taskRight}>
          <Badge variant={task.status === 'Completed' ? 'success' : 'neutral'} size="sm">{task.status}</Badge>
          <Ionicons name={expanded ? 'chevron-down' : 'chevron-forward'} size={16} color={colors.textTertiary} style={{ marginLeft: spacing.xs }} />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.taskDetails}>
          <Spacer size="sm" />
          {task.description && (
            <>
              <BodySmall style={styles.label}>Mô tả</BodySmall>
              <Body>{task.description}</Body>
              <Spacer size="sm" />
            </>
          )}

          {task.materials && task.materials.length > 0 && (
            <>
              <BodySmall style={styles.label}>Vật tư</BodySmall>
              {task.materials.map((material: any, idx: number) => (
                <View key={idx} style={styles.materialItem}>
                  <Body style={styles.materialName}>{material.materialName}</Body>
                  <BodySmall style={styles.materialQuantity}>{material.quantityPerHa} {material.unit}/ha</BodySmall>
                </View>
              ))}
              <Spacer size="sm" />
            </>
          )}

          <View style={styles.taskFooter}>
            <BodySmall style={styles.taskCost}>Chi phí Ước tính: {formatCurrency(task.estimatedCost)}</BodySmall>
          </View>

          {/* Inline Farm Logs */}
          <Spacer size="md" />
          <BodySmall style={styles.label}>Nhật ký Nông trại</BodySmall>
          {loadingLogs ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : logs.length > 0 ? (
            logs.map((log) => (
              <View key={log.farmLogId} style={styles.inlineLogCard}>
                <View style={styles.farmLogHeader}>
                  <View>
                    <BodySemibold style={{fontSize: 13}}>{log.farmerName || 'Nông dân'}</BodySemibold>
                    {(log.soThua || log.soTo) && (
                      <BodySmall style={styles.farmLogPlot}>Thửa {log.soThua}, Tờ {log.soTo}</BodySmall>
                    )}
                  </View>
                  <BodySmall style={{color: colors.primary, fontWeight: '600'}}>{log.completionPercentage}%</BodySmall>
                </View>
                
                <Spacer size="xs" />
                <BodySmall style={{color: colors.textSecondary}}>{formatDate(log.loggedDate)}</BodySmall>
                {log.workDescription && <BodySmall style={styles.farmLogDescription}>{log.workDescription}</BodySmall>}
                
                {log.materialsUsed?.length > 0 && (
                  <View style={{marginTop: 4}}>
                    {log.materialsUsed.map((m: any, i: number) => (
                      <BodySmall key={i} style={{fontSize: 11, color: colors.textSecondary}}>
                        • {m.materialName}: {m.actualQuantityUsed}
                      </BodySmall>
                    ))}
                  </View>
                )}

                {log.photoUrls?.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop: 8}}>
                    {log.photoUrls.map((url: string, idx: number) => (
                      <TouchableOpacity key={idx} onPress={() => onViewImage(url)}>
                        <Image source={{ uri: url }} style={styles.logPhoto} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            ))
          ) : (
            <View style={{padding: 10, alignItems: 'center'}}>
              <BodySmall style={{color: colors.textTertiary}}>Chưa có nhật ký nào</BodySmall>
            </View>
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
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backText: {
    color: greenTheme.primary,
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
    backgroundColor: greenTheme.primaryLighter,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  progressFillSmall: {
    height: '100%',
    backgroundColor: greenTheme.primary,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: greenTheme.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: greenTheme.primary,
  },
  tabText: {
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: greenTheme.primary,
    fontWeight: '600',
  },
  tabContent: {
    padding: spacing.md,
  },
  stageCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
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
    backgroundColor: greenTheme.primaryLighter,
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
    backgroundColor: greenTheme.primaryLighter,
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
    color: greenTheme.primary,
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
    borderBottomColor: greenTheme.border,
  },
  economicsRowHighlight: {
    backgroundColor: greenTheme.primaryLighter,
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
    backgroundColor: greenTheme.success + '20',
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
    backgroundColor: greenTheme.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: greenTheme.border,
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
  inlineLogCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
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
  logPhoto: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
    backgroundColor: greenTheme.primaryLighter,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    color: colors.textSecondary,
  },
  fullScreenImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  fullScreenImageBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
  fullScreenImageClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
});
