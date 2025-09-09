<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

onMounted(async () => {
  try {
    // 初始化微信配置，添加错误处理
    await userStore.initWechatConfig()
  } catch (error) {
    console.warn('微信配置初始化失败，但不影响应用运行:', error)
  }
})
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
  background-color: #f7f8fa;
}
</style>