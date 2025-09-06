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
      </div>

      <!-- 手机号登录 -->
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
            v-model="smsCode"
            type="digit"
            label="验证码"
            placeholder="请输入验证码"
            :rules="codeRules"
            maxlength="6"
          >
            <template #button>
              <van-button 
                size="small" 
                type="primary" 
                :disabled="!isPhoneValid || countdown > 0"
                :loading="isSendingCode"
                @click="sendSmsCode"
              >
                {{ countdown > 0 ? `${countdown}s后重发` : '发送验证码' }}
              </van-button>
            </template>
          </van-field>
          
          <div class="auth-actions">
            <van-button 
              type="primary" 
              size="large" 
              class="auth-btn"
              native-type="submit"
              :loading="isPhoneLoading"
              :disabled="!phone || !smsCode"
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
import { authApi } from '@/api/auth'
import { Toast } from 'vant'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 响应式数据
const appTitle = import.meta.env.VITE_APP_TITLE
const showPhoneLogin = ref(false)
const phone = ref('')
const smsCode = ref('')
const countdown = ref(0)
const isWechatLoading = ref(false)
const isPhoneLoading = ref(false)
const isSendingCode = ref(false)

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

const codeRules = [
  { required: true, message: '请输入验证码' },
  { pattern: /^\d{6}$/, message: '请输入6位数字验证码' }
]

// 微信授权登录
const handleWechatAuth = () => {
  if (!isWechatEnv.value) {
    Toast.fail('请在微信中打开')
    return
  }

  isWechatLoading.value = true
  
  // 构造微信授权URL
  const appId = import.meta.env.VITE_WECHAT_APP_ID
  const redirectUri = encodeURIComponent(window.location.href)
  const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_userinfo&state=wechat_login#wechat_redirect`
  
  window.location.href = authUrl
}

// 发送短信验证码
const sendSmsCode = async () => {
  if (!isPhoneValid.value) {
    Toast.fail('请输入正确的手机号')
    return
  }

  try {
    isSendingCode.value = true
    await authApi.sendSmsCode({ phone: phone.value, type: 'login' })
    Toast.success('验证码已发送')
    
    // 开始倒计时
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error) {
    console.error('发送验证码失败:', error)
  } finally {
    isSendingCode.value = false
  }
}

// 手机号登录
const handlePhoneLogin = async () => {
  if (!isPhoneValid.value || !smsCode.value) {
    Toast.fail('请填写完整信息')
    return
  }

  try {
    isPhoneLoading.value = true
    await userStore.phoneLogin(phone.value, smsCode.value)
    Toast.success('登录成功')
    
    // 登录成功后跳转
    const redirect = route.query.redirect as string || '/'
    router.push(redirect)
  } catch (error) {
    console.error('手机登录失败:', error)
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
      Toast.success('登录成功')
      
      // 清除URL中的参数
      window.history.replaceState({}, document.title, window.location.pathname)
      
      // 跳转到目标页面
      const redirect = route.query.redirect as string || '/'
      router.push(redirect)
    } catch (error) {
      console.error('微信登录失败:', error)
      Toast.fail('微信登录失败，请重试')
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
</style>