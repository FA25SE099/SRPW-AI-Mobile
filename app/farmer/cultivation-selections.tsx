import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/theme';
import { Container, Spacer, Button } from '@/components/ui';
import { PlotSelectionCard } from '@/components/farmer/PlotSelectionCard';
import { DeadlineCountdown } from '@/components/farmer/DeadlineCountdown';
import { getFarmerCultivationSelections, getActiveYearSeasons } from '@/libs/farmerCultivation';
import { getCurrentFarmerPlots } from '@/libs/farmer';
import { useUser } from '@/libs/auth';
import { FarmerCultivationSelections, YearSeason } from '@/types/farmerCultivation';

export default function CultivationSelectionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const yearSeasonId = params.yearSeasonId as string;
  const { data: user } = useUser();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selections, setSelections] = useState<FarmerCultivationSelections | null>(null);
  const [activeYearSeasons, setActiveYearSeasons] = useState<YearSeason[]>([]);
  const [selectedYearSeasonId, setSelectedYearSeasonId] = useState<string>(yearSeasonId || '');
  const [activeYearSeason, setActiveYearSeason] = useState<YearSeason | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedYearSeasonId]);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Get farmer's plots to extract clusterId
      const plots = await getCurrentFarmerPlots({ pageSize: 1 });
      const clusterId = plots.length > 0 ? plots[0].groupId : undefined;

      // Get active year seasons filtered by farmer's cluster
      const yearSeasons = await getActiveYearSeasons(clusterId);
      setActiveYearSeasons(yearSeasons);

      let currentYearSeasonId = selectedYearSeasonId;
      if (!currentYearSeasonId && yearSeasons.length > 0) {
        // Find season with PlanningOpen status
        const planningOpenSeason = yearSeasons.find((ys) => ys.status === 'PlanningOpen');
        currentYearSeasonId = planningOpenSeason?.id || yearSeasons[0].id;
        setSelectedYearSeasonId(currentYearSeasonId);
      }

      if (currentYearSeasonId) {
        const currentSeason = yearSeasons.find(ys => ys.id === currentYearSeasonId);
        setActiveYearSeason(currentSeason || null);
        
        const selectionsData = await getFarmerCultivationSelections(
          user.id,
          currentYearSeasonId
        );
        setSelections(selectionsData);
      }
    } catch (error: any) {
      console.error('Error loading selections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSelectCultivation = (plotId: string) => {
    router.push({
      pathname: '/farmer/select-cultivation',
      params: { plotId, yearSeasonId: selectedYearSeasonId },
    });
  };

  const getProgressPercentage = () => {
    if (!selections || selections.totalPlots === 0) return 0;
    return (selections.confirmedPlots / selections.totalPlots) * 100;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progressPercentage = getProgressPercentage();
  const confirmedSelections = selections?.selections.filter((s) => s.isConfirmed) || [];
  const pendingSelections = selections?.selections.filter((s) => !s.isConfirmed) || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lựa chọn canh tác</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#10b981']} />
        }
      >
        <Container padding="lg">
          {activeYearSeason?.isInPlanningWindow && activeYearSeason.planningWindowEnd && (
            <>
              <DeadlineCountdown
                deadline={activeYearSeason.planningWindowEnd}
                daysRemaining={Math.ceil(
                  (new Date(activeYearSeason.planningWindowEnd).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )}
              />
              <Spacer size="md" />
            </>
          )}

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Tiến độ hoàn thành</Text>
              <Text style={styles.progressPercentage}>{progressPercentage.toFixed(0)}%</Text>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                <Text style={styles.statValue}>{selections?.confirmedPlots || 0}</Text>
                <Text style={styles.statLabel}>Đã xác nhận</Text>
              </View>

              <View style={styles.statItem}>
                <Ionicons name="time" size={24} color="#f59e0b" />
                <Text style={styles.statValue}>{selections?.pendingPlots || 0}</Text>
                <Text style={styles.statLabel}>Chưa chọn</Text>
              </View>

              <View style={styles.statItem}>
                <Ionicons name="grid" size={24} color="#6366f1" />
                <Text style={styles.statValue}>{selections?.totalPlots || 0}</Text>
                <Text style={styles.statLabel}>Tổng số</Text>
              </View>
            </View>
          </View>

          <Spacer size="xl" />

          {confirmedSelections.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                <Text style={styles.sectionTitle}>
                  Đã xác nhận ({confirmedSelections.length})
                </Text>
              </View>
              <Spacer size="md" />

              {confirmedSelections.map((selection) => (
                <PlotSelectionCard
                  key={selection.plotId}
                  selection={selection}
                  onPress={() => handleSelectCultivation(selection.plotId)}
                />
              ))}

              <Spacer size="xl" />
            </>
          )}

          {pendingSelections.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Ionicons name="alert-circle" size={24} color="#f59e0b" />
                <Text style={styles.sectionTitle}>Chưa chọn ({pendingSelections.length})</Text>
              </View>
              <Spacer size="md" />

              {pendingSelections.map((selection) => (
                <PlotSelectionCard
                  key={selection.plotId}
                  selection={selection}
                  actionButton={
                    <Button
                      onPress={() => handleSelectCultivation(selection.plotId)}
                      size="sm"
                    >
                      <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', marginLeft: 8 }}>Chọn ngay</Text>
                    </Button>
                  }
                />
              ))}
            </>
          )}

          {selections && selections.totalPlots === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="leaf-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyStateTitle}>Chưa có thửa ruộng</Text>
              <Text style={styles.emptyStateText}>
                Bạn chưa có thửa ruộng nào trong mùa vụ này.
              </Text>
            </View>
          )}

          <Spacer size="3xl" />
        </Container>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: '#6b7280',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  progressBarContainer: {
    marginBottom: spacing.lg,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#f9fafb',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: spacing.lg,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
