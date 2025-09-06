<template>
  <div class="not-found-container">
    <van-empty 
      image="search" 
      description="页面不存在"
    >
      <van-button type="primary" @click="$router.push('/')">
        返回首页
      </van-button>
    </van-empty>
  </div>
</template>

<script setup lang="ts">
// 404页面
</script>

<style scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f8fa;
}
</style>