<template>
  <div class="page-container">
    <div class="page-header">
      <h1>财务中心</h1>
      <p>管理您的收益和提现</p>
    </div>
    
    <div class="coming-soon">
      <div class="icon">💰</div>
      <h2>功能开发中</h2>
      <p>财务中心功能正在开发中，敬请期待</p>
      <el-button type="primary" @click="$router.push('/dashboard')">返回仪表盘</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 财务中心页面 - 开发中
</script>

<style scoped>
.page-container {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.page-header {
  margin-bottom: 40px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #909399;
}

.coming-soon {
  background: white;
  border-radius: 12px;
  padding: 80px 40px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.coming-soon .icon {
  font-size: 64px;
  margin-bottom: 24px;
}

.coming-soon h2 {
  color: #303133;
  margin-bottom: 16px;
}

.coming-soon p {
  color: #909399;
  margin-bottom: 32px;
}
</style>