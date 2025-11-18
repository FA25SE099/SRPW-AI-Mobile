import Axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
import { Alert } from 'react-native';

import { env } from '@/configs/env';
import { tokenStorage } from './token-storage';
import { Result, TokenData } from '@/types/api';

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

  config.withCredentials = true;
  return config;
}

export const api = Axios.create({
  baseURL: env.API_URL,
});

api.interceptors.request.use(authRequestInterceptor);
api.interceptors.response.use(
  (response) => {
    // Handle Result<T> wrapper from backend
    const data = response.data;

    // If response has a 'succeeded' property, it's a Result<T> wrapper
    if (data && typeof data.succeeded === 'boolean') {
      if (!data.succeeded) {
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

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Don't retry for login/refresh endpoints
      if (
        originalRequest.url?.includes('/Auth/login') ||
        originalRequest.url?.includes('/Auth/refresh')
      ) {
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
        const response = await Axios.post<Result<TokenData>>(
          `${env.API_URL}/Auth/refresh`,
          { refreshToken },
          { headers: { Accept: 'application/json' } },
        );

        const result = response.data;

        if (result.succeeded && result.data) {
          const { accessToken, refreshToken: newRefreshToken, expiresAt } = result.data;

          // Store new tokens
          await tokenStorage.setTokens(accessToken, newRefreshToken, expiresAt);

          // Update the Authorization header for the original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          processQueue(null, accessToken);
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
