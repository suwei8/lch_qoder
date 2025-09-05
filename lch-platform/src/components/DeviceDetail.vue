<template>
  <div class="device-detail">
    <el-descriptions title="设备基本信息" :column="2" border>
      <el-descriptions-item label="设备ID">{{ device.id }}</el-descriptions-item>
      <el-descriptions-item label="硬件ID">{{ device.devid }}</el-descriptions-item>
      <el-descriptions-item label="设备名称">{{ device.name }}</el-descriptions-item>
      <el-descriptions-item label="设备状态">
        <el-tag :type="getStatusTagType(device.status)">
          {{ getStatusText(device.status) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="设备位置">{{ device.location || '-' }}</el-descriptions-item>
      <el-descriptions-item label="信号强度">
        <el-progress
          v-if="device.signal_strength"
          :percentage="parseInt(device.signal_strength) || 0"
          :color="getSignalColor(device.signal_strength)"
          :stroke-width="6"
          text-inside
          style="width: 120px"
        />
        <span v-else>-</span>
      </el-descriptions-item>
      <el-descriptions-item label="价格">{{ (device.price_per_minute / 100).toFixed(2) }}元/分钟</el-descriptions-item>
      <el-descriptions-item label="累计收入">¥{{ (device.total_revenue / 100).toFixed(2) }}</el-descriptions-item>
      <el-descriptions-item label="最后在线">
        {{ device.last_seen_at ? formatDateTime(device.last_seen_at) : '从未在线' }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ formatDateTime(device.created_at) }}</el-descriptions-item>
    </el-descriptions>

    <div class="device-actions" style="margin-top: 20px; text-align: right;">
      <el-button @click="$emit('close')">关闭</el-button>
      <el-button 
        v-if="device.status === 'online'" 
        type="success" 
        @click="handleControl('start')"
      >
        启动设备
      </el-button>
      <el-button 
        v-if="device.work_status === 'working'" 
        type="warning" 
        @click="handleControl('stop')"
      >
        停止设备
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { Device } from '@/types/device'
import { formatDateTime } from '../utils/format'

interface Props {
  device: Device
}

defineProps<Props>()
defineEmits<{
  close: []
}>()

// 工具方法
const getStatusTagType = (status: string) => {
  const typeMap: Record<string, string> = {
    online: 'success',
    working: 'primary',
    offline: 'info',
    error: 'danger'
  }
  return typeMap[status] || 'info'
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

const handleControl = (command: string) => {
  // TODO: 实现设备控制
  ElMessage.info(`设备控制功能开发中: ${command}`)
}
</script>

<style scoped>
.device-detail {
  padding: 20px;
}

.device-actions {
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}
</style>