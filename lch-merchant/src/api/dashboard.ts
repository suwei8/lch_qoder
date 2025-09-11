// 仪表盘数据API
import request from '@/utils/request';
import type { 
  DashboardStats,
  RevenueOverview,
  DeviceOverview,
  OrderStats,
  RecentActivity,
  SystemStatus,
  DeviceAlert
} from '@/types/dashboard';

export const dashboardApi = {
  // 获取仪表盘概览统计
  getOverviewStats(): Promise<DashboardStats> {
    return request.get('/merchants/dashboard/overview');
  },

  // 获取营收概览数据
  getRevenueOverview(): Promise<RevenueOverview> {
    return request.get('/merchants/dashboard/revenue-overview');
  },

  // 获取设备总览数据
  getDeviceOverview(): Promise<DeviceOverview> {
    return request.get('/merchants/dashboard/device-overview');
  },

  // 获取订单统计数据
  getOrderOverview(): Promise<OrderStats> {
    return request.get('/merchants/dashboard/order-overview');
  },

  // 获取实时数据
  getRealTimeData(): Promise<{
    activeOrders: number;
    workingDevices: number;
    currentRevenue: number;
    onlineUsers: number;
  }> {
    return request.get('/merchants/dashboard/realtime');
  },

  // 获取待处理任务
  getPendingTasks(): Promise<Array<{
    id: string;
    type: string;
    title: string;
    time: string;
    device_name?: string;
    order_no?: string;
  }>> {
    return request.get('/merchants/dashboard/pending-tasks');
  },

  // 获取营收趋势数据
  getRevenueTrend(period: 'week' | 'month' | 'quarter' = 'month'): Promise<Array<{
    date: string;
    revenue: number;
  }>> {
    return request.get('/merchants/dashboard/revenue-trend', { params: { period } });
  },

  // 获取设备使用率统计
  getDeviceUsage(): Promise<Array<{
    deviceId: number;
    deviceName: string;
    todayOrders: number;
    utilizationRate: number;
  }>> {
    return request.get('/merchants/dashboard/device-usage');
  },

  // 获取客户统计
  getCustomerStats(): Promise<{
    todayActive: number;
    monthlyActive: number;
    total: number;
    retention: number;
  }> {
    return request.get('/merchants/dashboard/customer-stats');
  }
};