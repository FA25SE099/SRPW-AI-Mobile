/**
 * Shared coordinate types
 * Used across map implementations (React Native Maps, Mapbox, etc.)
 */

export type Coordinate = {
  latitude: number;
  longitude: number;
};

// Alias for backward compatibility
export type LatLng = Coordinate;

