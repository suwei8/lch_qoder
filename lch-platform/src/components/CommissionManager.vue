<template>
  <div class="commission-manager">
    <!-- 分润统计 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-icon" style="background: #e6f7ff; color: #1890ff;">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">¥{{ commissionStats.totalCommission }}</div>
            <div class="stat-label">总分润金额</div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f6ffed; color: #52c41a;">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ commissionStats.avgCommissionRate }}%</div>
            <div class="stat-label">平均分润比例</div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fff7e6; color: #fa8c16;">
            <el-icon><Shop /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ commissionStats.merchantCount }}</div>
            <div class="stat-label">商户数量</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 操作工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="showAddCommissionRule">
          <el-icon><Plus /></el-icon>
          新增分润规则
        </el-button>
        <el-button @click="batchSetCommission" :disabled="selectedMerchants.length === 0">
          <el-icon><Setting /></el-icon>
          批量设置
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索商户名称"
          style="width: 200px;"
          clearable
        />
        <el-button type="primary" @click="getCommissionList" style="margin-left: 10px;">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>
    </div>

    <!-- 分润规则列表 -->
    <el-table 
      v-loading="loading" 
      :data="commissionList" 
      @selection-change="handleSelectionChange"
      stripe
    >
      <el-table-column type="selection" width="50" />
      <el-table-column prop="merchant_name" label="商户名称" width="150" />
      <el-table-column prop="commission_rate" label="分润比例" width="120">
        <template #default="{ row }">
          <span class="commission-rate">{{ row.commission_rate }}%</span>
        </template>
      </el-table-column>
      <el-table-column prop="commission_type" label="分润类型" width="120">
        <template #default="{ row }">
          <el-tag :type="getCommissionTypeColor(row.commission_type)">
            {{ getCommissionTypeText(row.commission_type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="total_revenue" label="总营收" width="120">
        <template #default="{ row }">
          ¥{{ row.total_revenue }}
        </template>
      </el-table-column>
      <el-table-column prop="commission_amount" label="分润金额" width="120">
        <template #default="{ row }">
          <span class="commission-amount">¥{{ row.commission_amount }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusColor(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updated_at" label="更新时间" width="150">
        <template #default="{ row }">
          {{ formatDate(row.updated_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="editCommissionRule(row)">
            编辑
          </el-button>
          <el-button 
            size="small" 
            type="primary" 
            @click="viewCommissionDetail(row)"
          >
            详情
          </el-button>
          <el-button 
            size="small" 
            type="danger" 
            @click="deleteCommissionRule(row)"
          >
            删除
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

    <!-- 新增/编辑分润规则对话框 -->
    <el-dialog 
      v-model="commissionDialogVisible" 
      :title="editingCommission ? '编辑分润规则' : '新增分润规则'" 
      width="600px"
    >
      <el-form :model="commissionForm" :rules="commissionRules" ref="commissionFormRef" label-width="120px">
        <el-form-item label="商户" prop="merchant_id">
          <el-select v-model="commissionForm.merchant_id" placeholder="请选择商户" style="width: 100%">
            <el-option label="星光洗车店" value="1" />
            <el-option label="阳光汽车美容" value="2" />
            <el-option label="快洁洗车" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="分润比例" prop="commission_rate">
          <el-input-number
            v-model="commissionForm.commission_rate"
            :min="0"
            :max="100"
            :precision="2"
            style="width: 200px;"
          />
          <span style="margin-left: 10px;">%</span>
        </el-form-item>
        <el-form-item label="分润类型" prop="commission_type">
          <el-radio-group v-model="commissionForm.commission_type">
            <el-radio label="fixed">固定比例</el-radio>
            <el-radio label="tiered">阶梯分润</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="生效时间" prop="effective_date">
          <el-date-picker
            v-model="commissionForm.effective_date"
            type="date"
            placeholder="请选择生效时间"
            style="width: 200px;"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="commissionForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="commissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCommissionRule">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Money,
  TrendCharts,
  Shop,
  Plus,
  Setting,
  Search
} from '@element-plus/icons-vue';
import { formatDate } from '@/utils/format';

// 分润记录接口
interface CommissionRecord {
  id: number;
  merchant_id: number;
  merchant_name: string;
  commission_rate: number;
  commission_type: 'fixed' | 'tiered';
  total_revenue: number;
  commission_amount: number;
  status: 'active' | 'inactive';
  updated_at: Date;
  remark?: string;
}

// 响应式数据
const loading = ref(false);
const commissionList = ref<CommissionRecord[]>([]);
const selectedMerchants = ref<CommissionRecord[]>([]);
const commissionDialogVisible = ref(false);
const editingCommission = ref(false);
const commissionFormRef = ref();

const commissionStats = ref({
  totalCommission: 85690.50,
  avgCommissionRate: 15.8,
  merchantCount: 56
});

const searchForm = reactive({
  keyword: ''
});

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
});

const commissionForm = reactive({
  merchant_id: '',
  commission_rate: 15,
  commission_type: 'fixed',
  effective_date: '',
  remark: ''
});

const commissionRules = {
  merchant_id: [{ required: true, message: '请选择商户', trigger: 'change' }],
  commission_rate: [{ required: true, message: '请输入分润比例', trigger: 'blur' }],
  commission_type: [{ required: true, message: '请选择分润类型', trigger: 'change' }],
  effective_date: [{ required: true, message: '请选择生效时间', trigger: 'change' }]
};

// 模拟数据
const mockCommissionData = (): CommissionRecord[] => {
  const types = ['fixed', 'tiered'] as const;
  const statuses = ['active', 'inactive'] as const;
  const merchants = ['星光洗车店', '阳光汽车美容', '快洁洗车', '蓝天洗车中心', '金辉汽车服务'];

  return Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    merchant_id: i + 1,
    merchant_name: merchants[i % merchants.length],
    commission_rate: Math.floor(Math.random() * 20) + 10,
    commission_type: types[i % types.length],
    total_revenue: Math.floor(Math.random() * 50000) + 10000,
    commission_amount: Math.floor(Math.random() * 8000) + 1500,
    status: statuses[i % statuses.length],
    updated_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
  }));
};

// 获取分润列表
const getCommissionList = async () => {
  try {
    loading.value = true;
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockData = mockCommissionData();
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    commissionList.value = mockData.slice(start, end);
    pagination.total = mockData.length;
  } catch (error) {
    console.error('获取分润列表失败:', error);
    ElMessage.error('获取分润列表失败');
  } finally {
    loading.value = false;
  }
};

// 状态显示
const getCommissionTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    fixed: 'primary',
    tiered: 'success'
  };
  return colorMap[type] || 'info';
};

const getCommissionTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    fixed: '固定比例',
    tiered: '阶梯分润'
  };
  return textMap[type] || '未知';
};

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    active: 'success',
    inactive: 'info'
  };
  return colorMap[status] || 'info';
};

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    active: '生效中',
    inactive: '已停用'
  };
  return textMap[status] || '未知';
};

// 事件处理
const handleSelectionChange = (selection: CommissionRecord[]) => {
  selectedMerchants.value = selection;
};

const handleSizeChange = (val: number) => {
  pagination.limit = val;
  getCommissionList();
};

const handleCurrentChange = (val: number) => {
  pagination.page = val;
  getCommissionList();
};

// 分润规则操作
const showAddCommissionRule = () => {
  editingCommission.value = false;
  resetCommissionForm();
  commissionDialogVisible.value = true;
};

const editCommissionRule = (row: CommissionRecord) => {
  editingCommission.value = true;
  Object.assign(commissionForm, {
    merchant_id: row.merchant_id,
    commission_rate: row.commission_rate,
    commission_type: row.commission_type,
    effective_date: '',
    remark: row.remark || ''
  });
  commissionDialogVisible.value = true;
};

const saveCommissionRule = async () => {
  try {
    await commissionFormRef.value.validate();
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    ElMessage.success(editingCommission.value ? '分润规则更新成功' : '分润规则创建成功');
    commissionDialogVisible.value = false;
    getCommissionList();
  } catch (error) {
    console.error('保存分润规则失败:', error);
  }
};

const deleteCommissionRule = (row: CommissionRecord) => {
  ElMessageBox.confirm(`确定删除 ${row.merchant_name} 的分润规则吗？`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      ElMessage.success('分润规则删除成功');
      getCommissionList();
    } catch (error) {
      ElMessage.error('删除失败');
    }
  });
};

const resetCommissionForm = () => {
  Object.assign(commissionForm, {
    merchant_id: '',
    commission_rate: 15,
    commission_type: 'fixed',
    effective_date: '',
    remark: ''
  });
};

const batchSetCommission = () => {
  ElMessage.info('批量设置功能开发中');
};

const viewCommissionDetail = (row: CommissionRecord) => {
  ElMessage.info(`查看分润详情: ${row.merchant_name}`);
};

// 初始化
onMounted(() => {
  getCommissionList();
});
</script>

<style scoped>
.commission-manager {
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

.commission-rate {
  font-weight: bold;
  color: #1890ff;
}

.commission-amount {
  font-weight: bold;
  color: #52c41a;
}
</style>