/**
 * Production Plans List Screen
 * Shows all production plans for supervisor
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, borderRadius } from '@/theme';
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
} from '@/components/ui';
import { getSupervisorGroups, SupervisorGroup } from '@/libs/supervisor';
import { Ionicons } from '@expo/vector-icons';

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

const getStatusVariant = (status: string): 'primary' | 'success' | 'warning' | 'error' | 'neutral' => {
  switch (status) {
    case 'Completed':
      return 'success';
    case 'InProgress':
    case 'Approved':
      return 'primary';
    case 'PendingApproval':
      return 'warning';
    case 'Draft':
      return 'neutral';
    case 'Cancelled':
      return 'error';
    default:
      return 'neutral';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Completed':
      return 'checkmark-circle';
    case 'InProgress':
      return 'sync';
    case 'Approved':
      return 'checkmark-done';
    case 'PendingApproval':
      return 'time';
    case 'Draft':
      return 'create';
    case 'Cancelled':
      return 'close-circle';
    default:
      return 'document';
  }
};

export const ProductionPlansListScreen = () => {
  const router = useRouter();

  const { data: groups, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['supervisor-groups'],
    queryFn: getSupervisorGroups,
    staleTime: 0,
    refetchOnMount: true,
  });

  const handlePlanPress = (plan: ProductionPlan) => {
    router.push({
      pathname: '/supervisor/plan-details',
      params: {
        planId: plan.productionPlanId,
        planName: plan.planName,
      },
    });
  };

  const renderGroupCard = ({ item: group }: { item: SupervisorGroup }) => {
    return (
      <TouchableOpacity
        onPress={() => router.push({
          pathname: '/supervisor/group-detail',
          params: {
            groupId: group.groupId,
            groupName: group.groupName,
            seasonName: `${group.seasonName} ${group.seasonYear}`,
          },
        })}
        activeOpacity={0.7}
      >
        <Card style={styles.groupCard}>
          <View style={styles.groupHeader}>
            <View style={styles.groupHeaderLeft}>
              <Ionicons
                name="people"
                size={24}
                color={greenTheme.primary}
              />
              <View style={styles.groupInfo}>
                <BodySemibold>{group.groupName}</BodySemibold>
                <BodySmall style={styles.groupSeason}>
                  {group.seasonName} {group.seasonYear}
                </BodySmall>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </View>

          <Spacer size="sm" />

          <View style={styles.groupDetails}>
            <View style={styles.groupDetailItem}>
              <Ionicons name="resize" size={14} color={colors.textSecondary} />
              <BodySmall style={styles.groupDetailValue}>{group.totalArea.toFixed(1)} ha</BodySmall>
            </View>
            <View style={styles.groupDetailItem}>
              <Ionicons name="map" size={14} color={colors.textSecondary} />
              <BodySmall style={styles.groupDetailValue}>{group.totalPlots} plots</BodySmall>
            </View>
            {group.riceVarietyName && (
              <View style={styles.groupDetailItem}>
                <Ionicons name="leaf" size={14} color={colors.textSecondary} />
                <BodySmall style={styles.groupDetailValue}>{group.riceVarietyName}</BodySmall>
              </View>
            )}
          </View>

          <Spacer size="sm" />

          {/* Production Plans Summary */}
          <View style={styles.plansSummary}>
            <Badge variant={group.productionPlansCount > 0 ? 'primary' : 'neutral'} size="sm">
              {group.productionPlansCount} {group.productionPlansCount === 1 ? 'plan' : 'plans'}
            </Badge>
            {group.activePlansCount > 0 && (
              <Badge variant="success" size="sm">
                {group.activePlansCount} active
              </Badge>
            )}
            {group.draftPlansCount > 0 && (
              <Badge variant="neutral" size="sm">
                {group.draftPlansCount} draft
              </Badge>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Container>
          <Spacer size="md" />
          <H3>My Groups</H3>
          <Spacer size="xl" />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={greenTheme.primary} />
          </View>
        </Container>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Container>
        <Spacer size="md" />
        <H3>Production Plans</H3>
        <BodySmall style={styles.subtitle}>
          Manage and monitor production plans
        </BodySmall>
        <Spacer size="lg" />

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="information-circle" size={20} color={colors.info} />
          </View>
          <View style={styles.infoText}>
            <BodySmall style={styles.infoMessage}>
              To create a new production plan, please use the web application. Go to Group
              Management → Select Group → Create Production Plan.
            </BodySmall>
          </View>
        </Card>

        <Spacer size="lg" />

        <FlatList
          data={groups || []}
          keyExtractor={(item) => item.groupId}
          renderItem={renderGroupCard}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[greenTheme.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={64} color={colors.lightGray} />
              <Spacer size="md" />
              <Body style={styles.emptyText}>No groups assigned</Body>
              <BodySmall style={styles.emptySubtext}>
                Contact your administrator to get assigned to groups
              </BodySmall>
            </View>
          }
        />
      </Container>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: greenTheme.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  infoCard: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: greenTheme.primaryLighter,
    borderColor: greenTheme.primary,
    borderWidth: 1,
    borderRadius: borderRadius.md,
  },
  infoIcon: {
    marginRight: spacing.sm,
  },
  infoText: {
    flex: 1,
  },
  infoMessage: {
    color: greenTheme.primary,
  },
  list: {
    paddingBottom: spacing.xl,
  },
  groupCard: {
    marginBottom: spacing.md,
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
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  groupInfo: {
    flex: 1,
  },
  groupSeason: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  groupDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  groupDetailItem: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  groupDetailLabel: {
    color: colors.textSecondary,
  },
  groupDetailValue: {
    color: colors.textPrimary,
  },
  plansSummary: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  plansContainer: {
    gap: spacing.sm,
  },
  planCardInner: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  planCardContent: {
    // Container for plan content
  },
  planName: {
    flex: 1,
  },
  planFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerCost: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  noPlansContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  noPlansText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  noPlansSubtext: {
    color: colors.textTertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  planCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  groupName: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  detailValue: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  progressSection: {
    marginTop: spacing.xs,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    color: colors.textSecondary,
  },
  progressPercent: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  taskProgress: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerText: {
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    color: colors.textSecondary,
  },
  emptySubtext: {
    color: colors.textTertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
