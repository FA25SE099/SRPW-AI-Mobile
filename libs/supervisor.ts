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
  }, { timeout: 15000 });
  
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
  }, { timeout: 15000 });
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

  const response = await api.post<GetFarmerPlotsResponse>('/Farmer/plots', requestBody, { timeout: 15000 });
  
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

  return api.post<GetFarmerPlotsResponse>('/Farmer/plots', requestBody, { timeout: 15000 });
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
  const response = await api.get<PolygonTask[]>('/Supervisor/polygon-tasks?status=Pending', { timeout: 15000 });
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
  }>('/Plot?pageNumber=1&pageSize=500', { timeout: 15000 });
  
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

// ===================================
// Production Plans Types & API
// ===================================

// Group types for accessing production plans
export type SupervisorGroup = {
  groupId: string;
  groupName: string;
  clusterId?: string;
  clusterName?: string;
  seasonId: string;
  seasonName: string;
  seasonYear: number;
  riceVarietyId?: string;
  riceVarietyName?: string;
  plantingDate?: string;
  totalArea: number;
  totalPlots: number;
  plotsWithPolygon: number;
  plotsMissingPolygon: number;
  productionPlansCount: number;
  activePlansCount: number;
  draftPlansCount: number;
  approvedPlansCount: number;
  status: 'Active' | 'Inactive' | 'Completed';
  createdAt: string;
};

export type ProductionPlan = {
  productionPlanId: string;
  planName: string;
  groupId: string;
  groupName: string;
  seasonId: string;
  seasonName: string;
  seasonYear: number;
  riceVarietyId: string;
  riceVarietyName: string;
  standardPlanId: string;
  standardPlanName: string;
  status: 'Draft' | 'PendingApproval' | 'Approved' | 'InProgress' | 'Completed' | 'Cancelled';
  startDate: string;
  actualStartDate?: string;
  estimatedEndDate?: string;
  actualEndDate?: string;
  totalArea: number;
  totalPlots: number;
  totalEstimatedCost: number;
  totalActualCost?: number;
  estimatedYield?: number;
  actualYield?: number;
  overallProgressPercentage: number;
  totalTasks: number;
  completedTasks: number;
  createdAt: string;
  createdBy: string;
  lastModified?: string;
};

export type ProductionPlanStage = {
  stageId: string;
  stageName: string;
  description?: string;
  sequenceOrder: number;
  startDay: number;
  endDay: number;
  progressPercentage: number;
  tasks: ProductionPlanTask[];
};

export type ProductionPlanMaterial = {
  materialId: string;
  materialName: string;
  materialType?: string;
  quantityPerHa: number;
  unit: string;
  estimatedAmount?: number;
  unitPrice?: number;
  totalCost?: number;
};

export type ProductionPlanTask = {
  taskId: string;
  taskName: string;
  taskType: string;
  description?: string;
  priority: string;
  sequenceOrder: number;
  scheduledDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  estimatedCost: number;
  totalActualCost?: number;
  status: string;
  progressPercentage?: number;
  assignedTo?: string;
  materials: ProductionPlanMaterial[];
};

export type PlotProgress = {
  plotId: string;
  plotName: string;
  area: number;
  cultivationPlanId?: string;
  startDate?: string;
  progressPercentage: number;
  currentStage?: string;
  completedTasks: number;
  totalTasks: number;
  status: 'NotStarted' | 'InProgress' | 'Completed';
};

export type EconomicsDetail = {
  totalEstimatedRevenue: number;
  totalEstimatedCost: number;
  estimatedProfit: number;
  estimatedProfitMargin: number;
  totalActualRevenue?: number;
  totalActualCost?: number;
  actualProfit?: number;
  actualProfitMargin?: number;
  costBreakdown: {
    materialCost: number;
    laborCost: number;
    equipmentCost: number;
    otherCost: number;
  };
};

export type ProductionPlanDetail = {
  productionPlanId: string;
  planName: string;
  groupId: string;
  groupName: string;
  seasonId: string;
  seasonName: string;
  seasonYear: number;
  riceVarietyId: string;
  riceVarietyName: string;
  standardPlanId: string;
  standardPlanName: string;
  status: string;
  startDate: string;
  actualStartDate?: string;
  estimatedEndDate?: string;
  actualEndDate?: string;
  totalArea: number;
  totalPlots: number;
  totalEstimatedCost: number;
  totalActualCost?: number;
  estimatedYield?: number;
  actualYield?: number;
  overallProgressPercentage: number;
  totalTasks: number;
  completedTasks: number;
  daysElapsed: number;
  stages: ProductionPlanStage[];
  plotsProgress: PlotProgress[];
  economicsDetail?: EconomicsDetail;
  createdAt: string;
  createdBy: string;
  lastModified?: string;
};

export type FarmLogByTask = {
  farmLogId: string;
  plotId: string;
  plotName: string;
  farmerName: string;
  farmerId: string;
  taskName: string;
  logDate: string;
  workDescription?: string;
  actualAreaCovered: number;
  completionPercentage: number;
  actualCost?: number;
  materials: Array<{
    materialName: string;
    quantity: number;
    unit: string;
    cost?: number;
  }>;
  photoUrls: string[];
  status: 'Pending' | 'Approved' | 'Rejected';
  notes?: string;
};

// Group Detail Types (matching web app)
export type GroupPlotDetail = {
  id: string;
  area: string;
  soThua: string;
  soTo: string;
  soilType: string;
  status: string;
  farmerName: string;
};

export type GroupProductionPlan = {
  id: string;
  planName: string;
  basePlantingDate: string;
  status: string;
  totalArea: number;
};

export type GroupDetail = {
  id: string;
  clusterName: string;
  seasonId: string;
  plantingDate: string;
  status: string;
  totalArea: number;
  riceVarietyName: string;
  supervisorName: string;
  plots: GroupPlotDetail[];
  productionPlans: GroupProductionPlan[];
};

/**
 * Get full group details including production plans
 * This matches the web app's approach: GET /Group/{groupId}
 */
export const getGroupDetail = async (groupId: string): Promise<GroupDetail> => {
  const response = await api.get<GroupDetail>(`/Group/${groupId}`, { timeout: 15000 });
  return response;
};

/**
 * Get all groups assigned to supervisor
 */
export const getSupervisorGroups = async (): Promise<SupervisorGroup[]> => {
  const response = await api.get<SupervisorGroup[]>('/supervisor/group-by-season', { timeout: 15000 });
  
  if (Array.isArray(response)) {
    return response;
  }
  return [];
};

/**
 * Get production plans for a specific group
 * Uses the group detail endpoint which includes production plans
 */
export const getGroupProductionPlans = async (groupId: string): Promise<ProductionPlan[]> => {
  console.log('🔍 [getGroupProductionPlans] Fetching plans for groupId:', groupId);
  
  try {
    const groupDetail = await getGroupDetail(groupId);
    const plans = groupDetail.productionPlans || [];
    console.log('✅ [getGroupProductionPlans] Found', plans.length, 'plans');
    
    // Map the simple GroupProductionPlan to full ProductionPlan format
    // Note: This is a simplified version. Full details come from getProductionPlanDetail
    return plans.map(plan => ({
      productionPlanId: plan.id,
      planName: plan.planName,
      status: plan.status as any,
      totalArea: plan.totalArea,
      startDate: plan.basePlantingDate,
      // Add placeholder values for required fields
      groupId: groupId,
      groupName: groupDetail.clusterName || '',
      seasonId: groupDetail.seasonId || '',
      seasonName: '',
      seasonYear: new Date().getFullYear(),
      riceVarietyId: '',
      riceVarietyName: groupDetail.riceVarietyName || '',
      standardPlanId: '',
      standardPlanName: '',
      totalPlots: groupDetail.plots?.length || 0,
      totalEstimatedCost: 0,
      overallProgressPercentage: 0,
      totalTasks: 0,
      completedTasks: 0,
      createdAt: '',
      createdBy: '',
    }));
  } catch (error) {
    console.error('❌ [getGroupProductionPlans] Error:', error);
    return [];
  }
};

/**
 * Get all production plans for supervisor (fetches from all assigned groups)
 */
export const getProductionPlans = async (params?: {
  groupId?: string;
  status?: string;
  currentPage?: number;
  pageSize?: number;
}): Promise<ProductionPlan[]> => {
  // If groupId is specified, fetch plans for that group
  if (params?.groupId) {
    return getGroupProductionPlans(params.groupId);
  }

  // Otherwise, fetch all groups and their plans
  const groups = await getSupervisorGroups();
  const allPlans: ProductionPlan[] = [];

  for (const group of groups) {
    try {
      const plans = await getGroupProductionPlans(group.groupId);
      allPlans.push(...plans);
    } catch (error) {
      console.error(`Failed to fetch plans for group ${group.groupId}:`, error);
    }
  }

  // Apply status filter if provided
  let filteredPlans = allPlans;
  if (params?.status) {
    filteredPlans = allPlans.filter(plan => plan.status === params.status);
  }

  return filteredPlans;
};

/**
 * Get detailed production plan information
 */
export const getProductionPlanDetail = async (
  planId: string
): Promise<ProductionPlanDetail> => {
  const response = await api.get<ProductionPlanDetail>(
    `/supervisor/plan/${planId}/details`,
    { timeout: 15000 }
  );
  return response;
};

/**
 * Get farm logs by production plan task
 */
export const getFarmLogsByProductionPlanTask = async (params: {
  productionPlanTaskId: string;
  currentPage?: number;
  pageSize?: number;
}): Promise<{
  data: FarmLogByTask[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
}> => {
  const response = await api.post<PagedResult<FarmLogByTask[]>>('/farmlog/farm-logs/by-production-plan-task', {
    productionPlanTaskId: params.productionPlanTaskId,
    currentPage: params.currentPage ?? 1,
    pageSize: params.pageSize ?? 10,
  }, { timeout: 15000 });

  if (response && Array.isArray(response.data)) {
    return {
      data: response.data,
      totalCount: response.totalCount || 0,
      currentPage: response.currentPage || 1,
      pageSize: response.pageSize || 10,
    };
  }

  return {
    data: [],
    totalCount: 0,
    currentPage: 1,
    pageSize: 10,
  };
};

/**
 * Get plot cultivation plan details
 */
export const getPlotCultivationPlan = async (params: {
  plotId: string;
  productionPlanId: string;
}): Promise<any> => {
  const response = await api.get(
    `/CultivationPlan/plot/${params.plotId}/production-plan/${params.productionPlanId}`,
    { timeout: 15000 }
  );
  return response;
};

// Cultivation Plan Types
export type CultivationPlanMaterial = {
  materialId: string;
  materialName: string;
  plannedQuantity: number;
  actualQuantity: number;
  unit: string;
};

export type CultivationPlanTask = {
  taskId: string;
  taskName: string;
  taskType: string;
  taskDescription?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  status: string;
  priority: string;
  orderIndex: number;
  materials: CultivationPlanMaterial[];
};

export type CultivationPlanStage = {
  stageId: string;
  stageName: string;
  sequenceOrder: number;
  description?: string;
  typicalDurationDays: number;
  tasks: CultivationPlanTask[];
};

export type CultivationPlanProgress = {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  completionPercentage: number;
  daysElapsed: number;
  estimatedDaysRemaining: number;
};

export type CultivationPlanDetail = {
  plotCultivationId: string;
  plotId: string;
  plotName: string;
  plotArea: number;
  seasonId: string;
  seasonName: string;
  seasonStartDate?: string;
  seasonEndDate?: string;
  riceVarietyId: string;
  riceVarietyName: string;
  riceVarietyDescription?: string;
  plantingDate?: string;
  expectedYield?: number;
  actualYield?: number;
  cultivationArea: number;
  status: string;
  productionPlanId: string;
  productionPlanName: string;
  productionPlanDescription?: string;
  activeVersionId?: string;
  activeVersionName?: string;
  stages: CultivationPlanStage[];
  progress: CultivationPlanProgress;
};

export type FarmLogMaterialUsed = {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  costPerUnit?: number;
  totalCost?: number;
};

export type FarmLogByCultivation = {
  farmLogId: string;
  taskName: string;
  taskType: string;
  logDate: string;
  notes?: string;
  farmerName: string;
  materialsUsed: FarmLogMaterialUsed[];
  serviceCost?: number;
  totalCost?: number;
};

/**
 * Get cultivation plan by group and plot
 */
export const getCultivationPlanByGroupPlot = async (params: {
  plotId: string;
  groupId: string;
}): Promise<CultivationPlanDetail> => {
  console.log('🔍 [getCultivationPlanByGroupPlot] Fetching cultivation plan for:', params);
  
  // API client interceptor already unwraps the Result<T> wrapper
  // So response is the CultivationPlanDetail object directly
  const response = await api.post<CultivationPlanDetail>('/cultivation-plan/by-group-plot', params, { timeout: 15000 });
  
  if (!response) {
    console.log('❌ [getCultivationPlanByGroupPlot] Failed: No data returned');
    throw new Error('Failed to load cultivation plan');
  }
  
  console.log('✅ [getCultivationPlanByGroupPlot] Success:', {
    plotId: response.plotId,
    stages: response.stages?.length || 0,
    totalTasks: response.progress?.totalTasks,
  });
  
  return response;
};

/**
 * Get farm logs by cultivation (plot cultivation)
 */
export const getFarmLogsByCultivation = async (params: {
  plotCultivationId: string;
  currentPage?: number;
  pageSize?: number;
}): Promise<{
  data: FarmLogByCultivation[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
}> => {
  console.log('🔍 [getFarmLogsByCultivation] Fetching farm logs for:', params);
  
  // For PagedResult, the interceptor returns the full object (including pagination fields)
  // It does NOT unwrap to just .data, but it does strip the axios response wrapper
  const response = await api.post<PagedResult<FarmLogByCultivation[]>>('/farmlog/farm-logs/by-cultivation', {
    plotCultivationId: params.plotCultivationId,
    currentPage: params.currentPage ?? 1,
    pageSize: params.pageSize ?? 10,
  }, { timeout: 15000 });

  if (response && Array.isArray(response.data)) {
    console.log('✅ [getFarmLogsByCultivation] Success:', {
      logsCount: response.data.length,
      totalCount: response.totalCount,
    });
    
    return {
      data: response.data,
      totalCount: response.totalCount || 0,
      currentPage: response.currentPage || 1,
      pageSize: response.pageSize || 10,
    };
  }

  return {
    data: [],
    totalCount: 0,
    currentPage: 1,
    pageSize: 10,
  };
};
