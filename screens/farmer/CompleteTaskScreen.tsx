/**
 * Complete Task Screen
 * Form to submit farm log when completing a task
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, borderRadius } from '../../theme';
import { scale, moderateScale, getFontSize, getSpacing, verticalScale } from '../../utils/responsive';
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
import { createFarmLog, getCultivationTaskDetail } from '../../libs/farmer';
import { useUser } from '../../libs/auth';
import { useQuery } from '@tanstack/react-query';

export const CompleteTaskScreen = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    taskId: string;
    plotCultivationId: string;
    taskName: string;
    plotSoThuaSoTo: string;
    materials?: string; // JSON string of materials array
    plotArea?: string; // Plot area in hectares
  }>();
  const { data: user } = useUser();

  // Get plot area from params or fetch from task detail
  const plotAreaFromParams = params.plotArea ? parseFloat(params.plotArea) : null;
  
  const { data: taskDetail } = useQuery({
    queryKey: ['cultivation-task-detail', params.taskId],
    queryFn: () => getCultivationTaskDetail(params.taskId || ''),
    enabled: !plotAreaFromParams && !!params.taskId,
  });

  const plotArea = plotAreaFromParams ?? taskDetail?.plotArea ?? null;

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
  const [areaError, setAreaError] = useState<string | null>(null);

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

      // Build request body
      const request: CreateFarmLogRequest = {
        cultivationTaskId: formData.cultivationTaskId,
        plotCultivationId: formData.plotCultivationId,
        workDescription: formData.workDescription || null,
        actualAreaCovered: formData.actualAreaCovered,
        serviceCost: formData.serviceCost,
        serviceNotes: formData.serviceNotes || null,
        weatherConditions: formData.weatherConditions || null,
        interruptionReason: formData.interruptionReason || null,
        materials: materials.length > 0 ? materials : undefined,
        farmerId: user?.id || null,
      };

      // Normalize images similar to CreateReportScreen so each has a valid content-type
      const normalizedImages = images.map((img, index) => {
        const uri = img.uri;
        const fileName = img.name || uri.split('/').pop() || `proof_${index}.jpg`;
        const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';

        let type: string;
        if (ext === 'png') {
          type = 'image/png';
        } else {
          // Treat jpg / jpeg / others as jpeg
          type = 'image/jpeg';
        }

        return {
          uri,
          type,
          name: fileName,
        };
      });

      console.log('📤 [createFarmLog] Using shared API on', Platform.OS);
      return createFarmLog(request, normalizedImages);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-tasks'] });
      Alert.alert('Thành công', 'Đã gửi nhật ký nông trại và đánh dấu công việc đã hoàn thành.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error: any) => {
      console.error('❌ [createFarmLog] Error:', {
        message: error?.message,
        status: error?.response?.status || error?.status,
        statusText: error?.response?.statusText || error?.statusText,
        data: error?.response?.data,
        url: error?.config?.url || error?.responseURL,
        method: error?.config?.method || 'POST',
        platform: Platform.OS,
      });
      
      let errorMessage = 'Không thể gửi nhật ký nông trại';
      const status = error?.response?.status || error?.status;
      
      if (status === 405) {
        errorMessage = 'Lỗi 405: Phương thức HTTP không được phép. Vui lòng kiểm tra endpoint API.';
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Lỗi', `Status: ${status || 'Unknown'}\n${errorMessage}`);
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
          text: 'Hủy',
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
      Alert.alert('Lỗi', 'Thiếu thông tin công việc bắt buộc');
      return;
    }

    // Validate area before submitting
    if (
      formData.actualAreaCovered !== null &&
      formData.actualAreaCovered !== undefined &&
      plotArea !== null &&
      formData.actualAreaCovered > plotArea
    ) {
      Alert.alert('Lỗi', `Diện tích thực tế không được vượt quá diện tích thửa đất (${plotArea.toFixed(2)} ha)`);
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
        <Container scrollable padding="lg">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Body>←</Body>
            </TouchableOpacity>
            <H3 style={styles.headerTitle}>Hoàn thành công việc</H3>
            <View style={styles.headerRight} />
          </View>

          <Spacer size="lg" />

          {/* Task Info */}
          <Card variant="elevated" style={styles.infoCard}>
            <BodySemibold style={styles.taskName}>{params.taskName}</BodySemibold>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="location-outline" size={16} color={greenTheme.primary} />
              <BodySmall color={greenTheme.primary} style={{ fontWeight: '600' }}>{params.plotSoThuaSoTo}</BodySmall>
            </View>
          </Card>

          <Spacer size="lg" />

          {/* Work Description */}
          <Input
            label="Mô tả công việc"
            placeholder="Mô tả công việc đã hoàn thành..."
            value={formData.workDescription || ''}
            onChangeText={(text) => setFormData({ ...formData, workDescription: text })}
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />

          {/* Actual Area Covered */}
          <View>
            <Input
              label="Diện tích thực tế (ha)"
              placeholder="0.00"
              value={formData.actualAreaCovered?.toString() || ''}
              onChangeText={(text) => {
                const num = parseFloat(text);
                const actualArea = isNaN(num) ? null : num;
                
                // Validate against plot area
                if (actualArea !== null && plotArea !== null && actualArea > plotArea) {
                  setAreaError(`Diện tích thực tế không được vượt quá diện tích thửa đất (${plotArea.toFixed(2)} ha)`);
                } else {
                  setAreaError(null);
                }
                
                setFormData({
                  ...formData,
                  actualAreaCovered: actualArea,
                });
              }}
              keyboardType="decimal-pad"
              style={areaError ? { borderColor: colors.error } : undefined}
            />
            {areaError && (
              <BodySmall color={colors.error} style={styles.errorText}>
                {areaError}
              </BodySmall>
            )}
            {plotArea !== null && !areaError && (
              <BodySmall color={colors.textSecondary} style={styles.hintText}>
                Diện tích thửa đất: {plotArea.toFixed(2)} ha
              </BodySmall>
            )}
          </View>

          {/* Service Cost */}
          {/* <Input
            label="Chi phí dịch vụ (₫)"
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
          /> */}

          {/* Service Notes */}
          {/* <Input
            label="Ghi chú dịch vụ"
            placeholder="Ghi chú thêm về dịch vụ..."
            value={formData.serviceNotes || ''}
            onChangeText={(text) => setFormData({ ...formData, serviceNotes: text })}
            multiline
            numberOfLines={3}
            style={styles.textArea}
          /> */}

          {/* Weather Conditions */}
          <Input
            label="Điều kiện thời tiết"
            placeholder="Ví dụ: Nắng, Mưa, Nhiều mây..."
            value={formData.weatherConditions || ''}
            onChangeText={(text) => setFormData({ ...formData, weatherConditions: text })}
          />

          {/* Interruption Reason */}
          <Input
            label="Lý do gián đoạn (nếu có)"
            placeholder="Lý do gián đoạn..."
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
              <BodySemibold style={styles.sectionTitle}>Vật liệu đã sử dụng</BodySemibold>
              <Spacer size="sm" />
              {formData.materials.map((material: any) => (
                <Card key={material.materialId} variant="elevated" style={styles.materialCard}>
                  <BodySemibold>{material.materialName}</BodySemibold>
                  <BodySmall color={colors.textSecondary}>
                    Đơn vị: {material.materialUnit}
                  </BodySmall>
                  <BodySmall color={colors.textSecondary}>
                    Dự kiến: {material.plannedQuantityTotal.toLocaleString()}
                  </BodySmall>
                  <Spacer size="sm" />
                  <Input
                    label="Số lượng thực tế đã dùng"
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
                    label="Ghi chú (tùy chọn)"
                    placeholder="Ghi chú về vật liệu này..."
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
          <BodySemibold style={styles.sectionTitle}>Ảnh minh chứng</BodySemibold>
          <Spacer size="sm" />
          <View style={styles.imageButtonRow}>
            <Button
              variant="outline"
              size="sm"
              onPress={showImagePickerOptions}
              style={styles.addImageButton}
            >
              <Ionicons name="camera-outline" size={18} color={greenTheme.primary} style={{ marginRight: 4 }} />
              Thêm ảnh
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
            style={{ backgroundColor: greenTheme.primary }}
          >
            {createFarmLogMutation.isPending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              'Gửi nhật ký nông trại'
            )}
          </Button>

          <Spacer size="xl" />
        </Container>
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
  keyboardView: {
    flex: 1,
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
  infoCard: {
    padding: getSpacing(spacing.md),
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
  taskName: {
    fontSize: getFontSize(16),
    marginBottom: getSpacing(spacing.xs),
    color: greenTheme.primary,
    fontWeight: '700',
  },
  textArea: {
    minHeight: verticalScale(80),
    textAlignVertical: 'top',
    backgroundColor: greenTheme.cardBackground,
    borderRadius: moderateScale(borderRadius.md),
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  sectionTitle: {
    fontSize: getFontSize(16),
    marginBottom: getSpacing(spacing.xs),
    color: greenTheme.primary,
    fontWeight: '700',
  },
  materialCard: {
    padding: getSpacing(spacing.md),
    marginBottom: getSpacing(spacing.md),
    backgroundColor: greenTheme.primaryLighter,
    borderRadius: moderateScale(borderRadius.lg),
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  imageButtonRow: {
    flexDirection: 'row',
    gap: getSpacing(spacing.sm),
  },
  addImageButton: {
    alignSelf: 'flex-start',
    borderColor: greenTheme.primary,
    backgroundColor: greenTheme.primaryLighter,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getSpacing(spacing.sm),
  },
  imageContainer: {
    position: 'relative',
    width: scale(100),
    height: scale(100),
    marginRight: getSpacing(spacing.sm),
    marginBottom: getSpacing(spacing.sm),
    borderRadius: moderateScale(borderRadius.md),
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: greenTheme.border,
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
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: greenTheme.cardBackground,
  },
  errorText: {
    marginTop: getSpacing(spacing.xs),
    fontSize: getFontSize(12),
  },
  hintText: {
    marginTop: getSpacing(spacing.xs),
    fontSize: getFontSize(12),
  },
});
