<template>
  <div class="home-container">
    <!-- 顶部用户信息 -->
    <div class="home-header">
      <div class="user-info">
        <div class="avatar-section">
          <van-image
            :src="userStore.user?.avatar"
            round
            width="40"
            height="40"
            :alt="userStore.user?.nickname"
          />
          <div class="greeting">
            <p class="welcome">你好，{{ userStore.user?.nickname || '用户' }}</p>
            <p class="location" @click="refreshLocation">
              <van-icon name="location-o" :color="hasLocation ? '#fff' : '#ff9800'" />
              {{ currentAddress || '点击获取位置' }}
            </p>
          </div>
        </div>
        
        <div class="balance-info">
          <p class="balance-label">余额</p>
          <p class="balance-amount">¥{{ userStore.totalBalance.toFixed(2) }}</p>
        </div>
      </div>
    </div>

    <!-- 公告横幅 -->
    <van-notice-bar
      v-if="announcement"
      :text="announcement"
      color="#1989fa"
      background="#ecf9ff"
      left-icon="volume-o"
    />

    <!-- 快捷功能入口 -->
    <div class="quick-actions">
      <div class="action-item" @click="$router.push('/recharge')">
        <div class="action-icon recharge">
          <van-icon name="gold-coin-o" />
        </div>
        <span class="action-text">充值中心</span>
      </div>
      
      <div class="action-item" @click="$router.push('/orders')">
        <div class="action-icon orders">
          <van-icon name="bill-o" />
        </div>
        <span class="action-text">我的订单</span>
      </div>
      
      <div class="action-item" @click="$router.push('/coupons')">
        <div class="action-icon coupons">
          <van-icon name="coupon-o" />
        </div>
        <span class="action-text">优惠券</span>
        <span v-if="availableCoupons > 0" class="badge">{{ availableCoupons }}</span>
      </div>
      
      <div class="action-item" @click="$router.push('/profile')">
        <div class="action-icon profile">
          <van-icon name="user-o" />
        </div>
        <span class="action-text">个人中心</span>
      </div>
    </div>

    <!-- 附近洗车点 -->
    <div class="nearby-stores">
      <div class="section-header">
        <h3>附近洗车点</h3>
        <van-button 
          type="primary" 
          size="small" 
          @click="refreshStores"
          :loading="isLoadingStores"
          :disabled="!hasLocation"
        >
          刷新
        </van-button>
      </div>

      <!-- 位置提示 -->
      <div v-if="!hasLocation" class="location-hint">
        <van-icon name="location-o" />
        <span>请先获取位置信息以查看附近洗车点</span>
        <van-button type="primary" size="small" @click="refreshLocation">
          获取位置
        </van-button>
      </div>

      <van-pull-refresh v-if="hasLocation" v-model="isRefreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="isLoadingStores"
          :finished="isFinished"
          finished-text="没有更多了"
          @load="loadMoreStores"
        >
          <div
            v-for="store in nearbyStores"
            :key="store.id"
            class="store-card"
            @click="goToStore(store)"
          >
            <div class="store-info">
              <h4 class="store-name">{{ store.name }}</h4>
              <p class="store-address">
                <van-icon name="location-o" />
                {{ store.address }}
              </p>
              <div class="store-meta">
                <span class="distance">{{ formatDistance(store.distance) }}</span>
                <span class="devices">
                  {{ store.availableDevices }}/{{ store.deviceCount }} 设备可用
                </span>
                <span class="hours">{{ store.businessHours }}</span>
              </div>
            </div>
            
            <div class="store-actions">
              <div class="device-status">
                <span 
                  class="status-dot"
                  :class="getStoreStatusClass(store)"
                ></span>
                <span class="status-text">
                  {{ getStoreStatusText(store) }}
                </span>
              </div>
              
              <div class="action-buttons">
                <van-button size="small" @click.stop="navigateToStore(store)">
                  导航
                </van-button>
                <van-button 
                  type="primary" 
                  size="small"
                  :disabled="store.availableDevices === 0"
                >
                  立即洗车
                </van-button>
              </div>
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 底部导航占位 -->
    <div class="bottom-spacer"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { storeApi } from '@/api/store'
import type { Store } from '@/types'
import { showLoadingToast, showFailToast, closeToast } from 'vant'

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const nearbyStores = ref<Store[]>([])
const currentAddress = ref('')
const announcement = ref('🎉 新用户注册即送20元洗车券！')
const availableCoupons = ref(3)
const isLoadingStores = ref(false)
const isRefreshing = ref(false)
const isFinished = ref(false)
const currentPage = ref(1)
const pageSize = 10

// 计算属性
const hasLocation = computed(() => !!userStore.location)

// 格式化距离
const formatDistance = (distance?: number) => {
  if (!distance) return '--'
  if (distance < 1000) {
    return `${Math.round(distance)}m`
  }
  return `${(distance / 1000).toFixed(1)}km`
}

// 获取门店状态样式类
const getStoreStatusClass = (store: Store) => {
  if (store.availableDevices === 0) return 'busy'
  if (store.availableDevices < store.deviceCount / 2) return 'warning'
  return 'available'
}

// 获取门店状态文本
const getStoreStatusText = (store: Store) => {
  if (store.availableDevices === 0) return '设备繁忙'
  if (store.availableDevices < store.deviceCount / 2) return '少量可用'
  return '设备充足'
}

// 刷新位置信息
const refreshLocation = async () => {
  try {
    showLoadingToast('获取位置中...')
    await userStore.getLocation()
    
    // 这里可以调用地址解析API获取详细地址
    currentAddress.value = `北京市朝阳区` // 模拟地址
    
    await loadNearbyStores()
    closeToast()
  } catch (error) {
    showFailToast('获取位置失败')
    console.error('获取位置失败:', error)
  }
}

// 加载附近门店
const loadNearbyStores = async (append = false) => {
  if (!userStore.location) {
    await refreshLocation()
    return
  }

  try {
    isLoadingStores.value = true
    
    const response = await storeApi.getNearbyStores({
      latitude: userStore.location.latitude,
      longitude: userStore.location.longitude,
      radius: 5000, // 5km范围
      page: currentPage.value,
      pageSize
    })

    if (append) {
      nearbyStores.value.push(...response.list)
    } else {
      nearbyStores.value = response.list
    }

    isFinished.value = response.list.length < pageSize
  } catch (error) {
    showFailToast('加载门店失败')
    console.error('加载门店失败:', error)
    
    // 如果API失败，显示模拟数据
    if (!append) {
      nearbyStores.value = getMockStores()
    }
  } finally {
    isLoadingStores.value = false
  }
}

// 获取模拟门店数据
const getMockStores = (): Store[] => {
  return [
    {
      id: 1,
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
    },
    {
      id: 2,
      name: '中关村软件园洗车中心',
      address: '北京市海淀区中关村软件园东路8号',
      phone: '010-87654321',
      businessHours: '06:00-22:00',
      latitude: 39.9769,
      longitude: 116.3099,
      distance: 1200,
      deviceCount: 6,
      availableDevices: 1,
      merchantId: 2,
      status: 'active'
    },
    {
      id: 3,
      name: '三里屯太古里洗车站',
      address: '北京市朝阳区三里屯路19号太古里南区',
      phone: '010-11111111',
      businessHours: '08:00-24:00',
      latitude: 39.9368,
      longitude: 116.4472,
      distance: 2100,
      deviceCount: 3,
      availableDevices: 0,
      merchantId: 3,
      status: 'active'
    }
  ]
}

// 下拉刷新
const onRefresh = async () => {
  currentPage.value = 1
  isFinished.value = false
  await loadNearbyStores()
  isRefreshing.value = false
}

// 刷新门店列表
const refreshStores = () => {
  currentPage.value = 1
  isFinished.value = false
  loadNearbyStores()
}

// 加载更多门店
const loadMoreStores = () => {
  if (isFinished.value) return
  currentPage.value++
  loadNearbyStores(true)
}

// 跳转到门店详情
const goToStore = (store: Store) => {
  router.push(`/store/${store.id}`)
}

// 导航到门店
const navigateToStore = (store: Store) => {
  const url = `https://maps.apple.com/?daddr=${store.latitude},${store.longitude}`
  window.open(url, '_blank')
}

onMounted(async () => {
  // 初始化位置和门店数据
  await refreshLocation()
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: #f7f8fa;
}

.home-header {
  background: linear-gradient(135deg, #1989fa 0%, #1c7df1 100%);
  padding: 20px 16px 24px;
  color: white;
}

.user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.avatar-section {
  display: flex;
  align-items: center;
  flex: 1;
}

.greeting {
  margin-left: 12px;
  flex: 1;
}

.welcome {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px;
}

.location {
  font-size: 12px;
  opacity: 0.9;
  margin: 0;
  display: flex;
  align-items: center;
}

.location .van-icon {
  margin-right: 4px;
}

.balance-info {
  text-align: right;
}

.balance-label {
  font-size: 12px;
  opacity: 0.9;
  margin: 0 0 4px;
}

.balance-amount {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  background: white;
  margin: 0 16px;
  border-radius: 12px;
  padding: 20px 0;
  margin-top: -12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  cursor: pointer;
}

.action-icon {
  width: 44px;
  height: 44px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  margin-bottom: 8px;
}

.action-icon.recharge {
  background: linear-gradient(135deg, #ff976a 0%, #ff7849 100%);
}

.action-icon.orders {
  background: linear-gradient(135deg, #1989fa 0%, #1c7df1 100%);
}

.action-icon.coupons {
  background: linear-gradient(135deg, #07c160 0%, #06a852 100%);
}

.action-icon.profile {
  background: linear-gradient(135deg, #722ed1 0%, #531dab 100%);
}

.action-text {
  font-size: 12px;
  color: #646566;
}

.badge {
  position: absolute;
  top: -4px;
  right: 8px;
  background: #ee0a24;
  color: white;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 8px;
  min-width: 16px;
  text-align: center;
}

.nearby-stores {
  margin-top: 20px;
  padding: 0 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin: 0;
}

.location-hint {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  color: #969799;
  margin-bottom: 16px;
}

.location-hint .van-icon {
  font-size: 24px;
  color: #ddd;
  margin-bottom: 8px;
}

.location-hint span {
  display: block;
  margin-bottom: 12px;
  font-size: 14px;
}

.store-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.store-card:active {
  transform: scale(0.98);
}

.store-info {
  margin-bottom: 12px;
}

.store-name {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 8px;
}

.store-address {
  font-size: 14px;
  color: #646566;
  margin: 0 0 8px;
  display: flex;
  align-items: center;
}

.store-address .van-icon {
  margin-right: 4px;
  color: #969799;
}

.store-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #969799;
}

.store-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.device-status {
  display: flex;
  align-items: center;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.status-dot.available {
  background: #07c160;
}

.status-dot.warning {
  background: #ff976a;
}

.status-dot.busy {
  background: #ee0a24;
}

.status-text {
  font-size: 12px;
  color: #646566;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.bottom-spacer {
  height: 60px;
}
</style>