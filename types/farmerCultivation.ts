export interface RiceVarietySeason {
  riceVarietyId: string;
  varietyName: string;
  growthDurationDays: number;
  expectedYieldPerHectare: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  isRecommended: boolean;
  seasonalNotes?: string;
  optimalPlantingStart?: string;
  optimalPlantingEnd?: string;
}

export interface CultivationValidation {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  recommendations: ValidationRecommendation[];
  estimatedHarvestDate?: string;
  growthDurationDays?: number;
  expectedYield?: number;
  estimatedRevenue?: number;
}

export interface ValidationIssue {
  code: string;
  message: string;
  severity: 'Error' | 'Warning' | 'Info';
}

export interface ValidationRecommendation {
  code: string;
  message: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface PlotCultivationSelection {
  plotId: string;
  plotName: string;
  plotArea: number;
  isConfirmed: boolean;
  riceVarietyId?: string;
  riceVarietyName?: string;
  plantingDate?: string;
  estimatedHarvestDate?: string;
  expectedYield?: number;
  selectionDate?: string;
}

export interface FarmerCultivationSelections {
  yearSeasonId: string;
  seasonName: string;
  year: number;
  selectionDeadline?: string;
  daysUntilDeadline: number;
  totalPlots: number;
  confirmedPlots: number;
  pendingPlots: number;
  selections: PlotCultivationSelection[];
}

export interface YearSeason {
  id: string;
  seasonId: string;
  seasonName: string;
  seasonType: string;
  clusterId: string;
  clusterName: string;
  year: number;
  riceVarietyId?: string;
  riceVarietyName?: string;
  startDate: string;
  endDate: string;
  breakStartDate?: string;
  breakEndDate?: string;
  planningWindowStart: string;
  planningWindowEnd: string;
  status: string;
  notes?: string;
  managedByExpertId?: string;
  managedByExpertName?: string;
  groupCount: number;
  daysUntilStart: number;
  daysUntilEnd: number;
  isInPlanningWindow: boolean;
  displayName: string;
}

export interface ActiveYearSeasonsResponse {
  activeSeasons: YearSeason[];
  totalCount: number;
}

export interface SelectCultivationPreferencesRequest {
  plotId: string;
  yearSeasonId: string;
  riceVarietyId: string;
  preferredPlantingDate: string;
  notes?: string;
}

export interface ValidateCultivationPreferencesRequest {
  plotId: string;
  yearSeasonId: string;
  riceVarietyId: string;
  preferredPlantingDate: string;
}

export interface CultivationPreferenceResponse {
  plotCultivationId: string;
  plotId: string;
  yearSeasonId: string;
  riceVarietyId: string;
  riceVarietyName: string;
  plantingDate: string;
  estimatedHarvestDate: string;
  expectedYield: number;
  estimatedRevenue: number;
  isConfirmed: boolean;
  selectionDate: string;
}

