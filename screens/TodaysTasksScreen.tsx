/**
 * Today's Tasks Screen
 * Displays tasks for selected date with filters
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { colors, spacing, borderRadius, shadows } from '../theme';
import {
  Container,
  H3,
  Body,
  BodySmall,
  BodySemibold,
  Card,
  Spacer,
} from '../components/ui';
import { Task, TaskStatus } from '../types/api';

// Mock data
const mockTasks: Task[] = [
  {
    id: '1',
    createdAt: Date.now(),
    title: 'Market Research',
    projectName: 'Grocery shopping app design',
    projectId: '1',
    status: 'Done',
    scheduledTime: '10:00 AM',
    scheduledDate: dayjs().format('YYYY-MM-DD'),
    category: 'Office Project',
  },
  {
    id: '2',
    createdAt: Date.now(),
    title: 'Competitive Analysis',
    projectName: 'Grocery shopping app design',
    projectId: '1',
    status: 'In Progress',
    scheduledTime: '12:00 PM',
    scheduledDate: dayjs().format('YYYY-MM-DD'),
    category: 'Office Project',
  },
  {
    id: '3',
    createdAt: Date.now(),
    title: 'Create Low-fidelity Wireframe',
    projectName: 'Uber Eats redesign challenge',
    projectId: '2',
    status: 'To-do',
    scheduledTime: '07:00 PM',
    scheduledDate: dayjs().format('YYYY-MM-DD'),
    category: 'Personal Project',
  },
  {
    id: '4',
    createdAt: Date.now(),
    title: 'How to pitch a Design Sprint',
    projectName: 'About design sprint',
    projectId: '3',
    status: 'To-do',
    scheduledTime: '09:00 PM',
    scheduledDate: dayjs().format('YYYY-MM-DD'),
    category: 'Daily Study',
  },
];

const taskGroups: { [key: string]: { icon: string; color: string } } = {
  'Office Project': { icon: '💼', color: '#FF6B9D' },
  'Personal Project': { icon: '👤', color: colors.primary },
  'Daily Study': { icon: '📚', color: '#FF9500' },
};

const getStatusBadgeVariant = (status: TaskStatus): 'primary' | 'success' | 'warning' | 'info' => {
  switch (status) {
    case 'Done':
    case 'Completed':
      return 'success';
    case 'In Progress':
      return 'warning';
    case 'To-do':
      return 'info';
    default:
      return 'primary';
  }
};

const getStatusBadgeColor = (status: TaskStatus): string => {
  switch (status) {
    case 'Done':
    case 'Completed':
      return colors.primaryLighter;
    case 'In Progress':
      return '#FFF3E0';
    case 'To-do':
      return colors.infoLight;
    default:
      return colors.primaryLighter;
  }
};

export const TodaysTasksScreen = () => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedFilter, setSelectedFilter] = useState<TaskStatus | 'All'>('All');

  // Generate dates for the date selector (7 days)
  const dates = Array.from({ length: 7 }, (_, i) => dayjs().add(i - 3, 'day'));

  const filters: (TaskStatus | 'All')[] = ['All', 'To-do', 'In Progress', 'Completed'];

  const filteredTasks = mockTasks.filter((task) => {
    const matchesDate = dayjs(task.scheduledDate).isSame(selectedDate, 'day');
    const matchesFilter = selectedFilter === 'All' || task.status === selectedFilter;
    return matchesDate && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.container}>
      <Container padding="lg">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Body>←</Body>
          </TouchableOpacity>
          <H3 style={styles.headerTitle}>Today's Tasks</H3>
          <TouchableOpacity style={styles.notificationButton}>
            <View style={styles.notificationDot} />
            <Body>🔔</Body>
          </TouchableOpacity>
        </View>

        <Spacer size="lg" />

        {/* Date Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateSelector}
        >
          {dates.map((date, index) => {
            const isSelected = date.isSame(selectedDate, 'day');
            return (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedDate(date)}
                style={[
                  styles.dateCard,
                  isSelected && styles.dateCardSelected,
                ]}
              >
                <BodySmall
                  color={isSelected ? colors.white : colors.textPrimary}
                  style={styles.dateDay}
                >
                  {date.format('MMM D')}
                </BodySmall>
                <BodySmall
                  color={isSelected ? colors.white : colors.textSecondary}
                  style={styles.dateWeekday}
                >
                  {date.format('ddd')}
                </BodySmall>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Spacer size="lg" />

        {/* Filter Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {filters.map((filter) => {
            const isSelected = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setSelectedFilter(filter)}
                style={[
                  styles.filterButton,
                  isSelected && styles.filterButtonSelected,
                ]}
              >
                <BodySmall
                  color={isSelected ? colors.white : colors.textPrimary}
                  style={styles.filterText}
                >
                  {filter}
                </BodySmall>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Spacer size="xl" />

        {/* Task List */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {filteredTasks.map((task) => {
            const groupInfo = taskGroups[task.category || ''] || {
              icon: '📋',
              color: colors.primary,
            };

            return (
              <TouchableOpacity key={task.id} style={styles.taskCardWrapper}>
                <Card variant="elevated" style={styles.taskCard}>
                  <View style={styles.taskCardContent}>
                    <View style={styles.taskCardLeft}>
                      <View
                        style={[
                          styles.taskIcon,
                          { backgroundColor: groupInfo.color + '20' },
                        ]}
                      >
                        <Body>{groupInfo.icon}</Body>
                      </View>
                      <View style={styles.taskInfo}>
                        <BodySmall color={colors.textSecondary}>
                          {task.projectName}
                        </BodySmall>
                        <Spacer size="xs" />
                        <BodySemibold>{task.title}</BodySemibold>
                        <Spacer size="xs" />
                        <View style={styles.taskTime}>
                          <BodySmall color={colors.textSecondary}>🕐</BodySmall>
                          <BodySmall color={colors.textSecondary} style={styles.timeText}>
                            {task.scheduledTime}
                          </BodySmall>
                        </View>
                      </View>
                    </View>
                    <View style={styles.taskCardRight}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusBadgeColor(task.status) },
                        ]}
                      >
                        <BodySmall
                          style={[
                            styles.statusBadgeText,
                            {
                              color:
                                task.status === 'Done' || task.status === 'Completed'
                                  ? colors.primary
                                  : task.status === 'In Progress'
                                  ? '#FF9500'
                                  : colors.info,
                            },
                          ]}
                        >
                          {task.status}
                        </BodySmall>
                      </View>
                    </View>
                  </View>
                </Card>
                <Spacer size="md" />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Container>
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
  notificationButton: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  dateSelector: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  dateCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    minWidth: 80,
    alignItems: 'center',
    ...shadows.sm,
  },
  dateCardSelected: {
    backgroundColor: colors.primary,
  },
  dateDay: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateWeekday: {
    fontSize: 12,
    marginTop: 2,
  },
  filterContainer: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  filterButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLighter,
  },
  filterButtonSelected: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontWeight: '600',
  },
  taskCardWrapper: {
    marginBottom: spacing.sm,
  },
  taskCard: {
    padding: spacing.md,
  },
  taskCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskCardLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: spacing.md,
  },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  timeText: {
    marginLeft: spacing.xs,
  },
  taskCardRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

