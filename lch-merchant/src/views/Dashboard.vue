<template>
  <div class="merchant-dashboard">
    <div class="page-header">
      <h1 class="page-title">商户仪表盘</h1>
      <div class="welcome-info">
        <span class="welcome-text">欢迎回来，{{ merchantInfo.name }}</span>
        <el-tag type="success" size="small">{{ merchantInfo.status_text }}</el-tag>
      </div>
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
            <div class="metric-value">{{ deviceStats.online }}/{{ deviceStats.total }}</div>
            <div class="metric-label">设备在线</div>
            <div class="metric-trend">{{ deviceStats.online_rate }}%</div>
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

    <!-- 图表和数据区域 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <div class="chart-card">
          <h4>收益趋势</h4>
          <div class="chart-placeholder">
            📈 收益趋势图表区域
            <p>显示最近7天的收益变化趋势</p>
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-card">
          <h4>设备使用率</h4>
          <div class="chart-placeholder">
            🎯 设备使用率图表区域
            <p>显示各设备的使用情况统计</p>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 最新动态 -->
    <el-row :gutter="20" class="activity-row">
      <el-col :span="12">
        <div class="activity-card">
          <h4>最新订单</h4>
          <div class="activity-list">
            <div 
              v-for="order in recentOrders" 
              :key="order.id"
              class="activity-item"
            >
              <div class="activity-info">
                <div class="activity-title">订单 #{{ order.id }}</div>
                <div class="activity-desc">{{ order.service_name }} - ¥{{ (order.amount / 100).toFixed(2) }}</div>
              </div>
              <div class="activity-time">{{ order.time }}</div>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="activity-card">
          <h4>设备状态</h4>
          <div class="device-status-list">
            <div 
              v-for="device in deviceStatusList" 
              :key="device.id"
              class="device-status-item"
            >
              <div class="device-info">
                <div class="device-name">{{ device.name }}</div>
                <el-tag :type="getDeviceStatusType(device.status)" size="small">
                  {{ device.status_text }}
                </el-tag>
              </div>
              <div class="device-usage">使用率: {{ device.usage_rate }}%</div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Money, 
  Document, 
  Monitor, 
  User, 
  Present, 
  Setting 
} from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// 商户信息
const merchantInfo = ref({
  name: '测试洗车店',
  status: 'approved',
  status_text: '正常营业'
});

// 今日指标数据
const todayMetrics = ref({
  revenue: 128500, // 分为单位
  orders: 45,
  customers: 32
});

// 设备统计数据
const deviceStats = ref({
  total: 8,
  online: 7,
  online_rate: 87.5
});

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

// 页面初始化
onMounted(() => {
  // 从认证store获取用户信息
  if (authStore.userInfo) {
    merchantInfo.value.name = authStore.userInfo.nickname || '测试洗车店';
  }
});
</script>

<style scoped>
.merchant-dashboard {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.welcome-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.welcome-text {
  color: #606266;
  font-size: 16px;
}

.metrics-row {
  margin-bottom: 24px;
}

.metric-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  overflow: hidden;
}

.metric-card.revenue {
  border-left: 4px solid #f56565;
}

.metric-card.orders {
  border-left: 4px solid #4299e1;
}

.metric-card.devices {
  border-left: 4px solid #48bb78;
}

.metric-card.customers {
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

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.metric-trend {
  font-size: 12px;
  font-weight: 600;
}

.metric-trend.positive {
  color: #67c23a;
}

.quick-actions {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.quick-actions h3 {
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
}

.quick-action-item:hover {
  border-color: #52c41a;
  background-color: #f6ffed;
  transform: translateY(-2px);
}

.quick-action-item .el-icon {
  font-size: 24px;
  color: #52c41a;
}

.quick-action-item span {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.charts-row, .activity-row {
  margin-bottom: 24px;
}

.chart-card, .activity-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.chart-card h4, .activity-card h4 {
  margin: 0 0 20px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.chart-placeholder {
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  border: 2px dashed #e4e7ed;
  border-radius: 8px;
  font-size: 24px;
}

.chart-placeholder p {
  margin-top: 12px;
  font-size: 14px;
}

.activity-list, .device-status-list {
  max-height: 300px;
  overflow-y: auto;
}

.activity-item, .device-status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f7fa;
}

.activity-item:last-child, .device-status-item:last-child {
  border-bottom: none;
}

.activity-info, .device-info {
  flex: 1;
}

.activity-title, .device-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.activity-desc {
  font-size: 12px;
  color: #909399;
}

.activity-time, .device-usage {
  font-size: 12px;
  color: #909399;
}

.device-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .merchant-dashboard {
    padding: 12px;
  }
  
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
</style>