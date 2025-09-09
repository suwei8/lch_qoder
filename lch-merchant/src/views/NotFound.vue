<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="not-found-icon">🏪</div>
      <h1>页面不存在</h1>
      <p>抱歉，您访问的页面不存在或正在开发中</p>
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const goHome = () => {
  router.push('/dashboard');
};
</script>

<style scoped>
.not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.not-found-content {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.not-found-icon {
  font-size: 80px;
  margin-bottom: 24px;
}

h1 {
  font-size: 32px;
  color: #303133;
  margin-bottom: 16px;
}

p {
  color: #909399;
  margin-bottom: 32px;
  font-size: 16px;
}
</style>