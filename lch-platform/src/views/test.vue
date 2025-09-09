<template>
  <div class="test-page">
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>平台管理端服务状态检测</span>
          <el-button type="primary" @click="checkAllServices">刷新检测</el-button>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <h3>前端服务状态</h3>
          <div class="status-item">
            <el-tag :type="frontendStatus ? 'success' : 'danger'">
              {{ frontendStatus ? '✅ 前端正常' : '❌ 前端异常' }}
            </el-tag>
            <span style="margin-left: 10px;">当前页面可正常显示</span>
          </div>
        </el-col>
        
        <el-col :span="12">
          <h3>后端API状态</h3>
          <div class="status-item">
            <el-tag :type="apiStatus.type">
              {{ apiStatus.message }}
            </el-tag>
            <span style="margin-left: 10px;">{{ apiStatus.detail }}</span>
          </div>
        </el-col>
      </el-row>
      
      <el-divider />
      
      <h3>详细检测结果</h3>
      <el-table :data="testResults" style="width: 100%">
        <el-table-column prop="name" label="检测项" width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === '正常' ? 'success' : 'danger'">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="详细信息" />
      </el-table>
      
      <el-divider />
      
      <div style="text-align: center;">
        <el-alert 
          title="如果您看到这个页面，说明平台管理端前端服务正常运行！" 
          type="success" 
          show-icon 
        />
        <div style="margin-top: 20px;">
          <el-button type="primary" @click="goToLogin">前往登录页面</el-button>
          <el-button @click="goToDashboard">前往仪表盘</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const frontendStatus = ref(true)
const apiStatus = ref({
  type: 'info' as 'success' | 'warning' | 'danger' | 'info',
  message: '检测中...',
  detail: '正在检测后端API连接状态'
})

const testResults = ref([
  { name: '前端服务', status: '正常', message: '页面可正常加载和显示' },
  { name: '路由系统', status: '正常', message: 'Vue Router 正常工作' },
  { name: 'Element Plus', status: '正常', message: 'UI组件库正常加载' },
  { name: '后端API连接', status: '检测中', message: '正在检测...' }
])

const checkAllServices = async () => {
  // 检测后端API
  try {
    const response = await axios.get('/api/auth/check', { timeout: 5000 })
    
    apiStatus.value = {
      type: 'success',
      message: '✅ API正常',
      detail: '后端服务连接正常'
    }
    
    testResults.value[3] = {
      name: '后端API连接',
      status: '正常',
      message: `API响应正常，状态码: ${response.status}`
    }
  } catch (error: any) {
    console.error('API检测失败:', error)
    
    apiStatus.value = {
      type: 'danger',
      message: '❌ API异常',
      detail: '后端服务连接失败'
    }
    
    testResults.value[3] = {
      name: '后端API连接',
      status: '异常',
      message: `连接失败: ${error.message || '未知错误'}`
    }
  }
}

const goToLogin = () => {
  router.push('/login')
}

const goToDashboard = () => {
  router.push('/dashboard')
}

onMounted(() => {
  checkAllServices()
})
</script>

<style scoped>
.test-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.status-item {
  margin: 10px 0;
  display: flex;
  align-items: center;
}

h3 {
  color: #409eff;
  margin-bottom: 15px;
}
</style>