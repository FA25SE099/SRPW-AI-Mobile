import { api } from './api-client';
import {
  FarmerPlot,
  PlotCultivationPlan,
  PlotPlanView,
  PagedResult,
} from '@/types/api';

type GetFarmerPlotsParams = {
  currentPage?: number;
  pageSize?: number;
};

export const getCurrentFarmerPlots = async ({
  currentPage = 1,
  pageSize = 10,
}: GetFarmerPlotsParams = {}): Promise<FarmerPlot[]> => {
  const response = await api.get<FarmerPlot[]>('/Plot/get-current-farmer-plots', {
    params: { CurrentPage: currentPage, PageSize: pageSize },
  });

  return response as unknown as FarmerPlot[];
};

export const getPlotCultivationPlans = async (
  plotId: string,
  { currentPage = 1, pageSize = 10 }: GetFarmerPlotsParams = {},
): Promise<PagedResult<PlotCultivationPlan[]>> => {
  const response = await api.get<PagedResult<PlotCultivationPlan[]>>(
    `/cultivation-plan/by-plot/${plotId}`,
    {
      params: { CurrentPage: currentPage, PageSize: pageSize },
    },
  );

  return response as unknown as PagedResult<PlotCultivationPlan[]>;
};

export const getPlotPlanView = async (
  plotCultivationId: string,
): Promise<PlotPlanView> => {
  const response = await api.get<PlotPlanView>(
    `/cultivation-plan/plan-view/${plotCultivationId}`,
  );

  return response as unknown as PlotPlanView;
};

