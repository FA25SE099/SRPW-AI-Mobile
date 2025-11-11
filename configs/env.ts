import Constants from 'expo-constants';

// Get environment variables from app.json extra field or use defaults
const getEnvVars = () => {
  const extra = Constants.expoConfig?.extra;

  return {
    API_URL: extra?.apiUrl || __DEV__ 
      ? 'http://localhost:5000/api' // Development
      : 'https://your-production-api.com/api', // Production
  };
};

export const env = getEnvVars();
