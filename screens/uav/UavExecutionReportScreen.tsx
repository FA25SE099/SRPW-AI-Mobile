/**
 * UAV Execution Report Screen
 * Submit completion details and proof for a specific plot assignment
 */

import React, { useEffect, useMemo, useState } from 'react';
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
import { useMutation, useQuery } from '@tanstack/react-query';
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
import { getUavOrderDetail, reportUavOrderCompletion } from '../../libs/uav';
import { useUser } from '../../libs/auth';

type ProofImage = {
  uri: string;
  type: string;
  name: string;
};

export const UavExecutionReportScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    orderId?: string | string[];
    plotId?: string | string[];
    plotName?: string | string[];
    servicedArea?: string | string[];
  }>();

  const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;
  const plotId = Array.isArray(params.plotId) ? params.plotId[0] : params.plotId;
  const plotNameParam = Array.isArray(params.plotName) ? params.plotName[0] : params.plotName;
  const servicedAreaParam = Array.isArray(params.servicedArea)
    ? params.servicedArea[0]
    : params.servicedArea;

  const { data: user } = useUser();

  const [formState, setFormState] = useState({
    actualCost: '',
    actualArea: servicedAreaParam || '',
    notes: '',
  });
  const [proofImages, setProofImages] = useState<ProofImage[]>([]);

  const missingIdentifiers = !orderId || !plotId;

  const {
    data: order,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['uav-order-detail', orderId],
    queryFn: () => getUavOrderDetail(orderId || ''),
    enabled: Boolean(orderId),
  });

  const assignment = useMemo(
    () => order?.plotAssignments.find((plot) => plot.plotId === plotId),
    [order, plotId],
  );

  useEffect(() => {
    if (!formState.actualArea && assignment?.servicedArea) {
      setFormState((prev) => ({
        ...prev,
        actualArea: assignment.servicedArea.toString(),
      }));
    }
  }, [assignment]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant gallery access to upload proofs.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets) {
      const next = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `proof_${Date.now()}.jpg`,
      }));
      setProofImages((prev) => [...prev, ...next]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to capture proofs.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setProofImages((prev) => [
        ...prev,
        {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `proof_${Date.now()}.jpg`,
        },
      ]);
    }
  };

  const removeImage = (index: number) => {
    setProofImages((prev) => prev.filter((_, i) => i !== index));
  };

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!orderId || !plotId) {
        throw new Error('Missing order or plot information.');
      }
      const actualCostValue = Number(formState.actualCost);
      if (Number.isNaN(actualCostValue) || actualCostValue < 0) {
        throw new Error('Actual cost must be greater than zero.');
      }
      const actualAreaValue = Number(formState.actualArea || '0');
      if (Number.isNaN(actualAreaValue) || actualAreaValue <= 0) {
        throw new Error('Actual area must be greater than zero.');
      }

      return reportUavOrderCompletion({
        request: {
          orderId,
          plotId,
          vendorId: user?.id,
          actualCost: actualCostValue,
          actualAreaCovered: actualAreaValue,
          notes: formState.notes || undefined,
        },
        proofFiles: proofImages,
      });
    },
    onSuccess: () => {
      Alert.alert('Success', 'Report submitted successfully.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'Failed to submit report.');
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Container padding="lg">
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Body>←</Body>
          </TouchableOpacity>
          <Spacer size="lg" />
          <Body>Đang tải nhiệm vụ...</Body>
        </Container>
      </SafeAreaView>
    );
  }

  if (missingIdentifiers || isError || !order || !assignment) {
    return (
      <SafeAreaView style={styles.container}>
        <Container padding="lg">
          <Card variant="elevated" style={styles.card}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Body>←</Body>
            </TouchableOpacity>
            <Spacer size="md" />
            <BodySemibold>Không thể tải dữ liệu báo cáo</BodySemibold>
            <Spacer size="sm" />
            <BodySmall color={colors.textSecondary}>
              Vui lòng kiểm tra kết nối hoặc thử lại sau.
            </BodySmall>
            <Spacer size="md" />
            <Button size="sm" variant="outline" onPress={() => refetch()}>
              Thử lại
            </Button>
          </Card>
        </Container>
      </SafeAreaView>
    );
  }

  const resolvedPlotName = plotNameParam || assignment.plotName;
  const resolvedArea = assignment.servicedArea || Number(servicedAreaParam || 0);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Container padding="lg">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Body>←</Body>
            </TouchableOpacity>
            <H3 style={styles.headerTitle}>Báo cáo thực hiện</H3>
            <View style={styles.headerRight} />
          </View>

          <Spacer size="lg" />

          <ScrollView showsVerticalScrollIndicator={false}>
            <Card variant="elevated" style={styles.card}>
              <BodySemibold style={styles.orderNumber}>{order.orderName}</BodySemibold>
              <BodySmall color={colors.textSecondary}>{order.groupName}</BodySmall>
              <Spacer size="sm" />
              <BodySmall color={colors.textSecondary}>
                Lịch: {dayjs(order.scheduledDate).format('MMM D, YYYY')}
                {order.scheduledTime ? ` • ${order.scheduledTime}` : ''}
              </BodySmall>
            </Card>

            <Spacer size="md" />

            <Card variant="elevated" style={styles.card}>
              <BodySemibold>{resolvedPlotName}</BodySemibold>
              <BodySmall color={colors.textSecondary}>
                Diện tích dự kiến: {resolvedArea.toFixed(2)} ha
              </BodySmall>
              <BodySmall color={colors.textSecondary}>
                Trạng thái: {assignment.status.replace(/([A-Z])/g, ' $1').trim()}
              </BodySmall>
            </Card>

            <Spacer size="md" />

            <Card variant="elevated" style={styles.card}>
              <H3 style={styles.sectionTitle}>Chi tiết báo cáo</H3>
              <Spacer size="md" />
              <BodySmall color={colors.textSecondary}>
                Chi phí thực tế (₫) <BodySmall color={colors.error}>*</BodySmall>
              </BodySmall>
              <Spacer size="xs" />
              <Input
                value={formState.actualCost}
                onChangeText={(text) => setFormState((prev) => ({ ...prev, actualCost: text }))}
                keyboardType="decimal-pad"
                placeholder="Nhập chi phí dịch vụ thực tế"
              />
              <Spacer size="md" />
              <BodySmall color={colors.textSecondary}>
                Diện tích thực tế đã phủ (ha) <BodySmall color={colors.error}>*</BodySmall>
              </BodySmall>
              <Spacer size="xs" />
              <Input
                value={formState.actualArea}
                onChangeText={(text) => setFormState((prev) => ({ ...prev, actualArea: text }))}
                keyboardType="decimal-pad"
                placeholder="Nhập diện tích thực tế đã phủ"
              />
              <Spacer size="md" />
              <BodySmall color={colors.textSecondary}>Ghi chú</BodySmall>
              <Spacer size="xs" />
              <Input
                value={formState.notes}
                onChangeText={(text) => setFormState((prev) => ({ ...prev, notes: text }))}
                placeholder="Thêm bất kỳ quan sát nào..."
                multiline
                numberOfLines={4}
              />
            </Card>

            <Spacer size="md" />

            <Card variant="elevated" style={styles.card}>
              <H3 style={styles.sectionTitle}>Ảnh chứng minh</H3>
              <Spacer size="md" />
              <View style={styles.mediaButtons}>
                <Button variant="outline" size="sm" onPress={takePhoto} style={styles.mediaButton}>
                  Máy ảnh
                </Button>
                <Button variant="outline" size="sm" onPress={pickImage} style={styles.mediaButton}>
                  Thư viện
                </Button>
              </View>
              {proofImages.length > 0 && (
                <>
                  <Spacer size="md" />
                  <View style={styles.mediaGrid}>
                    {proofImages.map((image, index) => (
                      <View key={image.uri} style={styles.mediaItem}>
                        <Image source={{ uri: image.uri }} style={styles.mediaPreview} />
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => removeImage(index)}
                        >
                          <Body style={{ color: colors.white }}>×</Body>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </Card>

            <Spacer size="xl" />

            <Button
              onPress={() => reportMutation.mutate()}
              disabled={reportMutation.isPending}
              style={styles.submitButton}
            >
              {reportMutation.isPending ? 'Đang gửi báo cáo...' : 'Gửi báo cáo'}
            </Button>

            <Spacer size="xl" />
          </ScrollView>
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
    paddingTop: spacing.md,
    backgroundColor: greenTheme.cardBackground,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: greenTheme.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: greenTheme.primaryLighter,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: greenTheme.primary,
    fontWeight: '700',
  },
  headerRight: {
    width: 40,
  },
  card: {
    padding: spacing.md,
    backgroundColor: greenTheme.cardBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: greenTheme.border,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  orderNumber: {
    paddingTop: 5,
    paddingBottom: 3,
    fontSize: 18,
    color: greenTheme.primary,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    color: greenTheme.primary,
    fontWeight: '700',
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mediaButton: {
    flex: 1,
    borderColor: greenTheme.primary,
    backgroundColor: greenTheme.primaryLighter,
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
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: greenTheme.border,
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
    backgroundColor: greenTheme.primaryLighter,
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
    borderWidth: 2,
    borderColor: greenTheme.cardBackground,
  },
  submitButton: {
    marginTop: spacing.md,
    backgroundColor: greenTheme.primary,
  },
});

