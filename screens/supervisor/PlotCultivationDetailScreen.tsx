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
  Modal,
  Image,
  Alert,
  TextInput,
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
  getCultivationVersions,
  getFarmLogsByCultivationTask,
  createLateFarmerRecord,
  type CultivationPlanStage,
  type CultivationPlanTask,
} from '@/libs/supervisor';

export const PlotCultivationDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    plotId: string;
    groupId: string;
    plotName?: string;
  }>();

  // Versioning State
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [showVersionPicker, setShowVersionPicker] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [showImageViewer, setShowImageViewer] = useState(false);

  const [expandedStages, setExpandedStages] = useState<{ [key: string]: boolean }>({});
  const [expandedTasks, setExpandedTasks] = useState<{ [key: string]: boolean }>({});

  const { data: cultivationPlan, isLoading, error, refetch } = useQuery({
    queryKey: ['cultivation-plan', params.plotId, params.groupId, selectedVersionId],
    queryFn: async () => {
      const data = await getCultivationPlanByGroupPlot({
        plotId: params.plotId!,
        groupId: params.groupId!,
        versionId: selectedVersionId,
      });
      
      // Fetch versions if we have a plotCultivationId and haven't fetched them yet
      if (data?.plotCultivationId && versions.length === 0) {
        try {
          const vData = await getCultivationVersions(data.plotCultivationId);
          setVersions(vData.sort((a: any, b: any) => b.versionOrder - a.versionOrder));
        } catch (e) {
          console.warn('Failed to fetch versions', e);
        }
      }
      
      return data;
    },
    enabled: !!params.plotId && !!params.groupId,
    staleTime: 0,
    refetchOnMount: true,
  });

  const getStatusColor = (status: string): keyof typeof colors => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'InProgress':
        return 'primary';
      case 'Pending':
        return 'textTertiary';
      default:
        return 'textSecondary';
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

  const handleViewImages = (images: string[]) => {
    setViewerImages(images);
    setShowImageViewer(true);
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
          <Spacer size="md" />
          <H3>{params.plotName || 'Plot Cultivation'}</H3>
          <Spacer size="xl" />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.dark} />
            <BodySemibold style={styles.backText}>Back</BodySemibold>
          </TouchableOpacity>
          <Spacer size="md" />
          <H3>{params.plotName || 'Plot Cultivation'}</H3>
          <Spacer size="xl" />
          <Card style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
            <Spacer size="md" />
            <Body style={styles.errorText}>Failed to load cultivation plan</Body>
            <Spacer size="sm" />
            <TouchableOpacity onPress={() => refetch()}>
              <BodySemibold style={{ color: colors.primary }}>Retry</BodySemibold>
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.dark} />
            <BodySemibold style={styles.backText}>Back</BodySemibold>
          </TouchableOpacity>
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
            <Ionicons name="arrow-back" size={24} color={colors.dark} />
            <BodySemibold style={styles.backText}>Back</BodySemibold>
          </TouchableOpacity>
          <Spacer size="sm" />

          {/* Header */}
          <H3>{cultivationPlan.plotName || params.plotName || 'Plot Cultivation'}</H3>
          
          {/* Version Selector */}
          <TouchableOpacity 
            style={styles.versionSelector}
            onPress={() => setShowVersionPicker(true)}
          >
            <Ionicons name="time-outline" size={16} color={colors.primary} />
            <BodySmall style={{ color: colors.primary }}>
              {selectedVersionId 
                ? `Version: ${versions.find(v => v.id === selectedVersionId)?.versionName || 'Unknown'}`
                : 'Latest Version (Active)'}
            </BodySmall>
            <Ionicons name="chevron-down" size={16} color={colors.primary} />
          </TouchableOpacity>
          
          {selectedVersionId && (
            <BodySmall style={styles.versionWarning}>Viewing historical version</BodySmall>
          )}

          <Spacer size="lg" />

          {/* Overview Cards */}
          <View style={styles.overviewGrid}>
            <Card style={styles.overviewCard}>
              <Ionicons name="map-outline" size={32} color={colors.primary} />
              <Spacer size="xs" />
              <BodySmall style={styles.overviewLabel}>Area</BodySmall>
              <BodySemibold>{cultivationPlan.plotArea.toFixed(2)} ha</BodySemibold>
            </Card>

            <Card style={styles.overviewCard}>
              <Ionicons name="leaf-outline" size={32} color={colors.success} />
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
              <Ionicons name="trending-up-outline" size={32} color={colors.info} />
              <Spacer size="xs" />
              <BodySmall style={styles.overviewLabel}>Status</BodySmall>
              <Badge variant="primary" style={{ alignSelf: 'center' }}>
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
                <BodySemibold style={[styles.progressValue, { color: colors.success }]}>
                  {cultivationPlan.progress.completedTasks}
                </BodySemibold>
                <BodySmall style={styles.progressLabel}>Completed</BodySmall>
              </View>
              <View style={styles.progressItem}>
                <BodySemibold style={[styles.progressValue, { color: colors.primary }]}>
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
          <H4>Cultivation Stages & Tasks</H4>
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
                  <Badge variant="primary">{stage.tasks.length} tasks</Badge>
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
                        onViewImages={handleViewImages}
                        selectedVersionId={selectedVersionId}
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

      {/* Version Picker Modal */}
      <Modal
        visible={showVersionPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowVersionPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowVersionPicker(false)}
        >
          <View style={styles.modalContent}>
            <H4 style={styles.modalTitle}>Select Plan Version</H4>
            <TouchableOpacity 
              style={styles.versionItem}
              onPress={() => { setSelectedVersionId(null); setShowVersionPicker(false); }}
            >
              <Body>Latest Version</Body>
              {!selectedVersionId && <Ionicons name="checkmark" size={20} color={colors.primary} />}
            </TouchableOpacity>
            {versions.map((v) => (
              <TouchableOpacity key={v.id} style={styles.versionItem} onPress={() => { setSelectedVersionId(v.id); setShowVersionPicker(false); }}>
                <Body>v{v.versionName} {v.isActive ? '(Active)' : ''}</Body>
                {selectedVersionId === v.id && <Ionicons name="checkmark" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        visible={showImageViewer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageViewer(false)}
      >
        <View style={styles.fullScreenImageContainer}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => setShowImageViewer(false)}
          >
            <Ionicons name="close" size={30} color={colors.white} />
          </TouchableOpacity>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {viewerImages.map((url, index) => (
              <View key={index} style={{ width: 400, justifyContent: 'center', alignItems: 'center' }}>
                <Image source={{ uri: url }} style={styles.fullScreenImage} resizeMode="contain" />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

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
  onViewImages,
  selectedVersionId,
}: {
  task: CultivationPlanTask;
  plotCultivationId: string;
  isExpanded: boolean;
  onToggle: () => void;
  getStatusColor: (status: string) => keyof typeof colors;
  getTaskIcon: (taskType: string) => any;
  formatDate: (date?: string) => string;
  onViewImages: (urls: string[]) => void;
  selectedVersionId: string | null;
}) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsLoaded, setLogsLoaded] = useState(false);
  const [creatingLateRecord, setCreatingLateRecord] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [lateNotes, setLateNotes] = useState('');

  const handleExpand = async () => {
    onToggle();
    if (!isExpanded && !logsLoaded) {
      setLoadingLogs(true);
      try {
        const data = await getFarmLogsByCultivationTask({ 
          cultivationTaskId: task.taskId,
          currentPage: 1,
          pageSize: 10
        });
        setLogs(data?.data || []);
        setLogsLoaded(true);
      } catch (e) { console.error(e); }
      finally { setLoadingLogs(false); }
    }
  };

  const handleCreateLateRecord = () => {
    setLateNotes(`Late farmer record for task: ${task.taskName}`);
    setShowNotesModal(true);
  };

  const handleSubmitLateRecord = async () => {
    setShowNotesModal(false);
    setCreatingLateRecord(true);
    try {
      const result = await createLateFarmerRecord({
        cultivationTaskId: task.taskId,
        notes: lateNotes || `Late farmer record for task: ${task.taskName}`,
      });
      
      // Check for success based on response structure or HTTP success
      if (result && (result.succeeded === true || result.succeeded !== false)) {
        Alert.alert('Success', result.message || 'Late farmer record created successfully');
      } else {
        Alert.alert('Error', result.message || 'Failed to create late farmer record');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to create late farmer record');
    } finally {
      setCreatingLateRecord(false);
    }
  };

  return (
    <View style={styles.taskContainer}>
      <TouchableOpacity onPress={handleExpand} style={styles.taskHeader}>
        <View style={styles.taskHeaderLeft}>
          <Ionicons
            name={isExpanded ? 'chevron-down' : 'chevron-forward'}
            size={18}
            color={colors.textSecondary}
          />
          <Ionicons name={getTaskIcon(task.taskType)} size={18} color={colors.primary} />
          <Body style={styles.taskName}>{task.taskName}</Body>
        </View>
        <Badge variant="primary" style={{ backgroundColor: colors[getStatusColor(task.status)] }}>
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

          {/* Farm Logs Section */}
          <Spacer size="sm" />
          <View style={styles.logsSection}>
            <BodySmall style={styles.label}>Farm Logs</BodySmall>
            {loadingLogs ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : logs.length > 0 ? (
              logs.map((log) => (
                <View key={log.farmLogId} style={styles.farmLogItem}>
                  <View style={styles.farmLogHeader}>
                    <BodySmall style={{fontWeight: '600'}}>{formatDate(log.loggedDate)}</BodySmall>
                    <BodySmall style={{color: colors.primary}}>{log.completionPercentage}%</BodySmall>
                  </View>
                  {(log.soThua || log.soTo) && (
                    <BodySmall style={styles.logPlotName}>Thửa {log.soThua}, Tờ {log.soTo}</BodySmall>
                  )}
                  <BodySmall style={styles.logDesc}>{log.workDescription}</BodySmall>
                  {log.materialsUsed?.map((m: any, idx: number) => (
                    <BodySmall key={idx} style={styles.logMaterial}>
                      • {m.materialName}: {m.actualQuantityUsed}
                    </BodySmall>
                  ))}
                  {log.photoUrls?.length > 0 && (
                    <TouchableOpacity 
                      style={styles.viewPhotosBtn}
                      onPress={() => onViewImages(log.photoUrls)}
                    >
                      <Ionicons name="images-outline" size={14} color={colors.primary} />
                      <BodySmall style={{color: colors.primary}}>View {log.photoUrls.length} Photos</BodySmall>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <BodySmall style={{color: colors.textTertiary, fontStyle: 'italic'}}>
                No logs recorded yet.
              </BodySmall>
            )}
          </View>

          {/* Report Late Button - Only shown for latest version */}
          {selectedVersionId === null && (
            <>
              <Spacer size="sm" />
              <TouchableOpacity
                style={[
                  styles.reportLateButton,
                  creatingLateRecord && styles.reportLateButtonDisabled,
                ]}
                onPress={handleCreateLateRecord}
                disabled={creatingLateRecord}
              >
                {creatingLateRecord ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="alert-circle-outline" size={18} color={colors.white} />
                    <BodySmall style={styles.reportLateButtonText}>Report Late Farmer</BodySmall>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Notes Input Modal */}
      <Modal
        visible={showNotesModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNotesModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowNotesModal(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.notesModalContent}>
              <H4 style={styles.modalTitle}>Report Late Farmer</H4>
              <BodySmall style={{ marginBottom: spacing.sm, color: colors.textSecondary }}>
                Enter notes for this lateness record:
              </BodySmall>
              <TextInput
                style={styles.notesInput}
                value={lateNotes}
                onChangeText={setLateNotes}
                placeholder="Enter notes..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowNotesModal(false)}
                >
                  <Body style={{ color: colors.textPrimary }}>Cancel</Body>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleSubmitLateRecord}
                >
                  <Body style={{ color: colors.white }}>Submit</Body>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
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
    color: colors.dark,
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
    backgroundColor: colors.backgroundSecondary,
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
    backgroundColor: colors.backgroundSecondary,
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
  versionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  versionWarning: {
    color: colors.warning,
    marginTop: 4,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  modalTitle: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  versionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logsSection: {
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  logDesc: {
    color: colors.textPrimary,
    marginBottom: 2,
  },
  logPlotName: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  logMaterial: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  viewPhotosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  fullScreenImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: 350,
    height: 500,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  reportLateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warning,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  reportLateButtonDisabled: {
    opacity: 0.6,
  },
  reportLateButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  notesModalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: 14,
    minHeight: 100,
    marginBottom: spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.backgroundSecondary,
  },
  submitButton: {
    backgroundColor: colors.warning,
  },
});
