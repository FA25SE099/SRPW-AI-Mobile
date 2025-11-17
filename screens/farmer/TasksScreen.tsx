/**
 * Tasks Screen
 * View and confirm tasks from planning
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
import { colors, spacing, borderRadius, shadows } from '../../theme';
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
} from '../../components/ui';
import { FarmerTask } from '../../types/api';

// Mock data
const mockTasks: FarmerTask[] = [
  {
    id: '1',
    createdAt: Date.now(),
    title: 'Apply Fertilizer - Field A',
    description: 'Apply NPK 20-20-20 at 50kg/ha',
    taskType: 'fertilizing',
    fieldId: '1',
    fieldName: 'Field A',
    scheduledDate: '2024-01-20',
    scheduledTime: '08:00',
    status: 'pending',
    planId: '1',
  },
  {
    id: '2',
    createdAt: Date.now(),
    title: 'Spray Pesticide - Field B',
    description: 'Apply Imidacloprid for brown planthopper control',
    taskType: 'spraying',
    fieldId: '2',
    fieldName: 'Field B',
    scheduledDate: '2024-01-19',
    scheduledTime: '06:00',
    status: 'in-progress',
    planId: '1',
  },
  {
    id: '3',
    createdAt: Date.now(),
    title: 'Harvest - Field C',
    description: 'Begin harvesting rice crop',
    taskType: 'harvesting',
    fieldId: '3',
    fieldName: 'Field C',
    scheduledDate: '2024-01-25',
    scheduledTime: '07:00',
    status: 'pending',
    planId: '2',
  },
];

export const FarmerTasksScreen = () => {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const getTaskIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      spraying: '💨',
      fertilizing: '💧',
      harvesting: '🌾',
      irrigation: '🚿',
      other: '📋',
    };
    return icons[type] || '📋';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'in-progress':
        return '#FF9500';
      case 'pending':
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  const filteredTasks =
    selectedFilter === 'all'
      ? mockTasks
      : mockTasks.filter((t) => t.status === selectedFilter);

  const handleConfirmTask = (taskId: string) => {
    // TODO: Implement task confirmation with photo upload
    router.push(`/farmer/tasks/${taskId}/confirm` as any);
  };

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

        {/* Filter Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity
            onPress={() => setSelectedFilter('all')}
            style={[
              styles.filterButton,
              selectedFilter === 'all' && styles.filterButtonActive,
            ]}
          >
            <BodySmall
              color={selectedFilter === 'all' ? colors.white : colors.textPrimary}
            >
              All
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedFilter('pending')}
            style={[
              styles.filterButton,
              selectedFilter === 'pending' && styles.filterButtonActive,
            ]}
          >
            <BodySmall
              color={selectedFilter === 'pending' ? colors.white : colors.textPrimary}
            >
              Pending
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedFilter('in-progress')}
            style={[
              styles.filterButton,
              selectedFilter === 'in-progress' && styles.filterButtonActive,
            ]}
          >
            <BodySmall
              color={selectedFilter === 'in-progress' ? colors.white : colors.textPrimary}
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
              color={selectedFilter === 'completed' ? colors.white : colors.textPrimary}
            >
              Completed
            </BodySmall>
          </TouchableOpacity>
        </ScrollView>

        <Spacer size="xl" />

        {/* Tasks List */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {filteredTasks.map((task) => (
            <TouchableOpacity key={task.id}>
              <Card variant="elevated" style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <View style={styles.taskIcon}>
                    <Body>{getTaskIcon(task.taskType)}</Body>
                  </View>
                  <View style={styles.taskHeaderInfo}>
                    <BodySemibold style={styles.taskTitle}>{task.title}</BodySemibold>
                    <BodySmall color={colors.textSecondary}>
                      📍 {task.fieldName}
                    </BodySmall>
                  </View>
                  <Badge
                    variant="primary"
                    size="sm"
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(task.status) + '20' },
                    ]}
                  >
                    <BodySmall
                      style={{ color: getStatusColor(task.status), fontSize: 10 }}
                    >
                      {task.status.toUpperCase().replace('-', ' ')}
                    </BodySmall>
                  </Badge>
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
                      {task.scheduledTime && ` at ${task.scheduledTime}`}
                    </BodySemibold>
                  </View>
                </View>
                <Spacer size="md" />
                {task.status !== 'completed' && (
                  <Button
                    size="sm"
                    onPress={() => handleConfirmTask(task.id)}
                    style={styles.confirmButton}
                  >
                    {task.status === 'pending' ? 'Start Task' : 'Confirm Completion'}
                  </Button>
                )}
                {task.status === 'completed' && task.completedDate && (
                  <View style={styles.completedInfo}>
                    <BodySmall color={colors.success}>
                      ✓ Completed on {dayjs(task.completedDate).format('MMM D, YYYY')}
                    </BodySmall>
                  </View>
                )}
              </Card>
              <Spacer size="md" />
            </TouchableOpacity>
          ))}
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
  headerRight: {
    width: 40,
  },
  filterContainer: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
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
  completedInfo: {
    padding: spacing.sm,
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
});

