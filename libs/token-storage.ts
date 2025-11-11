/**
 * Token Storage Utilities for Expo/React Native
 * Manages access token, refresh token, and expiration time in AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const EXPIRES_AT_KEY = 'expiresAt';

export const tokenStorage = {
    // Get access token
    getAccessToken: async (): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
        } catch (error) {
            console.error('Error getting access token:', error);
            return null;
        }
    },

    // Get refresh token
    getRefreshToken: async (): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        } catch (error) {
            console.error('Error getting refresh token:', error);
            return null;
        }
    },

    // Get expiration time
    getExpiresAt: async (): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem(EXPIRES_AT_KEY);
        } catch (error) {
            console.error('Error getting expiration time:', error);
            return null;
        }
    },

    // Set all tokens
    setTokens: async (accessToken: string, refreshToken: string, expiresAt: string): Promise<void> => {
        try {
            await AsyncStorage.multiSet([
                [ACCESS_TOKEN_KEY, accessToken],
                [REFRESH_TOKEN_KEY, refreshToken],
                [EXPIRES_AT_KEY, expiresAt],
            ]);
        } catch (error) {
            console.error('Error setting tokens:', error);
        }
    },

    // Clear all tokens
    clearTokens: async (): Promise<void> => {
        try {
            await AsyncStorage.multiRemove([
                ACCESS_TOKEN_KEY,
                REFRESH_TOKEN_KEY,
                EXPIRES_AT_KEY,
            ]);
        } catch (error) {
            console.error('Error clearing tokens:', error);
        }
    },

    // Check if access token exists
    hasToken: async (): Promise<boolean> => {
        try {
            const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
            return !!token;
        } catch (error) {
            console.error('Error checking token:', error);
            return false;
        }
    },

    // Check if token is expired or about to expire (within 5 minutes)
    isTokenExpired: async (): Promise<boolean> => {
        try {
            const expiresAt = await AsyncStorage.getItem(EXPIRES_AT_KEY);
            if (!expiresAt) return true;

            const expirationTime = new Date(expiresAt).getTime();
            const currentTime = Date.now();
            const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds

            return expirationTime - currentTime < bufferTime;
        } catch (error) {
            console.error('Error checking token expiration:', error);
            return true;
        }
    },
};
