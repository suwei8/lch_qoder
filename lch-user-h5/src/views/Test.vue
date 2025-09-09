<template>
  <div class="test-page">
    <van-nav-bar title="H5端服务状态检测" />
    
    <div class="content">
      <van-cell-group>
        <van-cell title="前端服务状态" :value="frontendStatus ? '✅ 正常' : '❌ 异常'" />
        <van-cell title="后端API状态" :value="apiStatus.message" />
      </van-cell-group>
      
      <div class="test-section">
        <h3>详细检测结果</h3>
        <van-cell-group>
          <van-cell 
            v-for="result in testResults" 
            :key="result.name"
            :title="result.name"
            :label="result.message"
            :value="result.status"
          />
        </van-cell-group>
      </div>
      
      <div class="success-message">
        <van-notice-bar 
          color="#1989fa"
          background="#ecf9ff"
          left-icon="info-o"
          text="如果您看到这个页面，说明用户H5端前端服务正常运行！"
        />
      </div>
      
      <div class="action-buttons">
        <van-button type="primary" block @click="checkAllServices">
          刷新检测
        </van-button>
        <van-button block @click="goToHome" style="margin-top: 10px;">
          前往首页
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const frontendStatus = ref(true)
const apiStatus = ref({
  message: '检测中...',
  detail: '正在检测后端API连接状态'
})

const testResults = ref([
  { name: '前端服务', status: '✅ 正常', message: '页面可正常加载和显示' },
  { name: '路由系统', status: '✅ 正常', message: 'Vue Router 正常工作' },
  { name: 'Vant组件库', status: '✅ 正常', message: 'UI组件库正常加载' },
  { name: '后端API连接', status: '🔄 检测中', message: '正在检测...' }
])

const checkAllServices = async () => {
  // 检测后端API
  try {
    const response = await axios.get('/api/auth/check', { timeout: 5000 })
    
    apiStatus.value = {
      message: '✅ API正常',
      detail: '后端服务连接正常'
    }
    
    testResults.value[3] = {
      name: '后端API连接',
      status: '✅ 正常',
      message: `API响应正常，状态码: ${response.status}`
    }
  } catch (error: any) {
    console.error('API检测失败:', error)
    
    apiStatus.value = {
      message: '❌ API异常',
      detail: '后端服务连接失败'
    }
    
    testResults.value[3] = {
      name: '后端API连接',
      status: '❌ 异常',
      message: `连接失败: ${error.message || '未知错误'}`
    }
  }
}

const goToHome = () => {
  router.push('/')
}

onMounted(() => {
  checkAllServices()
})
</script>

<style scoped>
.test-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.content {
  padding: 16px;
}

.test-section {
  margin: 20px 0;
}

.test-section h3 {
  color: #323233;
  margin-bottom: 12px;
  font-size: 16px;
}

.success-message {
  margin: 20px 0;
}

.action-buttons {
  margin-top: 30px;
}
</style>