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
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { colors, spacing, borderRadius } from '../../theme';
import { scale, moderateScale, getFontSize, getSpacing, verticalScale } from '../../utils/responsive';
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
import { translateTaskStatus } from '../../utils/translations';

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
      <SafeAreaView style={styles.container}>
        <Container padding="lg">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Body>←</Body>
            </TouchableOpacity>
            <H3 style={styles.headerTitle}>Kế hoạch canh tác</H3>
            <View style={styles.headerRight} />
          </View>
          <Spacer size="3xl" />
          <Card variant="elevated" style={styles.errorCard}>
            <BodySemibold>Không thể tải kế hoạch canh tác</BodySemibold>
            <Spacer size="xs" />
            <BodySmall color={colors.textSecondary}>
              Vui lòng kiểm tra kết nối và thử lại.
            </BodySmall>
            <Spacer size="md" />
            <Button onPress={() => refetch()} size="sm">
              Thử lại
            </Button>
          </Card>
        </Container>
      </SafeAreaView>
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
          <H3 style={styles.headerTitle}>Kế hoạch canh tác</H3>
          <View style={styles.headerRight} />
        </View>

        <BodySmall color={colors.textSecondary}>
          Thửa đất: {plotName || plotId}
        </BodySmall>

        <Spacer size="xl" />

        {plans.length === 0 ? (
          <Card variant="flat" style={styles.emptyState}>
            <BodySemibold>Chưa có kế hoạch canh tác</BodySemibold>
            <Spacer size="xs" />
            <BodySmall color={colors.textSecondary}>
              Khi có kế hoạch được tạo cho thửa đất này, nó sẽ hiển thị ở đây.
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
                      Vụ mùa: {plan.seasonName}
                    </BodySmall>
                  </View>
                  <BodySmall
                    color={
                      plan.status === 'Completed' ? greenTheme.success : greenTheme.primary
                    }
                    style={styles.statusText}
                  >
                    {translateTaskStatus(plan.status)}
                  </BodySmall>
                </View>

                <Spacer size="md" />

                <View style={styles.planDetails}>
                  <View style={styles.detailItem}>
                    <BodySmall color={colors.textSecondary}>Giống lúa</BodySmall>
                    <BodySemibold>{plan.riceVarietyName}</BodySemibold>
                  </View>
                  <View style={styles.detailItem}>
                    <BodySmall color={colors.textSecondary}>Ngày gieo trồng</BodySmall>
                    <BodySemibold>
                      {dayjs(plan.plantingDate).format('MMM D, YYYY')}
                    </BodySemibold>
                  </View>
                  {/* <View style={styles.detailItem}>
                    <BodySmall color={colors.textSecondary}>Năng suất thực tế</BodySmall>
                    <BodySemibold>
                      {plan.actualYield ? `${plan.actualYield} kg` : 'Chưa có'}
                    </BodySemibold>
                  </View> */}
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
                  style={{ borderColor: greenTheme.primary, backgroundColor: greenTheme.primaryLighter }}
                >
                  Xem chi tiết kế hoạch
                </Button>
              </Card>
            ))}
          </ScrollView>
        )}
      </Container>
    </SafeAreaView>
  );
};

// Green theme colors for farmer-friendly design
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: greenTheme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: getSpacing(spacing.md),
    backgroundColor: greenTheme.cardBackground,
    paddingBottom: getSpacing(spacing.sm),
    borderBottomWidth: 1,
    borderBottomColor: greenTheme.border,
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(borderRadius.full),
    backgroundColor: greenTheme.primaryLighter,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: getFontSize(20),
    color: greenTheme.primary,
    fontWeight: '700',
  },
  headerRight: {
    width: scale(40),
  },
  errorCard: {
    padding: getSpacing(spacing.lg),
    gap: getSpacing(spacing.sm),
    backgroundColor: greenTheme.cardBackground,
    borderRadius: moderateScale(borderRadius.lg),
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  emptyState: {
    padding: getSpacing(spacing.lg),
    gap: getSpacing(spacing.sm),
    backgroundColor: greenTheme.cardBackground,
    borderRadius: moderateScale(borderRadius.lg),
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  planCard: {
    padding: getSpacing(spacing.md),
    marginBottom: getSpacing(spacing.md),
    backgroundColor: greenTheme.cardBackground,
    borderRadius: moderateScale(borderRadius.lg),
    borderWidth: 1,
    borderColor: greenTheme.border,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planHeaderLeft: {
    gap: getSpacing(spacing.xs),
  },
  statusText: {
    fontWeight: '600',
    fontSize: getFontSize(14),
    color: greenTheme.primary,
  },
  planDetails: {
    marginTop: getSpacing(spacing.sm),
    gap: getSpacing(spacing.sm),
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

