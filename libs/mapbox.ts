import MapboxGL from '@rnmapbox/maps';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as any;
const accessToken: string | undefined = extra?.mapboxAccessToken;

// Only initialize if not already initialized (safe for hot reload)
if (accessToken && typeof MapboxGL.setAccessToken === 'function') {
  try {
    MapboxGL.setAccessToken(accessToken);
    MapboxGL.setConnected(true);
  } catch (error) {
    console.warn('[Mapbox] Initialization error:', error);
  }
} else if (!accessToken) {
  console.warn(
    '[Mapbox] Missing mapboxAccessToken in app.json extra.mapboxAccessToken. Map view will not render correctly.',
  );
}

export default MapboxGL;


