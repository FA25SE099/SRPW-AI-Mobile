/**
 * Material Receipts Screen
 * Displays pending material receipts for farmer confirmation
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, borderRadius } from '../../theme';
import { scale, moderateScale, getFontSize, getSpacing } from '../../utils/responsive';
import {
  Container,
  H3,
  Body,
  BodySmall,
  BodySemibold,
  Spacer,
} from '../../components/ui';
import { MaterialReceiptCard } from '../../components/farmer/MaterialReceiptCard';
import { ConfirmReceiptModal } from '../../components/farmer/ConfirmReceiptModal';
import { getPendingMaterialReceipts, confirmMaterialReceipt } from '../../libs/farmer';
import { PendingMaterialReceiptResponse } from '../../types/api';
import { useUser } from '../../libs/auth';

export const MaterialReceiptsScreen = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const [selectedReceipt, setSelectedReceipt] = useState<PendingMaterialReceiptResponse | null>(
    null
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);

  // Fetch pending receipts
  const {
    data: summary,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['pending-material-receipts', user?.id],
    queryFn: () => getPendingMaterialReceipts(user?.id || ''),
    enabled: !!user?.id, // Only run query when we have a user ID
    refetchInterval: 60000, // Refetch every minute
  });

  // Confirm receipt mutation
  const confirmMutation = useMutation({
    mutationFn: (data: { materialDistributionId: string; notes: string }) =>
      confirmMaterialReceipt({
        materialDistributionId: data.materialDistributionId,
        farmerId: user?.id || '',
        notes: data.notes || null,
      }),
    onSuccess: (response) => {
      if (response.succeeded) {
        Alert.alert('Thành công', 'Đã xác nhận nhận vật liệu!', [
          {
            text: 'OK',
            onPress: () => {
              setIsModalVisible(false);
              setSelectedReceipt(null);
              queryClient.invalidateQueries({ queryKey: ['pending-material-receipts'] });
            },
          },
        ]);
      } else {
        Alert.alert('Lỗi', response.errors?.join(', ') || 'Không thể xác nhận');
      }
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Không thể xác nhận nhận vật liệu';
      Alert.alert('Lỗi', errorMessage);
    },
  });

  const handleConfirmReceipt = (receipt: PendingMaterialReceiptResponse) => {
    setSelectedReceipt(receipt);
    setIsModalVisible(true);
  };

  const handleConfirmSubmit = (notes: string) => {
    if (selectedReceipt) {
      confirmMutation.mutate({
        materialDistributionId: selectedReceipt.materialDistributionId,
        notes,
      });
    }
  };

  const handleViewImage = (imageUrl: string) => {
    setImageViewerUrl(imageUrl);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Container padding="lg">
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={greenTheme.primary} />
            <Spacer size="md" />
            <Body color={colors.textSecondary}>Đang tải...</Body>
          </View>
        </Container>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Container padding="lg">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={greenTheme.primary} />
            </TouchableOpacity>
            <H3 style={styles.headerTitle}>Xác nhận vật liệu</H3>
            <View style={styles.headerRight} />
          </View>

          <Spacer size="xl" />

          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={colors.error} />
            <Spacer size="md" />
            <Body color={colors.error}>Không thể tải danh sách vật liệu</Body>
            <Spacer size="md" />
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <BodySemibold style={styles.retryButtonText}>Thử lại</BodySemibold>
            </TouchableOpacity>
          </View>
        </Container>
      </SafeAreaView>
    );
  }

  const pendingReceipts = summary?.pendingReceipts || [];

  if (pendingReceipts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Container padding="lg">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={greenTheme.primary} />
            </TouchableOpacity>
            <H3 style={styles.headerTitle}>Xác nhận vật liệu</H3>
            <View style={styles.headerRight} />
          </View>

          <Spacer size="xl" />

          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="checkmark-circle" size={64} color={greenTheme.success} />
            </View>
            <Spacer size="md" />
            <BodySemibold style={styles.emptyTitle}>Tất cả đã hoàn tất!</BodySemibold>
            <Spacer size="xs" />
            <Body color={colors.textSecondary} style={styles.emptyMessage}>
              Không có vật liệu nào cần xác nhận
            </Body>
          </View>
        </Container>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Container padding="lg">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={greenTheme.primary} />
          </TouchableOpacity>
          <H3 style={styles.headerTitle}>Xác nhận vật liệu</H3>
          <View style={styles.headerRight} />
        </View>

        <Spacer size="lg" />

        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardIcon}>
              <Ionicons name="cube" size={24} color={greenTheme.primary} />
            </View>
            <BodySemibold style={styles.summaryCardValue}>
              {summary?.totalPending || 0}
            </BodySemibold>
            <BodySmall color={colors.textSecondary}>Chờ xác nhận</BodySmall>
          </View>

          {(summary?.totalOverdue || 0) > 0 && (
            <View style={[styles.summaryCard, styles.summaryCardOverdue]}>
              <View style={styles.summaryCardIcon}>
                <Ionicons name="warning" size={24} color={colors.error} />
              </View>
              <BodySemibold style={[styles.summaryCardValue, { color: colors.error }]}>
                {summary?.totalOverdue || 0}
              </BodySemibold>
              <BodySmall color={colors.error}>Quá hạn</BodySmall>
            </View>
          )}

          {(summary?.totalUrgent || 0) > 0 && (
            <View style={[styles.summaryCard, styles.summaryCardUrgent]}>
              <View style={styles.summaryCardIcon}>
                <Ionicons name="time" size={24} color={colors.warning} />
              </View>
              <BodySemibold style={[styles.summaryCardValue, { color: colors.warning }]}>
                {summary?.totalUrgent || 0}
              </BodySemibold>
              <BodySmall color={colors.warning}>Khẩn cấp</BodySmall>
            </View>
          )}
        </View>

        <Spacer size="lg" />

        {/* Receipts List */}
        <ScrollView showsVerticalScrollIndicator={false}>
          <BodySemibold style={styles.listTitle}>
            {pendingReceipts.length} vật liệu cần xác nhận
          </BodySemibold>
          <Spacer size="md" />

          {pendingReceipts.map((receipt) => (
            <MaterialReceiptCard
              key={receipt.id}
              receipt={receipt}
              onConfirm={() => handleConfirmReceipt(receipt)}
              onViewImage={handleViewImage}
            />
          ))}

          <Spacer size="xl" />
        </ScrollView>
      </Container>

      {/* Confirm Modal */}
      <ConfirmReceiptModal
        visible={isModalVisible}
        receipt={selectedReceipt}
        onClose={() => {
          setIsModalVisible(false);
          setSelectedReceipt(null);
        }}
        onConfirm={handleConfirmSubmit}
        isConfirming={confirmMutation.isPending}
      />

      {/* Image Viewer Modal */}
      <Modal
        visible={imageViewerUrl !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageViewerUrl(null)}
      >
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity
            style={styles.imageViewerClose}
            onPress={() => setImageViewerUrl(null)}
          >
            <Ionicons name="close" size={32} color={colors.white} />
          </TouchableOpacity>
          {imageViewerUrl && (
            <Image source={{ uri: imageViewerUrl }} style={styles.imageViewerImage} />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const greenTheme = {
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  primaryLighter: '#E8F5E9',
  accent: '#66BB6A',
  success: '#10B981',
  background: '#F1F8F4',
  cardBackground: '#FFFFFF',
  border: '#C8E6C9',
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
  summaryCards: {
    flexDirection: 'row',
    gap: getSpacing(spacing.md),
  },
  summaryCard: {
    flex: 1,
    backgroundColor: greenTheme.cardBackground,
    borderRadius: moderateScale(borderRadius.lg),
    padding: getSpacing(spacing.md),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: greenTheme.border,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryCardOverdue: {
    borderColor: colors.error + '40',
    backgroundColor: colors.errorLight,
  },
  summaryCardUrgent: {
    borderColor: colors.warning + '40',
    backgroundColor: colors.warningLight,
  },
  summaryCardIcon: {
    width: scale(48),
    height: scale(48),
    borderRadius: moderateScale(borderRadius.full),
    backgroundColor: greenTheme.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: getSpacing(spacing.xs),
  },
  summaryCardValue: {
    fontSize: getFontSize(24),
    fontWeight: '700',
    color: greenTheme.primary,
  },
  listTitle: {
    fontSize: getFontSize(16),
    color: greenTheme.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getSpacing(spacing['4xl']),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getSpacing(spacing['4xl']),
  },
  retryButton: {
    backgroundColor: greenTheme.primary,
    borderRadius: moderateScale(borderRadius.lg),
    paddingVertical: getSpacing(spacing.md),
    paddingHorizontal: getSpacing(spacing.xl),
  },
  retryButtonText: {
    color: colors.white,
    fontSize: getFontSize(16),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getSpacing(spacing['4xl']),
  },
  emptyIcon: {
    width: scale(120),
    height: scale(120),
    borderRadius: moderateScale(borderRadius.full),
    backgroundColor: greenTheme.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: getFontSize(20),
    color: greenTheme.primary,
  },
  emptyMessage: {
    textAlign: 'center',
    fontSize: getFontSize(16),
  },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: getSpacing(spacing['2xl']),
    right: getSpacing(spacing.lg),
    zIndex: 10,
    width: scale(48),
    height: scale(48),
    borderRadius: moderateScale(borderRadius.full),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerImage: {
    width: '90%',
    height: '70%',
    resizeMode: 'contain',
  },
});

