/**
 * Late Farmer Detail Screen
 * Shows list of late records for a specific farmer or plot
 * Clicking a record navigates to PlotCultivationDetailScreen
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, borderRadius } from '@/theme';
import {
  Container,
  H3,
  Body,
  BodySmall,
  BodySemibold,
  Card,
  Spacer,
} from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import {
  getLateFarmerDetails,
  getLatePlotDetails,
} from '@/libs/supervisor';
import { LateRecordDetail } from '@/types/api';

export const LateFarmerDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    name: string;
    type: 'farmer' | 'plot';
  }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['late-details', params.type, params.id],
    queryFn: () => {
      if (params.type === 'farmer') {
        return getLateFarmerDetails(params.id);
      } else {
        return getLatePlotDetails(params.id);
      }
    },
    enabled: !!params.id && !!params.type,
    retry: false,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const handleRecordPress = (record: LateRecordDetail) => {
    // Navigate to PlotCultivationDetailScreen with required params
    router.push({
      pathname: '/supervisor/plot-cultivation-detail',
      params: {
        plotId: record.plotId,
        groupId: record.groupId,
        plotName: record.soThua && record.soTo
          ? `Thửa ${record.soThua}, Tờ ${record.soTo}`
          : 'Plot Details',
      },
    } as any);
  };

  const renderItem = ({ item }: { item: LateRecordDetail }) => (
    <Card style={styles.recordCard}>
      <TouchableOpacity onPress={() => handleRecordPress(item)}>
        <View style={styles.recordHeader}>
          <View style={styles.recordHeaderLeft}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <BodySemibold style={styles.taskName}>{item.taskName}</BodySemibold>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>

        <Spacer size="sm" />

        {params.type === 'farmer' && (
          <>
            <View style={styles.recordRow}>
              <BodySmall style={styles.label}>Plot:</BodySmall>
              <BodySmall>
                {item.soThua && item.soTo
                  ? `Thửa ${item.soThua}, Tờ ${item.soTo}`
                  : 'N/A'}
              </BodySmall>
            </View>
            <Spacer size="xs" />
          </>
        )}

        {params.type === 'plot' && (
          <>
            <View style={styles.recordRow}>
              <BodySmall style={styles.label}>Farmer:</BodySmall>
              <BodySmall>{item.farmerName}</BodySmall>
            </View>
            <Spacer size="xs" />
          </>
        )}

        <View style={styles.recordRow}>
          <BodySmall style={styles.label}>Season:</BodySmall>
          <BodySmall>{item.seasonName}</BodySmall>
        </View>

        <Spacer size="xs" />

        <View style={styles.recordRow}>
          <BodySmall style={styles.label}>Cluster:</BodySmall>
          <BodySmall>{item.clusterName}</BodySmall>
        </View>

        <Spacer size="xs" />

        <View style={styles.recordRow}>
          <BodySmall style={styles.label}>Recorded:</BodySmall>
          <BodySmall>{formatDate(item.recordedAt)}</BodySmall>
        </View>

        {item.notes && (
          <>
            <Spacer size="sm" />
            <BodySmall style={styles.label}>Notes:</BodySmall>
            <BodySmall style={styles.notes}>{item.notes}</BodySmall>
          </>
        )}

        <Spacer size="sm" />
        <View style={styles.viewDetailButton}>
          <BodySmall style={{ color: colors.primary, fontWeight: '600' }}>
            View Cultivation Plan
          </BodySmall>
          <Ionicons name="arrow-forward" size={16} color={colors.primary} />
        </View>
      </TouchableOpacity>
    </Card>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Container>
          <Spacer size="md" />
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.dark} />
            <BodySemibold style={styles.backText}>Back</BodySemibold>
          </TouchableOpacity>
          <Spacer size="sm" />
          <H3>{params.name}</H3>
          <Spacer size="xl" />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </Container>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Container>
          <Spacer size="md" />
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.dark} />
            <BodySemibold style={styles.backText}>Back</BodySemibold>
          </TouchableOpacity>
          <Spacer size="sm" />
          <H3>{params.name}</H3>
          <Spacer size="xl" />
          <Card style={styles.errorCard}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.warning} />
            <Spacer size="md" />
            <Body style={styles.errorText}>Failed to load late records</Body>
            <BodySmall style={styles.errorSubtext}>
              The API endpoint may not be available yet.
            </BodySmall>
          </Card>
        </Container>
      </SafeAreaView>
    );
  }

  const records = data?.data || [];

  const renderHeader = () => (
    <View>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={colors.dark} />
        <BodySemibold style={styles.backText}>Back</BodySemibold>
      </TouchableOpacity>

      <Spacer size="sm" />
      <H3>{params.name}</H3>

      <Spacer size="sm" />
      <Card style={styles.infoCard}>
        <BodySmall style={styles.infoText}>
          {params.type === 'farmer'
            ? 'View late task records for this farmer. Tap any record to see the full cultivation plan.'
            : 'View late task records for this plot. Tap any record to see the full cultivation plan.'}
        </BodySmall>
      </Card>

      <Spacer size="lg" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={records}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
            <Spacer size="md" />
            <Body style={styles.emptyText}>No late records found</Body>
            <BodySmall style={styles.emptySubtext}>
              All tasks are being completed on time!
            </BodySmall>
          </Card>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
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
    color: colors.dark,
  },
  infoCard: {
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
  },
  infoText: {
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing.md,
  },
  recordCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recordHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  taskName: {
    flex: 1,
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    color: colors.textSecondary,
    marginRight: spacing.sm,
    fontWeight: '600',
  },
  notes: {
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
  viewDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  errorCard: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  errorText: {
    textAlign: 'center',
    color: colors.textPrimary,
    fontWeight: '600',
  },
  errorSubtext: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
  },
  emptySubtext: {
    textAlign: 'center',
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
});
