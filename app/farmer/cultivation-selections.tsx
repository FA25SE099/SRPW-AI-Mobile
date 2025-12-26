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

  useEffect(() => {
    loadData();
  }, [selectedYearSeasonId]);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const yearSeasons = await getActiveYearSeasons();
      setActiveYearSeasons(yearSeasons);

      let currentYearSeasonId = selectedYearSeasonId;
      if (!currentYearSeasonId && yearSeasons.length > 0) {
        const farmerSelectionSeason = yearSeasons.find((ys) => ys.allowFarmerSelection);
        currentYearSeasonId = farmerSelectionSeason?.id || yearSeasons[0].id;
        setSelectedYearSeasonId(currentYearSeasonId);
      }

      if (currentYearSeasonId) {
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
          {selections?.selectionDeadline && (
            <>
              <DeadlineCountdown
                deadline={selections.selectionDeadline}
                daysRemaining={selections.daysUntilDeadline}
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
                <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                </View>
                <View>
                  <Text style={styles.statValue}>{selections?.confirmedPlots || 0}</Text>
                  <Text style={styles.statLabel}>Đã xác nhận</Text>
                </View>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="time" size={20} color="#f59e0b" />
                </View>
                <View>
                  <Text style={styles.statValue}>{selections?.pendingPlots || 0}</Text>
                  <Text style={styles.statLabel}>Chưa chọn</Text>
                </View>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: '#e0e7ff' }]}>
                  <Ionicons name="grid" size={20} color="#6366f1" />
                </View>
                <View>
                  <Text style={styles.statValue}>{selections?.totalPlots || 0}</Text>
                  <Text style={styles.statLabel}>Tổng số</Text>
                </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#f9fafb',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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

