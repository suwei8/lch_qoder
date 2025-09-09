<template>
  <div class="device-control-panel">
    <el-dialog
      v-model="visible"
      :title="`设备控制 - ${device?.name || '未知设备'}`"
      width="900px"
      :before-close="handleClose"
      destroy-on-close
    >
      <div v-if="device" class="control-content">
        <!-- 设备基本信息 -->
        <el-card class="device-info-card" shadow="never">
          <template #header>
            <span class="card-title">设备信息</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="info-item">
                <label>设备ID:</label>
                <span>{{ device.devid }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>设备名称:</label>
                <span>{{ device.name }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>当前状态:</label>
                <el-tag :type="getStatusType(device.status)">
                  {{ getStatusText(device.status) }}
                </el-tag>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>工作状态:</label>
                <el-tag :type="getWorkStatusType(device.work_status)" size="small">
                  {{ getWorkStatusText(device.work_status) }}
                </el-tag>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>最后在线:</label>
                <span>{{ device.last_online_at ? formatTime(device.last_online_at) : 'N/A' }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>信号强度:</label>
                <span>{{ device.signal_strength || 'N/A' }}</span>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <!-- 实时数据监控 -->
        <el-card class="monitor-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">实时监控</span>
              <el-button 
                type="primary" 
                size="small" 
                @click="refreshRealTimeData"
                :loading="loadingRealTime"
              >
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="monitor-item">
                <div class="monitor-label">当前用户数</div>
                <div class="monitor-value">{{ realTimeData.currentUsers }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="monitor-item">
                <div class="monitor-label">今日使用次数</div>
                <div class="monitor-value">{{ realTimeData.todayUsage }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="monitor-item">
                <div class="monitor-label">今日收入</div>
                <div class="monitor-value">¥{{ realTimeData.todayRevenue }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="monitor-item">
                <div class="monitor-label">总收入</div>
                <div class="monitor-value">¥{{ device.total_revenue || 0 }}</div>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <!-- 设备控制区域 -->
        <el-card class="control-card" shadow="never">
          <template #header>
            <span class="card-title">设备控制</span>
          </template>
          <div class="control-buttons">
            <el-row :gutter="20">
              <el-col :span="6">
                <el-button 
                  type="success" 
                  :disabled="device.status !== 'online' || controlLoading"
                  @click="handleStartDevice"
                  :loading="controlLoading && currentCommand === 'start'"
                  block
                >
                  <el-icon><VideoPlay /></el-icon>
                  启动设备
                </el-button>
              </el-col>
              <el-col :span="6">
                <el-button 
                  type="warning" 
                  :disabled="device.work_status !== 'working' || controlLoading"
                  @click="handleStopDevice"
                  :loading="controlLoading && currentCommand === 'stop'"
                  block
                >
                  <el-icon><VideoPause /></el-icon>
                  停止设备
                </el-button>
              </el-col>
              <el-col :span="6">
                <el-button 
                  type="danger" 
                  :disabled="device.status !== 'online' || controlLoading"
                  @click="handleResetDevice"
                  :loading="controlLoading && currentCommand === 'reboot'"
                  block
                >
                  <el-icon><RefreshRight /></el-icon>
                  重置设备
                </el-button>
              </el-col>
              <el-col :span="6">
                <el-button 
                  type="info" 
                  :disabled="controlLoading"
                  @click="handleMaintenanceMode"
                  :loading="controlLoading && currentCommand === 'maintenance'"
                  block
                >
                  <el-icon><Tools /></el-icon>
                  {{ device.status === 'maintenance' ? '退出维护' : '维护模式' }}
                </el-button>
              </el-col>
            </el-row>
          </div>
        </el-card>

        <!-- 参数配置 -->
        <el-card class="config-card" shadow="never">
          <template #header>
            <span class="card-title">参数配置</span>
          </template>
          <el-form :model="configForm" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="价格(元/分钟)">
                  <el-input-number
                    v-model="configForm.pricePerMinute"
                    :min="0"
                    :max="100"
                    :precision="2"
                    :step="0.1"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="最大使用时长">
                  <el-input-number
                    v-model="configForm.maxDuration"
                    :min="1"
                    :max="120"
                    style="width: 100%"
                  />
                  <span style="margin-left: 8px;">分钟</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="预警温度">
                  <el-input-number
                    v-model="configForm.warningTemperature"
                    :min="0"
                    :max="100"
                    style="width: 100%"
                  />
                  <span style="margin-left: 8px;">°C</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="液位预警">
                  <el-input-number
                    v-model="configForm.lowLevelWarning"
                    :min="0"
                    :max="100"
                    style="width: 100%"
                  />
                  <span style="margin-left: 8px;">%</span>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item>
              <el-button 
                type="primary" 
                @click="saveConfig"
                :loading="configLoading"
              >
                保存配置
              </el-button>
              <el-button @click="resetConfig">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 操作日志 -->
        <el-card class="log-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">最近操作日志</span>
              <el-button 
                type="primary" 
                size="small" 
                @click="refreshLogs"
                :loading="loadingLogs"
              >
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          <el-table :data="operationLogs" max-height="200">
            <el-table-column prop="time" label="时间" width="150">
              <template #default="{ row }">
                {{ formatTime(row.time) }}
              </template>
            </el-table-column>
            <el-table-column prop="action" label="操作" width="120" />
            <el-table-column prop="operator" label="操作员" width="100" />
            <el-table-column prop="result" label="结果" width="80">
              <template #default="{ row }">
                <el-tag :type="row.success ? 'success' : 'danger'" size="small">
                  {{ row.success ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" show-overflow-tooltip />
          </el-table>
        </el-card>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Refresh, 
  VideoPlay, 
  VideoPause, 
  RefreshRight, 
  Tools 
} from '@element-plus/icons-vue';
import { deviceApi } from '@/api/device';
import type { Device } from '@/types/device';
import type { DeviceWorkStatus } from '@/types/common';
import { formatTime } from '@/utils/format';

// Props
interface Props {
  device: Device | null;
  visible: boolean;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
  (e: 'refresh'): void;
}>();

// 响应式数据
const loadingRealTime = ref(false);
const loadingLogs = ref(false);
const controlLoading = ref(false);
const configLoading = ref(false);
const currentCommand = ref('');

// 实时数据
const realTimeData = ref({
  currentUsers: 0,
  todayUsage: 0,
  todayRevenue: 0,
});

// 配置表单
const configForm = reactive({
  pricePerMinute: 0,
  maxDuration: 60,
  warningTemperature: 80,
  lowLevelWarning: 20,
});

// 操作日志
const operationLogs = ref([
  {
    time: new Date(),
    action: '启动设备',
    operator: '管理员',
    success: true,
    remark: '用户扫码启动洗车服务',
  },
  {
    time: new Date(Date.now() - 5 * 60 * 1000),
    action: '停止设备',
    operator: '系统',
    success: true,
    remark: '洗车服务完成，自动停止',
  },
  {
    time: new Date(Date.now() - 15 * 60 * 1000),
    action: '参数配置',
    operator: '管理员',
    success: true,
    remark: '更新价格配置',
  },
]);

// 监听设备变化，更新配置表单
watch(() => props.device, (device) => {
  if (device) {
    configForm.pricePerMinute = device.price_per_minute || 0;
    configForm.maxDuration = device.max_duration_minutes || 60;
    configForm.warningTemperature = 80; // 默认值，因为 Device 类型中没有这个字段
    configForm.lowLevelWarning = 20; // 默认值，因为 Device 类型中没有这个字段
    
    // 加载实时数据
    refreshRealTimeData();
  }
}, { immediate: true });

// 状态显示辅助函数
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    online: 'success',
    offline: 'info',
    error: 'danger',
    maintenance: 'warning'
  };
  return statusMap[status] || 'info';
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    online: '在线',
    offline: '离线',
    error: '故障',
    maintenance: '维护'
  };
  return statusMap[status] || '未知';
};

const getWorkStatusType = (workStatus: DeviceWorkStatus | undefined) => {
  if (!workStatus) return 'info';
  const statusMap: Record<string, string> = {
    idle: 'info',
    working: 'warning',
    completed: 'success',
    error: 'danger'
  };
  return statusMap[workStatus] || 'info';
};

const getWorkStatusText = (workStatus: DeviceWorkStatus | undefined) => {
  if (!workStatus) return '未知';
  const statusMap: Record<string, string> = {
    idle: '空闲',
    working: '工作中',
    completed: '已完成',
    error: '错误'
  };
  return statusMap[workStatus] || '未知';
};

// 刷新实时数据
const refreshRealTimeData = async () => {
  if (!props.device) return;
  
  loadingRealTime.value = true;
  try {
    // 模拟实时数据
    realTimeData.value = {
      currentUsers: Math.floor(Math.random() * 5),
      todayUsage: Math.floor(Math.random() * 50) + 10,
      todayRevenue: Math.floor(Math.random() * 1000) + 200,
    };
    
    // TODO: 调用真实API获取实时数据
    // const response = await deviceApi.getRealTimeData(props.device.id);
    // realTimeData.value = response;
  } catch (error) {
    console.error('获取实时数据失败:', error);
  } finally {
    loadingRealTime.value = false;
  }
};

// 设备控制操作
const handleStartDevice = async () => {
  if (!props.device) return;
  
  try {
    currentCommand.value = 'start';
    controlLoading.value = true;
    
    await deviceApi.controlDevice(props.device.id, {
      command: 'start',
      parameters: {}
    });
    
    ElMessage.success('设备启动成功');
    emit('refresh');
  } catch (error) {
    ElMessage.error('设备启动失败');
  } finally {
    controlLoading.value = false;
    currentCommand.value = '';
  }
};

const handleStopDevice = async () => {
  if (!props.device) return;
  
  try {
    currentCommand.value = 'stop';
    controlLoading.value = true;
    
    await deviceApi.controlDevice(props.device.id, {
      command: 'stop',
      parameters: {}
    });
    
    ElMessage.success('设备停止成功');
    emit('refresh');
  } catch (error) {
    ElMessage.error('设备停止失败');
  } finally {
    controlLoading.value = false;
    currentCommand.value = '';
  }
};

const handleResetDevice = async () => {
  if (!props.device) return;
  
  const result = await ElMessageBox.confirm(
    '确定要重置设备吗？这将中断当前操作。',
    '确认重置',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).catch(() => false);
  
  if (!result) return;
  
  try {
    currentCommand.value = 'reboot';
    controlLoading.value = true;
    
    await deviceApi.controlDevice(props.device.id, {
      command: 'reboot', // 使用 'reboot' 而不是 'reset'
      parameters: {}
    });
    
    ElMessage.success('设备重置成功');
    emit('refresh');
  } catch (error) {
    ElMessage.error('设备重置失败');
  } finally {
    controlLoading.value = false;
    currentCommand.value = '';
  }
};

const handleMaintenanceMode = async () => {
  if (!props.device) return;
  
  const isMaintenanceMode = props.device.status === 'maintenance';
  const action = isMaintenanceMode ? '退出维护模式' : '进入维护模式';
  
  const result = await ElMessageBox.confirm(
    `确定要${action}吗？`,
    '确认操作',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).catch(() => false);
  
  if (!result) return;
  
  try {
    currentCommand.value = 'maintenance';
    controlLoading.value = true;
    
    await deviceApi.setMaintenanceMode(props.device.id, !isMaintenanceMode);
    
    ElMessage.success(`${action}成功`);
    emit('refresh');
  } catch (error) {
    ElMessage.error(`${action}失败`);
  } finally {
    controlLoading.value = false;
    currentCommand.value = '';
  }
};

// 保存配置
const saveConfig = async () => {
  if (!props.device) return;
  
  try {
    configLoading.value = true;
    
    await deviceApi.updateDevice(props.device.id, {
      price_per_minute: configForm.pricePerMinute,
      max_duration_minutes: configForm.maxDuration,
      // Note: warning_temperature and low_level_warning are not in platform DTO
      // Remove or add them to UpdateDeviceDto if needed
    });
    
    ElMessage.success('配置保存成功');
    emit('refresh');
  } catch (error) {
    ElMessage.error('配置保存失败');
  } finally {
    configLoading.value = false;
  }
};

// 重置配置
const resetConfig = () => {
  if (props.device) {
    configForm.pricePerMinute = props.device.price_per_minute || 0;
    configForm.maxDuration = props.device.max_duration_minutes || 60;
    configForm.warningTemperature = 80; // 默认值
    configForm.lowLevelWarning = 20; // 默认值
  }
};

// 刷新日志
const refreshLogs = async () => {
  if (!props.device) return;
  
  loadingLogs.value = true;
  try {
    // TODO: 调用真实API获取操作日志
    // const logs = await deviceApi.getOperationLogs(props.device.id);
    // operationLogs.value = logs;
    
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    console.error('获取操作日志失败:', error);
  } finally {
    loadingLogs.value = false;
  }
};

// 关闭对话框
const handleClose = () => {
  emit('update:visible', false);
};
</script>

<style scoped>
.device-control-panel {
  .control-content {
    .device-info-card,
    .monitor-card,
    .control-card,
    .config-card,
    .log-card {
      margin-bottom: 20px;
    }
    
    .device-info-card:last-child,
    .monitor-card:last-child,
    .control-card:last-child,
    .config-card:last-child,
    .log-card:last-child {
      margin-bottom: 0;
    }
  }
  
  .card-title {
    font-weight: 600;
    font-size: 16px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .info-item {
    margin-bottom: 12px;
    
    label {
      font-weight: 500;
      color: #666;
      margin-right: 8px;
    }
  }
  
  .monitor-item {
    text-align: center;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;
    
    .monitor-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }
    
    .monitor-value {
      font-size: 24px;
      font-weight: bold;
      color: #1890ff;
    }
  }
  
  .control-buttons {
    .el-button {
      height: 80px;
      font-size: 16px;
      
      .el-icon {
        font-size: 20px;
        margin-right: 8px;
      }
    }
  }
  
  .dialog-footer {
    text-align: right;
  }
}
</style>