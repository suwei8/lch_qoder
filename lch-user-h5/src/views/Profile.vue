<template>
  <div class="profile-container">
    <!-- 顶部导航 -->
    <div class="header">
      <van-button 
        type="default" 
        size="small" 
        icon="shop-o"
        class="header-btn"
        @click="goToStores"
      >
        多门店
      </van-button>
      <h1 class="page-title">会员中心</h1>
      <van-button 
        type="default" 
        size="small" 
        icon="setting-o"
        class="header-btn"
        @click="goToSettings"
      >
        设置
      </van-button>
    </div>

    <!-- 用户信息卡片 -->
    <div class="user-card">
      <div class="user-info">
        <div class="user-avatar">
          <van-image
            width="64"
            height="64"
            round
            :src="userInfo?.avatar || 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'"
            alt="用户头像"
          />
        </div>
        <div class="user-details">
          <div class="user-name">{{ userInfo?.nickname || '智能洗车用户' }}</div>
          <div class="user-id">ID：{{ userInfo?.id || '1001' }}</div>
        </div>
      </div>
      
      <!-- 余额信息 -->
      <div class="balance-section">
        <div class="balance-item">
          <div class="balance-value">¥{{ userInfo?.balance?.toFixed(2) || '0.00' }}</div>
          <div class="balance-label">账户余额</div>
        </div>
        <div class="balance-divider"></div>
        <div class="balance-item">
          <div class="balance-value">¥{{ userInfo?.giftBalance?.toFixed(2) || '0.00' }}</div>
          <div class="balance-label">赠送金额</div>
        </div>
        <div class="balance-divider"></div>
        <div class="balance-item">
          <div class="balance-value">不限期</div>
          <div class="balance-label">有效期</div>
        </div>
      </div>
    </div>

    <!-- 温馨提醒 -->
    <div class="notice-section">
      <van-notice-bar
        color="#ff8f00"
        background="linear-gradient(90deg, #fff3e0 0%, #ffe0b2 100%)"
        left-icon="volume-o"
        text="余额不足时将自动使用赠送金额，建议及时充值享受更优惠的服务"
        :scrollable="false"
      />
    </div>

    <!-- 功能服务区 -->
    <div class="services-section">
      <h2 class="section-title">我的服务</h2>
      <div class="services-grid">
        <div 
          v-for="item in functionItems" 
          :key="item.id"
          class="service-item"
          @click="handleFunctionClick(item)"
        >
          <div class="service-icon" :class="item.iconClass">
            <van-icon :name="item.icon" />
          </div>
          <span class="service-name">{{ item.name }}</span>
        </div>
      </div>
    </div>



    <!-- 退出登录 -->
    <div class="logout-section" v-if="isLoggedIn">
      <van-button 
        type="danger" 
        block 
        @click="handleLogout"
        class="logout-btn"
      >
        退出登录
      </van-button>
    </div>

    <!-- 底部安全区域 -->
    <div class="bottom-safe-area"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showDialog, showSuccessToast, showToast } from 'vant'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 计算属性
const isLoggedIn = computed(() => userStore.isAuthenticated)
const userInfo = computed(() => userStore.user)

// 功能菜单配置（2x4网格）
const functionItems = ref([
  {
    id: 1,
    name: '充值有礼',
    icon: 'gift-o',
    iconClass: 'recharge-gift',
    route: '/recharge-gift'
  },
  {
    id: 2,
    name: '余额流水',
    icon: 'bill-o',
    iconClass: 'balance-flow',
    route: '/balance-flow'
  },
  {
    id: 3,
    name: '消费记录',
    icon: 'records',
    iconClass: 'consumption-record',
    route: '/consumption-records'
  },
  {
    id: 4,
    name: '充值记录',
    icon: 'credit-pay',
    iconClass: 'recharge-record',
    route: '/recharge-records'
  },
  {
    id: 6,
    name: '推荐充值',
    icon: 'friends-o',
    iconClass: 'recommend-recharge',
    route: '/recommend-recharge'
  },
  {
    id: 7,
    name: '远程结算',
    icon: 'balance-pay',
    iconClass: 'remote-settlement',
    route: '/remote-settlement'
  },
  {
    id: 8,
    name: '远程启动',
    icon: 'play-circle-o',
    iconClass: 'remote-start',
    route: '/remote-start'
  },
  {
    id: 9,
    name: '故障投诉',
    icon: 'warning-o',
    iconClass: 'fault-complaint',
    route: '/complaint'
  }
])

// 跳转到门店列表
const goToStores = () => {
  router.push('/stores')
}

// 跳转到设置页
const goToSettings = () => {
  router.push('/settings')
}

// 处理功能点击
const handleFunctionClick = (item: any) => {
  if (item.route) {
    router.push(item.route)
  } else {
    showToast(`${item.name}功能开发中`)
  }
}



// 退出登录
const handleLogout = async () => {
  const result = await showDialog({
    title: '确认退出',
    message: '确定要退出登录吗？',
    confirmButtonText: '确认退出',
    cancelButtonText: '取消'
  })

  if (result !== 'confirm') return

  try {
    await userStore.logout()
    showSuccessToast('已退出登录')
    router.push('/home')
  } catch (error) {
    console.error('退出登录失败:', error)
  }
}

// 组件挂载
onMounted(async () => {
  console.log('Profile页面加载，当前用户状态:', {
    isLoggedIn: isLoggedIn.value,
    userInfo: userInfo.value
  })
  console.log('功能菜单项数量:', functionItems.value.length)
  console.log('功能菜单项:', functionItems.value.map(item => item.name))
  
  // 检查认证状态
  const isAuth = await userStore.checkAuthStatus()
  
  // 如果未登录，尝试使用演示账号登录
  if (!isAuth) {
    try {
      console.log('用户未登录，尝试自动登录演示账号...')
      await userStore.phonePasswordLogin('13800138000', '123456')
      console.log('自动登录演示账号成功，用户信息:', userStore.user)
    } catch (error) {
      console.error('自动登录失败:', error)
    }
  } else {
    console.log('用户已登录，刷新用户信息...')
    // 如果已登录，刷新用户信息
    await userStore.refreshUserInfo()
    console.log('用户信息刷新完成:', userStore.user)
  }
})
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  overflow-y: auto;
  padding-bottom: 80px; /* 减少底部内边距 */
}

/* 顶部导航 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  padding-top: calc(12px + env(safe-area-inset-top, 12px));
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
  min-height: 56px;
}

.header-btn {
  background: #f7f8fa;
  border: 1px solid #ebedf0;
  color: #646566;
  border-radius: 16px;
  height: 32px;
  font-size: 12px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin: 0;
}

/* 用户信息卡片 */
.user-card {
  margin: 16px;
  background: linear-gradient(135deg, #1989fa 0%, #1c7cd6 100%);
  border-radius: 16px;
  padding: 24px;
  color: white;
  box-shadow: 0 8px 24px rgba(25, 137, 250, 0.3);
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.user-avatar {
  margin-right: 16px;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.user-id {
  font-size: 14px;
  opacity: 0.9;
}

.balance-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
}

.balance-item {
  text-align: center;
  flex: 1;
}

.balance-value {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.balance-label {
  font-size: 12px;
  opacity: 0.8;
}

.balance-divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 16px;
}

/* 温馨提醒 */
.notice-section {
  margin: 16px;
}

/* 功能服务区 */
.services-section {
  padding: 0 16px 24px;
  width: 100%;
  overflow: visible;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 16px 0;
}

.services-grid {
  display: flex;
  overflow-x: auto;
  gap: 16px;
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  scrollbar-width: none;
  -ms-overflow-style: none;
  width: 100%;
  box-sizing: border-box;
}

.services-grid::-webkit-scrollbar {
  display: none;
}

.service-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  transition: transform 0.2s ease;
  cursor: pointer;
  min-width: 70px;
  max-width: 80px;
  flex-shrink: 0;
  text-align: center;
}

.service-item:active {
  transform: scale(0.95);
}

.service-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  margin-bottom: 8px;
  color: white;
  font-size: 20px;
}

/* 服务图标颜色 */
.service-icon.recharge-gift {
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
}

.service-icon.balance-flow {
  background: linear-gradient(135deg, #4ecdc4, #44a08d);
}

.service-icon.consumption-record {
  background: linear-gradient(135deg, #45b7d1, #96c93d);
}

.service-icon.recharge-record {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}



.service-icon.recommend-recharge {
  background: linear-gradient(135deg, #43e97b, #38f9d7);
}

.service-icon.remote-settlement {
  background: linear-gradient(135deg, #fa709a, #fee140);
}

.service-icon.remote-start {
  background: linear-gradient(135deg, #a8edea, #fed6e3);
}

.service-icon.fault-complaint {
  background: linear-gradient(135deg, #ffecd2, #fcb69f);
}

.service-icon.remote-settlement {
  background: linear-gradient(135deg, #fa709a, #fee140);
}

.service-icon.remote-start {
  background: linear-gradient(135deg, #a8edea, #fed6e3);
}

.service-icon.fault-complaint {
  background: linear-gradient(135deg, #ffecd2, #fcb69f);
}

.service-name {
  font-size: 11px;
  color: #646566;
  text-align: center;
  font-weight: 500;
  line-height: 1.2;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}



/* 退出登录 */
.logout-section {
  margin: 0 16px 16px; /* 减少底部外边距 */
}

.logout-btn {
  border-radius: 12px;
  height: 48px;
  background: white;
  color: #ee0a24;
  border: 1px solid #ebedf0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 底部安全区域 */
.bottom-safe-area {
  height: 20px; /* 大幅减少底部安全区域高度 */
  padding-bottom: env(safe-area-inset-bottom);
}

/* 响应式适配 */
@media (max-width: 375px) {
  .balance-section {
    flex-direction: column;
    gap: 16px;
  }
  
  .balance-divider {
    width: 100%;
    height: 1px;
    margin: 0;
  }
  
  .services-grid {
    gap: 12px;
    padding: 16px;
  }
  
  .service-item {
    padding: 12px 8px;
    min-width: 70px;
  }
  
  .service-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
  
  .service-name {
    font-size: 11px;
  }
}
</style>