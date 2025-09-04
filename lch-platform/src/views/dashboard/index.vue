<template>
  <div class="dashboard">
    <div class="page-header">
      <h1 class="page-title">仪表盘</h1>
      <span class="page-subtitle">欢迎回来，{{ authStore.currentUser?.nickname }}</span>
    </div>
    
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #e6f7ff; color: #1890ff;">
            <el-icon><Shop /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.totalMerchants }}</div>
            <div class="stat-label">商户总数</div>
          </div>
        </div>
      </el-col>
      
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f6ffed; color: #52c41a;">
            <el-icon><Monitor /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.totalDevices }}</div>
            <div class="stat-label">设备总数</div>
          </div>
        </div>
      </el-col>
      
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fff7e6; color: #faad14;">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.todayOrders }}</div>
            <div class="stat-label">今日订单</div>
          </div>
        </div>
      </el-col>
      
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fff0f6; color: #eb2f96;">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">¥{{ formatAmount(stats.todayRevenue) }}</div>
            <div class="stat-label">今日营收</div>
          </div>
        </div>
      </el-col>
    </el-row>
    
    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>订单趋势</h3>
            <el-radio-group v-model="orderTrendPeriod" size="small">
              <el-radio-button label="7d">近7天</el-radio-button>
              <el-radio-button label="30d">近30天</el-radio-button>
            </el-radio-group>
          </div>
          <div class="chart-content">
            <v-chart :option="orderTrendOption" style="height: 300px;" />
          </div>
        </div>
      </el-col>
      
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>设备状态分布</h3>
          </div>
          <div class="chart-content">
            <v-chart :option="deviceStatusOption" style="height: 300px;" />
          </div>
        </div>
      </el-col>
    </el-row>
    
    <!-- 最近活动 -->
    <div class="recent-activities">
      <div class="page-container">
        <div class="section-header">
          <h3>最近活动</h3>
          <el-link type="primary" @click="$router.push('/orders')">查看更多</el-link>
        </div>
        
        <el-table :data="recentOrders" style="width: 100%">
          <el-table-column prop="orderNo" label="订单号" width="180" />
          <el-table-column prop="userName" label="用户" />
          <el-table-column prop="deviceName" label="设备" />
          <el-table-column prop="amount" label="金额">
            <template #default="{ row }">
              ¥{{ formatAmount(row.amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态">
            <template #default="{ row }">
              <el-tag :type="getOrderStatusType(row.status)">
                {{ getOrderStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="时间" width="180" />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';
import { useAuthStore } from '@/stores/auth';

use([
  CanvasRenderer,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
]);

const authStore = useAuthStore();

// 统计数据
const stats = ref({
  totalMerchants: 156,
  totalDevices: 423,
  todayOrders: 89,
  todayRevenue: 234500, // 分为单位
});

// 订单趋势
const orderTrendPeriod = ref('7d');
const orderTrendOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
  },
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      data: [120, 200, 150, 80, 70, 110, 130],
      type: 'line',
      smooth: true,
      lineStyle: {
        color: '#1890ff',
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.1)' },
          ],
        },
      },
    },
  ],
}));

// 设备状态分布
const deviceStatusOption = computed(() => ({
  tooltip: {
    trigger: 'item',
  },
  legend: {
    orient: 'vertical',
    left: 'left',
  },
  series: [
    {
      name: '设备状态',
      type: 'pie',
      radius: '50%',
      data: [
        { value: 320, name: '在线' },
        { value: 80, name: '离线' },
        { value: 23, name: '使用中' },
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
    },
  ],
}));

// 最近订单
const recentOrders = ref([
  {
    orderNo: 'LCH20240904001',
    userName: '张三',
    deviceName: '1号洗车机',
    amount: 1200,
    status: 'DONE',
    createdAt: '2024-09-04 14:30:00',
  },
  {
    orderNo: 'LCH20240904002',
    userName: '李四',
    deviceName: '2号洗车机',
    amount: 800,
    status: 'IN_USE',
    createdAt: '2024-09-04 14:25:00',
  },
  // 更多订单...
]);

// 工具函数
const formatAmount = (amount: number) => {
  return (amount / 100).toFixed(2);
};

const getOrderStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    DONE: 'success',
    IN_USE: 'warning',
    PAID: 'info',
    REFUNDING: 'danger',
  };
  return statusMap[status] || 'info';
};

const getOrderStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    INIT: '初始化',
    PAY_PENDING: '待支付',
    PAID: '已支付',
    STARTING: '启动中',
    IN_USE: '使用中',
    SETTLING: '结算中',
    DONE: '已完成',
    REFUNDING: '退款中',
    CLOSED: '已关闭',
  };
  return statusMap[status] || status;
};

onMounted(() => {
  // 加载仪表盘数据
  loadDashboardData();
});

const loadDashboardData = async () => {
  // TODO: 调用API获取实际数据
  console.log('加载仪表盘数据');
};
</script>

<style lang="scss" scoped>
.dashboard {
  .page-header {
    margin-bottom: 30px;
    
    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }
    
    .page-subtitle {
      color: #666;
      font-size: 14px;
    }
  }
  
  .stats-row {
    margin-bottom: 30px;
    
    .stat-card {
      background: #fff;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      
      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        margin-right: 16px;
      }
      
      .stat-content {
        .stat-number {
          font-size: 24px;
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }
        
        .stat-label {
          font-size: 14px;
          color: #666;
        }
      }
    }
  }
  
  .charts-row {
    margin-bottom: 30px;
    
    .chart-card {
      background: #fff;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      
      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        
        h3 {
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }
      }
    }
  }
  
  .recent-activities {
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      
      h3 {
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }
    }
  }
}
</style>