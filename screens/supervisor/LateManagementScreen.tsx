/**
 * Late Management Screen
 * Track and manage farmers and plots with late task submissions
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, borderRadius } from '@/theme';
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
} from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import {
  getLateFarmers,
  getLatePlots,
} from '@/libs/supervisor';
import { LateFarmerRecord, LatePlotRecord } from '@/types/api';
import { useUser } from '@/libs/auth';

type ActiveTab = 'farmers' | 'plots';

export const LateManagementScreen = () => {
  const router = useRouter();
  const user = useUser();
  const supervisorId = user.data?.id;

  const [activeTab, setActiveTab] = useState<ActiveTab>('farmers');

  // Fetch Late Farmers
  const {
    data: lateFarmers,
    isLoading: loadingFarmers,
    error: errorFarmers,
    refetch: refetchFarmers,
  } = useQuery({
    queryKey: ['late-farmers', supervisorId],
    queryFn: () => getLateFarmers({ supervisorId, pageSize: 100 }),
    enabled: !!supervisorId && activeTab === 'farmers',
    retry: false,
  });

  // Fetch Late Plots
  const {
    data: latePlots,
    isLoading: loadingPlots,
    error: errorPlots,
    refetch: refetchPlots,
  } = useQuery({
    queryKey: ['late-plots', supervisorId],
    queryFn: () => getLatePlots({ supervisorId, pageSize: 100 }),
    enabled: !!supervisorId && activeTab === 'plots',
    retry: false,
  });

  const handleRefresh = () => {
    if (activeTab === 'farmers') {
      refetchFarmers();
    } else {
      refetchPlots();
    }
  };

  const handleViewDetails = (
    id: string,
    name: string,
    type: 'farmer' | 'plot'
  ) => {
    router.push({
      pathname: '/supervisor/late-detail',
      params: { id, name, type },
    } as any);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const renderFarmerItem = ({ item }: { item: LateFarmerRecord }) => (
    <Card style={styles.listCard}>
      <TouchableOpacity
        onPress={() =>
          handleViewDetails(
            item.farmerId,
            item.fullName,
            'farmer'
          )
        }
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="person-outline" size={20} color={colors.primary} />
            <View style={styles.cardHeaderText}>
              <BodySemibold>{item.fullName}</BodySemibold>
              {item.farmCode && (
                <BodySmall style={styles.subtitle}>Mã: {item.farmCode}</BodySmall>
              )}
              <BodySmall style={styles.subtitle}>{item.phoneNumber}</BodySmall>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>

        <Spacer size="sm" />
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <BodySmall style={styles.statLabel}>Thửa</BodySmall>
            <BodySemibold style={styles.statValue}>
              {item.plotCount}
            </BodySemibold>
          </View>
          <View style={styles.statItem}>
            <BodySmall style={styles.statLabel}>Số lần Muộn</BodySmall>
            <BodySemibold style={[styles.statValue, { color: colors.error }]}>
              {item.lateCount}
            </BodySemibold>
          </View>
          <View style={styles.statItem}>
            <BodySmall style={styles.statLabel}>Trạng thái</BodySmall>
            <Badge variant={item.isActive ? 'success' : 'error'}>
              {item.isActive ? 'Hoạt động' : 'Không hoạt động'}
            </Badge>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );

  const renderPlotItem = ({ item }: { item: LatePlotRecord }) => (
    <Card style={styles.listCard}>
      <TouchableOpacity
        onPress={() =>
          handleViewDetails(
            item.plotId,
            item.plotName || 'Unknown Plot',
            'plot'
          )
        }
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="map-outline" size={20} color={colors.success} />
            <View style={styles.cardHeaderText}>
              <BodySemibold>{item.plotName || 'Unknown Plot'}</BodySemibold>
              {(item.soThua || item.soTo) && (
                <BodySmall style={styles.subtitle}>
                  Thửa {item.soThua}, Tờ {item.soTo}
                </BodySmall>
              )}
              {item.farmerName && (
                <BodySmall style={styles.subtitle}>{item.farmerName}</BodySmall>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>

        <Spacer size="sm" />
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <BodySmall style={styles.statLabel}>Diện tích</BodySmall>
            <BodySemibold style={styles.statValue}>
              {item.area ? item.area.toFixed(2) : '0.00'} ha
            </BodySemibold>
          </View>
          <View style={styles.statItem}>
            <BodySmall style={styles.statLabel}>Số lần Muộn</BodySmall>
            <BodySemibold style={[styles.statValue, { color: colors.error }]}>
              {item.lateCount}
            </BodySemibold>
          </View>
          <View style={styles.statItem}>
            <BodySmall style={styles.statLabel}>Trạng thái</BodySmall>
            <Badge variant={item.isActive ? 'success' : 'error'}>
              {item.isActive ? 'Hoạt động' : 'Không hoạt động'}
            </Badge>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );

  const isLoading = activeTab === 'farmers' ? loadingFarmers : loadingPlots;
  const data = activeTab === 'farmers' ? lateFarmers?.data : latePlots?.data;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerContainer}>
        <Spacer size="md" />

        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.dark} />
          <BodySemibold style={styles.backText}>Quay lại</BodySemibold>
        </TouchableOpacity>

        <Spacer size="sm" />
        <H3>Quản lý Muộn</H3>
        
        <Spacer size="sm" />
        <Card style={styles.descriptionCard}>
          <BodySmall style={styles.descriptionText}>
            Theo dõi và quản lý nông dân và thửa có công việc nộp muộn trong các nhóm của bạn.
            Xem bản ghi muộn chi tiết và giám sát tuân thủ.
          </BodySmall>
        </Card>

        <Spacer size="lg" />

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'farmers' && styles.activeTab]}
            onPress={() => setActiveTab('farmers')}
          >
            <Ionicons
              name="people-outline"
              size={18}
              color={activeTab === 'farmers' ? colors.primary : colors.textSecondary}
            />
            <BodySmall
              style={[
                styles.tabText,
                activeTab === 'farmers' && styles.activeTabText,
              ]}
            >
              Nông dân Muộn
            </BodySmall>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'plots' && styles.activeTab]}
            onPress={() => setActiveTab('plots')}
          >
            <Ionicons
              name="map-outline"
              size={18}
              color={activeTab === 'plots' ? colors.primary : colors.textSecondary}
            />
            <BodySmall
              style={[
                styles.tabText,
                activeTab === 'plots' && styles.activeTabText,
              ]}
            >
              Thửa Muộn
            </BodySmall>
          </TouchableOpacity>
        </View>

        <Spacer size="md" />
      </View>

      {/* Content */}
      {(activeTab === 'farmers' && errorFarmers) || (activeTab === 'plots' && errorPlots) ? (
        <Container>
          <Card style={styles.errorCard}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.warning} />
            <Spacer size="md" />
            <Body style={styles.errorText}>API Endpoint Chưa Khả dụng</Body>
            <BodySmall style={styles.errorSubtext}>
              Tính năng quản lý muộn chưa khả dụng trên backend.
              Tính năng này sẽ khả dụng sau khi các API endpoints được triển khai.
            </BodySmall>
            <Spacer size="md" />
            <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
              <Ionicons name="refresh-outline" size={20} color={colors.primary} />
              <BodySmall style={{ color: colors.primary, marginLeft: spacing.xs }}>
                Thử lại
              </BodySmall>
            </TouchableOpacity>
          </Card>
        </Container>
      ) : isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : data && data.length > 0 ? (
        activeTab === 'farmers' ? (
          <FlatList
            data={lateFarmers?.data || []}
            renderItem={renderFarmerItem}
            keyExtractor={(item) => item.farmerId}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
              />
            }
          />
        ) : (
          <FlatList
            data={latePlots?.data || []}
            renderItem={renderPlotItem}
            keyExtractor={(item) => item.plotId}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
              />
            }
          />
        )
      ) : (
        <Container>
          <Card style={styles.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
            <Spacer size="md" />
            <Body style={styles.emptyText}>
              Không tìm thấy {activeTab === 'farmers' ? 'nông dân' : 'thửa'} muộn
            </Body>
            <BodySmall style={styles.emptySubtext}>
              Tất cả công việc đang được hoàn thành đúng hạn!
            </BodySmall>
          </Card>
        </Container>
      )}
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
  headerContainer: {
    paddingHorizontal: spacing.md,
  },
  descriptionCard: {
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
  },
  descriptionText: {
    color: colors.textSecondary,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.md,
  },
  listCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  cardHeaderText: {
    flex: 1,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.sm,
  },
  statLabel: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  lastLate: {
    color: colors.textTertiary,
    fontStyle: 'italic',
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
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.white,
  },
});
