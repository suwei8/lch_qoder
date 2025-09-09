<template>
  <div class="device-analytics-container">
    <div class="page-header">
      <h1>设备分析报表</h1>
      <div class="header-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="handleDateChange"
        />
        <el-button type="primary" @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-button @click="exportReport">
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
      </div>
    </div>

    <!-- 总体统计卡片 -->
    <div class="summary-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="summary-card">
            <div class="card-content">
              <div class="card-icon" style="background: #e6f7ff; color: #1890ff;">
                <el-icon><Monitor /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">{{ summary.totalDevices }}</div>
                <div class="card-label">设备总数</div>
                <div class="card-trend">
                  <span class="trend-text">较上期</span>
                  <span :class="['trend-value', summary.deviceTrend >= 0 ? 'trend-up' : 'trend-down']">
                    {{ summary.deviceTrend >= 0 ? '+' : '' }}{{ summary.deviceTrend }}%
                  </span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="summary-card">
            <div class="card-content">
              <div class="card-icon" style="background: #f6ffed; color: #52c41a;">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">{{ summary.totalUsage }}</div>
                <div class="card-label">总使用次数</div>
                <div class="card-trend">
                  <span class="trend-text">较上期</span>
                  <span :class="['trend-value', summary.usageTrend >= 0 ? 'trend-up' : 'trend-down']">
                    {{ summary.usageTrend >= 0 ? '+' : '' }}{{ summary.usageTrend }}%
                  </span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="summary-card">
            <div class="card-content">
              <div class="card-icon" style="background: #fff7e6; color: #fa8c16;">
                <el-icon><Money /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">¥{{ summary.totalRevenue.toLocaleString() }}</div>
                <div class="card-label">总收益</div>
                <div class="card-trend">
                  <span class="trend-text">较上期</span>
                  <span :class="['trend-value', summary.revenueTrend >= 0 ? 'trend-up' : 'trend-down']">
                    {{ summary.revenueTrend >= 0 ? '+' : '' }}{{ summary.revenueTrend }}%
                  </span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="summary-card">
            <div class="card-content">
              <div class="card-icon" style="background: #fff2f0; color: #ff4d4f;">
                <el-icon><Timer /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">{{ (summary.avgUsageTime / 60).toFixed(1) }}h</div>
                <div class="card-label">平均使用时长</div>
                <div class="card-trend">
                  <span class="trend-text">较上期</span>
                  <span :class="['trend-value', summary.timeTrend >= 0 ? 'trend-up' : 'trend-down']">
                    {{ summary.timeTrend >= 0 ? '+' : '' }}{{ summary.timeTrend }}%
                  </span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <!-- 使用趋势图 -->
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span class="card-title">设备使用趋势</span>
                <el-select v-model="usageTrendType" size="small" style="width: 100px">
                  <el-option label="日" value="day" />
                  <el-option label="周" value="week" />
                  <el-option label="月" value="month" />
                </el-select>
              </div>
            </template>
            <div ref="usageTrendChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
        
        <!-- 收益分析图 -->
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <span class="card-title">收益分析</span>
            </template>
            <div ref="revenueChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <!-- 设备状态分布 -->
        <el-col :span="8">
          <el-card class="chart-card">
            <template #header>
              <span class="card-title">设备状态分布</span>
            </template>
            <div ref="statusDistributionChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
        
        <!-- 设备使用率排名 -->
        <el-col :span="16">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span class="card-title">设备使用率排名</span>
                <el-select v-model="rankingType" size="small" style="width: 120px">
                  <el-option label="使用次数" value="usage" />
                  <el-option label="收益" value="revenue" />
                  <el-option label="在线时长" value="online" />
                </el-select>
              </div>
            </template>
            <div ref="rankingChartRef" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 数据表格 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">设备详细数据</span>
          <div class="header-tools">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索设备名称"
              style="width: 200px"
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>
      </template>
      
      <el-table
        :data="filteredDeviceData"
        v-loading="loading"
        border
        @sort-change="handleSortChange"
      >
        <el-table-column prop="name" label="设备名称" min-width="150" />
        <el-table-column prop="location" label="位置" min-width="200" />
        <el-table-column 
          prop="usageCount" 
          label="使用次数" 
          width="100" 
          sortable="custom"
          align="center"
        />
        <el-table-column 
          prop="revenue" 
          label="收益(元)" 
          width="120" 
          sortable="custom"
          align="center"
        >
          <template #default="{ row }">
            ¥{{ row.revenue.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column 
          prop="onlineRate" 
          label="在线率" 
          width="100" 
          sortable="custom"
          align="center"
        >
          <template #default="{ row }">
            {{ row.onlineRate }}%
          </template>
        </el-table-column>
        <el-table-column 
          prop="utilizationRate" 
          label="使用率" 
          width="100" 
          sortable="custom"
          align="center"
        >
          <template #default="{ row }">
            <el-progress 
              :percentage="row.utilizationRate" 
              :color="getUtilizationColor(row.utilizationRate)"
              :show-text="false"
              style="width: 60px"
            />
            <span style="margin-left: 8px">{{ row.utilizationRate }}%</span>
          </template>
        </el-table-column>
        <el-table-column 
          prop="avgUsageTime" 
          label="平均使用时长" 
          width="120" 
          align="center"
        >
          <template #default="{ row }">
            {{ Math.floor(row.avgUsageTime / 60) }}分{{ row.avgUsageTime % 60 }}秒
          </template>
        </el-table-column>
        <el-table-column prop="lastUsedAt" label="最后使用时间" width="150">
          <template #default="{ row }">
            {{ formatTime(row.lastUsedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="viewDeviceDetail(row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { 
  Refresh, 
  Download, 
  Monitor, 
  TrendCharts, 
  Money, 
  Timer,
  Search
} from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import { formatTime } from '@/utils/format';

// 响应式数据
const loading = ref(false);
const dateRange = ref<[string, string]>([
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  new Date().toISOString().split('T')[0]
]);
const usageTrendType = ref('day');
const rankingType = ref('usage');
const searchKeyword = ref('');

// 图表引用
const usageTrendChartRef = ref<HTMLElement>();
const revenueChartRef = ref<HTMLElement>();
const statusDistributionChartRef = ref<HTMLElement>();
const rankingChartRef = ref<HTMLElement>();

// 总结数据
const summary = ref({
  totalDevices: 45,
  totalUsage: 12345,
  totalRevenue: 567890,
  avgUsageTime: 1800, // 秒
  deviceTrend: 5.2,
  usageTrend: 12.8,
  revenueTrend: 15.6,
  timeTrend: -2.3,
});

// 设备数据
const deviceData = ref([
  {
    id: 1,
    name: '洗车机-001',
    location: '北京市朝阳区建国门大街1号',
    usageCount: 156,
    revenue: 7800,
    onlineRate: 95,
    utilizationRate: 78,
    avgUsageTime: 1200,
    lastUsedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 2,
    name: '洗车机-002',
    location: '上海市浦东新区世纪大道100号',
    usageCount: 203,
    revenue: 10150,
    onlineRate: 88,
    utilizationRate: 85,
    avgUsageTime: 1350,
    lastUsedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: 3,
    name: '洗车机-003',
    location: '广州市天河区珠江新城天河路38号',
    usageCount: 89,
    revenue: 4450,
    onlineRate: 92,
    utilizationRate: 56,
    avgUsageTime: 980,
    lastUsedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  // 添加更多模拟数据
  ...Array.from({ length: 20 }, (_, i) => ({
    id: i + 4,
    name: `洗车机-${String(i + 4).padStart(3, '0')}`,
    location: `测试地址${i + 4}号`,
    usageCount: Math.floor(Math.random() * 200) + 50,
    revenue: Math.floor(Math.random() * 10000) + 2000,
    onlineRate: Math.floor(Math.random() * 20) + 80,
    utilizationRate: Math.floor(Math.random() * 40) + 40,
    avgUsageTime: Math.floor(Math.random() * 800) + 800,
    lastUsedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
  }))
]);

// 分页信息
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
});

// 筛选后的设备数据
const filteredDeviceData = computed(() => {
  let filtered = deviceData.value;
  
  if (searchKeyword.value) {
    filtered = filtered.filter(device => 
      device.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      device.location.toLowerCase().includes(searchKeyword.value.toLowerCase())
    );
  }
  
  pagination.total = filtered.length;
  const start = (pagination.page - 1) * pagination.limit;
  const end = start + pagination.limit;
  
  return filtered.slice(start, end);
});

// 使用率颜色
const getUtilizationColor = (rate: number) => {
  if (rate >= 80) return '#67c23a';
  if (rate >= 60) return '#e6a23c';
  if (rate >= 40) return '#f56c6c';
  return '#909399';
};

// 初始化图表
const initCharts = async () => {
  await nextTick();
  
  // 使用趋势图
  if (usageTrendChartRef.value) {
    const usageTrendChart = echarts.init(usageTrendChartRef.value);
    const option = {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['使用次数', '收益']
      },
      xAxis: {
        type: 'category',
        data: ['1日', '2日', '3日', '4日', '5日', '6日', '7日'],
      },
      yAxis: [
        {
          type: 'value',
          name: '使用次数',
        },
        {
          type: 'value',
          name: '收益(元)',
        }
      ],
      series: [
        {
          name: '使用次数',
          type: 'line',
          data: [120, 132, 101, 134, 90, 230, 210],
          smooth: true,
        },
        {
          name: '收益',
          type: 'line',
          yAxisIndex: 1,
          data: [6000, 6600, 5050, 6700, 4500, 11500, 10500],
          smooth: true,
        }
      ]
    };
    usageTrendChart.setOption(option);
  }

  // 收益分析图
  if (revenueChartRef.value) {
    const revenueChart = echarts.init(revenueChartRef.value);
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['目标收益', '实际收益']
      },
      xAxis: {
        type: 'category',
        data: ['1月', '2月', '3月', '4月', '5月', '6月'],
      },
      yAxis: {
        type: 'value',
        name: '收益(元)'
      },
      series: [
        {
          name: '目标收益',
          type: 'bar',
          data: [50000, 52000, 55000, 58000, 60000, 62000],
          itemStyle: {
            color: '#91cc75'
          }
        },
        {
          name: '实际收益',
          type: 'bar',
          data: [48000, 54000, 52000, 61000, 58000, 65000],
          itemStyle: {
            color: '#5470c6'
          }
        }
      ]
    };
    revenueChart.setOption(option);
  }

  // 设备状态分布
  if (statusDistributionChartRef.value) {
    const statusChart = echarts.init(statusDistributionChartRef.value);
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        data: ['在线', '离线', '故障', '维护']
      },
      series: [
        {
          name: '设备状态',
          type: 'pie',
          radius: '50%',
          data: [
            { value: 35, name: '在线', itemStyle: { color: '#67c23a' } },
            { value: 6, name: '离线', itemStyle: { color: '#909399' } },
            { value: 3, name: '故障', itemStyle: { color: '#f56c6c' } },
            { value: 1, name: '维护', itemStyle: { color: '#e6a23c' } }
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
    statusChart.setOption(option);
  }

  // 设备使用率排名
  if (rankingChartRef.value) {
    const rankingChart = echarts.init(rankingChartRef.value);
    const topDevices = deviceData.value
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);
    
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: '使用次数'
      },
      yAxis: {
        type: 'category',
        data: topDevices.map(d => d.name)
      },
      series: [
        {
          name: '使用次数',
          type: 'bar',
          data: topDevices.map(d => d.usageCount),
          itemStyle: {
            color: '#5470c6'
          }
        }
      ]
    };
    rankingChart.setOption(option);
  }
};

// 事件处理
const handleDateChange = () => {
  refreshData();
};

const refreshData = async () => {
  loading.value = true;
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 重新初始化图表
    await initCharts();
    
    ElMessage.success('数据刷新成功');
  } catch (error) {
    ElMessage.error('数据刷新失败');
  } finally {
    loading.value = false;
  }
};

const exportReport = () => {
  ElMessage.info('报表导出功能开发中');
};

const handleSearch = () => {
  pagination.page = 1;
};

const handleSortChange = ({ prop, order }: any) => {
  if (!prop || !order) return;
  
  const isAsc = order === 'ascending';
  deviceData.value.sort((a: any, b: any) => {
    if (isAsc) {
      return a[prop] - b[prop];
    } else {
      return b[prop] - a[prop];
    }
  });
};

const handleSizeChange = (val: number) => {
  pagination.limit = val;
  pagination.page = 1;
};

const handleCurrentChange = (val: number) => {
  pagination.page = val;
};

const viewDeviceDetail = (device: any) => {
  ElMessage.info(`查看设备详情: ${device.name}`);
};

// 监听图表类型变化
watch([usageTrendType, rankingType], () => {
  initCharts();
});

// 初始化
onMounted(() => {
  pagination.total = deviceData.value.length;
  initCharts();
});
</script>

<style scoped>
.device-analytics-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 500;
  }
  
  .header-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }
}

.summary-cards {
  margin-bottom: 20px;
  
  .summary-card {
    .card-content {
      display: flex;
      align-items: center;
      
      .card-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
        
        .el-icon {
          font-size: 24px;
        }
      }
      
      .card-info {
        flex: 1;
        
        .card-value {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 4px;
        }
        
        .card-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }
        
        .card-trend {
          display: flex;
          align-items: center;
          gap: 4px;
          
          .trend-text {
            font-size: 12px;
            color: #999;
          }
          
          .trend-value {
            font-size: 12px;
            font-weight: 500;
            
            &.trend-up {
              color: #67c23a;
            }
            
            &.trend-down {
              color: #f56c6c;
            }
          }
        }
      }
    }
  }
}

.charts-section {
  margin-bottom: 20px;
  
  .chart-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .card-title {
      font-weight: 600;
      font-size: 16px;
    }
    
    .chart-container {
      width: 100%;
      height: 300px;
    }
  }
}

.table-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .card-title {
    font-weight: 600;
    font-size: 16px;
  }
  
  .header-tools {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  
  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }
}
</style>