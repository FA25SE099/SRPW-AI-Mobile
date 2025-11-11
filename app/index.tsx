/**
 * Index Screen
 * Entry point - redirects to onboarding or home based on auth state
 */

import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Spinner } from '../components/ui';
import { useUser } from '../libs/auth';

export default function Index() {
  const router = useRouter();
  const { data: user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/auth/onboarding');
      }
    }
  }, [user, isLoading]);

  return <Spinner fullScreen />;
}

