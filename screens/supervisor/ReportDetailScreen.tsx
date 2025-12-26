/**
 * Report Detail Screen
 * View complete report information and resolve reports
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { getReport, resolveReport, Report } from '../../libs/supervisor';

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

export const ReportDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ reportId: string }>();
  const queryClient = useQueryClient();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const { data: report, isLoading, isError } = useQuery({
    queryKey: ['report', params.reportId],
    queryFn: () => getReport(params.reportId!),
    enabled: !!params.reportId,
  });

  const resolveMutation = useMutation({
    mutationFn: (notes?: string) => resolveReport(params.reportId!, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report', params.reportId] });
      queryClient.invalidateQueries({ queryKey: ['supervisor-reports'] });
      setShowResolveModal(false);
      setResolutionNotes('');
      Alert.alert('Success', 'Report has been resolved successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to resolve report');
    },
  });

  const formatDate = (dateString?: string) => {
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

  const handleResolve = () => {
    if (showResolveModal) {
      resolveMutation.mutate(resolutionNotes || undefined);
    } else {
      setShowResolveModal(true);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Spinner size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !report) {
    return (
      <SafeAreaView style={styles.container}>
        <Container>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={greenTheme.primary} />
            <BodySemibold style={styles.backText}>Back</BodySemibold>
          </TouchableOpacity>
          <Spacer size="xl" />
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle" size={48} color={colors.error} />
            <Spacer size="md" />
            <BodySemibold style={styles.emptyTitle}>Report not found</BodySemibold>
            <BodySmall style={styles.emptyText}>
              The report you're looking for doesn't exist or has been removed.
            </BodySmall>
          </View>
        </Container>
      </SafeAreaView>
    );
  }

  const canResolve = report.status === 'Pending' || report.status === 'UnderReview';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Container>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={greenTheme.primary} />
          <BodySemibold style={styles.backText}>Back</BodySemibold>
        </TouchableOpacity>
        <Spacer size="md" />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Title and Status */}
          <Card style={styles.titleCard}>
            <View style={styles.titleHeader}>
              <View style={styles.reportIcon}>
                <Body style={styles.reportIconText}>
                  {getReportTypeIcon(report.reportType)}
                </Body>
              </View>
              <View style={styles.titleContent}>
                <H3 style={styles.title}>{report.title}</H3>
                <View style={styles.badgesRow}>
                  <Badge
                    style={[
                      styles.severityBadge,
                      { backgroundColor: getSeverityColor(report.severity) + '20' },
                    ] as any}
                    textStyle={{ color: getSeverityColor(report.severity) }}
                  >
                    {report.severity} Severity
                  </Badge>
                  <Badge
                    style={styles.typeBadge}
                    textStyle={{ color: colors.textSecondary }}
                  >
                    {report.reportType}
                  </Badge>
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
              </View>
            </View>
          </Card>

          <Spacer size="md" />

          {/* Description */}
          <Card style={styles.sectionCard}>
            <H4 style={styles.sectionTitle}>Description</H4>
            <Spacer size="sm" />
            <Body style={styles.description}>{report.description}</Body>
          </Card>

          <Spacer size="md" />

          {/* Plot Information */}
          <Card style={styles.sectionCard}>
            <H4 style={styles.sectionTitle}>Plot Information</H4>
            <Spacer size="sm" />
            <View style={styles.infoList}>
              {report.plotName && (
                <View style={styles.infoItem}>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <View style={styles.infoItemContent}>
                    <BodySmall style={styles.infoLabel}>Plot Name</BodySmall>
                    <BodySemibold>{report.plotName}</BodySemibold>
                  </View>
                </View>
              )}
              {report.plotArea && (
                <View style={styles.infoItem}>
                  <Ionicons
                    name="resize-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <View style={styles.infoItemContent}>
                    <BodySmall style={styles.infoLabel}>Area</BodySmall>
                    <BodySemibold>{report.plotArea} ha</BodySemibold>
                  </View>
                </View>
              )}
              {report.coordinates && (
                <View style={styles.infoItem}>
                  <Ionicons
                    name="map-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <View style={styles.infoItemContent}>
                    <BodySmall style={styles.infoLabel}>Coordinates</BodySmall>
                    <BodySmall style={styles.coordinatesText}>
                      {report.coordinates}
                    </BodySmall>
                  </View>
                </View>
              )}
              {report.cultivationPlanName && (
                <View style={styles.infoItem}>
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <View style={styles.infoItemContent}>
                    <BodySmall style={styles.infoLabel}>Cultivation Plan</BodySmall>
                    <BodySemibold>{report.cultivationPlanName}</BodySemibold>
                  </View>
                </View>
              )}
              {report.affectedTaskName && (
                <View style={styles.infoItem}>
                  <Ionicons
                    name="list-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <View style={styles.infoItemContent}>
                    <BodySmall style={styles.infoLabel}>Affected Task</BodySmall>
                    <BodySemibold>{report.affectedTaskVersionName}</BodySemibold>
                    <BodySemibold>{report.affectedTaskName}</BodySemibold>
                    {report.affectedTaskType && (
                      <BodySmall style={styles.taskTypeText}>
                        {report.affectedTaskType}
                      </BodySmall>
                    )}
                  </View>
                </View>
              )}
            </View>
          </Card>

          <Spacer size="md" />

          {/* Reporter Information */}
          <Card style={styles.sectionCard}>
            <H4 style={styles.sectionTitle}>Reporter Information</H4>
            <Spacer size="sm" />
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={colors.textSecondary}
                />
                <View style={styles.infoItemContent}>
                  <BodySmall style={styles.infoLabel}>Reported By</BodySmall>
                  <BodySemibold>{report.reportedBy}</BodySemibold>
                </View>
              </View>
              {report.reportedByRole && (
                <View style={styles.infoItem}>
                  <Ionicons
                    name="briefcase-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <View style={styles.infoItemContent}>
                    <BodySmall style={styles.infoLabel}>Role</BodySmall>
                    <BodySemibold>{report.reportedByRole}</BodySemibold>
                  </View>
                </View>
              )}
              <View style={styles.infoItem}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={colors.textSecondary}
                />
                <View style={styles.infoItemContent}>
                  <BodySmall style={styles.infoLabel}>Reported At</BodySmall>
                  <BodySemibold>{formatDate(report.reportedAt)}</BodySemibold>
                </View>
              </View>
              {report.farmerName && (
                <View style={styles.infoItem}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <View style={styles.infoItemContent}>
                    <BodySmall style={styles.infoLabel}>Farmer</BodySmall>
                    <BodySemibold>{report.farmerName}</BodySemibold>
                  </View>
                </View>
              )}
              {report.clusterName && (
                <View style={styles.infoItem}>
                  <Ionicons
                    name="business-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <View style={styles.infoItemContent}>
                    <BodySmall style={styles.infoLabel}>Cluster</BodySmall>
                    <BodySemibold>{report.clusterName}</BodySemibold>
                  </View>
                </View>
              )}
            </View>
          </Card>

          <Spacer size="md" />

          {/* Images */}
          {report.images && report.images.length > 0 && (
            <>
              <Card style={styles.sectionCard}>
                <H4 style={styles.sectionTitle}>Attached Images</H4>
                <Spacer size="sm" />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.imagesContainer}
                >
                  {report.images.map((image, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => setSelectedPhoto(image)}
                    >
                      <Image source={{ uri: image }} style={styles.image} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Card>
              <Spacer size="md" />
            </>
          )}

          {/* Resolution Information */}
          {report.status === 'Resolved' && report.resolvedBy && (
            <>
              <Card style={[styles.sectionCard, styles.resolutionCard] as any}>
                <H4 style={[styles.sectionTitle, { color: colors.success }]}>
                  Resolution Information
                </H4>
                <Spacer size="sm" />
                <View style={styles.infoList}>
                  <View style={styles.infoItem}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color={colors.success}
                    />
                    <View style={styles.infoItemContent}>
                      <BodySmall style={styles.infoLabel}>Resolved By</BodySmall>
                      <BodySemibold>{report.resolvedBy}</BodySemibold>
                    </View>
                  </View>
                  {report.resolvedAt && (
                    <View style={styles.infoItem}>
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color={colors.success}
                      />
                      <View style={styles.infoItemContent}>
                        <BodySmall style={styles.infoLabel}>Resolved At</BodySmall>
                        <BodySemibold>{formatDate(report.resolvedAt)}</BodySemibold>
                      </View>
                    </View>
                  )}
                  {report.resolutionNotes && (
                    <View style={styles.infoItem}>
                      <Ionicons
                        name="document-text-outline"
                        size={18}
                        color={colors.success}
                      />
                      <View style={styles.infoItemContent}>
                        <BodySmall style={styles.infoLabel}>Resolution Notes</BodySmall>
                        <Body style={styles.resolutionNotes}>
                          {report.resolutionNotes}
                        </Body>
                      </View>
                    </View>
                  )}
                </View>
              </Card>
              <Spacer size="md" />
            </>
          )}

          <Spacer size="xl" />
        </ScrollView>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  backText: {
    marginLeft: spacing.xs,
    color: greenTheme.primary,
  },
  titleCard: {
    ...shadows.sm,
  },
  titleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reportIcon: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    backgroundColor: greenTheme.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  reportIconText: {
    fontSize: 24,
  },
  titleContent: {
    flex: 1,
  },
  title: {
    marginBottom: spacing.sm,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.background,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sectionCard: {
    ...shadows.sm,
  },
  sectionTitle: {
    marginBottom: spacing.xs,
  },
  description: {
    lineHeight: 22,
    color: colors.textPrimary,
  },
  infoList: {
    gap: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoItemContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  infoLabel: {
    color: colors.textSecondary,
    marginBottom: 2,
  },
  coordinatesText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  taskTypeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  resolutionCard: {
    backgroundColor: '#D1FAE5',
    borderColor: colors.success,
    borderWidth: 1,
  },
  resolutionNotes: {
    lineHeight: 20,
    marginTop: 4,
  },
  imagesContainer: {
    paddingRight: spacing.md,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
    backgroundColor: colors.background,
  },
  resolveButton: {
    backgroundColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalLabel: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: greenTheme.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
    color: colors.textPrimary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    flex: 1,
  },
  modalButtonPrimary: {
    backgroundColor: colors.success,
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

