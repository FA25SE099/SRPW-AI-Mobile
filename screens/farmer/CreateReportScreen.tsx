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
  Text,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { scale, moderateScale, getFontSize, getSpacing, isTablet, verticalScale } from '../../utils/responsive';
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
  PestDetectionResponse,
} from '../../types/api';
import { createEmergencyReport, getPlotCultivationPlans, detectPestInImage } from '../../libs/farmer';
import { useUser } from '../../libs/auth';

const ALERT_TYPES: AlertType[] = ['Pest', 'Weather', 'Disease', 'Other'];
const SEVERITY_LEVELS: Severity[] = ['Low', 'Medium', 'High', 'Critical'];

export const CreateReportScreen = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const { width: screenWidth } = useWindowDimensions();
  
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
  const [pestDetectionResults, setPestDetectionResults] = useState<PestDetectionResponse | null>(null);
  const [isDetectingPest, setIsDetectingPest] = useState(false);
  const [annotatedImageDimensions, setAnnotatedImageDimensions] = useState<{ 
    width: number; 
    height: number; 
    offsetX?: number; 
    offsetY?: number;
  } | null>(null);
  const [selectedPestIndex, setSelectedPestIndex] = useState<number | null>(null);

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

      // Prepare AI detection summary if available
      let aiDetectionSummary = null;
      if (pestDetectionResults && pestDetectionResults.hasPest) {
        // Calculate average confidence
        const avgConfidence = pestDetectionResults.detectedPests.reduce(
          (sum, pest) => sum + pest.confidence, 
          0
        ) / pestDetectionResults.detectedPests.length;

        aiDetectionSummary = {
          hasPest: pestDetectionResults.hasPest,
          totalDetections: pestDetectionResults.totalDetections,
          detectedPests: pestDetectionResults.detectedPests.map(pest => ({
            pestName: pest.pestName,
            confidence: pest.confidence,
            confidenceLevel: pest.confidenceLevel,
          })),
          averageConfidence: avgConfidence,
          imageInfo: pestDetectionResults.imageInfo,
        };
      }

      const request: CreateEmergencyReportRequest = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        aiDetectionResult: aiDetectionSummary,
      };

      // Prepare image files with robust MIME type inference
      const imageFiles = images.map((img) => {
        const fileName = img.name || img.uri.split('/').pop() || `report_${Date.now()}.jpg`;
        const fileType = fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        
        return {
          uri: img.uri,
          type: fileType,
          name: fileName,
        };
      });

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
      const newImages = result.assets.map((asset) => {
        const uri = asset.uri;
        const fileName = asset.fileName || uri.split('/').pop() || `report_${Date.now()}.jpg`;
        // Infer MIME type from file extension for robustness on Android
        const fileType = fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        
        return {
          uri: uri,
          type: fileType,
          name: fileName,
        };
      });
      setImages([...images, ...newImages]);
      
      // If alert type is Pest and we just added the first image, auto-detect
      if (formData.alertType === 'Pest' && images.length === 0 && newImages.length > 0) {
        detectPestInFirstImage(newImages[0]);
      }
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
      const uri = asset.uri;
      const fileName = asset.fileName || uri.split('/').pop() || `report_${Date.now()}.jpg`;
      // Infer MIME type from file extension for robustness on Android
      const fileType = fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      
      const newImage = {
        uri: uri,
        type: fileType,
        name: fileName,
      };
      setImages([...images, newImage]);
      
      // If alert type is Pest and we just added the first image, auto-detect
      if (formData.alertType === 'Pest' && images.length === 0) {
        detectPestInFirstImage(newImage);
      }
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
    // Clear pest detection results if we remove the first image
    if (index === 0) {
      setPestDetectionResults(null);
      setAnnotatedImageDimensions(null);
      setSelectedPestIndex(null);
    }
  };

  const detectPestInFirstImage = async (image: { uri: string; type: string; name: string }) => {
    setIsDetectingPest(true);
    
    // Show info about processing time
    Alert.alert(
      'AI Analysis Started',
      'Analyzing your image for pests. This may take 1-3 minutes. Please wait...',
      [{ text: 'OK' }],
    );
    
    try {
      const result = await detectPestInImage(image);
      setPestDetectionResults(result);
      
      // Auto-fill form if pest detected
      if (result.hasPest && result.totalDetections > 0) {
        const topPest = result.detectedPests[0];
        const pestNames = [...new Set(result.detectedPests.map(p => p.pestName))].join(', ');
        
        setFormData({
          ...formData,
          title: formData.title || `${pestNames} detected`,
          description: formData.description || 
            `AI detected ${result.totalDetections} pest instance(s). Primary: ${topPest.pestName} (${topPest.confidence.toFixed(1)}% confidence).`,
          severity: result.detectedPests.some(p => p.confidenceLevel === 'High') ? 'High' : 'Medium',
        });
        
        // Show success message
        Alert.alert(
          'Analysis Complete!',
          `Found ${result.totalDetections} pest instance(s). Check the marked areas on your image.`,
          [{ text: 'OK' }],
        );
      } else {
        // No pests found
        Alert.alert(
          'Analysis Complete',
          'No pests detected in the image. You can still submit your report if needed.',
          [{ text: 'OK' }],
        );
      }
    } catch (error: any) {
      console.warn('Pest detection failed:', error);
      const errorMessage = error.code === 'ECONNABORTED' 
        ? 'The analysis took too long and timed out. Please try with a smaller image or submit your report manually.'
        : 'Could not analyze the image automatically. You can still submit your report manually.';
      
      Alert.alert(
        'Analysis Failed',
        errorMessage,
        [{ text: 'OK' }],
      );
    } finally {
      setIsDetectingPest(false);
    }
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
                Images {formData.alertType === 'Pest' ? '(Recommended - AI will help identify pests)' : '(Optional)'}
              </BodySmall>
              <Spacer size="xs" />
              <Button 
                variant="outline" 
                onPress={showImagePickerOptions}
                disabled={isDetectingPest}
              >
                {isDetectingPest ? 'Analyzing (may take 1-3 min)...' : 'Add Images'}
              </Button>
              <Spacer size="sm" />

              {/* Pest Detection Results */}
              {pestDetectionResults && pestDetectionResults.hasPest && (
                <Card variant="elevated" style={styles.detectionCard}>
                  <View style={styles.detectionHeader}>
                    <View style={styles.detectionIconContainer}>
                      <Body style={styles.detectionIcon}>🔍</Body>
                    </View>
                    <View style={{ flex: 1 }}>
                      <H4 style={styles.detectionTitle}>AI Pest Detection Complete</H4>
                      <Body color={colors.textPrimary} style={styles.detectionSubtitle}>
                        Found {pestDetectionResults.totalDetections} instance(s) - See labels on image below
                      </Body>
                    </View>
                  </View>
                  <Spacer size="md" />
                  <View style={styles.pestsListContainer}>
                    <BodySemibold style={styles.pestListTitle}>Detected Pests:</BodySemibold>
                    <Spacer size="xs" />
                    <View style={styles.pestNamesWrapper}>
                      {[...new Set(pestDetectionResults.detectedPests.map(p => p.pestName))].map((pestName, idx) => (
                        <View key={idx} style={styles.pestNameChip}>
                          <Body style={styles.pestChipText}>• {pestName}</Body>
                    </View>
                  ))}
                </View>
                  </View>
                </Card>
              )}

              {pestDetectionResults && !pestDetectionResults.hasPest && (
                <Card variant="flat" style={styles.noPestCard}>
                  <Body color={colors.textPrimary}>
                    ℹ️ No pests detected in the image. You can still submit your report.
                  </Body>
            </Card>
              )}

              {images.length > 0 && (
                <View>
                  {/* First image with detection - show larger */}
                  {pestDetectionResults && pestDetectionResults.hasPest && (
                    <View style={styles.annotatedImageContainer}>
                      <Body color={colors.textPrimary} style={styles.annotatedImageLabel}>
                        📍 Detected pests marked on image
                      </Body>
                      <BodySmall color={colors.textSecondary} style={{ marginTop: spacing.xs }}>
                        Tap on any box to view pest details
                      </BodySmall>
                      <Spacer size="sm" />
                      <View style={styles.largeImageWrapper}>
                        <Image 
                          source={{ uri: images[0].uri }} 
                          style={styles.largeImage}
                          resizeMode="contain"
                          onLayout={(event) => {
                            const { width: containerWidth, height: containerHeight } = event.nativeEvent.layout;
                            
                            // Calculate the actual displayed image dimensions considering aspect ratio
                            const imageAspectRatio = pestDetectionResults.imageInfo.width / pestDetectionResults.imageInfo.height;
                            const containerAspectRatio = containerWidth / containerHeight;
                            
                            let displayWidth, displayHeight, offsetX, offsetY;
                            
                            if (imageAspectRatio > containerAspectRatio) {
                              // Image is wider - fit to width
                              displayWidth = containerWidth;
                              displayHeight = containerWidth / imageAspectRatio;
                              offsetX = 0;
                              offsetY = (containerHeight - displayHeight) / 2;
                            } else {
                              // Image is taller - fit to height
                              displayHeight = containerHeight;
                              displayWidth = containerHeight * imageAspectRatio;
                              offsetX = (containerWidth - displayWidth) / 2;
                              offsetY = 0;
                            }
                            
                            setAnnotatedImageDimensions({ 
                              width: displayWidth, 
                              height: displayHeight,
                              offsetX,
                              offsetY 
                            });
                          }}
                        />
                        {/* Render bounding boxes with labels */}
                        {annotatedImageDimensions && (
                          <View style={[StyleSheet.absoluteFill, { 
                            left: annotatedImageDimensions.offsetX || 0,
                            top: annotatedImageDimensions.offsetY || 0,
                            width: annotatedImageDimensions.width,
                            height: annotatedImageDimensions.height
                          }]}>
                            {pestDetectionResults.detectedPests.map((pest, pestIndex) => {
                              const scaleX = annotatedImageDimensions.width / pestDetectionResults.imageInfo.width;
                              const scaleY = annotatedImageDimensions.height / pestDetectionResults.imageInfo.height;
                              
                              const borderColor = pest.confidenceLevel === 'High' ? '#FF5252' : 
                                                 pest.confidenceLevel === 'Medium' ? '#FFA726' : '#FFEB3B';
                              
                              const boxLeft = pest.location.x1 * scaleX;
                              const boxTop = pest.location.y1 * scaleY;
                              const boxWidth = (pest.location.x2 - pest.location.x1) * scaleX;
                              const boxHeight = (pest.location.y2 - pest.location.y1) * scaleY;
                              
                              const isSelected = selectedPestIndex === pestIndex;
                              
                              return (
                                <TouchableOpacity 
                                  key={pestIndex}
                                  activeOpacity={0.7}
                                  onPress={() => setSelectedPestIndex(isSelected ? null : pestIndex)}
                                  style={{
                                    position: 'absolute',
                                    left: boxLeft,
                                    top: boxTop,
                                    width: boxWidth,
                                    height: boxHeight,
                                  }}
                                >
                                  {/* Bounding box */}
                                  <View style={{
                                    width: '100%',
                                    height: '100%',
                                    borderWidth: isSelected ? 4 : 3,
                                    borderColor: borderColor,
                                    borderRadius: 6,
                                    backgroundColor: isSelected ? `${borderColor}30` : `${borderColor}15`,
                                    shadowColor: borderColor,
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: isSelected ? 1 : 0.8,
                                    shadowRadius: isSelected ? 6 : 4,
                                    elevation: isSelected ? 8 : 5,
                                  }} />
                                  
                                  {/* Label on top of the box (shown only when selected) */}
                                  {isSelected && (
                                    <View style={{
                                      position: 'absolute',
                                      top: -35,
                                      left: 0,
                                      backgroundColor: borderColor,
                                      paddingHorizontal: 10,
                                      paddingVertical: 5,
                                      borderRadius: 6,
                                      shadowColor: '#000',
                                      shadowOffset: { width: 0, height: 2 },
                                      shadowOpacity: 0.5,
                                      shadowRadius: 4,
                                      elevation: 6,
                                      minWidth: 100,
                                    }}>
                                      <Text style={{ 
                                        color: '#FFFFFF', 
                                        fontSize: 13, 
                                        fontWeight: '700',
                                        textAlign: 'center',
                                      }}>
                                        {pest.pestName}
                                      </Text>
                                      <Text style={{ 
                                        color: '#FFFFFF', 
                                        fontSize: 11,
                                        fontWeight: '600',
                                        textAlign: 'center',
                                        marginTop: 2,
                                      }}>
                                        {pest.confidence.toFixed(1)}%
                                      </Text>
                                    </View>
                                  )}
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        )}
              <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => removeImage(0)}
                        >
                          <Body style={styles.removeImageText}>✕</Body>
              </TouchableOpacity>
          </View>
                    </View>
                  )}
                  
                  {/* Other images or single image without detection */}
                  <View style={styles.imagesGrid}>
                    {images.map((img, index) => {
                      // Skip first image if it has detection results (already shown above)
                      if (index === 0 && pestDetectionResults && pestDetectionResults.hasPest) {
                        return null;
                      }
                      
                      return (
                        <View key={index} style={styles.imageContainer}>
                          <Image 
                            source={{ uri: img.uri }} 
                            style={styles.image}
                          />
              <TouchableOpacity
                            style={styles.removeImageButton}
                            onPress={() => removeImage(index)}
                          >
                            <Body style={styles.removeImageText}>✕</Body>
              </TouchableOpacity>
                          {index === 0 && isDetectingPest && (
                            <View style={styles.analyzingOverlay}>
                              <BodySmall color={colors.white}>Analyzing...</BodySmall>
          </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
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
  formCard: {
    padding: getSpacing(spacing.lg),
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getSpacing(spacing.md),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: moderateScale(borderRadius.md),
    backgroundColor: colors.white,
  },
  pickerOptions: {
    marginTop: getSpacing(spacing.xs),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: moderateScale(borderRadius.md),
    backgroundColor: colors.white,
    maxHeight: verticalScale(200),
  },
  pickerOption: {
    padding: getSpacing(spacing.md),
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  pickerOptionSelected: {
    backgroundColor: colors.primaryLighter,
  },
  severityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(spacing.sm),
  },
  severityIndicator: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
  },
  textArea: {
    height: verticalScale(100),
    textAlignVertical: 'top',
  },
  annotatedImageContainer: {
    marginBottom: getSpacing(spacing.lg),
  },
  annotatedImageLabel: {
    fontSize: getFontSize(16),
    fontWeight: '600',
  },
  largeImageWrapper: {
    position: 'relative',
    width: '100%',
    height: verticalScale(300),
    borderRadius: moderateScale(borderRadius.lg),
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.lg,
  },
  largeImage: {
    width: '100%',
    height: '100%',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getSpacing(spacing.sm),
  },
  imageContainer: {
    position: 'relative',
    width: scale(100),
    height: scale(100),
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(borderRadius.md),
  },
  removeImageButton: {
    position: 'absolute',
    top: scale(-8),
    right: scale(-8),
    backgroundColor: colors.error,
    borderRadius: scale(12),
    width: scale(24),
    height: scale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: colors.white,
    fontSize: getFontSize(12),
    fontWeight: 'bold',
  },
  detectionCard: {
    padding: getSpacing(spacing.lg),
    backgroundColor: '#E8F5E9',
    borderRadius: moderateScale(borderRadius.lg),
    marginBottom: getSpacing(spacing.md),
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  detectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: getSpacing(spacing.md),
  },
  detectionIconContainer: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detectionIcon: {
    fontSize: getFontSize(22),
  },
  detectionTitle: {
    color: '#2E7D32',
    marginBottom: getSpacing(spacing.xs),
    fontSize: getFontSize(16),
  },
  detectionSubtitle: {
    fontSize: getFontSize(15),
    lineHeight: moderateScale(20),
  },
  legendContainer: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(borderRadius.md),
    padding: getSpacing(spacing.md),
  },
  legendTitle: {
    marginBottom: getSpacing(spacing.xs),
    fontWeight: '600',
    fontSize: getFontSize(14),
  },
  legendRow: {
    flexDirection: 'row',
    gap: getSpacing(spacing.lg),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(spacing.xs),
  },
  legendDot: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
  },
  pestsListContainer: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(borderRadius.md),
    padding: getSpacing(spacing.md),
  },
  pestListTitle: {
    fontSize: getFontSize(15),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pestNamesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getSpacing(spacing.xs),
  },
  pestNameChip: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: getSpacing(spacing.sm),
    paddingVertical: getSpacing(spacing.xs),
    borderRadius: moderateScale(borderRadius.sm),
    borderWidth: 1,
    borderColor: colors.border,
  },
  pestChipText: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  noPestCard: {
    padding: getSpacing(spacing.md),
    backgroundColor: colors.backgroundSecondary,
    borderRadius: moderateScale(borderRadius.md),
    marginBottom: getSpacing(spacing.sm),
  },
  pestItem: {
    paddingVertical: getSpacing(spacing.sm),
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  pestInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pestNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(spacing.sm),
    flex: 1,
  },
  pestNameText: {
    fontSize: getFontSize(16),
    fontWeight: '600',
  },
  confidenceDot: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  confidenceBadge: {
    backgroundColor: colors.primaryLighter,
    paddingHorizontal: getSpacing(spacing.sm),
    paddingVertical: getSpacing(spacing.xs),
    borderRadius: moderateScale(borderRadius.sm),
    minWidth: scale(60),
    alignItems: 'center',
  },
  confidenceText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: getFontSize(14),
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(borderRadius.md),
  },
});

