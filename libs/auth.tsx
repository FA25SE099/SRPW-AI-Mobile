import React from 'react';
import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { z } from 'zod';
import { AxiosError } from 'axios';

import { LoginResponse, User } from '@/types/api';

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

const logout = async (): Promise<void> => {
  try {
    // Call backend logout endpoint (optional, if it exists)
    await api.post('/Auth/logout');
  } catch (error) {
    // If logout endpoint fails, still clear local tokens
    console.error('Logout API call failed:', error);
  } finally {
    // Always clear tokens from AsyncStorage
    await tokenStorage.clearTokens();
  }
};

export const loginInputSchema = z.object({
  email: z.string().min(1, 'Required').email('Invalid email'),
  password: z.string().min(5, 'Required'),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

const loginWithEmailAndPassword = async (
  data: LoginInput,
): Promise<LoginResponse> => {
  // Add rememberMe: true as per requirements
  const response: LoginResponse = await api.post('/Auth/login', {
    ...data,
    rememberMe: true,
  });

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
): Promise<LoginResponse> => {
  // Registration also returns tokens and user
  const response: LoginResponse = await api.post('/Auth/register', data);

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
    mutationFn: loginWithEmailAndPassword,
    onSuccess: (response) => {
      // Update the user cache with the logged-in user
      queryClient.setQueryData(userQueryKey, response.user);
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerWithEmailAndPassword,
    onSuccess: (response) => {
      // Update the user cache with the registered user
      queryClient.setQueryData(userQueryKey, response.user);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
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