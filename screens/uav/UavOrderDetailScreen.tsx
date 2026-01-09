import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Linking,
  ViewStyle,
  Image,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import dayjs from 'dayjs';
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
  Spinner,
  MapboxMap,
  PolygonData,
  MarkerData,
  PolylineData,
} from '../../components/ui';
import { Coordinate } from '../../types/coordinates';
import { getUavOrderDetail } from '../../libs/uav';
import { UavOrderDetail } from '../../types/api';
import {
  translateTaskStatus,
  translatePriority,
  translateTaskType,
} from '../../utils/translations';

const DEFAULT_CENTER = {
  latitude: 11.2,
  longitude: 106.5,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
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

// Helper functions
const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return colors.success;
    case 'in progress':
    case 'inprogress':
      return '#FF9500';
    case 'pending':
      return colors.info;
    default:
      return colors.textSecondary;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return colors.error;
    case 'normal':
      return '#FF9500';
    case 'low':
      return colors.success;
    default:
      return colors.textSecondary;
  }
};

export const UavOrderDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;
  const mapRef = useRef<any>(null);
  const fullscreenMapRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const fullscreenCameraRef = useRef<any>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [expandedProofs, setExpandedProofs] = useState<Record<string, boolean>>({});
  const [focusedPlotId, setFocusedPlotId] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedPlotInfo, setSelectedPlotInfo] = useState<{
    plotId: string;
    plotName: string;
    status: string;
    servicedArea: number;
  } | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['uav-order-detail', orderId],
    queryFn: () => getUavOrderDetail(orderId),
    enabled: Boolean(orderId),
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  // Get current location
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
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
        console.error('Error getting location:', error);
      }
    };

    getCurrentLocation();
  }, []);

  const order: UavOrderDetail | undefined = data;

  const assignmentPolygons = useMemo(() => {
    if (!order) return [];
    return order.plotAssignments
      .map((assignment) => ({
        plotId: assignment.plotId,
        plotName: assignment.plotName,
        status: assignment.status,
        coordinates: parseWktPolygon(assignment.plotBoundaryGeoJson),
      }))
      .filter((item) => item.coordinates.length > 0);
  }, [order]);

  const routeCoordinates = useMemo(() => {
    if (!order) return [];
    return parseWktLineString(order.optimizedRouteJson);
  }, [order]);

  const mapRegion = useMemo(() => {
    const activePolygons =
      focusedPlotId != null
        ? assignmentPolygons.filter((poly) => poly.plotId === focusedPlotId)
        : assignmentPolygons;
    const points = activePolygons.flatMap((poly) => poly.coordinates);
    if (points.length === 0) {
      return DEFAULT_CENTER;
    }
    return getRegionFromPoints(points);
  }, [assignmentPolygons, focusedPlotId]);

  // Convert to Mapbox format
  const mapboxPolygons = useMemo<PolygonData[]>(() => {
    return assignmentPolygons.map((polygon) => ({
      id: polygon.plotId,
      coordinates: polygon.coordinates,
      strokeColor:
        focusedPlotId && focusedPlotId === polygon.plotId
          ? greenTheme.primary
          : getStatusColor(polygon.status),
      fillColor:
        focusedPlotId && focusedPlotId === polygon.plotId
          ? `${greenTheme.primary}40`
          : `${getStatusColor(polygon.status)}30`,
      strokeWidth: focusedPlotId && focusedPlotId === polygon.plotId ? 3 : 2,
    }));
  }, [assignmentPolygons, focusedPlotId]);

  const mapboxPolylines = useMemo<PolylineData[]>(() => {
    if (routeCoordinates.length === 0) return [];
    return [
      {
        id: 'route',
        coordinates: routeCoordinates,
        strokeColor: greenTheme.primary,
        strokeWidth: 3,
      },
    ];
  }, [routeCoordinates]);

  const mapboxMarkers = useMemo<MarkerData[]>(() => {
    const markers: MarkerData[] = [];
    
    // Add current location marker
    if (currentLocation) {
      markers.push({
        id: 'current-location',
        coordinate: currentLocation,
        title: 'Vị trí hiện tại',
        color: '#007AFF',
      });
    }
    
    // Add plot markers (first coordinate of each plot)
    if (assignmentPolygons.length > 0) {
      assignmentPolygons.forEach((polygon) => {
        if (polygon.coordinates.length > 0) {
          markers.push({
            id: `plot-${polygon.plotId}`,
            coordinate: polygon.coordinates[0],
            title: polygon.plotName,
          });
        }
      });
    }
    
    return markers;
  }, [assignmentPolygons, currentLocation]);

  if (isLoading || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <Container padding="lg">
          <Spinner fullScreen />
        </Container>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container}>
        <Container padding="lg">
          <View style={styles.errorContainer}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Body>←</Body>
            </TouchableOpacity>
            <Spacer size="lg" />
            <Body color={colors.error}>Unable to load order detail</Body>
            <Spacer size="sm" />
            <Button size="sm" onPress={() => refetch()}>
              Retry
            </Button>
          </View>
        </Container>
      </SafeAreaView>
    );
  }


  const canStartExecution =
    order.status === 'Pending' || order.status === 'InProgress' || order.status === 'In Progress';

  const focusPlotOnMap = (plotId: string) => {
    setFocusedPlotId(plotId);
    setSelectedPlotInfo(null); // Clear selected plot info when focusing from card
    
    const polygon = assignmentPolygons.find((p) => p.plotId === plotId);
    if (!polygon || polygon.coordinates.length === 0) {
      return;
    }
    const region = getRegionFromPoints(polygon.coordinates);
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
    if (fullscreenCameraRef.current) {
      fullscreenCameraRef.current.setCamera({
        centerCoordinate: [center.longitude, center.latitude],
        zoomLevel,
        animationDuration: 500,
      });
    }
  };

  const handlePolygonPress = (polygonId: string, coordinate: Coordinate) => {
    const assignment = order?.plotAssignments.find((a) => a.plotId === polygonId);
    if (assignment) {
      setFocusedPlotId(polygonId);
      setSelectedPlotInfo({
        plotId: assignment.plotId,
        plotName: assignment.plotName,
        status: assignment.status,
        servicedArea: assignment.servicedArea,
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
          <H3 style={styles.headerTitle}>Chi tiết đơn hàng</H3>
          <View style={styles.headerRight} />
        </View>

        <Spacer size="lg" />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Order Header */}
          <Card variant="elevated" style={styles.card}>
            <View style={styles.orderHeader}>
              <View style={styles.orderInfo}>
                <BodySmall color={colors.textSecondary}>Đơn hàng</BodySmall>
                <BodySemibold style={styles.orderNumber}>{order.orderName}</BodySemibold>
                <BodySmall color={colors.textSecondary}>{order.groupName}</BodySmall>
                {order.vendorName && (
                    <BodySmall color={colors.textSecondary}>Nhà cung cấp: {order.vendorName}</BodySmall>
                )}
              </View>
              <View style={styles.badges}>
                <Badge
                  variant="neutral"
                  style={getStatusBadgeStyle(getStatusColor(order.status))}
                >
                  <BodySmall style={{ color: getStatusColor(order.status) }}>
                    {translateTaskStatus(order.status)}
                  </BodySmall>
                </Badge>
                <Spacer size="xs" />
                <Badge
                  variant="neutral"
                  style={getPriorityBadgeStyle(getPriorityColor(order.priority))}
                >
                  <BodySmall style={{ color: getPriorityColor(order.priority) }}>
                    {translatePriority(order.priority)}
                  </BodySmall>
                </Badge>
              </View>
            </View>
            <Spacer size="lg" />
            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <BodySmall color={colors.textSecondary}>Diện tích</BodySmall>
                <BodySemibold style={styles.statValue}>{order.totalArea.toFixed(2)} ha</BodySemibold>
              </View>
              <View style={styles.statCard}>
                <BodySmall color={colors.textSecondary}>Thửa đất</BodySmall>
                <BodySemibold style={styles.statValue}>{order.totalPlots}</BodySemibold>
              </View>
              <View style={styles.statCard}>
                <BodySmall color={colors.textSecondary}>Hoàn thành</BodySmall>
                <BodySemibold style={styles.statValue}>
                  {order.completionPercentage}%
                </BodySemibold>
              </View>
            </View>
          </Card>

          <Spacer size="md" />

          {/* Map View */}
          <Card variant="elevated" style={styles.mapCard}>
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => setIsMapFullscreen(true)}
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
                polylines={mapboxPolylines}
                focusedId={focusedPlotId}
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
                      {selectedPlotInfo.plotName}
                    </BodySemibold>
                    <Spacer size="xs" />
                    <View style={styles.infoTagDetails}>
                      <View style={styles.infoTagDetailItem}>
                        <BodySmall color={colors.textSecondary}>Diện tích:</BodySmall>
                        <BodySemibold>{selectedPlotInfo.servicedArea} ha</BodySemibold>
                      </View>
                      <View style={styles.infoTagDetailItem}>
                        <BodySmall color={colors.textSecondary}>Trạng thái:</BodySmall>
                        <BodySemibold>{translateTaskStatus(selectedPlotInfo.status)}</BodySemibold>
                      </View>
                    </View>
                  </Card>
                </View>
              )}
            </View>
          </Card>

          <Spacer size="md" />

          {/* Schedule */}
          <Card variant="elevated" style={styles.card}>
            <H4>Lịch</H4>
            <Spacer size="md" />
            <View style={styles.infoRow}>
              <BodySmall color={colors.textSecondary}>Lịch:</BodySmall>
              <BodySemibold>
                {dayjs(order.scheduledDate).format('MMM D, YYYY')}
                {order.scheduledTime ? ` • ${order.scheduledTime}` : ''}
              </BodySemibold>
            </View>
            {order.startedAt && (
              <>
                <Spacer size="sm" />
                <View style={styles.infoRow}>
                  <BodySmall color={colors.textSecondary}>Bắt đầu:</BodySmall>
                  <BodySemibold>{dayjs(order.startedAt).format('MMM D, YYYY h:mm A')}</BodySemibold>
                </View>
              </>
            )}
            {order.completedAt && (
              <>
                <Spacer size="sm" />
                <View style={styles.infoRow}>
                  <BodySmall color={colors.textSecondary}>Hoàn thành:</BodySmall>
                  <BodySemibold>
                    {dayjs(order.completedAt).format('MMM D, YYYY h:mm A')}
                  </BodySemibold>
                </View>
              </>
            )}
            {/* <Spacer size="sm" />
            <View style={styles.infoRow}>
              <BodySmall color={colors.textSecondary}>Chi phí dự kiến:</BodySmall>
              <BodySemibold>{order.estimatedCost?.toLocaleString() ?? 0}₫</BodySemibold>
            </View>
            <Spacer size="sm" />
            <View style={styles.infoRow}>
              <BodySmall color={colors.textSecondary}>Chi phí thực tế:</BodySmall>
              <BodySemibold>{order.actualCost?.toLocaleString() ?? 0}₫</BodySemibold>
            </View> */}
          </Card>

          <Spacer size="md" />


          <Spacer size="md" />

          {/* Plot Assignments */}
          <Card variant="elevated" style={styles.card}>
            <H4>Gán thửa đất</H4>
            <Spacer size="md" />
            {order.plotAssignments.map((assignment) => (
              <TouchableOpacity
                key={assignment.plotId}
                style={styles.assignmentCard}
                activeOpacity={0.9}
                onPress={() => focusPlotOnMap(assignment.plotId)}
              >
                <View style={styles.assignmentHeader}>
                  <View style={{ flex: 1, marginRight: spacing.sm }}>
                    <BodySemibold>{assignment.plotName}</BodySemibold>
                    <BodySmall color={colors.textSecondary}>
                      Diện tích: {assignment.servicedArea} ha
                    </BodySmall>
                    {assignment.cultivationTaskName && (
                      <BodySmall color={greenTheme.primary} style={{ marginTop: 4 }}>
                        Công việc: {assignment.cultivationTaskName}
                        {assignment.taskType && ` (${translateTaskType(assignment.taskType)})`}
                      </BodySmall>
                    )}
                  </View>
                  <Badge
                    variant="neutral"
                    style={getStatusBadgeStyle(getStatusColor(assignment.status))}
                  >
                    <BodySmall style={{ color: getStatusColor(assignment.status) }}>
                      {translateTaskStatus(assignment.status)}
                    </BodySmall>
                  </Badge>
                </View>
                <Spacer size="sm" />
                {assignment.completionDate && (
                  <View style={styles.assignmentMeta}>
                    <BodySmall color={colors.textSecondary}>Hoàn thành:</BodySmall>
                    <BodySemibold>
                      {dayjs(assignment.completionDate).format('MMM D, YYYY h:mm A')}
                    </BodySemibold>
                  </View>
                )}
                {assignment.reportNotes && (
                  <>
                    <Spacer size="xs" />
                    <BodySmall color={colors.textSecondary}>{assignment.reportNotes}</BodySmall>
                  </>
                )}
                {assignment.materials && assignment.materials.length > 0 && (
                  <>
                    <Spacer size="sm" />
                    <View style={styles.materialsSection}>
                      <BodySemibold style={styles.materialsTitle}>Vật liệu cần thiết</BodySemibold>
                      <Spacer size="xs" />
                      {assignment.materials.map((material) => (
                        <View key={material.materialId} style={styles.materialCard}>
                          <View style={styles.materialHeader}>
                            <BodySemibold>{material.materialName}</BodySemibold>
                            <Badge variant="neutral" style={styles.dosageBadge}>
                              <BodySmall>{material.quantityPerHa} {material.materialUnit}/ha</BodySmall>
                            </Badge>
                          </View>
                          <Spacer size="xs" />
                          <View style={styles.materialDetails}>
                            <View style={styles.materialDetailItem}>
                              <BodySmall color={colors.textSecondary}>Tổng số lượng:</BodySmall>
                              <BodySemibold>
                                {material.totalQuantityRequired} {material.materialUnit}
                              </BodySemibold>
                            </View>
                            {/* <View style={styles.materialDetailItem}>
                              <BodySmall color={colors.textSecondary}>Chi phí dự kiến:</BodySmall>
                              <BodySemibold>
                                {material.totalEstimatedCost.toLocaleString()}₫
                              </BodySemibold>
                            </View> */}
                          </View>
                        </View>
                      ))}
                    </View>
                  </>
                )}
                {assignment.proofUrls.length > 0 && (
                  <>
                    <Spacer size="xs" />
                    <TouchableOpacity
                      style={styles.proofToggle}
                      onPress={(e) => {
                        e.stopPropagation();
                        setExpandedProofs((prev) => ({
                          ...prev,
                          [assignment.plotId]: !prev[assignment.plotId],
                        }));
                      }}
                    >
                      <BodySmall color={colors.textSecondary}>
                        Chứng minh ({assignment.proofUrls.length})
                      </BodySmall>
                      <Body style={{ color: greenTheme.primary }}>
                        {expandedProofs[assignment.plotId] ? '▲' : '▼'}
                      </Body>
                    </TouchableOpacity>
                    {expandedProofs[assignment.plotId] && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.proofGallery}
                      >
                        {assignment.proofUrls.map((url) => (
                          <TouchableOpacity
                            key={url}
                            onPress={() => Linking.openURL(url)}
                            style={styles.proofPreviewCard}
                          >
                            <Image source={{ uri: url }} style={styles.proofImage} />
                            <BodySmall numberOfLines={1} style={styles.proofCaption}>
                              {url.replace(/^https?:\/\//, '')}
                            </BodySmall>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </>
                )}
                {assignment.status !== 'Completed' && (
                  <>
                    <Spacer size="sm" />
                    {dayjs(order.scheduledDate).startOf('day').isAfter(dayjs().startOf('day')) ? (
                      <View style={[styles.reportButton, { borderColor: colors.textSecondary, opacity: 0.6 }]}>
                        <BodySemibold style={{ color: colors.textSecondary }}>Chưa thể bắt đầu</BodySemibold>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.reportButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          router.push({
                            pathname: '/uav/orders/[orderId]/report',
                            params: {
                              orderId: order.orderId,
                              plotId: assignment.plotId,
                              plotName: assignment.plotName,
                              servicedArea: assignment.servicedArea.toString(),
                            },
                          } as any);
                        }}
                      >
                        <BodySemibold style={styles.reportButtonText}>Báo cáo hoàn thành</BodySemibold>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </TouchableOpacity>
            ))}
          </Card>

          <Spacer size="xl" />
        </ScrollView>

        {/* Fullscreen Map Modal */}
        <Modal visible={isMapFullscreen} animationType="slide">
          <SafeAreaView style={styles.fullscreenMapContainer}>
            <View style={styles.fullscreenHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsMapFullscreen(false)}
              >
                <Body color={greenTheme.primary} style={{ fontWeight: '600' }}>Đóng</Body>
              </TouchableOpacity>
              <Button
                variant="outline"
                size="sm"
                onPress={() => {
                  if (fullscreenCameraRef.current) {
                    const center = {
                      longitude: mapRegion.longitude,
                      latitude: mapRegion.latitude,
                    };
                    const zoomLevel = Math.max(8, Math.min(20, Math.log2(360 / Math.max(mapRegion.latitudeDelta, 0.001))));
                    fullscreenCameraRef.current.setCamera({
                      centerCoordinate: [center.longitude, center.latitude],
                      zoomLevel,
                      animationDuration: 500,
                    });
                  }
                }}
              >
                Đặt lại hiển thị
              </Button>
            </View> 
            <MapboxMap
              mapRef={fullscreenMapRef}
              cameraRef={fullscreenCameraRef}
              initialRegion={mapRegion}
              polygons={mapboxPolygons}
              markers={mapboxMarkers}
              polylines={mapboxPolylines}
              focusedId={focusedPlotId}
              onPolygonPress={handlePolygonPress}
              style={styles.fullscreenMap}
            />
            {currentLocation && (
              <TouchableOpacity
                style={styles.fullscreenCurrentLocationButton}
                onPress={() => focusOnCurrentLocation(true)}
              >
                <Ionicons name="locate" size={24} color={greenTheme.primary} />
              </TouchableOpacity>
            )}
            {selectedPlotInfo && (
              <View style={styles.fullscreenInfoTagContainer}>
                <Card variant="elevated" style={styles.infoTag}>
                  <TouchableOpacity
                    style={styles.infoTagClose}
                    onPress={() => setSelectedPlotInfo(null)}
                  >
                    <Ionicons name="close" size={18} color={greenTheme.primary} />
                  </TouchableOpacity>
                  <BodySemibold style={styles.infoTagTitle}>
                    {selectedPlotInfo.plotName}
                  </BodySemibold>
                  <Spacer size="xs" />
                  <View style={styles.infoTagDetails}>
                    <View style={styles.infoTagDetailItem}>
                      <BodySmall color={colors.textSecondary}>Diện tích:</BodySmall>
                      <BodySemibold>{selectedPlotInfo.servicedArea} ha</BodySemibold>
                    </View>
                    <View style={styles.infoTagDetailItem}>
                      <BodySmall color={colors.textSecondary}>Trạng thái:</BodySmall>
                      <BodySemibold>{selectedPlotInfo.status.replace(/([A-Z])/g, ' $1').trim()}</BodySemibold>
                    </View>
                  </View>
                </Card>
              </View>
            )}
          </SafeAreaView>
        </Modal>
      </Container>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: greenTheme.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    backgroundColor: greenTheme.cardBackground,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: greenTheme.border,
  },
  backButton: {
    alignSelf: 'flex-start',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: greenTheme.primaryLighter,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: greenTheme.primary,
    fontWeight: '700',
  },
  headerRight: {
    width: 40,
  },
  card: {
    padding: spacing.md,
    backgroundColor: greenTheme.cardBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: greenTheme.border,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  orderNumber: {
    paddingTop: 5,
    fontSize: 18,
    color: greenTheme.primary,
    fontWeight: '700',
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: greenTheme.primaryLighter,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  statValue: {
    fontSize: 18,
    color: greenTheme.primary,
    fontWeight: '700',
  },
  badges: {
    alignItems: 'flex-end',
    marginTop: 18,
    gap: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  mapCard: {
    height: 250,
    padding: 0,
    overflow: 'hidden',
    backgroundColor: greenTheme.cardBackground,
    borderRadius: borderRadius.lg,
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
  currentLocationButton: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.sm,
    zIndex: 1000,
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
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
  fullscreenCurrentLocationButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.md,
    zIndex: 1000,
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
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
  infoTagContainer: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 1000,
  },
  fullscreenInfoTagContainer: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 1000,
  },
  infoTag: {
    padding: spacing.md,
    backgroundColor: greenTheme.cardBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: greenTheme.primary,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  infoTagClose: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: greenTheme.primaryLighter,
  },
  infoTagTitle: {
    fontSize: 16,
    color: greenTheme.primary,
    paddingRight: spacing.xl,
  },
  infoTagDetails: {
    gap: spacing.xs,
  },
  infoTagDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 1,
    backgroundColor: greenTheme.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    opacity: 0.9,
  },
  fullscreenMapContainer: {
    flex: 1,
    backgroundColor: greenTheme.background,
  },
  fullscreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: greenTheme.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: greenTheme.border,
  },
  closeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: greenTheme.primaryLighter,
    borderRadius: borderRadius.sm,
  },
  fullscreenMap: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignmentCard: {
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: greenTheme.border,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: greenTheme.primaryLighter,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  assignmentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  reportButton: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: greenTheme.primary,
    alignItems: 'center',
    backgroundColor: greenTheme.cardBackground,
  },
  reportButtonText: {
    color: greenTheme.primary,
    fontWeight: '600',
  },
  proofLink: {
    paddingVertical: spacing.xs / 2,
  },
  proofToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  proofGallery: {
    marginTop: spacing.xs,
  },
  proofPreviewCard: {
    width: 120,
    marginRight: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: greenTheme.cardBackground,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  proofImage: {
    width: '100%',
    height: 80,
    borderRadius: borderRadius.sm,
    backgroundColor: greenTheme.primaryLighter,
  },
  proofCaption: {
    marginTop: spacing.xs / 2,
    fontSize: 10,
  },
  materialsSection: {
    backgroundColor: greenTheme.primaryLighter,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  materialsTitle: {
    fontSize: 14,
    color: greenTheme.primary,
    fontWeight: '700',
  },
  materialCard: {
    backgroundColor: greenTheme.cardBackground,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dosageBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: greenTheme.cardBackground,
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  materialDetails: {
    gap: spacing.xs,
  },
  materialDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notesContainer: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: greenTheme.border,
  },
  actionButton: {
    marginTop: spacing.md,
  },
});

const parseWktPolygon = (wkt?: string | null): Coordinate[] => {
  if (!wkt) return [];
  const match = wkt.match(/\(\((.+)\)\)/);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((pair) => pair.trim())
    .map((pair) => {
      const [lng, lat] = pair.split(' ').map((value) => Number(value));
      return { latitude: lat, longitude: lng };
    });
};

const parseWktLineString = (wkt?: string | null): Coordinate[] => {
  if (!wkt) return [];
  const match = wkt.match(/\((.+)\)/);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((pair) => pair.trim())
    .map((pair) => {
      const [lng, lat] = pair.split(' ').map((value) => Number(value));
      return { latitude: lat, longitude: lng };
    });
};

const getRegionFromPoints = (points: Coordinate[]): {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} => {
  if (points.length === 0) {
    return DEFAULT_CENTER;
  }
  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLng = points[0].longitude;
  let maxLng = points[0].longitude;

  points.forEach((point) => {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLng = Math.min(minLng, point.longitude);
    maxLng = Math.max(maxLng, point.longitude);
  });

  const latitudeDelta = Math.max((maxLat - minLat) * 1.5, 0.01);
  const longitudeDelta = Math.max((maxLng - minLng) * 1.5, 0.01);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta,
    longitudeDelta,
  };
};

const getStatusBadgeStyle = (color: string): ViewStyle => {
  const base = StyleSheet.flatten(styles.statusBadge) || {};
  return {
    ...(base as ViewStyle),
    borderColor: color,
  };
};

const getPriorityBadgeStyle = (color: string): ViewStyle => {
  const base = StyleSheet.flatten(styles.priorityBadge) || {};
  return {
    ...(base as ViewStyle),
    borderColor: color,
  };
};
