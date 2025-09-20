import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import type { User, LoginResponse, Location } from '@/types'
import { showSuccessToast } from 'vant'

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<User | null>(null)
  const accessToken = ref<string>('')
  const refreshToken = ref<string>('')
  const location = ref<Location | null>(null)
  const isWechatReady = ref(false)

  // 计算属性
  const isLoggedIn = computed(() => !!accessToken.value && !!user.value)
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const totalBalance = computed(() => (user.value?.balance || 0) + (user.value?.giftBalance || 0))
  const unreadOrderCount = computed(() => 0) // 临时返回0，后续可以从API获取
  const hasUnreadMessage = computed(() => false) // 临时返回false
  const availableCouponCount = computed(() => 0) // 临时返回0

  // 从本地存储恢复状态
  const restoreFromStorage = () => {
    const storedToken = localStorage.getItem('accessToken')
    const storedRefreshToken = localStorage.getItem('refreshToken')
    const storedUser = localStorage.getItem('user')

    if (storedToken) {
      accessToken.value = storedToken
    }
    if (storedRefreshToken) {
      refreshToken.value = storedRefreshToken
    }
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser)
      } catch (error) {
        console.error('解析用户信息失败:', error)
        clearStorage()
      }
    }
  }

  // 保存到本地存储
  const saveToStorage = () => {
    if (accessToken.value) {
      localStorage.setItem('accessToken', accessToken.value)
    }
    if (refreshToken.value) {
      localStorage.setItem('refreshToken', refreshToken.value)
    }
    if (user.value) {
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  // 清除本地存储
  const clearStorage = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  // 设置登录信息
  const setLoginInfo = (loginResponse: LoginResponse) => {
    accessToken.value = loginResponse.accessToken
    refreshToken.value = loginResponse.refreshToken || ''
    user.value = loginResponse.user
    saveToStorage()
  }

  // 设置位置信息
  const setLocation = (loc: Location) => {
    location.value = loc
  }

  // 更新位置信息
  const updateLocation = (loc: Location) => {
    setLocation(loc)
  }

  // 微信登录
  const wechatLogin = async (code: string): Promise<LoginResponse> => {
    try {
      const response = await authApi.wechatLogin({ code })
      setLoginInfo(response)
      return response
    } catch (error) {
      console.error('微信登录失败:', error)
      throw error
    }
  }

  // 手机号登录
  const phoneLogin = async (phone: string, code: string): Promise<LoginResponse> => {
    try {
      const response = await authApi.phoneLogin({ phone, code })
      setLoginInfo(response)
      return response
    } catch (error) {
      console.error('手机号登录失败:', error)
      throw error
    }
  }

  // 手机号密码登录
  const phonePasswordLogin = async (phone: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await authApi.phonePasswordLogin({ phone, password })
      setLoginInfo(response)
      return response
    } catch (error) {
      console.error('密码登录失败:', error)
      throw error
    }
  }

  // 绑定手机号
  const bindPhone = async (phone: string, code: string): Promise<void> => {
    try {
      await authApi.bindPhone({ phone, code })
      // 绑定成功后更新用户信息
      await getUserInfo()
    } catch (error) {
      console.error('绑定手机号失败:', error)
      throw error
    }
  }

  // 获取用户信息
  const getUserInfo = async (): Promise<User> => {
    try {
      const userInfo = await authApi.getUserInfo()
      user.value = userInfo
      saveToStorage()
      return userInfo
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw error
    }
  }

  // 刷新token
  const refreshAccessToken = async (): Promise<string> => {
    try {
      if (!refreshToken.value) {
        throw new Error('没有刷新token')
      }
      const response = await authApi.refreshToken(refreshToken.value)
      accessToken.value = response.accessToken
      saveToStorage()
      return response.accessToken
    } catch (error) {
      console.error('刷新token失败:', error)
      // 刷新失败，清除登录状态
      logout()
      throw error
    }
  }

  // 退出登录
  const logout = async (): Promise<void> => {
    try {
      if (accessToken.value) {
        await authApi.logout()
      }
    } catch (error) {
      console.error('退出登录失败:', error)
    } finally {
      // 无论是否成功，都清除本地状态
      user.value = null
      accessToken.value = ''
      refreshToken.value = ''
      clearStorage()
      showSuccessToast('已退出登录')
    }
  }

  // 检查登录状态
  const checkAuthStatus = async (): Promise<boolean> => {
    if (!accessToken.value) {
      return false
    }

    try {
      const userInfo = await authApi.getUserInfo()
      user.value = userInfo
      saveToStorage()
      return true
    } catch (error) {
      console.error('检查登录状态失败:', error)
      // 如果token无效，尝试刷新
      if (refreshToken.value) {
        try {
          await refreshAccessToken()
          return await checkAuthStatus()
        } catch (refreshError) {
          logout()
          return false
        }
      } else {
        logout()
        return false
      }
    }
  }

  // 发送短信验证码
  const sendSmsCode = async (phone: string, type: 'login' | 'bind' = 'login'): Promise<void> => {
    try {
      await authApi.sendSmsCode(phone)
    } catch (error) {
      console.error('发送验证码失败:', error)
      throw error
    }
  }

  // 更新用户余额
  const updateBalance = (balance: number, giftBalance: number) => {
    if (user.value) {
      user.value.balance = balance
      user.value.giftBalance = giftBalance
      saveToStorage()
    }
  }

  // 刷新用户信息
  const refreshUserInfo = async () => {
    return await checkAuthStatus()
  }

  // 获取用户信息
  const fetchUserInfo = async () => {
    return await checkAuthStatus()
  }

  // 初始化时恢复状态
  restoreFromStorage()

  return {
    // 状态
    user,
    accessToken,
    refreshToken,
    location,
    isWechatReady,
    
    // 计算属性
    isLoggedIn,
    isAuthenticated,
    totalBalance,
    unreadOrderCount,
    hasUnreadMessage,
    availableCouponCount,
    
    // 方法
    wechatLogin,
    phoneLogin,
    phonePasswordLogin,
    bindPhone,
    getUserInfo,
    refreshAccessToken,
    logout,
    checkAuthStatus,
    sendSmsCode,
    restoreFromStorage,
    setLoginInfo,
    setLocation,
    updateLocation,
    updateBalance,
    refreshUserInfo,
    fetchUserInfo
  }
})