/**
 * UAV Order Detail Screen
 * View spraying zone maps, materials, dosage, and timing
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
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
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
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

const DEFAULT_CENTER = {
  latitude: 11.2,
  longitude: 106.5,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
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
          ? colors.primary
          : getStatusColor(polygon.status),
      fillColor:
        focusedPlotId && focusedPlotId === polygon.plotId
          ? `${colors.primary}40`
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
        strokeColor: colors.primary,
        strokeWidth: 3,
      },
    ];
  }, [routeCoordinates]);

  const mapboxMarkers = useMemo<MarkerData[]>(() => {
    if (assignmentPolygons.length === 0) return [];
    return [
      {
        id: 'first-plot',
        coordinate: assignmentPolygons[0].coordinates[0],
        title: assignmentPolygons[0].plotName,
      },
    ];
  }, [assignmentPolygons]);

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

  const canStartExecution =
    order.status === 'Pending' || order.status === 'InProgress' || order.status === 'In Progress';

  const focusPlotOnMap = (plotId: string) => {
    setFocusedPlotId(plotId);
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

  return (
    <SafeAreaView style={styles.container}>
      <Container padding="lg">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Body>←</Body>
          </TouchableOpacity>
          <H3 style={styles.headerTitle}>Order Details</H3>
          <View style={styles.headerRight} />
        </View>

        <Spacer size="lg" />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Order Header */}
          <Card variant="elevated" style={styles.card}>
            <View style={styles.orderHeader}>
              <View style={styles.orderInfo}>
                <BodySmall color={colors.textSecondary}>Order</BodySmall>
                <BodySemibold style={styles.orderNumber}>{order.orderName}</BodySemibold>
                <BodySmall color={colors.textSecondary}>{order.groupName}</BodySmall>
                {order.vendorName && (
                  <BodySmall color={colors.textSecondary}>Vendor: {order.vendorName}</BodySmall>
                )}
              </View>
              <View style={styles.badges}>
                <Badge
                  variant="neutral"
                  style={getStatusBadgeStyle(getStatusColor(order.status))}
                >
                  <BodySmall style={{ color: getStatusColor(order.status) }}>
                    {order.status.replace(/([A-Z])/g, ' $1').trim()}
                  </BodySmall>
                </Badge>
                <Spacer size="xs" />
                <Badge
                  variant="neutral"
                  style={getPriorityBadgeStyle(getPriorityColor(order.priority))}
                >
                  <BodySmall style={{ color: getPriorityColor(order.priority) }}>
                    {order.priority}
                  </BodySmall>
                </Badge>
              </View>
            </View>
            <Spacer size="lg" />
            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <BodySmall color={colors.textSecondary}>Area</BodySmall>
                <BodySemibold style={styles.statValue}>{order.totalArea.toFixed(2)} ha</BodySemibold>
              </View>
              <View style={styles.statCard}>
                <BodySmall color={colors.textSecondary}>Plots</BodySmall>
                <BodySemibold style={styles.statValue}>{order.totalPlots}</BodySemibold>
              </View>
              <View style={styles.statCard}>
                <BodySmall color={colors.textSecondary}>Completion</BodySmall>
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
              <Body color={colors.white}>Full Screen</Body>
            </TouchableOpacity>
            <MapboxMap
              mapRef={mapRef}
              cameraRef={cameraRef}
              initialRegion={mapRegion}
              polygons={mapboxPolygons}
              markers={mapboxMarkers}
              polylines={mapboxPolylines}
              focusedId={focusedPlotId}
              style={styles.map}
            />
          </Card>

          <Spacer size="md" />

          {/* Schedule */}
          <Card variant="elevated" style={styles.card}>
            <H4>Schedule</H4>
            <Spacer size="md" />
            <View style={styles.infoRow}>
              <BodySmall color={colors.textSecondary}>Scheduled:</BodySmall>
              <BodySemibold>
                {dayjs(order.scheduledDate).format('MMM D, YYYY')}
                {order.scheduledTime ? ` • ${order.scheduledTime}` : ''}
              </BodySemibold>
            </View>
            {order.startedAt && (
              <>
                <Spacer size="sm" />
                <View style={styles.infoRow}>
                  <BodySmall color={colors.textSecondary}>Started:</BodySmall>
                  <BodySemibold>{dayjs(order.startedAt).format('MMM D, YYYY h:mm A')}</BodySemibold>
                </View>
              </>
            )}
            {order.completedAt && (
              <>
                <Spacer size="sm" />
                <View style={styles.infoRow}>
                  <BodySmall color={colors.textSecondary}>Completed:</BodySmall>
                  <BodySemibold>
                    {dayjs(order.completedAt).format('MMM D, YYYY h:mm A')}
                  </BodySemibold>
                </View>
              </>
            )}
            <Spacer size="sm" />
            <View style={styles.infoRow}>
              <BodySmall color={colors.textSecondary}>Estimated Cost:</BodySmall>
              <BodySemibold>{order.estimatedCost?.toLocaleString() ?? 0}₫</BodySemibold>
            </View>
            <Spacer size="sm" />
            <View style={styles.infoRow}>
              <BodySmall color={colors.textSecondary}>Actual Cost:</BodySmall>
              <BodySemibold>{order.actualCost?.toLocaleString() ?? 0}₫</BodySemibold>
            </View>
          </Card>

          <Spacer size="md" />

          {/* Materials */}
          <Card variant="elevated" style={styles.card}>
            <H4>Materials & Dosage</H4>
            <Spacer size="md" />
            {order.materials.length === 0 && (
              <BodySmall color={colors.textSecondary}>No materials assigned.</BodySmall>
            )}
            {order.materials.map((material) => (
              <View key={material.materialId} style={styles.materialCard}>
                <View style={styles.materialHeader}>
                  <BodySemibold>{material.materialName}</BodySemibold>
                  <Badge variant="neutral" style={styles.dosageBadge}>
                    <BodySmall>{material.quantityPerHa} {material.materialUnit}/ha</BodySmall>
                  </Badge>
                </View>
                <Spacer size="sm" />
                <View style={styles.materialDetails}>
                  <View style={styles.materialDetailItem}>
                    <BodySmall color={colors.textSecondary}>Total Quantity:</BodySmall>
                    <BodySemibold>
                      {material.totalQuantityRequired} {material.materialUnit}
                    </BodySemibold>
                  </View>
                  <View style={styles.materialDetailItem}>
                    <BodySmall color={colors.textSecondary}>Est. Cost:</BodySmall>
                    <BodySemibold>
                      {material.totalEstimatedCost.toLocaleString()}₫
                    </BodySemibold>
                  </View>
                </View>
              </View>
            ))}
          </Card>

          <Spacer size="md" />

          {/* Plot Assignments */}
          <Card variant="elevated" style={styles.card}>
            <H4>Plot Assignments</H4>
            <Spacer size="md" />
            {order.plotAssignments.map((assignment) => (
              <TouchableOpacity
                key={assignment.plotId}
                style={styles.assignmentCard}
                activeOpacity={0.9}
                onPress={() => focusPlotOnMap(assignment.plotId)}
              >
                <View style={styles.assignmentHeader}>
                  <View>
                    <BodySemibold>{assignment.plotName}</BodySemibold>
                    <BodySmall color={colors.textSecondary}>
                      Area: {assignment.servicedArea} ha
                    </BodySmall>
                  </View>
                  <Badge
                    variant="neutral"
                    style={getStatusBadgeStyle(getStatusColor(assignment.status))}
                  >
                    <BodySmall style={{ color: getStatusColor(assignment.status) }}>
                      {assignment.status.replace(/([A-Z])/g, ' $1').trim()}
                    </BodySmall>
                  </Badge>
                </View>
                <Spacer size="sm" />
                <View style={styles.assignmentMeta}>
                  <BodySmall color={colors.textSecondary}>Actual Cost:</BodySmall>
                  <BodySemibold>
                    {assignment.actualCost ? `${assignment.actualCost.toLocaleString()}₫` : '—'}
                  </BodySemibold>
                </View>
                {assignment.completionDate && (
                  <View style={styles.assignmentMeta}>
                    <BodySmall color={colors.textSecondary}>Completed:</BodySmall>
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
                {assignment.proofUrls.length > 0 && (
                  <>
                    <Spacer size="xs" />
                    <TouchableOpacity
                      style={styles.proofToggle}
                      onPress={() =>
                        setExpandedProofs((prev) => ({
                          ...prev,
                          [assignment.plotId]: !prev[assignment.plotId],
                        }))
                      }
                    >
                      <BodySmall color={colors.textSecondary}>
                        Proofs ({assignment.proofUrls.length})
                      </BodySmall>
                      <Body style={{ color: colors.primary }}>
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
                    <TouchableOpacity
                      style={styles.reportButton}
                      onPress={() =>
                        router.push({
                          pathname: '/uav/orders/[orderId]/report',
                          params: {
                            orderId: order.orderId,
                            plotId: assignment.plotId,
                            plotName: assignment.plotName,
                            servicedArea: assignment.servicedArea.toString(),
                          },
                        } as any)
                      }
                    >
                      <BodySemibold style={styles.reportButtonText}>Report Completion</BodySemibold>
                    </TouchableOpacity>
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
                <Body color={colors.primary}>Close</Body>
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
                Reset View
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
              style={styles.fullscreenMap}
            />
          </SafeAreaView>
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
  },
  backButton: {
    alignSelf: 'flex-start',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  card: {
    padding: spacing.md,
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
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 18,
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
    borderColor: colors.border,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapCard: {
    height: 250,
    padding: 0,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  expandButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  fullscreenMapContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullscreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  closeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
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
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    borderColor: colors.primary,
    alignItems: 'center',
  },
  reportButtonText: {
    color: colors.primary,
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
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.xs,
  },
  proofImage: {
    width: '100%',
    height: 80,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
  },
  proofCaption: {
    marginTop: spacing.xs / 2,
    fontSize: 10,
  },
  materialCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dosageBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
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
    borderTopColor: colors.borderLight,
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

