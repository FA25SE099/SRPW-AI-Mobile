import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/theme';
import { getFarmerCultivationSelections, getActiveYearSeasons } from '@/libs/farmerCultivation';
import { useUser } from '@/libs/auth';
import { FarmerCultivationSelections, YearSeason } from '@/types/farmerCultivation';

export const CultivationSelectionWidget: React.FC = () => {
  const router = useRouter();
  const { data: user } = useUser();
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<FarmerCultivationSelections | null>(null);
  const [activeYearSeason, setActiveYearSeason] = useState<YearSeason | null>(null);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const yearSeasons = await getActiveYearSeasons();
      const farmerSelectionSeason = yearSeasons.find((ys) => ys.allowFarmerSelection);

      if (farmerSelectionSeason) {
        setActiveYearSeason(farmerSelectionSeason);
        const selectionsData = await getFarmerCultivationSelections(
          user.id,
          farmerSelectionSeason.id
        );
        setSelections(selectionsData);
      }
    } catch (error: any) {
      console.error('Error loading cultivation selections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = () => {
    if (activeYearSeason) {
      router.push({
        pathname: '/farmer/cultivation-selections',
        params: { yearSeasonId: activeYearSeason.id },
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#10b981" />
      </View>
    );
  }

  if (!activeYearSeason || !selections) {
    return null;
  }

  const progressPercentage =
    selections.totalPlots > 0 ? (selections.confirmedPlots / selections.totalPlots) * 100 : 0;

  const isUrgent = selections.daysUntilDeadline <= 3 && selections.daysUntilDeadline > 0;
  const isOverdue = selections.daysUntilDeadline <= 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="leaf" size={24} color="#10b981" />
          <Text style={styles.title}>Lựa chọn canh tác</Text>
        </View>
        <TouchableOpacity onPress={handleViewDetails}>
          <Text style={styles.viewAllText}>Xem chi tiết →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.seasonInfo}>
          <Text style={styles.seasonName}>
            {selections.seasonName} {selections.year}
          </Text>
          {selections.selectionDeadline && (
            <View
              style={[
                styles.deadlineBadge,
                isOverdue && styles.deadlineBadgeOverdue,
                isUrgent && styles.deadlineBadgeUrgent,
              ]}
            >
              <Ionicons
                name="time-outline"
                size={14}
                color={isOverdue ? '#ef4444' : isUrgent ? '#f59e0b' : '#6b7280'}
              />
              <Text
                style={[
                  styles.deadlineText,
                  isOverdue && styles.deadlineTextOverdue,
                  isUrgent && styles.deadlineTextUrgent,
                ]}
              >
                {isOverdue
                  ? 'Đã quá hạn'
                  : isUrgent
                  ? `Còn ${selections.daysUntilDeadline} ngày`
                  : `Còn ${selections.daysUntilDeadline} ngày`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Tiến độ hoàn thành</Text>
            <Text style={styles.progressPercentage}>{progressPercentage.toFixed(0)}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            <Text style={styles.statValue}>{selections.confirmedPlots}</Text>
            <Text style={styles.statLabel}>Đã chọn</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Ionicons name="time" size={18} color="#f59e0b" />
            <Text style={styles.statValue}>{selections.pendingPlots}</Text>
            <Text style={styles.statLabel}>Chưa chọn</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Ionicons name="grid" size={18} color="#6366f1" />
            <Text style={styles.statValue}>{selections.totalPlots}</Text>
            <Text style={styles.statLabel}>Tổng số</Text>
          </View>
        </View>

        {selections.pendingPlots > 0 && (
          <TouchableOpacity style={styles.actionButton} onPress={handleViewDetails}>
            <Text style={styles.actionButtonText}>Chọn giống lúa ngay</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  viewAllText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  content: {
    gap: spacing.md,
  },
  seasonInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  seasonName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  deadlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  deadlineBadgeUrgent: {
    backgroundColor: '#fffbeb',
  },
  deadlineBadgeOverdue: {
    backgroundColor: '#fef2f2',
  },
  deadlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  deadlineTextUrgent: {
    color: '#f59e0b',
  },
  deadlineTextOverdue: {
    color: '#ef4444',
  },
  progressSection: {
    gap: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#f9fafb',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#10b981',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

