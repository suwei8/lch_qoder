import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useSystemStore = defineStore('system', () => {
  // 网络状态
  const isOnline = ref(navigator.onLine)
  const apiConnected = ref(true)
  const lastApiCheck = ref<Date | null>(null)
  
  // 离线模式提示
  const showOfflineNotice = computed(() => !isOnline.value || !apiConnected.value)
  
  // 网络状态文本
  const networkStatus = computed(() => {
    if (!isOnline.value) return '离线模式'
    if (!apiConnected.value) return 'API连接异常'
    return '在线'
  })
  
  // 监听网络状态变化
  const initNetworkListener = () => {
    window.addEventListener('online', () => {
      isOnline.value = true
    })
    
    window.addEventListener('offline', () => {
      isOnline.value = false
    })
  }
  
  // 设置API连接状态
  const setApiConnected = (connected: boolean) => {
    apiConnected.value = connected
    lastApiCheck.value = new Date()
  }
  
  // 重置API状态
  const resetApiStatus = () => {
    apiConnected.value = true
    lastApiCheck.value = null
  }
  
  return {
    isOnline,
    apiConnected,
    lastApiCheck,
    showOfflineNotice,
    networkStatus,
    initNetworkListener,
    setApiConnected,
    resetApiStatus
  }
})