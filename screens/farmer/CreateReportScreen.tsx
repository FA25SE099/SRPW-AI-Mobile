/**
 * Create Emergency Report Screen
 * Submit emergency reports for plots about pests, weather, disease, etc.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { colors, spacing, borderRadius } from '../../theme';
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
  Input,
} from '../../components/ui';
import {
  CreateEmergencyReportRequest,
  AlertType,
  Severity,
  PlotCultivationPlan,
} from '../../types/api';
import { createEmergencyReport, getPlotCultivationPlans } from '../../libs/farmer';
import { useUser } from '../../libs/auth';

const ALERT_TYPES: AlertType[] = ['Pest', 'Weather', 'Disease', 'Other'];
const SEVERITY_LEVELS: Severity[] = ['Low', 'Medium', 'High', 'Critical'];

export const CreateReportScreen = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  
  // Optional pre-selected plotId from navigation params
  const params = useLocalSearchParams<{
    plotId?: string;
    plotCultivationId?: string;
  }>();

  const [formData, setFormData] = useState<CreateEmergencyReportRequest>({
    plotCultivationId: params.plotCultivationId || null,
    groupId: null,
    clusterId: null,
    alertType: 'Pest',
    title: '',
    description: '',
    severity: 'Medium',
    imageUrls: null,
  });

  const [images, setImages] = useState<{ uri: string; type: string; name: string }[]>([]);
  const [showAlertTypePicker, setShowAlertTypePicker] = useState(false);
  const [showSeverityPicker, setShowSeverityPicker] = useState(false);
  const [showCultivationPicker, setShowCultivationPicker] = useState(false);

  // Fetch cultivations for the selected plot
  const { data: cultivationsData } = useQuery({
    queryKey: ['plot-plans', params.plotId],
    queryFn: () => {
      if (!params.plotId) return null;
      return getPlotCultivationPlans(params.plotId);
    },
    enabled: Boolean(params.plotId),
  });

  const cultivations = cultivationsData?.data ?? [];

  const createReportMutation = useMutation({
    mutationFn: async () => {
      // Validation
      if (!formData.plotCultivationId && !formData.groupId && !formData.clusterId) {
        throw new Error('Please select at least one affected entity (cultivation, group, or cluster)');
      }
      if (!formData.title.trim()) {
        throw new Error('Please provide a title');
      }
      if (!formData.description.trim()) {
        throw new Error('Please provide a description');
      }

      const request: CreateEmergencyReportRequest = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
      };

      // Prepare image files
      const imageFiles = images.map((img, index) => ({
        uri: img.uri,
        type: img.type || 'image/jpeg',
        name: img.name || `report_${index}.jpg`,
      }));

      return createEmergencyReport(request, imageFiles);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['farmer-plots'] });
      Alert.alert(
        'Report Submitted',
        'Your emergency report has been submitted successfully. ' +
        (images.length > 0 ? 'Images will be analyzed by AI.' : ''),
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ],
      );
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to submit report');
    },
  });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant gallery access to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `report_${Date.now()}.jpg`,
      }));
      setImages([...images, ...newImages]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const newImage = {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `report_${Date.now()}.jpg`,
      };
      setImages([...images, newImage]);
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Add Image',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Gallery',
          onPress: pickImage,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true },
    );
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case 'Critical':
        return colors.error;
      case 'High':
        return '#FF9500';
      case 'Medium':
        return '#FFD60A';
      case 'Low':
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Container padding="lg">
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Body>←</Body>
              </TouchableOpacity>
              <H3 style={styles.headerTitle}>Report Issue</H3>
              <View style={styles.headerRight} />
            </View>

            <Spacer size="xl" />

            {/* Form */}
            <Card variant="elevated" style={styles.formCard}>
              <H4>Report Details</H4>
              <Spacer size="md" />

              {/* Cultivation Selector */}
              {cultivations.length > 0 && (
                <>
                  <BodySmall color={colors.textSecondary}>
                    Affected Cultivation (Required)
                  </BodySmall>
                  <Spacer size="xs" />
                  <TouchableOpacity
                    style={styles.picker}
                    onPress={() => setShowCultivationPicker(!showCultivationPicker)}
                  >
                    <Body>
                      {formData.plotCultivationId
                        ? cultivations.find(
                            (c) => c.plotCultivationId === formData.plotCultivationId,
                          )?.productionPlanName || 'Select Cultivation'
                        : 'Select Cultivation'}
                    </Body>
                    <Body>{showCultivationPicker ? '▲' : '▼'}</Body>
                  </TouchableOpacity>
                  {showCultivationPicker && (
                    <View style={styles.pickerOptions}>
                      <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                        {cultivations.map((cultivation) => (
                          <TouchableOpacity
                            key={cultivation.plotCultivationId}
                            style={[
                              styles.pickerOption,
                              formData.plotCultivationId === cultivation.plotCultivationId &&
                                styles.pickerOptionSelected,
                            ]}
                            onPress={() => {
                              setFormData({
                                ...formData,
                                plotCultivationId: cultivation.plotCultivationId,
                              });
                              setShowCultivationPicker(false);
                            }}
                          >
                            <BodySemibold>
                              {cultivation.productionPlanName}
                            </BodySemibold>
                            <BodySmall color={colors.textSecondary}>
                              {cultivation.riceVarietyName} • {cultivation.seasonName}
                            </BodySmall>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  <Spacer size="md" />
                </>
              )}

              {/* Alert Type */}
              <BodySmall color={colors.textSecondary}>Alert Type</BodySmall>
              <Spacer size="xs" />
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowAlertTypePicker(!showAlertTypePicker)}
              >
                <Body>{formData.alertType}</Body>
                <Body>{showAlertTypePicker ? '▲' : '▼'}</Body>
              </TouchableOpacity>
              {showAlertTypePicker && (
                <View style={styles.pickerOptions}>
                  {ALERT_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.pickerOption,
                        formData.alertType === type && styles.pickerOptionSelected,
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, alertType: type });
                        setShowAlertTypePicker(false);
                      }}
                    >
                      <Body>{type}</Body>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <Spacer size="md" />

              {/* Severity */}
              <BodySmall color={colors.textSecondary}>Severity Level</BodySmall>
              <Spacer size="xs" />
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowSeverityPicker(!showSeverityPicker)}
              >
                <View style={styles.severityRow}>
                  <View
                    style={[
                      styles.severityIndicator,
                      { backgroundColor: getSeverityColor(formData.severity) },
                    ]}
                  />
                  <Body>{formData.severity}</Body>
                </View>
                <Body>{showSeverityPicker ? '▲' : '▼'}</Body>
              </TouchableOpacity>
              {showSeverityPicker && (
                <View style={styles.pickerOptions}>
                  {SEVERITY_LEVELS.map((severity) => (
                    <TouchableOpacity
                      key={severity}
                      style={[
                        styles.pickerOption,
                        formData.severity === severity && styles.pickerOptionSelected,
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, severity });
                        setShowSeverityPicker(false);
                      }}
                    >
                      <View style={styles.severityRow}>
                        <View
                          style={[
                            styles.severityIndicator,
                            { backgroundColor: getSeverityColor(severity) },
                          ]}
                        />
                        <Body>{severity}</Body>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <Spacer size="md" />

              {/* Title */}
              <BodySmall color={colors.textSecondary}>Title</BodySmall>
              <Spacer size="xs" />
              <Input
                value={formData.title}
                onChangeText={(title) => setFormData({ ...formData, title })}
                placeholder="Brief title of the issue"
              />
              <Spacer size="md" />

              {/* Description */}
              <BodySmall color={colors.textSecondary}>Description</BodySmall>
              <Spacer size="xs" />
              <Input
                value={formData.description}
                onChangeText={(description) => setFormData({ ...formData, description })}
                placeholder="Detailed description of the problem"
                multiline
                numberOfLines={4}
                style={styles.textArea}
              />
              <Spacer size="md" />

              {/* Images */}
              <BodySmall color={colors.textSecondary}>
                Images (Optional - Recommended for Pest reports)
              </BodySmall>
              <Spacer size="xs" />
              <Button variant="outline" onPress={showImagePickerOptions}>
                Add Images
              </Button>
              <Spacer size="sm" />

              {images.length > 0 && (
                <View style={styles.imagesGrid}>
                  {images.map((img, index) => (
                    <View key={index} style={styles.imageContainer}>
                      <Image source={{ uri: img.uri }} style={styles.image} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <Body style={styles.removeImageText}>✕</Body>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </Card>

            <Spacer size="xl" />

            {/* Submit Button */}
            <Button
              onPress={() => createReportMutation.mutate()}
              disabled={createReportMutation.isPending}
            >
              {createReportMutation.isPending ? 'Submitting...' : 'Submit Report'}
            </Button>

            <Spacer size="xl" />
          </Container>
        </ScrollView>
      </KeyboardAvoidingView>
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
  formCard: {
    padding: spacing.lg,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
  },
  pickerOptions: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    maxHeight: 200,
  },
  pickerOption: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  pickerOptionSelected: {
    backgroundColor: colors.primaryLighter,
  },
  severityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  severityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

