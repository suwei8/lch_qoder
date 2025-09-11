// 仪表盘相关类型定义

// 仪表盘统计数据
export interface DashboardStats {
  totalRevenue: number;
  todayRevenue: number;
  todayOrders: number;
  onlineDevices: number;
  totalDevices: number;
  activeCustomers: number;
  orderGrowth: number;
  revenueGrowth: number;
  deviceOnlineRate: number;
}

// 营收概览
export interface RevenueOverview {
  today: number;
  week: number;
  month: number;
  todayGrowth: number;
  weekProgress: number;
  monthProgress: number;
}

// 设备概览
export interface DeviceOverview {
  summary: {
    total: number;
    online: number;
    offline: number;
    working: number;
    maintenance: number;
  };
  devices: Array<{
    id: number;
    name: string;
    status: string;
    status_text: string;
    location: string;
    today_orders: number;
    today_revenue: number;
    usage_rate: number;
    last_seen: Date;
  }>;
  alerts: Array<any>;
}

// 订单统计
export interface OrderStats {
  total: number;
  completed: number;
  processing: number;
  cancelled: number;
  totalRevenue: number;
  completionRate: number;
  cancellationRate: number;
  avgDuration: number;
}

// 实时数据
export interface RealTimeData {
  activeOrders: number;
  workingDevices: number;
  currentRevenue: number;
  onlineUsers: number;
}

// 待处理任务
export interface PendingTask {
  id: string;
  type: 'urgent' | 'normal' | 'maintenance';
  title: string;
  time: string;
  device_name?: string;
  order_no?: string;
}

// 营收趋势数据点
export interface RevenueTrendData {
  date: string;
  revenue: number;
}

// 设备使用率统计
export interface DeviceUsageStats {
  deviceId: number;
  deviceName: string;
  todayOrders: number;
  utilizationRate: number;
}

// 客户统计
export interface CustomerStats {
  todayActive: number;
  monthlyActive: number;
  total: number;
  retention: number;
}