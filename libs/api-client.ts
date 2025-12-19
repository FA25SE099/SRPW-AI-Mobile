import Axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
import { Alert, Platform } from 'react-native';

import { env } from '@/configs/env';
import { tokenStorage } from './token-storage';
import { Result, TokenData, LoginResponseData } from '@/types/api';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

async function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  if (config.headers) {
    config.headers.Accept = 'application/json';
  }

  // Attach access token to requests if available
  const accessToken = await tokenStorage.getAccessToken();
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  // Special handling for FormData
  if (config.data instanceof FormData) {
    // Force Axios to not transform FormData
    config.transformRequest = (data) => data;

    if (config.headers) {
      // On Android, axios needs special handling for FormData
      // Delete Content-Type to let axios/XMLHttpRequest set it with proper boundary
      if (typeof (config.headers as any).delete === 'function') {
        (config.headers as any).delete('Content-Type');
        (config.headers as any).delete('content-type');
      } else {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    }
    
    // Log FormData contents for debugging (Android specific issue tracking)
    if (Platform.OS === 'android') {
      console.log('📦 [API] Request data (FormData with Blobs)');
      // @ts-ignore - FormData has getParts on React Native
      const parts = config.data.getParts?.() || [];
      parts.forEach((part: any) => {
        console.log(`  - ${part.fieldName}: ${part.string || `[${part.headers?.['content-type'] || 'file'}]`}`);
      });
    }
  } else if (config.data && config.headers && !config.headers['Content-Type']) {
    // For JSON data, ensure Content-Type is set
    config.headers['Content-Type'] = 'application/json';
  }

  config.withCredentials = true;
  
  // Log all API requests
  const fullUrl = `${config.baseURL}${config.url}`;
  console.log(`🌐 [API] ${config.method?.toUpperCase()} ${fullUrl}`);
  if (config.data && !config.url?.includes('login') && !(config.data instanceof FormData)) {
    console.log('📦 [API] Request data:', config.data);
  }
  
  return config;
}

export const api = Axios.create({
  baseURL: env.API_URL,
  timeout: 120000, // 2 minutes default timeout for all requests
});

api.interceptors.request.use(authRequestInterceptor);
api.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log(`✅ [API] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    
    // Handle Result<T> wrapper from backend
    const data = response.data;

    // If response has a 'succeeded' property, it's a Result<T> wrapper
    if (data && typeof data.succeeded === 'boolean') {
      if (!data.succeeded) {
        console.error('❌ [API] Backend returned error:', data.message, data.errors);
        
        // Backend returned an error wrapped in Result<T>
        const error = new Error(data.message || 'Request failed') as Error & {
          errors?: string[];
        };
        error.errors = data.errors;

        // Show alert for errors on mobile
        const errorMessage = data.errors?.join('\n') || data.message || 'Request failed';
        Alert.alert('Error', errorMessage);

        return Promise.reject(error);
      }

      // Check if this is a PagedResult (has pagination fields)
      // PagedResult extends Result but includes pagination metadata
      if (
        'currentPage' in data &&
        'totalPages' in data &&
        'totalCount' in data
      ) {
        // Return the full PagedResult, don't unwrap
        return data;
      }

      // Return the unwrapped data for successful results
      return data.data;
    }

    // For responses without Result<T> wrapper, return as-is
    return data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Log API errors
    console.error(`❌ [API] ${error.response?.status || 'Network Error'} ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`);
    console.error(`📍 [API] Error message:`, error.message);
    if (error.response?.data) {
      console.error(`📦 [API] Error response:`, error.response.data);
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      console.warn('🔒 [API] 401 Unauthorized - attempting token refresh...');
      
      // Don't retry for login/refresh endpoints
      if (
        originalRequest.url?.includes('/Auth/login') ||
        originalRequest.url?.includes('/Auth/refresh')
      ) {
        console.error('❌ [API] Auth endpoint failed, cannot retry');
        const message = (error.response?.data as any)?.message || error.message;
        Alert.alert('Authentication Error', message);
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = await tokenStorage.getRefreshToken();

      if (!refreshToken) {
        // No refresh token available, clear tokens
        isRefreshing = false;
        await tokenStorage.clearTokens();
        // In Expo, navigation should be handled by the app's navigation logic
        // The useUser hook will detect no token and redirect appropriately
        return Promise.reject(error);
      }

      try {
        // Try to refresh the token
        const accessToken = await tokenStorage.getAccessToken();
        const response = await Axios.post<Result<LoginResponseData>>(
          `${env.API_URL}/Auth/refresh-token`,
          { 
            accessToken,
            refreshToken 
          },
          { headers: { Accept: 'application/json' } },
        );

        const result = response.data;

        if (result.succeeded && result.data) {
          const { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresAt } = result.data;

          // Store new tokens
          await tokenStorage.setTokens(newAccessToken, newRefreshToken, expiresAt);

          // Update the Authorization header for the original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          processQueue(null, newAccessToken);
          isRefreshing = false;

          // Retry the original request
          return api(originalRequest);
        } else {
          throw new Error('Token refresh failed');
        }
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        isRefreshing = false;
        await tokenStorage.clearTokens();

        // In Expo, navigation should be handled by the app's navigation logic
        // The useUser hook will detect no token and redirect appropriately

        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const responseData = error.response?.data as any;
    
    // Check for errors array first (validation errors), then message, then fallback
    let message: string;
    if (responseData?.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
      // Join all validation errors with line breaks for better readability
      message = responseData.errors.join('\n');
    } else {
      message = responseData?.message || error.message;
    }
    
    // Show alert for errors on mobile
    Alert.alert('Error', message);

    return Promise.reject(error);
  },
);

/**
 * Alternative file upload method using XMLHttpRequest.
 * Use this if Axios fails with "Network Error" on Android when sending FormData.
 */
export const uploadFile = async (endpoint: string, formData: FormData) => {
  const token = await tokenStorage.getAccessToken();
  const url = `${env.API_URL}${endpoint}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.setRequestHeader('Accept', 'application/json');

    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) return;

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          resolve(xhr.responseText);
        }
      } else {
        let errorMessage = 'Network request failed';
        try {
          const errorJson = JSON.parse(xhr.responseText);
          // Handle ASP.NET Core ProblemDetails or standard API error format
          errorMessage = errorJson.detail || errorJson.title || errorJson.message || errorMessage;
        } catch (e) {
          errorMessage = xhr.responseText || errorMessage;
        }
        reject(new Error(errorMessage));
      }
    };

    xhr.send(formData);
  });
};
