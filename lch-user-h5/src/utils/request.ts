import axios from 'axios'
import type { ApiResponse } from '@/types'
import { showFailToast } from 'vant'

// 创建axios实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 添加token
    const token = localStorage.getItem('user_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse
    
    // 成功响应
    if (data.code === 0) {
      return data.data
    }
    
    // 业务错误
    showFailToast(data.message || '请求失败')
    return Promise.reject(new Error(data.message || '请求失败'))
  },
  (error) => {
    console.error('请求错误:', error)
    
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          showFailToast('登录已过期，请重新登录')
          // 清除token并跳转到登录页
          localStorage.removeItem('user_token')
          window.location.href = '/auth'
          break
        case 403:
          showFailToast('没有权限访问')
          break
        case 404:
          showFailToast('请求的资源不存在')
          break
        case 500:
          showFailToast('服务器错误，请稍后重试')
          break
        default:
          showFailToast(data?.message || '网络错误，请稍后重试')
      }
    } else if (error.code === 'NETWORK_ERROR') {
      showFailToast('网络连接失败，请检查网络')
    } else if (error.code === 'ECONNABORTED') {
      showFailToast('请求超时，请重试')
    } else {
      showFailToast('网络错误，请稍后重试')
    }
    
    return Promise.reject(error)
  }
)

export default request