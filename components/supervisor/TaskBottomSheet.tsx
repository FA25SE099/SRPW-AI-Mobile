/**
 * Task Bottom Sheet Component
 * Collapsible bottom sheet for tasks and completed plots
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { H4, BodySemibold, BodySmall, Body, Card, Spacer } from '../ui';
import { PolygonTask, PlotDTO } from '../../libs/supervisor';
import { TaskCard } from './TaskCard';
import { PlotCard } from './PlotCard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_MIN_HEIGHT = 100;
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.75;

type TaskBottomSheetProps = {
  isExpanded: boolean;
  activeTab: 'tasks' | 'completed';
  tasks: PolygonTask[];
  completedPlots: PlotDTO[];
  focusedTaskId: string | null;
  selectedTaskId: string | null;
  editingPlotId: string | null;
  focusedPlotId: string | null;
  onToggle: () => void;
  onTabChange: (tab: 'tasks' | 'completed') => void;
  onTaskFocus: (task: PolygonTask) => void;
  onTaskStartDrawing: (task: PolygonTask) => void;
  onPlotFocus: (plot: PlotDTO) => void;
  onPlotEdit: (plot: PlotDTO) => void;
};

export const TaskBottomSheet: React.FC<TaskBottomSheetProps> = ({
  isExpanded,
  activeTab,
  tasks,
  completedPlots,
  focusedTaskId,
  selectedTaskId,
  editingPlotId,
  focusedPlotId,
  onToggle,
  onTabChange,
  onTaskFocus,
  onTaskStartDrawing,
  onPlotFocus,
  onPlotEdit,
}) => {
  return (
    <View
      style={[
        styles.bottomSheet,
        {
          height: isExpanded ? BOTTOM_SHEET_MAX_HEIGHT : BOTTOM_SHEET_MIN_HEIGHT,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onToggle}
        style={styles.handleContainer}
      >
        <View style={styles.handle} />
      </TouchableOpacity>

      {!isExpanded ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onToggle}
          style={styles.summary}
        >
          <View style={styles.summaryRow}>
            <BodySemibold>Công việc: {tasks.length}</BodySemibold>
            <BodySmall color={colors.textSecondary}>Nhấn để mở rộng</BodySmall>
          </View>
          <View style={styles.summaryRow}>
            <BodySemibold>Đã hoàn thành: {completedPlots.length}</BodySemibold>
            <Body>↑</Body>
          </View>
        </TouchableOpacity>
      ) : (
        <>
          <View style={styles.header}>
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'tasks' && styles.tabActive]}
                onPress={() => onTabChange('tasks')}
              >
                <BodySmall color={activeTab === 'tasks' ? colors.white : colors.textPrimary}>
                  Công việc ({tasks.length})
                </BodySmall>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
                onPress={() => onTabChange('completed')}
              >
                <BodySmall color={activeTab === 'completed' ? colors.white : colors.textPrimary}>
                  Đã hoàn thành ({completedPlots.length})
                </BodySmall>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {activeTab === 'tasks' && (
              <>
                {tasks.length === 0 ? (
                  <View style={styles.emptyState}>
                    <BodySmall color={colors.textSecondary} style={styles.emptyText}>
                      Không có công việc vẽ nào
                    </BodySmall>
                  </View>
                ) : (
                  tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isFocused={focusedTaskId === task.id}
                      isSelected={selectedTaskId === task.id}
                      onFocus={onTaskFocus}
                      onStartDrawing={onTaskStartDrawing}
                    />
                  ))
                )}
              </>
            )}

            {activeTab === 'completed' && (
              <>
                {completedPlots.length === 0 ? (
                  <View style={styles.emptyState}>
                    <BodySmall color={colors.textSecondary} style={styles.emptyText}>
                      Chưa có thửa nào có đa giác
                    </BodySmall>
                  </View>
                ) : (
                  completedPlots.map((plot) => (
                    <PlotCard
                      key={plot.plotId}
                      plot={plot}
                      isFocused={focusedPlotId === plot.plotId}
                      isEditing={editingPlotId === plot.plotId}
                      onFocus={onPlotFocus}
                      onEdit={onPlotEdit}
                    />
                  ))
                )}
              </>
            )}

            <Spacer size="lg" />

            {/* Instructions */}
            <Card variant="elevated" style={styles.instructionsCard}>
              <H4>Hướng dẫn</H4>
              <Spacer size="sm" />
              <BodySmall color={colors.textSecondary}>
                1. Chọn một công việc từ danh sách
              </BodySmall>
              <BodySmall color={colors.textSecondary}>
                2. Nhấn vào bản đồ để thêm điểm đa giác
              </BodySmall>
              <BodySmall color={colors.textSecondary}>
                3. Thêm ít nhất 3 điểm để tạo đa giác
              </BodySmall>
              <BodySmall color={colors.textSecondary}>
                4. Nhấn Lưu để hoàn thành công việc
              </BodySmall>
            </Card>
          </ScrollView>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    ...shadows.lg,
    zIndex: 999,
  },
  handleContainer: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  summary: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  instructionsCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
});

