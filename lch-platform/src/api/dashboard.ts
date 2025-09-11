import request from '@/utils/request';

export interface DashboardStats {
  totalMerchants: number;
  totalDevices: number;
  totalUsers: number;
  todayOrders: number;
  todayRevenue: number;
  onlineDevices: number;
  activeUsers: number;
  merchantGrowth: number;
  orderGrowth: number;
  revenueGrowth: number;
}

export interface RealtimeData {
  activeUsers: number;
  processingOrders: number;
  workingDevices: number;
  hourlyRevenue: number;
}

export interface RevenueChartData {
  dates: string[];
  revenue: number[];
  orders: number[];
}

export interface RecentOrder {
  orderNo: string;
  userName: string;
  deviceName: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface TopRegion {
  name: string;
  count: number;
  percentage: number;
}

export const dashboardApi = {
  // 获取仪表盘统计数据
  getStats: (): Promise<DashboardStats> => {
    return request.get('/dashboard/stats');
  },

  // 获取实时数据
  getRealtimeData: (): Promise<RealtimeData> => {
    return request.get('/dashboard/realtime');
  },

  // 获取营收趋势数据
  getRevenueChart: (period: '7d' | '30d' | '90d' = '30d'): Promise<RevenueChartData> => {
    return request.get('/dashboard/revenue-chart', { params: { period } });
  },

  // 获取最近订单
  getRecentOrders: (limit: number = 10): Promise<RecentOrder[]> => {
    return request.get('/dashboard/recent-orders', { params: { limit } });
  },

  // 获取热门地区统计  
  getTopRegions: (limit: number = 5): Promise<TopRegion[]> => {
    return request.get('/dashboard/top-regions', { params: { limit } });
  },

  // 获取订单状态分布
  getOrderStatusDistribution: (): Promise<Array<{ name: string; value: number; }>> => {
    return request.get('/dashboard/order-status');
  },

  // 获取设备利用率
  getDeviceUtilization: (): Promise<Array<{ name: string; value: number; }>> => {
    return request.get('/dashboard/device-utilization');
  },

  // 获取转化漏斗数据
  getConversionFunnel: (): Promise<Array<{ name: string; value: number; }>> => {
    return request.get('/dashboard/conversion-funnel');
  },

  // 获取用户行为数据
  getUserBehavior: (period: '7d' | '30d' = '7d'): Promise<{
    dates: string[];
    newUsers: number[];
    returningUsers: number[];
    activeUsers: number[];
  }> => {
    return request.get('/dashboard/user-behavior', { params: { period } });
  },

  // 获取设备使用热力图数据
  getDeviceHeatmap: (): Promise<Array<[number, number, number]>> => {
    return request.get('/dashboard/device-heatmap');
  }
};