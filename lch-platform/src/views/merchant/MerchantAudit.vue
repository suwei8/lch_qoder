<template>
  <div class="merchant-audit-container">
    <div class="page-header">
      <h1>商户审核管理</h1>
      <div class="header-actions">
        <el-button @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="exportData">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-value text-primary">{{ stats.pending }}</div>
              <div class="stat-label">待审核</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-value text-success">{{ stats.approved }}</div>
              <div class="stat-label">已通过</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-value text-warning">{{ stats.rejected }}</div>
              <div class="stat-label">已拒绝</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-value text-info">{{ stats.suspended }}</div>
              <div class="stat-label">已暂停</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="商户状态">
          <el-select v-model="filters.status" placeholder="请选择" clearable>
            <el-option label="全部" value="" />
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
            <el-option label="已暂停" value="suspended" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请时间">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="关键字">
          <el-input
            v-model="filters.keyword"
            placeholder="公司名称/联系人/手机号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 商户列表 -->
    <el-card class="table-card">
      <el-table
        :data="merchantList"
        v-loading="loading"
        border
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column
          prop="id"
          label="ID"
          width="80"
          sortable="custom"
        />
        <el-table-column
          prop="company_name"
          label="公司名称"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column
          prop="contact_person"
          label="联系人"
          width="100"
        />
        <el-table-column
          prop="contact_phone"
          label="联系电话"
          width="120"
        />
        <el-table-column
          prop="address"
          label="地址"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column
          prop="status"
          label="状态"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="getStatusTagType(row.status)"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="created_at"
          label="申请时间"
          width="180"
          sortable="custom"
        >
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="200"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="viewMerchant(row)"
            >
              查看
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="success"
              size="small"
              @click="approveMerchant(row)"
            >
              通过
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="danger"
              size="small"
              @click="rejectMerchant(row)"
            >
              拒绝
            </el-button>
            <el-dropdown
              v-if="row.status === 'approved'"
              trigger="click"
              @command="(cmd: string) => handleAction(cmd, row)"
            >
              <el-button size="small" type="warning">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="suspend">暂停</el-dropdown-item>
                  <el-dropdown-item command="edit">编辑</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 商户详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="商户详情"
      width="800px"
      :before-close="handleDetailClose"
    >
      <MerchantDetail
        v-if="detailDialogVisible && currentMerchant"
        :merchant="currentMerchant"
        @approve="handleApprove"
        @reject="handleReject"
        @close="detailDialogVisible = false"
      />
    </el-dialog>

    <!-- 拒绝原因弹窗 -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="拒绝申请"
      width="500px"
    >
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="拒绝原因" required>
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入拒绝原因"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="rejectDialogVisible = false">取消</el-button>
          <el-button
            type="danger"
            @click="confirmReject"
            :loading="submitting"
          >
            确认拒绝
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Download, ArrowDown } from '@element-plus/icons-vue'
import MerchantDetail from '@/components/MerchantDetail.vue'
import { merchantApi } from '@/api/merchant'
import type { Merchant, MerchantListParams } from '@/types/merchant'
import type { MerchantStatus } from '@/types/common'
import { formatDateTime } from '../../utils/format'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const merchantList = ref<Merchant[]>([])
const detailDialogVisible = ref(false)
const rejectDialogVisible = ref(false)
const currentMerchant = ref<Merchant | null>(null)

// 统计数据
const stats = reactive({
  pending: 0,
  approved: 0,
  rejected: 0,
  suspended: 0
})

// 筛选条件
const filters = reactive<{
  status: string;
  dateRange: string[];
  keyword: string;
}>({
  status: '',
  dateRange: [],
  keyword: ''
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 拒绝表单
const rejectForm = reactive({
  reason: ''
})

// 排序
const sortConfig = reactive({
  sortBy: '',
  sortOrder: ''
})

// 页面初始化
onMounted(() => {
  loadMerchants()
  loadStats()
})

// 加载商户列表
const loadMerchants = async () => {
  loading.value = true
  try {
    const params: MerchantListParams = {
      page: pagination.page,
      limit: pagination.limit,
      status: filters.status ? (filters.status as MerchantStatus) : undefined,
      keyword: filters.keyword,
      startDate: filters.dateRange[0] || undefined,
      endDate: filters.dateRange[1] || undefined,
      sortBy: sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder
    }

    const data = await merchantApi.getMerchants(params)
    merchantList.value = data.data
    pagination.total = data.total
  } catch (error) {
    console.error('加载商户列表失败:', error)
    ElMessage.error('加载商户列表失败')
  } finally {
    loading.value = false
  }
}

// 加载统计数据
const loadStats = async () => {
  try {
    const data = await merchantApi.getStats()
    Object.assign(stats, data)
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadMerchants()
}

// 重置筛选条件
const resetFilters = () => {
  Object.assign(filters, {
    status: '',
    dateRange: [],
    keyword: ''
  })
  pagination.page = 1
  loadMerchants()
}

// 刷新数据
const refreshData = () => {
  loadMerchants()
  loadStats()
}

// 导出数据
const exportData = async () => {
  try {
    await merchantApi.exportMerchants(filters)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 查看商户详情
const viewMerchant = (merchant: Merchant) => {
  currentMerchant.value = merchant
  detailDialogVisible.value = true
}

// 通过审核
const approveMerchant = async (merchant: Merchant) => {
  try {
    await ElMessageBox.confirm(
      `确认通过商户"${merchant.company_name}"的申请吗？`,
      '确认通过',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await merchantApi.approveMerchant(merchant.id, { status: 'approved' as MerchantStatus })
    ElMessage.success('商户申请已通过')
    loadMerchants()
    loadStats()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('通过审核失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

// 拒绝申请
const rejectMerchant = (merchant: Merchant) => {
  currentMerchant.value = merchant
  rejectForm.reason = ''
  rejectDialogVisible.value = true
}

// 确认拒绝
const confirmReject = async () => {
  if (!rejectForm.reason.trim()) {
    ElMessage.error('请输入拒绝原因')
    return
  }

  submitting.value = true
  try {
    await merchantApi.rejectMerchant(currentMerchant.value!.id, rejectForm.reason)
    ElMessage.success('已拒绝商户申请')
    rejectDialogVisible.value = false
    loadMerchants()
    loadStats()
  } catch (error) {
    console.error('拒绝申请失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

// 处理其他操作
const handleAction = async (command: string, merchant: Merchant) => {
  switch (command) {
    case 'suspend':
      await handleSuspend(merchant)
      break
    case 'edit':
      handleEdit()
      break
  }
}

// 暂停商户
const handleSuspend = async (merchant: Merchant) => {
  try {
    await ElMessageBox.confirm(
      `确认暂停商户"${merchant.company_name}"吗？`,
      '确认暂停',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await merchantApi.suspendMerchant(merchant.id)
    ElMessage.success('商户已暂停')
    loadMerchants()
    loadStats()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('暂停商户失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

// 编辑商户
const handleEdit = () => {
  // TODO: 实现编辑功能
  ElMessage.info('编辑功能开发中')
}

// 分页大小改变
const handleSizeChange = (val: number) => {
  pagination.limit = val
  pagination.page = 1
  loadMerchants()
}

// 当前页改变
const handleCurrentChange = (val: number) => {
  pagination.page = val
  loadMerchants()
}

// 排序改变
const handleSortChange = ({ prop, order }: any) => {
  sortConfig.sortBy = prop
  sortConfig.sortOrder = order === 'ascending' ? 'ASC' : 'DESC'
  loadMerchants()
}

// 详情弹窗处理
const handleDetailClose = () => {
  detailDialogVisible.value = false
  currentMerchant.value = null
}

const handleApprove = () => {
  loadMerchants()
  loadStats()
  detailDialogVisible.value = false
}

const handleReject = () => {
  loadMerchants()
  loadStats()
  detailDialogVisible.value = false
}

// 工具方法
const getStatusTagType = (status: string) => {
  const typeMap: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    suspended: 'info'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    suspended: '已暂停'
  }
  return textMap[status] || '未知'
}
</script>

<style scoped>
.merchant-audit-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-item {
  padding: 10px 0;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.text-primary { color: #409eff; }
.text-success { color: #67c23a; }
.text-warning { color: #e6a23c; }
.text-info { color: #909399; }

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  margin-bottom: 0;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>