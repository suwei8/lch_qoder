<template>
  <div class="dashboard-widgets">
    <!-- 实时监控小部件 -->
    <div class="widget-card" v-if="showRealTimeWidget">
      <div class="widget-header">
        <h4>实时监控</h4>
        <el-tag size="small" type="success">实时</el-tag>
      </div>
      <div class="real-time-metrics">
        <div class="metric-item">
          <div class="metric-value">{{ realTimeData.activeUsers }}</div>
          <div class="metric-label">在线用户</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">{{ realTimeData.processingOrders }}</div>
          <div class="metric-label">处理中订单</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">{{ realTimeData.workingDevices }}</div>
          <div class="metric-label">工作中设备</div>
        </div>
      </div>
    </div>

    <!-- 性能指标小部件 -->
    <div class="widget-card" v-if="showPerformanceWidget">
      <div class="widget-header">
        <h4>性能指标</h4>
      </div>
      <div class="performance-chart">
        <v-chart :option="performanceOption" style="height: 150px;" />
      </div>
    </div>

    <!-- 热门地区小部件 -->
    <div class="widget-card" v-if="showRegionWidget">
      <div class="widget-header">
        <h4>热门地区</h4>
      </div>
      <div class="region-list">
        <div class="region-item" v-for="(region, index) in topRegions" :key="index">
          <div class="region-rank">{{ index + 1 }}</div>
          <div class="region-info">
            <div class="region-name">{{ region.name }}</div>
            <div class="region-count">{{ region.count }}个商户</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 设备状态概览 -->
    <div class="widget-card" v-if="showDeviceWidget">
      <div class="widget-header">
        <h4>设备状态</h4>
      </div>
      <div class="device-status">
        <div class="status-item">
          <el-icon class="status-icon online"><CircleCheckFilled /></el-icon>
          <span>在线: {{ deviceStatus.online }}</span>
        </div>
        <div class="status-item">
          <el-icon class="status-icon working"><Loading /></el-icon>
          <span>工作中: {{ deviceStatus.working }}</span>
        </div>
        <div class="status-item">
          <el-icon class="status-icon offline"><CircleCloseFilled /></el-icon>
          <span>离线: {{ deviceStatus.offline }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { use } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';
import { CircleCheckFilled, Loading, CircleCloseFilled } from '@element-plus/icons-vue';

use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

// Props定义
interface Props {
  showRealTimeWidget?: boolean;
  showPerformanceWidget?: boolean;
  showRegionWidget?: boolean;
  showDeviceWidget?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showRealTimeWidget: true,
  showPerformanceWidget: true,
  showRegionWidget: true,
  showDeviceWidget: true
});

// Emits定义
interface Emits {
  (e: 'refresh'): void;
  (e: 'widgetClick', type: string): void;
}

const emit = defineEmits<Emits>();

// 响应式数据
const realTimeData = ref({
  activeUsers: 45,
  processingOrders: 12,
  workingDevices: 28
});

const topRegions = ref([
  { name: '北京市', count: 45 },
  { name: '上海市', count: 38 },
  { name: '广州市', count: 32 },
  { name: '深圳市', count: 28 },
  { name: '杭州市', count: 22 }
]);

const deviceStatus = ref({
  online: 398,
  working: 28,
  offline: 25
});

// 性能图表配置
const performanceOption = computed(() => ({
  grid: {
    left: 10,
    right: 10,
    top: 10,
    bottom: 20
  },
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    axisLabel: {
      fontSize: 10
    }
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      fontSize: 10
    }
  },
  series: [{
    type: 'line',
    data: [20, 15, 35, 50, 45, 30],
    smooth: true,
    lineStyle: {
      color: '#1890ff'
    },
    areaStyle: {
      color: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [{
          offset: 0,
          color: 'rgba(24, 144, 255, 0.2)'
        }, {
          offset: 1,
          color: 'rgba(24, 144, 255, 0.05)'
        }]
      }
    }
  }]
}));

// 定时器
let refreshTimer: number;

// 刷新数据
const refreshData = () => {
  // 模拟实时数据更新
  realTimeData.value = {
    activeUsers: Math.floor(Math.random() * 20) + 40,
    processingOrders: Math.floor(Math.random() * 10) + 8,
    workingDevices: Math.floor(Math.random() * 15) + 20
  };
  
  emit('refresh');
};

// 生命周期
onMounted(() => {
  // 启动定时刷新
  refreshTimer = setInterval(refreshData, 30000);
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>

<style scoped>
.dashboard-widgets {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.widget-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #f0f0f0;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.widget-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.real-time-metrics {
  display: flex;
  justify-content: space-between;
}

.metric-item {
  text-align: center;
}

.metric-value {
  font-size: 20px;
  font-weight: bold;
  color: #1890ff;
}

.metric-label {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.region-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.region-item {
  display: flex;
  align-items: center;
  padding: 4px 0;
}

.region-rank {
  width: 20px;
  height: 20px;
  background: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  margin-right: 8px;
}

.region-info {
  flex: 1;
}

.region-name {
  font-size: 12px;
  font-weight: 500;
}

.region-count {
  font-size: 10px;
  color: #666;
}

.device-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  display: flex;
  align-items: center;
  font-size: 12px;
}

.status-icon {
  margin-right: 8px;
}

.status-icon.online {
  color: #52c41a;
}

.status-icon.working {
  color: #faad14;
}

.status-icon.offline {
  color: #ff4d4f;
}
</style>