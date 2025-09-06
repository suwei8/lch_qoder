<template>
  <div class="store-detail-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="门店详情"
      left-arrow
      @click-left="$router.back()"
    >
      <template #right>
        <van-icon name="share-o" @click="shareStore" />
      </template>
    </van-nav-bar>

    <div v-if="store" class="store-content">
      <!-- 门店信息卡片 -->
      <div class="store-card">
        <div class="store-header">
          <h2 class="store-name">{{ store.name }}</h2>
          <div class="store-status" :class="getStoreStatusClass()">
            <span class="status-dot"></span>
            <span class="status-text">{{ getStoreStatusText() }}</span>
          </div>
        </div>
        
        <div class="store-info">
          <div class="info-item">
            <van-icon name="location-o" />
            <span>{{ store.address }}</span>
          </div>
          
          <div class="info-item">
            <van-icon name="phone-o" />
            <span>{{ store.phone }}</span>
          </div>
          
          <div class="info-item">
            <van-icon name="clock-o" />
            <span>营业时间：{{ store.businessHours }}</span>
          </div>
          
          <div class="info-item" v-if="store.distance">
            <van-icon name="location" />
            <span>距离：{{ formatDistance(store.distance) }}</span>
          </div>
        </div>
        
        <div class="store-actions">
          <van-button 
            type="default" 
            size="large" 
            icon="guide-o"
            @click="navigateToStore"
          >
            导航
          </van-button>
          
          <van-button 
            type="primary" 
            size="large" 
            icon="phone-o"
            @click="callStore"
          >
            致电
          </van-button>
        </div>
      </div>

      <!-- 设备列表 -->
      <div class="devices-section">
        <div class="section-header">
          <h3>洗车设备</h3>
          <van-button 
            size="small" 
            @click="refreshDevices"
            :loading="isLoadingDevices"
          >
            刷新状态
          </van-button>
        </div>
        
        <div v-if="isLoadingDevices" class="loading-container">
          <van-loading size="24px">加载中...</van-loading>
        </div>
        
        <div v-else class="device-list">
          <div
            v-for="device in devices"
            :key="device.id"
            class="device-card"
            :class="{ disabled: device.status !== 'idle' }"
            @click="selectDevice(device)"
          >
            <div class="device-info">
              <div class="device-header">
                <h4 class="device-name">{{ device.name }}</h4>
                <div class="device-status" :class="device.status">
                  <span class="status-dot"></span>
                  <span class="status-text">{{ getDeviceStatusText(device.status) }}</span>
                </div>
              </div>
              
              <p class="device-price">
                ¥{{ device.price }}/分钟 (最低消费 ¥{{ device.minAmount }})
              </p>
              
              <p v-if="device.description" class="device-desc">
                {{ device.description }}
              </p>
            </div>
            
            <div class="device-action">
              <van-button
                v-if="device.status === 'idle'"
                type="primary"
                size="small"
                @click.stop="startWashing(device)"
              >
                立即启动
              </van-button>
              
              <van-button
                v-else
                disabled
                size="small"
              >
                {{ device.status === 'busy' ? '使用中' : '离线' }}
              </van-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 价格说明 -->
      <div class="price-info">
        <h3>计费说明</h3>
        <div class="price-rules">
          <div class="rule-item">
            <span class="rule-label">标准洗车：</span>
            <span class="rule-value">¥3/分钟，最低消费¥15</span>
          </div>
          <div class="rule-item">
            <span class="rule-label">精洗服务：</span>
            <span class="rule-value">¥5/分钟，最低消费¥25</span>
          </div>
          <div class="rule-item">
            <span class="rule-label">计费方式：</span>
            <span class="rule-value">按实际使用时间计费，不足1分钟按1分钟计算</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="isLoading" class="loading-container">
      <van-loading size="24px">加载门店信息...</van-loading>
    </div>

    <!-- 错误状态 -->
    <div v-else class="error-container">
      <van-empty 
        image="error" 
        description="加载失败"
      >
        <van-button type="primary" @click="loadStoreDetail">
          重新加载
        </van-button>
      </van-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeApi } from '@/api/store'
import type { Store, Device } from '@/types'
import { Toast, Dialog } from 'vant'

const route = useRoute()
const router = useRouter()

// 响应式数据
const store = ref<Store | null>(null)
const devices = ref<Device[]>([])
const isLoading = ref(true)
const isLoadingDevices = ref(false)

// 格式化距离
const formatDistance = (distance: number) => {
  if (distance < 1000) {
    return `${Math.round(distance)}m`
  }
  return `${(distance / 1000).toFixed(1)}km`
}

// 获取门店状态样式类
const getStoreStatusClass = () => {
  if (!store.value) return ''
  if (store.value.availableDevices === 0) return 'busy'
  if (store.value.availableDevices < store.value.deviceCount / 2) return 'warning'
  return 'available'
}

// 获取门店状态文本
const getStoreStatusText = () => {
  if (!store.value) return ''
  if (store.value.availableDevices === 0) return '设备繁忙'
  if (store.value.availableDevices < store.value.deviceCount / 2) return '少量可用'
  return '设备充足'
}

// 获取设备状态文本
const getDeviceStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    idle: '空闲',
    busy: '使用中',
    offline: '离线',
    fault: '故障'
  }
  return statusMap[status] || '未知'
}

// 加载门店详情
const loadStoreDetail = async () => {
  try {
    isLoading.value = true
    const storeId = Number(route.params.id)
    
    const [storeData, devicesData] = await Promise.all([
      storeApi.getStoreDetail(storeId),
      storeApi.getStoreDevices(storeId)
    ])
    
    store.value = storeData
    devices.value = devicesData
  } catch (error) {
    console.error('加载门店详情失败:', error)
    Toast.fail('加载门店信息失败')
    
    // 显示模拟数据
    store.value = getMockStore()
    devices.value = getMockDevices()
  } finally {
    isLoading.value = false
  }
}

// 获取模拟门店数据
const getMockStore = (): Store => {
  return {
    id: Number(route.params.id),
    name: '北京朝阳大悦城洗车点',
    address: '北京市朝阳区朝阳北路101号大悦城B1层',
    phone: '010-12345678',
    businessHours: '07:00-23:00',
    latitude: 39.9042,
    longitude: 116.4074,
    distance: 500,
    deviceCount: 4,
    availableDevices: 3,
    merchantId: 1,
    status: 'active'
  }
}

// 获取模拟设备数据
const getMockDevices = (): Device[] => {
  return [
    {
      id: 1,
      name: '1号洗车机',
      code: 'WC001',
      storeId: Number(route.params.id),
      status: 'idle',
      price: 3,
      minAmount: 15,
      description: '标准洗车服务，适合日常清洁'
    },
    {
      id: 2,
      name: '2号洗车机',
      code: 'WC002',
      storeId: Number(route.params.id),
      status: 'busy',
      price: 3,
      minAmount: 15,
      description: '标准洗车服务，适合日常清洁'
    },
    {
      id: 3,
      name: '3号精洗机',
      code: 'WC003',
      storeId: Number(route.params.id),
      status: 'idle',
      price: 5,
      minAmount: 25,
      description: '精洗服务，深度清洁，包含泡沫和蜡水'
    },
    {
      id: 4,
      name: '4号精洗机',
      code: 'WC004',
      storeId: Number(route.params.id),
      status: 'offline',
      price: 5,
      minAmount: 25,
      description: '精洗服务，深度清洁，包含泡沫和蜡水'
    }
  ]
}

// 刷新设备状态
const refreshDevices = async () => {
  if (!store.value) return
  
  try {
    isLoadingDevices.value = true
    const devicesData = await storeApi.getStoreDevices(store.value.id)
    devices.value = devicesData
    
    // 更新门店可用设备数量
    store.value.availableDevices = devicesData.filter(d => d.status === 'idle').length
    
    Toast.success('设备状态已更新')
  } catch (error) {
    console.error('刷新设备状态失败:', error)
    Toast.fail('刷新失败')
  } finally {
    isLoadingDevices.value = false
  }
}

// 选择设备
const selectDevice = (device: Device) => {
  if (device.status !== 'idle') {
    Toast.fail('设备不可用')
    return
  }
  
  // 跳转到设备控制页面
  router.push(`/device/${store.value?.id}/${device.id}`)
}

// 开始洗车
const startWashing = async (device: Device) => {
  if (device.status !== 'idle') {
    Toast.fail('设备不可用')
    return
  }
  
  try {
    await Dialog.confirm({
      title: '确认洗车',
      message: `选择${device.name}，¥${device.price}/分钟，最低消费¥${device.minAmount}，确认开始洗车吗？`
    })
    
    // 跳转到支付页面
    router.push({
      path: '/payment',
      query: {
        storeId: store.value?.id,
        deviceId: device.id,
        type: 'wash'
      }
    })
  } catch {
    // 用户取消
  }
}

// 导航到门店
const navigateToStore = () => {
  if (!store.value) return
  
  const url = `https://maps.apple.com/?daddr=${store.value.latitude},${store.value.longitude}`
  window.open(url, '_blank')
}

// 致电门店
const callStore = () => {
  if (!store.value) return
  window.location.href = `tel:${store.value.phone}`
}

// 分享门店
const shareStore = () => {
  if (!store.value) return
  
  if (navigator.share) {
    navigator.share({
      title: store.value.name,
      text: `${store.value.name} - ${store.value.address}`,
      url: window.location.href
    })
  } else {
    Toast.success('链接已复制到剪贴板')
  }
}

onMounted(() => {
  loadStoreDetail()
})
</script>

<style scoped>
.store-detail-container {
  min-height: 100vh;
  background: #f7f8fa;
}

.store-content {
  padding: 16px;
}

.store-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.store-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.store-name {
  font-size: 20px;
  font-weight: 600;
  color: #323233;
  margin: 0;
  flex: 1;
}

.store-status {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.store-status .status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
}

.store-status.available {
  background: #f0f9ff;
  color: #07c160;
}

.store-status.available .status-dot {
  background: #07c160;
}

.store-status.warning {
  background: #fff7e6;
  color: #ff976a;
}

.store-status.warning .status-dot {
  background: #ff976a;
}

.store-status.busy {
  background: #fff1f0;
  color: #ee0a24;
}

.store-status.busy .status-dot {
  background: #ee0a24;
}

.store-info {
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #646566;
}

.info-item .van-icon {
  margin-right: 8px;
  color: #969799;
}

.store-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.devices-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0;
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.device-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #ebedf0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.device-card:not(.disabled):hover {
  border-color: #1989fa;
  background: #f8fafe;
}

.device-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.device-info {
  flex: 1;
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.device-name {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0;
}

.device-status {
  display: flex;
  align-items: center;
  font-size: 12px;
}

.device-status .status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
}

.device-status.idle {
  color: #07c160;
}

.device-status.idle .status-dot {
  background: #07c160;
}

.device-status.busy {
  color: #ff976a;
}

.device-status.busy .status-dot {
  background: #ff976a;
}

.device-status.offline,
.device-status.fault {
  color: #969799;
}

.device-status.offline .status-dot,
.device-status.fault .status-dot {
  background: #969799;
}

.device-price {
  font-size: 14px;
  color: #1989fa;
  font-weight: 600;
  margin: 0 0 4px;
}

.device-desc {
  font-size: 12px;
  color: #969799;
  margin: 0;
}

.device-action {
  margin-left: 16px;
}

.price-info {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.price-info h3 {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 16px;
}

.price-rules {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rule-item {
  display: flex;
  font-size: 14px;
}

.rule-label {
  color: #646566;
  width: 80px;
  flex-shrink: 0;
}

.rule-value {
  color: #323233;
  flex: 1;
}

.loading-container,
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}
</style>