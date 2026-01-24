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
import { getSupervisorProfile, SupervisorProfile } from '../libs/supervisor';
import { getUavVendorProfile, UavVendorProfile } from '../libs/uav';
import { ROLES } from '../libs/authorization';

// Green theme colors for nature-friendly design
const greenTheme = {
  primary: '#2E7D32', // Forest green
  primaryLight: '#4CAF50', // Medium green
  primaryLighter: '#E8F5E9', // Light green background
  accent: '#66BB6A', // Accent green
  success: '#10B981', // Success green
  background: '#F1F8F4', // Very light green tint
  cardBackground: '#FFFFFF',
  border: '#C8E6C9', // Light green border
};

export const ProfileScreen = () => {
  const logout = useLogout();
  const router = useRouter();
  const { data: user } = useUser();

  const isFarmer = user?.role === ROLES.Farmer || (user?.role as string) === 'Farmer';
  const isSupervisor = user?.role === ROLES.Supervisor || (user?.role as string) === 'Supervisor';
  const isUavVendor = user?.role === ROLES.UavVendor || (user?.role as string) === 'UavVendor';

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

  // Fetch supervisor profile if user is a supervisor
  const {
    data: supervisorProfile,
    isLoading: supervisorProfileLoading,
    error: supervisorProfileError,
  } = useQuery<SupervisorProfile>({
    queryKey: ['supervisor-profile'],
    queryFn: getSupervisorProfile,
    enabled: isSupervisor,
  });

  // Fetch UAV vendor profile if user is a UAV vendor
  const {
    data: uavVendorProfile,
    isLoading: uavVendorProfileLoading,
    error: uavVendorProfileError,
  } = useQuery<UavVendorProfile>({
    queryKey: ['uavvendor-profile'],
    queryFn: getUavVendorProfile,
    enabled: isUavVendor,
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
    : isSupervisor && supervisorProfile?.fullName
      ? supervisorProfile.fullName
      : isUavVendor && uavVendorProfile?.fullName
        ? uavVendorProfile.fullName
        : userName;

  return (
    <ScrollView style={styles.scrollView}>
      <Container padding="lg">
        <Spacer size="xl" />
        
        {/* Profile Header */}
        {/* <View style={styles.profileHeader}>
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

        <Spacer size="xl" /> */}

        {/* Farmer Profile Details (Vietnamese) */}
        {isFarmer && (
          <>
            {farmerProfileLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={greenTheme.primary} />
                <Spacer size="md" />
                <Body color={colors.textSecondary}>Đang tải thông tin...</Body>
              </View>
            ) : farmerProfileError ? (
              <View style={styles.errorContainer}>
                <Body color={colors.error}>Không thể tải thông tin</Body>
              </View>
            ) : farmerProfile ? (
              <View style={styles.section}>
                <H1>Thông tin hồ sơ</H1>
                <Spacer size="md" />
                
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <BodySmall color={colors.textSecondary}>Họ và tên</BodySmall>
                    <BodySemibold>{farmerProfile.fullName}</BodySemibold>
                  </View>
                  
                  {farmerProfile.phoneNumber && (
                    <View style={styles.infoRow}>
                      <BodySmall color={colors.textSecondary}>Số điện thoại</BodySmall>
                      <BodySemibold>{farmerProfile.phoneNumber}</BodySemibold>
                    </View>
                  )}
                  
                  {farmerProfile.address && (
                    <View style={styles.infoRow}>
                      <BodySmall color={colors.textSecondary}>Địa chỉ</BodySmall>
                      <BodySemibold>{farmerProfile.address}</BodySemibold>
                    </View>
                  )}
                  
                  {farmerProfile.farmCode && (
                    <View style={styles.infoRow}>
                      <BodySmall color={colors.textSecondary}>Mã nông trại</BodySmall>
                      <BodySemibold>{farmerProfile.farmCode}</BodySemibold>
                    </View>
                  )}
                  
                  <View style={styles.infoRow}>
                    <BodySmall color={colors.textSecondary}>Số thửa đất</BodySmall>
                    <BodySemibold>{farmerProfile.plotCount}</BodySemibold>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <BodySmall color={colors.textSecondary}>Trạng thái</BodySmall>
                    <View style={[
                      styles.statusBadge,
                      farmerProfile.isActive 
                        ? styles.statusBadgeActive 
                        : styles.statusBadgeInactive
                    ]}>
                      <BodySmall style={styles.statusBadgeText}>
                        {farmerProfile.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      </BodySmall>
                    </View>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <BodySmall color={colors.textSecondary}>Đã xác thực</BodySmall>
                    <View style={[
                      styles.statusBadge,
                      farmerProfile.isVerified 
                        ? styles.statusBadgeVerified 
                        : styles.statusBadgeUnverified
                    ]}>
                      <BodySmall style={styles.statusBadgeText}>
                          {farmerProfile.isVerified ? '✓ Đã xác thực' : 'Chưa xác thực'}
                      </BodySmall>
                    </View>
                  </View>
                </View>
              </View>
            ) : null}
          </>
        )}

        {/* Supervisor Profile Details */}
        {isSupervisor && (
          <>
            {supervisorProfileLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={greenTheme.primary} />
                <Spacer size="md" />
                <Body color={colors.textSecondary}>Loading profile...</Body>
              </View>
            ) : supervisorProfileError ? (
              <View style={styles.errorContainer}>
                <Body color={colors.error}>Unable to load profile</Body>
              </View>
            ) : supervisorProfile ? (
              <View style={styles.section}>
                <H1>Supervisor Profile</H1>
                <Spacer size="md" />
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <BodySmall color={colors.textSecondary}>Full name</BodySmall>
                    <BodySemibold>{supervisorProfile.fullName}</BodySemibold>
                  </View>
                  <View style={styles.infoRow}>
                    <BodySmall color={colors.textSecondary}>Email</BodySmall>
                    <BodySemibold>{supervisorProfile.email}</BodySemibold>
                  </View>
                  {supervisorProfile.phoneNumber && (
                    <View style={styles.infoRow}>
                      <BodySmall color={colors.textSecondary}>Phone</BodySmall>
                      <BodySemibold>{supervisorProfile.phoneNumber}</BodySemibold>
                    </View>
                  )}
                  {supervisorProfile.address && (
                    <View style={styles.infoRow}>
                      <BodySmall color={colors.textSecondary}>Address</BodySmall>
                      <BodySemibold>{supervisorProfile.address}</BodySemibold>
                    </View>
                  )}
                  {supervisorProfile.clusterName && (
                    <View style={styles.infoRow}>
                      <BodySmall color={colors.textSecondary}>Cluster</BodySmall>
                      <BodySemibold>{supervisorProfile.clusterName}</BodySemibold>
                    </View>
                  )}
                  {/* <View style={styles.infoRow}>
                    <BodySmall color={colors.textSecondary}>Total groups supervised</BodySmall>
                    <BodySemibold>{supervisorProfile.totalGroupsSupervised}</BodySemibold>
                  </View>
                  <View style={styles.infoRow}>
                    <BodySmall color={colors.textSecondary}>Active groups this season</BodySmall>
                    <BodySemibold>{supervisorProfile.activeGroupsThisSeason}</BodySemibold>
                  </View>
                  <View style={styles.infoRow}>
                    <BodySmall color={colors.textSecondary}>Completed polygon tasks</BodySmall>
                    <BodySemibold>{supervisorProfile.completedPolygonTasks}</BodySemibold>
                  </View>
                  <View style={styles.infoRow}>
                    <BodySmall color={colors.textSecondary}>Pending polygon tasks</BodySmall>
                    <BodySemibold>{supervisorProfile.pendingPolygonTasks}</BodySemibold>
                  </View>
                  <View style={styles.infoRow}>
                    <BodySmall color={colors.textSecondary}>Status</BodySmall>
                    <View style={[
                      styles.statusBadge,
                      supervisorProfile.isActive 
                        ? styles.statusBadgeActive 
                        : styles.statusBadgeInactive
                    ]}>
                      <BodySmall style={styles.statusBadgeText}>
                        {supervisorProfile.isActive ? 'Active' : 'Inactive'}
                      </BodySmall>
                    </View>
                  </View> */}
                </View>
              </View>
            ) : null}
          </>
        )}

        {/* UAV Vendor Profile Details (Vietnamese) */}
        {isUavVendor && (
          <>
            {uavVendorProfileLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={greenTheme.primary} />
                <Spacer size="md" />
                <Body color={colors.textSecondary}>Đang tải thông tin...</Body>
              </View>
            ) : uavVendorProfileError ? (
              <View style={styles.errorContainer}>
                <Body color={colors.error}>Không thể tải thông tin</Body>
              </View>
            ) : uavVendorProfile ? (
              <View style={styles.section}>
                <H1>Hồ sơ UAV</H1>
                <Spacer size="md" />
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <BodySmall color={colors.textSecondary}>Họ và tên</BodySmall>
                    <BodySemibold>{uavVendorProfile.fullName}</BodySemibold>
                  </View>
                  <View style={styles.infoRow}>
                    <BodySmall color={colors.textSecondary}>Email</BodySmall>
                    <BodySemibold>{uavVendorProfile.email}</BodySemibold>
                  </View>
                  {uavVendorProfile.phoneNumber && (
                    <View style={styles.infoRow}>
                      <BodySmall color={colors.textSecondary}>Số điện thoại</BodySmall>
                      <BodySemibold>{uavVendorProfile.phoneNumber}</BodySemibold>
                    </View>
                  )}
                  {uavVendorProfile.address && (
                    <View style={styles.infoRow}>
                      <BodySmall color={colors.textSecondary}>Địa chỉ</BodySmall>
                      <BodySemibold>{uavVendorProfile.address}</BodySemibold>
                    </View>
                  )}
                  {uavVendorProfile.vendorName && (
                    <View style={styles.infoRow}>
                      <BodySmall color={colors.textSecondary}>Tên doanh nghiệp</BodySmall>
                      <BodySemibold>{uavVendorProfile.vendorName}</BodySemibold>
                    </View>
                  )}
                  {uavVendorProfile.businessRegistrationNumber && (
                    <View style={styles.infoRow}>
                      <BodySmall color={colors.textSecondary}>Mã đăng ký kinh doanh</BodySmall>
                      <BodySemibold>{uavVendorProfile.businessRegistrationNumber}</BodySemibold>
                    </View>
                  )}
                  <View style={styles.infoRow}>
                    <BodySmall color={colors.textSecondary}>Số lượng UAV</BodySmall>
                    <BodySemibold>{uavVendorProfile.fleetSize}</BodySemibold>
                  {/* </View>
                  <View style={styles.infoRow}>
                    <BodySmall color={colors.textSecondary}>Bán kính phục vụ (km)</BodySmall>
                    <BodySemibold>{uavVendorProfile.serviceRadius}</BodySemibold>
                  </View>
                  {uavVendorProfile.equipmentSpecs && (
                    <View style={styles.infoRow}>
                      <BodySmall color={colors.textSecondary}>Thiết bị</BodySmall>
                      <BodySemibold>{uavVendorProfile.equipmentSpecs}</BodySemibold>
                    </View>
                  )}
                  {uavVendorProfile.operatingSchedule && (
                    <View style={styles.infoRow}>
                      <BodySmall color={colors.textSecondary}>Lịch hoạt động</BodySmall>
                      <BodySemibold>{uavVendorProfile.operatingSchedule}</BodySemibold>
                    </View>
                  )}
                  <View style={styles.infoRow}>
                    <BodySmall color={colors.textSecondary}>Trạng thái</BodySmall>
                    <View style={[
                      styles.statusBadge,
                      uavVendorProfile.isActive
                        ? styles.statusBadgeActive
                        : styles.statusBadgeInactive
                    ]}>
                      <BodySmall style={styles.statusBadgeText}>
                        {uavVendorProfile.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      </BodySmall>
                    </View> */}
                  </View>
                </View>
              </View>
            ) : null}
          </>
        )}

        {/* Profile Info for others */}
        {!isFarmer && !isSupervisor && !isUavVendor && (
          <View style={styles.section}>
            <H1>Profile</H1>
            <Spacer size="md" />
            <Body color={colors.textSecondary}>Profile setup coming soon...</Body>
          </View>
        )}

        <Spacer size="xl" />
        
        {/* Change Password Button */}
        <Button 
          onPress={() => router.push('/auth/change-password')} 
          variant="outline" 
          fullWidth
        >
          {isFarmer ? 'Thay đổi mật khẩu' : 'Change Password'}
        </Button>

        <Spacer size="md" />
        
        {/* Logout Button */}
       
        <Button onPress={handleLogout} variant="outline" loading={logout.isPending} fullWidth>
          Đăng xuất
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
  scrollView: {
    backgroundColor: greenTheme.background,
  },
  infoCard: {
    backgroundColor: greenTheme.cardBackground,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: greenTheme.border,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  statusBadgeActive: {
    backgroundColor: greenTheme.success + '20',
  },
  statusBadgeInactive: {
    backgroundColor: colors.textSecondary + '20',
  },
  statusBadgeVerified: {
    backgroundColor: greenTheme.success + '20',
  },
  statusBadgeUnverified: {
    backgroundColor: colors.warning + '20',
  },
  statusBadgeText: {
    fontWeight: '600',
  },
});

