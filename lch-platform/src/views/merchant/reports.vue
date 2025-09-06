<template>
  <div class="page-container">
    <el-card class="page-header" shadow="never">
      <h2>数据报表</h2>
      <p>经营数据统计分析、收入趋势、设备使用情况</p>
    </el-card>

    <!-- 时间范围选择 -->
    <el-card shadow="never" style="margin-top: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <el-radio-group v-model="timeRange" @change="handleTimeRangeChange">
            <el-radio-button label="today">今日</el-radio-button>
            <el-radio-button label="week">本周</el-radio-button>
            <el-radio-button label="month">本月</el-radio-button>
            <el-radio-button label="custom">自定义</el-radio-button>
          </el-radio-group>
          
          <el-date-picker
            v-if="timeRange === 'custom'"
            v-model="customDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="margin-left: 16px;"
            @change="handleCustomDateChange"
          />
        </div>
        
        <div>
          <el-button type="primary">
            <el-icon><Download /></el-icon>
            导出报表
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 核心指标概览 -->
    <el-card shadow="never" style="margin-top: 16px;">
      <template #header>
        <span>核心指标概览</span>
      </template>
      
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="metric-card">
            <div class="metric-icon revenue">
              <el-icon><Money /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value">¥{{ formatNumber(metrics.revenue) }}</div>
              <div class="metric-label">营业收入</div>
              <div class="metric-change positive">+12.5%</div>
            </div>
          </div>
        </el-col>
        
        <el-col :span="6">
          <div class="metric-card">
            <div class="metric-icon orders">
              <el-icon><Document /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ metrics.orders }}</div>
              <div class="metric-label">订单数量</div>
              <div class="metric-change positive">+8.3%</div>
            </div>
          </div>
        </el-col>
        
        <el-col :span="6">
          <div class="metric-card">
            <div class="metric-icon customers">
              <el-icon><User /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ metrics.customers }}</div>
              <div class="metric-label">活跃用户</div>
              <div class="metric-change positive">+15.7%</div>
            </div>
          </div>
        </el-col>
        
        <el-col :span="6">
          <div class="metric-card">
            <div class="metric-icon usage">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ metrics.usage }}%</div>
              <div class="metric-label">设备利用率</div>
              <div class="metric-change negative">-2.1%</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="16" style="margin-top: 16px;">
      <!-- 收入趋势图 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>收入趋势</span>
          </template>
          <div ref="revenueChartRef" style="height: 300px;"></div>
        </el-card>
      </el-col>

      <!-- 设备使用情况 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>设备使用情况</span>
          </template>
          <div ref="deviceChartRef" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细数据表格 -->
    <el-card shadow="never" style="margin-top: 16px;">
      <template #header>
        <span>订单明细</span>
      </template>
      
      <el-table :data="orderDetails" style="width: 100%;">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="orderCount" label="订单数" width="100" />
        <el-table-column prop="revenue" label="营收金额" width="120">
          <template #default="{ row }">
            <span style="color: #52c41a;">¥{{ row.revenue.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="avgOrderValue" label="客单价" width="100">
          <template #default="{ row }">
            ¥{{ row.avgOrderValue.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="newCustomers" label="新增用户" width="100" />
        <el-table-column prop="deviceUsage" label="设备利用率" width="120">
          <template #default="{ row }">
            {{ row.deviceUsage }}%
          </template>
        </el-table-column>
        <el-table-column prop="peakHour" label="高峰时段" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';

interface Metrics {
  revenue: number;
  orders: number;
  customers: number;
  usage: number;
}

interface OrderDetail {
  date: string;
  orderCount: number;
  revenue: number;
  avgOrderValue: number;
  newCustomers: number;
  deviceUsage: number;
  peakHour: string;
}

const timeRange = ref('month');
const customDateRange = ref<[Date, Date] | null>(null);
const revenueChartRef = ref<HTMLElement>();
const deviceChartRef = ref<HTMLElement>();

// 核心指标数据
const metrics = ref<Metrics>({
  revenue: 15678.90,
  orders: 234,
  customers: 89,
  usage: 76.5,
});

// 订单明细数据
const orderDetails = ref<OrderDetail[]>([
  {
    date: '2024-01-16',
    orderCount: 25,
    revenue: 856.50,
    avgOrderValue: 34.26,
    newCustomers: 5,
    deviceUsage: 82.3,
    peakHour: '14:00-16:00',
  },
  {
    date: '2024-01-15',
    orderCount: 32,
    revenue: 1024.80,
    avgOrderValue: 32.03,
    newCustomers: 8,
    deviceUsage: 78.9,
    peakHour: '10:00-12:00',
  },
  {
    date: '2024-01-14',
    orderCount: 18,
    revenue: 612.30,
    avgOrderValue: 34.02,
    newCustomers: 3,
    deviceUsage: 65.2,
    peakHour: '15:00-17:00',
  },
  {
    date: '2024-01-13',
    orderCount: 28,
    revenue: 945.60,
    avgOrderValue: 33.77,
    newCustomers: 7,
    deviceUsage: 85.1,
    peakHour: '09:00-11:00',
  },
  {
    date: '2024-01-12',
    orderCount: 35,
    revenue: 1234.50,
    avgOrderValue: 35.27,
    newCustomers: 12,
    deviceUsage: 91.3,
    peakHour: '13:00-15:00',
  },
]);

const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const handleTimeRangeChange = (value: string) => {
  ElMessage.info(`切换到${getTimeRangeLabel(value)}数据`);
  // TODO: 重新加载对应时间范围的数据
};

const handleCustomDateChange = (dates: [Date, Date] | null) => {
  if (dates) {
    ElMessage.info(`查询 ${dates[0].toDateString()} 至 ${dates[1].toDateString()} 的数据`);
    // TODO: 加载自定义时间范围的数据
  }
};

const getTimeRangeLabel = (range: string): string => {
  const labels: Record<string, string> = {
    today: '今日',
    week: '本周',
    month: '本月',
    custom: '自定义时间',
  };
  return labels[range] || range;
};

const initCharts = async () => {
  await nextTick();
  
  // 模拟图表初始化
  if (revenueChartRef.value) {
    revenueChartRef.value.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; background: #f5f5f5; border-radius: 4px;">
        <div style="text-align: center;">
          <p style="margin: 0; font-size: 16px;">📈 收入趋势图</p>
          <p style="margin: 8px 0 0 0; font-size: 14px;">图表组件集成中...</p>
        </div>
      </div>
    `;
  }
  
  if (deviceChartRef.value) {
    deviceChartRef.value.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; background: #f5f5f5; border-radius: 4px;">
        <div style="text-align: center;">
          <p style="margin: 0; font-size: 16px;">📊 设备使用饼图</p>
          <p style="margin: 8px 0 0 0; font-size: 14px;">图表组件集成中...</p>
        </div>
      </div>
    `;
  }
};

onMounted(() => {
  initCharts();
});
</script>

<style scoped>
.page-container {
  padding: 24px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #333;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.metric-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fff;
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: #fff;
}

.metric-icon.revenue {
  background: #52c41a;
}

.metric-icon.orders {
  background: #1890ff;
}

.metric-icon.customers {
  background: #722ed1;
}

.metric-icon.usage {
  background: #fa8c16;
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  line-height: 1;
}

.metric-label {
  color: #666;
  font-size: 14px;
  margin: 4px 0;
}

.metric-change {
  font-size: 12px;
  font-weight: 500;
}

.metric-change.positive {
  color: #52c41a;
}

.metric-change.negative {
  color: #ff4d4f;
}
</style>