/**
 * Create Emergency Report Screen
 * Submit emergency reports for plots about pests, weather, disease, etc.
 */

import React, { useState, useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { captureRef } from 'react-native-view-shot';
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
import { uploadFile } from '../../libs/api-client';
import {
  translateSeverity,
  translateReportType,
} from '../../utils/translations';

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
    affectedCultivationTaskId?: string;
  }>();

  const [formData, setFormData] = useState<CreateEmergencyReportRequest>({
    plotCultivationId: params.plotCultivationId || null,
    groupId: null,
    clusterId: null,
    affectedCultivationTaskId: params.affectedCultivationTaskId || null,
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
  const viewRef = useRef(null);

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
        throw new Error('Vui lòng chọn ít nhất một đối tượng bị ảnh hưởng (canh tác, nhóm hoặc cụm)');
      }
      if (!formData.title.trim()) {
        throw new Error('Vui lòng cung cấp tiêu đề');
      }
      if (!formData.description.trim()) {
        throw new Error('Vui lòng cung cấp mô tả');
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

      const data = new FormData();
      if (formData.plotCultivationId) data.append('PlotCultivationId', formData.plotCultivationId);
      if (formData.groupId) data.append('GroupId', formData.groupId);
      if (formData.clusterId) data.append('ClusterId', formData.clusterId);
      if (formData.affectedCultivationTaskId) data.append('AffectedCultivationTaskId', formData.affectedCultivationTaskId);
      data.append('AlertType', formData.alertType);
      data.append('Title', formData.title.trim());
      data.append('Description', formData.description.trim());
      data.append('Severity', formData.severity);

      if (aiDetectionSummary) {
        data.append('AiDetectionResult', JSON.stringify(aiDetectionSummary));
      }

      images.forEach((img) => {
        const fileName = img.name || img.uri.split('/').pop() || `report_${Date.now()}.jpg`;
        const fileType = fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

        data.append('Images', {
          uri: img.uri,
          type: fileType,
          name: fileName,
        } as any);
      });

      return uploadFile('/Farmer/create-report', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['farmer-plots'] });
      Alert.alert(
        'Đã gửi báo cáo',
        'Báo cáo khẩn cấp của bạn đã được gửi thành công. ' +
        (images.length > 0 ? 'Ảnh sẽ được phân tích bởi AI.' : ''),
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ],
      );
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error.message || 'Không thể gửi báo cáo');
    },
  });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện để tải lên ảnh.');
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
      Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền camera để chụp ảnh.');
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
      'Thêm ảnh',
      'Chọn một tùy chọn',
      [
        {
          text: 'Chụp ảnh',
          onPress: takePhoto,
        },
        {
          text: 'Chọn từ thư viện',
          onPress: pickImage,
        },
        {
          text: 'Hủy',
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

  const handleAddAnnotatedImage = async () => {
    try {
      if (viewRef.current) {
        const uri = await captureRef(viewRef, {
          format: 'jpg',
          quality: 0.8,
          result: 'tmpfile',
        });
        
        const fileName = `annotated_report_${Date.now()}.jpg`;
        const newImage = {
          uri: uri,
          type: 'image/jpeg',
          name: fileName,
        };
        
        setImages([...images, newImage]);
        Alert.alert('Thành công', 'Đã thêm ảnh có kết quả phân tích vào danh sách ảnh báo cáo.');
      }
    } catch (error) {
      console.error('Failed to capture view', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh kết quả.');
    }
  };

  const detectPestInFirstImage = async (image: { uri: string; type: string; name: string }) => {
    setIsDetectingPest(true);
    
    // Show info about processing time
    Alert.alert(
      'Bắt đầu phân tích AI',
      'Đang phân tích ảnh của bạn để tìm sâu bệnh. Quá trình này có thể mất 1-3 phút. Vui lòng đợi...',
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
          'Phân tích hoàn tất',
          'Không phát hiện sâu bệnh trong ảnh. Bạn vẫn có thể gửi báo cáo nếu cần.',
          [{ text: 'OK' }],
        );
      }
    } catch (error: any) {
      console.warn('Pest detection failed:', error);
      const errorMessage = error.code === 'ECONNABORTED' 
        ? 'Phân tích mất quá nhiều thời gian và đã hết thời gian chờ. Vui lòng thử với ảnh nhỏ hơn hoặc gửi báo cáo thủ công.'
        : 'Không thể phân tích ảnh tự động. Bạn vẫn có thể gửi báo cáo thủ công.';
      
      Alert.alert(
        'Phân tích thất bại',
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
              <H3 style={styles.headerTitle}>Báo cáo vấn đề</H3>
              <View style={styles.headerRight} />
            </View>

            <Spacer size="xl" />

            {/* Form */}
            <Card variant="elevated" style={styles.formCard}>
              <H4>Chi tiết báo cáo</H4>
              <Spacer size="md" />

              {/* Cultivation Selector */}
              {cultivations.length > 0 && (
                <>
                  <BodySmall color={colors.textSecondary}>
                    Kế hoạch bị ảnh hưởng (Bắt buộc)
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
                        : 'Chọn kế hoạch canh tác'}
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
              <BodySmall color={colors.textSecondary}>Loại cảnh báo</BodySmall>
              <Spacer size="xs" />
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowAlertTypePicker(!showAlertTypePicker)}
              >
                <Body>{translateReportType(formData.alertType)}</Body>
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
                      <Body>{translateReportType(type)}</Body>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <Spacer size="md" />

              {/* Severity */}
              <BodySmall color={colors.textSecondary}>Mức độ nghiêm trọng</BodySmall>
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
                  <Body>{translateSeverity(formData.severity)}</Body>
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
                        <Body>{translateSeverity(severity)}</Body>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <Spacer size="md" />

              {/* Title */}
              <BodySmall color={colors.textSecondary}>Tiêu đề</BodySmall>
              <Spacer size="xs" />
              <Input
                value={formData.title}
                onChangeText={(title) => setFormData({ ...formData, title })}
                placeholder="Tiêu đề ngắn gọn của vấn đề"
              />
              <Spacer size="md" />

              {/* Description */}
              <BodySmall color={colors.textSecondary}>Mô tả</BodySmall>
              <Spacer size="xs" />
              <Input
                value={formData.description}
                onChangeText={(description) => setFormData({ ...formData, description })}
                placeholder="Mô tả chi tiết về vấn đề"
                multiline
                numberOfLines={4}
                style={styles.textArea}
              />
              <Spacer size="md" />

              {/* Images */}
              <BodySmall color={colors.textSecondary}>
                Ảnh {formData.alertType === 'Pest' ? '(Khuyến nghị - AI sẽ giúp nhận diện sâu bệnh)' : '(Tùy chọn)'}
              </BodySmall>
              <Spacer size="xs" />
              <Button 
                variant="outline" 
                onPress={showImagePickerOptions}
                disabled={isDetectingPest}
                style={{ borderColor: greenTheme.primary, backgroundColor: greenTheme.primaryLighter }}
              >
                {isDetectingPest ? 'Đang phân tích (có thể mất 1-3 phút)...' : 'Thêm ảnh'}
              </Button>
              <Spacer size="sm" />

              {/* Pest Detection Results */}
              {pestDetectionResults && pestDetectionResults.hasPest && (
                <Card variant="elevated" style={styles.detectionCard}>
                  <View style={styles.detectionHeader}>
                    <View style={styles.detectionIconContainer}>
                      <Ionicons name="search" size={24} color={greenTheme.cardBackground} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <H4 style={styles.detectionTitle}>Hoàn tất nhận diện sâu bệnh AI</H4>
                      <Body color={colors.textPrimary} style={styles.detectionSubtitle}>
                        Tìm thấy {pestDetectionResults.totalDetections} trường hợp - Xem nhãn trên ảnh bên dưới
                      </Body>
                    </View>
                  </View>
                  <Spacer size="md" />
                  <View style={styles.pestsListContainer}>
                    <BodySemibold style={styles.pestListTitle}>Sâu bệnh đã phát hiện:</BodySemibold>
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
                    ℹ️ Không phát hiện sâu bệnh trong ảnh. Bạn vẫn có thể gửi báo cáo nếu cần.
                  </Body>
            </Card>
              )}

              {images.length > 0 && (
                <View>
                  {/* First image with detection - show larger */}
                  {pestDetectionResults && pestDetectionResults.hasPest && (
                    <View style={styles.annotatedImageContainer}>
                      <View style={styles.imageHeader}>
                        <View style={styles.imageHeaderLeft}>
                          <Ionicons name="location" size={20} color={greenTheme.primary} />
                          <BodySemibold style={styles.annotatedImageLabel}>
                            Ảnh đã phân tích AI
                          </BodySemibold>
                        </View>
                        <BodySmall color={colors.textSecondary} style={styles.pestCountBadge}>
                          {pestDetectionResults.totalDetections} phát hiện
                        </BodySmall>
                      </View>
                      <BodySmall color={colors.textSecondary} style={styles.imageHint}>
                        Chạm vào hộp màu để xem chi tiết sâu bệnh
                      </BodySmall>
                      <Spacer size="md" />
                      <View style={styles.largeImageWrapper}>
                        <View ref={viewRef} collapsable={false} style={{ width: '100%', height: '100%' }}>
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
                              
                              const borderColor = pest.confidenceLevel === 'High' ? '#EF4444' : 
                                                 pest.confidenceLevel === 'Medium' ? '#F59E0B' : '#EAB308';
                              
                              const boxLeft = pest.location.x1 * scaleX;
                              const boxTop = pest.location.y1 * scaleY;
                              const boxWidth = (pest.location.x2 - pest.location.x1) * scaleX;
                              const boxHeight = (pest.location.y2 - pest.location.y1) * scaleY;
                              
                              const isSelected = selectedPestIndex === pestIndex;
                              
                              return (
                                <TouchableOpacity 
                                  key={pestIndex}
                                  activeOpacity={0.8}
                                  onPress={() => setSelectedPestIndex(isSelected ? null : pestIndex)}
                                  style={{
                                    position: 'absolute',
                                    left: boxLeft,
                                    top: boxTop,
                                    width: boxWidth,
                                    height: boxHeight,
                                  }}
                                >
                                  {/* Bounding box - always visible */}
                                  <View style={{
                                    width: '100%',
                                    height: '100%',
                                    borderWidth: isSelected ? 4 : 2.5,
                                    borderColor: borderColor,
                                    borderRadius: 8,
                                    backgroundColor: isSelected ? `${borderColor}25` : `${borderColor}10`,
                                    shadowColor: borderColor,
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: isSelected ? 0.9 : 0.6,
                                    shadowRadius: isSelected ? 8 : 4,
                                    elevation: isSelected ? 10 : 6,
                                  }} />
                                  
                                  {/* Label - only shown when box is tapped/selected */}
                                  {isSelected && (
                                    <View style={{
                                      position: 'absolute',
                                      top: -50,
                                      left: 0,
                                      backgroundColor: borderColor,
                                      paddingHorizontal: 12,
                                      paddingVertical: 8,
                                      borderRadius: 10,
                                      shadowColor: '#000',
                                      shadowOffset: { width: 0, height: 3 },
                                      shadowOpacity: 0.5,
                                      shadowRadius: 6,
                                      elevation: 10,
                                      minWidth: 140,
                                      borderWidth: 2,
                                      borderColor: '#FFFFFF',
                                    }}>
                                      <Text style={{ 
                                        color: '#FFFFFF', 
                                        fontSize: 15, 
                                        fontWeight: '700',
                                        textAlign: 'center',
                                        letterSpacing: 0.3,
                                      }}>
                                        {pest.pestName}
                                      </Text>
                                      <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginTop: 4,
                                        gap: 6,
                                      }}>
                                        <View style={{
                                          width: 8,
                                          height: 8,
                                          borderRadius: 4,
                                          backgroundColor: '#FFFFFF',
                                        }} />
                                        <Text style={{ 
                                          color: '#FFFFFF', 
                                          fontSize: 13,
                                          fontWeight: '600',
                                          textAlign: 'center',
                                        }}>
                                          {pest.confidence.toFixed(1)}% {pest.confidenceLevel}
                                        </Text>
                                      </View>
                                    </View>
                                  )}
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        )}
                        </View>
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => removeImage(0)}
                        >
                          <Ionicons name="close-circle" size={28} color={colors.white} />
                        </TouchableOpacity>
                      </View>
                      <Spacer size="sm" />
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={handleAddAnnotatedImage}
                        style={{ borderColor: greenTheme.primary, backgroundColor: greenTheme.primaryLighter }}
                      >
                        <Ionicons name="add-circle-outline" size={18} color={greenTheme.primary} style={{ marginRight: 8 }} />
                        Thêm ảnh kết quả vào báo cáo
                      </Button>
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
                              <BodySmall color={colors.white}>Đang phân tích...</BodySmall>
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
            style={{ backgroundColor: greenTheme.primary }}
          >
              {createReportMutation.isPending ? 'Đang gửi...' : 'Gửi báo cáo'}
          </Button>

          <Spacer size="xl" />
      </Container>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Green theme colors for farmer-friendly design
const greenTheme = {
  primary: '#2E7D32', // Forest green
  primaryLight: '#4CAF50', // Medium green
  primaryLighter: '#E8F5E9', // Light green background
  accent: '#66BB6A', // Accent green
  success: '#10B981', // Success green
  background: '#F1F8F4', // Very light green tint
  cardBackground: '#FFFFFF',
  border: '#C8E6C9', // Light green border
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: greenTheme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: getSpacing(spacing.md),
    backgroundColor: greenTheme.cardBackground,
    paddingBottom: getSpacing(spacing.sm),
    borderBottomWidth: 1,
    borderBottomColor: greenTheme.border,
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(borderRadius.full),
    backgroundColor: greenTheme.primaryLighter,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: getFontSize(20),
    color: greenTheme.primary,
    fontWeight: '700',
  },
  headerRight: {
    width: scale(40),
  },
  formCard: {
    padding: getSpacing(spacing.lg),
    backgroundColor: greenTheme.cardBackground,
    borderRadius: moderateScale(borderRadius.lg),
    borderWidth: 1,
    borderColor: greenTheme.border,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getSpacing(spacing.md),
    borderWidth: 1,
    borderColor: greenTheme.border,
    borderRadius: moderateScale(borderRadius.md),
    backgroundColor: greenTheme.cardBackground,
  },
  pickerOptions: {
    marginTop: getSpacing(spacing.xs),
    borderWidth: 1,
    borderColor: greenTheme.border,
    borderRadius: moderateScale(borderRadius.md),
    backgroundColor: greenTheme.cardBackground,
    maxHeight: verticalScale(200),
  },
  pickerOption: {
    padding: getSpacing(spacing.md),
    borderBottomWidth: 1,
    borderBottomColor: greenTheme.border,
  },
  pickerOptionSelected: {
    backgroundColor: greenTheme.primaryLighter,
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
  imageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing(spacing.xs),
  },
  imageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(spacing.xs),
  },
  annotatedImageLabel: {
    fontSize: getFontSize(18),
    fontWeight: '700',
    color: greenTheme.primary,
  },
  pestCountBadge: {
    backgroundColor: greenTheme.primaryLighter,
    paddingHorizontal: getSpacing(spacing.sm),
    paddingVertical: getSpacing(spacing.xs),
    borderRadius: moderateScale(borderRadius.full),
    fontWeight: '600',
    color: greenTheme.primary,
  },
  imageHint: {
    fontSize: getFontSize(13),
    fontStyle: 'italic',
  },
  largeImageWrapper: {
    position: 'relative',
    width: '100%',
    minHeight: verticalScale(350),
    maxHeight: verticalScale(500),
    borderRadius: moderateScale(borderRadius.xl),
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    borderWidth: 3,
    borderColor: greenTheme.primary,
    ...shadows.xl,
    elevation: 8,
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
    top: getSpacing(spacing.sm),
    right: getSpacing(spacing.sm),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: moderateScale(borderRadius.full),
    width: scale(36),
    height: scale(36),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
  },
  removeImageText: {
    color: colors.white,
    fontSize: getFontSize(12),
    fontWeight: 'bold',
  },
  detectionCard: {
    padding: getSpacing(spacing.lg),
    backgroundColor: greenTheme.primaryLighter,
    borderRadius: moderateScale(borderRadius.lg),
    marginBottom: getSpacing(spacing.md),
    borderWidth: 2,
    borderColor: greenTheme.primaryLight,
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
    backgroundColor: greenTheme.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detectionIcon: {
    fontSize: getFontSize(22),
  },
  detectionTitle: {
    color: greenTheme.primary,
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
    backgroundColor: greenTheme.cardBackground,
    paddingHorizontal: getSpacing(spacing.sm),
    paddingVertical: getSpacing(spacing.xs),
    borderRadius: moderateScale(borderRadius.sm),
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  pestChipText: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  noPestCard: {
    padding: getSpacing(spacing.md),
    backgroundColor: greenTheme.primaryLighter,
    borderRadius: moderateScale(borderRadius.md),
    marginBottom: getSpacing(spacing.sm),
    borderWidth: 1,
    borderColor: greenTheme.border,
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
    backgroundColor: greenTheme.primaryLighter,
    paddingHorizontal: getSpacing(spacing.sm),
    paddingVertical: getSpacing(spacing.xs),
    borderRadius: moderateScale(borderRadius.sm),
    minWidth: scale(60),
    alignItems: 'center',
  },
  confidenceText: {
    color: greenTheme.primary,
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
