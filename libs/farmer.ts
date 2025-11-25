import { api } from './api-client';
import {
  FarmerPlot,
  PlotCultivationPlan,
  PlotPlanView,
  PagedResult,
  TodayTaskResponse,
  CreateFarmLogRequest,
  CultivationTaskDetailResponse,
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

type GetTodayTasksParams = {
  plotId?: string;
  statusFilter?: string;
};

export const getTodayTasks = async ({
  plotId,
  statusFilter,
}: GetTodayTasksParams = {}): Promise<TodayTaskResponse[]> => {
  const response = await api.get<TodayTaskResponse[]>(
    '/farmer/cultivation-tasks/outstanding-tasks',
    {
      params: {
        PlotId: plotId,
        StatusFilter: statusFilter,
      },
    },
  );

  return response as unknown as TodayTaskResponse[];
};

export const getCultivationTaskDetail = async (
  cultivationTaskId: string,
): Promise<CultivationTaskDetailResponse> => {
  const response = await api.get<CultivationTaskDetailResponse>(
    `/farmer/cultivation-tasks/${cultivationTaskId}`,
  );

  return response as unknown as CultivationTaskDetailResponse;
};

export const createFarmLog = async (
  request: CreateFarmLogRequest,
  images: { uri: string; type: string; name: string }[],
): Promise<string> => {
  const formData = new FormData();

  // Add required fields
  formData.append('CultivationTaskId', request.cultivationTaskId);
  formData.append('PlotCultivationId', request.plotCultivationId);

  // Add optional fields
  if (request.workDescription) {
    formData.append('WorkDescription', request.workDescription);
  }
  if (request.actualAreaCovered !== undefined && request.actualAreaCovered !== null) {
    formData.append('ActualAreaCovered', request.actualAreaCovered.toString());
  }
  if (request.serviceCost !== undefined && request.serviceCost !== null) {
    formData.append('ServiceCost', request.serviceCost.toString());
  }
  if (request.serviceNotes) {
    formData.append('ServiceNotes', request.serviceNotes);
  }
  if (request.weatherConditions) {
    formData.append('WeatherConditions', request.weatherConditions);
  }
  if (request.interruptionReason) {
    formData.append('InterruptionReason', request.interruptionReason);
  }
  if (request.farmerId) {
    formData.append('FarmerId', request.farmerId);
  }

  // Add images
  images.forEach((image) => {
    formData.append('ProofImages', {
      uri: image.uri,
      type: image.type,
      name: image.name,
    } as any);
  });

  // Add materials
  if (request.materials && request.materials.length > 0) {
    request.materials.forEach((material, index) => {
      formData.append(`Materials[${index}].MaterialId`, material.materialId);
      formData.append(
        `Materials[${index}].ActualQuantityUsed`,
        material.actualQuantityUsed.toString(),
      );
      if (material.notes) {
        formData.append(`Materials[${index}].Notes`, material.notes);
      }
    });
  }

  // Axios will automatically set Content-Type with boundary for FormData
  const response = await api.post<string>('/Farmlog/farm-logs', formData);

  return response as unknown as string;
};

