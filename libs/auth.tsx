import React from 'react';
import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { z } from 'zod';
import { AxiosError } from 'axios';

import { 
  LoginResponse, 
  LoginResponseData,
  LoginRequest,
  FastLoginRole,
  LogoutRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  User 
} from '@/types/api';

import { api } from './api-client';
import { tokenStorage } from './token-storage';

// api call definitions for auth (types, schemas, requests):
// these are not part of features as this is a module shared across features

const getUser = async (): Promise<User | null> => {
  // If no token exists, return null instead of throwing an error
  // This allows the app to render without authentication
  const hasToken = await tokenStorage.hasToken();
  if (!hasToken) {
    return null;
  }

  try {
    // The api client will automatically attach the Authorization header
    // and unwrap the Result<User> response
    const user: User = await api.get('/Auth/me');
    return user;
  } catch (error) {
    // If the token is invalid/expired or the endpoint is missing, clear tokens quietly
    if (error instanceof AxiosError && error.response?.status === 404) {
      console.warn('User profile endpoint returned 404. Clearing stale credentials.');
    } else {
      console.error('Failed to fetch user:', error);
    }
    await tokenStorage.clearTokens();
    return null;
  }
};

const logout = async (refreshToken?: string): Promise<void> => {
  try {
    // Call backend logout endpoint with optional refresh token
    const requestBody: LogoutRequest = refreshToken ? { refreshToken } : {};
    await api.post('/Auth/logout', requestBody);
  } catch (error) {
    // If logout endpoint fails, still clear local tokens
    console.error('Logout API call failed:', error);
  } finally {
    // Always clear tokens from AsyncStorage
    await tokenStorage.clearTokens();
  }
};

// Login input schemas
export const loginInputSchema = z.object({
  email: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  password: z.string().min(5, 'Password must be at least 5 characters'),
  rememberMe: z.boolean().optional(),
}).refine(
  (data) => data.email || data.phoneNumber,
  {
    message: 'Either email or phone number is required',
    path: ['email'],
  }
);

export type LoginInput = z.infer<typeof loginInputSchema>;

const loginWithCredentials = async (
  data: LoginInput,
): Promise<LoginResponseData> => {
  const request: LoginRequest = {
    email: data.email || null,
    phoneNumber: data.phoneNumber || null,
    password: data.password,
    rememberMe: data.rememberMe ?? true,
  };

  // The api client interceptor unwraps Result<T> responses, so we get LoginResponseData directly
  const response: LoginResponseData = await api.post('/Auth/login', request);

  if (!response || !response.accessToken || !response.refreshToken) {
    throw new Error('Login failed: Invalid response data');
  }

  // Store tokens in AsyncStorage
  await tokenStorage.setTokens(
    response.accessToken,
    response.refreshToken,
    response.expiresAt,
  );

  return response;
};

// Fast login for testing
const loginFast = async (
  role: FastLoginRole,
  rememberMe: boolean = true,
): Promise<LoginResponseData> => {
  // The api client interceptor unwraps Result<T> responses, so we get LoginResponseData directly
  const response: LoginResponseData = await api.get('/Auth/login-fast', {
    params: { role, rememberMe },
  });

  if (!response || !response.accessToken || !response.refreshToken) {
    throw new Error('Fast login failed: Invalid response data');
  }

  // Store tokens in AsyncStorage
  await tokenStorage.setTokens(
    response.accessToken,
    response.refreshToken,
    response.expiresAt,
  );

  return response;
};

export const registerInputSchema = z
  .object({
    email: z.string().min(1, 'Required'),
    firstName: z.string().min(1, 'Required'),
    lastName: z.string().min(1, 'Required'),
    password: z.string().min(5, 'Required'),
  })
  .and(
    z
      .object({
        teamId: z.string().min(1, 'Required'),
        teamName: z.null().default(null),
      })
      .or(
        z.object({
          teamName: z.string().min(1, 'Required'),
          teamId: z.null().default(null),
        }),
      ),
  );

export type RegisterInput = z.infer<typeof registerInputSchema>;

const registerWithEmailAndPassword = async (
  data: RegisterInput,
): Promise<LoginResponseData> => {
  // Registration also returns tokens and user
  // The api client interceptor unwraps Result<T> responses, so we get LoginResponseData directly
  const response: LoginResponseData = await api.post('/api/auth/register', data);

  if (!response || !response.accessToken || !response.refreshToken) {
    throw new Error('Registration failed: Invalid response data');
  }

  // Store tokens in AsyncStorage
  await tokenStorage.setTokens(
    response.accessToken,
    response.refreshToken,
    response.expiresAt,
  );

  return response;
};

// Auth hooks using TanStack Query
const userQueryKey = ['user'];

export const useUser = (): UseQueryResult<User | null, Error> => {
  return useQuery({
    queryKey: userQueryKey,
    queryFn: getUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginWithCredentials,
    onSuccess: (response) => {
      // Update the user cache with the logged-in user
      // Convert AuthUser to User format
      queryClient.setQueryData(userQueryKey, {
        id: response.user.id,
        email: response.user.email,
        role: response.user.role,
        firstName: response.user.userName.split(' ')[0] || response.user.userName,
        lastName: response.user.userName.split(' ')[1] || '',
        teamId: '',
        bio: '',
        createdAt: Date.now(),
      } as User);
    },
  });
};

export const useFastLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ role, rememberMe }: { role: FastLoginRole; rememberMe?: boolean }) =>
      loginFast(role, rememberMe),
    onSuccess: (response) => {
      // Update the user cache with the logged-in user
      queryClient.setQueryData(userQueryKey, {
        id: response.user.id,
        email: response.user.email,
        role: response.user.role,
        firstName: response.user.userName.split(' ')[0] || response.user.userName,
        lastName: response.user.userName.split(' ')[1] || '',
        teamId: '',
        bio: '',
        createdAt: Date.now(),
      } as User);
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerWithEmailAndPassword,
    onSuccess: (response) => {
      // Update the user cache with the registered user
      queryClient.setQueryData(userQueryKey, {
        id: response.user.id,
        email: response.user.email,
        role: response.user.role,
        firstName: response.user.userName.split(' ')[0] || response.user.userName,
        lastName: response.user.userName.split(' ')[1] || '',
        teamId: '',
        bio: '',
        createdAt: Date.now(),
      } as User);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (refreshToken?: string) => logout(refreshToken),
    onSuccess: () => {
      // Clear the user cache
      queryClient.setQueryData(userQueryKey, null);
      queryClient.clear();
    },
  });
};

// AuthLoader component for Expo - shows loading state while checking auth
export const AuthLoader = ({ children }: { children: React.ReactNode }) => {
  const { isLoading } = useUser();

  if (isLoading) {
    // You can replace this with a custom loading component
    return null; // or <LoadingScreen />
  }

  return <>{children}</>;
};

// ProtectedRoute component for Expo Router
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return null; // or <LoadingScreen />
  }

  if (!user) {
    // Redirect to login using Expo Router
    return <Redirect href="/auth/login" />;
  }

  return <>{children}</>;
};