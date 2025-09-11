<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">商户管理</h1>
      <div class="page-actions">
        <!-- 新增商户功能暂未实现 -->
        <!-- <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新增商户
        </el-button> -->
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
            <div class="stat-value">{{ stats.totalMerchants }}</div>
            <div class="stat-label">商户总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f6ffed; color: #52c41a;">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.approvedMerchants }}</div>
            <div class="stat-label">已审核</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fff7e6; color: #fa8c16;">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.pendingMerchants }}</div>
            <div class="stat-label">待审核</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f0f9ff; color: #0ea5e9;">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">¥{{ (stats.totalRevenue / 100).toFixed(0) }}</div>
            <div class="stat-label">总收益</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 搜索过滤 -->
    <div class="filter-card">
      <el-form :model="searchForm" @submit.prevent="loadMerchants">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="关键词">
              <el-input 
                v-model="searchForm.keyword" 
                placeholder="请输入商户名称或联系人"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="状态">
              <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
                <el-option label="待审核" value="pending" />
                <el-option label="已通过" value="approved" />
                <el-option label="已拒绝" value="rejected" />
                <el-option label="已暂停" value="suspended" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item>
              <el-button type="primary" @click="loadMerchants">搜索</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <!-- 商户列表 -->
    <div class="table-card">
      <el-table 
        :data="merchants" 
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="company_name" label="商户名称" width="200" />
        <el-table-column prop="contact_person" label="联系人" width="120" />
        <el-table-column prop="contact_phone" label="联系电话" width="140" />
        <el-table-column prop="address" label="地址" min-width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_revenue" label="总收益" width="120">
          <template #default="{ row }">
            ¥{{ (row.total_revenue / 100).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewMerchant(row)">查看</el-button>
            <el-button size="small" type="primary" @click="editMerchant(row)">编辑</el-button>
            <el-button v-if="row.status === 'pending'" size="small" type="success" @click="approveMerchant(row)">审核</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadMerchants"
          @current-change="loadMerchants"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Plus,
  Shop,
  CircleCheck,
  Clock,
  Money
} from '@element-plus/icons-vue';
import { merchantApi } from '@/api/merchant';
import type { Merchant, MerchantListParams } from '@/types/merchant';
import { MerchantStatus } from '@/types/common';
import { formatDate } from '@/utils/format';

// 响应式数据
const loading = ref(false);
const merchants = ref<Merchant[]>([]);
const showDetailDialog = ref(false);
const selectedMerchant = ref<Merchant | null>(null);

// 统计数据
const stats = ref({
  totalMerchants: 0,
  approvedMerchants: 0,
  pendingMerchants: 0,
  totalRevenue: 0,
});

// 搜索表单
const searchForm = reactive<MerchantListParams>({
  page: 1,
  limit: 20,
  keyword: '',
  status: undefined,
});

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

// 加载商户列表
const loadMerchants = async () => {
  loading.value = true;
  
  try {
    const params = {
      ...searchForm,
      page: pagination.page,
      limit: pagination.pageSize,
    };
    const response = await merchantApi.getMerchants(params);
    merchants.value = response.data || [];
    pagination.total = response.total || 0;
  } catch (error) {
    console.error('加载商户列表失败:', error);
    // 如果API失败，显示空数据而不是模拟数据
    merchants.value = [];
    pagination.total = 0;
    ElMessage.error('加载商户列表失败');
  } finally {
    loading.value = false;
  }
};

// 加载统计数据
const loadStats = async () => {
  try {
    const statsData = await merchantApi.getMerchantStats();
    stats.value = statsData;
  } catch (error) {
    console.error('加载统计数据失败:', error);
    // 使用默认模拟数据，但不显示错误信息
    stats.value = {
      totalMerchants: 0,
      approvedMerchants: 0,
      pendingMerchants: 0,
      totalRevenue: 0,
    };
  }
};

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    keyword: '',
    status: undefined,
  });
  pagination.page = 1;
  loadMerchants();
};

// 查看商户详情
const viewMerchant = (merchant: Merchant) => {
  selectedMerchant.value = merchant;
  showDetailDialog.value = true;
};

// 编辑商户
const editMerchant = (merchant: Merchant) => {
  // 编辑功能暂未实现
  ElMessage.info('编辑功能暂未实现');
};

// 审核商户
const approveMerchant = async (merchant: Merchant) => {
  try {
    await ElMessageBox.confirm(`确定要通过「${merchant.company_name}」的审核申请吗？`, '确认审核', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    });
    
    await merchantApi.approveMerchant(merchant.id, { status: MerchantStatus.APPROVED });
    merchant.status = MerchantStatus.APPROVED;
    merchant.approved_at = new Date();
    ElMessage.success('审核通过成功');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('审核失败:', error);
      ElMessage.error('审核失败，请重试');
    }
  }
};



// 状态相关
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    suspended: 'info'
  };
  return statusMap[status] || 'info';
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    suspended: '已暂停'
  };
  return statusMap[status] || status;
};

// 页面初始化
onMounted(() => {
  loadMerchants();
  loadStats();
});
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.filter-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>