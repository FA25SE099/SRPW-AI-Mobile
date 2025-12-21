/**
 * Fields Overview Screen
 * Map view of all supervised fields/plots
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
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
  MapboxMap,
  PolygonData,
  MarkerData,
} from '../../components/ui';
import { useUser } from '../../libs/auth';
import { FarmerPlot, StandardPlan, StandardPlanMaterialCostRequest } from '../../types/api';
import { getFarmers, getFarmerPlots, getStandardPlans, calculateStandardPlanMaterialCost, Farmer, GetFarmerPlotsParams } from '../../libs/supervisor';

// Mock function to parse WKT point
const parsePointWkt = (wkt: string): { latitude: number; longitude: number } | null => {
  const match = wkt.match(/POINT\s*\(\s*([\d.]+)\s+([\d.]+)\s*\)/i);
  if (match) {
    return {
      longitude: parseFloat(match[1]),
      latitude: parseFloat(match[2]),
    };
  }
  return null;
};

// Mock function to parse WKT polygon
const parsePolygonWkt = (
  wkt: string,
): Array<{ latitude: number; longitude: number }> | null => {
  const match = wkt.match(/POLYGON\s*\(\s*\(([^)]+)\)\s*\)/i);
  if (match) {
    const coords = match[1]
      .trim()
      .split(',')
      .map((coord) => {
        const [lng, lat] = coord.trim().split(/\s+/);
        return {
          longitude: parseFloat(lng),
          latitude: parseFloat(lat),
        };
      });
    return coords;
  }
  return null;
};

export const FieldsOverviewScreen = () => {
  const router = useRouter();
  const { data: user } = useUser();
  const mapRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceReviewPlotId, setPriceReviewPlotId] = useState<string>('');
  const [selectedStandardPlan, setSelectedStandardPlan] = useState<string>('');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [priceResult, setPriceResult] = useState<any>(null);
  const [selectedFarmer, setSelectedFarmer] = useState<string>('');
  const [selectedFarmerData, setSelectedFarmerData] = useState<Farmer | null>(null);
  const [showFarmerModal, setShowFarmerModal] = useState(false);

  // Fetch farmers list
  const { data: farmers, isLoading: isFarmersLoading } = useQuery({
    queryKey: ['farmers-list'],
    queryFn: () => getFarmers(),
    staleTime: 0,
    refetchOnMount: true,
  });

  // Fetch standard plans
  const { data: standardPlans } = useQuery({
    queryKey: ['standard-plans'],
    queryFn: () => getStandardPlans(),
  });

  // Fetch plots for selected farmer (or all plots if no farmer selected)
  const { data: plotsData, isLoading: plotsLoading, error: plotsError } = useQuery({
    queryKey: ['farmer-plots', selectedFarmer],
    queryFn: () => selectedFarmer 
      ? getFarmerPlots({ 
          farmerId: selectedFarmer,
          currentPage: 1,
          pageSize: 100,
        }) 
      : Promise.resolve([]),
    enabled: !!selectedFarmer,
  });

  const plots = plotsData || [];
  
  // If you want to use mock data for testing, uncomment below and comment out the API call above
  // const mockPlots: FarmerPlot[] = [
  //   {
  //     plotId: 'REPLACE_WITH_REAL_PLOT_ID_FROM_DATABASE',
  //     area: 2.5,
  //     soThua: 16,
  //     soTo: 58,
  //     status: 'active',
  //     groupId: 'group1',
  //     groupName: 'DongThap1',
  //     activeCultivations: 1,
  //     activeAlerts: 0,
  //     boundary: 'POLYGON ((106.7107264253334 10.884543832447122, 106.7107264253334 10.88461420845745, 106.71102901215232 10.884782328858108, 106.71109271464098 10.884782328858108, 106.71226324787057 10.884469546640403, 106.7122950991149 10.884410899937805, 106.71224334084167 10.884180222795635, 106.71217565694866 10.88415285430932, 106.7107264253334 10.884543832447122))',
  //     coordinate: 'POINT (106.71136654907801 10.883609895322609)',
  //   },
  // ];
  // const plots = mockPlots;

  const pointMarkers = useMemo(() => {
    return plots
      .map((plot) => {
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
      .map((plot) => {
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
    switch (status.toLowerCase()) {
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
    const plot = plots.find((p) => p.plotId === plotId);
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
      // Build request object with only the fields we need
      const request: StandardPlanMaterialCostRequest = {
        standardPlanId: selectedStandardPlan,
      };
      
      // Only add plotId (don't include area)
      request.plotId = priceReviewPlotId;
      
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
          <H3>Fields Overview</H3>
          <BodySmall color={colors.textSecondary}>
            {plots.length} plots
          </BodySmall>
        </View>

        <Spacer size="lg" />

        {/* Farmer Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Filter by Farmer</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowFarmerModal(true)}
          >
            <Text style={styles.selectButtonText}>
              {selectedFarmerData 
                ? selectedFarmerData.fullName || selectedFarmerData.farmCode || 'Unknown Farmer'
                : 'Select Farmer'}
            </Text>
          </TouchableOpacity>
        </View>

        <Spacer size="md" />

        {/* Map View */}
        <Card variant="elevated" style={styles.mapCard}>
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

        {/* Plots List */}
        <H3>All Plots</H3>
        <Spacer size="md" />
        <ScrollView showsVerticalScrollIndicator={false}>
          {plots.map((plot) => (
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
                    <BodySmall color={colors.textSecondary}>Cultivations:</BodySmall>
                    <BodySemibold>{plot.activeCultivations}</BodySemibold>
                  </View>
                  <View style={styles.plotStatItem}>
                    <BodySmall color={colors.textSecondary}>Alerts:</BodySmall>
                    <BodySemibold color={plot.activeAlerts > 0 ? colors.error : colors.textDark}>
                      {plot.activeAlerts}
                    </BodySemibold>
                  </View>
                </View>

                <Spacer size="sm" />

                {/* Price Review Button */}
                <TouchableOpacity
                  style={styles.priceReviewButton}
                  onPress={() => handlePriceReview(plot.plotId)}
                >
                  <Text style={styles.priceReviewButtonText}>💰 Price Review</Text>
                </TouchableOpacity>
              </Card>
              <Spacer size="sm" />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Price Review Modal */}
        <Modal
          visible={showPriceModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPriceModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Material Cost Review</Text>

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
                  <Text style={styles.calculateButtonText}>Calculate Material Cost</Text>
                )}
              </TouchableOpacity>

              {/* Results */}
              {priceResult && (
                <View style={styles.priceResults}>
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

                  {priceResult.materialCostItems.length > 0 && (
                    <>
                      <Text style={styles.materialsTitle}>Materials Breakdown:</Text>
                      <ScrollView style={styles.materialsList}>
                        {priceResult.materialCostItems.map((item: any, idx: number) => (
                          <View key={idx} style={styles.materialItem}>
                            <Text style={styles.materialName}>{item.materialName}</Text>
                            <Text style={styles.materialDetail}>
                              {item.totalQuantityNeeded} {item.unit} ({item.packagesNeeded} packages)
                            </Text>
                            <Text style={styles.materialCost}>
                              {formatCurrency(item.totalCost)}
                            </Text>
                          </View>
                        ))}
                      </ScrollView>
                    </>
                  )}
                </View>
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
                    <Text style={styles.planModalItemText}>
                      {item.name}
                      {item.riceVarietyName && (
                        <Text style={styles.planModalItemSubtext}> ({item.riceVarietyName})</Text>
                      )}
                    </Text>
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
                    style={styles.planModalItem}
                    onPress={() => {
                      setSelectedFarmer(item.farmerId);
                      setSelectedFarmerData(item);
                      setShowFarmerModal(false);
                    }}
                  >
                    <Text style={styles.planModalItemText}>
                      {item.fullName || item.farmCode || 'Unknown Farmer'}
                    </Text>
                    {item.address && (
                      <Text style={styles.planModalItemSubtext}>{item.address}</Text>
                    )}
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
    padding: spacing.sm,
    minHeight: 50,
    justifyContent: 'center',
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
  priceReviewButton: {
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  priceReviewButtonText: {
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
    padding: spacing.md,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
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
  materialsList: {
    maxHeight: 150,
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
  planModalItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  planModalItemText: {
    fontSize: 16,
    color: colors.textDark,
  },
  planModalItemSubtext: {
    color: colors.textSecondary,
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
});
