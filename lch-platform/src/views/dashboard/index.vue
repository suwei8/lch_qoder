<template>
  <div class="dashboard">
    <div class="page-header">
      <h1 class="page-title">仪表盘</h1>
      <div class="header-actions">
        <span class="page-subtitle">欢迎回来，{{ authStore.currentUser?.nickname }}</span>
        <div class="refresh-info">
          <el-button size="small" @click="refreshData" :loading="refreshing">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
          <span class="last-update">最后更新：{{ lastUpdateTime }}</span>
        </div>
      </div>
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
            <div class="stat-growth" :class="getGrowthClass(stats.merchantGrowth)">
              <el-icon><ArrowUp v-if="stats.merchantGrowth > 0" /><ArrowDown v-else /></el-icon>
              {{ Math.abs(stats.merchantGrowth) }}%
            </div>
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
            <div class="stat-sub">在线：{{ stats.onlineDevices }}</div>
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
            <div class="stat-growth" :class="getGrowthClass(stats.orderGrowth)">
              <el-icon><ArrowUp v-if="stats.orderGrowth > 0" /><ArrowDown v-else /></el-icon>
              {{ Math.abs(stats.orderGrowth) }}%
            </div>
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
            <div class="stat-growth" :class="getGrowthClass(stats.revenueGrowth)">
              <el-icon><ArrowUp v-if="stats.revenueGrowth > 0" /><ArrowDown v-else /></el-icon>
              {{ Math.abs(stats.revenueGrowth) }}%
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 核心指标卡片 -->
    <el-row :gutter="20" class="metrics-row">
      <el-col :span="8">
        <div class="metric-card">
          <div class="metric-header">
            <h4>实时运营数据</h4>
            <el-tag size="small" type="success">实时</el-tag>
          </div>
          <div class="metric-grid">
            <div class="metric-item">
              <span class="metric-value">{{ realTimeData.activeUsers }}</span>
              <span class="metric-label">在线用户</span>
            </div>
            <div class="metric-item">
              <span class="metric-value">{{ realTimeData.processingOrders }}</span>
              <span class="metric-label">处理中订单</span>
            </div>
            <div class="metric-item">
              <span class="metric-value">{{ realTimeData.workingDevices }}</span>
              <span class="metric-label">工作中设备</span>
            </div>
            <div class="metric-item">
              <span class="metric-value">¥{{ formatAmount(realTimeData.hourlyRevenue) }}</span>
              <span class="metric-label">本小时收入</span>
            </div>
          </div>
        </div>
      </el-col>
      
      <el-col :span="8">
        <div class="metric-card">
          <div class="metric-header">
            <h4>转化率分析</h4>
          </div>
          <div class="conversion-chart">
            <v-chart :option="conversionOption" style="height: 180px;" />
          </div>
        </div>
      </el-col>
      
      <el-col :span="8">
        <div class="metric-card">
          <div class="metric-header">
            <h4>设备利用率</h4>
          </div>
          <div class="utilization-chart">
            <v-chart :option="utilizationOption" style="height: 180px;" />
          </div>
        </div>
      </el-col>
    </el-row>
    
    <!-- 小部件区域 -->
    <el-row :gutter="20" class="widgets-row">
      <el-col :span="24">
        <DashboardWidgets 
          @refresh="refreshData" 
          @widget-click="handleWidgetClick" 
        />
      </el-col>
    </el-row>

    <!-- 主要图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :span="16">
        <div class="chart-card">
          <div class="chart-header">
            <h3>营收趋势分析</h3>
            <div class="chart-controls">
              <el-radio-group v-model="revenueTrendPeriod" size="small" @change="updateRevenueChart">
                <el-radio-button label="7d">近7天</el-radio-button>
                <el-radio-button label="30d">近30天</el-radio-button>
                <el-radio-button label="90d">近3个月</el-radio-button>
              </el-radio-group>
            </div>
          </div>
          <div class="chart-content">
            <v-chart :option="revenueTrendOption" style="height: 400px;" />
          </div>
        </div>
      </el-col>
      
      <el-col :span="8">
        <div class="chart-card">
          <div class="chart-header">
            <h3>订单状态分布</h3>
          </div>
          <div class="chart-content">
            <v-chart :option="orderStatusOption" style="height: 200px;" />
          </div>
        </div>
        
        <div class="chart-card" style="margin-top: 20px;">
          <div class="chart-header">
            <h3>地区分布TOP5</h3>
          </div>
          <div class="region-list">
            <div class="region-item" v-for="(region, index) in topRegions" :key="index">
              <div class="region-rank">{{ index + 1 }}</div>
              <div class="region-info">
                <div class="region-name">{{ region.name }}</div>
                <div class="region-count">{{ region.count }}个商户</div>
              </div>
              <div class="region-progress">
                <el-progress :percentage="region.percentage" :show-text="false" :stroke-width="6" />
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 详细分析图表 -->
    <el-row :gutter="20" class="detail-charts-row">
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>设备使用热力图</h3>
            <el-tooltip content="显示24小时内设备使用频率">
              <el-icon><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <div class="chart-content">
            <v-chart :option="heatmapOption" style="height: 300px;" />
          </div>
        </div>
      </el-col>
      
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>用户行为分析</h3>
          </div>
          <div class="chart-content">
            <v-chart :option="userBehaviorOption" style="height: 300px;" />
          </div>
        </div>
      </el-col>
    </el-row>
    
    <!-- 最近活动和快速操作 -->
    <el-row :gutter="20" class="activity-row">
      <el-col :span="16">
        <div class="recent-activities">
          <div class="section-header">
            <h3>最近活动</h3>
            <div class="header-actions">
              <el-button size="small" @click="$router.push('/orders')">
                查看全部订单
              </el-button>
            </div>
          </div>
          
          <el-table :data="recentOrders" style="width: 100%" size="small">
            <el-table-column prop="orderNo" label="订单号" width="160" />
            <el-table-column prop="userName" label="用户" width="100" />
            <el-table-column prop="deviceName" label="设备" width="120" />
            <el-table-column prop="amount" label="金额" width="100">
              <template #default="{ row }">
                ¥{{ formatAmount(row.amount) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getOrderStatusType(row.status)" size="small">
                  {{ getOrderStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="时间" width="140" />
          </el-table>
        </div>
      </el-col>
      
      <el-col :span="8">
        <div class="quick-actions">
          <div class="section-header">
            <h3>快速操作</h3>
          </div>
          <div class="action-grid">
            <div class="action-item" @click="$router.push('/merchants')">
              <el-icon><Plus /></el-icon>
              <span>商户管理</span>
            </div>
            <div class="action-item" @click="$router.push('/devices')">
              <el-icon><Monitor /></el-icon>
              <span>设备监控</span>
            </div>
            <div class="action-item" @click="$router.push('/finance')">
              <el-icon><Money /></el-icon>
              <span>财务管理</span>
            </div>
            <div class="action-item" @click="$router.push('/system/config')">
              <el-icon><Setting /></el-icon>
              <span>系统设置</span>
            </div>
          </div>
          
          <div class="system-status">
            <h4>系统状态</h4>
            <div class="status-item">
              <span class="status-label">服务状态</span>
              <el-tag size="small" type="success">正常</el-tag>
            </div>
            <div class="status-item">
              <span class="status-label">数据库</span>
              <el-tag size="small" type="success">连接正常</el-tag>
            </div>
            <div class="status-item">
              <span class="status-label">缓存服务</span>
              <el-tag size="small" type="success">运行中</el-tag>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, onUnmounted } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, PieChart, BarChart, HeatmapChart, FunnelChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  VisualMapComponent,
  CalendarComponent
} from 'echarts/components';
import VChart from 'vue-echarts';
import { useAuthStore } from '@/stores/auth';
import DashboardWidgets from '@/components/DashboardWidgets.vue';
import {
  Shop,
  Monitor,
  Document,
  Money,
  ArrowUp,
  ArrowDown,
  Refresh,
  QuestionFilled,
  Plus,
  Setting
} from '@element-plus/icons-vue';
import { formatDateTime } from '@/utils/format';

use([
  CanvasRenderer,
  LineChart,
  PieChart,
  BarChart,
  HeatmapChart,
  FunnelChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  VisualMapComponent,
  CalendarComponent,
]);

const authStore = useAuthStore();

// 响应式数据
const refreshing = ref(false);
const lastUpdateTime = ref(formatDateTime(new Date()));
let refreshTimer: number;

// 统计数据
const stats = reactive({
  totalMerchants: 156,
  totalDevices: 423,
  todayOrders: 89,
  todayRevenue: 234500,
  merchantGrowth: 12.5,
  orderGrowth: 8.3,
  revenueGrowth: 15.7,
  onlineDevices: 398
});

// 实时数据
const realTimeData = reactive({
  activeUsers: 45,
  processingOrders: 12,
  workingDevices: 28,
  hourlyRevenue: 12580
});

// 图表周期
const revenueTrendPeriod = ref('30d');

// 地区分布数据
const topRegions = ref([
  { name: '北京市', count: 45, percentage: 85 },
  { name: '上海市', count: 38, percentage: 72 },
  { name: '广州市', count: 32, percentage: 60 },
  { name: '深圳市', count: 28, percentage: 53 },
  { name: '杭州市', count: 22, percentage: 42 }
]);

// 营收趋势图表
const revenueTrendOption = computed(() => {
  const data7d = {
    dates: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    revenue: [18500, 23200, 19800, 25600, 21300, 27800, 24500],
    orders: [85, 112, 94, 125, 103, 135, 118]
  };
  
  const data30d = {
    dates: Array.from({length: 30}, (_, i) => `${i+1}日`),
    revenue: Array.from({length: 30}, () => Math.floor(Math.random() * 15000) + 15000),
    orders: Array.from({length: 30}, () => Math.floor(Math.random() * 50) + 70)
  };
  
  const data90d = {
    dates: Array.from({length: 90}, (_, i) => `${Math.floor(i/30)+1}月${(i%30)+1}日`),
    revenue: Array.from({length: 90}, () => Math.floor(Math.random() * 20000) + 10000),
    orders: Array.from({length: 90}, () => Math.floor(Math.random() * 60) + 60)
  };
  
  const currentData = revenueTrendPeriod.value === '7d' ? data7d : 
                     revenueTrendPeriod.value === '30d' ? data30d : data90d;
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['营收', '订单量']
    },
    xAxis: {
      type: 'category',
      data: currentData.dates,
      axisPointer: {
        type: 'shadow'
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '营收(元)',
        axisLabel: {
          formatter: '{value}'
        }
      },
      {
        type: 'value',
        name: '订单量',
        axisLabel: {
          formatter: '{value}'
        }
      }
    ],
    series: [
      {
        name: '营收',
        type: 'bar',
        data: currentData.revenue,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#1890ff' },
              { offset: 1, color: '#40a9ff' }
            ]
          }
        }
      },
      {
        name: '订单量',
        type: 'line',
        yAxisIndex: 1,
        data: currentData.orders,
        smooth: true,
        lineStyle: {
          color: '#52c41a'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
              { offset: 1, color: 'rgba(82, 196, 26, 0.1)' }
            ]
          }
        }
      }
    ]
  };
});

// 订单状态分布
const orderStatusOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)'
  },
  series: [
    {
      name: '订单状态',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '18',
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: [
        { value: 45, name: '已完成', itemStyle: { color: '#52c41a' } },
        { value: 23, name: '进行中', itemStyle: { color: '#faad14' } },
        { value: 12, name: '待支付', itemStyle: { color: '#1890ff' } },
        { value: 9, name: '已取消', itemStyle: { color: '#f5222d' } }
      ]
    }
  ]
}));

// 转化率分析图表
const conversionOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c}%'
  },
  series: [
    {
      name: '转化漏斗',
      type: 'funnel',
      left: '10%',
      top: 60,
      bottom: 60,
      width: '80%',
      min: 0,
      max: 100,
      minSize: '30%',
      maxSize: '100%',
      sort: 'descending',
      gap: 2,
      label: {
        show: true,
        position: 'inside'
      },
      labelLine: {
        length: 10,
        lineStyle: {
          width: 1,
          type: 'solid'
        }
      },
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 1
      },
      emphasis: {
        label: {
          fontSize: 20
        }
      },
      data: [
        { value: 100, name: '访问用户' },
        { value: 80, name: '浏览设备' },
        { value: 60, name: '下单用户' },
        { value: 50, name: '支付完成' },
        { value: 45, name: '服务完成' }
      ]
    }
  ]
}));

// 设备利用率图表
const utilizationOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  xAxis: {
    type: 'category',
    data: ['设备A', '设备B', '设备C', '设备D', '设备E']
  },
  yAxis: {
    type: 'value',
    max: 100,
    axisLabel: {
      formatter: '{value}%'
    }
  },
  series: [
    {
      data: [85, 72, 91, 68, 79],
      type: 'bar',
      itemStyle: {
        color: function(params: any) {
          const value = params.value;
          if (value >= 80) return '#52c41a';
          if (value >= 60) return '#faad14';
          return '#f5222d';
        }
      }
    }
  ]
}));

// 设备使用热力图
const heatmapOption = computed(() => {
  const hours = Array.from({length: 24}, (_, i) => i + 'h');
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  
  const data = [];
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 24; j++) {
      data.push([j, i, Math.floor(Math.random() * 100)]);
    }
  }
  
  return {
    tooltip: {
      position: 'top'
    },
    grid: {
      height: '50%',
      top: '10%'
    },
    xAxis: {
      type: 'category',
      data: hours,
      splitArea: {
        show: true
      }
    },
    yAxis: {
      type: 'category',
      data: days,
      splitArea: {
        show: true
      }
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '15%',
      inRange: {
        color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffcc', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
      }
    },
    series: [{
      name: '使用率',
      type: 'heatmap',
      data: data,
      label: {
        show: false
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  };
});

// 用户行为分析
const userBehaviorOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['新用户', '回访用户', '活跃用户']
  },
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '新用户',
      type: 'line',
      stack: 'Total',
      data: [12, 18, 15, 22, 19, 25, 20],
      areaStyle: { color: 'rgba(24, 144, 255, 0.2)' }
    },
    {
      name: '回访用户',
      type: 'line',
      stack: 'Total',
      data: [28, 35, 42, 38, 45, 48, 52],
      areaStyle: { color: 'rgba(82, 196, 26, 0.2)' }
    },
    {
      name: '活跃用户',
      type: 'line',
      stack: 'Total',
      data: [35, 42, 38, 45, 48, 52, 58],
      areaStyle: { color: 'rgba(250, 173, 20, 0.2)' }
    }
  ]
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
  {
    orderNo: 'LCH20240904003',
    userName: '王五',
    deviceName: '3号洗车机',
    amount: 1500,
    status: 'PAID',
    createdAt: '2024-09-04 14:20:00',
  },
  {
    orderNo: 'LCH20240904004',
    userName: '赵六',
    deviceName: '4号洗车机',
    amount: 950,
    status: 'DONE',
    createdAt: '2024-09-04 14:15:00',
  },
  {
    orderNo: 'LCH20240904005',
    userName: '钱七',
    deviceName: '5号洗车机',
    amount: 1100,
    status: 'REFUNDING',
    createdAt: '2024-09-04 14:10:00',
  }
]);

// 工具函数
const formatAmount = (amount: number) => {
  return (amount / 100).toFixed(2);
};

const getGrowthClass = (growth: number) => {
  return growth > 0 ? 'growth-positive' : 'growth-negative';
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

// 小部件点击处理
const handleWidgetClick = (type: string) => {
  console.log('Widget clicked:', type);
};

// 事件处理
const refreshData = async () => {
  refreshing.value = true;
  
  try {
    // 模拟数据加载
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 更新统计数据
    stats.totalMerchants += Math.floor(Math.random() * 3);
    stats.todayOrders += Math.floor(Math.random() * 5);
    stats.todayRevenue += Math.floor(Math.random() * 5000);
    
    // 更新实时数据
    realTimeData.activeUsers = Math.floor(Math.random() * 20) + 30;
    realTimeData.processingOrders = Math.floor(Math.random() * 10) + 5;
    realTimeData.workingDevices = Math.floor(Math.random() * 15) + 20;
    realTimeData.hourlyRevenue += Math.floor(Math.random() * 2000);
    
    lastUpdateTime.value = formatDateTime(new Date());
  } catch (error) {
    console.error('刷新数据失败:', error);
  } finally {
    refreshing.value = false;
  }
};

const updateRevenueChart = () => {
  // 图表会自动更新，因为使用了 computed
};

const loadDashboardData = async () => {
  try {
    // TODO: 调用API获取实际数据
    console.log('加载仪表盘数据');
    
    // 模拟数据加载
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    console.error('加载仪表盘数据失败:', error);
  }
};

// 定时刷新实时数据
const startAutoRefresh = () => {
  refreshTimer = setInterval(() => {
    // 更新实时数据
    realTimeData.activeUsers = Math.floor(Math.random() * 20) + 30;
    realTimeData.processingOrders = Math.floor(Math.random() * 10) + 5;
    realTimeData.workingDevices = Math.floor(Math.random() * 15) + 20;
    realTimeData.hourlyRevenue += Math.floor(Math.random() * 500);
    
    lastUpdateTime.value = formatDateTime(new Date());
  }, 30000); // 每30秒更新一次
};

// 生命周期
onMounted(() => {
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
.dashboard {
  padding: 20px;
  background: #f5f5f5;
  min-height: calc(100vh - 120px);
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    
    .page-title {
      font-size: 28px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }
    
    .header-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
      
      .page-subtitle {
        color: #666;
        font-size: 14px;
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
  
  .stats-row {
    margin-bottom: 24px;
    
    .stat-card {
      background: linear-gradient(135deg, #fff 0%, #f8fffe 100%);
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
      }
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #1890ff, #52c41a, #faad14, #eb2f96);
      }
      
      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        margin-right: 20px;
        position: relative;
        
        &::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 12px;
          background: inherit;
          opacity: 0.1;
        }
      }
      
      .stat-content {
        flex: 1;
        
        .stat-number {
          font-size: 28px;
          font-weight: 700;
          color: #333;
          margin-bottom: 4px;
          line-height: 1;
        }
        
        .stat-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }
        
        .stat-growth {
          font-size: 12px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
          
          &.growth-positive {
            color: #52c41a;
          }
          
          &.growth-negative {
            color: #f5222d;
          }
        }
        
        .stat-sub {
          font-size: 12px;
          color: #999;
        }
      }
    }
  }
  
  .metrics-row {
    margin-bottom: 24px;
    
    .metric-card {
      background: #fff;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      height: 220px;
      
      .metric-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        
        h4 {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }
      }
      
      .metric-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        
        .metric-item {
          text-align: center;
          padding: 12px;
          border-radius: 8px;
          background: #f8f9fa;
          
          .metric-value {
            display: block;
            font-size: 20px;
            font-weight: 600;
            color: #333;
            margin-bottom: 4px;
          }
          
          .metric-label {
            font-size: 12px;
            color: #666;
          }
        }
      }
    }
  }
  
  .widgets-row {
    margin-bottom: 24px;
  }
  
  .charts-row {
    margin-bottom: 24px;
    
    .chart-card {
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      
      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        
        h3 {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }
        
        .chart-controls {
          display: flex;
          gap: 12px;
        }
      }
    }
  }
  
  .detail-charts-row {
    margin-bottom: 24px;
    
    .chart-card {
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      
      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        
        h3 {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }
      }
    }
  }
  
  .region-list {
    .region-item {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .region-rank {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #1890ff;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        margin-right: 12px;
      }
      
      .region-info {
        flex: 1;
        margin-right: 12px;
        
        .region-name {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          margin-bottom: 2px;
        }
        
        .region-count {
          font-size: 12px;
          color: #666;
        }
      }
      
      .region-progress {
        width: 60px;
      }
    }
  }
  
  .activity-row {
    .recent-activities {
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        
        h3 {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }
      }
    }
    
    .quick-actions {
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      
      .section-header {
        margin-bottom: 20px;
        
        h3 {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }
      }
      
      .action-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 24px;
        
        .action-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px;
          border-radius: 8px;
          background: #f8f9fa;
          cursor: pointer;
          transition: all 0.3s ease;
          
          &:hover {
            background: #e6f7ff;
            transform: translateY(-2px);
          }
          
          .el-icon {
            font-size: 24px;
            color: #1890ff;
            margin-bottom: 8px;
          }
          
          span {
            font-size: 12px;
            color: #333;
            font-weight: 500;
          }
        }
      }
      
      .system-status {
        h4 {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin: 0 0 12px 0;
        }
        
        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
          
          &:last-child {
            border-bottom: none;
          }
          
          .status-label {
            font-size: 12px;
            color: #666;
          }
        }
      }
    }
  }
}
</style>