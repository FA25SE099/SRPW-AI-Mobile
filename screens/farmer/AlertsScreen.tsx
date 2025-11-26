/**
 * Alerts & Recommendations Screen
 * View pest/weather alerts and recommendations
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
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
import { ReportResponse, AlertType, ReportStatus, ReportSeverity } from '../../types/api';
import { getMyReports } from '../../libs/farmer';

export const AlertsScreen = () => {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<AlertType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | undefined>(undefined);

  // Fetch reports
  const {
    data: reportsData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['reports', selectedFilter, statusFilter],
    queryFn: () =>
      getMyReports({
        currentPage: 1,
        pageSize: 50,
        reportType: selectedFilter === 'all' ? undefined : selectedFilter,
        status: statusFilter,
      }),
  });

  const reports = reportsData?.data || [];

  const getSeverityColor = (severity: ReportSeverity) => {
    switch (severity) {
      case 'Critical':
        return colors.error;
      case 'High':
        return '#FF9500';
      case 'Medium':
        return '#FFD60A';
      case 'Low':
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  const getTypeIcon = (type: AlertType) => {
    switch (type) {
      case 'Pest':
        return '🐛';
      case 'Weather':
        return '🌧️';
      case 'Disease':
        return '🦠';
      case 'Other':
        return '📢';
      default:
        return '📢';
    }
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'Pending':
        return '#FFD60A';
      case 'UnderReview':
        return colors.info;
      case 'Resolved':
        return '#34C759';
      case 'Rejected':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Container padding="lg">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Body>←</Body>
          </TouchableOpacity>
          <H3 style={styles.headerTitle}>My Reports</H3>
          <TouchableOpacity
            onPress={() => router.push('/farmer/create-report' as any)}
            style={styles.addButton}
          >
            <Body style={styles.addButtonText}>+</Body>
          </TouchableOpacity>
        </View>

        <Spacer size="lg" />

        {/* Filter Buttons - Type */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity
            onPress={() => setSelectedFilter('all')}
            style={[
              styles.filterButton,
              selectedFilter === 'all' && styles.filterButtonActive,
            ]}
          >
            <BodySmall
              color={selectedFilter === 'all' ? colors.white : colors.textPrimary}
            >
              All
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedFilter('Pest')}
            style={[
              styles.filterButton,
              selectedFilter === 'Pest' && styles.filterButtonActive,
            ]}
          >
            <BodySmall
              color={selectedFilter === 'Pest' ? colors.white : colors.textPrimary}
            >
              🐛 Pest
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedFilter('Weather')}
            style={[
              styles.filterButton,
              selectedFilter === 'Weather' && styles.filterButtonActive,
            ]}
          >
            <BodySmall
              color={selectedFilter === 'Weather' ? colors.white : colors.textPrimary}
            >
              🌧️ Weather
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedFilter('Disease')}
            style={[
              styles.filterButton,
              selectedFilter === 'Disease' && styles.filterButtonActive,
            ]}
          >
            <BodySmall
              color={selectedFilter === 'Disease' ? colors.white : colors.textPrimary}
            >
              🦠 Disease
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedFilter('Other')}
            style={[
              styles.filterButton,
              selectedFilter === 'Other' && styles.filterButtonActive,
            ]}
          >
            <BodySmall
              color={selectedFilter === 'Other' ? colors.white : colors.textPrimary}
            >
              📢 Other
            </BodySmall>
          </TouchableOpacity>
        </ScrollView>

        <Spacer size="md" />

        {/* Filter Buttons - Status */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity
            onPress={() => setStatusFilter(undefined)}
            style={[
              styles.filterButton,
              statusFilter === undefined && styles.filterButtonActive,
            ]}
          >
            <BodySmall
              color={statusFilter === undefined ? colors.white : colors.textPrimary}
            >
              All Status
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setStatusFilter('Pending')}
            style={[
              styles.filterButton,
              statusFilter === 'Pending' && styles.filterButtonActive,
            ]}
          >
            <BodySmall
              color={statusFilter === 'Pending' ? colors.white : colors.textPrimary}
            >
              Pending
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setStatusFilter('UnderReview')}
            style={[
              styles.filterButton,
              statusFilter === 'UnderReview' && styles.filterButtonActive,
            ]}
          >
            <BodySmall
              color={statusFilter === 'UnderReview' ? colors.white : colors.textPrimary}
            >
              Under Review
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setStatusFilter('Resolved')}
            style={[
              styles.filterButton,
              statusFilter === 'Resolved' && styles.filterButtonActive,
            ]}
          >
            <BodySmall
              color={statusFilter === 'Resolved' ? colors.white : colors.textPrimary}
            >
              Resolved
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setStatusFilter('Rejected')}
            style={[
              styles.filterButton,
              statusFilter === 'Rejected' && styles.filterButtonActive,
            ]}
          >
            <BodySmall
              color={statusFilter === 'Rejected' ? colors.white : colors.textPrimary}
            >
              Rejected
            </BodySmall>
          </TouchableOpacity>
        </ScrollView>

        <Spacer size="xl" />

        {/* Reports List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Spacer size="md" />
              <Body color={colors.textSecondary}>Loading reports...</Body>
            </View>
          ) : isError ? (
            <View style={styles.centerContainer}>
              <Body color={colors.error}>Failed to load reports</Body>
              <Spacer size="md" />
              <TouchableOpacity onPress={() => refetch()}>
                <Body color={colors.primary}>Tap to retry</Body>
              </TouchableOpacity>
            </View>
          ) : reports.length === 0 ? (
            <View style={styles.centerContainer}>
              <Body color={colors.textSecondary}>No reports found</Body>
              <Spacer size="sm" />
              <BodySmall color={colors.textSecondary}>
                Create your first report using the + button
              </BodySmall>
            </View>
          ) : (
            reports.map((report) => (
              <TouchableOpacity key={report.id}>
                <View
                  style={[
                    styles.alertCard,
                    { borderLeftWidth: 4, borderLeftColor: getSeverityColor(report.severity) },
                  ]}
                >
                  <View style={styles.alertHeader}>
                    <View style={styles.alertIcon}>
                      <Body>{getTypeIcon(report.reportType)}</Body>
                    </View>
                    <View style={styles.alertHeaderInfo}>
                      <View style={styles.alertTitleRow}>
                        <BodySemibold style={styles.alertTitle}>{report.title}</BodySemibold>
                        <View
                          style={[
                            styles.severityBadge,
                            { backgroundColor: getSeverityColor(report.severity) + '20' },
                          ]}
                        >
                          <BodySmall
                            style={{ color: getSeverityColor(report.severity), fontSize: 10 }}
                          >
                            {report.severity.toUpperCase()}
                          </BodySmall>
                        </View>
                      </View>
                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(report.status) + '20' },
                          ]}
                        >
                          <BodySmall
                            style={{ color: getStatusColor(report.status), fontSize: 10 }}
                          >
                            {report.status}
                          </BodySmall>
                        </View>
                      </View>
                      {report.plotName && (
                        <BodySmall color={colors.textSecondary}>
                          📍 Plot: {report.plotName} ({report.plotArea} ha)
                        </BodySmall>
                      )}
                      <BodySmall color={colors.textSecondary}>
                        {dayjs(report.reportedAt).format('MMM D, YYYY h:mm A')}
                      </BodySmall>
                    </View>
                  </View>
                  <Spacer size="md" />
                  <Body style={styles.alertMessage}>{report.description}</Body>
                  
                  {report.cultivationPlanName && (
                    <>
                      <Spacer size="sm" />
                      <View style={styles.alertDetail}>
                        <BodySmall color={colors.textSecondary}>Plan:</BodySmall>
                        <BodySemibold>{report.cultivationPlanName}</BodySemibold>
                      </View>
                    </>
                  )}
                  
                  {report.resolvedBy && report.resolutionNotes && (
                    <>
                      <Spacer size="sm" />
                      <View style={styles.treatmentCard}>
                        <BodySmall color={colors.textSecondary} style={styles.treatmentLabel}>
                          Resolution Notes:
                        </BodySmall>
                        <BodySemibold style={styles.treatmentText}>
                          {report.resolutionNotes}
                        </BodySemibold>
                        <Spacer size="xs" />
                        <BodySmall color={colors.textSecondary}>
                          Resolved by: {report.resolvedBy}
                        </BodySmall>
                        {report.resolvedAt && (
                          <BodySmall color={colors.textSecondary}>
                            {dayjs(report.resolvedAt).format('MMM D, YYYY h:mm A')}
                          </BodySmall>
                        )}
                      </View>
                    </>
                  )}
                  
                  {report.images && report.images.length > 0 && (
                    <>
                      <Spacer size="sm" />
                      <BodySmall color={colors.textSecondary}>
                        📷 {report.images.length} image(s) attached
                      </BodySmall>
                    </>
                  )}
                </View>
                <Spacer size="md" />
              </TouchableOpacity>
            ))
          )}
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
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 24,
    lineHeight: 24,
  },
  filterContainer: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  alertCard: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  alertHeader: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertHeaderInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  alertTitle: {
    flex: 1,
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  alertMessage: {
    lineHeight: 20,
  },
  alertDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  treatmentCard: {
    padding: spacing.sm,
    backgroundColor: colors.primaryLighter,
    borderRadius: borderRadius.sm,
  },
  treatmentLabel: {
    marginBottom: spacing.xs,
  },
  treatmentText: {
    color: colors.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
});

