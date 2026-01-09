import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CultivationValidation } from '@/types/farmerCultivation';
import { colors, spacing, borderRadius } from '@/theme';

interface ValidationAlertProps {
  validation: CultivationValidation;
}

export const ValidationAlert: React.FC<ValidationAlertProps> = ({ validation }) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Error':
        return { name: 'close-circle' as const, color: '#ef4444' };
      case 'Warning':
        return { name: 'warning' as const, color: '#f59e0b' };
      case 'Info':
        return { name: 'information-circle' as const, color: '#3b82f6' };
      default:
        return { name: 'information-circle' as const, color: '#6b7280' };
    }
  };

  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case 'Error':
        return '#fef2f2';
      case 'Warning':
        return '#fffbeb';
      case 'Info':
        return '#eff6ff';
      default:
        return '#f9fafb';
    }
  };

  const getSeverityBorderColor = (severity: string) => {
    switch (severity) {
      case 'Error':
        return '#fecaca';
      case 'Warning':
        return '#fde68a';
      case 'Info':
        return '#bfdbfe';
      default:
        return '#e5e7eb';
    }
  };

  if (validation.isValid && validation.warnings.length === 0 && validation.errors.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
        <View style={styles.header}>
          <Ionicons name="checkmark-circle" size={24} color="#10b981" />
          <Text style={[styles.title, { color: '#10b981' }]}>Lựa chọn hợp lệ</Text>
        </View>
        <Text style={styles.message}>
          Lựa chọn của bạn đã được xác thực và sẵn sàng để xác nhận.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer}>
      {validation.errors.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lỗi</Text>
          {validation.errors.map((error, index) => {
            const icon = getSeverityIcon(error.severity);
            return (
              <View
                key={index}
                style={[
                  styles.alertItem,
                  {
                    backgroundColor: getSeverityBgColor(error.severity),
                    borderColor: getSeverityBorderColor(error.severity),
                  },
                ]}
              >
                <Ionicons name={icon.name} size={20} color={icon.color} />
                <Text style={styles.alertMessage}>{error.message}</Text>
              </View>
            );
          })}
        </View>
      )}

      {validation.warnings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cảnh báo</Text>
          {validation.warnings.map((warning, index) => {
            const icon = getSeverityIcon(warning.severity);
            return (
              <View
                key={index}
                style={[
                  styles.alertItem,
                  {
                    backgroundColor: getSeverityBgColor(warning.severity),
                    borderColor: getSeverityBorderColor(warning.severity),
                  },
                ]}
              >
                <Ionicons name={icon.name} size={20} color={icon.color} />
                <Text style={styles.alertMessage}>{warning.message}</Text>
              </View>
            );
          })}
        </View>
      )}

      {validation.recommendations && validation.recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Khuyến nghị</Text>
          {validation.recommendations.map((rec, index) => (
            <View
              key={index}
              style={[
                styles.alertItem,
                { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
              ]}
            >
              <Ionicons name="bulb-outline" size={20} color="#3b82f6" />
              <Text style={styles.alertMessage}>{rec.message}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    maxHeight: 300,
  },
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: spacing.sm,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  alertMessage: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});

