import Constants from 'expo-constants';

// Get environment variables from .env files, app.json extra field, or use defaults
const getEnvVars = () => {
  const extra = Constants.expoConfig?.extra;

  // Priority: process.env (from .env files) > app.json extra > fallback defaults
  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL ??
    extra?.apiUrl ??
    (__DEV__
      ? 'http://localhost:5000/api' 
      : 'https://your-production-api.com/api'); 

  const mapboxToken = 
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? 
    extra?.mapboxAccessToken ?? 
    '';

  const aiApiUrl = 
    process.env.EXPO_PUBLIC_AI_API_URL ?? 
    extra?.aiApiUrl ?? 
    '';

  return {
    API_URL: apiUrl,
    MAPBOX_TOKEN: mapboxToken,
    AI_API_URL: aiApiUrl,
  };
};

export const env = getEnvVars();
