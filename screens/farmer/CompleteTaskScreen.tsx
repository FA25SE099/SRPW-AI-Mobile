/**
 * Complete Task Screen
 * Form to submit farm log when completing a task
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, borderRadius } from '../../theme';
import {
  Container,
  H3,
  Body,
  BodySmall,
  BodySemibold,
  Card,
  Spacer,
  Button,
  Input,
} from '../../components/ui';
import { CreateFarmLogRequest, FarmLogMaterialRequest, TodayTaskResponse } from '../../types/api';
import { createFarmLog } from '../../libs/farmer';
import { useUser } from '../../libs/auth';

export const CompleteTaskScreen = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    taskId: string;
    plotCultivationId: string;
    taskName: string;
    plotSoThuaSoTo: string;
    materials?: string; // JSON string of materials array
  }>();
  const { data: user } = useUser();

  const [formData, setFormData] = useState<CreateFarmLogRequest>({
    cultivationTaskId: params.taskId || '',
    plotCultivationId: params.plotCultivationId || '',
    workDescription: '',
    actualAreaCovered: null,
    serviceCost: null,
    serviceNotes: '',
    weatherConditions: '',
    interruptionReason: '',
    materials: params.materials ? JSON.parse(params.materials) : [],
  });

  const [images, setImages] = useState<{ uri: string; type: string; name: string }[]>([]);
  const [materialQuantities, setMaterialQuantities] = useState<{
    [key: string]: { quantity: string; notes: string };
  }>({});

  const createFarmLogMutation = useMutation({
    mutationFn: async () => {
      // Prepare materials with actual quantities
      const materials: FarmLogMaterialRequest[] = [];
      if (formData.materials && formData.materials.length > 0) {
        formData.materials.forEach((material: any) => {
          const quantity = materialQuantities[material.materialId]?.quantity;
          if (quantity && parseFloat(quantity) > 0) {
            materials.push({
              materialId: material.materialId,
              actualQuantityUsed: parseFloat(quantity),
              notes: materialQuantities[material.materialId]?.notes || null,
            });
          }
        });
      }

      const request: CreateFarmLogRequest = {
        ...formData,
        materials: materials.length > 0 ? materials : undefined,
        farmerId: user?.id || null,
      };

      // Prepare image files
      const imageFiles = images.map((img, index) => ({
        uri: img.uri,
        type: img.type || 'image/jpeg',
        name: img.name || `proof_${index}.jpg`,
      }));

      return createFarmLog(request, imageFiles);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-tasks'] });
      Alert.alert('Success', 'Farm log submitted and task marked as completed.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to submit farm log');
    },
  });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
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
        name: asset.fileName || `proof_${Date.now()}.jpg`,
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
        name: asset.fileName || `proof_${Date.now()}.jpg`,
      };
      setImages([...images, newImage]);
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Add Proof Image',
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

  const handleSubmit = () => {
    if (!formData.cultivationTaskId || !formData.plotCultivationId) {
      Alert.alert('Error', 'Missing required task information');
      return;
    }

    createFarmLogMutation.mutate();
  };

  const updateMaterialQuantity = (materialId: string, quantity: string, notes: string) => {
    setMaterialQuantities({
      ...materialQuantities,
      [materialId]: { quantity, notes },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Container padding="lg">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Body>←</Body>
            </TouchableOpacity>
            <H3 style={styles.headerTitle}>Complete Task</H3>
            <View style={styles.headerRight} />
          </View>

          <Spacer size="lg" />

          {/* Task Info */}
          <Card variant="elevated" style={styles.infoCard}>
            <BodySemibold style={styles.taskName}>{params.taskName}</BodySemibold>
            <BodySmall color={colors.textSecondary}>📍 {params.plotSoThuaSoTo}</BodySmall>
          </Card>

          <Spacer size="lg" />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Work Description */}
            <Input
              label="Work Description"
              placeholder="Describe the work completed..."
              value={formData.workDescription || ''}
              onChangeText={(text) => setFormData({ ...formData, workDescription: text })}
              multiline
              numberOfLines={4}
              style={styles.textArea}
            />

            {/* Actual Area Covered */}
            <Input
              label="Actual Area Covered (ha)"
              placeholder="0.00"
              value={formData.actualAreaCovered?.toString() || ''}
              onChangeText={(text) => {
                const num = parseFloat(text);
                setFormData({
                  ...formData,
                  actualAreaCovered: isNaN(num) ? null : num,
                });
              }}
              keyboardType="decimal-pad"
            />

            {/* Service Cost */}
            <Input
              label="Service Cost (₫)"
              placeholder="0"
              value={formData.serviceCost?.toString() || ''}
              onChangeText={(text) => {
                const num = parseFloat(text);
                setFormData({
                  ...formData,
                  serviceCost: isNaN(num) ? null : num,
                });
              }}
              keyboardType="numeric"
            />

            {/* Service Notes */}
            <Input
              label="Service Notes"
              placeholder="Additional notes about the service..."
              value={formData.serviceNotes || ''}
              onChangeText={(text) => setFormData({ ...formData, serviceNotes: text })}
              multiline
              numberOfLines={3}
              style={styles.textArea}
            />

            {/* Weather Conditions */}
            <Input
              label="Weather Conditions"
              placeholder="e.g., Sunny, Rainy, Cloudy..."
              value={formData.weatherConditions || ''}
              onChangeText={(text) => setFormData({ ...formData, weatherConditions: text })}
            />

            {/* Interruption Reason */}
            <Input
              label="Interruption Reason (if any)"
              placeholder="Reason for interruption..."
              value={formData.interruptionReason || ''}
              onChangeText={(text) => setFormData({ ...formData, interruptionReason: text })}
              multiline
              numberOfLines={2}
              style={styles.textArea}
            />

            {/* Materials */}
            {formData.materials && formData.materials.length > 0 && (
              <>
                <Spacer size="md" />
                <BodySemibold style={styles.sectionTitle}>Materials Used</BodySemibold>
                <Spacer size="sm" />
                {formData.materials.map((material: any) => (
                  <Card key={material.materialId} variant="elevated" style={styles.materialCard}>
                    <BodySemibold>{material.materialName}</BodySemibold>
                    <BodySmall color={colors.textSecondary}>
                      Unit: {material.materialUnit}
                    </BodySmall>
                    <BodySmall color={colors.textSecondary}>
                      Planned: {material.plannedQuantityTotal.toLocaleString()}
                    </BodySmall>
                    <Spacer size="sm" />
                    <Input
                      label="Actual Quantity Used"
                      placeholder="0"
                      value={materialQuantities[material.materialId]?.quantity || ''}
                      onChangeText={(text) =>
                        updateMaterialQuantity(
                          material.materialId,
                          text,
                          materialQuantities[material.materialId]?.notes || '',
                        )
                      }
                      keyboardType="decimal-pad"
                    />
                    <Input
                      label="Notes (optional)"
                      placeholder="Notes about this material..."
                      value={materialQuantities[material.materialId]?.notes || ''}
                      onChangeText={(text) =>
                        updateMaterialQuantity(
                          material.materialId,
                          materialQuantities[material.materialId]?.quantity || '',
                          text,
                        )
                      }
                      multiline
                      numberOfLines={2}
                      style={styles.textArea}
                    />
                  </Card>
                ))}
              </>
            )}

            {/* Proof Images */}
            <Spacer size="md" />
            <BodySemibold style={styles.sectionTitle}>Proof Images</BodySemibold>
            <Spacer size="sm" />
            <View style={styles.imageButtonRow}>
              <Button
                variant="outline"
                size="sm"
                onPress={showImagePickerOptions}
                style={styles.addImageButton}
              >
                📷 Add Images
              </Button>
            </View>
            <Spacer size="sm" />
            {images.length > 0 && (
              <View style={styles.imageGrid}>
                {images.map((image, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri: image.uri }} style={styles.image} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <BodySmall color={colors.white}>×</BodySmall>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <Spacer size="xl" />

            {/* Submit Button */}
            <Button
              onPress={handleSubmit}
              fullWidth
              size="lg"
              disabled={createFarmLogMutation.isPending}
            >
              {createFarmLogMutation.isPending ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                'Submit Farm Log'
              )}
            </Button>

            <Spacer size="xl" />
          </ScrollView>
        </Container>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
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
  infoCard: {
    padding: spacing.md,
  },
  taskName: {
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  materialCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  imageButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addImageButton: {
    alignSelf: 'flex-start',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

