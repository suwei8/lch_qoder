import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useApiStore = defineStore('api', () => {
  const isBackendConnected = ref(false);
  const useMockData = ref(true); // 默认使用模拟数据
  
  const setBackendStatus = (connected: boolean) => {
    isBackendConnected.value = connected;
    useMockData.value = !connected;
  };
  
  return {
    isBackendConnected,
    useMockData,
    setBackendStatus
  };
});