import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, borderRadius } from '@/theme';
import {
  Container,
  H3,
  Body,
  BodySmall,
  BodySemibold,
  Card,
  Spacer,
} from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { getFarmLogsByCultivation } from '@/libs/supervisor';

export const FarmLogsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    plotCultivationId: string;
    plotName?: string;
  }>();
  const [selectedPhoto, setSelectedPhoto] = React.useState<string | null>(null);

  const { data: farmLogsData, isLoading } = useQuery({
    queryKey: ['farm-logs-cultivation-full', params.plotCultivationId],
    queryFn: () =>
      getFarmLogsByCultivation({
        plotCultivationId: params.plotCultivationId!,
        currentPage: 1,
        pageSize: 50,
      }),
    enabled: !!params.plotCultivationId,
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const logs = farmLogsData?.data || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Container>
        <Spacer size="md" />
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.dark} />
          <BodySemibold style={styles.backText}>Back</BodySemibold>
        </TouchableOpacity>
        <Spacer size="md" />
        <H3>Farm Logs</H3>
        <BodySmall style={styles.subtitle}>{params.plotName || 'Plot Details'}</BodySmall>
        <Spacer size="lg" />

        <ScrollView showsVerticalScrollIndicator={false}>
          {logs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
              <Spacer size="md" />
              <Body style={styles.emptyText}>No farm logs recorded yet</Body>
            </View>
          ) : (
            logs.map((log) => (
              <Card key={log.farmLogId} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <View>
                    <BodySemibold>{log.cultivationTaskName}</BodySemibold>
                    <BodySmall style={styles.date}>{formatDate(log.loggedDate)}</BodySmall>
                  </View>
                  <BodySmall style={styles.percentage}>{log.completionPercentage}%</BodySmall>
                </View>

                <Spacer size="sm" />
                
                {log.workDescription && (
                  <>
                    <BodySmall style={styles.label}>Description</BodySmall>
                    <Body style={styles.content}>{log.workDescription}</Body>
                    <Spacer size="sm" />
                  </>
                )}

                {log.materialsUsed && log.materialsUsed.length > 0 && (
                  <>
                    <BodySmall style={styles.label}>Materials Used</BodySmall>
                    {log.materialsUsed.map((m, idx) => (
                      <View key={idx} style={styles.materialRow}>
                        <BodySmall>• {m.materialName}</BodySmall>
                        <BodySmall>{m.actualQuantityUsed}</BodySmall>
                        {m.actualCost > 0 && (
                          <BodySmall style={{color: colors.textTertiary, fontSize: 11}}> ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(m.actualCost)})</BodySmall>
                        )}
                        {m.notes && <BodySmall style={{fontStyle: 'italic', fontSize: 11}}> - {m.notes}</BodySmall>}
                      </View>
                    ))}
                    <Spacer size="sm" />
                  </>
                )}

                {log.photoUrls && log.photoUrls.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photos}>
                    {log.photoUrls.map((url, idx) => (
                      <TouchableOpacity key={idx} onPress={() => setSelectedPhoto(url)}>
                        <Image source={{ uri: url }} style={styles.photo} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </Card>
            ))
          )}
          <Spacer size="xl" />
        </ScrollView>
      </Container>

      {/* Full Screen Image Modal */}
      <Modal
        visible={!!selectedPhoto}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.fullScreenImageContainer}>
          <TouchableOpacity
            style={styles.fullScreenImageBackground}
            activeOpacity={1}
            onPress={() => setSelectedPhoto(null)}
          >
            <TouchableOpacity
              style={styles.fullScreenImageClose}
              onPress={() => setSelectedPhoto(null)}
            >
              <Ionicons name="close" size={30} color={colors.white} />
            </TouchableOpacity>
            {selectedPhoto && (
              <Image
                source={{ uri: selectedPhoto }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backText: {
    color: colors.dark,
  },
  subtitle: {
    color: colors.textSecondary,
  },
  logCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  date: {
    color: colors.textSecondary,
  },
  percentage: {
    color: colors.primary,
    fontWeight: '600',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 2,
  },
  content: {
    fontSize: 14,
  },
  materialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: spacing.sm, 
    flexWrap: 'wrap',
  },
  photos: {
    marginTop: spacing.sm,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
  },
  fullScreenImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  fullScreenImageBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
  fullScreenImageClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
});