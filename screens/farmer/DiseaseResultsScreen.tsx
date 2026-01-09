/**
 * Disease Detection Results Screen
 * Display AI detection results with bounding boxes
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polygon, G } from 'react-native-svg';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';

// Responsive breakpoints
const BREAKPOINTS = {
  small: 375,
  medium: 768,
  large: 1024,
};

const { width: INITIAL_SCREEN_WIDTH } = Dimensions.get('window');

// Old API format (for reference)
// interface Detection {
//   id: number;
//   class_id: number;
//   class_name: string;
//   confidence: number;
//   box: { x1: number; y1: number; x2: number; y2: number; };
//   box_norm: { x1: number; y1: number; x2: number; y2: number; };
// }

// New API format from /api/rice/check-pest
interface PestLocation {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface MaskPoint {
  points: number[][];
}

interface DetectedPest {
  id: number;
  classId: number;
  pestName: string;
  confidence: number;
  confidenceLevel: 'High' | 'Medium' | 'Low';
  location: PestLocation;
  locationNormalized?: PestLocation; // Optional since API might not provide it
  mask: MaskPoint[];
  maskNormalized?: MaskPoint[] | null; // Optional
}

interface ImageInfo {
  width: number;
  height: number;
}

interface PestDetectionResult {
  hasPest: boolean;
  totalDetections: number;
  detectedPests: DetectedPest[];
  imageInfo: ImageInfo;
}

// Legacy support
interface DetectionResult extends PestDetectionResult {}

const pestInfo: { [key: string]: { severity: string; color: string; treatment: string } } = {
  'Dao on': {
    severity: 'High',
    color: '#ef4444',
    treatment: 'Apply approved insecticide immediately. Remove affected plants to prevent spread.',
  },
  'Bacterial Blight': {
    severity: 'High',
    color: '#ef4444',
    treatment: 'Apply copper-based bactericide. Improve field drainage and remove infected leaves.',
  },
  'Brown Spot': {
    severity: 'Medium',
    color: '#f59e0b',
    treatment: 'Apply recommended fungicide. Ensure proper nutrition and field management.',
  },
  'Rice Blast': {
    severity: 'High',
    color: '#ef4444',
    treatment: 'Apply fungicide (Tricyclazole) immediately. Monitor field regularly.',
  },
  'Leaf Blight': {
    severity: 'Medium',
    color: '#f59e0b',
    treatment: 'Remove affected leaves, apply copper-based fungicide.',
  },
  'Healthy': {
    severity: 'None',
    color: '#10b981',
    treatment: 'No treatment needed. Continue regular monitoring.',
  },
};

export const DiseaseResultsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const windowDimensions = useWindowDimensions();
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [imageUri, setImageUri] = useState<string>('');
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const viewRef = useRef(null);

  // Responsive calculations
  const isSmallScreen = windowDimensions.width < BREAKPOINTS.small;
  const isMediumScreen = windowDimensions.width >= BREAKPOINTS.medium;
  const isLargeScreen = windowDimensions.width >= BREAKPOINTS.large;

  useEffect(() => {
    const imageUriParam = params.imageUri as string;
    const resultDataParam = params.resultData as string;
    
    if (imageUriParam && resultDataParam) {
      setIsLoading(true);
      setImageUri(imageUriParam);
      const parsedResult = JSON.parse(resultDataParam);
      setResult(parsedResult);

      // Get image dimensions only if not provided in API response
      if (!parsedResult.imageInfo?.width || !parsedResult.imageInfo?.height) {
        Image.getSize(
          imageUriParam,
          (width, height) => {
            setImageDimensions({ width, height });
            setIsLoading(false);
          },
          (error) => {
            console.error('Error getting image size:', error);
            // Set default dimensions if image size cannot be retrieved
            setImageDimensions({ width: 600, height: 450 });
            setIsLoading(false);
          }
        );
      } else {
        setIsLoading(false);
      }
    }
  }, [params.imageUri, params.resultData]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'High':
        return 'alert-circle';
      case 'Medium':
        return 'warning';
      default:
        return 'checkmark-circle';
    }
  };

  const formatDiseaseName = (name: string) => {
    // Handle new API format (e.g., "Dao on", "Rice Blast")
    if (name.includes(' ')) {
      return name; // Already formatted
    }
    // Handle legacy format (e.g., "rice_blast")
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleScanAgain = () => {
    router.back();
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleSaveReport = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh để lưu ảnh.');
        return;
      }

      if (viewRef.current) {
        const uri = await captureRef(viewRef, {
          format: 'jpg',
          quality: 0.9,
          result: 'tmpfile',
        });
        
        await MediaLibrary.createAssetAsync(uri);
        Alert.alert('Thành công', 'Đã lưu ảnh (kèm kết quả) vào thư viện!', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Lỗi', 'Không thể lưu ảnh.');
    }
  };

  if (!result || !imageUri || isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang xử lý kết quả...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get detections array (support both old and new API formats)
  const detections = result.detectedPests || [];
  const imageWidth = result.imageInfo?.width || imageDimensions.width;
  const imageHeight = result.imageInfo?.height || imageDimensions.height;

  // Responsive image sizing
  const containerPadding = isLargeScreen ? spacing.xl * 2 : spacing.lg * 2;
  const imageAspectRatio = imageWidth && imageHeight ? imageWidth / imageHeight : 1;
  const displayWidth = Math.min(windowDimensions.width - containerPadding, 800); // Max width for large screens
  const displayHeight = displayWidth / imageAspectRatio;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={28} color="#1f2937" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isSmallScreen && styles.headerTitleSmall]}>
          Kết quả quét
        </Text>
        <TouchableOpacity 
          style={styles.shareButton} 
          onPress={handleSaveReport}
          activeOpacity={0.7}
        >
          <Ionicons name="save-outline" size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isMediumScreen && styles.scrollContentMedium,
          isLargeScreen && styles.scrollContentLarge,
        ]}
      >
        {/* Image with Pest Masks */}
        <View style={[styles.imageContainer, isMediumScreen && styles.imageContainerMedium]}>
          <View 
            ref={viewRef}
            collapsable={false}
            style={[styles.imageWrapper, { width: displayWidth, height: displayHeight }]}
          >
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="contain"
            />
            
            {/* Draw polygon masks */}
            <Svg
              width={displayWidth}
              height={displayHeight}
              style={styles.svgOverlay}
            >
              {detections.map((pest) => {
                const info = pestInfo[pest.pestName] || pestInfo['Dao on'];
                
                // Draw masks if available
                if (pest.mask && pest.mask.length > 0) {
                  return (
                    <G key={`mask-${pest.id}`}>
                      {pest.mask.map((maskSegment, segmentIndex) => {
                        // Scale mask points from image coordinates to display coordinates
                        const scaleX = displayWidth / imageWidth;
                        const scaleY = displayHeight / imageHeight;
                        
                        const points = maskSegment.points
                          .map(([x, y]) => `${x * scaleX},${y * scaleY}`)
                          .join(' ');
                        
                        return (
                          <Polygon
                            key={`${pest.id}-${segmentIndex}`}
                            points={points}
                            fill={`${info.color}40`}
                            stroke={info.color}
                            strokeWidth="2"
                          />
                        );
                      })}
                    </G>
                  );
                }
                
                return null;
              })}
            </Svg>
            
            {/* Draw labels */}
            {detections.map((pest) => {
              // Scale location coordinates from image to display coordinates
              const scaleX = displayWidth / imageWidth;
              const scaleY = displayHeight / imageHeight;
              
              const left = pest.location.x1 * scaleX;
              const top = pest.location.y1 * scaleY;
              
              const info = pestInfo[pest.pestName] || pestInfo['Dao on'];

              return (
                <View
                  key={`label-${pest.id}`}
                  style={[
                    styles.labelContainer,
                    {
                      left,
                      top: Math.max(0, top - 28),
                    },
                  ]}
                >
                  <View style={[styles.label, { backgroundColor: info.color }]}>
                    <Text style={[styles.labelText, isSmallScreen && styles.labelTextSmall]}>
                      {formatDiseaseName(pest.pestName)} {Math.round(pest.confidence)}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Summary Card */}
        <View style={[styles.summaryCard, isMediumScreen && styles.cardMedium]}>
          <View style={styles.summaryHeader}>
            <Text style={[styles.summaryTitle, isSmallScreen && styles.summaryTitleSmall]}>
              Tóm tắt phát hiện
            </Text>
          </View>

          {detections.length === 0 ? (
            <View style={styles.healthyCard}>
              <Ionicons name="checkmark-circle" size={isSmallScreen ? 40 : 48} color="#10b981" />
              <Text style={[styles.healthyTitle, isSmallScreen && styles.healthyTitleSmall]}>
                Cây khỏe mạnh!
              </Text>
              <Text style={styles.healthyText}>Không có sâu bệnh phát hiện</Text>
            </View>
          ) : (
            <>
              <View style={styles.detectionCountBanner}>
                <Ionicons name="bug" size={24} color="#ef4444" />
                <Text style={styles.detectionCountBannerText}>
                  {detections.length} {detections.length === 1 ? 'Sâu bệnh' : 'Sâu bệnh'} phát hiện
                </Text>
              </View>
              
              <View style={styles.summaryStats}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{detections.length}</Text>
                  <Text style={styles.statLabel}>Tổng sâu bệnh</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>
                    {Math.round(detections.reduce((sum, p) => sum + p.confidence, 0) / detections.length)}%
                  </Text>
                  <Text style={styles.statLabel}>Độ tin cậy trung bình</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, styles.statNumberDanger]}>
                    {detections.filter(p => p.confidenceLevel === 'High').length}
                  </Text>
                  <Text style={styles.statLabel}>Rủi ro cao</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Detection Details */}
        {detections.map((pest, index) => {
          const info = pestInfo[pest.pestName] || pestInfo['Dao on'];
          
          return (
            <View 
              key={pest.id} 
              style={[
                styles.detectionCard, 
                isMediumScreen && styles.cardMedium
              ]}
            >
              <View style={styles.detectionHeader}>
                <View style={styles.detectionTitleRow}>
                  <View style={[styles.iconCircle, { backgroundColor: `${info.color}20` }]}>
                    <Ionicons
                      name={getSeverityIcon(info.severity) as any}
                      size={isSmallScreen ? 20 : 24}
                      color={info.color}
                    />
                  </View>
                  <View style={styles.detectionTitleContainer}>
                    <Text style={[
                      styles.detectionTitle, 
                      isSmallScreen && styles.detectionTitleSmall
                    ]}>
                      {formatDiseaseName(pest.pestName)}
                    </Text>
                    <Text style={styles.detectionSubtitle}>Detection #{index + 1}</Text>
                  </View>
                </View>
                <View style={[styles.severityBadge, { backgroundColor: `${info.color}15` }]}>
                  <Text style={[styles.severityText, { color: info.color }]}>
                    {info.severity}
                  </Text>
                </View>
              </View>

              <View style={styles.detectionStats}>
                <View style={styles.statItem}>
                  <View style={styles.statHeader}>
                    <Text style={styles.statLabel}>Độ tin cậy</Text>
                    <Text style={[styles.confidenceBadge, { color: info.color }]}>
                      {pest.confidenceLevel}
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${pest.confidence}%`,
                          backgroundColor: info.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.statValue}>
                    {Math.round(pest.confidence)}%
                  </Text>
                </View>
              </View>

              <View style={styles.treatmentSection}>
                <View style={styles.treatmentHeader}>
                  <MaterialCommunityIcons name="medical-bag" size={20} color="#10b981" />
                  <Text style={styles.treatmentTitle}>Phương pháp điều trị</Text>
                </View>
                <Text style={[styles.treatmentText, isSmallScreen && styles.treatmentTextSmall]}>
                  {info.treatment}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Action Buttons */}
        <View style={[
          styles.actionButtons, 
          isMediumScreen && styles.actionButtonsMedium
        ]}>
          <TouchableOpacity
            style={[styles.secondaryButton, isMediumScreen && styles.buttonMedium]}
            onPress={handleScanAgain}
            activeOpacity={0.7}
          >
            <Ionicons name="scan" size={20} color="#10b981" />
            <Text style={styles.secondaryButtonText}>Quét lại</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, isMediumScreen && styles.buttonMedium]}
            onPress={handleSaveReport}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <Ionicons name="download-outline" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Lưu ảnh</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: isSmallScreen ? spacing.lg : spacing.xl * 2 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: 0.3,
  },
  headerTitleSmall: {
    fontSize: 16,
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  scrollContentMedium: {
    alignItems: 'center',
  },
  scrollContentLarge: {
    paddingHorizontal: spacing.xl * 2,
  },
  imageContainer: {
    padding: spacing.lg,
    backgroundColor: '#FFFFFF',
    marginBottom: spacing.md,
  },
  imageContainerMedium: {
    borderRadius: 16,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  imageWrapper: {
    position: 'relative',
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  svgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  labelContainer: {
    position: 'absolute',
  },
  boundingBox: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 6,
  },
  label: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  labelTextSmall: {
    fontSize: 10,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardMedium: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  summaryHeader: {
    marginBottom: spacing.md,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: 0.3,
  },
  summaryTitleSmall: {
    fontSize: 18,
  },
  detectionCountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#fef2f2',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  detectionCountBannerText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ef4444',
    letterSpacing: 0.3,
  },
  detectionCount: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  detectionCountGreen: {
    backgroundColor: '#dcfce7',
  },
  detectionCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ef4444',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#10b981',
    marginBottom: 4,
  },
  statNumberDanger: {
    color: '#ef4444',
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#e5e7eb',
  },
  healthyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  healthyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#10b981',
    marginTop: spacing.md,
    letterSpacing: 0.3,
  },
  healthyTitleSmall: {
    fontSize: 20,
  },
  healthyText: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: spacing.sm,
  },
  detectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  detectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  detectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detectionTitleContainer: {
    flex: 1,
  },
  detectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: 0.2,
  },
  detectionTitleSmall: {
    fontSize: 16,
  },
  detectionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
    fontWeight: '500',
  },
  severityBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  detectionStats: {
    marginBottom: spacing.lg,
  },
  statItem: {
    marginBottom: spacing.sm,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceBadge: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
  },
  treatmentSection: {
    backgroundColor: '#f0fdf4',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  treatmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  treatmentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 0.2,
  },
  treatmentText: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 21,
  },
  treatmentTextSmall: {
    fontSize: 13,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  actionButtonsMedium: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing.md + 2,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 0.3,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonMedium: {
    flex: 1,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md + 2,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
