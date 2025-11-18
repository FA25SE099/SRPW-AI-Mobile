/**
 * Fields/Plot Management Screen
 * View and manage field information with GIS maps
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import {
  Container,
  H3,
  H4,
  Body,
  BodySmall,
  BodySemibold,
  Card,
  Spacer,
  Button,
  Spinner,
} from '../../components/ui';
import { FarmerPlot } from '../../types/api';
import { getCurrentFarmerPlots } from '../../libs/farmer';
import { useUser } from '../../libs/auth';

export const FieldsScreen = () => {
  const router = useRouter();
  const { data: user } = useUser();
  const {
    data: plots,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['farmer-plots', user?.id, { page: 1, size: 10 }],
    queryFn: () =>
      getCurrentFarmerPlots({
        currentPage: 1,
        pageSize: 10,
      }),
  });

  if (isLoading) {
    return <Spinner fullScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Container padding="lg">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Body>←</Body>
          </TouchableOpacity>
          <H3 style={styles.headerTitle}>My Fields</H3>
          <TouchableOpacity
            onPress={() => router.push('/farmer/fields/add' as any)}
            style={styles.addButton}
          >
            <Body color={colors.primary}>+</Body>
          </TouchableOpacity>
        </View>

        <Spacer size="lg" />

        {/* Map View Placeholder */}
        <Card variant="elevated" style={styles.mapCard}>
          <View style={styles.mapPlaceholder}>
            <Body color={colors.textSecondary}>🗺️</Body>
            <Spacer size="sm" />
            <BodySmall color={colors.textSecondary}>GIS Map View</BodySmall>
            <BodySmall color={colors.textSecondary} style={styles.mapHint}>
              Tap on a field to view on map
            </BodySmall>
          </View>
        </Card>

        <Spacer size="xl" />

        {/* Fields List */}
        <H4>All Fields {plots ? `(${plots.length})` : ''}</H4>
        <Spacer size="md" />

        {isError && (
          <Card variant="elevated" style={styles.errorCard}>
            <BodySemibold>Unable to load plots</BodySemibold>
            <Spacer size="xs" />
            <BodySmall color={colors.textSecondary}>
              Please check your connection and try again.
            </BodySmall>
            <Spacer size="md" />
            <Button onPress={() => refetch()} size="sm">
              Try Again
            </Button>
          </Card>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          {plots && plots.length === 0 && (
            <Card variant="flat" style={styles.emptyState}>
              <BodySemibold>No plots found</BodySemibold>
              <Spacer size="xs" />
              <BodySmall color={colors.textSecondary}>
                Once your plots are assigned, they will appear here.
              </BodySmall>
            </Card>
          )}

          {plots?.map((field: FarmerPlot) => (
            <TouchableOpacity
              key={field.plotId}
              onPress={() => router.push(`/farmer/fields/${field.plotId}` as any)}
            >
              <Card variant="elevated" style={styles.fieldCard}>
                <View style={styles.fieldCardHeader}>
                  <View style={styles.fieldIcon}>
                    <Body>🌾</Body>
                  </View>
                  <View style={styles.fieldInfo}>
                    <BodySemibold>{field.groupName}</BodySemibold>
                    <BodySmall color={colors.textSecondary}>
                      Plot #{field.soThua} • Sheet #{field.soTo}
                    </BodySmall>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push(`/farmer/fields/${field.plotId}` as any)}
                  >
                    <Body color={colors.primary}>📍</Body>
                  </TouchableOpacity>
                </View>
                <Spacer size="md" />
                <View style={styles.fieldDetails}>
                  <View style={styles.fieldDetailItem}>
                    <BodySmall color={colors.textSecondary}>Area</BodySmall>
                    <BodySemibold>{field.area} ha</BodySemibold>
                  </View>
                  <View style={styles.fieldDetailItem}>
                    <BodySmall color={colors.textSecondary}>Status</BodySmall>
                    <BodySemibold>{field.status}</BodySemibold>
                  </View>
                  <View style={styles.fieldDetailItem}>
                    <BodySmall color={colors.textSecondary}>Active Alerts</BodySmall>
                    <BodySemibold>{field.activeAlerts}</BodySemibold>
                  </View>
                </View>
                <Spacer size="md" />
                <View style={styles.buttonRow}>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() =>
                      router.push({
                        pathname: '/farmer/fields/[plotId]/plans',
                        params: { plotId: field.plotId, plotName: field.groupName },
                      } as any)
                    }
                    style={styles.editButton}
                  >
                    View Plans
                  </Button>
                </View>
              </Card>
              <Spacer size="md" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Container>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapCard: {
    height: 200,
    padding: 0,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  mapHint: {
    marginTop: spacing.xs,
    fontSize: 10,
  },
  fieldCard: {
    padding: spacing.md,
  },
  fieldCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  fieldIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldInfo: {
    flex: 1,
  },
  fieldDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  fieldDetailItem: {
    minWidth: '30%',
  },
  editButton: {
    alignSelf: 'flex-start',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  errorCard: {
    padding: spacing.lg,
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  emptyState: {
    padding: spacing.lg,
    alignItems: 'flex-start',
  },
});

