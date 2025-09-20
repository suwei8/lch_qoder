// 仪表盘相关类型定义

// 仪表盘统计数据
export interface DashboardStats {
  totalRevenue: number;
  todayRevenue: number;
  todayOrders: number;
  totalOrders: number;
  onlineDevices: number;
  totalDevices: number;
  activeCustomers: number;
  totalCustomers: number;
  orderGrowth: number;
  revenueGrowth: number;
  customerGrowth: number;
  deviceOnlineRate: number;
}

// 营收概览
export interface RevenueOverview {
  today: number;
  todayGrowth: number;
  week: number;
  weekProgress: number;
  weekTarget: number;
  month: number;
  monthProgress: number;
  monthTarget: number;
  year: number;
  yearProgress: number;
  yearTarget: number;
}

// 今日指标
export interface TodayMetrics {
  revenue: number;
  orders: number;
  customers: number;
  avgOrderValue: number;
  deviceUtilization: number;
  customerSatisfaction: number;
}

// 实时数据
export interface RealTimeData {
  activeUsers: number;
  processingOrders: number;
  workingDevices: number;
  hourlyRevenue: number;
  queueLength: number;
  avgWaitTime: number;
}

// 设备详细状态
export interface DeviceDetailStatus {
  id: string;
  name: string;
  model: string;
  location: string;
  status: 'working' | 'idle' | 'offline' | 'maintenance';
  statusText: string;
  usageRate: number;
  todayOrders: number;
  todayRevenue: number;
  avgServiceTime: number;
  lastMaintenance: string;
  nextMaintenance: string;
  errorCount: number;
  uptime: number;
}

// 待处理任务
export interface PendingTask {
  id: string;
  type: 'urgent' | 'normal' | 'maintenance';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  relatedEntity?: {
    type: 'device' | 'order' | 'customer';
    id: string;
    name: string;
  };
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

// 订单统计 - 使用order.ts中的OrderStats类型
// export interface OrderStats - 已移至 @/types/order

// 营收趋势数据点
export interface RevenueTrendData {
  date: string;
  revenue: number;
}

// 客户统计
export interface CustomerStats {
  todayActive: number;
  monthlyActive: number;
  total: number;
  retention: number;
}

// 最近活动
export interface RecentActivity {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
}

// 系统状态
export interface SystemStatus {
  cpu: number;
  memory: number;
  disk: number;
  network: string;
}

// 设备告警
export interface DeviceAlert {
  id: string;
  deviceId: string;
  deviceName: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  description?: string;
}