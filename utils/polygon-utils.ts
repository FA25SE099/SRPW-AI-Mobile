/**
 * Polygon utility functions
 * WKT/GeoJSON conversion and polygon calculations
 */

import { LatLng } from 'react-native-maps';

/**
 * Convert WKT string to GeoJSON object
 */
export const convertWKTToGeoJSON = (wkt: string): any | null => {
  try {
    const cleanWkt = wkt.trim().replace(/\s+/g, ' ');

    if (cleanWkt.startsWith('POLYGON')) {
      const coordinatesMatch = cleanWkt.match(/POLYGON\s*\(\s*\(([^)]+)\)\s*\)/);
      if (!coordinatesMatch) return null;

      const coordString = coordinatesMatch[1];
      const pairs = coordString
        .split(',')
        .map((pair) => {
          const [lng, lat] = pair
            .trim()
            .split(/\s+/)
            .map(Number);
          if (isNaN(lng) || isNaN(lat) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return null;
          }
          return [lng, lat];
        })
        .filter((coord): coord is [number, number] => coord !== null);

      return {
        type: 'Polygon',
        coordinates: [pairs],
      };
    }

    if (cleanWkt.startsWith('POINT')) {
      const coordinatesMatch = cleanWkt.match(/POINT\s*\(\s*([^)]+)\s*\)/);
      if (!coordinatesMatch) return null;

      const coords = coordinatesMatch[1]
        .trim()
        .split(/\s+/)
        .map(Number);
      const [first, second] = coords;

      let lng, lat;
      if (Math.abs(first) > 90) {
        lng = first;
        lat = second;
      } else {
        lat = first;
        lng = second;
      }

      if (isNaN(lng) || isNaN(lat) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return null;
      }

      return {
        type: 'Point',
        coordinates: [lng, lat],
      };
    }

    return null;
  } catch (error) {
    console.error('Error converting WKT to GeoJSON:', error);
    return null;
  }
};

/**
 * Get coordinates from GeoJSON string (WKT or JSON)
 */
export const getCoordinatesFromGeoJSON = (
  geoJsonString: string,
): { latitude: number; longitude: number } | null => {
  try {
    let parsed: any;

    if (geoJsonString.startsWith('POLYGON') || geoJsonString.startsWith('POINT')) {
      parsed = convertWKTToGeoJSON(geoJsonString);
    } else {
      parsed = JSON.parse(geoJsonString);
    }

    if (!parsed) return null;

    if (parsed.type === 'Point' && parsed.coordinates) {
      const [lng, lat] = parsed.coordinates;
      if (typeof lng === 'number' && typeof lat === 'number') {
        return { latitude: lat, longitude: lng };
      }
    }

    if (parsed.type === 'Polygon' && parsed.coordinates && parsed.coordinates[0]) {
      const coords = parsed.coordinates[0];
      if (coords.length > 0) {
        const [lng, lat] = coords[0];
        if (typeof lng === 'number' && typeof lat === 'number') {
          return { latitude: lat, longitude: lng };
        }
      }
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Parse polygon WKT to array of LatLng coordinates
 */
export const parsePolygonWkt = (
  wkt: string | null,
): Array<{ latitude: number; longitude: number }> | null => {
  if (!wkt) return null;
  const geoJson = convertWKTToGeoJSON(wkt);
  if (!geoJson || geoJson.type !== 'Polygon') return null;

  return geoJson.coordinates[0].map(([lng, lat]: [number, number]) => ({
    latitude: lat,
    longitude: lng,
  }));
};

/**
 * Calculate polygon area in square meters using spherical excess formula
 */
export const calculatePolygonArea = (coordinates: LatLng[]): number => {
  if (coordinates.length < 3) return 0;

  const closedCoords = [...coordinates];
  if (
    closedCoords[0].latitude !== closedCoords[closedCoords.length - 1].latitude ||
    closedCoords[0].longitude !== closedCoords[closedCoords.length - 1].longitude
  ) {
    closedCoords.push(closedCoords[0]);
  }

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters

  let area = 0;
  for (let i = 0; i < closedCoords.length - 1; i++) {
    const p1 = closedCoords[i];
    const p2 = closedCoords[i + 1];
    area +=
      toRad(p2.longitude - p1.longitude) *
      (2 + Math.sin(toRad(p1.latitude)) + Math.sin(toRad(p2.latitude)));
  }
  area = Math.abs(area * (R * R) / 2);

  return Math.round(area);
};

/**
 * Create closed GeoJSON polygon from coordinates
 */
export const createPolygonGeoJSON = (coordinates: LatLng[]): string => {
  // Create the polygon ring - must be closed (first and last point must be the same)
  const ring = coordinates.map((coord) => [coord.longitude, coord.latitude]);
  
  // Close the ring by adding the first point at the end
  const firstPoint = ring[0];
  ring.push(firstPoint);

  const geoJson = {
    type: 'Polygon',
    coordinates: [ring], // Single ring array
  };

  return JSON.stringify(geoJson);
};

/**
 * Convert GeoJSON polygon to WKT format
 */
export const convertGeoJSONToWKT = (geoJsonString: string): string => {
  const geoJson = JSON.parse(geoJsonString);
  
  if (geoJson.type !== 'Polygon') {
    throw new Error('Only Polygon GeoJSON is supported');
  }

  const coordinates = geoJson.coordinates[0];
  const wktCoords = coordinates
    .map((coord: number[]) => `${coord[0]} ${coord[1]}`)
    .join(', ');
  
  return `POLYGON((${wktCoords}))`;
};

/**
 * Convert LatLng coordinates array to WKT polygon format
 */
export const createPolygonWKT = (coordinates: LatLng[]): string => {
  // Create closed ring
  const ring = coordinates.map((coord) => [coord.longitude, coord.latitude]);
  const firstPoint = ring[0];
  ring.push(firstPoint);

  const wktCoords = ring.map((coord) => `${coord[0]} ${coord[1]}`).join(', ');
  return `POLYGON((${wktCoords}))`;
};

