import { api } from './api-client';
import {
  PagedResult,
  UavServiceOrder,
  UavOrderDetail,
  ReportServiceOrderCompletionRequest,
} from '@/types/api';

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

type ReportUavOrderCompletionParams = {
  request: ReportServiceOrderCompletionRequest;
  proofFiles: { uri: string; type: string; name: string }[];
};

export const reportUavOrderCompletion = async ({
  request,
  proofFiles,
}: ReportUavOrderCompletionParams): Promise<string> => {
  const formData = new FormData();
  formData.append('OrderId', request.orderId);
  formData.append('PlotId', request.plotId);
  if (request.vendorId) {
    formData.append('VendorId', request.vendorId);
  }
  formData.append('ActualCost', request.actualCost.toString());
  formData.append('ActualAreaCovered', request.actualAreaCovered.toString());
  if (request.notes) {
    formData.append('Notes', request.notes);
  }

  proofFiles.forEach((file) => {
    formData.append('ProofFiles', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);
  });

  const response = await api.post<string>(
    `/uav/orders/${request.orderId}/plots/${request.plotId}/report`,
    formData,
  );

  return response as unknown as string;
};


