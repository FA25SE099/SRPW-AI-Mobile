/**
 * Farmer Plots Screen
 * Shows all plots for a selected farmer with map visualization
 * Allows profit calculation per plot
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  Button,
  MapboxMap,
  PolygonData,
  MarkerData,
} from '@/components/ui';
import { StandardPlan, StandardPlanMaterialCostRequest } from '@/types/api';
import {
  getFarmerPlots,
  getStandardPlans,
  calculateStandardPlanMaterialCost,
  PlotListResponse,
} from '@/libs/supervisor';
import { Ionicons } from '@expo/vector-icons';

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

// Helper function to determine status color
const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return greenTheme.success;
    case 'pendingpolygon':
      return colors.warning;
    case 'inactive':
      return colors.lightGray;
    default:
      return greenTheme.primary;
  }
};

// Helper functions for WKT parsing
const parsePointWkt = (wkt?: string | null): { latitude: number; longitude: number } | null => {
  if (!wkt) return null;
  const match = wkt.match(/POINT\s*\(\s*([0-9.+-]+)\s+([0-9.+-]+)\s*\)/i);
  if (!match) return null;
  const first = parseFloat(match[1]);
  const second = parseFloat(match[2]);
  if (Number.isNaN(first) || Number.isNaN(second)) {
    return null;
  }

  const lat = Math.abs(first) <= 90 && Math.abs(second) > 90 ? first : second;
  const lng = Math.abs(first) <= 90 && Math.abs(second) > 90 ? second : first;
  return { latitude: lat, longitude: lng };
};

const parsePolygonWkt = (
  wkt?: string | null,
): Array<{ latitude: number; longitude: number }> | null => {
  if (!wkt) return null;
  const match = wkt.match(/POLYGON\s*\(\((.+)\)\)/i);
  if (!match) return null;

  const ring = match[1]
    .split(',')
    .map((pair) => pair.trim())
    .map((pair) => {
      const [lngStr, latStr] = pair.split(/\s+/);
      const lng = parseFloat(lngStr);
      const lat = parseFloat(latStr);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return null;
      }
      return { latitude: lat, longitude: lng };
    })
    .filter((coord): coord is { latitude: number; longitude: number } => coord !== null);

  if (!ring.length) {
    return null;
  }

  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first.latitude !== last.latitude || first.longitude !== last.longitude) {
    ring.push({ ...first });
  }

  return ring;
};

export const FarmerPlotsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    farmerId: string;
    farmerName: string;
    farmCode: string;
  }>();
  const mapRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  // State management
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceReviewPlotId, setPriceReviewPlotId] = useState<string>('');
  const [selectedStandardPlan, setSelectedStandardPlan] = useState<string>('');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [priceResult, setPriceResult] = useState<any>(null);

  // Fetch standard plans
  const { data: standardPlans } = useQuery({
    queryKey: ['standard-plans'],
    queryFn: () => getStandardPlans(),
  });

  // Fetch plots for the farmer
  const { data: plotsData, isLoading: plotsLoading } = useQuery({
    queryKey: ['farmer-plots', params.farmerId],
    queryFn: () =>
      getFarmerPlots({
        farmerId: params.farmerId,
        currentPage: 1,
        pageSize: 100,
      }),
    enabled: !!params.farmerId,
    staleTime: 0,
    refetchOnMount: true,
  });

  const plots = plotsData || [];

  // Map data processing
  const pointMarkers = useMemo(() => {
    return plots
      .map((plot: any) => {
        const coordinate = parsePointWkt(plot.coordinate);
        if (!coordinate) return null;

        return {
          plotId: plot.plotId,
          coordinate,
          plotName: `Thửa ${plot.soThua}, Tờ ${plot.soTo}`,
          status: plot.status,
          groupName: plot.groupName,
        };
      })
      .filter((marker): marker is NonNullable<typeof marker> => marker !== null);
  }, [plots]);

  const polygons = useMemo(() => {
    return plots
      .map((plot: any) => {
        if (!plot.boundary) return null;
        const coords = parsePolygonWkt(plot.boundary);
        if (!coords) return null;

        return {
          plotId: plot.plotId,
          coordinates: coords,
          status: plot.status,
        };
      })
      .filter((poly): poly is NonNullable<typeof poly> => poly !== null);
  }, [plots]);

  // Convert to Mapbox format
  const mapboxPolygons = useMemo<PolygonData[]>(() => {
    return polygons.map((polygon) => ({
      id: polygon.plotId,
      coordinates: polygon.coordinates,
      strokeColor: getStatusColor(polygon.status),
      fillColor: `${getStatusColor(polygon.status)}40`,
      strokeWidth: selectedPlot === polygon.plotId ? 3 : 2,
    }));
  }, [polygons, selectedPlot]);

  const mapboxMarkers = useMemo<MarkerData[]>(() => {
    return pointMarkers.map((marker) => ({
      id: marker.plotId,
      coordinate: marker.coordinate,
      title: marker.plotName,
      description: marker.groupName,
      color: getStatusColor(marker.status),
    }));
  }, [pointMarkers]);

  const mapRegion = useMemo(() => {
    if (pointMarkers.length > 0) {
      const avgLat =
        pointMarkers.reduce((sum, m) => sum + m.coordinate.latitude, 0) /
        pointMarkers.length;
      const avgLng =
        pointMarkers.reduce((sum, m) => sum + m.coordinate.longitude, 0) /
        pointMarkers.length;
      return {
        latitude: avgLat,
        longitude: avgLng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    return {
      latitude: 10.8231,
      longitude: 106.6297,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  }, [pointMarkers]);

  // Plot marker press handler
  const handleMarkerPress = (markerId: string) => {
    setSelectedPlot(markerId);
    const plot = plots.find((p: any) => p.plotId === markerId);
    if (plot) {
      const coordinate = parsePointWkt(plot.coordinate);
      if (coordinate && cameraRef.current) {
        cameraRef.current.setCamera({
          centerCoordinate: [coordinate.longitude, coordinate.latitude],
          zoomLevel: 16,
          animationDuration: 1000,
        });
      }
    }
  };

  // Price calculation
  const handleCalculatePrice = (plotId: string) => {
    setPriceReviewPlotId(plotId);
    setShowPlanModal(true);
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedStandardPlan(planId);
    setShowPlanModal(false);
    performPriceCalculation(planId);
  };

  const performPriceCalculation = async (planId: string) => {
    const plot = plots.find((p: any) => p.plotId === priceReviewPlotId);
    if (!plot || !plot.area) {
      Alert.alert('Error', 'Plot area not found');
      return;
    }

    setIsCalculatingPrice(true);
    try {
      const request: StandardPlanMaterialCostRequest = {
        standardPlanId: planId,
        area: plot.area,
      };
      const result = await calculateStandardPlanMaterialCost(request);
      setPriceResult(result);
      setShowPriceModal(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to calculate price');
    } finally {
      setIsCalculatingPrice(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (plotsLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Container>
          <Spacer size="md" />
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.dark} />
            <BodySemibold style={styles.backText}>Back</BodySemibold>
          </TouchableOpacity>
          <Spacer size="md" />
          <H3>{params.farmerName}'s Plots</H3>
          <Spacer size="xl" />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={greenTheme.primary} />
          </View>
        </Container>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Container>
          <Spacer size="md" />

          {/* Header with Back Button */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.dark} />
            <BodySemibold style={styles.backText}>Back to Farmers</BodySemibold>
          </TouchableOpacity>

          <Spacer size="md" />

          <H3>{params.farmerName}'s Plots</H3>
          <BodySmall style={styles.subtitle}>
            Farm Code: {params.farmCode} • {plots.length} plots
          </BodySmall>

          <Spacer size="lg" />

          {/* Map Section */}
          {plots.length > 0 && (
            <>
              <Card style={styles.mapCard}>
                <MapboxMap
                  mapRef={mapRef}
                  cameraRef={cameraRef}
                  initialRegion={mapRegion}
                  polygons={mapboxPolygons}
                  markers={mapboxMarkers}
                  style={styles.map}
                />
              </Card>

              <Spacer size="lg" />
            </>
          )}

          {/* Plots List */}
          <H4>Plot List</H4>
          <Spacer size="md" />

          {plots.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="map-outline" size={64} color={colors.lightGray} />
              <Spacer size="md" />
              <Body style={styles.emptyText}>No plots found for this farmer</Body>
            </View>
          ) : (
            plots.map((plot: PlotListResponse) => {
              const cardStyle = {
                ...styles.plotCard,
                ...(selectedPlot === plot.plotId ? styles.selectedPlotCard : {}),
                borderColor: getStatusColor(plot.status),
              };
              return (
              <Card
                key={plot.plotId}
                style={cardStyle}
              >
                <View style={styles.plotHeader}>
                  <BodySemibold style={{ color: getStatusColor(plot.status) }}>
                    Thửa {plot.soThua}, Tờ {plot.soTo}
                  </BodySemibold>
                  <Badge variant="neutral" size="sm">
                    {plot.status}
                  </Badge>
                </View>

                <Spacer size="xs" />

                <View style={styles.plotDetails}>
                  <View style={styles.plotDetailRow}>
                    <BodySmall style={styles.plotLabel}>Area:</BodySmall>
                    <BodySmall>{plot.area ? `${plot.area.toFixed(2)} m²` : 'N/A'}</BodySmall>
                  </View>
                  {plot.soilType && (
                    <View style={styles.plotDetailRow}>
                      <BodySmall style={styles.plotLabel}>Soil:</BodySmall>
                      <BodySmall>{plot.soilType}</BodySmall>
                    </View>
                  )}
                  {plot.groupName && (
                    <View style={styles.plotDetailRow}>
                      <BodySmall style={styles.plotLabel}>Group:</BodySmall>
                      <BodySmall>{plot.groupName}</BodySmall>
                    </View>
                  )}
                </View>

                <Spacer size="sm" />

                <View style={styles.plotActions}>
                  <TouchableOpacity
                    onPress={() => handleMarkerPress(plot.plotId)}
                    style={styles.viewButton}
                  >
                    <Ionicons name="location" size={16} color={greenTheme.primary} />
                    <BodySmall style={styles.viewButtonText}>View on Map</BodySmall>
                  </TouchableOpacity>

                  <Button
                    onPress={() => handleCalculatePrice(plot.plotId)}
                    size="sm"
                    disabled={!plot.area}
                  >
                    Calculate Price
                  </Button>
                </View>
              </Card>
            );
            })
          )}

          <Spacer size="xl" />
        </Container>
      </ScrollView>

      {/* Standard Plan Selection Modal */}
      <Modal visible={showPlanModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <H4>Select Standard Plan</H4>
            <Spacer size="md" />
            <FlatList
              data={standardPlans || []}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.planItem}
                  onPress={() => handlePlanSelect(item.id)}
                >
                  <BodySemibold>{item.name}</BodySemibold>
                  {item.description && (
                    <BodySmall style={styles.planDescription}>
                      {item.description}
                    </BodySmall>
                  )}
                </TouchableOpacity>
              )}
            />
            <Spacer size="md" />
            <Button variant="outline" onPress={() => setShowPlanModal(false)}>
              Cancel
            </Button>
          </View>
        </View>
      </Modal>

      {/* Price Result Modal */}
      <Modal visible={showPriceModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <H4>Material Cost Breakdown</H4>
            <Spacer size="md" />

            {priceResult && (
              <ScrollView style={styles.priceResultScroll}>
                {priceResult.materialCostDetails?.map((material: any, index: number) => (
                  <View key={index} style={styles.materialRow}>
                    <BodySmall style={styles.materialName}>{material.materialName}</BodySmall>
                    <BodySmall>
                      {material.quantity} {material.unit}
                    </BodySmall>
                    <BodySemibold>{formatCurrency(material.cost)}</BodySemibold>
                  </View>
                ))}

                <Spacer size="md" />
                <View style={styles.totalRow}>
                  <BodySemibold>Total Cost:</BodySemibold>
                  <H4 style={{ color: colors.primary }}>
                    {formatCurrency(priceResult.totalCost)}
                  </H4>
                </View>
              </ScrollView>
            )}

            <Spacer size="md" />
            <Button onPress={() => setShowPriceModal(false)}>Close</Button>
          </View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      {isCalculatingPrice && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={greenTheme.primary} />
          <Spacer size="md" />
          <Body style={styles.loadingText}>Calculating...</Body>
        </View>
      )}
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
    gap: spacing.xs,
  },
  backText: {
    color: greenTheme.primary,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  mapCard: {
    padding: 0,
    overflow: 'hidden',
    height: 300,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: greenTheme.border,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  map: {
    flex: 1,
  },
  plotCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: greenTheme.primary,
    backgroundColor: greenTheme.cardBackground,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: greenTheme.border,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedPlotCard: {
    borderLeftWidth: 4,
    borderLeftColor: greenTheme.primary,
    backgroundColor: greenTheme.primaryLighter,
  },
  plotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plotDetails: {
    gap: spacing.xs,
  },
  plotDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  plotLabel: {
    color: colors.textSecondary,
    flex: 1,
  },
  plotActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  viewButtonText: {
    color: greenTheme.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: greenTheme.cardBackground,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  planItem: {
    padding: spacing.md,
    backgroundColor: greenTheme.primaryLighter,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  planDescription: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  priceResultScroll: {
    maxHeight: 400,
  },
  materialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: greenTheme.border,
  },
  materialName: {
    flex: 1,
    color: greenTheme.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 2,
    borderTopColor: greenTheme.border,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.white,
  },
});
