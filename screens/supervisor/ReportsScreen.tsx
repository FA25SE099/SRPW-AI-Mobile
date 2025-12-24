/**
 * Supervisor Reports Screen
 * View and manage emergency reports from farmers
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
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
  Button,
  Spinner,
} from '../../components/ui';
import {
  getSupervisorReports,
  ReportItemResponse,
  GetSupervisorReportsParams,
} from '../../libs/supervisor';

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

const getSeverityColor = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return colors.error;
    case 'high':
      return '#FF9500';
    case 'medium':
      return '#FFC107';
    case 'low':
      return colors.info;
    default:
      return colors.textSecondary;
  }
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'resolved':
      return colors.success;
    case 'pending':
      return '#FFC107';
    case 'underreview':
      return colors.info;
    default:
      return colors.textSecondary;
  }
};

const getReportTypeIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'pest':
      return '🐛';
    case 'disease':
      return '🦠';
    case 'weather':
      return '🌧️';
    default:
      return '⚠️';
  }
};

export const ReportsScreen = () => {
  const router = useRouter();
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [severityFilter, setSeverityFilter] = useState<string | undefined>();
  const [reportTypeFilter, setReportTypeFilter] = useState<string | undefined>();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showSeverityPicker, setShowSeverityPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const params: GetSupervisorReportsParams = {
    currentPage: pageNumber,
    pageSize,
    searchTerm: searchTerm || undefined,
    status: statusFilter,
    severity: severityFilter,
    reportType: reportTypeFilter,
  };

  const {
    data: reportsData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['supervisor-reports', params],
    queryFn: () => getSupervisorReports(params),
  });

  const reports = reportsData?.data || [];
  const totalPages = reportsData?.totalPages || 0;
  const totalCount = reportsData?.totalCount || 0;
  const currentPage = reportsData?.currentPage || 1;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewDetails = (reportId: string) => {
    router.push({
      pathname: '/supervisor/report-detail',
      params: { reportId },
    } as any);
  };

  const handleClearFilters = () => {
    setStatusFilter(undefined);
    setSeverityFilter(undefined);
    setReportTypeFilter(undefined);
    setSearchInput('');
    setSearchTerm('');
    setPageNumber(1);
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setPageNumber(1);
  };

  const hasActiveFilters = statusFilter || severityFilter || reportTypeFilter;

  // Calculate statistics - use totalCount from API for accurate totals
  // For filtered stats, count from current page results, always default to 0
  const stats = {
    total: totalCount || 0,
    pending: reports.filter((r) => r.status === 'Pending').length || 0,
    resolved: reports.filter((r) => r.status === 'Resolved').length || 0,
    critical: reports.filter((r) => r.severity === 'Critical').length || 0,
  };

  if (isLoading && !reportsData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Spinner size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Container>
        {/* Header with Back Button */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={greenTheme.primary} />
          </TouchableOpacity>
          <View style={styles.header}>
            <H3>Emergency Reports</H3>
            <BodySmall color={colors.textSecondary}>
              {totalCount || 0} total reports
            </BodySmall>
          </View>
        </View>

        <Spacer size="md" />

        {/* Statistics Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsContainer}
          style={styles.statsScrollView}
        >
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
            </View>
            <View style={styles.statContent}>
              <BodySmall style={styles.statLabel}>Total</BodySmall>
              <BodySemibold style={styles.statValue}>{stats.total ?? 0}</BodySemibold>
            </View>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="time-outline" size={20} color="#F59E0B" />
            </View>
            <View style={styles.statContent}>
              <BodySmall style={styles.statLabel}>Pending</BodySmall>
              <BodySemibold style={styles.statValue}>{stats.pending ?? 0}</BodySemibold>
            </View>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            </View>
            <View style={styles.statContent}>
              <BodySmall style={styles.statLabel}>Resolved</BodySmall>
              <BodySemibold style={styles.statValue}>{stats.resolved ?? 0}</BodySemibold>
            </View>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="warning" size={20} color={colors.error} />
            </View>
            <View style={styles.statContent}>
              <BodySmall style={styles.statLabel}>Critical</BodySmall>
              <BodySemibold style={styles.statValue}>{stats.critical ?? 0}</BodySemibold>
            </View>
          </Card>
        </ScrollView>

        <Spacer size="md" />

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reports..."
            placeholderTextColor={colors.textSecondary}
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchInput.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchInput('');
                setSearchTerm('');
                setPageNumber(1);
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleSearch}
            style={styles.searchButton}
            disabled={!searchInput.trim()}
          >
            <Ionicons
              name="search"
              size={20}
              color={searchInput.trim() ? greenTheme.primary : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <Spacer size="sm" />

        {/* Filters */}
        <View style={styles.filtersRow}>
          {/* Status Filter */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={styles.filterDropdown}
              onPress={() => {
                setShowStatusPicker(!showStatusPicker);
                setShowSeverityPicker(false);
                setShowTypePicker(false);
              }}
            >
              <BodySmall style={styles.filterLabel}>
                {statusFilter || 'All Status'}
              </BodySmall>
              <Ionicons
                name={showStatusPicker ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            {showStatusPicker && (
              <View style={styles.filterOptions}>
                <ScrollView nestedScrollEnabled>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      !statusFilter && styles.filterOptionActive,
                    ]}
                    onPress={() => {
                      setStatusFilter(undefined);
                      setPageNumber(1);
                      setShowStatusPicker(false);
                    }}
                  >
                    <BodySmall>All Status</BodySmall>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      statusFilter === 'Pending' && styles.filterOptionActive,
                    ]}
                    onPress={() => {
                      setStatusFilter('Pending');
                      setPageNumber(1);
                      setShowStatusPicker(false);
                    }}
                  >
                    <BodySmall>Pending</BodySmall>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      statusFilter === 'UnderReview' && styles.filterOptionActive,
                    ]}
                    onPress={() => {
                      setStatusFilter('UnderReview');
                      setPageNumber(1);
                      setShowStatusPicker(false);
                    }}
                  >
                    <BodySmall>Under Review</BodySmall>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      statusFilter === 'Resolved' && styles.filterOptionActive,
                    ]}
                    onPress={() => {
                      setStatusFilter('Resolved');
                      setPageNumber(1);
                      setShowStatusPicker(false);
                    }}
                  >
                    <BodySmall>Resolved</BodySmall>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}
          </View>

          {/* Severity Filter */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={styles.filterDropdown}
              onPress={() => {
                setShowSeverityPicker(!showSeverityPicker);
                setShowStatusPicker(false);
                setShowTypePicker(false);
              }}
            >
              <BodySmall style={styles.filterLabel}>
                {severityFilter || 'All Severity'}
              </BodySmall>
              <Ionicons
                name={showSeverityPicker ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            {showSeverityPicker && (
              <View style={styles.filterOptions}>
                <ScrollView nestedScrollEnabled>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      !severityFilter && styles.filterOptionActive,
                    ]}
                    onPress={() => {
                      setSeverityFilter(undefined);
                      setPageNumber(1);
                      setShowSeverityPicker(false);
                    }}
                  >
                    <BodySmall>All Severity</BodySmall>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      severityFilter === 'Low' && styles.filterOptionActive,
                    ]}
                    onPress={() => {
                      setSeverityFilter('Low');
                      setPageNumber(1);
                      setShowSeverityPicker(false);
                    }}
                  >
                    <BodySmall>Low</BodySmall>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      severityFilter === 'Medium' && styles.filterOptionActive,
                    ]}
                    onPress={() => {
                      setSeverityFilter('Medium');
                      setPageNumber(1);
                      setShowSeverityPicker(false);
                    }}
                  >
                    <BodySmall>Medium</BodySmall>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      severityFilter === 'High' && styles.filterOptionActive,
                    ]}
                    onPress={() => {
                      setSeverityFilter('High');
                      setPageNumber(1);
                      setShowSeverityPicker(false);
                    }}
                  >
                    <BodySmall>High</BodySmall>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      severityFilter === 'Critical' && styles.filterOptionActive,
                    ]}
                    onPress={() => {
                      setSeverityFilter('Critical');
                      setPageNumber(1);
                      setShowSeverityPicker(false);
                    }}
                  >
                    <BodySmall>Critical</BodySmall>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}
          </View>

          {/* Type Filter */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={styles.filterDropdown}
              onPress={() => {
                setShowTypePicker(!showTypePicker);
                setShowStatusPicker(false);
                setShowSeverityPicker(false);
              }}
            >
              <BodySmall style={styles.filterLabel}>
                {reportTypeFilter || 'All Types'}
              </BodySmall>
              <Ionicons
                name={showTypePicker ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            {showTypePicker && (
              <View style={styles.filterOptions}>
                <ScrollView nestedScrollEnabled>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      !reportTypeFilter && styles.filterOptionActive,
                    ]}
                    onPress={() => {
                      setReportTypeFilter(undefined);
                      setPageNumber(1);
                      setShowTypePicker(false);
                    }}
                  >
                    <BodySmall>All Types</BodySmall>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      reportTypeFilter === 'Pest' && styles.filterOptionActive,
                    ]}
                    onPress={() => {
                      setReportTypeFilter('Pest');
                      setPageNumber(1);
                      setShowTypePicker(false);
                    }}
                  >
                    <BodySmall>Pest</BodySmall>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      reportTypeFilter === 'Disease' && styles.filterOptionActive,
                    ]}
                    onPress={() => {
                      setReportTypeFilter('Disease');
                      setPageNumber(1);
                      setShowTypePicker(false);
                    }}
                  >
                    <BodySmall>Disease</BodySmall>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      reportTypeFilter === 'Weather' && styles.filterOptionActive,
                    ]}
                    onPress={() => {
                      setReportTypeFilter('Weather');
                      setPageNumber(1);
                      setShowTypePicker(false);
                    }}
                  >
                    <BodySmall>Weather</BodySmall>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      reportTypeFilter === 'Other' && styles.filterOptionActive,
                    ]}
                    onPress={() => {
                      setReportTypeFilter('Other');
                      setPageNumber(1);
                      setShowTypePicker(false);
                    }}
                  >
                    <BodySmall>Other</BodySmall>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}
          </View>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={handleClearFilters}
            >
              <Ionicons name="close-circle" size={18} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>

        <Spacer size="md" />

        {/* Reports List */}
        {isError ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle" size={48} color={colors.error} />
            <Spacer size="md" />
            <BodySemibold style={styles.emptyTitle}>
              Failed to load reports
            </BodySemibold>
            <BodySmall style={styles.emptyText}>
              Please try again later
            </BodySmall>
            <Spacer size="md" />
            <Button onPress={() => refetch()} variant="outline">
              Retry
            </Button>
          </View>
        ) : reports.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
            <Spacer size="md" />
            <BodySemibold style={styles.emptyTitle}>No reports found</BodySemibold>
            <BodySmall style={styles.emptyText}>
              {(searchTerm || hasActiveFilters)
                ? 'Try adjusting your filters'
                : 'No emergency reports have been submitted'}
            </BodySmall>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={greenTheme.primary}
              />
            }
          >
            {reports.map((report: ReportItemResponse) => (
              <Card key={report.id} style={styles.reportCard}>
                <TouchableOpacity
                  onPress={() => handleViewDetails(report.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.reportHeader}>
                    <View style={styles.reportHeaderLeft}>
                      <View style={styles.reportIcon}>
                        <Body style={styles.reportIconText}>
                          {getReportTypeIcon(report.reportType)}
                        </Body>
                      </View>
                      <View style={styles.reportTitleContainer}>
                        <View style={styles.reportTitleRow}>
                          <BodySemibold style={styles.reportTitle} numberOfLines={1}>
                            {report.title}
                          </BodySemibold>
                          <Badge
                            style={[
                              styles.statusBadge,
                              { backgroundColor: getStatusColor(report.status) + '20' },
                            ] as any}
                            textStyle={{ color: getStatusColor(report.status) }}
                          >
                            {report.status}
                          </Badge>
                        </View>
                        <View style={styles.reportBadges}>
                          <Badge
                            style={[
                              styles.severityBadge,
                              { backgroundColor: getSeverityColor(report.severity) + '20' },
                            ] as any}
                            textStyle={{ color: getSeverityColor(report.severity) }}
                          >
                            {report.severity}
                          </Badge>
                          <Badge
                            style={styles.typeBadge}
                            textStyle={{ color: colors.textSecondary }}
                          >
                            {report.reportType}
                          </Badge>
                        </View>
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </View>

                  <Spacer size="sm" />

                  <BodySmall style={styles.reportDescription} numberOfLines={2}>
                    {report.description}
                  </BodySmall>

                  <Spacer size="sm" />

                  <View style={styles.reportInfo}>
                    {report.farmerName && (
                      <View style={styles.infoRow}>
                        <Ionicons
                          name="person-outline"
                          size={14}
                          color={colors.textSecondary}
                        />
                        <BodySmall style={styles.infoText}>
                          {report.farmerName}
                        </BodySmall>
                      </View>
                    )}
                    {report.plotName && (
                      <View style={styles.infoRow}>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color={colors.textSecondary}
                        />
                        <BodySmall style={styles.infoText}>
                          {report.plotName}
                          {report.plotArea && ` (${report.plotArea} ha)`}
                        </BodySmall>
                      </View>
                    )}
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <BodySmall style={styles.infoText}>
                        {formatDate(report.reportedAt)}
                      </BodySmall>
                    </View>
                  </View>

                  {report.images && report.images.length > 0 && (
                    <>
                      <Spacer size="sm" />
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.imagesContainer}
                      >
                        {report.images.slice(0, 3).map((image, idx) => (
                          <TouchableOpacity
                            key={idx}
                            onPress={(e) => {
                              e.stopPropagation();
                              setSelectedPhoto(image);
                            }}
                          >
                            <Image source={{ uri: image }} style={styles.reportImage} />
                          </TouchableOpacity>
                        ))}
                        {report.images.length > 3 && (
                          <View style={styles.moreImages}>
                            <BodySmall style={styles.moreImagesText}>
                              +{report.images.length - 3}
                            </BodySmall>
                          </View>
                        )}
                      </ScrollView>
                    </>
                  )}
                </TouchableOpacity>
              </Card>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <View style={styles.pagination}>
                <BodySmall style={styles.paginationText}>
                  Page {currentPage} of {totalPages} ({totalCount} total)
                </BodySmall>
                <View style={styles.paginationButtons}>
                  <Button
                    variant="outline"
                    onPress={() => setPageNumber((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={styles.paginationButton}
                  >
                    <BodySmall>Previous</BodySmall>
                  </Button>
                  <Spacer size="sm" horizontal />
                  <Button
                    variant="outline"
                    onPress={() =>
                      setPageNumber((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    style={styles.paginationButton}
                  >
                    <BodySmall>Next</BodySmall>
                  </Button>
                </View>
              </View>
            )}

            <Spacer size="xl" />
          </ScrollView>
        )}
      </Container>

      {/* Full Screen Image Modal */}
      <Modal
        visible={!!selectedPhoto}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.fullScreenImageContainer}>
          <TouchableOpacity
            style={styles.fullScreenImageBackground}
            activeOpacity={1}
            onPress={() => setSelectedPhoto(null)}
          >
            <TouchableOpacity
              style={styles.fullScreenImageClose}
              onPress={() => setSelectedPhoto(null)}
            >
              <Ionicons name="close" size={30} color={colors.white} />
            </TouchableOpacity>
            {selectedPhoto && (
              <Image
                source={{ uri: selectedPhoto }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
        </View>
      </Modal>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  header: {
    flex: 1,
  },
  statsScrollView: {
    marginBottom: spacing.xs,
  },
  statsContainer: {
    paddingRight: spacing.md,
    alignItems: 'flex-start',
  },
  statCard: {
    width: 140,
    minWidth: 140,
    maxWidth: 140,
    height: 80,
    minHeight: 80,
    marginRight: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  statIcon: {
    width: 40,
    height: 40,
    minWidth: 40,
    minHeight: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    flexShrink: 0,
  },
  statContent: {
    flex: 1,
    minWidth: 0,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
    minHeight: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  clearButton: {
    marginLeft: spacing.sm,
    marginRight: spacing.xs,
  },
  searchButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  filterContainer: {
    flex: 1,
    minWidth: 100,
    position: 'relative',
    zIndex: 10,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: greenTheme.border,
    minHeight: 40,
  },
  filterLabel: {
    flex: 1,
    color: colors.textPrimary,
  },
  filterOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: greenTheme.border,
    ...shadows.md,
    zIndex: 1000,
    maxHeight: 200,
  },
  filterOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterOptionActive: {
    backgroundColor: greenTheme.primaryLighter,
  },
  clearFiltersButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  reportCard: {
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reportHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
  },
  reportIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: greenTheme.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  reportIconText: {
    fontSize: 20,
  },
  reportTitleContainer: {
    flex: 1,
  },
  reportTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reportTitle: {
    flex: 1,
    marginRight: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  reportBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.background,
  },
  reportDescription: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
  reportInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  infoText: {
    marginLeft: 4,
    color: colors.textSecondary,
  },
  imagesContainer: {
    marginTop: spacing.xs,
  },
  reportImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
    backgroundColor: colors.background,
  },
  moreImages: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['2xl'] * 2,
  },
  emptyTitle: {
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  pagination: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  paginationText: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  paginationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paginationButton: {
    minWidth: 100,
  },
  fullScreenImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  fullScreenImageBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImageClose: {
    position: 'absolute',
            top: spacing['2xl'],
    right: spacing.lg,
    zIndex: 1,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
});

