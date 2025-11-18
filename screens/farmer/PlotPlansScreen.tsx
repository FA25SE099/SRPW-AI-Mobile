/**
 * Plot Plans Screen
 * Displays cultivation plans for a specific plot
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { colors, spacing, borderRadius } from '../../theme';
import {
  Container,
  H3,
  H4,
  Body,
  BodySmall,
  BodySemibold,
  Card,
  Spacer,
  Button,
  Spinner,
} from '../../components/ui';
import { getPlotCultivationPlans } from '../../libs/farmer';
import { PlotCultivationPlan } from '../../types/api';

export const PlotPlansScreen = () => {
  const router = useRouter();
  const { plotId, plotName } = useLocalSearchParams<{
    plotId?: string;
    plotName?: string;
  }>();

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['plot-plans', plotId],
    queryFn: () => {
      if (!plotId) {
        throw new Error('Plot ID is required');
      }
      return getPlotCultivationPlans(plotId);
    },
    enabled: Boolean(plotId),
  });

  const plans = data?.data ?? [];

  if (isLoading) {
    return <Spinner fullScreen />;
  }

  if (isError || !plotId) {
    return (
      <Container padding="lg">
        <Spacer size="3xl" />
        <Card variant="elevated" style={styles.errorCard}>
          <BodySemibold>Unable to load cultivation plans</BodySemibold>
          <Spacer size="xs" />
          <BodySmall color={colors.textSecondary}>
            Please check your connection and try again.
          </BodySmall>
          <Spacer size="md" />
          <Button onPress={() => refetch()} size="sm">
            Try Again
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Container padding="lg">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Body>←</Body>
          </TouchableOpacity>
          <H3 style={styles.headerTitle}>Cultivation Plans</H3>
          <View style={styles.headerRight} />
        </View>

        <BodySmall color={colors.textSecondary}>
          Plot: {plotName || plotId}
        </BodySmall>

        <Spacer size="xl" />

        {plans.length === 0 ? (
          <Card variant="flat" style={styles.emptyState}>
            <BodySemibold>No cultivation plans yet</BodySemibold>
            <Spacer size="xs" />
            <BodySmall color={colors.textSecondary}>
              Once a plan is created for this plot, it will appear here.
            </BodySmall>
          </Card>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
            }
          >
            {plans.map((plan: PlotCultivationPlan) => (
              <Card key={plan.plotCultivationId} variant="elevated" style={styles.planCard}>
                <View style={styles.planHeader}>
                  <View style={styles.planHeaderLeft}>
                    <BodySemibold>{plan.productionPlanName}</BodySemibold>
                    <BodySmall color={colors.textSecondary}>
                      Season: {plan.seasonName}
                    </BodySmall>
                  </View>
                  <BodySmall
                    color={
                      plan.status === 'Completed' ? colors.success : colors.primary
                    }
                    style={styles.statusText}
                  >
                    {plan.status}
                  </BodySmall>
                </View>

                <Spacer size="md" />

                <View style={styles.planDetails}>
                  <View style={styles.detailItem}>
                    <BodySmall color={colors.textSecondary}>Variety</BodySmall>
                    <BodySemibold>{plan.riceVarietyName}</BodySemibold>
                  </View>
                  <View style={styles.detailItem}>
                    <BodySmall color={colors.textSecondary}>Planting Date</BodySmall>
                    <BodySemibold>
                      {dayjs(plan.plantingDate).format('MMM D, YYYY')}
                    </BodySemibold>
                  </View>
                  <View style={styles.detailItem}>
                    <BodySmall color={colors.textSecondary}>Actual Yield</BodySmall>
                    <BodySemibold>
                      {plan.actualYield ? `${plan.actualYield} kg` : 'N/A'}
                    </BodySemibold>
                  </View>
                </View>

                <Spacer size="md" />
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() =>
                    router.push({
                      pathname: '/farmer/plans/[planCultivationId]',
                      params: {
                        planCultivationId: plan.plotCultivationId,
                        planName: plan.productionPlanName,
                      },
                    } as any)
                  }
                >
                  View Plan Details
                </Button>
              </Card>
            ))}
          </ScrollView>
        )}
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
  errorCard: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyState: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  planCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planHeaderLeft: {
    gap: spacing.xs,
  },
  statusText: {
    fontWeight: '600',
  },
  planDetails: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

