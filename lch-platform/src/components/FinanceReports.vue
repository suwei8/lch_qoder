<template>
  <div class="finance-reports">
    <!-- 报表类型选择 -->
    <el-row :gutter="20" class="report-types">
      <el-col :span="6">
        <el-card class="report-card" :class="{ active: activeReport === 'revenue' }" @click="switchReport('revenue')">
          <div class="report-icon">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="report-title">收益报表</div>
          <div class="report-desc">查看平台收益趋势</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="report-card" :class="{ active: activeReport === 'merchant' }" @click="switchReport('merchant')">
          <div class="report-icon">
            <el-icon><Shop /></el-icon>
          </div>
          <div class="report-title">商户报表</div>
          <div class="report-desc">商户收益分析</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="report-card" :class="{ active: activeReport === 'commission' }" @click="switchReport('commission')">
          <div class="report-icon">
            <el-icon><Money /></el-icon>
          </div>
          <div class="report-title">分润报表</div>
          <div class="report-desc">分润数据统计</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="report-card" :class="{ active: activeReport === 'transaction' }" @click="switchReport('transaction')">
          <div class="report-icon">
            <el-icon><CreditCard /></el-icon>
          </div>
          <div class="report-title">交易报表</div>
          <div class="report-desc">交易数据分析</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 240px;"
          @change="handleDateChange"
        />
        <el-select v-model="timeRange" @change="handleTimeRangeChange" style="width: 120px; margin-left: 10px;">
          <el-option label="近7天" value="7days" />
          <el-option label="近30天" value="30days" />
          <el-option label="近3个月" value="3months" />
          <el-option label="近1年" value="1year" />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-button @click="exportReport">
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
        <el-button type="primary" @click="refreshReport">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 收益报表 -->
    <div v-if="activeReport === 'revenue'" class="report-content">
      <el-row :gutter="20">
        <el-col :span="16">
          <el-card title="收益趋势图">
            <div ref="revenueChart" style="height: 400px;"></div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card title="收益统计">
            <div class="stat-item">
              <span class="stat-label">总收益</span>
              <span class="stat-value">¥{{ revenueStats.total }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">平台收益</span>
              <span class="stat-value">¥{{ revenueStats.platform }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">商户收益</span>
              <span class="stat-value">¥{{ revenueStats.merchant }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">退款金额</span>
              <span class="stat-value text-red">¥{{ revenueStats.refund }}</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 商户报表 -->
    <div v-if="activeReport === 'merchant'" class="report-content">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card title="商户收益排行">
            <div ref="merchantChart" style="height: 400px;"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card title="商户分布">
            <div ref="merchantDistChart" style="height: 400px;"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 分润报表 -->
    <div v-if="activeReport === 'commission'" class="report-content">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-card title="分润趋势分析">
            <div ref="commissionChart" style="height: 400px;"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 交易报表 -->
    <div v-if="activeReport === 'transaction'" class="report-content">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card title="交易量趋势">
            <div ref="transactionChart" style="height: 400px;"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card title="支付方式分布">
            <div ref="paymentChart" style="height: 400px;"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import {
  TrendCharts,
  Shop,
  Money,
  CreditCard,
  Download,
  Refresh
} from '@element-plus/icons-vue';
import * as echarts from 'echarts';

// 响应式数据
const activeReport = ref('revenue');
const dateRange = ref<[Date, Date] | null>(null);
const timeRange = ref('30days');

const revenueStats = ref({
  total: 125680.50,
  platform: 18852.08,
  merchant: 106828.42,
  refund: 5426.30
});

// ECharts 实例
const revenueChart = ref();
const merchantChart = ref();
const merchantDistChart = ref();
const commissionChart = ref();
const transactionChart = ref();
const paymentChart = ref();

let revenueChartInstance: echarts.ECharts;
let merchantChartInstance: echarts.ECharts;
let merchantDistChartInstance: echarts.ECharts;
let commissionChartInstance: echarts.ECharts;
let transactionChartInstance: echarts.ECharts;
let paymentChartInstance: echarts.ECharts;

// 事件处理
const switchReport = (type: string) => {
  activeReport.value = type;
  nextTick(() => {
    initCharts();
  });
};

const handleDateChange = () => {
  refreshReport();
};

const handleTimeRangeChange = () => {
  refreshReport();
};

const exportReport = () => {
  ElMessage.success('报表导出功能开发中');
};

const refreshReport = () => {
  initCharts();
  ElMessage.success('数据已刷新');
};

// 初始化图表
const initCharts = () => {
  if (activeReport.value === 'revenue') {
    initRevenueChart();
  } else if (activeReport.value === 'merchant') {
    initMerchantChart();
    initMerchantDistChart();
  } else if (activeReport.value === 'commission') {
    initCommissionChart();
  } else if (activeReport.value === 'transaction') {
    initTransactionChart();
    initPaymentChart();
  }
};

// 收益趋势图
const initRevenueChart = () => {
  if (revenueChartInstance) {
    revenueChartInstance.dispose();
  }
  revenueChartInstance = echarts.init(revenueChart.value);
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['总收益', '平台收益', '商户收益']
    },
    xAxis: {
      type: 'category',
      data: ['01-01', '01-02', '01-03', '01-04', '01-05', '01-06', '01-07']
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [
      {
        name: '总收益',
        type: 'line',
        data: [1200, 1500, 1800, 1600, 2100, 1900, 2300]
      },
      {
        name: '平台收益',
        type: 'line',
        data: [180, 225, 270, 240, 315, 285, 345]
      },
      {
        name: '商户收益',
        type: 'line',
        data: [1020, 1275, 1530, 1360, 1785, 1615, 1955]
      }
    ]
  };
  
  revenueChartInstance.setOption(option);
};

// 商户收益排行图
const initMerchantChart = () => {
  if (merchantChartInstance) {
    merchantChartInstance.dispose();
  }
  merchantChartInstance = echarts.init(merchantChart.value);
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: ['星光洗车店', '阳光汽车美容', '快洁洗车', '蓝天洗车中心', '金辉汽车服务']
    },
    series: [
      {
        name: '收益',
        type: 'bar',
        data: [18203, 23489, 29034, 15698, 20567],
        itemStyle: {
          color: '#5470c6'
        }
      }
    ]
  };
  
  merchantChartInstance.setOption(option);
};

// 商户分布图
const initMerchantDistChart = () => {
  if (merchantDistChartInstance) {
    merchantDistChartInstance.dispose();
  }
  merchantDistChartInstance = echarts.init(merchantDistChart.value);
  
  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '商户类型',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 1048, name: '洗车店' },
          { value: 735, name: '汽车美容' },
          { value: 580, name: '综合服务' },
          { value: 484, name: '4S店' },
          { value: 300, name: '其他' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };
  
  merchantDistChartInstance.setOption(option);
};

// 分润趋势图
const initCommissionChart = () => {
  if (commissionChartInstance) {
    commissionChartInstance.dispose();
  }
  commissionChartInstance = echarts.init(commissionChart.value);
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['分润金额', '分润比例']
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: [
      {
        type: 'value',
        name: '分润金额',
        axisLabel: {
          formatter: '¥{value}'
        }
      },
      {
        type: 'value',
        name: '分润比例',
        axisLabel: {
          formatter: '{value}%'
        }
      }
    ],
    series: [
      {
        name: '分润金额',
        type: 'bar',
        data: [12000, 15000, 18000, 16000, 21000, 19000]
      },
      {
        name: '分润比例',
        type: 'line',
        yAxisIndex: 1,
        data: [15.2, 15.8, 16.1, 15.9, 16.5, 16.2]
      }
    ]
  };
  
  commissionChartInstance.setOption(option);
};

// 交易量趋势图
const initTransactionChart = () => {
  if (transactionChartInstance) {
    transactionChartInstance.dispose();
  }
  transactionChartInstance = echarts.init(transactionChart.value);
  
  const option = {
    tooltip: {
      trigger: 'axis'
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
        name: '交易量',
        type: 'line',
        data: [150, 230, 224, 218, 135, 147, 260],
        smooth: true,
        itemStyle: {
          color: '#91cc75'
        }
      }
    ]
  };
  
  transactionChartInstance.setOption(option);
};

// 支付方式分布图
const initPaymentChart = () => {
  if (paymentChartInstance) {
    paymentChartInstance.dispose();
  }
  paymentChartInstance = echarts.init(paymentChart.value);
  
  const option = {
    tooltip: {
      trigger: 'item'
    },
    series: [
      {
        name: '支付方式',
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
            fontSize: '30',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 1048, name: '微信支付' },
          { value: 735, name: '余额支付' },
          { value: 580, name: '赠送余额' }
        ]
      }
    ]
  };
  
  paymentChartInstance.setOption(option);
};

// 初始化
onMounted(() => {
  nextTick(() => {
    initRevenueChart();
  });
});
</script>

<style scoped>
.finance-reports {
  padding: 0;
}

.report-types {
  margin-bottom: 20px;
}

.report-card {
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.report-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.report-card.active {
  border-color: #409eff;
  box-shadow: 0 4px 20px rgba(64, 158, 255, 0.3);
}

.report-icon {
  font-size: 32px;
  color: #409eff;
  margin-bottom: 10px;
}

.report-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 5px;
}

.report-desc {
  font-size: 12px;
  color: #999;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.toolbar-right {
  display: flex;
  gap: 10px;
}

.report-content {
  margin-top: 20px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  color: #666;
}

.stat-value {
  font-weight: bold;
  font-size: 16px;
  color: #333;
}

.text-red {
  color: #f56c6c;
}
</style>