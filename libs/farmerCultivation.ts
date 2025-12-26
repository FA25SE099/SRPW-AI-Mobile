import { api } from './api-client';
import {
  RiceVarietySeason,
  CultivationValidation,
  FarmerCultivationSelections,
  SelectCultivationPreferencesRequest,
  ValidateCultivationPreferencesRequest,
  CultivationPreferenceResponse,
  YearSeason,
  ActiveYearSeasonsResponse,
} from '@/types/farmerCultivation';
import { Result } from '@/types/api';

export const getAvailableVarietiesForSeason = async (
  seasonId: string,
  onlyRecommended: boolean = true
): Promise<RiceVarietySeason[]> => {
  const response = await api.get<RiceVarietySeason[]>(
    `/farmer/cultivation/season/${seasonId}/available-varieties`,
    {
      params: { OnlyRecommended: onlyRecommended },
    }
  );

  return response as unknown as RiceVarietySeason[];
};

export const validateCultivationPreferences = async (
  request: ValidateCultivationPreferencesRequest
): Promise<CultivationValidation> => {
  const response = await api.post<CultivationValidation>(
    '/farmer/cultivation/validate',
    request
  );

  return response as unknown as CultivationValidation;
};

export const selectCultivationPreferences = async (
  request: SelectCultivationPreferencesRequest
): Promise<CultivationPreferenceResponse> => {
  const response = await api.post<CultivationPreferenceResponse>(
    '/farmer/cultivation/select',
    request
  );

  return response as unknown as CultivationPreferenceResponse;
};

export const getFarmerCultivationSelections = async (
  farmerId: string,
  yearSeasonId: string
): Promise<FarmerCultivationSelections> => {
  const response = await api.get<FarmerCultivationSelections>(
    `/farmer/cultivation/my-selections/${yearSeasonId}`,
    {
      params: { FarmerId: farmerId },
    }
  );

  return response as unknown as FarmerCultivationSelections;
};

export const getActiveYearSeasons = async (
  clusterId?: string,
  year?: number
): Promise<YearSeason[]> => {
  const params: any = {};
  if (clusterId) params.clusterId = clusterId;
  if (year) params.year = year;

  const response = await api.get<ActiveYearSeasonsResponse>('/YearSeason/active', {
    params,
  });

  const data = response as unknown as ActiveYearSeasonsResponse;
  return data.activeSeasons || [];
};

export const getYearSeasonById = async (yearSeasonId: string): Promise<YearSeason> => {
  const response = await api.get<YearSeason>(`/YearSeason/${yearSeasonId}`);

  return response as unknown as YearSeason;
};

