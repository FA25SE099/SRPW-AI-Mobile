/**
 * Polygon Map Component (Mapbox)
 * Renders the map with plots, markers, and drawing polygon using Mapbox
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { colors } from '../../theme';
import { PlotDTO, PolygonTask, PlotStatus } from '../../libs/supervisor';
import { parsePolygonWkt, getCoordinatesFromGeoJSON } from '../../utils/polygon-utils';

// Conditionally import Mapbox - only if native module is available
// DO NOT initialize here - it's initialized in app/_layout.tsx
let Mapbox: typeof import('@rnmapbox/maps') | null = null;
try {
  Mapbox = require('@rnmapbox/maps');
} catch (error) {
  console.warn('Mapbox native module not available. Rebuild required:', error);
}

type PolygonMapboxProps = {
  mapRef: React.RefObject<any>;
  cameraRef: React.RefObject<any>;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  plots: PlotDTO[];
  tasks: PolygonTask[];
  drawnPolygon: Array<{ latitude: number; longitude: number }>;
  focusedPlotId: string | null;
  onMapPress: (coordinate: { latitude: number; longitude: number }) => void;
};

const getStatusColor = (status: PlotStatus): string => {
  switch (status) {
    case 'Active':
      return colors.success;
    case 'Emergency':
      return colors.error;
    case 'Inactive':
      return colors.textSecondary;
    default:
      return colors.textSecondary;
  }
};

// Convert polygon coordinates to GeoJSON format for Mapbox
const coordinatesToGeoJSON = (coords: Array<{ latitude: number; longitude: number }>) => {
  // Mapbox uses [longitude, latitude] format
  const coordinates = coords.map(c => [c.longitude, c.latitude]);
  // Close the polygon ring
  if (coordinates.length > 0) {
    coordinates.push(coordinates[0]);
  }
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates],
    },
    properties: {},
  };
};

// Convert WKT to GeoJSON for Mapbox
const wktToGeoJSON = (wkt: string) => {
  try {
    const coords = parsePolygonWkt(wkt);
    if (!coords) return null;
    
    // Convert to [longitude, latitude] format
    const coordinates = coords.map(c => [c.longitude, c.latitude]);
    // Ensure polygon is closed
    if (coordinates.length > 0) {
      coordinates.push(coordinates[0]);
    }
    
    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates],
      },
      properties: {},
    };
  } catch (error) {
    console.error('Error converting WKT to GeoJSON:', error);
    return null;
  }
};

export const PolygonMapbox: React.FC<PolygonMapboxProps> = ({
  mapRef,
  cameraRef,
  initialRegion,
  plots,
  tasks,
  drawnPolygon,
  focusedPlotId,
  onMapPress,
}) => {
  useEffect(() => {
    // Update camera when initial region changes
    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [initialRegion.longitude, initialRegion.latitude],
        zoomLevel: 13,
        animationDuration: 1000,
      });
    }
  }, [initialRegion, cameraRef]);

  const handleMapPress = (feature: any) => {
    const { geometry } = feature;
    if (geometry && geometry.coordinates) {
      const [longitude, latitude] = geometry.coordinates;
      onMapPress({ latitude, longitude });
    }
  };

  // Create GeoJSON features for all plot boundaries
  const plotBoundaries = plots
    .filter(plot => plot.boundaryGeoJson)
    .map(plot => {
      const hasTask = tasks.find(t => t.plotId === plot.plotId);
      const geoJSON = wktToGeoJSON(plot.boundaryGeoJson || '');
      
      if (!geoJSON) return null;

      return {
        ...geoJSON,
        properties: {
          plotId: plot.plotId,
          hasTask: !!hasTask,
          status: plot.status,
          isFocused: focusedPlotId === plot.plotId,
          soThua: plot.soThua,
          soTo: plot.soTo,
        },
      };
    })
    .filter(Boolean);

  // Create point features for plot centers
  const plotCenters = plots
    .filter(plot => plot.coordinateGeoJson)
    .map(plot => {
      const coord = getCoordinatesFromGeoJSON(plot.coordinateGeoJson || '');
      if (!coord) return null;

      const hasTask = tasks.find(t => t.plotId === plot.plotId);

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [coord.longitude, coord.latitude],
        },
        properties: {
          plotId: plot.plotId,
          hasTask: !!hasTask,
          soThua: plot.soThua,
          soTo: plot.soTo,
          title: `Plot ${plot.soThua}/${plot.soTo}`,
        },
      };
    })
    .filter(Boolean);

  // Convert drawn polygon to GeoJSON
  const drawnPolygonGeoJSON = drawnPolygon.length >= 3 
    ? coordinatesToGeoJSON(drawnPolygon)
    : null;

  // Show helpful error if Mapbox native module is not available
  if (!Mapbox) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorTitle}>Mapbox Not Available</Text>
        <Text style={styles.errorText}>
          Mapbox requires native code. Please rebuild the app:
        </Text>
        <Text style={styles.errorCode}>
          npx expo run:android{'\n'}
          or{'\n'}
          npx expo run:ios
        </Text>
        <Text style={styles.errorLink}>
          See: https://rnmapbox.github.io/docs/install
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        ref={mapRef}
        style={styles.map}
        styleURL="mapbox://styles/mapbox/satellite-streets-v12"
        onPress={handleMapPress}
        compassEnabled={true}
        scaleBarEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <Mapbox.Camera
          ref={cameraRef}
          zoomLevel={13}
          centerCoordinate={[initialRegion.longitude, initialRegion.latitude]}
          animationMode="flyTo"
          animationDuration={1000}
        />

        {/* Plot Boundaries Layer */}
        {plotBoundaries.length > 0 && (
          <Mapbox.ShapeSource
            id="plot-boundaries-source"
            shape={{
              type: 'FeatureCollection',
              features: plotBoundaries as any,
            }}
          >
            {/* Fill layer */}
            <Mapbox.FillLayer
              id="plot-boundaries-fill"
              style={{
                fillColor: [
                  'case',
                  ['get', 'hasTask'],
                  '#F59E0B',
                  [
                    'match',
                    ['get', 'status'],
                    'Active',
                    colors.success,
                    'Emergency',
                    colors.error,
                    colors.textSecondary,
                  ],
                ],
                fillOpacity: 0.3,
              }}
            />
            {/* Stroke layer */}
            <Mapbox.LineLayer
              id="plot-boundaries-line"
              style={{
                lineColor: [
                  'case',
                  ['get', 'hasTask'],
                  '#F59E0B',
                  [
                    'match',
                    ['get', 'status'],
                    'Active',
                    colors.success,
                    'Emergency',
                    colors.error,
                    colors.textSecondary,
                  ],
                ],
                lineWidth: [
                  'case',
                  ['get', 'isFocused'],
                  3,
                  2,
                ],
                lineOpacity: 1,
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* Plot Centers (Markers) */}
        {plotCenters.map((feature: any) => (
          <Mapbox.PointAnnotation
            key={feature.properties.plotId}
            id={`marker-${feature.properties.plotId}`}
            coordinate={feature.geometry.coordinates}
            title={feature.properties.title}
          >
            <View
              style={[
                styles.marker,
                {
                  backgroundColor: feature.properties.hasTask
                    ? '#F59E0B'
                    : colors.success,
                },
              ]}
            />
          </Mapbox.PointAnnotation>
        ))}

        {/* Drawn Polygon */}
        {drawnPolygonGeoJSON && (
          <Mapbox.ShapeSource
            id="drawn-polygon-source"
            shape={drawnPolygonGeoJSON as any}
          >
            <Mapbox.FillLayer
              id="drawn-polygon-fill"
              style={{
                fillColor: colors.primary,
                fillOpacity: 0.4,
              }}
            />
            <Mapbox.LineLayer
              id="drawn-polygon-line"
              style={{
                lineColor: colors.primary,
                lineWidth: 3,
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* Drawn Points */}
        {drawnPolygon.map((point, index) => (
          <Mapbox.PointAnnotation
            key={`point-${index}`}
            id={`point-${index}`}
            coordinate={[point.longitude, point.latitude]}
          >
            <View style={[styles.pointMarker, { backgroundColor: colors.primary }]} />
          </Mapbox.PointAnnotation>
        ))}
      </Mapbox.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorCode: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: colors.primary,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorLink: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  marker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  pointMarker: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

