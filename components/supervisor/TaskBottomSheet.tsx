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
  focusedPlotId: string | null;
  onToggle: () => void;
  onTabChange: (tab: 'tasks' | 'completed') => void;
  onTaskFocus: (task: PolygonTask) => void;
  onTaskStartDrawing: (task: PolygonTask) => void;
  onPlotFocus: (plot: PlotDTO) => void;
};

export const TaskBottomSheet: React.FC<TaskBottomSheetProps> = ({
  isExpanded,
  activeTab,
  tasks,
  completedPlots,
  focusedTaskId,
  selectedTaskId,
  focusedPlotId,
  onToggle,
  onTabChange,
  onTaskFocus,
  onTaskStartDrawing,
  onPlotFocus,
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
            <BodySemibold>Tasks: {tasks.length}</BodySemibold>
            <BodySmall color={colors.textSecondary}>Tap to expand</BodySmall>
          </View>
          <View style={styles.summaryRow}>
            <BodySemibold>Completed: {completedPlots.length}</BodySemibold>
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
                  Tasks ({tasks.length})
                </BodySmall>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
                onPress={() => onTabChange('completed')}
              >
                <BodySmall color={activeTab === 'completed' ? colors.white : colors.textPrimary}>
                  Completed ({completedPlots.length})
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
                      No drawing tasks available
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
                      No plots with polygon yet
                    </BodySmall>
                  </View>
                ) : (
                  completedPlots.map((plot) => (
                    <PlotCard
                      key={plot.plotId}
                      plot={plot}
                      isFocused={focusedPlotId === plot.plotId}
                      onFocus={onPlotFocus}
                    />
                  ))
                )}
              </>
            )}

            <Spacer size="lg" />

            {/* Instructions */}
            <Card variant="elevated" style={styles.instructionsCard}>
              <H4>Instructions</H4>
              <Spacer size="sm" />
              <BodySmall color={colors.textSecondary}>
                1. Select a task from the list
              </BodySmall>
              <BodySmall color={colors.textSecondary}>
                2. Tap on map to add polygon points
              </BodySmall>
              <BodySmall color={colors.textSecondary}>
                3. Add at least 3 points to form a polygon
              </BodySmall>
              <BodySmall color={colors.textSecondary}>
                4. Tap Save to complete the task
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

