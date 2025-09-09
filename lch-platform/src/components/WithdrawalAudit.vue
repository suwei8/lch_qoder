<template>
  <div class="withdrawal-audit">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fff7e6; color: #fa8c16;">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ withdrawalStats.pending }}</div>
            <div class="stat-label">待审核</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f6ffed; color: #52c41a;">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ withdrawalStats.approved }}</div>
            <div class="stat-label">已通过</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fff2f0; color: #ff4d4f;">
            <el-icon><CircleClose /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ withdrawalStats.rejected }}</div>
            <div class="stat-label">已拒绝</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f0f9ff; color: #0ea5e9;">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">¥{{ withdrawalStats.totalAmount }}</div>
            <div class="stat-label">提现总额</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 筛选工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="batchApprove" :disabled="selectedWithdrawals.length === 0">
          <el-icon><Check /></el-icon>
          批量通过
        </el-button>
        <el-button type="danger" @click="batchReject" :disabled="selectedWithdrawals.length === 0">
          <el-icon><Close /></el-icon>
          批量拒绝
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-select v-model="searchForm.status" placeholder="状态" style="width: 120px;" clearable>
          <el-option label="待审核" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已拒绝" value="rejected" />
          <el-option label="已完成" value="completed" />
        </el-select>
        <el-button type="primary" @click="getWithdrawalList" style="margin-left: 10px;">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>
    </div>

    <!-- 提现列表 -->
    <el-table 
      v-loading="loading" 
      :data="withdrawalList" 
      @selection-change="handleSelectionChange"
      stripe
    >
      <el-table-column type="selection" width="50" />
      <el-table-column prop="id" label="申请ID" width="100" />
      <el-table-column prop="merchant_name" label="商户名称" width="150" />
      <el-table-column prop="amount" label="提现金额" width="120">
        <template #default="{ row }">
          <span class="amount">¥{{ row.amount }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="bank_info" label="银行信息" width="200">
        <template #default="{ row }">
          <div>{{ row.bank_name }}</div>
          <div class="bank-account">{{ row.bank_account }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getWithdrawalStatusType(row.status)">
            {{ getWithdrawalStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="申请时间" width="150">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column prop="processed_at" label="处理时间" width="150">
        <template #default="{ row }">
          {{ row.processed_at ? formatDate(row.processed_at) : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button 
            v-if="row.status === 'pending'" 
            type="success" 
            size="small" 
            @click="approveWithdrawal(row)"
          >
            通过
          </el-button>
          <el-button 
            v-if="row.status === 'pending'" 
            type="danger" 
            size="small" 
            @click="rejectWithdrawal(row)"
          >
            拒绝
          </el-button>
          <el-button size="small" @click="viewWithdrawalDetail(row)">
            详情
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

    <!-- 拒绝原因对话框 -->
    <el-dialog v-model="rejectDialogVisible" title="拒绝提现申请" width="500px">
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="拒绝原因" required>
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入拒绝原因"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Clock,
  CircleCheck,
  CircleClose,
  Money,
  Check,
  Close,
  Search
} from '@element-plus/icons-vue';
import { formatDate } from '@/utils/format';

// 提现记录接口
interface WithdrawalRecord {
  id: number;
  merchant_name: string;
  amount: number;
  bank_name: string;
  bank_account: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: Date;
  processed_at?: Date;
  reject_reason?: string;
}

// 响应式数据
const loading = ref(false);
const withdrawalList = ref<WithdrawalRecord[]>([]);
const selectedWithdrawals = ref<WithdrawalRecord[]>([]);
const rejectDialogVisible = ref(false);
const currentWithdrawal = ref<WithdrawalRecord | null>(null);

const withdrawalStats = ref({
  pending: 12,
  approved: 89,
  rejected: 3,
  totalAmount: 125680
});

const searchForm = reactive({
  status: ''
});

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
});

const rejectForm = reactive({
  reason: ''
});

// 模拟数据
const mockWithdrawalData = (): WithdrawalRecord[] => {
  const statuses = ['pending', 'approved', 'rejected', 'completed'] as const;
  const merchants = ['星光洗车店', '阳光汽车美容', '快洁洗车', '蓝天洗车中心', '金辉汽车服务'];
  const banks = ['工商银行', '建设银行', '农业银行', '中国银行', '招商银行'];

  return Array.from({ length: 30 }, (_, i) => ({
    id: 1000 + i,
    merchant_name: merchants[i % merchants.length],
    amount: Math.floor(Math.random() * 10000) + 500,
    bank_name: banks[i % banks.length],
    bank_account: `**** **** **** ${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    status: statuses[i % statuses.length],
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    processed_at: i % 2 === 0 ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000) : undefined
  }));
};

// 获取提现列表
const getWithdrawalList = async () => {
  try {
    loading.value = true;
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockData = mockWithdrawalData();
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    withdrawalList.value = mockData.slice(start, end);
    pagination.total = mockData.length;
  } catch (error) {
    console.error('获取提现列表失败:', error);
    ElMessage.error('获取提现列表失败');
  } finally {
    loading.value = false;
  }
};

// 状态显示
const getWithdrawalStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    completed: 'info'
  };
  return typeMap[status] || 'info';
};

const getWithdrawalStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    completed: '已完成'
  };
  return textMap[status] || '未知';
};

// 事件处理
const handleSelectionChange = (selection: WithdrawalRecord[]) => {
  selectedWithdrawals.value = selection;
};

const handleSizeChange = (val: number) => {
  pagination.limit = val;
  getWithdrawalList();
};

const handleCurrentChange = (val: number) => {
  pagination.page = val;
  getWithdrawalList();
};

// 审核操作
const approveWithdrawal = async (row: WithdrawalRecord) => {
  ElMessageBox.confirm(`确定通过 ${row.merchant_name} 的提现申请吗？`, '提现审核', {
    confirmButtonText: '确定通过',
    cancelButtonText: '取消',
    type: 'success'
  }).then(async () => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      ElMessage.success('提现申请已通过');
      getWithdrawalList();
    } catch (error) {
      ElMessage.error('操作失败');
    }
  });
};

const rejectWithdrawal = (row: WithdrawalRecord) => {
  currentWithdrawal.value = row;
  rejectForm.reason = '';
  rejectDialogVisible.value = true;
};

const confirmReject = async () => {
  if (!rejectForm.reason.trim()) {
    ElMessage.warning('请输入拒绝原因');
    return;
  }

  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    ElMessage.success('提现申请已拒绝');
    rejectDialogVisible.value = false;
    getWithdrawalList();
  } catch (error) {
    ElMessage.error('操作失败');
  }
};

// 批量操作
const batchApprove = () => {
  ElMessageBox.confirm(`确定批量通过选中的 ${selectedWithdrawals.value.length} 个提现申请吗？`, '批量审核', {
    confirmButtonText: '确定通过',
    cancelButtonText: '取消',
    type: 'success'
  }).then(async () => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      ElMessage.success('批量通过成功');
      getWithdrawalList();
    } catch (error) {
      ElMessage.error('操作失败');
    }
  });
};

const batchReject = () => {
  ElMessage.info('批量拒绝功能开发中');
};

const viewWithdrawalDetail = (row: WithdrawalRecord) => {
  ElMessage.info(`查看提现详情: ${row.id}`);
};

// 初始化
onMounted(() => {
  getWithdrawalList();
});
</script>

<style scoped>
.withdrawal-audit {
  padding: 0;
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

.amount {
  font-weight: bold;
  color: #f56c6c;
}

.bank-account {
  font-size: 12px;
  color: #999;
}
</style>