<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">财务管理</h1>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #e6f7ff; color: #1890ff;">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">¥{{ financeStats.totalRevenue }}</div>
            <div class="stat-label">总收益</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f6ffed; color: #52c41a;">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">¥{{ financeStats.todayRevenue }}</div>
            <div class="stat-label">今日收益</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fff7e6; color: #fa8c16;">
            <el-icon><Wallet /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">¥{{ financeStats.pendingSettlement }}</div>
            <div class="stat-label">待结算</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f0f9ff; color: #0ea5e9;">
            <el-icon><CreditCard /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ financeStats.totalTransactions }}</div>
            <div class="stat-label">总交易数</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 导航标签 -->
    <el-tabs v-model="activeTab" class="finance-tabs">
      <el-tab-pane label="交易记录" name="transactions">
        <!-- 操作栏 -->
        <div class="toolbar">
          <div class="toolbar-left">
            <el-button type="primary" @click="handleSettlement">
              <el-icon><Money /></el-icon>
              批量结算
            </el-button>
            <el-button @click="handleExportFinance">
              <el-icon><Download /></el-icon>
              导出财务报表
            </el-button>
          </div>
          <div class="toolbar-right">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 240px;"
            />
            <el-select
              v-model="searchForm.type"
              placeholder="交易类型"
              style="width: 120px; margin-left: 10px;"
              clearable
            >
              <el-option label="收入" value="income" />
              <el-option label="结算" value="settlement" />
              <el-option label="退款" value="refund" />
            </el-select>
            <el-button type="primary" @click="handleSearch" style="margin-left: 10px;">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
          </div>
        </div>

        <!-- 财务记录列表 -->
        <el-table v-loading="loading" :data="financeList" stripe>
          <el-table-column type="selection" width="50" />
          <el-table-column prop="id" label="流水号" width="100" />
          <el-table-column prop="order_id" label="订单号" width="120" />
          <el-table-column prop="merchant_name" label="商户" width="150" />
          <el-table-column label="类型" width="100">
            <template #default="{ row }">
              <el-tag 
                :type="getTypeColor(row.type)"
                effect="light"
              >
                {{ getTypeText(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" width="120">
            <template #default="{ row }">
              <span :class="{ 'text-red': row.amount < 0, 'text-green': row.amount > 0 }">
                {{ row.amount > 0 ? '+' : '' }}¥{{ Math.abs(row.amount) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="platform_fee" label="平台费用" width="100">
            <template #default="{ row }">
              ¥{{ row.platform_fee || 0 }}
            </template>
          </el-table-column>
          <el-table-column prop="merchant_amount" label="商户收益" width="120">
            <template #default="{ row }">
              ¥{{ row.merchant_amount || 0 }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag 
                :type="getStatusColor(row.status)"
                effect="plain"
              >
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="150">
            <template #default="{ row }">
              {{ formatTime(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small" 
                link
                @click="handleViewDetail(row)"
              >
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
      </el-tab-pane>

      <el-tab-pane label="提现审核" name="withdrawals">
        <WithdrawalAudit />
      </el-tab-pane>

      <el-tab-pane label="分润管理" name="commission">
        <CommissionManager />
      </el-tab-pane>

      <el-tab-pane label="财务报表" name="reports">
        <FinanceReports />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Money, 
  TrendCharts, 
  Wallet, 
  CreditCard,
  Download, 
  Search
} from '@element-plus/icons-vue';
import { formatTime } from '@/utils/format';
import WithdrawalAudit from '@/components/WithdrawalAudit.vue';
import CommissionManager from '@/components/CommissionManager.vue';
import FinanceReports from '@/components/FinanceReports.vue';

// 财务记录接口定义
interface FinanceRecord {
  id: number;
  order_id?: string;
  merchant_name: string;
  type: 'income' | 'settlement' | 'refund';
  amount: number;
  platform_fee?: number;
  merchant_amount?: number;
  status: 'pending' | 'completed' | 'failed';
  created_at: Date;
  remark?: string;
}

// 响应式数据
const activeTab = ref('transactions');
const loading = ref(false);
const financeList = ref<FinanceRecord[]>([]);
const financeStats = ref({
  totalRevenue: 0,
  todayRevenue: 0,
  pendingSettlement: 0,
  totalTransactions: 0
});

// 搜索表单
const searchForm = reactive({
  dateRange: [] as Date[],
  type: '',
  page: 1,
  limit: 20
});

// 分页信息
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
});

// 模拟数据
const mockFinanceData = (): FinanceRecord[] => {
  const types = ['income', 'settlement', 'refund'] as const;
  const statuses = ['pending', 'completed', 'failed'] as const;
  const merchants = ['星光洗车店', '阳光汽车美容', '快洁洗车', '蓝天洗车中心', '金辉汽车服务'];
  
  return Array.from({ length: 50 }, (_, i) => ({
    id: 10000 + i,
    order_id: `ORD${String(Date.now() + i).slice(-8)}`,
    merchant_name: merchants[i % merchants.length],
    type: types[i % types.length],
    amount: Math.floor(Math.random() * 500) + 10,
    platform_fee: Math.floor(Math.random() * 20) + 1,
    merchant_amount: Math.floor(Math.random() * 400) + 10,
    status: statuses[i % statuses.length],
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    remark: i % 3 === 0 ? '正常交易' : undefined
  }));
};

// 获取财务记录列表
const getFinanceList = async () => {
  try {
    loading.value = true;
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockData = mockFinanceData();
    
    // 模拟分页
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    financeList.value = mockData.slice(start, end);
    pagination.total = mockData.length;
  } catch (error) {
    console.error('获取财务记录失败:', error);
    ElMessage.error('获取财务记录失败');
  } finally {
    loading.value = false;
  }
};

// 获取财务统计
const getFinanceStats = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300));
    financeStats.value = {
      totalRevenue: 125680.50,
      todayRevenue: 3420.80,
      pendingSettlement: 15680.20,
      totalTransactions: 1256
    };
  } catch (error) {
    console.error('获取财务统计失败:', error);
  }
};

// 类型和状态显示
const getTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    income: 'success',
    settlement: 'primary',
    refund: 'warning'
  };
  return colorMap[type] || 'info';
};

const getTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    income: '收入',
    settlement: '结算',
    refund: '退款'
  };
  return textMap[type] || '未知';
};

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    pending: 'warning',
    completed: 'success',
    failed: 'danger'
  };
  return colorMap[status] || 'info';
};

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending: '处理中',
    completed: '已完成',
    failed: '失败'
  };
  return textMap[status] || '未知';
};

// 事件处理
const handleSearch = () => {
  pagination.page = 1;
  getFinanceList();
};

const handleSizeChange = (val: number) => {
  pagination.limit = val;
  getFinanceList();
};

const handleCurrentChange = (val: number) => {
  pagination.page = val;
  getFinanceList();
};

const handleSettlement = () => {
  ElMessageBox.confirm('确定要进行批量结算操作吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('批量结算操作已提交，请等待处理');
  });
};

const handleExportFinance = () => {
  ElMessage.success('财务报表导出功能开发中');
};

const handleViewDetail = (row: FinanceRecord) => {
  ElMessage.info(`查看财务记录详情: ${row.id}`);
};

// 初始化
onMounted(() => {
  getFinanceList();
  getFinanceStats();
});
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
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
  gap: 10px;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.text-red {
  color: #f56c6c;
}

.text-green {
  color: #67c23a;
}

.finance-tabs {
  margin-top: 20px;
}

.finance-tabs .el-tabs__header {
  margin: 0 0 20px;
}

.finance-tabs .el-tabs__content {
  padding: 0;
}
</style>