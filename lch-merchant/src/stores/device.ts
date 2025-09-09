import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { deviceApi } from '@/api/device';
import type { 
  Device, 
  DeviceStatusDetail, 
  DeviceControl,
  DeviceErrorLog,
  DeviceMonitorData 
} from '@/types/device';

export const useDeviceStore = defineStore('device', () => {
  // State
  const devices = ref<Device[]>([]);
  const currentDevice = ref<Device | null>(null);
  const deviceStatus = ref<DeviceStatusDetail | null>(null);
  const errorLogs = ref<DeviceErrorLog[]>([]);
  const monitorData = ref<DeviceMonitorData[]>([]);
  const isLoading = ref(false);
  const controlLoading = ref(false);

  // Getters
  const onlineDevices = computed(() => devices.value.filter(d => d.status === 'online'));
  const offlineDevices = computed(() => devices.value.filter(d => d.status === 'offline'));
  const errorDevices = computed(() => devices.value.filter(d => d.status === 'error'));
  const maintenanceDevices = computed(() => devices.value.filter(d => d.status === 'maintenance'));
  
  const deviceStats = computed(() => ({
    total: devices.value.length,
    online: onlineDevices.value.length,
    offline: offlineDevices.value.length,
    error: errorDevices.value.length,
    maintenance: maintenanceDevices.value.length,
    utilizationRate: devices.value.length > 0 
      ? Math.round(onlineDevices.value.length / devices.value.length * 100) 
      : 0
  }));

  // Actions
  const fetchDevices = async (params?: any) => {
    try {
      isLoading.value = true;
      const response = await deviceApi.getList(params);
      devices.value = response.items;
      return response;
    } catch (error: any) {
      ElMessage.error(error.message || '获取设备列表失败');
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchDeviceDetail = async (id: number) => {
    try {
      isLoading.value = true;
      currentDevice.value = await deviceApi.getDetail(id);
      return currentDevice.value;
    } catch (error: any) {
      ElMessage.error(error.message || '获取设备详情失败');
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchDeviceStatus = async (deviceId: string) => {
    try {
      deviceStatus.value = await deviceApi.getStatus(deviceId);
      return deviceStatus.value;
    } catch (error: any) {
      console.error('获取设备状态失败:', error);
    }
  };

  const controlDevice = async (deviceId: string, command: DeviceControl) => {
    try {
      controlLoading.value = true;
      const response = await deviceApi.control(deviceId, command);
      
      if (response.success) {
        ElMessage.success(`设备控制命令已发送: ${response.message}`);
        
        // 更新本地设备状态
        const device = devices.value.find(d => d.deviceId === deviceId);
        if (device) {
          switch (command.command) {
            case 'start':
              device.status = 'online';
              break;
            case 'stop':
            case 'shutdown':
              device.status = 'offline';
              break;
            case 'maintenance':
              device.status = 'maintenance';
              break;
          }
        }
        
        // 重新获取设备状态
        await fetchDeviceStatus(deviceId);
      } else {
        ElMessage.error(`设备控制失败: ${response.message}`);
      }
      
      return response;
    } catch (error: any) {
      ElMessage.error(error.message || '设备控制失败');
      throw error;
    } finally {
      controlLoading.value = false;
    }
  };

  const updateDevice = async (id: number, data: any) => {
    try {
      isLoading.value = true;
      const updatedDevice = await deviceApi.update(id, data);
      
      // 更新本地设备列表
      const index = devices.value.findIndex(d => d.id === id);
      if (index !== -1) {
        devices.value[index] = updatedDevice;
      }
      
      // 更新当前设备
      if (currentDevice.value?.id === id) {
        currentDevice.value = updatedDevice;
      }
      
      ElMessage.success('设备信息更新成功');
      return updatedDevice;
    } catch (error: any) {
      ElMessage.error(error.message || '设备信息更新失败');
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchErrorLogs = async (params?: any) => {
    try {
      const response = await deviceApi.getErrorLogs(params);
      errorLogs.value = response.items;
      return response;
    } catch (error: any) {
      ElMessage.error(error.message || '获取故障日志失败');
      throw error;
    }
  };

  const reportError = async (deviceId: string, errorData: any) => {
    try {
      const errorLog = await deviceApi.reportError(deviceId, errorData);
      errorLogs.value.unshift(errorLog);
      
      // 更新设备状态为故障
      const device = devices.value.find(d => d.deviceId === deviceId);
      if (device) {
        device.status = 'error';
      }
      
      ElMessage.success('故障报告已提交');
      return errorLog;
    } catch (error: any) {
      ElMessage.error(error.message || '故障报告提交失败');
      throw error;
    }
  };

  const resolveError = async (errorId: number, resolution: string) => {
    try {
      const errorLog = await deviceApi.resolveError(errorId, { resolution });
      
      // 更新本地故障日志
      const index = errorLogs.value.findIndex(e => e.id === errorId);
      if (index !== -1) {
        errorLogs.value[index] = errorLog;
      }
      
      ElMessage.success('故障已解决');
      return errorLog;
    } catch (error: any) {
      ElMessage.error(error.message || '故障解决失败');
      throw error;
    }
  };

  const fetchMonitorData = async (deviceId: string, hours: number = 24) => {
    try {
      monitorData.value = await deviceApi.getMonitorData(deviceId, { hours });
      return monitorData.value;
    } catch (error: any) {
      console.error('获取监控数据失败:', error);
    }
  };

  const refreshDeviceData = async () => {
    try {
      await fetchDevices();
    } catch (error) {
      console.error('刷新设备数据失败:', error);
    }
  };

  const clearDeviceData = () => {
    devices.value = [];
    currentDevice.value = null;
    deviceStatus.value = null;
    errorLogs.value = [];
    monitorData.value = [];
  };

  return {
    // State
    devices,
    currentDevice,
    deviceStatus,
    errorLogs,
    monitorData,
    isLoading,
    controlLoading,
    
    // Getters
    onlineDevices,
    offlineDevices,
    errorDevices,
    maintenanceDevices,
    deviceStats,
    
    // Actions
    fetchDevices,
    fetchDeviceDetail,
    fetchDeviceStatus,
    controlDevice,
    updateDevice,
    fetchErrorLogs,
    reportError,
    resolveError,
    fetchMonitorData,
    refreshDeviceData,
    clearDeviceData,
  };
});