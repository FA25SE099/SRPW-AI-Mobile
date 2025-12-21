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
            <Ionicons name="person" size={24} color={colors.primary} />
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
                {' '}Verified
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
              {farmer.plotCount || 0} plots
            </BodySmall>
          </View>
        </View>

        <Spacer size="sm" />

        <View style={styles.farmerFooter}>
          <Badge variant={farmer.isActive ? 'success' : 'neutral'} size="sm">
            {farmer.isActive ? 'Active' : 'Inactive'}
          </Badge>
          {farmer.lastActivityAt && (
            <BodySmall style={styles.lastActivity}>
              Last activity: {new Date(farmer.lastActivityAt).toLocaleDateString()}
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
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </Container>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Container>
        <Spacer size="md" />
        <H3>Farmers</H3>
        <BodySmall style={styles.subtitle}>
          Select a farmer to view their plots
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
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
              <Spacer size="md" />
              <Body style={styles.emptyText}>No farmers found</Body>
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
    backgroundColor: colors.background,
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
  },
  farmerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farmerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundLight || '#F5F5F5',
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
