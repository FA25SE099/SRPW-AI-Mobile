/**
 * Create Report Screen
 * Allows farmers to create emergency reports/alerts
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, borderRadius } from '../../theme';
import {
  Container,
  H3,
  H4,
  Body,
  BodySmall,
  Spacer,
  Button,
  Input,
} from '../../components/ui';
import { createReport } from '../../libs/farmer';
import { AlertType, ReportSeverity, CreateReportRequest } from '../../types/api';

type AlertTypeOption = {
  value: AlertType;
  label: string;
  icon: string;
};

type SeverityOption = {
  value: ReportSeverity;
  label: string;
  color: string;
};

const ALERT_TYPES: AlertTypeOption[] = [
  { value: 'Pest', label: 'Pest', icon: '🐛' },
  { value: 'Weather', label: 'Weather', icon: '🌧️' },
  { value: 'Disease', label: 'Disease', icon: '🦠' },
  { value: 'Other', label: 'Other', icon: '📢' },
];

const SEVERITY_LEVELS: SeverityOption[] = [
  { value: 'Low', label: 'Low', color: colors.info },
  { value: 'Medium', label: 'Medium', color: '#FFD60A' },
  { value: 'High', label: 'High', color: '#FF9500' },
  { value: 'Critical', label: 'Critical', color: colors.error },
];

export const CreateReportScreen = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [alertType, setAlertType] = useState<AlertType>('Pest');
  const [severity, setSeverity] = useState<ReportSeverity>('Medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [plotCultivationId, setPlotCultivationId] = useState('');

  const createReportMutation = useMutation({
    mutationFn: createReport,
    onSuccess: (reportId) => {
      Alert.alert('Success', 'Emergency report created successfully.', [
        {
          text: 'OK',
          onPress: () => {
            queryClient.invalidateQueries({ queryKey: ['reports'] });
            router.back();
          },
        },
      ]);
    },
    onError: (error: any) => {
      // Error handling is done in api-client interceptor
      console.error('Failed to create report:', error);
    },
  });

  const handleSubmit = () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter a description');
      return;
    }
    if (!plotCultivationId.trim()) {
      Alert.alert('Validation Error', 'Please enter a plot cultivation ID');
      return;
    }

    const request: CreateReportRequest = {
      plotCultivationId,
      groupId: null,
      clusterId: null,
      alertType,
      title: title.trim(),
      description: description.trim(),
      severity,
      imageUrls: [],
    };

    createReportMutation.mutate(request);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Container padding="lg">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Body>←</Body>
          </TouchableOpacity>
          <H3 style={styles.headerTitle}>Create Report</H3>
          <View style={styles.headerRight} />
        </View>

        <Spacer size="lg" />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Alert Type Selection */}
          <H4>Alert Type</H4>
          <Spacer size="sm" />
          <View style={styles.optionsGrid}>
            {ALERT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                onPress={() => setAlertType(type.value)}
                style={[
                  styles.optionCard,
                  alertType === type.value && styles.optionCardActive,
                ]}
              >
                <Body style={styles.optionIcon}>{type.icon}</Body>
                <BodySmall
                  color={alertType === type.value ? colors.primary : colors.textPrimary}
                >
                  {type.label}
                </BodySmall>
              </TouchableOpacity>
            ))}
          </View>

          <Spacer size="lg" />

          {/* Severity Selection */}
          <H4>Severity Level</H4>
          <Spacer size="sm" />
          <View style={styles.optionsGrid}>
            {SEVERITY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                onPress={() => setSeverity(level.value)}
                style={[
                  styles.optionCard,
                  severity === level.value && styles.optionCardActive,
                  severity === level.value && { borderColor: level.color },
                ]}
              >
                <View
                  style={[
                    styles.severityIndicator,
                    { backgroundColor: level.color },
                  ]}
                />
                <BodySmall
                  color={severity === level.value ? colors.primary : colors.textPrimary}
                >
                  {level.label}
                </BodySmall>
              </TouchableOpacity>
            ))}
          </View>

          <Spacer size="lg" />

          {/* Plot Cultivation ID */}
          <H4>Plot Cultivation ID</H4>
          <Spacer size="sm" />
          <Input
            placeholder="Enter plot cultivation ID"
            value={plotCultivationId}
            onChangeText={setPlotCultivationId}
          />

          <Spacer size="lg" />

          {/* Title */}
          <H4>Title</H4>
          <Spacer size="sm" />
          <Input
            placeholder="e.g., Brown planthopper infestation"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          <Spacer size="lg" />

          {/* Description */}
          <H4>Description</H4>
          <Spacer size="sm" />
          <Input
            placeholder="Describe the issue in detail..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            style={styles.textArea}
          />

          <Spacer size="xl" />

          {/* Submit Button */}
          <Button
            onPress={handleSubmit}
            disabled={createReportMutation.isPending}
          >
            {createReportMutation.isPending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              'Submit Report'
            )}
          </Button>

          <Spacer size="xl" />
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
  headerRight: {
    width: 40,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLighter,
  },
  optionIcon: {
    fontSize: 20,
  },
  severityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
});

