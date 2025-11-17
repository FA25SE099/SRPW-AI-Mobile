/**
 * Add Project Screen
 * Form for creating a new project
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { colors, spacing, borderRadius, shadows } from '../theme';
import {
  Container,
  H3,
  Body,
  BodySmall,
  BodySemibold,
  Card,
  Button,
  Input,
  Spacer,
} from '../components/ui';
import { TaskGroup, CreateProjectRequest } from '../types/api';

// Mock task groups
const taskGroups: TaskGroup[] = [
  { id: '1', name: 'Work', icon: '💼', color: '#FF6B9D' },
  { id: '2', name: 'Personal', icon: '👤', color: colors.primary },
  { id: '3', name: 'Study', icon: '📚', color: '#FF9500' },
];

export const AddProjectScreen = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateProjectRequest & { taskGroupName: string }>({
    name: 'Grocery Shopping App',
    description: 'This application is designed for super shops. By using this application they can enlist all their products in one place and can deliver. Customers will get a one-stop solution for their daily shopping.',
    taskGroupId: '1',
    taskGroupName: 'Work',
    startDate: dayjs('2022-05-01').toISOString(),
    endDate: dayjs('2022-06-30').toISOString(),
    logo: undefined,
    brandColor: '#34C759',
  });

  const [showTaskGroupPicker, setShowTaskGroupPicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const selectedTaskGroup = taskGroups.find((g) => g.id === formData.taskGroupId);

  const handleSubmit = () => {
    if (!formData.name || !formData.taskGroupId || !formData.startDate || !formData.endDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // TODO: Call API to create project
    Alert.alert('Success', 'Project created successfully!', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('DD MMM, YYYY');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Container padding="lg">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Body>←</Body>
          </TouchableOpacity>
          <H3 style={styles.headerTitle}>Add Project</H3>
          <TouchableOpacity style={styles.notificationButton}>
            <View style={styles.notificationDot} />
            <Body>🔔</Body>
          </TouchableOpacity>
        </View>

        <Spacer size="lg" />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Task Group Selector */}
          <Card variant="elevated" style={styles.formCard}>
            <BodySmall color={colors.textSecondary} style={styles.label}>
              Task Group
            </BodySmall>
            <TouchableOpacity
              onPress={() => setShowTaskGroupPicker(!showTaskGroupPicker)}
              style={styles.selectButton}
            >
              <View style={styles.selectButtonLeft}>
                {selectedTaskGroup?.icon && (
                  <View
                    style={[
                      styles.taskGroupIcon,
                      { backgroundColor: (selectedTaskGroup.color || colors.primary) + '20' },
                    ]}
                  >
                    <Body>{selectedTaskGroup.icon}</Body>
                  </View>
                )}
                <BodySemibold>{selectedTaskGroup?.name || 'Select Task Group'}</BodySemibold>
              </View>
              <Body>▼</Body>
            </TouchableOpacity>
            {showTaskGroupPicker && (
              <View style={styles.pickerDropdown}>
                {taskGroups.map((group) => (
                  <TouchableOpacity
                    key={group.id}
                    onPress={() => {
                      setFormData({
                        ...formData,
                        taskGroupId: group.id,
                        taskGroupName: group.name,
                      });
                      setShowTaskGroupPicker(false);
                    }}
                    style={styles.pickerOption}
                  >
                    {group.icon && (
                      <View
                        style={[
                          styles.taskGroupIcon,
                          { backgroundColor: (group.color || colors.primary) + '20' },
                        ]}
                      >
                        <Body>{group.icon}</Body>
                      </View>
                    )}
                    <BodySemibold>{group.name}</BodySemibold>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Card>

          <Spacer size="md" />

          {/* Project Name */}
          <Card variant="elevated" style={styles.formCard}>
            <BodySmall color={colors.textSecondary} style={styles.label}>
              Project Name
            </BodySmall>
            <TextInput
              style={styles.textInput}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter project name"
              placeholderTextColor={colors.textTertiary}
            />
          </Card>

          <Spacer size="md" />

          {/* Description */}
          <Card variant="elevated" style={styles.formCard}>
            <BodySmall color={colors.textSecondary} style={styles.label}>
              Description
            </BodySmall>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Enter project description"
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Card>

          <Spacer size="md" />

          {/* Start Date */}
          <Card variant="elevated" style={styles.formCard}>
            <BodySmall color={colors.textSecondary} style={styles.label}>
              Start Date
            </BodySmall>
            <TouchableOpacity
              onPress={() => {
                // TODO: Implement date picker
                Alert.alert('Date Picker', 'Date picker will be implemented');
              }}
              style={styles.selectButton}
            >
              <View style={styles.selectButtonLeft}>
                <Body style={styles.calendarIcon}>📅</Body>
                <BodySemibold>{formatDate(formData.startDate)}</BodySemibold>
              </View>
              <Body>▼</Body>
            </TouchableOpacity>
          </Card>

          <Spacer size="md" />

          {/* End Date */}
          <Card variant="elevated" style={styles.formCard}>
            <BodySmall color={colors.textSecondary} style={styles.label}>
              End Date
            </BodySmall>
            <TouchableOpacity
              onPress={() => {
                // TODO: Implement date picker
                Alert.alert('Date Picker', 'Date picker will be implemented');
              }}
              style={styles.selectButton}
            >
              <View style={styles.selectButtonLeft}>
                <Body style={styles.calendarIcon}>📅</Body>
                <BodySemibold>{formatDate(formData.endDate)}</BodySemibold>
              </View>
              <Body>▼</Body>
            </TouchableOpacity>
          </Card>

          <Spacer size="md" />

          {/* Project Logo/Branding */}
          <Card variant="elevated" style={styles.formCard}>
            <BodySmall color={colors.textSecondary} style={styles.label}>
              Project Logo
            </BodySmall>
            <View style={styles.logoSection}>
              <View style={[styles.logoCircle, { backgroundColor: formData.brandColor }]}>
                <Body color={colors.white} style={styles.logoText}>
                  {formData.name
                    .split(' ')
                    .map((word) => word[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </Body>
              </View>
              <View style={styles.logoTextContainer}>
                <BodySemibold style={styles.logoName}>
                  {formData.name.split(' ')[0]}
                </BodySemibold>
                <BodySmall color={colors.textSecondary}>
                  {formData.name.split(' ').slice(1).join(' ')}
                </BodySmall>
              </View>
              <Button
                variant="outline"
                size="sm"
                onPress={() => {
                  // TODO: Implement logo picker
                  Alert.alert('Logo Picker', 'Logo picker will be implemented');
                }}
                style={styles.changeLogoButton}
              >
                Change Logo
              </Button>
            </View>
          </Card>

          <Spacer size="xl" />

          {/* Submit Button */}
          <Button onPress={handleSubmit} fullWidth size="lg">
            Add Project
          </Button>

          <Spacer size="xl" />
        </ScrollView>
      </Container>
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
    paddingTop: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  notificationButton: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  formCard: {
    padding: spacing.md,
  },
  label: {
    marginBottom: spacing.sm,
  },
  textInput: {
    ...StyleSheet.flatten([{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }]),
    padding: 0,
    minHeight: 24,
  },
  textArea: {
    minHeight: 100,
    paddingTop: spacing.sm,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  selectButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  taskGroupIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarIcon: {
    fontSize: 20,
  },
  pickerDropdown: {
    marginTop: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    ...shadows.md,
    overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
  },
  logoTextContainer: {
    flex: 1,
  },
  logoName: {
    fontSize: 16,
  },
  changeLogoButton: {
    alignSelf: 'flex-start',
  },
});

