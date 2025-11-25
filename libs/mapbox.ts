import MapboxGL from '@rnmapbox/maps';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as any;
const accessToken: string | undefined = extra?.mapboxToken;

if (!accessToken) {
  console.warn(
    '[Mapbox] Missing mapboxToken in app.json extra.mapboxToken. Map view will not render correctly.',
  );
} else {
  MapboxGL.setAccessToken(accessToken);
}

// Basic recommended settings
MapboxGL.setConnected(true);

export default MapboxGL;


