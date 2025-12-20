/**
 * Farmers with Plots Management Screen
 * Unified view: Farmer list → Plot list with map → Profit analysis per plot
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
  Text,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
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
  MapboxMap,
  PolygonData,
  MarkerData,
} from '../../components/ui';
import { useUser } from '../../libs/auth';
import { StandardPlan, StandardPlanMaterialCostRequest } from '../../types/api';
import { 
  getFarmers, 
  getFarmerPlots, 
  getStandardPlans, 
  calculateStandardPlanMaterialCost,
  Farmer,
  GetFarmerPlotsParams,
  PlotListResponse
} from '../../libs/supervisor';

// Helper functions from FieldsScreen
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

export const FarmersWithPlotsScreen = () => {
  const router = useRouter();
  const { data: user } = useUser();
  const mapRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  
  // State management
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null);
  const [showFarmerModal, setShowFarmerModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceReviewPlotId, setPriceReviewPlotId] = useState<string>('');
  const [selectedStandardPlan, setSelectedStandardPlan] = useState<string>('');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [priceResult, setPriceResult] = useState<any>(null);

  // Fetch farmers list
  const { data: farmers, isLoading: isFarmersLoading } = useQuery({
    queryKey: ['farmers-list'],
    queryFn: () => getFarmers(),
  });

  // Fetch standard plans
  const { data: standardPlans } = useQuery({
    queryKey: ['standard-plans'],
    queryFn: () => getStandardPlans(),
  });

  // Fetch plots for selected farmer
  const { data: plotsData, isLoading: plotsLoading } = useQuery({
    queryKey: ['farmer-plots', selectedFarmer?.farmerId],
    queryFn: () => selectedFarmer 
      ? getFarmerPlots({ 
          farmerId: selectedFarmer.farmerId,
          currentPage: 1,
          pageSize: 100,
        }) 
      : Promise.resolve([]),
    enabled: !!selectedFarmer,
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
        pointMarkers.reduce((sum, marker) => sum + marker.coordinate.latitude, 0) /
        pointMarkers.length;
      const avgLng =
        pointMarkers.reduce((sum, marker) => sum + marker.coordinate.longitude, 0) /
        pointMarkers.length;

      return {
        latitude: avgLat,
        longitude: avgLng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    if (polygons.length > 0) {
      const first = polygons[0].coordinates[0];
      return {
        latitude: first.latitude,
        longitude: first.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    return {
      latitude: 10.8836,
      longitude: 106.7114,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  }, [pointMarkers, polygons]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return colors.success;
      case 'needs-attention':
      case 'emergency':
        return colors.error;
      case 'completed':
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  const handlePlotSelect = (plotId: string) => {
    setSelectedPlot(plotId);
    const plot = plots.find((p: any) => p.plotId === plotId);
    if (plot) {
      const coordinate = parsePointWkt(plot.coordinate);
      if (coordinate && cameraRef.current) {
        const center = {
          longitude: coordinate.longitude,
          latitude: coordinate.latitude,
        };
        const zoomLevel = 15;
        cameraRef.current.setCamera({
          centerCoordinate: [center.longitude, center.latitude],
          zoomLevel,
          animationDuration: 500,
        });
      }
    }
  };

  const handlePriceReview = (plotId: string) => {
    setPriceReviewPlotId(plotId);
    setShowPriceModal(true);
    setPriceResult(null);
    setSelectedStandardPlan('');
  };

  const calculatePrice = async () => {
    if (!selectedStandardPlan) {
      Alert.alert('Error', 'Please select a standard plan');
      return;
    }

    if (!priceReviewPlotId) {
      Alert.alert('Error', 'Plot ID is required');
      return;
    }

    setIsCalculatingPrice(true);
    try {
      const request: StandardPlanMaterialCostRequest = {
        standardPlanId: selectedStandardPlan,
        plotId: priceReviewPlotId,
      };
      
      const result = await calculateStandardPlanMaterialCost(request);
      setPriceResult(result);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to calculate material cost');
    } finally {
      setIsCalculatingPrice(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Container padding="lg">
        {/* Header */}
        <View style={styles.header}>
          <H3>Farmers & Fields</H3>
          <BodySmall color={colors.textSecondary}>
            {selectedFarmer ? `${plots.length} plots` : `${farmers?.length || 0} farmers`}
          </BodySmall>
        </View>

        <Spacer size="lg" />

        {/* Farmer Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Select Farmer</Text>
          {isFarmersLoading ? (
            <ActivityIndicator />
          ) : (
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowFarmerModal(true)}
            >
              <Text style={styles.selectButtonText}>
                {selectedFarmer
                  ? selectedFarmer.fullName || `${selectedFarmer.farmCode}`
                  : 'Choose a farmer to view their plots'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Spacer size="md" />

        {/* Show Map and Plots only when farmer is selected */}
        {selectedFarmer && (
          <>
            {/* Map View */}
            <Card variant="elevated" style={styles.mapCard}>
              {plotsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : plots.length > 0 ? (
                <MapboxMap
                  mapRef={mapRef}
                  cameraRef={cameraRef}
                  initialRegion={mapRegion}
                  polygons={mapboxPolygons}
                  markers={mapboxMarkers}
                  style={styles.map}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No plots found for this farmer</Text>
                </View>
              )}
            </Card>

            <Spacer size="lg" />

            {/* Plots List */}
            <H4>Plots ({plots.length})</H4>
            <Spacer size="md" />
            <ScrollView showsVerticalScrollIndicator={false}>
              {plotsLoading ? (
                <ActivityIndicator />
              ) : plots.length === 0 ? (
                <Card variant="flat" style={styles.emptyCard}>
                  <Body color={colors.textSecondary}>No plots found</Body>
                </Card>
              ) : (
                plots.map((plot: any) => (
                  <TouchableOpacity
                    key={plot.plotId}
                    onPress={() => handlePlotSelect(plot.plotId)}
                  >
                    <Card
                      variant="elevated"
                      style={[
                        styles.plotCard,
                        selectedPlot === plot.plotId && styles.plotCardSelected,
                      ]}
                    >
                      <View style={styles.plotHeader}>
                        <View style={styles.plotInfo}>
                          <BodySemibold>
                            Thửa {plot.soThua}, Tờ {plot.soTo}
                          </BodySemibold>
                          <BodySmall color={colors.textSecondary}>
                            {plot.groupName} • {plot.area} ha
                          </BodySmall>
                        </View>
                        <Badge
                          variant="outline"
                          style={[
                            styles.statusBadge,
                            { borderColor: getStatusColor(plot.status) },
                          ]}
                        >
                          <BodySmall style={{ color: getStatusColor(plot.status) }}>
                            {plot.status}
                          </BodySmall>
                        </Badge>
                      </View>

                      <Spacer size="sm" />

                      <View style={styles.plotStats}>
                        <View style={styles.plotStatItem}>
                          <BodySmall color={colors.textSecondary}>Area:</BodySmall>
                          <BodySemibold>{plot.area} ha</BodySemibold>
                        </View>
                        <View style={styles.plotStatItem}>
                          <BodySmall color={colors.textSecondary}>Soil:</BodySmall>
                          <BodySemibold>{plot.soilType || 'N/A'}</BodySemibold>
                        </View>
                      </View>

                      <Spacer size="sm" />

                      {/* Profit Analysis Button */}
                      <TouchableOpacity
                        style={styles.profitButton}
                        onPress={() => handlePriceReview(plot.plotId)}
                      >
                        <Text style={styles.profitButtonText}>💰 Calculate Profit</Text>
                      </TouchableOpacity>
                    </Card>
                    <Spacer size="sm" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </>
        )}

        {/* Empty state when no farmer selected */}
        {!selectedFarmer && (
          <Card variant="flat" style={styles.emptyStateCard}>
            <Text style={styles.emptyStateIcon}>👨‍🌾</Text>
            <H4 style={styles.emptyStateTitle}>Select a Farmer</H4>
            <Body color={colors.textSecondary} style={styles.emptyStateText}>
              Choose a farmer from the list above to view their plots and field information
            </Body>
          </Card>
        )}

        {/* Farmer Selection Modal */}
        <Modal
          visible={showFarmerModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFarmerModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Farmer</Text>
              <FlatList
                data={farmers || []}
                keyExtractor={(item) => item.farmerId}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.farmerModalItem}
                    onPress={() => {
                      setSelectedFarmer(item);
                      setSelectedPlot(null);
                      setShowFarmerModal(false);
                    }}
                  >
                    <View>
                      <Text style={styles.farmerModalName}>
                        {item.fullName || item.farmCode || 'Unknown Farmer'}
                      </Text>
                      {item.address && (
                        <Text style={styles.farmerModalEmail}>{item.address}</Text>
                      )}
                      {item.phoneNumber && (
                        <Text style={styles.farmerModalPhone}>📞 {item.phoneNumber}</Text>
                      )}
                      <Text style={styles.farmerModalStats}>
                        {item.plotCount} plots • {item.isActive ? '✅ Active' : '❌ Inactive'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowFarmerModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Price Review Modal */}
        <Modal
          visible={showPriceModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPriceModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Material Cost Analysis</Text>

              {/* Standard Plan Selection */}
              <Text style={styles.modalLabel}>Select Standard Plan *</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowPlanModal(true)}
              >
                <Text style={styles.selectButtonText}>
                  {standardPlans?.find(p => p.id === selectedStandardPlan)?.name || '-- Select Plan --'}
                </Text>
              </TouchableOpacity>

              {/* Calculate Button */}
              <TouchableOpacity
                style={[styles.calculateButton, isCalculatingPrice && styles.buttonDisabled]}
                onPress={calculatePrice}
                disabled={isCalculatingPrice}
              >
                {isCalculatingPrice ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.calculateButtonText}>Calculate Cost</Text>
                )}
              </TouchableOpacity>

              {/* Results */}
              {priceResult && (
                <ScrollView style={styles.priceResults}>
                  <Text style={styles.resultsTitle}>Cost Summary</Text>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Area:</Text>
                    <Text style={styles.resultValue}>{priceResult.area} ha</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Cost per Ha:</Text>
                    <Text style={styles.resultValue}>
                      {formatCurrency(priceResult.totalCostPerHa)}
                    </Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={[styles.resultLabel, styles.bold]}>Total Cost:</Text>
                    <Text style={[styles.resultValue, styles.bold]}>
                      {formatCurrency(priceResult.totalCostForArea)}
                    </Text>
                  </View>

                  {priceResult.materialCostItems?.length > 0 && (
                    <>
                      <Text style={styles.materialsTitle}>Materials:</Text>
                      {priceResult.materialCostItems.map((item: any, idx: number) => (
                        <View key={idx} style={styles.materialItem}>
                          <Text style={styles.materialName}>{item.materialName}</Text>
                          <Text style={styles.materialDetail}>
                            {item.totalQuantityNeeded} {item.unit}
                          </Text>
                          <Text style={styles.materialCost}>
                            {formatCurrency(item.totalCost)}
                          </Text>
                        </View>
                      ))}
                    </>
                  )}
                </ScrollView>
              )}

              {/* Close Button */}
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPriceModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Plan Selection Modal */}
        <Modal
          visible={showPlanModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPlanModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Standard Plan</Text>
              <FlatList
                data={standardPlans || []}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.planModalItem}
                    onPress={() => {
                      setSelectedStandardPlan(item.id);
                      setShowPlanModal(false);
                    }}
                  >
                    <Text style={styles.planModalItemText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPlanModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  section: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
    color: colors.textPrimary,
  },
  selectButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    minHeight: 56,
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  selectButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  mapCard: {
    height: 300,
    overflow: 'hidden',
    borderRadius: borderRadius.md,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyStateCard: {
    padding: spacing.xl * 2,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyStateTitle: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
  },
  plotCard: {
    padding: spacing.md,
  },
  plotCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  plotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  plotInfo: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  plotStats: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  plotStatItem: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  profitButton: {
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  profitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.lg,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: colors.textDark,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
    color: colors.textDark,
  },
  farmerModalItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  farmerModalName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 4,
  },
  farmerModalEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  farmerModalPhone: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  farmerModalStats: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  planModalItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  planModalItemText: {
    fontSize: 16,
    color: colors.textDark,
  },
  modalCloseButton: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  calculateButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  buttonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  priceResults: {
    marginTop: spacing.md,
    maxHeight: 300,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    color: colors.primary,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  resultLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  resultValue: {
    fontSize: 14,
    color: colors.textDark,
  },
  bold: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  materialsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    color: colors.textDark,
  },
  materialItem: {
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  materialName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  materialDetail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  materialCost: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 4,
  },
});
