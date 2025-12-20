/**
 * Reusable Mapbox Map Component
 * For displaying polygons, markers, and polylines
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { colors } from '../../theme';
import { Coordinate } from '../../types/coordinates';

// Conditionally import Mapbox - only if native module is available
// DO NOT initialize here - it's initialized in app/_layout.tsx
let Mapbox: typeof import('@rnmapbox/maps') | null = null;
try {
  Mapbox = require('@rnmapbox/maps');
} catch (error) {
  console.warn('Mapbox native module not available. Rebuild required:', error);
}

export type PolygonData = {
  id: string;
  coordinates: Coordinate[];
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
};

export type MarkerData = {
  id: string;
  coordinate: Coordinate;
  title?: string;
  description?: string;
  color?: string;
};

export type PolylineData = {
  id: string;
  coordinates: Coordinate[];
  strokeColor?: string;
  strokeWidth?: number;
};

type MapboxMapProps = {
  mapRef: React.RefObject<any>;
  cameraRef: React.RefObject<any>;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  polygons?: PolygonData[];
  markers?: MarkerData[];
  polylines?: PolylineData[];
  focusedId?: string | null;
  onMapPress?: (coordinate: Coordinate) => void;
  onPolygonPress?: (polygonId: string, coordinate: Coordinate) => void;
  style?: any;
};

// Convert coordinates to GeoJSON format for Mapbox
const coordinatesToGeoJSON = (coords: Coordinate[]) => {
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

// Convert polyline coordinates to GeoJSON
const polylineToGeoJSON = (coords: Coordinate[]) => {
  const coordinates = coords.map(c => [c.longitude, c.latitude]);
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates,
    },
    properties: {},
  };
};

export const MapboxMap: React.FC<MapboxMapProps> = ({
  mapRef,
  cameraRef,
  initialRegion,
  polygons = [],
  markers = [],
  polylines = [],
  focusedId = null,
  onMapPress,
  onPolygonPress,
  style,
}) => {
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    // Update camera when initial region changes
    if (cameraRef.current) {
      // Convert latitudeDelta to zoom level (approximate)
      // latitudeDelta of 0.01 ≈ zoom 15, 0.05 ≈ zoom 13, 0.1 ≈ zoom 11
      const zoomLevel = Math.max(8, Math.min(20, Math.log2(360 / Math.max(initialRegion.latitudeDelta, 0.001))));
      cameraRef.current.setCamera({
        centerCoordinate: [initialRegion.longitude, initialRegion.latitude],
        zoomLevel,
        animationDuration: 1000,
      });
    }
  }, [initialRegion, cameraRef]);

  // Suppress Mapbox logger errors for network issues
  useEffect(() => {
    if (!Mapbox) return;
    
    // Intercept Mapbox logger to suppress network-related errors
    const originalLog = console.error;
    const errorInterceptor = (...args: any[]) => {
      const message = args.join(' ');
      // Suppress network/tile loading errors as they're usually temporary
      if (message.includes('MapLoad error') || 
          message.includes('Failed to load tile') || 
          message.includes('network connection') ||
          message.includes('network connection was lost')) {
        // Silently ignore - Mapbox will retry automatically
        return;
      }
      // Let other errors through
      originalLog(...args);
    };
    
    // Note: Mapbox uses its own logger, so we can't easily intercept it
    // Instead, we'll handle errors via the onDidFailLoadingMap callback
    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleMapError = () => {
    // Mapbox's onDidFailLoadingMap doesn't pass error details
    // Network errors are usually temporary and Mapbox retries automatically
    // We'll just log a note and clear any error state
    console.log('[Mapbox] Map loading issue detected (will retry automatically)');
    setMapError(null);
  };

  const handleMapLoaded = () => {
    // Clear any previous errors when map loads successfully
    setMapError(null);
  };

  // Cleanup on unmount to prevent TurboModule issues
  useEffect(() => {
    return () => {
      // Cleanup refs on unmount
      if (mapRef.current) {
        mapRef.current = null;
      }
      if (cameraRef.current) {
        cameraRef.current = null;
      }
    };
  }, [mapRef, cameraRef]);

  const handleMapPress = (feature: any) => {
    // Don't handle map press if we're expecting polygon presses
    // This prevents MapView from intercepting polygon taps
    if (onPolygonPress) {
      return;
    }
    
    if (!onMapPress) return;
    const { geometry } = feature;
    if (geometry && geometry.coordinates) {
      const [longitude, latitude] = geometry.coordinates;
      onMapPress({ latitude, longitude });
    }
  };

  const handlePolygonPress = (event: any) => {
    if (!onPolygonPress) return;
    
    console.log('[MapboxMap] Polygon press event received:', JSON.stringify(event, null, 2));
    
    // Mapbox ShapeSource onPress provides event with features array
    // Event structure: { features: [{ geometry, properties, ... }], point: { x, y }, ... }
    const features = event?.features || [];
    if (features.length === 0) {
      console.warn('[MapboxMap] No features in press event');
      return;
    }
    
    // Get the first feature (the polygon that was tapped)
    const feature = features[0];
    const { geometry, properties } = feature || {};
    
    console.log('[MapboxMap] Feature data:', { geometry: geometry?.type, properties });
    
    if (!properties?.id) {
      console.warn('[MapboxMap] No polygon ID found in feature properties:', properties);
      return;
    }
    
    let coordinate: Coordinate;
    
    if (geometry?.type === 'Polygon' && geometry.coordinates?.[0]?.[0]) {
      // Get center of polygon
      const coords = geometry.coordinates[0];
      const centerLng = coords.reduce((sum: number, c: number[]) => sum + c[0], 0) / coords.length;
      const centerLat = coords.reduce((sum: number, c: number[]) => sum + c[1], 0) / coords.length;
      coordinate = { latitude: centerLat, longitude: centerLng };
    } else if (geometry?.coordinates) {
      const [longitude, latitude] = geometry.coordinates;
      coordinate = { latitude, longitude };
    } else {
      console.warn('[MapboxMap] Invalid geometry:', geometry);
      return;
    }
    
    console.log('[MapboxMap] Calling onPolygonPress with ID:', properties.id, 'coordinate:', coordinate);
    onPolygonPress(properties.id, coordinate);
  };

  // Show helpful error if Mapbox native module is not available
  if (!Mapbox) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Text style={styles.errorTitle}>Mapbox Not Available</Text>
        <Text style={styles.errorText}>
          Mapbox requires native code. Please rebuild the app:
        </Text>
        <Text style={styles.errorCode}>
          npx expo run:android{'\n'}
          or{'\n'}
          npx expo run:ios
        </Text>
      </View>
    );
  }

  // Create GeoJSON features for polygons
  const polygonFeatures = polygons.map((polygon) => {
    const geoJSON = coordinatesToGeoJSON(polygon.coordinates);
    return {
      ...geoJSON,
      properties: {
        id: polygon.id,
        isFocused: focusedId === polygon.id,
        strokeColor: polygon.strokeColor || colors.primary,
        fillColor: polygon.fillColor || `${colors.primary}40`,
        strokeWidth: polygon.strokeWidth || 2,
      },
    };
  });

  // Create GeoJSON features for polylines
  const polylineFeatures = polylines.map((polyline) => {
    const geoJSON = polylineToGeoJSON(polyline.coordinates);
    return {
      ...geoJSON,
      properties: {
        id: polyline.id,
        strokeColor: polyline.strokeColor || colors.primary,
        strokeWidth: polyline.strokeWidth || 3,
      },
    };
  });

  return (
    <View style={[styles.container, style]}>
      <Mapbox.MapView
        ref={mapRef}
        style={styles.map}
        styleURL="mapbox://styles/mapbox/satellite-streets-v12"
        onPress={onMapPress ? handleMapPress : undefined}
        onMapLoadingError={handleMapError}
        onDidFinishLoadingMap={handleMapLoaded}
        compassEnabled={true}
        scaleBarEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <Mapbox.Camera
          ref={cameraRef}
          zoomLevel={Math.max(8, Math.min(20, Math.log2(360 / Math.max(initialRegion.latitudeDelta, 0.001))))}
          centerCoordinate={[initialRegion.longitude, initialRegion.latitude]}
          animationMode="flyTo"
          animationDuration={1000}
        />

        {/* Polygons Layer */}
        {polygonFeatures.length > 0 && (
          <Mapbox.ShapeSource
            id="polygons-source"
            shape={{
              type: 'FeatureCollection',
              features: polygonFeatures as any,
            }}
            onPress={onPolygonPress ? handlePolygonPress : undefined}
          >
            {/* Fill layer - must be interactive for taps */}
            <Mapbox.FillLayer
              id="polygons-fill"
              style={{
                fillColor: ['get', 'fillColor'],
                fillOpacity: 0.4,
              }}
            />
            {/* Stroke layer */}
            <Mapbox.LineLayer
              id="polygons-line"
              style={{
                lineColor: ['get', 'strokeColor'],
                lineWidth: [
                  'case',
                  ['get', 'isFocused'],
                  ['get', 'strokeWidth'],
                  ['-', ['get', 'strokeWidth'], 1],
                ],
                lineOpacity: 1,
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* Polylines Layer */}
        {polylineFeatures.length > 0 && (
          <Mapbox.ShapeSource
            id="polylines-source"
            shape={{
              type: 'FeatureCollection',
              features: polylineFeatures as any,
            }}
          >
            <Mapbox.LineLayer
              id="polylines-line"
              style={{
                lineColor: ['get', 'strokeColor'],
                lineWidth: ['get', 'strokeWidth'],
                lineOpacity: 1,
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* Markers */}
        {markers.map((marker) => (
          <Mapbox.PointAnnotation
            key={marker.id}
            id={`marker-${marker.id}`}
            coordinate={[marker.coordinate.longitude, marker.coordinate.latitude]}
            title={marker.title}
          >
            <View
              style={[
                styles.marker,
                {
                  backgroundColor: marker.color || colors.primary,
                },
              ]}
            />
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
    textAlign: 'center',
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
});

