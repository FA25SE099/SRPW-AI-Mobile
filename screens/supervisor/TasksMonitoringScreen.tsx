/**
 * Tasks Monitoring Screen
 * Monitor all tasks from supervised farmers
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  Badge,
  Spacer,
  Button,
} from '../../components/ui';
import { useUser } from '../../libs/auth';

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

// Mock data - will be replaced with API calls
const mockTasks = [
  {
    id: '1',
    taskName: 'Fertilizing',
    farmerName: 'Nguyen Van A',
    plotName: 'Thửa 16, Tờ 58',
    status: 'pending-approval',
    priority: 'high',
    dueDate: '2024-01-20',
    submittedDate: '2024-01-15',
  },
  {
    id: '2',
    taskName: 'Spraying',
    farmerName: 'Tran Thi B',
    plotName: 'Thửa 11, Tờ 12',
    status: 'in-progress',
    priority: 'normal',
    dueDate: '2024-01-18',
    submittedDate: null,
  },
  {
    id: '3',
    taskName: 'Harvesting',
    farmerName: 'Le Van C',
    plotName: 'Thửa 8, Tờ 9',
    status: 'completed',
    priority: 'high',
    dueDate: '2024-01-16',
    submittedDate: '2024-01-16',
  },
];

export const TasksMonitoringScreen = () => {
  const router = useRouter();
  const { data: user } = useUser();
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending-approval' | 'in-progress' | 'completed'
  >('all');

  // TODO: Replace with actual API call
  // const { data: tasks, isLoading, isError } = useQuery({
  //   queryKey: ['supervisor-tasks', user?.id, statusFilter],
  //   queryFn: () => getSupervisedTasks({ supervisorId: user?.id, status: statusFilter }),
  // });

  const filteredTasks = mockTasks.filter((task) => {
    if (statusFilter === 'all') return true;
    return task.status === statusFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending-approval':
        return '#FF9500';
      case 'in-progress':
        return greenTheme.primary;
      case 'completed':
        return greenTheme.success;
      default:
        return colors.textSecondary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return colors.error;
      case 'normal':
        return '#FF9500';
      case 'low':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const handleApprove = (taskId: string) => {
    // TODO: Implement approval API call
    console.log('Approve task:', taskId);
  };

  const handleReject = (taskId: string) => {
    // TODO: Implement rejection API call
    console.log('Reject task:', taskId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Container padding="lg">
        {/* Header */}
        <View style={styles.header}>
          <H3>Giám sát Công việc</H3>
          <BodySmall color={colors.textSecondary}>
            {filteredTasks.length} công việc
          </BodySmall>
        </View>

        <Spacer size="lg" />

        {/* Status Filters */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => setStatusFilter('all')}
            style={[
              styles.filterChip,
              statusFilter === 'all' && styles.filterChipActive,
            ]}
          >
            <BodySmall color={statusFilter === 'all' ? colors.white : colors.textDark}>
              Tất cả
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setStatusFilter('pending-approval')}
            style={[
              styles.filterChip,
              statusFilter === 'pending-approval' && styles.filterChipActive,
            ]}
          >
            <BodySmall
              color={statusFilter === 'pending-approval' ? colors.white : colors.textDark}
            >
              Chờ duyệt
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setStatusFilter('in-progress')}
            style={[
              styles.filterChip,
              statusFilter === 'in-progress' && styles.filterChipActive,
            ]}
          >
            <BodySmall
              color={statusFilter === 'in-progress' ? colors.white : colors.textDark}
            >
              Đang thực hiện
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setStatusFilter('completed')}
            style={[
              styles.filterChip,
              statusFilter === 'completed' && styles.filterChipActive,
            ]}
          >
            <BodySmall
              color={statusFilter === 'completed' ? colors.white : colors.textDark}
            >
              Đã hoàn thành
            </BodySmall>
          </TouchableOpacity>
        </View>

        <Spacer size="lg" />

        {/* Tasks List */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {filteredTasks.map((task) => (
            <Card key={task.id} variant="elevated" style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <View style={styles.taskInfo}>
                  <View style={styles.taskTitleRow}>
                    <BodySemibold>{task.taskName}</BodySemibold>
                    <Badge
                      variant="outline"
                      style={[
                        styles.priorityBadge,
                        { borderColor: getPriorityColor(task.priority) },
                      ]}
                    >
                      <BodySmall style={{ color: getPriorityColor(task.priority) }}>
                        {task.priority}
                      </BodySmall>
                    </Badge>
                  </View>
                  <BodySmall color={colors.textSecondary}>
                    {task.farmerName} • {task.plotName}
                  </BodySmall>
                </View>
                <Badge
                  variant="outline"
                  style={[styles.statusBadge, { borderColor: getStatusColor(task.status) }]}
                >
                  <BodySmall style={{ color: getStatusColor(task.status) }}>
                    {task.status === 'pending-approval'
                      ? 'Pending'
                      : task.status === 'in-progress'
                        ? 'In Progress'
                        : 'Completed'}
                  </BodySmall>
                </Badge>
              </View>

              <Spacer size="md" />

              <View style={styles.taskDetails}>
                <View style={styles.taskDetailItem}>
                  <BodySmall color={colors.textSecondary}>Ngày đến hạn:</BodySmall>
                  <BodySmall>{dayjs(task.dueDate).format('MMM DD, YYYY')}</BodySmall>
                </View>
                {task.submittedDate && (
                  <View style={styles.taskDetailItem}>
                    <BodySmall color={colors.textSecondary}>Đã nộp:</BodySmall>
                    <BodySmall>{dayjs(task.submittedDate).format('MMM DD, YYYY')}</BodySmall>
                  </View>
                )}
              </View>

              {task.status === 'pending-approval' && (
                <>
                  <Spacer size="md" />
                  <View style={styles.actionButtons}>
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => handleReject(task.id)}
                      style={[styles.actionButton, { borderColor: colors.error }]}
                    >
                      <BodySmall style={{ color: colors.error }}>Từ chối</BodySmall>
                    </Button>
                    <Button
                      size="sm"
                      onPress={() => handleApprove(task.id)}
                      style={styles.actionButton}
                    >
                      <BodySmall color={colors.white}>Duyệt</BodySmall>
                    </Button>
                  </View>
                </>
              )}
            </Card>
          ))}
        </ScrollView>
      </Container>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: greenTheme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: greenTheme.cardBackground,
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  filterChipActive: {
    backgroundColor: greenTheme.primary,
    borderColor: greenTheme.primary,
  },
  taskCard: {
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
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  taskDetails: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  taskDetailItem: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  actionButton: {
    flex: 1,
  },
});

