<template>
  <div class="device-control-container">
    <!-- 导航栏 -->
    <van-nav-bar
      :title="device?.name || '设备控制'"
      left-arrow
      @click-left="handleBack"
    />

    <div v-if="device && store" class="control-content">
      <!-- 设备信息卡片 -->
      <div class="device-info-card">
        <div class="device-header">
          <h2 class="device-name">{{ device.name }}</h2>
          <div class="device-status" :class="deviceStatus">
            <span class="status-dot"></span>
            <span class="status-text">{{ getStatusText() }}</span>
          </div>
        </div>
        
        <div class="store-info">
          <p class="store-name">{{ store.name }}</p>
          <p class="store-address">{{ store.address }}</p>
        </div>
        
        <div class="price-info">
          <span class="price">¥{{ device.price }}/分钟</span>
          <span class="min-amount">最低消费 ¥{{ device.minAmount }}</span>
        </div>
      </div>

      <!-- 控制区域 -->
      <div class="control-section">
        <!-- 空闲状态 -->
        <div v-if="deviceStatus === 'idle'" class="idle-state">
          <div class="control-icon">
            <van-icon name="play-circle-o" />
          </div>
          <h3>设备已就绪</h3>
          <p class="control-desc">点击下方按钮开始洗车</p>
          
          <van-button 
            type="primary" 
            size="large" 
            class="control-btn"
            @click="startWashing"
            :loading="isStarting"
          >
            立即启动
          </van-button>
        </div>

        <!-- 使用中状态 -->
        <div v-else-if="deviceStatus === 'busy'" class="busy-state">
          <div class="control-icon using">
            <van-icon name="fire-o" />
          </div>
          <h3>洗车进行中</h3>
          
          <!-- 计时器 -->
          <div class="timer-section">
            <div class="timer">
              <span class="time">{{ formatTime(currentDuration) }}</span>
              <span class="label">已用时长</span>
            </div>
            
            <div class="cost">
              <span class="amount">¥{{ currentCost.toFixed(2) }}</span>
              <span class="label">当前费用</span>
            </div>
          </div>
          
          <!-- 进度条 -->
          <div class="progress-section">
            <van-progress 
              :percentage="progressPercentage" 
              color="#1989fa"
              track-color="#f0f0f0"
              :show-pivot="false"
            />
            <p class="progress-text">{{ progressText }}</p>
          </div>
          
          <div class="control-actions">
            <van-button 
              size="large" 
              class="control-btn"
              @click="extendTime"
              :disabled="isExtending"
            >
              延长时间
            </van-button>
            
            <van-button 
              type="danger" 
              size="large" 
              class="control-btn"
              @click="stopWashing"
              :loading="isStopping"
            >
              提前结束
            </van-button>
          </div>
        </div>

        <!-- 完成状态 -->
        <div v-else-if="deviceStatus === 'completed'" class="completed-state">
          <div class="control-icon completed">
            <van-icon name="checked" />
          </div>
          <h3>洗车完成</h3>
          
          <div class="summary-section">
            <div class="summary-item">
              <span class="label">总用时：</span>
              <span class="value">{{ formatTime(totalDuration) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">总费用：</span>
              <span class="value">¥{{ totalCost.toFixed(2) }}</span>
            </div>
          </div>
          
          <van-button 
            type="primary" 
            size="large" 
            class="control-btn"
            @click="viewOrder"
          >
            查看订单
          </van-button>
        </div>

        <!-- 故障状态 -->
        <div v-else class="fault-state">
          <div class="control-icon fault">
            <van-icon name="warning-o" />
          </div>
          <h3>设备异常</h3>
          <p class="control-desc">设备暂时无法使用，请选择其他设备或联系客服</p>
          
          <div class="fault-actions">
            <van-button 
              size="large" 
              class="control-btn"
              @click="refreshStatus"
              :loading="isRefreshing"
            >
              刷新状态
            </van-button>
            
            <van-button 
              type="primary" 
              size="large" 
              class="control-btn"
              @click="contactService"
            >
              联系客服
            </van-button>
          </div>
        </div>
      </div>

      <!-- 使用提示 -->
      <div class="tips-section">
        <h4>使用提示</h4>
        <ul class="tips-list">
          <li>请确保车辆停放在指定区域内</li>
          <li>洗车过程中请勿移动车辆</li>
          <li>如遇异常情况，请及时联系客服</li>
          <li>洗车完成后请及时开走车辆</li>
        </ul>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="isLoading" class="loading-container">
      <van-loading size="24px">加载设备信息...</van-loading>
    </div>

    <!-- 错误状态 -->
    <div v-else class="error-container">
      <van-empty 
        image="error" 
        description="加载失败"
      >
        <van-button type="primary" @click="loadDeviceInfo">
          重新加载
        </van-button>
      </van-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeApi } from '@/api/store'
import type { Store, Device } from '@/types'
import { Toast, Dialog } from 'vant'

const route = useRoute()
const router = useRouter()

// 响应式数据
const store = ref<Store | null>(null)
const device = ref<Device | null>(null)
const deviceStatus = ref<'idle' | 'busy' | 'completed' | 'fault'>('idle')
const currentDuration = ref(0) // 当前用时（秒）
const totalDuration = ref(0) // 总用时（秒）
const currentCost = ref(0) // 当前费用
const totalCost = ref(0) // 总费用
const isLoading = ref(true)
const isStarting = ref(false)
const isStopping = ref(false)
const isExtending = ref(false)
const isRefreshing = ref(false)

// 定时器
let timer: number | null = null

// 计算属性
const progressPercentage = computed(() => {
  if (!device.value || currentDuration.value === 0) return 0
  // 基于最低消费计算进度
  const minDuration = (device.value.minAmount / device.value.price) * 60
  return Math.min((currentDuration.value / minDuration) * 100, 100)
})

const progressText = computed(() => {
  if (!device.value) return ''
  const minDuration = (device.value.minAmount / device.value.price) * 60
  if (currentDuration.value < minDuration) {
    const remaining = minDuration - currentDuration.value
    return `距离最低消费还需 ${formatTime(remaining)}`
  }
  return '已达到最低消费，可随时结束'
})

// 格式化时间
const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 获取状态文本
const getStatusText = () => {
  const statusMap = {
    idle: '空闲',
    busy: '使用中',
    completed: '已完成',
    fault: '故障'
  }
  return statusMap[deviceStatus.value] || '未知'
}

// 加载设备信息
const loadDeviceInfo = async () => {
  try {
    isLoading.value = true
    const storeId = Number(route.params.storeId)
    const deviceId = Number(route.params.deviceId)
    
    const [storeData, deviceData] = await Promise.all([
      storeApi.getStoreDetail(storeId),
      storeApi.getDeviceDetail(deviceId)
    ])
    
    store.value = storeData
    device.value = deviceData
    deviceStatus.value = deviceData.status as any
  } catch (error) {
    console.error('加载设备信息失败:', error)
    Toast.fail('加载设备信息失败')
    
    // 显示模拟数据
    store.value = getMockStore()
    device.value = getMockDevice()
    deviceStatus.value = 'idle'
  } finally {
    isLoading.value = false
  }
}

// 获取模拟数据
const getMockStore = (): Store => {
  return {
    id: Number(route.params.storeId),
    name: '北京朝阳大悦城洗车点',
    address: '北京市朝阳区朝阳北路101号大悦城B1层',
    phone: '010-12345678',
    businessHours: '07:00-23:00',
    latitude: 39.9042,
    longitude: 116.4074,
    deviceCount: 4,
    availableDevices: 3,
    merchantId: 1,
    status: 'active'
  }
}

const getMockDevice = (): Device => {
  return {
    id: Number(route.params.deviceId),
    name: '1号洗车机',
    code: 'WC001',
    storeId: Number(route.params.storeId),
    status: 'idle',
    price: 3,
    minAmount: 15,
    description: '标准洗车服务，适合日常清洁'
  }
}

// 开始洗车
const startWashing = async () => {
  if (!device.value) return
  
  try {
    await Dialog.confirm({
      title: '确认开始洗车',
      message: `费用：¥${device.value.price}/分钟，最低消费¥${device.value.minAmount}，确认开始吗？`
    })
    
    isStarting.value = true
    
    // 模拟启动API调用
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    deviceStatus.value = 'busy'
    startTimer()
    
    Toast.success('洗车已开始')
  } catch {
    // 用户取消
  } finally {
    isStarting.value = false
  }
}

// 停止洗车
const stopWashing = async () => {
  try {
    await Dialog.confirm({
      title: '确认结束洗车',
      message: `当前费用：¥${currentCost.value.toFixed(2)}，确认结束吗？`
    })
    
    isStopping.value = true
    
    // 模拟停止API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    stopTimer()
    deviceStatus.value = 'completed'
    totalDuration.value = currentDuration.value
    totalCost.value = currentCost.value
    
    Toast.success('洗车已结束')
  } catch {
    // 用户取消
  } finally {
    isStopping.value = false
  }
}

// 延长时间
const extendTime = () => {
  Toast.success('已自动延长，请继续使用')
}

// 开始计时
const startTimer = () => {
  timer = setInterval(() => {
    currentDuration.value++
    
    // 计算费用（每分钟计费）
    const minutes = Math.ceil(currentDuration.value / 60)
    currentCost.value = Math.max(minutes * (device.value?.price || 0), device.value?.minAmount || 0)
  }, 1000)
}

// 停止计时
const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// 刷新状态
const refreshStatus = async () => {
  if (!device.value) return
  
  try {
    isRefreshing.value = true
    const status = await storeApi.checkDeviceStatus(device.value.id)
    deviceStatus.value = status.status as any
    
    if (status.available) {
      Toast.success('设备已恢复正常')
    }
  } catch (error) {
    Toast.fail('刷新失败')
  } finally {
    isRefreshing.value = false
  }
}

// 联系客服
const contactService = () => {
  if (store.value) {
    window.location.href = `tel:${store.value.phone}`
  }
}

// 查看订单
const viewOrder = () => {
  router.push('/orders')
}

// 返回处理
const handleBack = () => {
  if (deviceStatus.value === 'busy') {
    Dialog.confirm({
      title: '洗车进行中',
      message: '洗车还在进行中，确定要离开吗？',
    }).then(() => {
      router.back()
    }).catch(() => {
      // 用户取消
    })
  } else {
    router.back()
  }
}

onMounted(() => {
  loadDeviceInfo()
})

onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
.device-control-container {
  min-height: 100vh;
  background: #f7f8fa;
}

.control-content {
  padding: 16px;
}

.device-info-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.device-name {
  font-size: 20px;
  font-weight: 600;
  color: #323233;
  margin: 0;
}

.device-status {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.device-status .status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
}

.device-status.idle {
  background: #f0f9ff;
  color: #07c160;
}

.device-status.idle .status-dot {
  background: #07c160;
}

.device-status.busy {
  background: #fff7e6;
  color: #ff976a;
}

.device-status.busy .status-dot {
  background: #ff976a;
}

.device-status.completed {
  background: #f0f9ff;
  color: #1989fa;
}

.device-status.completed .status-dot {
  background: #1989fa;
}

.device-status.fault {
  background: #fff1f0;
  color: #ee0a24;
}

.device-status.fault .status-dot {
  background: #ee0a24;
}

.store-info {
  margin-bottom: 16px;
}

.store-name {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 4px;
}

.store-address {
  font-size: 14px;
  color: #646566;
  margin: 0;
}

.price-info {
  display: flex;
  gap: 16px;
  font-size: 14px;
}

.price {
  color: #1989fa;
  font-weight: 600;
}

.min-amount {
  color: #646566;
}

.control-section {
  background: white;
  border-radius: 12px;
  padding: 32px 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.control-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 40px;
  color: white;
  background: linear-gradient(135deg, #1989fa 0%, #1c7df1 100%);
}

.control-icon.using {
  background: linear-gradient(135deg, #ff976a 0%, #ff7849 100%);
  animation: pulse 2s infinite;
}

.control-icon.completed {
  background: linear-gradient(135deg, #07c160 0%, #06a852 100%);
}

.control-icon.fault {
  background: linear-gradient(135deg, #ee0a24 0%, #d33a52 100%);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.control-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 8px;
}

.control-desc {
  font-size: 14px;
  color: #646566;
  margin: 0 0 24px;
}

.control-btn {
  width: 100%;
  height: 50px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.control-btn:last-child {
  margin-bottom: 0;
}

.timer-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin: 24px 0;
}

.timer, .cost {
  text-align: center;
}

.timer .time, .cost .amount {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
}

.timer .label, .cost .label {
  font-size: 12px;
  color: #969799;
}

.progress-section {
  margin: 24px 0;
}

.progress-text {
  font-size: 12px;
  color: #646566;
  margin: 8px 0 0;
  text-align: center;
}

.control-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 24px;
}

.summary-section {
  margin: 24px 0;
  padding: 16px;
  background: #f7f8fa;
  border-radius: 8px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.summary-item .label {
  color: #646566;
}

.summary-item .value {
  color: #323233;
  font-weight: 600;
}

.fault-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 24px;
}

.tips-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tips-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 12px;
}

.tips-list {
  padding-left: 16px;
  margin: 0;
}

.tips-list li {
  font-size: 14px;
  color: #646566;
  margin-bottom: 8px;
  line-height: 1.4;
}

.tips-list li:last-child {
  margin-bottom: 0;
}

.loading-container,
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}
</style>