<template>
  <div class="merchant-dashboard">
    <div class="page-header">
      <h1 class="page-title">商户仪表盘</h1>
      <div class="header-actions">
        <div class="welcome-info">
          <span class="welcome-text">欢迎回来，{{ merchantInfo.name }}</span>
          <el-tag type="success" size="small">{{ merchantInfo.status_text }}</el-tag>
        </div>
        <div class="refresh-info">
          <el-button size="small" @click="refreshData" :loading="refreshing">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
          <span class="last-update">最后更新：{{ lastUpdateTime }}</span>
        </div>
      </div>
    </div>

    <!-- 营收概览区域 -->
    <div class="revenue-overview">
      <h3>营收概览</h3>
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="overview-card daily">
            <div class="card-header">
              <h4>今日营收</h4>
              <el-icon class="card-icon"><Money /></el-icon>
            </div>
            <div class="card-content">
              <div class="main-value">¥{{ formatAmount(revenueOverview.today) }}</div>
              <div class="sub-info">
                <span class="growth" :class="getGrowthClass(revenueOverview.todayGrowth)">
                  <el-icon><ArrowUp v-if="revenueOverview.todayGrowth > 0" /><ArrowDown v-else /></el-icon>
                  {{ Math.abs(revenueOverview.todayGrowth) }}%
                </span>
                <span class="vs-yesterday">较昨日</span>
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="overview-card weekly">
            <div class="card-header">
              <h4>本周营收</h4>
              <el-icon class="card-icon"><TrendCharts /></el-icon>
            </div>
            <div class="card-content">
              <div class="main-value">¥{{ formatAmount(revenueOverview.week) }}</div>
              <div class="sub-info">
                <span class="target-progress">目标达成：{{ revenueOverview.weekProgress }}%</span>
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="overview-card monthly">
            <div class="card-header">
              <h4>本月营收</h4>
              <el-icon class="card-icon"><Wallet /></el-icon>
            </div>
            <div class="card-content">
              <div class="main-value">¥{{ formatAmount(revenueOverview.month) }}</div>
              <div class="sub-info">
                <span class="target-progress">目标达成：{{ revenueOverview.monthProgress }}%</span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 核心指标卡片 -->
    <el-row :gutter="20" class="metrics-row">
      <el-col :span="6">
        <div class="metric-card revenue">
          <div class="metric-icon">
            <el-icon><Money /></el-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">¥{{ (todayMetrics.revenue / 100).toFixed(0) }}</div>
            <div class="metric-label">今日收益</div>
            <div class="metric-trend positive">+12.5%</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="metric-card orders">
          <div class="metric-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ todayMetrics.orders }}</div>
            <div class="metric-label">今日订单</div>
            <div class="metric-trend positive">+8.3%</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="metric-card devices">
          <div class="metric-icon">
            <el-icon><Monitor /></el-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ deviceSummary.online }}/{{ deviceSummary.online + deviceSummary.offline }}</div>
            <div class="metric-label">设备在线</div>
            <div class="metric-trend">{{ Math.round(deviceSummary.online / (deviceSummary.online + deviceSummary.offline) * 100) }}%</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="metric-card customers">
          <div class="metric-icon">
            <el-icon><User /></el-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ todayMetrics.customers }}</div>
            <div class="metric-label">今日客户</div>
            <div class="metric-trend positive">+15.2%</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 设备状态总览 -->
    <div class="device-overview">
      <h3>设备状态总览</h3>
      <el-row :gutter="20">
        <el-col :span="16">
          <div class="device-status-grid">
            <div 
              v-for="device in deviceList" 
              :key="device.id"
              class="device-status-card"
              :class="device.status"
            >
              <div class="device-header">
                <span class="device-name">{{ device.name }}</span>
                <el-tag :type="getDeviceStatusType(device.status)" size="small">
                  {{ device.status_text }}
                </el-tag>
              </div>
              <div class="device-stats">
                <div class="stat-item">
                  <span class="stat-label">使用率</span>
                  <span class="stat-value">{{ device.usage_rate }}%</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">今日订单</span>
                  <span class="stat-value">{{ device.today_orders }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">今日收入</span>
                  <span class="stat-value">￥{{ formatAmount(device.today_revenue) }}</span>
                </div>
              </div>
              <div class="device-actions">
                <el-button size="small" type="primary" @click="controlDevice(device, 'remote')">
                  远程控制
                </el-button>
                <el-button size="small" @click="viewDeviceDetail(device)">
                  查看详情
                </el-button>
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="device-summary">
            <h4>设备概况</h4>
            <div class="summary-stats">
              <div class="summary-item">
                <div class="summary-icon online">
                  <el-icon><CircleCheckFilled /></el-icon>
                </div>
                <div class="summary-content">
                  <div class="summary-value">{{ deviceSummary.online }}</div>
                  <div class="summary-label">在线设备</div>
                </div>
              </div>
              <div class="summary-item">
                <div class="summary-icon working">
                  <el-icon><Loading /></el-icon>
                </div>
                <div class="summary-content">
                  <div class="summary-value">{{ deviceSummary.working }}</div>
                  <div class="summary-label">工作中</div>
                </div>
              </div>
              <div class="summary-item">
                <div class="summary-icon offline">
                  <el-icon><CircleCloseFilled /></el-icon>
                </div>
                <div class="summary-content">
                  <div class="summary-value">{{ deviceSummary.offline }}</div>
                  <div class="summary-label">离线设备</div>
                </div>
              </div>
            </div>
            <div class="device-alerts" v-if="deviceAlerts.length > 0">
              <h5>设备异常</h5>
              <div class="alert-list">
                <div v-for="alert in deviceAlerts" :key="alert.id" class="alert-item">
                  <el-icon class="alert-icon"><WarningFilled /></el-icon>
                  <span class="alert-text">{{ alert.message }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 今日订单统计 -->
    <div class="order-statistics">
      <h3>今日订单统计</h3>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card total-orders">
            <div class="stat-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ orderStats.total }}</div>
              <div class="stat-label">总订单数</div>
              <div class="stat-growth" :class="getGrowthClass(orderStats.totalGrowth)">
                <el-icon><ArrowUp v-if="orderStats.totalGrowth > 0" /><ArrowDown v-else /></el-icon>
                {{ Math.abs(orderStats.totalGrowth) }}%
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card completed-orders">
            <div class="stat-icon">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ orderStats.completed }}</div>
              <div class="stat-label">已完成</div>
              <div class="stat-sub">完成率：{{ orderStats.completionRate }}%</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card processing-orders">
            <div class="stat-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ orderStats.processing }}</div>
              <div class="stat-label">进行中</div>
              <div class="stat-sub">平均时长：{{ orderStats.avgDuration }}分钟</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card cancelled-orders">
            <div class="stat-icon">
              <el-icon><Close /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ orderStats.cancelled }}</div>
              <div class="stat-label">已取消</div>
              <div class="stat-sub">取消率：{{ orderStats.cancellationRate }}%</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 待处理事项 -->
    <div class="pending-tasks">
      <h3>待处理事项</h3>
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="task-card urgent">
            <div class="task-header">
              <h4>紧急事项</h4>
              <el-badge :value="urgentTasks.length" class="task-badge" />
            </div>
            <div class="task-list">
              <div v-for="task in urgentTasks" :key="task.id" class="task-item">
                <el-icon class="task-icon urgent"><WarningFilled /></el-icon>
                <div class="task-content">
                  <div class="task-title">{{ task.title }}</div>
                  <div class="task-time">{{ task.time }}</div>
                </div>
                <el-button size="small" type="danger" @click="handleTask(task)">处理</el-button>
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="task-card normal">
            <div class="task-header">
              <h4>待处理订单</h4>
              <el-badge :value="pendingOrders.length" class="task-badge" />
            </div>
            <div class="task-list">
              <div v-for="order in pendingOrders" :key="order.id" class="task-item">
                <el-icon class="task-icon normal"><Clock /></el-icon>
                <div class="task-content">
                  <div class="task-title">订单 #{{ order.order_no }}</div>
                  <div class="task-time">{{ order.time }}</div>
                </div>
                <el-button size="small" type="primary" @click="handleOrder(order)">查看</el-button>
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="task-card maintenance">
            <div class="task-header">
              <h4>设备维护</h4>
              <el-badge :value="maintenanceTasks.length" class="task-badge" />
            </div>
            <div class="task-list">
              <div v-for="task in maintenanceTasks" :key="task.id" class="task-item">
                <el-icon class="task-icon maintenance"><Tools /></el-icon>
                <div class="task-content">
                  <div class="task-title">{{ task.device_name }}</div>
                  <div class="task-time">{{ task.time }}</div>
                </div>
                <el-button size="small" type="warning" @click="handleMaintenance(task)">维护</el-button>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 快捷操作区域 -->
    <div class="quick-actions">
      <h3>快捷操作</h3>
      <el-row :gutter="15">
        <el-col :span="4">
          <div class="quick-action-item" @click="goToPage('/devices')">
            <el-icon><Monitor /></el-icon>
            <span>设备管理</span>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="quick-action-item" @click="goToPage('/orders')">
            <el-icon><Document /></el-icon>
            <span>订单管理</span>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="quick-action-item" @click="goToPage('/finance')">
            <el-icon><Money /></el-icon>
            <span>财务中心</span>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="quick-action-item" @click="goToPage('/customers')">
            <el-icon><User /></el-icon>
            <span>客户管理</span>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="quick-action-item" @click="goToPage('/marketing')">
            <el-icon><Present /></el-icon>
            <span>营销工具</span>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="quick-action-item" @click="goToPage('/settings')">
            <el-icon><Setting /></el-icon>
            <span>设置</span>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Money, 
  Document, 
  Monitor, 
  User, 
  Present, 
  Setting,
  Refresh,
  ArrowUp,
  ArrowDown,
  TrendCharts,
  Wallet,
  CircleCheckFilled,
  Loading,
  CircleCloseFilled,
  WarningFilled,
  CircleCheck,
  Clock,
  Close,
  Tools
} from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';
import { formatDateTime } from '../utils/format';

const router = useRouter();
const authStore = useAuthStore();

// 响应式数据
const refreshing = ref(false);
const lastUpdateTime = ref(formatDateTime(new Date()));
let refreshTimer: number;

// 商户信息
const merchantInfo = ref({
  name: '测试洗车店',
  status: 'approved',
  status_text: '正常营业'
});

// 营收概览数据
const revenueOverview = reactive({
  today: 128500, // 分为单位
  todayGrowth: 12.5,
  week: 856000,
  weekProgress: 78.5,
  month: 3420000,
  monthProgress: 85.2
});

// 今日指标数据
const todayMetrics = ref({
  revenue: 128500, // 分为单位
  orders: 45,
  customers: 32
});

// 设备列表数据
const deviceList = ref([
  {
    id: 1,
    name: '洗车机-01',
    status: 'working',
    status_text: '工作中',
    usage_rate: 85,
    today_orders: 12,
    today_revenue: 45600
  },
  {
    id: 2,
    name: '洗车机-02',
    status: 'idle',
    status_text: '空闲',
    usage_rate: 65,
    today_orders: 8,
    today_revenue: 28400
  },
  {
    id: 3,
    name: '烘干机-01',
    status: 'working',
    status_text: '工作中',
    usage_rate: 92,
    today_orders: 15,
    today_revenue: 38200
  },
  {
    id: 4,
    name: '烘干机-02',
    status: 'offline',
    status_text: '离线',
    usage_rate: 0,
    today_orders: 0,
    today_revenue: 0
  },
  {
    id: 5,
    name: '吸尘器-01',
    status: 'idle',
    status_text: '空闲',
    usage_rate: 45,
    today_orders: 6,
    today_revenue: 16300
  },
  {
    id: 6,
    name: '吸尘器-02',
    status: 'working',
    status_text: '工作中',
    usage_rate: 78,
    today_orders: 9,
    today_revenue: 22100
  }
]);

// 设备概况统计
const deviceSummary = computed(() => {
  const online = deviceList.value.filter(d => d.status !== 'offline').length;
  const working = deviceList.value.filter(d => d.status === 'working').length;
  const offline = deviceList.value.filter(d => d.status === 'offline').length;
  
  return { online, working, offline };
});

// 设备异常信息
const deviceAlerts = ref([
  { id: 1, message: '烘干机-02 连接异常' },
  { id: 2, message: '洗车机-01 水压低' }
]);

// 订单统计数据
const orderStats = reactive({
  total: 45,
  totalGrowth: 8.3,
  completed: 38,
  completionRate: 84.4,
  processing: 5,
  avgDuration: 25,
  cancelled: 2,
  cancellationRate: 4.4
});

// 紧急事项
const urgentTasks = ref([
  { id: 1, title: '烘干机-02 连接异常', time: '5分钟前' },
  { id: 2, title: '客户投诉待处理', time: '15分钟前' }
]);

// 待处理订单
const pendingOrders = ref([
  { id: 1, order_no: 'LCH20241201005', time: '2分钟前' },
  { id: 2, order_no: 'LCH20241201006', time: '8分钟前' },
  { id: 3, order_no: 'LCH20241201007', time: '12分钟前' }
]);

// 维护任务
const maintenanceTasks = ref([
  { id: 1, device_name: '洗车机-01', time: '定期维护到期' },
  { id: 2, device_name: '吸尘器-02', time: '清洁提醒' }
]);

// 最新订单列表
const recentOrders = ref([
  { id: 'LCH20241201001', service_name: '精洗套餐', amount: 2500, time: '2分钟前' },
  { id: 'LCH20241201002', service_name: '标准清洗', amount: 1500, time: '8分钟前' },
  { id: 'LCH20241201003', service_name: '快速冲洗', amount: 800, time: '15分钟前' },
  { id: 'LCH20241201004', service_name: '精洗套餐', amount: 2500, time: '22分钟前' },
]);

// 设备状态列表
const deviceStatusList = ref([
  { id: 1, name: '洗车机-01', status: 'working', status_text: '工作中', usage_rate: 85 },
  { id: 2, name: '洗车机-02', status: 'idle', status_text: '空闲', usage_rate: 65 },
  { id: 3, name: '烘干机-01', status: 'working', status_text: '工作中', usage_rate: 92 },
  { id: 4, name: '烘干机-02', status: 'offline', status_text: '离线', usage_rate: 0 },
  { id: 5, name: '吸尘器-01', status: 'idle', status_text: '空闲', usage_rate: 45 },
]);

// 工具函数
const formatAmount = (amount: number) => {
  return (amount / 100).toFixed(2);
};

const getGrowthClass = (growth: number) => {
  return growth > 0 ? 'growth-positive' : 'growth-negative';
};

// 页面跳转
const goToPage = (path: string) => {
  router.push(path);
};

// 获取设备状态类型
const getDeviceStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    working: 'success',
    idle: 'info',
    offline: 'danger',
    maintenance: 'warning'
  };
  return statusMap[status] || 'info';
};

// 设备控制
const controlDevice = (device: any, action: string) => {
  ElMessage.success(`正在对${device.name}执行${action}操作`);
};

// 查看设备详情
const viewDeviceDetail = (device: any) => {
  router.push(`/devices/${device.id}`);
};

// 处理任务
const handleTask = (task: any) => {
  ElMessage.info(`正在处理任务：${task.title}`);
};

// 处理订单
const handleOrder = (order: any) => {
  router.push(`/orders/${order.id}`);
};

// 处理维护
const handleMaintenance = (task: any) => {
  ElMessage.info(`正在处理设备维护：${task.device_name}`);
};

// 刷新数据
const refreshData = async () => {
  refreshing.value = true;
  
  try {
    // 模拟数据加载
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 更新数据
    revenueOverview.today += Math.floor(Math.random() * 5000);
    orderStats.total += Math.floor(Math.random() * 3);
    
    lastUpdateTime.value = formatDateTime(new Date());
    ElMessage.success('数据刷新成功');
  } catch (error) {
    console.error('刷新数据失败:', error);
    ElMessage.error('刷新数据失败');
  } finally {
    refreshing.value = false;
  }
};

// 启动定时刷新
const startAutoRefresh = () => {
  refreshTimer = setInterval(() => {
    // 更新实时数据
    lastUpdateTime.value = formatDateTime(new Date());
  }, 60000); // 每分钟更新一次
};

// 加载仪表盘数据
const loadDashboardData = async () => {
  try {
    // TODO: 调用API获取实际数据
    console.log('加载商户仪表盘数据');
    
    // 模拟数据加载
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    console.error('加载仪表盘数据失败:', error);
  }
};

// 生命周期
onMounted(() => {
  // 从认证store获取用户信息
  if (authStore.userInfo) {
    merchantInfo.value.name = authStore.userInfo.nickname || '测试洗车店';
  }
  
  loadDashboardData();
  startAutoRefresh();
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>

<style lang="scss" scoped>
.merchant-dashboard {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    .page-title {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      color: #303133;
    }
    
    .header-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
      
      .welcome-info {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .welcome-text {
          color: #606266;
          font-size: 16px;
        }
      }
      
      .refresh-info {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .last-update {
          font-size: 12px;
          color: #999;
        }
      }
    }
  }
  
  .revenue-overview {
    background: white;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    
    h3 {
      margin: 0 0 20px 0;
      color: #303133;
      font-size: 18px;
      font-weight: 600;
    }
    
    .overview-card {
      background: linear-gradient(135deg, #fff 0%, #f8fffe 100%);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      }
      
      &.daily {
        border-left: 4px solid #f56565;
      }
      
      &.weekly {
        border-left: 4px solid #4299e1;
      }
      
      &.monthly {
        border-left: 4px solid #48bb78;
      }
    }
  }

  .metrics-row {
    margin-bottom: 24px;

    .metric-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 16px;

      &.revenue {
        border-left: 4px solid #f56565;
      }

      &.orders {
        border-left: 4px solid #4299e1;
      }

      &.devices {
        border-left: 4px solid #48bb78;
      }

      &.customers {
        border-left: 4px solid #ed8936;
      }

      .metric-icon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: white;
      }

      .revenue .metric-icon { background: #f56565; }
      .orders .metric-icon { background: #4299e1; }
      .devices .metric-icon { background: #48bb78; }
      .customers .metric-icon { background: #ed8936; }
    }
  }

  .quick-actions {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

    h3 {
      margin: 0 0 20px 0;
      color: #303133;
      font-size: 18px;
      font-weight: 600;
    }

    .quick-action-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      border: 1px solid #ebeef5;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
      gap: 8px;

      &:hover {
        border-color: #52c41a;
        background-color: #f6ffed;
        transform: translateY(-2px);
      }

      .el-icon {
        font-size: 24px;
        color: #52c41a;
      }

      span {
        font-size: 14px;
        color: #606266;
        font-weight: 500;
      }
    }
  }

  @media (max-width: 768px) {
    padding: 12px;
    
    .page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    
    .metric-card {
      padding: 16px;
    }
    
    .quick-action-item {
      padding: 16px 12px;
    }
  }
}
</style>
