<template>
  <div id="app" class="app-container">
    <!-- 路由视图 -->
    <router-view v-slot="{ Component, route }">
      <transition :name="transitionName" mode="out-in">
        <keep-alive :include="keepAliveComponents">
          <component :is="Component" :key="route.path" />
        </keep-alive>
      </transition>
    </router-view>

    <!-- 底部导航栏 -->
    <van-tabbar 
      v-if="showTabbar" 
      v-model="activeTab" 
      @change="onTabChange"
      class="custom-tabbar"
      active-color="#1989fa"
      inactive-color="#7d7e80"
      border
      safe-area-inset-bottom
    >
      <van-tabbar-item 
        v-for="tab in tabbarItems" 
        :key="tab.name"
        :name="tab.name"
        :icon="tab.icon"
        :badge="tab.badge"
        :dot="tab.dot"
      >
        {{ tab.label }}
      </van-tabbar-item>
    </van-tabbar>

    <!-- 全局加载提示 -->
    <van-overlay 
      :show="globalLoading" 
      class="loading-overlay"
    >
      <div class="loading-content">
        <van-loading size="24px" color="#1989fa" />
        <p class="loading-text">{{ loadingText }}</p>
      </div>
    </van-overlay>

    <!-- 网络状态提示 -->
    <van-notify 
      v-model:show="showNetworkNotify"
      type="warning"
      message="网络连接异常，请检查网络设置"
      :duration="0"
    />

    <!-- 全局消息提示 -->
    <van-notify 
      v-model:show="showGlobalNotify"
      :type="notifyType"
      :message="notifyMessage"
      :duration="3000"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()

// 响应式数据
const activeTab = ref('home')
const transitionName = ref('slide-right')
const globalLoading = ref(false)
const loadingText = ref('加载中...')
const showNetworkNotify = ref(false)
const showGlobalNotify = ref(false)
const notifyType = ref<'primary' | 'success' | 'warning' | 'danger'>('primary')
const notifyMessage = ref('')

// 需要缓存的组件
const keepAliveComponents = ['Home', 'Profile', 'StoreList']

// 底部导航配置
const tabbarItems = ref([
  {
    name: 'home',
    label: '首页',
    icon: 'home-o',
    route: '/home'
  },
  {
    name: 'stores',
    label: '门店',
    icon: 'shop-o',
    route: '/stores'
  },
  {
    name: 'orders',
    label: '订单',
    icon: 'orders-o',
    route: '/orders',
    badge: computed(() => userStore.unreadOrderCount || undefined)
  },
  {
    name: 'profile',
    label: '我的',
    icon: 'user-o',
    route: '/profile',
    dot: computed(() => userStore.hasUnreadMessage)
  }
])

// 显示底部导航的路由
const tabbarRoutes = ['/home', '/stores', '/orders', '/profile']

// 计算属性
const showTabbar = computed(() => {
  return tabbarRoutes.includes(route.path)
})

// 路由切换动画
const routeTransitionMap: Record<string, number> = {
  '/home': 0,
  '/stores': 1,
  '/orders': 2,
  '/profile': 3
}

// 监听路由变化
watch(
  () => route.path,
  (newPath, oldPath) => {
    // 更新活跃标签
    const currentTab = tabbarItems.value.find(item => item.route === newPath)
    if (currentTab) {
      activeTab.value = currentTab.name
    }

    // 设置过渡动画
    const newIndex = routeTransitionMap[newPath] ?? -1
    const oldIndex = routeTransitionMap[oldPath as keyof typeof routeTransitionMap] ?? -1
    
    if (newIndex !== -1 && oldIndex !== -1) {
      transitionName.value = newIndex > oldIndex ? 'slide-left' : 'slide-right'
    } else {
      transitionName.value = 'fade'
    }
  },
  { immediate: true }
)

// 监听全局状态
watch(
  () => appStore.loading,
  (loading) => {
    globalLoading.value = loading
    if (loading) {
      loadingText.value = appStore.loadingText || '加载中...'
    }
  }
)

watch(
  () => appStore.networkStatus,
  (status) => {
    showNetworkNotify.value = status === 'offline'
  }
)

// 标签切换处理
const onTabChange = (name: string) => {
  const tab = tabbarItems.value.find(item => item.name === name)
  if (tab && route.path !== tab.route) {
    router.push(tab.route)
  }
}

// 全局消息显示
const showGlobalMessage = (message: string, type: typeof notifyType.value = 'primary') => {
  notifyMessage.value = message
  notifyType.value = type
  showGlobalNotify.value = true
}

// 网络状态检测
const checkNetworkStatus = () => {
  const updateNetworkStatus = () => {
    appStore.setNetworkStatus(navigator.onLine ? 'online' : 'offline')
  }

  window.addEventListener('online', updateNetworkStatus)
  window.addEventListener('offline', updateNetworkStatus)
  
  // 初始检测
  updateNetworkStatus()

  return () => {
    window.removeEventListener('online', updateNetworkStatus)
    window.removeEventListener('offline', updateNetworkStatus)
  }
}

// 页面可见性检测
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    // 页面变为可见时刷新用户状态
    if (userStore.isLoggedIn) {
      userStore.refreshUserInfo()
    }
  }
}

// 组件挂载和卸载
let cleanupNetworkListener: (() => void) | null = null

onMounted(() => {
  // 初始化网络状态检测
  cleanupNetworkListener = checkNetworkStatus()
  
  // 监听页面可见性变化
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  // 初始化用户信息
  if (userStore.isLoggedIn) {
    userStore.refreshUserInfo()
  }
})

onUnmounted(() => {
  if (cleanupNetworkListener) {
    cleanupNetworkListener()
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

// 暴露方法给全局使用
defineExpose({
  showGlobalMessage
})
</script>

<style>
/* 全局样式重置 */
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Segoe UI, Arial, Roboto, 'PingFang SC', 'miui', 'Hiragino Sans GB', 'Microsoft Yahei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f7f8fa;
}

#app {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 应用容器 */
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 自定义底部导航 */
.custom-tabbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.custom-tabbar .van-tabbar-item {
  font-size: 10px;
}

.custom-tabbar .van-tabbar-item__icon {
  font-size: 20px;
  margin-bottom: 2px;
}

/* 路由过渡动画 */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-leave-to {
  transform: translateX(-100%);
}

.slide-right-enter-from {
  transform: translateX(-100%);
}

.slide-right-leave-to {
  transform: translateX(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 全局加载遮罩 */
.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.loading-text {
  margin: 12px 0 0 0;
  font-size: 14px;
  color: #646566;
}

/* 安全区域适配 */
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

.safe-area-top {
  padding-top: env(safe-area-inset-top);
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

/* 通用工具类 */
.text-center {
  text-align: center;
}

.text-left {
  text-align: left;
}

.text-right {
  text-align: right;
}

.flex {
  display: flex;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flex-column {
  display: flex;
  flex-direction: column;
}

.flex-1 {
  flex: 1;
}

.mt-8 { margin-top: 8px; }
.mt-16 { margin-top: 16px; }
.mt-24 { margin-top: 24px; }
.mb-8 { margin-bottom: 8px; }
.mb-16 { margin-bottom: 16px; }
.mb-24 { margin-bottom: 24px; }
.ml-8 { margin-left: 8px; }
.ml-16 { margin-left: 16px; }
.mr-8 { margin-right: 8px; }
.mr-16 { margin-right: 16px; }

.p-8 { padding: 8px; }
.p-16 { padding: 16px; }
.p-24 { padding: 24px; }
.px-8 { padding-left: 8px; padding-right: 8px; }
.px-16 { padding-left: 16px; padding-right: 16px; }
.py-8 { padding-top: 8px; padding-bottom: 8px; }
.py-16 { padding-top: 16px; padding-bottom: 16px; }

.rounded-8 { border-radius: 8px; }
.rounded-12 { border-radius: 12px; }
.rounded-16 { border-radius: 16px; }
.rounded-full { border-radius: 50%; }

.shadow-sm {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.shadow {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.shadow-lg {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 响应式断点 */
@media (max-width: 375px) {
  .hide-on-small {
    display: none !important;
  }
}

@media (min-width: 376px) {
  .show-on-small {
    display: none !important;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  body {
    background-color: #1a1a1a;
    color: #ffffff;
  }
  
  .custom-tabbar {
    background: rgba(26, 26, 26, 0.95);
    border-top-color: rgba(255, 255, 255, 0.1);
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .custom-tabbar {
    border-top-width: 2px;
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  .slide-left-enter-active,
  .slide-left-leave-active,
  .slide-right-enter-active,
  .slide-right-leave-active,
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>