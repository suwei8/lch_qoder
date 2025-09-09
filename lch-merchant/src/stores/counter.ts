import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { authApi } from '@/api/auth';
import type { LoginResponse, UserInfo } from '@/types/auth';

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
    localStorage.setItem('lch_merchant_token', newToken);
    if (newRefreshToken) {
      localStorage.setItem('lch_merchant_refresh_token', newRefreshToken);
    }
  };

  const setUserInfo = (info: UserInfo) => {
    userInfo.value = info;
    localStorage.setItem('lch_merchant_user_info', JSON.stringify(info));
  };

  const clearAuth = () => {
    token.value = '';
    refreshToken.value = '';
    userInfo.value = null;
    localStorage.removeItem('lch_merchant_token');
    localStorage.removeItem('lch_merchant_refresh_token');
    localStorage.removeItem('lch_merchant_user_info');
  };

  const login = async (loginData: { code: string; userInfo?: any }): Promise<LoginResponse> => {
    try {
      isLoading.value = true;
      const response: LoginResponse = await authApi.login(loginData);
      
      // 检查用户角色，只允许商户角色登录
      if (!['merchant_staff', 'merchant_admin'].includes(response.user.role)) {
        throw new Error('您没有权限访问商户管理系统');
      }
      
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
      
      const response = await authApi.refreshToken({ refreshToken: refreshToken.value });
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
      const savedToken = localStorage.getItem('lch_merchant_token');
      const savedRefreshToken = localStorage.getItem('lch_merchant_refresh_token');
      const savedUserInfo = localStorage.getItem('lch_merchant_user_info');

      if (!savedToken || !savedUserInfo) {
        return false;
      }

      const parsedUserInfo = JSON.parse(savedUserInfo);
      
      // 检查用户角色权限
      if (!['merchant_staff', 'merchant_admin'].includes(parsedUserInfo.role)) {
        clearAuth();
        return false;
      }

      token.value = savedToken;
      refreshToken.value = savedRefreshToken || '';
      userInfo.value = parsedUserInfo;

      // 验证令牌有效性
      try {
        const response = await authApi.checkAuth();
        if (response.valid && response.user) {
          setUserInfo(response.user);
          return true;
        } else {
          clearAuth();
          return false;
        }
      } catch (error) {
        console.warn('API验证失败，但保留本地认证状态:', error);
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
      const response = await authApi.getUserInfo();
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

  const hasPermission = (permission: string) => {
    if (!userInfo.value) return false;
    
    // 商户管理员拥有商户相关的所有权限
    if (userInfo.value.role === 'merchant_admin') {
      return true;
    }
    
    // 商户员工只有基本权限
    if (userInfo.value.role === 'merchant_staff') {
      const basicPermissions = [
        'view_dashboard',
        'view_devices',
        'view_orders',
        'control_devices'
      ];
      return basicPermissions.includes(permission);
    }
    
    return false;
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
