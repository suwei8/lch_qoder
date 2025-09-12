<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">商户管理</h1>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #e6f7ff; color: #1890ff;">
            <el-icon><Shop /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ merchantStats.totalMerchants }}</div>
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
            <div class="stat-value">{{ merchantStats.approvedMerchants }}</div>
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
            <div class="stat-value">{{ merchantStats.pendingMerchants }}</div>
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
            <div class="stat-value">¥{{ (merchantStats.totalRevenue / 100).toFixed(0) }}</div>
            <div class="stat-label">总收益</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 搜索和操作区域 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item label="商户名称">
          <el-input
            v-model="searchForm.business_name"
            placeholder="请输入商户名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 150px"
          >
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
            <el-option label="已暂停" value="suspended" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchMerchants" :loading="loading">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 商户列表 -->
    <div class="table-section">
      <el-table
        :data="merchants"
        v-loading="loading"
        element-loading-text="加载中..."
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="business_name" label="商户名称" min-width="150" />
        <el-table-column prop="contact_name" label="联系人" width="120" />
        <el-table-column prop="contact_phone" label="联系电话" width="130" />
        <el-table-column prop="business_address" label="营业地址" min-width="200" show-overflow-tooltip />
        <el-table-column label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewMerchant(row)">
              查看
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              size="small"
              type="success"
              @click="approveMerchant(row)"
            >
              审核
            </el-button>
            <el-button
              v-if="row.status === 'approved'"
              size="small"
              type="warning"
              @click="suspendMerchant(row)"
            >
              暂停
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="searchForm.page"
          v-model:page-size="searchForm.limit"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 商户详情对话框 -->
    <el-dialog
      v-model="merchantDetailVisible"
      :title="`商户详情 - ${selectedMerchant?.business_name || ''}`"
      width="800px"
      destroy-on-close
    >
      <div v-if="selectedMerchant" class="merchant-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="商户名称">
            {{ selectedMerchant.business_name }}
          </el-descriptions-item>
          <el-descriptions-item label="联系人">
            {{ selectedMerchant.contact_name }}
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            {{ selectedMerchant.contact_phone }}
          </el-descriptions-item>
          <el-descriptions-item label="营业地址">
            {{ selectedMerchant.business_address }}
          </el-descriptions-item>
          <el-descriptions-item label="审核状态">
            <el-tag :type="getStatusType(selectedMerchant.status)">
              {{ getStatusText(selectedMerchant.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="申请时间">
            {{ formatDate(selectedMerchant.created_at) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 审核对话框 -->
    <el-dialog
      v-model="approveDialogVisible"
      title="商户审核"
      width="500px"
    >
      <el-form :model="approveForm" label-width="80px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="approveForm.action">
            <el-radio value="approve">通过</el-radio>
            <el-radio value="reject">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="approveForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入审核备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitApprove" :loading="approving">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Shop, 
  CircleCheck, 
  Clock, 
  Money, 
  Search, 
  RefreshLeft 
} from '@element-plus/icons-vue'
import { merchantApi } from '@/api/merchant'
import type { Merchant, MerchantListParams } from '@/types/merchant'
import { formatDate } from '@/utils/format'

// 响应式数据
const merchants = ref<Merchant[]>([])
const loading = ref(false)
const total = ref(0)
const approving = ref(false)

// 商户详情
const merchantDetailVisible = ref(false)
const selectedMerchant = ref<Merchant | null>(null)

// 审核对话框
const approveDialogVisible = ref(false)
const approveForm = reactive({
  action: 'approve',
  remark: ''
})

// 商户统计数据
const merchantStats = ref({
  totalMerchants: 0,
  approvedMerchants: 0,
  pendingMerchants: 0,
  totalRevenue: 0
})

// 搜索表单
const searchForm = reactive<MerchantListParams>({
  business_name: '',
  status: undefined,
  page: 1,
  limit: 20
})

// 获取商户列表
const fetchMerchants = async () => {
  loading.value = true
  try {
    const response = await merchantApi.getMerchants(searchForm)
    merchants.value = response.data
    total.value = response.total
  } catch (error) {
    ElMessage.error('获取商户列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 获取商户统计
const fetchMerchantStats = async () => {
  try {
    const stats = await merchantApi.getMerchantStats()
    merchantStats.value = stats
  } catch (error) {
    console.error('获取商户统计失败:', error)
  }
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    business_name: '',
    status: undefined,
    page: 1,
    limit: 20
  })
  fetchMerchants()
}

// 分页处理
const handleSizeChange = (val: number) => {
  searchForm.limit = val
  fetchMerchants()
}

const handleCurrentChange = (val: number) => {
  searchForm.page = val
  fetchMerchants()
}

// 查看商户详情
const viewMerchant = (merchant: Merchant) => {
  selectedMerchant.value = merchant
  merchantDetailVisible.value = true
}

// 审核商户
const approveMerchant = (merchant: Merchant) => {
  selectedMerchant.value = merchant
  approveForm.action = 'approve'
  approveForm.remark = ''
  approveDialogVisible.value = true
}

// 提交审核
const submitApprove = async () => {
  if (!selectedMerchant.value) return
  
  approving.value = true
  try {
    if (approveForm.action === 'approve') {
      await merchantApi.approveMerchant(selectedMerchant.value.id, {
        status: 'approved',
        remark: approveForm.remark
      })
      ElMessage.success('商户审核通过')
    } else {
      await merchantApi.rejectMerchant(selectedMerchant.value.id, approveForm.remark)
      ElMessage.success('商户审核拒绝')
    }
    
    approveDialogVisible.value = false
    await fetchMerchants()
    await fetchMerchantStats()
  } catch (error) {
    ElMessage.error('审核操作失败')
    console.error(error)
  } finally {
    approving.value = false
  }
}

// 暂停商户
const suspendMerchant = async (merchant: Merchant) => {
  try {
    await ElMessageBox.confirm('确认暂停此商户？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await merchantApi.suspendMerchant(merchant.id)
    ElMessage.success('商户已暂停')
    await fetchMerchants()
    await fetchMerchantStats()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('暂停商户失败')
      console.error(error)
    }
  }
}

// 状态相关函数
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    suspended: 'info'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    suspended: '已暂停'
  }
  return statusMap[status] || '未知'
}

// 初始化
onMounted(() => {
  fetchMerchants()
  fetchMerchantStats()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

.search-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.merchant-detail {
  padding: 20px 0;
}
</style>