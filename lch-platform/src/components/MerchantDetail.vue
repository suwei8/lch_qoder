<template>
  <div class="merchant-detail">
    <el-tabs v-model="activeTab">
      <!-- 基本信息 -->
      <el-tab-pane label="基本信息" name="basic">
        <el-descriptions
          :column="2"
          border
          size="large"
        >
          <el-descriptions-item label="商户ID">
            {{ merchant.id }}
          </el-descriptions-item>
          <el-descriptions-item label="申请状态">
            <el-tag
              :type="getStatusTagType(merchant.status)"
              size="small"
            >
              {{ getStatusText(merchant.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="公司名称">
            {{ merchant.company_name }}
          </el-descriptions-item>
          <el-descriptions-item label="联系人">
            {{ merchant.contact_person }}
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            {{ merchant.contact_phone }}
          </el-descriptions-item>
          <el-descriptions-item label="邮箱">
            {{ merchant.email || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="营业执照号" :span="2">
            {{ merchant.business_license }}
          </el-descriptions-item>
          <el-descriptions-item label="法人身份证号" :span="2">
            {{ merchant.legal_person_id || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="公司地址" :span="2">
            {{ merchant.address }}
          </el-descriptions-item>
          <el-descriptions-item label="位置坐标" :span="2">
            <span v-if="merchant.latitude && merchant.longitude">
              {{ merchant.latitude }}, {{ merchant.longitude }}
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="申请时间">
            {{ formatDateTime(merchant.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="审核时间">
            {{ merchant.approved_at ? formatDateTime(merchant.approved_at) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="佣金比例" :span="2">
            {{ (merchant.commission_rate * 100).toFixed(1) }}%
          </el-descriptions-item>
          <el-descriptions-item label="结算周期" :span="2">
            {{ getSettlementCycleText(merchant.settlement_cycle) }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 拒绝原因 -->
        <div v-if="merchant.status === 'rejected' && merchant.reject_reason" class="reject-reason">
          <el-alert
            title="拒绝原因"
            type="error"
            :description="merchant.reject_reason"
            show-icon
            :closable="false"
          />
        </div>
      </el-tab-pane>

      <!-- 证件资料 -->
      <el-tab-pane label="证件资料" name="documents">
        <div class="document-section">
          <h3>营业执照</h3>
          <div class="document-item">
            <div class="document-info">
              <p><strong>营业执照号：</strong>{{ merchant.business_license }}</p>
            </div>
            <div class="document-image">
              <el-image
                v-if="merchant.business_license_image"
                :src="merchant.business_license_image"
                fit="contain"
                style="width: 300px; height: 200px;"
                preview-teleported
              >
                <template #error>
                  <div class="image-slot">
                    <el-icon><Picture /></el-icon>
                    <span>图片加载失败</span>
                  </div>
                </template>
              </el-image>
              <div v-else class="no-image">
                <el-icon><Picture /></el-icon>
                <span>暂无图片</span>
              </div>
            </div>
          </div>

          <h3>法人身份证</h3>
          <div class="document-item">
            <div class="document-info">
              <p><strong>身份证号：</strong>{{ merchant.legal_person_id || '未提供' }}</p>
            </div>
            <div class="document-image">
              <el-image
                v-if="merchant.legal_person_id_image"
                :src="merchant.legal_person_id_image"
                fit="contain"
                style="width: 300px; height: 200px;"
                preview-teleported
              >
                <template #error>
                  <div class="image-slot">
                    <el-icon><Picture /></el-icon>
                    <span>图片加载失败</span>
                  </div>
                </template>
              </el-image>
              <div v-else class="no-image">
                <el-icon><Picture /></el-icon>
                <span>暂无图片</span>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 经营数据 -->
      <el-tab-pane label="经营数据" name="business">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-statistic
              title="累计营收"
              :value="merchant.total_revenue / 100"
              :precision="2"
              suffix="元"
            />
          </el-col>
          <el-col :span="8">
            <el-statistic
              title="待结算金额"
              :value="merchant.pending_settlement / 100"
              :precision="2"
              suffix="元"
            />
          </el-col>
          <el-col :span="8">
            <el-statistic
              title="设备数量"
              :value="businessData.deviceCount"
              suffix="台"
            />
          </el-col>
        </el-row>

        <el-divider />

        <div class="business-charts">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="chart-container">
                <h4>近30天营收趋势</h4>
                <!-- 这里可以集成图表组件 -->
                <div class="chart-placeholder">
                  <el-icon size="64"><TrendCharts /></el-icon>
                  <p>营收趋势图表</p>
                </div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="chart-container">
                <h4>设备使用情况</h4>
                <div class="chart-placeholder">
                  <el-icon size="64"><PieChart /></el-icon>
                  <p>设备使用统计</p>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>

      <!-- 审核记录 -->
      <el-tab-pane label="审核记录" name="history">
        <el-timeline>
          <el-timeline-item
            v-for="record in auditHistory"
            :key="record.id"
            :timestamp="formatDateTime(record.created_at)"
            :type="getTimelineType(record.action)"
          >
            <h4>{{ record.action_text }}</h4>
            <p>操作人：{{ record.operator_name }}</p>
            <p v-if="record.remark">备注：{{ record.remark }}</p>
          </el-timeline-item>
        </el-timeline>
      </el-tab-pane>
    </el-tabs>

    <!-- 操作按钮 -->
    <div class="action-buttons" v-if="merchant.status === 'pending'">
      <el-button
        type="success"
        size="large"
        @click="handleApprove"
        :loading="submitting"
      >
        <el-icon><Check /></el-icon>
        通过审核
      </el-button>
      <el-button
        type="danger"
        size="large"
        @click="handleReject"
        :loading="submitting"
      >
        <el-icon><Close /></el-icon>
        拒绝申请
      </el-button>
    </div>

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
import {
  Picture,
  Check,
  Close,
  TrendCharts,
  PieChart
} from '@element-plus/icons-vue'
import { merchantApi } from '@/api/merchant'
import type { Merchant } from '@/types/merchant'
import { MerchantStatus } from '@/types/common'
import { formatDateTime } from '../utils/format'

// Props
interface Props {
  merchant: Merchant
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  approve: []
  reject: []
  close: []
}>()

// 响应式数据
const activeTab = ref('basic')
const submitting = ref(false)
const rejectDialogVisible = ref(false)

const businessData = reactive({
  deviceCount: 0,
  orderCount: 0,
  revenueData: []
})

const auditHistory = ref<Array<{
  id: number;
  action: string;
  action_text: string;
  operator_name: string;
  remark?: string;
  created_at: Date;
}>>([])

const rejectForm = reactive({
  reason: ''
})

// 页面初始化
onMounted(() => {
  loadBusinessData()
  loadAuditHistory()
})

// 加载经营数据
const loadBusinessData = async () => {
  try {
    const { data } = await merchantApi.getBusinessData(props.merchant.id)
    Object.assign(businessData, data)
  } catch (error) {
    console.error('加载经营数据失败:', error)
  }
}

// 加载审核记录
const loadAuditHistory = async () => {
  try {
    const { data } = await merchantApi.getAuditHistory(props.merchant.id)
    auditHistory.value = data
  } catch (error) {
    console.error('加载审核记录失败:', error)
  }
}

// 通过审核
const handleApprove = async () => {
  try {
    await ElMessageBox.confirm(
      `确认通过商户"${props.merchant.company_name}"的申请吗？`,
      '确认通过',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    submitting.value = true
    await merchantApi.approveMerchant(props.merchant.id, { status: MerchantStatus.APPROVED })
    ElMessage.success('商户申请已通过')
    emit('approve')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('通过审核失败:', error)
      ElMessage.error('操作失败')
    }
  } finally {
    submitting.value = false
  }
}

// 拒绝申请
const handleReject = () => {
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
    await merchantApi.rejectMerchant(props.merchant.id, rejectForm.reason)
    ElMessage.success('已拒绝商户申请')
    rejectDialogVisible.value = false
    emit('reject')
  } catch (error) {
    console.error('拒绝申请失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
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

const getSettlementCycleText = (cycle: string) => {
  const textMap: Record<string, string> = {
    daily: '每日结算',
    weekly: '每周结算',
    monthly: '每月结算'
  }
  return textMap[cycle] || '未知'
}

const getTimelineType = (action: string) => {
  const typeMap: Record<string, string> = {
    submit: 'primary',
    approve: 'success',
    reject: 'danger',
    suspend: 'warning'
  }
  return typeMap[action] || 'primary'
}
</script>

<style scoped>
.merchant-detail {
  padding: 20px 0;
}

.reject-reason {
  margin-top: 20px;
}

.document-section h3 {
  margin: 20px 0 10px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.document-item {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.document-info {
  flex: 1;
}

.document-info p {
  margin: 0;
  color: #606266;
}

.document-image {
  flex-shrink: 0;
}

.image-slot,
.no-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 300px;
  height: 200px;
  background: #f5f7fa;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  color: #909399;
}

.business-charts {
  margin-top: 20px;
}

.chart-container {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.chart-container h4 {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #909399;
}

.chart-placeholder p {
  margin: 10px 0 0 0;
}

.action-buttons {
  margin-top: 30px;
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.action-buttons .el-button {
  margin: 0 10px;
  min-width: 120px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>