import Constants from 'expo-constants';

// Get environment variables from app.json extra field or use defaults
const getEnvVars = () => {
  const extra = Constants.expoConfig?.extra;

  const apiUrl =
    extra?.apiUrl ??
    (__DEV__
      ? 'http://localhost:5000/api' // Development fallback
      : 'https://your-production-api.com/api'); // Production fallback

  const mapboxToken = extra?.mapboxAccessToken ?? '';

  return {
    API_URL: apiUrl,
    MAPBOX_TOKEN: mapboxToken,
  };
};

export const env = getEnvVars();
