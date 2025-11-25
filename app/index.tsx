/**
 * Index Screen
 * Entry point - redirects to onboarding or home based on auth state
 */

import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Spinner } from '../components/ui';
import { useUser } from '../libs/auth';
import { ROLES } from '../libs/authorization';

export default function Index() {
  const router = useRouter();
  const { data: user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Debug: Log user role to help troubleshoot
        console.log('User role:', user.role, 'User:', user);
        
        // Redirect based on role using enum values for consistency
        const role = user.role?.toString().trim();
        
        if (role === ROLES.Farmer || role === 'Farmer') {
          router.replace('/(farmer-tabs)/home');
        } else if (role === ROLES.UavVendor || role === 'UavVendor') {
          router.replace('/(uav-tabs)/home');
        } else {
          // Default to regular tabs for other roles
          console.log('Unknown role, redirecting to default tabs:', role);
          router.replace('/(tabs)/home');
        }
      } else {
        router.replace('/auth/onboarding');
      }
    }
  }, [user, isLoading]);

  return <Spinner fullScreen />;
}

