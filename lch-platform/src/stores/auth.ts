import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { authApi } from '@/api/auth';
import type { LoginResult, UserInfo } from '@/types/auth';

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string>('');
  const refreshToken = ref<string>('');
  const userInfo = ref<UserInfo | null>(null);
  const isLoading = ref(false);

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!userInfo.value);
  const currentUser = computed(() => userInfo.value);
  const userRole = computed(() => userInfo.value?.role || '');

  // Actions
  const setToken = (newToken: string, newRefreshToken?: string) => {
    token.value = newToken;
    if (newRefreshToken) {
      refreshToken.value = newRefreshToken;
    }
    localStorage.setItem('lch_token', newToken);
    if (newRefreshToken) {
      localStorage.setItem('lch_refresh_token', newRefreshToken);
    }
  };

  const setUserInfo = (info: UserInfo) => {
    userInfo.value = info;
    localStorage.setItem('lch_user_info', JSON.stringify(info));
  };

  const clearAuth = () => {
    token.value = '';
    refreshToken.value = '';
    userInfo.value = null;
    localStorage.removeItem('lch_token');
    localStorage.removeItem('lch_refresh_token');
    localStorage.removeItem('lch_user_info');
  };

  const login = async (loginData: { code: string; userInfo?: any }): Promise<LoginResult> => {
    try {
      isLoading.value = true;
      const response: LoginResult = await authApi.wechatLogin(loginData);
      
      setToken(response.accessToken, response.refreshToken);
      setUserInfo(response.user);
      
      ElMessage.success('登录成功');
      return response;
    } catch (error: any) {
      ElMessage.error(error.message || '登录失败');
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    try {
      if (token.value) {
        await authApi.logout();
      }
    } catch (error) {
      console.error('登出失败:', error);
    } finally {
      clearAuth();
      ElMessage.success('已退出登录');
    }
  };

  const refreshAccessToken = async () => {
    try {
      if (!refreshToken.value) {
        throw new Error('无刷新令牌');
      }
      
      const response = await authApi.refreshToken(refreshToken.value);
      setToken(response.accessToken, response.refreshToken);
      
      return response.accessToken;
    } catch (error) {
      console.error('刷新令牌失败:', error);
      clearAuth();
      throw error;
    }
  };

  const checkAuthStatus = async () => {
    try {
      // 从本地存储恢复登录状态
      const savedToken = localStorage.getItem('lch_token');
      const savedRefreshToken = localStorage.getItem('lch_refresh_token');
      const savedUserInfo = localStorage.getItem('lch_user_info');

      if (!savedToken || !savedUserInfo) {
        return false;
      }

      token.value = savedToken;
      refreshToken.value = savedRefreshToken || '';
      userInfo.value = JSON.parse(savedUserInfo);

      // 对于模拟登录，直接返回true，不验证后端API
      if (savedToken.startsWith('mock-access-token') || savedToken.startsWith('mock-merchant-token')) {
        return true;
      }

      // 验证真实令牌有效性
      try {
        const response = await authApi.checkAuth();
        if (response.valid) {
          setUserInfo(response.user);
          return true;
        } else {
          clearAuth();
          return false;
        }
      } catch (error) {
        console.warn('API验证失败，但保留本地认证状态:', error);
        // API验证失败时，不清除认证状态，继续使用本地数据
        return true;
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
      clearAuth();
      return false;
    }
  };

  const updateUserInfo = async () => {
    try {
      const response = await authApi.getProfile();
      setUserInfo(response);
    } catch (error) {
      console.error('更新用户信息失败:', error);
    }
  };

  const hasRole = (roles: UserInfo['role'] | UserInfo['role'][]) => {
    if (!userInfo.value) return false;
    
    const userRoles = Array.isArray(userInfo.value.role) 
      ? userInfo.value.role 
      : [userInfo.value.role];
    
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    return requiredRoles.some(role => userRoles.includes(role as UserInfo['role']));
  };

  const hasPermission = (_permission: string) => {
    if (!userInfo.value) return false;
    
    // 平台管理员拥有所有权限
    if (userInfo.value.role === 'platform_admin') {
      return true;
    }
    
    // TODO: 实现更细粒度的权限检查
    // 将来可以根据 _permission 参数检查用户具体权限
    // 例如: return userInfo.value.permissions?.includes(_permission) || false;
    return true;
  };

  return {
    // State
    token,
    refreshToken,
    userInfo,
    isLoading,
    
    // Getters
    isAuthenticated,
    currentUser,
    userRole,
    
    // Actions
    setToken,
    setUserInfo,
    clearAuth,
    login,
    logout,
    refreshAccessToken,
    checkAuthStatus,
    updateUserInfo,
    hasRole,
    hasPermission,
  };
});