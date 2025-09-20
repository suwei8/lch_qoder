import request from '@/utils/request';

export interface ExportOrderParams {
  keyword?: string;
  status?: string;
  payment_method?: string;
  user_id?: number;
  merchant_id?: number;
  device_id?: number;
  start_date?: string;
  end_date?: string;
  format?: 'excel' | 'csv';
}

export const exportApi = {
  // 导出订单数据
  exportOrders: (params: ExportOrderParams): Promise<Blob> => {
    return request.get('/orders/export', { 
      params,
      responseType: 'blob'
    });
  },

  // 导出退款报告
  exportRefundReport: (params: {
    start_date?: string;
    end_date?: string;
    format?: 'excel' | 'csv';
  }): Promise<Blob> => {
    return request.get('/payments/refund/export', {
      params,
      responseType: 'blob'
    });
  },

  // 导出订单统计报告
  exportOrderStats: (params: {
    period?: 'daily' | 'weekly' | 'monthly';
    start_date?: string;
    end_date?: string;
  }): Promise<Blob> => {
    return request.get('/orders/stats/export', {
      params,
      responseType: 'blob'
    });
  }
};