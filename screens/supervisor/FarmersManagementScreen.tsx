/**
 * Farmers Management Screen
 * View and manage farmers under supervision
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
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
} from '../../components/ui';
import { useUser } from '../../libs/auth';

// Mock data - will be replaced with API calls
const mockFarmers = [
  {
    id: '1',
    name: 'Nguyen Van A',
    email: 'nguyenvana@example.com',
    totalFields: 5,
    activeTasks: 3,
    completionRate: 85,
    status: 'active',
    lastActivity: '2024-01-15',
  },
  {
    id: '2',
    name: 'Tran Thi B',
    email: 'tranthib@example.com',
    totalFields: 8,
    activeTasks: 2,
    completionRate: 92,
    status: 'active',
    lastActivity: '2024-01-15',
  },
  {
    id: '3',
    name: 'Le Van C',
    email: 'levanc@example.com',
    totalFields: 3,
    activeTasks: 5,
    completionRate: 68,
    status: 'needs-attention',
    lastActivity: '2024-01-14',
  },
];

export const FarmersManagementScreen = () => {
  const router = useRouter();
  const { data: user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'needs-attention'>('all');

  // TODO: Replace with actual API call
  // const { data: farmers, isLoading, isError } = useQuery({
  //   queryKey: ['supervisor-farmers', user?.id],
  //   queryFn: () => getSupervisedFarmers({ supervisorId: user?.id }),
  // });

  const filteredFarmers = mockFarmers.filter((farmer) => {
    const matchesSearch =
      farmer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farmer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && farmer.status === 'active') ||
      (statusFilter === 'needs-attention' && farmer.status === 'needs-attention');
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'needs-attention':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return colors.success;
    if (rate >= 60) return '#FF9500';
    return colors.error;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Container padding="lg">
        {/* Header */}
        <View style={styles.header}>
          <H3>Farmers Management</H3>
          <BodySmall color={colors.textSecondary}>
            {filteredFarmers.length} farmers
          </BodySmall>
        </View>

        <Spacer size="lg" />

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search farmers..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <Spacer size="md" />

        {/* Status Filters */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => setStatusFilter('all')}
            style={[
              styles.filterChip,
              statusFilter === 'all' && styles.filterChipActive,
            ]}
          >
            <BodySmall
              color={statusFilter === 'all' ? colors.white : colors.textDark}
            >
              All
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setStatusFilter('active')}
            style={[
              styles.filterChip,
              statusFilter === 'active' && styles.filterChipActive,
            ]}
          >
            <BodySmall
              color={statusFilter === 'active' ? colors.white : colors.textDark}
            >
              Active
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setStatusFilter('needs-attention')}
            style={[
              styles.filterChip,
              statusFilter === 'needs-attention' && styles.filterChipActive,
            ]}
          >
            <BodySmall
              color={statusFilter === 'needs-attention' ? colors.white : colors.textDark}
            >
              Needs Attention
            </BodySmall>
          </TouchableOpacity>
        </View>

        <Spacer size="lg" />

        {/* Farmers List */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {filteredFarmers.map((farmer) => (
            <TouchableOpacity
              key={farmer.id}
              onPress={() => {
                // Navigate to farmer detail screen
                // router.push(`/supervisor/farmers/${farmer.id}`);
              }}
            >
              <Card variant="elevated" style={styles.farmerCard}>
                <View style={styles.farmerHeader}>
                  <View style={styles.farmerInfo}>
                    <View style={styles.farmerNameRow}>
                      <BodySemibold>{farmer.name}</BodySemibold>
                      <Badge
                        variant="outline"
                        style={[
                          styles.statusBadge,
                          { borderColor: getStatusColor(farmer.status) },
                        ]}
                      >
                        <BodySmall style={{ color: getStatusColor(farmer.status) }}>
                          {farmer.status === 'needs-attention' ? 'Attention' : 'Active'}
                        </BodySmall>
                      </Badge>
                    </View>
                    <BodySmall color={colors.textSecondary}>{farmer.email}</BodySmall>
                  </View>
                </View>

                <Spacer size="md" />

                <View style={styles.farmerStats}>
                  <View style={styles.statItem}>
                    <BodySmall color={colors.textSecondary}>Fields</BodySmall>
                    <BodySemibold>{farmer.totalFields}</BodySemibold>
                  </View>
                  <View style={styles.statItem}>
                    <BodySmall color={colors.textSecondary}>Active Tasks</BodySmall>
                    <BodySemibold>{farmer.activeTasks}</BodySemibold>
                  </View>
                  <View style={styles.statItem}>
                    <BodySmall color={colors.textSecondary}>Completion</BodySmall>
                    <BodySemibold style={{ color: getCompletionColor(farmer.completionRate) }}>
                      {farmer.completionRate}%
                    </BodySemibold>
                  </View>
                </View>

                <Spacer size="sm" />

                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${farmer.completionRate}%`,
                          backgroundColor: getCompletionColor(farmer.completionRate),
                        },
                      ]}
                    />
                  </View>
                </View>

                <Spacer size="sm" />

                <BodySmall color={colors.textSecondary}>
                  Last activity: {new Date(farmer.lastActivity).toLocaleDateString()}
                </BodySmall>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  searchInput: {
    padding: spacing.md,
    fontSize: 16,
    color: colors.textDark,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  farmerCard: {
    padding: spacing.md,
  },
  farmerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  farmerInfo: {
    flex: 1,
  },
  farmerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  farmerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
  },
  statItem: {
    alignItems: 'center',
    gap: spacing.xs,
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
});

