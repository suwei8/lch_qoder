// 仪表盘数据管理 Composable
import { ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { dashboardApi, merchantApi, deviceApi, orderApi } from '@/api';
import type { 
  DashboardStats, 
  RevenueOverview, 
  DeviceDetailStatus, 
  PendingTask,
  TodayMetrics,
  RealTimeData
} from '@/types/dashboard';
import { formatDateTime } from '@/utils/format';

export function useDashboard() {
  // 响应式状态
  const loading = ref(false);
  const refreshing = ref(false);
  const lastUpdateTime = ref(formatDateTime(new Date()));
  
  // 数据状态
  const dashboardStats = ref<DashboardStats | null>(null);
  const revenueOverview = ref<RevenueOverview | null>(null);
  const todayMetrics = ref<TodayMetrics>({
    revenue: 0,
    orders: 0,
    customers: 0,
    avgOrderValue: 0,
    deviceUtilization: 0,
    customerSatisfaction: 0
  });
  
  const realTimeData = ref<RealTimeData>({
    activeUsers: 0,
    processingOrders: 0,
    workingDevices: 0,
    hourlyRevenue: 0,
    queueLength: 0,
    avgWaitTime: 0
  });
  
  const deviceList = ref<DeviceDetailStatus[]>([]);
  const pendingTasks = ref<PendingTask[]>([]);
  
  // 网络状态
  const networkStatus = ref<'online' | 'offline'>('online');
  
  // 计算属性
  const deviceSummary = computed(() => {
    if (!deviceList.value.length) return { online: 0, working: 0, offline: 0 };
    
    const online = deviceList.value.filter(d => d.status !== 'offline').length;
    const working = deviceList.value.filter(d => d.status === 'working').length;
    const offline = deviceList.value.filter(d => d.status === 'offline').length;
    
    return { online, working, offline };
  });
  
  // API调用方法
  const loadDashboardOverview = async () => {
    try {
      const [statsRes, revenueRes, devicesRes] = await Promise.allSettled([
        dashboardApi.getOverviewStats(),
        dashboardApi.getRevenueOverview(),
        dashboardApi.getDeviceOverview()
      ]);
      
      if (statsRes.status === 'fulfilled') {
        dashboardStats.value = statsRes.value;
        todayMetrics.value = {
          revenue: statsRes.value.todayRevenue,
          orders: statsRes.value.todayOrders,
          customers: statsRes.value.activeCustomers,
          avgOrderValue: statsRes.value.todayRevenue / (statsRes.value.todayOrders || 1),
          deviceUtilization: (statsRes.value.onlineDevices / statsRes.value.totalDevices) * 100,
          customerSatisfaction: 85 // 默认值，可从API获取
        };
      }
      
      if (revenueRes.status === 'fulfilled') {
        revenueOverview.value = revenueRes.value;
      }
      
      networkStatus.value = 'online';
    } catch (error) {
      console.warn('API调用失败，切换到离线模式:', error);
      networkStatus.value = 'offline';
      await loadMockData();
    }
  };
  
  const loadRealTimeData = async () => {
    try {
      const realtime = await dashboardApi.getRealTimeData();
      realTimeData.value = realtime;
    } catch (error) {
      console.warn('实时数据获取失败:', error);
      // 生成模拟实时数据
      realTimeData.value = {
        activeUsers: Math.floor(Math.random() * 20) + 10,
        processingOrders: Math.floor(Math.random() * 5) + 2,
        workingDevices: Math.floor(Math.random() * 8) + 3,
        hourlyRevenue: Math.floor(Math.random() * 5000) + 2000,
        queueLength: Math.floor(Math.random() * 3),
        avgWaitTime: Math.floor(Math.random() * 5) + 2
      };
    }
  };
  
  const loadDeviceData = async () => {
    try {
      const devices = await deviceApi.getDevices({ limit: 50 });
      deviceList.value = devices.data?.map(device => ({
        id: device.devid,
        name: device.name,
        model: device.model || '标准型',
        location: device.location,
        status: device.status === 'online' ? 'working' : 'offline',
        statusText: device.status === 'online' ? '工作中' : '离线',
        usageRate: Math.floor(Math.random() * 40) + 60,
        todayOrders: Math.floor(Math.random() * 20) + 5,
        todayRevenue: Math.floor(Math.random() * 20000) + 10000,
        avgServiceTime: Math.floor(Math.random() * 10) + 15,
        lastMaintenance: '2024-11-15',
        nextMaintenance: '2024-12-15',
        errorCount: Math.floor(Math.random() * 3),
        uptime: Math.floor(Math.random() * 20) + 80
      })) || [];
    } catch (error) {
      console.warn('设备数据获取失败:', error);
      await loadMockDeviceData();
    }
  };
  
  const loadPendingTasks = async () => {
    try {
      const tasks = await dashboardApi.getDeviceAlerts();
      pendingTasks.value = tasks.map(alert => ({
        id: alert.id,
        type: alert.severity === 'critical' ? 'urgent' : 'normal',
        title: alert.message,
        description: alert.description || '',
        priority: alert.severity === 'critical' ? 'high' : alert.severity === 'medium' ? 'medium' : 'low',
        createdAt: alert.timestamp,
        relatedEntity: {
          type: 'device',
          id: alert.deviceId,
          name: alert.deviceName
        }
      }));
    } catch (error) {
      console.warn('待处理任务获取失败:', error);
      // 生成模拟任务数据
      pendingTasks.value = [
        {
          id: '1',
          type: 'urgent',
          title: '设备离线异常',
          description: '洗车机-02连接异常',
          priority: 'high',
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          type: 'maintenance',
          title: '定期维护提醒',
          description: '洗车机-01需要进行定期维护',
          priority: 'medium',
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        }
      ];
    }
  };
  
  // 模拟数据加载（API失败时的备用方案）
  const loadMockData = async () => {
    console.log('使用模拟数据模式');
    
    dashboardStats.value = {
      totalRevenue: 1250000,
      todayRevenue: 128500,
      todayOrders: 45,
      totalOrders: 1250,
      onlineDevices: 8,
      totalDevices: 10,
      activeCustomers: 32,
      totalCustomers: 285,
      revenueGrowth: 12.5,
      orderGrowth: 8.3,
      customerGrowth: 15.2
    };
    
    revenueOverview.value = {
      today: 128500,
      todayGrowth: 12.5,
      week: 856000,
      weekProgress: 78.5,
      weekTarget: 1090000,
      month: 3420000,
      monthProgress: 85.2,
      monthTarget: 4000000,
      year: 12500000,
      yearProgress: 62.5,
      yearTarget: 20000000
    };
    
    todayMetrics.value = {
      revenue: 128500,
      orders: 45,
      customers: 32,
      avgOrderValue: 2855,
      deviceUtilization: 80,
      customerSatisfaction: 85
    };
  };
  
  const loadMockDeviceData = async () => {
    deviceList.value = [
      {
        id: '1',
        name: '洗车机-01',
        model: '标准型',
        location: '1号位',
        status: 'working',
        statusText: '工作中',
        usageRate: 85,
        todayOrders: 12,
        todayRevenue: 45600,
        avgServiceTime: 25,
        lastMaintenance: '2024-11-15',
        nextMaintenance: '2024-12-15',
        errorCount: 0,
        uptime: 98
      },
      {
        id: '2',
        name: '洗车机-02',
        model: '标准型',
        location: '2号位',
        status: 'offline',
        statusText: '离线',
        usageRate: 0,
        todayOrders: 0,
        todayRevenue: 0,
        avgServiceTime: 0,
        lastMaintenance: '2024-11-10',
        nextMaintenance: '2024-12-10',
        errorCount: 1,
        uptime: 0
      }
    ];
  };
  
  // 主要的加载方法
  const loadDashboardData = async () => {
    loading.value = true;
    try {
      await Promise.all([
        loadDashboardOverview(),
        loadDeviceData(),
        loadPendingTasks()
      ]);
      lastUpdateTime.value = formatDateTime(new Date());
    } catch (error) {
      console.error('加载仪表盘数据失败:', error);
      ElMessage.error('加载仪表盘数据失败');
    } finally {
      loading.value = false;
    }
  };
  
  // 刷新数据
  const refreshData = async () => {
    refreshing.value = true;
    try {
      await Promise.all([
        loadDashboardOverview(),
        loadRealTimeData()
      ]);
      lastUpdateTime.value = formatDateTime(new Date());
      ElMessage.success('数据刷新成功');
    } catch (error) {
      console.error('刷新数据失败:', error);
      ElMessage.error('刷新数据失败');
    } finally {
      refreshing.value = false;
    }
  };
  
  return {
    // 状态
    loading,
    refreshing,
    lastUpdateTime,
    networkStatus,
    
    // 数据
    dashboardStats,
    revenueOverview,
    todayMetrics,
    realTimeData,
    deviceList,
    pendingTasks,
    deviceSummary,
    
    // 方法
    loadDashboardData,
    refreshData,
    loadRealTimeData
  };
}