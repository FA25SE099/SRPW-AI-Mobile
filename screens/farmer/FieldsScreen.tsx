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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueries } from '@tanstack/react-query';
import MapView, { Marker, Polygon as MapPolygon, Region} from 'react-native-maps';
import { colors, spacing, borderRadius, shadows } from '../../theme';
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
      <TouchableOpacity onPress={onPressCard} activeOpacity={0.85}>
        <View style={styles.fieldCardHeader}>
          <View style={styles.fieldIcon}>
            <Body>🌾</Body>
          </View>
          <View style={styles.fieldInfo}>
            <BodySemibold>{field.groupName}</BodySemibold>
            <BodySmall color={colors.textSecondary}>
              Plot #{field.soThua} • Sheet #{field.soTo}
            </BodySmall>
          </View>
          <TouchableOpacity onPress={onFocusOnMap}>
            <Body color={colors.primary}>📍</Body>
          </TouchableOpacity>
        </View>
        <Spacer size="md" />
        <View style={styles.fieldDetails}>
          <View style={styles.fieldDetailItem}>
            <BodySmall color={colors.textSecondary}>Area</BodySmall>
            <BodySemibold>{field.area} ha</BodySemibold>
          </View>
          <View style={styles.fieldDetailItem}>
            <BodySmall color={colors.textSecondary}>Status</BodySmall>
            <BodySemibold>{field.status}</BodySemibold>
          </View>
          <View style={styles.fieldDetailItem}>
            <BodySmall color={colors.textSecondary}>Active alerts</BodySmall>
            <BodySemibold>{field.activeAlerts}</BodySemibold>
          </View>
        </View>
      </TouchableOpacity>
      <Spacer size="md" />
      <View style={styles.buttonRow}>
        <Button
          variant="outline"
          size="sm"
          onPress={onPressCard}
          style={styles.actionButton}
        >
          View plans
        </Button>
        {hasCultivationPlans && (
          <Button
            variant="outline"
            size="sm"
            onPress={onReportIssue}
            style={styles.actionButton}
          >
            Report Issue
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
  const mapRef = useRef<MapView | null>(null);
  const fullscreenMapRef = useRef<MapView | null>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [pendingRegion, setPendingRegion] = useState<Region | null>(null);
  const [addresses, setAddresses] = useState<{ [plotId: string]: string }>({});
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

    return DEFAULT_CENTER;
  }, [pointMarkers, polygonOverlays]);

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

  const focusOnPlot = (plot: FarmerPlot, expand?: boolean) => {
    const coordinate = parsePointWkt(plot.coordinate);
    if (!coordinate) return;

    const region: Region = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };

    if (mapRef.current) {
      mapRef.current.animateToRegion(region, 500);
    }

    if (expand) {
      setPendingRegion(region);
      setIsMapFullscreen(true);
      requestAnimationFrame(() => {
        if (fullscreenMapRef.current) {
          fullscreenMapRef.current.animateToRegion(region, 500);
        }
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
          <H3 style={styles.headerTitle}>My Fields</H3>
          <TouchableOpacity
            onPress={() => router.push('/farmer/fields/add' as any)}
            style={styles.addButton}
          >
            <Body color={colors.primary}>+</Body>
          </TouchableOpacity>
        </View>

        <Spacer size="lg" />

        {/* Summary */}
        <View style={styles.summaryRow}>
          <Card variant="flat" style={styles.summaryCard}>
            <BodySmall color={colors.textSecondary}>Total fields</BodySmall>
            <H4>{plots?.length ?? 0}</H4>
          </Card>
          <Card variant="flat" style={styles.summaryCard}>
            <BodySmall color={colors.textSecondary}>Total area</BodySmall>
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
            <Body color={colors.white}>Full Screen</Body>
          </TouchableOpacity>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={mapRegion}
            mapType="hybrid"
            showsBuildings={true}
            showsPointsOfInterest={true}
            showsTraffic={false}
            showsCompass={true}
            showsScale={true}
          >
            {polygonOverlays.map((polygon) => (
              <MapPolygon
                key={polygon.plotId}
                coordinates={polygon.coordinates}
                strokeColor="#6C5CE7"
                fillColor="rgba(108, 92, 231, 0.25)"
                strokeWidth={2}
              />
            ))}

            {pointMarkers.map((marker) => (
              <Marker
                key={marker.plotId}
                coordinate={marker.coordinate}
                title={marker.groupName}
                description={marker.address}
              />
            ))}
          </MapView>
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
              <Button
                variant="outline"
                size="sm"
                onPress={() => {
                  const target = mapRegion;
                  if (fullscreenMapRef.current) {
                    fullscreenMapRef.current.animateToRegion(target, 500);
                  }
                }}
              >
                Reset View
              </Button>
            </View>
            <MapView
              ref={fullscreenMapRef}
              style={styles.fullscreenMap}
              initialRegion={mapRegion}
              mapType="hybrid"
              showsBuildings={true}
              showsPointsOfInterest={true}
              showsTraffic={false}
              showsCompass={true}
              showsScale={true}
            >
              {polygonOverlays.map((polygon) => (
                <MapPolygon
                  key={polygon.plotId}
                  coordinates={polygon.coordinates}
                  strokeColor="#6C5CE7"
                  fillColor="rgba(108, 92, 231, 0.25)"
                  strokeWidth={2}
                />
              ))}

              {pointMarkers.map((marker) => (
                <Marker
                  key={marker.plotId}
                  coordinate={marker.coordinate}
                  title={marker.groupName}
                  description={marker.address}
                />
              ))}
            </MapView>
          </SafeAreaView>
        </Modal>

        <Spacer size="xl" />

        {/* Fields List */}
        <H4>All Fields {plots ? `(${plots.length})` : ''}</H4>
        <Spacer size="md" />

        {isError && (
          <Card variant="elevated" style={styles.errorCard}>
            <BodySemibold>Unable to load plots</BodySemibold>
            <Spacer size="xs" />
            <BodySmall color={colors.textSecondary}>
              Please check your connection and try again.
            </BodySmall>
            <Spacer size="md" />
            <Button onPress={() => refetch()} size="sm">
              Try Again
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
              <BodySemibold>No plots found</BodySemibold>
              <Spacer size="xs" />
              <BodySmall color={colors.textSecondary}>
                Once your plots are assigned, they will appear here.
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
              onFocusOnMap={() => focusOnPlot(field, true)}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapCard: {
    height: 220,
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  summaryCard: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.backgroundSecondary,
  },
  fieldCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  fieldCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  fieldIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLighter,
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
    gap: spacing.md,
  },
  fieldDetailItem: {
    minWidth: '30%',
  },
  actionButton: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  errorCard: {
    padding: spacing.lg,
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  emptyState: {
    padding: spacing.lg,
    alignItems: 'flex-start',
  },
});

