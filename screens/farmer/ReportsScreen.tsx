/**
 * Reports Screen
 * View all farmer reports (pest, disease, etc.)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { scale, moderateScale, getFontSize, getSpacing, verticalScale } from '../../utils/responsive';
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
  Button,
} from '../../components/ui';
import { getFarmerReports } from '../../libs/farmer';
import { FarmerReport } from '../../types/api';

export const ReportsScreen = () => {
  const router = useRouter();
  const windowDimensions = useWindowDimensions();
  const [selectedFilter, setSelectedFilter] = useState<string>('pest');
  const [currentPage, setCurrentPage] = useState(1);
  const [allReports, setAllReports] = useState<FarmerReport[]>([]);
  const pageSize = 10;

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['farmerReports', selectedFilter, currentPage],
    queryFn: () =>
      getFarmerReports({
        currentPage,
        pageSize,
        reportType: selectedFilter,
      }),
  });

  // Sync data from query result to local state
  useEffect(() => {
    if (data) {
      console.log('📊 Reports data received:', {
        hasData: !!data.data,
        dataLength: data.data?.length,
        currentPage: data.currentPage,
        totalCount: data.totalCount,
        hasNext: data.hasNext,
      });
      
      if (currentPage === 1) {
        // Reset reports when filter changes or first load
        setAllReports(data.data || []);
      } else {
        // Append new reports when loading more
        setAllReports((prev) => [...prev, ...(data.data || [])]);
      }
    }
  }, [data, currentPage]);

  const reports = allReports;
  const hasMore = data?.hasNext || false;

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'critical':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#EAB308';
      default:
        return colors.textSecondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
      case 'completed':
        return colors.success;
      case 'pending':
        return '#F59E0B';
      case 'in-progress':
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  const getReportTypeIcon = (reportType: string) => {
    switch (reportType?.toLowerCase()) {
      case 'pest':
        return 'bug-outline';
      case 'disease':
        return 'medical-outline';
      case 'weather':
        return 'rainy-outline';
      default:
        return 'document-text-outline';
    }
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('DD/MM/YYYY HH:mm');
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Container padding="lg">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <H3 style={styles.headerTitle}>Báo cáo của tôi</H3>
          <View style={styles.headerRight} />
        </View>

        <Spacer size="lg" />

        {/* Filter Buttons */}
        <View style={styles.filterWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
            contentContainerStyle={styles.filterContent}
          >
          <TouchableOpacity
            onPress={() => {
              setSelectedFilter('pest');
              setCurrentPage(1);
              setAllReports([]);
            }}
            style={[
              styles.filterButton,
              selectedFilter === 'pest' && styles.filterButtonActive,
            ]}
            activeOpacity={0.7}
          >
            <BodySmall
              color={selectedFilter === 'pest' ? colors.white : colors.textDark}
              style={styles.filterText}
            >
              Sâu bệnh
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setSelectedFilter('disease');
              setCurrentPage(1);
              setAllReports([]);
            }}
            style={[
              styles.filterButton,
              selectedFilter === 'disease' && styles.filterButtonActive,
            ]}
            activeOpacity={0.7}
          >
            <BodySmall
              color={selectedFilter === 'disease' ? colors.white : colors.textDark}
              style={styles.filterText}
            >
              Bệnh
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setSelectedFilter('weather');
              setCurrentPage(1);
              setAllReports([]);
            }}
            style={[
              styles.filterButton,
              selectedFilter === 'weather' && styles.filterButtonActive,
            ]}
            activeOpacity={0.7}
          >
            <BodySmall
              color={selectedFilter === 'weather' ? colors.white : colors.textDark}
              style={styles.filterText}
            >
              Thời tiết
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setSelectedFilter('other');
              setCurrentPage(1);
              setAllReports([]);
            }}
            style={[
              styles.filterButton,
              selectedFilter === 'other' && styles.filterButtonActive,
            ]}
            activeOpacity={0.7}
          >
            <BodySmall
              color={selectedFilter === 'other' ? colors.white : colors.textDark}
              style={styles.filterText}
            >
              Khác
            </BodySmall>
          </TouchableOpacity>
          </ScrollView>
        </View>

        <Spacer size="md" />

        {/* Loading State */}
        {isLoading && reports.length === 0 && (
          <View style={styles.centerContainer}>
            <BodySmall color={colors.textSecondary}>Đang tải báo cáo...</BodySmall>
          </View>
        )}

        {/* Error State */}
        {isError && reports.length === 0 && (
          <Card variant="elevated" style={styles.errorCard}>
            <BodySemibold>Không thể tải báo cáo</BodySemibold>
            <Spacer size="xs" />
            <BodySmall color={colors.textSecondary}>
              Vui lòng kiểm tra kết nối của bạn và thử lại.
            </BodySmall>
            <Spacer size="md" />
            <Button onPress={() => {
              setCurrentPage(1);
              setAllReports([]);
              refetch();
            }} size="sm">
              Thử lại
            </Button>
          </Card>
        )}

        {/* Debug Info - Remove in production */}
        {/* {__DEV__ && data && (
          <Card variant="flat" style={{ marginBottom: spacing.md, padding: spacing.sm }}>
            <BodySmall color={colors.textSecondary}>
              Debug: Total={data.totalCount}, Current={reports.length}, Page={data.currentPage}/{data.totalPages}, HasNext={data.hasNext ? 'Yes' : 'No'}
            </BodySmall>
          </Card>
        )} */}

        {/* Reports List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => {
              setCurrentPage(1);
              setAllReports([]);
              refetch();
            }} />
          }
        >
          {reports.length === 0 && !isLoading && (
            <Card variant="flat" style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
              <Spacer size="md" />
              <BodySemibold>Chưa có báo cáo</BodySemibold>
              <Spacer size="xs" />
              <BodySmall color={colors.textSecondary} style={styles.emptyText}>
                Các báo cáo của bạn sẽ hiển thị ở đây.
              </BodySmall>
            </Card>
          )}

          {reports.map((report: FarmerReport) => (
            <TouchableOpacity
              key={report.id}
              activeOpacity={0.7}
              onPress={() => {
                // Navigate to report detail if needed
                // router.push(`/farmer/reports/${report.id}`);
              }}
            >
              <Card variant="elevated" style={styles.reportCard}>
                {/* Report Header */}
                <View style={styles.reportHeader}>
                  <View style={[styles.reportIcon, { backgroundColor: getSeverityColor(report.severity) + '20' }]}>
                    <Ionicons
                      name={getReportTypeIcon(report.reportType) as any}
                      size={24}
                      color={getSeverityColor(report.severity)}
                    />
                  </View>
                  <View style={styles.reportHeaderInfo}>
                    <View style={styles.reportTitleRow}>
                      <BodySemibold style={styles.reportTitle} numberOfLines={2}>
                        {report.title}
                      </BodySemibold>
                      <Badge
                        variant="primary"
                        size="sm"
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
                      </Badge>
                    </View>
                    <View style={styles.reportMetaRow}>
                      <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                        <BodySmall color={colors.textSecondary} style={styles.metaText}>
                          {report.plotName}
                        </BodySmall>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                        <BodySmall color={colors.textSecondary} style={styles.metaText}>
                          {formatDate(report.reportedAt)}
                        </BodySmall>
                      </View>
                    </View>
                  </View>
                </View>

                <Spacer size="md" />

                {/* Report Description */}
                <Body style={styles.reportDescription} numberOfLines={3}>
                  {report.description}
                </Body>

                {/* Images */}
                {report.images && report.images.length > 0 && (
                  <>
                    <Spacer size="md" />
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.imagesContainer}
                    >
                      {report.images.slice(0, 3).map((imageUri, index) => (
                        <Image
                          key={index}
                          source={{ uri: imageUri }}
                          style={styles.reportImage}
                          resizeMode="cover"
                        />
                      ))}
                      {report.images.length > 3 && (
                        <View style={styles.moreImagesOverlay}>
                          <BodySmall color={colors.white} style={styles.moreImagesText}>
                            +{report.images.length - 3}
                          </BodySmall>
                        </View>
                      )}
                    </ScrollView>
                  </>
                )}

                <Spacer size="md" />

                {/* Report Footer */}
                <View style={styles.reportFooter}>
                  <View style={styles.footerLeft}>
                    <Badge
                      variant="primary"
                      size="sm"
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
                    </Badge>
                    {report.cultivationPlanName && (
                      <BodySmall color={colors.textSecondary} style={styles.planName}>
                        {report.cultivationPlanName}
                      </BodySmall>
                    )}
                  </View>
                  {report.resolvedAt && (
                    <View style={styles.resolvedInfo}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <BodySmall color={colors.success} style={styles.resolvedText}>
                        Đã xử lý
                      </BodySmall>
                    </View>
                  )}
                </View>
              </Card>
              <Spacer size="md" />
            </TouchableOpacity>
          ))}

          {/* Load More Button */}
          {hasMore && reports.length > 0 && (
            <>
              <Spacer size="md" />
              <Button
                onPress={handleLoadMore}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                {isLoading ? 'Đang tải...' : 'Tải thêm'}
              </Button>
              <Spacer size="lg" />
            </>
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
    paddingTop: getSpacing(spacing.md),
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: getFontSize(20),
  },
  headerRight: {
    width: scale(40),
  },
  filterWrapper: {
    marginHorizontal: -getSpacing(spacing.lg),
    paddingHorizontal: getSpacing(spacing.lg),
  },
  filterContainer: {
    flexGrow: 0,
  },
  filterContent: {
    gap: getSpacing(spacing.sm),
    paddingRight: getSpacing(spacing.lg),
  },
  filterButton: {
    paddingHorizontal: getSpacing(spacing.md),
    paddingVertical: getSpacing(spacing.sm),
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: scale(80),
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: getFontSize(13),
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getSpacing(spacing.xl * 2),
  },
  errorCard: {
    padding: getSpacing(spacing.lg),
  },
  emptyState: {
    padding: getSpacing(spacing.xl * 2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  reportCard: {
    padding: getSpacing(spacing.md),
    borderRadius: moderateScale(borderRadius.lg),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    gap: getSpacing(spacing.md),
  },
  reportIcon: {
    width: scale(48),
    height: scale(48),
    borderRadius: moderateScale(borderRadius.md),
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportHeaderInfo: {
    flex: 1,
    gap: getSpacing(spacing.xs),
  },
  reportTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: getSpacing(spacing.sm),
    flexWrap: 'wrap',
  },
  reportTitle: {
    flex: 1,
    fontSize: getFontSize(15),
  },
  severityBadge: {
    alignSelf: 'flex-start',
  },
  reportMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getSpacing(spacing.md),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: getFontSize(12),
  },
  reportDescription: {
    lineHeight: moderateScale(20),
    fontSize: getFontSize(14),
    color: colors.textDark,
  },
  imagesContainer: {
    flexDirection: 'row',
    gap: getSpacing(spacing.sm),
  },
  reportImage: {
    width: scale(100),
    height: scale(100),
    borderRadius: moderateScale(borderRadius.md),
  },
  moreImagesOverlay: {
    width: scale(100),
    height: scale(100),
    borderRadius: moderateScale(borderRadius.md),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    fontSize: getFontSize(16),
    fontWeight: '700',
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: getSpacing(spacing.sm),
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(spacing.sm),
    flexWrap: 'wrap',
  },
  statusBadge: {
    alignSelf: 'flex-start',
  },
  planName: {
    fontSize: getFontSize(12),
  },
  resolvedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resolvedText: {
    fontSize: getFontSize(12),
    fontWeight: '600',
  },
});

