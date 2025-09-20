<template>
  <div class="merchant-login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="logo-wrapper">
          <div class="logo-icon">🏪</div>
        </div>
        <h1 class="login-title">亮车惠商户中心</h1>
        <p class="login-subtitle">专业洗车设备运营管理系统</p>
      </div>
      
      <el-form 
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="phone">
          <el-input
            v-model="loginForm.phone"
            size="large"
            placeholder="请输入商户手机号"
            prefix-icon="Phone"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            size="large"
            placeholder="请输入商户密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            class="login-btn"
            :loading="isLoading"
            @click="handleLogin"
          >
            商户登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="quick-login-section">
        <div class="section-title">
          <el-divider>快捷登录</el-divider>
        </div>
        <div class="quick-login-buttons">
          <el-button 
            type="success" 
            size="small" 
            class="demo-btn"
            @click="handleDemoLogin"
          >
            🧪 演示登录
          </el-button>
          <el-button 
            type="warning" 
            size="small" 
            class="quick-btn"
            @click="fillTestAccount"
          >
            ⚡ 快速登录
          </el-button>
        </div>
      </div>
      
      <div class="test-accounts">
        <div class="section-title">
          <el-divider>测试商户账号</el-divider>
        </div>
        <div class="test-account-list">
          <div 
            v-for="(account, index) in testAccounts" 
            :key="account.phone"
            class="test-account-item"
            @click="fillAccount(account)"
          >
            <div class="account-info">
              <div class="account-index">#{{ index + 1 }}</div>
              <div class="account-name">{{ account.name }}</div>
              <div class="account-phone">{{ account.phone }}</div>
            </div>
            <el-tag size="small" type="success">测试</el-tag>
          </div>
        </div>
      </div>
      
      <div class="login-footer">
        <p>© 2024 亮车惠自助洗车系统 · 商户管理中心</p>
        <p class="footer-note">专为洗车商户设计的专业管理工具</p>
        <div class="external-links">
          <a href="http://localhost:5602" target="_blank">平台管理端</a>
          <span>|</span>
          <a href="http://localhost:5604" target="_blank">用户H5端</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { useAuthStore } from '@/stores/auth';
import { authApi } from '@/api';

const router = useRouter();
const authStore = useAuthStore();
const isLoading = ref(false);

const loginFormRef = ref<FormInstance>();

const loginForm = reactive({
  phone: '',
  password: '123456', // 默认密码
});

const loginRules: FormRules = {
  phone: [
    { required: true, message: '请输入商户手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入商户密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
};

// 测试商户账号列表
const testAccounts = [
  { name: '测试洗车店', phone: '13900139001' },
  { name: '青青洗车服务中心', phone: '13900139002' },
  { name: '星光汽车美容服务有限公司', phone: '13900139003' },
  { name: '蓝天汽车服务连锁店', phone: '13900139004' },
  { name: '快洁自助洗车服务站', phone: '13900139005' },
  { name: '洁净汽车美容养护中心', phone: '13900139006' },
];

const fillAccount = (account: any) => {
  loginForm.phone = account.phone;
  loginForm.password = '123456';
};

// 填充第一个测试账号
const fillTestAccount = () => {
  if (testAccounts.length > 0) {
    fillAccount(testAccounts[0]);
  }
};

// 演示登录功能
const handleDemoLogin = () => {
  // 填充第一个测试账号并自动登录
  fillTestAccount();
  handleLogin();
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;
  
  try {
    await loginFormRef.value.validate();
    isLoading.value = true;
    
    // 检查是否是测试商户手机号
    const testAccount = testAccounts.find(acc => acc.phone === loginForm.phone);
    
    // 尝试真实API登录
    try {
      const response = await authApi.login({
        phone: loginForm.phone,
        password: loginForm.password
      });
      
      // 保存登录信息
      authStore.setToken(response.accessToken, response.refreshToken);
      authStore.setUserInfo(response.user);
      
      ElMessage.success(`欢迎登录商户管理中心`);
      router.push('/dashboard');
    } catch (apiError) {
      // API失败时，检查是否是测试账户
      if (testAccount && loginForm.password === '123456') {
        // 使用测试账户数据
        const mockLoginData = {
          accessToken: 'mock-merchant-token-' + Date.now(),
          refreshToken: 'mock-merchant-refresh-token-' + Date.now(),
          user: {
            id: parseInt(loginForm.phone.slice(-1)) + 1,
            openid: `merchant_openid_${loginForm.phone.slice(-3)}`,
            nickname: testAccount.name,
            avatar: '',
            role: 'merchant_admin' as const,
            balance: 0,
            giftBalance: 0,
          },
        };
        
        authStore.setToken(mockLoginData.accessToken, mockLoginData.refreshToken);
        authStore.setUserInfo(mockLoginData.user);
        
        ElMessage.success(`欢迎 ${testAccount.name} 登录商户管理中心（演示模式）`);
        router.push('/dashboard');
      } else {
        ElMessage.error('手机号或密码错误，请使用测试账号登录');
      }
    }
  } catch (error) {
    console.error('登录失败:', error);
    ElMessage.error('登录失败，请重试');
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  // 页面加载时自动填充第一个测试账号
  fillTestAccount();
});
</script>

<style scoped>
.merchant-login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-box {
  width: 450px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  padding: 40px;
  max-height: 90vh;
  overflow-y: auto;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo-wrapper {
  margin-bottom: 20px;
}

.logo-icon {
  font-size: 48px;
  width: 80px;
  height: 80px;
  line-height: 80px;
  margin: 0 auto;
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  border-radius: 50%;
  color: white;
}

.login-header .login-title {
  font-size: 28px;
  font-weight: 700;
  color: #52c41a;
  margin-bottom: 8px;
}

.login-header .login-subtitle {
  font-size: 15px;
  color: #666;
}

.login-form .el-form-item {
  margin-bottom: 24px;
}

.login-btn {
  width: 100%;
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  border: none;
  font-weight: 600;
}

.quick-login-section {
  margin: 20px 0;
}

.quick-login-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 10px;
}

.demo-btn, .quick-btn {
  border-radius: 20px;
}

.section-title {
  margin: 15px 0;
}

.test-accounts {
  margin: 20px 0;
}

.test-account-list {
  max-height: 200px;
  overflow-y: auto;
}

.test-account-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
}

.test-account-item:hover {
  border-color: #52c41a;
  background-color: #f6ffed;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.15);
}

.account-info {
  flex: 1;
}

.account-index {
  font-size: 12px;
  color: #52c41a;
  font-weight: 600;
}

.account-info .account-name {
  font-weight: 500;
  color: #333;
  margin: 4px 0;
}

.account-info .account-phone {
  font-size: 12px;
  color: #999;
}

.login-footer {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.login-footer p {
  font-size: 12px;
  color: #999;
  margin: 5px 0;
}

.footer-note {
  color: #52c41a !important;
  font-weight: 500;
}

.external-links {
  margin-top: 10px;
  font-size: 12px;
}

.external-links a {
  color: #1890ff;
  text-decoration: none;
  margin: 0 8px;
}

.external-links a:hover {
  text-decoration: underline;
}

.external-links span {
  color: #d9d9d9;
  margin: 0 5px;
}

/* 滚动条样式 */
.test-account-list::-webkit-scrollbar,
.login-box::-webkit-scrollbar {
  width: 6px;
}

.test-account-list::-webkit-scrollbar-track,
.login-box::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.test-account-list::-webkit-scrollbar-thumb,
.login-box::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.test-account-list::-webkit-scrollbar-thumb:hover,
.login-box::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-box {
    width: 95%;
    padding: 30px 20px;
  }
  
  .test-account-item {
    padding: 10px 12px;
  }
  
  .account-info .account-name {
    font-size: 14px;
  }
}
</style>