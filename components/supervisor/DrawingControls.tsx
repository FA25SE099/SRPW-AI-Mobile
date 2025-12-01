/**
 * Drawing Controls Component
 * Floating card for polygon drawing controls
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LatLng } from 'react-native-maps';
import { colors, spacing, borderRadius } from '../../theme';
import { Card, BodySemibold, BodySmall, Body, Button } from '../ui';
import { PolygonTask } from '../../libs/supervisor';

type DrawingControlsProps = {
  task: PolygonTask;
  drawnPolygon: LatLng[];
  polygonArea: number;
  isPending: boolean;
  onCancel: () => void;
  onRemoveLastPoint: () => void;
  onFinish: () => void;
};

export const DrawingControls: React.FC<DrawingControlsProps> = ({
  task,
  drawnPolygon,
  polygonArea,
  isPending,
  onCancel,
  onRemoveLastPoint,
  onFinish,
}) => {
  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.header}>
        <View>
          <BodySemibold>Plot {task.soThua}/{task.soTo}</BodySemibold>
          {drawnPolygon.length > 0 && (
            <BodySmall color={colors.textSecondary}>
              {drawnPolygon.length} points •{' '}
              {polygonArea > 0 ? `${polygonArea.toLocaleString()} m²` : 'Calculating...'}
            </BodySmall>
          )}
        </View>
        <TouchableOpacity onPress={onCancel} disabled={isPending}>
          <Body color={colors.error} style={styles.closeButton}>
            ✕
          </Body>
        </TouchableOpacity>
      </View>

      {drawnPolygon.length < 3 && (
        <BodySmall color={colors.textSecondary} style={styles.instructionText}>
          Tap map to add points (min 3)
        </BodySmall>
      )}

      <View style={styles.actions}>
        {drawnPolygon.length > 0 && (
          <TouchableOpacity
            onPress={onRemoveLastPoint}
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
            style={[styles.actionButton, styles.saveButton]}
          >
            <BodySmall color={colors.white}>Save</BodySmall>
          </Button>
        )}
      </View>
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
  closeButton: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  instructionText: {
    marginBottom: spacing.sm,
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
    backgroundColor: colors.success,
  },
});

