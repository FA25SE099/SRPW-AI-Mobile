import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { api } from './api-client';
import { env } from '@/configs/env';
import { tokenStorage } from './token-storage';
import {
  FarmerPlot,
  PlotCultivationPlan,
  PlotPlanView,
  PagedResult,
  TodayTaskResponse,
  CreateFarmLogRequest,
  CultivationTaskDetailResponse,
  FarmLogDetailResponse,
  CreateEmergencyReportRequest,
  PestDetectionResponse,
  StartTaskRequest,
  StartTaskResponse,
  FarmerProfileResponse,
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

type GetFarmLogsByCultivationParams = {
  plotCultivationId: string;
  currentPage?: number;
  pageSize?: number;
};

export const getFarmLogsByCultivation = async ({
  plotCultivationId,
  currentPage = 1,
  pageSize = 10,
}: GetFarmLogsByCultivationParams): Promise<PagedResult<FarmLogDetailResponse[]>> => {
  const response = await api.get<PagedResult<FarmLogDetailResponse[]>>(
    '/Farmlog/farm-logs/by-cultivation',
    {
      params: {
        PlotCultivationId: plotCultivationId,
        CurrentPage: currentPage,
        PageSize: pageSize,
      },
    },
  );

  return response as unknown as PagedResult<FarmLogDetailResponse[]>;
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
    const uri = Platform.OS === 'android' ? image.uri.replace('file://', '') : image.uri;
    formData.append('ProofImages', {
      uri,
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

export const createEmergencyReport = async (
  request: CreateEmergencyReportRequest,
  images: { uri: string; type: string; name: string }[],
): Promise<string> => {
  const formData = new FormData();

  // Add optional entity IDs
  if (request.plotCultivationId) {
    formData.append('PlotCultivationId', request.plotCultivationId);
  }
  if (request.groupId) {
    formData.append('GroupId', request.groupId);
  }
  if (request.clusterId) {
    formData.append('ClusterId', request.clusterId);
  }

  // Add required fields
  formData.append('AlertType', request.alertType);
  formData.append('Title', request.title);
  formData.append('Description', request.description);
  formData.append('Severity', request.severity);

  // Add AI detection results if available (flatten the structure for FormData)
  if (request.aiDetectionResult) {
    formData.append('AiDetectionResult.HasPest', String(request.aiDetectionResult.hasPest));
    formData.append('AiDetectionResult.TotalDetections', String(request.aiDetectionResult.totalDetections));
    formData.append('AiDetectionResult.AverageConfidence', String(request.aiDetectionResult.averageConfidence));
    
    if (request.aiDetectionResult.imageInfo) {
      formData.append('AiDetectionResult.ImageInfo.Width', String(request.aiDetectionResult.imageInfo.width));
      formData.append('AiDetectionResult.ImageInfo.Height', String(request.aiDetectionResult.imageInfo.height));
    }
    
    // Add detected pests as JSON string (FormData limitation)
    request.aiDetectionResult.detectedPests.forEach((pest, index) => {
      formData.append(`AiDetectionResult.DetectedPests[${index}].PestName`, pest.pestName);
      formData.append(`AiDetectionResult.DetectedPests[${index}].Confidence`, String(pest.confidence));
      formData.append(`AiDetectionResult.DetectedPests[${index}].ConfidenceLevel`, pest.confidenceLevel);
    });
  }

  // Add images
  for (const image of images) {
    formData.append('Images', {
      uri: image.uri,
      type: image.type,
      name: image.name,
    } as any);
  }

  // Use the correct endpoint: /Farmer/create-report
  const response = await api.post<string>('/Farmer/create-report', formData, {
    timeout: 120000,
  });
  
  return response as unknown as string;
};

export const detectPestInImage = async (
  imageFile: { uri: string; type: string; name: string },
): Promise<PestDetectionResponse> => {
  const formData = new FormData();

  // Backend expects 'files' (IFormFileCollection)
  formData.append('files', {
    uri: imageFile.uri,
    type: imageFile.type,
    name: imageFile.name,
  } as any);

  // AI image analysis can take 2+ minutes, so we need a longer timeout
  const response = await api.post<PestDetectionResponse[]>('/rice/check-pest', formData, {
    timeout: 240000, // 4 minutes timeout for AI processing
  });

  // Backend returns an array of results, we take the first one
  const results = response as unknown as PestDetectionResponse[];
  
  if (!results || results.length === 0) {
    throw new Error('No pest detection results returned from the server');
  }
  
  return results[0];
};

export const startTask = async (request: StartTaskRequest): Promise<StartTaskResponse> => {
  const response = await api.post<StartTaskResponse>('/farmer/cultivation-tasks/start', {
    cultivationTaskId: request.cultivationTaskId,
    weatherConditions: request.weatherConditions || null,
    notes: request.notes || null,
  });

  return response as unknown as StartTaskResponse;
};

export const getFarmerProfile = async (): Promise<FarmerProfileResponse> => {
  const response = await api.get<FarmerProfileResponse>('/Farmer/profile');

  return response as unknown as FarmerProfileResponse;
};

