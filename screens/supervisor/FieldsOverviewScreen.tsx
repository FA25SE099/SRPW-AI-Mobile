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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MapView, { Marker, Polygon, Polyline, Region } from 'react-native-maps';
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
} from '../../components/ui';
import { useUser } from '../../libs/auth';
import { FarmerPlot } from '../../types/api';
import { getCurrentFarmerPlots } from '../../libs/farmer';

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
  const mapRef = useRef<MapView | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null);

  // TODO: Replace with supervisor-specific API call
  // const { data: plots, isLoading, isError } = useQuery({
  //   queryKey: ['supervisor-plots', user?.id],
  //   queryFn: () => getSupervisedPlots({ supervisorId: user?.id }),
  // });

  // For now, using mock data
  const mockPlots: FarmerPlot[] = [
    {
      plotId: '1',
      area: 2.5,
      soThua: 16,
      soTo: 58,
      status: 'active',
      groupId: 'group1',
      groupName: 'DongThap1',
      activeCultivations: 1,
      activeAlerts: 0,
      boundary: 'POLYGON ((106.7107264253334 10.884543832447122, 106.7107264253334 10.88461420845745, 106.71102901215232 10.884782328858108, 106.71109271464098 10.884782328858108, 106.71226324787057 10.884469546640403, 106.7122950991149 10.884410899937805, 106.71224334084167 10.884180222795635, 106.71217565694866 10.88415285430932, 106.7107264253334 10.884543832447122))',
      coordinate: 'POINT (106.71136654907801 10.883609895322609)',
    },
  ];

  const plots = mockPlots;

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
      .filter((marker) => marker !== null);
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
      .filter((poly) => poly !== null);
  }, [plots]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'needs-attention':
        return colors.error;
      case 'completed':
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  const initialRegion: Region = pointMarkers.length > 0
    ? {
        latitude: pointMarkers[0].coordinate.latitude,
        longitude: pointMarkers[0].coordinate.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: 10.8836,
        longitude: 106.7114,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

  const handlePlotSelect = (plotId: string) => {
    setSelectedPlot(plotId);
    const plot = plots.find((p) => p.plotId === plotId);
    if (plot) {
      const coordinate = parsePointWkt(plot.coordinate);
      if (coordinate && mapRef.current) {
        mapRef.current.animateToRegion(
          {
            ...coordinate,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          500,
        );
      }
    }
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

        {/* Map View */}
        <Card variant="elevated" style={styles.mapCard}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={initialRegion}
            mapType="hybrid"
            showsBuildings={true}
            showsPointsOfInterest={true}
            showsCompass={true}
            showsScale={true}
          >
            {polygons.map((poly) => (
              <Polygon
                key={poly.plotId}
                coordinates={poly.coordinates}
                fillColor={
                  selectedPlot === poly.plotId
                    ? getStatusColor(poly.status) + '80'
                    : getStatusColor(poly.status) + '40'
                }
                strokeColor={getStatusColor(poly.status)}
                strokeWidth={selectedPlot === poly.plotId ? 3 : 2}
              />
            ))}
            {pointMarkers.map((marker) => (
              <Marker
                key={marker.plotId}
                coordinate={marker.coordinate}
                title={marker.plotName}
                description={marker.groupName}
                pinColor={getStatusColor(marker.status)}
              />
            ))}
          </MapView>
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
              </Card>
              <Spacer size="sm" />
            </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
});

