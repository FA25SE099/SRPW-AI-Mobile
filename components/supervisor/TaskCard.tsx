/**
 * Task Card Component
 * Displays a polygon drawing task
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import dayjs from 'dayjs';
import { colors, spacing, borderRadius } from '../../theme';
import { BodySemibold, BodySmall, Button } from '../ui';
import { PolygonTask, getPriorityText, getPriorityColor } from '../../libs/supervisor';

type TaskCardProps = {
  task: PolygonTask;
  isFocused: boolean;
  isSelected: boolean;
  onFocus: (task: PolygonTask) => void;
  onStartDrawing: (task: PolygonTask) => void;
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isFocused,
  isSelected,
  onFocus,
  onStartDrawing,
}) => {
  // Debug logging
  console.log('TaskCard render:', {
    taskId: task.id,
    isFocused,
    isSelected,
    shouldShowButton: !isSelected,
  });

  return (
    <View
      style={[
        styles.card,
        isFocused && styles.cardFocused,
        isSelected && styles.cardSelected,
      ]}
    >
      <TouchableOpacity
        onPress={() => {
          console.log('Task card pressed:', task.id);
          onFocus(task);
        }}
        activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.info}>
          <BodySemibold>
            Plot {task.soThua}/{task.soTo}
          </BodySemibold>
          <BodySmall color={colors.textSecondary}>
            {task.farmerName || 'Unknown Farmer'}
          </BodySmall>
        </View>
        <View
          style={[
            styles.priorityBadge,
            {
              borderColor: getPriorityColor(task.priority),
              borderWidth: 1,
              backgroundColor: 'transparent',
            },
          ]}
        >
          <BodySmall style={{ color: getPriorityColor(task.priority) }}>
            {getPriorityText(task.priority)}
          </BodySmall>
        </View>
      </View>

      <BodySmall color={colors.textSecondary}>
        {dayjs(task.assignedAt).format('MMM DD, YYYY')}
      </BodySmall>
      </TouchableOpacity>

      {!isSelected ? (
        <Button
          size="sm"
          onPress={() => {
            console.log('Start Drawing button pressed for task:', task.id);
            onStartDrawing(task);
          }}
          style={styles.startButton}
        >
          <BodySmall color={colors.white}>Bắt đầu Vẽ</BodySmall>
        </Button>
      ) : (
        <View style={styles.selectedIndicator}>
          <BodySmall color={colors.primary}>→ Đang vẽ...</BodySmall>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  cardFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLighter + '20',
  },
  cardSelected: {
    borderColor: colors.success,
    backgroundColor: colors.success + '20',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  info: {
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  startButton: {
    marginTop: spacing.sm,
  },
  selectedIndicator: {
    marginTop: spacing.xs,
  },
});

