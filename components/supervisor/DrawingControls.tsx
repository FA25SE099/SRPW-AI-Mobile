/**
 * Drawing Controls Component
 * Floating card for polygon drawing controls
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LatLng } from 'react-native-maps';
import { colors, spacing, borderRadius } from '../../theme';
import { Card, BodySemibold, BodySmall, Body, Button } from '../ui';
import { PolygonTask, PlotDTO, ValidatePolygonAreaResponse } from '../../libs/supervisor';

type DrawingControlsProps = {
  task?: PolygonTask | null;
  editingPlot?: PlotDTO | null;
  drawnPolygon: LatLng[];
  polygonArea: number;
  isPending: boolean;
  isValidating: boolean;
  validationResult: ValidatePolygonAreaResponse['data'] | null;
  onCancel: () => void;
  onRemoveLastPoint: () => void;
  onFinish: () => void;
};

export const DrawingControls: React.FC<DrawingControlsProps> = ({
  task,
  editingPlot,
  drawnPolygon,
  polygonArea,
  isPending,
  isValidating,
  validationResult,
  onCancel,
  onRemoveLastPoint,
  onFinish,
}) => {
  const getValidationStatusColor = () => {
    if (!validationResult) return colors.textSecondary;
    return validationResult.isValid ? colors.success : colors.error;
  };

  const getValidationIcon = () => {
    if (isValidating) return '⏳';
    if (!validationResult) return '⚪';
    return validationResult.isValid ? '✅' : '⚠️';
  };

  const isEditMode = !!editingPlot;
  const plotInfo = isEditMode ? editingPlot : task;

  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerRow}>
            {isEditMode && (
              <BodySmall color={colors.warning || '#FF9500'} style={styles.modeLabel}>
                ✏️ Editing
              </BodySmall>
            )}
            <BodySemibold>Plot {plotInfo?.soThua}/{plotInfo?.soTo}</BodySemibold>
          </View>
          {drawnPolygon.length > 0 && (
            <BodySmall color={colors.textSecondary}>
              {drawnPolygon.length} points •{' '}
              {/* {polygonArea > 0 ? `${polygonArea.toLocaleString()} m²` : 'Calculating...'} */}
            </BodySmall>
          )}
        </View>
        <TouchableOpacity onPress={onCancel} disabled={isPending}>
          <Body color={colors.error} style={styles.closeButton}>
            ✕
          </Body>
        </TouchableOpacity>
      </View>

      {drawnPolygon.length < 3 ? (
        <BodySmall color={colors.textSecondary} style={styles.instructionText}>
          Tap map to add points (min 3)
        </BodySmall>
      ) : (
        <>
          {/* Validation Status */}
          <View style={styles.validationContainer}>
            {isValidating ? (
              <View style={styles.validationRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <BodySmall color={colors.textSecondary} style={styles.validationText}>
                  Validating polygon...
                </BodySmall>
              </View>
            ) : validationResult ? (
              <View style={styles.validationBox}>
                <View style={styles.validationRow}>
                  <Body style={styles.validationIcon}>{getValidationIcon()}</Body>
                  <BodySemibold 
                    color={getValidationStatusColor()}
                    style={styles.validationStatus}
                  >
                    {validationResult.isValid ? 'Valid' : 'Invalid Area'}
                  </BodySemibold>
                </View>
                
                <View style={styles.validationDetails}>
                  <View style={styles.validationDetailRow}>
                    <BodySmall color={colors.textSecondary}>Drawn:</BodySmall>
                    <BodySmall color={colors.textPrimary}>
                      {validationResult.drawnAreaHa.toFixed(3)} ha
                    </BodySmall>
                  </View>
                  <View style={styles.validationDetailRow}>
                    <BodySmall color={colors.textSecondary}>Expected:</BodySmall>
                    <BodySmall color={colors.textPrimary}>
                      {validationResult.plotAreaHa.toFixed(3)} ha
                    </BodySmall>
                  </View>
                  <View style={styles.validationDetailRow}>
                    <BodySmall color={colors.textSecondary}>Difference:</BodySmall>
                    <BodySmall color={getValidationStatusColor()}>
                      {validationResult.differencePercent.toFixed(1)}%
                    </BodySmall>
                  </View>
                </View>

                {!validationResult.isValid && (
                  <BodySmall 
                    color={colors.error} 
                    style={styles.validationMessage}
                  >
                    {validationResult.message}
                  </BodySmall>
                )}
              </View>
            ) : (
              <View style={styles.validationRow}>
                <Body style={styles.validationIcon}>⚪</Body>
                <BodySmall color={colors.textSecondary} style={styles.validationText}>
                  Waiting for validation...
                </BodySmall>
              </View>
            )}
          </View>
        </>
      )}

      <View style={styles.actions}>
        {drawnPolygon.length > 0 && (
          <TouchableOpacity
            onPress={onRemoveLastPoint}
            disabled={isPending}
            style={[styles.actionButton, styles.undoButton]}
          >
            <BodySmall color={colors.textPrimary}>Undo</BodySmall>
          </TouchableOpacity>
        )}
        {drawnPolygon.length >= 3 && (
          <Button
            size="sm"
            onPress={onFinish}
            loading={isPending}
            disabled={
              isPending || 
              isValidating || 
              !validationResult || 
              !validationResult.isValid
            }
            style={styles.saveButton}
          >
            <BodySmall color={colors.white}>
              Save
            </BodySmall>
          </Button>
        )}
      </View>
      
      {/* Show message when save is disabled */}
      {drawnPolygon.length >= 3 && validationResult && !validationResult.isValid && (
        <BodySmall color={colors.error} style={styles.disabledMessage}>
          ⚠️ Validation must pass to save. Please redraw polygon.
        </BodySmall>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    padding: spacing.md,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  modeLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  instructionText: {
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  validationContainer: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  validationBox: {
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  validationIcon: {
    fontSize: 16,
  },
  validationStatus: {
    fontSize: 14,
  },
  validationText: {
    fontSize: 12,
  },
  validationDetails: {
    marginTop: spacing.xs,
    marginLeft: spacing.lg,
    gap: spacing.xs / 2,
  },
  validationDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  validationMessage: {
    marginTop: spacing.xs,
    fontSize: 11,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  undoButton: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
  },
  disabledMessage: {
    marginTop: spacing.xs,
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
  },
});

