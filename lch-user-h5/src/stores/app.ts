import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Location } from '@/types'

export const useAppStore = defineStore('app', () => {
  // 应用状态
  const loading = ref(false)
  const location = ref<Location | null>(null)
  const locationName = ref('')
  const isWechat = ref(false)
  const networkStatus = ref<'online' | 'offline'>('online')

  // 设置加载状态
  const setLoading = (status: boolean) => {
    loading.value = status
  }

  // 设置位置信息
  const setLocation = (loc: Location, name?: string) => {
    location.value = loc
    if (name) {
      locationName.value = name
    }
    // 保存到本地存储
    localStorage.setItem('userLocation', JSON.stringify(loc))
    if (name) {
      localStorage.setItem('locationName', name)
    }
  }

  // 从本地存储恢复位置信息
  const restoreLocation = () => {
    const storedLocation = localStorage.getItem('userLocation')
    const storedLocationName = localStorage.getItem('locationName')
    
    if (storedLocation) {
      try {
        location.value = JSON.parse(storedLocation)
      } catch (error) {
        console.error('解析位置信息失败:', error)
      }
    }
    
    if (storedLocationName) {
      locationName.value = storedLocationName
    }
  }

  // 获取当前位置
  const getCurrentLocation = (): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('浏览器不支持定位功能'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
          setLocation(loc)
          resolve(loc)
        },
        (error) => {
          console.error('获取位置失败:', error)
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5分钟缓存
        }
      )
    })
  }

  // 检查是否在微信环境
  const checkWechatEnvironment = () => {
    const ua = navigator.userAgent.toLowerCase()
    isWechat.value = ua.includes('micromessenger')
    return isWechat.value
  }

  // 监听网络状态
  const initNetworkListener = () => {
    const updateNetworkStatus = () => {
      networkStatus.value = navigator.onLine ? 'online' : 'offline'
    }

    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)
    
    // 初始化网络状态
    updateNetworkStatus()
  }

  // 计算两点间距离（单位：米）
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3 // 地球半径（米）
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  // 格式化距离显示
  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`
    } else {
      return `${(distance / 1000).toFixed(1)}km`
    }
  }

  // 初始化应用
  const initApp = () => {
    restoreLocation()
    checkWechatEnvironment()
    initNetworkListener()
  }

  // 清除应用数据
  const clearAppData = () => {
    localStorage.removeItem('userLocation')
    localStorage.removeItem('locationName')
    location.value = null
    locationName.value = ''
  }

  return {
    // 状态
    loading,
    location,
    locationName,
    isWechat,
    networkStatus,

    // 方法
    setLoading,
    setLocation,
    restoreLocation,
    getCurrentLocation,
    checkWechatEnvironment,
    initNetworkListener,
    calculateDistance,
    formatDistance,
    initApp,
    clearAppData,
    
    // 添加缺失的属性和方法
    loadingText: ref('加载中...'),
    setNetworkStatus: (status: 'online' | 'offline') => {
      networkStatus.value = status
    },
    setPageConfig: (config: { title?: string; showTabbar?: boolean }) => {
      if (config.title) {
        document.title = config.title
      }
    }
  }
})