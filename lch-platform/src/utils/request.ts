import axios, { AxiosResponse, AxiosError } from 'axios';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

// 创建axios实例
const request = axios.create({
  baseURL: 'http://localhost:5603/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    
    // 添加认证令牌
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    // 直接返回响应数据，后端已经通过TransformInterceptor统一格式
    if (response.data && typeof response.data === 'object') {
      const { code, message, data } = response.data;
      
      // 接口调用成功
      if (code === 0) {
        return data;
      }
      
      // 业务错误
      ElMessage.error(message || '请求失败');
      return Promise.reject(new Error(message || '请求失败'));
    }
    
    // 直接返回数据（兼容处理）
    return response.data;
  },
  async (error: AxiosError) => {
    const authStore = useAuthStore();
    
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // 未授权，对于模拟登录不清除认证状态
          if (authStore.token?.startsWith('mock-access-token')) {
            console.warn('模拟登录状态下API调用被拒绝，但保持登录状态');
            // 移除烦人的提示信息
            // ElMessage.warning('API服务暂不可用，使用模拟数据');
            return Promise.reject(error);
          }
          
          // 对于真实token，尝试刷新令牌
          if (authStore.refreshToken && !error.config?.url?.includes('/auth/refresh')) {
            try {
              await authStore.refreshAccessToken();
              // 重新发送原请求
              return request(error.config!);
            } catch (refreshError) {
              // 刷新失败，跳转登录页
              authStore.clearAuth();
              window.location.href = '/login';
              return Promise.reject(refreshError);
            }
          } else {
            authStore.clearAuth();
            window.location.href = '/login';
          }
          break;
          
        case 403:
          ElMessage.error('权限不足');
          break;
          
        case 404:
          ElMessage.error('请求的资源不存在');
          break;
          
        case 500:
          ElMessage.error('服务器内部错误');
          break;
          
        default:
          const errorMessage = (data as any)?.message || '请求失败';
          ElMessage.error(errorMessage);
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络连接');
    } else {
      ElMessage.error('网络错误，请检查网络连接');
    }
    
    return Promise.reject(error);
  }
);

export default request;