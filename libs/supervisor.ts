/**
 * Supervisor API Functions
 * API calls for supervisor-specific features
 */

import { api } from './api-client';
import { 
  PagedResult, 
  StandardPlan,
  StandardPlanMaterialCostRequest,
  StandardPlanMaterialCostResponse,
  StandardPlanProfitAnalysisRequest,
  StandardPlanProfitAnalysisResponse 
} from '@/types/api';

// TODO: Define proper types based on backend API
export type SupervisedFarmer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  totalFields: number;
  activeTasks: number;
  completionRate: number;
  status: 'active' | 'needs-attention';
  lastActivity: string;
};

// Farmer type matching backend FarmerDTO
export type Farmer = {
  farmerId: string;
  fullName?: string;
  address?: string;
  phoneNumber?: string;
  isActive: boolean;
  isVerified: boolean;
  lastActivityAt?: string;
  farmCode?: string;
  plotCount: number;
};

export type GetSupervisorFarmersParams = {
  onlyAssigned?: boolean;
  currentPage?: number;
  pageSize?: number;
  searchTerm?: string;
};

export type SupervisorFarmersResponse = {
  succeeded: boolean;
  data: Farmer[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  message: string;
};

export type SupervisedTask = {
  id: string;
  taskName: string;
  farmerId: string;
  farmerName: string;
  plotId: string;
  plotName: string;
  status: 'pending-approval' | 'in-progress' | 'completed';
  priority: 'high' | 'normal' | 'low';
  dueDate: string;
  submittedDate: string | null;
};

export type SupervisedFarmLog = {
  id: string;
  farmerId: string;
  farmerName: string;
  plotId: string;
  plotName: string;
  taskName: string;
  loggedDate: string;
  completionPercentage: number;
  actualAreaCovered: number;
  workDescription: string | null;
  photoUrls: string[];
  status: 'pending' | 'approved' | 'rejected';
  materials: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
};

export type SupervisedAlert = {
  id: string;
  type: 'pest' | 'disease' | 'weather' | 'task';
  priority: 'critical' | 'high' | 'normal';
  farmerId: string;
  farmerName: string;
  plotId: string;
  plotName: string;
  title: string;
  description: string;
  date: string;
  status: 'read' | 'unread';
};

type GetSupervisedFarmersParams = {
  supervisorId: string;
  currentPage?: number;
  pageSize?: number;
  statusFilter?: 'all' | 'active' | 'needs-attention';
};

type GetSupervisedTasksParams = {
  supervisorId: string;
  status?: 'all' | 'pending-approval' | 'in-progress' | 'completed';
  currentPage?: number;
  pageSize?: number;
};

type GetSupervisedFarmLogsParams = {
  supervisorId: string;
  status?: 'all' | 'pending' | 'approved' | 'rejected';
  currentPage?: number;
  pageSize?: number;
};

type GetSupervisedAlertsParams = {
  supervisorId: string;
  priority?: 'all' | 'critical' | 'high' | 'normal';
  type?: 'all' | 'pest' | 'disease' | 'weather' | 'task';
  currentPage?: number;
  pageSize?: number;
};

/**
 * Get all farmers under supervisor's supervision
 */
export const getSupervisedFarmers = async (
  params: GetSupervisedFarmersParams,
): Promise<PagedResult<SupervisedFarmer[]>> => {
  // TODO: Replace with actual API endpoint when available
  // const response = await api.get<PagedResult<SupervisedFarmer[]>>(
  //   `/supervisor/${params.supervisorId}/farmers`,
  //   {
  //     params: {
  //       CurrentPage: params.currentPage || 1,
  //       PageSize: params.pageSize || 20,
  //       StatusFilter: params.statusFilter || 'all',
  //     },
  //   },
  // );
  // return response;
  throw new Error('API endpoint not implemented yet');
};

/**
 * Get all farmers under supervisor (simplified - using default params)
 */
export const getFarmers = async (params?: GetSupervisorFarmersParams): Promise<Farmer[]> => {
  const response = await api.post<SupervisorFarmersResponse>('/supervisor/farmers', {
    onlyAssigned: params?.onlyAssigned ?? true,
    currentPage: params?.currentPage ?? 1,
    pageSize: params?.pageSize ?? 100,
    searchTerm: params?.searchTerm,
  });
  
  if (response && 'data' in response && Array.isArray(response.data)) {
    return response.data;
  }
  return [];
};

/**
 * Get all farmers with pagination support
 */
export const getSupervisorFarmersWithPagination = async (
  params: GetSupervisorFarmersParams = {}
): Promise<SupervisorFarmersResponse> => {
  return api.post<SupervisorFarmersResponse>('/supervisor/farmers', {
    onlyAssigned: params.onlyAssigned ?? false,
    currentPage: params.currentPage ?? 1,
    pageSize: params.pageSize ?? 20,
    searchTerm: params.searchTerm,
  });
};

export type PlotStatus = 'Active' | 'PendingPolygon' | string;

export type PlotListResponse = {
  plotId: string;
  area: number;
  soThua?: number;
  soTo?: number;
  status: PlotStatus;
  groupId?: string;
  boundary?: string;
  coordinate?: string;
  groupName?: string;
  activeCultivations: number;
  activeAlerts: number;
  soilType?: string;
};

export type GetFarmerPlotsParams = {
  farmerId: string;
  currentPage?: number;
  pageSize?: number;
  status?: PlotStatus;
  isUnassigned?: boolean | null;
};

export type GetFarmerPlotsResponse = {
  succeeded: boolean;
  data: PlotListResponse[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  message: string;
};

/**
 * Get plots for a specific farmer
 */
export const getFarmerPlots = async (params: GetFarmerPlotsParams): Promise<PlotListResponse[]> => {
  const requestBody: any = {
    farmerId: params.farmerId,
    currentPage: params.currentPage || 1,
    pageSize: params.pageSize || 100,
  };

  if (params.status) {
    requestBody.status = params.status;
  }
  if (params.isUnassigned !== undefined && params.isUnassigned !== null) {
    requestBody.isUnassigned = params.isUnassigned;
  }

  const response = await api.post<GetFarmerPlotsResponse>('/Farmer/plots', requestBody);
  
  if (response && 'data' in response && Array.isArray(response.data)) {
    return response.data;
  }
  return [];
};

/**
 * Get plots for a specific farmer with pagination
 */
export const getFarmerPlotsWithPagination = async (
  params: GetFarmerPlotsParams
): Promise<GetFarmerPlotsResponse> => {
  const requestBody: any = {
    farmerId: params.farmerId,
    currentPage: params.currentPage || 1,
    pageSize: params.pageSize || 20,
  };

  if (params.status) {
    requestBody.status = params.status;
  }
  if (params.isUnassigned !== undefined && params.isUnassigned !== null) {
    requestBody.isUnassigned = params.isUnassigned;
  }

  return api.post<GetFarmerPlotsResponse>('/Farmer/plots', requestBody);
};

/**
 * Get all tasks from supervised farmers
 */
export const getSupervisedTasks = async (
  params: GetSupervisedTasksParams,
): Promise<PagedResult<SupervisedTask[]>> => {
  // TODO: Replace with actual API endpoint
  // const response = await api.get<PagedResult<SupervisedTask[]>>(
  //   `/supervisor/${params.supervisorId}/tasks`,
  //   {
  //     params: {
  //       Status: params.status || 'all',
  //       CurrentPage: params.currentPage || 1,
  //       PageSize: params.pageSize || 20,
  //     },
  //   },
  // );
  // return response;
  throw new Error('API endpoint not implemented yet');
};

/**
 * Get all farm logs from supervised farmers
 */
export const getSupervisedFarmLogs = async (
  params: GetSupervisedFarmLogsParams,
): Promise<PagedResult<SupervisedFarmLog[]>> => {
  // TODO: Replace with actual API endpoint
  // const response = await api.get<PagedResult<SupervisedFarmLog[]>>(
  //   `/supervisor/${params.supervisorId}/farm-logs`,
  //   {
  //     params: {
  //       Status: params.status || 'all',
  //       CurrentPage: params.currentPage || 1,
  //       PageSize: params.pageSize || 20,
  //     },
  //   },
  // );
  // return response;
  throw new Error('API endpoint not implemented yet');
};

/**
 * Get all alerts from supervised farmers
 */
export const getSupervisedAlerts = async (
  params: GetSupervisedAlertsParams,
): Promise<PagedResult<SupervisedAlert[]>> => {
  // TODO: Replace with actual API endpoint
  // const response = await api.get<PagedResult<SupervisedAlert[]>>(
  //   `/supervisor/${params.supervisorId}/alerts`,
  //   {
  //     params: {
  //       Priority: params.priority || 'all',
  //       Type: params.type || 'all',
  //       CurrentPage: params.currentPage || 1,
  //       PageSize: params.pageSize || 20,
  //     },
  //   },
  // );
  // return response;
  throw new Error('API endpoint not implemented yet');
};

/**
 * Approve a task completion
 */
export const approveTask = async (taskId: string, supervisorId: string): Promise<void> => {
  // TODO: Replace with actual API endpoint
  // await api.post(`/supervisor/${supervisorId}/tasks/${taskId}/approve`);
  throw new Error('API endpoint not implemented yet');
};

/**
 * Reject a task completion
 */
export const rejectTask = async (
  taskId: string,
  supervisorId: string,
  reason?: string,
): Promise<void> => {
  // TODO: Replace with actual API endpoint
  // await api.post(`/supervisor/${supervisorId}/tasks/${taskId}/reject`, { reason });
  throw new Error('API endpoint not implemented yet');
};

/**
 * Approve a farm log
 */
export const approveFarmLog = async (logId: string, supervisorId: string): Promise<void> => {
  // TODO: Replace with actual API endpoint
  // await api.post(`/supervisor/${supervisorId}/farm-logs/${logId}/approve`);
  throw new Error('API endpoint not implemented yet');
};

/**
 * Reject a farm log
 */
export const rejectFarmLog = async (
  logId: string,
  supervisorId: string,
  reason?: string,
): Promise<void> => {
  // TODO: Replace with actual API endpoint
  // await api.post(`/supervisor/${supervisorId}/farm-logs/${logId}/reject`, { reason });
  throw new Error('API endpoint not implemented yet');
};

/**
 * Get all plots under supervisor's supervision
 */
export const getSupervisedPlots = async (
  supervisorId: string,
): Promise<any[]> => {
  // TODO: Replace with actual API endpoint
  // const response = await api.get<any[]>(`/supervisor/${supervisorId}/plots`);
  // return response;
  throw new Error('API endpoint not implemented yet');
};

// Polygon Drawing Types
export type PolygonTaskStatus = 'Pending' | 'InProgress' | 'Completed' | 'Cancelled';

export type PolygonTask = {
  id: string;
  plotId: string;
  status: PolygonTaskStatus;
  assignedAt: string;
  completedAt: string | null;
  notes: string | null;
  priority: number | string;
  soThua: number | null;
  soTo: number | null;
  plotArea: number;
  soilType: string | null;
  farmerId: string;
  farmerName: string | null;
  farmerPhone: string | null;
};

export type PlotDTO = {
  plotId: string;
  farmerId: string;
  farmerName: string;
  groupId: string;
  boundaryGeoJson: string | null;
  coordinateGeoJson: string | null;
  soThua: number;
  soTo: number;
  area: number;
  soilType: string;
  status: PlotStatus;
  varietyName: string;
};

/**
 * Get polygon drawing tasks
 */
export const getPolygonTasks = async (): Promise<PolygonTask[]> => {
  const response = await api.get<PolygonTask[]>('/Supervisor/polygon-tasks?status=Pending');
  return Array.isArray(response) ? response : [];
};

/**
 * Get all plots
 */
export const getPlots = async (): Promise<PlotDTO[]> => {
  const response = await api.get<{
    succeeded: boolean;
    data: PlotDTO[];
    currentPage: number;
    totalCount: number;
  }>('/Plot?pageNumber=1&pageSize=500');
  
  if (response && 'data' in response && Array.isArray(response.data)) {
    return response.data;
  }
  return [];
};

/**
 * Complete a polygon drawing task
 */
export const completePolygonTask = async (
  taskId: string,
  polygonGeoJson: string,
  notes?: string,
): Promise<void> => {
  await api.post(`/Supervisor/polygon/${taskId}/complete`, {
    polygonGeoJson,
    notes,
  });
};

/**
 * Get priority text from priority value
 */
export const getPriorityText = (priority: number | string | undefined): string => {
  if (typeof priority === 'string') return priority;
  if (typeof priority === 'number') {
    switch (priority) {
      case 1:
        return 'High';
      case 2:
        return 'Medium';
      case 3:
        return 'Low';
      default:
        return 'Unknown';
    }
  }
  return 'Unknown';
};

/**
 * Get priority color from priority value
 */
export const getPriorityColor = (priority: number | string | undefined): string => {
  const text = getPriorityText(priority);
  switch (text) {
    case 'High':
      return '#EF4444'; // colors.error
    case 'Medium':
      return '#FF9500';
    case 'Low':
      return '#10B981'; // colors.success
    default:
      return '#6B7280'; // colors.textSecondary
  }
};

// Polygon Validation Types
export type ValidatePolygonAreaInput = {
  plotId: string;
  polygonGeoJson: string;
  tolerancePercent?: number;
};

export type ValidatePolygonAreaResponse = {
  succeeded: boolean;
  data: {
    isValid: boolean;
    drawnAreaHa: number;
    plotAreaHa: number;
    differencePercent: number;
    tolerancePercent: number;
    message: string;
  } | null;
  message: string | null;
  errors: string[];
};

/**
 * Validate polygon area against plot area
 * Note: API client unwraps Result<T> wrapper automatically
 */
export const validatePolygonArea = async ({
  plotId,
  polygonGeoJson,
  tolerancePercent = 10,
}: ValidatePolygonAreaInput): Promise<NonNullable<ValidatePolygonAreaResponse['data']>> => {
  const response = await api.post<ValidatePolygonAreaResponse>(
    '/Supervisor/polygon/validate-area',
    {
      plotId,
      polygonGeoJson,
      tolerancePercent,
    }
  );
  // API client already unwrapped the Result<T>, so response IS the data
  return response as any;
};

// Update Plot Types
export type UpdatePlotInput = {
  plotId: string;
  farmerId: string;
  groupId?: string | null;
  boundary?: string; // WKT Polygon format
  soThua?: number;
  soTo?: number;
  area: number;
  soilType?: string | null;
  coordinate?: string | null; // WKT Point format
  status: 0 | 1; // 0 = Active, 1 = PendingPolygon
};

export type UpdatePlotResponse = {
  succeeded: boolean;
  message: string;
  data: {
    plotId: string;
    farmerId: string;
    groupId?: string;
    boundary: string;
    soThua?: number;
    soTo?: number;
    area: number;
    soilType?: string;
    coordinate?: string;
    status: number;
  } | null;
  errors: string[] | null;
};

/**
 * Update plot information including boundary
 * Note: API client unwraps Result<T> wrapper automatically
 */
export const updatePlot = async (data: UpdatePlotInput): Promise<NonNullable<UpdatePlotResponse['data']>> => {
  const response = await api.put<UpdatePlotResponse>('/Plot', data);
  // API client already unwrapped the Result<T>, so response IS the data
  return response as any;
};

/**
 * Get all standard plans (from expert role)
 * Note: API returns array directly, not PagedResult
 */
export const getStandardPlans = async (): Promise<StandardPlan[]> => {
  const response = await api.get<StandardPlan[]>('/StandardPlan');
  return Array.isArray(response) ? response : [];
};

/**
 * Calculate material cost for a standard plan
 */
export const calculateStandardPlanMaterialCost = async (
  request: StandardPlanMaterialCostRequest
): Promise<StandardPlanMaterialCostResponse> => {
  const response = await api.post<StandardPlanMaterialCostResponse>(
    '/Material/calculate-standard-plan-material-cost',
    request
  );
  return response as unknown as StandardPlanMaterialCostResponse;
};

/**
 * Calculate profit analysis for a standard plan
 */
export const calculateStandardPlanProfitAnalysis = async (
  request: StandardPlanProfitAnalysisRequest
): Promise<StandardPlanProfitAnalysisResponse> => {
  const response = await api.post<StandardPlanProfitAnalysisResponse>(
    '/Material/calculate-standard-plan-profit-analysis',
    request
  );
  return response as unknown as StandardPlanProfitAnalysisResponse;
};


