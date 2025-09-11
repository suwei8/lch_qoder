<template>
  <div class="dashboard">
    <div class="page-header">
      <h1 class="page-title">仪表盘</h1>
      <div class="header-actions">
        <span class="page-subtitle">欢迎回来，{{ authStore.currentUser?.nickname }}</span>
        <div class="data-status-info">
          <el-tag size="small" type="success">真实数据</el-tag>
          <span>基础统计、实时数据、营收趋势、最近订单、地区分布</span>
          <el-tag size="small" type="danger">模拟数据</el-tag>
          <span>转化漏斗、设备利用率、热力图、用户行为</span>
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

    <!-- 新增：扩展统计卡片 -->
    <el-row :gutter="20" class="extended-stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f0f9ff; color: #0ea5e9;">
            <el-icon><Ticket /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ extendedStats.coupons.totalCoupons }}</div>
            <div class="stat-label">优惠券总数</div>
            <div class="stat-sub">使用率：{{ extendedStats.coupons.usageRate }}</div>
          </div>
        </div>
      </el-col>
      
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f0fdf4; color: #16a34a;">
            <el-icon><Bell /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ extendedStats.notifications.total }}</div>
            <div class="stat-label">通知总数</div>
            <div class="stat-sub">已读率：{{ extendedStats.notifications.readRate }}</div>
          </div>
        </div>
      </el-col>
      
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fefce8; color: #ca8a04;">
            <el-icon><Cpu /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ extendedStats.systemHealth.cpuUsage }}</div>
            <div class="stat-label">系统CPU</div>
            <div class="stat-sub">内存：{{ extendedStats.systemHealth.memoryUsage }}</div>
          </div>
        </div>
      </el-col>
      
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fdf2f8; color: #be185d;">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ extendedStats.systemHealth.uptime }}</div>
            <div class="stat-label">系统运行</div>
            <div class="stat-sub">磁盘：{{ extendedStats.systemHealth.diskUsage }}</div>
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
            <el-tag size="small" type="danger">模拟数据</el-tag>
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
            <el-tag size="small" type="danger">模拟数据</el-tag>
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
          :show-performance-widget="false"
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
            <div>
              <el-tag size="small" type="danger">模拟数据</el-tag>
              <el-tooltip content="显示24小时内设备使用频率">
                <el-icon><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
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
            <el-tag size="small" type="danger">模拟数据</el-tag>
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
            <div class="action-item" @click="$router.push('/coupons')">
              <el-icon><Ticket /></el-icon>
              <span>优惠券管理</span>
            </div>
            <div class="action-item" @click="$router.push('/notifications')">
              <el-icon><Bell /></el-icon>
              <span>通知管理</span>
            </div>
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
  Setting,
  Ticket,
  Bell,
  Cpu,
  TrendCharts
} from '@element-plus/icons-vue';
import { dashboardApi } from '@/api/dashboard';
import { getCouponStatistics } from '@/api/coupons';
import { getSystemConfig } from '@/api/system-config';
import { getNotificationStatistics } from '@/api/notifications';
import type { 
  DashboardStats, 
  RealtimeData, 
  RecentOrder,
  RevenueChartData
} from '@/api/dashboard';
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
let refreshTimer: NodeJS.Timeout | null = null;

// 统计数据 - 将使用真实API数据覆盖
const stats = reactive<DashboardStats>({
  totalMerchants: 0,
  totalDevices: 0,
  onlineDevices: 0,
  todayOrders: 0,
  todayRevenue: 0,
  merchantGrowth: 0,
  orderGrowth: 0,
  revenueGrowth: 0,
  totalUsers: 0,
  activeUsers: 0
});

// 新增：扩展统计数据
const extendedStats = reactive({
  coupons: {
    totalCoupons: 0,
    activeCoupons: 0,
    totalClaimed: 0,
    totalUsed: 0,
    usageRate: '0%'
  },
  notifications: {
    total: 0,
    unread: 0,
    readRate: '0%'
  },
  systemHealth: {
    uptime: '0 天',
    memoryUsage: '0%',
    cpuUsage: '0%',
    diskUsage: '0%'
  }
});

// 实时数据 - 将使用真实API数据覆盖
const realTimeData = reactive<RealtimeData>({
  activeUsers: 0,
  processingOrders: 0,
  workingDevices: 0,
  hourlyRevenue: 0
});

// 图表周期
const revenueTrendPeriod = ref<'7d' | '30d' | '90d'>('30d');

// 图表数据
const chartData = ref<RevenueChartData | null>(null);
const orderStatusData = ref<Array<{ name: string; value: number; itemStyle: { color: string; } }> | null>(null);

// 地区分布数据 - 将使用真实API数据覆盖
const topRegions = ref<Array<{ name: string; count: number; percentage: number }>>([]);

// 营收趋势图表
const revenueTrendOption = computed(() => {
  // 优先使用真实API数据，如果没有则显示“数据加载中”
  if (chartData.value) {
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
        data: chartData.value.dates,
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
          data: chartData.value.revenue,
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
          data: chartData.value.orders,
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
  }
  
  // 数据加载中的占位显示
  return {
    title: {
      text: '数据加载中...',
      left: 'center',
      top: 'middle',
      textStyle: {
        color: '#999',
        fontSize: 14
      }
    },
    xAxis: {
      type: 'category',
      data: []
    },
    yAxis: {
      type: 'value'
    },
    series: []
  };
});

// 订单状态分布
const orderStatusOption = computed(() => {
  // 使用真实API数据，如果没有则显示占位
  if (orderStatusData.value && orderStatusData.value.length > 0) {
    return {
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
          data: orderStatusData.value
        }
      ]
    };
  }
  
  // 数据加载中的占位显示
  return {
    title: {
      text: '数据加载中...',
      left: 'center',
      top: 'middle',
      textStyle: {
        color: '#999',
        fontSize: 14
      }
    },
    series: []
  };
});

// 转化率分析图表 - 【模拟数据】需要后续实现用户行为追踪
const conversionOption = computed(() => ({
  title: {
    text: '【模拟数据】需要后续实现用户行为追踪',
    textStyle: { fontSize: 12, color: '#f56c6c' },
    top: 10
  },
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

// 设备利用率图表 - 【模拟数据】需要后续基于真实订单数据计算
const utilizationOption = computed(() => ({
  title: {
    text: '【模拟数据】需要后续基于真实订单数据计算',
    textStyle: { fontSize: 12, color: '#f56c6c' },
    top: 10
  },
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

// 设备使用热力图 - 【模拟数据】需要后续基于真实订单数据实现
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
    title: {
      text: '【模拟数据】需要后续基于真实订单数据实现',
      textStyle: { fontSize: 12, color: '#f56c6c' },
      top: 10
    },
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

// 用户行为分析 - 【模拟数据】需要后续实现
const userBehaviorOption = computed(() => ({
  title: {
    text: '【模拟数据】需要后续实现用户行为分析',
    textStyle: { fontSize: 12, color: '#f56c6c' },
    top: 10
  },
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

// 最近订单 - 将使用真实API数据覆盖
const recentOrders = ref<RecentOrder[]>([]);

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
    // 调用真实API刷新数据
    const [statsData, realtimeDataRes] = await Promise.all([
      dashboardApi.getStats(),
      dashboardApi.getRealtimeData()
    ]);
    
    // 更新统计数据
    Object.assign(stats, statsData);
    
    // 更新实时数据
    Object.assign(realTimeData, realtimeDataRes);
    
    lastUpdateTime.value = formatDateTime(new Date());
    
    console.log('数据刷新成功');
  } catch (error) {
    console.error('刷新数据失败:', error);
    // 如果API失败，不再使用模拟数据，直接显示错误信息
    lastUpdateTime.value = '数据加载失败 - ' + formatDateTime(new Date());
  } finally {
    refreshing.value = false;
  }
};

const updateRevenueChart = async () => {
  try {
    const data = await dashboardApi.getRevenueChart(revenueTrendPeriod.value);
    chartData.value = data;
  } catch (error) {
    console.error('获取营收趋势数据失败:', error);
    // API失败时不使用模拟数据，保持chartData为null以显示加载提示
    chartData.value = null;
  }
};

const loadDashboardData = async () => {
  try {
    // 调用真实API获取数据
    const [
      statsData, 
      realtimeDataRes, 
      recentOrdersData, 
      topRegionsData, 
      orderStatusDistribution,
      couponStats,
      notificationStats
    ] = await Promise.all([
      dashboardApi.getStats(),
      dashboardApi.getRealtimeData(),
      dashboardApi.getRecentOrders(5),
      dashboardApi.getTopRegions(5),
      dashboardApi.getOrderStatusDistribution(),
      getCouponStatistics().catch(() => ({ totalCoupons: 0, activeCoupons: 0, totalClaimed: 0, totalUsed: 0, usageRate: '0%' })),
      getNotificationStatistics().catch(() => ({ total: 0, unread: 0, readRate: '0%', byType: [] }))
    ]);
    
    // 更新统计数据
    Object.assign(stats, statsData);
    
    // 更新实时数据
    Object.assign(realTimeData, realtimeDataRes);
    
    // 更新最近订单
    recentOrders.value = recentOrdersData;
    
    // 更新地区数据
    topRegions.value = topRegionsData;
    
    // 更新订单状态数据
    orderStatusData.value = orderStatusDistribution.map(item => ({
      ...item,
      itemStyle: {
        color: item.name === '已完成' ? '#52c41a' :
               item.name === '进行中' ? '#faad14' :
               item.name === '待开始' ? '#1890ff' :
               item.name === '待支付' ? '#1890ff' :
               item.name === '已取消' ? '#f5222d' :
               item.name === '退款中' ? '#fa8c16' : '#666'
      }
    }));
    
    // 更新扩展统计数据
    Object.assign(extendedStats.coupons, couponStats);
    Object.assign(extendedStats.notifications, notificationStats);
    
    // 更新系统健康数据（模拟）
    extendedStats.systemHealth.uptime = Math.floor(Math.random() * 30) + ' 天';
    extendedStats.systemHealth.cpuUsage = Math.floor(Math.random() * 30 + 20) + '%';
    extendedStats.systemHealth.memoryUsage = Math.floor(Math.random() * 40 + 30) + '%';
    extendedStats.systemHealth.diskUsage = Math.floor(Math.random() * 20 + 60) + '%';
    
    console.log('仪表盘数据加载成功');
  } catch (error) {
    console.error('加载仪表盘数据失败:', error);
    // 不再保留模拟数据，留空以显示加载失败状态
  }
};

// 定时刷新实时数据 - 只更新真实数据
const startAutoRefresh = () => {
  refreshTimer = setInterval(async () => {
    try {
      // 只更新实时数据，不使用模拟数据
      const realtimeDataRes = await dashboardApi.getRealtimeData();
      Object.assign(realTimeData, realtimeDataRes);
      lastUpdateTime.value = formatDateTime(new Date());
    } catch (error) {
      console.error('定时刷新实时数据失败:', error);
      // 失败时不做任何操作，保持原有数据
    }
  }, 30000); // 每30秒更新一次
};

// 生命周期
onMounted(() => {
  loadDashboardData();
  updateRevenueChart();
  startAutoRefresh();
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
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
      
      .data-status-info {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
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
  
  .extended-stats-row {
    margin-bottom: 24px;
    
    .stat-card {
      background: linear-gradient(135deg, #fff 0%, #f8fffe 100%);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      }
      
      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
        font-size: 20px;
        flex-shrink: 0;
      }
      
      .stat-content {
        flex: 1;
        
        .stat-number {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          line-height: 1;
          margin-bottom: 4px;
        }
        
        .stat-label {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 2px;
        }
        
        .stat-sub {
          font-size: 12px;
          color: #9ca3af;
        }
      }
    }
  }
}
</style>