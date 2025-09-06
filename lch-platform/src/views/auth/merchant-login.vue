<template>
  <div class="merchant-login-container">
    <div class="login-box">
      <div class="login-header">
        <h1 class="login-title">亮车惠</h1>
        <p class="login-subtitle">商户管理后台</p>
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
            placeholder="请输入手机号"
            prefix-icon="Phone"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            size="large"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            style="width: 100%"
            :loading="isLoading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="test-accounts">
        <el-divider>测试账号</el-divider>
        <div class="test-account-list">
          <div 
            v-for="account in testAccounts" 
            :key="account.phone"
            class="test-account-item"
            @click="fillAccount(account)"
          >
            <div class="account-info">
              <div class="account-name">{{ account.name }}</div>
              <div class="account-phone">{{ account.phone }}</div>
            </div>
            <el-button size="small" type="text">一键登录</el-button>
          </div>
        </div>
      </div>
      
      <div class="login-footer">
        <p>© 2024 亮车惠自助洗车系统. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

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
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
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

const handleLogin = async () => {
  if (!loginFormRef.value) return;
  
  try {
    await loginFormRef.value.validate();
    isLoading.value = true;
    
    // 检查是否是测试商户手机号
    const testAccount = testAccounts.find(acc => acc.phone === loginForm.phone);
    
    if (testAccount && loginForm.password === '123456') {
      // 模拟商户登录响应数据
      const mockLoginData = {
        accessToken: 'mock-merchant-token-' + Date.now(),
        refreshToken: 'mock-merchant-refresh-token-' + Date.now(),
        user: {
          id: parseInt(loginForm.phone.slice(-1)) + 1, // 根据手机号生成ID
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
      
      ElMessage.success(`欢迎 ${testAccount.name} 登录`);
      router.push('/merchant/dashboard');
    } else {
      ElMessage.error('手机号或密码错误，请使用测试账号登录');
    }
  } catch (error) {
    console.error('登录失败:', error);
    ElMessage.error('登录失败，请重试');
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.merchant-login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #52c41a 0%, #722ed1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-box {
  width: 450px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 40px;
  max-height: 90vh;
  overflow-y: auto;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-header .login-title {
  font-size: 32px;
  font-weight: 700;
  color: #52c41a;
  margin-bottom: 8px;
}

.login-header .login-subtitle {
  font-size: 16px;
  color: #666;
}

.login-form .el-form-item {
  margin-bottom: 24px;
}

.test-accounts {
  margin: 30px 0;
}

.test-account-list {
  max-height: 200px;
  overflow-y: auto;
}

.test-account-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.test-account-item:hover {
  border-color: #52c41a;
  background-color: #f6ffed;
}

.account-info .account-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.account-info .account-phone {
  font-size: 12px;
  color: #999;
}

.login-footer {
  text-align: center;
  margin-top: 30px;
}

.login-footer p {
  font-size: 12px;
  color: #999;
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
</style>