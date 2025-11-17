/**
 * Fields/Plot Management Screen
 * View and manage field information with GIS maps
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
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
} from '../../components/ui';
import { Field } from '../../types/api';

// Mock data
const mockFields: Field[] = [
  {
    id: '1',
    createdAt: Date.now(),
    name: 'Field A',
    area: 2.5,
    cropVarietyId: '1',
    cropVarietyName: 'Jasmine Rice',
    plantingDate: '2024-01-10',
    coordinates: { latitude: 10.762622, longitude: 106.660172 },
  },
  {
    id: '2',
    createdAt: Date.now(),
    name: 'Field B',
    area: 1.8,
    cropVarietyId: '2',
    cropVarietyName: 'Sticky Rice',
    plantingDate: '2024-01-15',
    coordinates: { latitude: 10.765000, longitude: 106.665000 },
  },
  {
    id: '3',
    createdAt: Date.now(),
    name: 'Field C',
    area: 3.2,
    cropVarietyId: '1',
    cropVarietyName: 'Jasmine Rice',
    plantingDate: '2024-01-20',
    coordinates: { latitude: 10.760000, longitude: 106.670000 },
  },
];

export const FieldsScreen = () => {
  const router = useRouter();
  const [selectedField, setSelectedField] = useState<Field | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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
        <H4>All Fields ({mockFields.length})</H4>
        <Spacer size="md" />

        <ScrollView showsVerticalScrollIndicator={false}>
          {mockFields.map((field) => (
            <TouchableOpacity
              key={field.id}
              onPress={() => router.push(`/farmer/fields/${field.id}` as any)}
            >
              <Card variant="elevated" style={styles.fieldCard}>
                <View style={styles.fieldCardHeader}>
                  <View style={styles.fieldIcon}>
                    <Body>🌾</Body>
                  </View>
                  <View style={styles.fieldInfo}>
                    <BodySemibold>{field.name}</BodySemibold>
                    <BodySmall color={colors.textSecondary}>
                      {field.cropVarietyName}
                    </BodySmall>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      // Open map with field location
                      setSelectedField(field);
                    }}
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
                    <BodySmall color={colors.textSecondary}>Planting Date</BodySmall>
                    <BodySemibold>{formatDate(field.plantingDate)}</BodySemibold>
                  </View>
                  <View style={styles.fieldDetailItem}>
                    <BodySmall color={colors.textSecondary}>Coordinates</BodySmall>
                    <BodySemibold style={styles.coordinatesText}>
                      {field.coordinates?.latitude.toFixed(4)}, {field.coordinates?.longitude.toFixed(4)}
                    </BodySemibold>
                  </View>
                </View>
                <Spacer size="md" />
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => router.push(`/farmer/fields/${field.id}/edit` as any)}
                  style={styles.editButton}
                >
                  Edit Field
                </Button>
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
  coordinatesText: {
    fontSize: 11,
  },
  editButton: {
    alignSelf: 'flex-start',
  },
});

