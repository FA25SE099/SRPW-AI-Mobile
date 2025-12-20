import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Switch,
  Modal,
  FlatList,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { 
  getStandardPlans, 
  calculateStandardPlanProfitAnalysis, 
  getFarmers, 
  getFarmerPlots,
  Farmer,
  GetFarmerPlotsParams
} from '@/libs/supervisor';
import { StandardPlan, StandardPlanProfitAnalysisRequest } from '@/types/api';
import { colors, spacing } from '@/theme';
import { Container } from '@/components/ui';

export const EconomicsScreen = () => {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [selectedPlanName, setSelectedPlanName] = useState<string>('');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [usePlot, setUsePlot] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState<string>('');
  const [selectedPlotName, setSelectedPlotName] = useState<string>('');
  const [showPlotModal, setShowPlotModal] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<string>('');
  const [selectedFarmerData, setSelectedFarmerData] = useState<Farmer | null>(null);
  const [showFarmerModal, setShowFarmerModal] = useState(false);
  const [area, setArea] = useState('');
  const [pricePerKg, setPricePerKg] = useState('7500');
  const [expectedYield, setExpectedYield] = useState('6000');
  const [otherCosts, setOtherCosts] = useState('0');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Fetch farmers list
  const { data: farmers, isLoading: isFarmersLoading } = useQuery({
    queryKey: ['farmers-list'],
    queryFn: () => getFarmers(),
  });

  // Fetch standard plans
  const { data: standardPlans, isLoading: isLoadingPlans, error: plansError } = useQuery({
    queryKey: ['standard-plans'],
    queryFn: () => getStandardPlans(),
    retry: 1,
  });

  // Fetch plots for selected farmer (only if usePlot is true and a farmer is selected)
  const { data: plotsData, isLoading: isLoadingPlots } = useQuery({
    queryKey: ['farmer-plots', selectedFarmer],
    queryFn: () => selectedFarmer 
      ? getFarmerPlots({ 
          farmerId: selectedFarmer,
          currentPage: 1,
          pageSize: 100,
        }) 
      : Promise.resolve([]),
    enabled: usePlot && !!selectedFarmer,
  });

  const plots = plotsData || [];

  const handleCalculate = async () => {
    if (!selectedPlan) {
      Alert.alert('Error', 'Please select a standard plan');
      return;
    }

    if (!usePlot && !area) {
      Alert.alert('Error', 'Please enter an area');
      return;
    }

    if (usePlot && !selectedPlot) {
      Alert.alert('Error', 'Please select a plot');
      return;
    }

    const pricePerKgNum = parseFloat(pricePerKg);
    const expectedYieldNum = parseFloat(expectedYield);
    const otherCostsNum = parseFloat(otherCosts);

    if (isNaN(pricePerKgNum) || pricePerKgNum <= 0) {
      Alert.alert('Error', 'Please enter a valid price per kg');
      return;
    }

    if (isNaN(expectedYieldNum) || expectedYieldNum <= 0) {
      Alert.alert('Error', 'Please enter a valid expected yield');
      return;
    }

    if (isNaN(otherCostsNum) || otherCostsNum < 0) {
      Alert.alert('Error', 'Please enter a valid other service cost');
      return;
    }

    setIsCalculating(true);
    try {
      const request: StandardPlanProfitAnalysisRequest = {
        standardPlanId: selectedPlan,
        pricePerKgRice: pricePerKgNum,
        expectedYieldPerHa: expectedYieldNum,
        otherServiceCostPerHa: otherCostsNum,
      };

      if (usePlot) {
        request.plotId = selectedPlot;
      } else {
        const areaNum = parseFloat(area);
        if (isNaN(areaNum) || areaNum <= 0) {
          Alert.alert('Error', 'Please enter a valid area');
          return;
        }
        request.area = areaNum;
      }

      const result = await calculateStandardPlanProfitAnalysis(request);
      setAnalysisResult(result);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to calculate profit analysis');
    } finally {
      setIsCalculating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  return (
    <Container>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Profit Analysis Calculator</Text>

        {/* Standard Plan Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Select Standard Plan *</Text>
          {isLoadingPlans ? (
            <ActivityIndicator />
          ) : plansError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                ⚠️ Unable to load standard plans. The backend endpoint may not be available yet.
              </Text>
              <Text style={styles.errorSubtext}>
                Error: {plansError instanceof Error ? plansError.message : 'Unknown error'}
              </Text>
            </View>
          ) : !standardPlans || standardPlans.length === 0 ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                📋 No standard plans found. Please create a standard plan first.
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowPlanModal(true)}
            >
              <Text style={styles.selectButtonText}>
                {selectedPlanName || '-- Select Plan --'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Plan Selection Modal */}
        <Modal
          visible={showPlanModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPlanModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Standard Plan</Text>
              <FlatList
                data={standardPlans || []}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedPlan(item.id);
                      setSelectedPlanName(
                        `${item.name}${item.riceVarietyName ? ` (${item.riceVarietyName})` : ''}`
                      );
                      setShowPlanModal(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>
                      {item.name}
                      {item.riceVarietyName && (
                        <Text style={styles.modalItemSubtext}> ({item.riceVarietyName})</Text>
                      )}
                    </Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPlanModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Use Plot Toggle */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Use Plot Instead of Area</Text>
            <Switch value={usePlot} onValueChange={setUsePlot} />
          </View>
        </View>

        {/* Farmer Selection (only show when usePlot is true) */}
        {usePlot && (
          <View style={styles.section}>
            <Text style={styles.label}>Select Farmer *</Text>
            {isFarmersLoading ? (
              <ActivityIndicator />
            ) : (
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowFarmerModal(true)}
              >
                <Text style={styles.selectButtonText}>
                  {selectedFarmerData
                    ? selectedFarmerData.fullName || selectedFarmerData.farmCode || 'Unknown Farmer'
                    : '-- Select Farmer --'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Plot or Area Selection */}
        {usePlot ? (
          <View style={styles.section}>
            <Text style={styles.label}>Select Plot *</Text>
            {!selectedFarmer ? (
              <Text style={styles.helperText}>Please select a farmer first</Text>
            ) : isLoadingPlots ? (
              <ActivityIndicator />
            ) : (
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowPlotModal(true)}
              >
                <Text style={styles.selectButtonText}>
                  {selectedPlotName || '-- Select Plot --'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.label}>Area (hectares) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter area in hectares"
              keyboardType="decimal-pad"
              value={area}
              onChangeText={setArea}
            />
          </View>
        )}

        {/* Plot Selection Modal */}
        <Modal
          visible={showPlotModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPlotModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Plot</Text>
              <FlatList
                data={plots}
                keyExtractor={(item: any) => item.plotId}
                renderItem={({ item }: any) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedPlot(item.plotId);
                      setSelectedPlotName(`Thửa ${item.soThua}, Tờ ${item.soTo} (${item.area} ha)`);
                      setShowPlotModal(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>
                      Thửa {item.soThua}, Tờ {item.soTo} ({item.area} ha)
                    </Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPlotModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Farmer Selection Modal */}
        <Modal
          visible={showFarmerModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFarmerModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Farmer</Text>
              <FlatList
                data={farmers || []}
                keyExtractor={(item) => item.farmerId}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedFarmer(item.farmerId);
                      setSelectedFarmerData(item);
                      setSelectedPlot('');
                      setSelectedPlotName('');
                      setShowFarmerModal(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>
                      {item.fullName || item.farmCode || 'Unknown Farmer'}
                    </Text>
                    {item.address && (
                      <Text style={styles.modalItemSubtext}>{item.address}</Text>
                    )}
                    {item.phoneNumber && (
                      <Text style={styles.modalItemSubtext}>📞 {item.phoneNumber}</Text>
                    )}
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowFarmerModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Price per kg */}
        <View style={styles.section}>
          <Text style={styles.label}>Price per Kg Rice (VND) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter price per kg"
            keyboardType="numeric"
            value={pricePerKg}
            onChangeText={setPricePerKg}
          />
        </View>

        {/* Expected Yield */}
        <View style={styles.section}>
          <Text style={styles.label}>Expected Yield per Ha (kg) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter expected yield"
            keyboardType="numeric"
            value={expectedYield}
            onChangeText={setExpectedYield}
          />
        </View>

        {/* Other Service Costs */}
        <View style={styles.section}>
          <Text style={styles.label}>Other Service Cost per Ha (VND)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter other costs (optional)"
            keyboardType="numeric"
            value={otherCosts}
            onChangeText={setOtherCosts}
          />
        </View>

        {/* Calculate Button */}
        <TouchableOpacity
          style={[styles.button, isCalculating && styles.buttonDisabled]}
          onPress={handleCalculate}
          disabled={isCalculating}
        >
          {isCalculating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Calculate Profit Analysis</Text>
          )}
        </TouchableOpacity>

        {/* Results */}
        {analysisResult && (
          <View style={styles.results}>
            <Text style={styles.resultsTitle}>Analysis Results</Text>

            <View style={styles.resultSection}>
              <Text style={styles.sectionTitle}>Per Hectare (1 ha)</Text>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Revenue:</Text>
                <Text style={styles.resultValue}>
                  {formatCurrency(analysisResult.expectedRevenuePerHa)}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Material Cost:</Text>
                <Text style={styles.resultValue}>
                  {formatCurrency(analysisResult.materialCostPerHa)}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Other Costs:</Text>
                <Text style={styles.resultValue}>
                  {formatCurrency(analysisResult.otherServiceCostPerHa)}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Total Cost:</Text>
                <Text style={[styles.resultValue, styles.bold]}>
                  {formatCurrency(analysisResult.totalCostPerHa)}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, styles.bold]}>Profit:</Text>
                <Text style={[styles.resultValue, styles.bold, styles.profit]}>
                  {formatCurrency(analysisResult.profitPerHa)}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Profit Margin:</Text>
                <Text style={[styles.resultValue, styles.profit]}>
                  {analysisResult.profitMarginPerHa.toFixed(2)}%
                </Text>
              </View>
            </View>

            <View style={styles.resultSection}>
              <Text style={styles.sectionTitle}>
                Total for Area ({analysisResult.area} ha)
              </Text>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Revenue:</Text>
                <Text style={styles.resultValue}>
                  {formatCurrency(analysisResult.expectedRevenueForArea)}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Material Cost:</Text>
                <Text style={styles.resultValue}>
                  {formatCurrency(analysisResult.materialCostForArea)}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Other Costs:</Text>
                <Text style={styles.resultValue}>
                  {formatCurrency(analysisResult.otherServiceCostForArea)}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Total Cost:</Text>
                <Text style={[styles.resultValue, styles.bold]}>
                  {formatCurrency(analysisResult.totalCostForArea)}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, styles.bold]}>Profit:</Text>
                <Text style={[styles.resultValue, styles.bold, styles.profit]}>
                  {formatCurrency(analysisResult.profitForArea)}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Profit Margin:</Text>
                <Text style={[styles.resultValue, styles.profit]}>
                  {analysisResult.profitMarginForArea.toFixed(2)}%
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    color: colors.textPrimary,
  },
  section: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
    color: colors.textPrimary,
  },
  selectButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    minHeight: 50,
    justifyContent: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.lg,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },
  modalItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  modalItemSubtext: {
    color: colors.textSecondary,
  },
  modalCloseButton: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helperText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  buttonDisabled: {
    backgroundColor: colors.lightGray,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  results: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },
  resultSection: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    color: colors.primary,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  resultLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  resultValue: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  bold: {
    fontWeight: 'bold',
  },
  profit: {
    color: colors.success,
  },
  errorContainer: {
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  errorSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
