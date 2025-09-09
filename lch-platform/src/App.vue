<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

onMounted(async () => {
  try {
    // 初始化应用，检查登录状态
    await authStore.checkAuthStatus();
  } catch (error) {
    console.warn('检查认证状态失败，但不影响应用启动:', error);
  }
});
</script>

<style lang="scss">
#app {
  height: 100vh;
  width: 100vw;
}
</style>