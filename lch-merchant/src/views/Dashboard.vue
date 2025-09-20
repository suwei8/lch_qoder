<template>
  <div class="merchant-dashboard" v-loading="loading" element-loading-text="加载仪表盘数据中...">
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
              <div class="main-value">¥{{ formatAmount(revenueOverview?.today || 0) }}</div>
              <div class="sub-info">
                <span class="growth" :class="getGrowthClass(revenueOverview?.todayGrowth || 0)">
                  <el-icon><ArrowUp v-if="(revenueOverview?.todayGrowth || 0) > 0" /><ArrowDown v-else /></el-icon>
                  {{ Math.abs(revenueOverview?.todayGrowth || 0) }}%
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
              <div class="main-value">¥{{ formatAmount(revenueOverview?.week || 0) }}</div>
              <div class="sub-info">
                <span class="target-progress">目标达成：{{ revenueOverview?.weekProgress || 0 }}%</span>
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
              <div class="main-value">¥{{ formatAmount(revenueOverview?.month || 0) }}</div>
              <div class="sub-info">
                <span class="target-progress">目标达成：{{ revenueOverview?.monthProgress || 0 }}%</span>
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
                  {{ device.statusText }}
                </el-tag>
              </div>
              <div class="device-stats">
                <div class="stat-item">
                  <span class="stat-label">使用率</span>
                  <span class="stat-value">{{ device.usageRate }}%</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">今日订单</span>
                  <span class="stat-value">{{ device.todayOrders }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">今日收入</span>
                  <span class="stat-value">￥{{ formatAmount(device.todayRevenue) }}</span>
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
                  <div class="task-time">{{ task.createdAt }}</div>
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
                  <div class="task-title">{{ task.relatedEntity?.name || task.title }}</div>
                  <div class="task-time">{{ task.createdAt }}</div>
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
import { useDashboard } from '@/composables/useDashboard';
import { merchantApi } from '@/api';

const router = useRouter();
const authStore = useAuthStore();

// 使用仪表盘数据管理
const {
  loading,
  refreshing,
  lastUpdateTime,
  networkStatus,
  dashboardStats,
  revenueOverview,
  todayMetrics,
  realTimeData,
  deviceList,
  pendingTasks,
  deviceSummary,
  loadRealTimeData
} = useDashboard();

// 商户信息（从认证store或API获取）
const merchantInfo = ref({
  name: '测试洗车店',
  status: 'approved',
  status_text: '正常营业'
});

// 订单统计数据（从仪表盘API计算得出）
const orderStats = computed(() => {
  if (!dashboardStats.value) {
    return {
      total: 45,
      totalGrowth: 8.3,
      completed: 38,
      completionRate: 84.4,
      processing: 5,
      avgDuration: 25,
      cancelled: 2,
      cancellationRate: 4.4
    };
  }
  
  const stats = dashboardStats.value;
  const completed = Math.floor(stats.totalOrders * 0.85);
  const processing = Math.floor(stats.totalOrders * 0.1);
  const cancelled = Math.floor(stats.totalOrders * 0.05);
  
  return {
    total: stats.totalOrders,
    totalGrowth: stats.orderGrowth,
    completed,
    completionRate: Math.round((completed / stats.totalOrders) * 100),
    processing,
    avgDuration: 25, // 可从 API 获取
    cancelled,
    cancellationRate: Math.round((cancelled / stats.totalOrders) * 100)
  };
});

// 紧急任务、待处理订单、维护任务的分类
const urgentTasks = computed(() => 
  pendingTasks.value.filter(task => task.type === 'urgent')
);

const pendingOrders = computed(() => {
  // 模拟数据，实际应从订单API获取
  return [
    { id: 1, order_no: 'LCH20241201005', time: '2分钟前' },
    { id: 2, order_no: 'LCH20241201006', time: '8分钟前' },
    { id: 3, order_no: 'LCH20241201007', time: '12分钟前' }
  ];
});

const maintenanceTasks = computed(() => 
  pendingTasks.value.filter(task => task.type === 'maintenance')
);

// 设备告警数据
const deviceAlerts = computed(() => {
  // 模拟设备告警数据，实际应从设备API获取
  return [
    { id: 1, message: '设备001温度过高' },
    { id: 2, message: '设备003水压不足' }
  ];
});

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

// 定时器引用
let refreshTimer: number | null = null;

// 刷新数据
const refreshData = async () => {
  refreshing.value = true;
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    lastUpdateTime.value = formatDateTime(new Date());
    ElMessage.success('数据刷新成功');
  } catch (error) {
    console.error('刷新数据失败:', error);
    ElMessage.error('刷新数据失败');
  } finally {
    refreshing.value = false;
  }
};

// 加载仪表盘数据
const loadDashboardData = async () => {
  try {
    loading.value = true;
    
    // 模拟数据加载
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    lastUpdateTime.value = formatDateTime(new Date());
  } catch (error) {
    console.error('加载仪表盘数据失败:', error);
    await loadMockData();
  } finally {
    loading.value = false;
  }
};

// 加载模拟数据（API失败时的备用方案）
const loadMockData = async () => {
  console.log('使用模拟数据模式');
  await new Promise(resolve => setTimeout(resolve, 500));
};

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    approved: '正常营业',
    pending: '审核中',
    rejected: '审核未通过',
    suspended: '暂停营业'
  };
  return statusMap[status] || '未知状态';
};

// 生命周期
onMounted(async () => {
  // 从认证store获取用户信息
  if (authStore.userInfo) {
    merchantInfo.value.name = authStore.userInfo.nickname || '测试洗车店';
  }
  
  // 加载仪表盘数据
  await loadDashboardData();
  
  // 启动定时刷新
  refreshTimer = window.setInterval(() => {
    loadRealTimeData();
  }, 60000); // 每分钟更新一次实时数据
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
