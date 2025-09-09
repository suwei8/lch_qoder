import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { merchantApi } from '@/api/merchant';
import type { 
  Merchant, 
  MerchantStats, 
  MerchantDevice, 
  MerchantOrder,
  WithdrawalRecord 
} from '@/types/merchant';

export const useMerchantStore = defineStore('merchant', () => {
  // State
  const profile = ref<Merchant | null>(null);
  const stats = ref<MerchantStats | null>(null);
  const devices = ref<MerchantDevice[]>([]);
  const orders = ref<MerchantOrder[]>([]);
  const withdrawals = ref<WithdrawalRecord[]>([]);
  const isLoading = ref(false);

  // Getters
  const merchantName = computed(() => profile.value?.name || '');
  const merchantId = computed(() => profile.value?.id || 0);
  const balance = computed(() => profile.value?.balance || 0);
  const onlineDevices = computed(() => devices.value.filter(d => d.status === 'online').length);
  const totalDevices = computed(() => devices.value.length);
  const todayOrders = computed(() => stats.value?.todayOrders || 0);
  const todayEarnings = computed(() => stats.value?.todayEarnings || 0);

  // Actions
  const fetchProfile = async () => {
    try {
      isLoading.value = true;
      profile.value = await merchantApi.getProfile();
    } catch (error: any) {
      ElMessage.error(error.message || '获取商户信息失败');
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const updateProfile = async (data: Partial<Merchant>) => {
    try {
      isLoading.value = true;
      profile.value = await merchantApi.updateProfile(data);
      ElMessage.success('更新成功');
    } catch (error: any) {
      ElMessage.error(error.message || '更新失败');
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchStats = async () => {
    try {
      stats.value = await merchantApi.getStats();
    } catch (error: any) {
      console.error('获取统计信息失败:', error);
    }
  };

  const fetchDevices = async (params?: any) => {
    try {
      const response = await merchantApi.getDevices(params);
      devices.value = response.items;
      return response;
    } catch (error: any) {
      ElMessage.error(error.message || '获取设备列表失败');
      throw error;
    }
  };

  const fetchOrders = async (params?: any) => {
    try {
      const response = await merchantApi.getOrders(params);
      orders.value = response.items;
      return response;
    } catch (error: any) {
      ElMessage.error(error.message || '获取订单列表失败');
      throw error;
    }
  };

  const fetchWithdrawals = async (params?: any) => {
    try {
      const response = await merchantApi.getWithdrawals(params);
      withdrawals.value = response.items;
      return response;
    } catch (error: any) {
      ElMessage.error(error.message || '获取提现记录失败');
      throw error;
    }
  };

  const requestWithdrawal = async (amount: number, bankAccount: string, remark?: string) => {
    try {
      isLoading.value = true;
      const withdrawal = await merchantApi.requestWithdrawal({
        amount,
        bankAccount,
        remark
      });
      
      // 更新余额和提现记录
      if (profile.value) {
        profile.value.balance -= amount;
      }
      withdrawals.value.unshift(withdrawal);
      
      ElMessage.success('提现申请已提交');
      return withdrawal;
    } catch (error: any) {
      ElMessage.error(error.message || '提现申请失败');
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const refreshData = async () => {
    try {
      await Promise.all([
        fetchProfile(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('刷新数据失败:', error);
    }
  };

  const clearData = () => {
    profile.value = null;
    stats.value = null;
    devices.value = [];
    orders.value = [];
    withdrawals.value = [];
  };

  return {
    // State
    profile,
    stats,
    devices,
    orders,
    withdrawals,
    isLoading,
    
    // Getters
    merchantName,
    merchantId,
    balance,
    onlineDevices,
    totalDevices,
    todayOrders,
    todayEarnings,
    
    // Actions
    fetchProfile,
    updateProfile,
    fetchStats,
    fetchDevices,
    fetchOrders,
    fetchWithdrawals,
    requestWithdrawal,
    refreshData,
    clearData,
  };
});