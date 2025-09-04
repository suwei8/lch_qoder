<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-image">
        <img src="/images/404.svg" alt="404" />
      </div>
      <div class="error-info">
        <h1 class="error-title">404</h1>
        <p class="error-message">抱歉，您访问的页面不存在</p>
        <div class="error-actions">
          <el-button type="primary" @click="goHome">
            返回首页
          </el-button>
          <el-button @click="goBack">
            返回上页
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const goHome = () => {
  router.push('/dashboard');
};

const goBack = () => {
  router.go(-1);
};
</script>

<style lang="scss" scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.error-content {
  text-align: center;
  max-width: 500px;
  padding: 40px;
  
  .error-image {
    margin-bottom: 30px;
    
    img {
      max-width: 300px;
      height: auto;
    }
  }
  
  .error-info {
    .error-title {
      font-size: 72px;
      font-weight: 700;
      color: #1890ff;
      margin-bottom: 20px;
    }
    
    .error-message {
      font-size: 18px;
      color: #666;
      margin-bottom: 30px;
    }
    
    .error-actions {
      .el-button {
        margin: 0 8px;
      }
    }
  }
}
</style>