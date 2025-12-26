/**
 * Confirm Material Receipt Modal
 * Modal for farmers to confirm receipt of materials
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { colors, spacing, borderRadius } from '../../theme';
import { scale, moderateScale, getFontSize, getSpacing } from '../../utils/responsive';
import {
  H3,
  Body,
  BodySmall,
  BodySemibold,
  Spacer,
} from '../ui';
import { PendingMaterialReceiptResponse } from '../../types/api';

type ConfirmReceiptModalProps = {
  visible: boolean;
  receipt: PendingMaterialReceiptResponse | null;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  isConfirming: boolean;
};

export const ConfirmReceiptModal: React.FC<ConfirmReceiptModalProps> = ({
  visible,
  receipt,
  onClose,
  onConfirm,
  isConfirming,
}) => {
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    onConfirm(notes);
  };

  const handleClose = () => {
    if (!isConfirming) {
      setNotes('');
      onClose();
    }
  };

  if (!receipt) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <H3 style={styles.modalTitle}>Xác nhận nhận vật liệu</H3>
              <TouchableOpacity
                onPress={handleClose}
                disabled={isConfirming}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Spacer size="lg" />

            {/* Material Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons name="cube" size={40} color={greenTheme.primary} />
              </View>
              <Spacer size="sm" />
              <BodySemibold style={styles.summaryTitle}>{receipt.materialName}</BodySemibold>
              <Body style={styles.summaryQuantity}>
                {receipt.quantity} {receipt.unit}
              </Body>
              <Spacer size="xs" />
              <BodySmall color={colors.textSecondary} style={styles.summaryPlot}>
                Cho: {receipt.plotSoThuaSoTo}
              </BodySmall>
            </View>

            <Spacer size="lg" />

            {/* Confirmation Checklist */}
            <View style={styles.checklistSection}>
              <BodySemibold style={styles.checklistTitle}>Vui lòng xác nhận:</BodySemibold>
              <Spacer size="sm" />
              
              <View style={styles.checklistItem}>
                <View style={styles.checkIcon}>
                  <Ionicons name="checkmark" size={16} color={greenTheme.primary} />
                </View>
                <BodySmall style={styles.checkText}>
                  Tôi đã nhận được vật liệu như trên
                </BodySmall>
              </View>

              <View style={styles.checklistItem}>
                <View style={styles.checkIcon}>
                  <Ionicons name="checkmark" size={16} color={greenTheme.primary} />
                </View>
                <BodySmall style={styles.checkText}>
                  Số lượng khớp với số đã giao
                </BodySmall>
              </View>

              <View style={styles.checklistItem}>
                <View style={styles.checkIcon}>
                  <Ionicons name="checkmark" size={16} color={greenTheme.primary} />
                </View>
                <BodySmall style={styles.checkText}>
                  Vật liệu trong tình trạng tốt
                </BodySmall>
              </View>
            </View>

            <Spacer size="lg" />

            {/* Notes Input */}
            <View style={styles.notesSection}>
              <BodySemibold style={styles.notesLabel}>
                Ghi chú bổ sung (Không bắt buộc)
              </BodySemibold>
              <Spacer size="xs" />
              <TextInput
                style={styles.notesInput}
                multiline
                numberOfLines={4}
                placeholder="Bất kỳ nhận xét nào về vật liệu đã nhận..."
                placeholderTextColor={colors.textTertiary}
                value={notes}
                onChangeText={setNotes}
                maxLength={500}
                editable={!isConfirming}
                textAlignVertical="top"
              />
              <BodySmall color={colors.textSecondary} style={styles.charCount}>
                {notes.length}/500
              </BodySmall>
            </View>

            <Spacer size="xl" />

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={isConfirming}
              >
                <BodySemibold style={styles.cancelButtonText}>Hủy</BodySemibold>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, isConfirming && styles.confirmButtonDisabled]}
                onPress={handleConfirm}
                disabled={isConfirming}
              >
                {isConfirming ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                    <BodySemibold style={styles.confirmButtonText}>
                      Xác nhận nhận hàng
                    </BodySemibold>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingHorizontal: getSpacing(spacing.lg),
    paddingTop: getSpacing(spacing.lg),
    paddingBottom: getSpacing(spacing['2xl']),
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    flex: 1,
    fontSize: getFontSize(20),
    color: greenTheme.primary,
    fontWeight: '700',
  },
  closeButton: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(borderRadius.full),
    backgroundColor: colors.backgroundSecondary,
  },
  summaryCard: {
    backgroundColor: greenTheme.primaryLighter,
    borderRadius: moderateScale(borderRadius.lg),
    padding: getSpacing(spacing.lg),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: greenTheme.border,
  },
  summaryIcon: {
    width: scale(72),
    height: scale(72),
    borderRadius: moderateScale(borderRadius.full),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: getFontSize(20),
    fontWeight: '700',
    color: greenTheme.primary,
    textAlign: 'center',
  },
  summaryQuantity: {
    fontSize: getFontSize(18),
    color: colors.textSecondary,
    marginTop: getSpacing(4),
  },
  summaryPlot: {
    fontSize: getFontSize(14),
    textAlign: 'center',
  },
  checklistSection: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: moderateScale(borderRadius.lg),
    padding: getSpacing(spacing.md),
  },
  checklistTitle: {
    fontSize: getFontSize(16),
    color: greenTheme.primary,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: getSpacing(spacing.sm),
    marginBottom: getSpacing(spacing.sm),
  },
  checkIcon: {
    width: scale(24),
    height: scale(24),
    borderRadius: moderateScale(borderRadius.full),
    backgroundColor: greenTheme.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: getSpacing(2),
  },
  checkText: {
    flex: 1,
    fontSize: getFontSize(14),
    lineHeight: moderateScale(20),
    color: colors.textPrimary,
  },
  notesSection: {
    gap: getSpacing(spacing.xs),
  },
  notesLabel: {
    fontSize: getFontSize(16),
    color: greenTheme.primary,
  },
  notesInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: moderateScale(borderRadius.md),
    padding: getSpacing(spacing.md),
    fontSize: getFontSize(15),
    color: colors.textPrimary,
    minHeight: scale(100),
    borderWidth: 1,
    borderColor: colors.border,
  },
  charCount: {
    textAlign: 'right',
    fontSize: getFontSize(12),
  },
  modalActions: {
    flexDirection: 'row',
    gap: getSpacing(spacing.md),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: moderateScale(borderRadius.lg),
    paddingVertical: getSpacing(spacing.md),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.textPrimary,
    fontSize: getFontSize(16),
    fontWeight: '700',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: greenTheme.primary,
    borderRadius: moderateScale(borderRadius.lg),
    paddingVertical: getSpacing(spacing.md),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: getSpacing(spacing.xs),
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: getFontSize(16),
    fontWeight: '700',
  },
});

