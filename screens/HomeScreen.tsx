/**
 * Home Screen
 * Main dashboard with task progress and groups
 */

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, shadows } from '../theme';
import {
  Container,
  H1,
  H3,
  H4,
  Body,
  BodySmall,
  BodySemibold,
  Avatar,
  Card,
  Badge,
  Spacer,
  Button,
} from '../components/ui';

// Mock data
const user = {
  name: 'Livia Vaccaro',
  avatar: undefined,
  todayProgress: 85,
};

const inProgressTasks = [
  {
    id: '1',
    category: 'Office Project',
    title: 'Grocery shopping app design',
    progress: 70,
    color: colors.info,
  },
  {
    id: '2',
    category: 'Personal Project',
    title: 'Uber Eats redesign challange',
    progress: 60,
    color: '#FF6B6B',
  },
];

const taskGroups = [
  {
    id: '1',
    name: 'Office Project',
    taskCount: 23,
    progress: 70,
    color: '#FF6B9D',
    icon: '💼',
  },
  {
    id: '2',
    name: 'Personal Project',
    taskCount: 30,
    progress: 52,
    color: colors.primary,
    icon: '👤',
  },
  {
    id: '3',
    name: 'Daily Study',
    taskCount: 30,
    progress: 87,
    color: '#FF9500',
    icon: '📚',
  },
  {
    id: '4',
    name: 'Daily Study',
    taskCount: 12,
    progress: 45,
    color: '#FFD60A',
    icon: '🎯',
  },
];

export const HomeScreen = () => {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Container padding="lg">
        {/* Header */}
        <View style={styles.header}>
          <View>
            <BodySmall color={colors.textSecondary}>Hello!</BodySmall>
            <H3>{user.name}</H3>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton}>
              <View style={styles.notificationBadge} />
              <Body>🔔</Body>
            </TouchableOpacity>
            <Avatar
              initials="LV"
              size="md"
              backgroundColor={colors.primary}
            />
          </View>
        </View>

        <Spacer size="lg" />

        {/* Today's Progress Card */}
        <Card variant="elevated" style={styles.progressCard}>
          <View style={styles.progressCardContent}>
            <View style={styles.progressTextContainer}>
              <Body color={colors.white} style={styles.progressTitle}>
                Your today's task{'\n'}almost done!
              </Body>
              <Spacer size="md" />
              <Button
                onPress={() => router.push('/tasks')}
                variant="ghost"
                style={styles.viewTaskButton}
                textStyle={styles.viewTaskText}
              >
                View Task
              </Button>
            </View>
            
            <View style={styles.progressCircle}>
              <CircularProgress progress={user.todayProgress} />
              <TouchableOpacity style={styles.moreButton}>
                <Body color={colors.white}>⋯</Body>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        <Spacer size="xl" />

        {/* In Progress Section */}
        <View style={styles.sectionHeader}>
          <H4>In Progress</H4>
          <Badge variant="neutral" size="sm">
            {inProgressTasks.length}
          </Badge>
        </View>

        <Spacer size="md" />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.inProgressList}
        >
          {inProgressTasks.map((task) => (
            <TouchableOpacity key={task.id} style={styles.taskCard}>
              <Card variant="elevated" style={styles.taskCardInner}>
                <View style={styles.taskCardHeader}>
                  <BodySmall color={colors.textSecondary}>
                    {task.category}
                  </BodySmall>
                  <View style={[styles.categoryIcon, { backgroundColor: task.color + '20' }]}>
                    <Body>{task.category.includes('Office') ? '💼' : '👤'}</Body>
                  </View>
                </View>
                <Spacer size="sm" />
                <BodySemibold>{task.title}</BodySemibold>
                <Spacer size="md" />
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${task.progress}%`, backgroundColor: task.color },
                      ]}
                    />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Spacer size="xl" />

        {/* Task Groups Section */}
        <View style={styles.sectionHeader}>
          <H4>Task Groups</H4>
          <Badge variant="neutral" size="sm">
            {taskGroups.length}
          </Badge>
        </View>

        <Spacer size="md" />

        {taskGroups.map((group) => (
          <TouchableOpacity key={group.id}>
            <Card variant="flat" style={styles.groupCard}>
              <View style={styles.groupCardLeft}>
                <View style={[styles.groupIcon, { backgroundColor: group.color + '20' }]}>
                  <Body>{group.icon}</Body>
                </View>
                <View>
                  <BodySemibold>{group.name}</BodySemibold>
                  <BodySmall color={colors.textSecondary}>
                    {group.taskCount} Tasks
                  </BodySmall>
                </View>
              </View>
              <CircularProgress progress={group.progress} size={60} color={group.color} />
            </Card>
            <Spacer size="sm" />
          </TouchableOpacity>
        ))}

        <Spacer size="3xl" />
      </Container>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Body color={colors.white} style={styles.fabText}>+</Body>
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Body>🏠</Body>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Body>📅</Body>
        </TouchableOpacity>
        <View style={styles.navItemPlaceholder} />
        <TouchableOpacity style={styles.navItem}>
          <Body>📋</Body>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Body>👥</Body>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Circular Progress Component
const CircularProgress = ({
  progress,
  size = 100,
  color = colors.white,
}: {
  progress: number;
  size?: number;
  color?: string;
}) => {
  return (
    <View style={[styles.circularProgress, { width: size, height: size }]}>
      <Body color={color} style={styles.progressText}>
        {progress}%
      </Body>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  progressCard: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
  },
  progressCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTextContainer: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 18,
    lineHeight: 26,
  },
  viewTaskButton: {
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  viewTaskText: {
    color: colors.primary,
  },
  progressCircle: {
    position: 'relative',
  },
  circularProgress: {
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  progressText: {
    fontSize: 24,
    fontWeight: '700',
  },
  moreButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inProgressList: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  taskCard: {
    width: 280,
  },
  taskCardInner: {
    padding: spacing.md,
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  groupCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  groupCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  fabText: {
    fontSize: 32,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    ...shadows.lg,
  },
  navItem: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navItemActive: {
    backgroundColor: colors.primaryLighter,
  },
  navItemPlaceholder: {
    width: 64,
  },
});

