<template>
  <div class="device-monitor-container">
    <div class="page-header">
      <h1>设备监控中心</h1>
      <div class="header-actions">
        <el-button @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="openBatchSync">
          <el-icon><Connection /></el-icon>
          同步状态
        </el-button>
        <el-button type="warning" @click="exportReport">
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
      </div>
    </div>

    <!-- 设备状态总览 -->
    <div class="overview-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card online-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><CircleCheck /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ overview.online }}</div>
                <div class="stat-label">在线设备</div>
                <div class="stat-percentage text-success">
                  {{ getPercentage(overview.online) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card working-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Loading /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ overview.working }}</div>
                <div class="stat-label">工作中</div>
                <div class="stat-percentage text-primary">
                  {{ getPercentage(overview.working) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card offline-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><CircleClose /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ overview.offline }}</div>
                <div class="stat-label">离线设备</div>
                <div class="stat-percentage text-danger">
                  {{ getPercentage(overview.offline) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card error-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ overview.error }}</div>
                <div class="stat-label">故障设备</div>
                <div class="stat-percentage text-warning">
                  {{ getPercentage(overview.error) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="设备状态">
          <el-select v-model="filters.status" placeholder="请选择" clearable>
            <el-option label="全部" value="" />
            <el-option label="在线" value="online" />
            <el-option label="工作中" value="working" />
            <el-option label="离线" value="offline" />
            <el-option label="故障" value="error" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属商户">
          <el-select
            v-model="filters.merchantId"
            placeholder="请选择商户"
            clearable
            filterable
          >
            <el-option
              v-for="merchant in merchantOptions"
              :key="merchant.id"
              :label="merchant.company_name"
              :value="merchant.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="设备位置">
          <el-input
            v-model="filters.location"
            placeholder="请输入设备位置"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="关键字">
          <el-input
            v-model="filters.keyword"
            placeholder="设备名称/设备ID"
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

    <!-- 设备列表 -->
    <el-card class="table-card">
      <el-table
        :data="deviceList"
        v-loading="loading"
        border
        style="width: 100%"
        @sort-change="handleSortChange"
        @row-click="viewDevice"
        row-key="id"
      >
        <el-table-column
          prop="id"
          label="设备ID"
          width="100"
          sortable="custom"
        />
        <el-table-column
          prop="name"
          label="设备名称"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column
          prop="devid"
          label="硬件ID"
          width="120"
          show-overflow-tooltip
        />
        <el-table-column
          prop="merchant.company_name"
          label="所属商户"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column
          prop="location"
          label="设备位置"
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
            <div class="status-indicator">
              <div
                class="status-dot"
                :class="getStatusClass(row.status)"
              ></div>
              <span>{{ getStatusText(row.status) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="signal_strength"
          label="信号强度"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-progress
              :percentage="parseInt(row.signal_strength) || 0"
              :color="getSignalColor(row.signal_strength)"
              :stroke-width="8"
              text-inside
              style="width: 80px"
            />
          </template>
        </el-table-column>
        <el-table-column
          prop="last_seen_at"
          label="最后在线"
          width="180"
          sortable="custom"
        >
          <template #default="{ row }">
            <div>
              {{ formatDateTime(row.last_seen_at) }}
            </div>
            <div class="text-small text-muted">
              {{ getOnlineTime(row.last_seen_at) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column
          label="今日订单"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-link type="primary" @click.stop="viewOrders(row)">
              {{ row.today_orders || 0 }}
            </el-link>
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
              @click.stop="viewDevice(row)"
            >
              详情
            </el-button>
            <el-button
              v-if="row.status === 'online'"
              type="success"
              size="small"
              @click.stop="controlDevice(row, 'start')"
            >
              启动
            </el-button>
            <el-button
              v-if="row.status === 'working'"
              type="warning"
              size="small"
              @click.stop="controlDevice(row, 'stop')"
            >
              停止
            </el-button>
            <el-dropdown
              trigger="click"
              @command="(cmd: string) => handleDeviceAction(cmd, row)"
              @click.stop
            >
              <el-button size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="sync">同步状态</el-dropdown-item>
                  <el-dropdown-item command="reboot">重启设备</el-dropdown-item>
                  <el-dropdown-item command="maintenance">维护模式</el-dropdown-item>
                  <el-dropdown-item command="log">查看日志</el-dropdown-item>
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

    <!-- 设备详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="设备详情"
      width="1000px"
      :before-close="handleDetailClose"
    >
      <DeviceDetail
        v-if="detailDialogVisible && currentDevice"
        :device="currentDevice"
        @close="detailDialogVisible = false"
      />
    </el-dialog>

    <!-- 批量同步弹窗 -->
    <el-dialog
      v-model="syncDialogVisible"
      title="批量同步设备状态"
      width="600px"
    >
      <div class="sync-dialog-content">
        <el-alert
          title="同步设备状态"
          description="将从智链物联平台同步所有设备的最新状态信息，此操作可能需要一些时间。"
          type="info"
          show-icon
          :closable="false"
        />
        <div class="sync-progress" v-if="syncing">
          <el-progress
            :percentage="syncProgress"
            :status="syncProgress === 100 ? 'success' : undefined"
          />
          <p class="progress-text">{{ syncProgressText }}</p>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="syncDialogVisible = false" :disabled="syncing">
            取消
          </el-button>
          <el-button
            type="primary"
            @click="startBatchSync"
            :loading="syncing"
          >
            {{ syncing ? '同步中...' : '开始同步' }}
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
  Refresh,
  Connection,
  Download,
  CircleCheck,
  CircleClose,
  Loading,
  Warning,
  ArrowDown
} from '@element-plus/icons-vue'
import DeviceDetail from '../../components/DeviceDetail.vue'
import { deviceApi } from '@/api/device'
import { merchantApi } from '@/api/merchant'
import type { Device } from '@/types/device'
import type { Merchant } from '@/types/merchant'
import type { DeviceStatus } from '@/types/common'
import { formatDateTime, getRelativeTime } from '../../utils/format'

// 响应式数据
const loading = ref(false)
const syncing = ref(false)
const syncProgress = ref(0)
const syncProgressText = ref('')
const deviceList = ref<Device[]>([])
const merchantOptions = ref<Merchant[]>([])
const detailDialogVisible = ref(false)
const syncDialogVisible = ref(false)
const currentDevice = ref<Device | null>(null)

// 概览数据
const overview = reactive({
  total: 0,
  online: 0,
  working: 0,
  offline: 0,
  error: 0
})

// 筛选条件
const filters = reactive({
  status: '',
  merchantId: '',
  location: '',
  keyword: ''
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 排序
const sortConfig = reactive({
  sortBy: '',
  sortOrder: ''
})

// 页面初始化
onMounted(() => {
  loadDevices()
  loadOverview()
  loadMerchants()
})

// 加载设备列表
const loadDevices = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      status: filters.status ? (filters.status as DeviceStatus) : undefined,
      merchant_id: filters.merchantId ? parseInt(filters.merchantId) : undefined,
      location: filters.location,
      keyword: filters.keyword,
      sortBy: sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder
    }

    const data = await deviceApi.getDevices(params)
    deviceList.value = data.data
    pagination.total = data.total
  } catch (error) {
    console.error('加载设备列表失败:', error)
    ElMessage.error('加载设备列表失败')
  } finally {
    loading.value = false
  }
}

// 加载概览数据
const loadOverview = async () => {
  try {
    const data = await deviceApi.getOverview()
    Object.assign(overview, data)
  } catch (error) {
    console.error('加载概览数据失败:', error)
  }
}

// 加载商户选项
const loadMerchants = async () => {
  try {
    const data = await merchantApi.getMerchants({ limit: 1000 })
    merchantOptions.value = data.data
  } catch (error) {
    console.error('加载商户选项失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadDevices()
}

// 重置筛选条件
const resetFilters = () => {
  Object.assign(filters, {
    status: '',
    merchantId: '',
    location: '',
    keyword: ''
  })
  pagination.page = 1
  loadDevices()
}

// 刷新数据
const refreshData = () => {
  loadDevices()
  loadOverview()
}

// 导出报表
const exportReport = async () => {
  try {
    await deviceApi.exportReport(filters)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 查看设备详情
const viewDevice = (device: Device) => {
  currentDevice.value = device
  detailDialogVisible.value = true
}

// 查看设备订单
const viewOrders = (device: Device) => {
  // TODO: 跳转到订单列表页面，可以使用device参数筛选该设备的订单
  ElMessage.info(`查看设备"${device.name}"的订单列表`)
}

// 控制设备
const controlDevice = async (device: Device, command: string) => {
  try {
    await ElMessageBox.confirm(
      `确认${command === 'start' ? '启动' : '停止'}设备"${device.name}"吗？`,
      '确认操作',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deviceApi.controlDevice(device.id, { command: command as 'start' | 'stop' | 'pause' | 'resume' | 'reboot' })
    ElMessage.success(`设备${command === 'start' ? '启动' : '停止'}指令已发送`)
    
    // 延迟刷新状态
    setTimeout(() => {
      loadDevices()
      loadOverview()
    }, 2000)
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('控制设备失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

// 处理设备操作
const handleDeviceAction = async (command: string, device: Device) => {
  switch (command) {
    case 'sync':
      await syncDeviceStatus(device)
      break
    case 'reboot':
      await rebootDevice(device)
      break
    case 'maintenance':
      await setMaintenanceMode(device)
      break
    case 'log':
      viewDeviceLog(device)
      break
  }
}

// 同步设备状态
const syncDeviceStatus = async (device: Device) => {
  try {
    await deviceApi.syncDeviceStatus(device.id)
    ElMessage.success('设备状态同步成功')
    loadDevices()
  } catch (error) {
    console.error('同步设备状态失败:', error)
    ElMessage.error('同步失败')
  }
}

// 重启设备
const rebootDevice = async (device: Device) => {
  try {
    await ElMessageBox.confirm(
      `确认重启设备"${device.name}"吗？重启过程可能需要2-3分钟。`,
      '确认重启',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deviceApi.controlDevice(device.id, { command: 'reboot' })
    ElMessage.success('设备重启指令已发送')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('重启设备失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

// 设置维护模式
const setMaintenanceMode = async (device: Device) => {
  try {
    await ElMessageBox.confirm(
      `确认将设备"${device.name}"设置为维护模式吗？`,
      '确认设置',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deviceApi.setMaintenanceMode(device.id, true)
    ElMessage.success('设备已设置为维护模式')
    loadDevices()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('设置维护模式失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

// 查看设备日志
const viewDeviceLog = (device: Device) => {
  // TODO: 打开设备日志查看器
  ElMessage.info(`设备"${device.name}"日志查看功能开发中`)
}

// 打开批量同步
const openBatchSync = () => {
  syncDialogVisible.value = true
  syncProgress.value = 0
  syncProgressText.value = ''
}

// 开始批量同步
const startBatchSync = async () => {
  syncing.value = true
  syncProgress.value = 0
  syncProgressText.value = '正在准备同步...'

  try {
    // 模拟同步进度
    const intervals = [
      { progress: 20, text: '正在连接智链物联平台...' },
      { progress: 40, text: '正在获取设备列表...' },
      { progress: 60, text: '正在同步设备状态...' },
      { progress: 80, text: '正在更新本地数据...' },
      { progress: 100, text: '同步完成！' }
    ]

    for (const interval of intervals) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      syncProgress.value = interval.progress
      syncProgressText.value = interval.text
    }

    // 实际同步API调用
    await deviceApi.batchSyncDevices()
    
    ElMessage.success('设备状态同步完成')
    syncDialogVisible.value = false
    loadDevices()
    loadOverview()
  } catch (error) {
    console.error('批量同步失败:', error)
    ElMessage.error('同步失败')
  } finally {
    syncing.value = false
  }
}

// 分页处理
const handleSizeChange = (val: number) => {
  pagination.limit = val
  pagination.page = 1
  loadDevices()
}

const handleCurrentChange = (val: number) => {
  pagination.page = val
  loadDevices()
}

// 排序处理
const handleSortChange = ({ prop, order }: any) => {
  sortConfig.sortBy = prop
  sortConfig.sortOrder = order === 'ascending' ? 'ASC' : 'DESC'
  loadDevices()
}

// 详情弹窗处理
const handleDetailClose = () => {
  detailDialogVisible.value = false
  currentDevice.value = null
}

// 工具方法
const getPercentage = (count: number) => {
  return overview.total > 0 ? Math.round((count / overview.total) * 100) : 0
}

const getStatusClass = (status: string) => {
  const classMap: Record<string, string> = {
    online: 'status-online',
    working: 'status-working',
    offline: 'status-offline',
    error: 'status-error'
  }
  return classMap[status] || 'status-offline'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    online: '在线',
    working: '工作中',
    offline: '离线',
    error: '故障'
  }
  return textMap[status] || '未知'
}

const getSignalColor = (signal: string) => {
  const value = parseInt(signal) || 0
  if (value >= 80) return '#67c23a'
  if (value >= 60) return '#e6a23c'
  if (value >= 40) return '#f56c6c'
  return '#909399'
}

const getOnlineTime = (lastSeenAt: string) => {
  if (!lastSeenAt) return '从未在线'
  return getRelativeTime(lastSeenAt)
}
</script>

<style scoped>
.device-monitor-container {
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

.overview-cards {
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.stat-icon {
  font-size: 48px;
  margin-right: 16px;
  opacity: 0.8;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.stat-percentage {
  font-size: 12px;
  font-weight: 600;
}

.online-card .stat-icon { color: #67c23a; }
.working-card .stat-icon { color: #409eff; }
.offline-card .stat-icon { color: #909399; }
.error-card .stat-icon { color: #f56c6c; }

.text-success { color: #67c23a; }
.text-primary { color: #409eff; }
.text-danger { color: #f56c6c; }
.text-warning { color: #e6a23c; }

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  margin-bottom: 0;
}

.table-card {
  margin-bottom: 20px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-online { background-color: #67c23a; }
.status-working { background-color: #409eff; }
.status-offline { background-color: #909399; }
.status-error { background-color: #f56c6c; }

.text-small {
  font-size: 12px;
}

.text-muted {
  color: #909399;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.sync-dialog-content {
  padding: 20px 0;
}

.sync-progress {
  margin-top: 20px;
}

.progress-text {
  text-align: center;
  margin-top: 10px;
  color: #606266;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>