import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/theme';
import { Container, Spacer, Button } from '@/components/ui';
import { RiceVarietyCard } from '@/components/farmer/RiceVarietyCard';
import { ValidationAlert } from '@/components/farmer/ValidationAlert';
import { EstimatesPanel } from '@/components/farmer/EstimatesPanel';
import { SimpleDatePicker } from '@/components/farmer/SimpleDatePicker';
import {
  getAvailableVarietiesForSeason,
  validateCultivationPreferences,
  selectCultivationPreferences,
  getYearSeasonById,
} from '@/libs/farmerCultivation';
import { getCurrentFarmerPlots } from '@/libs/farmer';
import {
  RiceVarietySeason,
  CultivationValidation,
  YearSeason,
} from '@/types/farmerCultivation';
import { FarmerPlot } from '@/types/api';

export default function SelectCultivationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const plotId = params.plotId as string;
  const yearSeasonId = params.yearSeasonId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [plot, setPlot] = useState<FarmerPlot | null>(null);
  const [yearSeason, setYearSeason] = useState<YearSeason | null>(null);
  const [varieties, setVarieties] = useState<RiceVarietySeason[]>([]);
  const [selectedVariety, setSelectedVariety] = useState<RiceVarietySeason | null>(null);
  const [plantingDate, setPlantingDate] = useState<Date>(new Date());
  const [validation, setValidation] = useState<CultivationValidation | null>(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedVariety && plantingDate) {
      validateSelection();
    }
  }, [selectedVariety, plantingDate]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [plotsData, yearSeasonData] = await Promise.all([
        getCurrentFarmerPlots({ pageSize: 100 }),
        getYearSeasonById(yearSeasonId),
      ]);

      const currentPlot = plotsData.find((p) => p.plotId === plotId);
      if (!currentPlot) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin thửa ruộng');
        router.back();
        return;
      }

      setPlot(currentPlot);
      setYearSeason(yearSeasonData);

      const varietiesData = await getAvailableVarietiesForSeason(yearSeasonId, true);
      setVarieties(varietiesData);

      if (yearSeasonData.startDate) {
        const startDate = new Date(yearSeasonData.startDate);
        setPlantingDate(startDate);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const validateSelection = async () => {
    if (!selectedVariety || !plantingDate) return;

    try {
      setValidating(true);
      const result = await validateCultivationPreferences({
        plotId,
        yearSeasonId,
        riceVarietyId: selectedVariety.riceVarietyId,
        preferredPlantingDate: plantingDate.toISOString(),
      });
      setValidation(result);
    } catch (error: any) {
      console.error('Error validating selection:', error);
    } finally {
      setValidating(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedVariety || !plantingDate || !validation?.isValid) {
      Alert.alert('Lỗi', 'Vui lòng chọn giống lúa và ngày gieo trồng hợp lệ');
      return;
    }

    Alert.alert(
      'Xác nhận lựa chọn',
      `Bạn có chắc chắn muốn chọn giống ${selectedVariety.varietyName} với ngày gieo trồng ${plantingDate.toLocaleDateString('vi-VN')}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              setSubmitting(true);
              await selectCultivationPreferences({
                plotId,
                yearSeasonId,
                riceVarietyId: selectedVariety.riceVarietyId,
                preferredPlantingDate: plantingDate.toISOString(),
              });

              Alert.alert('Thành công', 'Đã lưu lựa chọn của bạn', [
                {
                  text: 'OK',
                  onPress: () => router.back(),
                },
              ]);
            } catch (error: any) {
              console.error('Error confirming selection:', error);
              Alert.alert('Lỗi', 'Không thể lưu lựa chọn. Vui lòng thử lại.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn giống lúa</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Container padding="lg">
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#10b981" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Thửa ruộng</Text>
                <Text style={styles.infoValue}>
                  {plot?.soThua && plot?.soTo
                    ? `Thửa ${plot.soThua}, Tờ ${plot.soTo}`
                    : 'N/A'}
                </Text>
                <Text style={styles.infoSubtext}>{plot?.area} ha</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#10b981" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Mùa vụ</Text>
                <Text style={styles.infoValue}>
                  {yearSeason?.seasonName} {yearSeason?.year}
                </Text>
              </View>
            </View>
          </View>

          <Spacer size="xl" />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bước 1: Chọn giống lúa</Text>
            <Text style={styles.sectionSubtitle}>
              Chọn giống lúa phù hợp với điều kiện thửa ruộng của bạn
            </Text>
          </View>

          <Spacer size="md" />

          {varieties.map((variety) => (
            <RiceVarietyCard
              key={variety.riceVarietyId}
              variety={variety}
              selected={selectedVariety?.riceVarietyId === variety.riceVarietyId}
              onSelect={() => setSelectedVariety(variety)}
            />
          ))}

          {selectedVariety && (
            <>
              <Spacer size="xl" />

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Bước 2: Chọn ngày gieo trồng</Text>
                <Text style={styles.sectionSubtitle}>
                  Chọn ngày bạn dự định gieo trồng
                </Text>
              </View>

              <Spacer size="md" />

              <SimpleDatePicker
                value={plantingDate}
                onChange={setPlantingDate}
                label="Ngày gieo trồng"
                minimumDate={yearSeason?.startDate ? new Date(yearSeason.startDate) : undefined}
                maximumDate={yearSeason?.endDate ? new Date(yearSeason.endDate) : undefined}
              />

              <Spacer size="xl" />

              {validating && (
                <View style={styles.validatingContainer}>
                  <ActivityIndicator size="small" color="#10b981" />
                  <Text style={styles.validatingText}>Đang kiểm tra...</Text>
                </View>
              )}

              {validation && !validating && (
                <>
                  <ValidationAlert validation={validation} />
                  <Spacer size="md" />
                  {validation.isValid && plot && (
                    <>
                      <EstimatesPanel validation={validation} plotArea={plot.area} />
                      <Spacer size="md" />
                    </>
                  )}
                </>
              )}
            </>
          )}

          <Spacer size="xl" />
        </Container>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          variant="outline"
          onPress={() => router.back()}
          disabled={submitting}
          style={{ flex: 1 }}
        >
          Hủy
        </Button>
        <Spacer size="md" />
        <Button
          onPress={handleConfirm}
          disabled={!validation?.isValid || submitting}
          loading={submitting}
          style={{ flex: 2 }}
        >
          Xác nhận lựa chọn
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: '#6b7280',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  infoSubtext: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: spacing.md,
  },
  section: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  validatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  validatingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
});

