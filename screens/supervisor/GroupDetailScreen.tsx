/**
 * Group Detail Screen
 * Shows production plans and plots for a specific group
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
import { useRouter, useLocalSearchParams } from 'expo-router';
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
import { getGroupDetail, GroupDetail } from '@/libs/supervisor';
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

export const GroupDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    groupId: string;
    groupName?: string;
    seasonName?: string;
  }>();

  const { data: groupDetail, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['group-detail', params.groupId],
    queryFn: () => getGroupDetail(params.groupId!),
    enabled: !!params.groupId,
    staleTime: 0,
    refetchOnMount: true,
  });

  const handlePlanPress = (planId: string, planName: string) => {
    router.push({
      pathname: '/supervisor/plan-details',
      params: {
        planId,
        planName,
      },
    });
  };

  const handlePlotPress = (plotId: string, plotName: string) => {
    router.push({
      pathname: '/supervisor/plot-detail',
      params: {
        plotId,
        groupId: params.groupId,
        plotName,
      },
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Container>
          <Spacer size="md" />
          <H3>{params.groupName || 'Group Details'}</H3>
          <Spacer size="xl" />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={greenTheme.primary} />
          </View>
        </Container>
      </SafeAreaView>
    );
  }

  if (!groupDetail) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Container>
          <Spacer size="md" />
          <H3>Group Not Found</H3>
          <Spacer size="md" />
          <Body style={styles.emptyText}>Unable to load group details</Body>
        </Container>
      </SafeAreaView>
    );
  }

  const productionPlans = groupDetail.productionPlans || [];
  const plots = groupDetail.plots || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Container>
          <Spacer size="md" />

          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={greenTheme.primary} />
            <BodySemibold style={styles.backText}>Back</BodySemibold>
          </TouchableOpacity>
          <Spacer size="sm" />

          {/* Header */}
          <H3>{groupDetail.clusterName || params.groupName || 'Group Details'}</H3>
          <BodySmall style={styles.subtitle}>
            {params.seasonName || 'Season Details'} • {groupDetail.totalArea} ha
          </BodySmall>

          <Spacer size="lg" />

          {/* Group Info Card */}
          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <BodySmall style={styles.infoLabel}>Rice Variety:</BodySmall>
              <BodySmall>{groupDetail.riceVarietyName || 'N/A'}</BodySmall>
            </View>
            <View style={styles.infoRow}>
              <BodySmall style={styles.infoLabel}>Planting Date:</BodySmall>
              <BodySmall>
                {groupDetail.plantingDate
                  ? new Date(groupDetail.plantingDate).toLocaleDateString()
                  : 'N/A'}
              </BodySmall>
            </View>
            <View style={styles.infoRow}>
              <BodySmall style={styles.infoLabel}>Status:</BodySmall>
              <Badge variant={groupDetail.status === 'Active' ? 'success' : 'neutral'} size="sm">
                {groupDetail.status}
              </Badge>
            </View>
          </Card>

          <Spacer size="lg" />

          {/* Production Plans Section */}
          <View style={styles.sectionHeader}>
            <H4>Production Plans ({productionPlans.length})</H4>
          </View>

          <Spacer size="sm" />

          {productionPlans.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="document-text-outline" size={48} color={colors.lightGray} />
              <Spacer size="sm" />
              <BodySmall style={styles.emptyText}>No production plans yet</BodySmall>
              <BodySmall style={styles.emptySubtext}>
                Create a plan from the web application
              </BodySmall>
            </Card>
          ) : (
            <View style={styles.plansContainer}>
              {productionPlans.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  onPress={() => handlePlanPress(plan.id, plan.planName)}
                  activeOpacity={0.7}
                >
                  <Card style={styles.planCard}>
                    <View style={styles.planHeader}>
                      <BodySemibold style={styles.planName}>{plan.planName}</BodySemibold>
                      <Badge variant={getStatusVariant(plan.status)} size="sm">
                        {plan.status}
                      </Badge>
                    </View>
                    <Spacer size="xs" />
                    <BodySmall style={styles.planDetail}>
                      Area: {plan.totalArea} ha
                    </BodySmall>
                    <BodySmall style={styles.planDetail}>
                      Planting Date:{' '}
                      {plan.basePlantingDate
                        ? new Date(plan.basePlantingDate).toLocaleDateString()
                        : 'N/A'}
                    </BodySmall>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Spacer size="lg" />

          {/* Plots Section */}
          <View style={styles.sectionHeader}>
            <H4>Plots ({plots.length})</H4>
          </View>

          <Spacer size="sm" />

          {plots.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="map-outline" size={48} color={colors.lightGray} />
              <Spacer size="sm" />
              <BodySmall style={styles.emptyText}>No plots assigned</BodySmall>
            </Card>
          ) : (
            <View style={styles.plotsContainer}>
              {plots.map((plot) => (
                <TouchableOpacity
                  key={plot.id}
                  onPress={() => handlePlotPress(plot.id, `Tờ ${plot.soTo}, Thửa ${plot.soThua}`)}
                  activeOpacity={0.7}
                >
                  <Card style={styles.plotCard}>
                    <View style={styles.plotHeader}>
                      <View>
                        <BodySemibold>
                          Tờ {plot.soTo}, Thửa {plot.soThua}
                        </BodySemibold>
                        <BodySmall style={styles.farmerName}>{plot.farmerName}</BodySmall>
                      </View>
                      <Badge variant={plot.status === 'Active' ? 'success' : 'neutral'} size="sm">
                        {plot.status}
                      </Badge>
                    </View>
                    <Spacer size="xs" />
                    <BodySmall style={styles.plotDetail}>Area: {plot.area} ha</BodySmall>
                    <BodySmall style={styles.plotDetail}>Soil: {plot.soilType}</BodySmall>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Spacer size="xl" />
        </Container>
      </ScrollView>
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
    paddingVertical: spacing.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backText: {
    color: greenTheme.primary,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  infoCard: {
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    color: colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plansContainer: {
    gap: spacing.sm,
  },
  planCard: {
    padding: spacing.md,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    flex: 1,
  },
  planDetail: {
    color: colors.textSecondary,
  },
  plotsContainer: {
    gap: spacing.sm,
  },
  plotCard: {
    padding: spacing.md,
  },
  plotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  farmerName: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  plotDetail: {
    color: colors.textSecondary,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptySubtext: {
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
