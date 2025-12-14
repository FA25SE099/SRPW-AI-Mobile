/**
 * Alerts & Recommendations Screen
 * View pest/weather alerts and recommendations
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { scale, moderateScale, getFontSize, getSpacing, verticalScale } from '../../utils/responsive';
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
} from '../../components/ui';
import { Alert } from '../../types/api';

// Mock data
const mockAlerts: Alert[] = [
  {
    id: '1',
    createdAt: Date.now(),
    type: 'pest',
    severity: 'high',
    title: 'Brown Planthopper Detected',
    message: 'Brown planthopper infestation detected in Field A. Immediate action required.',
    fieldId: '1',
    fieldName: 'Field A',
    pestType: 'Brown Planthopper',
    recommendedTreatment: 'Apply Imidacloprid 10% WP at 0.5kg/ha',
    approved: true,
  },
  {
    id: '2',
    createdAt: Date.now(),
    type: 'weather',
    severity: 'medium',
    title: 'Heavy Rain Warning',
    message: 'Heavy rainfall expected in the next 48 hours. Prepare drainage systems.',
    fieldId: '2',
    fieldName: 'Field B',
    approved: true,
  },
  {
    id: '3',
    createdAt: Date.now(),
    type: 'recommendation',
    severity: 'low',
    title: 'Fertilization Schedule',
    message: 'Recommended to apply second round of fertilization in Field C within 7 days.',
    fieldId: '3',
    fieldName: 'Field C',
    recommendedTreatment: 'Apply Urea 46% at 100kg/ha',
    approved: true,
  },
];

export const AlertsScreen = () => {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return colors.error;
      case 'high':
        return '#FF9500';
      case 'medium':
        return '#FFD60A';
      case 'low':
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pest':
        return '🐛';
      case 'weather':
        return '🌧️';
      case 'recommendation':
        return '💡';
      default:
        return '📢';
    }
  };

  const filteredAlerts =
    selectedFilter === 'all'
      ? mockAlerts
      : mockAlerts.filter((a) => a.type === selectedFilter);

  return (
    <SafeAreaView style={styles.container}>
      <Container padding="lg">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Body>←</Body>
          </TouchableOpacity>
          <H3 style={styles.headerTitle}>Alerts & Recommendations</H3>
          <View style={styles.headerRight} />
        </View>

        <Spacer size="lg" />

        {/* Filter Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity
            onPress={() => setSelectedFilter('all')}
            style={[
              styles.filterButton,
              selectedFilter === 'all' && styles.filterButtonActive,
            ]}
          >
            <BodySmall
              color={selectedFilter === 'all' ? colors.white : colors.textPrimary}
            >
              All
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedFilter('pest')}
            style={[
              styles.filterButton,
              selectedFilter === 'pest' && styles.filterButtonActive,
            ]}
          >
            <BodySmall
              color={selectedFilter === 'pest' ? colors.white : colors.textPrimary}
            >
              🐛 Pest
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedFilter('weather')}
            style={[
              styles.filterButton,
              selectedFilter === 'weather' && styles.filterButtonActive,
            ]}
          >
            <BodySmall
              color={selectedFilter === 'weather' ? colors.white : colors.textPrimary}
            >
              🌧️ Weather
            </BodySmall>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedFilter('recommendation')}
            style={[
              styles.filterButton,
              selectedFilter === 'recommendation' && styles.filterButtonActive,
            ]}
          >
            <BodySmall
              color={selectedFilter === 'recommendation' ? colors.white : colors.textPrimary}
            >
              💡 Recommendations
            </BodySmall>
          </TouchableOpacity>
        </ScrollView>

        <Spacer size="xl" />

        {/* Alerts List */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {filteredAlerts.map((alert) => (
            <TouchableOpacity key={alert.id}>
              <Card
                variant="elevated"
                style={[
                  styles.alertCard,
                  { borderLeftWidth: 4, borderLeftColor: getSeverityColor(alert.severity) },
                ]}
              >
                <View style={styles.alertHeader}>
                  <View style={styles.alertIcon}>
                    <Body>{getTypeIcon(alert.type)}</Body>
                  </View>
                  <View style={styles.alertHeaderInfo}>
                    <View style={styles.alertTitleRow}>
                      <BodySemibold style={styles.alertTitle}>{alert.title}</BodySemibold>
                      <Badge
                        variant="primary"
                        size="sm"
                        style={[
                          styles.severityBadge,
                          { backgroundColor: getSeverityColor(alert.severity) + '20' },
                        ]}
                      >
                        <BodySmall
                          style={{ color: getSeverityColor(alert.severity), fontSize: 10 }}
                        >
                          {alert.severity.toUpperCase()}
                        </BodySmall>
                      </Badge>
                    </View>
                    {alert.fieldName && (
                      <BodySmall color={colors.textSecondary}>
                        📍 {alert.fieldName}
                      </BodySmall>
                    )}
                    <BodySmall color={colors.textSecondary}>
                      {dayjs(alert.createdAt).format('MMM D, YYYY h:mm A')}
                    </BodySmall>
                  </View>
                </View>
                <Spacer size="md" />
                <Body style={styles.alertMessage}>{alert.message}</Body>
                {alert.pestType && (
                  <>
                    <Spacer size="sm" />
                    <View style={styles.alertDetail}>
                      <BodySmall color={colors.textSecondary}>Pest Type:</BodySmall>
                      <BodySemibold>{alert.pestType}</BodySemibold>
                    </View>
                  </>
                )}
                {alert.recommendedTreatment && (
                  <>
                    <Spacer size="sm" />
                    <View style={styles.treatmentCard}>
                      <BodySmall color={colors.textSecondary} style={styles.treatmentLabel}>
                        Recommended Treatment:
                      </BodySmall>
                      <BodySemibold style={styles.treatmentText}>
                        {alert.recommendedTreatment}
                      </BodySemibold>
                    </View>
                  </>
                )}
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
    paddingTop: getSpacing(spacing.md),
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: getFontSize(20),
  },
  headerRight: {
    width: scale(40),
  },
  filterContainer: {
    gap: getSpacing(spacing.sm),
    paddingRight: getSpacing(spacing.lg),
  },
  filterButton: {
    paddingHorizontal: getSpacing(spacing.md),
    paddingVertical: getSpacing(spacing.sm),
    borderRadius: moderateScale(borderRadius.md),
    backgroundColor: colors.backgroundSecondary,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  alertCard: {
    padding: getSpacing(spacing.md),
  },
  alertHeader: {
    flexDirection: 'row',
    gap: getSpacing(spacing.md),
  },
  alertIcon: {
    width: scale(48),
    height: scale(48),
    borderRadius: moderateScale(borderRadius.md),
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertHeaderInfo: {
    flex: 1,
    gap: getSpacing(spacing.xs),
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(spacing.sm),
    flexWrap: 'wrap',
  },
  alertTitle: {
    flex: 1,
    fontSize: getFontSize(15),
  },
  severityBadge: {
    alignSelf: 'flex-start',
  },
  alertMessage: {
    lineHeight: moderateScale(20),
    fontSize: getFontSize(14),
  },
  alertDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  treatmentCard: {
    padding: getSpacing(spacing.sm),
    backgroundColor: colors.primaryLighter,
    borderRadius: moderateScale(borderRadius.sm),
  },
  treatmentLabel: {
    marginBottom: getSpacing(spacing.xs),
  },
  treatmentText: {
    color: colors.primary,
    fontSize: getFontSize(14),
  },
});

