/**
 * Profile Screen
 * User profile and settings
 */

import React from 'react';
import { Container, H1, Body, Spacer, Button, Avatar, H3, BodySmall, BodySemibold } from '../components/ui';
import { colors, spacing } from '../theme';
import { useLogout, useUser } from '../libs/auth';
import { useRouter } from 'expo-router';
import { View, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getFarmerProfile } from '../libs/farmer';
import { ROLES } from '../libs/authorization';

export const ProfileScreen = () => {
  const logout = useLogout();
  const router = useRouter();
  const { data: user } = useUser();

  const isFarmer = user?.role === ROLES.Farmer || (user?.role as string) === 'Farmer';

  // Fetch farmer profile if user is a farmer
  const {
    data: farmerProfile,
    isLoading: farmerProfileLoading,
    error: farmerProfileError,
  } = useQuery({
    queryKey: ['farmer-profile'],
    queryFn: getFarmerProfile,
    enabled: isFarmer, // Only fetch if user is a farmer
  });

  const handleLogout = async () => {
    await logout.mutateAsync(undefined);
    router.replace('/auth/login');
  };

  const userName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
    : 'User';
  const userInitials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
    : 'U';

  // Get display name - prefer farmer profile fullName if available
  const displayName = isFarmer && farmerProfile?.fullName 
    ? farmerProfile.fullName 
    : userName;

  return (
    <ScrollView>
      <Container padding="lg">
        <Spacer size="xl" />
        
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Avatar
            initials={userInitials}
            size="xl"
            backgroundColor={colors.primary}
          />
          <Spacer size="md" />
          <H3>{displayName}</H3>
          {user?.email && (
            <BodySmall color={colors.textSecondary}>{user.email}</BodySmall>
          )}
          {user?.role && (
            <BodySmall color={colors.primary} style={styles.roleBadge}>
              {user.role}
            </BodySmall>
          )}
        </View>

        <Spacer size="xl" />

        {/* Farmer Profile Details */}
        {isFarmer && (
          <>
            {farmerProfileLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Spacer size="md" />
                <Body color={colors.textSecondary}>Loading profile...</Body>
              </View>
            ) : farmerProfileError ? (
              <View style={styles.errorContainer}>
                <Body color={colors.error}>Failed to load profile</Body>
              </View>
            ) : farmerProfile ? (
              <View style={styles.section}>
                <H1>Profile Information</H1>
                <Spacer size="md" />
                
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <BodySmall color={colors.textSecondary}>Full Name</BodySmall>
                    <BodySemibold>{farmerProfile.fullName}</BodySemibold>
                  </View>
                  
                  {farmerProfile.phoneNumber && (
                    <View style={styles.infoRow}>
                      <BodySmall color={colors.textSecondary}>Phone Number</BodySmall>
                      <BodySemibold>{farmerProfile.phoneNumber}</BodySemibold>
                    </View>
                  )}
                  
                  {farmerProfile.address && (
                    <View style={styles.infoRow}>
                      <BodySmall color={colors.textSecondary}>Address</BodySmall>
                      <BodySemibold>{farmerProfile.address}</BodySemibold>
                    </View>
                  )}
                  
                  {farmerProfile.farmCode && (
                    <View style={styles.infoRow}>
                      <BodySmall color={colors.textSecondary}>Farm Code</BodySmall>
                      <BodySemibold>{farmerProfile.farmCode}</BodySemibold>
                    </View>
                  )}
                  
                  <View style={styles.infoRow}>
                    <BodySmall color={colors.textSecondary}>Plot Count</BodySmall>
                    <BodySemibold>{farmerProfile.plotCount}</BodySemibold>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <BodySmall color={colors.textSecondary}>Status</BodySmall>
                    <View style={[
                      styles.statusBadge,
                      farmerProfile.isActive 
                        ? styles.statusBadgeActive 
                        : styles.statusBadgeInactive
                    ]}>
                      <BodySmall style={styles.statusBadgeText}>
                        {farmerProfile.isActive ? 'Active' : 'Inactive'}
                      </BodySmall>
                    </View>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <BodySmall color={colors.textSecondary}>Verified</BodySmall>
                    <View style={[
                      styles.statusBadge,
                      farmerProfile.isVerified 
                        ? styles.statusBadgeVerified 
                        : styles.statusBadgeUnverified
                    ]}>
                      <BodySmall style={styles.statusBadgeText}>
                        {farmerProfile.isVerified ? '✓ Verified' : 'Not Verified'}
                      </BodySmall>
                    </View>
                  </View>
                </View>
              </View>
            ) : null}
          </>
        )}

        {/* Profile Info for non-farmers */}
        {!isFarmer && (
          <View style={styles.section}>
            <H1>Profile</H1>
            <Spacer size="md" />
            <Body color={colors.textSecondary}>Profile settings coming soon...</Body>
          </View>
        )}

        <Spacer size="xl" />
        
        {/* Logout Button */}
        <Button onPress={handleLogout} variant="outline" loading={logout.isPending} fullWidth>
          Logout
        </Button>
        
        <Spacer size="xl" />
      </Container>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: 'center',
  },
  roleBadge: {
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  section: {
    width: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  statusBadgeActive: {
    backgroundColor: colors.success + '20',
  },
  statusBadgeInactive: {
    backgroundColor: colors.textSecondary + '20',
  },
  statusBadgeVerified: {
    backgroundColor: colors.success + '20',
  },
  statusBadgeUnverified: {
    backgroundColor: colors.warning + '20',
  },
  statusBadgeText: {
    fontWeight: '600',
  },
});

