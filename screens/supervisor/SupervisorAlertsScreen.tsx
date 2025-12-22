/**
 * Supervisor Alerts Screen
 * Aggregated alerts from all supervised farmers
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
const mockAlerts = [
  {
    id: '1',
    type: 'pest',
    priority: 'critical',
    farmerName: 'Le Van C',
    plotName: 'Thửa 8, Tờ 9',
    title: 'Pest Detected',
    description: 'Brown planthopper detected in field',
    date: '2024-01-15T10:30:00',
    status: 'unread',
  },
  {
    id: '2',
    type: 'disease',
    priority: 'high',
    farmerName: 'Nguyen Van A',
    plotName: 'Thửa 16, Tờ 58',
    title: 'Disease Outbreak',
    description: 'Bacterial blight symptoms observed',
    date: '2024-01-15T09:15:00',
    status: 'read',
  },
  {
    id: '3',
    type: 'weather',
    priority: 'normal',
    farmerName: 'Tran Thi B',
    plotName: 'Thửa 11, Tờ 12',
    title: 'Weather Warning',
    description: 'Heavy rain expected in next 24 hours',
    date: '2024-01-14T16:00:00',
    status: 'read',
  },
  {
    id: '4',
    type: 'task',
    priority: 'high',
    farmerName: 'Le Van C',
    plotName: 'Thửa 8, Tờ 9',
    title: 'Task Overdue',
    description: 'Harvesting task is overdue by 2 days',
    date: '2024-01-14T08:00:00',
    status: 'read',
  },
];

export const SupervisorAlertsScreen = () => {
  const router = useRouter();
  const { data: user } = useUser();
  const [priorityFilter, setPriorityFilter] = useState<
    'all' | 'critical' | 'high' | 'normal'
  >('all');
  const [typeFilter, setTypeFilter] = useState<
    'all' | 'pest' | 'disease' | 'weather' | 'task'
  >('all');

  // TODO: Replace with actual API call
  // const { data: alerts, isLoading, isError } = useQuery({
  //   queryKey: ['supervisor-alerts', user?.id, priorityFilter, typeFilter],
  //   queryFn: () => getSupervisedAlerts({ supervisorId: user?.id, priority: priorityFilter, type: typeFilter }),
  // });

  const filteredAlerts = mockAlerts.filter((alert) => {
    const matchesPriority = priorityFilter === 'all' || alert.priority === priorityFilter;
    const matchesType = typeFilter === 'all' || alert.type === typeFilter;
    return matchesPriority && matchesType;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return colors.error;
      case 'high':
        return '#FF9500';
      case 'normal':
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      pest: '🐛',
      disease: '🦠',
      weather: '🌧️',
      task: '📋',
    };
    return icons[type] || '🔔';
  };

  const handleAlertPress = (alertId: string) => {
    // Navigate to alert detail or farmer's plot
    // router.push(`/supervisor/alerts/${alertId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Container padding="lg">
        {/* Header */}
        <View style={styles.header}>
          <H3>Alerts & Notifications</H3>
          <BodySmall color={colors.textSecondary}>
            {filteredAlerts.length} alerts
          </BodySmall>
        </View>

        <Spacer size="lg" />

        {/* Priority Filters */}
        <View style={styles.filterSection}>
          <BodySmall color={colors.textSecondary} style={styles.filterLabel}>
            Priority
          </BodySmall>
          <Spacer size="xs" />
          <View style={styles.filterRow}>
            <TouchableOpacity
              onPress={() => setPriorityFilter('all')}
              style={[
                styles.filterChip,
                priorityFilter === 'all' && styles.filterChipActive,
              ]}
            >
              <BodySmall color={priorityFilter === 'all' ? colors.white : colors.textDark}>
                All
              </BodySmall>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPriorityFilter('critical')}
              style={[
                styles.filterChip,
                priorityFilter === 'critical' && styles.filterChipActive,
              ]}
            >
              <BodySmall
                color={priorityFilter === 'critical' ? colors.white : colors.textDark}
              >
                Critical
              </BodySmall>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPriorityFilter('high')}
              style={[
                styles.filterChip,
                priorityFilter === 'high' && styles.filterChipActive,
              ]}
            >
              <BodySmall color={priorityFilter === 'high' ? colors.white : colors.textDark}>
                High
              </BodySmall>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPriorityFilter('normal')}
              style={[
                styles.filterChip,
                priorityFilter === 'normal' && styles.filterChipActive,
              ]}
            >
              <BodySmall color={priorityFilter === 'normal' ? colors.white : colors.textDark}>
                Normal
              </BodySmall>
            </TouchableOpacity>
          </View>
        </View>

        <Spacer size="md" />

        {/* Type Filters */}
        <View style={styles.filterSection}>
          <BodySmall color={colors.textSecondary} style={styles.filterLabel}>
            Type
          </BodySmall>
          <Spacer size="xs" />
          <View style={styles.filterRow}>
            <TouchableOpacity
              onPress={() => setTypeFilter('all')}
              style={[
                styles.filterChip,
                typeFilter === 'all' && styles.filterChipActive,
              ]}
            >
              <BodySmall color={typeFilter === 'all' ? colors.white : colors.textDark}>
                All
              </BodySmall>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTypeFilter('pest')}
              style={[
                styles.filterChip,
                typeFilter === 'pest' && styles.filterChipActive,
              ]}
            >
              <BodySmall color={typeFilter === 'pest' ? colors.white : colors.textDark}>
                Pest
              </BodySmall>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTypeFilter('disease')}
              style={[
                styles.filterChip,
                typeFilter === 'disease' && styles.filterChipActive,
              ]}
            >
              <BodySmall color={typeFilter === 'disease' ? colors.white : colors.textDark}>
                Disease
              </BodySmall>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTypeFilter('weather')}
              style={[
                styles.filterChip,
                typeFilter === 'weather' && styles.filterChipActive,
              ]}
            >
              <BodySmall color={typeFilter === 'weather' ? colors.white : colors.textDark}>
                Weather
              </BodySmall>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTypeFilter('task')}
              style={[
                styles.filterChip,
                typeFilter === 'task' && styles.filterChipActive,
              ]}
            >
              <BodySmall color={typeFilter === 'task' ? colors.white : colors.textDark}>
                Task
              </BodySmall>
            </TouchableOpacity>
          </View>
        </View>

        <Spacer size="lg" />

        {/* Alerts List */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {filteredAlerts.map((alert) => (
            <TouchableOpacity
              key={alert.id}
              onPress={() => handleAlertPress(alert.id)}
            >
              <Card
                variant="elevated"
                style={[
                  styles.alertCard,
                  alert.status === 'unread' && styles.alertCardUnread,
                ]}
              >
                <View style={styles.alertHeader}>
                  <View style={styles.alertIcon}>
                    <Body style={styles.alertIconText}>{getTypeIcon(alert.type)}</Body>
                  </View>
                  <View style={styles.alertInfo}>
                    <View style={styles.alertTitleRow}>
                      <BodySemibold>{alert.title}</BodySemibold>
                      <Badge
                        variant="outline"
                        style={[
                          styles.priorityBadge,
                          { borderColor: getPriorityColor(alert.priority) },
                        ]}
                      >
                        <BodySmall style={{ color: getPriorityColor(alert.priority) }}>
                          {alert.priority}
                        </BodySmall>
                      </Badge>
                    </View>
                    <BodySmall color={colors.textSecondary}>
                      {alert.farmerName} • {alert.plotName}
                    </BodySmall>
                  </View>
                </View>

                <Spacer size="sm" />

                <Body>{alert.description}</Body>

                <Spacer size="sm" />

                <View style={styles.alertFooter}>
                  <BodySmall color={colors.textSecondary}>
                    {dayjs(alert.date).format('MMM DD, YYYY HH:mm')}
                  </BodySmall>
                  {alert.status === 'unread' && (
                    <View style={styles.unreadIndicator} />
                  )}
                </View>
              </Card>
              <Spacer size="sm" />
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
    backgroundColor: greenTheme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterSection: {
    marginBottom: spacing.sm,
  },
  filterLabel: {
    marginBottom: spacing.xs,
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
  alertCard: {
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
  alertCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: greenTheme.primary,
  },
  alertHeader: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: greenTheme.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertIconText: {
    fontSize: 20,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: greenTheme.primary,
  },
});

