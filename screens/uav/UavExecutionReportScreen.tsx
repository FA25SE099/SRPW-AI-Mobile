/**
 * UAV Execution Report Screen
 * Mark task completion, enter actual material usage, attach photos/videos
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
import dayjs from 'dayjs';
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

// Mock order data - in real app, this would come from API
const mockOrderData = {
  '1': {
    id: '1',
    orderNumber: 'ORD-2024-001',
    plotName: 'DongThap1 - Plot 16',
    area: 12.5,
    materials: [
      {
        id: 'mat-1',
        name: 'Herbicide A',
        dosage: '2L/ha',
        plannedQuantity: 25,
        unit: 'L',
      },
      {
        id: 'mat-2',
        name: 'Fungicide B',
        dosage: '1.5L/ha',
        plannedQuantity: 18.75,
        unit: 'L',
      },
    ],
  },
  '2': {
    id: '2',
    orderNumber: 'ORD-2024-002',
    plotName: 'AnGiang2 - Plot 18',
    area: 8.3,
    materials: [
      {
        id: 'mat-3',
        name: 'Pesticide C',
        dosage: '1L/ha',
        plannedQuantity: 8.3,
        unit: 'L',
      },
    ],
  },
};

type MediaItem = {
  uri: string;
  type: 'image' | 'video';
  name: string;
};

export const UavExecutionReportScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;

  const order = mockOrderData[orderId as keyof typeof mockOrderData];

  const [formData, setFormData] = useState({
    completionDate: dayjs().format('YYYY-MM-DD'),
    completionTime: dayjs().format('HH:mm'),
    actualAreaSprayed: order?.area?.toString() || '',
    weatherConditions: '',
    windSpeed: '',
    notes: '',
  });

  const [materialQuantities, setMaterialQuantities] = useState<{
    [key: string]: { quantity: string; notes: string };
  }>({});

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <Container padding="lg">
          <ActivityIndicator size="large" color={colors.primary} />
        </Container>
      </SafeAreaView>
    );
  }

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
        type: 'image' as const,
        name: asset.fileName || `image_${Date.now()}.jpg`,
      }));
      setMedia([...media, ...newImages]);
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
      setMedia([
        ...media,
        {
          uri: asset.uri,
          type: 'image',
          name: asset.fileName || `photo_${Date.now()}.jpg`,
        },
      ]);
    }
  };

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload videos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'videos',
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newVideos = result.assets.map((asset) => ({
        uri: asset.uri,
        type: 'video' as const,
        name: asset.fileName || `video_${Date.now()}.mp4`,
      }));
      setMedia([...media, ...newVideos]);
    }
  };

  const takeVideo = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to record videos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'videos',
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setMedia([
        ...media,
        {
          uri: asset.uri,
          type: 'video',
          name: asset.fileName || `video_${Date.now()}.mp4`,
        },
      ]);
    }
  };

  const removeMedia = (index: number) => {
    setMedia(media.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.actualAreaSprayed || parseFloat(formData.actualAreaSprayed) <= 0) {
      Alert.alert('Validation Error', 'Please enter the actual area sprayed.');
      return;
    }

    // Validate material quantities
    const hasMaterialData = order.materials.some(
      (mat) => materialQuantities[mat.id]?.quantity && parseFloat(materialQuantities[mat.id].quantity) > 0,
    );

    if (!hasMaterialData) {
      Alert.alert('Validation Error', 'Please enter actual material usage for at least one material.');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert('Success', 'Execution report submitted successfully.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    }, 2000);
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
            <H3 style={styles.headerTitle}>Execution Report</H3>
            <View style={styles.headerRight} />
          </View>

          <Spacer size="lg" />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Order Info */}
            <Card variant="elevated" style={styles.card}>
              <BodySemibold style={styles.orderNumber}>{order.orderNumber}</BodySemibold>
              <BodySmall color={colors.textSecondary}>{order.plotName}</BodySmall>
              <Spacer size="sm" />
              <BodySmall color={colors.textSecondary}>Planned Area: {order.area} ha</BodySmall>
            </Card>

            <Spacer size="md" />

            {/* Completion Date & Time */}
            <Card variant="elevated" style={styles.card}>
              <H3 style={styles.sectionTitle}>Completion Details</H3>
              <Spacer size="md" />
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <BodySmall color={colors.textSecondary}>Date</BodySmall>
                  <Spacer size="xs" />
                  <Input
                    value={formData.completionDate}
                    onChangeText={(text) => setFormData({ ...formData, completionDate: text })}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
                <Spacer size="md" horizontal />
                <View style={styles.halfWidth}>
                  <BodySmall color={colors.textSecondary}>Time</BodySmall>
                  <Spacer size="xs" />
                  <Input
                    value={formData.completionTime}
                    onChangeText={(text) => setFormData({ ...formData, completionTime: text })}
                    placeholder="HH:mm"
                  />
                </View>
              </View>
              <Spacer size="md" />
              <BodySmall color={colors.textSecondary}>Actual Area Sprayed (ha)</BodySmall>
              <Spacer size="xs" />
              <Input
                value={formData.actualAreaSprayed}
                onChangeText={(text) => setFormData({ ...formData, actualAreaSprayed: text })}
                placeholder="Enter area in hectares"
                keyboardType="decimal-pad"
              />
            </Card>

            <Spacer size="md" />

            {/* Material Usage */}
            <Card variant="elevated" style={styles.card}>
              <H3 style={styles.sectionTitle}>Material Usage</H3>
              <Spacer size="md" />
              {order.materials.map((material) => (
                <View key={material.id} style={styles.materialCard}>
                  <BodySemibold>{material.name}</BodySemibold>
                  <BodySmall color={colors.textSecondary}>
                    Planned: {material.plannedQuantity} {material.unit} ({material.dosage})
                  </BodySmall>
                  <Spacer size="sm" />
                  <BodySmall color={colors.textSecondary}>Actual Quantity Used ({material.unit})</BodySmall>
                  <Spacer size="xs" />
                  <Input
                    value={materialQuantities[material.id]?.quantity || ''}
                    onChangeText={(text) =>
                      setMaterialQuantities({
                        ...materialQuantities,
                        [material.id]: {
                          ...materialQuantities[material.id],
                          quantity: text,
                        },
                      })
                    }
                    placeholder={`Enter actual quantity`}
                    keyboardType="decimal-pad"
                  />
                  <Spacer size="sm" />
                  <BodySmall color={colors.textSecondary}>Notes (optional)</BodySmall>
                  <Spacer size="xs" />
                  <Input
                    value={materialQuantities[material.id]?.notes || ''}
                    onChangeText={(text) =>
                      setMaterialQuantities({
                        ...materialQuantities,
                        [material.id]: {
                          ...materialQuantities[material.id],
                          notes: text,
                        },
                      })
                    }
                    placeholder="Add notes about this material"
                    multiline
                    numberOfLines={2}
                  />
                </View>
              ))}
            </Card>

            <Spacer size="md" />

            {/* Weather Conditions */}
            <Card variant="elevated" style={styles.card}>
              <H3 style={styles.sectionTitle}>Weather Conditions</H3>
              <Spacer size="md" />
              <BodySmall color={colors.textSecondary}>Conditions</BodySmall>
              <Spacer size="xs" />
              <Input
                value={formData.weatherConditions}
                onChangeText={(text) => setFormData({ ...formData, weatherConditions: text })}
                placeholder="e.g., Sunny, Cloudy, Rainy"
              />
              <Spacer size="md" />
              <BodySmall color={colors.textSecondary}>Wind Speed (km/h)</BodySmall>
              <Spacer size="xs" />
              <Input
                value={formData.windSpeed}
                onChangeText={(text) => setFormData({ ...formData, windSpeed: text })}
                placeholder="Enter wind speed"
                keyboardType="decimal-pad"
              />
            </Card>

            <Spacer size="md" />

            {/* Photos & Videos */}
            <Card variant="elevated" style={styles.card}>
              <H3 style={styles.sectionTitle}>Photos & Videos</H3>
              <Spacer size="md" />
              <View style={styles.mediaButtons}>
                <Button variant="outline" size="sm" onPress={pickImage} style={styles.mediaButton}>
                  📷 Gallery
                </Button>
                <Button variant="outline" size="sm" onPress={takePhoto} style={styles.mediaButton}>
                  📸 Camera
                </Button>
                <Button variant="outline" size="sm" onPress={pickVideo} style={styles.mediaButton}>
                  🎥 Video
                </Button>
                <Button variant="outline" size="sm" onPress={takeVideo} style={styles.mediaButton}>
                  🎬 Record
                </Button>
              </View>
              {media.length > 0 && (
                <>
                  <Spacer size="md" />
                  <View style={styles.mediaGrid}>
                    {media.map((item, index) => (
                      <View key={index} style={styles.mediaItem}>
                        {item.type === 'image' ? (
                          <Image source={{ uri: item.uri }} style={styles.mediaPreview} />
                        ) : (
                          <View style={[styles.mediaPreview, styles.videoPreview]}>
                            <Body>🎥</Body>
                            <BodySmall>{item.name}</BodySmall>
                          </View>
                        )}
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => removeMedia(index)}
                        >
                          <Body color={colors.white}>×</Body>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </Card>

            <Spacer size="md" />

            {/* Notes */}
            <Card variant="elevated" style={styles.card}>
              <H3 style={styles.sectionTitle}>Additional Notes</H3>
              <Spacer size="md" />
              <Input
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder="Add any additional notes about the execution..."
                multiline
                numberOfLines={4}
              />
            </Card>

            <Spacer size="xl" />

            {/* Submit Button */}
            <Button
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={styles.submitButton}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                'Submit Report'
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
  card: {
    padding: spacing.md,
  },
  orderNumber: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 18,
  },
  row: {
    flexDirection: 'row',
  },
  halfWidth: {
    flex: 1,
  },
  materialCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  mediaButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  mediaButton: {
    flex: 1,
    minWidth: '45%',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  mediaItem: {
    width: '30%',
    aspectRatio: 1,
    position: 'relative',
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
  },
  videoPreview: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  removeButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    marginTop: spacing.md,
  },
});

