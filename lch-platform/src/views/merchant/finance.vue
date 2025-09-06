<template>
  <div class="merchant-finance">
    <div class="page-header">
      <h1>财务管理</h1>
      <p>查看收入统计和提现记录</p>
    </div>

    <!-- 财务概览 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #e6f7ff; color: #1890ff;">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">¥{{ financeStats.totalRevenue }}</div>
            <div class="stat-label">总收入</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f6ffed; color: #52c41a;">
            <el-icon><WalletFilled /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">¥{{ financeStats.availableBalance }}</div>
            <div class="stat-label">可提现余额</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fff2e8; color: #fa8c16;">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">¥{{ financeStats.pendingSettlement }}</div>
            <div class="stat-label">待结算</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f9f0ff; color: #722ed1;">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">¥{{ financeStats.todayRevenue }}</div>
            <div class="stat-label">今日收入</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 提现申请 -->
    <div class="withdraw-section">
      <h2>提现申请</h2>
      <div class="withdraw-form">
        <el-form :model="withdrawForm" :rules="withdrawRules" ref="withdrawFormRef" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="提现金额" prop="amount">
                <el-input 
                  v-model="withdrawForm.amount" 
                  placeholder="请输入提现金额"
                  type="number"
                  step="0.01"
                >
                  <template #append>元</template>
                </el-input>
                <div class="form-tip">
                  可提现余额：¥{{ financeStats.availableBalance }}
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="提现方式" prop="method">
                <el-select v-model="withdrawForm.method" placeholder="请选择提现方式">
                  <el-option label="银行卡" value="bank" />
                  <el-option label="支付宝" value="alipay" />
                  <el-option label="微信" value="wechat" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="账户信息" prop="account">
            <el-input 
              v-model="withdrawForm.account" 
              placeholder="请输入账户号码"
            />
          </el-form-item>
          <el-form-item label="账户姓名" prop="accountName">
            <el-input 
              v-model="withdrawForm.accountName" 
              placeholder="请输入账户姓名"
            />
          </el-form-item>
          <el-form-item label="备注">
            <el-input 
              v-model="withdrawForm.remark" 
              placeholder="提现备注（可选）"
              type="textarea"
              rows="3"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="submitWithdraw">申请提现</el-button>
            <el-button @click="resetWithdrawForm">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 收入统计图表 -->
    <div class="chart-section">
      <h2>收入趋势</h2>
      <div class="chart-container">
        <div class="chart-placeholder">
          <el-icon><TrendCharts /></el-icon>
          <p>收入趋势图表功能开发中</p>
        </div>
      </div>
    </div>

    <!-- 财务记录 -->
    <div class="finance-records">
      <div class="records-header">
        <h2>财务记录</h2>
        <el-radio-group v-model="recordType" @change="loadFinanceRecords">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="income">收入</el-radio-button>
          <el-radio-button label="withdraw">提现</el-radio-button>
        </el-radio-group>
      </div>

      <el-table :data="financeRecords" style="width: 100%">
        <el-table-column prop="id" label="记录ID" width="120" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="scope">
            <el-tag 
              :type="getRecordType(scope.row.type)"
              size="small"
            >
              {{ getRecordText(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="scope">
            <span :class="scope.row.type === 'income' ? 'text-success' : 'text-danger'">
              {{ scope.row.type === 'income' ? '+' : '-' }}¥{{ (scope.row.amount / 100).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
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
        <el-table-column prop="createdAt" label="时间" width="160">
          <template #default="scope">
            {{ formatDateTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

// 财务统计数据
const financeStats = ref({
  totalRevenue: '0.00',
  availableBalance: '0.00',
  pendingSettlement: '0.00',
  todayRevenue: '0.00',
});

// 提现表单
const withdrawForm = reactive({
  amount: '',
  method: '',
  account: '',
  accountName: '',
  remark: '',
});

const withdrawFormRef = ref<FormInstance>();

// 提现表单验证规则
const withdrawRules: FormRules = {
  amount: [
    { required: true, message: '请输入提现金额', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        const amount = parseFloat(value);
        const available = parseFloat(financeStats.value.availableBalance);
        if (amount <= 0) {
          callback(new Error('提现金额必须大于0'));
        } else if (amount > available) {
          callback(new Error('提现金额不能超过可提现余额'));
        } else {
          callback();
        }
      }, 
      trigger: 'blur' 
    },
  ],
  method: [
    { required: true, message: '请选择提现方式', trigger: 'change' },
  ],
  account: [
    { required: true, message: '请输入账户号码', trigger: 'blur' },
  ],
  accountName: [
    { required: true, message: '请输入账户姓名', trigger: 'blur' },
  ],
};

// 记录类型
const recordType = ref('all');

// 财务记录
const financeRecords = ref<any[]>([]);

// 格式化日期时间
const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN');
};

// 获取记录类型
const getRecordType = (type: string) => {
  return type === 'income' ? 'success' : 'warning';
};

// 获取记录文本
const getRecordText = (type: string) => {
  const typeMap: Record<string, string> = {
    'income': '收入',
    'withdraw': '提现',
  };
  return typeMap[type] || type;
};

// 获取状态类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    'completed': 'success',
    'pending': 'warning',
    'failed': 'danger',
  };
  return statusMap[status] || 'info';
};

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'completed': '已完成',
    'pending': '处理中',
    'failed': '失败',
  };
  return statusMap[status] || status;
};

// 提交提现申请
const submitWithdraw = async () => {
  if (!withdrawFormRef.value) return;
  
  try {
    await withdrawFormRef.value.validate();
    ElMessage.success('提现申请已提交，请等待审核');
    resetWithdrawForm();
    loadFinanceRecords();
  } catch (error) {
    console.error('提现申请失败:', error);
  }
};

// 重置提现表单
const resetWithdrawForm = () => {
  withdrawFormRef.value?.resetFields();
};

// 加载财务记录
const loadFinanceRecords = () => {
  const recordCount = Math.floor(Math.random() * 20) + 10;
  
  financeRecords.value = Array.from({ length: recordCount }, (_, index) => {
    const type = Math.random() > 0.3 ? 'income' : 'withdraw';
    const status = ['completed', 'pending', 'failed'][Math.floor(Math.random() * 3)];
    
    return {
      id: `FIN${Date.now()}${String(index).padStart(3, '0')}`,
      type,
      amount: Math.floor(Math.random() * 5000) + 100,
      description: type === 'income' ? 
        `订单收入 - LCH${Date.now()}${String(index).padStart(3, '0')}` : 
        `提现申请 - ${['银行卡', '支付宝', '微信'][Math.floor(Math.random() * 3)]}`,
      status,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // 根据类型筛选
  if (recordType.value !== 'all') {
    financeRecords.value = financeRecords.value.filter(record => record.type === recordType.value);
  }
};

// 加载模拟财务数据
const loadMockFinanceData = () => {
  const totalRevenue = Math.random() * 50000 + 10000;
  const pendingSettlement = Math.random() * 5000 + 1000;
  const availableBalance = totalRevenue - pendingSettlement - Math.random() * 10000;
  
  financeStats.value = {
    totalRevenue: totalRevenue.toFixed(2),
    availableBalance: Math.max(0, availableBalance).toFixed(2),
    pendingSettlement: pendingSettlement.toFixed(2),
    todayRevenue: (Math.random() * 1000 + 100).toFixed(2),
  };
};

onMounted(() => {
  loadMockFinanceData();
  loadFinanceRecords();
});
</script>

<style scoped>
.merchant-finance {
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

.withdraw-section,
.chart-section,
.finance-records {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.withdraw-section h2,
.chart-section h2 {
  margin: 0 0 20px 0;
  color: #333;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.chart-container {
  height: 300px;
  border: 1px dashed #e8e8e8;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.chart-placeholder .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.records-header h2 {
  margin: 0;
  color: #333;
}

.text-success {
  color: #52c41a;
}

.text-danger {
  color: #ff4d4f;
}
</style>