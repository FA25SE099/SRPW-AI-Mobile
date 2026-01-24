/**
 * Farm Logs Review Screen
 * Review and verify farm logs submitted by farmers
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import {
  Container,
  H3,
  Body,
  BodySmall,
  BodySemibold,
  Card,
  Badge,
  Spacer,
  Button,
} from '../../components/ui';
import { useUser } from '../../libs/auth';

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

// Mock data - will be replaced with API calls
const mockFarmLogs = [
  {
    id: '1',
    farmerName: 'Nguyen Van A',
    plotName: 'Thửa 16, Tờ 58',
    taskName: 'Fertilizing',
    loggedDate: '2024-01-15',
    completionPercentage: 100,
    actualAreaCovered: 2.5,
    workDescription: 'Applied NPK fertilizer as planned',
    photoUrls: [
      'https://via.placeholder.com/300',
      'https://via.placeholder.com/300',
    ],
    status: 'pending',
    materials: [
      { name: 'NPK 20-20-20', quantity: 50, unit: 'kg' },
    ],
  },
  {
    id: '2',
    farmerName: 'Tran Thi B',
    plotName: 'Thửa 11, Tờ 12',
    taskName: 'Spraying',
    loggedDate: '2024-01-14',
    completionPercentage: 85,
    actualAreaCovered: 1.8,
    workDescription: 'Sprayed pesticide for pest control',
    photoUrls: ['https://via.placeholder.com/300'],
    status: 'approved',
    materials: [
      { name: 'Pesticide X', quantity: 2, unit: 'L' },
    ],
  },
];

export const FarmLogsReviewScreen = () => {
  const router = useRouter();
  const { data: user } = useUser();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>(
    'all',
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState<{ [key: string]: number }>({});

  // TODO: Replace with actual API call
  // const { data: farmLogs, isLoading, isError } = useQuery({
  //   queryKey: ['supervisor-farm-logs', user?.id, statusFilter],
  //   queryFn: () => getSupervisedFarmLogs({ supervisorId: user?.id, status: statusFilter }),
  // });

  const filteredLogs = mockFarmLogs.filter((log) => {
    if (statusFilter === 'all') return true;
    return log.status === statusFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'approved':
        return colors.success;
      case 'rejected':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const handleApprove = (logId: string) => {
    // TODO: Implement approval API call
    console.log('Approve log:', logId);
  };

  const handleReject = (logId: string) => {
    // TODO: Implement rejection API call
    console.log('Reject log:', logId);
  };

  const getImageIndex = (logId: string) => selectedImageIndex[logId] || 0;

  const setImageIndex = (logId: string, index: number) => {
    setSelectedImageIndex((prev) => ({ ...prev, [logId]: index }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Container padding="lg">
        {/* Header */}
        <View style={styles.header}>
          <H3>Xem xét Nhật ký Nông trại</H3>
          <BodySmall color={colors.textSecondary}>
            {filteredLogs.length} nhật ký
          </BodySmall>
        </View>

        <Spacer size="lg" />

        {/* Status Filters */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => setStatusFilter('all')}
            style={[
              styles.filterChip,
              statusFilter === 'all' && styles.filterChipActive,
            ]}
          >
            <BodySmall color={statusFilter === 'all' ? colors.white : colors.textDark}>
              Tất cả
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setStatusFilter('pending')}
            style={[
              styles.filterChip,
              statusFilter === 'pending' && styles.filterChipActive,
            ]}
          >
            <BodySmall color={statusFilter === 'pending' ? colors.white : colors.textDark}>
              Chờ duyệt
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setStatusFilter('approved')}
            style={[
              styles.filterChip,
              statusFilter === 'approved' && styles.filterChipActive,
            ]}
          >
            <BodySmall color={statusFilter === 'approved' ? colors.white : colors.textDark}>
              Đã duyệt
            </BodySmall>
          </TouchableOpacity>
        </View>

        <Spacer size="lg" />

        {/* Farm Logs List */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {filteredLogs.map((log) => {
            const currentImageIndex = getImageIndex(log.id);
            const currentImage = log.photoUrls[currentImageIndex];

            return (
              <Card key={log.id} variant="elevated" style={styles.logCard}>
                <View style={styles.logHeader}>
                  <View style={styles.logInfo}>
                    <BodySemibold>{log.farmerName}</BodySemibold>
                    <BodySmall color={colors.textSecondary}>
                      {log.plotName} • {log.taskName}
                    </BodySmall>
                  </View>
                  <Badge
                    variant="outline"
                    style={[styles.statusBadge, { borderColor: getStatusColor(log.status) }]}
                  >
                    <BodySmall style={{ color: getStatusColor(log.status) }}>
                      {log.status}
                    </BodySmall>
                  </Badge>
                </View>

                <Spacer size="md" />

                <View style={styles.logDetails}>
                  <View style={styles.logDetailItem}>
                    <BodySmall color={colors.textSecondary}>Ngày:</BodySmall>
                    <BodySmall>{dayjs(log.loggedDate).format('MMM DD, YYYY')}</BodySmall>
                  </View>
                  <View style={styles.logDetailItem}>
                    <BodySmall color={colors.textSecondary}>Hoàn thành:</BodySmall>
                    <BodySmall>{log.completionPercentage}%</BodySmall>
                  </View>
                  <View style={styles.logDetailItem}>
                    <BodySmall color={colors.textSecondary}>Diện tích:</BodySmall>
                    <BodySmall>{log.actualAreaCovered} ha</BodySmall>
                  </View>
                </View>

                <Spacer size="md" />

                {log.workDescription && (
                  <>
                    <BodySmall color={colors.textSecondary}>Mô tả:</BodySmall>
                    <Spacer size="xs" />
                    <Body>{log.workDescription}</Body>
                    <Spacer size="md" />
                  </>
                )}

                {log.materials && log.materials.length > 0 && (
                  <>
                    <BodySmall color={colors.textSecondary}>Vật tư Đã sử dụng:</BodySmall>
                    <Spacer size="xs" />
                    {log.materials.map((material, idx) => (
                      <Body key={idx} style={styles.materialItem}>
                        • {material.name}: {material.quantity} {material.unit}
                      </Body>
                    ))}
                    <Spacer size="md" />
                  </>
                )}

                {log.photoUrls && log.photoUrls.length > 0 && (
                  <>
                    <BodySmall color={colors.textSecondary}>Ảnh:</BodySmall>
                    <Spacer size="sm" />
                    <View style={styles.imageContainer}>
                      <Image source={{ uri: currentImage }} style={styles.image} />
                      {log.photoUrls.length > 1 && (
                        <View style={styles.imageControls}>
                          <TouchableOpacity
                            onPress={() =>
                              setImageIndex(
                                log.id,
                                currentImageIndex > 0
                                  ? currentImageIndex - 1
                                  : log.photoUrls.length - 1,
                              )
                            }
                            style={styles.imageControlButton}
                          >
                            <Body>←</Body>
                          </TouchableOpacity>
                          <BodySmall color={colors.textSecondary}>
                            {currentImageIndex + 1} / {log.photoUrls.length}
                          </BodySmall>
                          <TouchableOpacity
                            onPress={() =>
                              setImageIndex(
                                log.id,
                                currentImageIndex < log.photoUrls.length - 1
                                  ? currentImageIndex + 1
                                  : 0,
                              )
                            }
                            style={styles.imageControlButton}
                          >
                            <Body>→</Body>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                    <Spacer size="md" />
                  </>
                )}

                {log.status === 'pending' && (
                  <View style={styles.actionButtons}>
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => handleReject(log.id)}
                      style={[styles.actionButton, { borderColor: colors.error }]}
                    >
                      <BodySmall style={{ color: colors.error }}>Từ chối</BodySmall>
                    </Button>
                    <Button
                      size="sm"
                      onPress={() => handleApprove(log.id)}
                      style={styles.actionButton}
                    >
                      <BodySmall color={colors.white}>Duyệt</BodySmall>
                    </Button>
                  </View>
                )}
              </Card>
            );
          })}
        </ScrollView>
      </Container>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: greenTheme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: greenTheme.cardBackground,
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  filterChipActive: {
    backgroundColor: greenTheme.primary,
    borderColor: greenTheme.primary,
  },
  logCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: greenTheme.cardBackground,
    borderWidth: 1,
    borderColor: greenTheme.border,
    borderRadius: borderRadius.md,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logInfo: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  logDetails: {
    flexDirection: 'row',
    gap: spacing.lg,
    flexWrap: 'wrap',
  },
  logDetailItem: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  materialItem: {
    marginLeft: spacing.sm,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.backgroundSecondary,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  imageControls: {
    position: 'absolute',
    bottom: spacing.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: spacing.sm,
  },
  imageControlButton: {
    padding: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  actionButton: {
    flex: 1,
  },
});

