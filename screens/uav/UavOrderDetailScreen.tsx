/**
 * UAV Order Detail Screen
 * View spraying zone maps, materials, dosage, and timing
 */

import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, Polygon as MapPolygon, Region } from 'react-native-maps';
import dayjs from 'dayjs';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import {
  Container,
  H3,
  H4,
  Body,
  BodySmall,
  BodySemibold,
  Card,
  Badge,
  Spacer,
  Button,
  Spinner,
} from '../../components/ui';

// Mock data - in real app, this would come from API based on orderId
const mockOrderData = {
  '1': {
    id: '1',
    orderNumber: 'ORD-2024-001',
    plotName: 'DongThap1 - Plot 16',
    plotId: 'plot-1',
    scheduledDate: '2024-01-17T08:00:00Z',
    status: 'Pending',
    priority: 'High',
    area: 12.5,
    materials: [
      {
        id: 'mat-1',
        name: 'Herbicide A',
        dosage: '2L/ha',
        quantity: 25,
        unit: 'L',
        notes: 'Apply in early morning',
      },
      {
        id: 'mat-2',
        name: 'Fungicide B',
        dosage: '1.5L/ha',
        quantity: 18.75,
        unit: 'L',
        notes: 'Mix with water before application',
      },
    ],
    estimatedDuration: '2.5 hours',
    zoneCoordinates: [
      { latitude: 11.21129, longitude: 106.425131 },
      { latitude: 11.212688, longitude: 106.427436 },
      { latitude: 11.215, longitude: 106.43 },
      { latitude: 11.21129, longitude: 106.425131 },
    ],
    centerCoordinate: { latitude: 11.213, longitude: 106.428 },
    instructions: 'Apply herbicide in the morning when wind speed is below 10 km/h. Avoid application during rain.',
  },
  '2': {
    id: '2',
    orderNumber: 'ORD-2024-002',
    plotName: 'AnGiang2 - Plot 18',
    plotId: 'plot-2',
    scheduledDate: '2024-01-16T14:00:00Z',
    status: 'In Progress',
    priority: 'Normal',
    area: 8.3,
    materials: [
      {
        id: 'mat-3',
        name: 'Pesticide C',
        dosage: '1L/ha',
        quantity: 8.3,
        unit: 'L',
        notes: 'Apply evenly across the field',
      },
    ],
    estimatedDuration: '1.5 hours',
    zoneCoordinates: [
      { latitude: 11.213, longitude: 106.428 },
      { latitude: 11.218, longitude: 106.428 },
      { latitude: 11.218, longitude: 106.438 },
      { latitude: 11.213, longitude: 106.438 },
      { latitude: 11.213, longitude: 106.428 },
    ],
    centerCoordinate: { latitude: 11.215, longitude: 106.433 },
    instructions: 'Standard pesticide application. Monitor weather conditions.',
  },
};

const DEFAULT_CENTER = {
  latitude: 11.2,
  longitude: 106.5,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export const UavOrderDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;
  const mapRef = useRef<MapView | null>(null);
  const fullscreenMapRef = useRef<MapView | null>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  const order = mockOrderData[orderId as keyof typeof mockOrderData];

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <Container padding="lg">
          <Spinner fullScreen />
        </Container>
      </SafeAreaView>
    );
  }

  const mapRegion = useMemo(() => {
    if (order.centerCoordinate) {
      return {
        latitude: order.centerCoordinate.latitude,
        longitude: order.centerCoordinate.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    return DEFAULT_CENTER;
  }, [order]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return colors.success;
      case 'in progress':
        return '#FF9500';
      case 'pending':
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return colors.error;
      case 'normal':
        return '#FF9500';
      case 'low':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const canStartExecution = order.status === 'Pending' || order.status === 'In Progress';

  return (
    <SafeAreaView style={styles.container}>
      <Container padding="lg">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Body>←</Body>
          </TouchableOpacity>
          <H3 style={styles.headerTitle}>Order Details</H3>
          <View style={styles.headerRight} />
        </View>

        <Spacer size="lg" />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Order Info Card */}
          <Card variant="elevated" style={styles.card}>
            <View style={styles.orderHeader}>
              <View style={styles.orderInfo}>
                <BodySemibold style={styles.orderNumber}>{order.orderNumber}</BodySemibold>
                <BodySmall color={colors.textSecondary}>{order.plotName}</BodySmall>
              </View>
              <View style={styles.badges}>
                <Badge
                  variant="outline"
                  style={[styles.statusBadge, { borderColor: getStatusColor(order.status) }]}
                >
                  <BodySmall style={{ color: getStatusColor(order.status) }}>
                    {order.status}
                  </BodySmall>
                </Badge>
                <Spacer size="xs" />
                <Badge
                  variant="outline"
                  style={[styles.priorityBadge, { borderColor: getPriorityColor(order.priority) }]}
                >
                  <BodySmall style={{ color: getPriorityColor(order.priority) }}>
                    {order.priority}
                  </BodySmall>
                </Badge>
              </View>
            </View>
          </Card>

          <Spacer size="md" />

          {/* Map View */}
          <Card variant="elevated" style={styles.mapCard}>
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => setIsMapFullscreen(true)}
            >
              <Body color={colors.white}>Full Screen</Body>
            </TouchableOpacity>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={mapRegion}
              mapType="hybrid"
              showsBuildings={true}
              showsPointsOfInterest={true}
              showsCompass={true}
              showsScale={true}
            >
              {order.zoneCoordinates.length > 0 && (
                <MapPolygon
                  coordinates={order.zoneCoordinates}
                  strokeColor="#FF6B6B"
                  fillColor="rgba(255, 107, 107, 0.25)"
                  strokeWidth={3}
                />
              )}
              {order.centerCoordinate && (
                <Marker
                  coordinate={order.centerCoordinate}
                  title={order.plotName}
                  description="Spraying Zone"
                />
              )}
            </MapView>
          </Card>

          <Spacer size="md" />

          {/* Timing Information */}
          <Card variant="elevated" style={styles.card}>
            <H4>Timing</H4>
            <Spacer size="md" />
            <View style={styles.infoRow}>
              <BodySmall color={colors.textSecondary}>Scheduled Date:</BodySmall>
              <BodySemibold>
                {dayjs(order.scheduledDate).format('MMM D, YYYY h:mm A')}
              </BodySemibold>
            </View>
            <Spacer size="sm" />
            <View style={styles.infoRow}>
              <BodySmall color={colors.textSecondary}>Estimated Duration:</BodySmall>
              <BodySemibold>{order.estimatedDuration}</BodySemibold>
            </View>
            <Spacer size="sm" />
            <View style={styles.infoRow}>
              <BodySmall color={colors.textSecondary}>Area:</BodySmall>
              <BodySemibold>{order.area} hectares</BodySemibold>
            </View>
          </Card>

          <Spacer size="md" />

          {/* Materials */}
          <Card variant="elevated" style={styles.card}>
            <H4>Materials & Dosage</H4>
            <Spacer size="md" />
            {order.materials.map((material) => (
              <View key={material.id} style={styles.materialCard}>
                <View style={styles.materialHeader}>
                  <BodySemibold>{material.name}</BodySemibold>
                  <Badge variant="outline" style={styles.dosageBadge}>
                    <BodySmall>{material.dosage}</BodySmall>
                  </Badge>
                </View>
                <Spacer size="sm" />
                <View style={styles.materialDetails}>
                  <View style={styles.materialDetailItem}>
                    <BodySmall color={colors.textSecondary}>Quantity:</BodySmall>
                    <BodySemibold>
                      {material.quantity} {material.unit}
                    </BodySemibold>
                  </View>
                </View>
                {material.notes && (
                  <>
                    <Spacer size="sm" />
                    <View style={styles.notesContainer}>
                      <BodySmall color={colors.textSecondary}>Notes:</BodySmall>
                      <BodySmall>{material.notes}</BodySmall>
                    </View>
                  </>
                )}
              </View>
            ))}
          </Card>

          <Spacer size="md" />

          {/* Instructions */}
          {order.instructions && (
            <>
              <Card variant="elevated" style={styles.card}>
                <H4>Instructions</H4>
                <Spacer size="md" />
                <BodySmall>{order.instructions}</BodySmall>
              </Card>
              <Spacer size="md" />
            </>
          )}

          {/* Action Button */}
          {canStartExecution && (
            <Button
              onPress={() =>
                router.push({
                  pathname: '/uav/orders/[orderId]/report',
                  params: { orderId: order.id },
                } as any)
              }
              style={styles.actionButton}
            >
              {order.status === 'Pending' ? 'Start Execution' : 'Report Execution'}
            </Button>
          )}

          <Spacer size="xl" />
        </ScrollView>

        {/* Fullscreen Map Modal */}
        <Modal visible={isMapFullscreen} animationType="slide">
          <SafeAreaView style={styles.fullscreenMapContainer}>
            <View style={styles.fullscreenHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsMapFullscreen(false)}
              >
                <Body color={colors.primary}>Close</Body>
              </TouchableOpacity>
              <Button
                variant="outline"
                size="sm"
                onPress={() => {
                  if (fullscreenMapRef.current) {
                    fullscreenMapRef.current.animateToRegion(mapRegion, 500);
                  }
                }}
              >
                Reset View
              </Button>
            </View>
            <MapView
              ref={fullscreenMapRef}
              style={styles.fullscreenMap}
              initialRegion={mapRegion}
              mapType="hybrid"
              showsBuildings={true}
              showsPointsOfInterest={true}
              showsCompass={true}
              showsScale={true}
            >
              {order.zoneCoordinates.length > 0 && (
                <MapPolygon
                  coordinates={order.zoneCoordinates}
                  strokeColor="#FF6B6B"
                  fillColor="rgba(255, 107, 107, 0.25)"
                  strokeWidth={3}
                />
              )}
              {order.centerCoordinate && (
                <Marker
                  coordinate={order.centerCoordinate}
                  title={order.plotName}
                  description="Spraying Zone"
                />
              )}
            </MapView>
          </SafeAreaView>
        </Modal>
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
  headerRight: {
    width: 40,
  },
  card: {
    padding: spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  orderNumber: {
    fontSize: 18,
  },
  badges: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  mapCard: {
    height: 250,
    padding: 0,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  expandButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  fullscreenMapContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullscreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  closeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.sm,
  },
  fullscreenMap: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  materialCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dosageBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  materialDetails: {
    gap: spacing.xs,
  },
  materialDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notesContainer: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionButton: {
    marginTop: spacing.md,
  },
});

