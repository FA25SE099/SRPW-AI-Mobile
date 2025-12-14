/**
 * Modern Farmer Home Screen
 * Clean dashboard with contemporary design
 */

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, StatusBar, Platform, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius } from '../theme';
import { Container, Avatar, Spacer } from '../components/ui';
import { useUser } from '../libs/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Mock data
const mockStats = {
  totalFields: 5,
  pendingTasks: 3,
  activeAlerts: 2,
  seasonProgress: 65,
};

const quickActions = [
  { id: '1', title: 'My Fields', iconName: 'leaf', iconType: 'Ionicons', gradient: ['#10b981', '#059669'] as const, route: '/(farmer-tabs)/fields' },
  { id: '2', title: 'Farm Log', iconName: 'book', iconType: 'Ionicons', gradient: ['#10b981', '#059669'] as const, route: '/farmer/farm-log' },
  { id: '3', title: 'Tasks', iconName: 'checkbox', iconType: 'Ionicons', gradient: ['#10b981', '#059669'] as const, route: '/(farmer-tabs)/tasks' },
  { id: '4', title: 'Disease Scanner', iconName: 'scan', iconType: 'Ionicons', gradient: ['#10b981', '#059669'] as const, route: '/farmer/disease-scanner' },
  { id: '5', title: 'Weather', iconName: 'weather-partly-cloudy', iconType: 'MaterialCommunityIcons', gradient: ['#10b981', '#059669'] as const, route: '/farmer/weather' },
  { id: '6', title: 'Economics', iconName: 'cash', iconType: 'Ionicons', gradient: ['#10b981', '#059669'] as const, route: '/farmer/economics' },
];

const recentActivities = [
  { id: '1', type: 'fertilizing', fieldName: 'Field A', date: '2024-01-15', material: 'NPK 20-20-20', cost: 150000 },
  { id: '2', type: 'spraying', fieldName: 'Field B', date: '2024-01-14', material: 'Pesticide X', cost: 85000 },
  { id: '3', type: 'irrigation', fieldName: 'Field C', date: '2024-01-13', material: 'Water', cost: 25000 },
];

export const FarmerHomeScreen = () => {
  const router = useRouter();
  const { data: user } = useUser();

  const getActivityIcon = (type: string) => {
    const icons: { [key: string]: { name: string; type: 'Ionicons' | 'MaterialCommunityIcons'; color: string } } = {
      planting: { name: 'leaf', type: 'Ionicons', color: '#10b981' },
      fertilizing: { name: 'water', type: 'Ionicons', color: '#3b82f6' },
      spraying: { name: 'spray', type: 'MaterialCommunityIcons', color: '#8b5cf6' },
      irrigation: { name: 'water-outline', type: 'Ionicons', color: '#06b6d4' },
      harvesting: { name: 'flower', type: 'Ionicons', color: '#f59e0b' },
    };
    return icons[type] || { name: 'document-text', type: 'Ionicons', color: '#6b7280' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#10b981" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#10b981' }} edges={['top', 'bottom', 'left', 'right']}>  
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header with Background Image */}
          <ImageBackground
            source={require('../assets/ricepaddy.jpg')}
            style={styles.headerBackground}
            imageStyle={styles.headerBackgroundImage}
          >
            <View style={styles.headerContent}>
              {/* Top Row: Avatar, Name, and Bell Icon */}
              <View style={styles.topRow}>
                <View style={styles.avatarContainer}>
                  <Avatar
                    initials={`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`}
                    size="lg"
                    backgroundColor="#FFFFFF"
                  />
                  <Text style={styles.topUserName}>{user?.firstName} {user?.lastName}</Text>
                </View>
                <TouchableOpacity style={styles.bellButton}>
                  <Ionicons name="notifications-outline" size={26} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Welcome Message */}
              <View style={styles.welcomeSection}>
                <Text style={styles.welcomeText}>Welcome to</Text>
                <Text style={styles.appTitle}>Smart Garden AI</Text>
              </View>

              {/* Stats Cards */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Area</Text>
                  <Text style={styles.statValue}>{mockStats.totalFields}m²</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Yield</Text>
                  <Text style={styles.statValue}>{mockStats.pendingTasks} Tons</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Plant Age</Text>
                  <Text style={styles.statValue}>{mockStats.activeAlerts} Days</Text>
                </View>
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
                    {action.iconType === 'Ionicons' ? (
                      <Ionicons name={action.iconName as any} size={28} color="#10b981" />
                    ) : (
                      <MaterialCommunityIcons name={action.iconName as any} size={28} color="#10b981" />
                    )}
                  </View>
                  <Text style={styles.quickActionTitle}>{action.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Spacer size="xl" />

            {/* Season Progress Card */}
            <View style={styles.seasonCard}>
              <View style={styles.seasonHeader}>
                <View>
                  <Text style={styles.seasonTitle}>Current Season</Text>
                  <Text style={styles.seasonSubtitle}>Winter-Spring 2024</Text>
                </View>
                <View style={styles.seasonBadge}>
                  <Text style={styles.seasonBadgeText}>{mockStats.seasonProgress}%</Text>
                </View>
              </View>
              <Spacer size="md" />
              <View style={styles.progressBarBg}>
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: `${mockStats.seasonProgress}%` }]}
                />
              </View>
              <Spacer size="sm" />
              <Text style={styles.progressLabel}>
                {Math.round((mockStats.seasonProgress / 100) * 120)} of 120 days completed
              </Text>
            </View>

            <Spacer size="xl" />

            {/* Recent Activities */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activities</Text>
              <TouchableOpacity onPress={() => router.push('/farmer/farm-log' as any)}>
                <Text style={styles.viewAllText}>View All →</Text>
              </TouchableOpacity>
            </View>

            <Spacer size="md" />

            {recentActivities.map((activity, index) => {
              const iconData = getActivityIcon(activity.type);
              return (
                <TouchableOpacity 
                  key={activity.id}
                  activeOpacity={0.7}
                  style={[
                    styles.activityCard,
                    index < recentActivities.length - 1 && styles.activityCardBorder
                  ]}
                >
                  <View style={styles.activityLeft}>
                    <View style={[styles.activityIconContainer, { backgroundColor: `${iconData.color}15` }]}>
                      {iconData.type === 'Ionicons' ? (
                        <Ionicons name={iconData.name as any} size={24} color={iconData.color} />
                      ) : (
                        <MaterialCommunityIcons name={iconData.name as any} size={24} color={iconData.color} />
                      )}
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityField}>{activity.fieldName}</Text>
                      <Text style={styles.activityDetails}>
                        {activity.material}
                      </Text>
                      <Text style={styles.activityDate}>
                        {new Date(activity.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.activityCost}>
                    {formatCurrency(activity.cost)}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <Spacer size="xl" />

            {/* Economic Performance CTA */}
            <TouchableOpacity 
              onPress={() => router.push('/farmer/economics' as any)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#8b5cf6', '#7c3aed']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaCard}
              >
                <View style={styles.ctaContent}>
                  <View style={styles.ctaIconContainer}>
                    <Ionicons name="stats-chart" size={32} color="#FFFFFF" />
                  </View>
                  <View style={styles.ctaText}>
                    <Text style={styles.ctaTitle}>Economic Performance</Text>
                    <Text style={styles.ctaSubtitle}>View your financial insights</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>

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
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
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
  viewAllText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
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
    backgroundColor: '#dcfce7',
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
  seasonCard: {
    backgroundColor: '#FFFFFF',
    padding: spacing.lg,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  seasonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seasonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  seasonSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  seasonBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  seasonBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  activityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  activityCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  activityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activityField: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  activityDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  activityCost: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#10b981',
  },
  ctaCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 16,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  ctaIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
  },
});