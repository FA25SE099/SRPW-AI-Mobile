/**
 * Fields/Plot Management Screen
 * View and manage field information with GIS maps
 */

import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Modal,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useQuery, useQueries } from '@tanstack/react-query';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { Coordinate } from '../../types/coordinates';
import { scale, moderateScale, getFontSize, getSpacing, isTablet, verticalScale } from '../../utils/responsive';
import {
  Container,
  H3,
  H4,
  Body,
  BodySmall,
  BodySemibold,
  Card,
  Spacer,
  Button,
  Spinner,
  MapboxMap,
  PolygonData,
  MarkerData,
} from '../../components/ui';
import { FarmerPlot } from '../../types/api';
import { getCurrentFarmerPlots, getPlotCultivationPlans } from '../../libs/farmer';
import { useUser } from '../../libs/auth';
const DEFAULT_CENTER = {
  latitude: 11.2,
  longitude: 106.5,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};


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

// Reverse geocoding function to get address from coordinates
const reverseGeocode = async (
  latitude: number,
  longitude: number,
): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'SRPW-AI-Mobile/1.0', // Required by Nominatim
        },
      },
    );
    const data = await response.json();
    if (data.address) {
      const addr = data.address;
      const parts = [];
      if (addr.road) parts.push(addr.road);
      if (addr.village || addr.town || addr.city) {
        parts.push(addr.village || addr.town || addr.city);
      }
      if (addr.state) parts.push(addr.state);
      if (addr.country) parts.push(addr.country);
      return parts.length > 0 ? parts.join(', ') : data.display_name || null;
    }
    return data.display_name || null;
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
    return null;
  }
};

type FieldCardProps = {
  field: FarmerPlot;
  onPressCard: () => void;
  onFocusOnMap: () => void;
  hasCultivationPlans: boolean;
  onReportIssue: () => void;
};

const FieldCard = ({ field, onPressCard, onFocusOnMap, hasCultivationPlans, onReportIssue }: FieldCardProps) => {
  return (
    <Card variant="elevated" style={styles.fieldCard}>
      <View style={styles.fieldCardHeader}>
        <View style={styles.fieldIcon}>
          <Ionicons name="leaf-outline" size={24} color={greenTheme.primary} />
        </View>
        <View style={styles.fieldInfo}>
          <BodySemibold>{field.groupName}</BodySemibold>
          <BodySmall color={colors.textSecondary}>
            Thửa #{field.soThua} • Tờ #{field.soTo}
          </BodySmall>
        </View>
      </View>
      <Spacer size="md" />
      <View style={styles.fieldDetails}>
        <View style={styles.fieldDetailItem}>
          <BodySmall color={colors.textSecondary}>Diện tích</BodySmall>
          <BodySemibold>{field.area} ha</BodySemibold>
        </View>
        <View style={styles.fieldDetailItem}>
          <BodySmall color={colors.textSecondary}>Trạng thái</BodySmall>
          <BodySemibold>{field.status}</BodySemibold>
        </View>
        <View style={styles.fieldDetailItem}>
          <BodySmall color={colors.textSecondary}>Cảnh báo</BodySmall>
          <BodySemibold>{field.activeAlerts}</BodySemibold>
        </View>
      </View>
      <Spacer size="md" />
      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={onFocusOnMap}
          style={styles.viewButton}
        >
          <Ionicons name="location" size={16} color={greenTheme.primary} />
          <BodySmall style={styles.viewButtonText}>Xem trên bản đồ</BodySmall>
        </TouchableOpacity>
        <Button
          variant="outline"
          size="sm"
          onPress={onPressCard}
          style={styles.actionButton}
        >
          Xem kế hoạch
        </Button>
        {hasCultivationPlans && (
          <Button
            variant="outline"
            size="sm"
            onPress={onReportIssue}
            style={styles.actionButton}
          >
            Báo cáo vấn đề
          </Button>
        )}
      </View>
      <Spacer size="md" />
    </Card>
  );
};

export const FieldsScreen = () => {
  const router = useRouter();
  const { data: user } = useUser();
  const { width: screenWidth } = useWindowDimensions();
  const mapRef = useRef<any>(null);
  const fullscreenMapRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const fullscreenCameraRef = useRef<any>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [pendingRegion, setPendingRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);
  const [addresses, setAddresses] = useState<{ [plotId: string]: string }>({});
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedPlotInfo, setSelectedPlotInfo] = useState<{
    plot: FarmerPlot;
    coordinate: Coordinate;
  } | null>(null);
  const {
    data: plots,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['farmer-plots', user?.id, { page: 1, size: 10 }],
    queryFn: () =>
      getCurrentFarmerPlots({
        currentPage: 1,
        pageSize: 10,
      }),
  });

  // Get current location
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Location permission not granted');
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.warn('Error getting current location:', error);
      }
    };

    getCurrentLocation();
  }, []);

  // Fetch addresses for all plots using reverse geocoding
  useEffect(() => {
    if (!plots || plots.length === 0) return;

    const fetchAddresses = async () => {
      const addressMap: { [plotId: string]: string } = {};
      
      // Fetch addresses with a delay to respect rate limits (1 request/second)
      for (let i = 0; i < plots.length; i++) {
        const plot = plots[i];
        const coordinate = parsePointWkt(plot.coordinate);
        if (coordinate) {
          // Add delay between requests to respect Nominatim rate limits
          if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1100));
          }
          const address = await reverseGeocode(coordinate.latitude, coordinate.longitude);
          if (address) {
            addressMap[plot.plotId] = address;
          }
        }
      }
      
      setAddresses(addressMap);
    };

    fetchAddresses();
  }, [plots]);

  const pointMarkers = useMemo(() => {
    if (!plots || plots.length === 0) {
      return [];
    }

    return plots
      .map((plot) => {
        const coordinate = parsePointWkt(plot.coordinate);
        if (!coordinate) return null;
        const address = addresses[plot.plotId] || plot.groupName;
        return {
          plotId: plot.plotId,
          groupName: plot.groupName,
          address,
          coordinate,
        };
      })
      .filter(
        (marker): marker is { 
          plotId: string; 
          groupName: string; 
          address: string;
          coordinate: { latitude: number; longitude: number } 
        } => marker !== null,
      );
  }, [plots, addresses]);

  const polygonOverlays = useMemo(() => {
    if (!plots || plots.length === 0) {
      return [];
    }

    return plots
      .map((plot) => {
        const coords = parsePolygonWkt(plot.boundary);
        if (!coords) return null;
        return {
          plotId: plot.plotId,
          groupName: plot.groupName,
          coordinates: coords,
        };
      })
      .filter(
        (
          polygon,
        ): polygon is {
          plotId: string;
          groupName: string;
          coordinates: Array<{ latitude: number; longitude: number }>;
        } => polygon !== null,
      );
  }, [plots]);

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

    if (polygonOverlays.length > 0) {
      const first = polygonOverlays[0].coordinates[0];
      return {
        latitude: first.latitude,
        longitude: first.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    // If no plots, use current location if available
    if (currentLocation) {
      return {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    return DEFAULT_CENTER;
  }, [pointMarkers, polygonOverlays, currentLocation]);

  // Convert to Mapbox format
  const mapboxPolygons = useMemo<PolygonData[]>(() => {
    return polygonOverlays.map((polygon) => ({
      id: polygon.plotId,
      coordinates: polygon.coordinates,
      strokeColor: '#2E7D32', // Forest green
      fillColor: 'rgba(46, 125, 50, 0.25)', // Light green fill
      strokeWidth: 2,
    }));
  }, [polygonOverlays]);

  const mapboxMarkers = useMemo<MarkerData[]>(() => {
    const plotMarkers = pointMarkers.map((marker) => ({
      id: marker.plotId,
      coordinate: marker.coordinate,
      title: marker.groupName,
      description: marker.address,
      color: greenTheme.primary,
    }));

    // Add current location marker if available
    if (currentLocation) {
      plotMarkers.push({
        id: 'current-location',
        coordinate: currentLocation,
        title: 'Vị trí hiện tại',
        description: 'Vị trí của bạn',
        color: '#007AFF', // Blue color for current location
      });
    }

    return plotMarkers;
  }, [pointMarkers, currentLocation]);

  const totalAreaHa = useMemo(() => {
    if (!plots || plots.length === 0) return 0;
    return plots.reduce((sum, plot) => sum + (plot.area || 0), 0);
  }, [plots]);

  // Fetch cultivation plans for all plots to check if they exist
  const cultivationPlansQueries = useQueries({
    queries: (plots || []).map((plot) => ({
      queryKey: ['plot-plans-check', plot.plotId],
      queryFn: () => getPlotCultivationPlans(plot.plotId, { currentPage: 1, pageSize: 1 }),
      enabled: !!plot.plotId,
      retry: false, // Don't retry if it fails, just assume no plans
    })),
  });

  // Create a map of plotId -> hasPlans
  const hasCultivationPlansMap = useMemo(() => {
    const map: { [plotId: string]: boolean } = {};
    cultivationPlansQueries.forEach((query, index) => {
      const plot = plots?.[index];
      if (plot) {
        // Check if query succeeded and has data
        map[plot.plotId] = query.isSuccess && (query.data?.data?.length ?? 0) > 0;
      }
    });
    return map;
  }, [cultivationPlansQueries, plots]);

  if (isLoading) {
    return <Spinner fullScreen />;
  }

  const handlePolygonPress = (polygonId: string, coordinate: Coordinate) => {
    console.log('[FieldsScreen] Polygon pressed:', polygonId, coordinate);
    const plot = plots?.find((p) => p.plotId === polygonId);
    if (plot) {
      console.log('[FieldsScreen] Found plot:', plot.groupName);
      setSelectedPlotInfo({ plot, coordinate });
    } else {
      console.warn('[FieldsScreen] Plot not found for ID:', polygonId);
    }
  };

  // Plot marker press handler - similar to FarmerPlotsScreen
  const handleMarkerPress = (plotId: string) => {
    const plot = plots?.find((p) => p.plotId === plotId);
    if (plot) {
      const coordinate = parsePointWkt(plot.coordinate);
      if (coordinate && cameraRef.current) {
        cameraRef.current.setCamera({
          centerCoordinate: [coordinate.longitude, coordinate.latitude],
          zoomLevel: 16,
          animationDuration: 1000,
        });
      }
      // Also set selected plot info to show the info tag
      setSelectedPlotInfo({ plot, coordinate: coordinate || { latitude: 0, longitude: 0 } });
    }
  };

  const focusOnPlot = (plot: FarmerPlot, expand?: boolean) => {
    const coordinate = parsePointWkt(plot.coordinate);
    if (!coordinate) return;

    const region = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };

    const center = {
      longitude: region.longitude,
      latitude: region.latitude,
    };
    const zoomLevel = Math.max(8, Math.min(20, Math.log2(360 / Math.max(region.latitudeDelta, 0.001))));

    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [center.longitude, center.latitude],
        zoomLevel,
        animationDuration: 500,
      });
    }

    if (expand) {
      setPendingRegion(region);
      setIsMapFullscreen(true);
      requestAnimationFrame(() => {
        if (fullscreenCameraRef.current) {
          fullscreenCameraRef.current.setCamera({
            centerCoordinate: [center.longitude, center.latitude],
            zoomLevel,
            animationDuration: 500,
          });
        }
      });
    }
  };

  const focusOnCurrentLocation = (isFullscreen: boolean = false) => {
    if (!currentLocation) return;

    const zoomLevel = 15; // Good zoom level for current location
    const camera = isFullscreen ? fullscreenCameraRef.current : cameraRef.current;

    if (camera) {
      camera.setCamera({
        centerCoordinate: [currentLocation.longitude, currentLocation.latitude],
        zoomLevel,
        animationDuration: 500,
      });
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
          <H3 style={styles.headerTitle}>Danh sách thửa đất</H3>
        </View>

        <Spacer size="lg" />

        {/* Summary */}
        <View style={styles.summaryRow}>
          <Card variant="flat" style={styles.summaryCard}>
            <BodySmall color={colors.textSecondary}>Tổng số thửa</BodySmall>
            <H4>{plots?.length ?? 0}</H4>
          </Card>
          <Card variant="flat" style={styles.summaryCard}>
            <BodySmall color={colors.textSecondary}>Tổng diện tích</BodySmall>
            <H4>{totalAreaHa.toFixed(2)} ha</H4>
          </Card>
        </View>

        <Spacer size="lg" />

        {/* Map View */}
        <Card variant="elevated" style={styles.mapCard}>
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => {
              setPendingRegion(null);
              setIsMapFullscreen(true);
            }}
          >
            <Body color={colors.white}>Toàn màn hình</Body>
          </TouchableOpacity>
          {currentLocation && (
            <TouchableOpacity
              style={styles.currentLocationButton}
              onPress={() => focusOnCurrentLocation(false)}
            >
              <Ionicons name="locate" size={24} color={greenTheme.primary} />
            </TouchableOpacity>
          )}
          <View style={styles.mapWrapper}>
            <MapboxMap
              mapRef={mapRef}
              cameraRef={cameraRef}
              initialRegion={mapRegion}
              polygons={mapboxPolygons}
              markers={mapboxMarkers}
              onPolygonPress={handlePolygonPress}
              style={styles.map}
            />
            {selectedPlotInfo && (
              <View style={styles.infoTagContainer}>
                <Card variant="elevated" style={styles.infoTag}>
                  <TouchableOpacity
                    style={styles.infoTagClose}
                    onPress={() => setSelectedPlotInfo(null)}
                  >
                    <Ionicons name="close" size={18} color={greenTheme.primary} />
                  </TouchableOpacity>
                  <BodySemibold style={styles.infoTagTitle}>
                    {selectedPlotInfo.plot.groupName}
                  </BodySemibold>
                  <Spacer size="xs" />
                  <BodySmall color={colors.textSecondary}>
                    Thửa #{selectedPlotInfo.plot.soThua} • Tờ #{selectedPlotInfo.plot.soTo}
                  </BodySmall>
                  <Spacer size="xs" />
                  <View style={styles.infoTagDetails}>
                    <View style={styles.infoTagDetailItem}>
                      <BodySmall color={colors.textSecondary}>Diện tích:</BodySmall>
                      <BodySemibold>{selectedPlotInfo.plot.area} ha</BodySemibold>
                    </View>
                    <View style={styles.infoTagDetailItem}>
                      <BodySmall color={colors.textSecondary}>Trạng thái:</BodySmall>
                      <BodySemibold>{selectedPlotInfo.plot.status}</BodySemibold>
                    </View>
                  </View>
                  <Spacer size="sm" />
                  <View style={styles.infoTagActions}>
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => {
                        setSelectedPlotInfo(null);
                        focusOnPlot(selectedPlotInfo.plot, true);
                      }}
                      style={styles.infoTagButton}
                    >
                      Xem trên bản đồ
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => {
                        setSelectedPlotInfo(null);
                        router.push({
                          pathname: '/farmer/fields/[plotId]/plans',
                          params: {
                            plotId: selectedPlotInfo.plot.plotId,
                            plotName: selectedPlotInfo.plot.groupName,
                          },
                        } as any);
                      }}
                      style={styles.infoTagButton}
                    >
                      Xem kế hoạch
                    </Button>
                  </View>
                </Card>
              </View>
            )}
          </View>
        </Card>

        <Modal visible={isMapFullscreen} animationType="slide">
          <SafeAreaView style={styles.fullscreenMapContainer}>
            <View style={styles.fullscreenHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsMapFullscreen(false)}
              >
                <Body color={colors.primary}>Close</Body>
              </TouchableOpacity>
              <View style={styles.fullscreenHeaderButtons}>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    const target = mapRegion;
                    if (fullscreenCameraRef.current) {
                      const center = {
                        longitude: target.longitude,
                        latitude: target.latitude,
                      };
                      const zoomLevel = Math.max(8, Math.min(20, Math.log2(360 / Math.max(target.latitudeDelta, 0.001))));
                      fullscreenCameraRef.current.setCamera({
                        centerCoordinate: [center.longitude, center.latitude],
                        zoomLevel,
                        animationDuration: 500,
                      });
                    }
                  }}
                >
                  Reset View
                </Button>
              </View>
            </View>
            {currentLocation && (
              <TouchableOpacity
                style={styles.fullscreenFloatingLocationButton}
                onPress={() => focusOnCurrentLocation(true)}
              >
                <Ionicons name="locate" size={24} color={greenTheme.primary} />
              </TouchableOpacity>
            )}
            <MapboxMap
              mapRef={fullscreenMapRef}
              cameraRef={fullscreenCameraRef}
              initialRegion={mapRegion}
              polygons={mapboxPolygons}
              markers={mapboxMarkers}
              onPolygonPress={handlePolygonPress}
              style={styles.fullscreenMap}
            />
            {selectedPlotInfo && (
              <View style={styles.infoTagContainer}>
                <Card variant="elevated" style={styles.infoTag}>
                  <TouchableOpacity
                    style={styles.infoTagClose}
                    onPress={() => setSelectedPlotInfo(null)}
                  >
                    <Ionicons name="close" size={18} color={greenTheme.primary} />
                  </TouchableOpacity>
                  <BodySemibold style={styles.infoTagTitle}>
                    {selectedPlotInfo.plot.groupName}
                  </BodySemibold>
                  <Spacer size="xs" />
                  <BodySmall color={colors.textSecondary}>
                    Thửa #{selectedPlotInfo.plot.soThua} • Tờ #{selectedPlotInfo.plot.soTo}
                  </BodySmall>
                  <Spacer size="xs" />
                  <View style={styles.infoTagDetails}>
                    <View style={styles.infoTagDetailItem}>
                      <BodySmall color={colors.textSecondary}>Diện tích:</BodySmall>
                      <BodySemibold>{selectedPlotInfo.plot.area} ha</BodySemibold>
                    </View>
                    <View style={styles.infoTagDetailItem}>
                      <BodySmall color={colors.textSecondary}>Trạng thái:</BodySmall>
                      <BodySemibold>{selectedPlotInfo.plot.status}</BodySemibold>
                    </View>
                  </View>
                  <Spacer size="sm" />
                </Card>
              </View>
            )}
          </SafeAreaView>
        </Modal>

        <Spacer size="xl" />

        {/* Fields List */}
        <H4>Tất cả các thửa đất của tôi {plots ? `(${plots.length})` : ''}</H4>
        <Spacer size="md" />

        {isError && (
          <Card variant="elevated" style={styles.errorCard}>
            <BodySemibold>Không thể tải các thửa đất</BodySemibold>
            <Spacer size="xs" />
            <BodySmall color={colors.textSecondary}>
              Vui lòng kiểm tra kết nối của bạn và thử lại.
            </BodySmall>
            <Spacer size="md" />
            <Button onPress={() => refetch()} size="sm">
              Thử lại
            </Button>
          </Card>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          {plots && plots.length === 0 && (
            <Card variant="flat" style={styles.emptyState}>
              <BodySemibold>Không tìm thấy các thửa đất</BodySemibold>
              <Spacer size="xs" />
              <BodySmall color={colors.textSecondary}>
                Khi các thửa đất được gán, chúng sẽ hiện ra ở đây.
              </BodySmall>
            </Card>
          )}

          {plots?.map((field: FarmerPlot) => (
            <FieldCard
              key={field.plotId}
              field={field}
              onPressCard={() =>
                router.push({
                  pathname: '/farmer/fields/[plotId]/plans',
                  params: { plotId: field.plotId, plotName: field.groupName },
                } as any)
              }
              onFocusOnMap={() => handleMarkerPress(field.plotId)}
              hasCultivationPlans={hasCultivationPlansMap[field.plotId] ?? false}
              onReportIssue={() =>
                router.push({
                  pathname: '/farmer/reports/create',
                  params: { plotId: field.plotId },
                } as any)
              }
            />
          ))}
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
  },
  mapCard: {
    height: verticalScale(220),
    padding: 0,
    overflow: 'hidden',
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
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  expandButton: {
    position: 'absolute',
    top: getSpacing(spacing.sm),
    right: getSpacing(spacing.sm),
    zIndex: 1,
    backgroundColor: greenTheme.primary,
    paddingHorizontal: getSpacing(spacing.md),
    paddingVertical: getSpacing(spacing.xs),
    borderRadius: moderateScale(borderRadius.md),
    opacity: 0.9,
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: getSpacing(spacing.md),
    right: getSpacing(spacing.sm),
    zIndex: 1,
    width: scale(48),
    height: scale(48),
    borderRadius: moderateScale(borderRadius.full),
    backgroundColor: greenTheme.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: greenTheme.primary,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fullscreenMapContainer: {
    flex: 1,
    backgroundColor: greenTheme.background,
  },
  fullscreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getSpacing(spacing.md),
    backgroundColor: greenTheme.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: greenTheme.border,
  },
  fullscreenHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(spacing.sm),
  },
  fullscreenCurrentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getSpacing(spacing.md),
    paddingVertical: getSpacing(spacing.sm),
    backgroundColor: greenTheme.primaryLighter,
    borderRadius: moderateScale(borderRadius.md),
    borderWidth: 1,
    borderColor: greenTheme.primary,
  },
  fullscreenFloatingLocationButton: {
    position: 'absolute',
    bottom: getSpacing(spacing.xl),
    right: getSpacing(spacing.md),
    zIndex: 1000,
    width: scale(56),
    height: scale(56),
    borderRadius: moderateScale(borderRadius.full),
    backgroundColor: greenTheme.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: greenTheme.primary,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    paddingHorizontal: getSpacing(spacing.md),
    paddingVertical: getSpacing(spacing.sm),
    backgroundColor: greenTheme.primaryLighter,
    borderRadius: moderateScale(borderRadius.sm),
  },
  fullscreenMap: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: getSpacing(spacing.md),
  },
  summaryCard: {
    flex: 1,
    paddingVertical: getSpacing(spacing.md),
    paddingHorizontal: getSpacing(spacing.md),
    borderRadius: moderateScale(borderRadius.lg),
    backgroundColor: greenTheme.primaryLighter,
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  fieldCard: {
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
  fieldCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(spacing.md),
  },
  fieldIcon: {
    width: scale(48),
    height: scale(48),
    borderRadius: moderateScale(borderRadius.md),
    backgroundColor: greenTheme.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldInfo: {
    flex: 1,
  },
  fieldDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: getSpacing(spacing.md),
  },
  fieldDetailItem: {
    minWidth: '30%',
  },
  actionButton: {
    flex: 1,
    borderColor: greenTheme.primary,
    backgroundColor: greenTheme.primaryLighter,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: getSpacing(spacing.sm),
    alignItems: 'center',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(spacing.xs),
    paddingHorizontal: getSpacing(spacing.md),
    paddingVertical: getSpacing(spacing.sm),
    borderRadius: moderateScale(borderRadius.md),
    borderWidth: 1,
    borderColor: greenTheme.primary,
    backgroundColor: greenTheme.primaryLighter,
  },
  viewButtonText: {
    color: greenTheme.primary,
  },
  errorCard: {
    padding: getSpacing(spacing.lg),
    alignItems: 'flex-start',
    gap: getSpacing(spacing.sm),
    backgroundColor: greenTheme.cardBackground,
    borderRadius: moderateScale(borderRadius.lg),
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  emptyState: {
    padding: getSpacing(spacing.lg),
    alignItems: 'flex-start',
    backgroundColor: greenTheme.cardBackground,
    borderRadius: moderateScale(borderRadius.lg),
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  infoTagContainer: {
    position: 'absolute',
    bottom: getSpacing(spacing.lg),
    left: getSpacing(spacing.lg),
    right: getSpacing(spacing.lg),
    zIndex: 1000,
  },
  infoTag: {
    padding: getSpacing(spacing.md),
    backgroundColor: greenTheme.cardBackground,
    borderRadius: moderateScale(borderRadius.lg),
    borderWidth: 2,
    borderColor: greenTheme.primary,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  infoTagClose: {
    position: 'absolute',
    top: getSpacing(spacing.sm),
    right: getSpacing(spacing.sm),
    width: scale(28),
    height: scale(28),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(borderRadius.full),
    backgroundColor: greenTheme.primaryLighter,
  },
  infoTagTitle: {
    fontSize: getFontSize(16),
    color: greenTheme.primary,
    paddingRight: getSpacing(spacing.xl),
  },
  infoTagDetails: {
    gap: getSpacing(spacing.xs),
  },
  infoTagDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoTagActions: {
    flexDirection: 'row',
    gap: getSpacing(spacing.sm),
  },
  infoTagButton: {
    flex: 1,
    borderColor: greenTheme.primary,
    backgroundColor: greenTheme.primaryLighter,
  },
});

