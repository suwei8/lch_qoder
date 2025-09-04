<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

onMounted(() => {
  // 初始化应用，检查登录状态
  authStore.checkAuthStatus();
});
</script>

<style lang="scss">
#app {
  height: 100vh;
  width: 100vw;
}
</style>