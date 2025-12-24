import { api, uploadFile } from './api-client';
import {
  PagedResult,
  UavServiceOrder,
  UavOrderDetail,
  ReportServiceOrderCompletionRequest,
} from '@/types/api';

export type UavVendorProfile = {
  uavVendorId: string;
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  vendorName: string;
  businessRegistrationNumber: string;
  serviceRatePerHa: number;
  fleetSize: number;
  serviceRadius: number;
  equipmentSpecs: string;
  operatingSchedule: string;
  isActive: boolean;
  createdAt: string;
};

type GetUavServiceOrdersParams = {
  currentPage?: number;
  pageSize?: number;
  statusFilter?: string;
};

export const getUavServiceOrders = async ({
  currentPage = 1,
  pageSize = 20,
  statusFilter,
}: GetUavServiceOrdersParams = {}): Promise<PagedResult<UavServiceOrder[]>> => {
  const response = await api.get<PagedResult<UavServiceOrder[]>>('/uav/orders', {
    params: {
      CurrentPage: currentPage,
      PageSize: pageSize,
      StatusFilter: statusFilter,
    },
  });

  return response as unknown as PagedResult<UavServiceOrder[]>;
};

export const getUavOrderDetail = async (orderId: string): Promise<UavOrderDetail> => {
  const response = await api.get<UavOrderDetail>(`/uav/orders/${orderId}`);
  return response as unknown as UavOrderDetail;
};

export const getUavVendorProfile = async (): Promise<UavVendorProfile> => {
  const response = await api.get<UavVendorProfile>('/uavvendor/profile');
  return response as unknown as UavVendorProfile;
};

type ReportUavOrderCompletionParams = {
  request: ReportServiceOrderCompletionRequest;
  proofFiles: { uri: string; type: string; name: string }[];
};

export const reportUavOrderCompletion = async ({
  request,
  proofFiles,
}: ReportUavOrderCompletionParams): Promise<string> => {
  const formData = new FormData();
  
  // Add required fields
  formData.append('OrderId', request.orderId);
  formData.append('PlotId', request.plotId);
  formData.append('ActualCost', request.actualCost.toString());
  formData.append('ActualAreaCovered', request.actualAreaCovered.toString());
  
  // Add optional fields
  if (request.vendorId) {
    formData.append('VendorId', request.vendorId);
  }
  if (request.notes) {
    formData.append('Notes', request.notes);
  }

  // Normalize proof files to ensure proper content-type headers
  for (const file of proofFiles) {
    const fileName = file.name || file.uri.split('/').pop() || `proof_${Date.now()}.jpg`;
    const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    
    // Determine proper MIME type based on extension
    let fileType: string;
    if (ext === 'png') {
      fileType = 'image/png';
    } else if (ext === 'jpg' || ext === 'jpeg') {
      fileType = 'image/jpeg';
    } else {
      // Default to jpeg for unknown extensions
      fileType = 'image/jpeg';
    }
    
    formData.append('ProofFiles', {
      uri: file.uri,
      type: fileType,
      name: fileName,
    } as any);
  }

  // Use uploadFile helper for better Android FormData support (like createFarmLog and createEmergencyReport)
  console.log('📤 [reportUavOrderCompletion] Sending POST request to /uav/orders/report');
  console.log('📦 [reportUavOrderCompletion] FormData fields:', {
    orderId: request.orderId,
    plotId: request.plotId,
    hasVendorId: !!request.vendorId,
    hasNotes: !!request.notes,
    proofFilesCount: proofFiles.length,
  });

  try {
    const response = await uploadFile(
      `/uav/orders/${request.orderId}/plots/${request.plotId}/report`,
      formData,
    );
    console.log('✅ [reportUavOrderCompletion] Success');
    return response as unknown as string;
  } catch (error: any) {
    console.error('❌ [reportUavOrderCompletion] Error:', {
      status: error?.status || error?.response?.status,
      statusText: error?.statusText || error?.response?.statusText,
      data: error?.response?.data || error?.data,
      message: error?.message,
    });
    throw error;
  }
};


