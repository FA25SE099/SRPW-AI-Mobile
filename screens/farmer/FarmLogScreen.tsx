/**
 * Farm Log Screen
 * Record and view farm activities
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  useWindowDimensions,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
import { FarmLogDetailResponse, FarmerPlot, PlotCultivationPlan } from '../../types/api';
import { getFarmLogsByCultivation, getCurrentFarmerPlots, getPlotCultivationPlans } from '../../libs/farmer';

export const FarmLogScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    plotCultivationId?: string;
  }>();
  const [currentPage, setCurrentPage] = useState(1);
  const [allFarmLogs, setAllFarmLogs] = useState<FarmLogDetailResponse[]>([]);
  const [selectedPlotCultivationId, setSelectedPlotCultivationId] = useState<string | null>(
    params.plotCultivationId || null,
  );
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [showPlotPicker, setShowPlotPicker] = useState(false);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const pageSize = 10;

  // Always fetch plots to show plot selector
  const {
    data: plots,
    isLoading: plotsLoading,
    error: plotsError,
  } = useQuery({
    queryKey: ['farmer-plots', { page: 1, size: 100 }],
    queryFn: () => getCurrentFarmerPlots({ currentPage: 1, pageSize: 100 }),
  });

  // Fetch cultivation plans for the selected plot
  const {
    data: cultivationPlansData,
    isLoading: plansLoading,
  } = useQuery({
    queryKey: ['plot-plans', selectedPlotId],
    queryFn: () => {
      if (!selectedPlotId) return null;
      return getPlotCultivationPlans(selectedPlotId, { currentPage: 1, pageSize: 100 });
    },
    enabled: Boolean(selectedPlotId),
  });

  // Auto-select first plot if not provided and plots are loaded
  useEffect(() => {
    if (!selectedPlotId && plots && plots.length > 0) {
      setSelectedPlotId(plots[0].plotId);
    }
  }, [plots, selectedPlotId]);

  // Auto-select first cultivation plan if available
  useEffect(() => {
    if (!selectedPlotCultivationId && cultivationPlansData?.data && cultivationPlansData.data.length > 0) {
      setSelectedPlotCultivationId(cultivationPlansData.data[0].plotCultivationId);
    }
  }, [cultivationPlansData, selectedPlotCultivationId]);

  // Fetch farm logs by cultivation
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['farm-logs-by-cultivation', selectedPlotCultivationId, currentPage],
    queryFn: () => {
      if (!selectedPlotCultivationId) {
        throw new Error('Plot cultivation ID is required');
      }
      return getFarmLogsByCultivation({
        plotCultivationId: selectedPlotCultivationId,
        currentPage,
        pageSize,
      });
    },
    enabled: Boolean(selectedPlotCultivationId),
  });

  // Sync data from query result to local state
  useEffect(() => {
    if (data) {
      if (currentPage === 1) {
        setAllFarmLogs(data.data || []);
      } else {
        setAllFarmLogs((prev) => [...prev, ...(data.data || [])]);
      }
    }
  }, [data, currentPage]);

  const farmLogs = allFarmLogs;
  const hasMore = data?.hasNext || false;

  // Get selected plot for display
  const selectedPlot = plots?.find((p: FarmerPlot) => p.plotId === selectedPlotId);
  const getPlotDisplayName = (plot: FarmerPlot | undefined) => {
    if (!plot) return 'Chọn thửa đất';
    if (plot.soThua && plot.soTo) {
      return `So thua ${plot.soThua} / So to ${plot.soTo}`;
    }
    return plot.groupName || 'Thửa đất';
  };

  const getActivityIcon = (taskName: string) => {
    const lowerName = taskName.toLowerCase();
    if (lowerName.includes('bón') || lowerName.includes('phân')) {
      return { name: 'water-outline', library: 'Ionicons' };
    }
    if (lowerName.includes('phun') || lowerName.includes('thuốc')) {
      return { name: 'spray', library: 'MaterialCommunityIcons' };
    }
    if (lowerName.includes('tưới') || lowerName.includes('tiêu')) {
      return { name: 'water', library: 'Ionicons' };
    }
    if (lowerName.includes('thu hoạch')) {
      return { name: 'leaf-outline', library: 'Ionicons' };
    }
    if (lowerName.includes('gieo') || lowerName.includes('trồng')) {
      return { name: 'seed-outline', library: 'MaterialCommunityIcons' };
    }
    return { name: 'document-text-outline', library: 'Ionicons' };
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '0₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Show loading/selection UI if plotCultivationId is missing
  if (!selectedPlotCultivationId) {
    return (
      <SafeAreaView style={styles.container}>
        <Container padding="lg">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Body>←</Body>
            </TouchableOpacity>
            <H3 style={styles.headerTitle}>Nhật ký nông trại</H3>
            <View style={styles.addButton} />
          </View>
          <Spacer size="xl" />
          
          {plotsLoading || plansLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={greenTheme.primary} />
              <Spacer size="md" />
              <BodySmall color={colors.textSecondary}>Đang tải thông tin...</BodySmall>
            </View>
          ) : plotsError ? (
            <Card variant="elevated" style={styles.errorCard}>
              <BodySemibold>Không thể tải thông tin</BodySemibold>
              <Spacer size="xs" />
              <BodySmall color={colors.textSecondary}>
                Vui lòng kiểm tra kết nối của bạn và thử lại.
              </BodySmall>
            </Card>
          ) : cultivationPlansData?.data && cultivationPlansData.data.length > 0 ? (
            <Card variant="elevated" style={styles.selectionCard}>
              <BodySemibold style={styles.selectionTitle}>Chọn kế hoạch canh tác</BodySemibold>
              <Spacer size="md" />
              {cultivationPlansData.data.map((plan: PlotCultivationPlan) => (
                <TouchableOpacity
                  key={plan.plotCultivationId}
                  onPress={() => {
                    setSelectedPlotCultivationId(plan.plotCultivationId);
                    setCurrentPage(1);
                    setAllFarmLogs([]);
                  }}
                  style={styles.planOption}
                >
                  <View style={styles.planOptionContent}>
                    <BodySemibold>{plan.productionPlanName}</BodySemibold>
                    <BodySmall color={colors.textSecondary}>
                      {plan.seasonName} • {plan.riceVarietyName}
                    </BodySmall>
                    {plan.area && (
                      <BodySmall color={colors.textSecondary}>
                        Diện tích: {plan.area.toFixed(2)} ha
                      </BodySmall>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={greenTheme.primary} />
                </TouchableOpacity>
              ))}
            </Card>
          ) : (
            <Card variant="elevated" style={styles.errorCard}>
              <BodySemibold>Không có kế hoạch canh tác</BodySemibold>
              <Spacer size="xs" />
              <BodySmall color={colors.textSecondary}>
                Chưa có kế hoạch canh tác nào để xem nhật ký.
              </BodySmall>
            </Card>
          )}
        </Container>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Container padding="lg">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Body>←</Body>
          </TouchableOpacity>
          <H3 style={styles.headerTitle}>Nhật ký nông trại</H3>
          <View style={styles.addButton} />
        </View>

        <Spacer size="lg" />

        {/* Plot Selector */}
        {plots && plots.length > 0 && (
          <>
            <TouchableOpacity
              onPress={() => setShowPlotPicker(!showPlotPicker)}
              style={styles.selector}
            >
              <View style={styles.selectorContent}>
                <Ionicons name="location-outline" size={20} color={greenTheme.primary} />
                <View style={styles.selectorText}>
                  <BodySmall color={colors.textSecondary}>Thửa đất</BodySmall>
                  <BodySemibold>
                    {getPlotDisplayName(selectedPlot)}
                  </BodySemibold>
                </View>
              </View>
              <Ionicons 
                name={showPlotPicker ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={greenTheme.primary} 
              />
            </TouchableOpacity>
            {showPlotPicker && (
              <Card variant="elevated" style={styles.pickerCard}>
                <ScrollView nestedScrollEnabled style={{ maxHeight: verticalScale(200) }}>
                  {plots.map((plot: FarmerPlot) => (
                    <TouchableOpacity
                      key={plot.plotId}
                      onPress={() => {
                        setSelectedPlotId(plot.plotId);
                        setSelectedPlotCultivationId(null); // Reset plan selection
                        setCurrentPage(1);
                        setAllFarmLogs([]);
                        setShowPlotPicker(false);
                      }}
                      style={[
                        styles.pickerOption,
                        selectedPlotId === plot.plotId && styles.pickerOptionSelected,
                      ]}
                    >
                      <View style={styles.planOptionContent}>
                        <BodySemibold>
                          {getPlotDisplayName(plot)}
                        </BodySemibold>
                        <BodySmall color={colors.textSecondary}>
                          {plot.area.toFixed(2)} ha
                        </BodySmall>
                      </View>
                      {selectedPlotId === plot.plotId && (
                        <Ionicons name="checkmark-circle" size={20} color={greenTheme.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Card>
            )}
            <Spacer size="md" />
          </>
        )}

        {/* Cultivation Plan Selector */}
        {cultivationPlansData?.data && cultivationPlansData.data.length > 0 && (
          <>
            <TouchableOpacity
              onPress={() => setShowPlanPicker(!showPlanPicker)}
              style={styles.selector}
            >
              <View style={styles.selectorContent}>
                <Ionicons name="calendar-outline" size={20} color={greenTheme.primary} />
                <View style={styles.selectorText}>
                  <BodySmall color={colors.textSecondary}>Kế hoạch canh tác</BodySmall>
                  <BodySemibold>
                    {cultivationPlansData.data.find(
                      (p: PlotCultivationPlan) => p.plotCultivationId === selectedPlotCultivationId,
                    )?.productionPlanName || 'Chọn kế hoạch'}
                  </BodySemibold>
                </View>
              </View>
              <Ionicons 
                name={showPlanPicker ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={greenTheme.primary} 
              />
            </TouchableOpacity>
            {showPlanPicker && (
              <Card variant="elevated" style={styles.pickerCard}>
                <ScrollView nestedScrollEnabled style={{ maxHeight: verticalScale(200) }}>
                  {cultivationPlansData.data.map((plan: PlotCultivationPlan) => (
                    <TouchableOpacity
                      key={plan.plotCultivationId}
                      onPress={() => {
                        setSelectedPlotCultivationId(plan.plotCultivationId);
                        setCurrentPage(1);
                        setAllFarmLogs([]);
                        setShowPlanPicker(false);
                      }}
                      style={[
                        styles.pickerOption,
                        selectedPlotCultivationId === plan.plotCultivationId && styles.pickerOptionSelected,
                      ]}
                    >
                      <View style={styles.planOptionContent}>
                        <BodySemibold>{plan.productionPlanName}</BodySemibold>
                        <BodySmall color={colors.textSecondary}>
                          {plan.seasonName} • {plan.riceVarietyName}
                        </BodySmall>
                        {plan.area && (
                          <BodySmall color={colors.textSecondary}>
                            Diện tích: {plan.area.toFixed(2)} ha
                          </BodySmall>
                        )}
                      </View>
                      {selectedPlotCultivationId === plan.plotCultivationId && (
                        <Ionicons name="checkmark-circle" size={20} color={greenTheme.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Card>
            )}
            <Spacer size="lg" />
          </>
        )}

        {/* Loading state when selecting */}
        {(plotsLoading || plansLoading) && !selectedPlotCultivationId && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={greenTheme.primary} />
            <Spacer size="md" />
            <BodySmall color={colors.textSecondary}>Đang tải thông tin...</BodySmall>
          </View>
        )}

        {/* Error state */}
        {plotsError && (
          <Card variant="elevated" style={styles.errorCard}>
            <BodySemibold>Không thể tải thông tin</BodySemibold>
            <Spacer size="xs" />
            <BodySmall color={colors.textSecondary}>
              Vui lòng kiểm tra kết nối của bạn và thử lại.
            </BodySmall>
          </Card>
        )}

        {/* Show message if no plan selected */}
        {!selectedPlotCultivationId && !plotsLoading && !plansLoading && cultivationPlansData?.data && cultivationPlansData.data.length === 0 && (
          <Card variant="elevated" style={styles.errorCard}>
            <BodySemibold>Không có kế hoạch canh tác</BodySemibold>
            <Spacer size="xs" />
            <BodySmall color={colors.textSecondary}>
              Thửa đất đã chọn chưa có kế hoạch canh tác nào.
            </BodySmall>
          </Card>
        )}

        <Spacer size="lg" />

        {/* Summary Card */}
        {!isLoading && farmLogs.length > 0 && (
          <Card variant="elevated" style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View>
                <BodySmall color={colors.textSecondary}>Tổng nhật ký</BodySmall>
                <BodySemibold style={styles.summaryNumber}>
                  {data?.totalCount || farmLogs.length}
                </BodySemibold>
              </View>
              <View>
                <BodySmall color={colors.textSecondary}>Hoàn thành</BodySmall>
                <BodySemibold style={styles.summaryNumber} color={greenTheme.primary}>
                  {farmLogs.filter(log => log.completionPercentage === 100).length}
                </BodySemibold>
              </View>
            </View>
          </Card>
        )}

        <Spacer size="lg" />

        {/* Loading State */}
        {isLoading && farmLogs.length === 0 && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={greenTheme.primary} />
            <Spacer size="md" />
            <BodySmall color={colors.textSecondary}>Đang tải nhật ký...</BodySmall>
          </View>
        )}

        {/* Error State */}
        {isError && farmLogs.length === 0 && (
          <Card variant="elevated" style={styles.errorCard}>
            <BodySemibold>Không thể tải nhật ký</BodySemibold>
            <Spacer size="xs" />
            <BodySmall color={colors.textSecondary}>
              Vui lòng kiểm tra kết nối của bạn và thử lại.
            </BodySmall>
            <Spacer size="md" />
            <Button onPress={() => {
              setCurrentPage(1);
              setAllFarmLogs([]);
              refetch();
            }} size="sm">
              Thử lại
            </Button>
          </Card>
        )}

        {/* Farm Logs List */}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={isRefetching} 
              onRefresh={() => {
                setCurrentPage(1);
                setAllFarmLogs([]);
                refetch();
              }} 
            />
          }
        >
          {farmLogs.length === 0 && !isLoading && (
            <Card variant="flat" style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
              <Spacer size="md" />
              <BodySemibold>Chưa có nhật ký</BodySemibold>
              <Spacer size="xs" />
              <BodySmall color={colors.textSecondary} style={styles.emptyText}>
                Các nhật ký nông trại sẽ hiển thị ở đây.
              </BodySmall>
            </Card>
          )}

          {farmLogs.map((log) => {
            const icon = getActivityIcon(log.cultivationTaskName);
            return (
              <TouchableOpacity key={log.farmLogId}>
                <Card variant="elevated" style={styles.activityCard}>
                  <View style={styles.activityCardHeader}>
                    <View style={styles.activityIcon}>
                      {icon.library === 'Ionicons' ? (
                        <Ionicons name={icon.name as any} size={24} color={greenTheme.primary} />
                      ) : (
                        <MaterialCommunityIcons name={icon.name as any} size={24} color={greenTheme.primary} />
                      )}
                    </View>
                    <View style={styles.activityHeaderInfo}>
                      <BodySemibold>{log.cultivationTaskName}</BodySemibold>
                      <BodySmall color={colors.textSecondary}>
                        {log.plotName}
                      </BodySmall>
                      <BodySmall color={colors.textSecondary}>
                        {dayjs(log.loggedDate).format('DD/MM/YYYY HH:mm')}
                      </BodySmall>
                    </View>
                    <Badge
                      variant="primary"
                      size="sm"
                      style={
                        log.completionPercentage === 100 
                          ? styles.completionBadgeFull 
                          : styles.completionBadge
                      }
                    >
                      {log.completionPercentage}%
                    </Badge>
                  </View>
                  <Spacer size="md" />
                  <View style={styles.activityDetails}>
                    {log.workDescription && (
                      <View style={styles.activityDetailRow}>
                        <BodySmall color={colors.textSecondary}>Mô tả:</BodySmall>
                        <BodySemibold style={{ flex: 1, textAlign: 'right' }}>
                          {log.workDescription}
                        </BodySemibold>
                      </View>
                    )}
                    {log.actualAreaCovered && (
                      <View style={styles.activityDetailRow}>
                        <BodySmall color={colors.textSecondary}>Diện tích:</BodySmall>
                        <BodySemibold>{log.actualAreaCovered} ha</BodySemibold>
                      </View>
                    )}
                    {log.weatherConditions && (
                      <View style={styles.activityDetailRow}>
                        <BodySmall color={colors.textSecondary}>Thời tiết:</BodySmall>
                        <BodySemibold>{log.weatherConditions}</BodySemibold>
                      </View>
                    )}
                    {log.materialsUsed && log.materialsUsed.length > 0 && (
                      <View style={styles.materialsSection}>
                        <BodySmall color={greenTheme.primary} style={styles.materialsTitle}>
                          Vật liệu đã sử dụng:
                        </BodySmall>
                        {log.materialsUsed.map((material, index) => (
                          <View key={index} style={styles.materialItem}>
                            <BodySemibold>{material.materialName}</BodySemibold>
                            <BodySmall color={colors.textSecondary}>
                              SL: {material.actualQuantityUsed.toLocaleString()} • 
                              Chi phí: {formatCurrency(material.actualCost)}
                            </BodySmall>
                            {material.notes && (
                              <BodySmall color={colors.textSecondary} style={styles.materialNotes}>
                                Ghi chú: {material.notes}
                              </BodySmall>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                    {log.photoUrls && log.photoUrls.length > 0 && (
                      <View style={styles.photosSection}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {log.photoUrls.map((photoUrl, index) => (
                            <Image
                              key={index}
                              source={{ uri: photoUrl }}
                              style={styles.photoThumbnail}
                              resizeMode="cover"
                            />
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </Card>
                <Spacer size="md" />
              </TouchableOpacity>
            );
          })}

          {/* Load More Button */}
          {hasMore && farmLogs.length > 0 && (
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

// Green theme colors for farmer-friendly design
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: greenTheme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: getSpacing(spacing.md),
    backgroundColor: greenTheme.cardBackground,
    paddingBottom: getSpacing(spacing.sm),
    borderBottomWidth: 1,
    borderBottomColor: greenTheme.border,
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(borderRadius.full),
    backgroundColor: greenTheme.primaryLighter,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: getFontSize(20),
    color: greenTheme.primary,
    fontWeight: '700',
  },
  addButton: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(borderRadius.full),
    backgroundColor: greenTheme.primaryLighter,
  },
  summaryCard: {
    padding: getSpacing(spacing.lg),
    borderRadius: moderateScale(borderRadius.lg),
    backgroundColor: greenTheme.cardBackground,
    borderWidth: 1,
    borderColor: greenTheme.border,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryNumber: {
    fontSize: getFontSize(24),
    marginTop: getSpacing(spacing.xs),
    color: greenTheme.primary,
  },
  activityCard: {
    padding: getSpacing(spacing.md),
    borderRadius: moderateScale(borderRadius.lg),
    backgroundColor: greenTheme.cardBackground,
    borderWidth: 1,
    borderColor: greenTheme.border,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(spacing.md),
  },
  activityIcon: {
    width: scale(48),
    height: scale(48),
    borderRadius: moderateScale(borderRadius.md),
    backgroundColor: greenTheme.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityHeaderInfo: {
    flex: 1,
  },
  costBadge: {
    alignSelf: 'flex-start',
    backgroundColor: greenTheme.primaryLight,
  },
  activityDetails: {
    gap: getSpacing(spacing.sm),
  },
  activityDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityNotes: {
    marginTop: getSpacing(spacing.xs),
    padding: getSpacing(spacing.sm),
    backgroundColor: greenTheme.primaryLighter,
    borderRadius: moderateScale(borderRadius.sm),
    borderWidth: 1,
    borderColor: greenTheme.border,
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
  completionBadge: {
    backgroundColor: greenTheme.primaryLight,
  },
  completionBadgeFull: {
    backgroundColor: greenTheme.success,
  },
  materialsSection: {
    marginTop: getSpacing(spacing.sm),
    padding: getSpacing(spacing.sm),
    backgroundColor: greenTheme.primaryLighter,
    borderRadius: moderateScale(borderRadius.md),
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  materialsTitle: {
    fontWeight: '700',
    marginBottom: getSpacing(spacing.xs),
  },
  materialItem: {
    marginTop: getSpacing(spacing.xs),
    paddingTop: getSpacing(spacing.xs),
    borderTopWidth: 1,
    borderTopColor: greenTheme.border,
  },
  materialNotes: {
    marginTop: getSpacing(4),
    fontStyle: 'italic',
  },
  photosSection: {
    marginTop: getSpacing(spacing.sm),
  },
  photoThumbnail: {
    width: scale(80),
    height: scale(80),
    borderRadius: moderateScale(borderRadius.md),
    marginRight: getSpacing(spacing.sm),
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  selectionCard: {
    padding: getSpacing(spacing.lg),
  },
  selectionTitle: {
    fontSize: getFontSize(18),
    color: greenTheme.primary,
    marginBottom: getSpacing(spacing.sm),
  },
  planOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: getSpacing(spacing.md),
    marginBottom: getSpacing(spacing.sm),
    backgroundColor: greenTheme.primaryLighter,
    borderRadius: moderateScale(borderRadius.md),
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  planOptionContent: {
    flex: 1,
    gap: getSpacing(spacing.xs),
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: getSpacing(spacing.md),
    backgroundColor: greenTheme.cardBackground,
    borderRadius: moderateScale(borderRadius.md),
    borderWidth: 1,
    borderColor: greenTheme.border,
    marginBottom: getSpacing(spacing.sm),
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(spacing.sm),
    flex: 1,
  },
  selectorText: {
    flex: 1,
    gap: 2,
  },
  pickerCard: {
    marginTop: getSpacing(spacing.sm),
    marginBottom: getSpacing(spacing.md),
    padding: getSpacing(spacing.sm),
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: getSpacing(spacing.md),
    marginBottom: getSpacing(spacing.xs),
    backgroundColor: greenTheme.primaryLighter,
    borderRadius: moderateScale(borderRadius.md),
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  pickerOptionSelected: {
    backgroundColor: greenTheme.primary + '20',
    borderColor: greenTheme.primary,
  },
});

