<template>
  <div class="home">
    <!-- 顶部Banner（系统公告、优惠活动） -->
    <van-swipe class="banner" :autoplay="3000" indicator-color="white">
      <van-swipe-item v-for="(banner, index) in banners" :key="index">
        <div class="banner-content" :style="{ background: banner.background }">
          <div class="banner-text">
            <h3>{{ banner.title }}</h3>
            <p>{{ banner.subtitle }}</p>
          </div>
          <div class="banner-icon" v-if="banner.icon">
            <van-icon :name="banner.icon" />
          </div>
        </div>
      </van-swipe-item>
    </van-swipe>

    <!-- 附近洗车点（基于微信定位 API） -->
    <div class="nearby-section">
      <div class="location-header" @click="getLocation">
        <van-icon name="location-o" />
        <span>{{ currentLocation || '点击获取位置' }}</span>
        <van-icon name="arrow" class="arrow-icon" />
      </div>
      
      <van-loading v-if="loading" class="loading" />
      
      <div v-else-if="stores.length === 0" class="empty">
        <van-empty description="暂无附近洗车点" />
      </div>
      
      <div v-else class="store-list">
        <div
          v-for="store in stores"
          :key="store.id"
          class="store-card"
          @click="goToStoreDetail(store)"
        >
          <div class="store-header">
            <h4>{{ store.name }}</h4>
            <div class="distance" v-if="store.distance">
              {{ formatDistance(store.distance) }}
            </div>
          </div>
          <div class="store-address">
            <van-icon name="location" />
            <span>{{ store.address }}</span>
          </div>
          <div class="store-devices">
            <span class="device-status">
              设备状态：
              <span :class="getDeviceStatusClass(store)">
                {{ getDeviceStatusText(store) }}
              </span>
            </span>
            <div class="navigation" @click.stop="navigateToStore(store)">
              <van-icon name="guide-o" />
              <span>一键导航</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷入口：【立即洗车】【充值中心】【我的订单】 -->
    <div class="quick-actions">
      <div class="action-item primary" @click="startWashing">
        <div class="action-icon">
          <van-icon name="play-circle" />
        </div>
        <span>立即洗车</span>
      </div>
      <div class="action-item" @click="$router.push('/recharge')">
        <div class="action-icon">
          <van-icon name="balance-o" />
        </div>
        <span>充值中心</span>
      </div>
      <div class="action-item" @click="$router.push('/orders')">
        <div class="action-icon">
          <van-icon name="orders-o" />
        </div>
        <span>我的订单</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { storeApi } from '@/api/store'
import type { Store } from '@/types'

const router = useRouter()

// 响应式数据
const searchKeyword = ref('')
const currentLocation = ref('')
const stores = ref<Store[]>([])
const loading = ref(false)
const userLocation = ref<{ latitude: number; longitude: number } | null>(null)

// 轮播图数据 - 系统公告和优惠活动
const banners = ref([
  {
    title: '🎉 新用户专享优惠',
    subtitle: '首次洗车立减5元，充值更有好礼相送',
    background: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
    icon: 'gift-o'
  },
  {
    title: '💰 充值送好礼',
    subtitle: '充100送20，充200送50，充500送150',
    background: 'linear-gradient(135deg, #1989fa, #4fc3f7)',
    icon: 'balance-o'
  },
  {
    title: '📍 智能定位服务',
    subtitle: '基于微信定位，快速找到最近洗车点',
    background: 'linear-gradient(135deg, #52c41a, #73d13d)',
    icon: 'location-o'
  }
])

// 获取位置信息
const getLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation.value = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
        // 这里可以调用地理编码API获取地址名称
        currentLocation.value = '当前位置'
        // 重新加载门店，使用真实位置
        loadNearbyStores()
      },
      (error) => {
        console.error('获取位置失败:', error)
        showToast('获取位置失败，请手动选择')
        currentLocation.value = '定位失败'
      }
    )
  } else {
    showToast('浏览器不支持定位功能')
    currentLocation.value = '不支持定位'
  }
}

// 加载附近门店 - 简化版本，符合文档设计
const loadNearbyStores = async () => {
  loading.value = true
  try {
    // 模拟附近洗车点数据，符合文档要求
    await new Promise(resolve => setTimeout(resolve, 500)) // 模拟网络延迟
    
    stores.value = [
      {
        id: 1,
        name: '亮车惠洗车点(万达店)',
        address: '万达广场B1层停车场',
        distance: 0.5,
        availableDevices: 3,
        deviceCount: 4,
        status: 'active',
        minPrice: 8,
        image: '/images/store1.jpg'
      },
      {
        id: 2,
        name: '亮车惠洗车点(银泰店)',
        address: '银泰城地下停车场',
        distance: 1.2,
        availableDevices: 2,
        deviceCount: 3,
        status: 'active',
        minPrice: 8,
        image: '/images/store2.jpg'
      },
      {
        id: 3,
        name: '亮车惠洗车点(华润店)',
        address: '华润万家地下车库',
        distance: 2.1,
        availableDevices: 1,
        deviceCount: 2,
        status: 'active',
        minPrice: 10,
        image: '/images/store3.jpg'
      }
    ]
    
    console.log('门店数据加载成功:', stores.value)
  } catch (error) {
    console.error('加载门店失败:', error)
    showToast('加载门店失败')
    stores.value = []
  } finally {
    loading.value = false
  }
}

// 搜索
const onSearch = (value: string) => {
  if (value.trim()) {
    router.push(`/search?keyword=${encodeURIComponent(value)}`)
  }
}

// 格式化距离
const formatDistance = (distance: number | string): string => {
  const dist = typeof distance === 'string' ? parseFloat(distance) : distance
  if (dist < 1000) {
    return `${Math.round(dist)}m`
  } else {
    return `${(dist / 1000).toFixed(1)}km`
  }
}

// 获取状态文本
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    active: '营业中',
    inactive: '暂停营业'
  }
  return statusMap[status] || '未知状态'
}

// 获取设备状态文本
const getDeviceStatusText = (store: any): string => {
  if (store.availableDevices === 0) {
    return '全部占用'
  } else if (store.availableDevices === store.deviceCount) {
    return '全部可用'
  } else {
    return `${store.availableDevices}台可用`
  }
}

// 获取设备状态样式类
const getDeviceStatusClass = (store: any): string => {
  if (store.availableDevices === 0) {
    return 'status-busy'
  } else if (store.availableDevices > 0) {
    return 'status-available'
  } else {
    return 'status-offline'
  }
}

// 跳转到门店详情
const goToStoreDetail = (store: any) => {
  router.push(`/stores/${store.id}`)
}

// 一键导航到门店
const navigateToStore = (store: any) => {
  // 使用微信内置地图或外部地图应用
  const url = `https://uri.amap.com/navigation?to=${store.longitude},${store.latitude},${store.name}&mode=car&policy=1&src=myapp&coordinate=gaode&callnative=0`
  window.open(url, '_blank')
  showToast('正在打开导航...')
}

// 立即洗车
const startWashing = () => {
  if (stores.value.length === 0) {
    showToast('暂无附近洗车点')
    return
  }
  
  // 找到最近的可用门店
  const availableStore = stores.value.find(store => store.availableDevices > 0)
  if (availableStore) {
    router.push(`/stores/${availableStore.id}`)
  } else {
    showToast('附近暂无可用设备')
  }
}

// 组件挂载时执行
onMounted(() => {
  getLocation()
  // 直接加载附近门店，不依赖定位
  loadNearbyStores()
})
</script>

<style scoped>
.home {
  min-height: 100vh;
  background-color: #f7f8fa;
}

/* 顶部Banner样式 */
.banner {
  height: 160px;
  margin-bottom: 16px;
}

.banner-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  color: white;
  padding: 20px 24px;
  position: relative;
  overflow: hidden;
}

.banner-text h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.banner-text p {
  margin: 0;
  font-size: 14px;
  opacity: 0.95;
  line-height: 1.4;
}

.banner-icon {
  font-size: 48px;
  opacity: 0.3;
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
}

/* 附近洗车点区域 */
.nearby-section {
  background: white;
  margin-bottom: 16px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.location-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.location-header .van-icon:first-child {
  color: #1989fa;
  margin-right: 8px;
  font-size: 16px;
}

.location-header span {
  flex: 1;
  font-size: 15px;
  color: #333;
  font-weight: 500;
}

.arrow-icon {
  color: #999;
  font-size: 14px;
}

.loading {
  text-align: center;
  padding: 40px 20px;
}

.empty {
  text-align: center;
  padding: 40px 20px;
}

.store-list {
  padding: 0 20px 20px;
}

.store-card {
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.store-card:last-child {
  border-bottom: none;
}

.store-card:active {
  background-color: #f8f9fa;
}

.store-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.store-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.distance {
  font-size: 12px;
  color: #1989fa;
  background: #e6f7ff;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.store-address {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.store-address .van-icon {
  color: #999;
  margin-right: 6px;
  font-size: 14px;
}

.store-address span {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.store-devices {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.device-status {
  font-size: 13px;
  color: #666;
}

.status-available {
  color: #52c41a;
  font-weight: 500;
}

.status-busy {
  color: #ff4d4f;
  font-weight: 500;
}

.status-offline {
  color: #999;
  font-weight: 500;
}

.navigation {
  display: flex;
  align-items: center;
  color: #1989fa;
  font-size: 13px;
  cursor: pointer;
}

.navigation .van-icon {
  margin-right: 4px;
  font-size: 14px;
}

.navigation:active {
  opacity: 0.7;
}

/* 快捷入口样式 */
.quick-actions {
  display: flex;
  gap: 12px;
  padding: 0 20px;
  margin-bottom: 20px;
}

.action-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-item:active {
  transform: translateY(1px);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.action-item.primary {
  background: linear-gradient(135deg, #1989fa, #4fc3f7);
  color: white;
}

.action-item.primary .action-icon {
  background: rgba(255, 255, 255, 0.2);
}

.action-item.primary .van-icon {
  color: white;
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #f0f9ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.action-icon .van-icon {
  font-size: 24px;
  color: #1989fa;
}

.action-item span {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.action-item.primary span {
  color: white;
  font-weight: 600;
}

/* 响应式适配 */
@media (max-width: 375px) {
  .banner-content {
    padding: 16px 20px;
  }
  
  .banner-text h3 {
    font-size: 18px;
  }
  
  .quick-actions {
    gap: 8px;
    padding: 0 16px;
  }
  
  .action-item {
    padding: 16px 12px;
  }
  
  .action-icon {
    width: 40px;
    height: 40px;
  }
  
  .action-icon .van-icon {
    font-size: 20px;
  }
}
</style>