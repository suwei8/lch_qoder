<template>
  <div class="debug-container">
    <el-card title="API连接测试">
      <div class="debug-section">
        <h3>认证状态</h3>
        <div class="debug-item">
          <span>Token: {{ authStatus.token ? '✅ 已设置' : '❌ 未设置' }}</span>
        </div>
        <div class="debug-item">
          <span>用户信息: {{ authStatus.userInfo ? '✅ 已加载' : '❌ 未加载' }}</span>
        </div>
        <div class="debug-item">
          <span>角色: {{ authStatus.userInfo?.role || '未知' }}</span>
        </div>
        <el-button @click="setMockAuth">设置模拟认证</el-button>
      </div>

      <div class="debug-section">
        <h3>API测试</h3>
        <div class="debug-item">
          <el-button @click="testUserAPI" :loading="testing.user">测试用户API</el-button>
          <span>{{ apiStatus.user }}</span>
        </div>
        <div class="debug-item">
          <el-button @click="testMerchantAPI" :loading="testing.merchant">测试商户API</el-button>
          <span>{{ apiStatus.merchant }}</span>
        </div>
        <div class="debug-item">
          <el-button @click="testOrderAPI" :loading="testing.order">测试订单API</el-button>
          <span>{{ apiStatus.order }}</span>
        </div>
        <div class="debug-item">
          <el-button @click="testDeviceAPI" :loading="testing.device">测试设备API</el-button>
          <span>{{ apiStatus.device }}</span>
        </div>
      </div>

      <div class="debug-section">
        <h3>后端连接</h3>
        <div class="debug-item">
          <el-button @click="testBackendConnection" :loading="testing.backend">测试后端连接</el-button>
          <span>{{ apiStatus.backend }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';
import { userApi } from '@/api/user';
import { merchantApi } from '@/api/merchant';
import { orderApi } from '@/api/order';
import { deviceApi } from '@/api/device';
import axios from 'axios';

const authStore = useAuthStore();

const authStatus = reactive({
  token: '',
  userInfo: null as any
});

const testing = reactive({
  user: false,
  merchant: false,
  order: false,
  device: false,
  backend: false
});

const apiStatus = reactive({
  user: '未测试',
  merchant: '未测试',
  order: '未测试',
  device: '未测试',
  backend: '未测试'
});

// 设置模拟认证
const setMockAuth = () => {
  const mockAuthData = {
    token: 'mock-access-token-' + Date.now(),
    refreshToken: 'mock-refresh-token-' + Date.now(),
    userInfo: {
      id: 1,
      openid: 'platform_admin_openid',
      nickname: '平台管理员',
      avatar: '',
      role: 'platform_admin',
      balance: 0,
      giftBalance: 0,
    }
  };

  authStore.setToken(mockAuthData.token, mockAuthData.refreshToken);
  authStore.setUserInfo(mockAuthData.userInfo);
  
  updateAuthStatus();
  ElMessage.success('模拟认证已设置');
};

// 更新认证状态显示
const updateAuthStatus = () => {
  authStatus.token = authStore.token;
  authStatus.userInfo = authStore.userInfo;
};

// 测试后端连接
const testBackendConnection = async () => {
  testing.backend = true;
  try {
    const response = await axios.get('http://localhost:5603/api');
    apiStatus.backend = '✅ 连接成功';
  } catch (error: any) {
    console.error('后端连接测试失败:', error);
    apiStatus.backend = `❌ 连接失败: ${error.message}`;
  } finally {
    testing.backend = false;
  }
};

// 测试用户API
const testUserAPI = async () => {
  testing.user = true;
  try {
    const response = await userApi.getUserStats();
    apiStatus.user = '✅ API调用成功';
    console.log('用户API响应:', response);
  } catch (error: any) {
    console.error('用户API测试失败:', error);
    apiStatus.user = `❌ API调用失败: ${error.message}`;
  } finally {
    testing.user = false;
  }
};

// 测试商户API
const testMerchantAPI = async () => {
  testing.merchant = true;
  try {
    const response = await merchantApi.getMerchantStats();
    apiStatus.merchant = '✅ API调用成功';
    console.log('商户API响应:', response);
  } catch (error: any) {
    console.error('商户API测试失败:', error);
    apiStatus.merchant = `❌ API调用失败: ${error.message}`;
  } finally {
    testing.merchant = false;
  }
};

// 测试订单API
const testOrderAPI = async () => {
  testing.order = true;
  try {
    const response = await orderApi.getOrderStats();
    apiStatus.order = '✅ API调用成功';
    console.log('订单API响应:', response);
  } catch (error: any) {
    console.error('订单API测试失败:', error);
    apiStatus.order = `❌ API调用失败: ${error.message}`;
  } finally {
    testing.order = false;
  }
};

// 测试设备API
const testDeviceAPI = async () => {
  testing.device = true;
  try {
    const response = await deviceApi.getDeviceStats();
    apiStatus.device = '✅ API调用成功';
    console.log('设备API响应:', response);
  } catch (error: any) {
    console.error('设备API测试失败:', error);
    apiStatus.device = `❌ API调用失败: ${error.message}`;
  } finally {
    testing.device = false;
  }
};

onMounted(() => {
  updateAuthStatus();
  testBackendConnection();
});
</script>

<style scoped>
.debug-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.debug-section {
  margin-bottom: 20px;
  padding: 16px;
  border: 1px solid #e1e1e1;
  border-radius: 4px;
}

.debug-item {
  margin: 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

h3 {
  margin: 0 0 12px 0;
  color: #333;
}
</style>