/**
 * Polygon Map Component
 * Renders the map with plots, markers, and drawing polygon
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Polygon as MapPolygon, Region, LatLng } from 'react-native-maps';
import { colors } from '../../theme';
import { PlotDTO, PolygonTask, PlotStatus } from '../../libs/supervisor';
import { parsePolygonWkt, getCoordinatesFromGeoJSON } from '../../utils/polygon-utils';

type PlotPolygon = {
  plotId: string;
  coordinates: LatLng[];
  status: PlotStatus;
  hasTask: boolean;
  soThua: number;
  soTo: number;
};

type PlotCenter = {
  plotId: string;
  coordinate: LatLng;
  soThua: number;
  soTo: number;
  hasTask: boolean;
};

type PolygonMapProps = {
  mapRef: React.RefObject<MapView | null>;
  initialRegion: Region;
  plots: PlotDTO[];
  tasks: PolygonTask[];
  drawnPolygon: LatLng[];
  focusedPlotId: string | null;
  onMapPress: (event: any) => void;
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

export const PolygonMap: React.FC<PolygonMapProps> = ({
  mapRef,
  initialRegion,
  plots,
  tasks,
  drawnPolygon,
  focusedPlotId,
  onMapPress,
}) => {
  // Compute plot polygons
  const plotPolygons: PlotPolygon[] = plots
    .map((plot) => {
      if (!plot.boundaryGeoJson) return null;
      const coords = parsePolygonWkt(plot.boundaryGeoJson);
      if (!coords) return null;

      const hasTask = tasks.find((t) => t.plotId === plot.plotId);

      return {
        plotId: plot.plotId,
        coordinates: coords,
        status: plot.status,
        hasTask: !!hasTask,
        soThua: plot.soThua,
        soTo: plot.soTo,
      };
    })
    .filter((poly): poly is PlotPolygon => poly !== null);

  // Compute plot centers
  const plotCenters: PlotCenter[] = plots
    .map((plot) => {
      if (!plot.coordinateGeoJson) return null;
      const coord = getCoordinatesFromGeoJSON(plot.coordinateGeoJson);
      if (!coord) return null;

      return {
        plotId: plot.plotId,
        coordinate: coord,
        soThua: plot.soThua,
        soTo: plot.soTo,
        hasTask: !!tasks.find((t) => t.plotId === plot.plotId),
      };
    })
    .filter((marker): marker is PlotCenter => marker !== null);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        mapType="hybrid"
        showsBuildings={true}
        showsPointsOfInterest={true}
        showsCompass={true}
        showsScale={true}
        onPress={onMapPress}
      >
        {plotPolygons.map((poly) => (
          <MapPolygon
            key={poly.plotId}
            coordinates={poly.coordinates}
            fillColor={
              poly.hasTask
                ? '#F59E0B40'
                : getStatusColor(poly.status) + '40'
            }
            strokeColor={
              poly.hasTask
                ? '#F59E0B'
                : getStatusColor(poly.status)
            }
            strokeWidth={focusedPlotId === poly.plotId ? 3 : 2}
          />
        ))}

        {plotCenters.map((marker) => (
          <Marker
            key={marker.plotId}
            coordinate={marker.coordinate}
            title={`Plot ${marker.soThua}/${marker.soTo}`}
            pinColor={marker.hasTask ? '#F59E0B' : colors.success}
          />
        ))}

        {drawnPolygon.length > 0 && (
          <MapPolygon
            coordinates={drawnPolygon}
            fillColor={colors.primary + '40'}
            strokeColor={colors.primary}
            strokeWidth={3}
          />
        )}

        {drawnPolygon.map((point, index) => (
          <Marker
            key={index}
            coordinate={point}
            pinColor={colors.primary}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

