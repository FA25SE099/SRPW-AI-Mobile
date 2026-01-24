/**
 * Farmers List Screen
 * Shows all farmers assigned to supervisor
 * Click on a farmer to view their plots
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, borderRadius } from '../../theme';
import {
  Container,
  H3,
  Body,
  BodySmall,
  BodySemibold,
  Card,
  Badge,
  Spacer,
} from '../../components/ui';
import { getFarmers, Farmer } from '../../libs/supervisor';
import { Ionicons } from '@expo/vector-icons';

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

export const FarmersListScreen = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch farmers list
  const { data: farmers, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['farmers-list', searchTerm],
    queryFn: () => getFarmers({
      onlyAssigned: true,
      currentPage: 1,
      pageSize: 100,
      searchTerm: searchTerm || undefined,
    }),
    staleTime: 0,
    refetchOnMount: true,
  });

  const handleFarmerPress = (farmer: Farmer) => {
    router.push({
      pathname: '/supervisor/farmer-plots',
      params: {
        farmerId: farmer.farmerId,
        farmerName: farmer.fullName,
        farmCode: farmer.farmCode,
      },
    });
  };

  const renderFarmerCard = ({ item: farmer }: { item: Farmer }) => (
    <TouchableOpacity
      onPress={() => handleFarmerPress(farmer)}
      activeOpacity={0.7}
    >
      <Card style={styles.farmerCard}>
        <View style={styles.farmerHeader}>
          <View style={styles.farmerIcon}>
            <Ionicons name="person" size={24} color={greenTheme.primary} />
          </View>
          <View style={styles.farmerInfo}>
            <BodySemibold>{farmer.fullName}</BodySemibold>
            <BodySmall style={styles.farmCode}>
              {farmer.farmCode}
            </BodySmall>
          </View>
          <View style={styles.farmerBadges}>
            {farmer.isVerified && (
              <Badge variant="success" size="sm">
                <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                {' '}Đã xác thực
              </Badge>
            )}
          </View>
        </View>

        <Spacer size="sm" />

        <View style={styles.farmerDetails}>
          {farmer.address && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <BodySmall style={styles.detailText} numberOfLines={1}>
                {farmer.address}
              </BodySmall>
            </View>
          )}
          {farmer.phoneNumber && (
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
              <BodySmall style={styles.detailText}>
                {farmer.phoneNumber}
              </BodySmall>
            </View>
          )}
          <View style={styles.detailRow}>
            <Ionicons name="map-outline" size={16} color={colors.textSecondary} />
            <BodySmall style={styles.detailText}>
              {farmer.plotCount || 0} thửa
            </BodySmall>
          </View>
        </View>

        <Spacer size="sm" />

        <View style={styles.farmerFooter}>
          <Badge variant={farmer.isActive ? 'success' : 'neutral'} size="sm">
            {farmer.isActive ? 'Hoạt động' : 'Không hoạt động'}
          </Badge>
          {farmer.lastActivityAt && (
            <BodySmall style={styles.lastActivity}>
              Hoạt động cuối: {new Date(farmer.lastActivityAt).toLocaleDateString()}
            </BodySmall>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Container>
          <Spacer size="md" />
          <H3>Farmers</H3>
          <Spacer size="xl" />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={greenTheme.primary} />
          </View>
        </Container>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Container>
        <Spacer size="md" />
        <H3>Nông dân</H3>
        <BodySmall style={styles.subtitle}>
          Chọn nông dân để xem thửa của họ
        </BodySmall>
        <Spacer size="lg" />

        <FlatList
          data={farmers || []}
          keyExtractor={(item) => item.farmerId}
          renderItem={renderFarmerCard}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[greenTheme.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
              <Spacer size="md" />
              <Body style={styles.emptyText}>Không tìm thấy nông dân</Body>
            </View>
          }
        />
      </Container>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: greenTheme.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  list: {
    paddingBottom: spacing.xl,
  },
  farmerCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: greenTheme.cardBackground,
    borderWidth: 1,
    borderColor: greenTheme.border,
    borderRadius: borderRadius.md,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  farmerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farmerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: greenTheme.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  farmerInfo: {
    flex: 1,
  },
  farmCode: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  farmerBadges: {
    marginLeft: spacing.sm,
  },
  farmerDetails: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    color: colors.textSecondary,
    flex: 1,
  },
  farmerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastActivity: {
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    color: colors.textSecondary,
  },
});
