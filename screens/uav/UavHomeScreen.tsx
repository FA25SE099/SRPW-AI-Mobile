/**
 * UAV Home Screen
 * Dashboard for UAV vendor-specific functions
 */

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, StatusBar, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius } from '../../theme';
import { Container, Avatar, Spacer } from '../../components/ui';
import { useUser } from '../../libs/auth';
import { Ionicons } from '@expo/vector-icons';

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

// Mock data
const mockStats = {
  pendingOrders: 5,
  inProgressOrders: 2,
  completedToday: 3,
  totalSprayed: 45.5, // hectares
};

const quickActions = [
  {
    id: '1',
    title: 'Orders',
    iconName: 'list',
    iconType: 'Ionicons',
    gradient: ['#2E7D32', '#1B5E20'] as const,
    route: '/(uav-tabs)/orders',
  }
];

const recentOrders = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    fieldName: 'DongThap1 - Plot 16',
    status: 'Completed',
    date: '2024-01-15',
    area: 12.5,
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    fieldName: 'AnGiang2 - Plot 18',
    status: 'In Progress',
    date: '2024-01-16',
    area: 8.3,
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-003',
    fieldName: 'DongThap1 - Plot 20',
    status: 'Pending',
    date: '2024-01-17',
    area: 15.2,
  },
];

export const UavHomeScreen = () => {
  const router = useRouter();
  const { data: user } = useUser();

  const userName = user
    ? `${user.firstName} ${user.lastName}`.trim() || user.email
    : 'UAV Operator';

  const userInitials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
    : 'U';

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return colors.success;
      case 'in progress':
        return '#FF9500';
      case 'pending':
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={greenTheme.primary} />
      <SafeAreaView style={{ flex: 1, backgroundColor: greenTheme.primary }} edges={['top', 'bottom', 'left', 'right']}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header with Background Image */}
          <ImageBackground
            source={require('../../assets/ricepaddy.jpg')}
            style={styles.headerBackground}
            imageStyle={styles.headerBackgroundImage}
          >
            <View style={styles.headerContent}>
              {/* Top Row: Avatar, Name, and Bell Icon */}
              <View style={styles.topRow}>
                <View style={styles.avatarContainer}>
                  <Avatar
                    initials={userInitials}
                    size="lg"
                    backgroundColor="#FFFFFF"
                  />
                  {/* <Text style={styles.topUserName}>{userName}</Text> */}
                </View>
                {/* <TouchableOpacity style={styles.bellButton}>
                  <Ionicons name="notifications-outline" size={26} color="#FFFFFF" />
                </TouchableOpacity> */}
              </View>

              {/* Welcome Message */}
              <View style={styles.welcomeSection}>
                <Text style={styles.welcomeText}>Welcome to</Text>
                <Text style={styles.appTitle}>UAV Service Management</Text>
              </View>
            </View>
          </ImageBackground>

          {/* Main Content */}
          <Container padding="lg">
            <Spacer size="lg" />

            {/* Quick Actions */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>
            <Spacer size="md" />
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  onPress={() => router.push(action.route as any)}
                  style={styles.quickActionCard}
                  activeOpacity={0.7}
                >
                  <View style={styles.quickActionIconContainer}>
                    <Ionicons name={action.iconName as any} size={28} color={greenTheme.primary} />
                  </View>
                  <Text style={styles.quickActionTitle}>{action.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Spacer size="3xl" />

          </Container>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerBackground: {
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerBackgroundImage: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  topUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bellButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeSection: {
    marginBottom: spacing.md,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    marginBottom: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
});

