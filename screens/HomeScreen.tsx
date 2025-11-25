/**
 * Home Screen
 * Main dashboard with task progress and groups
 */

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, G } from 'react-native-svg';
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
import { useUser } from '../libs/auth';
import { FarmerHomeScreen } from './FarmerHomeScreen';
import { UavHomeScreen } from './uav/UavHomeScreen';

// Mock data for non-farmer users
const mockTodayProgress = 85;

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
  const { data: user } = useUser();
  

  // Show farmer-specific home screen if user is a farmer
  if (user?.role === 'Farmer') {
    return <FarmerHomeScreen />;
  }
  if (user?.role === 'UavVendor') {
    return <UavHomeScreen />;
  }

  // Get user display name
  const userName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
    : 'User';
  const userInitials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
    : 'U';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Container padding="lg">
        {/* Header */}
        <View style={styles.header}>
          <View>
            <BodySmall color={colors.textSecondary}>Hello!</BodySmall>
            <H3>{userName}</H3>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton}>
              <View style={styles.notificationBadge} />
              <Body>🔔</Body>
            </TouchableOpacity>
            <Avatar
              initials={userInitials}
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
                onPress={() => router.push('/(tabs)/tasks')}
                variant="ghost"
                style={styles.viewTaskButton}
                textStyle={styles.viewTaskText}
              >
                View Task
              </Button>
            </View>

            <View style={styles.progressCircle}>
              <CircularProgress progress={mockTodayProgress} />
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
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (progress / 100) * circumference;
  const center = size / 2;
  
  // Determine background color based on progress color
  const bgColor = color === colors.white 
    ? 'rgba(255, 255, 255, 0.3)' 
    : color + '30';

  return (
    <View style={[styles.circularProgressContainer, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.circularProgressSvg}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        {progress > 0 && (
          <G rotation="-90" originX={center} originY={center}>
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={progressOffset}
              strokeLinecap="round"
            />
          </G>
        )}
      </Svg>
      
      {/* Progress text */}
      <View style={styles.circularProgressTextContainer}>
        <Body color={color} style={[styles.progressText, { fontSize: size * 0.24 }]}>
          {progress}%
        </Body>
      </View>
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
  circularProgressContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularProgressSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  circularProgressTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  progressText: {
    fontWeight: '700',
    textAlign: 'center',
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
});

