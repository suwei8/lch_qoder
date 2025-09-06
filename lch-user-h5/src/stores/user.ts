import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Location } from '@/types'
import { authApi } from '@/api/auth'
import { Toast } from 'vant'

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string>('')
  const location = ref<Location | null>(null)
  const isWechatReady = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const totalBalance = computed(() => (user.value?.balance || 0) + (user.value?.giftBalance || 0))

  // 设置用户信息
  const setUser = (userInfo: User) => {
    user.value = userInfo
  }

  // 设置token
  const setToken = (newToken: string) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('user_token', newToken)
    } else {
      localStorage.removeItem('user_token')
    }
  }

  // 设置位置信息
  const setLocation = (loc: Location) => {
    location.value = loc
  }

  // 初始化微信配置
  const initWechatConfig = async () => {
    try {
      // 检查是否在微信浏览器中
      if (typeof window !== 'undefined' && window.navigator.userAgent.includes('MicroMessenger')) {
        // 初始化微信JS-SDK
        const wx = (window as any).wx
        if (wx) {
          // 获取微信配置
          const config = await authApi.getWechatConfig(window.location.href)
          wx.config({
            debug: false,
            appId: config.appId,
            timestamp: config.timestamp,
            nonceStr: config.nonceStr,
            signature: config.signature,
            jsApiList: ['getLocation', 'chooseWXPay', 'updateAppMessageShareData', 'updateTimelineShareData']
          })

          wx.ready(() => {
            isWechatReady.value = true
            console.log('微信JS-SDK初始化成功')
          })

          wx.error((res: any) => {
            console.error('微信JS-SDK初始化失败:', res)
          })
        }
      } else {
        // 非微信环境，模拟初始化
        isWechatReady.value = true
      }
    } catch (error) {
      console.error('初始化微信配置失败:', error)
    }
  }

  // 微信OAuth登录
  const wechatLogin = async (code: string) => {
    try {
      const response = await authApi.wechatLogin({ code })
      setToken(response.accessToken)
      setUser(response.user)
      return response
    } catch (error) {
      console.error('微信登录失败:', error)
      throw error
    }
  }

  // 手机号登录
  const phoneLogin = async (phone: string, code: string) => {
    try {
      const response = await authApi.phoneLogin({ phone, code })
      setToken(response.accessToken)
      setUser(response.user)
      return response
    } catch (error) {
      console.error('手机号登录失败:', error)
      throw error
    }
  }

  // 绑定手机号
  const bindPhone = async (phone: string, code: string) => {
    try {
      const response = await authApi.bindPhone({ phone, code })
      if (user.value) {
        user.value.phone = phone
      }
      return response
    } catch (error) {
      console.error('绑定手机号失败:', error)
      throw error
    }
  }

  // 检查认证状态
  const checkAuthStatus = async () => {
    try {
      const savedToken = localStorage.getItem('user_token')
      if (!savedToken) return false

      setToken(savedToken)
      const userInfo = await authApi.getUserInfo()
      setUser(userInfo)
      return true
    } catch (error) {
      console.error('检查认证状态失败:', error)
      logout()
      return false
    }
  }

  // 获取位置信息
  const getLocation = async (): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (location.value) {
        resolve(location.value)
        return
      }

      if (isWechatReady.value && typeof window !== 'undefined') {
        const wx = (window as any).wx
        wx.getLocation({
          type: 'wgs84',
          success: (res: any) => {
            const loc = {
              latitude: res.latitude,
              longitude: res.longitude
            }
            setLocation(loc)
            resolve(loc)
          },
          fail: () => {
            // 微信获取位置失败，使用浏览器定位
            getBrowserLocation().then(resolve).catch(reject)
          }
        })
      } else {
        getBrowserLocation().then(resolve).catch(reject)
      }
    })
  }

  // 浏览器获取位置
  const getBrowserLocation = (): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('浏览器不支持定位'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
          setLocation(loc)
          resolve(loc)
        },
        (error) => {
          console.error('获取位置失败:', error)
          // 返回默认位置（北京）
          const defaultLoc = { latitude: 39.9042, longitude: 116.4074 }
          setLocation(defaultLoc)
          resolve(defaultLoc)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      )
    })
  }

  // 更新用户余额
  const updateBalance = (balance: number, giftBalance: number) => {
    if (user.value) {
      user.value.balance = balance
      user.value.giftBalance = giftBalance
    }
  }

  // 退出登录
  const logout = () => {
    user.value = null
    token.value = ''
    location.value = null
    localStorage.removeItem('user_token')
    Toast.success('已退出登录')
  }

  return {
    // 状态
    user,
    token,
    location,
    isWechatReady,
    
    // 计算属性
    isAuthenticated,
    totalBalance,
    
    // 方法
    setUser,
    setToken,
    setLocation,
    initWechatConfig,
    wechatLogin,
    phoneLogin,
    bindPhone,
    checkAuthStatus,
    getLocation,
    updateBalance,
    logout
  }
})