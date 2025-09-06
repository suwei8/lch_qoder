<template>
  <div class="merchant-devices">
    <div class="page-header">
      <h1>设备管理</h1>
      <p>管理您的洗车设备，监控设备状态</p>
    </div>

    <!-- 设备统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #e6f7ff; color: #1890ff;">
            <el-icon><Monitor /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ deviceStats.total }}</div>
            <div class="stat-label">设备总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f6ffed; color: #52c41a;">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ deviceStats.online }}</div>
            <div class="stat-label">在线设备</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fff2e8; color: #fa8c16;">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ deviceStats.offline }}</div>
            <div class="stat-label">离线设备</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f9f0ff; color: #722ed1;">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ deviceStats.busy }}</div>
            <div class="stat-label">使用中</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 设备列表 -->
    <div class="device-list">
      <div class="list-header">
        <h2>设备列表</h2>
        <div class="actions">
          <el-button type="primary" @click="refreshDevices">
            <el-icon><Refresh /></el-icon>
            刷新状态
          </el-button>
        </div>
      </div>

      <el-table :data="devices" style="width: 100%">
        <el-table-column prop="devid" label="设备编号" width="150" />
        <el-table-column prop="name" label="设备名称" width="200" />
        <el-table-column prop="location" label="位置" width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag 
              :type="getStatusType(scope.row.status)"
              size="small"
            >
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price_per_minute" label="价格/分钟">
          <template #default="scope">
            ¥{{ (scope.row.price_per_minute / 100).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="total_orders" label="总订单数" />
        <el-table-column prop="total_revenue" label="总收入">
          <template #default="scope">
            ¥{{ (scope.row.total_revenue / 100).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="last_seen_at" label="最后在线">
          <template #default="scope">
            <span v-if="scope.row.last_seen_at">
              {{ formatDateTime(scope.row.last_seen_at) }}
            </span>
            <span v-else class="text-muted">从未上线</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button 
              v-if="scope.row.status === 'online'" 
              size="small" 
              type="primary"
              @click="controlDevice(scope.row, 'start')"
            >
              启动
            </el-button>
            <el-button 
              v-if="scope.row.status === 'busy'" 
              size="small" 
              type="warning"
              @click="controlDevice(scope.row, 'stop')"
            >
              停止
            </el-button>
            <el-button 
              size="small" 
              @click="viewDeviceDetail(scope.row)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

// 设备统计数据
const deviceStats = ref({
  total: 0,
  online: 0,
  offline: 0,
  busy: 0,
});

// 设备列表数据
const devices = ref<any[]>([]);

// 格式化日期时间
const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN');
};

// 获取设备状态类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    'online': 'success',
    'offline': 'danger',
    'busy': 'warning',
  };
  return statusMap[status] || 'info';
};

// 获取设备状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'online': '在线',
    'offline': '离线',
    'busy': '使用中',
  };
  return statusMap[status] || status;
};

// 控制设备
const controlDevice = (device: any, action: string) => {
  ElMessage.info(`${action === 'start' ? '启动' : '停止'}设备 ${device.name} - 功能开发中`);
};

// 查看设备详情
const viewDeviceDetail = (device: any) => {
  ElMessage.info(`查看设备 ${device.name} 详情 - 功能开发中`);
};

// 刷新设备状态
const refreshDevices = () => {
  loadMockDevices();
  ElMessage.success('设备状态已刷新');
};

// 加载模拟设备数据
const loadMockDevices = () => {
  const merchantName = authStore.currentUser?.nickname || '测试商户';
  const deviceCount = Math.floor(Math.random() * 3) + 2; // 2-4台设备
  
  devices.value = Array.from({ length: deviceCount }, (_, index) => {
    const status = ['online', 'offline', 'busy'][Math.floor(Math.random() * 3)];
    return {
      id: index + 1,
      devid: `DEV${String(index + 1).padStart(3, '0')}`,
      name: `${merchantName} - ${index + 1}号机`,
      location: `${merchantName}店内`,
      status,
      price_per_minute: 250 + Math.floor(Math.random() * 100), // 2.5-3.5元/分钟
      total_orders: Math.floor(Math.random() * 100) + 20,
      total_revenue: Math.floor(Math.random() * 50000) + 10000,
      last_seen_at: status !== 'offline' ? new Date(Date.now() - Math.random() * 3600000).toISOString() : null,
    };
  });

  // 更新统计数据
  deviceStats.value = {
    total: devices.value.length,
    online: devices.value.filter(d => d.status === 'online').length,
    offline: devices.value.filter(d => d.status === 'offline').length,
    busy: devices.value.filter(d => d.status === 'busy').length,
  };
};

onMounted(() => {
  loadMockDevices();
});
</script>

<style scoped>
.merchant-devices {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 24px;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.stat-icon .el-icon {
  font-size: 24px;
}

.stat-content .stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.stat-content .stat-label {
  font-size: 14px;
  color: #666;
}

.device-list {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.list-header h2 {
  margin: 0;
  color: #333;
}

.text-muted {
  color: #999;
}
</style>