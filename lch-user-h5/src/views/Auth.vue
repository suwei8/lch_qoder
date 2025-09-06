<template>
  <div class="auth-container">
    <div class="auth-header">
      <div class="logo">
        <img src="/logo.svg" alt="亮车惠" class="logo-img" />
        <h1 class="app-title">{{ appTitle }}</h1>
      </div>
      <p class="subtitle">智能自助洗车，扫码即用</p>
    </div>

    <div class="auth-content">
      <!-- 微信授权登录 -->
      <div v-if="!showPhoneLogin && isWechatEnv" class="wechat-auth">
        <van-button 
          type="primary" 
          size="large" 
          class="auth-btn wechat-btn"
          :loading="isWechatLoading"
          @click="handleWechatAuth"
        >
          <van-icon name="wechat" />
          微信授权登录
        </van-button>
        
        <div class="divider">
          <span>或</span>
        </div>
        
        <van-button 
          type="default" 
          size="large" 
          class="auth-btn"
          @click="showPhoneLogin = true"
        >
          手机号登录
        </van-button>
        
        <!-- 测试用快捷登录 - 在微信登录界面也显示 -->
        <van-button 
          type="warning" 
          size="large" 
          class="auth-btn demo-btn"
          @click="handleDemoLogin"
        >
          🧪 演示数据
        </van-button>
      </div>

      <!-- 手机号密码登录 -->
      <div v-else class="phone-auth">
        <van-form @submit="handlePhoneLogin">
          <van-field
            v-model="phone"
            type="tel"
            label="手机号"
            placeholder="请输入手机号"
            :rules="phoneRules"
            maxlength="11"
          />
          
          <van-field
            v-model="password"
            type="password"
            label="密码"
            placeholder="请输入密码"
            :rules="passwordRules"
          />
          
          <div class="auth-actions">
            <van-button 
              type="primary" 
              size="large" 
              class="auth-btn"
              native-type="submit"
              :loading="isPhoneLoading"
              :disabled="!phone || !password"
              @click="handlePhoneLogin"
            >
              登录
            </van-button>
            
            <van-button 
              v-if="isWechatEnv"
              type="default" 
              size="large" 
              class="auth-btn"
              @click="showPhoneLogin = false"
            >
              返回微信登录
            </van-button>
                    
            <!-- 测试按钮 -->
            <van-button 
              type="default" 
              size="large" 
              class="auth-btn"
              @click="testLogin"
            >
              📝 测试登录
            </van-button>
            
            <!-- 测试用快捷登录 -->
            <van-button 
              type="warning" 
              size="large" 
              class="auth-btn demo-btn"
              @click="handleDemoLogin"
            >
              🧪 演示数据
            </van-button>
            
            <!-- 快速登录 -->
            <van-button 
              type="success" 
              size="large" 
              class="auth-btn quick-login-btn"
              @click="handleQuickDemoLogin"
              :loading="isWechatLoading"
            >
              ⚡ 快速登录
            </van-button>
          </div>
        </van-form>
      </div>
    </div>

    <div class="auth-footer">
      <p class="tips">登录即表示您同意</p>
      <p class="links">
        <span class="link">《用户协议》</span>
        和
        <span class="link">《隐私政策》</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { showFailToast, showSuccessToast } from 'vant'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 响应式数据
const appTitle = import.meta.env.VITE_APP_TITLE
const showPhoneLogin = ref(false)
const phone = ref('')
const password = ref('')
const isWechatLoading = ref(false)
const isPhoneLoading = ref(false)

// 计算属性
const isWechatEnv = computed(() => {
  return typeof window !== 'undefined' && 
         window.navigator.userAgent.includes('MicroMessenger')
})

const isPhoneValid = computed(() => {
  return /^1[3-9]\d{9}$/.test(phone.value)
})

// 表单验证规则
const phoneRules = [
  { required: true, message: '请输入手机号' },
  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
]

const passwordRules = [
  { required: true, message: '请输入密码' },
  { min: 6, message: '密码至少为6位' }
]

// 微信授权登录
const handleWechatAuth = () => {
  if (!isWechatEnv.value) {
    showFailToast('请在微信中打开')
    return
  }

  isWechatLoading.value = true
  
  // 构造微信授权URL
  const appId = import.meta.env.VITE_WECHAT_APP_ID
  const redirectUri = encodeURIComponent(window.location.href)
  const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_userinfo&state=wechat_login#wechat_redirect`
  
  window.location.href = authUrl
}

// 发送短信验证码（删除，不再需要）
// const sendSmsCode = async () => {
//   ...
// }

// 测试登录函数
const testLogin = () => {
  console.log('测试登录按钮被点击')
  console.log('当前手机号:', phone.value)
  console.log('当前密码:', password.value)
  showSuccessToast('测试登录按钮有效!')
}

// 演示登录（供测试使用）
const handleDemoLogin = async () => {
  console.log('演示登录按钮被点击 - 填充演示数据')
  
  // 切换到手机号登录界面
  showPhoneLogin.value = true
  
  // 填充演示手机号和密码
  phone.value = '13800138000'
  password.value = '123456'
  
  showSuccessToast('已填充演示登录信息')
}

// 快速演示登录（直接登录）
const handleQuickDemoLogin = async () => {
  console.log('快速演示登录按钮被点击')
  try {
    isWechatLoading.value = true
    console.log('开始快速演示登录流程')
    
    // 模拟登录数据
    const mockUser = {
      id: 1001,
      openid: 'demo-openid-001',
      nickname: '测试用户',
      avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
      phone: '13800138000',
      balance: 100.00,
      giftBalance: 50.00,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const mockToken = `mock-access-token-${Date.now()}`
    console.log('设置用户数据:', mockUser)
    console.log('设置Token:', mockToken)
    
    // 设置用户信息和 token
    userStore.setToken(mockToken)
    userStore.setUser(mockUser)
    
    console.log('用户状态更新完成')
    showSuccessToast('快速演示登录成功')
    
    // 登录成功后跳转
    const redirect = route.query.redirect as string || '/'
    console.log('准备跳转到:', redirect)
    router.push(redirect)
  } catch (error) {
    console.error('快速演示登录失败:', error)
    showFailToast('快速演示登录失败')
  } finally {
    isWechatLoading.value = false
  }
}

// 手机号密码登录
const handlePhoneLogin = async () => {
  console.log('登录按钮被点击')
  console.log('手机号:', phone.value)
  console.log('密码:', password.value)
  console.log('手机号验证结果:', isPhoneValid.value)
  
  if (!isPhoneValid.value || !password.value) {
    console.log('表单验证失败')
    showFailToast('请填写完整信息')
    return
  }

  try {
    console.log('开始登录流程')
    isPhoneLoading.value = true
    await userStore.phonePasswordLogin(phone.value, password.value)
    showSuccessToast('登录成功')
    
    // 登录成功后跳转
    const redirect = route.query.redirect as string || '/'
    console.log('登录成功，准备跳转到:', redirect)
    router.push(redirect)
  } catch (error) {
    console.error('手机号密码登录失败:', error)
    showFailToast('登录失败，请检查手机号和密码')
  } finally {
    isPhoneLoading.value = false
  }
}

// 处理微信回调
const handleWechatCallback = async () => {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const state = urlParams.get('state')
  
  if (code && state === 'wechat_login') {
    try {
      isWechatLoading.value = true
      await userStore.wechatLogin(code)
      showSuccessToast('登录成功')
      
      // 清除URL中的参数
      window.history.replaceState({}, document.title, window.location.pathname)
      
      // 跳转到目标页面
      const redirect = route.query.redirect as string || '/'
      router.push(redirect)
    } catch (error) {
      console.error('微信登录失败:', error)
      showFailToast('微信登录失败，请重试')
    } finally {
      isWechatLoading.value = false
    }
  }
}

onMounted(() => {
  // 检查是否有微信回调
  handleWechatCallback()
  
  // 如果不是微信环境，直接显示手机登录
  if (!isWechatEnv.value) {
    showPhoneLogin.value = true
  }
})
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.auth-header {
  text-align: center;
  padding: 60px 0 40px;
  color: white;
}

.logo {
  margin-bottom: 16px;
}

.logo-img {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.app-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
}

.subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin: 8px 0 0;
}

.auth-content {
  flex: 1;
  background: white;
  border-radius: 16px;
  padding: 32px 24px;
  margin-bottom: 20px;
}

.wechat-auth {
  text-align: center;
}

.auth-btn {
  width: 100%;
  height: 50px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.wechat-btn {
  background: #07c160;
  border-color: #07c160;
}

.wechat-btn .van-icon {
  margin-right: 8px;
}

.divider {
  position: relative;
  text-align: center;
  margin: 24px 0;
  color: #969799;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #eee;
}

.divider span {
  background: white;
  padding: 0 16px;
}

.phone-auth .van-field {
  margin-bottom: 16px;
}

.auth-actions {
  margin-top: 24px;
}

.auth-footer {
  text-align: center;
  color: white;
  opacity: 0.8;
  font-size: 12px;
}

.tips {
  margin: 0 0 4px;
}

.links {
  margin: 0;
}

.link {
  color: #fff;
  text-decoration: underline;
}

.demo-btn {
  background: #ff9500 !important;
  border-color: #ff9500 !important;
  color: white !important;
}

.quick-login-btn {
  background: #07c160 !important;
  border-color: #07c160 !important;
  color: white !important;
}
</style>